import { useCallback, useEffect, useState } from "react"
import {
  AlertTriangle,
  Loader2,
  Minus,
  Plus,
  Search,
  ShoppingBag,
  Trash2,
} from "lucide-react"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import { ApiRequestError } from "@/src/models/api"
import {
  PRODUCT_CATEGORY_LABEL,
  PRODUCT_CATEGORY_ORDER,
  type ProductCategory,
} from "@/src/models/product"
import { formatCurrency } from "@/src/utils/format"
import type { Session, SessionItemInput } from "@/src/models/session"
import { useProducts } from "@/src/contexts/ProductContext"
import { usePendingOrder } from "@/src/viewmodels/usePendingOrder"

interface Props {
  open: boolean
  onOpenChange(open: boolean): void
  session: Session | null
  onSubmit(sessionId: string, items: SessionItemInput[]): Promise<Session>
  onOrdered?(session: Session): void
}

export function OrderProductsDialog({
  open,
  onOpenChange,
  session,
  onSubmit,
  onOrdered,
}: Props) {
  const {
    products,
    isLoading,
    error,
    selectedCategory,
    setSelectedCategory,
    search,
    setSearch,
    filteredProducts,
    load,
  } = useProducts()

  // Resolve products by id for the pending-order hook. Memoize via useCallback
  // so the hook's `lines` memo only recomputes when products change.
  const productsById = useCallback(
    (id: string) => products.find((p) => p.id === id),
    [products],
  )

  const order = usePendingOrder(productsById)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Load products once when dialog opens, reset pending order each time.
  useEffect(() => {
    if (!open) return
    order.clear()
    if (products.length === 0) {
      void load()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])

  const handleIncrement = (productId: string) => {
    const product = products.find((p) => p.id === productId)
    if (!product) return
    const ok = order.increment(product)
    if (!ok) {
      toast.warning("Not enough stock", {
        description: `${product.name} only has ${product.stockQty} in stock.`,
      })
    }
  }

  const handleSubmit = async () => {
    if (!session || order.lines.length === 0) return
    setIsSubmitting(true)
    try {
      const updated = await onSubmit(session.id, order.toItemsInput())
      toast.success("Items added", {
        description: `${order.count} item${order.count === 1 ? "" : "s"} to ${updated.roomRateSnapshot.code}`,
      })
      onOrdered?.(updated)
      onOpenChange(false)
    } catch (err) {
      // Keep the pending order intact so the user can adjust & retry.
      const msg =
        err instanceof ApiRequestError ? err.message : "Failed to add items."
      toast.error("Could not add items", { description: msg })
    } finally {
      setIsSubmitting(false)
    }
  }

  const categoryChips: { key: ProductCategory | "all"; label: string }[] = [
    { key: "all", label: "All" },
    ...PRODUCT_CATEGORY_ORDER.map((c) => ({
      key: c,
      label: PRODUCT_CATEGORY_LABEL[c],
    })),
  ]

  const activeFiltered = filteredProducts.filter((p) => p.isActive)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {/*
        shadcn's DialogContent defaults to `grid gap-4`. We override to a
        bounded flex column so the header and footer stay visible while the
        body scroll regions take the remaining height.
      */}
      <DialogContent className="flex h-[90vh] max-h-[90vh] flex-col gap-0 overflow-hidden p-0 sm:max-w-3xl">
        <DialogHeader className="shrink-0 border-b border-border p-6 pb-4">
          <DialogTitle className="flex items-center gap-2">
            <ShoppingBag
              className="h-5 w-5 text-primary"
              aria-hidden="true"
            />
            Add items to session
          </DialogTitle>
          <DialogDescription>
            {session ? (
              <>
                {session.roomRateSnapshot.code} — {session.customerName}.
                Stock is reserved visually while you build the order and only
                deducts on the server when you confirm.
              </>
            ) : null}
          </DialogDescription>
        </DialogHeader>

        {/* Scrollable body: two independent scroll columns on md+ */}
        <div className="grid min-h-0 flex-1 grid-cols-1 overflow-hidden md:grid-cols-[1fr_320px]">
          {/* Product picker column */}
          <div className="flex min-h-0 flex-col">
            <div className="flex shrink-0 flex-col gap-3 border-b border-border p-4">
              <div className="relative">
                <Search
                  className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
                  aria-hidden="true"
                />
                <Input
                  type="search"
                  placeholder="Search products"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9"
                  aria-label="Search products"
                />
              </div>
              <div
                role="tablist"
                aria-label="Filter products by category"
                className="flex flex-wrap gap-2"
              >
                {categoryChips.map((chip) => {
                  const active = selectedCategory === chip.key
                  return (
                    <button
                      key={chip.key}
                      type="button"
                      role="tab"
                      aria-selected={active}
                      onClick={() => setSelectedCategory(chip.key)}
                      className={cn(
                        "inline-flex items-center rounded-full border px-3 py-1 text-xs font-medium transition-all",
                        active
                          ? "border-primary bg-primary text-primary-foreground"
                          : "border-border bg-card text-foreground hover:border-primary/40 hover:bg-primary/[0.04]",
                      )}
                    >
                      {chip.label}
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Product list — independently scrollable */}
            <div className="min-h-0 flex-1 overflow-y-auto p-4">
              {error ? (
                <div
                  role="alert"
                  className="flex items-start gap-2 rounded-md border border-destructive/30 bg-destructive/5 p-3 text-sm"
                >
                  <AlertTriangle
                    className="mt-0.5 h-4 w-4 text-destructive"
                    aria-hidden="true"
                  />
                  <div className="flex-1">
                    <p className="font-medium text-destructive">
                      Failed to load products
                    </p>
                    <p className="text-xs text-muted-foreground">{error}</p>
                  </div>
                  <Button size="sm" variant="outline" onClick={() => load()}>
                    Retry
                  </Button>
                </div>
              ) : isLoading && products.length === 0 ? (
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                  {Array.from({ length: 6 }).map((_, i) => (
                    <Skeleton key={i} className="h-20" />
                  ))}
                </div>
              ) : activeFiltered.length === 0 ? (
                <p className="py-12 text-center text-sm text-muted-foreground">
                  No products match your filters.
                </p>
              ) : (
                <ul className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                  {activeFiltered.map((p) => {
                    const pendingQty = order.quantityOf(p.id)
                    const effectiveStock = order.effectiveStockOf(p)
                    const outOfStock = effectiveStock <= 0
                    const effectiveLow =
                      p.isLowStock || (effectiveStock > 0 && effectiveStock <= 5)

                    return (
                      <li key={p.id}>
                        <div
                          className={cn(
                            "flex items-start justify-between gap-3 rounded-md border border-border bg-card p-3 transition-colors",
                            pendingQty > 0 &&
                              "border-primary/40 ring-1 ring-primary/15",
                            outOfStock && "opacity-70",
                          )}
                        >
                          {/* Text column — min-w-0 so truncation works inside flex */}
                          <div className="flex min-w-0 flex-1 flex-col gap-1">
                            <div className="flex items-center gap-1.5">
                              <span className="truncate text-sm font-medium text-foreground">
                                {p.name}
                              </span>
                            </div>
                            <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-muted-foreground">
                              <span className="capitalize">
                                {PRODUCT_CATEGORY_LABEL[p.category]}
                              </span>
                              <span aria-hidden="true">·</span>
                              <span className="font-medium tabular-nums text-foreground">
                                {formatCurrency(p.price)}
                              </span>
                              <span aria-hidden="true">·</span>
                              <span
                                className={cn(
                                  "tabular-nums",
                                  outOfStock && "text-destructive",
                                )}
                              >
                                Stock {effectiveStock}
                              </span>
                            </div>
                            <div className="flex flex-wrap gap-1">
                              {effectiveLow && !outOfStock ? (
                                <span className="inline-flex items-center rounded-full bg-[color:var(--status-reserved-bg)] px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-[color:var(--status-reserved-fg)]">
                                  Low
                                </span>
                              ) : null}
                              {outOfStock ? (
                                <span className="inline-flex items-center rounded-full bg-[color:var(--status-occupied-bg)] px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-[color:var(--status-occupied-fg)]">
                                  Out
                                </span>
                              ) : null}
                            </div>
                          </div>

                          {/* Stepper controls — shrink-0 so they never overlap text */}
                          <div className="flex shrink-0 items-center gap-1.5 self-center">
                            <Button
                              type="button"
                              variant="outline"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => order.decrement(p.id)}
                              disabled={pendingQty === 0}
                              aria-label={`Decrease quantity for ${p.name}`}
                            >
                              <Minus className="h-3.5 w-3.5" aria-hidden="true" />
                            </Button>
                            <span
                              className="w-6 text-center text-sm font-medium tabular-nums"
                              aria-live="polite"
                              aria-label={`${pendingQty} in pending order`}
                            >
                              {pendingQty}
                            </span>
                            <Button
                              type="button"
                              variant="default"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => handleIncrement(p.id)}
                              disabled={!order.canIncrement(p)}
                              aria-label={`Increase quantity for ${p.name}`}
                            >
                              <Plus className="h-3.5 w-3.5" aria-hidden="true" />
                            </Button>
                          </div>
                        </div>
                      </li>
                    )
                  })}
                </ul>
              )}
            </div>
          </div>

          {/* Order summary aside — independently scrollable */}
          <aside className="flex min-h-0 flex-col border-t border-border bg-muted/30 md:border-l md:border-t-0">
            <div className="flex shrink-0 items-center justify-between border-b border-border px-4 py-3">
              <p className="text-sm font-medium text-foreground">Order</p>
              <span className="text-xs text-muted-foreground">
                {order.count} item{order.count === 1 ? "" : "s"}
              </span>
            </div>
            <div className="min-h-0 flex-1 overflow-y-auto px-4 py-3">
              {order.lines.length === 0 ? (
                <div className="flex h-full flex-col items-center justify-center gap-1 py-6 text-center">
                  <ShoppingBag
                    className="h-6 w-6 text-muted-foreground/60"
                    aria-hidden="true"
                  />
                  <p className="text-sm font-medium text-foreground">
                    No items added yet
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Use the list to build this order.
                  </p>
                </div>
              ) : (
                <ul className="flex flex-col gap-2">
                  {order.lines.map((line) => (
                    <li
                      key={line.productId}
                      className="flex items-start justify-between gap-2 rounded-md border border-border bg-background p-2"
                    >
                      <div className="flex min-w-0 flex-1 flex-col">
                        <span className="truncate text-sm font-medium text-foreground">
                          {line.product.name}
                        </span>
                        <span className="text-xs tabular-nums text-muted-foreground">
                          {formatCurrency(line.product.price)} × {line.quantity}
                        </span>
                      </div>
                      <div className="flex shrink-0 items-center gap-1">
                        <span className="text-sm font-semibold tabular-nums text-foreground">
                          {formatCurrency(line.product.price * line.quantity)}
                        </span>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-muted-foreground hover:text-destructive"
                          onClick={() => order.remove(line.productId)}
                          aria-label={`Remove ${line.product.name}`}
                        >
                          <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                        </Button>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
            <div className="flex shrink-0 items-center justify-between border-t border-border px-4 py-3 text-sm">
              <span className="text-muted-foreground">Subtotal</span>
              <span className="text-base font-semibold tabular-nums text-foreground">
                {formatCurrency(order.subtotal)}
              </span>
            </div>
          </aside>
        </div>

        {/* Sticky footer — always visible */}
        <DialogFooter className="shrink-0 border-t border-border bg-background p-4">
          <Button
            type="button"
            variant="ghost"
            onClick={() => onOpenChange(false)}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button
            type="button"
            onClick={handleSubmit}
            disabled={isSubmitting || order.lines.length === 0 || !session}
            className="gap-2"
          >
            {isSubmitting ? (
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
            ) : (
              <ShoppingBag className="h-4 w-4" aria-hidden="true" />
            )}
            {isSubmitting
              ? "Adding…"
              : order.count > 0
                ? `Add ${order.count} item${order.count === 1 ? "" : "s"} to session`
                : "Add items to session"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
