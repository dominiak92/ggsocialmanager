import {
  CalendarClockIcon,
  ExternalLinkIcon,
  MegaphoneIcon,
  PlusIcon,
  SpeakerIcon,
} from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router'

import { EntityDialog } from '@/components/shared/entity-dialog'
import { FilterChips } from '@/components/shared/filter-chips'
import { Field, NoteField, NumberField, TextField } from '@/components/shared/field'
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
import { Switch } from '@/components/ui/switch'
import { EVENT_KINDS, EVENT_KIND_LABEL, type EventKind } from '@/domain/enums'
import type { Publication, SportEvent, SportEventDraft } from '@/domain/models'
import { eventPromo } from '@/domain/reminders'
import { dataProvider } from '@/data/provider'
import { useEvents } from '@/hooks/use-domain'
import { useEntityForm } from '@/hooks/use-entity-form'
import { fromDateKey, toDateKey } from '@/lib/dates'
import { cn } from '@/lib/utils'

function emptyDraft(): SportEventDraft {
  return {
    name: '',
    kind: 'zawody',
    startsOn: toDateKey(new Date()),
    endsOn: null,
    place: '',
    isSponsored: true,
    url: '',
    note: '',
    promoLeadDays: 14,
  }
}

type Range = 'upcoming' | 'past' | 'all'

export function EventsPage() {
  const collection = useEvents()
  const { items, error, loading } = collection
  const [range, setRange] = useState<Range>('upcoming')
  const [linked, setLinked] = useState<Publication[]>([])

  const dialog = useEntityForm<SportEvent, SportEventDraft>({
    collection,
    empty: emptyDraft,
    toDraft: ({ id: _id, ...draft }) => draft,
    normalize: (draft) => ({ ...draft, name: draft.name.trim(), endsOn: draft.endsOn || null }),
    isValid: (draft) => draft.name.trim().length > 0,
  })
  const { form, patch } = dialog

  // Nagłośnienie liczymy z publikacji powiązanych z eventami — nie z okna
  // kalendarza, bo zapowiedź gali mogła pójść dwa miesiące wcześniej.
  useEffect(() => {
    dataProvider.publications
      .listLinked()
      .then(setLinked)
      .catch(() => setLinked([]))
  }, [])

  const today = useMemo(() => new Date(), [])
  const promo = useMemo(() => eventPromo(items, linked, today), [items, linked, today])

  const upcomingCount = useMemo(() => promo.filter((entry) => entry.daysUntil >= 0).length, [promo])

  /**
   * Domyślnie tylko nadchodzące. Lista jest posortowana rosnąco po dacie, więc
   * bez tego filtra minione wydarzenia z czasem urosłyby na SZCZYCIE ekranu
   * i trzeba by je przewijać, żeby dojść do tego, co dopiero będzie.
   */
  const visible = useMemo(() => {
    if (range === 'all') return promo
    if (range === 'past') return promo.filter((entry) => entry.daysUntil < 0).toReversed()
    return promo.filter((entry) => entry.daysUntil >= 0)
  }, [promo, range])

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start gap-3">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold tracking-tight">Eventy</h1>
          <p className="text-muted-foreground text-sm">
            Zawody, gale i campy. Licznik przy każdym pokazuje, na ilu kanałach był nagłaśniany —
            liczony z publikacji, nie odhaczany ręcznie.
          </p>
        </div>
        <Button className="ml-auto" onClick={() => dialog.openCreate()}>
          <PlusIcon />
          Dodaj event
        </Button>
      </div>

      {error && (
        <p className="border-destructive/40 bg-destructive/10 text-destructive rounded-md border px-3 py-2 text-sm">
          {error}
        </p>
      )}

      <FilterChips
        ariaLabel="Zakres wydarzeń"
        value={range}
        onChange={setRange}
        options={[
          { value: 'upcoming', label: 'Nadchodzące', count: upcomingCount },
          { value: 'past', label: 'Minione', count: promo.length - upcomingCount },
          { value: 'all', label: 'Wszystkie', count: promo.length },
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
              ? 'Nie ma jeszcze żadnych wydarzeń. Dodaj pierwsze zawody albo galę.'
              : 'Nic w tym zakresie.'}
          </CardContent>
        </Card>
      ) : (
        <ul className="space-y-2">
          {visible.map(({ event, daysUntil, promoCount, channelCount }) => {
            const past = daysUntil < 0
            const needsPromo = !past && promoCount === 0 && daysUntil <= event.promoLeadDays

            return (
              <li key={event.id} className="flex items-stretch gap-2">
                <button
                  type="button"
                  onClick={() => dialog.openEdit(event)}
                  className={cn(
                    'hover:bg-accent focus-visible:ring-ring flex w-full flex-wrap items-center gap-3 rounded-lg border p-3 text-left transition focus-visible:ring-2 focus-visible:outline-none',
                    needsPromo && 'border-destructive/50 bg-destructive/5',
                    past && 'opacity-60',
                  )}
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-medium">{event.name}</span>
                      <Badge variant="secondary">{EVENT_KIND_LABEL[event.kind]}</Badge>
                      {event.isSponsored && <Badge variant="outline">sponsorujemy</Badge>}
                    </div>
                    <p className="text-muted-foreground mt-0.5 text-xs">
                      {fromDateKey(event.startsOn).toLocaleDateString('pl-PL', {
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric',
                      })}
                      {event.endsOn
                        ? ` – ${fromDateKey(event.endsOn).toLocaleDateString('pl-PL', { day: 'numeric', month: 'long' })}`
                        : ''}
                      {event.place ? ` · ${event.place}` : ''}
                      {' · '}
                      {past
                        ? `${Math.abs(daysUntil)} dni temu`
                        : daysUntil === 0
                          ? 'dziś'
                          : `za ${daysUntil} dni`}
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    {event.url && (
                      <ExternalLinkIcon className="text-muted-foreground size-3.5 shrink-0" />
                    )}
                    <Badge
                      variant={
                        promoCount === 0 ? (needsPromo ? 'destructive' : 'outline') : 'default'
                      }
                      className="gap-1"
                    >
                      <MegaphoneIcon className="size-3" />
                      {promoCount === 0
                        ? 'brak zapowiedzi'
                        : `${promoCount} na ${channelCount} kan.`}
                    </Badge>
                  </div>
                </button>

                {/* Domkniecie petli: z wydarzenia od razu do wpisu w kalendarzu,
                    z gotowym powiazaniem. Bez tego trzeba bylo pamietac nazwe
                    eventu i szukac jej w liscie rozwijanej po drugiej stronie. */}
                {!past && (
                  <Button asChild variant="outline" size="sm" className="shrink-0 self-center">
                    <Link
                      to={`/kalendarz?event=${event.id}&tytul=${encodeURIComponent(event.name)}`}
                    >
                      <SpeakerIcon />
                      Zapowiedz
                    </Link>
                  </Button>
                )}
              </li>
            )
          })}
        </ul>
      )}

      <EntityDialog
        open={dialog.target !== null}
        title={dialog.target?.mode === 'edit' ? 'Edytuj event' : 'Nowy event'}
        description="Nagłośnienie liczy się z publikacji przypisanych do tego eventu w kalendarzu."
        saving={dialog.saving}
        canSave={dialog.canSave}
        onClose={dialog.close}
        onSave={dialog.save}
        onDelete={dialog.target?.mode === 'edit' ? dialog.removeCurrent : undefined}
      >
        <TextField
          id="event-name"
          label="Nazwa"
          value={form.name}
          onChange={(name) => patch({ name })}
          placeholder="np. ADCC Polish Trials"
        />

        <Field label="Rodzaj" htmlFor="event-kind">
          <Select value={form.kind} onValueChange={(kind) => patch({ kind: kind as EventKind })}>
            <SelectTrigger id="event-kind" className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {EVENT_KINDS.map((kind) => (
                <SelectItem key={kind} value={kind}>
                  {EVENT_KIND_LABEL[kind]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>

        <div className="grid gap-4 sm:grid-cols-2">
          <TextField
            id="event-starts"
            label="Początek"
            type="date"
            value={form.startsOn}
            onChange={(startsOn) => patch({ startsOn })}
          />
          <TextField
            id="event-ends"
            label="Koniec"
            type="date"
            value={form.endsOn ?? ''}
            onChange={(endsOn) => patch({ endsOn: endsOn || null })}
            hint="Puste = wydarzenie jednodniowe"
          />
        </div>

        <TextField
          id="event-place"
          label="Miejsce"
          value={form.place}
          onChange={(place) => patch({ place })}
          placeholder="np. Warszawa"
        />

        <TextField
          id="event-url"
          label="Link"
          type="url"
          value={form.url}
          onChange={(url) => patch({ url })}
          placeholder="https://..."
        />

        <NumberField
          id="event-lead"
          label="Zacznij przypominać na ile dni przed"
          value={form.promoLeadDays}
          onChange={(promoLeadDays) => patch({ promoLeadDays })}
          hint="Pulpit upomni się, jeśli w tym oknie nie ma ani jednej publikacji o evencie."
        />

        <Field label="Sponsorujemy" htmlFor="event-sponsored">
          <div className="flex items-center gap-2">
            <Switch
              id="event-sponsored"
              checked={form.isSponsored}
              onCheckedChange={(isSponsored) => patch({ isSponsored })}
            />
            <span className="text-muted-foreground text-sm">
              <CalendarClockIcon className="mr-1 inline size-3.5" />
              {form.isSponsored ? 'tak' : 'nie'}
            </span>
          </div>
        </Field>

        <NoteField id="event-note" value={form.note} onChange={(note) => patch({ note })} />
      </EntityDialog>
    </div>
  )
}
