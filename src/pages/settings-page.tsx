import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Skeleton } from '@/components/ui/skeleton'
import { Switch } from '@/components/ui/switch'
import { sectionsOf } from '@/domain/calendar'
import { CHANNEL_GROUP_LABEL, PLATFORM_LABEL } from '@/domain/enums'
import { useChannels } from '@/hooks/use-channels'

/**
 * Ustawienia kanałów. Wyłączony kanał znika z kalendarza, ale jego wpisy
 * zostają w bazie — dlatego wyłączanie, a nie kasowanie.
 */
export function SettingsPage() {
  const { channels, error, loading, setActive } = useChannels()
  const sections = sectionsOf(channels)

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">Ustawienia</h1>
        <p className="text-muted-foreground text-sm">
          Wyłączone kanały znikają z kalendarza. Wpisy z przeszłości zostają nienaruszone.
        </p>
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
            </CardHeader>
            <CardContent className="divide-y">
              {section.channels.map((channel) => (
                <div key={channel.id} className="flex items-center gap-3 py-2.5">
                  <div className="min-w-0 flex-1">
                    <Label htmlFor={`channel-${channel.id}`} className="text-sm font-medium">
                      {channel.name}
                    </Label>
                    <p className="text-muted-foreground text-xs">
                      {PLATFORM_LABEL[channel.platform]}
                      {channel.locale ? ` · ${channel.locale}` : ''}
                    </p>
                  </div>
                  <Switch
                    id={`channel-${channel.id}`}
                    checked={channel.isActive}
                    onCheckedChange={(checked) => {
                      void setActive(channel.id, checked).catch(() => {
                        // Hook cofa przełącznik i wystawia błąd wyżej.
                      })
                    }}
                  />
                </div>
              ))}
            </CardContent>
          </Card>
        ))
      )}
    </div>
  )
}
