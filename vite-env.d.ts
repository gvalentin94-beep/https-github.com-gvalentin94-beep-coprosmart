
// The reference to "vite/client" has been removed to resolve a TypeScript compilation error.
// The application does not use Vite-specific client types, so this change is safe.
// Added ImportMeta definitions to support import.meta.env

interface ImportMetaEnv {
  readonly VITE_SUPABASE_URL: string;
  readonly VITE_SUPABASE_ANON_KEY: string;
  readonly PACKAGE_VERSION: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
