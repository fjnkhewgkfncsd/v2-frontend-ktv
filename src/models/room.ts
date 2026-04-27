export type RoomStatus =
  | "available"
  | "reserved"
  | "occupied"
  | "cleaning"
  | "maintenance"

export type RoomType = "standard" | "vip"

export interface Room {
  id: string
  code: string
  name: string
  type: RoomType
  capacity: number
  status: RoomStatus
  hourlyRate: number
  isActive: boolean
  notes: string
  currentSessionId: string | null
  activeReservationId: string | null
  createdAt: string
  updatedAt: string
}

export interface RoomStatusUpdate {
  status: RoomStatus
  currentSessionId?: string | null
  activeReservationId?: string | null
  notes?: string
}

export const ROOM_STATUS_LABEL: Record<RoomStatus, string> = {
  available: "Available",
  reserved: "Reserved",
  occupied: "Occupied",
  cleaning: "Cleaning",
  maintenance: "Maintenance",
}

export const ROOM_STATUS_ORDER: RoomStatus[] = [
  "available",
  "reserved",
  "occupied",
  "cleaning",
  "maintenance",
]
