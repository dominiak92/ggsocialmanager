import { BellRingIcon, CheckCircle2Icon, VolumeXIcon } from 'lucide-react'
import { Link } from 'react-router'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { useChannels } from '@/hooks/use-channels'
import { useSilentChannels } from '@/hooks/use-silent-channels'

/**
 * Pulpit = przypomnienia. Sygnały są WYLICZANE z danych, nie wpisywane
 * ręcznie — lista, o której trzeba pamiętać, żeby ją uzupełnić, nie chroni
 * przed zapomnieniem.
 *
 * Na razie jest tu jeden sygnał (cisza na kanale). Kolejne (eventy bez
 * nagłośnienia, konkursy do zamknięcia, zawodnicy bez przeglądu) dochodzą
 * w krokach 3–5.
 */
export function DashboardPage() {
  const { channels, loading: channelsLoading } = useChannels()
  const { silent, error, loading } = useSilentChannels(channels)

  const busy = channelsLoading || loading

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">Pulpit</h1>
        <p className="text-muted-foreground text-sm">Co się upomina i czego brakuje.</p>
      </div>

      {error && (
        <p className="border-destructive/40 bg-destructive/10 text-destructive rounded-md border px-3 py-2 text-sm">
          {error}
        </p>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BellRingIcon className="size-4" />
            Ciche kanały
          </CardTitle>
          <CardDescription>
            Każdy kanał ma własny próg — Instagram milczący 3 dni to problem, newsletter co 30 dni
            to norma. Progi zmienisz w Ustawieniach.
          </CardDescription>
        </CardHeader>

        <CardContent>
          {busy ? (
            <div className="space-y-2">
              {Array.from({ length: 3 }, (_, index) => (
                <Skeleton key={index} className="h-10 w-full" />
              ))}
            </div>
          ) : silent.length === 0 ? (
            <div className="text-muted-foreground flex items-center gap-2 py-2 text-sm">
              <CheckCircle2Icon className="text-primary size-4" />
              Żaden kanał nie przekroczył swojego progu ciszy.
            </div>
          ) : (
            <ul className="divide-y">
              {silent.map(({ channel, daysSince, lastPublishedOn }) => (
                <li key={channel.id} className="flex items-center gap-3 py-2.5">
                  <VolumeXIcon className="text-muted-foreground size-4 shrink-0" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{channel.name}</p>
                    <p className="text-muted-foreground text-xs">
                      {daysSince === null
                        ? 'nic nie było wrzucane'
                        : `ostatnio ${daysSince} dni temu (${lastPublishedOn})`}
                      {` · próg ${channel.reminderAfterDays} dn.`}
                    </p>
                  </div>
                  <Badge variant={daysSince === null ? 'destructive' : 'secondary'}>
                    {daysSince === null ? 'nigdy' : `${daysSince} dni`}
                  </Badge>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      <div className="flex flex-wrap gap-2">
        <Button asChild>
          <Link to="/kalendarz">Otwórz kalendarz</Link>
        </Button>
        <Button asChild variant="outline">
          <Link to="/ustawienia">Ustawienia kanałów</Link>
        </Button>
      </div>
    </div>
  )
}
