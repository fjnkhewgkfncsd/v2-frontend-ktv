import { http, unwrap } from "./httpClient"
import type {
  Room,
  RoomStatus,
  RoomStatusUpdate,
  RoomType,
} from "@/src/models/room"
import {
  demoCreateRoom,
  demoGetRoom,
  demoListRooms,
  demoUpdateRoom,
  demoUpdateStatus,
  isNetworkError,
} from "./demoFallback"

export interface ListRoomsParams {
  status?: RoomStatus
  isActive?: boolean
}

export interface RoomCreateInput {
  code: string
  name: string
  type: RoomType
  capacity: number
  hourlyRate: number
  status?: RoomStatus
  isActive?: boolean
  notes?: string
}

export type RoomUpdateInput = Partial<RoomCreateInput>

export const roomService = {
  async list(params: ListRoomsParams = {}): Promise<Room[]> {
    try {
      const query: Record<string, string> = {}
      if (params.status) query.status = params.status
      if (typeof params.isActive === "boolean")
        query.isActive = String(params.isActive)
      const data = await unwrap<{ rooms: Room[]; total: number }>(
        http.get("/rooms", { params: query }),
      )
      return data.rooms ?? []
    } catch (err) {
      if (isNetworkError(err)) {
        const all = demoListRooms()
        return params.status
          ? all.filter((r) => r.status === params.status)
          : all
      }
      throw err
    }
  },

  async getById(id: string): Promise<Room> {
    try {
      const data = await unwrap<{ room: Room }>(http.get(`/rooms/${id}`))
      return data.room
    } catch (err) {
      if (isNetworkError(err)) {
        const r = demoGetRoom(id)
        if (r) return r
      }
      throw err
    }
  },

  async create(input: RoomCreateInput): Promise<Room> {
    try {
      const data = await unwrap<{ room: Room }>(http.post("/rooms", input))
      return data.room
    } catch (err) {
      if (isNetworkError(err)) {
        return demoCreateRoom(input)
      }
      throw err
    }
  },

  async update(id: string, input: RoomUpdateInput): Promise<Room> {
    try {
      const data = await unwrap<{ room: Room }>(
        http.put(`/rooms/${id}`, input),
      )
      return data.room
    } catch (err) {
      if (isNetworkError(err)) {
        const r = demoUpdateRoom(id, input)
        if (r) return r
      }
      throw err
    }
  },

  async updateStatus(id: string, payload: RoomStatusUpdate): Promise<Room> {
    try {
      const data = await unwrap<{ room: Room }>(
        http.patch(`/rooms/${id}/status`, payload),
      )
      return data.room
    } catch (err) {
      if (isNetworkError(err)) {
        const r = demoUpdateStatus(id, payload.status)
        if (r) return r
      }
      throw err
    }
  },
}
