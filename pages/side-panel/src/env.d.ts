interface ImportMetaEnv {
  readonly VITE_API_URL: string;
  readonly VITE_BEARER_TOKEN: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
