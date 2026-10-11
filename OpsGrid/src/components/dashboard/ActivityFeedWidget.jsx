import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { formatDistanceToNow } from 'date-fns';
import { Activity, User, Shield, Settings, AlertTriangle, Zap } from 'lucide-react';

const typeConfig = {
  user_action: { icon: User, color: 'text-neon-blue', label: 'USR' },
  system: { icon: Zap, color: 'text-neon-green', label: 'SYS' },
  security: { icon: Shield, color: 'text-neon-red', label: 'SEC' },
  config_change: { icon: Settings, color: 'text-neon-amber', label: 'CFG' },
  alert: { icon: AlertTriangle, color: 'text-neon-amber', label: 'ALT' },
};

export default function ActivityFeedWidget() {
  const [events, setEvents] = useState([]);

  useEffect(() => {
    base44.entities.Event.list('-created_date', 20).then(setEvents).catch(() => {});
    const unsub = base44.entities.Event.subscribe(() => {
      base44.entities.Event.list('-created_date', 20).then(setEvents).catch(() => {});
    });
    return () => unsub();
  }, []);

  return (
    <div className="h-full flex flex-col gap-3">
      <div className="flex items-center gap-2">
        <Activity className="w-4 h-4 text-neon-green" />
        <span className="text-xs font-mono uppercase tracking-widest text-muted-foreground">Activity Feed</span>
      </div>

      <div className="flex-1 overflow-y-auto space-y-px scrollbar-thin">
        {events.length === 0 && (
          <div className="text-center text-xs text-muted-foreground font-mono py-8">NO EVENTS YET</div>
        )}
        {events.map(event => {
          const cfg = typeConfig[event.type] || typeConfig.system;
          const Icon = cfg.icon;
          return (
            <div key={event.id} className="flex items-start gap-2.5 py-1.5 px-2 rounded hover:bg-muted/30 transition-colors group">
              <div className={`w-5 h-5 rounded flex items-center justify-center flex-shrink-0 mt-0.5 bg-muted ${cfg.color}`}>
                <Icon className="w-2.5 h-2.5" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs text-foreground/90 leading-relaxed">{event.description}</p>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className={`text-xs font-mono font-bold ${cfg.color}`}>{cfg.label}</span>
                  <span className="text-xs text-muted-foreground font-mono">
                    {formatDistanceToNow(new Date(event.created_date), { addSuffix: true })}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}