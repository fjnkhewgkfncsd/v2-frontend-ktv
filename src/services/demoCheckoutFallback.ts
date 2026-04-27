/**
 * Demo fallback for invoices and stock workflows.
 * Activates only when the real backend is unreachable (network error).
 *
 * Kept in a separate module so the booking fallback file stays focused
 * on reservations/sessions/products state, and this one owns checkout +
 * stock-movement state. They share in-memory state by importing the
 * accessors from demoBookingFallback.
 */
import type {
  CheckoutInput,
  Invoice,
  InvoiceLine,
  PaymentMethod,
} from "@/src/models/invoice"
import type { Product } from "@/src/models/product"
import type {
  ProductCreateInput,
  ProductUpdateInput,
  StockAdjustmentInput,
  StockInInput,
  StockMovement,
  StockMovementType,
} from "@/src/models/stockMovement"
import type { Session } from "@/src/models/session"
import { ApiRequestError } from "@/src/models/api"
import {
  _demoGetInternalSession,
  _demoMutateProducts,
  _demoMutateSessions,
  _demoReadProducts,
  _demoReadSessions,
} from "./demoBookingFallback"
import { demoUpdateStatus } from "./demoFallback"

const now = () => new Date().toISOString()

let idCounter = 5000
const nextId = (prefix: string) => `demo-${prefix}-${++idCounter}`

// ----- Invoices -----

let demoInvoices: Invoice[] = []

/** Read-only accessor for sibling demo modules (e.g. reports). */
export function _demoReadInvoices(): Invoice[] {
  return demoInvoices
}

function generateInvoiceNumber(): string {
  const d = new Date()
  const pad = (n: number, len = 2) => String(n).padStart(len, "0")
  const stamp = `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}${pad(
    d.getHours(),
  )}${pad(d.getMinutes())}${pad(d.getSeconds())}`
  const seq = pad(idCounter % 10_000, 4)
  return `INV-${stamp}-${seq}`
}

function computeRoomCharge(session: Session): {
  minutes: number
  rate: number
  total: number
} {
  const start = new Date(session.startTime).getTime()
  const end = Date.now()
  const minutes = Math.max(0, Math.ceil((end - start) / 60_000))
  const rate = session.roomRateSnapshot.hourlyRate
  // Mirror backend example where rate appears to be per minute in tests.
  // For demo purposes we use hourly rate prorated by minute.
  const total = Math.round((minutes / 60) * rate * 100) / 100
  return { minutes, rate, total }
}

function buildInvoiceLines(session: Session): {
  lines: InvoiceLine[]
  roomCharge: number
  productCharge: number
} {
  const room = computeRoomCharge(session)
  const roomLine: InvoiceLine = {
    _id: nextId("line"),
    lineType: "room",
    referenceId: session.roomId,
    code: session.roomRateSnapshot.code,
    description: `Room ${session.roomRateSnapshot.code} room charge`,
    quantity: room.minutes,
    unitPrice: Math.round((room.rate / 60) * 100) / 100,
    lineTotal: room.total,
  }
  const productLines: InvoiceLine[] = session.orderedItems.map((item) => ({
    _id: nextId("line"),
    lineType: "product",
    referenceId: item.productId,
    code: "",
    description: item.productName,
    quantity: item.quantity,
    unitPrice: item.unitPrice,
    lineTotal: item.lineTotal,
  }))
  const productCharge = productLines.reduce((s, l) => s + l.lineTotal, 0)
  return {
    lines: [roomLine, ...productLines],
    roomCharge: room.total,
    productCharge,
  }
}

export function demoCheckoutSession(
  sessionId: string,
  input: CheckoutInput,
): { invoice: Invoice; session: Session } {
  const sessions = _demoReadSessions()
  const idx = sessions.findIndex((s) => s.id === sessionId)
  if (idx === -1) {
    throw new ApiRequestError("Session not found", "SESSION_NOT_FOUND", 404)
  }
  const session = sessions[idx]
  if (session.status !== "open") {
    throw new ApiRequestError(
      "Only active sessions can be checked out",
      "SESSION_NOT_OPEN",
      409,
    )
  }
  const existing = demoInvoices.find((i) => i.sessionId === session.id)
  if (existing) {
    throw new ApiRequestError(
      "Session already has an invoice",
      "INVOICE_ALREADY_EXISTS",
      409,
    )
  }

  const { lines, roomCharge, productCharge } = buildInvoiceLines(session)
  const subtotal = Math.round((roomCharge + productCharge) * 100) / 100
  const discountAmount = Math.max(0, Number(input.discountAmount ?? 0))
  const taxAmount = Math.max(0, Number(input.taxAmount ?? 0))
  const grandTotal =
    Math.round((subtotal - discountAmount + taxAmount) * 100) / 100
  const paymentStatus = input.paymentStatus ?? "unpaid"
  const paymentMethod: PaymentMethod | null =
    paymentStatus === "paid" ? input.paymentMethod ?? "cash" : null
  const checkoutTime = input.checkoutTime ?? now()

  if (paymentStatus === "paid" && !input.paymentMethod) {
    throw new ApiRequestError(
      "paymentMethod is required when paymentStatus is paid",
      "VALIDATION_ERROR",
      400,
    )
  }

  const invoice: Invoice = {
    id: nextId("inv"),
    sessionId: session.id,
    invoiceNumber: generateInvoiceNumber(),
    paymentStatus,
    paymentMethod,
    paidAt: paymentStatus === "paid" ? checkoutTime : null,
    paidBy: paymentStatus === "paid" ? "demo-user-0001" : null,
    lines,
    roomCharge,
    productCharge,
    subtotal,
    discountAmount,
    taxAmount,
    grandTotal,
    notes: input.notes ?? "",
    createdAt: now(),
    updatedAt: now(),
  }
  demoInvoices = [invoice, ...demoInvoices]

  const closed: Session = {
    ...session,
    status: "closed",
    endTime: checkoutTime,
    invoiceId: invoice.id,
    closedBy: "demo-user-0001",
    updatedAt: now(),
  }
  _demoMutateSessions((list) =>
    list.map((s, i) => (i === idx ? closed : s)),
  )
  // move room back to cleaning
  demoUpdateStatus(session.roomId, "cleaning")

  return { invoice, session: closed }
}

export function demoGetInvoice(id: string): Invoice | undefined {
  return demoInvoices.find((i) => i.id === id)
}

// ----- Stock movements -----

let demoStockMovements: StockMovement[] = []

function recordMovement(
  product: Product,
  movementType: StockMovementType,
  quantity: number,
  beforeQty: number,
  afterQty: number,
  reason: string,
  refs: { sessionId?: string | null; invoiceId?: string | null } = {},
): StockMovement {
  const movement: StockMovement = {
    id: nextId("mov"),
    productId: product.id,
    movementType,
    quantity,
    beforeQty,
    afterQty,
    reason,
    createdBy: "demo-user-0001",
    sessionId: refs.sessionId ?? null,
    invoiceId: refs.invoiceId ?? null,
    createdAt: now(),
    updatedAt: now(),
  }
  demoStockMovements = [movement, ...demoStockMovements]
  return movement
}

export function demoListStockMovements(productId: string): StockMovement[] {
  return demoStockMovements.filter((m) => m.productId === productId)
}

export function demoStockIn(
  productId: string,
  input: StockInInput,
): { product: Product; stockMovement: StockMovement } {
  if (!Number.isInteger(input.quantity) || input.quantity <= 0) {
    throw new ApiRequestError(
      "quantity must be a positive integer",
      "VALIDATION_ERROR",
      400,
    )
  }
  const products = _demoReadProducts()
  const idx = products.findIndex((p) => p.id === productId)
  if (idx === -1) {
    throw new ApiRequestError("Product not found", "PRODUCT_NOT_FOUND", 404)
  }
  const current = products[idx]
  const beforeQty = current.stockQty
  const afterQty = beforeQty + input.quantity
  const updated: Product = {
    ...current,
    stockQty: afterQty,
    isLowStock: afterQty <= current.lowStockThreshold,
    updatedAt: now(),
  }
  _demoMutateProducts((list) =>
    list.map((p, i) => (i === idx ? updated : p)),
  )
  const mov = recordMovement(
    updated,
    "stock_in",
    input.quantity,
    beforeQty,
    afterQty,
    input.reason?.trim() || "Stock received",
  )
  return { product: updated, stockMovement: mov }
}

export function demoStockAdjustment(
  productId: string,
  input: StockAdjustmentInput,
): { product: Product; stockMovement: StockMovement } {
  if (!Number.isInteger(input.newStockQty) || input.newStockQty < 0) {
    throw new ApiRequestError(
      "newStockQty must be a non-negative integer",
      "VALIDATION_ERROR",
      400,
    )
  }
  const products = _demoReadProducts()
  const idx = products.findIndex((p) => p.id === productId)
  if (idx === -1) {
    throw new ApiRequestError("Product not found", "PRODUCT_NOT_FOUND", 404)
  }
  const current = products[idx]
  const beforeQty = current.stockQty
  const afterQty = input.newStockQty
  if (beforeQty === afterQty) {
    throw new ApiRequestError(
      "newStockQty must be different from the current stock",
      "NO_STOCK_CHANGE",
      409,
    )
  }
  const updated: Product = {
    ...current,
    stockQty: afterQty,
    isLowStock: afterQty <= current.lowStockThreshold,
    updatedAt: now(),
  }
  _demoMutateProducts((list) =>
    list.map((p, i) => (i === idx ? updated : p)),
  )
  const mov = recordMovement(
    updated,
    "adjustment",
    afterQty,
    beforeQty,
    afterQty,
    input.reason?.trim() || "Physical count adjustment",
  )
  return { product: updated, stockMovement: mov }
}

// ----- Product CRUD (admin) -----

export function demoCreateProduct(input: ProductCreateInput): Product {
  if (!input.name?.trim()) {
    throw new ApiRequestError("name is required", "VALIDATION_ERROR", 400)
  }
  if (input.price < 0) {
    throw new ApiRequestError(
      "price must be >= 0",
      "VALIDATION_ERROR",
      400,
    )
  }
  if (!Number.isInteger(input.stockQty) || input.stockQty < 0) {
    throw new ApiRequestError(
      "stockQty must be a non-negative integer",
      "VALIDATION_ERROR",
      400,
    )
  }
  if (
    !Number.isInteger(input.lowStockThreshold) ||
    input.lowStockThreshold < 0
  ) {
    throw new ApiRequestError(
      "lowStockThreshold must be a non-negative integer",
      "VALIDATION_ERROR",
      400,
    )
  }

  const created: Product = {
    id: nextId("prod"),
    name: input.name.trim(),
    category: input.category,
    price: Math.round(input.price * 100) / 100,
    stockQty: input.stockQty,
    lowStockThreshold: input.lowStockThreshold,
    isActive: input.isActive ?? true,
    isLowStock: input.stockQty <= input.lowStockThreshold,
    createdAt: now(),
    updatedAt: now(),
  }
  _demoMutateProducts((list) => [created, ...list])

  if (input.stockQty > 0) {
    recordMovement(
      created,
      "stock_in",
      input.stockQty,
      0,
      input.stockQty,
      "Initial stock on create",
    )
  }
  return created
}

export function demoUpdateProduct(
  id: string,
  patch: ProductUpdateInput,
): Product {
  const products = _demoReadProducts()
  const idx = products.findIndex((p) => p.id === id)
  if (idx === -1) {
    throw new ApiRequestError("Product not found", "PRODUCT_NOT_FOUND", 404)
  }
  const current = products[idx]
  const updated: Product = {
    ...current,
    name: patch.name?.trim() || current.name,
    category: patch.category ?? current.category,
    price:
      typeof patch.price === "number"
        ? Math.round(patch.price * 100) / 100
        : current.price,
    lowStockThreshold:
      typeof patch.lowStockThreshold === "number"
        ? patch.lowStockThreshold
        : current.lowStockThreshold,
    isActive:
      typeof patch.isActive === "boolean" ? patch.isActive : current.isActive,
    updatedAt: now(),
  }
  updated.isLowStock = updated.stockQty <= updated.lowStockThreshold
  _demoMutateProducts((list) =>
    list.map((p, i) => (i === idx ? updated : p)),
  )
  return updated
}

// Used to keep the app reactive after a session is closed via checkout.
export function demoGetSessionAfterCheckout(id: string): Session | undefined {
  return _demoGetInternalSession(id)
}
