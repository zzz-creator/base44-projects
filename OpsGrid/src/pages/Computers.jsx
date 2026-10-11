import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Cpu, Plus, Trash2, RefreshCw, Pencil, MemoryStick, HardDrive, Zap, Monitor } from 'lucide-react';
import { Button } from '@/components/ui/button';
import ComputerSetupWizard from '@/components/computers/ComputerSetupWizard';

const statusConfig = {
  online:  { color: 'text-neon-green',  dot: 'bg-neon-green',  label: 'ONLINE' },
  stressed:{ color: 'text-neon-red',    dot: 'bg-neon-red',    label: 'STRESSED' },
  offline: { color: 'text-muted-foreground', dot: 'bg-muted-foreground', label: 'OFFLINE' },
  idle:    { color: 'text-neon-blue',   dot: 'bg-neon-blue',   label: 'IDLE' },
};

const COMPONENT_ICONS = [
  { key: 'has_cpu',     label: 'CPU',     icon: Cpu,         usageKey: 'cpu_usage',     colorText: 'text-neon-blue',   colorBg: 'bg-neon-blue' },
  { key: 'has_ram',     label: 'RAM',     icon: MemoryStick, usageKey: 'ram_usage',     colorText: 'text-neon-green',  colorBg: 'bg-neon-green' },
  { key: 'has_storage', label: 'STO',     icon: HardDrive,   usageKey: 'storage_usage', colorText: 'text-neon-amber',  colorBg: 'bg-neon-amber' },
  { key: 'has_gpu',     label: 'GPU',     icon: Zap,         usageKey: 'gpu_usage',     colorText: 'text-neon-purple', colorBg: 'bg-neon-purple' },
];

function ConfirmDialog({ message, onConfirm, onCancel }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
      <div className="w-80 bg-card border border-border rounded-xl p-6 shadow-2xl">
        <p className="text-xs font-mono text-muted-foreground mb-4">{message}</p>
        <div className="flex gap-2 justify-end">
          <button onClick={onCancel} className="px-3 py-1.5 text-xs font-mono border border-border rounded hover:bg-muted/30 text-muted-foreground transition-colors">CANCEL</button>
          <button onClick={onConfirm} className="px-3 py-1.5 text-xs font-mono border border-neon-red/30 bg-neon-red/10 text-neon-red rounded hover:bg-neon-red/20 transition-colors">DELETE</button>
        </div>
      </div>
    </div>
  );
}

function UsageBar({ label, value, colorText, colorBg }) {
  const pct = Math.min(100, Math.max(0, value || 0));
  return (
    <div className="space-y-0.5">
      <div className="flex justify-between text-xs font-mono">
        <span className="text-muted-foreground">{label}</span>
        <span className={colorText}>{pct.toFixed(0)}%</span>
      </div>
      <div className="h-1 rounded-full bg-muted overflow-hidden">
        <div className={`h-full rounded-full transition-all duration-500 ${colorBg}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

export default function Computers() {
  const [computers, setComputers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showWizard, setShowWizard] = useState(false);
  const [editComputer, setEditComputer] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);

  const load = async () => {
    const data = await base44.entities.Computer.list('-created_date');
    setComputers(data);
    setLoading(false);
  };

  useEffect(() => {
    load();
    const unsub = base44.entities.Computer.subscribe(load);
    return () => unsub();
  }, []);

  const deleteComputer = async (id) => {
    await base44.entities.Computer.delete(id);
    setConfirmDelete(null);
    await load();
  };

  const handleWizardSave = () => {
    setShowWizard(false);
    setEditComputer(null);
    load();
  };

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-card/40 flex-shrink-0">
        <div className="flex items-center gap-3">
          <Monitor className="w-4 h-4 text-neon-blue" />
          <h1 className="text-sm font-mono font-semibold tracking-widest uppercase">Simulated Computers</h1>
          <span className="text-xs font-mono px-2 py-0.5 rounded bg-neon-blue/10 border border-neon-blue/30 text-neon-blue">{computers.length} NODES</span>
        </div>
        <div className="flex gap-2">
          <Button onClick={load} variant="ghost" size="sm" className="h-8 w-8 p-0 text-muted-foreground">
            <RefreshCw className="w-3.5 h-3.5" />
          </Button>
          <Button onClick={() => setShowWizard(true)} size="sm" className="h-8 text-xs font-mono bg-neon-blue/10 border border-neon-blue/30 text-neon-blue hover:bg-neon-blue/20">
            <Plus className="w-3.5 h-3.5 mr-1" /> ADD NODE
          </Button>
        </div>
      </div>

      <div className="flex-1 overflow-auto p-6">
        {loading ? (
          <div className="flex items-center justify-center h-40 text-muted-foreground text-xs font-mono">LOADING...</div>
        ) : computers.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-60 gap-4 text-muted-foreground">
            <Monitor className="w-10 h-10 opacity-30" />
            <p className="text-xs font-mono">No simulation nodes registered yet.</p>
            <Button onClick={() => setShowWizard(true)} size="sm" className="text-xs font-mono">
              <Plus className="w-3.5 h-3.5 mr-1" /> Add Your First Node
            </Button>
          </div>
        ) : (
          <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
            {computers.map(c => {
              const stat = statusConfig[c.status] || statusConfig.idle;
              const enabledComponents = COMPONENT_ICONS.filter(ci => c[ci.key]);
              return (
                <div key={c.id} className="bg-card border border-border rounded-lg p-4 flex flex-col gap-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full ${stat.dot} ${c.status === 'stressed' ? 'status-pulse-red' : c.status === 'online' ? 'status-pulse-green' : ''}`} />
                      <span className="text-sm font-mono font-semibold text-foreground">{c.name}</span>
                    </div>
                    <div className="flex gap-1">
                      <button onClick={() => setEditComputer(c)} className="p-1 rounded hover:bg-muted/40 text-muted-foreground hover:text-foreground transition-colors">
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      <button onClick={() => setConfirmDelete(c)} className="p-1 rounded hover:bg-neon-red/10 text-muted-foreground hover:text-neon-red transition-colors">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  <div className={`text-xs font-mono ${stat.color}`}>{stat.label}</div>

                  {/* Component badges */}
                  <div className="flex gap-1.5 flex-wrap">
                    {COMPONENT_ICONS.map(ci => (
                      <span key={ci.key} className={`text-xs font-mono px-1.5 py-0.5 rounded border ${c[ci.key] ? `${ci.color} border-current opacity-80` : 'text-muted-foreground/30 border-border'}`}>
                        {ci.label}
                      </span>
                    ))}
                  </div>

                  {/* Usage bars for enabled components when stressed/online */}
                  {(c.status === 'stressed' || c.status === 'online') && enabledComponents.length > 0 && (
                    <div className="space-y-1.5 pt-1 border-t border-border">
                      {enabledComponents.map(ci => (
                        <UsageBar key={ci.key} label={ci.label} value={c[ci.usageKey]} colorText={ci.colorText} colorBg={ci.colorBg} />
                      ))}
                    </div>
                  )}

                  {c.notes && (
                    <p className="text-xs font-mono text-muted-foreground/60 truncate">{c.notes}</p>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {(showWizard || editComputer) && (
        <ComputerSetupWizard
          editComputer={editComputer}
          onSaved={handleWizardSave}
          onClose={() => { setShowWizard(false); setEditComputer(null); }}
        />
      )}

      {confirmDelete && (
        <ConfirmDialog
          message={`Delete "${confirmDelete.name}"? This cannot be undone.`}
          onConfirm={() => deleteComputer(confirmDelete.id)}
          onCancel={() => setConfirmDelete(null)}
        />
      )}
    </div>
  );
}