import { cn } from "@/lib/utils"
import {
  RESERVATION_STATUS_LABEL,
  type ReservationStatus,
} from "@/src/models/reservation"

// Map reservation statuses to existing semantic room status tokens so we
// reuse the consistent palette (reserved yellow, checked-in green, etc.)
const STATUS_STYLES: Record<ReservationStatus, string> = {
  pending:
    "bg-[color:var(--status-cleaning-bg)] text-[color:var(--status-cleaning-fg)] ring-[color:var(--status-cleaning)]/40",
  confirmed:
    "bg-[color:var(--status-reserved-bg)] text-[color:var(--status-reserved-fg)] ring-[color:var(--status-reserved)]/40",
  checked_in:
    "bg-[color:var(--status-available-bg)] text-[color:var(--status-available-fg)] ring-[color:var(--status-available)]/40",
  cancelled:
    "bg-[color:var(--status-maintenance-bg)] text-[color:var(--status-maintenance-fg)] ring-[color:var(--status-maintenance)]/40",
}

const DOT_STYLES: Record<ReservationStatus, string> = {
  pending: "bg-[color:var(--status-cleaning)]",
  confirmed: "bg-[color:var(--status-reserved)]",
  checked_in: "bg-[color:var(--status-available)]",
  cancelled: "bg-[color:var(--status-maintenance)]",
}

interface Props {
  status: ReservationStatus
  size?: "sm" | "md"
  withDot?: boolean
  className?: string
}

export function ReservationStatusBadge({
  status,
  size = "md",
  withDot = true,
  className,
}: Props) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full font-medium ring-1 ring-inset whitespace-nowrap",
        size === "sm" ? "px-2 py-0.5 text-xs" : "px-2.5 py-1 text-xs",
        STATUS_STYLES[status],
        className,
      )}
    >
      {withDot ? (
        <span
          aria-hidden="true"
          className={cn("h-1.5 w-1.5 rounded-full", DOT_STYLES[status])}
        />
      ) : null}
      {RESERVATION_STATUS_LABEL[status]}
    </span>
  )
}
