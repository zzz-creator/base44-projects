import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { format } from 'date-fns';
import { Activity, User, Shield, Settings, Zap, AlertTriangle, Search, Download } from 'lucide-react';
import { Input } from '@/components/ui/input';

const typeConfig = {
  user_action: { icon: User, color: 'text-neon-blue', bg: 'bg-neon-blue/10', label: 'USER ACTION' },
  system: { icon: Zap, color: 'text-neon-green', bg: 'bg-neon-green/10', label: 'SYSTEM' },
  security: { icon: Shield, color: 'text-neon-red', bg: 'bg-neon-red/10', label: 'SECURITY' },
  config_change: { icon: Settings, color: 'text-neon-amber', bg: 'bg-neon-amber/10', label: 'CONFIG' },
  alert: { icon: AlertTriangle, color: 'text-neon-amber', bg: 'bg-neon-amber/10', label: 'ALERT' },
};

export default function ActivityPage() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');

  const load = async () => {
    const data = await base44.entities.Event.list('-created_date', 200);
    setEvents(data);
    setLoading(false);
  };

  useEffect(() => {
    load();
    const unsub = base44.entities.Event.subscribe(load);
    return () => unsub();
  }, []);

  const filtered = events.filter(e => {
    const matchSearch = !search || e.description?.toLowerCase().includes(search.toLowerCase());
    const matchType = typeFilter === 'all' || e.type === typeFilter;
    return matchSearch && matchType;
  });

  const exportCSV = () => {
    const csv = ['ID,Type,Description,User,Time', ...filtered.map(e =>
      `${e.id},${e.type},"${e.description}",${e.user_email || ''},${e.created_date}`
    )].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = 'activity_log.csv'; a.click();
  };

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-card/40 flex-shrink-0">
        <div className="flex items-center gap-3">
          <Activity className="w-4 h-4 text-neon-green" />
          <h1 className="text-sm font-mono font-semibold tracking-widest uppercase">Activity & Audit Log</h1>
        </div>
        <button onClick={exportCSV} className="flex items-center gap-1.5 text-xs font-mono px-3 py-1.5 rounded border border-border text-muted-foreground hover:text-foreground hover:border-muted-foreground transition-colors">
          <Download className="w-3 h-3" /> EXPORT CSV
        </button>
      </div>

      <div className="flex items-center gap-3 px-6 py-3 border-b border-border bg-card/20 flex-shrink-0">
        <div className="relative max-w-xs flex-1">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
          <Input placeholder="Search events..." value={search} onChange={e => setSearch(e.target.value)} className="pl-8 h-8 bg-input border-border text-xs font-mono" />
        </div>
        <div className="flex gap-1">
          {['all', 'user_action', 'system', 'security', 'config_change', 'alert'].map(t => (
            <button
              key={t}
              onClick={() => setTypeFilter(t)}
              className={`text-xs font-mono px-2.5 py-1 rounded border transition-colors ${
                typeFilter === t ? 'bg-neon-blue/10 border-neon-blue/30 text-neon-blue' : 'border-border text-muted-foreground hover:text-foreground'
              }`}
            >
              {t === 'all' ? 'ALL' : t.replace('_', ' ').toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-auto scrollbar-thin p-4">
        {loading ? (
          <div className="text-center py-12 text-muted-foreground font-mono text-xs">LOADING EVENT STREAM...</div>
        ) : (
          <div className="space-y-px">
            {filtered.map(event => {
              const cfg = typeConfig[event.type] || typeConfig.system;
              const Icon = cfg.icon;
              return (
                <div key={event.id} className="flex items-start gap-4 p-3 rounded hover:bg-muted/20 transition-colors group border border-transparent hover:border-border">
                  {/* Timeline line */}
                  <div className="flex flex-col items-center gap-1 flex-shrink-0 pt-1">
                    <div className={`w-7 h-7 rounded-md flex items-center justify-center ${cfg.bg}`}>
                      <Icon className={`w-3.5 h-3.5 ${cfg.color}`} />
                    </div>
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className={`text-xs font-mono font-bold ${cfg.color}`}>{cfg.label}</span>
                      {event.user_email && (
                        <span className="text-xs text-muted-foreground">• {event.user_email}</span>
                      )}
                    </div>
                    <p className="text-sm text-foreground/80">{event.description}</p>
                  </div>

                  <div className="text-right flex-shrink-0">
                    <div className="text-xs font-mono text-muted-foreground">
                      {format(new Date(event.created_date), 'HH:mm:ss')}
                    </div>
                    <div className="text-xs font-mono text-muted-foreground/60">
                      {format(new Date(event.created_date), 'MMM dd')}
                    </div>
                  </div>
                </div>
              );
            })}
            {filtered.length === 0 && (
              <div className="text-center py-12 text-muted-foreground font-mono text-xs">NO EVENTS MATCH FILTERS</div>
            )}
          </div>
        )}
      </div>

      <div className="px-6 py-2 border-t border-border text-xs font-mono text-muted-foreground flex gap-4 flex-shrink-0">
        <span>{filtered.length} events</span>
        <span>REAL-TIME STREAM ACTIVE</span>
      </div>
    </div>
  );
}