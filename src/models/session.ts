import type { RoomSnapshot } from "./reservation"

export type SessionStatus = "open" | "closed"

export interface OrderedItem {
  _id: string
  productId: string
  productName: string
  unitPrice: number
  quantity: number
  lineTotal: number
  addedAt: string
}

export interface Session {
  id: string
  roomId: string
  reservationId: string | null
  customerName: string
  customerPhone: string
  startTime: string
  endTime: string | null
  roomRateSnapshot: RoomSnapshot
  orderedItems: OrderedItem[]
  itemsSubtotal: number
  totalAmount: number
  status: SessionStatus
  notes: string
  openedBy: string
  closedBy: string | null
  invoiceId: string | null
  createdAt: string
  updatedAt: string
}

export interface WalkInSessionInput {
  roomId: string
  customerName: string
  customerPhone?: string
  startTime?: string
  notes?: string
}

export interface SessionItemInput {
  productId: string
  quantity: number
}
