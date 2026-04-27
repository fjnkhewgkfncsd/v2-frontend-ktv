import { http, unwrap } from "./httpClient"
import type {
  Session,
  SessionItemInput,
  WalkInSessionInput,
} from "@/src/models/session"
import { isNetworkError } from "./demoFallback"
import {
  demoAddItemsToSession,
  demoCreateSessionFromReservation,
  demoCreateWalkInSession,
  demoGetSession,
  demoListActiveSessions,
} from "./demoBookingFallback"

export const sessionService = {
  async listActive(): Promise<Session[]> {
    try {
      const data = await unwrap<{ sessions: Session[]; total: number }>(
        http.get("/sessions/active"),
      )
      return data.sessions ?? []
    } catch (err) {
      if (isNetworkError(err)) return demoListActiveSessions()
      throw err
    }
  },

  async getById(id: string): Promise<Session> {
    try {
      const data = await unwrap<{ session: Session }>(
        http.get(`/sessions/${id}`),
      )
      return data.session
    } catch (err) {
      if (isNetworkError(err)) {
        const s = demoGetSession(id)
        if (s) return s
      }
      throw err
    }
  },

  async createWalkIn(input: WalkInSessionInput): Promise<Session> {
    try {
      const data = await unwrap<{ session: Session }>(
        http.post("/sessions/walk-in", input),
      )
      return data.session
    } catch (err) {
      if (isNetworkError(err)) return demoCreateWalkInSession(input)
      throw err
    }
  },

  async createFromReservation(reservationId: string): Promise<Session> {
    try {
      const data = await unwrap<{ session: Session }>(
        http.post(`/sessions/from-reservation/${reservationId}`),
      )
      return data.session
    } catch (err) {
      if (isNetworkError(err))
        return demoCreateSessionFromReservation(reservationId)
      throw err
    }
  },

  async addItems(
    sessionId: string,
    items: SessionItemInput[],
  ): Promise<Session> {
    try {
      const data = await unwrap<{ session: Session }>(
        http.patch(`/sessions/${sessionId}/items`, { items }),
      )
      return data.session
    } catch (err) {
      if (isNetworkError(err)) return demoAddItemsToSession(sessionId, items)
      throw err
    }
  },
}
