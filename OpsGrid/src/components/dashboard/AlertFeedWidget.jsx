import { useState, useEffect } from 'react';
import { AlertTriangle, CheckCircle, Clock, X } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { formatDistanceToNow } from 'date-fns';

const severityConfig = {
  low: { color: 'text-neon-blue', bg: 'bg-neon-blue/10', border: 'border-neon-blue/20', label: 'LOW' },
  medium: { color: 'text-neon-amber', bg: 'bg-neon-amber/10', border: 'border-neon-amber/20', label: 'MED' },
  critical: { color: 'text-neon-red', bg: 'bg-neon-red/10', border: 'border-neon-red/20', label: 'CRIT' },
};

export default function AlertFeedWidget() {
  const [alerts, setAlerts] = useState([]);

  useEffect(() => {
    base44.entities.Alert.list('-created_date', 8).then(setAlerts).catch(() => {});
    const unsub = base44.entities.Alert.subscribe(() => {
      base44.entities.Alert.list('-created_date', 8).then(setAlerts).catch(() => {});
    });
    return () => unsub();
  }, []);

  const acknowledge = async (id) => {
    await base44.entities.Alert.update(id, { status: 'acknowledged' });
  };

  return (
    <div className="h-full flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-neon-amber" />
          <span className="text-xs font-mono uppercase tracking-widest text-muted-foreground">Alert Feed</span>
        </div>
        <span className="text-xs font-mono text-muted-foreground">{alerts.filter(a => a.status === 'active').length} active</span>
      </div>

      <div className="flex-1 overflow-y-auto space-y-1.5 scrollbar-thin pr-1">
        {alerts.length === 0 && (
          <div className="flex flex-col items-center justify-center h-24 text-muted-foreground">
            <CheckCircle className="w-6 h-6 mb-2 text-neon-green" />
            <span className="text-xs font-mono">ALL CLEAR</span>
          </div>
        )}
        {alerts.map(alert => {
          const cfg = severityConfig[alert.severity] || severityConfig.low;
          return (
            <div
              key={alert.id}
              className={`flex items-start gap-2 p-2 rounded border ${cfg.bg} ${cfg.border} ${
                alert.status !== 'active' ? 'opacity-50' : ''
              }`}
            >
              <span className={`text-xs font-mono font-bold flex-shrink-0 ${cfg.color} mt-0.5`}>
                {cfg.label}
              </span>
              <div className="flex-1 min-w-0">
                <p className="text-xs text-foreground/90 leading-relaxed truncate">{alert.message}</p>
                <div className="flex items-center gap-1 mt-0.5">
                  <Clock className="w-2.5 h-2.5 text-muted-foreground" />
                  <span className="text-xs text-muted-foreground font-mono">
                    {formatDistanceToNow(new Date(alert.created_date), { addSuffix: true })}
                  </span>
                </div>
              </div>
              {alert.status === 'active' && (
                <button
                  onClick={() => acknowledge(alert.id)}
                  className="flex-shrink-0 p-0.5 rounded hover:bg-white/10 transition-colors"
                  title="Acknowledge"
                >
                  <X className="w-3 h-3 text-muted-foreground" />
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}