import { useCallback, useMemo, useState } from "react"
import { productService } from "@/src/services/productService"
import { ApiRequestError } from "@/src/models/api"
import type { Product, ProductCategory } from "@/src/models/product"
import type {
  ProductCreateInput,
  ProductUpdateInput,
  StockAdjustmentInput,
  StockInInput,
  StockMovement,
} from "@/src/models/stockMovement"

export type ActiveFilter = "all" | "active" | "inactive"

export interface ProductViewModel {
  products: Product[]
  isLoading: boolean
  error: string | null
  selectedCategory: ProductCategory | "all"
  setSelectedCategory(next: ProductCategory | "all"): void
  activeFilter: ActiveFilter
  setActiveFilter(next: ActiveFilter): void
  lowStockOnly: boolean
  setLowStockOnly(next: boolean): void
  search: string
  setSearch(value: string): void
  filteredProducts: Product[]
  categoryCounts: Record<ProductCategory, number> & { total: number }
  lowStockCount: number
  inactiveCount: number
  load(includeInactive?: boolean): Promise<void>
  refreshOne(id: string): Promise<Product>
  getById(id: string): Product | undefined
  createProduct(input: ProductCreateInput): Promise<Product>
  updateProduct(id: string, patch: ProductUpdateInput): Promise<Product>
  stockIn(
    id: string,
    input: StockInInput,
  ): Promise<{ product: Product; stockMovement: StockMovement }>
  stockAdjustment(
    id: string,
    input: StockAdjustmentInput,
  ): Promise<{ product: Product; stockMovement: StockMovement }>
  listStockMovements(id: string): Promise<StockMovement[]>
}

const EMPTY_COUNTS = {
  drink: 0,
  food: 0,
  snack: 0,
  other: 0,
  total: 0,
}

function toMessage(err: unknown, fallback: string): string {
  return err instanceof ApiRequestError ? err.message : fallback
}

export function useProductViewModel(): ProductViewModel {
  const [products, setProducts] = useState<Product[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [selectedCategory, setSelectedCategory] = useState<
    ProductCategory | "all"
  >("all")
  const [activeFilter, setActiveFilter] = useState<ActiveFilter>("all")
  const [lowStockOnly, setLowStockOnly] = useState(false)
  const [search, setSearch] = useState("")

  const upsert = useCallback((next: Product) => {
    setProducts((prev) => {
      const idx = prev.findIndex((p) => p.id === next.id)
      if (idx === -1) return [next, ...prev]
      return prev.map((p, i) => (i === idx ? next : p))
    })
  }, [])

  const load = useCallback(async (includeInactive = true) => {
    setIsLoading(true)
    setError(null)
    try {
      // Admin UIs want to see inactive items too; pass undefined to list all.
      const list = await productService.list(
        includeInactive ? {} : { isActive: true },
      )
      setProducts(list)
    } catch (err) {
      const msg = toMessage(err, "Failed to load products.")
      setError(msg)
      console.log("[v0] products load failed:", msg)
    } finally {
      setIsLoading(false)
    }
  }, [])

  const refreshOne = useCallback(
    async (id: string): Promise<Product> => {
      const fresh = await productService.getById(id)
      upsert(fresh)
      return fresh
    },
    [upsert],
  )

  const getById = useCallback(
    (id: string) => products.find((p) => p.id === id),
    [products],
  )

  const createProduct = useCallback(
    async (input: ProductCreateInput): Promise<Product> => {
      const created = await productService.create(input)
      upsert(created)
      return created
    },
    [upsert],
  )

  const updateProduct = useCallback(
    async (id: string, patch: ProductUpdateInput): Promise<Product> => {
      const updated = await productService.update(id, patch)
      upsert(updated)
      return updated
    },
    [upsert],
  )

  const stockIn = useCallback(
    async (id: string, input: StockInInput) => {
      const res = await productService.stockIn(id, input)
      upsert(res.product)
      return res
    },
    [upsert],
  )

  const stockAdjustment = useCallback(
    async (id: string, input: StockAdjustmentInput) => {
      const res = await productService.stockAdjustment(id, input)
      upsert(res.product)
      return res
    },
    [upsert],
  )

  const listStockMovements = useCallback(async (id: string) => {
    return productService.listStockMovements(id)
  }, [])

  const categoryCounts = useMemo(() => {
    const counts = { ...EMPTY_COUNTS }
    for (const p of products) {
      if (p.category in counts) {
        counts[p.category] = (counts[p.category] || 0) + 1
      }
      counts.total += 1
    }
    return counts
  }, [products])

  const lowStockCount = useMemo(
    () => products.filter((p) => p.isLowStock).length,
    [products],
  )

  const inactiveCount = useMemo(
    () => products.filter((p) => !p.isActive).length,
    [products],
  )

  const filteredProducts = useMemo(() => {
    let out = products
    if (selectedCategory !== "all") {
      out = out.filter((p) => p.category === selectedCategory)
    }
    if (activeFilter === "active") out = out.filter((p) => p.isActive)
    if (activeFilter === "inactive") out = out.filter((p) => !p.isActive)
    if (lowStockOnly) out = out.filter((p) => p.isLowStock)
    const q = search.trim().toLowerCase()
    if (q) {
      out = out.filter((p) => p.name.toLowerCase().includes(q))
    }
    return out
  }, [products, selectedCategory, activeFilter, lowStockOnly, search])

  return {
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
    refreshOne,
    getById,
    createProduct,
    updateProduct,
    stockIn,
    stockAdjustment,
    listStockMovements,
  }
}
