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
import { LOCALES, PLATFORMS, PLATFORM_LABEL, type Locale, type Platform } from '@/domain/enums'
import type { Channel, ChannelDraft } from '@/domain/models'

/** `Select` nie umie wartości pustej — `null` reprezentujemy tym tokenem. */
const NO_LOCALE = '__none__'

export type ChannelTarget = { mode: 'create' } | { mode: 'edit'; channel: Channel }

type Props = {
  target: ChannelTarget | null
  onClose: () => void
  onCreate: (draft: ChannelDraft) => Promise<unknown>
  onUpdate: (id: string, patch: Partial<ChannelDraft>) => Promise<unknown>
}

type FormState = ChannelDraft

function initialForm(target: ChannelTarget): FormState {
  if (target.mode === 'edit') {
    const { channel } = target
    return {
      name: channel.name,
      platform: channel.platform,
      locale: channel.locale,
      reminderAfterDays: channel.reminderAfterDays,
    }
  }
  return { name: '', platform: 'instagram', locale: null, reminderAfterDays: 7 }
}

export function ChannelDialog({ target, onClose, onCreate, onUpdate }: Props) {
  const [form, setForm] = useState<FormState | null>(null)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    setForm(target ? initialForm(target) : null)
  }, [target])

  if (!target || !form) return null

  const patch = (next: Partial<FormState>) =>
    setForm((prev) => (prev ? { ...prev, ...next } : prev))
  const canSave = form.name.trim().length > 0 && !saving

  const save = async () => {
    if (!canSave) return
    setSaving(true)
    try {
      const payload: ChannelDraft = { ...form, name: form.name.trim() }
      if (target.mode === 'edit') await onUpdate(target.channel.id, payload)
      else await onCreate(payload)
      onClose()
    } catch {
      // Komunikat pokazuje strona — hook trzyma ostatni błąd.
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{target.mode === 'edit' ? 'Edytuj kanał' : 'Nowy kanał'}</DialogTitle>
          <DialogDescription>
            Platforma decyduje o sekcji w kalendarzu, rynek to dopisek przy nazwie.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="channel-name">Nazwa</Label>
            <Input
              id="channel-name"
              value={form.name}
              onChange={(event) => patch({ name: event.target.value })}
              placeholder="np. Fanpage SK"
              onKeyDown={(event) => {
                if (event.key === 'Enter') void save()
              }}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="channel-platform">Platforma</Label>
            <Select
              value={form.platform}
              onValueChange={(value) => patch({ platform: value as Platform })}
            >
              <SelectTrigger id="channel-platform" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PLATFORMS.map((platform) => (
                  <SelectItem key={platform} value={platform}>
                    {PLATFORM_LABEL[platform]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="channel-locale">Rynek</Label>
            <Select
              value={form.locale ?? NO_LOCALE}
              onValueChange={(value) =>
                patch({ locale: value === NO_LOCALE ? null : (value as Locale) })
              }
            >
              <SelectTrigger id="channel-locale" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={NO_LOCALE}>Bez podziału na rynki</SelectItem>
                {LOCALES.map((locale) => (
                  <SelectItem key={locale} value={locale}>
                    {locale}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="channel-reminder">Przypomnij po ilu dniach ciszy</Label>
            <Input
              id="channel-reminder"
              type="number"
              min={0}
              max={365}
              value={form.reminderAfterDays}
              onChange={(event) =>
                patch({ reminderAfterDays: Math.max(0, Number(event.target.value) || 0) })
              }
            />
            <p className="text-muted-foreground text-xs">
              0 wyłącza przypominanie dla tego kanału.
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={saving}>
            Anuluj
          </Button>
          <Button onClick={save} disabled={!canSave}>
            Zapisz
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
