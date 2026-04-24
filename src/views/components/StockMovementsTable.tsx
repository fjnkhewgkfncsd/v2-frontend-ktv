import {
  ArrowDownToLine,
  ArrowRightLeft,
  PackageCheck,
  Undo2,
} from "lucide-react"
import { cn } from "@/lib/utils"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Skeleton } from "@/components/ui/skeleton"
import {
  STOCK_MOVEMENT_LABEL,
  type StockMovement,
  type StockMovementType,
} from "@/src/models/stockMovement"
import { formatDateTime } from "@/src/utils/format"

interface Props {
  movements: StockMovement[]
  isLoading?: boolean
  emptyMessage?: string
}

const ICONS: Record<StockMovementType, React.ComponentType<{ className?: string }>> = {
  stock_in: ArrowDownToLine,
  adjustment: ArrowRightLeft,
  session_consume: PackageCheck,
  invoice_reverse: Undo2,
}

export function StockMovementsTable({
  movements,
  isLoading,
  emptyMessage = "No stock movements recorded yet.",
}: Props) {
  if (isLoading && movements.length === 0) {
    return (
      <div className="flex flex-col gap-2 p-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-10" />
        ))}
      </div>
    )
  }

  if (movements.length === 0) {
    return (
      <p className="px-6 py-8 text-center text-sm text-muted-foreground">
        {emptyMessage}
      </p>
    )
  }

  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Type</TableHead>
            <TableHead className="text-right">Qty</TableHead>
            <TableHead className="text-right">Before</TableHead>
            <TableHead className="text-right">After</TableHead>
            <TableHead>Reason</TableHead>
            <TableHead>When</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {movements.map((m) => {
            const Icon = ICONS[m.movementType] ?? ArrowRightLeft
            const delta = m.afterQty - m.beforeQty
            return (
              <TableRow key={m.id}>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <span
                      className={cn(
                        "inline-flex h-7 w-7 items-center justify-center rounded-md",
                        m.movementType === "stock_in"
                          ? "bg-[color:var(--status-available-bg)] text-[color:var(--status-available-fg)]"
                          : m.movementType === "adjustment"
                            ? "bg-[color:var(--status-reserved-bg)] text-[color:var(--status-reserved-fg)]"
                            : "bg-muted text-muted-foreground",
                      )}
                    >
                      <Icon className="h-4 w-4" aria-hidden="true" />
                    </span>
                    <span className="text-sm font-medium text-foreground">
                      {STOCK_MOVEMENT_LABEL[m.movementType] ?? m.movementType}
                    </span>
                  </div>
                </TableCell>
                <TableCell className="text-right tabular-nums font-medium">
                  {m.quantity}
                </TableCell>
                <TableCell className="text-right tabular-nums text-muted-foreground">
                  {m.beforeQty}
                </TableCell>
                <TableCell
                  className={cn(
                    "text-right tabular-nums font-semibold",
                    delta > 0 && "text-[color:var(--status-available-fg)]",
                    delta < 0 && "text-destructive",
                  )}
                >
                  {m.afterQty}
                </TableCell>
                <TableCell className="max-w-[260px] truncate text-sm text-muted-foreground">
                  {m.reason || "—"}
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {formatDateTime(m.createdAt)}
                </TableCell>
              </TableRow>
            )
          })}
        </TableBody>
      </Table>
    </div>
  )
}
