/**
 * Demo fallback for revenue reports.
 * Aggregates whatever paid invoices exist in-memory and merges in a seeded
 * historical dataset so the Reports page renders useful numbers even before
 * any checkout has happened in the current session.
 *
 * Activates only when the real backend is unreachable.
 */
import type { PaymentMethod } from "@/src/models/invoice"
import type {
  DailyBreakdownPoint,
  DailyReportQuery,
  MonthlyReportQuery,
  PaymentMethodBreakdown,
  RangeReportQuery,
  ReportPaymentMethod,
  RevenueReport,
} from "@/src/models/report"
import { PAYMENT_METHOD_REPORT_ORDER } from "@/src/models/report"
import { _demoReadInvoices } from "./demoCheckoutFallback"

// ----- Seeded historical data (paid invoices, for report-only demo) -----

interface SeededPaidInvoice {
  paidAt: string
  paymentMethod: PaymentMethod
  grandTotal: number
}

function buildSeed(): SeededPaidInvoice[] {
  const seed: SeededPaidInvoice[] = []
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const methods: PaymentMethod[] = ["cash", "card", "qr"]

  // Last 45 days, skipping ~20% days to feel realistic.
  for (let i = 0; i < 45; i++) {
    const base = new Date(today)
    base.setDate(base.getDate() - i)
    // Deterministic pseudo-randomness so the chart is stable across reloads.
    const seedHash = hash(base.toISOString().slice(0, 10))
    if (seedHash % 10 < 2) continue // quiet day

    const invoicesToday = 2 + (seedHash % 5) // 2-6 paid invoices
    for (let j = 0; j < invoicesToday; j++) {
      const paidAt = new Date(base)
      const hour = 14 + ((seedHash + j * 7) % 9) // 14:00 - 23:00
      const minute = (seedHash + j * 13) % 60
      paidAt.setHours(hour, minute, 0, 0)

      const method = methods[(seedHash + j) % methods.length]
      const base200 = 180 + ((seedHash + j * 37) % 360) // 180-539
      const total = Math.round(base200 * 100) / 100

      seed.push({
        paidAt: paidAt.toISOString(),
        paymentMethod: method,
        grandTotal: total,
      })
    }
  }
  return seed
}

function hash(s: string): number {
  let h = 0
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0
  return Math.abs(h)
}

let SEED_CACHE: SeededPaidInvoice[] | null = null
function getSeed(): SeededPaidInvoice[] {
  if (!SEED_CACHE) SEED_CACHE = buildSeed()
  return SEED_CACHE
}

// ----- Aggregation helpers -----

interface RawPaidRecord {
  paidAt: string
  paymentMethod: PaymentMethod
  grandTotal: number
}

function collectPaidRecords(): RawPaidRecord[] {
  const records: RawPaidRecord[] = []

  for (const inv of _demoReadInvoices()) {
    if (inv.paymentStatus !== "paid") continue
    if (!inv.paidAt || !inv.paymentMethod) continue
    records.push({
      paidAt: inv.paidAt,
      paymentMethod: inv.paymentMethod,
      grandTotal: inv.grandTotal,
    })
  }
  for (const inv of getSeed()) records.push(inv)

  return records
}

function inRange(
  iso: string,
  startInclusive: Date,
  endExclusive: Date,
): boolean {
  const t = new Date(iso).getTime()
  return t >= startInclusive.getTime() && t < endExclusive.getTime()
}

function isoDate(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, "0")
  const day = String(d.getDate()).padStart(2, "0")
  return `${y}-${m}-${day}`
}

function buildPaymentBreakdown(
  records: RawPaidRecord[],
): PaymentMethodBreakdown[] {
  const byMethod: Record<
    ReportPaymentMethod,
    PaymentMethodBreakdown
  > = {
    cash: emptyBreakdown("cash"),
    card: emptyBreakdown("card"),
    qr: emptyBreakdown("qr"),
    unknown: emptyBreakdown("unknown"),
  }
  for (const r of records) {
    const bucket = byMethod[r.paymentMethod] ?? byMethod.unknown
    bucket.totalRevenue += r.grandTotal
    bucket.paidInvoiceCount += 1
    bucket.totalSessions += 1
  }
  return PAYMENT_METHOD_REPORT_ORDER.map((m) => byMethod[m])
}

function emptyBreakdown(method: ReportPaymentMethod): PaymentMethodBreakdown {
  return {
    paymentMethod: method,
    totalRevenue: 0,
    paidInvoiceCount: 0,
    totalSessions: 0,
  }
}

function buildDailyBreakdown(
  records: RawPaidRecord[],
  start: Date,
  endExclusive: Date,
): DailyBreakdownPoint[] {
  const byDate = new Map<string, DailyBreakdownPoint>()
  // Initialize each day in the range so the chart is continuous
  for (
    let cur = new Date(start);
    cur < endExclusive;
    cur.setDate(cur.getDate() + 1)
  ) {
    const key = isoDate(cur)
    byDate.set(key, {
      date: key,
      totalRevenue: 0,
      paidInvoiceCount: 0,
      totalSessions: 0,
    })
  }
  for (const r of records) {
    const key = isoDate(new Date(r.paidAt))
    const point = byDate.get(key)
    if (!point) continue
    point.totalRevenue += r.grandTotal
    point.paidInvoiceCount += 1
    point.totalSessions += 1
  }
  return Array.from(byDate.values())
    .filter((p) => p.paidInvoiceCount > 0)
    .sort((a, b) => (a.date < b.date ? -1 : 1))
}

function roundMoney(n: number): number {
  return Math.round(n * 100) / 100
}

function sumRevenue(records: RawPaidRecord[]): number {
  return roundMoney(records.reduce((s, r) => s + r.grandTotal, 0))
}

// ----- Public demo report APIs -----

export function demoDailyReport(q: DailyReportQuery): RevenueReport {
  const [y, m, d] = q.date.split("-").map(Number)
  const start = new Date(y, (m || 1) - 1, d || 1, 0, 0, 0, 0)
  const end = new Date(start)
  end.setDate(end.getDate() + 1)

  const all = collectPaidRecords()
  const matching = all.filter((r) => inRange(r.paidAt, start, end))

  const breakdown = buildPaymentBreakdown(matching)
  const totals = breakdown.reduce(
    (acc, b) => {
      acc.revenue += b.totalRevenue
      acc.invoices += b.paidInvoiceCount
      acc.sessions += b.totalSessions
      return acc
    },
    { revenue: 0, invoices: 0, sessions: 0 },
  )

  return {
    period: "daily",
    range: {
      startDate: isoDate(start),
      endDateExclusive: isoDate(end),
    },
    totalRevenue: roundMoney(totals.revenue),
    paidInvoiceCount: totals.invoices,
    totalSessions: totals.sessions,
    paymentMethodBreakdown: breakdown.map((b) => ({
      ...b,
      totalRevenue: roundMoney(b.totalRevenue),
    })),
  }
}

export function demoMonthlyReport(q: MonthlyReportQuery): RevenueReport {
  const start = new Date(q.year, q.month - 1, 1)
  const end = new Date(q.year, q.month, 1)
  const all = collectPaidRecords()
  const matching = all.filter((r) => inRange(r.paidAt, start, end))

  const breakdown = buildPaymentBreakdown(matching)
  const daily = buildDailyBreakdown(matching, start, end)

  return {
    period: "monthly",
    range: {
      startDate: isoDate(start),
      endDateExclusive: isoDate(end),
    },
    totalRevenue: sumRevenue(matching),
    paidInvoiceCount: matching.length,
    totalSessions: matching.length,
    paymentMethodBreakdown: breakdown.map((b) => ({
      ...b,
      totalRevenue: roundMoney(b.totalRevenue),
    })),
    dailyBreakdown: daily.map((d) => ({
      ...d,
      totalRevenue: roundMoney(d.totalRevenue),
    })),
  }
}

export function demoRangeReport(q: RangeReportQuery): RevenueReport {
  const [sy, sm, sd] = q.startDate.split("-").map(Number)
  const [ey, em, ed] = q.endDate.split("-").map(Number)
  const start = new Date(sy, (sm || 1) - 1, sd || 1)
  // endDate is inclusive; backend exposes endDateExclusive
  const endExclusive = new Date(ey, (em || 1) - 1, ed || 1)
  endExclusive.setDate(endExclusive.getDate() + 1)

  const all = collectPaidRecords()
  const matching = all.filter((r) => inRange(r.paidAt, start, endExclusive))
  const breakdown = buildPaymentBreakdown(matching)

  return {
    period: "range",
    range: {
      startDate: isoDate(start),
      endDateExclusive: isoDate(endExclusive),
    },
    totalRevenue: sumRevenue(matching),
    paidInvoiceCount: matching.length,
    totalSessions: matching.length,
    paymentMethodBreakdown: breakdown.map((b) => ({
      ...b,
      totalRevenue: roundMoney(b.totalRevenue),
    })),
  }
}
