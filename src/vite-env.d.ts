/// <reference types="vite/client" />

// Muszą to być `interface`, nie aliasy `type` — tu działa deklaracyjne
// scalanie (declaration merging) z typami Vite. Alias by go nie rozszerzył.
interface ImportMetaEnv {
  readonly VITE_SUPABASE_URL: string
  readonly VITE_SUPABASE_ANON_KEY: string
  /**
   * Hasło do bramki wejściowej. Gdy puste, bramka jest wyłączona (dev).
   * NIE trzymamy go w kodzie — repozytorium jest publiczne.
   */
  readonly VITE_APP_PASSWORD?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
