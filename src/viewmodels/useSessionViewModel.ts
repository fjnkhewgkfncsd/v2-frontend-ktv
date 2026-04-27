import { useCallback, useState } from "react"
import { sessionService } from "@/src/services/sessionService"
import { invoiceService } from "@/src/services/invoiceService"
import { ApiRequestError } from "@/src/models/api"
import type {
  Session,
  SessionItemInput,
  WalkInSessionInput,
} from "@/src/models/session"
import type { CheckoutInput, Invoice } from "@/src/models/invoice"

export interface CheckoutResult {
  invoice: Invoice
  session: Session | null
}

export interface SessionViewModel {
  sessions: Session[]
  isLoading: boolean
  error: string | null
  load(): Promise<void>
  getById(id: string): Session | undefined
  fetchById(id: string): Promise<Session>
  createWalkIn(input: WalkInSessionInput): Promise<Session>
  createFromReservation(reservationId: string): Promise<Session>
  addItems(sessionId: string, items: SessionItemInput[]): Promise<Session>
  checkout(sessionId: string, input: CheckoutInput): Promise<CheckoutResult>
}

function toMessage(err: unknown, fallback: string): string {
  return err instanceof ApiRequestError ? err.message : fallback
}

export function useSessionViewModel(): SessionViewModel {
  const [sessions, setSessions] = useState<Session[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      const list = await sessionService.listActive()
      setSessions(list)
    } catch (err) {
      const msg = toMessage(err, "Failed to load active sessions.")
      setError(msg)
      console.log("[v0] sessions load failed:", msg)
    } finally {
      setIsLoading(false)
    }
  }, [])

  const getById = useCallback(
    (id: string) => sessions.find((s) => s.id === id),
    [sessions],
  )

  const upsert = useCallback((next: Session) => {
    setSessions((prev) => {
      const idx = prev.findIndex((s) => s.id === next.id)
      if (idx === -1) {
        return next.status === "open" ? [next, ...prev] : prev
      }
      // Remove from active list if no longer open.
      if (next.status !== "open") {
        return prev.filter((s) => s.id !== next.id)
      }
      return prev.map((s, i) => (i === idx ? next : s))
    })
  }, [])

  const fetchById = useCallback(
    async (id: string): Promise<Session> => {
      const session = await sessionService.getById(id)
      upsert(session)
      return session
    },
    [upsert],
  )

  const createWalkIn = useCallback(
    async (input: WalkInSessionInput): Promise<Session> => {
      const created = await sessionService.createWalkIn(input)
      upsert(created)
      return created
    },
    [upsert],
  )

  const createFromReservation = useCallback(
    async (reservationId: string): Promise<Session> => {
      const created = await sessionService.createFromReservation(reservationId)
      upsert(created)
      return created
    },
    [upsert],
  )

  const addItems = useCallback(
    async (
      sessionId: string,
      items: SessionItemInput[],
    ): Promise<Session> => {
      const updated = await sessionService.addItems(sessionId, items)
      upsert(updated)
      return updated
    },
    [upsert],
  )

  const checkout = useCallback(
    async (
      sessionId: string,
      input: CheckoutInput,
    ): Promise<CheckoutResult> => {
      const invoice = await invoiceService.checkout(sessionId, input)
      // The session is now closed. Try to refresh it so callers can read
      // the closed state, but surface the invoice as the source of truth.
      let closed: Session | null = null
      try {
        closed = await sessionService.getById(sessionId)
      } catch (err) {
        // Non-fatal — invoice already returned, session fetch can fail.
        console.log(
          "[v0] post-checkout session fetch failed:",
          toMessage(err, "unknown"),
        )
      }
      setSessions((prev) => prev.filter((s) => s.id !== sessionId))
      return { invoice, session: closed }
    },
    [],
  )

  return {
    sessions,
    isLoading,
    error,
    load,
    getById,
    fetchById,
    createWalkIn,
    createFromReservation,
    addItems,
    checkout,
  }
}
