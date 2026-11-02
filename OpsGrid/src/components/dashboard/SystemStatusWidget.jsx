import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Cpu, HardDrive, Server, MemoryStick, Zap, Monitor } from 'lucide-react';

function MetricBar({ label, value, icon: Icon, colorClass }) {
  const pct = Math.min(100, Math.max(0, value || 0));
  const color = pct > 80 ? 'bg-neon-red' : pct > 60 ? 'bg-neon-amber' : colorClass;
  const textColor = pct > 80 ? 'text-neon-red' : pct > 60 ? 'text-neon-amber' : 'text-neon-green';

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between text-xs">
        <div className="flex items-center gap-1.5">
          <Icon className={`w-3 h-3 ${textColor}`} />
          <span className="font-mono text-muted-foreground uppercase tracking-wider">{label}</span>
        </div>
        <span className={`font-mono font-medium ${textColor}`}>{pct.toFixed(1)}%</span>
      </div>
      <div className="h-1.5 bg-muted rounded-full overflow-hidden">
        <div className={`h-full ${color} rounded-full transition-all duration-700`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

const services = [
  { name: 'API Gateway', status: 'online' },
  { name: 'Auth Service', status: 'online' },
  { name: 'Data Pipeline', status: 'degraded' },
  { name: 'Scheduler', status: 'online' },
  { name: 'Cache Layer', status: 'online' },
];

const statusDot = {
  online: 'bg-neon-green status-pulse-green',
  degraded: 'bg-neon-amber status-pulse-amber',
  offline: 'bg-neon-red status-pulse-red',
};

const COMPONENT_METRICS = [
  { key: 'has_cpu',     usageKey: 'cpu_usage',     label: 'CPU',     icon: Cpu,         colorClass: 'bg-neon-blue' },
  { key: 'has_ram',     usageKey: 'ram_usage',      label: 'RAM',     icon: MemoryStick, colorClass: 'bg-neon-green' },
  { key: 'has_storage', usageKey: 'storage_usage',  label: 'Storage', icon: HardDrive,   colorClass: 'bg-neon-amber' },
  { key: 'has_gpu',     usageKey: 'gpu_usage',      label: 'GPU',     icon: Zap,         colorClass: 'bg-neon-purple' },
];

export default function SystemStatusWidget({ computerId }) {
  const [computer, setComputer] = useState(null);

  useEffect(() => {
    if (!computerId) { setComputer(null); return; }
    base44.entities.Computer.list().then(list => {
      setComputer(list.find(c => c.id === computerId) || null);
    });
    const unsub = base44.entities.Computer.subscribe(async () => {
      const list = await base44.entities.Computer.list();
      setComputer(list.find(c => c.id === computerId) || null);
    });
    return () => unsub();
  }, [computerId]);

  const isStressed = computer?.status === 'stressed';
  const hasComputer = !!computer;

  return (
    <div className="h-full flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Server className="w-4 h-4 text-neon-blue" />
          <span className="text-xs font-mono uppercase tracking-widest text-muted-foreground">System Health</span>
        </div>
        <div className={`flex items-center gap-1.5 px-2 py-0.5 rounded border ${
          isStressed
            ? 'bg-neon-red/10 border-neon-red/30'
            : 'bg-neon-green/10 border-neon-green/30'
        }`}>
          <div className={`w-1.5 h-1.5 rounded-full animate-pulse ${isStressed ? 'bg-neon-red' : 'bg-neon-green'}`} />
          <span className={`text-xs font-mono ${isStressed ? 'text-neon-red' : 'text-neon-green'}`}>
            {isStressed ? 'STRESSED' : 'NOMINAL'}
          </span>
        </div>
      </div>

      {hasComputer ? (
        <>
          <div className="flex items-center gap-1.5 mb-1">
            <Monitor className="w-3 h-3 text-muted-foreground" />
            <span className="text-xs font-mono text-muted-foreground truncate">{computer.name}</span>
          </div>
          <div className="space-y-2.5 flex-1">
            {COMPONENT_METRICS.filter(m => computer[m.key]).map(m => (
              <MetricBar
                key={m.key}
                label={m.label}
                value={computer[m.usageKey]}
                icon={m.icon}
                colorClass={m.colorClass}
              />
            ))}
          </div>
        </>
      ) : (
        <>
          <div className="space-y-2.5 flex-1">
            <MetricBar label="CPU"     value={0} icon={Cpu}         colorClass="bg-neon-blue" />
            <MetricBar label="RAM"     value={0} icon={MemoryStick} colorClass="bg-neon-green" />
            <MetricBar label="Storage" value={0} icon={HardDrive}   colorClass="bg-neon-amber" />
          </div>
          <p className="text-xs font-mono text-muted-foreground/50 text-center">Select a computer to see live metrics</p>
        </>
      )}

      <div className="pt-2 border-t border-border">
        <div className="text-xs font-mono text-muted-foreground uppercase tracking-wider mb-2">Services</div>
        <div className="space-y-1">
          {services.map(svc => (
            <div key={svc.name} className="flex items-center justify-between">
              <span className="text-xs text-foreground/80">{svc.name}</span>
              <div className="flex items-center gap-1.5">
                <div className={`w-1.5 h-1.5 rounded-full ${statusDot[svc.status]}`} />
                <span className={`text-xs font-mono uppercase ${
                  svc.status === 'online' ? 'text-neon-green' :
                  svc.status === 'degraded' ? 'text-neon-amber' : 'text-neon-red'
                }`}>{svc.status}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}