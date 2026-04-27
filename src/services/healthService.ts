import { http, unwrap } from "./httpClient"

export interface HealthInfo {
  service: string
  environment: string
  uptimeSeconds: number
  timestamp: string
  database: { status: string }
}

export const healthService = {
  async check(): Promise<HealthInfo> {
    return unwrap<HealthInfo>(http.get("/health"))
  },
}
