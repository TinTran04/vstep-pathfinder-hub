/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Data source mode: "mock" (default) or "api" */
  readonly VITE_DATA_SOURCE?: "mock" | "api";
  /** Base URL for the backend API, e.g. http://localhost:4000/api/v1 */
  readonly VITE_API_BASE_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
