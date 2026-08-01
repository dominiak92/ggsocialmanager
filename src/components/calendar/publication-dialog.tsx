import { Trash2Icon } from 'lucide-react'
import { useEffect, useState } from 'react'

import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { postTypeColorClass, type PublicationStatus } from '@/domain/enums'
import type {
  Channel,
  Contest,
  PostType,
  Publication,
  PublicationDraft,
  SportEvent,
} from '@/domain/models'
import { formatDayLong, fromDateKey, toDateKey } from '@/lib/dates'
import { cn } from '@/lib/utils'

/**
 * Co otwiera dialog. Rozdzielenie na dwa warianty (zamiast `publication?`)
 * sprawia, że TypeScript pilnuje, iż w trybie edycji wpis NA PEWNO jest.
 */
export type PublicationTarget =
  | { mode: 'create'; publishOn: string; channelId: string }
  | { mode: 'edit'; publication: Publication }

type Props = {
  target: PublicationTarget | null
  channels: Channel[]
  postTypes: PostType[]
  events: SportEvent[]
  contests: Contest[]
  onClose: () => void
  onCreate: (draft: PublicationDraft) => Promise<unknown>
  onUpdate: (id: string, patch: Partial<Publication>) => Promise<unknown>
  onDelete: (id: string) => Promise<unknown>
}

/** `Select` nie umie wartości pustej — brak powiązania trzymamy tym tokenem. */
const NONE = '__none__'

type FormState = {
  channelId: string
  publishOn: string
  postTypeId: string | null
  status: PublicationStatus
  title: string
  url: string
  note: string
  eventId: string | null
  contestId: string | null
}

/**
 * Domyślny status zależy od daty: wpis na dziś lub wstecz to relacja z tego,
 * co już poszło, a na przyszłość — plan. Bez tego przy codziennym odhaczaniu
 * trzeba by za każdym razem przestawiać przełącznik.
 */
function defaultStatus(publishOn: string): PublicationStatus {
  return publishOn <= toDateKey(new Date()) ? 'published' : 'planned'
}

function initialForm(target: PublicationTarget): FormState {
  if (target.mode === 'edit') {
    const { publication } = target
    return {
      channelId: publication.channelId,
      publishOn: publication.publishOn,
      postTypeId: publication.postTypeId,
      status: publication.status,
      title: publication.title,
      url: publication.url,
      note: publication.note,
      eventId: publication.eventId,
      contestId: publication.contestId,
    }
  }

  return {
    channelId: target.channelId,
    publishOn: target.publishOn,
    postTypeId: null,
    status: defaultStatus(target.publishOn),
    title: '',
    url: '',
    note: '',
    eventId: null,
    contestId: null,
  }
}

export function PublicationDialog({
  target,
  channels,
  postTypes,
  events,
  contests,
  onClose,
  onCreate,
  onUpdate,
  onDelete,
}: Props) {
  const [form, setForm] = useState<FormState | null>(null)
  const [saving, setSaving] = useState(false)

  // Reset przy każdym otwarciu — inaczej dialog pamiętałby poprzedni wpis.
  useEffect(() => {
    setForm(target ? initialForm(target) : null)
  }, [target])

  if (!target || !form) return null

  const isEdit = target.mode === 'edit'
  const patch = (next: Partial<FormState>) =>
    setForm((prev) => (prev ? { ...prev, ...next } : prev))

  const save = async () => {
    setSaving(true)
    try {
      if (target.mode === 'edit') {
        await onUpdate(target.publication.id, {
          channelId: form.channelId,
          publishOn: form.publishOn,
          postTypeId: form.postTypeId,
          status: form.status,
          title: form.title.trim(),
          url: form.url.trim(),
          note: form.note.trim(),
          eventId: form.eventId,
          contestId: form.contestId,
        })
      } else {
        await onCreate({
          channelId: form.channelId,
          publishOn: form.publishOn,
          postTypeId: form.postTypeId,
          status: form.status,
          title: form.title.trim(),
          url: form.url.trim(),
          note: form.note.trim(),
          eventId: form.eventId,
          contestId: form.contestId,
        })
      }
      onClose()
    } catch {
      // Komunikat pokazuje strona — hook trzyma ostatni błąd.
    } finally {
      setSaving(false)
    }
  }

  const remove = async () => {
    if (target.mode !== 'edit') return
    setSaving(true)
    try {
      await onDelete(target.publication.id)
      onClose()
    } catch {
      // jw.
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      {/* Stała wysokość: nagłówek i stopka stoją, przewija się tylko środek.
          Bez tego dialog rósł i kurczył się przy zmianie treści (inna liczba
          rodzajów, dłuższa notatka), przez co przyciski skakały pod kursorem. */}
      <DialogContent className="flex max-h-[85dvh] flex-col gap-0 sm:max-w-lg">
        <DialogHeader className="shrink-0">
          <DialogTitle>{isEdit ? 'Edytuj wpis' : 'Nowy wpis'}</DialogTitle>
          <DialogDescription className="capitalize">
            {formatDayLong(fromDateKey(form.publishOn))}
          </DialogDescription>
        </DialogHeader>

        <div className="min-h-0 flex-1 space-y-4 overflow-y-auto py-4">
          <div className="space-y-2">
            <Label htmlFor="channel">Kanał</Label>
            <Select value={form.channelId} onValueChange={(value) => patch({ channelId: value })}>
              <SelectTrigger id="channel" className="w-full">
                <SelectValue placeholder="Wybierz kanał" />
              </SelectTrigger>
              <SelectContent>
                {channels.map((channel) => (
                  <SelectItem key={channel.id} value={channel.id}>
                    {channel.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Rodzaj</Label>
            <div className="flex flex-wrap gap-1.5">
              {postTypes.map((postType) => {
                const selected = form.postTypeId === postType.id
                return (
                  <button
                    key={postType.id}
                    type="button"
                    onClick={() => patch({ postTypeId: selected ? null : postType.id })}
                    className={cn(
                      'rounded-md border px-2.5 py-1 text-xs font-medium transition',
                      'focus-visible:ring-ring focus-visible:ring-2 focus-visible:outline-none',
                      selected
                        ? postTypeColorClass(postType.color)
                        : 'border-border text-muted-foreground hover:bg-accent',
                    )}
                    aria-pressed={selected}
                  >
                    {postType.name}
                  </button>
                )
              })}
            </div>
          </div>

          <div className="space-y-2">
            <Label>Status</Label>
            <div className="grid grid-cols-2 gap-1.5">
              {(['published', 'planned'] as const).map((status) => (
                <Button
                  key={status}
                  type="button"
                  variant={form.status === status ? 'default' : 'outline'}
                  onClick={() => patch({ status })}
                >
                  {status === 'published' ? 'Opublikowane' : 'Zaplanowane'}
                </Button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="title">Co poszło</Label>
            <Input
              id="title"
              value={form.title}
              onChange={(event) => patch({ title: event.target.value })}
              placeholder="np. Rashguard Ronin — zapowiedź"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="url">Link</Label>
            <Input
              id="url"
              value={form.url}
              onChange={(event) => patch({ url: event.target.value })}
              placeholder="https://..."
            />
          </div>

          {/* Powiązanie z wydarzeniem — z tego liczy się wskaźnik nagłośnienia
              na liście eventów i sygnał „event bez zapowiedzi" na pulpicie. */}
          {events.length > 0 && (
            <div className="space-y-2">
              <Label htmlFor="event">Dotyczy eventu</Label>
              <Select
                value={form.eventId ?? NONE}
                onValueChange={(value) => patch({ eventId: value === NONE ? null : value })}
              >
                <SelectTrigger id="event" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={NONE}>Bez powiązania</SelectItem>
                  {events.map((event) => (
                    <SelectItem key={event.id} value={event.id}>
                      {event.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {contests.length > 0 && (
            <div className="space-y-2">
              <Label htmlFor="contest">Dotyczy konkursu</Label>
              <Select
                value={form.contestId ?? NONE}
                onValueChange={(value) => patch({ contestId: value === NONE ? null : value })}
              >
                <SelectTrigger id="contest" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={NONE}>Bez powiązania</SelectItem>
                  {contests.map((contest) => (
                    <SelectItem key={contest.id} value={contest.id}>
                      {contest.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="note">Notatka</Label>
            <Textarea
              id="note"
              value={form.note}
              onChange={(event) => patch({ note: event.target.value })}
              rows={2}
            />
          </div>
        </div>

        <DialogFooter className="shrink-0 gap-2 sm:justify-between">
          {isEdit ? (
            <Button variant="ghost" onClick={remove} disabled={saving} className="text-destructive">
              <Trash2Icon />
              Usuń
            </Button>
          ) : (
            <span />
          )}
          <div className="flex gap-2">
            <Button variant="outline" onClick={onClose} disabled={saving}>
              Anuluj
            </Button>
            <Button onClick={save} disabled={saving}>
              Zapisz
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
