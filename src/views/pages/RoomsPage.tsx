import { useCallback, useEffect, useMemo, useState } from "react"
import { useNavigate, useSearchParams } from "react-router-dom"
import { AlertCircle, RefreshCw, Search } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty"
import { Skeleton } from "@/components/ui/skeleton"
import { Topbar } from "@/src/layouts/Topbar"
import { RoomCard } from "@/src/views/components/RoomCard"
import { RoomFilters } from "@/src/views/components/RoomFilters"
import { RoomDetailSheet } from "@/src/views/components/RoomDetailSheet"
import { ReservationForm } from "@/src/views/components/ReservationForm"
import { WalkInSessionDialog } from "@/src/views/components/WalkInSessionDialog"
import { useRooms } from "@/src/contexts/RoomContext"
import { useReservations } from "@/src/contexts/ReservationContext"
import { useSessions } from "@/src/contexts/SessionContext"
import {
  ROOM_STATUS_LABEL,
  type Room,
  type RoomStatus,
} from "@/src/models/room"

const FILTER_VALUES = new Set<string>([
  "all",
  "available",
  "reserved",
  "occupied",
  "cleaning",
  "maintenance",
])

export default function RoomsPage() {
  const navigate = useNavigate()
  const {
    rooms,
    isLoading,
    error,
    selectedStatus,
    setSelectedStatus,
    filteredRooms,
    statusCounts,
    load,
    updateStatus,
  } = useRooms()

  const { create: createReservation } = useReservations()
  const { sessions, load: loadSessions, createWalkIn } = useSessions()

  const [searchParams, setSearchParams] = useSearchParams()
  const [search, setSearch] = useState("")
  const [activeRoomId, setActiveRoomId] = useState<string | null>(null)
  const [isSheetOpen, setIsSheetOpen] = useState(false)
  const [isUpdating, setIsUpdating] = useState(false)

  const [reserveRoomId, setReserveRoomId] = useState<string | null>(null)
  const [reserveOpen, setReserveOpen] = useState(false)

  const [walkInRoomId, setWalkInRoomId] = useState<string | null>(null)
  const [walkInOpen, setWalkInOpen] = useState(false)

  // Initial load
  useEffect(() => {
    load()
    if (sessions.length === 0) void loadSessions()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Sync status filter with ?status= query param (dashboard quick actions)
  useEffect(() => {
    const qp = searchParams.get("status")
    if (qp && FILTER_VALUES.has(qp)) {
      setSelectedStatus(qp as RoomStatus | "all")
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const activeRoom = useMemo(
    () => rooms.find((r) => r.id === activeRoomId) ?? null,
    [rooms, activeRoomId],
  )

  const visibleRooms = useMemo(() => {
    if (!search.trim()) return filteredRooms
    const q = search.trim().toLowerCase()
    return filteredRooms.filter(
      (r) =>
        r.code.toLowerCase().includes(q) ||
        r.name.toLowerCase().includes(q) ||
        r.type.toLowerCase().includes(q),
    )
  }, [filteredRooms, search])

  const onFilterChange = useCallback(
    (next: RoomStatus | "all") => {
      setSelectedStatus(next)
      setSearchParams(
        next === "all" ? {} : { status: next },
        { replace: true },
      )
    },
    [setSelectedStatus, setSearchParams],
  )

  const openDetail = useCallback((room: Room) => {
    setActiveRoomId(room.id)
    setIsSheetOpen(true)
  }, [])

  const openReserve = useCallback((room: Room) => {
    setReserveRoomId(room.id)
    setReserveOpen(true)
    setIsSheetOpen(false)
  }, [])

  const openWalkIn = useCallback((room: Room) => {
    setWalkInRoomId(room.id)
    setWalkInOpen(true)
    setIsSheetOpen(false)
  }, [])

  const openExistingSession = useCallback(
    (room: Room) => {
      const active = sessions.find(
        (s) => s.roomId === room.id && s.status === "open",
      )
      if (active) {
        navigate(`/sessions/${active.id}`)
      } else {
        // Fallback to active sessions list if we don't have it in cache yet.
        navigate("/sessions")
      }
    },
    [sessions, navigate],
  )

  const handlePrimaryAction = useCallback(
    (room: Room) => {
      if (room.status === "available") {
        openWalkIn(room)
      } else if (room.status === "occupied") {
        openExistingSession(room)
      } else if (room.status === "reserved") {
        navigate("/reservations")
      } else {
        openDetail(room)
      }
    },
    [openWalkIn, openExistingSession, navigate, openDetail],
  )

  const handleStatusChange = useCallback(
    async (next: RoomStatus) => {
      if (!activeRoom) return
      setIsUpdating(true)
      try {
        const updated = await updateStatus(activeRoom.id, { status: next })
        if (updated) {
          toast.success("Room status updated", {
            description: `${updated.code} is now ${ROOM_STATUS_LABEL[next]}.`,
          })
        } else {
          toast.error("Could not update status", {
            description:
              "The backend rejected the change. Please try a different status.",
          })
        }
      } finally {
        setIsUpdating(false)
      }
    },
    [activeRoom, updateStatus],
  )

  const getPrimaryLabel = (room: Room): string => {
    switch (room.status) {
      case "available":
        return "Start session"
      case "reserved":
        return "Check in"
      case "occupied":
        return "Open session"
      case "cleaning":
        return "View details"
      case "maintenance":
        return "View details"
    }
  }

  return (
    <>
      <Topbar
        title="Rooms"
        subtitle="Live floor status and quick actions for receptionists."
        actions={
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
        }
      />
      <main className="flex-1 overflow-y-auto p-6">
        <div className="mx-auto flex max-w-7xl flex-col gap-6">
          {/* Filters + search */}
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <RoomFilters
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
                placeholder="Search by code or name"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
                aria-label="Search rooms"
              />
            </div>
          </div>

          {/* Error */}
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
                  Failed to load rooms
                </p>
                <p className="text-muted-foreground">{error}</p>
              </div>
              <Button size="sm" variant="outline" onClick={() => load()}>
                Retry
              </Button>
            </div>
          ) : null}

          {/* Grid / states */}
          {isLoading && rooms.length === 0 ? (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {Array.from({ length: 8 }).map((_, i) => (
                <Skeleton key={i} className="h-52 rounded-lg" />
              ))}
            </div>
          ) : visibleRooms.length === 0 ? (
            <Empty className="rounded-xl border border-dashed border-border bg-card/40 py-16">
              <EmptyHeader>
                <EmptyMedia variant="icon">
                  <Search className="h-5 w-5" aria-hidden="true" />
                </EmptyMedia>
                <EmptyTitle>No rooms match your filters</EmptyTitle>
                <EmptyDescription>
                  {search
                    ? "Try a different search term or clear the status filter."
                    : "Try clearing the status filter to see all rooms."}
                </EmptyDescription>
              </EmptyHeader>
              <EmptyContent>
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
              </EmptyContent>
            </Empty>
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {visibleRooms.map((room) => (
                <RoomCard
                  key={room.id}
                  room={room}
                  onOpenDetail={openDetail}
                  onPrimaryAction={handlePrimaryAction}
                  primaryActionLabel={getPrimaryLabel(room)}
                />
              ))}
            </div>
          )}

          {/* Footer summary */}
          {rooms.length > 0 ? (
            <p className="text-xs text-muted-foreground">
              Showing {visibleRooms.length} of {rooms.length}{" "}
              {rooms.length === 1 ? "room" : "rooms"}
              {selectedStatus !== "all"
                ? ` with status "${ROOM_STATUS_LABEL[selectedStatus]}"`
                : ""}
              .
            </p>
          ) : null}
        </div>
      </main>

      <RoomDetailSheet
        room={activeRoom}
        open={isSheetOpen}
        onOpenChange={setIsSheetOpen}
        isUpdating={isUpdating}
        onChangeStatus={handleStatusChange}
        onReserve={openReserve}
        onStartWalkIn={openWalkIn}
        onOpenSession={openExistingSession}
      />

      <ReservationForm
        open={reserveOpen}
        onOpenChange={setReserveOpen}
        rooms={rooms}
        defaultRoomId={reserveRoomId ?? undefined}
        onCreate={createReservation}
        onSaved={() => {
          toast.success("Reservation saved")
        }}
      />

      <WalkInSessionDialog
        open={walkInOpen}
        onOpenChange={setWalkInOpen}
        rooms={rooms}
        defaultRoomId={walkInRoomId ?? undefined}
        onCreate={createWalkIn}
        onCreated={(session) => {
          navigate(`/sessions/${session.id}`)
        }}
      />
    </>
  )
}
