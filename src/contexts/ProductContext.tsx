import { createContext, useContext, type ReactNode } from "react"
import {
  useProductViewModel,
  type ProductViewModel,
} from "@/src/viewmodels/useProductViewModel"

const ProductContext = createContext<ProductViewModel | null>(null)

export function ProductProvider({ children }: { children: ReactNode }) {
  const vm = useProductViewModel()
  return (
    <ProductContext.Provider value={vm}>{children}</ProductContext.Provider>
  )
}

export function useProducts(): ProductViewModel {
  const ctx = useContext(ProductContext)
  if (!ctx) {
    throw new Error("useProducts must be used within ProductProvider")
  }
  return ctx
}
