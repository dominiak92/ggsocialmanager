import { PlusIcon } from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { postTypeColorClass } from '@/domain/enums'
import type { Channel, PostType, Publication } from '@/domain/models'
import { formatDayLong, fromDateKey } from '@/lib/dates'
import { cn } from '@/lib/utils'

type Props = {
  dateKey: string | null
  channels: Channel[]
  postTypes: PostType[]
  publications: Publication[]
  onClose: () => void
  onAdd: (dateKey: string) => void
  onOpen: (publication: Publication) => void
}

/** Szczegóły jednego dnia — wywoływane z widoku miesiąca. */
export function DaySheet({
  dateKey,
  channels,
  postTypes,
  publications,
  onClose,
  onAdd,
  onOpen,
}: Props) {
  if (!dateKey) return null

  const typeById = new Map(postTypes.map((postType) => [postType.id, postType]))
  const channelById = new Map(channels.map((channel) => [channel.id, channel]))
  const entries = publications.filter((publication) => publication.publishOn === dateKey)

  return (
    <Sheet open onOpenChange={(open) => !open && onClose()}>
      <SheetContent className="flex h-[85dvh] w-full flex-col gap-0 sm:h-full sm:max-w-md">
        <SheetHeader>
          <SheetTitle className="capitalize">{formatDayLong(fromDateKey(dateKey))}</SheetTitle>
          <SheetDescription>
            {entries.length === 0
              ? 'Nic nie zapisane na ten dzień.'
              : `${entries.filter((e) => e.status === 'published').length} z ${entries.length} opublikowane`}
          </SheetDescription>
        </SheetHeader>

        <div className="flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto px-4">
          {entries.map((entry) => {
            const postType = entry.postTypeId ? typeById.get(entry.postTypeId) : undefined

            return (
              <button
                key={entry.id}
                type="button"
                onClick={() => onOpen(entry)}
                className="hover:bg-accent focus-visible:ring-ring flex flex-col gap-1 rounded-lg border p-3 text-left transition focus-visible:ring-2 focus-visible:outline-none"
              >
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">
                    {channelById.get(entry.channelId)?.name ?? 'Nieznany kanał'}
                  </span>
                  {postType && (
                    <span
                      className={cn(
                        'rounded border px-1.5 py-0.5 text-[11px] font-medium',
                        postTypeColorClass(postType.color),
                      )}
                    >
                      {postType.name}
                    </span>
                  )}
                  <Badge
                    variant={entry.status === 'published' ? 'default' : 'outline'}
                    className="ml-auto text-[11px]"
                  >
                    {entry.status === 'published' ? 'Poszło' : 'Plan'}
                  </Badge>
                </div>
                {entry.title && <p className="text-sm">{entry.title}</p>}
                {entry.note && <p className="text-muted-foreground text-xs">{entry.note}</p>}
              </button>
            )
          })}
        </div>

        <div className="border-t p-4">
          <Button className="w-full" onClick={() => onAdd(dateKey)}>
            <PlusIcon />
            Dodaj wpis
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  )
}
