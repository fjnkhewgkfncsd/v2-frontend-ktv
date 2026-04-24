import { useEffect, useMemo, useState } from "react"
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
  type Product,
  type ProductCategory,
} from "@/src/models/product"
import { formatCurrency } from "@/src/utils/format"
import type { Session, SessionItemInput } from "@/src/models/session"
import { useProducts } from "@/src/contexts/ProductContext"

interface Props {
  open: boolean
  onOpenChange(open: boolean): void
  session: Session | null
  onSubmit(sessionId: string, items: SessionItemInput[]): Promise<Session>
  onOrdered?(session: Session): void
}

type CartMap = Record<string, number>

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

  const [cart, setCart] = useState<CartMap>({})
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Load products once when dialog opens, reset cart each time it opens.
  useEffect(() => {
    if (!open) return
    setCart({})
    if (products.length === 0) {
      void load()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])

  const cartLines = useMemo(() => {
    return Object.entries(cart)
      .filter(([, qty]) => qty > 0)
      .map(([productId, quantity]) => {
        const product = products.find((p) => p.id === productId)
        return { productId, quantity, product }
      })
      .filter((l): l is { productId: string; quantity: number; product: Product } =>
        Boolean(l.product),
      )
  }, [cart, products])

  const cartSubtotal = useMemo(
    () => cartLines.reduce((s, l) => s + l.product.price * l.quantity, 0),
    [cartLines],
  )
  const cartCount = cartLines.reduce((s, l) => s + l.quantity, 0)

  const inc = (p: Product) => {
    setCart((prev) => {
      const current = prev[p.id] ?? 0
      if (current >= p.stockQty) {
        toast.warning("Not enough stock", {
          description: `${p.name} only has ${p.stockQty} left.`,
        })
        return prev
      }
      return { ...prev, [p.id]: current + 1 }
    })
  }

  const dec = (p: Product) => {
    setCart((prev) => {
      const current = prev[p.id] ?? 0
      if (current <= 0) return prev
      const next = { ...prev, [p.id]: current - 1 }
      if (next[p.id] === 0) delete next[p.id]
      return next
    })
  }

  const removeLine = (productId: string) => {
    setCart((prev) => {
      const next = { ...prev }
      delete next[productId]
      return next
    })
  }

  const handleSubmit = async () => {
    if (!session) return
    if (cartLines.length === 0) return
    setIsSubmitting(true)
    try {
      const items: SessionItemInput[] = cartLines.map((l) => ({
        productId: l.productId,
        quantity: l.quantity,
      }))
      const updated = await onSubmit(session.id, items)
      toast.success("Items added", {
        description: `${cartCount} item${cartCount === 1 ? "" : "s"} to ${updated.roomRateSnapshot.code}`,
      })
      onOrdered?.(updated)
      onOpenChange(false)
    } catch (err) {
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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] p-0 sm:max-w-3xl">
        <DialogHeader className="p-6 pb-3">
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
                Quantities are snapshotted and stock deducts immediately on
                submit.
              </>
            ) : null}
          </DialogDescription>
        </DialogHeader>

        <div className="grid flex-1 grid-cols-1 gap-0 overflow-hidden border-t border-border md:grid-cols-[1fr_300px]">
          {/* Product picker */}
          <div className="flex min-h-0 flex-col">
            <div className="flex flex-col gap-3 border-b border-border p-4">
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

            <div className="min-h-[360px] flex-1 overflow-y-auto p-4">
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
                    <Skeleton key={i} className="h-16" />
                  ))}
                </div>
              ) : filteredProducts.filter((p) => p.isActive).length === 0 ? (
                <p className="py-12 text-center text-sm text-muted-foreground">
                  No products match your filters.
                </p>
              ) : (
                <ul className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                  {filteredProducts.filter((p) => p.isActive).map((p) => {
                    const inCart = cart[p.id] ?? 0
                    const outOfStock = p.stockQty <= 0
                    return (
                      <li key={p.id}>
                        <div
                          className={cn(
                            "flex items-center justify-between gap-3 rounded-md border border-border bg-card p-3",
                            outOfStock && "opacity-60",
                          )}
                        >
                          <div className="flex min-w-0 flex-col">
                            <div className="flex items-center gap-2">
                              <span className="truncate text-sm font-medium text-foreground">
                                {p.name}
                              </span>
                              {p.isLowStock && !outOfStock ? (
                                <span className="inline-flex items-center rounded-full bg-[color:var(--status-reserved-bg)] px-1.5 py-0.5 text-[10px] font-semibold uppercase text-[color:var(--status-reserved-fg)]">
                                  Low
                                </span>
                              ) : null}
                              {outOfStock ? (
                                <span className="inline-flex items-center rounded-full bg-[color:var(--status-occupied-bg)] px-1.5 py-0.5 text-[10px] font-semibold uppercase text-[color:var(--status-occupied-fg)]">
                                  Out
                                </span>
                              ) : null}
                            </div>
                            <div className="mt-0.5 flex items-center gap-2 text-xs text-muted-foreground">
                              <span className="capitalize">
                                {PRODUCT_CATEGORY_LABEL[p.category]}
                              </span>
                              <span aria-hidden="true">·</span>
                              <span className="font-medium tabular-nums text-foreground">
                                {formatCurrency(p.price)}
                              </span>
                              <span aria-hidden="true">·</span>
                              <span className="tabular-nums">
                                Stock {p.stockQty}
                              </span>
                            </div>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <Button
                              type="button"
                              variant="outline"
                              size="icon"
                              className="h-7 w-7"
                              onClick={() => dec(p)}
                              disabled={inCart === 0}
                              aria-label={`Decrease quantity for ${p.name}`}
                            >
                              <Minus className="h-3.5 w-3.5" aria-hidden="true" />
                            </Button>
                            <span className="w-5 text-center text-sm font-medium tabular-nums">
                              {inCart}
                            </span>
                            <Button
                              type="button"
                              variant="default"
                              size="icon"
                              className="h-7 w-7"
                              onClick={() => inc(p)}
                              disabled={outOfStock || inCart >= p.stockQty}
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

          {/* Cart summary */}
          <aside className="flex min-h-0 flex-col border-t border-border bg-muted/30 md:border-l md:border-t-0">
            <div className="flex items-center justify-between border-b border-border px-4 py-3">
              <p className="text-sm font-medium text-foreground">Order</p>
              <span className="text-xs text-muted-foreground">
                {cartCount} item{cartCount === 1 ? "" : "s"}
              </span>
            </div>
            <div className="flex-1 overflow-y-auto px-4 py-3">
              {cartLines.length === 0 ? (
                <p className="py-6 text-center text-sm text-muted-foreground">
                  Add items from the list.
                </p>
              ) : (
                <ul className="flex flex-col gap-2">
                  {cartLines.map((line) => (
                    <li
                      key={line.productId}
                      className="flex items-center justify-between gap-2 rounded-md border border-border bg-background p-2"
                    >
                      <div className="flex min-w-0 flex-col">
                        <span className="truncate text-sm font-medium text-foreground">
                          {line.product.name}
                        </span>
                        <span className="text-xs text-muted-foreground tabular-nums">
                          {formatCurrency(line.product.price)} × {line.quantity}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold tabular-nums text-foreground">
                          {formatCurrency(line.product.price * line.quantity)}
                        </span>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-muted-foreground hover:text-destructive"
                          onClick={() => removeLine(line.productId)}
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
            <div className="flex items-center justify-between border-t border-border px-4 py-3 text-sm">
              <span className="text-muted-foreground">Subtotal</span>
              <span className="text-base font-semibold tabular-nums text-foreground">
                {formatCurrency(cartSubtotal)}
              </span>
            </div>
          </aside>
        </div>

        <DialogFooter className="border-t border-border p-4">
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
            disabled={isSubmitting || cartLines.length === 0 || !session}
            className="gap-2"
          >
            {isSubmitting ? (
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
            ) : (
              <ShoppingBag className="h-4 w-4" aria-hidden="true" />
            )}
            Add {cartCount > 0 ? cartCount : ""} to session
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
