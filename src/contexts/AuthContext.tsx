import { createContext, useContext, type ReactNode } from "react"
import {
  useAuthViewModel,
  type AuthViewModel,
} from "@/src/viewmodels/useAuthViewModel"

const AuthContext = createContext<AuthViewModel | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const vm = useAuthViewModel()
  return <AuthContext.Provider value={vm}>{children}</AuthContext.Provider>
}

export function useAuth(): AuthViewModel {
  const ctx = useContext(AuthContext)
  if (!ctx) {
    throw new Error("useAuth must be used within AuthProvider")
  }
  return ctx
}
