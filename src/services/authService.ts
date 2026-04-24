import { http, unwrap } from "./httpClient"
import type { LoginRequest, LoginResponse, User } from "@/src/models/auth"
import { demoLogin, demoMe, isNetworkError } from "./demoFallback"

export const authService = {
  async login(payload: LoginRequest): Promise<LoginResponse> {
    try {
      return await unwrap<LoginResponse>(http.post("/auth/login", payload))
    } catch (err) {
      if (isNetworkError(err)) {
        // Backend unreachable — accept valid-looking creds in demo mode.
        if (
          payload.username.trim().length >= 3 &&
          payload.password.length >= 6
        ) {
          return demoLogin(payload.username.trim())
        }
      }
      throw err
    }
  },

  async me(): Promise<User> {
    try {
      const data = await unwrap<{ user: User }>(http.get("/auth/me"))
      return data.user
    } catch (err) {
      if (isNetworkError(err)) return demoMe()
      throw err
    }
  },
}
