/**
 * Mapowanie wiersz bazy → model domenowy.
 *
 * To JEDYNE miejsce, które zna kształt tabel. Nigdy nie przekazuj surowego
 * wiersza wyżej — inaczej kształt bazy przecieka do UI i migracja na inną bazę
 * przestaje być zmianą jednego katalogu.
 */
import type { Locale, Platform, PublicationStatus } from '@/domain/enums'
import type { Channel, HealthCheck, PostType, Publication } from '@/domain/models'
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
  }
}
