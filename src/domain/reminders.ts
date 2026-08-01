/**
 * Przypomnienia są WYLICZANE z danych, nie wpisywane ręcznie.
 *
 * Lista, o której trzeba pamiętać, żeby ją uzupełnić, nie chroni przed
 * zapomnieniem. Tutaj żyje czysta logika sygnałów — bez I/O i bez Reacta,
 * dzięki czemu da się ją przetestować i użyć zarówno na pulpicie, jak
 * i w innych widokach.
 *
 * Każda funkcja przyjmuje „dziś" jako argument — inaczej testy zależałyby
 * od zegara maszyny i psuły się o północy.
 */
import type { Athlete, Channel, Contest, Publication, SportEvent } from '@/domain/models'
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

export type EventPromo = {
  event: SportEvent
  /** Dni do startu; ujemne = event już się zaczął. */
  daysUntil: number
  /** Ile publikacji wskazuje na ten event. */
  promoCount: number
  /** Na ilu różnych kanałach był nagłaśniany. */
  channelCount: number
  /**
   * Czy event wszedł już w swoje okno zapowiedzi (`promoLeadDays`).
   *
   * Pole, a nie predykat liczony w UI: to reguła domenowa i musi mieć jedno
   * miejsce. Wcześniej pulpit liczył ją sobie sam i cicho rozjechałby się
   * z `eventsNeedingPromo` przy zmianie definicji okna.
   */
  inPromoWindow: boolean
}

/** Pokrycie nagłośnienia dla wszystkich eventów — także tych zaopiekowanych. */
export function eventPromo(
  events: SportEvent[],
  publications: Publication[],
  today: Date,
): EventPromo[] {
  // Jeden przebieg po publikacjach zamiast `filter` w pętli po eventach:
  // inaczej koszt rośnie jak liczba eventów razy liczba publikacji.
  const byEvent = new Map<string, Publication[]>()
  for (const publication of publications) {
    if (!publication.eventId) continue
    const bucket = byEvent.get(publication.eventId)
    if (bucket) bucket.push(publication)
    else byEvent.set(publication.eventId, [publication])
  }

  return events.map((event) => {
    const linked = byEvent.get(event.id) ?? []
    const daysUntil = daysBetween(today, fromDateKey(event.startsOn))

    return {
      event,
      daysUntil,
      promoCount: linked.length,
      channelCount: new Set(linked.map((publication) => publication.channelId)).size,
      inPromoWindow: daysUntil >= 0 && daysUntil <= event.promoLeadDays,
    }
  })
}

/**
 * Eventy, które się zbliżają, a nie mają ANI JEDNEJ publikacji.
 *
 * To dokładnie ten sygnał, o który prosił właściciel: „żeby nie przegapić,
 * że jakiś event nie zostanie nagłośniony". Event, który już minął, znika
 * z listy — na przypominanie jest za późno, a lista ma pozostać krótka.
 */
export function eventsNeedingPromo(
  events: SportEvent[],
  publications: Publication[],
  today: Date,
): EventPromo[] {
  return eventPromo(events, publications, today)
    .filter((entry) => entry.promoCount === 0 && entry.inPromoWindow)
    .toSorted((a, b) => a.daysUntil - b.daysUntil)
}

/**
 * Najbliższe wydarzenia — niezależnie od tego, czy mają już zapowiedź.
 *
 * To NIE jest sygnał alarmowy, tylko podgląd horyzontu. `eventsNeedingPromo`
 * milczy, dopóki event nie wejdzie w swoje okno zapowiedzi, więc przy planach
 * na trzy miesiące do przodu pulpit nie mówił o nich nic — a właśnie wtedy
 * warto wiedzieć, co się szykuje.
 */
export function upcomingEvents(
  events: SportEvent[],
  publications: Publication[],
  today: Date,
): EventPromo[] {
  return eventPromo(events, publications, today)
    .filter((entry) => entry.daysUntil >= 0)
    .toSorted((a, b) => a.daysUntil - b.daysUntil)
}

export type ContestAlertReason = 'ends-soon' | 'overdue' | 'winner-waiting' | 'prize-waiting'

export type ContestAlert = {
  contest: Contest
  reason: ContestAlertReason
  /** Dni do końca (dodatnie) albo od końca (ujemne). */
  daysUntilEnd: number
}

export const CONTEST_ALERT_LABEL: Record<ContestAlertReason, string> = {
  'ends-soon': 'Kończy się lada moment',
  overdue: 'Termin minął, konkurs wciąż otwarty',
  'winner-waiting': 'Czeka na wyłonienie zwycięzcy',
  'prize-waiting': 'Nagroda niewysłana',
}

/** Po ilu dniach przed końcem konkurs zaczyna się upominać. */
const CONTEST_ENDING_SOON_DAYS = 2

/**
 * Konkursy wymagające ruchu. Kolejność sprawdzania ma znaczenie — zwracamy
 * NAJPILNIEJSZY powód, a nie wszystkie naraz, żeby lista nie puchła
 * duplikatami tego samego konkursu.
 */
export function contestsNeedingAction(contests: Contest[], today: Date): ContestAlert[] {
  const alerts: ContestAlert[] = []

  for (const contest of contests) {
    if (contest.status === 'sent') continue

    const daysUntilEnd = daysBetween(today, fromDateKey(contest.endsOn))

    if (contest.status === 'picked') {
      alerts.push({ contest, reason: 'prize-waiting', daysUntilEnd })
    } else if (contest.status === 'picking') {
      alerts.push({ contest, reason: 'winner-waiting', daysUntilEnd })
    } else if (daysUntilEnd < 0) {
      // Termin minął, a status wciąż „trwa" — klasyczne przeoczenie.
      alerts.push({ contest, reason: 'overdue', daysUntilEnd })
    } else if (daysUntilEnd <= CONTEST_ENDING_SOON_DAYS) {
      alerts.push({ contest, reason: 'ends-soon', daysUntilEnd })
    }
  }

  // Najbardziej przeterminowane na górze.
  return alerts.toSorted((a, b) => a.daysUntilEnd - b.daysUntilEnd)
}

export type AthleteDue = {
  athlete: Athlete
  lastCheckedOn: string | null
  daysSince: number | null
  overdueBy: number
}

/** Zawodnicy, których profil nie był przeglądany dłużej niż ich rytm. */
export function athletesDue(
  athletes: Athlete[],
  lastChecks: Map<string, string>,
  today: Date,
): AthleteDue[] {
  return athletes
    .filter((athlete) => athlete.isActive && athlete.checkEveryDays > 0)
    .map((athlete) => {
      const lastCheckedOn = lastChecks.get(athlete.id) ?? null
      const daysSince = lastCheckedOn ? daysBetween(fromDateKey(lastCheckedOn), today) : null

      return {
        athlete,
        lastCheckedOn,
        daysSince,
        overdueBy:
          daysSince === null ? Number.POSITIVE_INFINITY : daysSince - athlete.checkEveryDays,
      }
    })
    .filter((entry) => entry.overdueBy > 0)
    .toSorted((a, b) => {
      // Gwiazdka wygrywa z przekroczeniem progu. Zawodnik oznaczony jako
      // ważniejszy ma trafić na górę nawet wtedy, gdy ktoś inny jest zaległy
      // o kilka dni dłużej — po to się go gwiazdkuje.
      if (a.athlete.isStarred !== b.athlete.isStarred) return a.athlete.isStarred ? -1 : 1
      if (a.overdueBy !== b.overdueBy) return b.overdueBy - a.overdueBy
      return a.athlete.name.localeCompare(b.athlete.name, 'pl')
    })
}

/** Wszystkie sporty występujące na liście — do filtrów, posortowane po popularności. */
export function disciplineTags(athletes: Athlete[]): { tag: string; count: number }[] {
  const counts = new Map<string, number>()
  for (const athlete of athletes) {
    for (const tag of athlete.disciplines) {
      counts.set(tag, (counts.get(tag) ?? 0) + 1)
    }
  }

  return [...counts.entries()]
    .map(([tag, count]) => ({ tag, count }))
    .toSorted((a, b) => b.count - a.count || a.tag.localeCompare(b.tag, 'pl'))
}
