import { useCallback, useEffect, useMemo, useState } from "react"
import { useNavigate, useSearchParams } from "react-router-dom"
import {
  AlertCircle,
  CalendarPlus,
  Clock,
  Crown,
  RefreshCw,
  Search,
} from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Topbar } from "@/src/layouts/Topbar"
import { ApiRequestError } from "@/src/models/api"
import {
  RESERVATION_STATUS_LABEL,
  type Reservation,
  type ReservationStatus,
} from "@/src/models/reservation"
import {
  formatCurrency,
  formatDateTime,
  formatDuration,
} from "@/src/utils/format"
import { useReservations } from "@/src/contexts/ReservationContext"
import { useRooms } from "@/src/contexts/RoomContext"
import { useSessions } from "@/src/contexts/SessionContext"
import { ReservationStatusBadge } from "@/src/views/components/ReservationStatusBadge"
import { ReservationFilters } from "@/src/views/components/ReservationFilters"
import { ReservationForm } from "@/src/views/components/ReservationForm"
import { ReservationDetailSheet } from "@/src/views/components/ReservationDetailSheet"

const FILTER_VALUES = new Set<string>([
  "all",
  "pending",
  "confirmed",
  "checked_in",
  "cancelled",
])

export default function ReservationsPage() {
  const navigate = useNavigate()
  const {
    reservations,
    isLoading,
    error,
    selectedStatus,
    setSelectedStatus,
    filteredReservations,
    statusCounts,
    load,
    create,
    update,
    cancel,
    checkIn,
  } = useReservations()

  const { rooms, load: loadRooms } = useRooms()
  const { createFromReservation } = useSessions()

  const [searchParams, setSearchParams] = useSearchParams()
  const [search, setSearch] = useState("")
  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<Reservation | null>(null)
  const [detailId, setDetailId] = useState<string | null>(null)
  const [detailOpen, setDetailOpen] = useState(false)

  useEffect(() => {
    void load()
    if (rooms.length === 0) void loadRooms()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    const qp = searchParams.get("status")
    if (qp && FILTER_VALUES.has(qp)) {
      setSelectedStatus(qp as ReservationStatus | "all")
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const activeDetail = useMemo(
    () => reservations.find((r) => r.id === detailId) ?? null,
    [reservations, detailId],
  )

  const visible = useMemo(() => {
    const list = filteredReservations
    if (!search.trim()) return list
    const q = search.trim().toLowerCase()
    return list.filter(
      (r) =>
        r.customerName.toLowerCase().includes(q) ||
        r.customerPhone.toLowerCase().includes(q) ||
        r.roomSnapshot.code.toLowerCase().includes(q) ||
        r.roomSnapshot.name.toLowerCase().includes(q),
    )
  }, [filteredReservations, search])

  const onFilterChange = useCallback(
    (next: ReservationStatus | "all") => {
      setSelectedStatus(next)
      setSearchParams(
        next === "all" ? {} : { status: next },
        { replace: true },
      )
    },
    [setSelectedStatus, setSearchParams],
  )

  const openDetail = useCallback((r: Reservation) => {
    setDetailId(r.id)
    setDetailOpen(true)
  }, [])

  const openCreate = () => {
    setEditing(null)
    setFormOpen(true)
  }

  const openEdit = (r: Reservation) => {
    setEditing(r)
    setDetailOpen(false)
    setFormOpen(true)
  }

  const handleCancel = useCallback(
    async (r: Reservation) => {
      try {
        const updated = await cancel(r.id)
        toast.success("Reservation cancelled", {
          description: `${updated.customerName} — ${updated.roomSnapshot.code}`,
        })
      } catch (err) {
        const msg =
          err instanceof ApiRequestError
            ? err.message
            : "Failed to cancel reservation."
        toast.error("Could not cancel", { description: msg })
      }
    },
    [cancel],
  )

  const handleCheckIn = useCallback(
    async (r: Reservation) => {
      try {
        const result = await checkIn(r.id)
        toast.success("Checked in", {
          description: `${result.reservation.customerName} — open a session when ready.`,
          action: {
            label: "Start session",
            onClick: () => {
              void handleStartSession(result.reservation)
            },
          },
        })
      } catch (err) {
        const msg =
          err instanceof ApiRequestError
            ? err.message
            : "Failed to check in reservation."
        toast.error("Could not check in", { description: msg })
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [checkIn],
  )

  const handleStartSession = useCallback(
    async (r: Reservation) => {
      try {
        const session = await createFromReservation(r.id)
        toast.success("Session started", {
          description: `${session.roomRateSnapshot.code} — ${session.customerName}`,
        })
        setDetailOpen(false)
        navigate(`/sessions/${session.id}`)
      } catch (err) {
        const msg =
          err instanceof ApiRequestError
            ? err.message
            : "Failed to start session."
        toast.error("Could not start session", { description: msg })
      }
    },
    [createFromReservation, navigate],
  )

  return (
    <>
      <Topbar
        title="Reservations"
        subtitle="Upcoming bookings, arrivals, and lifecycle management."
        actions={
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => load()}
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
              <CalendarPlus className="h-4 w-4" aria-hidden="true" />
              New reservation
            </Button>
          </div>
        }
      />

      <main className="flex-1 overflow-y-auto p-6">
        <div className="mx-auto flex max-w-7xl flex-col gap-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <ReservationFilters
              selected={selectedStatus}
              counts={statusCounts}
              onChange={onFilterChange}
            />
            <div className="relative w-full lg:w-72">
              <Search
                className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
                aria-hidden="true"
              />
              <Input
                type="search"
                placeholder="Search by customer, phone, or room"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
                aria-label="Search reservations"
              />
            </div>
          </div>

          {error ? (
            <div
              role="alert"
              className="flex items-start gap-3 rounded-md border border-destructive/30 bg-destructive/5 p-4 text-sm"
            >
              <AlertCircle
                className="mt-0.5 h-4 w-4 text-destructive"
                aria-hidden="true"
              />
              <div className="flex-1">
                <p className="font-medium text-destructive">
                  Failed to load reservations
                </p>
                <p className="text-muted-foreground">{error}</p>
              </div>
              <Button size="sm" variant="outline" onClick={() => load()}>
                Retry
              </Button>
            </div>
          ) : null}

          {isLoading && reservations.length === 0 ? (
            <div className="flex flex-col gap-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-14 rounded-md" />
              ))}
            </div>
          ) : visible.length === 0 ? (
            <Empty className="rounded-xl border border-dashed border-border bg-card/40 py-16">
              <EmptyHeader>
                <EmptyMedia variant="icon">
                  <CalendarPlus className="h-5 w-5" aria-hidden="true" />
                </EmptyMedia>
                <EmptyTitle>No reservations yet</EmptyTitle>
                <EmptyDescription>
                  {search || selectedStatus !== "all"
                    ? "Try clearing filters, or create a new reservation."
                    : "Create your first reservation to start tracking upcoming bookings."}
                </EmptyDescription>
              </EmptyHeader>
              <EmptyContent>
                <div className="flex gap-2">
                  {search || selectedStatus !== "all" ? (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setSearch("")
                        onFilterChange("all")
                      }}
                    >
                      Clear filters
                    </Button>
                  ) : null}
                  <Button size="sm" onClick={openCreate}>
                    New reservation
                  </Button>
                </div>
              </EmptyContent>
            </Empty>
          ) : (
            <Card className="overflow-hidden p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Customer</TableHead>
                      <TableHead>Room</TableHead>
                      <TableHead>Time</TableHead>
                      <TableHead>Duration</TableHead>
                      <TableHead>Deposit</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {visible.map((r) => (
                      <TableRow
                        key={r.id}
                        className="cursor-pointer"
                        onClick={() => openDetail(r)}
                      >
                        <TableCell>
                          <div className="flex min-w-0 flex-col">
                            <span className="font-medium text-foreground">
                              {r.customerName}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              {r.customerPhone || "—"}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-foreground">
                              {r.roomSnapshot.code}
                            </span>
                            {r.roomSnapshot.type === "vip" ? (
                              <span
                                className="inline-flex items-center gap-0.5 rounded-md bg-primary/10 px-1.5 py-0.5 text-[10px] font-semibold uppercase text-primary"
                                title="VIP"
                              >
                                <Crown
                                  className="h-3 w-3"
                                  aria-hidden="true"
                                />
                                VIP
                              </span>
                            ) : null}
                            <span className="truncate text-xs text-muted-foreground">
                              {r.roomSnapshot.name}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1.5 text-sm">
                            <Clock
                              className="h-3.5 w-3.5 text-muted-foreground"
                              aria-hidden="true"
                            />
                            <span className="tabular-nums">
                              {formatDateTime(r.reservedStartTime)}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="tabular-nums">
                          {formatDuration(r.expectedDuration)}
                        </TableCell>
                        <TableCell className="tabular-nums">
                          {formatCurrency(r.depositAmount)}
                        </TableCell>
                        <TableCell>
                          <ReservationStatusBadge status={r.status} size="sm" />
                        </TableCell>
                        <TableCell
                          className="text-right"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <RowActions
                            reservation={r}
                            onCheckIn={handleCheckIn}
                            onStartSession={handleStartSession}
                            onEdit={openEdit}
                          />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </Card>
          )}

          {reservations.length > 0 ? (
            <p className="text-xs text-muted-foreground">
              Showing {visible.length} of {reservations.length}{" "}
              {reservations.length === 1 ? "reservation" : "reservations"}
              {selectedStatus !== "all"
                ? ` in "${RESERVATION_STATUS_LABEL[selectedStatus]}"`
                : ""}
              .
            </p>
          ) : null}
        </div>
      </main>

      <ReservationForm
        open={formOpen}
        onOpenChange={setFormOpen}
        reservation={editing}
        rooms={rooms}
        onCreate={create}
        onUpdate={update}
      />

      <ReservationDetailSheet
        reservation={activeDetail}
        open={detailOpen}
        onOpenChange={setDetailOpen}
        onEdit={openEdit}
        onCancel={handleCancel}
        onCheckIn={handleCheckIn}
        onStartSession={handleStartSession}
      />
    </>
  )
}

function RowActions({
  reservation,
  onCheckIn,
  onStartSession,
  onEdit,
}: {
  reservation: Reservation
  onCheckIn(r: Reservation): Promise<void>
  onStartSession(r: Reservation): Promise<void>
  onEdit(r: Reservation): void
}) {
  const { status } = reservation
  if (status === "checked_in") {
    return (
      <Button
        size="sm"
        onClick={() => onStartSession(reservation)}
        className="gap-1.5"
      >
        Start session
      </Button>
    )
  }
  if (status === "pending" || status === "confirmed") {
    return (
      <div className="flex items-center justify-end gap-1">
        <Button
          size="sm"
          variant="ghost"
          onClick={() => onEdit(reservation)}
        >
          Edit
        </Button>
        <Button size="sm" onClick={() => onCheckIn(reservation)}>
          Check in
        </Button>
      </div>
    )
  }
  return (
    <span className="text-xs text-muted-foreground">—</span>
  )
}
