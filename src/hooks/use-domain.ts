/**
 * Hooki list domenowych. Każdy to `useCollection` spięty z repozytorium
 * z `data/provider` — bez logiki własnej, żeby nie było dwóch miejsc,
 * w których trzeba naprawiać ten sam błąd.
 */
import { dataProvider } from '@/data/provider'
import type {
  Athlete,
  AthleteDraft,
  AthletePatch,
  Contest,
  ContestDraft,
  ContestPatch,
  Idea,
  IdeaDraft,
  IdeaPatch,
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
import { useCollection, type CollectionState } from '@/hooks/use-collection'

/** Najbliższe wydarzenia na górze — to one wymagają reakcji. */
export function useEvents(): CollectionState<SportEvent, SportEventDraft, SportEventPatch> {
  return useCollection(dataProvider.events, (a, b) => a.startsOn.localeCompare(b.startsOn))
}

/** Konkursy od najświeższego terminu — starsze schodzą w dół. */
export function useContests(): CollectionState<Contest, ContestDraft, ContestPatch> {
  return useCollection(dataProvider.contests, (a, b) => b.endsOn.localeCompare(a.endsOn))
}

export function useAthletes(): CollectionState<Athlete, AthleteDraft, AthletePatch> {
  return useCollection(dataProvider.athletes, (a, b) => a.name.localeCompare(b.name, 'pl'))
}

export function useIdeas(): CollectionState<Idea, IdeaDraft, IdeaPatch> {
  return useCollection(dataProvider.ideas)
}

export function useRecordings(): CollectionState<Recording, RecordingDraft, RecordingPatch> {
  return useCollection(dataProvider.recordings)
}

/** Etapy nagrywek — w kolejności pipeline'u, bo po niej działa „przesuń dalej". */
export function useRecordingStages(): CollectionState<
  RecordingStage,
  RecordingStageDraft,
  RecordingStagePatch
> {
  return useCollection(dataProvider.recordingStages, (a, b) => a.sortOrder - b.sortOrder)
}
