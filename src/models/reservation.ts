export type ReservationStatus =
  | "pending"
  | "confirmed"
  | "cancelled"
  | "checked_in"

export interface RoomSnapshot {
  roomId: string
  code: string
  name: string
  type: "standard" | "vip"
  hourlyRate: number
}

export interface Reservation {
  id: string
  customerName: string
  customerPhone: string
  roomId: string
  reservedStartTime: string
  expectedDuration: number
  reservedEndTime: string
  depositAmount: number
  status: ReservationStatus
  notes: string
  roomSnapshot: RoomSnapshot
  reservedBy: string
  checkedInAt: string | null
  createdAt: string
  updatedAt: string
}

export interface SessionDraft {
  reservationId: string
  roomId: string
  customerName: string
  customerPhone: string
  roomSnapshot: RoomSnapshot
  openedAt: string
}

export interface ReservationCreateInput {
  customerName: string
  customerPhone: string
  roomId: string
  reservedStartTime: string
  expectedDuration: number
  depositAmount?: number
  notes?: string
}

export type ReservationUpdateInput = Partial<ReservationCreateInput> & {
  status?: Exclude<ReservationStatus, "cancelled" | "checked_in">
}

export const RESERVATION_STATUS_LABEL: Record<ReservationStatus, string> = {
  pending: "Pending",
  confirmed: "Confirmed",
  cancelled: "Cancelled",
  checked_in: "Checked in",
}

export const RESERVATION_STATUS_ORDER: ReservationStatus[] = [
  "pending",
  "confirmed",
  "checked_in",
  "cancelled",
]
