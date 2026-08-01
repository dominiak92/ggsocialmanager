/**
 * PUNKT WYMIANY TOŻSAMOŚCI.
 *
 * Ta aplikacja świadomie NIE MA własnego logowania. Docelowo jest częścią
 * większej aplikacji, która loguje przez Google i przekaże tu gotową tożsamość.
 *
 * Dlatego cały dostęp do „kto jest zalogowany" idzie przez `useIdentity()`.
 * Podpięcie prawdziwego auth = podmiana `resolveIdentity` niżej (np. odczyt
 * sesji z aplikacji nadrzędnej) — reszta kodu się nie zmienia.
 *
 * NIE dodawaj tu ekranu logowania ani `supabase.auth.signIn*`. Patrz AGENTS.md
 * → „Tożsamość i auth".
 */
import { createContext, use, useMemo, type ReactNode } from 'react'

import type { Identity } from '@/domain/models'

/**
 * Tożsamość zastępcza na czas, gdy aplikacja działa samodzielnie.
 * Nie jest to konto testowe z bazy — RLS jej nie zna i nie honoruje.
 */
const PLACEHOLDER_IDENTITY: Identity = {
  id: '00000000-0000-0000-0000-000000000000',
  email: 'demo@ggsocialmanager.local',
  displayName: 'Tryb samodzielny',
  avatarUrl: null,
}

/**
 * Jedyne miejsce, które ustala tożsamość. Po podpięciu aplikacji nadrzędnej
 * zwróć tu jej użytkownika (i `null`, gdy niezalogowany).
 */
function resolveIdentity(): Identity | null {
  return PLACEHOLDER_IDENTITY
}

const IdentityContext = createContext<Identity | null>(null)

export function IdentityProvider({ children }: { children: ReactNode }) {
  const identity = useMemo(resolveIdentity, [])

  return <IdentityContext value={identity}>{children}</IdentityContext>
}

/** Aktualna tożsamość; `null` = brak zalogowanego użytkownika. */
export function useIdentity(): Identity | null {
  return use(IdentityContext)
}
