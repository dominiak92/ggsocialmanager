import { useCallback, useSyncExternalStore } from 'react'

/**
 * Zapytanie medialne dostępne w JavaScripcie.
 *
 * Większość rzeczy responsywnych robimy KLASAMI CSS — są szybsze i nie migoczą
 * przy pierwszym renderze. Ten hook jest dla przypadków, w których od szerokości
 * ekranu zależy ZACHOWANIE, a nie wygląd: np. który widok kalendarza otworzyć
 * domyślnie albo czy nawigacja ma być szufladą. Do samego wyglądu go nie używaj.
 *
 * `useSyncExternalStore` zamiast `useState` + `useEffect`: React sam pilnuje
 * subskrypcji i nie ma jednej klatki ze złą wartością.
 */
export function useMediaQuery(query: string): boolean {
  const subscribe = useCallback(
    (onChange: () => void) => {
      const list = window.matchMedia(query)
      list.addEventListener('change', onChange)
      return () => list.removeEventListener('change', onChange)
    },
    [query],
  )

  return useSyncExternalStore(
    subscribe,
    () => window.matchMedia(query).matches,
    // Wartość na serwerze/bez okna: zakładamy szeroki ekran, bo to wariant
    // bogatszy — na telefonie i tak przestawi się przy pierwszym pomiarze.
    () => false,
  )
}

/** Telefon: poniżej breakpointu `sm` Tailwinda. */
export function useIsMobile(): boolean {
  return useMediaQuery('(max-width: 639px)')
}
