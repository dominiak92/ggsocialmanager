import { CheckIcon, LinkIcon, PlusIcon } from 'lucide-react'
import { useCallback, useEffect, useMemo, useState } from 'react'

import { EntityDialog } from '@/components/shared/entity-dialog'
import { Field, NoteField, NumberField, TextField } from '@/components/shared/field'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Switch } from '@/components/ui/switch'
import { dataProvider } from '@/data/provider'
import type { Athlete, AthleteDraft } from '@/domain/models'
import { athletesDue } from '@/domain/reminders'
import { useAthletes } from '@/hooks/use-domain'
import { daysBetween, fromDateKey, toDateKey } from '@/lib/dates'
import { cn } from '@/lib/utils'

function emptyDraft(): AthleteDraft {
  return {
    name: '',
    discipline: '',
    instagramUrl: '',
    otherUrl: '',
    checkEveryDays: 7,
    isActive: true,
    note: '',
  }
}

type Target = { mode: 'create' } | { mode: 'edit'; athlete: Athlete }

/**
 * Lista sponsorowanych zawodników z odhaczaniem przeglądu profilu.
 *
 * Kolejność jest istotna: najbardziej zaniedbani na górze. Alfabetyczna lista
 * wyglądałaby porządniej, ale nie odpowiadałaby na pytanie „kogo dziś
 * odwiedzić", a po to ten ekran istnieje.
 */
export function AthletesPage() {
  const { items, error, loading, create, update, remove } = useAthletes()
  const [lastChecks, setLastChecks] = useState<Map<string, string>>(new Map())
  const [target, setTarget] = useState<Target | null>(null)
  const [form, setForm] = useState<AthleteDraft>(emptyDraft)
  const [saving, setSaving] = useState(false)

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

  /** Odhaczenie: dopisuje wpis do logu, nie nadpisuje kolumny. */
  const markChecked = async (athlete: Athlete) => {
    const day = toDateKey(new Date())
    await dataProvider.athletes.addCheck(athlete.id, day, '').catch(() => null)
    setLastChecks((prev) => new Map(prev).set(athlete.id, day))
  }

  const openCreate = () => {
    setForm(emptyDraft())
    setTarget({ mode: 'create' })
  }

  const openEdit = (athlete: Athlete) => {
    const { id: _id, ...draft } = athlete
    setForm(draft)
    setTarget({ mode: 'edit', athlete })
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

  const removeCurrent = async () => {
    if (target?.mode !== 'edit') return
    setSaving(true)
    try {
      await remove(target.athlete.id)
      setTarget(null)
    } catch {
      // jw.
    } finally {
      setSaving(false)
    }
  }

  const patch = (next: Partial<AthleteDraft>) => setForm((prev) => ({ ...prev, ...next }))

  // Najpierw zaległi, potem reszta alfabetycznie.
  const ordered = useMemo(
    () =>
      items.toSorted((a, b) => {
        const aDue = dueIds.has(a.id) ? 0 : 1
        const bDue = dueIds.has(b.id) ? 0 : 1
        return aDue - bDue || a.name.localeCompare(b.name, 'pl')
      }),
    [items, dueIds],
  )

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start gap-3">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold tracking-tight">Zawodnicy</h1>
          <p className="text-muted-foreground text-sm">
            Kogo trzeba dziś odwiedzić. Zaniedbani na górze — każdy ma własny rytm przeglądów.
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

      {loading ? (
        <div className="space-y-2">
          {Array.from({ length: 4 }, (_, index) => (
            <Skeleton key={index} className="h-16 w-full" />
          ))}
        </div>
      ) : ordered.length === 0 ? (
        <Card>
          <CardContent className="text-muted-foreground py-10 text-center text-sm">
            Nie ma jeszcze żadnego zawodnika na liście.
          </CardContent>
        </Card>
      ) : (
        <ul className="space-y-2">
          {ordered.map((athlete) => {
            const last = lastChecks.get(athlete.id) ?? null
            const daysSince = last ? daysBetween(fromDateKey(last), today) : null
            const due = dueIds.has(athlete.id)

            return (
              <li
                key={athlete.id}
                className={cn(
                  'flex flex-wrap items-center gap-3 rounded-lg border p-3',
                  due && 'border-destructive/50 bg-destructive/5',
                  !athlete.isActive && 'opacity-50',
                )}
              >
                <button
                  type="button"
                  onClick={() => openEdit(athlete)}
                  className="focus-visible:ring-ring min-w-0 flex-1 text-left focus-visible:ring-2 focus-visible:outline-none"
                >
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-medium">{athlete.name}</span>
                    {athlete.discipline && <Badge variant="secondary">{athlete.discipline}</Badge>}
                    {athlete.instagramUrl && (
                      <LinkIcon className="text-muted-foreground size-3.5" />
                    )}
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
        onDelete={target?.mode === 'edit' ? removeCurrent : undefined}
      >
        <TextField
          id="athlete-name"
          label="Imię i nazwisko"
          value={form.name}
          onChange={(name) => patch({ name })}
        />
        <TextField
          id="athlete-discipline"
          label="Dyscyplina"
          value={form.discipline}
          onChange={(discipline) => patch({ discipline })}
          placeholder="np. BJJ, MMA, grappling"
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
          id="athlete-other"
          label="Inny profil"
          type="url"
          value={form.otherUrl}
          onChange={(otherUrl) => patch({ otherUrl })}
        />
        <NumberField
          id="athlete-rhythm"
          label="Przeglądaj profil co ile dni"
          value={form.checkEveryDays}
          onChange={(checkEveryDays) => patch({ checkEveryDays })}
          hint="0 wyłącza przypominanie dla tego zawodnika."
        />
        <Field label="Aktywny" htmlFor="athlete-active">
          <Switch
            id="athlete-active"
            checked={form.isActive}
            onCheckedChange={(isActive) => patch({ isActive })}
          />
        </Field>
        <NoteField id="athlete-note" value={form.note} onChange={(note) => patch({ note })} />
      </EntityDialog>
    </div>
  )
}
