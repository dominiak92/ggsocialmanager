import { PlusIcon, Trash2Icon } from 'lucide-react'
import { useState } from 'react'

import { EntityDialog } from '@/components/shared/entity-dialog'
import { Field, TextField } from '@/components/shared/field'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Switch } from '@/components/ui/switch'
import { POST_TYPE_COLOR, postTypeColorClass } from '@/domain/enums'
import type { PostType, PostTypeDraft } from '@/domain/models'
import { useEntityForm } from '@/hooks/use-entity-form'
import { usePostTypeAdmin } from '@/hooks/use-post-types'
import { cn } from '@/lib/utils'

const COLORS = Object.keys(POST_TYPE_COLOR)

function emptyDraft(): PostTypeDraft {
  return { name: '', color: 'slate', sortOrder: 100 }
}

/**
 * Rodzaje postów — słownik edytowalny z panelu.
 *
 * Kasowanie jest bezpieczne: `publications.post_type_id` ma `on delete set
 * null`, więc historyczne wpisy zostają, tracąc tylko rodzaj. Mimo to
 * WYŁĄCZENIE (`isActive`) jest operacją domyślną — rodzaj znika z formularza
 * nowego wpisu, ale kolory na starych wpisach się nie rozjeżdżają.
 */
export function PostTypesCard() {
  const collection = usePostTypeAdmin()
  const { items, error, loading, update } = collection
  const [toDelete, setToDelete] = useState<PostType | null>(null)

  const dialog = useEntityForm<PostType, PostTypeDraft>({
    collection,
    empty: emptyDraft,
    toDraft: ({ name, color, sortOrder }) => ({ name, color, sortOrder }),
    normalize: (draft) => ({ ...draft, name: draft.name.trim() }),
    isValid: (draft) => draft.name.trim().length > 0,
  })
  const { form, patch } = dialog

  const confirmDelete = async () => {
    if (!toDelete) return
    await collection.remove(toDelete.id).catch(() => null)
    setToDelete(null)
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Rodzaje postów</CardTitle>
          <CardDescription>
            Kolory w kalendarzu. Wyłączony rodzaj znika z formularza nowego wpisu, ale stare wpisy
            zachowują swój kolor.
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
              {Array.from({ length: 4 }, (_, index) => (
                <Skeleton key={index} className="h-10 w-full" />
              ))}
            </div>
          ) : (
            <ul className="divide-y">
              {items.map((postType) => (
                <li key={postType.id} className="flex items-center gap-2 py-2">
                  <span
                    className={cn(
                      'size-3.5 shrink-0 rounded-full border',
                      postTypeColorClass(postType.color),
                    )}
                  />
                  <button
                    type="button"
                    onClick={() => dialog.openEdit(postType)}
                    className="focus-visible:ring-ring min-w-0 flex-1 rounded text-left text-sm focus-visible:ring-2 focus-visible:outline-none"
                  >
                    {postType.name}
                  </button>

                  <Button
                    variant="ghost"
                    size="icon-sm"
                    aria-label={`Usuń ${postType.name}`}
                    className="text-muted-foreground hover:text-destructive"
                    onClick={() => setToDelete(postType)}
                  >
                    <Trash2Icon />
                  </Button>
                  <Switch
                    checked={postType.isActive}
                    aria-label={`Rodzaj aktywny: ${postType.name}`}
                    onCheckedChange={(checked) =>
                      void update(postType.id, { isActive: checked }).catch(() => null)
                    }
                  />
                </li>
              ))}
            </ul>
          )}

          <Button variant="outline" size="sm" onClick={() => dialog.openCreate()}>
            <PlusIcon />
            Dodaj rodzaj
          </Button>
        </CardContent>
      </Card>

      <EntityDialog
        open={dialog.target !== null}
        title={dialog.target?.mode === 'edit' ? 'Edytuj rodzaj' : 'Nowy rodzaj'}
        saving={dialog.saving}
        canSave={dialog.canSave}
        onClose={dialog.close}
        onSave={dialog.save}
      >
        <TextField
          id="post-type-name"
          label="Nazwa"
          value={form.name}
          onChange={(name) => patch({ name })}
          placeholder="np. Zapowiedź"
        />

        <Field label="Kolor" hint="Ten sam kolor zobaczysz na kratce w kalendarzu.">
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
        title={`Usunąć rodzaj „${toDelete?.name ?? ''}"?`}
        description="Wpisy, które go używały, zostaną — stracą tylko oznaczenie rodzaju. Jeśli chcesz go tylko wycofać z użycia, wyłącz przełącznik zamiast kasować."
        onClose={() => setToDelete(null)}
        onSave={confirmDelete}
      >
        <p className="text-muted-foreground text-sm">Tej operacji nie da się cofnąć.</p>
      </EntityDialog>
    </>
  )
}
