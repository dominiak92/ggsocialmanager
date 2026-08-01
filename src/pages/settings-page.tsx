import { BellOffIcon, PencilIcon, PlusIcon, Trash2Icon } from 'lucide-react'
import { useState } from 'react'

import { ChannelDialog, type ChannelTarget } from '@/components/settings/channel-dialog'
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
import { Button } from '@/components/ui/button'
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Skeleton } from '@/components/ui/skeleton'
import { Switch } from '@/components/ui/switch'
import { sectionsOf } from '@/domain/calendar'
import { CHANNEL_GROUP_LABEL, PLATFORM_LABEL } from '@/domain/enums'
import type { Channel } from '@/domain/models'
import { useChannels } from '@/hooks/use-channels'

/**
 * Ustawienia kanałów.
 *
 * Kanał z publikacjami jest chroniony kluczem obcym — usunięcie się nie uda
 * i baza to odrzuci. Dlatego wyłączenie (przełącznik) jest operacją domyślną,
 * a kasowanie sensowne tylko dla kanału świeżo dodanego przez pomyłkę.
 */
export function SettingsPage() {
  const { channels, error, loading, create, update, remove, setActive } = useChannels()
  const [target, setTarget] = useState<ChannelTarget | null>(null)
  const [toDelete, setToDelete] = useState<Channel | null>(null)
  const sections = sectionsOf(channels)

  const confirmDelete = async () => {
    if (!toDelete) return
    try {
      await remove(toDelete.id)
    } catch {
      // Hook wystawia komunikat (np. „kanał ma publikacje").
    } finally {
      setToDelete(null)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start gap-3">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold tracking-tight">Ustawienia</h1>
          <p className="text-muted-foreground text-sm">
            Wyłączone kanały znikają z kalendarza, a ich wpisy zostają nienaruszone.
          </p>
        </div>
        <Button className="ml-auto" onClick={() => setTarget({ mode: 'create' })}>
          <PlusIcon />
          Dodaj kanał
        </Button>
      </div>

      {error && (
        <p className="border-destructive/40 bg-destructive/10 text-destructive rounded-md border px-3 py-2 text-sm">
          {error}
        </p>
      )}

      {loading ? (
        <div className="space-y-2">
          {Array.from({ length: 6 }, (_, index) => (
            <Skeleton key={index} className="h-12 w-full" />
          ))}
        </div>
      ) : (
        sections.map((section) => (
          <Card key={section.group}>
            <CardHeader>
              <CardTitle>{CHANNEL_GROUP_LABEL[section.group]}</CardTitle>
              <CardDescription>
                {section.channels.filter((channel) => channel.isActive).length} z{' '}
                {section.channels.length} aktywnych
              </CardDescription>
              <CardAction />
            </CardHeader>
            <CardContent className="divide-y">
              {section.channels.map((channel) => (
                <div key={channel.id} className="flex items-center gap-2 py-2.5">
                  <div className="min-w-0 flex-1">
                    <Label htmlFor={`channel-${channel.id}`} className="text-sm font-medium">
                      {channel.name}
                    </Label>
                    <p className="text-muted-foreground flex items-center gap-1.5 text-xs">
                      {PLATFORM_LABEL[channel.platform]}
                      {channel.locale ? ` · ${channel.locale}` : ''}
                      {' · '}
                      {channel.reminderAfterDays === 0 ? (
                        <span className="inline-flex items-center gap-1">
                          <BellOffIcon className="size-3" />
                          bez przypomnień
                        </span>
                      ) : (
                        `przypomnij po ${channel.reminderAfterDays} dn.`
                      )}
                    </p>
                  </div>

                  <Button
                    variant="ghost"
                    size="icon"
                    aria-label={`Edytuj ${channel.name}`}
                    onClick={() => setTarget({ mode: 'edit', channel })}
                  >
                    <PencilIcon />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    aria-label={`Usuń ${channel.name}`}
                    className="text-muted-foreground hover:text-destructive"
                    onClick={() => setToDelete(channel)}
                  >
                    <Trash2Icon />
                  </Button>
                  <Switch
                    id={`channel-${channel.id}`}
                    checked={channel.isActive}
                    aria-label={`Kanał aktywny: ${channel.name}`}
                    onCheckedChange={(checked) => void setActive(channel.id, checked)}
                  />
                </div>
              ))}
            </CardContent>
          </Card>
        ))
      )}

      <ChannelDialog
        target={target}
        onClose={() => setTarget(null)}
        onCreate={create}
        onUpdate={update}
      />

      <AlertDialog open={toDelete !== null} onOpenChange={(open) => !open && setToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Usunąć kanał „{toDelete?.name}"?</AlertDialogTitle>
            <AlertDialogDescription>
              Jeśli kanał ma już zapisane publikacje, baza odmówi usunięcia — wtedy wyłącz go
              przełącznikiem zamiast kasować.
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
