import { Outlet, Link, useLocation } from "react-router-dom";
import { useState } from "react";
import { base44 } from "@/api/base44Client";
import {
  LayoutDashboard, Users, Calendar, CheckSquare, Award, CreditCard, Megaphone, Settings, Menu, Shield, LogOut, QrCode, FileText, Package, Swords
} from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { path: "/", label: "Dashboard", icon: LayoutDashboard },
  { path: "/students", label: "Students", icon: Users },
  { path: "/classes", label: "Classes", icon: Calendar },
  { path: "/attendance", label: "Attendance", icon: CheckSquare },
  { path: "/promotions", label: "Promotions", icon: Award },
  { path: "/payments", label: "Payments", icon: CreditCard },
  { path: "/announcements", label: "Announcements", icon: Megaphone },
  { path: "/belt-config", label: "Belt Config", icon: Settings },
  { path: "/accounts", label: "Accounts", icon: Users },
  { path: "/evaluation-report", label: "Evaluation Reports", icon: FileText },
  { path: "/checkin-station", label: "Check-In Station", icon: QrCode },
  { path: "/inventory", label: "Inventory", icon: Package },
  { path: "/sparring", label: "Sparring Matches", icon: Swords },
];

export default function Layout() {
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-background flex">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/50 z-20 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Sidebar */}
      <aside className={cn(
        "fixed top-0 left-0 h-full w-64 bg-card border-r border-border z-30 flex flex-col transition-transform duration-300",
        "lg:translate-x-0 lg:static lg:z-auto",
        sidebarOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        {/* Logo */}
        <div className="p-6 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center">
              <Shield className="w-5 h-5 text-primary-foreground" />
            </div>
            <div>
              <h1 className="font-bold text-lg leading-none">TKD Pro</h1>
              <p className="text-xs text-muted-foreground mt-0.5">Dojo Management</p>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {navItems.map(({ path, label, icon: Icon }) => {
            const active = location.pathname === path;
            return (
              <Link
                key={path}
                to={path}
                onClick={() => setSidebarOpen(false)}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all",
                  active
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted"
                )}
              >
                <Icon className="w-4 h-4 flex-shrink-0" />
                {label}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-border space-y-2">
          <button
            onClick={() => base44.auth.logout()}
            className="flex items-center gap-2 w-full px-3 py-2 rounded-lg text-sm font-medium text-muted-foreground hover:text-red-600 hover:bg-red-50 transition-all"
          >
            <LogOut className="w-4 h-4" /> Sign Out
          </button>
          <p className="text-xs text-muted-foreground text-center">TKD Pro v1.0</p>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Mobile top bar */}
        <div className="lg:hidden flex items-center gap-3 p-4 border-b border-border bg-card sticky top-0 z-10">
          <button onClick={() => setSidebarOpen(true)} className="p-2 rounded-lg hover:bg-muted">
            <Menu className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2">
            <Shield className="w-5 h-5" />
            <span className="font-bold">TKD Pro</span>
          </div>
        </div>

        <main className="flex-1 p-6 lg:p-8 overflow-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}