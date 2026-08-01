/**
 * Mapowanie wiersz bazy → model domenowy.
 *
 * To JEDYNE miejsce, które zna kształt tabel. Nigdy nie przekazuj surowego
 * wiersza wyżej — inaczej kształt bazy przecieka do UI i migracja na inną bazę
 * przestaje być zmianą jednego katalogu.
 */
import type {
  ContestStatus,
  EventKind,
  IdeaKind,
  IdeaPriority,
  IdeaStatus,
  Locale,
  Platform,
  PublicationStatus,
} from '@/domain/enums'
import type {
  Athlete,
  AthleteCheck,
  Channel,
  Contest,
  HealthCheck,
  Idea,
  PostType,
  Publication,
  Recording,
  RecordingStage,
  SportEvent,
} from '@/domain/models'
import type { Database } from '@/lib/database.types'

type Tables = Database['ggsm']['Tables']

export function toHealthCheck(row: Tables['app_health']['Row']): HealthCheck {
  return {
    id: row.id,
    label: row.label,
    checkedAt: row.checked_at,
  }
}

export function toChannel(row: Tables['channels']['Row']): Channel {
  return {
    id: row.id,
    code: row.code,
    name: row.name,
    // Baza pilnuje wartości przez `check` — typy generowane oddają je jako
    // `string`, więc zawężamy tutaj, w jednym miejscu.
    platform: row.platform as Platform,
    locale: (row.locale as Locale | null) ?? null,
    sortOrder: row.sort_order,
    isActive: row.is_active,
    reminderAfterDays: row.reminder_after_days,
  }
}

export function toPostType(row: Tables['post_types']['Row']): PostType {
  return {
    id: row.id,
    code: row.code,
    name: row.name,
    color: row.color,
    sortOrder: row.sort_order,
    isActive: row.is_active,
  }
}

export function toPublication(row: Tables['publications']['Row']): Publication {
  return {
    id: row.id,
    publishOn: row.publish_on,
    channelId: row.channel_id,
    postTypeId: row.post_type_id,
    status: row.status as PublicationStatus,
    title: row.title,
    note: row.note,
    url: row.url,
    eventId: row.event_id,
    contestId: row.contest_id,
  }
}

export function toSportEvent(row: Tables['events']['Row']): SportEvent {
  return {
    id: row.id,
    name: row.name,
    kind: row.kind as EventKind,
    startsOn: row.starts_on,
    endsOn: row.ends_on,
    place: row.place,
    isSponsored: row.is_sponsored,
    url: row.url,
    note: row.note,
    promoLeadDays: row.promo_lead_days,
  }
}

export function toContest(row: Tables['contests']['Row']): Contest {
  return {
    id: row.id,
    name: row.name,
    channelId: row.channel_id,
    startsOn: row.starts_on,
    endsOn: row.ends_on,
    prize: row.prize,
    status: row.status as ContestStatus,
    winnerName: row.winner_name,
    winnerContact: row.winner_contact,
    winnerAddress: row.winner_address,
    trackingCode: row.tracking_code,
    url: row.url,
    note: row.note,
  }
}

export function toAthlete(row: Tables['athletes']['Row']): Athlete {
  return {
    id: row.id,
    name: row.name,
    disciplines: row.disciplines,
    instagramUrl: row.instagram_url,
    facebookUrl: row.facebook_url,
    checkEveryDays: row.check_every_days,
    isActive: row.is_active,
    isStarred: row.is_starred,
    note: row.note,
  }
}

export function toAthleteCheck(row: Tables['athlete_checks']['Row']): AthleteCheck {
  return {
    id: row.id,
    athleteId: row.athlete_id,
    checkedOn: row.checked_on,
    note: row.note,
  }
}

export function toIdea(row: Tables['ideas']['Row']): Idea {
  return {
    id: row.id,
    title: row.title,
    detail: row.detail,
    kind: row.kind as IdeaKind,
    status: row.status as IdeaStatus,
    priority: row.priority as IdeaPriority,
  }
}

export function toRecordingStage(row: Tables['recording_stages']['Row']): RecordingStage {
  return {
    id: row.id,
    name: row.name,
    color: row.color,
    sortOrder: row.sort_order,
    isActive: row.is_active,
  }
}

export function toRecording(row: Tables['recordings']['Row']): Recording {
  return {
    id: row.id,
    title: row.title,
    referenceUrl: row.reference_url,
    idea: row.idea,
    athleteId: row.athlete_id,
    stageId: row.stage_id,
    note: row.note,
    isDone: row.is_done,
  }
}
