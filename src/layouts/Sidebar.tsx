import { NavLink } from "react-router-dom"
import {
  BarChart3,
  CalendarDays,
  DoorOpen,
  LayoutDashboard,
  Music2,
  Package,
  PlaySquare,
  ShieldCheck,
} from "lucide-react"
import { cn } from "@/lib/utils"

interface NavItem {
  to: string
  label: string
  icon: React.ComponentType<{ className?: string }>
  end?: boolean
}

interface NavGroup {
  label: string | null
  items: NavItem[]
  adminOnly?: boolean
}

const NAV_GROUPS: NavGroup[] = [
  {
    label: null,
    items: [
      { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
      { to: "/rooms", label: "Rooms", icon: DoorOpen },
      { to: "/reservations", label: "Reservations", icon: CalendarDays },
      { to: "/sessions", label: "Active Sessions", icon: PlaySquare },
      { to: "/products", label: "Products", icon: Package },
      { to: "/reports", label: "Reports", icon: BarChart3 },
    ],
  },
  {
    label: "Administration",
    adminOnly: true,
    items: [
      {
        to: "/admin/rooms",
        label: "Manage Rooms",
        icon: ShieldCheck,
      },
    ],
  },
]

interface SidebarProps {
  userRole?: string
}

export function Sidebar({ userRole }: SidebarProps) {
  const isAdmin = userRole === "admin"

  return (
    <aside className="hidden lg:flex lg:w-64 lg:flex-col lg:shrink-0 lg:border-r lg:border-sidebar-border lg:bg-sidebar lg:text-sidebar-foreground">
      <div className="flex h-16 items-center gap-2.5 border-b border-sidebar-border px-6">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
          <Music2 className="h-4 w-4" aria-hidden="true" />
        </div>
        <div className="flex flex-col leading-tight">
          <span className="text-sm font-semibold tracking-tight">
            KTV Operations
          </span>
          <span className="text-[11px] text-sidebar-foreground/60">
            Management Console
          </span>
        </div>
      </div>

      <nav
        aria-label="Primary"
        className="flex-1 overflow-y-auto px-3 py-4"
      >
        {NAV_GROUPS.map((group, groupIdx) => {
          if (group.adminOnly && !isAdmin) return null
          return (
            <div key={groupIdx} className={cn(groupIdx > 0 && "mt-6")}>
              {group.label ? (
                <p className="mb-2 px-3 text-[11px] font-semibold uppercase tracking-wider text-sidebar-foreground/50">
                  {group.label}
                </p>
              ) : null}
              <ul className="flex flex-col gap-1">
                {group.items.map((item) => {
                  const Icon = item.icon
                  return (
                    <li key={item.to}>
                      <NavLink
                        to={item.to}
                        end={item.end}
                        className={({ isActive }) =>
                          cn(
                            "group flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                            isActive
                              ? "bg-sidebar-accent text-sidebar-accent-foreground"
                              : "text-sidebar-foreground/75 hover:bg-sidebar-accent/60 hover:text-sidebar-foreground",
                          )
                        }
                      >
                        {({ isActive }) => (
                          <>
                            <Icon
                              className={cn(
                                "h-4 w-4 shrink-0",
                                isActive
                                  ? "text-sidebar-primary"
                                  : "text-sidebar-foreground/60 group-hover:text-sidebar-foreground",
                              )}
                              aria-hidden="true"
                            />
                            <span>{item.label}</span>
                          </>
                        )}
                      </NavLink>
                    </li>
                  )
                })}
              </ul>
            </div>
          )
        })}
      </nav>

      <div className="border-t border-sidebar-border px-6 py-4 text-[11px] text-sidebar-foreground/50">
        v1.0 &middot; {userRole ? userRole.toUpperCase() : "OPERATOR"}
      </div>
    </aside>
  )
}
