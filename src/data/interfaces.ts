/**
 * Kontrakty warstwy danych. UI i hooki zależą WYŁĄCZNIE od tych typów —
 * nigdy od Supabase bezpośrednio. Podmiana backendu = nowa implementacja
 * tych interfejsów i zmiana jednej linii w `data/provider.ts`.
 *
 * Ta aplikacja ma zaplanowaną migrację na inną bazę — dlatego ta granica
 * istnieje od pierwszego commita, a nie „kiedyś, jak będzie trzeba".
 */
import type {
  Athlete,
  AthleteCheck,
  AthleteDraft,
  AthletePatch,
  Channel,
  ChannelDraft,
  ChannelPatch,
  Contest,
  ContestDraft,
  ContestPatch,
  HealthCheck,
  Idea,
  IdeaDraft,
  IdeaPatch,
  PostType,
  PostTypeDraft,
  PostTypePatch,
  Publication,
  PublicationDraft,
  PublicationPatch,
  Recording,
  RecordingDraft,
  RecordingPatch,
  RecordingStage,
  RecordingStageDraft,
  RecordingStagePatch,
  SportEvent,
  SportEventDraft,
  SportEventPatch,
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
  /** Wszystkie rodzaje, także wyłączone — potrzebne w Ustawieniach. */
  list(): Promise<PostType[]>
  create(draft: PostTypeDraft): Promise<PostType>
  update(id: string, patch: PostTypePatch): Promise<PostType>
  /**
   * Kasowanie jest bezpieczne: `publications.post_type_id` ma
   * `on delete set null`, więc wpisy zostają, tracąc tylko rodzaj.
   */
  remove(id: string): Promise<void>
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
  /**
   * Wszystkie publikacje powiązane z jakimkolwiek eventem lub konkursem.
   * Bez ograniczenia datą — nagłośnienie liczymy dla eventu, nie dla okna
   * kalendarza, a wpisów z powiązaniem jest z natury mało.
   */
  listLinked(): Promise<Publication[]>
  create(draft: PublicationDraft): Promise<Publication>
  /**
   * Ta sama treść na kilka kanałów naraz — jednym zapisem, nie pętlą.
   * Właściciel często wrzuca jedną rzecz na dwa rynki; N osobnych żądań
   * dawałoby N okazji do częściowej porażki i N przeładowań listy.
   */
  createMany(drafts: PublicationDraft[]): Promise<Publication[]>
  update(id: string, patch: PublicationPatch): Promise<Publication>
  remove(id: string): Promise<void>
}

export type EventRepo = {
  list(): Promise<SportEvent[]>
  create(draft: SportEventDraft): Promise<SportEvent>
  update(id: string, patch: SportEventPatch): Promise<SportEvent>
  remove(id: string): Promise<void>
}

export type ContestRepo = {
  list(): Promise<Contest[]>
  create(draft: ContestDraft): Promise<Contest>
  update(id: string, patch: ContestPatch): Promise<Contest>
  remove(id: string): Promise<void>
}

export type AthleteRepo = {
  list(): Promise<Athlete[]>
  create(draft: AthleteDraft): Promise<Athlete>
  update(id: string, patch: AthletePatch): Promise<Athlete>
  remove(id: string): Promise<void>
  /** Ostatni przegląd per zawodnik — pod sygnał „dawno niesprawdzony". */
  lastCheckPerAthlete(): Promise<Map<string, string>>
  /** Historia przeglądów jednego zawodnika, od najnowszego. */
  listChecks(athleteId: string): Promise<AthleteCheck[]>
  addCheck(athleteId: string, checkedOn: string, note: string): Promise<AthleteCheck>
  removeCheck(id: string): Promise<void>
}

export type RecordingStageRepo = {
  list(): Promise<RecordingStage[]>
  create(draft: RecordingStageDraft): Promise<RecordingStage>
  update(id: string, patch: RecordingStagePatch): Promise<RecordingStage>
  /** Bezpieczne: `recordings.stage_id` ma `on delete set null`. */
  remove(id: string): Promise<void>
}

export type RecordingRepo = {
  list(): Promise<Recording[]>
  create(draft: RecordingDraft): Promise<Recording>
  update(id: string, patch: RecordingPatch): Promise<Recording>
  remove(id: string): Promise<void>
}

export type IdeaRepo = {
  list(): Promise<Idea[]>
  create(draft: IdeaDraft): Promise<Idea>
  update(id: string, patch: IdeaPatch): Promise<Idea>
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
  events: EventRepo
  contests: ContestRepo
  athletes: AthleteRepo
  ideas: IdeaRepo
  recordingStages: RecordingStageRepo
  recordings: RecordingRepo
}
