import { Link, useLocation } from 'react-router'
import type { ReactNode } from 'react'

import { ThemeToggle } from '@/components/theme-toggle'
import { useIdentity } from '@/lib/auth/identity'

/**
 * Rama aplikacji: nagłówek + obszar treści.
 *
 * Wejście widoku jest JEDNO i należy do layoutu (`key={pathname}` na <main>).
 * Nie dokładaj animacji wejścia na kontenerach stron ani listach — przy
 * dociąganiu danych odpalałyby się ponownie i dawały kaskadę migotania.
 */
export function AppShell({ children }: { children: ReactNode }) {
  const { pathname } = useLocation()
  const identity = useIdentity()

  return (
    <div className="flex min-h-dvh flex-col">
      <header className="bg-background/80 sticky top-0 z-10 border-b backdrop-blur">
        <div className="mx-auto flex h-14 w-full max-w-5xl items-center gap-4 px-4">
          <Link to="/" className="font-semibold tracking-tight">
            GG Social Manager
          </Link>
          <div className="ml-auto flex items-center gap-3">
            <span className="text-muted-foreground hidden text-sm sm:inline">
              {identity?.displayName ?? 'Niezalogowany'}
            </span>
            <ThemeToggle />
          </div>
        </div>
      </header>

      <main key={pathname} className="motion-safe:animate-in motion-safe:fade-in flex-1">
        <div className="mx-auto w-full max-w-5xl px-4 py-8">{children}</div>
      </main>

      <footer className="text-muted-foreground border-t py-6 text-center text-xs">
        GG Social Manager — fundament projektu
      </footer>
    </div>
  )
}
