import { http, unwrap } from "./httpClient"
import type {
  Reservation,
  ReservationCreateInput,
  ReservationStatus,
  ReservationUpdateInput,
  SessionDraft,
} from "@/src/models/reservation"
import { isNetworkError } from "./demoFallback"
import {
  demoCancelReservation,
  demoCheckInReservation,
  demoCreateReservation,
  demoGetReservation,
  demoListReservations,
  demoUpdateReservation,
} from "./demoBookingFallback"

export interface ListReservationsParams {
  status?: ReservationStatus
  roomId?: string
}

export const reservationService = {
  async list(params: ListReservationsParams = {}): Promise<Reservation[]> {
    try {
      const query: Record<string, string> = {}
      if (params.status) query.status = params.status
      if (params.roomId) query.roomId = params.roomId
      const data = await unwrap<{ reservations: Reservation[]; total: number }>(
        http.get("/reservations", { params: query }),
      )
      return data.reservations ?? []
    } catch (err) {
      if (isNetworkError(err)) return demoListReservations(params)
      throw err
    }
  },

  async getById(id: string): Promise<Reservation> {
    try {
      const data = await unwrap<{ reservation: Reservation }>(
        http.get(`/reservations/${id}`),
      )
      return data.reservation
    } catch (err) {
      if (isNetworkError(err)) {
        const r = demoGetReservation(id)
        if (r) return r
      }
      throw err
    }
  },

  async create(input: ReservationCreateInput): Promise<Reservation> {
    try {
      const data = await unwrap<{ reservation: Reservation }>(
        http.post("/reservations", input),
      )
      return data.reservation
    } catch (err) {
      if (isNetworkError(err)) return demoCreateReservation(input)
      throw err
    }
  },

  async update(
    id: string,
    patch: ReservationUpdateInput,
  ): Promise<Reservation> {
    try {
      const data = await unwrap<{ reservation: Reservation }>(
        http.put(`/reservations/${id}`, patch),
      )
      return data.reservation
    } catch (err) {
      if (isNetworkError(err)) return demoUpdateReservation(id, patch)
      throw err
    }
  },

  async cancel(id: string): Promise<Reservation> {
    try {
      const data = await unwrap<{ reservation: Reservation }>(
        http.patch(`/reservations/${id}/cancel`),
      )
      return data.reservation
    } catch (err) {
      if (isNetworkError(err)) return demoCancelReservation(id)
      throw err
    }
  },

  async checkIn(id: string): Promise<{
    reservation: Reservation
    sessionDraft: SessionDraft
  }> {
    try {
      const data = await unwrap<{
        reservation: Reservation
        sessionDraft: SessionDraft
      }>(http.patch(`/reservations/${id}/check-in`))
      return data
    } catch (err) {
      if (isNetworkError(err)) return demoCheckInReservation(id)
      throw err
    }
  },
}
