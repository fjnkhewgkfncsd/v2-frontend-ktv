import { useEffect, useMemo, useState } from "react"
import {
  AlertCircle,
  AlertTriangle,
  ArrowDownToLine,
  ArrowRightLeft,
  Package,
  PenSquare,
  Plus,
  RefreshCw,
  Search,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Skeleton } from "@/components/ui/skeleton"
import { Topbar } from "@/src/layouts/Topbar"
import { useAuth } from "@/src/contexts/AuthContext"
import { useProducts } from "@/src/contexts/ProductContext"
import {
  PRODUCT_CATEGORY_LABEL,
  PRODUCT_CATEGORY_ORDER,
  type Product,
  type ProductCategory,
} from "@/src/models/product"
import { formatCurrency, formatDateTime } from "@/src/utils/format"
import { ProductForm } from "@/src/views/components/ProductForm"
import { ProductDetailSheet } from "@/src/views/components/ProductDetailSheet"
import { StockInDialog } from "@/src/views/components/StockInDialog"
import { StockAdjustmentDialog } from "@/src/views/components/StockAdjustmentDialog"
import type { ActiveFilter } from "@/src/viewmodels/useProductViewModel"

export default function ProductsPage() {
  const { user } = useAuth()
  const isAdmin = user?.role === "admin"

  const {
    products,
    isLoading,
    error,
    selectedCategory,
    setSelectedCategory,
    activeFilter,
    setActiveFilter,
    lowStockOnly,
    setLowStockOnly,
    search,
    setSearch,
    filteredProducts,
    categoryCounts,
    lowStockCount,
    inactiveCount,
    load,
    createProduct,
    updateProduct,
    stockIn,
    stockAdjustment,
  } = useProducts()

  const [detailProduct, setDetailProduct] = useState<Product | null>(null)
  const [detailOpen, setDetailOpen] = useState(false)
  const [createOpen, setCreateOpen] = useState(false)
  const [editProduct, setEditProduct] = useState<Product | null>(null)
  const [stockInTarget, setStockInTarget] = useState<Product | null>(null)
  const [adjustTarget, setAdjustTarget] = useState<Product | null>(null)

  useEffect(() => {
    void load(true)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Keep detail sheet data in sync after mutations (stock in / edit).
  const liveDetailProduct = useMemo(
    () =>
      detailProduct
        ? products.find((p) => p.id === detailProduct.id) ?? detailProduct
        : null,
    [products, detailProduct],
  )

  const openDetail = (p: Product) => {
    setDetailProduct(p)
    setDetailOpen(true)
  }

  const activeOptions: { key: ActiveFilter; label: string; count?: number }[] =
    [
      { key: "all", label: "All", count: categoryCounts.total },
      {
        key: "active",
        label: "Active",
        count: categoryCounts.total - inactiveCount,
      },
      { key: "inactive", label: "Inactive", count: inactiveCount },
    ]

  return (
    <>
      <Topbar
        title="Products"
        subtitle="Bar and snack inventory, stock movements, and pricing"
        actions={
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => load(true)}
              disabled={isLoading}
              className="gap-2"
            >
              <RefreshCw
                className={cn("h-4 w-4", isLoading && "animate-spin")}
                aria-hidden="true"
              />
              Refresh
            </Button>
            {isAdmin ? (
              <Button
                size="sm"
                className="gap-2"
                onClick={() => setCreateOpen(true)}
              >
                <Plus className="h-4 w-4" aria-hidden="true" />
                New product
              </Button>
            ) : null}
          </div>
        }
      />

      <main className="flex-1 overflow-y-auto p-6">
        <div className="mx-auto flex max-w-7xl flex-col gap-6">
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
                  Could not load products
                </p>
                <p className="text-muted-foreground">{error}</p>
              </div>
              <Button size="sm" variant="outline" onClick={() => load(true)}>
                Retry
              </Button>
            </div>
          ) : null}

          {/* Summary */}
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            <SummaryTile
              label="Products"
              value={categoryCounts.total}
              icon={<Package className="h-4 w-4" aria-hidden="true" />}
            />
            <SummaryTile
              label="Low stock"
              value={lowStockCount}
              tone={lowStockCount > 0 ? "warning" : undefined}
              icon={
                <AlertTriangle className="h-4 w-4" aria-hidden="true" />
              }
            />
            <SummaryTile label="Inactive" value={inactiveCount} />
            <SummaryTile
              label="Drinks / Food / Snacks"
              value={
                categoryCounts.drink +
                categoryCounts.food +
                categoryCounts.snack
              }
            />
          </div>

          <Card>
            <CardHeader className="gap-3 pb-4">
              <div className="flex flex-col justify-between gap-3 lg:flex-row lg:items-center">
                <div>
                  <CardTitle className="text-base">Inventory</CardTitle>
                  <CardDescription>
                    {filteredProducts.length} of {products.length} shown
                  </CardDescription>
                </div>
                <div className="relative w-full lg:w-72">
                  <Search
                    className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
                    aria-hidden="true"
                  />
                  <Input
                    type="search"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search by name"
                    className="pl-9"
                    aria-label="Search products"
                  />
                </div>
              </div>

              {/* Filter chips */}
              <div className="flex flex-wrap items-center gap-2 text-xs">
                <ChipGroup label="Category">
                  <Chip
                    active={selectedCategory === "all"}
                    onClick={() => setSelectedCategory("all")}
                    label={`All (${categoryCounts.total})`}
                  />
                  {PRODUCT_CATEGORY_ORDER.map((c) => (
                    <Chip
                      key={c}
                      active={selectedCategory === c}
                      onClick={() => setSelectedCategory(c)}
                      label={`${PRODUCT_CATEGORY_LABEL[c]} (${categoryCounts[c]})`}
                    />
                  ))}
                </ChipGroup>
                <span className="h-5 w-px bg-border" aria-hidden="true" />
                <ChipGroup label="Status">
                  {activeOptions.map((opt) => (
                    <Chip
                      key={opt.key}
                      active={activeFilter === opt.key}
                      onClick={() => setActiveFilter(opt.key)}
                      label={
                        typeof opt.count === "number"
                          ? `${opt.label} (${opt.count})`
                          : opt.label
                      }
                    />
                  ))}
                </ChipGroup>
                <span className="h-5 w-px bg-border" aria-hidden="true" />
                <Chip
                  active={lowStockOnly}
                  onClick={() => setLowStockOnly(!lowStockOnly)}
                  label={`Low stock only (${lowStockCount})`}
                  tone="warning"
                />
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {isLoading && products.length === 0 ? (
                <div className="flex flex-col gap-2 p-4">
                  {Array.from({ length: 6 }).map((_, i) => (
                    <Skeleton key={i} className="h-12" />
                  ))}
                </div>
              ) : filteredProducts.length === 0 ? (
                <div className="flex flex-col items-center justify-center gap-1 px-6 py-12 text-center">
                  <Package
                    className="h-8 w-8 text-muted-foreground"
                    aria-hidden="true"
                  />
                  <p className="text-sm font-medium text-foreground">
                    No products match these filters
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Try clearing your search or status filter.
                  </p>
                </div>
              ) : (
                <ProductTable
                  products={filteredProducts}
                  isAdmin={isAdmin}
                  onRowClick={openDetail}
                  onEdit={(p) => setEditProduct(p)}
                  onStockIn={(p) => setStockInTarget(p)}
                  onStockAdjust={(p) => setAdjustTarget(p)}
                />
              )}
            </CardContent>
          </Card>
        </div>
      </main>

      {/* Detail sheet */}
      <ProductDetailSheet
        open={detailOpen}
        onOpenChange={(open) => {
          setDetailOpen(open)
          if (!open) setDetailProduct(null)
        }}
        product={liveDetailProduct}
        isAdmin={isAdmin}
        onEdit={(p) => setEditProduct(p)}
        onStockIn={(p) => setStockInTarget(p)}
        onStockAdjust={(p) => setAdjustTarget(p)}
      />

      {/* Admin dialogs */}
      {isAdmin ? (
        <ProductForm
          mode="create"
          open={createOpen}
          onOpenChange={setCreateOpen}
          onCreate={createProduct}
        />
      ) : null}
      {editProduct ? (
        <ProductForm
          mode="edit"
          open={Boolean(editProduct)}
          onOpenChange={(open) => {
            if (!open) setEditProduct(null)
          }}
          product={editProduct}
          onUpdate={updateProduct}
        />
      ) : null}

      <StockInDialog
        open={Boolean(stockInTarget)}
        onOpenChange={(open) => {
          if (!open) setStockInTarget(null)
        }}
        product={stockInTarget}
        onSubmit={stockIn}
      />
      <StockAdjustmentDialog
        open={Boolean(adjustTarget)}
        onOpenChange={(open) => {
          if (!open) setAdjustTarget(null)
        }}
        product={adjustTarget}
        onSubmit={stockAdjustment}
      />
    </>
  )
}

function SummaryTile({
  label,
  value,
  icon,
  tone,
}: {
  label: string
  value: number
  icon?: React.ReactNode
  tone?: "warning"
}) {
  return (
    <div
      className={cn(
        "flex items-center gap-3 rounded-lg border border-border bg-card p-4",
        tone === "warning" &&
          "border-[color:var(--status-reserved-border)]/60 bg-[color:var(--status-reserved-bg)]/40",
      )}
    >
      {icon ? (
        <span
          className={cn(
            "flex h-9 w-9 items-center justify-center rounded-md bg-muted text-muted-foreground",
            tone === "warning" &&
              "bg-[color:var(--status-reserved-bg)] text-[color:var(--status-reserved-fg)]",
          )}
        >
          {icon}
        </span>
      ) : null}
      <div className="min-w-0">
        <p className="truncate text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
          {label}
        </p>
        <p className="text-xl font-semibold tabular-nums text-foreground">
          {value}
        </p>
      </div>
    </div>
  )
}

function ChipGroup({
  label,
  children,
}: {
  label: string
  children: React.ReactNode
}) {
  return (
    <div className="flex flex-wrap items-center gap-1.5">
      <span className="pr-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
        {label}
      </span>
      {children}
    </div>
  )
}

function Chip({
  active,
  onClick,
  label,
  tone,
}: {
  active: boolean
  onClick(): void
  label: string
  tone?: "warning"
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-medium transition-all",
        active
          ? tone === "warning"
            ? "border-[color:var(--status-reserved-border)] bg-[color:var(--status-reserved-bg)] text-[color:var(--status-reserved-fg)]"
            : "border-primary bg-primary text-primary-foreground"
          : "border-border bg-card text-foreground hover:border-primary/40 hover:bg-primary/[0.04]",
      )}
    >
      {label}
    </button>
  )
}

interface ProductTableProps {
  products: Product[]
  isAdmin: boolean
  onRowClick(p: Product): void
  onEdit(p: Product): void
  onStockIn(p: Product): void
  onStockAdjust(p: Product): void
}

function ProductTable({
  products,
  isAdmin,
  onRowClick,
  onEdit,
  onStockIn,
  onStockAdjust,
}: ProductTableProps) {
  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[32%]">Product</TableHead>
            <TableHead>Category</TableHead>
            <TableHead className="text-right">Price</TableHead>
            <TableHead className="text-right">Stock</TableHead>
            <TableHead>Updated</TableHead>
            <TableHead className="w-[220px] text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {products.map((p) => {
            const stockTone =
              p.stockQty === 0
                ? "occupied"
                : p.isLowStock
                  ? "reserved"
                  : "available"
            return (
              <TableRow
                key={p.id}
                className="cursor-pointer"
                onClick={() => onRowClick(p)}
              >
                <TableCell>
                  <div className="flex flex-col">
                    <span className="font-medium text-foreground">
                      {p.name}
                    </span>
                    <div className="mt-0.5 flex flex-wrap items-center gap-1">
                      {!p.isActive ? (
                        <span className="rounded-full bg-muted px-1.5 py-0.5 text-[10px] font-semibold uppercase text-muted-foreground">
                          Inactive
                        </span>
                      ) : null}
                      {p.isLowStock && p.stockQty > 0 ? (
                        <span className="rounded-full bg-[color:var(--status-reserved-bg)] px-1.5 py-0.5 text-[10px] font-semibold uppercase text-[color:var(--status-reserved-fg)]">
                          Low
                        </span>
                      ) : null}
                      {p.stockQty === 0 ? (
                        <span className="rounded-full bg-[color:var(--status-occupied-bg)] px-1.5 py-0.5 text-[10px] font-semibold uppercase text-[color:var(--status-occupied-fg)]">
                          Out
                        </span>
                      ) : null}
                    </div>
                  </div>
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {PRODUCT_CATEGORY_LABEL[p.category as ProductCategory]}
                </TableCell>
                <TableCell className="text-right tabular-nums font-medium">
                  {formatCurrency(p.price)}
                </TableCell>
                <TableCell
                  className={cn(
                    "text-right tabular-nums font-medium",
                    stockTone === "occupied" && "text-destructive",
                    stockTone === "reserved" &&
                      "text-[color:var(--status-reserved-fg)]",
                  )}
                >
                  {p.stockQty}
                  <span className="ml-1 text-[11px] text-muted-foreground">
                    / {p.lowStockThreshold}
                  </span>
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {formatDateTime(p.updatedAt)}
                </TableCell>
                <TableCell className="text-right">
                  <div
                    className="flex justify-end gap-1"
                    onClick={(e) => e.stopPropagation()}
                  >
                    {isAdmin ? (
                      <>
                        <Button
                          size="icon"
                          variant="ghost"
                          title="Stock in"
                          onClick={() => onStockIn(p)}
                          className="h-8 w-8"
                        >
                          <ArrowDownToLine
                            className="h-4 w-4"
                            aria-hidden="true"
                          />
                          <span className="sr-only">Stock in</span>
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          title="Adjust stock"
                          onClick={() => onStockAdjust(p)}
                          className="h-8 w-8"
                        >
                          <ArrowRightLeft
                            className="h-4 w-4"
                            aria-hidden="true"
                          />
                          <span className="sr-only">Adjust stock</span>
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          title="Edit product"
                          onClick={() => onEdit(p)}
                          className="h-8 w-8"
                        >
                          <PenSquare
                            className="h-4 w-4"
                            aria-hidden="true"
                          />
                          <span className="sr-only">Edit</span>
                        </Button>
                      </>
                    ) : (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => onRowClick(p)}
                      >
                        View
                      </Button>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            )
          })}
        </TableBody>
      </Table>
    </div>
  )
}
