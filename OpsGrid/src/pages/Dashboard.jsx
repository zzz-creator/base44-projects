import { useState } from 'react';
import WidgetPanel from '@/components/dashboard/WidgetPanel';
import SystemStatusWidget from '@/components/dashboard/SystemStatusWidget';
import AlertFeedWidget from '@/components/dashboard/AlertFeedWidget';
import AnalyticsWidget from '@/components/dashboard/AnalyticsWidget';
import KPIWidget from '@/components/dashboard/KPIWidget';
import ActivityFeedWidget from '@/components/dashboard/ActivityFeedWidget';
import SecurityProfileWidget from '@/components/dashboard/SecurityProfileWidget';
import AnalyticsProfileWidget from '@/components/dashboard/AnalyticsProfileWidget';
import InfrastructureProfileWidget from '@/components/dashboard/InfrastructureProfileWidget';
import ComputerSwitcher from '@/components/computers/ComputerSwitcher';
import { LayoutDashboard, RefreshCw } from 'lucide-react';


const profiles = ['Operations', 'Security', 'Analytics', 'Infrastructure'];

export default function Dashboard() {
  const [activeProfile, setActiveProfile] = useState('Operations');
  const [lastRefresh, setLastRefresh] = useState(new Date());
  const [activeComputer, setActiveComputer] = useState(null);

  const refresh = () => setLastRefresh(new Date());

  return (
    <div className="h-full flex flex-col">
      {/* Dashboard header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-border flex-shrink-0 bg-card/40 backdrop-blur-sm">
        <div className="flex items-center gap-3">
          <LayoutDashboard className="w-4 h-4 text-neon-blue" />
          <h1 className="text-sm font-mono font-semibold text-foreground tracking-widest uppercase">OpsGrid Dashboard</h1>
          <div className="h-4 w-px bg-border" />
          <div className="flex gap-1">
            {profiles.map(p => (
              <button
                key={p}
                onClick={() => setActiveProfile(p)}
                className={`text-xs font-mono px-3 py-1 rounded border transition-colors ${
                  activeProfile === p
                    ? 'bg-neon-blue/10 border-neon-blue/30 text-neon-blue'
                    : 'border-border text-muted-foreground hover:text-foreground hover:border-muted-foreground'
                }`}
              >
                {p.toUpperCase()}
              </button>
            ))}
          </div>
        </div>
        <div className="flex items-center gap-3">
          <ComputerSwitcher
            activeId={activeComputer?.id}
            onSelect={setActiveComputer}
            selectOnly
          />
          <button onClick={refresh} className="flex items-center gap-1.5 text-xs font-mono text-muted-foreground hover:text-foreground transition-colors">
            <RefreshCw className="w-3 h-3" />
            {lastRefresh.toLocaleTimeString('en-US', { hour12: false })}
          </button>
        </div>
      </div>

      {/* Widget grid */}
      <div className="flex-1 p-4 overflow-auto">

        {/* OPERATIONS */}
        {activeProfile === 'Operations' && (
          <div className="grid grid-cols-4 gap-4 auto-rows-[240px]">
            <WidgetPanel size="medium" accentColor="green" className="col-span-2">
              <SystemStatusWidget computerId={activeComputer?.id} />
            </WidgetPanel>
            <WidgetPanel size="medium" accentColor="amber" className="col-span-2">
              <AlertFeedWidget />
            </WidgetPanel>
            <WidgetPanel size="wide" accentColor="blue" className="col-span-2 row-span-2" style={{height: '500px'}}>
              <AnalyticsWidget />
            </WidgetPanel>
            <WidgetPanel size="medium" accentColor="blue" className="col-span-2">
              <KPIWidget />
            </WidgetPanel>
            <WidgetPanel size="wide" accentColor="green" className="col-span-4">
              <ActivityFeedWidget />
            </WidgetPanel>
          </div>
        )}

        {/* SECURITY */}
        {activeProfile === 'Security' && (
          <div className="grid grid-cols-4 gap-4 auto-rows-[240px]">
            <WidgetPanel accentColor="red" className="col-span-2 row-span-2" style={{height: '500px'}}>
              <SecurityProfileWidget />
            </WidgetPanel>
            <WidgetPanel accentColor="amber" className="col-span-2">
              <AlertFeedWidget />
            </WidgetPanel>
            <WidgetPanel accentColor="blue" className="col-span-2">
              <ActivityFeedWidget />
            </WidgetPanel>
            <WidgetPanel accentColor="green" className="col-span-4">
              <KPIWidget />
            </WidgetPanel>
          </div>
        )}

        {/* ANALYTICS */}
        {activeProfile === 'Analytics' && (
          <div className="grid grid-cols-4 gap-4 auto-rows-[240px]">
            <WidgetPanel accentColor="blue" className="col-span-4 row-span-2" style={{height: '500px'}}>
              <AnalyticsProfileWidget />
            </WidgetPanel>
            <WidgetPanel accentColor="green" className="col-span-2">
              <KPIWidget />
            </WidgetPanel>
            <WidgetPanel accentColor="amber" className="col-span-2">
              <AlertFeedWidget />
            </WidgetPanel>
          </div>
        )}

        {/* INFRASTRUCTURE */}
        {activeProfile === 'Infrastructure' && (
          <div className="grid grid-cols-4 gap-4 auto-rows-[240px]">
            <WidgetPanel accentColor="blue" className="col-span-2 row-span-2" style={{height: '500px'}}>
              <InfrastructureProfileWidget />
            </WidgetPanel>
            <WidgetPanel accentColor="green" className="col-span-2">
              <SystemStatusWidget computerId={activeComputer?.id} />
            </WidgetPanel>
            <WidgetPanel accentColor="amber" className="col-span-2">
              <AlertFeedWidget />
            </WidgetPanel>
            <WidgetPanel accentColor="green" className="col-span-4">
              <ActivityFeedWidget />
            </WidgetPanel>
          </div>
        )}

      </div>
    </div>
  );
}