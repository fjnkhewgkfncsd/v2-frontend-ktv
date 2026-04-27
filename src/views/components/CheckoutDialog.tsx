import { useEffect, useMemo, useState } from "react"
import {
  Banknote,
  CreditCard,
  Loader2,
  Printer,
  QrCode,
  Receipt,
  ShieldCheck,
  Sparkles,
  X,
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
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Separator } from "@/components/ui/separator"
import { ApiRequestError } from "@/src/models/api"
import {
  PAYMENT_METHOD_LABEL,
  type CheckoutInput,
  type Invoice,
  type PaymentMethod,
  type PaymentStatus,
} from "@/src/models/invoice"
import type { Session } from "@/src/models/session"
import { formatCurrency, formatElapsedSince } from "@/src/utils/format"
import { InvoiceView } from "./InvoiceView"

interface Props {
  open: boolean
  onOpenChange(open: boolean): void
  session: Session | null
  onCheckout(
    sessionId: string,
    input: CheckoutInput,
  ): Promise<{ invoice: Invoice }>
  onCompleted?(invoice: Invoice): void
  onViewInvoice?(invoice: Invoice): void
}

const METHOD_OPTIONS: {
  key: PaymentMethod
  label: string
  icon: React.ComponentType<{ className?: string }>
}[] = [
  { key: "cash", label: PAYMENT_METHOD_LABEL.cash, icon: Banknote },
  { key: "card", label: PAYMENT_METHOD_LABEL.card, icon: CreditCard },
  { key: "qr", label: PAYMENT_METHOD_LABEL.qr, icon: QrCode },
]

export function CheckoutDialog({
  open,
  onOpenChange,
  session,
  onCheckout,
  onCompleted,
  onViewInvoice,
}: Props) {
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus>("unpaid")
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("cash")
  const [discount, setDiscount] = useState("")
  const [tax, setTax] = useState("")
  const [notes, setNotes] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [invoice, setInvoice] = useState<Invoice | null>(null)
  const [validationError, setValidationError] = useState<string | null>(null)

  // Reset form each time the dialog opens a new session.
  useEffect(() => {
    if (!open) return
    setPaymentStatus("unpaid")
    setPaymentMethod("cash")
    setDiscount("")
    setTax("")
    setNotes("")
    setIsSubmitting(false)
    setInvoice(null)
    setValidationError(null)
  }, [open, session?.id])

  const estimate = useMemo(() => {
    if (!session) return null
    const start = new Date(session.startTime).getTime()
    const minutes = Math.max(0, Math.ceil((Date.now() - start) / 60_000))
    const rate = session.roomRateSnapshot.hourlyRate
    const roomCharge = Math.round((minutes / 60) * rate * 100) / 100
    const subtotal = roomCharge + session.itemsSubtotal
    const discountNum = Math.max(0, Number(discount) || 0)
    const taxNum = Math.max(0, Number(tax) || 0)
    const grandTotal = Math.max(0, subtotal - discountNum + taxNum)
    return {
      minutes,
      rate,
      roomCharge,
      productCharge: session.itemsSubtotal,
      subtotal,
      discount: discountNum,
      tax: taxNum,
      grandTotal,
    }
  }, [session, discount, tax])

  const handleSubmit = async () => {
    if (!session) return
    setValidationError(null)

    const discountNum = Math.max(0, Number(discount) || 0)
    const taxNum = Math.max(0, Number(tax) || 0)
    if (Number.isNaN(discountNum) || Number.isNaN(taxNum)) {
      setValidationError("Discount and tax must be valid numbers.")
      return
    }
    if (paymentStatus === "paid" && !paymentMethod) {
      setValidationError(
        "Choose a payment method when marking the invoice as paid.",
      )
      return
    }

    const payload: CheckoutInput = {
      paymentStatus,
      discountAmount: discountNum || undefined,
      taxAmount: taxNum || undefined,
      notes: notes.trim() || undefined,
    }
    if (paymentStatus === "paid") payload.paymentMethod = paymentMethod

    setIsSubmitting(true)
    try {
      const result = await onCheckout(session.id, payload)
      setInvoice(result.invoice)
      toast.success("Checkout complete", {
        description: `Invoice ${result.invoice.invoiceNumber} · ${formatCurrency(result.invoice.grandTotal)}`,
      })
      onCompleted?.(result.invoice)
    } catch (err) {
      const msg =
        err instanceof ApiRequestError ? err.message : "Checkout failed."
      setValidationError(msg)
      toast.error("Checkout failed", { description: msg })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className={cn(
          "max-h-[92vh] overflow-y-auto p-0",
          invoice ? "sm:max-w-2xl" : "sm:max-w-3xl",
        )}
      >
        {invoice ? (
          <>
            <DialogHeader className="p-6 pb-3">
              <DialogTitle className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-primary" aria-hidden="true" />
                Checkout successful
              </DialogTitle>
              <DialogDescription>
                Session closed and room moved to cleaning. Backend is the
                source of truth for all totals below.
              </DialogDescription>
            </DialogHeader>
            <div className="px-6 pb-4">
              <InvoiceView invoice={invoice} compact />
            </div>
            <DialogFooter className="border-t border-border p-4">
              <Button
                variant="ghost"
                onClick={() => onOpenChange(false)}
                className="gap-2"
              >
                <X className="h-4 w-4" aria-hidden="true" /> Close
              </Button>
              <Button
                variant="outline"
                onClick={() => window.print()}
                className="gap-2"
              >
                <Printer className="h-4 w-4" aria-hidden="true" /> Print
              </Button>
              {onViewInvoice ? (
                <Button
                  onClick={() => onViewInvoice(invoice)}
                  className="gap-2"
                >
                  <Receipt className="h-4 w-4" aria-hidden="true" />
                  Open invoice
                </Button>
              ) : null}
            </DialogFooter>
          </>
        ) : (
          <>
            <DialogHeader className="p-6 pb-3">
              <DialogTitle className="flex items-center gap-2">
                <Receipt className="h-5 w-5 text-primary" aria-hidden="true" />
                Review checkout
              </DialogTitle>
              <DialogDescription>
                {session ? (
                  <>
                    Closing <strong>{session.roomRateSnapshot.code}</strong>{" "}
                    for {session.customerName}. Backend recomputes final
                    amounts from session state.
                  </>
                ) : (
                  "Select a session to checkout."
                )}
              </DialogDescription>
            </DialogHeader>

            <div className="grid flex-1 grid-cols-1 gap-0 overflow-hidden border-t border-border md:grid-cols-[1fr_320px]">
              {/* Form */}
              <div className="flex flex-col gap-6 p-6">
                <div className="flex flex-col gap-3">
                  <Label className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    Payment status
                  </Label>
                  <div
                    role="radiogroup"
                    aria-label="Payment status"
                    className="grid grid-cols-2 gap-2"
                  >
                    <StatusOption
                      active={paymentStatus === "unpaid"}
                      onClick={() => setPaymentStatus("unpaid")}
                      title="Unpaid"
                      subtitle="Finalize payment later"
                    />
                    <StatusOption
                      active={paymentStatus === "paid"}
                      onClick={() => setPaymentStatus("paid")}
                      title="Paid"
                      subtitle="Settle at checkout"
                      variant="primary"
                    />
                  </div>
                </div>

                {paymentStatus === "paid" ? (
                  <div className="flex flex-col gap-3">
                    <Label className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                      Payment method
                    </Label>
                    <div
                      role="radiogroup"
                      aria-label="Payment method"
                      className="grid grid-cols-3 gap-2"
                    >
                      {METHOD_OPTIONS.map((m) => {
                        const Icon = m.icon
                        const active = paymentMethod === m.key
                        return (
                          <button
                            key={m.key}
                            type="button"
                            role="radio"
                            aria-checked={active}
                            onClick={() => setPaymentMethod(m.key)}
                            className={cn(
                              "flex flex-col items-center gap-1.5 rounded-md border p-3 text-xs font-medium transition-all",
                              active
                                ? "border-primary bg-primary/5 text-primary shadow-sm"
                                : "border-border bg-card text-foreground hover:border-primary/40",
                            )}
                          >
                            <Icon className="h-5 w-5" aria-hidden="true" />
                            {m.label}
                          </button>
                        )
                      })}
                    </div>
                  </div>
                ) : null}

                <div className="grid grid-cols-2 gap-3">
                  <div className="flex flex-col gap-1.5">
                    <Label htmlFor="discount" className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                      Discount
                    </Label>
                    <Input
                      id="discount"
                      type="number"
                      min={0}
                      inputMode="decimal"
                      step="0.01"
                      value={discount}
                      placeholder="0.00"
                      onChange={(e) => setDiscount(e.target.value)}
                      className="tabular-nums"
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <Label htmlFor="tax" className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                      Tax
                    </Label>
                    <Input
                      id="tax"
                      type="number"
                      min={0}
                      inputMode="decimal"
                      step="0.01"
                      value={tax}
                      placeholder="0.00"
                      onChange={(e) => setTax(e.target.value)}
                      className="tabular-nums"
                    />
                  </div>
                </div>

                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="notes" className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    Notes
                  </Label>
                  <Textarea
                    id="notes"
                    value={notes}
                    maxLength={500}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Paid in full, comped drinks, etc."
                    rows={3}
                  />
                </div>

                {validationError ? (
                  <p
                    role="alert"
                    className="rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive"
                  >
                    {validationError}
                  </p>
                ) : null}
              </div>

              {/* Summary */}
              <aside className="flex flex-col gap-4 border-t border-border bg-muted/30 p-6 md:border-l md:border-t-0">
                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    Estimated total
                  </p>
                  <p className="mt-1 text-[11px] text-muted-foreground">
                    Final amounts are computed by the backend at submit.
                  </p>
                </div>

                {estimate && session ? (
                  <>
                    <dl className="flex flex-col gap-2 text-sm">
                      <SumRow
                        label="Room time"
                        secondary={`${estimate.minutes}m · ${formatCurrency(estimate.rate)}/hr`}
                      >
                        {formatCurrency(estimate.roomCharge)}
                      </SumRow>
                      <SumRow
                        label="Products"
                        secondary={`${session.orderedItems.length} line${session.orderedItems.length === 1 ? "" : "s"}`}
                      >
                        {formatCurrency(estimate.productCharge)}
                      </SumRow>
                      <Separator />
                      <SumRow label="Subtotal">
                        {formatCurrency(estimate.subtotal)}
                      </SumRow>
                      {estimate.discount > 0 ? (
                        <SumRow label="Discount">
                          -{formatCurrency(estimate.discount)}
                        </SumRow>
                      ) : null}
                      {estimate.tax > 0 ? (
                        <SumRow label="Tax">
                          {formatCurrency(estimate.tax)}
                        </SumRow>
                      ) : null}
                      <Separator />
                      <div className="flex items-baseline justify-between">
                        <dt className="text-sm font-medium">Grand total</dt>
                        <dd className="text-xl font-semibold tabular-nums">
                          {formatCurrency(estimate.grandTotal)}
                        </dd>
                      </div>
                    </dl>

                    <div className="rounded-md border border-primary/20 bg-primary/[0.03] p-3">
                      <div className="flex items-center gap-2">
                        <ShieldCheck
                          className="h-4 w-4 text-primary"
                          aria-hidden="true"
                        />
                        <span className="text-xs font-medium text-foreground">
                          {session.customerName}
                        </span>
                      </div>
                      <dl className="mt-2 grid grid-cols-2 gap-x-3 gap-y-1 text-[11px] text-muted-foreground">
                        <dt>Room</dt>
                        <dd className="text-foreground">
                          {session.roomRateSnapshot.code}
                        </dd>
                        <dt>Elapsed</dt>
                        <dd className="text-foreground">
                          {formatElapsedSince(session.startTime)}
                        </dd>
                      </dl>
                    </div>
                  </>
                ) : null}
              </aside>
            </div>

            <DialogFooter className="border-t border-border p-4">
              <Button
                variant="ghost"
                onClick={() => onOpenChange(false)}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={isSubmitting || !session}
                className="gap-2"
              >
                {isSubmitting ? (
                  <Loader2
                    className="h-4 w-4 animate-spin"
                    aria-hidden="true"
                  />
                ) : (
                  <Receipt className="h-4 w-4" aria-hidden="true" />
                )}
                Checkout & generate invoice
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}

function StatusOption({
  active,
  onClick,
  title,
  subtitle,
  variant,
}: {
  active: boolean
  onClick(): void
  title: string
  subtitle: string
  variant?: "primary"
}) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={active}
      onClick={onClick}
      className={cn(
        "flex flex-col items-start gap-0.5 rounded-md border p-3 text-left transition-all",
        active
          ? variant === "primary"
            ? "border-primary bg-primary/5 text-primary shadow-sm"
            : "border-primary bg-primary/5 shadow-sm"
          : "border-border bg-card hover:border-primary/40",
      )}
    >
      <span className="text-sm font-semibold">{title}</span>
      <span
        className={cn(
          "text-[11px]",
          active ? "text-primary/80" : "text-muted-foreground",
        )}
      >
        {subtitle}
      </span>
    </button>
  )
}

function SumRow({
  label,
  secondary,
  children,
}: {
  label: string
  secondary?: string
  children: React.ReactNode
}) {
  return (
    <div className="flex items-baseline justify-between gap-3">
      <div className="flex flex-col">
        <span className="text-sm text-muted-foreground">{label}</span>
        {secondary ? (
          <span className="text-[11px] text-muted-foreground/80">
            {secondary}
          </span>
        ) : null}
      </div>
      <span className="text-sm font-medium tabular-nums text-foreground">
        {children}
      </span>
    </div>
  )
}
