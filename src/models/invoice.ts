export type InvoiceLineType = "room" | "product"
export type PaymentStatus = "unpaid" | "paid"
export type PaymentMethod = "cash" | "card" | "qr"

export interface InvoiceLine {
  _id: string
  lineType: InvoiceLineType
  referenceId: string
  code: string
  description: string
  quantity: number
  unitPrice: number
  lineTotal: number
}

export interface Invoice {
  id: string
  sessionId: string
  invoiceNumber: string
  paymentStatus: PaymentStatus
  paymentMethod: PaymentMethod | null
  paidAt: string | null
  paidBy: string | null
  lines: InvoiceLine[]
  roomCharge: number
  productCharge: number
  subtotal: number
  discountAmount: number
  taxAmount: number
  grandTotal: number
  notes: string
  createdAt: string
  updatedAt: string
}

export interface CheckoutInput {
  paymentStatus?: PaymentStatus
  paymentMethod?: PaymentMethod
  discountAmount?: number
  taxAmount?: number
  checkoutTime?: string
  notes?: string
}

export const PAYMENT_METHOD_LABEL: Record<PaymentMethod, string> = {
  cash: "Cash",
  card: "Card",
  qr: "QR Payment",
}

export const PAYMENT_STATUS_LABEL: Record<PaymentStatus, string> = {
  unpaid: "Unpaid",
  paid: "Paid",
}
