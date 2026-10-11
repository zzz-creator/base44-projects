import { Outlet, Link, useLocation } from "react-router-dom";
import { useState, useEffect } from "react";
import { Shield, LayoutDashboard, Calendar, Megaphone, CreditCard, LogOut, Menu, X, Swords } from "lucide-react";
import { cn } from "@/lib/utils";
import { base44 } from "@/api/base44Client";

const navItems = [
  { path: "/portal", label: "My Progress", icon: LayoutDashboard },
  { path: "/portal/schedule", label: "Class Schedule", icon: Calendar },
  { path: "/portal/sparring", label: "Sparring", icon: Swords },
  { path: "/portal/announcements", label: "Announcements", icon: Megaphone },
  { path: "/portal/payments", label: "My Payments", icon: CreditCard },
];

export default function StudentLayout() {
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [user, setUser] = useState(null);

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => {});
  }, []);

  return (
    <div className="min-h-screen bg-background flex">
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/50 z-20 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      <aside className={cn(
        "fixed top-0 left-0 h-full w-64 bg-card border-r border-border z-30 flex flex-col transition-transform duration-300",
        "lg:translate-x-0 lg:static lg:z-auto",
        sidebarOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <div className="p-6 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center">
              <Shield className="w-5 h-5 text-primary-foreground" />
            </div>
            <div>
              <h1 className="font-bold text-lg leading-none">TKD Pro</h1>
              <p className="text-xs text-muted-foreground mt-0.5">Student Portal</p>
            </div>
          </div>
        </div>

        {user && (
          <div className="px-4 py-3 border-b border-border bg-muted/30">
            <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center font-bold text-primary text-sm mb-1.5 mx-auto">
              {user.full_name?.charAt(0) || "?"}
            </div>
            <p className="text-sm font-medium text-center truncate">{user.full_name}</p>
            <p className="text-xs text-muted-foreground text-center truncate">{user.email}</p>
          </div>
        )}

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

        <div className="p-4 border-t border-border">
          <button
            onClick={() => base44.auth.logout()}
            className="flex items-center gap-2 w-full px-3 py-2.5 rounded-lg text-sm font-medium text-muted-foreground hover:text-red-600 hover:bg-red-50 transition-all"
          >
            <LogOut className="w-4 h-4" /> Sign Out
          </button>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0">
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