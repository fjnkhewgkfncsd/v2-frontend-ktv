import { Outlet } from "react-router-dom"
import { Sidebar } from "./Sidebar"
import { useAuth } from "@/src/contexts/AuthContext"

export function AppLayout() {
  const { user } = useAuth()
  return (
    <div className="flex min-h-screen w-full bg-background">
      <Sidebar userRole={user?.role} />
      <div className="flex min-w-0 flex-1 flex-col">
        <Outlet />
      </div>
    </div>
  )
}
