import { Route, Routes } from 'react-router'

import { AppShell } from '@/components/layout/app-shell'
import { Toaster } from '@/components/ui/sonner'
import { CalendarPage } from '@/pages/calendar-page'
import { DashboardPage } from '@/pages/dashboard-page'
import { NotFoundPage } from '@/pages/not-found-page'
import { SettingsPage } from '@/pages/settings-page'

export default function App() {
  return (
    <AppShell>
      <Routes>
        <Route path="/" element={<DashboardPage />} />
        <Route path="/kalendarz" element={<CalendarPage />} />
        <Route path="/ustawienia" element={<SettingsPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
      <Toaster />
    </AppShell>
  )
}
