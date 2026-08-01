/**
 * Adapter zewnętrznego kalendarza gal (TheSportsDB).
 *
 * ŚWIADOMIE POZA `DataProvider`. To nie jest nasza baza: nic tu nie zapisujemy,
 * dane są tylko do odczytu i **nie wolno opierać na nich żadnego sygnału ani
 * wskaźnika**. Migracja naszej bazy na inny backend nie ma z tym plikiem nic
 * wspólnego — dlatego nie mieszamy tego do repozytoriów domenowych.
 *
 * Źródło jest darmowe i bezkluczowe (klucz testowy `3`), a odpowiedzi mają
 * `Access-Control-Allow-Origin: *`, więc wołamy je wprost z przeglądarki —
 * bez backendu i bez sekretów w bundlu.
 *
 * ZWERYFIKOWANE OGRANICZENIA:
 * - KSW zwraca najbliższą galę poprawnie,
 * - UFC na darmowym poziomie bywa ubogie (potrafi nie mieć nic w przyszłości),
 * - kart walk NIE MA, więc pełnej listy „gdzie walczą Polacy" stąd nie zbudujemy.
 * Widget ma być z tego powodu miłym dodatkiem, nigdy źródłem prawdy.
 *
 * PUŁAPKA, która nas już ugryzła: źródło przerzuca galę do `eventspastleague`
 * JUŻ W DNIU jej rozgrywania. Samo `eventsnextleague` gubi więc dzisiejszą galę
 * — dokładnie tę, o której najbardziej chce się wiedzieć. Dlatego pytamy oba
 * endpointy i sami odsiewamy po dacie.
 */
import type { ExternalFightEvent } from '@/domain/models'

const BASE = 'https://www.thesportsdb.com/api/v1/json/3'

/** Organizacje istotne dla marki. Klucz = `idLeague` w TheSportsDB. */
const LEAGUES: { id: string; name: string }[] = [
  { id: '4709', name: 'KSW' },
  { id: '4443', name: 'UFC' },
  { id: '5702', name: 'Oktagon MMA' },
  { id: '5341', name: 'TKO MMA' },
]

/** Po tylu ms rezygnujemy — pulpit nie może czekać na cudzy serwer. */
const TIMEOUT_MS = 8000

/** Jak długo trzymamy odpowiedź, żeby nie odpytywać przy każdym wejściu. */
const CACHE_TTL_MS = 6 * 60 * 60 * 1000
const CACHE_KEY = 'ggsm:fight-events'

type RawEvent = {
  idEvent?: string
  strEvent?: string
  dateEvent?: string
  strVenue?: string
  strCountry?: string
}

/** TheSportsDB wstawia literał „None" zamiast pustej wartości. */
function clean(value: string | undefined): string {
  return !value || value.trim() === '' || value.trim() === 'None' ? '' : value.trim()
}

/**
 * Wiersz źródła → nasz model. Wyeksportowane, żeby dało się to przetestować
 * bez sieci: zewnętrzne API potrafi zwrócić pola puste albo `"None"`.
 */
export function toFightEvent(raw: RawEvent, organization: string): ExternalFightEvent | null {
  const name = raw.strEvent?.trim()
  const startsOn = raw.dateEvent?.trim()

  // Bez nazwy albo daty wpis jest bezużyteczny — lepiej go pominąć niż
  // pokazać pustą linijkę.
  if (!name || !startsOn || !/^\d{4}-\d{2}-\d{2}$/.test(startsOn)) return null

  const place = [clean(raw.strVenue), clean(raw.strCountry)].filter(Boolean).join(', ')

  return {
    id: raw.idEvent?.trim() || `${organization}-${startsOn}-${name}`,
    name,
    startsOn,
    organization,
    place,
  }
}

/** Scalenie list z różnych endpointów: bez duplikatów, od najbliższej daty. */
function mergeFightEvents(lists: ExternalFightEvent[][]): ExternalFightEvent[] {
  const byId = new Map<string, ExternalFightEvent>()
  for (const list of lists) {
    for (const event of list) {
      if (!byId.has(event.id)) byId.set(event.id, event)
    }
  }
  return [...byId.values()].toSorted((a, b) => a.startsOn.localeCompare(b.startsOn))
}

async function fetchEndpoint(
  endpoint: 'eventsnextleague' | 'eventspastleague',
  league: { id: string; name: string },
): Promise<ExternalFightEvent[]> {
  const response = await fetch(`${BASE}/${endpoint}.php?id=${league.id}`, {
    signal: AbortSignal.timeout(TIMEOUT_MS),
  })
  if (!response.ok) return []

  const payload: unknown = await response.json()
  const events = (payload as { events?: RawEvent[] } | null)?.events
  if (!Array.isArray(events)) return []

  return events
    .map((raw) => toFightEvent(raw, league.name))
    .filter((event): event is ExternalFightEvent => event !== null)
}

function readCache(): ExternalFightEvent[] | null {
  try {
    const raw = sessionStorage.getItem(CACHE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as { at: number; events: ExternalFightEvent[] }
    if (Date.now() - parsed.at > CACHE_TTL_MS) return null
    return parsed.events
  } catch {
    return null
  }
}

function writeCache(events: ExternalFightEvent[]) {
  try {
    sessionStorage.setItem(CACHE_KEY, JSON.stringify({ at: Date.now(), events }))
  } catch {
    // Prywatne okno albo pełny magazyn — cache jest opcjonalny.
  }
}

/**
 * Nadchodzące gale, posortowane od najbliższej.
 *
 * Padnięta organizacja NIE psuje reszty (`allSettled`), a padnięte wszystko
 * zwraca pustą listę — karta wtedy po prostu znika z pulpitu, zamiast
 * pokazywać błąd cudzego serwera jako problem naszej aplikacji.
 */
export async function fetchUpcomingFightEvents(): Promise<ExternalFightEvent[]> {
  const cached = readCache()
  if (cached) return cached

  /*
   * Jedna płaska lista zadań zamiast zagnieżdżonych `allSettled`: wszystkie
   * ligi i oba endpointy lecą równolegle, a scalanie i sortowanie dzieje się
   * dokładnie raz. `past` jest potrzebny WYŁĄCZNIE po to, żeby złapać galę
   * rozgrywaną dzisiaj — źródło przenosi ją tam już rano. Prawdziwą przeszłość
   * odsiewa hook, porównując datę z dzisiejszą.
   */
  const results = await Promise.allSettled(
    LEAGUES.flatMap((league) => [
      fetchEndpoint('eventsnextleague', league),
      fetchEndpoint('eventspastleague', league),
    ]),
  )

  const events = mergeFightEvents(
    results.map((result) => (result.status === 'fulfilled' ? result.value : [])),
  )

  writeCache(events)
  return events
}
