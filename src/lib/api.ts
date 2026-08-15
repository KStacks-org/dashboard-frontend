const API_BASE = import.meta.env.VITE_API_BASE_URL ?? "";

/** Absolute URL for an API path — needed by EventSource, which takes no options. */
export function apiUrl(path: string): string {
  return `${API_BASE}/api${path}`;
}

export class ApiError extends Error {
  readonly status: number;
  readonly code: string;
  readonly details?: unknown;

  constructor(status: number, code: string, message: string, details?: unknown) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

function readCsrfToken(): string | null {
  const match = document.cookie.match(/(?:^|;\s*)kstacks\.csrf=([^;]*)/);
  return match?.[1] ? decodeURIComponent(match[1]) : null;
}

type RequestOptions = {
  method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  body?: unknown;
  signal?: AbortSignal;
};

export async function apiRequest<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { method = "GET", body, signal } = options;
  const headers: Record<string, string> = {};

  if (body !== undefined) headers["Content-Type"] = "application/json";
  if (method !== "GET") {
    const csrf = readCsrfToken();
    if (csrf) headers["x-csrf-token"] = csrf;
  }

  let response: Response;
  try {
    response = await fetch(`${API_BASE}/api${path}`, {
      method,
      headers,
      credentials: "include",
      body: body === undefined ? undefined : JSON.stringify(body),
      signal,
    });
  } catch {
    throw new ApiError(0, "NETWORK_ERROR", "Could not reach the server");
  }

  if (response.status === 204) return undefined as T;

  const payload = await response.json().catch(() => null);

  if (!response.ok) {
    const error = (
      payload as {
        error?: { code?: string; message?: string; details?: unknown };
      }
    )?.error;
    throw new ApiError(
      response.status,
      error?.code ?? "UNKNOWN",
      error?.message ?? "Request failed",
      error?.details,
    );
  }

  return payload as T;
}
