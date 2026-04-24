import { useEffect, useState } from "react"
import { Loader2, PlayCircle } from "lucide-react"
import { toast } from "sonner"
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
import type { Room } from "@/src/models/room"
import type { Session, WalkInSessionInput } from "@/src/models/session"
import { formatCurrency } from "@/src/utils/format"

interface Props {
  open: boolean
  onOpenChange(open: boolean): void
  rooms: Room[]
  /** Pre-select a room (e.g. triggered from a Room card). */
  defaultRoomId?: string
  onCreate(input: WalkInSessionInput): Promise<Session>
  onCreated?(session: Session): void
}

interface FormState {
  roomId: string
  customerName: string
  customerPhone: string
  notes: string
}

const EMPTY: FormState = {
  roomId: "",
  customerName: "",
  customerPhone: "",
  notes: "",
}

export function WalkInSessionDialog({
  open,
  onOpenChange,
  rooms,
  defaultRoomId,
  onCreate,
  onCreated,
}: Props) {
  const [form, setForm] = useState<FormState>(EMPTY)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    if (!open) return
    setForm({
      ...EMPTY,
      roomId: defaultRoomId ?? "",
      customerName: "Walk-in Customer",
    })
    setErrors({})
  }, [open, defaultRoomId])

  const selectedRoom = rooms.find((r) => r.id === form.roomId) ?? null

  // Only available rooms can start a fresh walk-in (maps to backend guard).
  const availableRooms = rooms
    .filter((r) => r.isActive && r.status === "available")
    .slice()
    .sort((a, b) => a.code.localeCompare(b.code))

  const validate = (): boolean => {
    const next: Record<string, string> = {}
    if (!form.roomId) next.roomId = "Select a room."
    if (!form.customerName.trim())
      next.customerName = "Customer name is required."
    setErrors(next)
    return Object.keys(next).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validate()) return
    setIsSubmitting(true)
    try {
      const payload: WalkInSessionInput = {
        roomId: form.roomId,
        customerName: form.customerName.trim(),
        customerPhone: form.customerPhone.trim() || undefined,
        notes: form.notes.trim() || undefined,
      }
      const session = await onCreate(payload)
      toast.success("Session opened", {
        description: `${session.roomRateSnapshot.code} for ${session.customerName}`,
      })
      onCreated?.(session)
      onOpenChange(false)
    } catch (err) {
      const msg =
        err instanceof ApiRequestError
          ? err.message
          : "Failed to open walk-in session."
      toast.error("Could not open session", { description: msg })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <PlayCircle
              className="h-5 w-5 text-primary"
              aria-hidden="true"
            />
            Open walk-in session
          </DialogTitle>
          <DialogDescription>
            Start the clock for a guest arriving without a reservation. The
            room rate is captured now.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="walkin-room">Room</Label>
            {availableRooms.length === 0 ? (
              <div className="rounded-md border border-dashed border-border bg-muted/40 px-3 py-4 text-center text-sm text-muted-foreground">
                No available rooms. Clean or turn over a room first.
              </div>
            ) : (
              <Select
                value={form.roomId}
                onValueChange={(v) => setForm((f) => ({ ...f, roomId: v }))}
              >
                <SelectTrigger id="walkin-room" aria-invalid={Boolean(errors.roomId)}>
                  <SelectValue placeholder="Select an available room" />
                </SelectTrigger>
                <SelectContent>
                  {availableRooms.map((room) => (
                    <SelectItem key={room.id} value={room.id}>
                      {room.code} — {room.name} ({room.type.toUpperCase()})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
            {errors.roomId ? (
              <p className="text-xs text-destructive">{errors.roomId}</p>
            ) : null}
            {selectedRoom ? (
              <p className="text-xs text-muted-foreground">
                Rate: {formatCurrency(selectedRoom.hourlyRate)}/hr ·
                Capacity {selectedRoom.capacity}
              </p>
            ) : null}
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="walkin-name">Customer name</Label>
            <Input
              id="walkin-name"
              value={form.customerName}
              onChange={(e) =>
                setForm((f) => ({ ...f, customerName: e.target.value }))
              }
              maxLength={100}
              aria-invalid={Boolean(errors.customerName)}
            />
            {errors.customerName ? (
              <p className="text-xs text-destructive">{errors.customerName}</p>
            ) : null}
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="walkin-phone">Phone (optional)</Label>
            <Input
              id="walkin-phone"
              value={form.customerPhone}
              onChange={(e) =>
                setForm((f) => ({ ...f, customerPhone: e.target.value }))
              }
              maxLength={20}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="walkin-notes">Notes (optional)</Label>
            <Textarea
              id="walkin-notes"
              value={form.notes}
              onChange={(e) =>
                setForm((f) => ({ ...f, notes: e.target.value }))
              }
              maxLength={500}
              rows={2}
            />
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
            <Button
              type="submit"
              disabled={isSubmitting || availableRooms.length === 0}
              className="gap-2"
            >
              {isSubmitting ? (
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
              ) : (
                <PlayCircle className="h-4 w-4" aria-hidden="true" />
              )}
              Open session
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
