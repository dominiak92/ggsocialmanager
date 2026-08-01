import { BellRingIcon, CalendarClockIcon, GiftIcon, MegaphoneIcon, UsersIcon } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'

import { FightEventsCard } from '@/components/dashboard/fight-events-card'
import { SignalCard, SignalRow } from '@/components/dashboard/signal-card'
import { dataProvider } from '@/data/provider'
import type { Publication } from '@/domain/models'
import {
  CONTEST_ALERT_LABEL,
  athletesDue,
  contestsNeedingAction,
  eventsNeedingPromo,
  upcomingEvents,
} from '@/domain/reminders'
import { useChannels } from '@/hooks/use-channels'
import { useAthletes, useContests, useEvents } from '@/hooks/use-domain'
import { useSilentChannels } from '@/hooks/use-silent-channels'

/**
 * Pulpit = przypomnienia. WSZYSTKIE sygnały są wyliczane z danych, żaden nie
 * jest osobną listą do uzupełniania — lista, o której trzeba pamiętać, żeby ją
 * wypełnić, nie chroni przed zapomnieniem.
 *
 * Logika sygnałów siedzi w `domain/reminders.ts` i ma testy; tutaj zostaje
 * wyłącznie składanie danych i prezentacja.
 */
export function DashboardPage() {
  const { channels, loading: channelsLoading } = useChannels()
  const { silent, loading: silenceLoading } = useSilentChannels(channels)
  const { items: events, loading: eventsLoading } = useEvents()
  const { items: contests, loading: contestsLoading } = useContests()
  const { items: athletes, loading: athletesLoading } = useAthletes()

  const [linked, setLinked] = useState<Publication[]>([])
  const [lastChecks, setLastChecks] = useState<Map<string, string>>(new Map())

  useEffect(() => {
    dataProvider.publications
      .listLinked()
      .then(setLinked)
      .catch(() => setLinked([]))
    dataProvider.athletes
      .lastCheckPerAthlete()
      .then(setLastChecks)
      .catch(() => setLastChecks(new Map()))
  }, [])

  // Jedno „dziś" na cały render — inaczej dwa sygnały mogłyby liczyć
  // względem różnych chwil, gdyby render trafił w północ.
  const today = useMemo(() => new Date(), [])

  const eventAlerts = useMemo(
    () => eventsNeedingPromo(events, linked, today),
    [events, linked, today],
  )
  const upcoming = useMemo(() => upcomingEvents(events, linked, today), [events, linked, today])
  const contestAlerts = useMemo(() => contestsNeedingAction(contests, today), [contests, today])
  const athleteAlerts = useMemo(
    () => athletesDue(athletes, lastChecks, today),
    [athletes, lastChecks, today],
  )

  const total = silent.length + eventAlerts.length + contestAlerts.length + athleteAlerts.length

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">Pulpit</h1>
        <p className="text-muted-foreground text-sm">
          {total === 0
            ? 'Nic się nie upomina — wszystko na bieżąco.'
            : `${total} ${total === 1 ? 'rzecz wymaga' : 'rzeczy wymaga'} uwagi.`}
        </p>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {/* Podgląd horyzontu, nie alarm. „Eventy bez zapowiedzi" milczą,
            dopóki wydarzenie nie wejdzie w swoje okno zapowiedzi — a przy
            planach na kwartał do przodu warto widzieć, co się szykuje. */}
        <SignalCard
          title="Najbliższe wydarzenia"
          description="Co się zbliża, niezależnie od tego, czy ma już zapowiedź."
          icon={CalendarClockIcon}
          to="/eventy"
          count={upcoming.length}
          loading={eventsLoading}
          emptyText="Nie ma nic zaplanowanego w przyszłości."
          tone="info"
        >
          {upcoming.map(({ event, daysUntil, promoCount, channelCount }) => (
            <SignalRow
              key={event.id}
              label={event.name}
              detail={
                promoCount === 0
                  ? `${event.place || 'bez miejsca'} · brak zapowiedzi`
                  : `${event.place || 'bez miejsca'} · ${promoCount} publ. na ${channelCount} kan.`
              }
              badge={daysUntil === 0 ? 'dziś' : `za ${daysUntil} dni`}
              urgent={daysUntil <= 3 && promoCount === 0}
            />
          ))}
        </SignalCard>

        <SignalCard
          title="Eventy bez zapowiedzi"
          description="Zbliża się, a nie poszła o tym ani jedna publikacja."
          icon={MegaphoneIcon}
          to="/eventy"
          count={eventAlerts.length}
          loading={eventsLoading}
          emptyText="Każdy nadchodzący event ma zapowiedź."
        >
          {eventAlerts.map(({ event, daysUntil }) => (
            <SignalRow
              key={event.id}
              label={event.name}
              detail={`${event.place || 'bez miejsca'} · start ${event.startsOn}`}
              badge={daysUntil === 0 ? 'dziś' : `za ${daysUntil} dni`}
              urgent={daysUntil <= 3}
            />
          ))}
        </SignalCard>

        <SignalCard
          title="Konkursy do ruszenia"
          description="Kończą się, minął termin albo nagroda wciąż czeka na wysyłkę."
          icon={GiftIcon}
          to="/konkursy"
          count={contestAlerts.length}
          loading={contestsLoading}
          emptyText="Żaden konkurs nie czeka na ruch."
        >
          {contestAlerts.map(({ contest, reason, daysUntilEnd }) => (
            <SignalRow
              key={contest.id}
              label={contest.name}
              detail={CONTEST_ALERT_LABEL[reason]}
              badge={
                daysUntilEnd < 0
                  ? `${Math.abs(daysUntilEnd)} dni po`
                  : daysUntilEnd === 0
                    ? 'dziś'
                    : `za ${daysUntilEnd} dni`
              }
              urgent={daysUntilEnd <= 0}
            />
          ))}
        </SignalCard>

        <SignalCard
          title="Ciche kanały"
          description="Każdy kanał ma własny próg — progi zmienisz w Ustawieniach."
          icon={BellRingIcon}
          to="/ustawienia"
          count={silent.length}
          loading={channelsLoading || silenceLoading}
          emptyText="Żaden kanał nie przekroczył swojego progu ciszy."
        >
          {silent.map(({ channel, daysSince, lastPublishedOn }) => (
            <SignalRow
              key={channel.id}
              label={channel.name}
              detail={
                daysSince === null
                  ? `nic nie było wrzucane · próg ${channel.reminderAfterDays} dn.`
                  : `ostatnio ${lastPublishedOn} · próg ${channel.reminderAfterDays} dn.`
              }
              badge={daysSince === null ? 'nigdy' : `${daysSince} dni`}
              urgent={daysSince === null}
            />
          ))}
        </SignalCard>

        <SignalCard
          title="Zawodnicy do odwiedzenia"
          description="Profile, których nie przeglądałeś dłużej niż ich rytm."
          icon={UsersIcon}
          to="/zawodnicy"
          count={athleteAlerts.length}
          loading={athletesLoading}
          emptyText="Wszystkie profile na bieżąco."
        >
          {athleteAlerts.map(({ athlete, daysSince, lastCheckedOn }) => (
            <SignalRow
              key={athlete.id}
              label={athlete.name}
              detail={
                daysSince === null
                  ? `nigdy nieprzejrzany · rytm ${athlete.checkEveryDays} dn.`
                  : `ostatnio ${lastCheckedOn} · rytm ${athlete.checkEveryDays} dn.`
              }
              badge={daysSince === null ? 'nigdy' : `${daysSince} dni`}
              urgent={daysSince === null}
              starred={athlete.isStarred}
            />
          ))}
        </SignalCard>

        <FightEventsCard mine={events} />
      </div>
    </div>
  )
}
