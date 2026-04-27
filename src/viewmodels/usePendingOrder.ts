import { useCallback, useMemo, useState } from "react"
import type { Product } from "@/src/models/product"
import type { SessionItemInput } from "@/src/models/session"

export interface PendingOrderLine {
  productId: string
  quantity: number
  product: Product
}

export interface PendingOrderHook {
  /** Map of productId -> pending quantity (only positive values are kept). */
  pending: Record<string, number>
  /** Expanded, stable cart lines joined with the product objects. */
  lines: PendingOrderLine[]
  /** Sum of product.price * quantity across all lines. */
  subtotal: number
  /** Total units across all lines. */
  count: number
  /** Current pending quantity for a given productId (0 if not pending). */
  quantityOf(productId: string): number
  /** Remaining stock after subtracting what is pending: stockQty - pending. */
  effectiveStockOf(product: Product): number
  /** True when the product can still be incremented (effective stock > 0 and active). */
  canIncrement(product: Product): boolean
  /** Increment pending quantity, capped at product.stockQty. Returns false if not allowed. */
  increment(product: Product): boolean
  /** Decrement pending quantity (removes the entry when it reaches 0). */
  decrement(productId: string): void
  /** Remove a line completely. */
  remove(productId: string): void
  /** Reset all pending quantities. */
  clear(): void
  /** Serialize to the backend PATCH /sessions/:id/items payload. */
  toItemsInput(): SessionItemInput[]
}

/**
 * Encapsulates the transient "pending order" state used by the
 * Add Items to Session modal. Keeping this logic in a hook (per MVVM)
 * means the view stays thin and stock math is not duplicated in JSX.
 *
 * Stock is NOT mutated on the backend here — it is only a UI-side
 * projection. The real deduction happens on
 *   PATCH /api/sessions/:id/items
 * which the caller invokes once the user confirms.
 */
export function usePendingOrder(
  productsById: (id: string) => Product | undefined,
): PendingOrderHook {
  const [pending, setPending] = useState<Record<string, number>>({})

  const quantityOf = useCallback(
    (productId: string) => pending[productId] ?? 0,
    [pending],
  )

  const effectiveStockOf = useCallback(
    (product: Product) => Math.max(0, product.stockQty - (pending[product.id] ?? 0)),
    [pending],
  )

  const canIncrement = useCallback(
    (product: Product) =>
      product.isActive && product.stockQty > (pending[product.id] ?? 0),
    [pending],
  )

  const increment = useCallback(
    (product: Product) => {
      if (!product.isActive) return false
      let allowed = true
      setPending((prev) => {
        const current = prev[product.id] ?? 0
        if (current >= product.stockQty) {
          allowed = false
          return prev
        }
        return { ...prev, [product.id]: current + 1 }
      })
      return allowed
    },
    [],
  )

  const decrement = useCallback((productId: string) => {
    setPending((prev) => {
      const current = prev[productId] ?? 0
      if (current <= 0) return prev
      const next = { ...prev, [productId]: current - 1 }
      if (next[productId] === 0) delete next[productId]
      return next
    })
  }, [])

  const remove = useCallback((productId: string) => {
    setPending((prev) => {
      if (!(productId in prev)) return prev
      const next = { ...prev }
      delete next[productId]
      return next
    })
  }, [])

  const clear = useCallback(() => setPending({}), [])

  const lines = useMemo<PendingOrderLine[]>(() => {
    return Object.entries(pending)
      .filter(([, qty]) => qty > 0)
      .map(([productId, quantity]) => {
        const product = productsById(productId)
        return product ? { productId, quantity, product } : null
      })
      .filter((l): l is PendingOrderLine => l !== null)
  }, [pending, productsById])

  const subtotal = useMemo(
    () => lines.reduce((s, l) => s + l.product.price * l.quantity, 0),
    [lines],
  )

  const count = useMemo(
    () => lines.reduce((s, l) => s + l.quantity, 0),
    [lines],
  )

  const toItemsInput = useCallback(
    (): SessionItemInput[] =>
      lines.map((l) => ({ productId: l.productId, quantity: l.quantity })),
    [lines],
  )

  return {
    pending,
    lines,
    subtotal,
    count,
    quantityOf,
    effectiveStockOf,
    canIncrement,
    increment,
    decrement,
    remove,
    clear,
    toItemsInput,
  }
}
