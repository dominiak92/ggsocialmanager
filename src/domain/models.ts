/**
 * Model domenowy — typy, którymi mówi CAŁA aplikacja (UI, hooki, testy).
 *
 * Zero I/O, zero importów z Supabase. To jest ta warstwa, która przeżyje
 * migrację na inną bazę: zmienia się implementacja repozytoriów, nie te typy.
 * Patrz AGENTS.md → „Warstwa danych".
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

/** Wynik sondy połączenia z bazą — pokazywany na pulpicie. */
export type HealthCheck = {
  id: string
  label: string
  /** Kiedy wpis był ostatnio odświeżony (ISO 8601). */
  checkedAt: string
}

/**
 * Tożsamość zalogowanego użytkownika.
 *
 * DZIŚ pochodzi z atrapy (`lib/auth/identity.tsx`) — ta aplikacja nie ma
 * własnego logowania. DOCELOWO wstrzykuje ją aplikacja nadrzędna (logowanie
 * Google). Kształt jest celowo minimalny, żeby dało się go wypełnić z dowolnego
 * dostawcy tożsamości.
 */
export type Identity = {
  /** Stabilny identyfikator użytkownika — trafia do `auth.uid()` w RLS. */
  id: string
  email: string
  displayName: string
  avatarUrl: string | null
}

/** Kanał publikacji: platforma + rynek (np. Fanpage FB / CZ). */
export type Channel = {
  id: string
  /** Stabilny klucz techniczny (`fb-pl`, `ig-cz`, ...) — nie zmienia się. */
  code: string
  name: string
  platform: Platform
  /** `null` dla kanałów bez podziału na rynki (TikTok, YouTube, ...). */
  locale: Locale | null
  sortOrder: number
  isActive: boolean
  /**
   * Po ilu dniach bez publikacji kanał ma się upomnieć na pulpicie.
   * `0` = nie przypominaj. Per kanał, bo newsletter i Instagram mają
   * zupełnie inne rytmy.
   */
  reminderAfterDays: number
}

/** Dane nowego kanału; `code` wyliczamy z nazwy, `sortOrder` z platformy. */
export type ChannelDraft = {
  name: string
  platform: Platform
  locale: Locale | null
  reminderAfterDays: number
}

export type ChannelPatch = Partial<ChannelDraft & { isActive: boolean }>

/** Rodzaj treści (produkt, news, meme, ...) — słownik edytowalny z panelu. */
export type PostType = {
  id: string
  code: string
  name: string
  /** Klucz koloru; na klasę CSS zamienia `postTypeColorClass`. */
  color: string
  sortOrder: number
  isActive: boolean
}

/** `code` wylicza repozytorium ze `slugify(name)`, jak przy kanałach. */
export type PostTypeDraft = { name: string; color: string; sortOrder: number }
export type PostTypePatch = Partial<PostTypeDraft & { isActive: boolean }>

/**
 * Wpis w kalendarzu — jeden byt dla „zaplanowane" i „wrzucone".
 * Odhaczenie w siatce to zmiana `status`, nie nowy rekord.
 */
export type Publication = {
  id: string
  /** Dzień w formacie `YYYY-MM-DD` (bez strefy — to data, nie moment). */
  publishOn: string
  channelId: string
  postTypeId: string | null
  status: PublicationStatus
  title: string
  note: string
  url: string
  /** Powiązanie z wydarzeniem — z tego liczy się pokrycie nagłośnienia. */
  eventId: string | null
  contestId: string | null
}

/**
 * Wydarzenie sportowe: zawody, gala MMA, camp.
 *
 * Nie ma tu pola „nagłośniony" — to wynika z powiązanych publikacji.
 * Osobna kolumna byłaby kolejnym polem do ręcznego odhaczania i szybko
 * rozjechałaby się z rzeczywistością.
 */
export type SportEvent = {
  id: string
  name: string
  kind: EventKind
  startsOn: string
  /** `null` = wydarzenie jednodniowe. */
  endsOn: string | null
  place: string
  isSponsored: boolean
  url: string
  note: string
  /** Ile dni przed startem zacząć się upominać o brak nagłośnienia. */
  promoLeadDays: number
}

export type SportEventDraft = Omit<SportEvent, 'id'>
export type SportEventPatch = Partial<SportEventDraft>

/** Konkurs na fanpage'u — z terminem, który trzeba domknąć. */
export type Contest = {
  id: string
  name: string
  /** `null`, gdy konkurs obejmuje kilka kanałów. */
  channelId: string | null
  startsOn: string
  endsOn: string
  prize: string
  status: ContestStatus
  winnerName: string
  winnerContact: string
  /** DANE OSOBOWE — przy obecnej polityce RLS publicznie czytelne. */
  winnerAddress: string
  trackingCode: string
  url: string
  note: string
}

export type ContestDraft = Omit<Contest, 'id'>
export type ContestPatch = Partial<ContestDraft>

/** Sponsorowany zawodnik, którego profil trzeba regularnie przeglądać. */
export type Athlete = {
  id: string
  name: string
  /**
   * Sporty jako TAGI, nie jedna nazwa. Realne dane bywają wielowartościowe
   * („K1", „Muay Thai") i mieszają sport z organizacją („MMA", „KSW") —
   * przy jednym polu tekstowym filtr „MMA" rozjechałby się na trzy grupy.
   */
  disciplines: string[]
  instagramUrl: string
  facebookUrl: string
  /** Co ile dni profil ma być przejrzany. `0` = nie przypominaj. */
  checkEveryDays: number
  isActive: boolean
  /** Ważniejszy zawodnik — idzie na górę list i sygnałów. */
  isStarred: boolean
  note: string
}

export type AthleteDraft = Omit<Athlete, 'id'>
export type AthletePatch = Partial<AthleteDraft>

/** Wpis w logu przeglądów profilu zawodnika. */
export type AthleteCheck = {
  id: string
  athleteId: string
  checkedOn: string
  note: string
}

/**
 * Gala z ŹRÓDŁA ZEWNĘTRZNEGO (TheSportsDB) — tylko do odczytu.
 *
 * Świadomie NIE jest to `SportEvent`: to nie są nasze dane, nic tu nie zapisujemy
 * i nie wolno na tym opierać żadnego sygnału ani wskaźnika. Służy wyłącznie do
 * pokazania „coś takiego się zbliża"; żeby gala trafiła do naszej domeny,
 * właściciel musi ją świadomie dodać jako `SportEvent`.
 */
export type ExternalFightEvent = {
  id: string
  name: string
  /** `YYYY-MM-DD` — ta sama konwencja co `publishOn`. */
  startsOn: string
  /** Nazwa organizacji, np. „KSW", „UFC". */
  organization: string
  place: string
}

/** Pomysł albo temat do przegadania. */
export type Idea = {
  id: string
  title: string
  detail: string
  kind: IdeaKind
  status: IdeaStatus
  priority: IdeaPriority
}

export type IdeaDraft = Omit<Idea, 'id'>
export type IdeaPatch = Partial<IdeaDraft>

/** Dane do utworzenia wpisu; resztę pól uzupełnia baza. */
export type PublicationDraft = {
  publishOn: string
  channelId: string
  postTypeId?: string | null
  status?: PublicationStatus
  title?: string
  note?: string
  url?: string
  eventId?: string | null
  contestId?: string | null
}

/** Zmiana istniejącego wpisu — wszystkie pola opcjonalne. */
export type PublicationPatch = Partial<Omit<Publication, 'id'>>
