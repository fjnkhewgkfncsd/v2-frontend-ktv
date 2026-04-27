import { CheckCircle2, CircleAlert, Music2 } from "lucide-react"
import { cn } from "@/lib/utils"
import { Separator } from "@/components/ui/separator"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  PAYMENT_METHOD_LABEL,
  type Invoice,
} from "@/src/models/invoice"
import { formatCurrency, formatDateTime } from "@/src/utils/format"

interface Props {
  invoice: Invoice
  /** Compact variant used inside the checkout success state. */
  compact?: boolean
  className?: string
}

export function InvoiceView({ invoice, compact, className }: Props) {
  const isPaid = invoice.paymentStatus === "paid"

  return (
    <section
      aria-label={`Invoice ${invoice.invoiceNumber}`}
      className={cn(
        "relative flex flex-col overflow-hidden rounded-lg border border-border bg-card shadow-sm",
        className,
      )}
    >
      {/* Header */}
      <header className="flex flex-wrap items-start justify-between gap-4 border-b border-border bg-gradient-to-br from-primary/[0.04] via-transparent to-transparent p-5">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-md bg-primary/10 text-primary">
            <Music2 className="h-5 w-5" aria-hidden="true" />
          </div>
          <div>
            <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
              KTV Operations · Receipt
            </p>
            <p className="font-mono text-lg font-semibold tracking-tight text-foreground">
              {invoice.invoiceNumber}
            </p>
            <p className="text-xs text-muted-foreground">
              {formatDateTime(invoice.createdAt)}
            </p>
          </div>
        </div>

        <div className="flex flex-col items-end gap-1">
          <span
            className={cn(
              "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold uppercase tracking-wide",
              isPaid
                ? "bg-[color:var(--status-available-bg)] text-[color:var(--status-available-fg)]"
                : "bg-[color:var(--status-reserved-bg)] text-[color:var(--status-reserved-fg)]",
            )}
          >
            {isPaid ? (
              <CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" />
            ) : (
              <CircleAlert className="h-3.5 w-3.5" aria-hidden="true" />
            )}
            {isPaid ? "Paid" : "Unpaid"}
          </span>
          {isPaid && invoice.paymentMethod ? (
            <span className="text-xs text-muted-foreground">
              {PAYMENT_METHOD_LABEL[invoice.paymentMethod]} ·{" "}
              {invoice.paidAt ? formatDateTime(invoice.paidAt) : "—"}
            </span>
          ) : null}
        </div>
      </header>

      {/* Lines */}
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="pl-5">Item</TableHead>
              <TableHead className="text-right">Qty</TableHead>
              <TableHead className="text-right">Unit price</TableHead>
              <TableHead className="pr-5 text-right">Line total</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {invoice.lines.map((line) => (
              <TableRow key={line._id}>
                <TableCell className="pl-5">
                  <div className="flex flex-col">
                    <span className="font-medium text-foreground">
                      {line.description}
                    </span>
                    <span className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                      {line.lineType === "room"
                        ? "Room charge"
                        : "Product"}
                      {line.code ? ` · ${line.code}` : ""}
                    </span>
                  </div>
                </TableCell>
                <TableCell className="text-right tabular-nums">
                  {line.quantity}
                </TableCell>
                <TableCell className="text-right tabular-nums">
                  {formatCurrency(line.unitPrice)}
                </TableCell>
                <TableCell className="pr-5 text-right tabular-nums font-medium">
                  {formatCurrency(line.lineTotal)}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Totals */}
      <div className="grid gap-4 border-t border-border p-5 md:grid-cols-[1fr_auto]">
        {!compact ? (
          <div className="flex flex-col gap-1 text-xs text-muted-foreground">
            {invoice.notes ? (
              <>
                <span className="text-[11px] font-medium uppercase tracking-wider text-foreground">
                  Notes
                </span>
                <p className="text-sm text-foreground">{invoice.notes}</p>
              </>
            ) : null}
          </div>
        ) : (
          <div />
        )}

        <dl className="ml-auto flex w-full flex-col gap-2 text-sm md:w-72">
          <TotalRow label="Room charge" value={invoice.roomCharge} />
          <TotalRow label="Product charge" value={invoice.productCharge} />
          <TotalRow label="Subtotal" value={invoice.subtotal} />
          {invoice.discountAmount > 0 ? (
            <TotalRow
              label="Discount"
              value={-invoice.discountAmount}
              tone="positive"
            />
          ) : null}
          {invoice.taxAmount > 0 ? (
            <TotalRow label="Tax" value={invoice.taxAmount} />
          ) : null}
          <Separator />
          <div className="flex items-baseline justify-between">
            <dt className="text-sm font-medium text-foreground">
              Grand total
            </dt>
            <dd className="text-2xl font-semibold tabular-nums text-foreground">
              {formatCurrency(invoice.grandTotal)}
            </dd>
          </div>
          <p className="text-[11px] text-muted-foreground">
            Session {invoice.sessionId.slice(-6)} · Thank you for visiting
          </p>
        </dl>
      </div>
    </section>
  )
}

function TotalRow({
  label,
  value,
  tone,
}: {
  label: string
  value: number
  tone?: "positive"
}) {
  return (
    <div className="flex items-baseline justify-between gap-3">
      <dt className="text-muted-foreground">{label}</dt>
      <dd
        className={cn(
          "tabular-nums",
          tone === "positive" ? "text-primary" : "text-foreground",
        )}
      >
        {formatCurrency(value)}
      </dd>
    </div>
  )
}
