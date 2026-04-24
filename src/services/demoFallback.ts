/**
 * Demo fallback — activates ONLY when the backend is unreachable
 * (network error, status 0). When a real backend is connected and returns
 * actual errors/data, it is always the source of truth.
 */
import type { Room, RoomStatus } from "@/src/models/room"
import type { User, LoginResponse } from "@/src/models/auth"
import { ApiRequestError } from "@/src/models/api"

/**
 * Returns true when the request never reached a real backend.
 * Covers:
 *   - Axios network errors (status === 0)
 *   - Dev-server 404s where no JSON envelope was returned (no backend is
 *     proxying /api at all, so the SPA fallback HTML is served instead).
 *   - Bad Gateway / Service Unavailable (common when backend is down behind
 *     a reverse proxy).
 * When a real backend is connected, a genuine 404 or 5xx will include an
 * API envelope and a real error code, so the demo fallback stays disabled.
 */
export function isNetworkError(err: unknown): boolean {
  if (!(err instanceof ApiRequestError)) return false
  if (err.status === 0) return true
  const noEnvelope =
    err.code === "API_UNREACHABLE" ||
    err.code === "NETWORK_ERROR" ||
    err.code === "UNKNOWN_ERROR"
  if (noEnvelope && (err.status === 404 || err.status >= 502)) return true
  return false
}

const DEMO_USER: User = {
  id: "demo-user-0001",
  username: "reception",
  name: "Demo Receptionist",
  role: "receptionist",
  isActive: true,
  lastLoginAt: new Date().toISOString(),
  createdAt: new Date(Date.now() - 86400_000 * 3).toISOString(),
  updatedAt: new Date().toISOString(),
}

const DEMO_ADMIN: User = {
  ...DEMO_USER,
  id: "demo-user-admin",
  username: "admin",
  name: "Demo Admin",
  role: "admin",
}

export function demoLogin(username: string): LoginResponse {
  const user = username.toLowerCase() === "admin" ? DEMO_ADMIN : DEMO_USER
  return {
    token: `demo.${Math.random().toString(36).slice(2)}.${Date.now()}`,
    user: { ...user, username },
  }
}

export function demoMe(): User {
  return DEMO_USER
}

const now = new Date()
const ago = (ms: number) => new Date(now.getTime() - ms).toISOString()

let demoRooms: Room[] = [
  makeRoom({ code: "A101", name: "Aurora 101", type: "standard", capacity: 6, rate: 300, status: "available" }),
  makeRoom({ code: "A102", name: "Aurora 102", type: "standard", capacity: 6, rate: 300, status: "occupied", session: "demo-sess-01" }),
  makeRoom({ code: "A103", name: "Aurora 103", type: "standard", capacity: 8, rate: 350, status: "cleaning", notes: "Post-checkout deep clean" }),
  makeRoom({ code: "A104", name: "Aurora 104", type: "standard", capacity: 6, rate: 300, status: "available" }),
  makeRoom({ code: "B201", name: "Nova VIP 201", type: "vip", capacity: 10, rate: 650, status: "reserved", reservation: "demo-res-01" }),
  makeRoom({ code: "B202", name: "Nova VIP 202", type: "vip", capacity: 10, rate: 650, status: "available", notes: "Premium sound system" }),
  makeRoom({ code: "B203", name: "Nova VIP 203", type: "vip", capacity: 12, rate: 800, status: "occupied", session: "demo-sess-02" }),
  makeRoom({ code: "C301", name: "Stellar 301", type: "standard", capacity: 4, rate: 220, status: "maintenance", notes: "Microphone repair" }),
  makeRoom({ code: "C302", name: "Stellar 302", type: "standard", capacity: 4, rate: 220, status: "available" }),
  makeRoom({ code: "C303", name: "Stellar 303", type: "standard", capacity: 6, rate: 280, status: "reserved", reservation: "demo-res-02" }),
  makeRoom({ code: "C304", name: "Stellar 304", type: "standard", capacity: 6, rate: 280, status: "available" }),
  makeRoom({ code: "D401", name: "Celestia VIP", type: "vip", capacity: 14, rate: 980, status: "cleaning" }),
]

export function demoListRooms(): Room[] {
  return demoRooms
}

export function demoGetRoom(id: string): Room | undefined {
  return demoRooms.find((r) => r.id === id)
}

export function demoUpdateStatus(id: string, next: RoomStatus): Room | null {
  const idx = demoRooms.findIndex((r) => r.id === id)
  if (idx === -1) return null
  demoRooms = demoRooms.map((r, i) =>
    i === idx
      ? {
          ...r,
          status: next,
          currentSessionId: next === "occupied" ? r.currentSessionId : null,
          activeReservationId: next === "reserved" ? r.activeReservationId : null,
          updatedAt: new Date().toISOString(),
        }
      : r,
  )
  return demoRooms[idx]
}

export interface DemoRoomCreateInput {
  code: string
  name: string
  type: "standard" | "vip"
  capacity: number
  hourlyRate: number
  status?: RoomStatus
  isActive?: boolean
  notes?: string
}

export function demoCreateRoom(input: DemoRoomCreateInput): Room {
  const code = input.code.toUpperCase()
  if (demoRooms.some((r) => r.code === code)) {
    throw new ApiRequestError("Room code already exists.", "DUPLICATE_KEY", 409)
  }
  const room: Room = {
    id: `demo-room-${code.toLowerCase()}-${Math.random().toString(36).slice(2, 7)}`,
    code,
    name: input.name,
    type: input.type,
    capacity: input.capacity,
    status: input.status ?? "available",
    hourlyRate: input.hourlyRate,
    isActive: input.isActive ?? true,
    notes: input.notes ?? "",
    currentSessionId: null,
    activeReservationId: null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }
  demoRooms = [...demoRooms, room]
  return room
}

export type DemoRoomUpdateInput = Partial<DemoRoomCreateInput>

export function demoUpdateRoom(
  id: string,
  input: DemoRoomUpdateInput,
): Room | null {
  const idx = demoRooms.findIndex((r) => r.id === id)
  if (idx === -1) return null
  const existing = demoRooms[idx]
  const nextCode = input.code ? input.code.toUpperCase() : existing.code
  if (
    input.code &&
    nextCode !== existing.code &&
    demoRooms.some((r) => r.code === nextCode)
  ) {
    throw new ApiRequestError("Room code already exists.", "DUPLICATE_KEY", 409)
  }
  const merged: Room = {
    ...existing,
    code: nextCode,
    name: input.name ?? existing.name,
    type: input.type ?? existing.type,
    capacity: input.capacity ?? existing.capacity,
    hourlyRate:
      typeof input.hourlyRate === "number"
        ? input.hourlyRate
        : existing.hourlyRate,
    status: input.status ?? existing.status,
    isActive:
      typeof input.isActive === "boolean" ? input.isActive : existing.isActive,
    notes: typeof input.notes === "string" ? input.notes : existing.notes,
    updatedAt: new Date().toISOString(),
  }
  demoRooms = demoRooms.map((r, i) => (i === idx ? merged : r))
  return merged
}

interface MakeRoomInput {
  code: string
  name: string
  type: "standard" | "vip"
  capacity: number
  rate: number
  status: RoomStatus
  notes?: string
  session?: string
  reservation?: string
}

function makeRoom(i: MakeRoomInput): Room {
  return {
    id: `demo-room-${i.code.toLowerCase()}`,
    code: i.code,
    name: i.name,
    type: i.type,
    capacity: i.capacity,
    status: i.status,
    hourlyRate: i.rate,
    isActive: true,
    notes: i.notes ?? "",
    currentSessionId: i.session ?? null,
    activeReservationId: i.reservation ?? null,
    createdAt: ago(86400_000 * 7),
    updatedAt: ago(Math.random() * 86400_000),
  }
}
