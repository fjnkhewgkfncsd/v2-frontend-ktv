export interface ApiErrorField {
  field: string
  message: string
}

export interface ApiErrorDetails {
  fields?: ApiErrorField[]
  [key: string]: unknown
}

export interface ApiError {
  code: string
  details: ApiErrorDetails | null
}

export interface ApiEnvelope<T> {
  success: boolean
  message: string
  data: T
  meta: unknown
  error?: ApiError
}

export class ApiRequestError extends Error {
  readonly code: string
  readonly status: number
  readonly details: ApiErrorDetails | null

  constructor(
    message: string,
    code = "UNKNOWN_ERROR",
    status = 0,
    details: ApiErrorDetails | null = null,
  ) {
    super(message)
    this.name = "ApiRequestError"
    this.code = code
    this.status = status
    this.details = details
  }
}
