import { Navigate, Outlet, useLocation } from "react-router-dom"
import { useAuth } from "@/src/contexts/AuthContext"
import { FullPageLoader } from "@/src/views/components/FullPageLoader"

export function ProtectedRoute() {
  const { isAuthenticated, isBootstrapping } = useAuth()
  const location = useLocation()

  if (isBootstrapping) {
    return <FullPageLoader label="Loading session..." />
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location }} />
  }

  return <Outlet />
}
