import { useEffect, useState } from "react"
import {
  Clock,
  Crown,
  ExternalLink,
  Phone,
  Receipt,
  Users,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { formatCurrency, formatElapsedSince } from "@/src/utils/format"
import type { Session } from "@/src/models/session"

interface Props {
  session: Session
  onOpen(session: Session): void
  onOrder(session: Session): void
  onCheckout?(session: Session): void
}

export function SessionCard({ session, onOpen, onOrder, onCheckout }: Props) {
  // Tick every minute so the "elapsed" display stays fresh.
  const [, setTick] = useState(0)
  useEffect(() => {
    const id = window.setInterval(() => setTick((n) => n + 1), 60_000)
    return () => window.clearInterval(id)
  }, [])

  const isVip = session.roomRateSnapshot.type === "vip"

  return (
    <Card
      className={cn(
        "group relative flex flex-col overflow-hidden border-border/70 transition-all",
        "hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-md",
      )}
    >
      <div
        aria-hidden="true"
        className="absolute inset-y-0 left-0 w-1 bg-[color:var(--status-occupied)]"
      />

      <div className="flex items-start justify-between gap-3 p-5 pb-3">
        <div className="flex min-w-0 flex-col">
          <div className="flex items-center gap-2">
            <h3 className="text-base font-semibold tracking-tight text-foreground">
              {session.roomRateSnapshot.code}
            </h3>
            {isVip ? (
              <span className="inline-flex items-center gap-1 rounded-md bg-primary/10 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-primary">
                <Crown className="h-3 w-3" aria-hidden="true" />
                VIP
              </span>
            ) : null}
            {session.reservationId ? (
              <span className="inline-flex items-center rounded-md bg-secondary px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-secondary-foreground">
                Reserved
              </span>
            ) : null}
          </div>
          <p className="mt-0.5 truncate text-sm text-muted-foreground">
            {session.roomRateSnapshot.name}
          </p>
        </div>
        <div className="flex items-center gap-1 rounded-full bg-[color:var(--status-occupied-bg)] px-2 py-1 text-xs font-medium text-[color:var(--status-occupied-fg)] ring-1 ring-inset ring-[color:var(--status-occupied)]/40">
          <span
            aria-hidden="true"
            className="h-1.5 w-1.5 rounded-full bg-[color:var(--status-occupied)]"
          />
          Active
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 px-5 pb-4 text-sm text-muted-foreground">
        <div className="flex min-w-0 items-center gap-1.5">
          <Users className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
          <span className="truncate text-foreground">
            {session.customerName}
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <Phone className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
          <span className="tabular-nums">
            {session.customerPhone || "—"}
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <Clock className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
          <span className="tabular-nums">
            {formatElapsedSince(session.startTime)}
          </span>
        </div>
        <div className="flex items-baseline justify-end gap-1">
          <span className="text-sm font-semibold tabular-nums text-foreground">
            {formatCurrency(session.itemsSubtotal)}
          </span>
          <span className="text-xs">items</span>
        </div>
      </div>

      <div className="mt-auto flex items-center gap-2 border-t border-border/60 bg-card/60 p-3">
        <Button
          size="sm"
          variant="outline"
          className="flex-1"
          onClick={() => onOrder(session)}
        >
          Add items
        </Button>
        {onCheckout ? (
          <Button
            size="sm"
            className="gap-1.5"
            onClick={() => onCheckout(session)}
            aria-label={`Checkout ${session.roomRateSnapshot.code}`}
          >
            <Receipt className="h-3.5 w-3.5" aria-hidden="true" />
            Checkout
          </Button>
        ) : null}
        <Button
          size="sm"
          variant="ghost"
          onClick={() => onOpen(session)}
          className="gap-1.5"
          aria-label={`Open session details for ${session.roomRateSnapshot.code}`}
        >
          <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
          <span className="sr-only">Details</span>
        </Button>
      </div>
    </Card>
  )
}
