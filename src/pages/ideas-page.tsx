import { LightbulbIcon, MessageSquareIcon, PlusIcon } from 'lucide-react'
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
import {
  IDEA_KINDS,
  IDEA_KIND_LABEL,
  IDEA_PRIORITIES,
  IDEA_PRIORITY_LABEL,
  IDEA_STATUSES,
  IDEA_STATUS_LABEL,
  type IdeaKind,
  type IdeaPriority,
  type IdeaStatus,
} from '@/domain/enums'
import type { Idea, IdeaDraft } from '@/domain/models'
import { useIdeas } from '@/hooks/use-domain'
import { useEntityForm } from '@/hooks/use-entity-form'
import { cn } from '@/lib/utils'

function emptyDraft(): IdeaDraft {
  return { title: '', detail: '', kind: 'idea', status: 'new', priority: 'normal' }
}

type Filter = 'open' | 'all'

const PRIORITY_ORDER: Record<IdeaPriority, number> = { high: 0, normal: 1, low: 2 }

export function IdeasPage() {
  const collection = useIdeas()
  const { items, error, loading } = collection
  const [filter, setFilter] = useState<Filter>('open')

  const dialog = useEntityForm<Idea, IdeaDraft>({
    collection,
    empty: emptyDraft,
    toDraft: ({ id: _id, ...draft }) => draft,
    normalize: (draft) => ({ ...draft, title: draft.title.trim() }),
    isValid: (draft) => draft.title.trim().length > 0,
  })
  const { form, patch } = dialog

  const visible = useMemo(() => {
    const filtered =
      filter === 'open'
        ? items.filter((idea) => idea.status === 'new' || idea.status === 'doing')
        : items
    // Priorytet rządzi, bo to lista do przerobienia, nie archiwum.
    return filtered.toSorted(
      (a, b) =>
        PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority] ||
        a.title.localeCompare(b.title, 'pl'),
    )
  }, [items, filter])

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start gap-3">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold tracking-tight">Pomysły</h1>
          <p className="text-muted-foreground text-sm">
            Wrzutki na przyszłe posty i tematy do przegadania z zespołem.
          </p>
        </div>
        <Button className="w-full sm:ml-auto sm:w-auto" onClick={() => dialog.openCreate()}>
          <PlusIcon />
          Dodaj
        </Button>
      </div>

      <FilterChips
        ariaLabel="Zakres pomysłów"
        value={filter}
        onChange={setFilter}
        options={[
          {
            value: 'open',
            label: 'Otwarte',
            count: items.filter((idea) => idea.status === 'new' || idea.status === 'doing').length,
          },
          { value: 'all', label: 'Wszystkie', count: items.length },
        ]}
      />

      {error && (
        <p className="border-destructive/40 bg-destructive/10 text-destructive rounded-md border px-3 py-2 text-sm">
          {error}
        </p>
      )}

      {loading ? (
        <div className="space-y-2">
          {Array.from({ length: 4 }, (_, index) => (
            <Skeleton key={index} className="h-16 w-full" />
          ))}
        </div>
      ) : visible.length === 0 ? (
        <Card>
          <CardContent className="text-muted-foreground py-10 text-center text-sm">
            {filter === 'open' ? 'Nic otwartego — czysta lista.' : 'Nie ma jeszcze żadnego wpisu.'}
          </CardContent>
        </Card>
      ) : (
        <ul className="space-y-2">
          {visible.map((idea) => (
            <li key={idea.id}>
              <button
                type="button"
                onClick={() => dialog.openEdit(idea)}
                className={cn(
                  'hover:bg-accent focus-visible:ring-ring flex w-full items-start gap-3 rounded-lg border p-3 text-left transition focus-visible:ring-2 focus-visible:outline-none',
                  (idea.status === 'done' || idea.status === 'dropped') && 'opacity-55',
                )}
              >
                {idea.kind === 'idea' ? (
                  <LightbulbIcon
                    aria-label={IDEA_KIND_LABEL.idea}
                    className="text-muted-foreground mt-0.5 size-4 shrink-0"
                  />
                ) : (
                  <MessageSquareIcon
                    aria-label={IDEA_KIND_LABEL.discuss}
                    className="text-muted-foreground mt-0.5 size-4 shrink-0"
                  />
                )}

                <div className="min-w-0 flex-1">
                  {/* Tytuł w osobnej linii: przy plakietkach w tym samym rzędzie
                      długi tytuł na telefonie łamał się w jedną literę na wiersz. */}
                  <p className="font-medium break-words">{idea.title}</p>

                  {/* Wszystkie plakietki w JEDNYM zawijanym rzędzie. Rodzaj stał
                      wcześniej w prawej kolumnie o stałej szerokości i na wąskim
                      ekranie zjadał miejsce tytułowi. */}
                  <div className="mt-1 flex flex-wrap items-center gap-1.5">
                    <Badge variant="secondary">{IDEA_KIND_LABEL[idea.kind]}</Badge>
                    {idea.priority === 'high' && <Badge variant="destructive">Wysoki</Badge>}
                    <Badge variant="outline">{IDEA_STATUS_LABEL[idea.status]}</Badge>
                  </div>
                  {idea.detail && (
                    <p className="text-muted-foreground mt-0.5 line-clamp-2 text-xs">
                      {idea.detail}
                    </p>
                  )}
                </div>
              </button>
            </li>
          ))}
        </ul>
      )}

      <EntityDialog
        open={dialog.target !== null}
        title={dialog.target?.mode === 'edit' ? 'Edytuj wpis' : 'Nowy wpis'}
        saving={dialog.saving}
        canSave={dialog.canSave}
        onClose={dialog.close}
        onSave={dialog.save}
        onDelete={dialog.target?.mode === 'edit' ? dialog.removeCurrent : undefined}
      >
        <TextField
          id="idea-title"
          label="Tytuł"
          value={form.title}
          onChange={(title) => patch({ title })}
          placeholder="np. Seria „technika tygodnia” na Reels"
        />

        <Field label="Rodzaj" htmlFor="idea-kind">
          <Select value={form.kind} onValueChange={(kind) => patch({ kind: kind as IdeaKind })}>
            <SelectTrigger id="idea-kind" className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {IDEA_KINDS.map((kind) => (
                <SelectItem key={kind} value={kind}>
                  {IDEA_KIND_LABEL[kind]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Status" htmlFor="idea-status">
            <Select
              value={form.status}
              onValueChange={(status) => patch({ status: status as IdeaStatus })}
            >
              <SelectTrigger id="idea-status" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {IDEA_STATUSES.map((status) => (
                  <SelectItem key={status} value={status}>
                    {IDEA_STATUS_LABEL[status]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>

          <Field label="Priorytet" htmlFor="idea-priority">
            <Select
              value={form.priority}
              onValueChange={(priority) => patch({ priority: priority as IdeaPriority })}
            >
              <SelectTrigger id="idea-priority" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {IDEA_PRIORITIES.map((priority) => (
                  <SelectItem key={priority} value={priority}>
                    {IDEA_PRIORITY_LABEL[priority]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
        </div>

        <NoteField
          id="idea-detail"
          label="Szczegóły"
          value={form.detail}
          onChange={(detail) => patch({ detail })}
          rows={4}
        />
      </EntityDialog>
    </div>
  )
}
