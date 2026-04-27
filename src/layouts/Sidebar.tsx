import { memo } from "react"
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
  /**
   * Match the URL exactly (no prefix matching). Use for top-level links that
   * have siblings under a deeper path (e.g. avoid "/rooms" staying active
   * when navigating to "/rooms/:id").
   */
  end?: boolean
}

interface NavGroup {
  /** Stable id used as the React key — never the array index. */
  id: string
  label: string | null
  items: NavItem[]
  adminOnly?: boolean
}

/**
 * Shared nav config. Both admin and receptionist consume this — the only
 * difference is that admin-only groups are filtered back in when the user
 * has the admin role. Keeping one source of truth here prevents duplicate
 * bugs like active-state or routing drift between roles.
 */
const NAV_GROUPS: NavGroup[] = [
  {
    id: "operations",
    label: null,
    items: [
      { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard, end: true },
      { to: "/rooms", label: "Rooms", icon: DoorOpen, end: true },
      { to: "/reservations", label: "Reservations", icon: CalendarDays, end: true },
      { to: "/sessions", label: "Active Sessions", icon: PlaySquare },
      { to: "/products", label: "Products", icon: Package, end: true },
      { to: "/reports", label: "Reports", icon: BarChart3, end: true },
    ],
  },
  {
    id: "administration",
    label: "Administration",
    adminOnly: true,
    items: [
      {
        to: "/admin/rooms",
        label: "Manage Rooms",
        icon: ShieldCheck,
        end: true,
      },
    ],
  },
]

/**
 * Single nav link. Extracted + memoized so the presentational output is
 * stable across parent re-renders and role changes — the admin nav was
 * previously re-creating inline render functions every render, which
 * contributed to the perceived "shifting" on role switch.
 */
const SidebarNavItem = memo(function SidebarNavItem({ item }: { item: NavItem }) {
  const Icon = item.icon
  return (
    <li>
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
            <span className="truncate">{item.label}</span>
          </>
        )}
      </NavLink>
    </li>
  )
})

interface SidebarProps {
  userRole?: string
}

export function Sidebar({ userRole }: SidebarProps) {
  const isAdmin = userRole === "admin"

  // Resolve the visible groups once per render. Filtering by role here
  // keeps the admin/receptionist divergence to a single line and guarantees
  // identical layout behavior for both roles apart from extra items.
  const visibleGroups = NAV_GROUPS.filter(
    (group) => !group.adminOnly || isAdmin,
  )

  return (
    <aside className="hidden lg:flex lg:w-64 lg:flex-col lg:shrink-0 lg:border-r lg:border-sidebar-border lg:bg-sidebar lg:text-sidebar-foreground">
      <div className="flex h-16 shrink-0 items-center gap-2.5 border-b border-sidebar-border px-6">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
          <Music2 className="h-4 w-4" aria-hidden="true" />
        </div>
        <div className="flex min-w-0 flex-col leading-tight">
          <span className="truncate text-sm font-semibold tracking-tight">
            KTV Operations
          </span>
          <span className="truncate text-[11px] text-sidebar-foreground/60">
            Management Console
          </span>
        </div>
      </div>

      {/*
        scrollbar-gutter: stable reserves the vertical-scrollbar gutter at
        all times, so admin (which has more items) doesn't shift items
        horizontally when the scrollbar appears/disappears. This is the
        core fix for the "rotating/shifting" behavior — receptionist never
        overflowed, so only the admin view revealed the bug.
      */}
      <nav
        aria-label="Primary"
        className="min-h-0 flex-1 overflow-y-auto px-3 py-4 [scrollbar-gutter:stable]"
      >
        {visibleGroups.map((group, groupIdx) => (
          <div
            key={group.id}
            role="group"
            aria-labelledby={
              group.label ? `sidebar-group-${group.id}` : undefined
            }
            className={cn(groupIdx > 0 && "mt-6")}
          >
            {group.label ? (
              <p
                id={`sidebar-group-${group.id}`}
                className="mb-2 px-3 text-[11px] font-semibold uppercase tracking-wider text-sidebar-foreground/50"
              >
                {group.label}
              </p>
            ) : null}
            <ul className="flex flex-col gap-1">
              {group.items.map((item) => (
                <SidebarNavItem key={item.to} item={item} />
              ))}
            </ul>
          </div>
        ))}
      </nav>

      <div className="shrink-0 border-t border-sidebar-border px-6 py-4 text-[11px] text-sidebar-foreground/50">
        v1.0 &middot; {userRole ? userRole.toUpperCase() : "OPERATOR"}
      </div>
    </aside>
  )
}
