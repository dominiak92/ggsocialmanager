import type { ReactNode } from 'react'

import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

type Props = {
  open: boolean
  title: string
  description?: string
  children: ReactNode
  saving?: boolean
  canSave?: boolean
  onClose: () => void
  onSave: () => void
  onDelete?: () => void
}

/**
 * Rama dialogu formularza — jedna dla całej aplikacji.
 *
 * Kluczowe jest to, co robi z wysokością: `max-h-[85dvh]`, nagłówek i stopka
 * stoją, przewija się WYŁĄCZNIE środek. Bez tego okno rosło i kurczyło się
 * przy zmianie treści, a przyciski uciekały spod kursora. Nowe formularze
 * budujemy na tym komponencie, a nie na gołym `DialogContent`.
 */
export function EntityDialog({
  open,
  title,
  description,
  children,
  saving = false,
  canSave = true,
  onClose,
  onSave,
  onDelete,
}: Props) {
  if (!open) return null

  return (
    <Dialog open onOpenChange={(next) => !next && onClose()}>
      <DialogContent className="flex max-h-[90dvh] flex-col gap-0 sm:max-h-[85dvh] sm:max-w-lg">
        <DialogHeader className="shrink-0">
          <DialogTitle>{title}</DialogTitle>
          {description && <DialogDescription>{description}</DialogDescription>}
        </DialogHeader>

        <div className="min-h-0 flex-1 space-y-4 overflow-y-auto py-4">{children}</div>

        <DialogFooter className="shrink-0 gap-2 sm:justify-between">
          {onDelete ? (
            <Button
              variant="ghost"
              className="text-destructive"
              onClick={onDelete}
              disabled={saving}
            >
              Usuń
            </Button>
          ) : (
            <span />
          )}
          <div className="flex flex-1 gap-2 sm:flex-none">
            <Button
              variant="outline"
              className="flex-1 sm:flex-none"
              onClick={onClose}
              disabled={saving}
            >
              Anuluj
            </Button>
            <Button className="flex-1 sm:flex-none" onClick={onSave} disabled={saving || !canSave}>
              Zapisz
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
