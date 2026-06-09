/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Mapbox PUBLIC access token (pk.…). Inlined into the client bundle. */
  readonly VITE_MAPBOX_TOKEN: string
  /** Supabase project URL — Phase 3, may be empty for now. */
  readonly VITE_SUPABASE_URL?: string
  /** Supabase anon key (public, RLS-protected) — Phase 3, may be empty. */
  readonly VITE_SUPABASE_ANON_KEY?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
