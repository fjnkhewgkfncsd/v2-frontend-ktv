import type { PaymentMethod } from "./invoice"

export type ReportPeriod = "daily" | "monthly" | "range"

/** Payment methods present in every backend report payload, in display order. */
export type ReportPaymentMethod = PaymentMethod | "unknown"

export interface ReportRange {
  /** Inclusive start date (YYYY-MM-DD). */
  startDate: string
  /** Exclusive end date (YYYY-MM-DD). */
  endDateExclusive: string
}

export interface PaymentMethodBreakdown {
  paymentMethod: ReportPaymentMethod
  totalRevenue: number
  paidInvoiceCount: number
  totalSessions: number
}

export interface DailyBreakdownPoint {
  date: string
  totalRevenue: number
  paidInvoiceCount: number
  totalSessions: number
}

export interface RevenueReport {
  period: ReportPeriod
  range: ReportRange
  totalRevenue: number
  paidInvoiceCount: number
  totalSessions: number
  paymentMethodBreakdown: PaymentMethodBreakdown[]
  /** Present only for period === "monthly". */
  dailyBreakdown?: DailyBreakdownPoint[]
}

export interface DailyReportQuery {
  /** YYYY-MM-DD */
  date: string
}

export interface MonthlyReportQuery {
  year: number
  month: number
}

export interface RangeReportQuery {
  startDate: string
  endDate: string
}

export const PAYMENT_METHOD_REPORT_LABEL: Record<ReportPaymentMethod, string> = {
  cash: "Cash",
  card: "Card",
  qr: "QR Payment",
  unknown: "Unknown",
}

export const PAYMENT_METHOD_REPORT_ORDER: ReportPaymentMethod[] = [
  "cash",
  "card",
  "qr",
  "unknown",
]
