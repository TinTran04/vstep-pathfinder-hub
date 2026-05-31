// src/services/api-client.ts
// ============================================================
// Lightweight API client wrapper.
//
// Usage:
//   import { apiClient } from "@/services/api-client";
//   const data = await apiClient.get<MyType>("/attempts/123");
//   const result = await apiClient.post<MyType>("/attempts/start", { mode: "mock_test" });
//
// Base URL is read from VITE_API_BASE_URL (defaults to "/api/v1").
// Auth token can be injected by setting apiClient.authToken before any call.
// ============================================================

const DEFAULT_BASE_URL = "/api";

// ----------------------------------------------------------------
// Types
// ----------------------------------------------------------------

export interface ApiResponse<T> {
  success: boolean;
  data: T;
}

export interface ApiError {
  status: number;
  message: string;
  details?: unknown;
}

// ----------------------------------------------------------------
// Internal helpers
// ----------------------------------------------------------------

function getBaseUrl(): string {
  return (import.meta.env.VITE_API_BASE_URL ?? DEFAULT_BASE_URL).replace(/\/$/, "");
}

async function parseResponse<T>(res: Response): Promise<T> {
  let body: unknown;
  const contentType = res.headers.get("content-type") ?? "";
  if (contentType.includes("application/json")) {
    body = await res.json();
  } else {
    body = await res.text();
  }

  if (!res.ok) {
    const error: ApiError = {
      status: res.status,
      message:
        (body as { message?: string })?.message ??
        `HTTP ${res.status} ${res.statusText}`,
      details: body,
    };
    throw error;
  }

  // If the response wraps data under a "data" key (our API contract), unwrap it.
  if (body !== null && typeof body === "object" && "data" in (body as object)) {
    return (body as ApiResponse<T>).data;
  }
  return body as T;
}

function buildHeaders(extraHeaders?: HeadersInit): Headers {
  const headers = new Headers(extraHeaders);
  headers.set("Content-Type", "application/json");

  // Inject auth token if provided (will be set after login in future).
  const authToken = apiClient.authToken ?? localStorage.getItem("vstep_access_token");
  if (authToken) {
    apiClient.authToken = authToken;
    headers.set("Authorization", `Bearer ${authToken}`);
  }
  return headers;
}

// ----------------------------------------------------------------
// apiClient
// ----------------------------------------------------------------

export const apiClient = {
  /**
   * Optional auth token — set this after login.
   * e.g. apiClient.authToken = response.data.token;
   */
  authToken: null as string | null,

  async get<T>(path: string, extraHeaders?: HeadersInit): Promise<T> {
    const res = await fetch(`${getBaseUrl()}${path}`, {
      method: "GET",
      headers: buildHeaders(extraHeaders),
    });
    return parseResponse<T>(res);
  },

  async post<T>(path: string, body?: unknown, extraHeaders?: HeadersInit): Promise<T> {
    const res = await fetch(`${getBaseUrl()}${path}`, {
      method: "POST",
      headers: buildHeaders(extraHeaders),
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
    return parseResponse<T>(res);
  },

  async patch<T>(path: string, body?: unknown, extraHeaders?: HeadersInit): Promise<T> {
    const res = await fetch(`${getBaseUrl()}${path}`, {
      method: "PATCH",
      headers: buildHeaders(extraHeaders),
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
    return parseResponse<T>(res);
  },

  async put<T>(path: string, body?: unknown, extraHeaders?: HeadersInit): Promise<T> {
    const res = await fetch(`${getBaseUrl()}${path}`, {
      method: "PUT",
      headers: buildHeaders(extraHeaders),
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
    return parseResponse<T>(res);
  },

  async delete<T>(path: string, extraHeaders?: HeadersInit): Promise<T> {
    const res = await fetch(`${getBaseUrl()}${path}`, {
      method: "DELETE",
      headers: buildHeaders(extraHeaders),
    });
    return parseResponse<T>(res);
  },

  /**
   * Upload a file using multipart/form-data.
   * (Content-Type must NOT be set manually — browser sets the boundary.)
   */
  async upload<T>(path: string, formData: FormData): Promise<T> {
    const headers = new Headers();
    const authToken = apiClient.authToken ?? localStorage.getItem("vstep_access_token");
    if (authToken) {
      apiClient.authToken = authToken;
      headers.set("Authorization", `Bearer ${authToken}`);
    }
    const res = await fetch(`${getBaseUrl()}${path}`, {
      method: "POST",
      headers,
      body: formData,
    });
    return parseResponse<T>(res);
  },
};

export default apiClient;
