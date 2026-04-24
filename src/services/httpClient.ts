import axios, { AxiosError, type AxiosInstance, type AxiosResponse } from "axios"
import { tokenStorage } from "@/src/utils/storage"
import { ApiRequestError, type ApiEnvelope } from "@/src/models/api"

type UnauthorizedHandler = () => void
let onUnauthorized: UnauthorizedHandler | null = null

export function registerUnauthorizedHandler(handler: UnauthorizedHandler | null) {
  onUnauthorized = handler
}

const baseURL =
  (typeof import.meta !== "undefined" &&
    (import.meta as unknown as { env?: Record<string, string> }).env?.VITE_API_BASE_URL) ||
  "/api"

export const http: AxiosInstance = axios.create({
  baseURL,
  timeout: 15000,
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
})

http.interceptors.request.use((config) => {
  const token = tokenStorage.get()
  if (token) {
    config.headers = config.headers ?? {}
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

http.interceptors.response.use(
  (response) => response,
  (error: AxiosError<ApiEnvelope<unknown>>) => {
    const status = error.response?.status ?? 0
    const envelope = error.response?.data
    const requestUrl = `${baseURL}${error.config?.url ?? ""}`
    const isUnreachable = status === 0

    if (isUnreachable) {
      console.error(
        `[api] Backend unreachable for ${requestUrl}. Start the Express API and verify the Vite proxy target.`,
        error.message,
      )
    }

    if (status === 401) {
      tokenStorage.clear()
      onUnauthorized?.()
    }

    const message =
      (isUnreachable
        ? "API server is unreachable. Start the backend and try again."
        : null) ||
      envelope?.message ||
      error.message ||
      "Something went wrong. Please try again."
    const code =
      envelope?.error?.code ??
      (isUnreachable ? "API_UNREACHABLE" : "NETWORK_ERROR")
    const details = envelope?.error?.details ?? null

    return Promise.reject(new ApiRequestError(message, code, status, details))
  },
)

/** Centralized envelope unwrapper: returns `data` or throws ApiRequestError. */
export async function unwrap<T>(
  promise: Promise<AxiosResponse<ApiEnvelope<T>>>,
): Promise<T> {
  const res = await promise
  const envelope = res.data
  if (!envelope?.success) {
    throw new ApiRequestError(
      envelope?.message ?? "Request failed",
      envelope?.error?.code ?? "UNKNOWN_ERROR",
      res.status,
      envelope?.error?.details ?? null,
    )
  }
  return envelope.data
}
