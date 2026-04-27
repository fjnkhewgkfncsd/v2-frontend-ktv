import { useEffect, useState } from "react"
import { toast } from "sonner"
import { Loader2 } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { ApiRequestError } from "@/src/models/api"
import type {
  Reservation,
  ReservationCreateInput,
  ReservationUpdateInput,
} from "@/src/models/reservation"
import type { Room } from "@/src/models/room"
import {
  defaultFutureDateTimeLocal,
  fromDateTimeLocalValue,
  toDateTimeLocalValue,
} from "@/src/utils/format"

export interface ReservationFormProps {
  open: boolean
  onOpenChange(open: boolean): void
  /** When provided, edit mode; otherwise create mode. */
  reservation?: Reservation | null
  rooms: Room[]
  /** Pre-select a room (create mode). */
  defaultRoomId?: string
  onCreate?(input: ReservationCreateInput): Promise<Reservation>
  onUpdate?(id: string, patch: ReservationUpdateInput): Promise<Reservation>
  onSaved?(reservation: Reservation): void
}

interface FormState {
  customerName: string
  customerPhone: string
  roomId: string
  reservedStartLocal: string
  expectedDuration: string
  depositAmount: string
  notes: string
}

const EMPTY: FormState = {
  customerName: "",
  customerPhone: "",
  roomId: "",
  reservedStartLocal: "",
  expectedDuration: "120",
  depositAmount: "0",
  notes: "",
}

export function ReservationForm({
  open,
  onOpenChange,
  reservation,
  rooms,
  defaultRoomId,
  onCreate,
  onUpdate,
  onSaved,
}: ReservationFormProps) {
  const isEdit = Boolean(reservation)
  const [form, setForm] = useState<FormState>(EMPTY)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Reset / seed form whenever the dialog opens.
  useEffect(() => {
    if (!open) return
    if (reservation) {
      setForm({
        customerName: reservation.customerName,
        customerPhone: reservation.customerPhone,
        roomId: reservation.roomId,
        reservedStartLocal: toDateTimeLocalValue(reservation.reservedStartTime),
        expectedDuration: String(reservation.expectedDuration),
        depositAmount: String(reservation.depositAmount ?? 0),
        notes: reservation.notes ?? "",
      })
    } else {
      setForm({
        ...EMPTY,
        roomId: defaultRoomId ?? "",
        reservedStartLocal: defaultFutureDateTimeLocal(60),
      })
    }
    setErrors({})
  }, [open, reservation, defaultRoomId])

  const validate = (): boolean => {
    const next: Record<string, string> = {}
    if (!form.customerName.trim()) next.customerName = "Customer name is required."
    if (!form.customerPhone.trim())
      next.customerPhone = "Customer phone is required."
    if (!form.roomId) next.roomId = "Select a room."
    if (!form.reservedStartLocal)
      next.reservedStartLocal = "Start time is required."
    const duration = Number(form.expectedDuration)
    if (!Number.isFinite(duration) || duration <= 0)
      next.expectedDuration = "Duration must be a positive number of minutes."
    const deposit = Number(form.depositAmount)
    if (!Number.isFinite(deposit) || deposit < 0)
      next.depositAmount = "Deposit cannot be negative."
    setErrors(next)
    return Object.keys(next).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validate()) return
    setIsSubmitting(true)
    try {
      const payload = {
        customerName: form.customerName.trim(),
        customerPhone: form.customerPhone.trim(),
        roomId: form.roomId,
        reservedStartTime: fromDateTimeLocalValue(form.reservedStartLocal),
        expectedDuration: Number(form.expectedDuration),
        depositAmount: Number(form.depositAmount) || 0,
        notes: form.notes.trim(),
      }

      let saved: Reservation
      if (isEdit && reservation && onUpdate) {
        saved = await onUpdate(reservation.id, payload)
        toast.success("Reservation updated", {
          description: `${saved.customerName} — ${saved.roomSnapshot.code}`,
        })
      } else if (onCreate) {
        saved = await onCreate(payload)
        toast.success("Reservation created", {
          description: `${saved.customerName} — ${saved.roomSnapshot.code}`,
        })
      } else {
        throw new Error("No submit handler provided")
      }
      onSaved?.(saved)
      onOpenChange(false)
    } catch (err) {
      const msg =
        err instanceof ApiRequestError
          ? err.message
          : "Failed to save reservation."
      if (err instanceof ApiRequestError && err.details?.fields) {
        const fieldErrors: Record<string, string> = {}
        for (const f of err.details.fields) {
          fieldErrors[f.field] = f.message
        }
        setErrors((prev) => ({ ...prev, ...fieldErrors }))
      }
      toast.error("Could not save reservation", { description: msg })
    } finally {
      setIsSubmitting(false)
    }
  }

  const roomOptions = rooms
    .filter((r) => r.isActive)
    .slice()
    .sort((a, b) => a.code.localeCompare(b.code))

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {isEdit ? "Edit reservation" : "New reservation"}
          </DialogTitle>
          <DialogDescription>
            {isEdit
              ? "Update customer details, timing, or room. The backend will re-check for conflicts."
              : "Book a room in advance for a customer. The backend prevents double-booking overlapping times."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-1.5 sm:col-span-2">
              <Label htmlFor="res-customer">Customer name</Label>
              <Input
                id="res-customer"
                value={form.customerName}
                onChange={(e) =>
                  setForm((f) => ({ ...f, customerName: e.target.value }))
                }
                placeholder="e.g. Somchai"
                maxLength={100}
                aria-invalid={Boolean(errors.customerName)}
                aria-describedby={
                  errors.customerName ? "res-customer-error" : undefined
                }
              />
              {errors.customerName ? (
                <p id="res-customer-error" className="text-xs text-destructive">
                  {errors.customerName}
                </p>
              ) : null}
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="res-phone">Phone</Label>
              <Input
                id="res-phone"
                value={form.customerPhone}
                onChange={(e) =>
                  setForm((f) => ({ ...f, customerPhone: e.target.value }))
                }
                placeholder="081-234-5678"
                maxLength={20}
                aria-invalid={Boolean(errors.customerPhone)}
              />
              {errors.customerPhone ? (
                <p className="text-xs text-destructive">
                  {errors.customerPhone}
                </p>
              ) : null}
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="res-room">Room</Label>
              <Select
                value={form.roomId}
                onValueChange={(v) => setForm((f) => ({ ...f, roomId: v }))}
              >
                <SelectTrigger id="res-room" aria-invalid={Boolean(errors.roomId)}>
                  <SelectValue placeholder="Select a room" />
                </SelectTrigger>
                <SelectContent>
                  {roomOptions.map((room) => (
                    <SelectItem key={room.id} value={room.id}>
                      {room.code} — {room.name} ({room.type.toUpperCase()})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.roomId ? (
                <p className="text-xs text-destructive">{errors.roomId}</p>
              ) : null}
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="res-start">Start time</Label>
              <Input
                id="res-start"
                type="datetime-local"
                value={form.reservedStartLocal}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    reservedStartLocal: e.target.value,
                  }))
                }
                aria-invalid={Boolean(errors.reservedStartLocal)}
              />
              {errors.reservedStartLocal ? (
                <p className="text-xs text-destructive">
                  {errors.reservedStartLocal}
                </p>
              ) : null}
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="res-duration">Duration (minutes)</Label>
              <Input
                id="res-duration"
                type="number"
                min={15}
                step={15}
                value={form.expectedDuration}
                onChange={(e) =>
                  setForm((f) => ({ ...f, expectedDuration: e.target.value }))
                }
                aria-invalid={Boolean(errors.expectedDuration)}
              />
              {errors.expectedDuration ? (
                <p className="text-xs text-destructive">
                  {errors.expectedDuration}
                </p>
              ) : null}
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="res-deposit">Deposit</Label>
              <Input
                id="res-deposit"
                type="number"
                min={0}
                step={50}
                value={form.depositAmount}
                onChange={(e) =>
                  setForm((f) => ({ ...f, depositAmount: e.target.value }))
                }
                aria-invalid={Boolean(errors.depositAmount)}
              />
              {errors.depositAmount ? (
                <p className="text-xs text-destructive">
                  {errors.depositAmount}
                </p>
              ) : null}
            </div>

            <div className="flex flex-col gap-1.5 sm:col-span-2">
              <Label htmlFor="res-notes">Notes</Label>
              <Textarea
                id="res-notes"
                value={form.notes}
                onChange={(e) =>
                  setForm((f) => ({ ...f, notes: e.target.value }))
                }
                placeholder="Birthday group, allergies, etc."
                maxLength={500}
                rows={3}
              />
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button
              type="button"
              variant="ghost"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting} className="gap-2">
              {isSubmitting ? (
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
              ) : null}
              {isEdit ? "Save changes" : "Create reservation"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
