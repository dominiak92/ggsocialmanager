import { ArrowDownIcon, ArrowUpIcon, PlusIcon, Trash2Icon } from 'lucide-react'
import { useState } from 'react'

import { EntityDialog } from '@/components/shared/entity-dialog'
import { Field, TextField } from '@/components/shared/field'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Switch } from '@/components/ui/switch'
import type { DailyTaskType, DailyTaskTypeDraft } from '@/domain/models'
import { useDailyTaskTypes } from '@/hooks/use-daily-tasks'
import { useEntityForm } from '@/hooks/use-entity-form'

/**
 * Codzienne zadania — słownik właściciela.
 *
 * Osobna karta, a nie `StageListCard`: te pozycje nie mają koloru, za to mają
 * przełącznik „osobno na każdy rynek", który decyduje o LICZBIE ptaszków na
 * pulpicie. Wciskanie tego w kartę słowników kolorowanych rozmyłoby oba ekrany.
 */
export function DailyTasksSettingsCard() {
  const collection = useDailyTaskTypes()
  const { items, error, loading, update, remove } = collection
  const [toDelete, setToDelete] = useState<DailyTaskType | null>(null)

  const dialog = useEntityForm<DailyTaskType, DailyTaskTypeDraft>({
    collection,
    empty: () => ({ name: '', hint: '', perMarket: true, sortOrder: (items.length + 1) * 10 }),
    toDraft: ({ name, hint, perMarket, sortOrder }) => ({ name, hint, perMarket, sortOrder }),
    normalize: (draft) => ({ ...draft, name: draft.name.trim(), hint: draft.hint.trim() }),
    isValid: (draft) => draft.name.trim().length > 0,
  })
  const { form, patch } = dialog

  /** Zamiana miejscami z sąsiadem — kolejność ustala układ na pulpicie. */
  const move = async (index: number, direction: -1 | 1) => {
    const current = items[index]
    const neighbour = items[index + direction]
    if (!current || !neighbour) return

    await Promise.all([
      update(current.id, { sortOrder: neighbour.sortOrder }),
      update(neighbour.id, { sortOrder: current.sortOrder }),
    ]).catch(() => null)
  }

  const confirmDelete = async () => {
    if (!toDelete) return
    await remove(toDelete.id).catch(() => null)
    setToDelete(null)
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Codzienna rutyna</CardTitle>
          <CardDescription>
            Zadania odhaczane na pulpicie. „Osobno na rynek" daje jeden ptaszek dla każdego rynku,
            na którym masz aktywne kanały.
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-3">
          {error && (
            <p className="border-destructive/40 bg-destructive/10 text-destructive rounded-md border px-3 py-2 text-sm">
              {error}
            </p>
          )}

          {loading ? (
            <div className="space-y-2">
              {Array.from({ length: 3 }, (_, index) => (
                <Skeleton key={index} className="h-10 w-full" />
              ))}
            </div>
          ) : (
            <ul className="divide-y">
              {items.map((task, index) => (
                <li key={task.id} className="flex items-center gap-1 py-2">
                  <button
                    type="button"
                    onClick={() => dialog.openEdit(task)}
                    className="focus-visible:ring-ring min-w-0 flex-1 rounded px-1 text-left focus-visible:ring-2 focus-visible:outline-none"
                  >
                    <span className="flex flex-wrap items-center gap-1.5 text-sm">
                      {task.name}
                      {task.perMarket && (
                        <Badge variant="secondary" className="text-[11px]">
                          per rynek
                        </Badge>
                      )}
                    </span>
                    {task.hint && <p className="text-muted-foreground text-xs">{task.hint}</p>}
                  </button>

                  <Button
                    variant="ghost"
                    size="icon-sm"
                    aria-label={`Przesuń wyżej: ${task.name}`}
                    disabled={index === 0}
                    onClick={() => void move(index, -1)}
                  >
                    <ArrowUpIcon />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    aria-label={`Przesuń niżej: ${task.name}`}
                    disabled={index === items.length - 1}
                    onClick={() => void move(index, 1)}
                  >
                    <ArrowDownIcon />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    aria-label={`Usuń ${task.name}`}
                    className="text-muted-foreground hover:text-destructive"
                    onClick={() => setToDelete(task)}
                  >
                    <Trash2Icon />
                  </Button>
                  <Switch
                    checked={task.isActive}
                    aria-label={`Aktywne: ${task.name}`}
                    onCheckedChange={(checked) =>
                      void update(task.id, { isActive: checked }).catch(() => null)
                    }
                  />
                </li>
              ))}
            </ul>
          )}

          <Button variant="outline" size="sm" onClick={() => dialog.openCreate()}>
            <PlusIcon />
            Dodaj zadanie
          </Button>
        </CardContent>
      </Card>

      <EntityDialog
        open={dialog.target !== null}
        title={dialog.target?.mode === 'edit' ? 'Edytuj zadanie' : 'Nowe zadanie'}
        saving={dialog.saving}
        canSave={dialog.canSave}
        onClose={dialog.close}
        onSave={dialog.save}
      >
        <TextField
          id="daily-name"
          label="Nazwa"
          value={form.name}
          onChange={(name) => patch({ name })}
          placeholder="np. Wiadomości"
        />
        <TextField
          id="daily-hint"
          label="Podpowiedź"
          value={form.hint}
          onChange={(hint) => patch({ hint })}
          placeholder="np. Skrzynki na Instagramie i Facebooku"
          hint="Widoczna pod nazwą na pulpicie."
        />
        <Field
          label="Osobno na każdy rynek"
          htmlFor="daily-per-market"
          hint="Włączone: jeden ptaszek na rynek (PL, DE, …). Wyłączone: jeden dla całej marki."
        >
          <Switch
            id="daily-per-market"
            checked={form.perMarket}
            onCheckedChange={(perMarket) => patch({ perMarket })}
          />
        </Field>
      </EntityDialog>

      <EntityDialog
        open={toDelete !== null}
        title={`Usunąć zadanie „${toDelete?.name ?? ''}"?`}
        description="Zniknie razem z historią odhaczeń. Jeśli chcesz je tylko wyłączyć z rutyny, użyj przełącznika zamiast kasować."
        onClose={() => setToDelete(null)}
        onSave={confirmDelete}
      >
        <p className="text-muted-foreground text-sm">Tej operacji nie da się cofnąć.</p>
      </EntityDialog>
    </>
  )
}
