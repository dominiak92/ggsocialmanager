/**
 * Mapowanie wiersz bazy → model domenowy.
 *
 * To JEDYNE miejsce, które zna kształt tabel. Nigdy nie przekazuj surowego
 * wiersza wyżej — inaczej kształt bazy przecieka do UI i migracja na inną bazę
 * przestaje być zmianą jednego katalogu.
 */
import type { HealthCheck } from '@/domain/models'
import type { Database } from '@/lib/database.types'

type AppHealthRow = Database['ggsm']['Tables']['app_health']['Row']

export function toHealthCheck(row: AppHealthRow): HealthCheck {
  return {
    id: row.id,
    label: row.label,
    checkedAt: row.checked_at,
  }
}
