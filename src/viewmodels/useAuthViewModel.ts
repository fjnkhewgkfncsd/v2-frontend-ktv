import { useCallback, useEffect, useState } from "react"
import { authService } from "@/src/services/authService"
import { registerUnauthorizedHandler } from "@/src/services/httpClient"
import { tokenStorage } from "@/src/utils/storage"
import { ApiRequestError } from "@/src/models/api"
import type { User } from "@/src/models/auth"

export interface AuthViewModel {
  user: User | null
  token: string | null
  isAuthenticated: boolean
  isBootstrapping: boolean
  isLoggingIn: boolean
  loginError: string | null
  login(username: string, password: string): Promise<boolean>
  logout(): void
  refresh(): Promise<void>
}

export function useAuthViewModel(): AuthViewModel {
  const [user, setUser] = useState<User | null>(null)
  const [token, setToken] = useState<string | null>(() => tokenStorage.get())
  const [isBootstrapping, setIsBootstrapping] = useState<boolean>(() => {
    // If a token exists we need to validate it via /auth/me
    return Boolean(tokenStorage.get())
  })
  const [isLoggingIn, setIsLoggingIn] = useState(false)
  const [loginError, setLoginError] = useState<string | null>(null)

  const clearSession = useCallback(() => {
    tokenStorage.clear()
    setToken(null)
    setUser(null)
  }, [])

  const refresh = useCallback(async () => {
    const existing = tokenStorage.get()
    if (!existing) {
      setUser(null)
      setToken(null)
      return
    }
    try {
      const me = await authService.me()
      setUser(me)
      setToken(existing)
    } catch (error) {
      // Invalid/expired token — wipe session
      console.log("[v0] auth refresh failed:", (error as Error)?.message)
      clearSession()
    }
  }, [clearSession])

  // Bootstrap: if token exists, fetch current user on mount
  useEffect(() => {
    let cancelled = false
    const run = async () => {
      const existing = tokenStorage.get()
      if (!existing) {
        setIsBootstrapping(false)
        return
      }
      try {
        const me = await authService.me()
        if (!cancelled) {
          setUser(me)
          setToken(existing)
        }
      } catch {
        if (!cancelled) clearSession()
      } finally {
        if (!cancelled) setIsBootstrapping(false)
      }
    }
    run()
    return () => {
      cancelled = true
    }
  }, [clearSession])

  // Global 401 handling → clear session
  useEffect(() => {
    registerUnauthorizedHandler(() => {
      clearSession()
    })
    return () => registerUnauthorizedHandler(null)
  }, [clearSession])

  const login = useCallback(
    async (username: string, password: string): Promise<boolean> => {
      setIsLoggingIn(true)
      setLoginError(null)
      try {
        const { token: nextToken, user: nextUser } = await authService.login({
          username,
          password,
        })
        tokenStorage.set(nextToken)
        setToken(nextToken)
        setUser(nextUser)
        return true
      } catch (error) {
        const msg =
          error instanceof ApiRequestError
            ? error.message
            : "Unable to sign in. Please try again."
        setLoginError(msg)
        return false
      } finally {
        setIsLoggingIn(false)
      }
    },
    [],
  )

  const logout = useCallback(() => {
    clearSession()
  }, [clearSession])

  return {
    user,
    token,
    isAuthenticated: Boolean(user && token),
    isBootstrapping,
    isLoggingIn,
    loginError,
    login,
    logout,
    refresh,
  }
}
