import { useEffect, useMemo, useState } from "react"
import { toast } from "sonner"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import type {
  Room,
  RoomStatus,
  RoomType,
} from "@/src/models/room"
import {
  ROOM_STATUS_LABEL,
  ROOM_STATUS_ORDER,
} from "@/src/models/room"
import type {
  RoomCreateInput,
  RoomUpdateInput,
} from "@/src/services/roomService"
import { ApiRequestError } from "@/src/models/api"

interface Props {
  open: boolean
  onOpenChange(open: boolean): void
  room: Room | null
  onCreate(input: RoomCreateInput): Promise<Room>
  onUpdate(id: string, input: RoomUpdateInput): Promise<Room>
}

interface FormState {
  code: string
  name: string
  type: RoomType
  capacity: string
  hourlyRate: string
  status: RoomStatus
  isActive: boolean
  notes: string
}

function emptyForm(): FormState {
  return {
    code: "",
    name: "",
    type: "standard",
    capacity: "6",
    hourlyRate: "300",
    status: "available",
    isActive: true,
    notes: "",
  }
}

function roomToForm(room: Room): FormState {
  return {
    code: room.code,
    name: room.name,
    type: room.type,
    capacity: String(room.capacity),
    hourlyRate: String(room.hourlyRate),
    status: room.status,
    isActive: room.isActive,
    notes: room.notes,
  }
}

export function RoomFormDialog({
  open,
  onOpenChange,
  room,
  onCreate,
  onUpdate,
}: Props) {
  const isEdit = !!room
  const [form, setForm] = useState<FormState>(emptyForm())
  const [submitting, setSubmitting] = useState(false)
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})

  useEffect(() => {
    if (!open) return
    setForm(room ? roomToForm(room) : emptyForm())
    setFieldErrors({})
  }, [room, open])

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) =>
    setForm((prev) => ({ ...prev, [key]: value }))

  const validate = (): Record<string, string> => {
    const errs: Record<string, string> = {}
    if (!form.code.trim()) errs.code = "Code is required."
    else if (form.code.trim().length > 20)
      errs.code = "Max 20 characters."
    if (!form.name.trim()) errs.name = "Name is required."
    else if (form.name.trim().length > 100)
      errs.name = "Max 100 characters."

    const capacityNum = Number(form.capacity)
    if (!Number.isFinite(capacityNum) || capacityNum < 1 || capacityNum > 100)
      errs.capacity = "Must be between 1 and 100."

    const rateNum = Number(form.hourlyRate)
    if (!Number.isFinite(rateNum) || rateNum < 0)
      errs.hourlyRate = "Must be 0 or greater."

    if (form.notes.length > 500) errs.notes = "Max 500 characters."
    return errs
  }

  const canSubmit = useMemo(
    () => Object.keys(validate()).length === 0 && !submitting,
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [form, submitting],
  )

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const errs = validate()
    setFieldErrors(errs)
    if (Object.keys(errs).length > 0) return

    const payload: RoomCreateInput = {
      code: form.code.trim().toUpperCase(),
      name: form.name.trim(),
      type: form.type,
      capacity: Number(form.capacity),
      hourlyRate: Number(form.hourlyRate),
      isActive: form.isActive,
      notes: form.notes.trim(),
    }
    // Only send status when creating; status transitions in edit go via PATCH /status
    if (!isEdit) payload.status = form.status

    try {
      setSubmitting(true)
      if (isEdit && room) {
        await onUpdate(room.id, payload)
        toast.success("Room updated", { description: payload.name })
      } else {
        await onCreate(payload)
        toast.success("Room created", { description: payload.name })
      }
      onOpenChange(false)
    } catch (err) {
      if (err instanceof ApiRequestError) {
        if (err.code === "DUPLICATE_KEY") {
          setFieldErrors({ code: "A room with this code already exists." })
        } else if (err.details?.fields) {
          const next: Record<string, string> = {}
          for (const f of err.details.fields) {
            if (f.field) next[f.field] = f.message
          }
          setFieldErrors(next)
        }
        toast.error("Could not save room", { description: err.message })
      } else {
        toast.error("Could not save room")
      }
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit room" : "New room"}</DialogTitle>
          <DialogDescription>
            {isEdit
              ? "Update pricing, capacity, or operational metadata."
              : "Add a new room to the master catalog."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="room-code">Code</Label>
              <Input
                id="room-code"
                value={form.code}
                onChange={(e) => set("code", e.target.value.toUpperCase())}
                placeholder="A101"
                maxLength={20}
                required
                aria-invalid={!!fieldErrors.code}
                aria-describedby={fieldErrors.code ? "room-code-err" : undefined}
              />
              {fieldErrors.code ? (
                <p id="room-code-err" className="text-xs text-destructive">
                  {fieldErrors.code}
                </p>
              ) : (
                <p className="text-xs text-muted-foreground">
                  Unique, saved uppercase.
                </p>
              )}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="room-name">Name</Label>
              <Input
                id="room-name"
                value={form.name}
                onChange={(e) => set("name", e.target.value)}
                placeholder="Aurora 101"
                maxLength={100}
                required
                aria-invalid={!!fieldErrors.name}
              />
              {fieldErrors.name ? (
                <p className="text-xs text-destructive">{fieldErrors.name}</p>
              ) : null}
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="space-y-1.5">
              <Label htmlFor="room-type">Type</Label>
              <Select
                value={form.type}
                onValueChange={(v) => set("type", v as RoomType)}
              >
                <SelectTrigger id="room-type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="standard">Standard</SelectItem>
                  <SelectItem value="vip">VIP</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="room-capacity">Capacity</Label>
              <Input
                id="room-capacity"
                type="number"
                inputMode="numeric"
                min={1}
                max={100}
                value={form.capacity}
                onChange={(e) => set("capacity", e.target.value)}
                required
                aria-invalid={!!fieldErrors.capacity}
              />
              {fieldErrors.capacity ? (
                <p className="text-xs text-destructive">
                  {fieldErrors.capacity}
                </p>
              ) : null}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="room-rate">Hourly rate</Label>
              <Input
                id="room-rate"
                type="number"
                inputMode="decimal"
                min={0}
                step="0.01"
                value={form.hourlyRate}
                onChange={(e) => set("hourlyRate", e.target.value)}
                required
                aria-invalid={!!fieldErrors.hourlyRate}
              />
              {fieldErrors.hourlyRate ? (
                <p className="text-xs text-destructive">
                  {fieldErrors.hourlyRate}
                </p>
              ) : null}
            </div>
          </div>

          {!isEdit ? (
            <div className="space-y-1.5">
              <Label htmlFor="room-status">Initial status</Label>
              <Select
                value={form.status}
                onValueChange={(v) => set("status", v as RoomStatus)}
              >
                <SelectTrigger id="room-status">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ROOM_STATUS_ORDER.map((s) => (
                    <SelectItem key={s} value={s}>
                      {ROOM_STATUS_LABEL[s]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          ) : null}

          <div className="flex items-start justify-between rounded-md border border-border/60 bg-muted/30 p-3">
            <div className="space-y-0.5 pr-3">
              <Label htmlFor="room-active" className="text-sm">
                Active
              </Label>
              <p className="text-xs text-muted-foreground">
                Inactive rooms are hidden from booking and operational flows
                but remain in reports.
              </p>
            </div>
            <Switch
              id="room-active"
              checked={form.isActive}
              onCheckedChange={(checked) => set("isActive", checked)}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="room-notes">Notes</Label>
            <Textarea
              id="room-notes"
              value={form.notes}
              onChange={(e) => set("notes", e.target.value)}
              placeholder="Optional internal notes (max 500)"
              maxLength={500}
              rows={3}
              aria-invalid={!!fieldErrors.notes}
            />
            <p className="text-xs text-muted-foreground">
              {form.notes.length}/500
            </p>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={submitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={!canSubmit}>
              {submitting
                ? "Saving..."
                : isEdit
                  ? "Save changes"
                  : "Create room"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
