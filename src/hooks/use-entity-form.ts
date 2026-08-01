import { useCallback, useMemo, useState } from 'react'

import type { CollectionState } from '@/hooks/use-collection'

/**
 * Co jest otwarte w dialogu. Rozdzielenie na dwa warianty (zamiast `item?`)
 * sprawia, że TypeScript pilnuje, iż w trybie edycji obiekt NA PEWNO jest.
 */
export type EntityTarget<T> = { mode: 'create' } | { mode: 'edit'; item: T }

type Options<T, D> = {
  collection: Pick<CollectionState<T, D, Partial<D>>, 'create' | 'update' | 'remove'>
  /** Świeży, pusty formularz. */
  empty: () => D
  /** Istniejący obiekt → wartości formularza (zwykle wszystko poza `id`). */
  toDraft: (item: T) => D
  /** Ostatnie szlify przed zapisem, np. `trim` na nazwie. */
  normalize?: (draft: D) => D
  /** Czy da się zapisać. Bez tego przycisk zapisu byłby zawsze aktywny. */
  isValid: (draft: D) => boolean
}

export type EntityForm<T, D> = {
  target: EntityTarget<T> | null
  form: D
  saving: boolean
  canSave: boolean
  patch: (next: Partial<D>) => void
  openCreate: (prefill?: Partial<D>) => void
  openEdit: (item: T) => void
  close: () => void
  save: () => Promise<void>
  removeCurrent: () => Promise<void>
}

/**
 * Rusztowanie formularza CRUD w dialogu, wspólne dla list domenowych.
 *
 * Cztery strony (eventy, konkursy, zawodnicy, pomysły) miały dokładnie ten sam
 * blok: trzy stany, `openCreate`, `openEdit`, `save`, `removeCurrent` i `patch`.
 * Różniły się wyłącznie nazwą pola w `Target` i tym, które pole trimują —
 * czyli niczym, co uzasadnia cztery kopie. Poprawka zachowania dialogu musiała
 * być nanoszona w czterech miejscach i łatwo było pominąć jedno.
 *
 * Strona zostaje z filtrowaniem, układem i samym JSX formularza.
 */
export function useEntityForm<T extends { id: string }, D extends object>({
  collection,
  empty,
  toDraft,
  normalize,
  isValid,
}: Options<T, D>): EntityForm<T, D> {
  const [target, setTarget] = useState<EntityTarget<T> | null>(null)
  const [form, setForm] = useState<D>(empty)
  const [saving, setSaving] = useState(false)

  const patch = useCallback((next: Partial<D>) => setForm((prev) => ({ ...prev, ...next })), [])

  const openCreate = useCallback(
    (prefill?: Partial<D>) => {
      setForm({ ...empty(), ...prefill })
      setTarget({ mode: 'create' })
    },
    // `empty` bywa literałem inline; trzymamy pierwszą referencję, bo funkcja
    // i tak jest czysta i zwraca świeży obiekt.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  )

  const openEdit = useCallback(
    (item: T) => {
      setForm(toDraft(item))
      setTarget({ mode: 'edit', item })
    },
    // jw.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  )

  const close = useCallback(() => setTarget(null), [])

  const save = useCallback(async () => {
    if (!target || !isValid(form) || saving) return
    setSaving(true)
    try {
      const payload = normalize ? normalize(form) : form
      if (target.mode === 'edit') await collection.update(target.item.id, payload)
      else await collection.create(payload)
      setTarget(null)
    } catch {
      // Komunikat trzyma hook kolekcji i pokazuje go strona.
    } finally {
      setSaving(false)
    }
  }, [target, form, saving, collection, isValid, normalize])

  const removeCurrent = useCallback(async () => {
    if (target?.mode !== 'edit') return
    setSaving(true)
    try {
      await collection.remove(target.item.id)
      setTarget(null)
    } catch {
      // jw.
    } finally {
      setSaving(false)
    }
  }, [target, collection])

  /**
   * Zwracany obiekt MUSI mieć stabilną referencję.
   *
   * Bez tego każdy render dawał nowy literał, a efekt trzymający ten obiekt
   * w zależnościach (np. obsługa deep-linku otwierającego formularz) odpalał
   * się w kółko: efekt → `openCreate` ustawia świeży stan → render → efekt.
   * Objawiało się to zawieszonym dialogiem.
   */
  return useMemo(
    () => ({
      target,
      form,
      saving,
      canSave: isValid(form) && !saving,
      patch,
      openCreate,
      openEdit,
      close,
      save,
      removeCurrent,
    }),
    [target, form, saving, isValid, patch, openCreate, openEdit, close, save, removeCurrent],
  )
}
