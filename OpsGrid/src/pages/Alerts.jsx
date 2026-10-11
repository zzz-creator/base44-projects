import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { formatDistanceToNow } from 'date-fns';
import { AlertTriangle, Plus, Search, X, RefreshCw, Trash2, CheckSquare, Square } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

const severityConfig = {
  low: { color: 'text-neon-blue', bg: 'bg-neon-blue/10', border: 'border-neon-blue/30', dot: 'bg-neon-blue' },
  medium: { color: 'text-neon-amber', bg: 'bg-neon-amber/10', border: 'border-neon-amber/30', dot: 'bg-neon-amber' },
  critical: { color: 'text-neon-red', bg: 'bg-neon-red/10', border: 'border-neon-red/30', dot: 'bg-neon-red' },
};

const statusConfig = {
  active: { label: 'ACTIVE', color: 'text-neon-red' },
  acknowledged: { label: "ACK'D", color: 'text-neon-amber' },
  resolved: { label: 'RESOLVED', color: 'text-neon-green' },
};

function ConfirmDialog({ title, message, onConfirm, onCancel, confirmLabel = 'CONFIRM' }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
      <div className="w-80 bg-card border border-border rounded-xl p-6 shadow-2xl">
        <div className="flex items-center gap-2 mb-3">
          <Trash2 className="w-4 h-4 text-neon-red" />
          <span className="text-sm font-mono font-semibold text-foreground">{title}</span>
        </div>
        <p className="text-xs font-mono text-muted-foreground mb-4">{message}</p>
        <div className="flex gap-2 justify-end">
          <button onClick={onCancel} className="px-3 py-1.5 text-xs font-mono border border-border rounded hover:bg-muted/30 text-muted-foreground transition-colors">CANCEL</button>
          <button onClick={onConfirm} className="px-3 py-1.5 text-xs font-mono border border-neon-red/30 bg-neon-red/10 text-neon-red rounded hover:bg-neon-red/20 transition-colors">{confirmLabel}</button>
        </div>
      </div>
    </div>
  );
}

export default function Alerts() {
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [severityFilter, setSeverityFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showCreate, setShowCreate] = useState(false);
  const [newAlert, setNewAlert] = useState({ type: '', severity: 'medium', message: '', source: '' });
  const [selected, setSelected] = useState(new Set());
  const [confirmAction, setConfirmAction] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);

  const load = async () => {
    const data = await base44.entities.Alert.list('-created_date', 100);
    setAlerts(data);
    setLoading(false);
  };

  useEffect(() => {
    load();
    const unsub = base44.entities.Alert.subscribe(load);
    return () => unsub();
  }, []);

  const acknowledge = async (id) => {
    await base44.entities.Alert.update(id, { status: 'acknowledged' });
    await base44.entities.Event.create({ type: 'alert', description: `Alert acknowledged: ${id}` });
  };

  const resolve = async (id) => {
    await base44.entities.Alert.update(id, { status: 'resolved', resolved_at: new Date().toISOString() });
    await base44.entities.Event.create({ type: 'alert', description: `Alert resolved: ${id}` });
  };

  const createAlert = async () => {
    await base44.entities.Alert.create({ ...newAlert, status: 'active' });
    await base44.entities.Event.create({ type: 'alert', description: `New alert created: ${newAlert.message}` });
    setNewAlert({ type: '', severity: 'medium', message: '', source: '' });
    setShowCreate(false);
  };

  const filtered = alerts.filter(a => {
    const matchSearch = !search || a.message?.toLowerCase().includes(search.toLowerCase()) || a.type?.toLowerCase().includes(search.toLowerCase());
    const matchSev = severityFilter === 'all' || a.severity === severityFilter;
    const matchStat = statusFilter === 'all' || a.status === statusFilter;
    return matchSearch && matchSev && matchStat;
  });

  const counts = {
    active: alerts.filter(a => a.status === 'active').length,
    critical: alerts.filter(a => a.severity === 'critical' && a.status === 'active').length
  };

  const allFilteredSelected = filtered.length > 0 && filtered.every(a => selected.has(a.id));
  const someSelected = selected.size > 0;

  const toggleSelect = (id) => {
    setSelected(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (allFilteredSelected) {
      setSelected(new Set());
    } else {
      setSelected(new Set(filtered.map(a => a.id)));
    }
  };

  const executeConfirmedAction = async () => {
    setActionLoading(true);
    if (confirmAction.type === 'delete-selected') {
      const ids = confirmAction.overrideIds || [...selected];
      await Promise.all(ids.map(id => base44.entities.Alert.delete(id)));
      await base44.entities.Event.create({ type: 'alert', description: `Bulk deleted ${ids.length} alerts` });
      setSelected(new Set());
    } else if (confirmAction.type === 'clear-all') {
      await Promise.all(alerts.map(a => base44.entities.Alert.delete(a.id)));
      await base44.entities.Event.create({ type: 'alert', description: `Cleared all ${alerts.length} alerts` });
      setSelected(new Set());
    }
    setConfirmAction(null);
    setActionLoading(false);
    await load();
  };

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-card/40 flex-shrink-0">
        <div className="flex items-center gap-3">
          <AlertTriangle className="w-4 h-4 text-neon-amber" />
          <h1 className="text-sm font-mono font-semibold tracking-widest uppercase">Alert Management</h1>
          <div className="flex gap-2 ml-2">
            <span className="text-xs font-mono px-2 py-0.5 rounded bg-neon-red/10 border border-neon-red/30 text-neon-red">{counts.active} ACTIVE</span>
            <span className="text-xs font-mono px-2 py-0.5 rounded bg-neon-red/20 border border-neon-red/40 text-neon-red">{counts.critical} CRITICAL</span>
          </div>
        </div>
        <div className="flex gap-2">
          <Button onClick={load} variant="ghost" size="sm" className="text-muted-foreground h-8 w-8 p-0">
            <RefreshCw className="w-3.5 h-3.5" />
          </Button>
          <Button
            onClick={() => setConfirmAction({ type: 'clear-all', label: 'CLEAR ALL', message: `This will permanently delete all ${alerts.length} alerts. This cannot be undone.` })}
            size="sm"
            variant="ghost"
            className="h-8 text-xs font-mono text-neon-red border border-neon-red/20 hover:bg-neon-red/10"
            disabled={alerts.length === 0}
          >
            <Trash2 className="w-3.5 h-3.5 mr-1" /> CLEAR ALL
          </Button>
          <Button onClick={() => setShowCreate(!showCreate)} size="sm" className="h-8 text-xs font-mono bg-neon-blue/10 border border-neon-blue/30 text-neon-blue hover:bg-neon-blue/20">
            <Plus className="w-3.5 h-3.5 mr-1" /> NEW ALERT
          </Button>
        </div>
      </div>

      {/* Create form */}
      {showCreate && (
        <div className="px-6 py-4 border-b border-border bg-muted/20">
          <div className="grid grid-cols-4 gap-3">
            <Input placeholder="Alert type" value={newAlert.type} onChange={e => setNewAlert(p => ({...p, type: e.target.value}))} className="bg-input border-border text-sm font-mono h-8" />
            <Input placeholder="Message" value={newAlert.message} onChange={e => setNewAlert(p => ({...p, message: e.target.value}))} className="bg-input border-border text-sm font-mono h-8 col-span-2" />
            <select value={newAlert.severity} onChange={e => setNewAlert(p => ({...p, severity: e.target.value}))} className="bg-input border border-border rounded-md text-sm font-mono h-8 px-2 text-foreground">
              <option value="low">LOW</option>
              <option value="medium">MEDIUM</option>
              <option value="critical">CRITICAL</option>
            </select>
          </div>
          <div className="flex gap-2 mt-2">
            <Button onClick={createAlert} size="sm" className="h-7 text-xs font-mono">CREATE</Button>
            <Button onClick={() => setShowCreate(false)} size="sm" variant="ghost" className="h-7 text-xs font-mono">CANCEL</Button>
          </div>
        </div>
      )}

      {/* Filters + bulk actions */}
      <div className="flex items-center gap-3 px-6 py-3 border-b border-border bg-card/20 flex-shrink-0 flex-wrap">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
          <Input
            placeholder="Search alerts..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-8 h-8 bg-input border-border text-xs font-mono"
          />
        </div>
        <div className="flex gap-1">
          {['all', 'low', 'medium', 'critical'].map(s => (
            <button key={s} onClick={() => setSeverityFilter(s)}
              className={`text-xs font-mono px-2.5 py-1 rounded border transition-colors ${severityFilter === s ? 'bg-neon-blue/10 border-neon-blue/30 text-neon-blue' : 'border-border text-muted-foreground hover:text-foreground'}`}>
              {s.toUpperCase()}
            </button>
          ))}
        </div>
        <div className="h-4 w-px bg-border" />
        <div className="flex gap-1">
          {['all', 'active', 'acknowledged', 'resolved'].map(s => (
            <button key={s} onClick={() => setStatusFilter(s)}
              className={`text-xs font-mono px-2.5 py-1 rounded border transition-colors ${statusFilter === s ? 'bg-neon-blue/10 border-neon-blue/30 text-neon-blue' : 'border-border text-muted-foreground hover:text-foreground'}`}>
              {s.toUpperCase()}
            </button>
          ))}
        </div>
        {someSelected && (
          <>
            <div className="h-4 w-px bg-border" />
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono text-muted-foreground">{selected.size} selected</span>
              <button
                onClick={() => setConfirmAction({ type: 'delete-selected', label: 'DELETE', message: `Delete ${selected.size} selected alert(s)? This cannot be undone.` })}
                className="flex items-center gap-1 text-xs font-mono px-2.5 py-1 rounded border border-neon-red/30 bg-neon-red/10 text-neon-red hover:bg-neon-red/20 transition-colors"
              >
                <Trash2 className="w-3 h-3" /> DELETE SELECTED
              </button>
              <button onClick={() => setSelected(new Set())} className="text-xs font-mono text-muted-foreground hover:text-foreground transition-colors">
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </>
        )}
      </div>

      {/* Table */}
      <div className="flex-1 overflow-auto scrollbar-thin">
        <table className="w-full text-xs font-mono">
          <thead className="sticky top-0 z-10 bg-card border-b border-border">
            <tr>
              <th className="px-4 py-2.5 w-10">
                <button onClick={toggleSelectAll} className="flex items-center justify-center">
                  {allFilteredSelected
                    ? <CheckSquare className="w-3.5 h-3.5 text-neon-blue" />
                    : <Square className="w-3.5 h-3.5 text-muted-foreground" />}
                </button>
              </th>
              {['Severity', 'Status', 'Type', 'Message', 'Source', 'Time', 'Actions'].map(h => (
                <th key={h} className="text-left px-4 py-2.5 text-muted-foreground tracking-wider uppercase text-xs">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={8} className="text-center py-12 text-muted-foreground">LOADING...</td></tr>
            ) : filtered.length === 0 ? (
              <tr><td colSpan={8} className="text-center py-12 text-muted-foreground">NO ALERTS MATCH FILTERS</td></tr>
            ) : filtered.map(alert => {
              const sev = severityConfig[alert.severity] || severityConfig.low;
              const stat = statusConfig[alert.status] || statusConfig.active;
              const isSelected = selected.has(alert.id);
              return (
                <tr key={alert.id} className={`border-b border-border/50 hover:bg-muted/20 transition-colors ${isSelected ? 'bg-neon-blue/5' : ''}`}>
                  <td className="px-4 py-2.5">
                    <button onClick={() => toggleSelect(alert.id)} className="flex items-center justify-center">
                      {isSelected ? <CheckSquare className="w-3.5 h-3.5 text-neon-blue" /> : <Square className="w-3.5 h-3.5 text-muted-foreground" />}
                    </button>
                  </td>
                  <td className="px-4 py-2.5">
                    <div className="flex items-center gap-1.5">
                      <div className={`w-1.5 h-1.5 rounded-full ${sev.dot}`} />
                      <span className={sev.color}>{alert.severity?.toUpperCase()}</span>
                    </div>
                  </td>
                  <td className="px-4 py-2.5"><span className={stat.color}>{stat.label}</span></td>
                  <td className="px-4 py-2.5 text-muted-foreground">{alert.type || '—'}</td>
                  <td className="px-4 py-2.5 max-w-xs truncate text-foreground/80">{alert.message}</td>
                  <td className="px-4 py-2.5 text-muted-foreground">{alert.source || '—'}</td>
                  <td className="px-4 py-2.5 text-muted-foreground whitespace-nowrap">
                    {formatDistanceToNow(new Date(alert.created_date), { addSuffix: true })}
                  </td>
                  <td className="px-4 py-2.5">
                    <div className="flex gap-1">
                      {alert.status === 'active' && (
                        <button onClick={() => acknowledge(alert.id)} className="px-2 py-0.5 rounded border border-neon-amber/30 text-neon-amber hover:bg-neon-amber/10 transition-colors">ACK</button>
                      )}
                      {alert.status !== 'resolved' && (
                        <button onClick={() => resolve(alert.id)} className="px-2 py-0.5 rounded border border-neon-green/30 text-neon-green hover:bg-neon-green/10 transition-colors">RESOLVE</button>
                      )}
                      <button
                        onClick={() => setConfirmAction({ type: 'delete-selected', label: 'DELETE', message: `Delete this alert? This cannot be undone.`, overrideIds: [alert.id] })}
                        className="px-2 py-0.5 rounded border border-neon-red/20 text-neon-red hover:bg-neon-red/10 transition-colors"
                      >
                        DEL
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="px-6 py-2 border-t border-border text-xs font-mono text-muted-foreground flex gap-4 flex-shrink-0">
        <span>{filtered.length} / {alerts.length} records</span>
        {someSelected && <span className="text-neon-blue">{selected.size} selected</span>}
        <span>LAST SYNC: {new Date().toLocaleTimeString('en-US', { hour12: false })}</span>
      </div>

      {confirmAction && (
        <ConfirmDialog
          title={confirmAction.label}
          message={confirmAction.message}
          onCancel={() => setConfirmAction(null)}
          confirmLabel={actionLoading ? 'PROCESSING...' : confirmAction.label}
          onConfirm={executeConfirmedAction}
        />
      )}
    </div>
  );
}