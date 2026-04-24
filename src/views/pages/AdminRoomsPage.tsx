import { useCallback, useEffect, useMemo, useState } from "react"
import {
  AlertCircle,
  Crown,
  DoorOpen,
  Pencil,
  Plus,
  RefreshCw,
  Search,
} from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Badge } from "@/components/ui/badge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Topbar } from "@/src/layouts/Topbar"
import { ApiRequestError } from "@/src/models/api"
import {
  ROOM_STATUS_LABEL,
  ROOM_STATUS_ORDER,
  type Room,
  type RoomStatus,
} from "@/src/models/room"
import { formatCurrency, formatDateTime } from "@/src/utils/format"
import { useRooms } from "@/src/contexts/RoomContext"
import { useAuth } from "@/src/contexts/AuthContext"
import { ErrorBanner } from "@/src/views/components/ErrorBanner"
import { EmptyState } from "@/src/views/components/EmptyState"
import { RoomStatusBadge } from "@/src/views/components/RoomStatusBadge"
import { RoomFormDialog } from "@/src/views/components/admin/RoomFormDialog"
import { ConfirmDialog } from "@/src/views/components/ConfirmDialog"

export default function AdminRoomsPage() {
  const { user } = useAuth()
  const {
    rooms,
    isLoading,
    error,
    load,
    create,
    update,
    updateStatus,
  } = useRooms()

  const [search, setSearch] = useState("")
  const [typeFilter, setTypeFilter] = useState<"all" | "standard" | "vip">("all")
  const [statusFilter, setStatusFilter] = useState<RoomStatus | "all">("all")
  const [activeFilter, setActiveFilter] = useState<"all" | "active" | "inactive">(
    "all",
  )

  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<Room | null>(null)

  const [deactivateTarget, setDeactivateTarget] = useState<Room | null>(null)

  useEffect(() => {
    if (rooms.length === 0) void load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const visible = useMemo(() => {
    let list = rooms
    if (typeFilter !== "all") list = list.filter((r) => r.type === typeFilter)
    if (statusFilter !== "all")
      list = list.filter((r) => r.status === statusFilter)
    if (activeFilter !== "all")
      list = list.filter((r) =>
        activeFilter === "active" ? r.isActive : !r.isActive,
      )
    if (search.trim()) {
      const q = search.trim().toLowerCase()
      list = list.filter(
        (r) =>
          r.code.toLowerCase().includes(q) ||
          r.name.toLowerCase().includes(q) ||
          r.notes.toLowerCase().includes(q),
      )
    }
    return [...list].sort((a, b) => a.code.localeCompare(b.code))
  }, [rooms, typeFilter, statusFilter, activeFilter, search])

  const openCreate = () => {
    setEditing(null)
    setFormOpen(true)
  }

  const openEdit = (r: Room) => {
    setEditing(r)
    setFormOpen(true)
  }

  const handleStatusChange = useCallback(
    async (r: Room, next: RoomStatus) => {
      if (next === r.status) return
      if (
        (next === "occupied" && !r.currentSessionId) ||
        (next === "reserved" && !r.activeReservationId)
      ) {
        toast.error(
          next === "occupied"
            ? "Rooms can only be set to occupied by starting a session."
            : "Rooms can only be set to reserved by a reservation flow.",
        )
        return
      }
      try {
        const updated = await updateStatus(r.id, { status: next })
        if (updated) {
          toast.success("Status updated", {
            description: `${updated.code} → ${ROOM_STATUS_LABEL[updated.status]}`,
          })
        }
      } catch (err) {
        const msg =
          err instanceof ApiRequestError ? err.message : "Status update failed."
        toast.error("Could not update", { description: msg })
      }
    },
    [updateStatus],
  )

  const handleToggleActive = useCallback(
    async (r: Room) => {
      try {
        const next = !r.isActive
        await update(r.id, { isActive: next })
        toast.success(next ? "Room activated" : "Room deactivated", {
          description: r.code,
        })
      } catch (err) {
        const msg =
          err instanceof ApiRequestError
            ? err.message
            : "Could not toggle active state."
        toast.error("Update failed", { description: msg })
      }
    },
    [update],
  )

  if (user?.role !== "admin") {
    return (
      <>
        <Topbar
          title="Admin · Rooms"
          subtitle="Manage the room master catalog."
        />
        <main className="flex-1 overflow-y-auto p-6">
          <EmptyState
            icon={AlertCircle}
            title="Admin only"
            description="You need admin permissions to manage rooms. Ask an administrator for access."
          />
        </main>
      </>
    )
  }

  return (
    <>
      <Topbar
        title="Admin · Rooms"
        subtitle="Create rooms, tune pricing and capacity, and control availability."
        actions={
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => void load()}
              className="gap-2"
              disabled={isLoading}
            >
              <RefreshCw
                className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`}
                aria-hidden="true"
              />
              Refresh
            </Button>
            <Button size="sm" className="gap-2" onClick={openCreate}>
              <Plus className="h-4 w-4" aria-hidden="true" />
              New room
            </Button>
          </div>
        }
      />

      <main className="flex-1 overflow-y-auto p-6">
        <div className="mx-auto flex max-w-7xl flex-col gap-5">
          <Card className="p-4">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              <div className="relative w-full lg:max-w-sm">
                <Search
                  className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
                  aria-hidden="true"
                />
                <Input
                  type="search"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search by code, name, or notes"
                  className="pl-9"
                  aria-label="Search rooms"
                />
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <Select
                  value={typeFilter}
                  onValueChange={(v) => setTypeFilter(v as typeof typeFilter)}
                >
                  <SelectTrigger className="h-9 w-[140px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All types</SelectItem>
                    <SelectItem value="standard">Standard</SelectItem>
                    <SelectItem value="vip">VIP</SelectItem>
                  </SelectContent>
                </Select>
                <Select
                  value={statusFilter}
                  onValueChange={(v) =>
                    setStatusFilter(v as RoomStatus | "all")
                  }
                >
                  <SelectTrigger className="h-9 w-[160px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All statuses</SelectItem>
                    {ROOM_STATUS_ORDER.map((s) => (
                      <SelectItem key={s} value={s}>
                        {ROOM_STATUS_LABEL[s]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select
                  value={activeFilter}
                  onValueChange={(v) =>
                    setActiveFilter(v as typeof activeFilter)
                  }
                >
                  <SelectTrigger className="h-9 w-[140px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All rooms</SelectItem>
                    <SelectItem value="active">Active only</SelectItem>
                    <SelectItem value="inactive">Inactive only</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </Card>

          {error ? (
            <ErrorBanner
              title="Failed to load rooms"
              message={error}
              onRetry={() => void load()}
            />
          ) : null}

          {isLoading && rooms.length === 0 ? (
            <div className="flex flex-col gap-2">
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="h-14 rounded-md" />
              ))}
            </div>
          ) : visible.length === 0 ? (
            <EmptyState
              icon={DoorOpen}
              title={rooms.length === 0 ? "No rooms yet" : "No matching rooms"}
              description={
                rooms.length === 0
                  ? "Add your first room to start managing bookings and sessions."
                  : "Try clearing filters or adjusting your search."
              }
              action={
                rooms.length === 0 ? (
                  <Button size="sm" onClick={openCreate} className="gap-2">
                    <Plus className="h-4 w-4" aria-hidden="true" />
                    New room
                  </Button>
                ) : (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setSearch("")
                      setTypeFilter("all")
                      setStatusFilter("all")
                      setActiveFilter("all")
                    }}
                  >
                    Clear filters
                  </Button>
                )
              }
            />
          ) : (
            <Card className="overflow-hidden p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Code</TableHead>
                      <TableHead>Name</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead className="text-right">Capacity</TableHead>
                      <TableHead className="text-right">Hourly rate</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Active</TableHead>
                      <TableHead>Updated</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {visible.map((r) => (
                      <TableRow key={r.id}>
                        <TableCell className="font-medium tabular-nums">
                          {r.code}
                        </TableCell>
                        <TableCell>
                          <div className="flex min-w-0 flex-col">
                            <span className="truncate text-foreground">
                              {r.name}
                            </span>
                            {r.notes ? (
                              <span
                                className="truncate text-xs text-muted-foreground"
                                title={r.notes}
                              >
                                {r.notes}
                              </span>
                            ) : null}
                          </div>
                        </TableCell>
                        <TableCell>
                          {r.type === "vip" ? (
                            <Badge className="gap-1 bg-primary/10 text-primary hover:bg-primary/15">
                              <Crown className="h-3 w-3" aria-hidden="true" />
                              VIP
                            </Badge>
                          ) : (
                            <Badge variant="secondary">Standard</Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-right tabular-nums">
                          {r.capacity}
                        </TableCell>
                        <TableCell className="text-right tabular-nums">
                          {formatCurrency(r.hourlyRate)}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <RoomStatusBadge status={r.status} size="sm" />
                            <Select
                              value={r.status}
                              onValueChange={(v) =>
                                handleStatusChange(r, v as RoomStatus)
                              }
                            >
                              <SelectTrigger
                                className="h-7 w-[120px] text-xs"
                                aria-label={`Change status for ${r.code}`}
                              >
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
                        </TableCell>
                        <TableCell>
                          {r.isActive ? (
                            <Badge
                              variant="outline"
                              className="border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"
                            >
                              Active
                            </Badge>
                          ) : (
                            <Badge
                              variant="outline"
                              className="border-muted-foreground/30 text-muted-foreground"
                            >
                              Inactive
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground tabular-nums">
                          {formatDateTime(r.updatedAt)}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Button
                              size="sm"
                              variant="ghost"
                              className="gap-1.5"
                              onClick={() => openEdit(r)}
                            >
                              <Pencil className="h-3.5 w-3.5" aria-hidden="true" />
                              Edit
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() =>
                                r.isActive
                                  ? setDeactivateTarget(r)
                                  : void handleToggleActive(r)
                              }
                              className={
                                r.isActive
                                  ? "text-destructive hover:text-destructive"
                                  : ""
                              }
                            >
                              {r.isActive ? "Deactivate" : "Activate"}
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </Card>
          )}

          {rooms.length > 0 ? (
            <p className="text-xs text-muted-foreground">
              Showing {visible.length} of {rooms.length} rooms.
            </p>
          ) : null}
        </div>
      </main>

      <RoomFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        room={editing}
        onCreate={create}
        onUpdate={update}
      />

      <ConfirmDialog
        open={!!deactivateTarget}
        onOpenChange={(open) => {
          if (!open) setDeactivateTarget(null)
        }}
        title={`Deactivate ${deactivateTarget?.code ?? "room"}?`}
        description="Inactive rooms are hidden from booking and session flows. You can reactivate anytime. History and reports are unaffected."
        confirmLabel="Deactivate"
        tone="destructive"
        onConfirm={async () => {
          if (deactivateTarget) {
            await handleToggleActive(deactivateTarget)
            setDeactivateTarget(null)
          }
        }}
      />
    </>
  )
}
