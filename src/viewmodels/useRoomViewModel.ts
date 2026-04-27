import { useCallback, useMemo, useState } from "react"
import {
  roomService,
  type RoomCreateInput,
  type RoomUpdateInput,
} from "@/src/services/roomService"
import { ApiRequestError } from "@/src/models/api"
import type { Room, RoomStatus, RoomStatusUpdate } from "@/src/models/room"

export interface RoomViewModel {
  rooms: Room[]
  isLoading: boolean
  error: string | null
  selectedStatus: RoomStatus | "all"
  setSelectedStatus(status: RoomStatus | "all"): void
  filteredRooms: Room[]
  statusCounts: Record<RoomStatus, number> & { total: number }
  load(): Promise<void>
  create(input: RoomCreateInput): Promise<Room>
  update(id: string, input: RoomUpdateInput): Promise<Room>
  updateStatus(roomId: string, payload: RoomStatusUpdate): Promise<Room | null>
  getRoomById(id: string): Room | undefined
}

const EMPTY_COUNTS = {
  available: 0,
  reserved: 0,
  occupied: 0,
  cleaning: 0,
  maintenance: 0,
  total: 0,
}

export function useRoomViewModel(): RoomViewModel {
  const [rooms, setRooms] = useState<Room[]>([])
  const [isLoading, setIsLoading] = useState<boolean>(false)
  const [error, setError] = useState<string | null>(null)
  const [selectedStatus, setSelectedStatus] = useState<RoomStatus | "all">("all")

  const load = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      const list = await roomService.list()
      setRooms(list)
    } catch (err) {
      const msg =
        err instanceof ApiRequestError
          ? err.message
          : "Failed to load rooms. Please try again."
      setError(msg)
      console.log("[v0] room load failed:", msg)
    } finally {
      setIsLoading(false)
    }
  }, [])

  const create = useCallback(async (input: RoomCreateInput): Promise<Room> => {
    const created = await roomService.create(input)
    setRooms((prev) => {
      if (prev.some((r) => r.id === created.id)) {
        return prev.map((r) => (r.id === created.id ? created : r))
      }
      return [...prev, created]
    })
    return created
  }, [])

  const update = useCallback(
    async (id: string, input: RoomUpdateInput): Promise<Room> => {
      const updated = await roomService.update(id, input)
      setRooms((prev) => prev.map((r) => (r.id === updated.id ? updated : r)))
      return updated
    },
    [],
  )

  const updateStatus = useCallback(
    async (roomId: string, payload: RoomStatusUpdate): Promise<Room | null> => {
      try {
        const updated = await roomService.updateStatus(roomId, payload)
        setRooms((prev) => prev.map((r) => (r.id === updated.id ? updated : r)))
        return updated
      } catch (err) {
        const msg =
          err instanceof ApiRequestError
            ? err.message
            : "Failed to update room status."
        setError(msg)
        return null
      }
    },
    [],
  )

  const getRoomById = useCallback(
    (id: string) => rooms.find((r) => r.id === id),
    [rooms],
  )

  const statusCounts = useMemo(() => {
    const counts = { ...EMPTY_COUNTS }
    for (const room of rooms) {
      if (room.status in counts) {
        counts[room.status] = (counts[room.status] || 0) + 1
      }
      counts.total += 1
    }
    return counts
  }, [rooms])

  const filteredRooms = useMemo(() => {
    if (selectedStatus === "all") return rooms
    return rooms.filter((r) => r.status === selectedStatus)
  }, [rooms, selectedStatus])

  return {
    rooms,
    isLoading,
    error,
    selectedStatus,
    setSelectedStatus,
    filteredRooms,
    statusCounts,
    load,
    create,
    update,
    updateStatus,
    getRoomById,
  }
}
