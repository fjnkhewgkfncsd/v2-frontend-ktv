import { useCallback, useEffect, useState } from "react"
import {
  AlertTriangle,
  ArrowDownToLine,
  ArrowRightLeft,
  History,
  PenSquare,
  Power,
  PowerOff,
  RefreshCw,
  Tag,
} from "lucide-react"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { ApiRequestError } from "@/src/models/api"
import {
  PRODUCT_CATEGORY_LABEL,
  type Product,
} from "@/src/models/product"
import type { StockMovement } from "@/src/models/stockMovement"
import { formatCurrency, formatDateTime } from "@/src/utils/format"
import { StockMovementsTable } from "./StockMovementsTable"
import { useProducts } from "@/src/contexts/ProductContext"

interface Props {
  open: boolean
  onOpenChange(open: boolean): void
  product: Product | null
  isAdmin: boolean
  onEdit(product: Product): void
  onStockIn(product: Product): void
  onStockAdjust(product: Product): void
}

export function ProductDetailSheet({
  open,
  onOpenChange,
  product,
  isAdmin,
  onEdit,
  onStockIn,
  onStockAdjust,
}: Props) {
  const { listStockMovements, updateProduct, refreshOne } = useProducts()

  const [movements, setMovements] = useState<StockMovement[]>([])
  const [isLoadingMovements, setIsLoadingMovements] = useState(false)
  const [movementsError, setMovementsError] = useState<string | null>(null)
  const [isTogglingActive, setIsTogglingActive] = useState(false)

  const loadMovements = useCallback(
    async (productId: string) => {
      setIsLoadingMovements(true)
      setMovementsError(null)
      try {
        const list = await listStockMovements(productId)
        setMovements(list)
      } catch (err) {
        const msg =
          err instanceof ApiRequestError
            ? err.message
            : "Failed to load stock history."
        setMovementsError(msg)
      } finally {
        setIsLoadingMovements(false)
      }
    },
    [listStockMovements],
  )

  useEffect(() => {
    if (!open || !product) return
    void loadMovements(product.id)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, product?.id])

  // Keep the movements list in sync when the underlying product updates
  // (e.g. user just performed a stock-in from this sheet).
  useEffect(() => {
    if (!open || !product) return
    void loadMovements(product.id)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [product?.updatedAt])

  const toggleActive = async () => {
    if (!product) return
    setIsTogglingActive(true)
    try {
      await updateProduct(product.id, { isActive: !product.isActive })
      toast.success(
        product.isActive ? "Product deactivated" : "Product reactivated",
        { description: product.name },
      )
    } catch (err) {
      const msg =
        err instanceof ApiRequestError
          ? err.message
          : "Failed to update product."
      toast.error("Update failed", { description: msg })
    } finally {
      setIsTogglingActive(false)
    }
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="flex w-full max-w-2xl flex-col gap-0 overflow-y-auto p-0 sm:max-w-2xl"
      >
        <SheetHeader className="border-b border-border p-6">
          <SheetTitle className="flex items-center gap-2">
            <Tag className="h-5 w-5 text-primary" aria-hidden="true" />
            {product?.name ?? "Product"}
          </SheetTitle>
          <SheetDescription>
            {product ? (
              <>
                {PRODUCT_CATEGORY_LABEL[product.category]} ·{" "}
                {formatCurrency(product.price)} · {product.stockQty} in stock
              </>
            ) : (
              "Viewing product details."
            )}
          </SheetDescription>
        </SheetHeader>

        {product ? (
          <div className="flex flex-1 flex-col gap-6 p-6">
            {/* Status chips */}
            <div className="flex flex-wrap items-center gap-2">
              <StatusChip
                label={product.isActive ? "Active" : "Inactive"}
                tone={product.isActive ? "available" : "muted"}
              />
              {product.isLowStock ? (
                <StatusChip label="Low stock" tone="reserved" />
              ) : null}
              {product.stockQty === 0 ? (
                <StatusChip label="Out of stock" tone="occupied" />
              ) : null}
            </div>

            {product.stockQty === 0 ? (
              <div
                role="status"
                className="flex items-start gap-2 rounded-md border border-destructive/30 bg-destructive/5 p-3 text-sm"
              >
                <AlertTriangle
                  className="mt-0.5 h-4 w-4 text-destructive"
                  aria-hidden="true"
                />
                <p className="flex-1 text-muted-foreground">
                  This product is at zero stock and will be unavailable for
                  order until replenished.
                </p>
              </div>
            ) : null}

            {/* Quick stats */}
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <Stat
                label="Price"
                value={formatCurrency(product.price)}
                emphasis
              />
              <Stat label="On hand" value={String(product.stockQty)} emphasis />
              <Stat
                label="Low threshold"
                value={String(product.lowStockThreshold)}
              />
              <Stat
                label="Updated"
                value={formatDateTime(product.updatedAt)}
              />
            </div>

            {/* Admin actions */}
            {isAdmin ? (
              <div className="flex flex-wrap gap-2 rounded-md border border-border bg-muted/30 p-3">
                <Button
                  size="sm"
                  className="gap-2"
                  onClick={() => onStockIn(product)}
                >
                  <ArrowDownToLine className="h-4 w-4" aria-hidden="true" />
                  Stock in
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="gap-2"
                  onClick={() => onStockAdjust(product)}
                >
                  <ArrowRightLeft className="h-4 w-4" aria-hidden="true" />
                  Adjust stock
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="gap-2"
                  onClick={() => onEdit(product)}
                >
                  <PenSquare className="h-4 w-4" aria-hidden="true" />
                  Edit product
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={toggleActive}
                  disabled={isTogglingActive}
                  className="gap-2"
                >
                  {product.isActive ? (
                    <>
                      <PowerOff className="h-4 w-4" aria-hidden="true" />
                      Deactivate
                    </>
                  ) : (
                    <>
                      <Power className="h-4 w-4" aria-hidden="true" />
                      Reactivate
                    </>
                  )}
                </Button>
              </div>
            ) : (
              <p className="rounded-md border border-border bg-muted/40 px-3 py-2 text-xs text-muted-foreground">
                Sign in as an admin to modify product data or stock.
              </p>
            )}

            <Separator />

            {/* Stock history */}
            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <History
                    className="h-4 w-4 text-muted-foreground"
                    aria-hidden="true"
                  />
                  <h3 className="text-sm font-semibold text-foreground">
                    Stock movements
                  </h3>
                  <span className="text-xs text-muted-foreground">
                    {movements.length} record{movements.length === 1 ? "" : "s"}
                  </span>
                </div>
                <Button
                  size="sm"
                  variant="ghost"
                  className="gap-2"
                  onClick={() => {
                    void loadMovements(product.id)
                    void refreshOne(product.id)
                  }}
                  disabled={isLoadingMovements}
                >
                  <RefreshCw
                    className={cn(
                      "h-4 w-4",
                      isLoadingMovements && "animate-spin",
                    )}
                    aria-hidden="true"
                  />
                  Refresh
                </Button>
              </div>

              {movementsError ? (
                <p
                  role="alert"
                  className="rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive"
                >
                  {movementsError}
                </p>
              ) : null}

              <div className="overflow-hidden rounded-md border border-border">
                <StockMovementsTable
                  movements={movements}
                  isLoading={isLoadingMovements}
                  emptyMessage="No stock activity yet for this product."
                />
              </div>
            </div>
          </div>
        ) : null}
      </SheetContent>
    </Sheet>
  )
}

function Stat({
  label,
  value,
  emphasis,
}: {
  label: string
  value: string
  emphasis?: boolean
}) {
  return (
    <div className="rounded-md border border-border bg-card p-3">
      <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
        {label}
      </p>
      <p
        className={cn(
          "mt-1 truncate tabular-nums",
          emphasis
            ? "text-base font-semibold text-foreground"
            : "text-sm text-foreground",
        )}
      >
        {value}
      </p>
    </div>
  )
}

function StatusChip({
  label,
  tone,
}: {
  label: string
  tone: "available" | "reserved" | "occupied" | "muted"
}) {
  const classes: Record<typeof tone, string> = {
    available:
      "bg-[color:var(--status-available-bg)] text-[color:var(--status-available-fg)]",
    reserved:
      "bg-[color:var(--status-reserved-bg)] text-[color:var(--status-reserved-fg)]",
    occupied:
      "bg-[color:var(--status-occupied-bg)] text-[color:var(--status-occupied-fg)]",
    muted: "bg-muted text-muted-foreground",
  }
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide",
        classes[tone],
      )}
    >
      {label}
    </span>
  )
}
