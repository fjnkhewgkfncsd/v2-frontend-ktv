import { Crown, ExternalLink, Users } from "lucide-react"
import { cn } from "@/lib/utils"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { RoomStatusBadge } from "./RoomStatusBadge"
import { formatCurrency } from "@/src/utils/format"
import type { Room } from "@/src/models/room"

interface Props {
  room: Room
  onOpenDetail(room: Room): void
  onPrimaryAction(room: Room): void
  primaryActionLabel: string
}

export function RoomCard({
  room,
  onOpenDetail,
  onPrimaryAction,
  primaryActionLabel,
}: Props) {
  return (
    <Card
      className={cn(
        "group relative flex flex-col overflow-hidden border-border/70 transition-all",
        "hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-md",
      )}
    >
      <div
        aria-hidden="true"
        className="absolute inset-y-0 left-0 w-1"
        style={{ backgroundColor: `var(--status-${room.status})` }}
      />

      <div className="flex items-start justify-between gap-3 p-5 pb-3">
        <div className="flex min-w-0 flex-col">
          <div className="flex items-center gap-2">
            <h3 className="text-base font-semibold tracking-tight text-foreground">
              {room.code}
            </h3>
            {room.type === "vip" ? (
              <span
                className="inline-flex items-center gap-1 rounded-md bg-primary/10 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-primary"
                title="VIP"
              >
                <Crown className="h-3 w-3" aria-hidden="true" />
                VIP
              </span>
            ) : null}
          </div>
          <p className="mt-0.5 truncate text-sm text-muted-foreground">
            {room.name}
          </p>
        </div>
        <RoomStatusBadge status={room.status} />
      </div>

      <div className="flex items-center justify-between gap-4 px-5 pb-4 text-sm text-muted-foreground">
        <div className="flex items-center gap-1.5">
          <Users className="h-3.5 w-3.5" aria-hidden="true" />
          <span className="tabular-nums">Cap {room.capacity}</span>
        </div>
        <div className="flex items-baseline gap-1">
          <span className="text-base font-semibold tabular-nums text-foreground">
            {formatCurrency(room.hourlyRate)}
          </span>
          <span className="text-xs">/ hr</span>
        </div>
      </div>

      {room.notes ? (
        <p className="mx-5 mb-4 line-clamp-2 rounded-md bg-muted/60 px-3 py-2 text-xs text-muted-foreground">
          {room.notes}
        </p>
      ) : null}

      <div className="mt-auto flex items-center gap-2 border-t border-border/60 bg-card/60 p-3">
        <Button
          size="sm"
          className="flex-1"
          onClick={() => onPrimaryAction(room)}
        >
          {primaryActionLabel}
        </Button>
        <Button
          size="sm"
          variant="ghost"
          onClick={() => onOpenDetail(room)}
          aria-label={`Open details for ${room.code}`}
          className="gap-1.5"
        >
          Details
          <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
        </Button>
      </div>
    </Card>
  )
}
