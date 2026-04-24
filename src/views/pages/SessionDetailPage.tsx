import { useCallback, useEffect, useState } from "react"
import { Link, useNavigate, useParams } from "react-router-dom"
import {
  AlertCircle,
  ArrowLeft,
  CalendarClock,
  Clock,
  Crown,
  NotebookPen,
  Phone,
  PlayCircle,
  Receipt,
  RefreshCw,
  ShoppingBag,
  User2,
} from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
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
  formatCurrency,
  formatDateTime,
  formatElapsedSince,
} from "@/src/utils/format"
import type { Session } from "@/src/models/session"
import { useSessions } from "@/src/contexts/SessionContext"
import { OrderProductsDialog } from "@/src/views/components/OrderProductsDialog"
import { CheckoutDialog } from "@/src/views/components/CheckoutDialog"

export default function SessionDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { getById, fetchById, addItems, checkout } = useSessions()

  const cached = id ? getById(id) : undefined
  const [session, setSession] = useState<Session | null>(cached ?? null)
  const [isLoading, setIsLoading] = useState(!cached)
  const [error, setError] = useState<string | null>(null)
  const [orderOpen, setOrderOpen] = useState(false)
  const [checkoutOpen, setCheckoutOpen] = useState(false)

  const refresh = useCallback(async () => {
    if (!id) return
    setIsLoading(true)
    setError(null)
    try {
      const fresh = await fetchById(id)
      setSession(fresh)
    } catch (err) {
      const msg =
        err instanceof ApiRequestError
          ? err.message
          : "Failed to load session."
      setError(msg)
    } finally {
      setIsLoading(false)
    }
  }, [id, fetchById])

  useEffect(() => {
    void refresh()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id])

  // Re-sync from cache when context updates after adding items.
  useEffect(() => {
    if (cached && (!session || cached.updatedAt !== session.updatedAt)) {
      setSession(cached)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cached])

  return (
    <>
      <Topbar
        title={
          session
            ? `Session · ${session.roomRateSnapshot.code}`
            : "Session"
        }
        subtitle={
          session
            ? `${session.customerName} · started ${formatDateTime(session.startTime)}`
            : "Viewing session details"
        }
        actions={
          <div className="flex items-center gap-2">
            <Button asChild variant="ghost" size="sm" className="gap-2">
              <Link to="/sessions">
                <ArrowLeft className="h-4 w-4" aria-hidden="true" />
                Back
              </Link>
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={refresh}
              disabled={isLoading}
              className="gap-2"
            >
              <RefreshCw
                className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`}
                aria-hidden="true"
              />
              Refresh
            </Button>
            {session?.status === "open" ? (
              <>
                <Button
                  size="sm"
                  variant="outline"
                  className="gap-2"
                  onClick={() => setOrderOpen(true)}
                >
                  <ShoppingBag className="h-4 w-4" aria-hidden="true" />
                  Add items
                </Button>
                <Button
                  size="sm"
                  className="gap-2"
                  onClick={() => setCheckoutOpen(true)}
                >
                  <Receipt className="h-4 w-4" aria-hidden="true" />
                  Checkout
                </Button>
              </>
            ) : session?.invoiceId ? (
              <Button
                asChild
                size="sm"
                variant="outline"
                className="gap-2"
              >
                <Link to={`/invoices/${session.invoiceId}`}>
                  <Receipt className="h-4 w-4" aria-hidden="true" />
                  View invoice
                </Link>
              </Button>
            ) : null}
          </div>
        }
      />

      <main className="flex-1 overflow-y-auto p-6">
        <div className="mx-auto flex max-w-6xl flex-col gap-6">
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
                  Could not load session
                </p>
                <p className="text-muted-foreground">{error}</p>
              </div>
              <Button size="sm" variant="outline" onClick={refresh}>
                Retry
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => navigate("/sessions")}
              >
                Back to list
              </Button>
            </div>
          ) : null}

          {isLoading && !session ? (
            <div className="grid gap-4 lg:grid-cols-[1fr_320px]">
              <Skeleton className="h-80 rounded-lg" />
              <Skeleton className="h-80 rounded-lg" />
            </div>
          ) : session ? (
            <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
              <div className="flex flex-col gap-6">
                <Card>
                  <CardHeader className="pb-3">
                    <div className="flex items-center gap-2">
                      <CardTitle className="text-base">
                        Room & customer
                      </CardTitle>
                      {session.roomRateSnapshot.type === "vip" ? (
                        <span className="inline-flex items-center gap-1 rounded-md bg-primary/10 px-1.5 py-0.5 text-[10px] font-semibold uppercase text-primary">
                          <Crown className="h-3 w-3" aria-hidden="true" />
                          VIP
                        </span>
                      ) : null}
                    </div>
                    <CardDescription>
                      Rate was snapshotted when the session opened.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                    <StatField
                      icon={<User2 className="h-4 w-4" />}
                      label="Customer"
                      value={session.customerName}
                    />
                    <StatField
                      icon={<Phone className="h-4 w-4" />}
                      label="Phone"
                      value={session.customerPhone || "—"}
                    />
                    <StatField
                      icon={<CalendarClock className="h-4 w-4" />}
                      label="Room"
                      value={`${session.roomRateSnapshot.code} — ${session.roomRateSnapshot.name}`}
                      span={2}
                    />
                    <StatField
                      icon={<PlayCircle className="h-4 w-4" />}
                      label="Started"
                      value={formatDateTime(session.startTime)}
                    />
                    <StatField
                      icon={<Clock className="h-4 w-4" />}
                      label="Elapsed"
                      value={formatElapsedSince(session.startTime)}
                    />
                    <StatField
                      label="Rate"
                      value={`${formatCurrency(session.roomRateSnapshot.hourlyRate)}/hr`}
                    />
                    <StatField
                      label="Status"
                      value={session.status.toUpperCase()}
                    />
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-3 flex flex-row items-center justify-between gap-2 space-y-0">
                    <div>
                      <CardTitle className="text-base">Ordered items</CardTitle>
                      <CardDescription>
                        {session.orderedItems.length} line
                        {session.orderedItems.length === 1 ? "" : "s"} ·{" "}
                        {formatCurrency(session.itemsSubtotal)} subtotal
                      </CardDescription>
                    </div>
                    {session.status === "open" ? (
                      <Button
                        size="sm"
                        className="gap-2"
                        onClick={() => setOrderOpen(true)}
                      >
                        <ShoppingBag className="h-4 w-4" aria-hidden="true" />
                        Add items
                      </Button>
                    ) : null}
                  </CardHeader>
                  <CardContent className="p-0">
                    {session.orderedItems.length === 0 ? (
                      <p className="px-6 py-8 text-center text-sm text-muted-foreground">
                        No items have been ordered yet.
                      </p>
                    ) : (
                      <div className="overflow-x-auto">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Item</TableHead>
                              <TableHead className="text-right">
                                Unit price
                              </TableHead>
                              <TableHead className="text-right">Qty</TableHead>
                              <TableHead className="text-right">
                                Line total
                              </TableHead>
                              <TableHead>Added</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {session.orderedItems.map((item) => (
                              <TableRow key={item._id}>
                                <TableCell className="font-medium">
                                  {item.productName}
                                </TableCell>
                                <TableCell className="text-right tabular-nums">
                                  {formatCurrency(item.unitPrice)}
                                </TableCell>
                                <TableCell className="text-right tabular-nums">
                                  {item.quantity}
                                </TableCell>
                                <TableCell className="text-right tabular-nums font-medium">
                                  {formatCurrency(item.lineTotal)}
                                </TableCell>
                                <TableCell className="text-muted-foreground">
                                  {formatDateTime(item.addedAt)}
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {session.notes ? (
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="flex items-center gap-2 text-base">
                        <NotebookPen
                          className="h-4 w-4 text-muted-foreground"
                          aria-hidden="true"
                        />
                        Notes
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-foreground">
                        {session.notes}
                      </p>
                    </CardContent>
                  </Card>
                ) : null}
              </div>

              {/* Right-side running totals */}
              <div className="flex flex-col gap-4">
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base">Running total</CardTitle>
                    <CardDescription>
                      From backend — source of truth.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="flex flex-col gap-3">
                    <Row label="Items subtotal">
                      {formatCurrency(session.itemsSubtotal)}
                    </Row>
                    <Separator />
                    <Row label="Total due" emphasis>
                      {formatCurrency(session.totalAmount)}
                    </Row>
                    <p className="text-xs text-muted-foreground">
                      Room-time charges are computed at checkout and are not
                      included here.
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base">Meta</CardTitle>
                  </CardHeader>
                  <CardContent className="flex flex-col gap-2 text-sm">
                    <MetaRow
                      label="Session ID"
                      value={session.id}
                      mono
                    />
                    <MetaRow
                      label="Reservation"
                      value={session.reservationId ?? "—"}
                      mono
                    />
                    <MetaRow
                      label="Opened by"
                      value={session.openedBy}
                      mono
                    />
                    <MetaRow
                      label="Created"
                      value={formatDateTime(session.createdAt)}
                    />
                    <MetaRow
                      label="Updated"
                      value={formatDateTime(session.updatedAt)}
                    />
                  </CardContent>
                </Card>
              </div>
            </div>
          ) : null}
        </div>
      </main>

      <OrderProductsDialog
        open={orderOpen}
        onOpenChange={setOrderOpen}
        session={session}
        onSubmit={async (sessionId, items) => {
          const updated = await addItems(sessionId, items)
          setSession(updated)
          toast.success("Session updated")
          return updated
        }}
      />

      <CheckoutDialog
        open={checkoutOpen}
        onOpenChange={setCheckoutOpen}
        session={session}
        onCheckout={async (sessionId, input) => {
          const result = await checkout(sessionId, input)
          if (result.session) setSession(result.session)
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

function StatField({
  icon,
  label,
  value,
  span,
}: {
  icon?: React.ReactNode
  label: string
  value: string
  span?: 1 | 2
}) {
  return (
    <div className={span === 2 ? "sm:col-span-2" : undefined}>
      <div className="flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
        {icon}
        <span>{label}</span>
      </div>
      <p className="mt-1 truncate text-sm font-medium text-foreground">
        {value}
      </p>
    </div>
  )
}

function Row({
  label,
  children,
  emphasis,
}: {
  label: string
  children: React.ReactNode
  emphasis?: boolean
}) {
  return (
    <div className="flex items-baseline justify-between gap-3">
      <span
        className={
          emphasis
            ? "text-sm font-medium text-foreground"
            : "text-sm text-muted-foreground"
        }
      >
        {label}
      </span>
      <span
        className={
          emphasis
            ? "text-xl font-semibold tabular-nums text-foreground"
            : "text-sm font-medium tabular-nums text-foreground"
        }
      >
        {children}
      </span>
    </div>
  )
}

function MetaRow({
  label,
  value,
  mono,
}: {
  label: string
  value: string
  mono?: boolean
}) {
  return (
    <div className="flex items-start justify-between gap-3">
      <span className="text-xs text-muted-foreground">{label}</span>
      <span
        className={
          mono
            ? "max-w-[60%] truncate text-right font-mono text-xs text-foreground"
            : "max-w-[60%] truncate text-right text-xs text-foreground"
        }
      >
        {value}
      </span>
    </div>
  )
}
