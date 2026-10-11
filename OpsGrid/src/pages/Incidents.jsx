import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { AlertOctagon, Plus, Clock, User, Tag, ChevronDown, ChevronUp } from 'lucide-react';
import { formatDistanceToNow, format } from 'date-fns';
import IncidentDetail from '@/components/incidents/IncidentDetail';
import CreateIncidentModal from '@/components/incidents/CreateIncidentModal';

const STATUS_CONFIG = {
  open: { label: 'OPEN', color: 'text-neon-red', bg: 'bg-neon-red/10 border-neon-red/30' },
  investigating: { label: 'INVESTIGATING', color: 'text-neon-amber', bg: 'bg-neon-amber/10 border-neon-amber/30' },
  mitigated: { label: 'MITIGATED', color: 'text-neon-blue', bg: 'bg-neon-blue/10 border-neon-blue/30' },
  resolved: { label: 'RESOLVED', color: 'text-neon-green', bg: 'bg-neon-green/10 border-neon-green/30' },
};

const PRIORITY_CONFIG = {
  critical: { label: 'P1', color: 'text-neon-red' },
  high: { label: 'P2', color: 'text-neon-amber' },
  medium: { label: 'P3', color: 'text-neon-blue' },
  low: { label: 'P4', color: 'text-muted-foreground' },
};

export default function Incidents() {
  const [incidents, setIncidents] = useState([]);
  const [selected, setSelected] = useState(null);
  const [showCreate, setShowCreate] = useState(false);
  const [filter, setFilter] = useState('all');
  const [loading, setLoading] = useState(true);

  const load = () => base44.entities.Incident.list('-created_date').then(setIncidents).finally(() => setLoading(false));
  useEffect(() => { load(); }, []);

  const filtered = filter === 'all' ? incidents : incidents.filter(i => i.status === filter);

  const openCount = incidents.filter(i => i.status === 'open').length;
  const investigatingCount = incidents.filter(i => i.status === 'investigating').length;

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-card/40 flex-shrink-0">
        <div className="flex items-center gap-3">
          <AlertOctagon className="w-4 h-4 text-neon-red" />
          <h1 className="text-sm font-mono font-semibold tracking-widest uppercase">Incident Management</h1>
          {openCount > 0 && (
            <span className="px-2 py-0.5 rounded border border-neon-red/30 bg-neon-red/10 text-neon-red text-xs font-mono animate-pulse">{openCount} OPEN</span>
          )}
        </div>
        <button onClick={() => setShowCreate(true)}
          className="flex items-center gap-1.5 text-xs font-mono px-4 py-1.5 rounded border border-neon-red/30 bg-neon-red/10 text-neon-red hover:bg-neon-red/20 transition-colors">
          <Plus className="w-3.5 h-3.5" /> NEW INCIDENT
        </button>
      </div>

      {/* Status filter + stats */}
      <div className="flex items-center gap-4 px-6 py-3 border-b border-border bg-card/20 flex-shrink-0 overflow-x-auto">
        {['all', 'open', 'investigating', 'mitigated', 'resolved'].map(s => (
          <button key={s} onClick={() => setFilter(s)}
            className={`text-xs font-mono uppercase tracking-wider whitespace-nowrap transition-colors ${filter === s ? 'text-foreground border-b border-neon-blue pb-0.5' : 'text-muted-foreground hover:text-foreground'}`}>
            {s === 'all' ? `ALL (${incidents.length})` : `${s} (${incidents.filter(i => i.status === s).length})`}
          </button>
        ))}
      </div>

      {/* Main content */}
      <div className="flex-1 overflow-hidden flex">
        {/* List */}
        <div className={`${selected ? 'w-1/2 border-r border-border' : 'w-full'} overflow-auto scrollbar-thin`}>
          {loading && <div className="text-center text-xs font-mono text-muted-foreground py-12">LOADING...</div>}
          {!loading && filtered.length === 0 && (
            <div className="text-center py-16">
              <AlertOctagon className="w-8 h-8 text-muted-foreground mx-auto mb-3" />
              <div className="text-sm font-mono text-muted-foreground">NO INCIDENTS</div>
            </div>
          )}
          <div className="divide-y divide-border/50">
            {filtered.map(inc => {
              const sc = STATUS_CONFIG[inc.status] || STATUS_CONFIG.open;
              const pc = PRIORITY_CONFIG[inc.priority] || PRIORITY_CONFIG.medium;
              return (
                <div key={inc.id} onClick={() => setSelected(inc)}
                  className={`px-6 py-4 cursor-pointer hover:bg-muted/20 transition-colors ${selected?.id === inc.id ? 'bg-muted/30 border-l-2 border-neon-blue' : ''}`}>
                  <div className="flex items-start gap-3">
                    <div className={`text-xs font-mono font-bold ${pc.color} w-6 flex-shrink-0 mt-0.5`}>{pc.label}</div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-medium text-foreground truncate">{inc.title}</span>
                        <span className={`text-xs font-mono px-1.5 py-0.5 rounded border ${sc.bg} ${sc.color}`}>{sc.label}</span>
                      </div>
                      <div className="flex items-center gap-3 mt-1.5 text-xs font-mono text-muted-foreground">
                        {inc.assigned_to && (
                          <span className="flex items-center gap-1"><User className="w-2.5 h-2.5" />{inc.assigned_to}</span>
                        )}
                        <span className="flex items-center gap-1"><Clock className="w-2.5 h-2.5" />{formatDistanceToNow(new Date(inc.created_date), { addSuffix: true })}</span>
                      </div>
                      {inc.description && <p className="text-xs text-muted-foreground mt-1 line-clamp-1">{inc.description}</p>}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Detail panel */}
        {selected && (
          <div className="w-1/2 overflow-auto scrollbar-thin">
            <IncidentDetail incident={selected} onClose={() => setSelected(null)} onUpdate={() => { load(); }} />
          </div>
        )}
      </div>

      {showCreate && <CreateIncidentModal onClose={() => { setShowCreate(false); load(); }} />}
    </div>
  );
}