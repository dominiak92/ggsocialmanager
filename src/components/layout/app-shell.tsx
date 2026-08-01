import {
  CalendarDaysIcon,
  GiftIcon,
  LayoutDashboardIcon,
  LightbulbIcon,
  LogOutIcon,
  MegaphoneIcon,
  MenuIcon,
  SettingsIcon,
  UsersIcon,
  VideoIcon,
} from 'lucide-react'
import { useEffect, useState, type ReactNode } from 'react'
import { NavLink, useLocation } from 'react-router'

import { Logo } from '@/components/brand/logo'
import { ThemeToggle } from '@/components/theme-toggle'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { useIsMobile } from '@/hooks/use-media-query'
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

function navClass({ isActive }: { isActive: boolean }) {
  return cn(
    'flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-sm transition',
    isActive
      ? 'bg-secondary text-secondary-foreground font-medium'
      : 'text-muted-foreground hover:bg-accent hover:text-foreground',
  )
}

export function AppShell({ children }: { children: ReactNode }) {
  const { pathname } = useLocation()
  const { signOut } = useIdentity()
  const isMobile = useIsMobile()
  const [menuOpen, setMenuOpen] = useState(false)

  // Zmiana trasy zamyka szufladę. Bez tego menu zostaje otwarte nad nowym
  // widokiem i trzeba je zamykać ręcznie po każdym przejściu.
  useEffect(() => setMenuOpen(false), [pathname])

  return (
    <div className="flex min-h-dvh flex-col">
      <header className="bg-background/80 sticky top-0 z-30 border-b backdrop-blur">
        <div className="mx-auto flex h-14 w-full max-w-7xl items-center gap-2 px-4">
          {/* Osiem zakładek nie mieści się na telefonie — przewijany pasek
              zmuszał do szukania celu w poziomie. Na wąskim ekranie zastępuje
              go szuflada z pełnymi nazwami. */}
          {isMobile && (
            <Button
              variant="ghost"
              size="icon-sm"
              aria-label="Menu"
              onClick={() => setMenuOpen(true)}
            >
              <MenuIcon />
            </Button>
          )}

          <Logo className="shrink-0" />

          {!isMobile && (
            <nav className="no-scrollbar -mx-2 flex-1 overflow-x-auto px-2">
              <ul className="flex w-max items-center gap-1">
                {NAV.map((item) => (
                  <li key={item.to}>
                    <NavLink to={item.to} end={item.to === '/'} className={navClass}>
                      <item.icon className="size-4" />
                      {item.label}
                    </NavLink>
                  </li>
                ))}
              </ul>
            </nav>
          )}

          <div className="ml-auto flex shrink-0 items-center">
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
        </div>
      </header>

      <Sheet open={menuOpen} onOpenChange={setMenuOpen}>
        <SheetContent side="left" className="w-72">
          <SheetHeader>
            <SheetTitle asChild>
              <Logo />
            </SheetTitle>
          </SheetHeader>

          <nav className="px-4 pb-4">
            <ul className="space-y-1">
              {NAV.map((item) => (
                <li key={item.to}>
                  <NavLink
                    to={item.to}
                    end={item.to === '/'}
                    className={({ isActive }) =>
                      cn(navClass({ isActive }), 'w-full py-2.5 text-base')
                    }
                  >
                    <item.icon className="size-4" />
                    {item.label}
                  </NavLink>
                </li>
              ))}
            </ul>
          </nav>
        </SheetContent>
      </Sheet>

      <main key={pathname} className="motion-safe:animate-in motion-safe:fade-in flex-1">
        <div className="mx-auto w-full max-w-7xl px-4 py-6">{children}</div>
      </main>
    </div>
  )
}
