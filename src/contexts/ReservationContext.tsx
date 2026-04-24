import { createContext, useContext, type ReactNode } from "react"
import {
  useReservationViewModel,
  type ReservationViewModel,
} from "@/src/viewmodels/useReservationViewModel"

const ReservationContext = createContext<ReservationViewModel | null>(null)

export function ReservationProvider({ children }: { children: ReactNode }) {
  const vm = useReservationViewModel()
  return (
    <ReservationContext.Provider value={vm}>
      {children}
    </ReservationContext.Provider>
  )
}

export function useReservations(): ReservationViewModel {
  const ctx = useContext(ReservationContext)
  if (!ctx) {
    throw new Error(
      "useReservations must be used within ReservationProvider",
    )
  }
  return ctx
}
