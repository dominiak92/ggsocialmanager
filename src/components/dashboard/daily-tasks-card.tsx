import { CheckCircle2Icon, ListChecksIcon } from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { Skeleton } from '@/components/ui/skeleton'
import type { Channel } from '@/domain/models'
import { useDailyTasks } from '@/hooks/use-daily-tasks'
import { cn } from '@/lib/utils'

/**
 * Codzienna rutyna: wiadomości, komentarze, oznaczenia.
 *
 * Lista **resetuje się sama o północy** — odhaczenia są zapisywane z datą,
 * więc nowy dzień to po prostu brak wpisów. Nie ma żadnego zadania
 * cyklicznego ani kolumny do czyszczenia.
 *
 * Zadania „per rynek" rozkładają się na ptaszek dla każdego rynku, na którym
 * realnie pracujemy (czytane z aktywnych kanałów). Rodzaje i to, czy dzielą
 * się na rynki, ustawia właściciel w Ustawieniach.
 */
export function DailyTasksCard({ channels }: { channels: Channel[] }) {
  const { groups, progress, loading, toggle } = useDailyTasks(channels)

  if (!loading && groups.length === 0) return null

  const allDone = progress.total > 0 && progress.done === progress.total

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex flex-wrap items-center gap-2">
          <ListChecksIcon className="size-4" />
          Codzienna rutyna
          {progress.total > 0 && (
            <Badge variant={allDone ? 'default' : 'secondary'}>
              {progress.done} z {progress.total}
            </Badge>
          )}
        </CardTitle>
        <CardDescription>
          {allDone ? (
            <span className="inline-flex items-center gap-1.5">
              <CheckCircle2Icon className="text-primary size-3.5" />
              Wszystko na dziś sprawdzone.
            </span>
          ) : (
            'Odhaczenia kasują się same o północy.'
          )}
        </CardDescription>
      </CardHeader>

      <CardContent>
        {loading ? (
          <div className="space-y-2">
            {Array.from({ length: 3 }, (_, index) => (
              <Skeleton key={index} className="h-10 w-full" />
            ))}
          </div>
        ) : (
          <ul className="divide-y">
            {groups.map((group) => (
              <li key={group.type.id} className="py-2.5">
                <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                  <span className="text-sm font-medium">{group.type.name}</span>
                  {group.type.perMarket && (
                    <span
                      className={cn(
                        'text-xs',
                        group.doneCount === group.items.length
                          ? 'text-muted-foreground'
                          : 'text-muted-foreground',
                      )}
                    >
                      {group.doneCount}/{group.items.length}
                    </span>
                  )}
                </div>

                {group.type.hint && (
                  <p className="text-muted-foreground mb-1.5 text-xs">{group.type.hint}</p>
                )}

                {/* Rynki przewijają się w poziomie zamiast zawijać —
                    patrz AGENTS.md, zasady mobile. */}
                <div className="no-scrollbar -mx-1 overflow-x-auto px-1">
                  <div className="flex w-max items-center gap-1.5">
                    {group.items.map((item) => {
                      const done = item.checkId !== null

                      return (
                        <label
                          key={`${item.type.id}|${item.market ?? ''}`}
                          className={cn(
                            'flex cursor-pointer items-center gap-1.5 rounded-md border px-2 py-1.5 text-xs font-medium transition',
                            done
                              ? 'bg-primary/10 border-primary/40 text-foreground'
                              : 'text-muted-foreground hover:bg-accent',
                          )}
                        >
                          <Checkbox
                            checked={done}
                            aria-label={`${item.type.name}${item.market ? ` — ${item.market}` : ''}`}
                            onCheckedChange={() =>
                              void toggle(item.type.id, item.market, item.checkId)
                            }
                          />
                          {item.market ?? 'Zrobione'}
                        </label>
                      )
                    })}
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  )
}
