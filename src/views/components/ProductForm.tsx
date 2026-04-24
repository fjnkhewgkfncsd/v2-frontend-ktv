import { useEffect, useState } from "react"
import { Loader2, Package, PenSquare } from "lucide-react"
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
import { Switch } from "@/components/ui/switch"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { ApiRequestError } from "@/src/models/api"
import {
  PRODUCT_CATEGORY_LABEL,
  PRODUCT_CATEGORY_ORDER,
  type Product,
  type ProductCategory,
} from "@/src/models/product"
import type {
  ProductCreateInput,
  ProductUpdateInput,
} from "@/src/models/stockMovement"

type Mode = "create" | "edit"

interface BaseProps {
  open: boolean
  onOpenChange(open: boolean): void
  onSaved?(product: Product): void
}

interface CreateProps extends BaseProps {
  mode: "create"
  product?: null
  onCreate(input: ProductCreateInput): Promise<Product>
}

interface EditProps extends BaseProps {
  mode: "edit"
  product: Product
  onUpdate(id: string, patch: ProductUpdateInput): Promise<Product>
}

type Props = CreateProps | EditProps

interface FormState {
  name: string
  category: ProductCategory
  price: string
  stockQty: string
  lowStockThreshold: string
  isActive: boolean
}

function initialState(mode: Mode, product: Product | null): FormState {
  if (mode === "edit" && product) {
    return {
      name: product.name,
      category: product.category,
      price: String(product.price),
      stockQty: String(product.stockQty),
      lowStockThreshold: String(product.lowStockThreshold),
      isActive: product.isActive,
    }
  }
  return {
    name: "",
    category: "drink",
    price: "",
    stockQty: "0",
    lowStockThreshold: "5",
    isActive: true,
  }
}

export function ProductForm(props: Props) {
  const { open, onOpenChange, onSaved, mode } = props
  const product = mode === "edit" ? props.product : null

  const [form, setForm] = useState<FormState>(() =>
    initialState(mode, product),
  )
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    if (!open) return
    setForm(initialState(mode, product))
    setError(null)
    setIsSubmitting(false)
  }, [open, mode, product?.id])

  const update = <K extends keyof FormState>(key: K, value: FormState[K]) =>
    setForm((prev) => ({ ...prev, [key]: value }))

  const validate = (): string | null => {
    if (!form.name.trim()) return "Name is required."
    if (form.name.trim().length > 120) return "Name is too long (max 120)."
    const price = Number(form.price)
    if (!Number.isFinite(price) || price < 0)
      return "Price must be a non-negative number."
    const lowStock = Number(form.lowStockThreshold)
    if (!Number.isInteger(lowStock) || lowStock < 0)
      return "Low-stock threshold must be a non-negative integer."
    if (mode === "create") {
      const stockQty = Number(form.stockQty)
      if (!Number.isInteger(stockQty) || stockQty < 0)
        return "Starting stock must be a non-negative integer."
    }
    return null
  }

  const handleSubmit = async () => {
    const msg = validate()
    if (msg) {
      setError(msg)
      return
    }
    setError(null)
    setIsSubmitting(true)
    try {
      let saved: Product
      if (mode === "create") {
        saved = await props.onCreate({
          name: form.name.trim(),
          category: form.category,
          price: Number(form.price),
          stockQty: Number(form.stockQty),
          lowStockThreshold: Number(form.lowStockThreshold),
          isActive: form.isActive,
        })
      } else {
        saved = await props.onUpdate(props.product.id, {
          name: form.name.trim(),
          category: form.category,
          price: Number(form.price),
          lowStockThreshold: Number(form.lowStockThreshold),
          isActive: form.isActive,
        })
      }
      toast.success(mode === "create" ? "Product created" : "Product updated", {
        description: saved.name,
      })
      onSaved?.(saved)
      onOpenChange(false)
    } catch (err) {
      const m =
        err instanceof ApiRequestError ? err.message : "Failed to save product."
      setError(m)
      toast.error("Save failed", { description: m })
    } finally {
      setIsSubmitting(false)
    }
  }

  const Icon = mode === "create" ? Package : PenSquare
  const title = mode === "create" ? "New product" : `Edit · ${form.name || "product"}`
  const description =
    mode === "create"
      ? "Create a new product for the bar or snack menu."
      : "Update master data. Use stock-in or stock adjustment to change the quantity."

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Icon className="h-5 w-5 text-primary" aria-hidden="true" />
            {title}
          </DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="pf-name">Name</Label>
            <Input
              id="pf-name"
              value={form.name}
              onChange={(e) => update("name", e.target.value)}
              placeholder="e.g. Heineken 330ml"
              maxLength={120}
              autoFocus
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="pf-category">Category</Label>
              <Select
                value={form.category}
                onValueChange={(value) =>
                  update("category", value as ProductCategory)
                }
              >
                <SelectTrigger id="pf-category">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PRODUCT_CATEGORY_ORDER.map((c) => (
                    <SelectItem key={c} value={c}>
                      {PRODUCT_CATEGORY_LABEL[c]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="pf-price">Price</Label>
              <Input
                id="pf-price"
                type="number"
                min={0}
                step="0.01"
                inputMode="decimal"
                value={form.price}
                onChange={(e) => update("price", e.target.value)}
                placeholder="0.00"
                className="tabular-nums"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {mode === "create" ? (
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="pf-stock">Starting stock</Label>
                <Input
                  id="pf-stock"
                  type="number"
                  min={0}
                  step={1}
                  inputMode="numeric"
                  value={form.stockQty}
                  onChange={(e) => update("stockQty", e.target.value)}
                  className="tabular-nums"
                />
              </div>
            ) : (
              <div className="flex flex-col gap-1.5">
                <Label>Current stock</Label>
                <div className="flex h-10 items-center rounded-md border border-border bg-muted/40 px-3 text-sm tabular-nums">
                  {product?.stockQty ?? 0}
                </div>
              </div>
            )}
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="pf-threshold">Low-stock threshold</Label>
              <Input
                id="pf-threshold"
                type="number"
                min={0}
                step={1}
                inputMode="numeric"
                value={form.lowStockThreshold}
                onChange={(e) => update("lowStockThreshold", e.target.value)}
                className="tabular-nums"
              />
            </div>
          </div>

          <div className="flex items-center justify-between rounded-md border border-border bg-card px-3 py-2.5">
            <div>
              <p className="text-sm font-medium text-foreground">Active</p>
              <p className="text-xs text-muted-foreground">
                Inactive products are hidden from the order picker.
              </p>
            </div>
            <Switch
              checked={form.isActive}
              onCheckedChange={(value) => update("isActive", Boolean(value))}
              aria-label="Toggle product active state"
            />
          </div>

          {error ? (
            <p
              role="alert"
              className="rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive"
            >
              {error}
            </p>
          ) : null}
        </div>

        <DialogFooter>
          <Button
            variant="ghost"
            onClick={() => onOpenChange(false)}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={isSubmitting} className="gap-2">
            {isSubmitting ? (
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
            ) : (
              <Icon className="h-4 w-4" aria-hidden="true" />
            )}
            {mode === "create" ? "Create product" : "Save changes"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
