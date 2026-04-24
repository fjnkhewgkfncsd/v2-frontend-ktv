import { useEffect, useMemo, useState } from "react"
import { ArrowRightLeft, Loader2 } from "lucide-react"
import { toast } from "sonner"
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
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { ApiRequestError } from "@/src/models/api"
import type { Product } from "@/src/models/product"
import type {
  StockAdjustmentInput,
  StockMovement,
} from "@/src/models/stockMovement"

interface Props {
  open: boolean
  onOpenChange(open: boolean): void
  product: Product | null
  onSubmit(
    productId: string,
    input: StockAdjustmentInput,
  ): Promise<{ product: Product; stockMovement: StockMovement }>
  onSuccess?(product: Product, movement: StockMovement): void
}

export function StockAdjustmentDialog({
  open,
  onOpenChange,
  product,
  onSubmit,
  onSuccess,
}: Props) {
  const [newQty, setNewQty] = useState("")
  const [reason, setReason] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    if (!open) return
    setNewQty(product ? String(product.stockQty) : "")
    setReason("")
    setError(null)
    setIsSubmitting(false)
  }, [open, product?.id, product?.stockQty])

  const delta = useMemo(() => {
    const parsed = Number(newQty)
    if (!product || !Number.isFinite(parsed)) return null
    return parsed - product.stockQty
  }, [newQty, product])

  const handleSubmit = async () => {
    if (!product) return
    setError(null)
    const qty = Number(newQty)
    if (!Number.isInteger(qty) || qty < 0) {
      setError("New stock must be a non-negative whole number.")
      return
    }
    if (qty === product.stockQty) {
      setError("New stock is the same as current stock — no change needed.")
      return
    }
    setIsSubmitting(true)
    try {
      const res = await onSubmit(product.id, {
        newStockQty: qty,
        reason: reason.trim() || undefined,
      })
      toast.success("Stock adjusted", {
        description: `${product.name}: ${res.stockMovement.beforeQty} → ${res.stockMovement.afterQty}`,
      })
      onSuccess?.(res.product, res.stockMovement)
      onOpenChange(false)
    } catch (err) {
      const msg =
        err instanceof ApiRequestError
          ? err.message
          : "Failed to adjust stock."
      setError(msg)
      toast.error("Adjustment failed", { description: msg })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ArrowRightLeft
              className="h-5 w-5 text-primary"
              aria-hidden="true"
            />
            Stock adjustment
          </DialogTitle>
          <DialogDescription>
            {product ? (
              <>
                Set new on-hand quantity for <strong>{product.name}</strong>.
                Current: <strong>{product.stockQty}</strong>.
              </>
            ) : null}
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="adj-qty">New stock quantity</Label>
            <Input
              id="adj-qty"
              type="number"
              min={0}
              step={1}
              inputMode="numeric"
              value={newQty}
              onChange={(e) => setNewQty(e.target.value)}
              className="tabular-nums"
              autoFocus
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="adj-reason">Reason</Label>
            <Textarea
              id="adj-reason"
              rows={2}
              maxLength={300}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Physical count correction, breakage, expiry..."
            />
          </div>

          {delta !== null && delta !== 0 ? (
            <p className="rounded-md bg-muted/60 px-3 py-2 text-xs text-muted-foreground">
              Net change:{" "}
              <strong
                className={
                  delta > 0
                    ? "tabular-nums text-[color:var(--status-available-fg)]"
                    : "tabular-nums text-destructive"
                }
              >
                {delta > 0 ? `+${delta}` : delta}
              </strong>
            </p>
          ) : null}

          {error ? (
            <p
              role="alert"
              className="rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive"
            >
              {error}
            </p>
          ) : null}
        </div>

        <DialogFooter>
          <Button
            variant="ghost"
            onClick={() => onOpenChange(false)}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="gap-2"
          >
            {isSubmitting ? (
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
            ) : (
              <ArrowRightLeft className="h-4 w-4" aria-hidden="true" />
            )}
            Apply adjustment
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
