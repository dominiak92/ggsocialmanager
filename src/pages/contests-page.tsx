import { GiftIcon, PlusIcon, SpeakerIcon, TriangleAlertIcon } from 'lucide-react'
import { useMemo, useState } from 'react'
import { Link } from 'react-router'

import { EntityDialog } from '@/components/shared/entity-dialog'
import { FilterChips } from '@/components/shared/filter-chips'
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
import { CONTEST_STATUSES, CONTEST_STATUS_LABEL, type ContestStatus } from '@/domain/enums'
import type { Contest, ContestDraft } from '@/domain/models'
import { CONTEST_ALERT_LABEL, contestsNeedingAction } from '@/domain/reminders'
import { useChannels } from '@/hooks/use-channels'
import { useContests } from '@/hooks/use-domain'
import { useEntityForm } from '@/hooks/use-entity-form'
import { addDays, fromDateKey, toDateKey } from '@/lib/dates'
import { cn } from '@/lib/utils'

const ALL_CHANNELS = '__all__'

function emptyDraft(): ContestDraft {
  return {
    name: '',
    channelId: null,
    startsOn: toDateKey(new Date()),
    // Tydzień to typowy czas trwania konkursu na fanpage'u.
    endsOn: toDateKey(addDays(new Date(), 7)),
    prize: '',
    status: 'running',
    winnerName: '',
    winnerContact: '',
    winnerAddress: '',
    trackingCode: '',
    url: '',
    note: '',
  }
}

type Scope = 'open' | 'all'

const STATUS_VARIANT: Record<ContestStatus, 'default' | 'secondary' | 'outline' | 'destructive'> = {
  running: 'secondary',
  picking: 'destructive',
  picked: 'default',
  sent: 'outline',
}

export function ContestsPage() {
  const collection = useContests()
  const { items, error, loading, update } = collection
  const { channels } = useChannels()
  const [scope, setScope] = useState<Scope>('open')

  const dialog = useEntityForm<Contest, ContestDraft>({
    collection,
    empty: emptyDraft,
    toDraft: ({ id: _id, ...draft }) => draft,
    normalize: (draft) => ({ ...draft, name: draft.name.trim() }),
    isValid: (draft) => draft.name.trim().length > 0,
  })
  const { form, patch } = dialog

  const today = useMemo(() => new Date(), [])
  const alerts = useMemo(() => contestsNeedingAction(items, today), [items, today])
  const alertById = useMemo(
    () => new Map(alerts.map((alert) => [alert.contest.id, alert])),
    [alerts],
  )

  // Domyślnie chowamy rozliczone konkursy — archiwum przykrywa to,
  // co jeszcze wymaga ruchu.
  const visible = useMemo(
    () => (scope === 'open' ? items.filter((contest) => contest.status !== 'sent') : items),
    [items, scope],
  )

  const channelName = (id: string | null) =>
    id ? (channels.find((channel) => channel.id === id)?.name ?? 'Nieznany kanał') : 'Kilka kanałów'

  /** Skrót „przesuń na kolejny etap" prosto z listy — bez otwierania dialogu. */
  const advance = async (contest: Contest) => {
    const next: Record<ContestStatus, ContestStatus> = {
      running: 'picking',
      picking: 'picked',
      picked: 'sent',
      sent: 'sent',
    }
    await update(contest.id, { status: next[contest.status] }).catch(() => {})
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start gap-3">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold tracking-tight">Konkursy</h1>
          <p className="text-muted-foreground text-sm">
            Konkurs kończy się sam, ale nie zamyka się sam — etapy prowadzą aż do wysłanej nagrody.
          </p>
        </div>
        <Button className="ml-auto" onClick={() => dialog.openCreate()}>
          <PlusIcon />
          Dodaj konkurs
        </Button>
      </div>

      {error && (
        <p className="border-destructive/40 bg-destructive/10 text-destructive rounded-md border px-3 py-2 text-sm">
          {error}
        </p>
      )}

      <FilterChips
        ariaLabel="Zakres konkursów"
        value={scope}
        onChange={setScope}
        options={[
          {
            value: 'open',
            label: 'W toku',
            count: items.filter((c) => c.status !== 'sent').length,
          },
          { value: 'all', label: 'Wszystkie', count: items.length },
        ]}
      />

      {loading ? (
        <div className="space-y-2">
          {Array.from({ length: 3 }, (_, index) => (
            <Skeleton key={index} className="h-20 w-full" />
          ))}
        </div>
      ) : visible.length === 0 ? (
        <Card>
          <CardContent className="text-muted-foreground py-10 text-center text-sm">
            {items.length === 0
              ? 'Nie ma jeszcze żadnego konkursu.'
              : 'Wszystkie konkursy rozliczone.'}
          </CardContent>
        </Card>
      ) : (
        <ul className="space-y-2">
          {visible.map((contest) => {
            const alert = alertById.get(contest.id)

            return (
              <li
                key={contest.id}
                className={cn(
                  'flex flex-wrap items-center gap-3 rounded-lg border p-3',
                  alert && 'border-destructive/50 bg-destructive/5',
                  contest.status === 'sent' && 'opacity-60',
                )}
              >
                <button
                  type="button"
                  onClick={() => dialog.openEdit(contest)}
                  className="focus-visible:ring-ring min-w-0 flex-1 text-left focus-visible:ring-2 focus-visible:outline-none"
                >
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-medium">{contest.name}</span>
                    <Badge variant={STATUS_VARIANT[contest.status]}>
                      {CONTEST_STATUS_LABEL[contest.status]}
                    </Badge>
                    {alert && (
                      <span className="text-destructive inline-flex items-center gap-1 text-xs font-medium">
                        <TriangleAlertIcon className="size-3" />
                        {CONTEST_ALERT_LABEL[alert.reason]}
                      </span>
                    )}
                  </div>
                  <p className="text-muted-foreground mt-0.5 text-xs">
                    do {fromDateKey(contest.endsOn).toLocaleDateString('pl-PL')} ·{' '}
                    {channelName(contest.channelId)}
                    {contest.prize ? ` · ${contest.prize}` : ''}
                    {contest.winnerName ? ` · zwycięzca: ${contest.winnerName}` : ''}
                  </p>
                </button>

                {contest.status === 'running' && (
                  <Button asChild variant="outline" size="sm" className="shrink-0">
                    <Link
                      to={`/kalendarz?konkurs=${contest.id}&tytul=${encodeURIComponent(contest.name)}`}
                    >
                      <SpeakerIcon />
                      Zapowiedz
                    </Link>
                  </Button>
                )}

                {contest.status !== 'sent' && (
                  <Button variant="outline" size="sm" onClick={() => void advance(contest)}>
                    {contest.status === 'running' && 'Zamknij nabór'}
                    {contest.status === 'picking' && 'Zwycięzca wybrany'}
                    {contest.status === 'picked' && 'Nagroda wysłana'}
                  </Button>
                )}
              </li>
            )
          })}
        </ul>
      )}

      <EntityDialog
        open={dialog.target !== null}
        title={dialog.target?.mode === 'edit' ? 'Edytuj konkurs' : 'Nowy konkurs'}
        saving={dialog.saving}
        canSave={dialog.canSave}
        onClose={dialog.close}
        onSave={dialog.save}
        onDelete={dialog.target?.mode === 'edit' ? dialog.removeCurrent : undefined}
      >
        <TextField
          id="contest-name"
          label="Nazwa"
          value={form.name}
          onChange={(name) => patch({ name })}
          placeholder="np. Konkurs na rocznicę"
        />

        <Field label="Kanał" htmlFor="contest-channel">
          <Select
            value={form.channelId ?? ALL_CHANNELS}
            onValueChange={(value) => patch({ channelId: value === ALL_CHANNELS ? null : value })}
          >
            <SelectTrigger id="contest-channel" className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL_CHANNELS}>Kilka kanałów</SelectItem>
              {channels
                .filter((channel) => channel.isActive)
                .map((channel) => (
                  <SelectItem key={channel.id} value={channel.id}>
                    {channel.name}
                  </SelectItem>
                ))}
            </SelectContent>
          </Select>
        </Field>

        <div className="grid gap-4 sm:grid-cols-2">
          <TextField
            id="contest-starts"
            label="Start"
            type="date"
            value={form.startsOn}
            onChange={(startsOn) => patch({ startsOn })}
          />
          <TextField
            id="contest-ends"
            label="Koniec"
            type="date"
            value={form.endsOn}
            onChange={(endsOn) => patch({ endsOn })}
          />
        </div>

        <TextField
          id="contest-prize"
          label="Nagroda"
          value={form.prize}
          onChange={(prize) => patch({ prize })}
          placeholder="np. Kimono Ground Game Rookie"
        />

        <Field label="Etap" htmlFor="contest-status">
          <Select
            value={form.status}
            onValueChange={(status) => patch({ status: status as ContestStatus })}
          >
            <SelectTrigger id="contest-status" className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {CONTEST_STATUSES.map((status) => (
                <SelectItem key={status} value={status}>
                  {CONTEST_STATUS_LABEL[status]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>

        {/* Dane zwycięzcy pokazujemy dopiero, gdy są potrzebne — przy trwającym
            konkursie tylko zaśmiecałyby formularz. */}
        {(form.status === 'picked' || form.status === 'sent' || form.winnerName) && (
          <>
            <TextField
              id="contest-winner"
              label="Zwycięzca"
              value={form.winnerName}
              onChange={(winnerName) => patch({ winnerName })}
            />
            <TextField
              id="contest-contact"
              label="Kontakt"
              value={form.winnerContact}
              onChange={(winnerContact) => patch({ winnerContact })}
              placeholder="e-mail albo profil"
            />
            <NoteField
              id="contest-address"
              label="Adres wysyłki"
              value={form.winnerAddress}
              onChange={(winnerAddress) => patch({ winnerAddress })}
              rows={3}
            />
            <TextField
              id="contest-tracking"
              label="Numer przesyłki"
              value={form.trackingCode}
              onChange={(trackingCode) => patch({ trackingCode })}
            />
          </>
        )}

        <TextField
          id="contest-url"
          label="Link do posta"
          type="url"
          value={form.url}
          onChange={(url) => patch({ url })}
          placeholder="https://..."
        />

        <NoteField id="contest-note" value={form.note} onChange={(note) => patch({ note })} />

        <p className="text-muted-foreground flex items-start gap-2 text-xs">
          <GiftIcon className="mt-0.5 size-3.5 shrink-0" />
          Adres zwycięzcy to dane osobowe. Przy obecnych ustawieniach bazy są publicznie czytelne —
          patrz AGENTS.md → „Dostęp do danych".
        </p>
      </EntityDialog>
    </div>
  )
}
