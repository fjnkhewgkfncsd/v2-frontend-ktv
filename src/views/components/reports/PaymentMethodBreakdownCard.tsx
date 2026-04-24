import { Banknote, CreditCard, HelpCircle, QrCode } from "lucide-react"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Skeleton } from "@/components/ui/skeleton"
import { cn } from "@/lib/utils"
import type {
  PaymentMethodBreakdown,
  ReportPaymentMethod,
} from "@/src/models/report"
import { PAYMENT_METHOD_REPORT_LABEL } from "@/src/models/report"
import { formatCurrency } from "@/src/utils/format"

interface Props {
  breakdown: PaymentMethodBreakdown[]
  totalRevenue: number
  isLoading: boolean
}

const ICONS: Record<
  ReportPaymentMethod,
  React.ComponentType<{ className?: string }>
> = {
  cash: Banknote,
  card: CreditCard,
  qr: QrCode,
  unknown: HelpCircle,
}

export function PaymentMethodBreakdownCard({
  breakdown,
  totalRevenue,
  isLoading,
}: Props) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle>Payment method breakdown</CardTitle>
        <CardDescription>
          Revenue split by how guests settled their invoices.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        {isLoading && breakdown.length === 0
          ? Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-10 w-full" />
            ))
          : breakdown.map((b) => {
              const Icon = ICONS[b.paymentMethod] ?? HelpCircle
              const pct =
                totalRevenue > 0 ? (b.totalRevenue / totalRevenue) * 100 : 0
              const isUnknown = b.paymentMethod === "unknown"
              return (
                <div key={b.paymentMethod} className="space-y-1.5">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2.5">
                      <span
                        className={cn(
                          "flex h-8 w-8 items-center justify-center rounded-md",
                          isUnknown
                            ? "bg-muted text-muted-foreground"
                            : "bg-primary/10 text-primary",
                        )}
                      >
                        <Icon className="h-4 w-4" aria-hidden="true" />
                      </span>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-foreground">
                          {PAYMENT_METHOD_REPORT_LABEL[b.paymentMethod]}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {b.paidInvoiceCount}{" "}
                          {b.paidInvoiceCount === 1 ? "invoice" : "invoices"}
                          {" · "}
                          {b.totalSessions}{" "}
                          {b.totalSessions === 1 ? "session" : "sessions"}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold tabular-nums">
                        {formatCurrency(b.totalRevenue)}
                      </p>
                      <p className="text-[11px] text-muted-foreground tabular-nums">
                        {pct.toFixed(1)}%
                      </p>
                    </div>
                  </div>
                  <Progress
                    value={pct}
                    aria-label={`${PAYMENT_METHOD_REPORT_LABEL[b.paymentMethod]} share of revenue`}
                    className="h-1.5"
                  />
                </div>
              )
            })}

        {!isLoading && breakdown.every((b) => b.paidInvoiceCount === 0) ? (
          <p className="text-sm text-muted-foreground">
            No paid invoices in this period yet.
          </p>
        ) : null}
      </CardContent>
    </Card>
  )
}
