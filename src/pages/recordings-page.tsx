import { ArrowRightIcon, CheckIcon, ExternalLinkIcon, PlusIcon, VideoIcon } from 'lucide-react'
import { useMemo, useState } from 'react'

import { EntityDialog } from '@/components/shared/entity-dialog'
import { Field, NoteField, TextField } from '@/components/shared/field'
import { FilterChips } from '@/components/shared/filter-chips'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { postTypeColorClass } from '@/domain/enums'
import type { Recording, RecordingDraft } from '@/domain/models'
import { useAthletes, useRecordingStages, useRecordings } from '@/hooks/use-domain'
import { useEntityForm } from '@/hooks/use-entity-form'
import { cn } from '@/lib/utils'

const ALL = '__all__'
const NONE = '__none__'

function emptyDraft(): RecordingDraft {
  return {
    title: '',
    referenceUrl: '',
    idea: '',
    athleteId: null,
    stageId: null,
    note: '',
    isDone: false,
  }
}

/**
 * Nagrywki — materiały do nakręcenia, najczęściej odtworzenia cudzej rolki.
 *
 * Etapy NIE SĄ zaszyte w kodzie: właściciel definiuje je sam w Ustawieniach,
 * a `sortOrder` wyznacza kolejność pipeline'u. Dzięki temu „Dalej" wie, co
 * jest następne, bez żadnej wiedzy o konkretnym procesie.
 *
 * Zawodnik jest opcjonalny — nagrywka nie musi być z kimkolwiek powiązana.
 */
export function RecordingsPage() {
  const collection = useRecordings()
  const { items, error, loading, update } = collection
  const { items: stages } = useRecordingStages()
  const { items: athletes } = useAthletes()

  const [stageFilter, setStageFilter] = useState<string>(ALL)
  const [showDone, setShowDone] = useState(false)

  const dialog = useEntityForm<Recording, RecordingDraft>({
    collection,
    empty: emptyDraft,
    toDraft: ({ id: _id, ...draft }) => draft,
    normalize: (draft) => ({ ...draft, title: draft.title.trim() }),
    isValid: (draft) => draft.title.trim().length > 0,
  })
  const { form, patch } = dialog

  const stageById = useMemo(() => new Map(stages.map((stage) => [stage.id, stage])), [stages])
  const athleteById = useMemo(
    () => new Map(athletes.map((athlete) => [athlete.id, athlete])),
    [athletes],
  )

  const visible = useMemo(() => {
    const working = showDone ? items : items.filter((recording) => !recording.isDone)
    const filtered =
      stageFilter === ALL
        ? working
        : working.filter((recording) => (recording.stageId ?? NONE) === stageFilter)

    // Kolejność pipeline'u: nagrywki bez etapu na koniec, bo nie wiadomo,
    // gdzie w procesie siedzą.
    return filtered.toSorted((a, b) => {
      const aOrder = a.stageId ? (stageById.get(a.stageId)?.sortOrder ?? 999) : 1000
      const bOrder = b.stageId ? (stageById.get(b.stageId)?.sortOrder ?? 999) : 1000
      return aOrder - bOrder || a.title.localeCompare(b.title, 'pl')
    })
  }, [items, stageFilter, showDone, stageById])

  /** Następny etap wg `sortOrder` — bez wiedzy o konkretnym procesie. */
  const nextStage = (recording: Recording) => {
    const active = stages.filter((stage) => stage.isActive)
    if (active.length === 0) return null
    if (!recording.stageId) return active[0] ?? null
    const index = active.findIndex((stage) => stage.id === recording.stageId)
    return index >= 0 ? (active[index + 1] ?? null) : (active[0] ?? null)
  }

  const advance = async (recording: Recording) => {
    const next = nextStage(recording)
    // Koniec pipeline'u = nagrywka gotowa; nie ma dokąd jej dalej pchać.
    const changes = next ? { stageId: next.id } : { isDone: true }
    await update(recording.id, changes).catch(() => null)
  }

  const countFor = (id: string) =>
    items.filter((r) => !r.isDone && (r.stageId ?? NONE) === id).length

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start gap-3">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold tracking-tight">Nagrywki</h1>
          <p className="text-muted-foreground text-sm">
            Materiały do nakręcenia i na jakim są etapie. Etapy ustawiasz sam w Ustawieniach.
          </p>
        </div>
        <Button className="ml-auto" onClick={() => dialog.openCreate()}>
          <PlusIcon />
          Dodaj nagrywkę
        </Button>
      </div>

      {error && (
        <p className="border-destructive/40 bg-destructive/10 text-destructive rounded-md border px-3 py-2 text-sm">
          {error}
        </p>
      )}

      <FilterChips
        ariaLabel="Filtr etapów"
        value={stageFilter}
        onChange={setStageFilter}
        options={[
          { value: ALL, label: 'Wszystkie', count: items.filter((r) => !r.isDone).length },
          ...stages
            .filter((stage) => stage.isActive)
            .map((stage) => ({ value: stage.id, label: stage.name, count: countFor(stage.id) })),
          { value: NONE, label: 'Bez etapu', count: countFor(NONE) },
        ]}
      />

      {loading ? (
        <div className="space-y-2">
          {Array.from({ length: 4 }, (_, index) => (
            <Skeleton key={index} className="h-20 w-full" />
          ))}
        </div>
      ) : visible.length === 0 ? (
        <Card>
          <CardContent className="text-muted-foreground py-10 text-center text-sm">
            {items.length === 0
              ? 'Nie ma jeszcze żadnej nagrywki. Wklej link do rolki, którą chcesz odtworzyć.'
              : 'Nic w tym filtrze.'}
          </CardContent>
        </Card>
      ) : (
        <ul className="space-y-2">
          {visible.map((recording) => {
            const stage = recording.stageId ? stageById.get(recording.stageId) : undefined
            const athlete = recording.athleteId ? athleteById.get(recording.athleteId) : undefined
            const next = nextStage(recording)

            return (
              <li
                key={recording.id}
                className={cn(
                  'flex flex-wrap items-center gap-2 rounded-lg border p-3',
                  recording.isDone && 'opacity-55',
                )}
              >
                <button
                  type="button"
                  onClick={() => dialog.openEdit(recording)}
                  className="focus-visible:ring-ring min-w-0 flex-1 rounded text-left focus-visible:ring-2 focus-visible:outline-none"
                >
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className="font-medium">{recording.title}</span>
                    {stage && (
                      <span
                        className={cn(
                          'rounded border px-1.5 py-0.5 text-[11px] font-medium',
                          postTypeColorClass(stage.color),
                        )}
                      >
                        {stage.name}
                      </span>
                    )}
                    {athlete && <Badge variant="secondary">{athlete.name}</Badge>}
                    {recording.isDone && <Badge variant="outline">gotowe</Badge>}
                  </div>
                  {recording.idea && (
                    <p className="text-muted-foreground mt-0.5 line-clamp-2 text-xs">
                      {recording.idea}
                    </p>
                  )}
                </button>

                {recording.referenceUrl && (
                  <a
                    href={recording.referenceUrl}
                    target="_blank"
                    rel="noreferrer noopener"
                    data-touch="icon"
                    aria-label={`Otwórz materiał źródłowy: ${recording.title}`}
                    title="Materiał do odtworzenia"
                    className="text-muted-foreground hover:bg-accent hover:text-foreground focus-visible:ring-ring inline-flex size-8 shrink-0 items-center justify-center rounded-md transition focus-visible:ring-2 focus-visible:outline-none"
                  >
                    <ExternalLinkIcon className="size-4" />
                  </a>
                )}

                {!recording.isDone && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="shrink-0"
                    onClick={() => void advance(recording)}
                  >
                    {next ? (
                      <>
                        <ArrowRightIcon />
                        {next.name}
                      </>
                    ) : (
                      <>
                        <CheckIcon />
                        Gotowe
                      </>
                    )}
                  </Button>
                )}
              </li>
            )
          })}
        </ul>
      )}

      <Button variant="ghost" size="sm" onClick={() => setShowDone((prev) => !prev)}>
        <VideoIcon />
        {showDone ? 'Ukryj gotowe' : `Pokaż gotowe (${items.filter((r) => r.isDone).length})`}
      </Button>

      <EntityDialog
        open={dialog.target !== null}
        title={dialog.target?.mode === 'edit' ? 'Edytuj nagrywkę' : 'Nowa nagrywka'}
        description="Wklej link do materiału, który chcesz odtworzyć, i opisz pomysł na własną wersję."
        saving={dialog.saving}
        canSave={dialog.canSave}
        onClose={dialog.close}
        onSave={dialog.save}
        onDelete={dialog.target?.mode === 'edit' ? dialog.removeCurrent : undefined}
      >
        <TextField
          id="recording-title"
          label="Tytuł"
          value={form.title}
          onChange={(title) => patch({ title })}
          placeholder="np. Rolka z przejściem do trójkąta"
        />

        <TextField
          id="recording-url"
          label="Materiał do odtworzenia"
          type="url"
          value={form.referenceUrl}
          onChange={(referenceUrl) => patch({ referenceUrl })}
          placeholder="https://instagram.com/reel/..."
        />

        <NoteField
          id="recording-idea"
          label="Pomysł na naszą wersję"
          value={form.idea}
          onChange={(idea) => patch({ idea })}
          rows={3}
        />

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Etap" htmlFor="recording-stage">
            <Select
              value={form.stageId ?? NONE}
              onValueChange={(value) => patch({ stageId: value === NONE ? null : value })}
            >
              <SelectTrigger id="recording-stage" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={NONE}>Bez etapu</SelectItem>
                {stages
                  .filter((stage) => stage.isActive)
                  .map((stage) => (
                    <SelectItem key={stage.id} value={stage.id}>
                      {stage.name}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </Field>

          <Field label="Zawodnik" htmlFor="recording-athlete" hint="Opcjonalnie.">
            <Select
              value={form.athleteId ?? NONE}
              onValueChange={(value) => patch({ athleteId: value === NONE ? null : value })}
            >
              <SelectTrigger id="recording-athlete" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={NONE}>Bez zawodnika</SelectItem>
                {athletes
                  .filter((athlete) => athlete.isActive)
                  .map((athlete) => (
                    <SelectItem key={athlete.id} value={athlete.id}>
                      {athlete.name}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </Field>
        </div>

        <NoteField id="recording-note" value={form.note} onChange={(note) => patch({ note })} />
      </EntityDialog>
    </div>
  )
}
