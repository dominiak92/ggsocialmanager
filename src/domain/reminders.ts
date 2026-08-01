/**
 * Przypomnienia są WYLICZANE z danych, nie wpisywane ręcznie.
 *
 * Lista, o której trzeba pamiętać, żeby ją uzupełnić, nie chroni przed
 * zapomnieniem. Tutaj żyje czysta logika sygnałów — bez I/O i bez Reacta,
 * dzięki czemu da się ją przetestować i użyć zarówno na pulpicie, jak
 * i w innych widokach.
 */
import type { Channel } from '@/domain/models'
import { daysBetween, fromDateKey } from '@/lib/dates'

export type SilentChannel = {
  channel: Channel
  /** Ostatnia publikacja (`YYYY-MM-DD`) albo `null`, gdy nie było żadnej. */
  lastPublishedOn: string | null
  /** Dni od ostatniej publikacji; `null`, gdy nigdy nic nie poszło. */
  daysSince: number | null
  /** O ile dni przekroczony jest próg kanału — do sortowania „najgorsze pierwsze". */
  overdueBy: number
}

/**
 * Kanały, które milczą dłużej, niż pozwala ich własny próg.
 *
 * Kanał bez ani jednej publikacji w badanym oknie traktujemy jako
 * przekroczony maksymalnie — to najczęściej kanał, o którym się zapomniało,
 * a nie taki, który świadomie odpoczywa.
 *
 * @param lastPublished mapa `channelId` → data ostatniej publikacji
 * @param today dzień odniesienia (wstrzykiwany, żeby dało się to testować)
 */
export function silentChannels(
  channels: Channel[],
  lastPublished: Map<string, string>,
  today: Date,
): SilentChannel[] {
  return channels
    .filter((channel) => channel.isActive && channel.reminderAfterDays > 0)
    .map((channel) => {
      const lastPublishedOn = lastPublished.get(channel.id) ?? null
      const daysSince = lastPublishedOn ? daysBetween(fromDateKey(lastPublishedOn), today) : null

      return {
        channel,
        lastPublishedOn,
        daysSince,
        overdueBy:
          daysSince === null ? Number.POSITIVE_INFINITY : daysSince - channel.reminderAfterDays,
      }
    })
    .filter((entry) => entry.overdueBy > 0)
    .toSorted((a, b) => {
      // „Nigdy nic nie poszło" na samą górę, potem wg przekroczenia progu.
      if (a.overdueBy !== b.overdueBy) return b.overdueBy - a.overdueBy
      return a.channel.sortOrder - b.channel.sortOrder
    })
}
