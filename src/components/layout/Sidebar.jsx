import { NavLink } from "react-router-dom";
import {
  LayoutDashboard, Users, CreditCard, FileText,
  BarChart3, Settings, BookOpen, GitBranch, UserCog,
  ChevronLeft, ChevronRight, MessageSquare, Car, Receipt, TrendingUp, Crosshair,
} from "lucide-react";
import { useSidebar } from "../../context/SidebarContext";
import { useAuth } from "../../context/AuthContext";

const getMenuItems = (role) => [
  { path: "/dashboard",             label: "Dashboard", icon: LayoutDashboard },
  { path: role === "super_admin" ? "/dashboard/students" : "/dashboard/my-students", label: "Students", icon: Users },
  { path: "/dashboard/payments",    label: "Payments",  icon: CreditCard },
  { path: "/dashboard/exams",       label: "Exams",     icon: FileText },
  { path: "/dashboard/broadcast",   label: "Broadcast", icon: MessageSquare, adminOnly: true },
  { path: "/dashboard/expenses",    label: "Performance", icon: TrendingUp,  adminOnly: true },
  { path: "/dashboard/targets",     label: "Targets",     icon: Crosshair },
  { path: "/dashboard/reports",     label: "Reports",   icon: BarChart3 },
  { path: "/dashboard/vehicles",    label: "Vehicles",  icon: Car,        adminOnly: true },
  { path: "/dashboard/branches",    label: "Branches",  icon: GitBranch,  adminOnly: true },
  { path: "/dashboard/courses",     label: "Courses",   icon: BookOpen,   adminOnly: true },
  { path: "/dashboard/users",       label: "Users",     icon: UserCog,    adminOnly: true },
  { path: "/dashboard/settings",    label: "Settings",  icon: Settings },
];

export default function Sidebar() {
  const { isCollapsed, isMobileOpen, toggleSidebar, closeMobileSidebar } = useSidebar();
  const { user } = useAuth();
  const menuItems = getMenuItems(user?.role);

  const branchLabel = user?.role === "super_admin" ? "Admin" : (user?.branch_name + " " + "Branch"  ?? "");

  return (
    <aside
      className={`
        fixed left-0 top-16 bottom-0
        bg-sidebar text-sidebar-foreground
        transition-[width,transform] duration-200 z-40 overflow-y-auto flex flex-col will-change-transform
        ${isCollapsed ? "w-[70px]" : "w-60"}
        ${isMobileOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"}
      `}
    >
      {/* Toggle row — branch name sits in the empty left space */}
      <div className="flex items-center border-b border-sidebar-border h-11 px-3 gap-2">
        {!isCollapsed && (
          <p className="flex-1 truncate text-[10px] font-bold uppercase tracking-widest text-sidebar-foreground/50">
            {branchLabel} 
          </p>
        )}
        <button
          onClick={toggleSidebar}
          className="hidden md:flex p-1.5 hover:bg-sidebar-accent rounded-lg ml-auto"
        >
          {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      </div>

      {/* Menu */}
      <nav className="p-3 space-y-1 flex-1">
        {menuItems
          .filter((item) => !item.adminOnly || user?.role === "super_admin")
          .map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                onClick={closeMobileSidebar}
                end={item.path === "/dashboard"}
                className={({ isActive }) =>
                  `flex items-center gap-3 py-3 rounded-lg transition-all
                  ${isActive ? "bg-primary text-white" : "hover:bg-sidebar-accent"}
                  ${isCollapsed ? "justify-center px-0" : "px-3"}`
                }
              >
                <Icon className="w-5 h-5 shrink-0" />
                {!isCollapsed && <span>{item.label}</span>}
              </NavLink>
            );
          })}
      </nav>

      {!isCollapsed && (
        <div className="p-4 text-xs text-sidebar-foreground/50 border-t border-sidebar-border">
          © 2026 Five Star Driving School Limited
        </div>
      )}
    </aside>
  );
}
