import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Server, Cpu, HardDrive, MemoryStick, Zap, Circle } from 'lucide-react';

const statusColors = {
  online:   { dot: 'bg-neon-green status-pulse-green', text: 'text-neon-green',       label: 'Online' },
  stressed: { dot: 'bg-neon-red status-pulse-red',     text: 'text-neon-red',         label: 'Stressed' },
  idle:     { dot: 'bg-neon-blue',                     text: 'text-neon-blue',        label: 'Idle' },
  offline:  { dot: 'bg-muted-foreground',              text: 'text-muted-foreground', label: 'Offline' },
};

function UsageBar({ value, color }) {
  const pct = Math.min(100, Math.max(0, value || 0));
  const barColor = pct > 80 ? 'bg-neon-red' : pct > 60 ? 'bg-neon-amber' : color;
  return (
    <div className="flex items-center gap-1.5 flex-1">
      <div className="flex-1 h-1.5 rounded-full bg-muted overflow-hidden">
        <div className={`h-full rounded-full transition-all duration-700 ${barColor}`} style={{ width: `${pct}%` }} />
      </div>
      <span className={`text-xs font-mono w-8 text-right ${pct > 80 ? 'text-neon-red' : pct > 60 ? 'text-neon-amber' : 'text-muted-foreground'}`}>
        {pct.toFixed(0)}%
      </span>
    </div>
  );
}

export default function InfrastructureProfileWidget() {
  const [computers, setComputers] = useState([]);

  useEffect(() => {
    base44.entities.Computer.list('-created_date').then(setComputers);
    const unsub = base44.entities.Computer.subscribe(async () => {
      const data = await base44.entities.Computer.list('-created_date');
      setComputers(data);
    });
    return () => unsub();
  }, []);

  const counts = { online: 0, stressed: 0, idle: 0, offline: 0 };
  computers.forEach(c => { if (counts[c.status] !== undefined) counts[c.status]++; });

  return (
    <div className="h-full flex flex-col gap-3">
      <div className="flex items-center gap-2">
        <Server className="w-4 h-4 text-neon-blue" />
        <span className="text-xs font-mono uppercase tracking-widest text-muted-foreground">Infrastructure — Node Overview</span>
      </div>

      {/* Summary row */}
      <div className="grid grid-cols-4 gap-2">
        {Object.entries(counts).map(([status, count]) => {
          const cfg = statusColors[status];
          return (
            <div key={status} className="flex flex-col items-center p-2 rounded-lg border border-border bg-muted/10">
              <div className={`w-2 h-2 rounded-full mb-1 ${cfg.dot}`} />
              <span className={`text-xl font-mono font-bold ${cfg.text}`}>{count}</span>
              <span className="text-xs font-mono text-muted-foreground">{cfg.label}</span>
            </div>
          );
        })}
      </div>

      {/* Node list */}
      <div className="flex-1 overflow-auto scrollbar-thin space-y-1.5">
        {computers.length === 0 && (
          <div className="text-center py-8 text-xs font-mono text-muted-foreground">
            No computers configured. Add nodes in the Computers tab.
          </div>
        )}
        {computers.map(c => {
          const cfg = statusColors[c.status] || statusColors.offline;
          return (
            <div key={c.id} className="p-2.5 rounded-lg border border-border bg-muted/5 space-y-1.5">
              <div className="flex items-center gap-2">
                <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${cfg.dot}`} />
                <span className="text-xs font-mono text-foreground font-medium flex-1 truncate">{c.name}</span>
                <span className={`text-xs font-mono ${cfg.text}`}>{cfg.label}</span>
              </div>
              <div className="grid grid-cols-2 gap-x-4 gap-y-1">
                {c.has_cpu && (
                  <div className="flex items-center gap-1">
                    <Cpu className="w-2.5 h-2.5 text-neon-blue flex-shrink-0" />
                    <span className="text-xs font-mono text-muted-foreground w-6">CPU</span>
                    <UsageBar value={c.cpu_usage} color="bg-neon-blue" />
                  </div>
                )}
                {c.has_ram && (
                  <div className="flex items-center gap-1">
                    <MemoryStick className="w-2.5 h-2.5 text-neon-green flex-shrink-0" />
                    <span className="text-xs font-mono text-muted-foreground w-6">RAM</span>
                    <UsageBar value={c.ram_usage} color="bg-neon-green" />
                  </div>
                )}
                {c.has_storage && (
                  <div className="flex items-center gap-1">
                    <HardDrive className="w-2.5 h-2.5 text-neon-amber flex-shrink-0" />
                    <span className="text-xs font-mono text-muted-foreground w-6">STO</span>
                    <UsageBar value={c.storage_usage} color="bg-neon-amber" />
                  </div>
                )}
                {c.has_gpu && (
                  <div className="flex items-center gap-1">
                    <Zap className="w-2.5 h-2.5 text-neon-purple flex-shrink-0" />
                    <span className="text-xs font-mono text-muted-foreground w-6">GPU</span>
                    <UsageBar value={c.gpu_usage} color="bg-neon-purple" />
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}