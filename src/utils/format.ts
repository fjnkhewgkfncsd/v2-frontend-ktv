export function formatCurrency(value: number, currency = "Riel"): string {
  try {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency,
      maximumFractionDigits: 0,
    }).format(value)
  } catch {
    return `${currency} ${value.toFixed(0)}`
  }
}

export function formatDateTime(iso: string | null | undefined): string {
  if (!iso) return "—"
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return "—"
  return d.toLocaleString(undefined, {
    year: "numeric",
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  })
}

export function formatTime(iso: string | null | undefined): string {
  if (!iso) return "—"
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return "—"
  return d.toLocaleTimeString(undefined, {
    hour: "2-digit",
    minute: "2-digit",
  })
}

export function toDateTimeLocalValue(iso: string | null | undefined): string {
  if (!iso) return ""
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ""
  const tzOffset = d.getTimezoneOffset() * 60_000
  return new Date(d.getTime() - tzOffset).toISOString().slice(0, 16)
}

export function fromDateTimeLocalValue(local: string): string {
  if (!local) return ""
  return new Date(local).toISOString()
}

export function defaultFutureDateTimeLocal(
  minutesAhead = 60,
  roundTo = 15,
): string {
  const d = new Date(Date.now() + minutesAhead * 60_000)
  const mins = d.getMinutes()
  const rounded = Math.ceil(mins / roundTo) * roundTo
  d.setMinutes(rounded, 0, 0)
  return toDateTimeLocalValue(d.toISOString())
}

export function formatDuration(minutes: number): string {
  if (!Number.isFinite(minutes) || minutes <= 0) return "0m"
  const h = Math.floor(minutes / 60)
  const m = Math.round(minutes % 60)
  if (h === 0) return `${m}m`
  if (m === 0) return `${h}h`
  return `${h}h ${m}m`
}

export function formatElapsedSince(iso: string | null | undefined): string {
  if (!iso) return "—"
  const start = new Date(iso).getTime()
  if (Number.isNaN(start)) return "—"
  const diffMs = Math.max(0, Date.now() - start)
  return formatDuration(diffMs / 60_000)
}
