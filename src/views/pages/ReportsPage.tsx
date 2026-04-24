import { useEffect, useRef } from "react"
import { BarChart3, RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { Topbar } from "@/src/layouts/Topbar"
import { useReportViewModel } from "@/src/viewmodels/useReportViewModel"
import type { ReportPeriod } from "@/src/models/report"
import { ErrorBanner } from "@/src/views/components/ErrorBanner"
import { EmptyState } from "@/src/views/components/EmptyState"
import { RevenueSummaryCards } from "@/src/views/components/reports/RevenueSummaryCards"
import { PaymentMethodBreakdownCard } from "@/src/views/components/reports/PaymentMethodBreakdownCard"
import { DailyBreakdownChart } from "@/src/views/components/reports/DailyBreakdownChart"
import {
  DailyReportFilters,
  MonthlyReportFilters,
  RangeReportFilters,
} from "@/src/views/components/reports/ReportFilters"

export default function ReportsPage() {
  const vm = useReportViewModel("daily")
  const {
    activeTab,
    setActiveTab,
    filters,
    setDailyDate,
    setMonthly,
    setRangeStart,
    setRangeEnd,
    report,
    isLoading,
    error,
    loadActive,
  } = vm

  // Auto-load initial daily report on mount.
  const didInitialLoad = useRef(false)
  useEffect(() => {
    if (didInitialLoad.current) return
    didInitialLoad.current = true
    void loadActive()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleTabChange = (value: string) => {
    const next = value as ReportPeriod
    if (next === activeTab) return
    setActiveTab(next)
    // Load the new tab's data using the already-stored filters
    setTimeout(() => {
      void loadActive()
    }, 0)
  }

  return (
    <>
      <Topbar
        title="Revenue reports"
        subtitle="Paid invoice revenue, sessions, and payment method breakdowns."
        actions={
          <Button
            variant="outline"
            size="sm"
            onClick={() => void loadActive()}
            className="gap-2"
            disabled={isLoading}
          >
            <RefreshCw
              className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`}
              aria-hidden="true"
            />
            Refresh
          </Button>
        }
      />

      <main className="flex-1 overflow-y-auto p-6">
        <div className="mx-auto flex max-w-7xl flex-col gap-6">
          <Tabs value={activeTab} onValueChange={handleTabChange}>
            <TabsList className="bg-muted/50">
              <TabsTrigger value="daily">Daily</TabsTrigger>
              <TabsTrigger value="monthly">Monthly</TabsTrigger>
              <TabsTrigger value="range">Custom range</TabsTrigger>
            </TabsList>

            <TabsContent value="daily" className="mt-4 space-y-5">
              <DailyReportFilters
                date={filters.daily.date}
                onChange={setDailyDate}
                onApply={() => void loadActive()}
                isLoading={isLoading}
              />
              {renderReportBody()}
            </TabsContent>

            <TabsContent value="monthly" className="mt-4 space-y-5">
              <MonthlyReportFilters
                year={filters.monthly.year}
                month={filters.monthly.month}
                onChange={setMonthly}
                onApply={() => void loadActive()}
                isLoading={isLoading}
              />
              {renderReportBody()}
            </TabsContent>

            <TabsContent value="range" className="mt-4 space-y-5">
              <RangeReportFilters
                startDate={filters.range.startDate}
                endDate={filters.range.endDate}
                onStartChange={setRangeStart}
                onEndChange={setRangeEnd}
                onApply={() => void loadActive()}
                isLoading={isLoading}
              />
              {renderReportBody()}
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </>
  )

  function renderReportBody() {
    if (error) {
      return (
        <ErrorBanner
          title="Could not load report"
          message={error}
          onRetry={() => void loadActive()}
        />
      )
    }

    if (!report && !isLoading) {
      return (
        <EmptyState
          icon={BarChart3}
          title="No report yet"
          description="Pick a date or range above, then click View report to see the numbers."
        />
      )
    }

    return (
      <div className="space-y-5">
        <RevenueSummaryCards report={report} isLoading={isLoading} />

        <div className="grid grid-cols-1 gap-5 lg:grid-cols-5">
          <div className="lg:col-span-2">
            <PaymentMethodBreakdownCard
              breakdown={report?.paymentMethodBreakdown ?? []}
              totalRevenue={report?.totalRevenue ?? 0}
              isLoading={isLoading}
            />
          </div>
          <div className="lg:col-span-3">
            {activeTab === "monthly" ? (
              <DailyBreakdownChart
                points={report?.dailyBreakdown ?? []}
                isLoading={isLoading}
              />
            ) : (
              <PeriodInsightCard
                report={report}
                isLoading={isLoading}
              />
            )}
          </div>
        </div>
      </div>
    )
  }
}

function PeriodInsightCard({
  report,
  isLoading,
}: {
  report: ReturnType<typeof useReportViewModel>["report"]
  isLoading: boolean
}) {
  const avg =
    report && report.paidInvoiceCount > 0
      ? report.totalRevenue / report.paidInvoiceCount
      : 0
  return (
    <div className="flex h-full flex-col gap-5 rounded-xl border border-border bg-card p-6">
      <div>
        <h3 className="text-base font-semibold leading-none">
          Period insight
        </h3>
        <p className="mt-1 text-sm text-muted-foreground">
          Quick derived metrics for the selected period.
        </p>
      </div>

      <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Stat
          label="Average invoice"
          value={
            isLoading
              ? "…"
              : new Intl.NumberFormat(undefined, {
                  style: "currency",
                  currency: "USD",
                }).format(avg)
          }
        />
        <Stat
          label="Invoices per session"
          value={
            isLoading || !report
              ? "…"
              : report.totalSessions === 0
                ? "0"
                : (report.paidInvoiceCount / report.totalSessions).toFixed(2)
          }
        />
        <Stat
          label="Period span"
          value={
            report
              ? `${Math.max(
                  1,
                  Math.round(
                    (new Date(report.range.endDateExclusive).getTime() -
                      new Date(report.range.startDate).getTime()) /
                      86_400_000,
                  ),
                )} day(s)`
              : "—"
          }
        />
        <Stat
          label="Top method"
          value={
            report
              ? topPaymentMethod(report.paymentMethodBreakdown)
              : "—"
          }
        />
      </dl>

      <p className="mt-auto text-[11px] leading-relaxed text-muted-foreground">
        Derived from backend aggregates. Revenue figures always reflect paid
        invoices filtered by <code>paidAt</code>.
      </p>
    </div>
  )
}

function topPaymentMethod(
  breakdown: { paymentMethod: string; totalRevenue: number }[],
): string {
  const top = [...breakdown].sort(
    (a, b) => b.totalRevenue - a.totalRevenue,
  )[0]
  if (!top || top.totalRevenue === 0) return "—"
  const label =
    top.paymentMethod === "qr"
      ? "QR Payment"
      : top.paymentMethod.charAt(0).toUpperCase() + top.paymentMethod.slice(1)
  return label
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-border/60 bg-muted/30 p-3">
      <dt className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
        {label}
      </dt>
      <dd className="mt-1 truncate text-base font-semibold tabular-nums">
        {value}
      </dd>
    </div>
  )
}
