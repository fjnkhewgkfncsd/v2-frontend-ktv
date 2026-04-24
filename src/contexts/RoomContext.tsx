import { createContext, useContext, type ReactNode } from "react"
import {
  useRoomViewModel,
  type RoomViewModel,
} from "@/src/viewmodels/useRoomViewModel"

const RoomContext = createContext<RoomViewModel | null>(null)

export function RoomProvider({ children }: { children: ReactNode }) {
  const vm = useRoomViewModel()
  return <RoomContext.Provider value={vm}>{children}</RoomContext.Provider>
}

export function useRooms(): RoomViewModel {
  const ctx = useContext(RoomContext)
  if (!ctx) {
    throw new Error("useRooms must be used within RoomProvider")
  }
  return ctx
}
