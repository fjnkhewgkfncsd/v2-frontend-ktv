import { useMemo } from "react"
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  TooltipProps,
  XAxis,
  YAxis,
} from "recharts"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import type { DailyBreakdownPoint } from "@/src/models/report"
import { formatCurrency } from "@/src/utils/format"

interface Props {
  points: DailyBreakdownPoint[]
  isLoading: boolean
}

interface ChartPoint {
  date: string
  label: string
  revenue: number
  invoices: number
  sessions: number
}

export function DailyBreakdownChart({ points, isLoading }: Props) {
  const data: ChartPoint[] = useMemo(
    () =>
      points.map((p) => ({
        date: p.date,
        label: formatDayLabel(p.date),
        revenue: p.totalRevenue,
        invoices: p.paidInvoiceCount,
        sessions: p.totalSessions,
      })),
    [points],
  )

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle>Daily revenue</CardTitle>
        <CardDescription>
          Paid invoice revenue by day for the selected month.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading && data.length === 0 ? (
          <Skeleton className="h-[260px] w-full rounded-md" />
        ) : data.length === 0 ? (
          <div className="flex h-[260px] items-center justify-center rounded-md border border-dashed border-border text-sm text-muted-foreground">
            No paid invoices for this month yet.
          </div>
        ) : (
          <div className="h-[260px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={data}
                margin={{ top: 8, right: 12, left: 0, bottom: 0 }}
              >
                <defs>
                  <linearGradient id="revFill" x1="0" y1="0" x2="0" y2="1">
                    <stop
                      offset="0%"
                      stopColor="var(--primary)"
                      stopOpacity={0.35}
                    />
                    <stop
                      offset="100%"
                      stopColor="var(--primary)"
                      stopOpacity={0.02}
                    />
                  </linearGradient>
                </defs>
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="var(--border)"
                  vertical={false}
                />
                <XAxis
                  dataKey="label"
                  tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
                  tickLine={false}
                  axisLine={{ stroke: "var(--border)" }}
                />
                <YAxis
                  tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
                  tickLine={false}
                  axisLine={{ stroke: "var(--border)" }}
                  tickFormatter={(v) => compactCurrency(v)}
                  width={64}
                />
                <Tooltip content={<CustomTooltip />} />
                <Area
                  type="monotone"
                  dataKey="revenue"
                  stroke="var(--primary)"
                  strokeWidth={2}
                  fill="url(#revFill)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

function CustomTooltip({
  active,
  payload,
}: TooltipProps<number, string>) {
  if (!active || !payload?.length) return null
  const p = payload[0]?.payload as ChartPoint
  if (!p) return null
  return (
    <div className="rounded-md border border-border bg-popover p-3 text-xs shadow-md">
      <p className="mb-1 font-medium text-foreground">
        {formatFullDate(p.date)}
      </p>
      <p className="tabular-nums text-primary">
        {formatCurrency(p.revenue)}
      </p>
      <p className="text-muted-foreground">
        {p.invoices} {p.invoices === 1 ? "invoice" : "invoices"} · {p.sessions}{" "}
        {p.sessions === 1 ? "session" : "sessions"}
      </p>
    </div>
  )
}

function formatDayLabel(iso: string): string {
  const [y, m, d] = iso.split("-").map(Number)
  const date = new Date(y, (m || 1) - 1, d || 1)
  return date.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  })
}

function formatFullDate(iso: string): string {
  const [y, m, d] = iso.split("-").map(Number)
  const date = new Date(y, (m || 1) - 1, d || 1)
  return date.toLocaleDateString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
  })
}

function compactCurrency(n: number): string {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000) return `$${(n / 1_000).toFixed(1)}k`
  return `$${Math.round(n)}`
}
