/**
 * Model domenowy — typy, którymi mówi CAŁA aplikacja (UI, hooki, testy).
 *
 * Zero I/O, zero importów z Supabase. To jest ta warstwa, która przeżyje
 * migrację na inną bazę: zmienia się implementacja repozytoriów, nie te typy.
 * Patrz AGENTS.md → „Warstwa danych".
 */
import type { Locale, Platform, PublicationStatus } from '@/domain/enums'

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
}

/** Dane do utworzenia wpisu; resztę pól uzupełnia baza. */
export type PublicationDraft = {
  publishOn: string
  channelId: string
  postTypeId?: string | null
  status?: PublicationStatus
  title?: string
  note?: string
  url?: string
}

/** Zmiana istniejącego wpisu — wszystkie pola opcjonalne. */
export type PublicationPatch = Partial<Omit<Publication, 'id'>>
