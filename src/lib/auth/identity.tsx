/**
 * PUNKT WYMIANY TOŻSAMOŚCI.
 *
 * Ta aplikacja docelowo jest częścią większego systemu, który loguje przez
 * Google i przekaże tu gotową tożsamość. Do tego czasu działa prosta bramka
 * na hasło — cały dostęp do „kto jest zalogowany" idzie przez `useIdentity()`,
 * więc podpięcie prawdziwego auth to podmiana `signIn`/`restore` w TYM pliku.
 *
 * ┌─────────────────────────────────────────────────────────────────────┐
 * │ UWAGA — CZYM TA BRAMKA NIE JEST                                     │
 * │                                                                     │
 * │ To ZASŁONA, nie zamek. Hasło jest porównywane w przeglądarce, więc  │
 * │ siedzi w bundlu JS i da się je odczytać. Co ważniejsze: klucz `anon`│
 * │ Supabase też jest publiczny, a polityki RLS są otwarte — dane są    │
 * │ nadal dostępne przez samo API, z pominięciem tego ekranu.           │
 * │                                                                     │
 * │ Bramka chroni przed przypadkowym gościem, NIE przed kimś, kto chce  │
 * │ się dostać do danych. Realna ochrona = Supabase Auth + polityki RLS │
 * │ przestawione z `anon` na `authenticated`. Patrz AGENTS.md.          │
 * └─────────────────────────────────────────────────────────────────────┘
 */
import { createContext, use, useCallback, useMemo, useState, type ReactNode } from 'react'

import type { Identity } from '@/domain/models'

const STORAGE_KEY = 'ggsm:identity'
const USERNAME = 'admin'

/**
 * Hasło NIE jest w kodzie, bo repozytorium jest publiczne — commit z hasłem
 * opublikowałby je na GitHubie. Wartość wchodzi ze zmiennej środowiskowej
 * (Netlify + `.env.local`). Gdy jej nie ma, bramka jest wyłączona: lokalny
 * dev nie może się przez to zablokować.
 */
const PASSWORD = import.meta.env.VITE_APP_PASSWORD ?? ''
export const GATE_ENABLED = PASSWORD.length > 0

const ADMIN: Identity = {
  id: '00000000-0000-0000-0000-000000000001',
  email: 'admin@ggsocialmanager.local',
  displayName: 'Admin',
  avatarUrl: null,
}

function restore(): Identity | null {
  if (!GATE_ENABLED) return ADMIN
  try {
    return localStorage.getItem(STORAGE_KEY) ? ADMIN : null
  } catch {
    // Prywatne okno bez magazynu — trzeba się logować za każdym razem.
    return null
  }
}

type IdentityContextValue = {
  identity: Identity | null
  /** `true`, gdy dane się zgadzają. Bramka nie odróżnia „zły login" od „złe hasło". */
  signIn: (username: string, password: string) => boolean
  signOut: () => void
}

const IdentityContext = createContext<IdentityContextValue>({
  identity: null,
  signIn: () => false,
  signOut: () => {},
})

export function IdentityProvider({ children }: { children: ReactNode }) {
  const [identity, setIdentity] = useState<Identity | null>(restore)

  const signIn = useCallback((username: string, password: string) => {
    if (username.trim().toLowerCase() !== USERNAME || password !== PASSWORD) return false

    try {
      localStorage.setItem(STORAGE_KEY, '1')
    } catch {
      // Brak magazynu tylko skraca sesję do jednej karty — logowanie działa.
    }
    setIdentity(ADMIN)
    return true
  }, [])

  const signOut = useCallback(() => {
    try {
      localStorage.removeItem(STORAGE_KEY)
    } catch {
      // jw.
    }
    setIdentity(null)
  }, [])

  const value = useMemo(() => ({ identity, signIn, signOut }), [identity, signIn, signOut])

  return <IdentityContext value={value}>{children}</IdentityContext>
}

/** Aktualna tożsamość i operacje na sesji. */
export function useIdentity(): IdentityContextValue {
  return use(IdentityContext)
}
