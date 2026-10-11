import { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { X, Monitor, Cpu, MemoryStick, HardDrive, Zap, CheckCircle2, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

const COMPONENTS = [
  { key: 'has_cpu', label: 'CPU', icon: Cpu, borderOn: 'border-neon-blue/50', bgOn: 'bg-neon-blue/10', textOn: 'text-neon-blue', description: 'Simulate CPU load & usage' },
  { key: 'has_ram', label: 'RAM', icon: MemoryStick, borderOn: 'border-neon-green/50', bgOn: 'bg-neon-green/10', textOn: 'text-neon-green', description: 'Simulate memory pressure' },
  { key: 'has_storage', label: 'STORAGE', icon: HardDrive, borderOn: 'border-neon-amber/50', bgOn: 'bg-neon-amber/10', textOn: 'text-neon-amber', description: 'Simulate disk I/O & usage' },
  { key: 'has_gpu', label: 'GPU', icon: Zap, borderOn: 'border-neon-purple/50', bgOn: 'bg-neon-purple/10', textOn: 'text-neon-purple', description: 'Simulate GPU compute load' },
];

export default function ComputerSetupWizard({ onClose, onSaved, editComputer }) {
  const [name, setName] = useState(editComputer?.name || '');
  const [notes, setNotes] = useState(editComputer?.notes || '');
  const [components, setComponents] = useState({
    has_cpu: editComputer?.has_cpu ?? true,
    has_ram: editComputer?.has_ram ?? true,
    has_storage: editComputer?.has_storage ?? true,
    has_gpu: editComputer?.has_gpu ?? false,
  });
  const [saving, setSaving] = useState(false);
  const [nameError, setNameError] = useState('');

  const toggleComponent = (key) => {
    setComponents(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const save = async () => {
    if (!name.trim()) {
      setNameError('Computer name is required');
      return;
    }
    setNameError('');
    setSaving(true);
    const payload = {
      name: name.trim(),
      notes: notes.trim(),
      status: 'idle',
      ...components,
      cpu_usage: 0,
      ram_usage: 0,
      storage_usage: 0,
      gpu_usage: 0,
    };
    if (editComputer) {
      await base44.entities.Computer.update(editComputer.id, payload);
    } else {
      await base44.entities.Computer.create(payload);
    }
    setSaving(false);
    onSaved();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm" onClick={onClose}>
      <div className="w-full max-w-md bg-card border border-border rounded-xl shadow-2xl overflow-hidden" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-card/60">
          <div className="flex items-center gap-3">
            <Monitor className="w-4 h-4 text-neon-blue" />
            <span className="text-sm font-mono font-semibold tracking-widest uppercase text-foreground">
              {editComputer ? 'Edit Computer' : 'Add Simulated Computer'}
            </span>
          </div>
          <button onClick={onClose} className="p-1 rounded hover:bg-muted/50 transition-colors">
            <X className="w-4 h-4 text-muted-foreground" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5">
          {/* Name */}
          <div>
            <label className="text-xs font-mono text-muted-foreground mb-1.5 block">Computer Name</label>
            <Input
              value={name}
              onChange={e => { setName(e.target.value); setNameError(''); }}
              placeholder="e.g. Lab Node Alpha"
              className="bg-input border-border text-sm font-mono h-9"
            />
            {nameError && <p className="text-xs font-mono text-neon-red mt-1">{nameError}</p>}
          </div>

          {/* Components */}
          <div>
            <label className="text-xs font-mono text-muted-foreground mb-2 block uppercase tracking-wider">Simulated Hardware Components</label>
            <div className="grid grid-cols-2 gap-2">
              {COMPONENTS.map(({ key, label, icon: CompIcon, borderOn, bgOn, textOn, description }) => {
                const enabled = components[key];
                return (
                  <button
                    key={key}
                    onClick={() => toggleComponent(key)}
                    className={`flex flex-col items-start gap-2 p-3 rounded-lg border transition-all text-left ${
                      enabled ? `${borderOn} ${bgOn}` : 'border-border bg-muted/10 opacity-50'
                    }`}
                  >
                    <div className="flex items-center justify-between w-full">
                      <div className={`flex items-center gap-1.5 text-xs font-mono font-semibold ${enabled ? textOn : 'text-muted-foreground'}`}>
                        <CompIcon className="w-3.5 h-3.5" />
                        {label}
                      </div>
                      <div className={`w-8 h-4 rounded-full transition-all flex items-center px-0.5 ${enabled ? 'bg-muted-foreground/30' : 'bg-muted'}`}>
                        <div className={`w-3 h-3 rounded-full transition-transform ${enabled ? `translate-x-4 bg-white` : 'translate-x-0 bg-muted-foreground/50'}`} />
                      </div>
                    </div>
                    <span className="text-xs text-muted-foreground font-mono">{description}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="text-xs font-mono text-muted-foreground mb-1.5 block">Notes (optional)</label>
            <Input
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="e.g. Test environment node"
              className="bg-input border-border text-sm font-mono h-9"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-border bg-card/40">
          <Button variant="ghost" size="sm" onClick={onClose} className="text-xs font-mono text-muted-foreground">
            CANCEL
          </Button>
          <Button
            size="sm"
            onClick={save}
            disabled={saving}
            className="text-xs font-mono bg-neon-green/10 border border-neon-green/30 text-neon-green hover:bg-neon-green/20"
          >
            {saving ? <Loader2 className="w-3.5 h-3.5 mr-1 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5 mr-1" />}
            {saving ? 'SAVING...' : 'SAVE COMPUTER'}
          </Button>
        </div>
      </div>
    </div>
  );
}