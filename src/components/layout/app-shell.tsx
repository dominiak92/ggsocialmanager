import {
  CalendarDaysIcon,
  GiftIcon,
  LayoutDashboardIcon,
  LightbulbIcon,
  MegaphoneIcon,
  LogOutIcon,
  SettingsIcon,
  UsersIcon,
  VideoIcon,
} from 'lucide-react'
import type { ReactNode } from 'react'
import { NavLink, useLocation } from 'react-router'

import { Logo } from '@/components/brand/logo'
import { ThemeToggle } from '@/components/theme-toggle'
import { Button } from '@/components/ui/button'
import { GATE_ENABLED, useIdentity } from '@/lib/auth/identity'
import { cn } from '@/lib/utils'

/**
 * Rama aplikacji: nagłówek z nawigacją + obszar treści.
 *
 * Wejście widoku jest JEDNO i należy do layoutu (`key={pathname}` na <main>).
 * Nie dokładaj animacji wejścia na kontenerach stron ani listach — przy
 * dociąganiu danych odpalałyby się ponownie i dawały kaskadę migotania.
 */
const NAV = [
  { to: '/', label: 'Pulpit', icon: LayoutDashboardIcon },
  { to: '/kalendarz', label: 'Kalendarz', icon: CalendarDaysIcon },
  { to: '/eventy', label: 'Eventy', icon: MegaphoneIcon },
  { to: '/konkursy', label: 'Konkursy', icon: GiftIcon },
  { to: '/zawodnicy', label: 'Zawodnicy', icon: UsersIcon },
  { to: '/nagrywki', label: 'Nagrywki', icon: VideoIcon },
  { to: '/pomysly', label: 'Pomysły', icon: LightbulbIcon },
  { to: '/ustawienia', label: 'Ustawienia', icon: SettingsIcon },
]

export function AppShell({ children }: { children: ReactNode }) {
  const { pathname } = useLocation()
  const { signOut } = useIdentity()

  return (
    <div className="flex min-h-dvh flex-col">
      <header className="bg-background/80 sticky top-0 z-30 border-b backdrop-blur">
        <div className="mx-auto flex h-14 w-full max-w-7xl items-center gap-4 px-4">
          <Logo className="shrink-0" />

          {/* Pasek nawigacji nie zawija się — przewija w poziomie.
              Patrz AGENTS.md → zasady mobile. */}
          <nav className="no-scrollbar -mx-2 flex-1 overflow-x-auto px-2">
            <ul className="flex w-max items-center gap-1">
              {NAV.map((item) => (
                <li key={item.to}>
                  <NavLink
                    to={item.to}
                    end={item.to === '/'}
                    className={({ isActive }) =>
                      cn(
                        'flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-sm transition',
                        isActive
                          ? 'bg-secondary text-secondary-foreground font-medium'
                          : 'text-muted-foreground hover:bg-accent hover:text-foreground',
                      )
                    }
                  >
                    <item.icon className="size-4" />
                    {item.label}
                  </NavLink>
                </li>
              ))}
            </ul>
          </nav>

          <ThemeToggle />
          {GATE_ENABLED && (
            <Button
              variant="ghost"
              size="icon-sm"
              aria-label="Wyloguj"
              title="Wyloguj"
              onClick={signOut}
            >
              <LogOutIcon />
            </Button>
          )}
        </div>
      </header>

      <main key={pathname} className="motion-safe:animate-in motion-safe:fade-in flex-1">
        <div className="mx-auto w-full max-w-7xl px-4 py-6">{children}</div>
      </main>
    </div>
  )
}
