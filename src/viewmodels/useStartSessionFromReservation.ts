import { useCallback, useState } from "react"
import { useReservations } from "@/src/contexts/ReservationContext"
import { useRooms } from "@/src/contexts/RoomContext"
import { useSessions } from "@/src/contexts/SessionContext"
import type { Session } from "@/src/models/session"

/**
 * Orchestrates "start session from reservation" across three domains.
 *
 * One reservation-check-in + session-create affects:
 *   - sessions     (new active session must appear immediately)
 *   - reservations (row must reflect that it no longer needs action)
 *   - rooms        (room flips from reserved → occupied)
 *
 * Keeping this out of individual view models preserves MVVM boundaries:
 *   - service layer: `sessionService.createFromReservation`
 *   - session view model: local list upsert via `createFromReservation`
 *   - this hook: cross-domain refresh + per-id in-flight guard
 *   - view: thin, only calls `start(...)` and renders state
 */
export interface StartSessionOrchestrator {
  isStarting(reservationId: string): boolean
  start(reservationId: string): Promise<Session>
}

export function useStartSessionFromReservation(): StartSessionOrchestrator {
  const { createFromReservation } = useSessions()
  const { load: loadReservations } = useReservations()
  const { load: loadRooms } = useRooms()
  const [startingIds, setStartingIds] = useState<ReadonlySet<string>>(
    () => new Set(),
  )

  const addId = useCallback((id: string) => {
    setStartingIds((prev) => {
      if (prev.has(id)) return prev
      const next = new Set(prev)
      next.add(id)
      return next
    })
  }, [])

  const removeId = useCallback((id: string) => {
    setStartingIds((prev) => {
      if (!prev.has(id)) return prev
      const next = new Set(prev)
      next.delete(id)
      return next
    })
  }, [])

  const isStarting = useCallback(
    (id: string) => startingIds.has(id),
    [startingIds],
  )

  const start = useCallback(
    async (reservationId: string): Promise<Session> => {
      addId(reservationId)
      try {
        const session = await createFromReservation(reservationId)
        // After success, re-sync reservations + rooms. The session VM already
        // upserted the new session locally via `createFromReservation`.
        await Promise.allSettled([loadReservations(), loadRooms()])
        return session
      } catch (err) {
        // Self-heal: on conflict (e.g. ROOM_ALREADY_OCCUPIED,
        // RESERVATION_NOT_READY_FOR_SESSION), pull fresh state so the UI
        // reflects the backend truth before surfacing the error.
        await Promise.allSettled([loadReservations(), loadRooms()])
        throw err
      } finally {
        removeId(reservationId)
      }
    },
    [addId, createFromReservation, loadReservations, loadRooms, removeId],
  )

  return { isStarting, start }
}
