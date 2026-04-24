import { useEffect } from "react"
import { useNavigate } from "react-router-dom"
import {
  BarChart3,
  CalendarPlus,
  DoorOpen,
  PlayCircle,
  RefreshCw,
  Sparkles,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Topbar } from "@/src/layouts/Topbar"
import { StatCard } from "@/src/views/components/StatCard"
import { RoomStatusBadge } from "@/src/views/components/RoomStatusBadge"
import { useRooms } from "@/src/contexts/RoomContext"
import { useAuth } from "@/src/contexts/AuthContext"
import { ROOM_STATUS_LABEL } from "@/src/models/room"
import { formatCurrency } from "@/src/utils/format"

export default function DashboardPage() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const { rooms, statusCounts, isLoading, load } = useRooms()

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const greeting = getGreeting()
  const recentlyUpdated = [...rooms]
    .sort(
      (a, b) =>
        new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
    )
    .slice(0, 5)

  return (
    <>
      <Topbar
        title="Dashboard"
        subtitle={`${greeting}${user?.name ? `, ${user.name}` : ""} — here is the current state of operations.`}
        actions={
          <Button
            variant="outline"
            size="sm"
            onClick={() => load()}
            className="gap-2"
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
          {/* Summary cards */}
          <section aria-labelledby="summary-heading">
            <div className="mb-3 flex items-center justify-between">
              <h2
                id="summary-heading"
                className="text-sm font-medium text-muted-foreground"
              >
                Operational summary
              </h2>
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <StatCard
                label="Available"
                value={statusCounts.available}
                helper="Rooms ready to sell"
                dotClass="bg-[color:var(--status-available)]"
                accentClass="bg-[color:var(--status-available)]"
                isLoading={isLoading && rooms.length === 0}
              />
              <StatCard
                label="Reserved"
                value={statusCounts.reserved}
                helper="Confirmed upcoming bookings"
                dotClass="bg-[color:var(--status-reserved)]"
                accentClass="bg-[color:var(--status-reserved)]"
                isLoading={isLoading && rooms.length === 0}
              />
              <StatCard
                label="Occupied"
                value={statusCounts.occupied}
                helper="Rooms with active sessions"
                dotClass="bg-[color:var(--status-occupied)]"
                accentClass="bg-[color:var(--status-occupied)]"
                isLoading={isLoading && rooms.length === 0}
              />
              <StatCard
                label="Cleaning"
                value={statusCounts.cleaning}
                helper="Turnovers in progress"
                dotClass="bg-[color:var(--status-cleaning)]"
                accentClass="bg-[color:var(--status-cleaning)]"
                isLoading={isLoading && rooms.length === 0}
              />
            </div>
          </section>

          {/* Quick actions */}
          <section aria-labelledby="quick-actions-heading" className="grid gap-6 lg:grid-cols-3">
            <Card className="lg:col-span-2">
              <CardHeader className="pb-3">
                <CardTitle
                  id="quick-actions-heading"
                  className="flex items-center gap-2 text-base"
                >
                  <Sparkles
                    className="h-4 w-4 text-primary"
                    aria-hidden="true"
                  />
                  Quick actions
                </CardTitle>
                <CardDescription>
                  Jump into the most common front-desk workflows.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <QuickAction
                    title="Start walk-in session"
                    description="Open a new session for an available room."
                    icon={<PlayCircle className="h-5 w-5" />}
                    onClick={() => navigate("/rooms?status=available")}
                  />
                  <QuickAction
                    title="Create reservation"
                    description="Book a room in advance for a customer."
                    icon={<CalendarPlus className="h-5 w-5" />}
                    onClick={() => navigate("/reservations")}
                  />
                  <QuickAction
                    title="Open rooms page"
                    description="Manage all room statuses and activity."
                    icon={<DoorOpen className="h-5 w-5" />}
                    onClick={() => navigate("/rooms")}
                  />
                  <QuickAction
                    title="View reports"
                    description="Review revenue and session history."
                    icon={<BarChart3 className="h-5 w-5" />}
                    onClick={() => navigate("/reports")}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Status breakdown */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Status breakdown</CardTitle>
                <CardDescription>
                  {statusCounts.total}{" "}
                  {statusCounts.total === 1 ? "room" : "rooms"} total
                </CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col gap-3">
                {(["available", "reserved", "occupied", "cleaning", "maintenance"] as const).map(
                  (s) => {
                    const count = statusCounts[s]
                    const pct =
                      statusCounts.total > 0
                        ? Math.round((count / statusCounts.total) * 100)
                        : 0
                    return (
                      <div key={s} className="flex flex-col gap-1.5">
                        <div className="flex items-center justify-between text-sm">
                          <div className="flex items-center gap-2">
                            <span
                              aria-hidden="true"
                              className="h-2 w-2 rounded-full"
                              style={{
                                backgroundColor: `var(--status-${s})`,
                              }}
                            />
                            <span className="text-foreground">
                              {ROOM_STATUS_LABEL[s]}
                            </span>
                          </div>
                          <span className="tabular-nums text-muted-foreground">
                            {count} &middot; {pct}%
                          </span>
                        </div>
                        <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
                          <div
                            className="h-full rounded-full transition-all"
                            style={{
                              width: `${pct}%`,
                              backgroundColor: `var(--status-${s})`,
                            }}
                          />
                        </div>
                      </div>
                    )
                  },
                )}
              </CardContent>
            </Card>
          </section>

          {/* Recent activity */}
          <section aria-labelledby="recent-heading">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle id="recent-heading" className="text-base">
                  Recently updated rooms
                </CardTitle>
                <CardDescription>
                  Latest status changes across the floor.
                </CardDescription>
              </CardHeader>
              <CardContent>
                {recentlyUpdated.length === 0 ? (
                  <p className="py-8 text-center text-sm text-muted-foreground">
                    {isLoading ? "Loading rooms..." : "No rooms to show yet."}
                  </p>
                ) : (
                  <ul className="divide-y divide-border">
                    {recentlyUpdated.map((room) => (
                      <li
                        key={room.id}
                        className="flex items-center justify-between gap-4 py-3 first:pt-0 last:pb-0"
                      >
                        <div className="flex min-w-0 flex-col">
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-foreground">
                              {room.code}
                            </span>
                            <span className="truncate text-sm text-muted-foreground">
                              {room.name}
                            </span>
                          </div>
                          <p className="text-xs text-muted-foreground">
                            {room.type.toUpperCase()} &middot; Cap {room.capacity} &middot;{" "}
                            {formatCurrency(room.hourlyRate)}/hr
                          </p>
                        </div>
                        <RoomStatusBadge status={room.status} />
                      </li>
                    ))}
                  </ul>
                )}
              </CardContent>
            </Card>
          </section>
        </div>
      </main>
    </>
  )
}

function QuickAction({
  title,
  description,
  icon,
  onClick,
}: {
  title: string
  description: string
  icon: React.ReactNode
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="group flex items-start gap-3 rounded-lg border border-border bg-background p-4 text-left transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:bg-primary/[0.03] hover:shadow-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
        {icon}
      </div>
      <div className="flex min-w-0 flex-col gap-0.5">
        <p className="text-sm font-medium text-foreground">{title}</p>
        <p className="text-xs text-muted-foreground">{description}</p>
      </div>
    </button>
  )
}

function getGreeting(): string {
  const h = new Date().getHours()
  if (h < 5) return "Good night"
  if (h < 12) return "Good morning"
  if (h < 18) return "Good afternoon"
  return "Good evening"
}
