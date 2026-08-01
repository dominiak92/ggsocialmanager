import { CheckCircle2Icon, DatabaseIcon, XCircleIcon } from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { useHealth } from '@/hooks/use-health'

/**
 * Pulpit. Na razie ma jedno zadanie: pokazać, że aplikacja NAPRAWDĘ czyta
 * z bazy (a nie renderuje zaślepki). Gdy dojdzie właściwa domena, ta karta
 * zostaje jako sonda albo znika — nic od niej nie zależy.
 */
export function DashboardPage() {
  const { data, error, loading } = useHealth()

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h1 className="text-3xl font-semibold tracking-tight">Pulpit</h1>
        <p className="text-muted-foreground">
          Fundament projektu — aplikacja, baza i deploy są spięte. Model domenowy dopiszemy przy
          pierwszej funkcji.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DatabaseIcon className="size-4" />
            Połączenie z Supabase
          </CardTitle>
          <CardDescription>
            Odczyt z tabeli <code className="text-xs">ggsm.app_health</code> przez warstwę
            repozytoriów.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-2">
              <Skeleton className="h-6 w-40" />
              <Skeleton className="h-4 w-64" />
            </div>
          ) : error ? (
            <div className="space-y-2">
              <Badge variant="destructive" className="gap-1">
                <XCircleIcon className="size-3" />
                Brak połączenia
              </Badge>
              <p className="text-muted-foreground text-sm">{error}</p>
            </div>
          ) : (
            <div className="space-y-2">
              <Badge className="gap-1">
                <CheckCircle2Icon className="size-3" />
                Połączono
              </Badge>
              <p className="text-muted-foreground text-sm">
                {data?.label ?? 'Brak wpisu sondy'}
                {data ? ` — odczyt z ${new Date(data.checkedAt).toLocaleString('pl-PL')}` : ''}
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
