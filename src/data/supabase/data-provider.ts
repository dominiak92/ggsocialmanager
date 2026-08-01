/**
 * Implementacja kontraktów z `data/interfaces` na Supabase.
 *
 * To JEDYNY katalog w projekcie, który importuje klienta Supabase.
 * Jeśli piszesz `from '@/lib/supabase'` gdziekolwiek indziej — robisz to źle.
 */
import {
  ChannelInUseError,
  type ChannelRepo,
  type DataProvider,
  type HealthRepo,
  type PostTypeRepo,
  type PublicationRepo,
} from '@/data/interfaces'
import { toChannel, toHealthCheck, toPostType, toPublication } from '@/data/supabase/mappers'
import type { Platform } from '@/domain/enums'
import type { PublicationDraft, PublicationPatch } from '@/domain/models'
import { slugify } from '@/lib/slug'
import { supabase } from '@/lib/supabase'

/** Jednolity komunikat błędu — bez tego każdy błąd wygląda inaczej w UI. */
function fail(what: string, message: string): never {
  throw new Error(`${what}: ${message}`)
}

const health: HealthRepo = {
  async get() {
    const { data, error } = await supabase
      .from('app_health')
      .select('id, label, checked_at')
      .order('checked_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (error) fail('Nie udało się odczytać sondy połączenia', error.message)

    return data ? toHealthCheck(data) : null
  },
}

/** Kolejność sekcji w siatce — nowy kanał ląduje na końcu swojej platformy. */
const PLATFORM_SORT_BASE: Record<Platform, number> = {
  facebook_group: 10,
  facebook_page: 20,
  instagram: 30,
  tiktok: 40,
  youtube: 50,
  newsletter: 60,
  web: 70,
}

const channels: ChannelRepo = {
  async list() {
    const { data, error } = await supabase
      .from('channels')
      .select('*')
      .order('sort_order', { ascending: true })
      .order('name', { ascending: true })

    if (error) fail('Nie udało się pobrać kanałów', error.message)

    return (data ?? []).map(toChannel)
  },

  async create(draft) {
    const { data, error } = await supabase
      .from('channels')
      .insert({
        code: slugify(draft.name) || `kanal-${Date.now().toString(36)}`,
        name: draft.name,
        platform: draft.platform,
        locale: draft.locale,
        reminder_after_days: draft.reminderAfterDays,
        // +9 trzyma nowy kanał w obrębie swojej sekcji, ale za tymi z seedu.
        sort_order: PLATFORM_SORT_BASE[draft.platform] + 9,
      })
      .select('*')
      .single()

    // 23505 = naruszenie unikatu na `code`, czyli nazwa daje istniejący slug.
    if (error?.code === '23505') {
      fail('Nie udało się dodać kanału', 'Kanał o tak podobnej nazwie już istnieje.')
    }
    if (error) fail('Nie udało się dodać kanału', error.message)

    return toChannel(data)
  },

  async update(id, patch) {
    const { data, error } = await supabase
      .from('channels')
      .update({
        ...(patch.name === undefined ? {} : { name: patch.name }),
        ...(patch.platform === undefined ? {} : { platform: patch.platform }),
        ...(patch.locale === undefined ? {} : { locale: patch.locale }),
        ...(patch.isActive === undefined ? {} : { is_active: patch.isActive }),
        ...(patch.reminderAfterDays === undefined
          ? {}
          : { reminder_after_days: patch.reminderAfterDays }),
      })
      .eq('id', id)
      .select('*')
      .single()

    if (error) fail('Nie udało się zapisać kanału', error.message)

    return toChannel(data)
  },

  async remove(id) {
    const { error } = await supabase.from('channels').delete().eq('id', id)

    // 23503 = klucz obcy z `publications`. Baza celowo tego broni.
    if (error?.code === '23503') throw new ChannelInUseError()
    if (error) fail('Nie udało się usunąć kanału', error.message)
  },
}

const postTypes: PostTypeRepo = {
  async list() {
    const { data, error } = await supabase
      .from('post_types')
      .select('*')
      .eq('is_active', true)
      .order('sort_order', { ascending: true })

    if (error) fail('Nie udało się pobrać rodzajów postów', error.message)

    return (data ?? []).map(toPostType)
  },
}

/** Domena → wiersz. Pola nieustawione zostawiamy bazie (ma defaulty). */
function publicationRow(patch: PublicationPatch) {
  return {
    ...(patch.publishOn === undefined ? {} : { publish_on: patch.publishOn }),
    ...(patch.channelId === undefined ? {} : { channel_id: patch.channelId }),
    ...(patch.postTypeId === undefined ? {} : { post_type_id: patch.postTypeId }),
    ...(patch.status === undefined ? {} : { status: patch.status }),
    ...(patch.title === undefined ? {} : { title: patch.title }),
    ...(patch.note === undefined ? {} : { note: patch.note }),
    ...(patch.url === undefined ? {} : { url: patch.url }),
  }
}

const publications: PublicationRepo = {
  async listRange({ from, to }) {
    const { data, error } = await supabase
      .from('publications')
      .select('*')
      .gte('publish_on', from)
      .lte('publish_on', to)
      .order('publish_on', { ascending: true })

    if (error) fail('Nie udało się pobrać kalendarza', error.message)

    return (data ?? []).map(toPublication)
  },

  async lastPublishedPerChannel(since) {
    const { data, error } = await supabase
      .from('publications')
      .select('channel_id, publish_on')
      .eq('status', 'published')
      .gte('publish_on', since)
      .order('publish_on', { ascending: false })

    if (error) fail('Nie udało się sprawdzić ciszy na kanałach', error.message)

    // Posortowane malejąco, więc pierwszy trafiony wpis dla kanału jest
    // najnowszy — kolejne pomijamy.
    const latest = new Map<string, string>()
    for (const row of data ?? []) {
      if (!latest.has(row.channel_id)) latest.set(row.channel_id, row.publish_on)
    }
    return latest
  },

  async create(draft: PublicationDraft) {
    const { data, error } = await supabase
      .from('publications')
      .insert({
        publish_on: draft.publishOn,
        channel_id: draft.channelId,
        post_type_id: draft.postTypeId ?? null,
        status: draft.status ?? 'planned',
        title: draft.title ?? '',
        note: draft.note ?? '',
        url: draft.url ?? '',
      })
      .select('*')
      .single()

    if (error) fail('Nie udało się dodać wpisu', error.message)

    return toPublication(data)
  },

  async update(id, patch) {
    const { data, error } = await supabase
      .from('publications')
      .update(publicationRow(patch))
      .eq('id', id)
      .select('*')
      .single()

    if (error) fail('Nie udało się zapisać wpisu', error.message)

    return toPublication(data)
  },

  async remove(id) {
    const { error } = await supabase.from('publications').delete().eq('id', id)

    if (error) fail('Nie udało się usunąć wpisu', error.message)
  },
}

export function createSupabaseDataProvider(): DataProvider {
  return { health, channels, postTypes, publications }
}
