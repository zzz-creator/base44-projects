import React from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from './utils';
import { LayoutDashboard, Globe, Ship, TrendingUp, Users, Menu, X, AlertTriangle, Building2, Beaker, Handshake, Wrench, DollarSign, Anchor } from 'lucide-react';
import { Button } from "./components/ui/button";

export default function Layout({ children, currentPageName }) {
  const [sidebarOpen, setSidebarOpen] = React.useState(true);

  const navItems = [
    { name: 'Dashboard', path: 'Dashboard', icon: LayoutDashboard },
    { name: 'Colonies', path: 'Colonies', icon: Globe },
    { name: 'Ships', path: 'Fleet', icon: Ship },
    { name: 'Fleets', path: 'Fleets', icon: Anchor },
    { name: 'Ship Designer', path: 'ShipDesigner', icon: Wrench },
    { name: 'Trade Routes', path: 'TradeRoutes', icon: TrendingUp },
    { name: 'Market', path: 'Market', icon: DollarSign },
    { name: 'Combat', path: 'Combat', icon: AlertTriangle },
    { name: 'Factions', path: 'Factions', icon: Users },
    { name: 'Threats', path: 'Threats', icon: AlertTriangle },
    { name: 'Infrastructure', path: 'Infrastructure', icon: Building2 },
    { name: 'Research', path: 'Research', icon: Beaker },
    { name: 'Diplomacy', path: 'Diplomacy', icon: Handshake }
  ];

  return (
    <div className="min-h-screen bg-slate-900 flex">
      {/* Sidebar */}
      <aside 
        className={`
          ${sidebarOpen ? 'w-64' : 'w-20'} 
          bg-slate-800 border-r border-slate-700 transition-all duration-300 flex flex-col
        `}
      >
        <div className="p-4 border-b border-slate-700">
          <div className="flex items-center justify-between">
            {sidebarOpen && (
              <div>
                <h2 className="text-white font-bold text-lg">Command</h2>
                <p className="text-slate-400 text-xs">Control Center</p>
              </div>
            )}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="text-slate-400 hover:text-white hover:bg-slate-700"
            >
              {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </Button>
          </div>
        </div>

        <nav className="flex-1 p-4">
          <div className="space-y-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentPageName === item.path;
              
              return (
                <Link
                  key={item.path}
                  to={createPageUrl(item.path)}
                  className={`
                    flex items-center gap-3 px-3 py-2 rounded-lg transition-colors
                    ${isActive 
                      ? 'bg-blue-600 text-white' 
                      : 'text-slate-300 hover:bg-slate-700 hover:text-white'
                    }
                  `}
                >
                  <Icon className="w-5 h-5 flex-shrink-0" />
                  {sidebarOpen && <span>{item.name}</span>}
                </Link>
              );
            })}
          </div>
        </nav>

        <div className="p-4 border-t border-slate-700">
          {sidebarOpen ? (
            <div className="text-xs text-slate-500">
              <div className="font-semibold text-slate-400 mb-1">System Status</div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                <span>Operational</span>
              </div>
            </div>
          ) : (
            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse mx-auto"></div>
          )}
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        {children}
      </main>
    </div>
  );
}