import { BadgeCent, CalendarRange, FileText, Users } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { cn } from "@/lib/utils"
import type { RevenueReport } from "@/src/models/report"
import { formatCurrency } from "@/src/utils/format"

interface Props {
  report: RevenueReport | null
  isLoading: boolean
}

export function RevenueSummaryCards({ report, isLoading }: Props) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <SummaryCard
        label="Total revenue"
        value={report ? formatCurrency(report.totalRevenue) : "—"}
        icon={BadgeCent}
        tone="primary"
        isLoading={isLoading && !report}
      />
      <SummaryCard
        label="Paid invoices"
        value={report ? report.paidInvoiceCount.toLocaleString() : "—"}
        icon={FileText}
        isLoading={isLoading && !report}
      />
      <SummaryCard
        label="Total sessions"
        value={report ? report.totalSessions.toLocaleString() : "—"}
        icon={Users}
        isLoading={isLoading && !report}
      />
      <SummaryCard
        label="Period"
        value={
          report
            ? formatRangeLabel(
                report.range.startDate,
                report.range.endDateExclusive,
              )
            : "—"
        }
        icon={CalendarRange}
        muted
        isLoading={isLoading && !report}
      />
    </div>
  )
}

function SummaryCard({
  label,
  value,
  icon: Icon,
  tone,
  muted,
  isLoading,
}: {
  label: string
  value: string
  icon: React.ComponentType<{ className?: string }>
  tone?: "primary"
  muted?: boolean
  isLoading?: boolean
}) {
  return (
    <Card className="overflow-hidden">
      <CardContent className="flex items-start justify-between gap-4 p-5">
        <div className="min-w-0 flex-1">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            {label}
          </p>
          {isLoading ? (
            <Skeleton className="mt-2 h-7 w-24" />
          ) : (
            <p
              className={cn(
                "mt-1 truncate text-2xl font-semibold tabular-nums tracking-tight",
                tone === "primary" && "text-primary",
                muted && "text-[15px] font-medium text-foreground",
              )}
              title={value}
            >
              {value}
            </p>
          )}
        </div>
        <div
          className={cn(
            "flex h-10 w-10 items-center justify-center rounded-lg",
            tone === "primary"
              ? "bg-primary/10 text-primary"
              : "bg-muted text-muted-foreground",
          )}
        >
          <Icon className="h-5 w-5" aria-hidden="true" />
        </div>
      </CardContent>
    </Card>
  )
}

function formatRangeLabel(startIso: string, endExclusiveIso: string): string {
  const fmt = (iso: string) => {
    const [y, m, d] = iso.split("-").map(Number)
    const date = new Date(y, (m || 1) - 1, d || 1)
    return date.toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
      year: "numeric",
    })
  }
  const start = fmt(startIso)
  const endExclusive = new Date(endExclusiveIso)
  endExclusive.setDate(endExclusive.getDate() - 1)
  const y = endExclusive.getFullYear()
  const m = String(endExclusive.getMonth() + 1).padStart(2, "0")
  const d = String(endExclusive.getDate()).padStart(2, "0")
  const endLabel = fmt(`${y}-${m}-${d}`)
  if (start === endLabel) return start
  return `${start} → ${endLabel}`
}
