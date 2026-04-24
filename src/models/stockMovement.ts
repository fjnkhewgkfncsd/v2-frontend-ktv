export type StockMovementType =
  | "stock_in"
  | "adjustment"
  | "session_consume"
  | "invoice_reverse"

export interface StockMovement {
  id: string
  productId: string
  movementType: StockMovementType
  quantity: number
  beforeQty: number
  afterQty: number
  reason: string
  createdBy: string
  sessionId: string | null
  invoiceId: string | null
  createdAt: string
  updatedAt: string
}

export interface StockInInput {
  quantity: number
  reason?: string
}

export interface StockAdjustmentInput {
  newStockQty: number
  reason?: string
}

export interface ProductCreateInput {
  name: string
  category: "drink" | "food" | "snack" | "other"
  price: number
  stockQty: number
  lowStockThreshold: number
  isActive?: boolean
}

export interface ProductUpdateInput {
  name?: string
  category?: "drink" | "food" | "snack" | "other"
  price?: number
  lowStockThreshold?: number
  isActive?: boolean
}

export const STOCK_MOVEMENT_LABEL: Record<StockMovementType, string> = {
  stock_in: "Stock in",
  adjustment: "Adjustment",
  session_consume: "Session order",
  invoice_reverse: "Invoice reversal",
}
