import { Outlet } from "react-router-dom"
import { Sidebar } from "./Sidebar"
import { useAuth } from "@/src/contexts/AuthContext"

export function AppLayout() {
  const { user } = useAuth()
  return (
    <div className="flex h-screen w-full overflow-hidden bg-background">
      <Sidebar userRole={user?.role} />
      <main className="flex min-w-0 flex-1 flex-col overflow-y-auto scroll-smooth">
        <Outlet />
      </main>
    </div>
  )
}
