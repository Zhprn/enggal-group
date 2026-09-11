const DEFAULT_API_BASE_URL = "http://localhost:3003";

export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL
  ? `${import.meta.env.VITE_API_BASE_URL}`
  : DEFAULT_API_BASE_URL;

export type ApiResponse<TData, TMeta = unknown> = {
  statusCode: number;
  message: string;
  data: TData;
  meta?: TMeta;
};

export class ApiError<T = unknown> extends Error {
  statusCode: number;
  details?: T;

  constructor(statusCode: number, message: string, details?: T) {
    super(message);
    this.statusCode = statusCode;
    this.details = details;
  }
}

type ApiFetchOptions = RequestInit & {
  baseUrl?: string;
};

export async function apiFetch<TData, TMeta = unknown>(
  input: string,
  init: ApiFetchOptions = {},
): Promise<ApiResponse<TData, TMeta>> {
  const { baseUrl = API_BASE_URL, headers, ...options } = init;

  const url = input.startsWith("http") ? input : `${baseUrl}${input}`;
  const mergedHeaders = new Headers(headers);

  if (typeof window !== "undefined") {
    const token = localStorage.getItem("auth-token");
    if (token && !mergedHeaders.has("Authorization")) {
      mergedHeaders.set("Authorization", `Bearer ${token}`);
    }
  }

  const isFormData = options.body instanceof FormData;
  if (!isFormData && options.body && !mergedHeaders.has("Content-Type")) {
    mergedHeaders.set("Content-Type", "application/json");
  }

  const response = await fetch(url, {
    ...options,
    headers: mergedHeaders,
  });

  const contentType = response.headers.get("content-type") ?? "";
  const isJsonResponse = contentType.includes("application/json");

  const rawPayload = isJsonResponse
    ? await response.json()
    : await response.text();

  if (!isJsonResponse) {
    if (!response.ok) {
      throw new ApiError(response.status, response.statusText);
    }

    return {
      statusCode: response.status,
      message: response.statusText,
      data: rawPayload as TData,
    };
  }

  const payload = rawPayload as Partial<ApiResponse<TData, TMeta>>;
  const statusCode = payload.statusCode ?? response.status;
  const message = payload.message ?? response.statusText;

  if (!response.ok || statusCode >= 400) {
    throw new ApiError(statusCode, message, payload.data);
  }

  return {
    statusCode,
    message,
    data: payload.data as TData,
    meta: payload.meta,
  };
}

export const apiClient = {
  get: <TData, TMeta = unknown>(path: string, options?: ApiFetchOptions) =>
    apiFetch<TData, TMeta>(path, { ...options, method: "GET" }),
  post: <TData, TMeta = unknown>(
    path: string,
    body?: unknown,
    options?: ApiFetchOptions,
  ) =>
    apiFetch<TData, TMeta>(path, {
      ...options,
      method: "POST",
      body: body instanceof FormData ? body : JSON.stringify(body),
    }),
  put: <TData, TMeta = unknown>(
    path: string,
    body?: unknown,
    options?: ApiFetchOptions,
  ) =>
    apiFetch<TData, TMeta>(path, {
      ...options,
      method: "PUT",
      body: body instanceof FormData ? body : JSON.stringify(body),
    }),
  patch: <TData, TMeta = unknown>(
    path: string,
    body?: unknown,
    options?: ApiFetchOptions,
  ) =>
    apiFetch<TData, TMeta>(path, {
      ...options,
      method: "PATCH",
      body: body instanceof FormData ? body : JSON.stringify(body),
    }),
  delete: <TData, TMeta = unknown>(path: string, options?: ApiFetchOptions) =>
    apiFetch<TData, TMeta>(path, { ...options, method: "DELETE" }),
};
