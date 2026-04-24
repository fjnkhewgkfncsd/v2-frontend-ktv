import { cn } from "@/lib/utils"
import {
  ROOM_STATUS_LABEL,
  ROOM_STATUS_ORDER,
  type RoomStatus,
} from "@/src/models/room"

interface Props {
  selected: RoomStatus | "all"
  counts: Record<RoomStatus, number> & { total: number }
  onChange(next: RoomStatus | "all"): void
}

interface Chip {
  key: RoomStatus | "all"
  label: string
  count: number
  colorVar?: string
}

export function RoomFilters({ selected, counts, onChange }: Props) {
  const chips: Chip[] = [
    { key: "all", label: "All rooms", count: counts.total },
    ...ROOM_STATUS_ORDER.map((s) => ({
      key: s,
      label: ROOM_STATUS_LABEL[s],
      count: counts[s],
      colorVar: `var(--status-${s})`,
    })),
  ]

  return (
    <div
      role="tablist"
      aria-label="Filter rooms by status"
      className="flex flex-wrap items-center gap-2"
    >
      {chips.map((chip) => {
        const isActive = selected === chip.key
        return (
          <button
            key={chip.key}
            role="tab"
            aria-selected={isActive}
            type="button"
            onClick={() => onChange(chip.key)}
            className={cn(
              "group inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-sm font-medium transition-all",
              isActive
                ? "border-primary bg-primary text-primary-foreground shadow-sm"
                : "border-border bg-card text-foreground hover:border-primary/40 hover:bg-primary/[0.04]",
            )}
          >
            {chip.colorVar ? (
              <span
                aria-hidden="true"
                className="h-1.5 w-1.5 rounded-full"
                style={{
                  backgroundColor: isActive
                    ? "currentColor"
                    : chip.colorVar,
                }}
              />
            ) : null}
            <span>{chip.label}</span>
            <span
              className={cn(
                "min-w-[1.25rem] rounded-full px-1.5 py-0.5 text-center text-[10px] font-semibold tabular-nums",
                isActive
                  ? "bg-primary-foreground/15 text-primary-foreground"
                  : "bg-muted text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary",
              )}
            >
              {chip.count}
            </span>
          </button>
        )
      })}
    </div>
  )
}
