import { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { X, AlertOctagon } from 'lucide-react';

export default function CreateIncidentModal({ onClose }) {
  const [form, setForm] = useState({ title: '', description: '', priority: 'medium', assigned_to: '', root_cause: '' });
  const [saving, setSaving] = useState(false);

  const save = async () => {
    if (!form.title.trim()) return;
    setSaving(true);
    await base44.entities.Incident.create({
      ...form,
      status: 'open',
      timeline: JSON.stringify([{ time: new Date().toISOString(), action: 'Incident opened' }]),
    });
    await base44.entities.Event.create({ type: 'alert', description: `Incident created: ${form.title}` });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
      <div className="w-full max-w-md bg-card border border-border rounded-xl shadow-2xl">
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <div className="flex items-center gap-2">
            <AlertOctagon className="w-4 h-4 text-neon-red" />
            <span className="text-sm font-mono font-semibold uppercase tracking-widest">New Incident</span>
          </div>
          <button onClick={onClose} className="p-1 rounded hover:bg-muted/50"><X className="w-4 h-4" /></button>
        </div>
        <div className="p-6 space-y-4">
          <div>
            <label className="text-xs font-mono text-muted-foreground uppercase tracking-wider">Title *</label>
            <input value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))}
              placeholder="Brief incident description"
              className="w-full mt-1.5 h-9 bg-input border border-border rounded-md px-3 text-sm font-mono text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-neon-red" />
          </div>
          <div>
            <label className="text-xs font-mono text-muted-foreground uppercase tracking-wider">Description</label>
            <textarea value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
              placeholder="What is happening?"
              rows={3}
              className="w-full mt-1.5 bg-input border border-border rounded-md px-3 py-2 text-sm font-mono text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-neon-red resize-none" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-mono text-muted-foreground uppercase tracking-wider">Priority</label>
              <select value={form.priority} onChange={e => setForm(p => ({ ...p, priority: e.target.value }))}
                className="w-full mt-1.5 h-9 bg-input border border-border rounded-md px-2 text-sm font-mono text-foreground focus:outline-none">
                <option value="critical">P1 — Critical</option>
                <option value="high">P2 — High</option>
                <option value="medium">P3 — Medium</option>
                <option value="low">P4 — Low</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-mono text-muted-foreground uppercase tracking-wider">Assign To</label>
              <input value={form.assigned_to} onChange={e => setForm(p => ({ ...p, assigned_to: e.target.value }))}
                placeholder="operator@org.com"
                className="w-full mt-1.5 h-9 bg-input border border-border rounded-md px-3 text-sm font-mono text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-neon-blue" />
            </div>
          </div>
          <div>
            <label className="text-xs font-mono text-muted-foreground uppercase tracking-wider">Root Cause Tag</label>
            <input value={form.root_cause} onChange={e => setForm(p => ({ ...p, root_cause: e.target.value }))}
              placeholder="e.g. network, cpu, config"
              className="w-full mt-1.5 h-9 bg-input border border-border rounded-md px-3 text-sm font-mono text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-neon-blue" />
          </div>
        </div>
        <div className="flex justify-end gap-2 px-6 py-4 border-t border-border">
          <button onClick={onClose} className="text-xs font-mono px-4 py-1.5 rounded border border-border text-muted-foreground hover:text-foreground transition-colors">CANCEL</button>
          <button onClick={save} disabled={saving || !form.title.trim()}
            className="text-xs font-mono px-4 py-1.5 rounded border border-neon-red/40 bg-neon-red/10 text-neon-red hover:bg-neon-red/20 disabled:opacity-40 transition-colors">
            {saving ? 'CREATING...' : 'CREATE INCIDENT'}
          </button>
        </div>
      </div>
    </div>
  );
}