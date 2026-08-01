/**
 * Model domenowy — typy, którymi mówi CAŁA aplikacja (UI, hooki, testy).
 *
 * Zero I/O, zero importów z Supabase. To jest ta warstwa, która przeżyje
 * migrację na inną bazę: zmienia się implementacja repozytoriów, nie te typy.
 * Patrz AGENTS.md → „Warstwa danych".
 */

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
