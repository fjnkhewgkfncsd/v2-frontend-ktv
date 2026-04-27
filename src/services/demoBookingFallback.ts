/**
 * Demo fallback for reservations, sessions, and products.
 * Activates only when the real backend is unreachable (network error).
 * Maintains a coherent in-memory state so users can exercise full flows.
 */
import type {
  Reservation,
  ReservationCreateInput,
  ReservationStatus,
  ReservationUpdateInput,
  SessionDraft,
} from "@/src/models/reservation"
import type {
  OrderedItem,
  Session,
  SessionItemInput,
  WalkInSessionInput,
} from "@/src/models/session"
import type { Product, ProductCategory } from "@/src/models/product"
import type { Room } from "@/src/models/room"
import { ApiRequestError } from "@/src/models/api"
import { demoListRooms, demoUpdateStatus } from "./demoFallback"

const now = () => new Date().toISOString()
const ago = (ms: number) => new Date(Date.now() - ms).toISOString()
const ahead = (ms: number) => new Date(Date.now() + ms).toISOString()

let idCounter = 1000
const nextId = (prefix: string) => `demo-${prefix}-${++idCounter}`

function roomToSnapshot(room: Room) {
  return {
    roomId: room.id,
    code: room.code,
    name: room.name,
    type: room.type,
    hourlyRate: room.hourlyRate,
  }
}

// ----- Products -----

let demoProducts: Product[] = [
  makeProduct("Coca-Cola 330ml", "drink", 35, 24, 5),
  makeProduct("Heineken 330ml", "drink", 85, 42, 10),
  makeProduct("Singha 330ml", "drink", 75, 4, 8),
  makeProduct("Red Bull 250ml", "drink", 45, 30, 6),
  makeProduct("Still Water 500ml", "drink", 25, 60, 10),
  makeProduct("Jack Daniels 700ml", "drink", 1800, 6, 2),
  makeProduct("Fried Chicken Platter", "food", 320, 12, 3),
  makeProduct("Beef Nachos", "food", 280, 8, 3),
  makeProduct("Seafood Sampler", "food", 450, 5, 2),
  makeProduct("Lays Chips Original", "snack", 40, 36, 8),
  makeProduct("Mixed Nuts Bowl", "snack", 120, 3, 5),
  makeProduct("Ice Bucket Service", "other", 50, 100, 20),
]

function makeProduct(
  name: string,
  category: ProductCategory,
  price: number,
  stockQty: number,
  lowStockThreshold: number,
): Product {
  return {
    id: nextId("prod"),
    name,
    category,
    price,
    stockQty,
    lowStockThreshold,
    isActive: true,
    isLowStock: stockQty <= lowStockThreshold,
    createdAt: ago(86400_000 * 10),
    updatedAt: ago(86400_000 * 2),
  }
}

export function demoListProducts(filter?: {
  category?: ProductCategory
  isActive?: boolean
  lowStock?: boolean
}): Product[] {
  return demoProducts.filter((p) => {
    if (filter?.category && p.category !== filter.category) return false
    if (typeof filter?.isActive === "boolean" && p.isActive !== filter.isActive)
      return false
    if (filter?.lowStock && !p.isLowStock) return false
    return true
  })
}

export function demoGetProduct(id: string): Product | undefined {
  return demoProducts.find((p) => p.id === id)
}

function deductProductStock(productId: string, qty: number): Product | null {
  const idx = demoProducts.findIndex((p) => p.id === productId)
  if (idx === -1) return null
  const p = demoProducts[idx]
  const nextQty = Math.max(0, p.stockQty - qty)
  const updated: Product = {
    ...p,
    stockQty: nextQty,
    isLowStock: nextQty <= p.lowStockThreshold,
    updatedAt: now(),
  }
  demoProducts = demoProducts.map((x, i) => (i === idx ? updated : x))
  return updated
}

// ----- Reservations -----

let demoReservations: Reservation[] = []
let demoSessions: Session[] = []

function seedIfNeeded() {
  if (demoReservations.length > 0 || demoSessions.length > 0) return
  const rooms = demoListRooms()
  const reservedRoom = rooms.find((r) => r.status === "reserved") ?? rooms[0]
  const occupiedRoom =
    rooms.find((r) => r.status === "occupied") ??
    rooms.find((r) => r.status === "available") ??
    rooms[1]

  demoReservations = [
    {
      id: nextId("res"),
      customerName: "Somchai",
      customerPhone: "0812345678",
      roomId: reservedRoom.id,
      reservedStartTime: ahead(3600_000 * 2),
      expectedDuration: 120,
      reservedEndTime: ahead(3600_000 * 4),
      depositAmount: 500,
      status: "confirmed",
      notes: "Birthday group",
      roomSnapshot: roomToSnapshot(reservedRoom),
      reservedBy: "demo-user-0001",
      checkedInAt: null,
      createdAt: ago(3600_000 * 4),
      updatedAt: ago(3600_000 * 4),
    },
    {
      id: nextId("res"),
      customerName: "Chantha",
      customerPhone: "0891234567",
      roomId: rooms[5]?.id ?? reservedRoom.id,
      reservedStartTime: ahead(3600_000 * 6),
      expectedDuration: 180,
      reservedEndTime: ahead(3600_000 * 9),
      depositAmount: 300,
      status: "pending",
      notes: "",
      roomSnapshot: roomToSnapshot(rooms[5] ?? reservedRoom),
      reservedBy: "demo-user-0001",
      checkedInAt: null,
      createdAt: ago(3600_000 * 2),
      updatedAt: ago(3600_000 * 2),
    },
  ]

  const sessionItems: OrderedItem[] = [
    {
      _id: nextId("item"),
      productId: demoProducts[0].id,
      productName: demoProducts[0].name,
      unitPrice: demoProducts[0].price,
      quantity: 4,
      lineTotal: demoProducts[0].price * 4,
      addedAt: ago(600_000),
    },
    {
      _id: nextId("item"),
      productId: demoProducts[6].id,
      productName: demoProducts[6].name,
      unitPrice: demoProducts[6].price,
      quantity: 1,
      lineTotal: demoProducts[6].price,
      addedAt: ago(400_000),
    },
  ]
  const subtotal = sessionItems.reduce((s, i) => s + i.lineTotal, 0)

  demoSessions = [
    {
      id: nextId("sess"),
      roomId: occupiedRoom.id,
      reservationId: null,
      customerName: "Walk-in Customer",
      customerPhone: "0899999999",
      startTime: ago(3600_000 * 1.5),
      endTime: null,
      roomRateSnapshot: roomToSnapshot(occupiedRoom),
      orderedItems: sessionItems,
      itemsSubtotal: subtotal,
      totalAmount: subtotal,
      status: "open",
      notes: "",
      openedBy: "demo-user-0001",
      closedBy: null,
      invoiceId: null,
      createdAt: ago(3600_000 * 1.5),
      updatedAt: ago(400_000),
    },
  ]
}

export function demoListReservations(filter?: {
  status?: ReservationStatus
  roomId?: string
}): Reservation[] {
  seedIfNeeded()
  return demoReservations.filter((r) => {
    if (filter?.status && r.status !== filter.status) return false
    if (filter?.roomId && r.roomId !== filter.roomId) return false
    return true
  })
}

export function demoGetReservation(id: string): Reservation | undefined {
  seedIfNeeded()
  return demoReservations.find((r) => r.id === id)
}

export function demoCreateReservation(
  input: ReservationCreateInput,
): Reservation {
  seedIfNeeded()
  const room = demoListRooms().find((r) => r.id === input.roomId)
  if (!room) {
    throw new ApiRequestError("Room not found", "ROOM_NOT_FOUND", 404)
  }
  const startMs = new Date(input.reservedStartTime).getTime()
  const endMs = startMs + input.expectedDuration * 60_000

  // overlap check
  const overlap = demoReservations.find(
    (r) =>
      r.roomId === input.roomId &&
      (r.status === "pending" || r.status === "confirmed") &&
      !(
        endMs <= new Date(r.reservedStartTime).getTime() ||
        startMs >= new Date(r.reservedEndTime).getTime()
      ),
  )
  if (overlap) {
    throw new ApiRequestError(
      "Room is already booked for the requested time",
      "ROOM_DOUBLE_BOOKING",
      409,
    )
  }

  const created: Reservation = {
    id: nextId("res"),
    customerName: input.customerName,
    customerPhone: input.customerPhone,
    roomId: input.roomId,
    reservedStartTime: new Date(startMs).toISOString(),
    expectedDuration: input.expectedDuration,
    reservedEndTime: new Date(endMs).toISOString(),
    depositAmount: input.depositAmount ?? 0,
    status: "confirmed",
    notes: input.notes ?? "",
    roomSnapshot: roomToSnapshot(room),
    reservedBy: "demo-user-0001",
    checkedInAt: null,
    createdAt: now(),
    updatedAt: now(),
  }
  demoReservations = [created, ...demoReservations]
  return created
}

export function demoUpdateReservation(
  id: string,
  patch: ReservationUpdateInput,
): Reservation {
  seedIfNeeded()
  const idx = demoReservations.findIndex((r) => r.id === id)
  if (idx === -1) {
    throw new ApiRequestError(
      "Reservation not found",
      "RESERVATION_NOT_FOUND",
      404,
    )
  }
  const current = demoReservations[idx]
  if (current.status === "cancelled" || current.status === "checked_in") {
    throw new ApiRequestError(
      "This reservation is no longer editable",
      "RESERVATION_NOT_EDITABLE",
      409,
    )
  }
  const startMs = patch.reservedStartTime
    ? new Date(patch.reservedStartTime).getTime()
    : new Date(current.reservedStartTime).getTime()
  const duration = patch.expectedDuration ?? current.expectedDuration
  const endMs = startMs + duration * 60_000
  const roomId = patch.roomId ?? current.roomId
  const room =
    demoListRooms().find((r) => r.id === roomId) ?? null

  const updated: Reservation = {
    ...current,
    ...patch,
    reservedStartTime: new Date(startMs).toISOString(),
    reservedEndTime: new Date(endMs).toISOString(),
    expectedDuration: duration,
    roomId,
    roomSnapshot: room ? roomToSnapshot(room) : current.roomSnapshot,
    updatedAt: now(),
  }
  demoReservations = demoReservations.map((r, i) => (i === idx ? updated : r))
  return updated
}

export function demoCancelReservation(id: string): Reservation {
  seedIfNeeded()
  const idx = demoReservations.findIndex((r) => r.id === id)
  if (idx === -1) {
    throw new ApiRequestError(
      "Reservation not found",
      "RESERVATION_NOT_FOUND",
      404,
    )
  }
  const current = demoReservations[idx]
  if (current.status === "checked_in") {
    throw new ApiRequestError(
      "Checked-in reservations cannot be cancelled",
      "RESERVATION_NOT_CANCELLABLE",
      409,
    )
  }
  const updated: Reservation = {
    ...current,
    status: "cancelled",
    updatedAt: now(),
  }
  demoReservations = demoReservations.map((r, i) => (i === idx ? updated : r))
  // release reserved room if it was holding this reservation
  const room = demoListRooms().find((r) => r.id === current.roomId)
  if (room?.activeReservationId === current.id && room.status === "reserved") {
    demoUpdateStatus(room.id, "available")
  }
  return updated
}

export function demoCheckInReservation(id: string): {
  reservation: Reservation
  sessionDraft: SessionDraft
} {
  seedIfNeeded()
  const idx = demoReservations.findIndex((r) => r.id === id)
  if (idx === -1) {
    throw new ApiRequestError(
      "Reservation not found",
      "RESERVATION_NOT_FOUND",
      404,
    )
  }
  const current = demoReservations[idx]
  if (current.status === "cancelled") {
    throw new ApiRequestError(
      "Cancelled reservations cannot be checked in",
      "RESERVATION_NOT_CHECK_IN",
      409,
    )
  }
  if (current.status === "checked_in") {
    throw new ApiRequestError(
      "Reservation is already checked in",
      "RESERVATION_ALREADY_CHECKED_IN",
      409,
    )
  }
  const nowIso = now()
  const updated: Reservation = {
    ...current,
    status: "checked_in",
    checkedInAt: nowIso,
    updatedAt: nowIso,
  }
  demoReservations = demoReservations.map((r, i) => (i === idx ? updated : r))

  const sessionDraft: SessionDraft = {
    reservationId: updated.id,
    roomId: updated.roomId,
    customerName: updated.customerName,
    customerPhone: updated.customerPhone,
    roomSnapshot: updated.roomSnapshot,
    openedAt: nowIso,
  }
  return { reservation: updated, sessionDraft }
}

// ----- Sessions -----

export function demoListActiveSessions(): Session[] {
  seedIfNeeded()
  return demoSessions.filter((s) => s.status === "open")
}

export function demoGetSession(id: string): Session | undefined {
  seedIfNeeded()
  return demoSessions.find((s) => s.id === id)
}

export function demoCreateWalkInSession(input: WalkInSessionInput): Session {
  seedIfNeeded()
  const room = demoListRooms().find((r) => r.id === input.roomId)
  if (!room) {
    throw new ApiRequestError("Room not found", "ROOM_NOT_FOUND", 404)
  }
  const active = demoSessions.find(
    (s) => s.roomId === input.roomId && s.status === "open",
  )
  if (active) {
    throw new ApiRequestError(
      "Room already has an active session",
      "ACTIVE_SESSION_CONFLICT",
      409,
    )
  }
  const nowIso = input.startTime ?? now()
  const created: Session = {
    id: nextId("sess"),
    roomId: input.roomId,
    reservationId: null,
    customerName: input.customerName,
    customerPhone: input.customerPhone ?? "",
    startTime: nowIso,
    endTime: null,
    roomRateSnapshot: roomToSnapshot(room),
    orderedItems: [],
    itemsSubtotal: 0,
    totalAmount: 0,
    status: "open",
    notes: input.notes ?? "",
    openedBy: "demo-user-0001",
    closedBy: null,
    invoiceId: null,
    createdAt: nowIso,
    updatedAt: nowIso,
  }
  demoSessions = [created, ...demoSessions]
  demoUpdateStatus(room.id, "occupied")
  return created
}

export function demoCreateSessionFromReservation(
  reservationId: string,
): Session {
  seedIfNeeded()
  const res = demoReservations.find((r) => r.id === reservationId)
  if (!res) {
    throw new ApiRequestError(
      "Reservation not found",
      "RESERVATION_NOT_FOUND",
      404,
    )
  }
  if (res.status !== "checked_in") {
    throw new ApiRequestError(
      "Reservation must be checked in before creating a session",
      "RESERVATION_NOT_READY_FOR_SESSION",
      409,
    )
  }
  const existing = demoSessions.find(
    (s) => s.reservationId === reservationId && s.status === "open",
  )
  if (existing) return existing

  const room = demoListRooms().find((r) => r.id === res.roomId)
  if (!room) {
    throw new ApiRequestError("Room not found", "ROOM_NOT_FOUND", 404)
  }

  const nowIso = now()
  const created: Session = {
    id: nextId("sess"),
    roomId: res.roomId,
    reservationId: res.id,
    customerName: res.customerName,
    customerPhone: res.customerPhone,
    startTime: nowIso,
    endTime: null,
    roomRateSnapshot: roomToSnapshot(room),
    orderedItems: [],
    itemsSubtotal: 0,
    totalAmount: 0,
    status: "open",
    notes: res.notes,
    openedBy: "demo-user-0001",
    closedBy: null,
    invoiceId: null,
    createdAt: nowIso,
    updatedAt: nowIso,
  }
  demoSessions = [created, ...demoSessions]
  demoUpdateStatus(room.id, "occupied")
  return created
}

// ----- Internal accessors (used by sibling demo modules) -----

export function _demoReadSessions(): Session[] {
  seedIfNeeded()
  return demoSessions
}

export function _demoMutateSessions(
  updater: (current: Session[]) => Session[],
): void {
  demoSessions = updater(demoSessions)
}

export function _demoGetInternalSession(id: string): Session | undefined {
  return demoSessions.find((s) => s.id === id)
}

export function _demoReadProducts(): Product[] {
  return demoProducts
}

export function _demoMutateProducts(
  updater: (current: Product[]) => Product[],
): void {
  demoProducts = updater(demoProducts)
}

export function demoAddItemsToSession(
  sessionId: string,
  items: SessionItemInput[],
): Session {
  seedIfNeeded()
  const idx = demoSessions.findIndex((s) => s.id === sessionId)
  if (idx === -1) {
    throw new ApiRequestError("Session not found", "SESSION_NOT_FOUND", 404)
  }
  const session = demoSessions[idx]
  if (session.status !== "open") {
    throw new ApiRequestError(
      "Only active sessions can receive ordered items",
      "SESSION_NOT_EDITABLE",
      409,
    )
  }

  const newItems: OrderedItem[] = []
  for (const line of items) {
    const product = demoProducts.find((p) => p.id === line.productId)
    if (!product) {
      throw new ApiRequestError(
        `Product not found: ${line.productId}`,
        "PRODUCT_NOT_FOUND",
        404,
      )
    }
    if (!product.isActive) {
      throw new ApiRequestError(
        `${product.name} is not available for sale`,
        "PRODUCT_INACTIVE",
        409,
      )
    }
    if (product.stockQty < line.quantity) {
      throw new ApiRequestError(
        `Insufficient stock for ${product.name}`,
        "INSUFFICIENT_STOCK",
        409,
      )
    }
    deductProductStock(product.id, line.quantity)
    newItems.push({
      _id: nextId("item"),
      productId: product.id,
      productName: product.name,
      unitPrice: product.price,
      quantity: line.quantity,
      lineTotal: product.price * line.quantity,
      addedAt: now(),
    })
  }

  const orderedItems = [...session.orderedItems, ...newItems]
  const itemsSubtotal = orderedItems.reduce((s, i) => s + i.lineTotal, 0)
  const updated: Session = {
    ...session,
    orderedItems,
    itemsSubtotal,
    totalAmount: itemsSubtotal,
    updatedAt: now(),
  }
  demoSessions = demoSessions.map((s, i) => (i === idx ? updated : s))
  return updated
}
