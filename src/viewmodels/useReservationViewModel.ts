import { useCallback, useMemo, useState } from "react"
import { reservationService } from "@/src/services/reservationService"
import { ApiRequestError } from "@/src/models/api"
import type {
  Reservation,
  ReservationCreateInput,
  ReservationStatus,
  ReservationUpdateInput,
  SessionDraft,
} from "@/src/models/reservation"

export interface ReservationViewModel {
  reservations: Reservation[]
  isLoading: boolean
  error: string | null
  selectedStatus: ReservationStatus | "all"
  setSelectedStatus(status: ReservationStatus | "all"): void
  filteredReservations: Reservation[]
  statusCounts: Record<ReservationStatus, number> & { total: number }
  load(): Promise<void>
  getById(id: string): Reservation | undefined
  create(input: ReservationCreateInput): Promise<Reservation>
  update(id: string, patch: ReservationUpdateInput): Promise<Reservation>
  cancel(id: string): Promise<Reservation>
  checkIn(id: string): Promise<{
    reservation: Reservation
    sessionDraft: SessionDraft
  }>
}

const EMPTY_COUNTS = {
  pending: 0,
  confirmed: 0,
  cancelled: 0,
  checked_in: 0,
  total: 0,
}

function toMessage(err: unknown, fallback: string): string {
  return err instanceof ApiRequestError ? err.message : fallback
}

export function useReservationViewModel(): ReservationViewModel {
  const [reservations, setReservations] = useState<Reservation[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [selectedStatus, setSelectedStatus] = useState<
    ReservationStatus | "all"
  >("all")

  const load = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      const list = await reservationService.list()
      setReservations(list)
    } catch (err) {
      const msg = toMessage(err, "Failed to load reservations.")
      setError(msg)
      console.log("[v0] reservations load failed:", msg)
    } finally {
      setIsLoading(false)
    }
  }, [])

  const getById = useCallback(
    (id: string) => reservations.find((r) => r.id === id),
    [reservations],
  )

  const upsert = useCallback((next: Reservation) => {
    setReservations((prev) => {
      const idx = prev.findIndex((r) => r.id === next.id)
      if (idx === -1) return [next, ...prev]
      return prev.map((r, i) => (i === idx ? next : r))
    })
  }, [])

  const create = useCallback(
    async (input: ReservationCreateInput): Promise<Reservation> => {
      const created = await reservationService.create(input)
      setReservations((prev) => [created, ...prev])
      return created
    },
    [],
  )

  const update = useCallback(
    async (id: string, patch: ReservationUpdateInput): Promise<Reservation> => {
      const updated = await reservationService.update(id, patch)
      upsert(updated)
      return updated
    },
    [upsert],
  )

  const cancel = useCallback(
    async (id: string): Promise<Reservation> => {
      const updated = await reservationService.cancel(id)
      upsert(updated)
      return updated
    },
    [upsert],
  )

  const checkIn = useCallback(
    async (id: string) => {
      const result = await reservationService.checkIn(id)
      upsert(result.reservation)
      return result
    },
    [upsert],
  )

  const statusCounts = useMemo(() => {
    const counts = { ...EMPTY_COUNTS }
    for (const r of reservations) {
      if (r.status in counts) {
        counts[r.status] = (counts[r.status] || 0) + 1
      }
      counts.total += 1
    }
    return counts
  }, [reservations])

  const filteredReservations = useMemo(() => {
    if (selectedStatus === "all") return reservations
    return reservations.filter((r) => r.status === selectedStatus)
  }, [reservations, selectedStatus])

  return {
    reservations,
    isLoading,
    error,
    selectedStatus,
    setSelectedStatus,
    filteredReservations,
    statusCounts,
    load,
    getById,
    create,
    update,
    cancel,
    checkIn,
  }
}
