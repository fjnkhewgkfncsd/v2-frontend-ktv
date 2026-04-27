import { cn } from "@/lib/utils"
import { ROOM_STATUS_LABEL, type RoomStatus } from "@/src/models/room"

const STATUS_STYLES: Record<RoomStatus, string> = {
  available:
    "bg-[color:var(--status-available-bg)] text-[color:var(--status-available-fg)] ring-[color:var(--status-available)]/30",
  reserved:
    "bg-[color:var(--status-reserved-bg)] text-[color:var(--status-reserved-fg)] ring-[color:var(--status-reserved)]/40",
  occupied:
    "bg-[color:var(--status-occupied-bg)] text-[color:var(--status-occupied-fg)] ring-[color:var(--status-occupied)]/40",
  cleaning:
    "bg-[color:var(--status-cleaning-bg)] text-[color:var(--status-cleaning-fg)] ring-[color:var(--status-cleaning)]/40",
  maintenance:
    "bg-[color:var(--status-maintenance-bg)] text-[color:var(--status-maintenance-fg)] ring-[color:var(--status-maintenance)]/40",
}

const DOT_STYLES: Record<RoomStatus, string> = {
  available: "bg-[color:var(--status-available)]",
  reserved: "bg-[color:var(--status-reserved)]",
  occupied: "bg-[color:var(--status-occupied)]",
  cleaning: "bg-[color:var(--status-cleaning)]",
  maintenance: "bg-[color:var(--status-maintenance)]",
}

interface Props {
  status: RoomStatus
  size?: "sm" | "md"
  withDot?: boolean
  className?: string
}

export function RoomStatusBadge({
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
      {ROOM_STATUS_LABEL[status]}
    </span>
  )
}
