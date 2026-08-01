/**
 * Implementacja kontraktów z `data/interfaces` na Supabase.
 *
 * To JEDYNY katalog w projekcie, który importuje klienta Supabase.
 * Jeśli piszesz `from '@/lib/supabase'` gdziekolwiek indziej — robisz to źle.
 */
import type {
  ChannelRepo,
  DataProvider,
  HealthRepo,
  PostTypeRepo,
  PublicationRepo,
} from '@/data/interfaces'
import { toChannel, toHealthCheck, toPostType, toPublication } from '@/data/supabase/mappers'
import type { PublicationDraft, PublicationPatch } from '@/domain/models'
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

  async setActive(id, isActive) {
    const { error } = await supabase.from('channels').update({ is_active: isActive }).eq('id', id)

    if (error) fail('Nie udało się zmienić kanału', error.message)
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
