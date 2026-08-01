/**
 * Kontrakty warstwy danych. UI i hooki zależą WYŁĄCZNIE od tych typów —
 * nigdy od Supabase bezpośrednio. Podmiana backendu = nowa implementacja
 * tych interfejsów i zmiana jednej linii w `data/provider.ts`.
 *
 * Ta aplikacja ma zaplanowaną migrację na inną bazę — dlatego ta granica
 * istnieje od pierwszego commita, a nie „kiedyś, jak będzie trzeba".
 */
import type { HealthCheck } from '@/domain/models'

/** Strona wyników z całkowitą liczbą — do paginacji list. */
export type Page<T> = { items: T[]; total: number }

export type PageParams = { limit: number; offset: number }

export type HealthRepo = {
  /** Sonda: czy aplikacja realnie czyta z bazy. `null`, gdy brak wpisu. */
  get(): Promise<HealthCheck | null>
}

/**
 * Zbiór repozytoriów wystawiany aplikacji. Nowa domena = nowe pole tutaj
 * plus implementacja w `data/supabase/data-provider.ts`.
 */
export type DataProvider = {
  health: HealthRepo
}
