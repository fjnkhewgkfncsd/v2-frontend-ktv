import { useState } from "react"
import {
  CalendarClock,
  CheckCircle2,
  Crown,
  Loader2,
  Pencil,
  PlayCircle,
  Phone,
  XCircle,
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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { ReservationStatusBadge } from "./ReservationStatusBadge"
import {
  formatCurrency,
  formatDateTime,
  formatDuration,
} from "@/src/utils/format"
import type { Reservation } from "@/src/models/reservation"

interface Props {
  reservation: Reservation | null
  open: boolean
  onOpenChange(open: boolean): void
  onEdit(reservation: Reservation): void
  onCancel(reservation: Reservation): Promise<void>
  onCheckIn(reservation: Reservation): Promise<void>
  onStartSession(reservation: Reservation): Promise<void>
}

export function ReservationDetailSheet({
  reservation,
  open,
  onOpenChange,
  onEdit,
  onCancel,
  onCheckIn,
  onStartSession,
}: Props) {
  const [confirmCancel, setConfirmCancel] = useState(false)
  const [busyAction, setBusyAction] = useState<
    "cancel" | "check-in" | "session" | null
  >(null)

  if (!reservation) {
    return (
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent side="right" className="w-full sm:max-w-md" />
      </Sheet>
    )
  }

  const { status } = reservation
  const isEditable = status === "pending" || status === "confirmed"
  const isCancellable = status === "pending" || status === "confirmed"
  const isCheckInable = status === "pending" || status === "confirmed"
  const isSessionable = status === "checked_in"

  const handleCancelConfirmed = async () => {
    setBusyAction("cancel")
    try {
      await onCancel(reservation)
      setConfirmCancel(false)
    } finally {
      setBusyAction(null)
    }
  }

  const handleCheckIn = async () => {
    setBusyAction("check-in")
    try {
      await onCheckIn(reservation)
    } finally {
      setBusyAction(null)
    }
  }

  const handleStartSession = async () => {
    setBusyAction("session")
    try {
      await onStartSession(reservation)
    } finally {
      setBusyAction(null)
    }
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="w-full sm:max-w-md flex flex-col gap-0 p-0"
      >
        <SheetHeader className="gap-3 border-b border-border p-6">
          <div className="flex items-center gap-2">
            <SheetTitle className="text-xl">
              {reservation.customerName}
            </SheetTitle>
            {reservation.roomSnapshot.type === "vip" ? (
              <span className="inline-flex items-center gap-1 rounded-md bg-primary/10 px-1.5 py-0.5 text-[10px] font-semibold uppercase text-primary">
                <Crown className="h-3 w-3" aria-hidden="true" />
                VIP
              </span>
            ) : null}
          </div>
          <SheetDescription className="flex items-center gap-2 text-sm">
            <Phone className="h-3.5 w-3.5" aria-hidden="true" />
            {reservation.customerPhone || "—"}
          </SheetDescription>
          <div>
            <ReservationStatusBadge status={status} />
          </div>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto p-6">
          <dl className="grid grid-cols-2 gap-4 text-sm">
            <DetailField
              label="Room"
              value={`${reservation.roomSnapshot.code} — ${reservation.roomSnapshot.name}`}
              span={2}
            />
            <DetailField
              label="Rate"
              value={`${formatCurrency(reservation.roomSnapshot.hourlyRate)}/hr`}
            />
            <DetailField
              label="Deposit"
              value={formatCurrency(reservation.depositAmount)}
            />
            <DetailField
              label="Start"
              value={formatDateTime(reservation.reservedStartTime)}
            />
            <DetailField
              label="End"
              value={formatDateTime(reservation.reservedEndTime)}
            />
            <DetailField
              label="Duration"
              value={formatDuration(reservation.expectedDuration)}
            />
            <DetailField
              label="Checked in"
              value={formatDateTime(reservation.checkedInAt)}
            />
            <DetailField
              label="Created"
              value={formatDateTime(reservation.createdAt)}
            />
            <DetailField
              label="Updated"
              value={formatDateTime(reservation.updatedAt)}
            />
          </dl>

          {reservation.notes ? (
            <div className="mt-5 rounded-md border border-border bg-muted/40 p-3">
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Notes
              </p>
              <p className="mt-1 text-sm text-foreground">
                {reservation.notes}
              </p>
            </div>
          ) : null}

          <Separator className="my-6" />

          <div>
            <h3 className="flex items-center gap-1.5 text-sm font-medium text-foreground">
              <CalendarClock className="h-4 w-4" aria-hidden="true" />
              Lifecycle
            </h3>
            <p className="mt-1 text-xs text-muted-foreground">
              {status === "pending" &&
                "Reservation is pending confirmation."}
              {status === "confirmed" &&
                "Ready for customer arrival. Check in when they arrive."}
              {status === "checked_in" &&
                "Customer has arrived. Open a session to start their room clock."}
              {status === "cancelled" &&
                "This reservation was cancelled and is read-only."}
            </p>
          </div>
        </div>

        <SheetFooter className="flex flex-col gap-2 border-t border-border bg-card/40 p-4 sm:flex-col">
          {isSessionable ? (
            <Button
              className="w-full gap-2"
              onClick={handleStartSession}
              disabled={busyAction !== null}
            >
              {busyAction === "session" ? (
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
              ) : (
                <PlayCircle className="h-4 w-4" aria-hidden="true" />
              )}
              Start session now
            </Button>
          ) : null}

          {isCheckInable ? (
            <Button
              className="w-full gap-2"
              onClick={handleCheckIn}
              disabled={busyAction !== null}
            >
              {busyAction === "check-in" ? (
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
              ) : (
                <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
              )}
              Check in
            </Button>
          ) : null}

          <div className="grid w-full grid-cols-2 gap-2">
            <Button
              variant="outline"
              className="gap-2"
              onClick={() => onEdit(reservation)}
              disabled={!isEditable || busyAction !== null}
            >
              <Pencil className="h-4 w-4" aria-hidden="true" />
              Edit
            </Button>
            <Button
              variant="outline"
              className="gap-2 text-destructive hover:text-destructive"
              onClick={() => setConfirmCancel(true)}
              disabled={!isCancellable || busyAction !== null}
            >
              <XCircle className="h-4 w-4" aria-hidden="true" />
              Cancel
            </Button>
          </div>
        </SheetFooter>
      </SheetContent>

      <AlertDialog open={confirmCancel} onOpenChange={setConfirmCancel}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancel this reservation?</AlertDialogTitle>
            <AlertDialogDescription>
              {reservation.customerName} — {reservation.roomSnapshot.code}.
              This cannot be undone. Any reserved hold on the room will be
              released.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={busyAction === "cancel"}>
              Keep reservation
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleCancelConfirmed}
              disabled={busyAction === "cancel"}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {busyAction === "cancel" ? (
                <Loader2
                  className="mr-2 h-4 w-4 animate-spin"
                  aria-hidden="true"
                />
              ) : null}
              Cancel reservation
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Sheet>
  )
}

function DetailField({
  label,
  value,
  span,
}: {
  label: string
  value: string
  span?: 1 | 2
}) {
  return (
    <div className={span === 2 ? "col-span-2" : undefined}>
      <dt className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
        {label}
      </dt>
      <dd className="mt-1 text-sm text-foreground">{value}</dd>
    </div>
  )
}
