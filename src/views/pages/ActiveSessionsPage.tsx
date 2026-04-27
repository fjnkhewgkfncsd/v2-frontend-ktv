import { useCallback, useEffect, useMemo, useState } from "react"
import { useNavigate } from "react-router-dom"
import { AlertCircle, PlayCircle, RefreshCw, Search } from "lucide-react"
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
import { SessionCard } from "@/src/views/components/SessionCard"
import { WalkInSessionDialog } from "@/src/views/components/WalkInSessionDialog"
import { OrderProductsDialog } from "@/src/views/components/OrderProductsDialog"
import { CheckoutDialog } from "@/src/views/components/CheckoutDialog"
import { useSessions } from "@/src/contexts/SessionContext"
import { useRooms } from "@/src/contexts/RoomContext"
import type { Session } from "@/src/models/session"

export default function ActiveSessionsPage() {
  const navigate = useNavigate()
  const {
    sessions,
    isLoading,
    error,
    load,
    createWalkIn,
    addItems,
    checkout,
  } = useSessions()
  const { rooms, load: loadRooms } = useRooms()

  const [search, setSearch] = useState("")
  const [walkInOpen, setWalkInOpen] = useState(false)
  const [orderSession, setOrderSession] = useState<Session | null>(null)
  const [orderOpen, setOrderOpen] = useState(false)
  const [checkoutSession, setCheckoutSession] = useState<Session | null>(null)
  const [checkoutOpen, setCheckoutOpen] = useState(false)

  useEffect(() => {
    void load()
    if (rooms.length === 0) void loadRooms()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const visible = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return sessions
    return sessions.filter(
      (s) =>
        s.customerName.toLowerCase().includes(q) ||
        s.customerPhone.toLowerCase().includes(q) ||
        s.roomRateSnapshot.code.toLowerCase().includes(q) ||
        s.roomRateSnapshot.name.toLowerCase().includes(q),
    )
  }, [sessions, search])

  const openDetail = useCallback(
    (s: Session) => navigate(`/sessions/${s.id}`),
    [navigate],
  )

  const openOrder = useCallback((s: Session) => {
    setOrderSession(s)
    setOrderOpen(true)
  }, [])

  const openCheckout = useCallback((s: Session) => {
    setCheckoutSession(s)
    setCheckoutOpen(true)
  }, [])

  return (
    <>
      <Topbar
        title="Active Sessions"
        subtitle="Rooms currently open — add items and track live totals."
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
            <Button
              size="sm"
              className="gap-2"
              onClick={() => setWalkInOpen(true)}
            >
              <PlayCircle className="h-4 w-4" aria-hidden="true" />
              New walk-in
            </Button>
          </div>
        }
      />

      <main className="flex-1 overflow-y-auto p-6">
        <div className="mx-auto flex max-w-7xl flex-col gap-6">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <p className="text-sm text-muted-foreground">
              {sessions.length} active{" "}
              {sessions.length === 1 ? "session" : "sessions"} on the floor.
            </p>
            <div className="relative w-full lg:w-72">
              <Search
                className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
                aria-hidden="true"
              />
              <Input
                type="search"
                placeholder="Search by customer or room"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
                aria-label="Search sessions"
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
                  Failed to load active sessions
                </p>
                <p className="text-muted-foreground">{error}</p>
              </div>
              <Button size="sm" variant="outline" onClick={() => load()}>
                Retry
              </Button>
            </div>
          ) : null}

          {isLoading && sessions.length === 0 ? (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="h-48 rounded-lg" />
              ))}
            </div>
          ) : visible.length === 0 ? (
            <Empty className="rounded-xl border border-dashed border-border bg-card/40 py-16">
              <EmptyHeader>
                <EmptyMedia variant="icon">
                  <PlayCircle className="h-5 w-5" aria-hidden="true" />
                </EmptyMedia>
                <EmptyTitle>
                  {sessions.length === 0
                    ? "No active sessions"
                    : "No matches"}
                </EmptyTitle>
                <EmptyDescription>
                  {sessions.length === 0
                    ? "Start a walk-in session for a guest, or check in a reservation."
                    : "Try a different search term."}
                </EmptyDescription>
              </EmptyHeader>
              <EmptyContent>
                <div className="flex gap-2">
                  {sessions.length === 0 ? (
                    <Button size="sm" onClick={() => setWalkInOpen(true)}>
                      Open walk-in session
                    </Button>
                  ) : (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setSearch("")}
                    >
                      Clear search
                    </Button>
                  )}
                </div>
              </EmptyContent>
            </Empty>
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {visible.map((s) => (
                <SessionCard
                  key={s.id}
                  session={s}
                  onOpen={openDetail}
                  onOrder={openOrder}
                  onCheckout={openCheckout}
                />
              ))}
            </div>
          )}
        </div>
      </main>

      <WalkInSessionDialog
        open={walkInOpen}
        onOpenChange={setWalkInOpen}
        rooms={rooms}
        onCreate={createWalkIn}
        onCreated={(s) => navigate(`/sessions/${s.id}`)}
      />

      <OrderProductsDialog
        open={orderOpen}
        onOpenChange={setOrderOpen}
        session={orderSession}
        onSubmit={addItems}
      />

      <CheckoutDialog
        open={checkoutOpen}
        onOpenChange={setCheckoutOpen}
        session={checkoutSession}
        onCheckout={async (sessionId, input) => {
          const result = await checkout(sessionId, input)
          return { invoice: result.invoice }
        }}
        onViewInvoice={(invoice) => {
          setCheckoutOpen(false)
          navigate(`/invoices/${invoice.id}`)
        }}
      />
    </>
  )
}
