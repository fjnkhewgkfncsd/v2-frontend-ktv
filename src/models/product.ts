export type ProductCategory = "drink" | "food" | "snack" | "other"

export interface Product {
  id: string
  name: string
  category: ProductCategory
  price: number
  stockQty: number
  lowStockThreshold: number
  isActive: boolean
  isLowStock: boolean
  createdAt: string
  updatedAt: string
}

export const PRODUCT_CATEGORY_LABEL: Record<ProductCategory, string> = {
  drink: "Drinks",
  food: "Food",
  snack: "Snacks",
  other: "Other",
}

export const PRODUCT_CATEGORY_ORDER: ProductCategory[] = [
  "drink",
  "food",
  "snack",
  "other",
]
