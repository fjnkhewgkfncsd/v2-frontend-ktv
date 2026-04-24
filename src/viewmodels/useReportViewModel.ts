import { useCallback, useMemo, useState } from "react"
import { reportService } from "@/src/services/reportService"
import { ApiRequestError } from "@/src/models/api"
import type {
  DailyReportQuery,
  MonthlyReportQuery,
  RangeReportQuery,
  ReportPeriod,
  RevenueReport,
} from "@/src/models/report"

export interface ReportFilters {
  daily: DailyReportQuery
  monthly: MonthlyReportQuery
  range: RangeReportQuery
}

export interface ReportViewModel {
  activeTab: ReportPeriod
  setActiveTab(tab: ReportPeriod): void

  filters: ReportFilters
  setDailyDate(date: string): void
  setMonthly(year: number, month: number): void
  setRangeStart(date: string): void
  setRangeEnd(date: string): void

  report: RevenueReport | null
  isLoading: boolean
  error: string | null

  loadActive(): Promise<void>
  refresh(): Promise<void>
}

function toIsoDate(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, "0")
  const day = String(d.getDate()).padStart(2, "0")
  return `${y}-${m}-${day}`
}

function defaultFilters(): ReportFilters {
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const monthStart = new Date(today.getFullYear(), today.getMonth(), 1)
  const rangeStart = new Date(today)
  rangeStart.setDate(rangeStart.getDate() - 6) // last 7 days

  return {
    daily: { date: toIsoDate(today) },
    monthly: { year: today.getFullYear(), month: today.getMonth() + 1 },
    range: {
      startDate: toIsoDate(rangeStart),
      endDate: toIsoDate(today),
    },
  }
}

export function useReportViewModel(
  initialTab: ReportPeriod = "daily",
): ReportViewModel {
  const [activeTab, setActiveTab] = useState<ReportPeriod>(initialTab)
  const [filters, setFilters] = useState<ReportFilters>(defaultFilters())
  const [report, setReport] = useState<RevenueReport | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const setDailyDate = useCallback((date: string) => {
    setFilters((prev) => ({ ...prev, daily: { date } }))
  }, [])

  const setMonthly = useCallback((year: number, month: number) => {
    setFilters((prev) => ({ ...prev, monthly: { year, month } }))
  }, [])

  const setRangeStart = useCallback((date: string) => {
    setFilters((prev) => ({
      ...prev,
      range: { ...prev.range, startDate: date },
    }))
  }, [])

  const setRangeEnd = useCallback((date: string) => {
    setFilters((prev) => ({
      ...prev,
      range: { ...prev.range, endDate: date },
    }))
  }, [])

  const load = useCallback(
    async (tab: ReportPeriod, f: ReportFilters) => {
      setIsLoading(true)
      setError(null)
      try {
        let result: RevenueReport
        if (tab === "daily") {
          result = await reportService.daily(f.daily)
        } else if (tab === "monthly") {
          result = await reportService.monthly(f.monthly)
        } else {
          // Validate range client-side before hitting the API
          if (new Date(f.range.endDate) < new Date(f.range.startDate)) {
            throw new ApiRequestError(
              "End date must be on or after the start date.",
              "INVALID_REPORT_RANGE",
              422,
            )
          }
          result = await reportService.range(f.range)
        }
        setReport(result)
      } catch (err) {
        const msg =
          err instanceof ApiRequestError
            ? err.message
            : "Failed to load revenue report."
        setError(msg)
        console.log("[v0] report load failed:", msg)
      } finally {
        setIsLoading(false)
      }
    },
    [],
  )

  const loadActive = useCallback(
    () => load(activeTab, filters),
    [load, activeTab, filters],
  )

  const refresh = useCallback(() => loadActive(), [loadActive])

  // Memoize a switchTab that loads on change so the view can stay thin
  const switchTab = useCallback(
    (tab: ReportPeriod) => {
      setActiveTab(tab)
    },
    [],
  )

  return useMemo(
    () => ({
      activeTab,
      setActiveTab: switchTab,
      filters,
      setDailyDate,
      setMonthly,
      setRangeStart,
      setRangeEnd,
      report,
      isLoading,
      error,
      loadActive,
      refresh,
    }),
    [
      activeTab,
      switchTab,
      filters,
      setDailyDate,
      setMonthly,
      setRangeStart,
      setRangeEnd,
      report,
      isLoading,
      error,
      loadActive,
      refresh,
    ],
  )
}
