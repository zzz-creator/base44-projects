import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Shield, AlertTriangle, Lock, Eye, UserX } from 'lucide-react';

const severityColor = {
  critical: 'text-neon-red border-neon-red/30 bg-neon-red/10',
  medium: 'text-neon-amber border-neon-amber/30 bg-neon-amber/10',
  low: 'text-neon-green border-neon-green/30 bg-neon-green/10',
};

function ThreatScore({ score }) {
  const color = score > 70 ? 'text-neon-red' : score > 40 ? 'text-neon-amber' : 'text-neon-green';
  const label = score > 70 ? 'HIGH RISK' : score > 40 ? 'MODERATE' : 'LOW RISK';
  return (
    <div className="flex flex-col items-center justify-center p-4 rounded-lg border border-border bg-muted/10">
      <span className="text-xs font-mono text-muted-foreground uppercase tracking-wider mb-1">Threat Score</span>
      <span className={`text-4xl font-mono font-bold ${color}`}>{score}</span>
      <span className={`text-xs font-mono mt-1 ${color}`}>{label}</span>
    </div>
  );
}

const SECURITY_EVENTS = [
  { icon: UserX, label: 'Failed Logins (24h)', value: '14', color: 'text-neon-amber' },
  { icon: Lock, label: 'Auth Tokens Revoked', value: '3', color: 'text-neon-red' },
  { icon: Eye, label: 'Anomalies Detected', value: '2', color: 'text-neon-red' },
  { icon: Shield, label: 'Firewall Blocks', value: '87', color: 'text-neon-green' },
];

export default function SecurityProfileWidget() {
  const [alerts, setAlerts] = useState([]);

  useEffect(() => {
    base44.entities.Alert.filter({ severity: 'critical' }, '-created_date', 5).then(setAlerts);
    const unsub = base44.entities.Alert.subscribe(async () => {
      const data = await base44.entities.Alert.filter({ severity: 'critical' }, '-created_date', 5);
      setAlerts(data);
    });
    return () => unsub();
  }, []);

  const threatScore = Math.min(100, alerts.filter(a => a.status === 'active').length * 18 + 12);

  return (
    <div className="h-full flex flex-col gap-4">
      {/* Header */}
      <div className="flex items-center gap-2">
        <Shield className="w-4 h-4 text-neon-blue" />
        <span className="text-xs font-mono uppercase tracking-widest text-muted-foreground">Security Overview</span>
      </div>

      <div className="grid grid-cols-2 gap-4 flex-1">
        {/* Threat score */}
        <ThreatScore score={threatScore} />

        {/* Security stats */}
        <div className="grid grid-cols-2 gap-2">
          {SECURITY_EVENTS.map(({ icon: IconComp, label, value, color }) => (
            <div key={label} className="flex flex-col gap-1 p-2.5 rounded-lg border border-border bg-muted/10">
              <IconComp className={`w-3.5 h-3.5 ${color}`} />
              <span className={`text-lg font-mono font-bold ${color}`}>{value}</span>
              <span className="text-xs font-mono text-muted-foreground leading-tight">{label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Critical alerts */}
      <div>
        <div className="text-xs font-mono text-muted-foreground uppercase tracking-wider mb-1.5">Critical Alerts</div>
        <div className="space-y-1 max-h-28 overflow-auto scrollbar-thin">
          {alerts.length === 0 && (
            <div className="flex items-center gap-2 text-xs font-mono text-neon-green py-1">
              <Shield className="w-3 h-3" /> No critical alerts — system secure
            </div>
          )}
          {alerts.map(a => (
            <div key={a.id} className={`flex items-center gap-2 px-2 py-1 rounded border text-xs font-mono ${severityColor[a.severity] || severityColor.low}`}>
              <AlertTriangle className="w-3 h-3 flex-shrink-0" />
              <span className="truncate">{a.message}</span>
              <span className="ml-auto opacity-60 uppercase text-xs">{a.status}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}