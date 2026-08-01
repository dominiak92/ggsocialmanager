import { cn } from '@/lib/utils'

/**
 * Logo marki Ground Game z dopiskiem produktu.
 *
 * Pliki w `public/` są OFICJALNE (przeniesione z groundgamelab) — nie
 * odrysowujemy znaku marki ręcznie. Podmiana logo = podmiana pliku.
 *
 * Dwa warianty, bo wordmark ma wpisane kolory: `gg-logo-inline.svg` jest
 * czarno-cyjanowy (pod jasne tło), `-dark` biało-cyjanowy (pod ciemne).
 * Przełączamy je klasą `dark:`, a nie JavaScriptem, żeby nie mrugało przy
 * pierwszym renderze, zanim motyw zostanie ustalony.
 */
export function Logo({ className }: { className?: string }) {
  return (
    <span className={cn('flex items-center gap-2.5', className)}>
      <img
        src="/gg-logo-inline.svg"
        alt="Ground Game"
        className="h-5 w-auto shrink-0 select-none dark:hidden"
      />
      <img
        src="/gg-logo-inline-dark.svg"
        alt="Ground Game"
        className="hidden h-5 w-auto shrink-0 select-none dark:block"
      />
      <span
        aria-label="Social Manager"
        className="text-muted-foreground border-border hidden border-l pl-2.5 text-sm font-medium tracking-tight sm:inline"
      >
        Social Manager
      </span>
    </span>
  )
}
