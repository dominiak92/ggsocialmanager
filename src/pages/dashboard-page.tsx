import { BellRingIcon, GiftIcon, MegaphoneIcon, UsersIcon } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'

import { DailyTasksCard } from '@/components/dashboard/daily-tasks-card'
import { FightEventsCard } from '@/components/dashboard/fight-events-card'
import { SignalCard, SignalRow } from '@/components/dashboard/signal-card'
import { TodayCard } from '@/components/dashboard/today-card'
import { dataProvider } from '@/data/provider'
import type { Publication } from '@/domain/models'
import {
  CONTEST_ALERT_LABEL,
  athletesDue,
  contestsNeedingAction,
  eventPromo,
} from '@/domain/reminders'
import { useChannels } from '@/hooks/use-channels'
import { useAthletes, useContests, useEvents } from '@/hooks/use-domain'
import { usePostTypes } from '@/hooks/use-post-types'
import { useSilentChannels } from '@/hooks/use-silent-channels'

/** Ile pozycji buduje strona — zgodne z limitem w `SignalCard`. */
const DASHBOARD_ROWS = 5

/**
 * Pulpit składa się z dwóch warstw i to rozróżnienie jest w nim najważniejsze:
 *
 * 1. **„Dziś" i „Codzienna rutyna"** — bieżąca praca. Odpowiadają na pytania,
 *    od których zaczyna się dzień: co mam dziś, co już poszło i czy nic nie
 *    wisi w skrzynkach.
 * 2. **Sygnały** — co umyka. WSZYSTKIE wyliczane z danych, żaden nie jest
 *    listą do uzupełniania: lista, o której trzeba pamiętać, żeby ją wypełnić,
 *    nie chroni przed zapomnieniem.
 *
 * Kolejność kart nie jest przypadkowa: najpierw to, co WYMAGA REAKCJI dziś
 * (ciche kanały, zaniedbani zawodnicy), a dopiero potem horyzont — wydarzenia,
 * konkursy i gale ze źródła zewnętrznego. Rzeczy odległe w czasie nie mogą
 * przykrywać tych, które palą się teraz.
 *
 * Świadomie NIE MA tu zbiorczego licznika „N rzeczy wymaga uwagi". Przy 38
 * zawodnikach bez ani jednego przeglądu pokazywał ~55 i przestawał cokolwiek
 * znaczyć — każda karta niesie własny, czytelny licznik.
 *
 * Logika sygnałów siedzi w `domain/reminders.ts` i ma testy; tutaj zostaje
 * wyłącznie składanie danych i prezentacja.
 */
export function DashboardPage() {
  const { channels, loading: channelsLoading } = useChannels()
  const { postTypes } = usePostTypes()
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

  const promo = useMemo(() => eventPromo(events, linked, today), [events, linked, today])

  /**
   * JEDNA karta wydarzeń zamiast dwóch.
   *
   * Wcześniej „Najbliższe wydarzenia" i „Eventy bez zapowiedzi" stały obok
   * siebie, a druga była podzbiorem pierwszej — te same nazwy w dwóch
   * miejscach, dwa razy do przeczytania. Teraz lista pokazuje horyzont,
   * a czerwona plakietka liczy tylko te, które naprawdę wymagają ruchu.
   */
  const upcoming = useMemo(
    () =>
      promo.filter((entry) => entry.daysUntil >= 0).toSorted((a, b) => a.daysUntil - b.daysUntil),
    [promo],
  )
  const needingPromo = useMemo(
    () => upcoming.filter((entry) => entry.promoCount === 0 && entry.inPromoWindow).length,
    [upcoming],
  )

  const contestAlerts = useMemo(() => contestsNeedingAction(contests, today), [contests, today])
  const athleteAlerts = useMemo(
    () => athletesDue(athletes, lastChecks, today),
    [athletes, lastChecks, today],
  )

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">Pulpit</h1>
        <p className="text-muted-foreground text-sm">Co dziś i co umyka.</p>
      </div>

      <TodayCard channels={channels} postTypes={postTypes} />

      <DailyTasksCard channels={channels} />

      <div className="grid gap-4 lg:grid-cols-2">
        <SignalCard
          title="Ciche kanały"
          description="Każdy kanał ma własny próg — progi zmienisz w Ustawieniach."
          icon={BellRingIcon}
          to="/ustawienia"
          count={silent.length}
          loading={channelsLoading || silenceLoading}
          emptyText="Żaden kanał nie przekroczył swojego progu ciszy."
        >
          {silent.slice(0, DASHBOARD_ROWS).map(({ channel, daysSince, lastPublishedOn }) => (
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
          {athleteAlerts.slice(0, DASHBOARD_ROWS).map(({ athlete, daysSince, lastCheckedOn }) => (
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

        <SignalCard
          title="Najbliższe wydarzenia"
          description="Czerwona plakietka liczy te, które weszły w okno zapowiedzi bez ani jednej publikacji."
          icon={MegaphoneIcon}
          to="/eventy"
          count={upcoming.length}
          alertCount={needingPromo}
          tone={needingPromo > 0 ? 'alert' : 'info'}
          loading={eventsLoading}
          emptyText="Nie ma nic zaplanowanego w przyszłości."
        >
          {upcoming
            .slice(0, DASHBOARD_ROWS)
            .map(({ event, daysUntil, promoCount, channelCount }) => (
              <SignalRow
                key={event.id}
                label={event.name}
                detail={
                  promoCount === 0
                    ? `${event.place || 'bez miejsca'} · brak zapowiedzi`
                    : `${event.place || 'bez miejsca'} · ${promoCount} publ. na ${channelCount} kan.`
                }
                badge={daysUntil === 0 ? 'dziś' : `za ${daysUntil} dni`}
                urgent={promoCount === 0 && daysUntil <= event.promoLeadDays}
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
          {contestAlerts.slice(0, DASHBOARD_ROWS).map(({ contest, reason, daysUntilEnd }) => (
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

        <FightEventsCard mine={events} today={today} />
      </div>
    </div>
  )
}
