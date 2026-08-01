/**
 * Implementacja kontraktów z `data/interfaces` na Supabase.
 *
 * To JEDYNY katalog w projekcie, który importuje klienta Supabase.
 * Jeśli piszesz `from '@/lib/supabase'` gdziekolwiek indziej — robisz to źle.
 */
import {
  ChannelInUseError,
  type AthleteRepo,
  type ChannelRepo,
  type ContestRepo,
  type DataProvider,
  type EventRepo,
  type HealthRepo,
  type IdeaRepo,
  type PostTypeRepo,
  type PublicationRepo,
} from '@/data/interfaces'
import {
  toAthlete,
  toAthleteCheck,
  toChannel,
  toContest,
  toHealthCheck,
  toIdea,
  toPostType,
  toPublication,
  toSportEvent,
} from '@/data/supabase/mappers'
import type { Platform } from '@/domain/enums'
import type {
  AthletePatch,
  ContestPatch,
  IdeaPatch,
  PublicationDraft,
  PublicationPatch,
  SportEventPatch,
} from '@/domain/models'
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
    ...(patch.eventId === undefined ? {} : { event_id: patch.eventId }),
    ...(patch.contestId === undefined ? {} : { contest_id: patch.contestId }),
  }
}

/**
 * Mapowania domena → wiersz. Rozpisane jawnie pole po polu, a nie generycznie
 * przez zamianę camelCase na snake_case: literówka w nazwie kolumny ma paść
 * na typach, a nie po cichu wysłać nieistniejące pole do bazy.
 */
function eventRow(patch: SportEventPatch) {
  return {
    ...(patch.name === undefined ? {} : { name: patch.name }),
    ...(patch.kind === undefined ? {} : { kind: patch.kind }),
    ...(patch.startsOn === undefined ? {} : { starts_on: patch.startsOn }),
    ...(patch.endsOn === undefined ? {} : { ends_on: patch.endsOn }),
    ...(patch.place === undefined ? {} : { place: patch.place }),
    ...(patch.isSponsored === undefined ? {} : { is_sponsored: patch.isSponsored }),
    ...(patch.url === undefined ? {} : { url: patch.url }),
    ...(patch.note === undefined ? {} : { note: patch.note }),
    ...(patch.promoLeadDays === undefined ? {} : { promo_lead_days: patch.promoLeadDays }),
  }
}

function contestRow(patch: ContestPatch) {
  return {
    ...(patch.name === undefined ? {} : { name: patch.name }),
    ...(patch.channelId === undefined ? {} : { channel_id: patch.channelId }),
    ...(patch.startsOn === undefined ? {} : { starts_on: patch.startsOn }),
    ...(patch.endsOn === undefined ? {} : { ends_on: patch.endsOn }),
    ...(patch.prize === undefined ? {} : { prize: patch.prize }),
    ...(patch.status === undefined ? {} : { status: patch.status }),
    ...(patch.winnerName === undefined ? {} : { winner_name: patch.winnerName }),
    ...(patch.winnerContact === undefined ? {} : { winner_contact: patch.winnerContact }),
    ...(patch.winnerAddress === undefined ? {} : { winner_address: patch.winnerAddress }),
    ...(patch.trackingCode === undefined ? {} : { tracking_code: patch.trackingCode }),
    ...(patch.url === undefined ? {} : { url: patch.url }),
    ...(patch.note === undefined ? {} : { note: patch.note }),
  }
}

function athleteRow(patch: AthletePatch) {
  return {
    ...(patch.name === undefined ? {} : { name: patch.name }),
    ...(patch.disciplines === undefined ? {} : { disciplines: patch.disciplines }),
    ...(patch.instagramUrl === undefined ? {} : { instagram_url: patch.instagramUrl }),
    ...(patch.facebookUrl === undefined ? {} : { facebook_url: patch.facebookUrl }),
    ...(patch.checkEveryDays === undefined ? {} : { check_every_days: patch.checkEveryDays }),
    ...(patch.isActive === undefined ? {} : { is_active: patch.isActive }),
    ...(patch.isStarred === undefined ? {} : { is_starred: patch.isStarred }),
    ...(patch.note === undefined ? {} : { note: patch.note }),
  }
}

function ideaRow(patch: IdeaPatch) {
  return {
    ...(patch.title === undefined ? {} : { title: patch.title }),
    ...(patch.detail === undefined ? {} : { detail: patch.detail }),
    ...(patch.kind === undefined ? {} : { kind: patch.kind }),
    ...(patch.status === undefined ? {} : { status: patch.status }),
    ...(patch.priority === undefined ? {} : { priority: patch.priority }),
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

  async listLinked() {
    const { data, error } = await supabase
      .from('publications')
      .select('*')
      .or('event_id.not.is.null,contest_id.not.is.null')

    if (error) fail('Nie udało się pobrać nagłośnienia', error.message)

    return (data ?? []).map(toPublication)
  },

  async create(draft: PublicationDraft) {
    const [created] = await publications.createMany([draft])
    if (!created) fail('Nie udało się dodać wpisu', 'baza nie zwróciła wiersza')
    return created
  },

  async createMany(drafts: PublicationDraft[]) {
    if (drafts.length === 0) return []

    const { data, error } = await supabase
      .from('publications')
      .insert(
        drafts.map((draft) => ({
          publish_on: draft.publishOn,
          channel_id: draft.channelId,
          post_type_id: draft.postTypeId ?? null,
          status: draft.status ?? 'planned',
          title: draft.title ?? '',
          note: draft.note ?? '',
          url: draft.url ?? '',
          event_id: draft.eventId ?? null,
          contest_id: draft.contestId ?? null,
        })),
      )
      .select('*')

    if (error) fail('Nie udało się dodać wpisów', error.message)

    return (data ?? []).map(toPublication)
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

const events: EventRepo = {
  async list() {
    const { data, error } = await supabase
      .from('events')
      .select('*')
      .order('starts_on', { ascending: true })

    if (error) fail('Nie udało się pobrać eventów', error.message)

    return (data ?? []).map(toSportEvent)
  },

  async create(draft) {
    const { data, error } = await supabase
      .from('events')
      .insert({ ...eventRow(draft), name: draft.name, starts_on: draft.startsOn })
      .select('*')
      .single()

    if (error) fail('Nie udało się dodać eventu', error.message)

    return toSportEvent(data)
  },

  async update(id, patch) {
    const { data, error } = await supabase
      .from('events')
      .update(eventRow(patch))
      .eq('id', id)
      .select('*')
      .single()

    if (error) fail('Nie udało się zapisać eventu', error.message)

    return toSportEvent(data)
  },

  async remove(id) {
    const { error } = await supabase.from('events').delete().eq('id', id)

    if (error) fail('Nie udało się usunąć eventu', error.message)
  },
}

const contests: ContestRepo = {
  async list() {
    const { data, error } = await supabase
      .from('contests')
      .select('*')
      .order('ends_on', { ascending: false })

    if (error) fail('Nie udało się pobrać konkursów', error.message)

    return (data ?? []).map(toContest)
  },

  async create(draft) {
    const { data, error } = await supabase
      .from('contests')
      .insert({
        ...contestRow(draft),
        name: draft.name,
        starts_on: draft.startsOn,
        ends_on: draft.endsOn,
      })
      .select('*')
      .single()

    if (error) fail('Nie udało się dodać konkursu', error.message)

    return toContest(data)
  },

  async update(id, patch) {
    const { data, error } = await supabase
      .from('contests')
      .update(contestRow(patch))
      .eq('id', id)
      .select('*')
      .single()

    if (error) fail('Nie udało się zapisać konkursu', error.message)

    return toContest(data)
  },

  async remove(id) {
    const { error } = await supabase.from('contests').delete().eq('id', id)

    if (error) fail('Nie udało się usunąć konkursu', error.message)
  },
}

const athletes: AthleteRepo = {
  async list() {
    const { data, error } = await supabase.from('athletes').select('*').order('name')

    if (error) fail('Nie udało się pobrać zawodników', error.message)

    return (data ?? []).map(toAthlete)
  },

  async create(draft) {
    const { data, error } = await supabase
      .from('athletes')
      .insert({ ...athleteRow(draft), name: draft.name })
      .select('*')
      .single()

    if (error) fail('Nie udało się dodać zawodnika', error.message)

    return toAthlete(data)
  },

  async update(id, patch) {
    const { data, error } = await supabase
      .from('athletes')
      .update(athleteRow(patch))
      .eq('id', id)
      .select('*')
      .single()

    if (error) fail('Nie udało się zapisać zawodnika', error.message)

    return toAthlete(data)
  },

  async remove(id) {
    const { error } = await supabase.from('athletes').delete().eq('id', id)

    if (error) fail('Nie udało się usunąć zawodnika', error.message)
  },

  async lastCheckPerAthlete() {
    const { data, error } = await supabase
      .from('athlete_checks')
      .select('athlete_id, checked_on')
      .order('checked_on', { ascending: false })

    if (error) fail('Nie udało się pobrać przeglądów', error.message)

    // Posortowane malejąco — pierwszy trafiony wpis dla zawodnika jest najnowszy.
    const latest = new Map<string, string>()
    for (const row of data ?? []) {
      if (!latest.has(row.athlete_id)) latest.set(row.athlete_id, row.checked_on)
    }
    return latest
  },

  async listChecks(athleteId) {
    const { data, error } = await supabase
      .from('athlete_checks')
      .select('*')
      .eq('athlete_id', athleteId)
      .order('checked_on', { ascending: false })
      .limit(50)

    if (error) fail('Nie udało się pobrać historii przeglądów', error.message)

    return (data ?? []).map(toAthleteCheck)
  },

  async addCheck(athleteId, checkedOn, note) {
    const { data, error } = await supabase
      .from('athlete_checks')
      .insert({ athlete_id: athleteId, checked_on: checkedOn, note })
      .select('*')
      .single()

    if (error) fail('Nie udało się zapisać przeglądu', error.message)

    return toAthleteCheck(data)
  },

  async removeCheck(id) {
    const { error } = await supabase.from('athlete_checks').delete().eq('id', id)

    if (error) fail('Nie udało się usunąć przeglądu', error.message)
  },
}

const ideas: IdeaRepo = {
  async list() {
    const { data, error } = await supabase
      .from('ideas')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) fail('Nie udało się pobrać pomysłów', error.message)

    return (data ?? []).map(toIdea)
  },

  async create(draft) {
    const { data, error } = await supabase
      .from('ideas')
      .insert({ ...ideaRow(draft), title: draft.title })
      .select('*')
      .single()

    if (error) fail('Nie udało się dodać pomysłu', error.message)

    return toIdea(data)
  },

  async update(id, patch) {
    const { data, error } = await supabase
      .from('ideas')
      .update(ideaRow(patch))
      .eq('id', id)
      .select('*')
      .single()

    if (error) fail('Nie udało się zapisać pomysłu', error.message)

    return toIdea(data)
  },

  async remove(id) {
    const { error } = await supabase.from('ideas').delete().eq('id', id)

    if (error) fail('Nie udało się usunąć pomysłu', error.message)
  },
}

export function createSupabaseDataProvider(): DataProvider {
  return { health, channels, postTypes, publications, events, contests, athletes, ideas }
}
