import { http, unwrap } from "./httpClient"
import type {
  DailyReportQuery,
  MonthlyReportQuery,
  RangeReportQuery,
  RevenueReport,
} from "@/src/models/report"
import { isNetworkError } from "./demoFallback"
import {
  demoDailyReport,
  demoMonthlyReport,
  demoRangeReport,
} from "./demoReportFallback"

export const reportService = {
  async daily(query: DailyReportQuery): Promise<RevenueReport> {
    try {
      const data = await unwrap<{ report: RevenueReport }>(
        http.get("/reports/revenue/daily", { params: query }),
      )
      return data.report
    } catch (err) {
      if (isNetworkError(err)) return demoDailyReport(query)
      throw err
    }
  },

  async monthly(query: MonthlyReportQuery): Promise<RevenueReport> {
    try {
      const data = await unwrap<{ report: RevenueReport }>(
        http.get("/reports/revenue/monthly", { params: query }),
      )
      return data.report
    } catch (err) {
      if (isNetworkError(err)) return demoMonthlyReport(query)
      throw err
    }
  },

  async range(query: RangeReportQuery): Promise<RevenueReport> {
    try {
      const data = await unwrap<{ report: RevenueReport }>(
        http.get("/reports/revenue/range", { params: query }),
      )
      return data.report
    } catch (err) {
      if (isNetworkError(err)) return demoRangeReport(query)
      throw err
    }
  },
}
