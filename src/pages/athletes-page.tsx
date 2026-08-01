import { CheckIcon, PlusIcon, SearchIcon, StarIcon, Undo2Icon } from 'lucide-react'
import { useCallback, useEffect, useMemo, useState } from 'react'

import { EntityDialog } from '@/components/shared/entity-dialog'
import { FilterChips } from '@/components/shared/filter-chips'
import { Field, NoteField, NumberField, TextField } from '@/components/shared/field'
import { SocialLink } from '@/components/shared/social-link'
import { TagInput } from '@/components/shared/tag-input'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { Switch } from '@/components/ui/switch'
import { dataProvider } from '@/data/provider'
import type { Athlete, AthleteCheck, AthleteDraft } from '@/domain/models'
import { athletesDue, disciplineTags } from '@/domain/reminders'
import { useAthletes } from '@/hooks/use-domain'
import { daysBetween, fromDateKey, toDateKey } from '@/lib/dates'
import { cn } from '@/lib/utils'

function emptyDraft(): AthleteDraft {
  return {
    name: '',
    disciplines: [],
    instagramUrl: '',
    facebookUrl: '',
    checkEveryDays: 7,
    isActive: true,
    isStarred: false,
    note: '',
  }
}

type Target = { mode: 'create' } | { mode: 'edit'; athlete: Athlete }

const ALL = '__all__'

/**
 * Lista sponsorowanych zawodników z odhaczaniem przeglądu profilu.
 *
 * Kolejność jest istotna: gwiazdkowani, potem zaległi, potem reszta.
 * Alfabetyczna lista wyglądałaby porządniej, ale nie odpowiadałaby na pytanie
 * „kogo dziś odwiedzić", a po to ten ekran istnieje.
 */
export function AthletesPage() {
  const { items, error, loading, create, update, remove } = useAthletes()
  const [lastChecks, setLastChecks] = useState<Map<string, string>>(new Map())
  const [target, setTarget] = useState<Target | null>(null)
  const [form, setForm] = useState<AthleteDraft>(emptyDraft)
  const [saving, setSaving] = useState(false)
  const [toDelete, setToDelete] = useState<Athlete | null>(null)
  const [sport, setSport] = useState<string>(ALL)
  const [query, setQuery] = useState('')
  const [history, setHistory] = useState<AthleteCheck[]>([])

  const loadChecks = useCallback(() => {
    dataProvider.athletes
      .lastCheckPerAthlete()
      .then(setLastChecks)
      .catch(() => setLastChecks(new Map()))
  }, [])

  useEffect(loadChecks, [loadChecks])

  const today = useMemo(() => new Date(), [])
  const dueIds = useMemo(
    () => new Set(athletesDue(items, lastChecks, today).map((entry) => entry.athlete.id)),
    [items, lastChecks, today],
  )
  const tags = useMemo(() => disciplineTags(items), [items])
  const allTags = useMemo(() => tags.map((entry) => entry.tag), [tags])

  const visible = useMemo(() => {
    // Szukamy i po nazwisku, i po sportach — „BJJ" w polu szukania ma dawać
    // ten sam efekt co kliknięcie chipa, bez zgadywania, gdzie się kliknąć.
    const needle = query.trim().toLowerCase()
    const filtered = items.filter((athlete) => {
      const matchesSport = sport === ALL || athlete.disciplines.includes(sport)
      const matchesQuery =
        !needle ||
        athlete.name.toLowerCase().includes(needle) ||
        athlete.disciplines.some((tag) => tag.toLowerCase().includes(needle))
      return matchesSport && matchesQuery
    })

    return filtered.toSorted((a, b) => {
      if (a.isStarred !== b.isStarred) return a.isStarred ? -1 : 1
      const aDue = dueIds.has(a.id) ? 0 : 1
      const bDue = dueIds.has(b.id) ? 0 : 1
      return aDue - bDue || a.name.localeCompare(b.name, 'pl')
    })
  }, [items, sport, dueIds, query])

  /** Odhaczenie: dopisuje wpis do logu, nie nadpisuje kolumny. */
  const markChecked = async (athlete: Athlete) => {
    const day = toDateKey(new Date())
    await dataProvider.athletes.addCheck(athlete.id, day, '').catch(() => null)
    setLastChecks((prev) => new Map(prev).set(athlete.id, day))
  }

  const toggleStar = async (athlete: Athlete) => {
    await update(athlete.id, { isStarred: !athlete.isStarred }).catch(() => null)
  }

  const openCreate = () => {
    setForm(emptyDraft())
    setHistory([])
    setTarget({ mode: 'create' })
  }

  const openEdit = (athlete: Athlete) => {
    const { id: _id, ...draft } = athlete
    setForm(draft)
    setTarget({ mode: 'edit', athlete })
    // Historia przeglądów jest po to, żeby dało się cofnąć omyłkowe kliknięcie
    // „Przejrzany" — bez niej odhaczenie było nieodwracalne.
    dataProvider.athletes
      .listChecks(athlete.id)
      .then(setHistory)
      .catch(() => setHistory([]))
  }

  const save = async () => {
    if (!target || !form.name.trim()) return
    setSaving(true)
    try {
      const payload = { ...form, name: form.name.trim() }
      if (target.mode === 'edit') await update(target.athlete.id, payload)
      else await create(payload)
      setTarget(null)
    } catch {
      // Komunikat trzyma hook.
    } finally {
      setSaving(false)
    }
  }

  const confirmDelete = async () => {
    if (!toDelete) return
    try {
      await remove(toDelete.id)
      setTarget(null)
    } catch {
      // Komunikat trzyma hook.
    } finally {
      setToDelete(null)
    }
  }

  const undoCheck = async (check: AthleteCheck) => {
    await dataProvider.athletes.removeCheck(check.id).catch(() => null)
    setHistory((prev) => prev.filter((entry) => entry.id !== check.id))
    // Ostatni przegląd mógł właśnie zniknąć — przeliczamy od nowa.
    loadChecks()
  }

  const patch = (next: Partial<AthleteDraft>) => setForm((prev) => ({ ...prev, ...next }))

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start gap-3">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold tracking-tight">Zawodnicy</h1>
          <p className="text-muted-foreground text-sm">
            Kogo trzeba dziś odwiedzić. Gwiazdka i zaległości idą na górę.
          </p>
        </div>
        <Button className="ml-auto" onClick={openCreate}>
          <PlusIcon />
          Dodaj zawodnika
        </Button>
      </div>

      {error && (
        <p className="border-destructive/40 bg-destructive/10 text-destructive rounded-md border px-3 py-2 text-sm">
          {error}
        </p>
      )}

      <div className="relative">
        <SearchIcon className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2" />
        <Input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Szukaj po nazwisku albo sporcie"
          aria-label="Szukaj zawodnika"
          className="pl-9"
        />
      </div>

      <FilterChips
        ariaLabel="Filtr sportów"
        value={sport}
        onChange={setSport}
        options={[
          { value: ALL, label: 'Wszyscy', count: items.length },
          ...tags.map(({ tag, count }) => ({ value: tag, label: tag, count })),
        ]}
      />

      {loading ? (
        <div className="space-y-2">
          {Array.from({ length: 5 }, (_, index) => (
            <Skeleton key={index} className="h-16 w-full" />
          ))}
        </div>
      ) : visible.length === 0 ? (
        <Card>
          <CardContent className="text-muted-foreground py-10 text-center text-sm">
            {items.length === 0
              ? 'Nie ma jeszcze żadnego zawodnika na liście.'
              : 'Nikt nie pasuje do tego wyszukiwania.'}
          </CardContent>
        </Card>
      ) : (
        <ul className="space-y-2">
          {visible.map((athlete) => {
            const last = lastChecks.get(athlete.id) ?? null
            const daysSince = last ? daysBetween(fromDateKey(last), today) : null
            const due = dueIds.has(athlete.id)

            return (
              <li
                key={athlete.id}
                className={cn(
                  'flex flex-wrap items-center gap-2 rounded-lg border p-3',
                  due && 'border-destructive/50 bg-destructive/5',
                  !athlete.isActive && 'opacity-50',
                )}
              >
                <Button
                  variant="ghost"
                  size="icon-sm"
                  onClick={() => void toggleStar(athlete)}
                  aria-label={
                    athlete.isStarred
                      ? `Zdejmij gwiazdkę: ${athlete.name}`
                      : `Oznacz jako ważnego: ${athlete.name}`
                  }
                  aria-pressed={athlete.isStarred}
                  className="shrink-0"
                >
                  <StarIcon
                    className={cn(
                      'size-4',
                      athlete.isStarred
                        ? 'fill-amber-400 text-amber-500'
                        : 'text-muted-foreground/40',
                    )}
                  />
                </Button>

                <button
                  type="button"
                  onClick={() => openEdit(athlete)}
                  className="focus-visible:ring-ring min-w-0 flex-1 rounded text-left focus-visible:ring-2 focus-visible:outline-none"
                >
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className="font-medium">{athlete.name}</span>
                    {athlete.disciplines.map((tag) => (
                      <Badge key={tag} variant="secondary" className="text-[11px]">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                  <p className="text-muted-foreground mt-0.5 text-xs">
                    {daysSince === null
                      ? 'profil nigdy nieprzejrzany'
                      : daysSince === 0
                        ? 'przejrzany dziś'
                        : `przejrzany ${daysSince} dni temu`}
                    {athlete.checkEveryDays > 0 ? ` · rytm ${athlete.checkEveryDays} dn.` : ''}
                  </p>
                </button>

                <div className="flex items-center gap-0.5">
                  <SocialLink kind="instagram" url={athlete.instagramUrl} label={athlete.name} />
                  <SocialLink kind="facebook" url={athlete.facebookUrl} label={athlete.name} />
                </div>

                <Button
                  variant={due ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => void markChecked(athlete)}
                >
                  <CheckIcon />
                  Przejrzany
                </Button>
              </li>
            )
          })}
        </ul>
      )}

      <EntityDialog
        open={target !== null}
        title={target?.mode === 'edit' ? 'Edytuj zawodnika' : 'Nowy zawodnik'}
        saving={saving}
        canSave={form.name.trim().length > 0}
        onClose={() => setTarget(null)}
        onSave={save}
        onDelete={target?.mode === 'edit' ? () => setToDelete(target.athlete) : undefined}
      >
        <TextField
          id="athlete-name"
          label="Imię i nazwisko"
          value={form.name}
          onChange={(name) => patch({ name })}
        />

        <TagInput
          id="athlete-disciplines"
          label="Sporty"
          value={form.disciplines}
          onChange={(disciplines) => patch({ disciplines })}
          suggestions={allTags}
          hint="Kliknij podpowiedź albo dopisz własny. Po tych tagach filtruje się lista."
        />

        <TextField
          id="athlete-ig"
          label="Instagram"
          type="url"
          value={form.instagramUrl}
          onChange={(instagramUrl) => patch({ instagramUrl })}
          placeholder="https://instagram.com/..."
        />
        <TextField
          id="athlete-fb"
          label="Facebook"
          type="url"
          value={form.facebookUrl}
          onChange={(facebookUrl) => patch({ facebookUrl })}
          placeholder="https://facebook.com/..."
        />

        <NumberField
          id="athlete-rhythm"
          label="Przeglądaj profil co ile dni"
          value={form.checkEveryDays}
          onChange={(checkEveryDays) => patch({ checkEveryDays })}
          hint="0 wyłącza przypominanie dla tego zawodnika."
        />

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Ważny (gwiazdka)" htmlFor="athlete-starred">
            <Switch
              id="athlete-starred"
              checked={form.isStarred}
              onCheckedChange={(isStarred) => patch({ isStarred })}
            />
          </Field>
          <Field label="Aktywny" htmlFor="athlete-active">
            <Switch
              id="athlete-active"
              checked={form.isActive}
              onCheckedChange={(isActive) => patch({ isActive })}
            />
          </Field>
        </div>

        <NoteField id="athlete-note" value={form.note} onChange={(note) => patch({ note })} />

        {target?.mode === 'edit' && (
          <Field label="Historia przeglądów">
            {history.length === 0 ? (
              <p className="text-muted-foreground text-xs">Jeszcze nic nieodnotowane.</p>
            ) : (
              <ul className="divide-y rounded-md border">
                {history.slice(0, 10).map((check) => (
                  <li key={check.id} className="flex items-center gap-2 px-3 py-1.5 text-sm">
                    <span className="flex-1">
                      {fromDateKey(check.checkedOn).toLocaleDateString('pl-PL')}
                    </span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => void undoCheck(check)}
                      aria-label={`Cofnij przegląd z ${check.checkedOn}`}
                    >
                      <Undo2Icon />
                      Cofnij
                    </Button>
                  </li>
                ))}
              </ul>
            )}
          </Field>
        )}
      </EntityDialog>

      <AlertDialog open={toDelete !== null} onOpenChange={(open) => !open && setToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Usunąć zawodnika „{toDelete?.name}"?</AlertDialogTitle>
            <AlertDialogDescription>
              Zniknie razem z całą historią przeglądów jego profilu. Jeśli chcesz go tylko odstawić
              na bok, wyłącz przełącznik „Aktywny" zamiast kasować.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Anuluj</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete}>Usuń</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
