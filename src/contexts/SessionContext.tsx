import { createContext, useContext, type ReactNode } from "react"
import {
  useSessionViewModel,
  type SessionViewModel,
} from "@/src/viewmodels/useSessionViewModel"

const SessionContext = createContext<SessionViewModel | null>(null)

export function SessionProvider({ children }: { children: ReactNode }) {
  const vm = useSessionViewModel()
  return (
    <SessionContext.Provider value={vm}>{children}</SessionContext.Provider>
  )
}

export function useSessions(): SessionViewModel {
  const ctx = useContext(SessionContext)
  if (!ctx) {
    throw new Error("useSessions must be used within SessionProvider")
  }
  return ctx
}
