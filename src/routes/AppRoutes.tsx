import { Navigate, Route, Routes } from "react-router-dom"
import { AppLayout } from "@/src/layouts/AppLayout"
import { ProtectedRoute } from "./ProtectedRoute"
import LoginPage from "@/src/views/pages/LoginPage"
import DashboardPage from "@/src/views/pages/DashboardPage"
import RoomsPage from "@/src/views/pages/RoomsPage"
import ReservationsPage from "@/src/views/pages/ReservationsPage"
import ActiveSessionsPage from "@/src/views/pages/ActiveSessionsPage"
import SessionDetailPage from "@/src/views/pages/SessionDetailPage"
import ProductsPage from "@/src/views/pages/ProductsPage"
import InvoicePage from "@/src/views/pages/InvoicePage"
import ReportsPage from "@/src/views/pages/ReportsPage"
import AdminRoomsPage from "@/src/views/pages/AdminRoomsPage"

export default function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />

      <Route element={<ProtectedRoute />}>
        <Route element={<AppLayout />}>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/rooms" element={<RoomsPage />} />
          <Route path="/reservations" element={<ReservationsPage />} />
          <Route path="/sessions" element={<ActiveSessionsPage />} />
          <Route path="/sessions/:id" element={<SessionDetailPage />} />
          <Route path="/products" element={<ProductsPage />} />
          <Route path="/invoices/:id" element={<InvoicePage />} />
          <Route path="/reports" element={<ReportsPage />} />

          {/* Admin */}
          <Route
            path="/admin"
            element={<Navigate to="/admin/rooms" replace />}
          />
          <Route path="/admin/rooms" element={<AdminRoomsPage />} />
        </Route>
      </Route>

      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  )
}
