import { http, unwrap } from "./httpClient"
import type { Product, ProductCategory } from "@/src/models/product"
import type {
  ProductCreateInput,
  ProductUpdateInput,
  StockAdjustmentInput,
  StockInInput,
  StockMovement,
} from "@/src/models/stockMovement"
import { isNetworkError } from "./demoFallback"
import { demoGetProduct, demoListProducts } from "./demoBookingFallback"
import {
  demoCreateProduct,
  demoListStockMovements,
  demoStockAdjustment,
  demoStockIn,
  demoUpdateProduct,
} from "./demoCheckoutFallback"

export interface ListProductsParams {
  category?: ProductCategory
  isActive?: boolean
  lowStock?: boolean
}

export const productService = {
  async list(params: ListProductsParams = {}): Promise<Product[]> {
    try {
      const query: Record<string, string> = {}
      if (params.category) query.category = params.category
      if (typeof params.isActive === "boolean")
        query.isActive = String(params.isActive)
      if (typeof params.lowStock === "boolean")
        query.lowStock = String(params.lowStock)
      const data = await unwrap<{ products: Product[]; total: number }>(
        http.get("/products", { params: query }),
      )
      return data.products ?? []
    } catch (err) {
      if (isNetworkError(err)) return demoListProducts(params)
      throw err
    }
  },

  async getById(id: string): Promise<Product> {
    try {
      const data = await unwrap<{ product: Product }>(
        http.get(`/products/${id}`),
      )
      return data.product
    } catch (err) {
      if (isNetworkError(err)) {
        const p = demoGetProduct(id)
        if (p) return p
      }
      throw err
    }
  },

  async create(input: ProductCreateInput): Promise<Product> {
    try {
      const data = await unwrap<{ product: Product }>(
        http.post("/products", input),
      )
      return data.product
    } catch (err) {
      if (isNetworkError(err)) return demoCreateProduct(input)
      throw err
    }
  },

  async update(id: string, patch: ProductUpdateInput): Promise<Product> {
    try {
      const data = await unwrap<{ product: Product }>(
        http.put(`/products/${id}`, patch),
      )
      return data.product
    } catch (err) {
      if (isNetworkError(err)) return demoUpdateProduct(id, patch)
      throw err
    }
  },

  async listStockMovements(productId: string): Promise<StockMovement[]> {
    try {
      const data = await unwrap<{
        stockMovements: StockMovement[]
        total: number
      }>(http.get(`/products/${productId}/stock-movements`))
      return data.stockMovements ?? []
    } catch (err) {
      if (isNetworkError(err)) return demoListStockMovements(productId)
      throw err
    }
  },

  async stockIn(
    productId: string,
    input: StockInInput,
  ): Promise<{ product: Product; stockMovement: StockMovement }> {
    try {
      const data = await unwrap<{
        product: Product
        stockMovement: StockMovement
      }>(http.patch(`/products/${productId}/stock-in`, input))
      return data
    } catch (err) {
      if (isNetworkError(err)) return demoStockIn(productId, input)
      throw err
    }
  },

  async stockAdjustment(
    productId: string,
    input: StockAdjustmentInput,
  ): Promise<{ product: Product; stockMovement: StockMovement }> {
    try {
      const data = await unwrap<{
        product: Product
        stockMovement: StockMovement
      }>(http.patch(`/products/${productId}/stock-adjustment`, input))
      return data
    } catch (err) {
      if (isNetworkError(err)) return demoStockAdjustment(productId, input)
      throw err
    }
  },
}
