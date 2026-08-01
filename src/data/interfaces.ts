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
  ChannelDraft,
  ChannelPatch,
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
  create(draft: ChannelDraft): Promise<Channel>
  update(id: string, patch: ChannelPatch): Promise<Channel>
  /**
   * Usuwa kanał. Rzuca `ChannelInUseError`, gdy ma publikacje — baza broni
   * tego kluczem obcym (`on delete restrict`), żeby nie osierocić wpisów.
   * Wtedy właściwą operacją jest wyłączenie (`update({ isActive: false })`).
   */
  remove(id: string): Promise<void>
}

/** Kanał ma publikacje i nie da się go skasować — trzeba go wyłączyć. */
export class ChannelInUseError extends Error {
  constructor() {
    super('Ten kanał ma zapisane publikacje, więc nie można go usunąć. Wyłącz go zamiast tego.')
    this.name = 'ChannelInUseError'
  }
}

export type PostTypeRepo = {
  list(): Promise<PostType[]>
}

export type PublicationRepo = {
  /** Wpisy z zakresu dat — pod widok tygodnia i miesiąca. */
  listRange(range: DateRange): Promise<Publication[]>
  /**
   * Data ostatniej OPUBLIKOWANEJ pozycji per kanał, nie starsza niż `since`.
   * Pod przypomnienia o ciszy — plany się nie liczą, bo zaplanowany post
   * niczego jeszcze nie odtrąbił.
   */
  lastPublishedPerChannel(since: string): Promise<Map<string, string>>
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
