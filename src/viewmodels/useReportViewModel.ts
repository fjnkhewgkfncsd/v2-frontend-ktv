import { useCallback, useMemo, useRef, useState } from "react"
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
  /** The tab that `report` actually belongs to. Null while no report is loaded. */
  loadedTab: ReportPeriod | null
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
  const [activeTab, setActiveTabState] = useState<ReportPeriod>(initialTab)
  const [filters, setFilters] = useState<ReportFilters>(defaultFilters())
  const [report, setReport] = useState<RevenueReport | null>(null)
  const [loadedTab, setLoadedTab] = useState<ReportPeriod | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Monotonic counter used to guard against stale responses when the user
  // switches tabs or re-applies filters faster than the network can reply.
  // Only the last request's result is ever committed to state.
  const reqIdRef = useRef(0)

  // Keep the most recent filters accessible inside `load` without making
  // `load` reactive to `filters` — so a single identity of `load` works
  // across tab switches and filter edits.
  const filtersRef = useRef(filters)
  filtersRef.current = filters

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
    async (
      tab: ReportPeriod,
      f: ReportFilters,
      opts: { clearReport: boolean },
    ) => {
      const myReq = ++reqIdRef.current
      setIsLoading(true)
      setError(null)
      // Hide the previous report immediately on tab switch so the new tab
      // never renders with the prior tab's data, even for a single frame.
      if (opts.clearReport) {
        setReport(null)
        setLoadedTab(null)
      }
      try {
        let result: RevenueReport
        if (tab === "daily") {
          if (!f.daily.date) {
            throw new ApiRequestError(
              "Select a date.",
              "INVALID_REPORT_DATE",
              422,
            )
          }
          result = await reportService.daily(f.daily)
        } else if (tab === "monthly") {
          result = await reportService.monthly(f.monthly)
        } else {
          // Validate range client-side before hitting the API.
          if (!f.range.startDate || !f.range.endDate) {
            throw new ApiRequestError(
              "Select both a start and end date.",
              "INVALID_REPORT_RANGE",
              422,
            )
          }
          if (new Date(f.range.endDate) < new Date(f.range.startDate)) {
            throw new ApiRequestError(
              "End date must be on or after the start date.",
              "INVALID_REPORT_RANGE",
              422,
            )
          }
          result = await reportService.range(f.range)
        }
        // Race guard: a newer request superseded this one — drop the result.
        if (myReq !== reqIdRef.current) return
        setReport(result)
        setLoadedTab(tab)
      } catch (err) {
        if (myReq !== reqIdRef.current) return
        const msg =
          err instanceof ApiRequestError
            ? err.message
            : "Failed to load revenue report."
        setError(msg)
      } finally {
        // Only the latest request owns the loading flag — older ones are
        // already ignored above, so they must not flip it back to false.
        if (myReq === reqIdRef.current) setIsLoading(false)
      }
    },
    [],
  )

  const loadActive = useCallback(
    () => load(activeTab, filtersRef.current, { clearReport: false }),
    [load, activeTab],
  )

  const refresh = useCallback(() => loadActive(), [loadActive])

  // Switching tabs: clear previous report, bump the request id, and fetch
  // the new tab's data. The view can stay thin and just call setActiveTab.
  const switchTab = useCallback(
    (tab: ReportPeriod) => {
      setActiveTabState((prev) => {
        if (prev === tab) return prev
        // Fire the fetch in a microtask so React commits the tab change
        // first; the race guard handles any in-flight request from the
        // previous tab.
        queueMicrotask(() => {
          void load(tab, filtersRef.current, { clearReport: true })
        })
        return tab
      })
    },
    [load],
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
      loadedTab,
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
      loadedTab,
      isLoading,
      error,
      loadActive,
      refresh,
    ],
  )
}
