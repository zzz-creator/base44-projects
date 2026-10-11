import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Monitor, ChevronDown, Plus, Pencil, Trash2, RefreshCw, Wifi, WifiOff, Loader2 } from 'lucide-react';
import ComputerSetupWizard from './ComputerSetupWizard';

const statusConfig = {
  connected:  { label: 'Connected',  dot: 'bg-neon-green status-pulse-green', text: 'text-neon-green',       icon: '🟢' },
  connecting: { label: 'Connecting', dot: 'bg-neon-amber status-pulse-amber', text: 'text-neon-amber',       icon: '🟡' },
  online:     { label: 'Online',     dot: 'bg-neon-green status-pulse-green', text: 'text-neon-green',       icon: '🟢' },
  stressed:   { label: 'Stressed',   dot: 'bg-neon-red status-pulse-red',     text: 'text-neon-red',         icon: '🔴' },
  idle:       { label: 'Idle',       dot: 'bg-neon-blue',                     text: 'text-neon-blue',        icon: '🔵' },
  offline:    { label: 'Offline',    dot: 'bg-muted-foreground',              text: 'text-muted-foreground', icon: '⚫' },
  unknown:    { label: 'Unknown',    dot: 'bg-muted-foreground',              text: 'text-muted-foreground', icon: '⚪' },
};

export default function ComputerSwitcher({ activeId, onSelect, readOnly = false, selectOnly = false }) {
  const [computers, setComputers] = useState([]);
  const [open, setOpen] = useState(false);
  const [showWizard, setShowWizard] = useState(false);
  const [editComputer, setEditComputer] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [polling, setPolling] = useState({});

  const load = async () => {
    const data = await base44.entities.Computer.list('-created_date');
    setComputers(data);
    if (data.length > 0 && !activeId) {
      onSelect(data[0]);
    }
  };

  useEffect(() => {
    load();
  }, []);

  // Poll active computer status
  useEffect(() => {
    const active = computers.find(c => c.id === activeId);
    if (!active) return;

    const poll = async () => {
      setPolling(p => ({ ...p, [active.id]: true }));
      try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 4000);
        const res = await fetch(`http://${active.ip_address}:${active.port}/system-report`, { signal: controller.signal });
        clearTimeout(timeout);
        const newStatus = res.ok ? 'connected' : 'offline';
        if (active.status !== newStatus) {
          await base44.entities.Computer.update(active.id, { status: newStatus, last_seen: res.ok ? new Date().toISOString() : active.last_seen });
          load();
        }
      } catch {
        if (active.status !== 'offline') {
          await base44.entities.Computer.update(active.id, { status: 'offline' });
          load();
        }
      }
      setPolling(p => ({ ...p, [active.id]: false }));
    };

    poll();
    const interval = setInterval(poll, 15000);
    return () => clearInterval(interval);
  }, [activeId, computers.length]);

  const handleDelete = async (computer) => {
    await base44.entities.Computer.delete(computer.id);
    if (activeId === computer.id) onSelect(null);
    setConfirmDelete(null);
    load();
  };

  const active = computers.find(c => c.id === activeId);
  const activeCfg = statusConfig[active?.status || 'unknown'];

  return (
    <>
      <div className="relative">
        <button
          onClick={() => !readOnly && setOpen(p => !p)}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border border-border bg-card/60 text-xs font-mono ${readOnly ? 'cursor-default opacity-80' : 'hover:bg-muted/30 transition-colors'}`}
        >
          <Monitor className="w-3.5 h-3.5 text-neon-blue" />
          {active ? (
            <>
              <div className={`w-1.5 h-1.5 rounded-full ${activeCfg.dot}`} />
              <span className="text-foreground max-w-28 truncate">{active.name}</span>
            </>
          ) : (
            <span className="text-muted-foreground">Select Computer</span>
          )}
          {!readOnly && <ChevronDown className="w-3 h-3 text-muted-foreground" />}
        </button>

        {open && !readOnly && (
          <div className="absolute top-full left-0 mt-1 w-72 bg-card border border-border rounded-lg shadow-2xl z-50 overflow-hidden">
            <div className="px-3 py-2 border-b border-border flex items-center justify-between">
              <span className="text-xs font-mono text-muted-foreground uppercase tracking-widest">Computers</span>
              {!selectOnly && (
                <button
                  onClick={() => { setEditComputer(null); setShowWizard(true); setOpen(false); }}
                  className="flex items-center gap-1 text-xs font-mono text-neon-blue hover:text-neon-blue/80 transition-colors"
                >
                  <Plus className="w-3 h-3" /> Add
                </button>
              )}
            </div>

            {computers.length === 0 ? (
              <div className="p-4 text-center">
                <Monitor className="w-6 h-6 text-muted-foreground mx-auto mb-2" />
                <p className="text-xs font-mono text-muted-foreground">No computers configured</p>
                {!selectOnly && (
                  <button
                    onClick={() => { setEditComputer(null); setShowWizard(true); setOpen(false); }}
                    className="mt-2 text-xs font-mono text-neon-blue hover:underline"
                  >
                    + Setup first computer
                  </button>
                )}
              </div>
            ) : (
              <div className="max-h-60 overflow-auto scrollbar-thin">
                {computers.map(c => {
                  const cfg = statusConfig[c.status || 'unknown'];
                  return (
                    <div
                      key={c.id}
                      className={`flex items-center gap-2 px-3 py-2.5 hover:bg-muted/30 transition-colors cursor-pointer group ${
                        c.id === activeId ? 'bg-neon-blue/5 border-l-2 border-neon-blue' : ''
                      }`}
                      onClick={() => { onSelect(c); setOpen(false); }}
                    >
                      <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${cfg.dot}`} />
                      <div className="flex-1 min-w-0">
                        <div className="text-xs font-mono text-foreground truncate">{c.name}</div>
                        <div className="text-xs font-mono text-muted-foreground">{c.ip_address}:{c.port}</div>
                      </div>
                      {!selectOnly && (
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          {polling[c.id] && <Loader2 className="w-3 h-3 text-muted-foreground animate-spin" />}
                          <button
                            onClick={e => { e.stopPropagation(); setEditComputer(c); setShowWizard(true); setOpen(false); }}
                            className="p-1 rounded hover:bg-muted/50"
                          >
                            <Pencil className="w-3 h-3 text-muted-foreground" />
                          </button>
                          <button
                            onClick={e => { e.stopPropagation(); setConfirmDelete(c); setOpen(false); }}
                            className="p-1 rounded hover:bg-neon-red/10"
                          >
                            <Trash2 className="w-3 h-3 text-neon-red" />
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            <div className="px-3 py-2 border-t border-border">
              <button onClick={() => { load(); }} className="flex items-center gap-1 text-xs font-mono text-muted-foreground hover:text-foreground transition-colors">
                <RefreshCw className="w-3 h-3" /> Refresh
              </button>
            </div>
          </div>
        )}

        {/* Click outside to close */}
        {open && <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />}
      </div>

      {/* Setup Wizard */}
      {showWizard && (
        <ComputerSetupWizard
          onClose={() => { setShowWizard(false); setEditComputer(null); }}
          onSaved={() => { setShowWizard(false); setEditComputer(null); load(); }}
          editComputer={editComputer}
        />
      )}

      {/* Delete confirmation */}
      {confirmDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
          <div className="w-80 bg-card border border-border rounded-xl p-6 shadow-2xl">
            <div className="flex items-center gap-2 mb-3">
              <Trash2 className="w-4 h-4 text-neon-red" />
              <span className="text-sm font-mono font-semibold text-foreground">Remove Computer</span>
            </div>
            <p className="text-xs font-mono text-muted-foreground mb-4">
              Remove <span className="text-foreground font-semibold">{confirmDelete.name}</span>? This cannot be undone.
            </p>
            <div className="flex gap-2 justify-end">
              <button
                onClick={() => setConfirmDelete(null)}
                className="px-3 py-1.5 text-xs font-mono border border-border rounded hover:bg-muted/30 text-muted-foreground transition-colors"
              >
                CANCEL
              </button>
              <button
                onClick={() => handleDelete(confirmDelete)}
                className="px-3 py-1.5 text-xs font-mono border border-neon-red/30 bg-neon-red/10 text-neon-red rounded hover:bg-neon-red/20 transition-colors"
              >
                REMOVE
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}