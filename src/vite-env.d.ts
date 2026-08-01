/// <reference types="vite/client" />

// Muszą to być `interface`, nie aliasy `type` — tu działa deklaracyjne
// scalanie (declaration merging) z typami Vite. Alias by go nie rozszerzył.
interface ImportMetaEnv {
  readonly VITE_SUPABASE_URL: string
  readonly VITE_SUPABASE_ANON_KEY: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
