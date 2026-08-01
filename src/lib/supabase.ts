import { createClient } from '@supabase/supabase-js'

import type { Database } from '@/lib/database.types'

const url = import.meta.env.VITE_SUPABASE_URL
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!url || !anonKey) {
  throw new Error(
    'Brak konfiguracji Supabase. Skopiuj .env.example do .env.local i uzupełnij ' +
      'VITE_SUPABASE_URL oraz VITE_SUPABASE_ANON_KEY.',
  )
}

// Klient jest przypięty do schematu `ggsm` — cała domena aplikacji żyje tam,
// nie w `public`. Patrz AGENTS.md → sekcja Supabase.
//
// `persistSession: false` jest świadome: ta aplikacja NIE prowadzi własnej
// sesji. Tożsamość dostarcza aplikacja nadrzędna (patrz `lib/auth/identity.tsx`),
// więc trzymanie tu drugiego, konkurencyjnego stanu logowania tylko myli.
export const supabase = createClient<Database, 'ggsm'>(url, anonKey, {
  db: { schema: 'ggsm' },
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
})
