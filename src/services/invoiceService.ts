import { http, unwrap } from "./httpClient"
import type { CheckoutInput, Invoice } from "@/src/models/invoice"
import { isNetworkError } from "./demoFallback"
import {
  demoCheckoutSession,
  demoGetInvoice,
} from "./demoCheckoutFallback"

export interface CheckoutResult {
  invoice: Invoice
}

export const invoiceService = {
  async checkout(
    sessionId: string,
    input: CheckoutInput = {},
  ): Promise<Invoice> {
    try {
      const data = await unwrap<CheckoutResult>(
        http.post(`/invoices/checkout/${sessionId}`, input),
      )
      return data.invoice
    } catch (err) {
      if (isNetworkError(err)) {
        return demoCheckoutSession(sessionId, input).invoice
      }
      throw err
    }
  },

  async getById(id: string): Promise<Invoice> {
    try {
      const data = await unwrap<{ invoice: Invoice }>(
        http.get(`/invoices/${id}`),
      )
      return data.invoice
    } catch (err) {
      if (isNetworkError(err)) {
        const inv = demoGetInvoice(id)
        if (inv) return inv
      }
      throw err
    }
  },
}
