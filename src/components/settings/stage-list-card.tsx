import { ArrowDownIcon, ArrowUpIcon, PlusIcon, Trash2Icon } from 'lucide-react'
import { useState } from 'react'

import { EntityDialog } from '@/components/shared/entity-dialog'
import { Field, TextField } from '@/components/shared/field'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Switch } from '@/components/ui/switch'
import { POST_TYPE_COLOR, postTypeColorClass } from '@/domain/enums'
import type { CollectionState } from '@/hooks/use-collection'
import { useEntityForm } from '@/hooks/use-entity-form'
import { cn } from '@/lib/utils'

const COLORS = Object.keys(POST_TYPE_COLOR)

/** Wspólny kształt słownika kolorowanego: rodzaje postów i etapy nagrywek. */
type Entry = { id: string; name: string; color: string; sortOrder: number; isActive: boolean }
type Draft = { name: string; color: string; sortOrder: number }

type Props = {
  title: string
  description: string
  /** Czy pozycje mają kolejność, którą da się przestawiać strzałkami. */
  ordered?: boolean
  addLabel: string
  namePlaceholder: string
  deleteHint: string
  collection: CollectionState<Entry, Draft, Partial<Draft & { isActive: boolean }>>
}

/**
 * Karta zarządzania słownikiem: nazwa + kolor + aktywność.
 *
 * Rodzaje postów i etapy nagrywek to ten sam problem — lista pozycji, które
 * właściciel definiuje sam, z kolorem używanym potem w widokach. Druga kopia
 * tego ekranu rozjechałaby się z pierwszą przy pierwszej poprawce.
 *
 * `ordered` włącza strzałki kolejności. Przy etapach nagrywek kolejność ma
 * znaczenie ZACHOWANIA, nie tylko wyglądu: po niej działa „przesuń dalej".
 */
export function StageListCard({
  title,
  description,
  ordered = false,
  addLabel,
  namePlaceholder,
  deleteHint,
  collection,
}: Props) {
  const { items, error, loading, update, remove } = collection
  const [toDelete, setToDelete] = useState<Entry | null>(null)

  const dialog = useEntityForm<Entry, Draft>({
    collection,
    empty: () => ({ name: '', color: 'slate', sortOrder: (items.length + 1) * 10 }),
    toDraft: ({ name, color, sortOrder }) => ({ name, color, sortOrder }),
    normalize: (draft) => ({ ...draft, name: draft.name.trim() }),
    isValid: (draft) => draft.name.trim().length > 0,
  })
  const { form, patch } = dialog

  /** Zamiana miejscami z sąsiadem — prostsze niż przeciąganie i wystarcza. */
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
          <CardTitle>{title}</CardTitle>
          <CardDescription>{description}</CardDescription>
        </CardHeader>

        <CardContent className="space-y-3">
          {error && (
            <p className="border-destructive/40 bg-destructive/10 text-destructive rounded-md border px-3 py-2 text-sm">
              {error}
            </p>
          )}

          {loading ? (
            <div className="space-y-2">
              {Array.from({ length: 4 }, (_, index) => (
                <Skeleton key={index} className="h-10 w-full" />
              ))}
            </div>
          ) : (
            <ul className="divide-y">
              {items.map((entry, index) => (
                <li key={entry.id} className="flex items-center gap-1 py-2">
                  <span
                    className={cn(
                      'size-3.5 shrink-0 rounded-full border',
                      postTypeColorClass(entry.color),
                    )}
                  />
                  <button
                    type="button"
                    onClick={() => dialog.openEdit(entry)}
                    className="focus-visible:ring-ring min-w-0 flex-1 rounded px-1 text-left text-sm focus-visible:ring-2 focus-visible:outline-none"
                  >
                    {entry.name}
                  </button>

                  {ordered && (
                    <>
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        aria-label={`Przesuń wyżej: ${entry.name}`}
                        disabled={index === 0}
                        onClick={() => void move(index, -1)}
                      >
                        <ArrowUpIcon />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        aria-label={`Przesuń niżej: ${entry.name}`}
                        disabled={index === items.length - 1}
                        onClick={() => void move(index, 1)}
                      >
                        <ArrowDownIcon />
                      </Button>
                    </>
                  )}

                  <Button
                    variant="ghost"
                    size="icon-sm"
                    aria-label={`Usuń ${entry.name}`}
                    className="text-muted-foreground hover:text-destructive"
                    onClick={() => setToDelete(entry)}
                  >
                    <Trash2Icon />
                  </Button>
                  <Switch
                    checked={entry.isActive}
                    aria-label={`Aktywne: ${entry.name}`}
                    onCheckedChange={(checked) =>
                      void update(entry.id, { isActive: checked }).catch(() => null)
                    }
                  />
                </li>
              ))}
            </ul>
          )}

          <Button variant="outline" size="sm" onClick={() => dialog.openCreate()}>
            <PlusIcon />
            {addLabel}
          </Button>
        </CardContent>
      </Card>

      <EntityDialog
        open={dialog.target !== null}
        title={dialog.target?.mode === 'edit' ? 'Edytuj' : addLabel}
        saving={dialog.saving}
        canSave={dialog.canSave}
        onClose={dialog.close}
        onSave={dialog.save}
      >
        <TextField
          id="stage-name"
          label="Nazwa"
          value={form.name}
          onChange={(name) => patch({ name })}
          placeholder={namePlaceholder}
        />

        <Field label="Kolor">
          <div className="flex flex-wrap gap-1.5">
            {COLORS.map((color) => (
              <button
                key={color}
                type="button"
                aria-label={color}
                aria-pressed={form.color === color}
                onClick={() => patch({ color })}
                className={cn(
                  'size-7 rounded-md border-2 transition',
                  postTypeColorClass(color),
                  form.color === color ? 'ring-ring ring-2 ring-offset-1' : 'border-transparent',
                )}
              />
            ))}
          </div>
        </Field>
      </EntityDialog>

      <EntityDialog
        open={toDelete !== null}
        title={`Usunąć „${toDelete?.name ?? ''}"?`}
        description={deleteHint}
        onClose={() => setToDelete(null)}
        onSave={confirmDelete}
      >
        <p className="text-muted-foreground text-sm">Tej operacji nie da się cofnąć.</p>
      </EntityDialog>
    </>
  )
}
