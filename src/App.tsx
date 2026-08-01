import { Route, Routes } from 'react-router'

import { AppShell } from '@/components/layout/app-shell'
import { Toaster } from '@/components/ui/sonner'
import { AthletesPage } from '@/pages/athletes-page'
import { CalendarPage } from '@/pages/calendar-page'
import { ContestsPage } from '@/pages/contests-page'
import { DashboardPage } from '@/pages/dashboard-page'
import { EventsPage } from '@/pages/events-page'
import { IdeasPage } from '@/pages/ideas-page'
import { NotFoundPage } from '@/pages/not-found-page'
import { RecordingsPage } from '@/pages/recordings-page'
import { SettingsPage } from '@/pages/settings-page'

export default function App() {
  return (
    <AppShell>
      <Routes>
        <Route path="/" element={<DashboardPage />} />
        <Route path="/kalendarz" element={<CalendarPage />} />
        <Route path="/eventy" element={<EventsPage />} />
        <Route path="/konkursy" element={<ContestsPage />} />
        <Route path="/zawodnicy" element={<AthletesPage />} />
        <Route path="/nagrywki" element={<RecordingsPage />} />
        <Route path="/pomysly" element={<IdeasPage />} />
        <Route path="/ustawienia" element={<SettingsPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
      <Toaster />
    </AppShell>
  )
}
