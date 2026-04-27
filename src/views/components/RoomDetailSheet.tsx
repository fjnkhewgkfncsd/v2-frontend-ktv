import { useState } from "react"
import {
  CalendarPlus,
  CheckCircle2,
  Crown,
  PlayCircle,
  Settings2,
  Wrench,
  Sparkles as CleaningIcon,
} from "lucide-react"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { Spinner } from "@/components/ui/spinner"
import { RoomStatusBadge } from "./RoomStatusBadge"
import { formatCurrency, formatDateTime } from "@/src/utils/format"
import type { Room, RoomStatus } from "@/src/models/room"

interface Props {
  room: Room | null
  open: boolean
  isUpdating: boolean
  onOpenChange(open: boolean): void
  onChangeStatus(next: RoomStatus): Promise<void> | void
  onReserve(room: Room): void
  onStartWalkIn(room: Room): void
  onOpenSession(room: Room): void
}

export function RoomDetailSheet({
  room,
  open,
  isUpdating,
  onOpenChange,
  onChangeStatus,
  onReserve,
  onStartWalkIn,
  onOpenSession,
}: Props) {
  const [pendingStatus, setPendingStatus] = useState<RoomStatus | null>(null)

  const handleStatus = async (next: RoomStatus) => {
    setPendingStatus(next)
    try {
      await onChangeStatus(next)
    } finally {
      setPendingStatus(null)
    }
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="w-full sm:max-w-md flex flex-col gap-0 p-0"
      >
        {room ? (
          <>
            <SheetHeader className="gap-3 border-b border-border p-6">
              <div className="flex items-center gap-2">
                <SheetTitle className="text-xl">{room.code}</SheetTitle>
                {room.type === "vip" ? (
                  <span className="inline-flex items-center gap-1 rounded-md bg-primary/10 px-1.5 py-0.5 text-[10px] font-semibold uppercase text-primary">
                    <Crown className="h-3 w-3" aria-hidden="true" />
                    VIP
                  </span>
                ) : null}
              </div>
              <SheetDescription className="text-sm">
                {room.name}
              </SheetDescription>
              <div>
                <RoomStatusBadge status={room.status} />
              </div>
            </SheetHeader>

            <div className="flex-1 overflow-y-auto p-6">
              <dl className="grid grid-cols-2 gap-4 text-sm">
                <DetailField label="Type" value={room.type.toUpperCase()} />
                <DetailField
                  label="Capacity"
                  value={`${room.capacity} guests`}
                />
                <DetailField
                  label="Hourly rate"
                  value={formatCurrency(room.hourlyRate)}
                />
                <DetailField
                  label="Active"
                  value={room.isActive ? "Yes" : "No"}
                />
                <DetailField
                  label="Current session"
                  value={room.currentSessionId ?? "—"}
                  mono
                  span={2}
                />
                <DetailField
                  label="Active reservation"
                  value={room.activeReservationId ?? "—"}
                  mono
                  span={2}
                />
                <DetailField
                  label="Created"
                  value={formatDateTime(room.createdAt)}
                />
                <DetailField
                  label="Updated"
                  value={formatDateTime(room.updatedAt)}
                />
              </dl>

              {room.notes ? (
                <div className="mt-5 rounded-md border border-border bg-muted/40 p-3">
                  <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    Notes
                  </p>
                  <p className="mt-1 text-sm text-foreground">{room.notes}</p>
                </div>
              ) : null}

              <Separator className="my-6" />

              <div>
                <h3 className="flex items-center gap-1.5 text-sm font-medium text-foreground">
                  <Settings2 className="h-4 w-4" aria-hidden="true" />
                  Update room status
                </h3>
                <p className="mt-1 text-xs text-muted-foreground">
                  Change the operational state. Reserved and occupied states are
                  set automatically by reservations and sessions.
                </p>

                <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-3">
                  <StatusAction
                    label="Available"
                    icon={<CheckCircle2 className="h-4 w-4" />}
                    disabled={
                      isUpdating ||
                      room.status === "available" ||
                      room.status === "occupied" ||
                      room.status === "reserved"
                    }
                    loading={pendingStatus === "available"}
                    onClick={() => handleStatus("available")}
                    variant="available"
                  />
                  <StatusAction
                    label="Cleaning"
                    icon={<CleaningIcon className="h-4 w-4" />}
                    disabled={
                      isUpdating ||
                      room.status === "cleaning" ||
                      room.status === "occupied" ||
                      room.status === "reserved"
                    }
                    loading={pendingStatus === "cleaning"}
                    onClick={() => handleStatus("cleaning")}
                    variant="cleaning"
                  />
                  <StatusAction
                    label="Maintenance"
                    icon={<Wrench className="h-4 w-4" />}
                    disabled={
                      isUpdating ||
                      room.status === "maintenance" ||
                      room.status === "occupied" ||
                      room.status === "reserved"
                    }
                    loading={pendingStatus === "maintenance"}
                    onClick={() => handleStatus("maintenance")}
                    variant="maintenance"
                  />
                </div>
              </div>
            </div>

            <SheetFooter className="border-t border-border bg-card/40 p-4">
              {room.status === "available" ? (
                <div className="grid w-full grid-cols-1 gap-2 sm:grid-cols-2">
                  <Button
                    variant="outline"
                    className="gap-2"
                    onClick={() => onReserve(room)}
                  >
                    <CalendarPlus className="h-4 w-4" aria-hidden="true" />
                    Reserve
                  </Button>
                  <Button
                    className="gap-2"
                    onClick={() => onStartWalkIn(room)}
                  >
                    <PlayCircle className="h-4 w-4" aria-hidden="true" />
                    Start walk-in
                  </Button>
                </div>
              ) : room.status === "occupied" ? (
                <Button
                  className="w-full gap-2"
                  onClick={() => onOpenSession(room)}
                >
                  <PlayCircle className="h-4 w-4" aria-hidden="true" />
                  Open active session
                </Button>
              ) : room.status === "reserved" ? (
                <Button
                  className="w-full gap-2"
                  onClick={() => onReserve(room)}
                >
                  <CalendarPlus className="h-4 w-4" aria-hidden="true" />
                  View reservation
                </Button>
              ) : (
                <p className="text-center text-xs text-muted-foreground">
                  No customer actions available for this status.
                </p>
              )}
            </SheetFooter>
          </>
        ) : null}
      </SheetContent>
    </Sheet>
  )
}

function DetailField({
  label,
  value,
  mono,
  span,
}: {
  label: string
  value: string
  mono?: boolean
  span?: 1 | 2
}) {
  return (
    <div className={span === 2 ? "col-span-2" : undefined}>
      <dt className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
        {label}
      </dt>
      <dd
        className={`mt-1 text-sm text-foreground ${mono ? "font-mono text-xs" : ""}`}
      >
        {value}
      </dd>
    </div>
  )
}

function StatusAction({
  label,
  icon,
  onClick,
  disabled,
  loading,
}: {
  label: string
  icon: React.ReactNode
  onClick(): void
  disabled?: boolean
  loading?: boolean
  variant: "available" | "cleaning" | "maintenance"
}) {
  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      onClick={onClick}
      disabled={disabled}
      className="justify-start gap-2"
    >
      {loading ? <Spinner className="h-3.5 w-3.5" /> : icon}
      <span>{label}</span>
    </Button>
  )
}
