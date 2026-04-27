import { Toaster } from "@/components/ui/sonner"
import { AuthProvider } from "./contexts/AuthContext"
import { RoomProvider } from "./contexts/RoomContext"
import { ReservationProvider } from "./contexts/ReservationContext"
import { SessionProvider } from "./contexts/SessionContext"
import { ProductProvider } from "./contexts/ProductContext"
import AppRoutes from "./routes/AppRoutes"

export default function App() {
  return (
    <AuthProvider>
      <RoomProvider>
        <ReservationProvider>
          <SessionProvider>
            <ProductProvider>
              <AppRoutes />
              <Toaster richColors position="top-right" />
            </ProductProvider>
          </SessionProvider>
        </ReservationProvider>
      </RoomProvider>
    </AuthProvider>
  )
}
