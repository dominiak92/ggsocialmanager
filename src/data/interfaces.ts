/**
 * Kontrakty warstwy danych. UI i hooki zależą WYŁĄCZNIE od tych typów —
 * nigdy od Supabase bezpośrednio. Podmiana backendu = nowa implementacja
 * tych interfejsów i zmiana jednej linii w `data/provider.ts`.
 *
 * Ta aplikacja ma zaplanowaną migrację na inną bazę — dlatego ta granica
 * istnieje od pierwszego commita, a nie „kiedyś, jak będzie trzeba".
 */
import type {
  Channel,
  HealthCheck,
  PostType,
  Publication,
  PublicationDraft,
  PublicationPatch,
} from '@/domain/models'

/** Strona wyników z całkowitą liczbą — do paginacji list. */
export type Page<T> = { items: T[]; total: number }

export type PageParams = { limit: number; offset: number }

/** Zakres dat domknięty obustronnie, w formacie `YYYY-MM-DD`. */
export type DateRange = { from: string; to: string }

export type HealthRepo = {
  /** Sonda: czy aplikacja realnie czyta z bazy. `null`, gdy brak wpisu. */
  get(): Promise<HealthCheck | null>
}

export type ChannelRepo = {
  /** Wszystkie kanały w kolejności wyświetlania (także wyłączone). */
  list(): Promise<Channel[]>
  /** Włączenie/wyłączenie kanału — kanałów nie kasujemy, bo osierocą wpisy. */
  setActive(id: string, isActive: boolean): Promise<void>
}

export type PostTypeRepo = {
  list(): Promise<PostType[]>
}

export type PublicationRepo = {
  /** Wpisy z zakresu dat — pod widok tygodnia i miesiąca. */
  listRange(range: DateRange): Promise<Publication[]>
  create(draft: PublicationDraft): Promise<Publication>
  update(id: string, patch: PublicationPatch): Promise<Publication>
  remove(id: string): Promise<void>
}

/**
 * Zbiór repozytoriów wystawiany aplikacji. Nowa domena = nowe pole tutaj
 * plus implementacja w `data/supabase/data-provider.ts`.
 */
export type DataProvider = {
  health: HealthRepo
  channels: ChannelRepo
  postTypes: PostTypeRepo
  publications: PublicationRepo
}
