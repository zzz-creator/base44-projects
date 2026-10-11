import { Link, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard, AlertTriangle, Activity, BarChart3,
  Terminal, Settings, Users, Zap, Radio, ChevronRight,
  AlertOctagon, FlaskConical, Bot, Cpu, Monitor, Layers, ShieldAlert
} from 'lucide-react';

const navItems = [
  { icon: LayoutDashboard, label: 'Dashboard', path: '/' },
  { icon: AlertTriangle, label: 'Alerts', path: '/alerts' },
  { icon: AlertOctagon, label: 'Incidents', path: '/incidents' },
  { icon: Activity, label: 'Activity', path: '/activity' },
  { icon: BarChart3, label: 'Analytics', path: '/analytics' },
  { icon: Terminal, label: 'Command Center', path: '/command' },
];

const opsItems = [
  { icon: Zap, label: 'Automation', path: '/automation' },
  { icon: FlaskConical, label: 'Simulation Lab', path: '/simulation' },
  { icon: Bot, label: 'Ops AI+', path: '/ai' },
  { icon: Monitor, label: 'Computers', path: '/computers' },
  { icon: Layers, label: 'Workspace Control', path: '/workspace-control' },
  { icon: ShieldAlert, label: 'Incident Resolver', path: '/incident-resolution' },
];

const adminItems = [
  { icon: Users, label: 'Users', path: '/users' },
  { icon: Settings, label: 'Settings', path: '/settings' },
];

function NavLink({ icon: Icon, label, path, collapsed, badge }) {
  const location = useLocation();
  const active = location.pathname === path;
  return (
    <Link
      to={path}
      className={cn(
        'flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-all duration-150 group relative',
        active
          ? 'bg-neon-blue/10 text-neon-blue border border-neon-blue/20'
          : 'text-sidebar-foreground hover:bg-sidebar-accent hover:text-foreground'
      )}
    >
      <Icon className={cn('w-4 h-4 flex-shrink-0', active && 'text-neon-blue')} />
      {!collapsed && <span className="flex-1">{label}</span>}
      {!collapsed && badge && (
        <span className="text-xs font-mono px-1.5 py-0.5 rounded bg-neon-red/20 text-neon-red border border-neon-red/30">{badge}</span>
      )}
      {active && !collapsed && !badge && (
        <ChevronRight className="w-3 h-3 ml-auto text-neon-blue/60" />
      )}
      {active && (
        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 bg-neon-blue rounded-r" />
      )}
    </Link>
  );
}

export default function Sidebar({ collapsed = false }) {
  return (
    <aside className={cn(
      'flex flex-col h-full bg-sidebar border-r border-sidebar-border transition-all duration-300',
      collapsed ? 'w-16' : 'w-60'
    )}>
      {/* Logo */}
      <div className="flex items-center gap-3 px-4 py-5 border-b border-sidebar-border">
        <div className="flex items-center justify-center w-8 h-8 rounded bg-neon-blue/20 border border-neon-blue/40 flex-shrink-0">
          <Radio className="w-4 h-4 text-neon-blue" />
        </div>
        {!collapsed && (
          <div className="flex flex-col">
            <div>
              <span className="font-bold text-sm tracking-widest neon-text-blue">OPS</span>
              <span className="font-bold text-sm tracking-widest text-foreground">GRID</span>
            </div>
            <span className="text-xs text-muted-foreground font-mono tracking-wider">ENTERPRISE</span>
          </div>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 py-4 space-y-0.5 px-2 overflow-y-auto scrollbar-thin">
        {/* Monitor section */}
        {!collapsed && (
          <div className="px-3 pb-1.5 pt-1">
            <div className="text-xs font-mono text-muted-foreground/60 uppercase tracking-widest">Monitor</div>
          </div>
        )}
        {navItems.map(item => <NavLink key={item.path} {...item} collapsed={collapsed} />)}

        {/* Operations section */}
        <div className={cn('pt-4 pb-1.5', collapsed ? 'px-0' : 'px-3')}>
          {!collapsed && <div className="text-xs font-mono text-muted-foreground/60 uppercase tracking-widest">Operations</div>}
          {collapsed && <div className="border-t border-sidebar-border mx-2" />}
        </div>
        {opsItems.map(item => <NavLink key={item.path} {...item} collapsed={collapsed} />)}

        {/* Admin section */}
        <div className={cn('pt-4 pb-1.5', collapsed ? 'px-0' : 'px-3')}>
          {!collapsed && <div className="text-xs font-mono text-muted-foreground/60 uppercase tracking-widest">Admin</div>}
          {collapsed && <div className="border-t border-sidebar-border mx-2" />}
        </div>
        {adminItems.map(item => <NavLink key={item.path} {...item} collapsed={collapsed} />)}
      </nav>

      {/* System status */}
      <div className="px-4 py-4 border-t border-sidebar-border">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-neon-green status-pulse-green flex-shrink-0" />
          {!collapsed && <span className="text-xs text-muted-foreground font-mono">SYS NOMINAL</span>}
        </div>
      </div>
    </aside>
  );
}