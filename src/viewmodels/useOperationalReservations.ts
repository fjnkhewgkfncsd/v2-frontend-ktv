import { useMemo } from "react"
import { useReservations } from "@/src/contexts/ReservationContext"
import { useSessions } from "@/src/contexts/SessionContext"
import { useRooms } from "@/src/contexts/RoomContext"
import type {
  Reservation,
  ReservationStatus,
} from "@/src/models/reservation"
import type { Session } from "@/src/models/session"

/**
 * Operational-reservation selector view model.
 *
 * Combines `ReservationViewModel` + `SessionViewModel` + `RoomViewModel` to
 * derive the list the *operational* UI cares about — i.e. reservations that
 * still need staff action.
 *
 * A reservation is considered "no longer operational" when ANY of these hold:
 *   - its status is `cancelled`
 *   - an open session references it (by `reservationId`)
 *   - an open session references its room (room is occupied by another session)
 *   - the room record flags it as occupied / has a `currentSessionId`
 *
 * Placing this composition in the view-model layer (not in the view) preserves
 * MVVM — the page just renders `filteredReservations` / `statusCounts` without
 * any business logic of its own.
 */

const EMPTY_COUNTS: Record<ReservationStatus, number> & { total: number } = {
  pending: 0,
  confirmed: 0,
  cancelled: 0,
  checked_in: 0,
  total: 0,
}

// Any room field that could tell us the room already has an active session.
// We read these defensively because the backend room shape has evolved.
interface MaybeOccupiedRoom {
  id: string
  status?: string
  currentSessionId?: string | null
  activeSessionId?: string | null
}

// Any reservation field that could tell us a session has been attached.
// We read these defensively because the backend reservation payload may
// start including them in the future (the current type doesn't).
interface MaybeLinkedReservation extends Reservation {
  sessionId?: string | null
  activeSessionId?: string | null
  hasActiveSession?: boolean
  room?: { currentSessionId?: string | null } | null
}

export interface OperationalReservationsViewModel {
  /** The reservation list shown in the main operational table. */
  operationalReservations: Reservation[]
  /** Operational list narrowed by `selectedStatus`. */
  filteredReservations: Reservation[]
  /** Status counts derived from `operationalReservations` (not raw). */
  statusCounts: Record<ReservationStatus, number> & { total: number }
  selectedStatus: ReservationStatus | "all"
  setSelectedStatus(status: ReservationStatus | "all"): void
  /** Map of reservationId → open Session. Exposed for per-row CTAs. */
  activeSessionByReservationId: Map<string, Session>
  /** Predicate — true when this reservation still needs staff action. */
  isOperational(reservation: Reservation): boolean
}

export function useOperationalReservations(): OperationalReservationsViewModel {
  const { reservations, selectedStatus, setSelectedStatus } = useReservations()
  const { sessions } = useSessions()
  const { rooms } = useRooms()

  // Build the set of reservation ids + room ids that are "taken" by an open
  // session. We iterate sessions once and index both, so the per-reservation
  // filter is O(1).
  const { activeSessionByReservationId, occupiedRoomIds } = useMemo(() => {
    const byReservation = new Map<string, Session>()
    const rooms = new Set<string>()
    for (const s of sessions) {
      if (s.status !== "open") continue
      if (s.reservationId) byReservation.set(s.reservationId, s)
      if (s.roomId) rooms.add(s.roomId)
    }
    return { activeSessionByReservationId: byReservation, occupiedRoomIds: rooms }
  }, [sessions])

  // Rooms whose own record says they're already occupied (covers the case
  // where a session hasn't been loaded yet but the room model is authoritative).
  const occupiedRoomIdsFromRoomModel = useMemo(() => {
    const set = new Set<string>()
    for (const r of rooms as MaybeOccupiedRoom[]) {
      if (
        r.status === "occupied" ||
        (r.currentSessionId != null && r.currentSessionId !== "") ||
        (r.activeSessionId != null && r.activeSessionId !== "")
      ) {
        set.add(r.id)
      }
    }
    return set
  }, [rooms])

  const isOperational = useMemo(() => {
    return (reservation: Reservation): boolean => {
      if (reservation.status === "cancelled") return false

      const r = reservation as MaybeLinkedReservation
      if (r.sessionId) return false
      if (r.activeSessionId) return false
      if (r.hasActiveSession) return false
      if (r.room?.currentSessionId) return false

      if (activeSessionByReservationId.has(reservation.id)) return false
      if (occupiedRoomIds.has(reservation.roomId)) return false
      if (occupiedRoomIdsFromRoomModel.has(reservation.roomId)) return false

      return true
    }
  }, [
    activeSessionByReservationId,
    occupiedRoomIds,
    occupiedRoomIdsFromRoomModel,
  ])

  const operationalReservations = useMemo(
    () => reservations.filter(isOperational),
    [reservations, isOperational],
  )

  const statusCounts = useMemo(() => {
    const counts = { ...EMPTY_COUNTS }
    for (const r of operationalReservations) {
      if (r.status in counts) {
        counts[r.status] = (counts[r.status] || 0) + 1
      }
      counts.total += 1
    }
    return counts
  }, [operationalReservations])

  const filteredReservations = useMemo(() => {
    if (selectedStatus === "all") return operationalReservations
    return operationalReservations.filter((r) => r.status === selectedStatus)
  }, [operationalReservations, selectedStatus])

  return {
    operationalReservations,
    filteredReservations,
    statusCounts,
    selectedStatus,
    setSelectedStatus,
    activeSessionByReservationId,
    isOperational,
  }
}
