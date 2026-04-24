import { useEffect, useState } from "react"
import { ArrowDownToLine, Loader2 } from "lucide-react"
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
  StockInInput,
  StockMovement,
} from "@/src/models/stockMovement"

interface Props {
  open: boolean
  onOpenChange(open: boolean): void
  product: Product | null
  onSubmit(
    productId: string,
    input: StockInInput,
  ): Promise<{ product: Product; stockMovement: StockMovement }>
  onSuccess?(product: Product, movement: StockMovement): void
}

export function StockInDialog({
  open,
  onOpenChange,
  product,
  onSubmit,
  onSuccess,
}: Props) {
  const [quantity, setQuantity] = useState("")
  const [reason, setReason] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    if (!open) return
    setQuantity("")
    setReason("")
    setError(null)
    setIsSubmitting(false)
  }, [open, product?.id])

  const handleSubmit = async () => {
    if (!product) return
    setError(null)
    const qty = Number(quantity)
    if (!Number.isInteger(qty) || qty <= 0) {
      setError("Quantity must be a positive whole number.")
      return
    }
    setIsSubmitting(true)
    try {
      const res = await onSubmit(product.id, {
        quantity: qty,
        reason: reason.trim() || undefined,
      })
      toast.success("Stock increased", {
        description: `${product.name}: ${res.stockMovement.beforeQty} → ${res.stockMovement.afterQty}`,
      })
      onSuccess?.(res.product, res.stockMovement)
      onOpenChange(false)
    } catch (err) {
      const msg =
        err instanceof ApiRequestError ? err.message : "Failed to add stock."
      setError(msg)
      toast.error("Stock-in failed", { description: msg })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ArrowDownToLine
              className="h-5 w-5 text-primary"
              aria-hidden="true"
            />
            Receive stock
          </DialogTitle>
          <DialogDescription>
            {product ? (
              <>
                Increase stock for <strong>{product.name}</strong>. Current on
                hand: <strong>{product.stockQty}</strong>.
              </>
            ) : null}
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="stockin-qty">Quantity received</Label>
            <Input
              id="stockin-qty"
              type="number"
              min={1}
              step={1}
              inputMode="numeric"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              placeholder="e.g. 24"
              className="tabular-nums"
              autoFocus
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="stockin-reason">Reason / reference</Label>
            <Textarea
              id="stockin-reason"
              rows={2}
              maxLength={300}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Weekly supplier delivery, PO#..."
            />
          </div>

          {quantity && product ? (
            <p className="rounded-md bg-muted/60 px-3 py-2 text-xs text-muted-foreground">
              New on-hand will be{" "}
              <strong className="text-foreground tabular-nums">
                {product.stockQty + (Number(quantity) || 0)}
              </strong>
              .
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
          <Button onClick={handleSubmit} disabled={isSubmitting} className="gap-2">
            {isSubmitting ? (
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
            ) : (
              <ArrowDownToLine className="h-4 w-4" aria-hidden="true" />
            )}
            Confirm stock-in
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
