import { LightbulbIcon, MessageSquareIcon, PlusIcon } from 'lucide-react'
import { useMemo, useState } from 'react'

import { EntityDialog } from '@/components/shared/entity-dialog'
import { Field, NoteField, TextField } from '@/components/shared/field'
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
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
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
import { cn } from '@/lib/utils'

function emptyDraft(): IdeaDraft {
  return { title: '', detail: '', kind: 'idea', status: 'new', priority: 'normal' }
}

type Target = { mode: 'create' } | { mode: 'edit'; idea: Idea }

type Filter = 'open' | 'all'

const PRIORITY_ORDER: Record<IdeaPriority, number> = { high: 0, normal: 1, low: 2 }

export function IdeasPage() {
  const { items, error, loading, create, update, remove } = useIdeas()
  const [filter, setFilter] = useState<Filter>('open')
  const [target, setTarget] = useState<Target | null>(null)
  const [form, setForm] = useState<IdeaDraft>(emptyDraft)
  const [saving, setSaving] = useState(false)

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

  const openCreate = () => {
    setForm(emptyDraft())
    setTarget({ mode: 'create' })
  }

  const openEdit = (idea: Idea) => {
    const { id: _id, ...draft } = idea
    setForm(draft)
    setTarget({ mode: 'edit', idea })
  }

  const save = async () => {
    if (!target || !form.title.trim()) return
    setSaving(true)
    try {
      const payload = { ...form, title: form.title.trim() }
      if (target.mode === 'edit') await update(target.idea.id, payload)
      else await create(payload)
      setTarget(null)
    } catch {
      // Komunikat trzyma hook.
    } finally {
      setSaving(false)
    }
  }

  const removeCurrent = async () => {
    if (target?.mode !== 'edit') return
    setSaving(true)
    try {
      await remove(target.idea.id)
      setTarget(null)
    } catch {
      // jw.
    } finally {
      setSaving(false)
    }
  }

  const patch = (next: Partial<IdeaDraft>) => setForm((prev) => ({ ...prev, ...next }))

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start gap-3">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold tracking-tight">Pomysły</h1>
          <p className="text-muted-foreground text-sm">
            Wrzutki na przyszłe posty i tematy do przegadania z zespołem.
          </p>
        </div>
        <div className="ml-auto flex flex-wrap items-center gap-2">
          <Tabs value={filter} onValueChange={(value) => setFilter(value as Filter)}>
            <TabsList>
              <TabsTrigger value="open">Otwarte</TabsTrigger>
              <TabsTrigger value="all">Wszystkie</TabsTrigger>
            </TabsList>
          </Tabs>
          <Button onClick={openCreate}>
            <PlusIcon />
            Dodaj
          </Button>
        </div>
      </div>

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
                onClick={() => openEdit(idea)}
                className={cn(
                  'hover:bg-accent focus-visible:ring-ring flex w-full items-start gap-3 rounded-lg border p-3 text-left transition focus-visible:ring-2 focus-visible:outline-none',
                  (idea.status === 'done' || idea.status === 'dropped') && 'opacity-55',
                )}
              >
                {idea.kind === 'idea' ? (
                  <LightbulbIcon className="text-muted-foreground mt-0.5 size-4 shrink-0" />
                ) : (
                  <MessageSquareIcon className="text-muted-foreground mt-0.5 size-4 shrink-0" />
                )}

                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-medium">{idea.title}</span>
                    {idea.priority === 'high' && <Badge variant="destructive">Wysoki</Badge>}
                    <Badge variant="outline">{IDEA_STATUS_LABEL[idea.status]}</Badge>
                  </div>
                  {idea.detail && (
                    <p className="text-muted-foreground mt-0.5 line-clamp-2 text-xs">
                      {idea.detail}
                    </p>
                  )}
                </div>

                <Badge variant="secondary" className="shrink-0">
                  {IDEA_KIND_LABEL[idea.kind]}
                </Badge>
              </button>
            </li>
          ))}
        </ul>
      )}

      <EntityDialog
        open={target !== null}
        title={target?.mode === 'edit' ? 'Edytuj wpis' : 'Nowy wpis'}
        saving={saving}
        canSave={form.title.trim().length > 0}
        onClose={() => setTarget(null)}
        onSave={save}
        onDelete={target?.mode === 'edit' ? removeCurrent : undefined}
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
