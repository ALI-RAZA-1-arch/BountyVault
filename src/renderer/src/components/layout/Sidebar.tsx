import { NavLink } from "react-router-dom"
import { Shield, Target, FileText, DollarSign, Play, BarChart3, Calendar, Settings } from "lucide-react"

export function Sidebar() {
  const navItems = [
    { to: "/", label: "Dashboard", icon: Shield },
    { to: "/targets", label: "Targets", icon: Target },
    { to: "/reports", label: "Reports", icon: FileText },
    { to: "/bounties", label: "Bounties", icon: DollarSign },
    { to: "/monthly", label: "Monthly Earnings", icon: Calendar },
    { to: "/workflows", label: "Workflows", icon: Play },
    { to: "/statistics", label: "Statistics", icon: BarChart3 },
    { to: "/settings", label: "Settings", icon: Settings },
  ]

  return (
    <aside className="w-60 bg-sidebar border-r flex flex-col h-full text-sidebar-foreground">
      <div className="p-6 border-b flex items-center space-x-2">
        <Shield className="h-6 w-6 text-primary" />
        <span className="font-bold text-lg tracking-wider">BountyVault</span>
      </div>
      <nav className="flex-1 py-4 space-y-1 px-3 overflow-y-auto">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              `flex items-center space-x-3 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                isActive
                  ? "bg-accent text-accent-foreground border-l-2 border-primary"
                  : "text-muted-foreground hover:bg-accent/50 hover:text-foreground"
              }`
            }
          >
            <item.icon className="h-4 w-4 shrink-0" />
            <span>{item.label}</span>
          </NavLink>
        ))}
      </nav>
      <div className="p-4 border-t text-center text-xs text-muted-foreground bg-muted/20">
        BountyVault v1.0.0
      </div>
    </aside>
  )
}