import { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { X, User, Tag } from 'lucide-react';
import { format } from 'date-fns';

const STATUSES = ['open', 'investigating', 'mitigated', 'resolved'];
const STATUS_COLORS = {
  open: 'text-neon-red border-neon-red/40',
  investigating: 'text-neon-amber border-neon-amber/40',
  mitigated: 'text-neon-blue border-neon-blue/40',
  resolved: 'text-neon-green border-neon-green/40',
};

export default function IncidentDetail({ incident, onClose, onUpdate }) {
  const [note, setNote] = useState('');
  const [saving, setSaving] = useState(false);

  const timeline = (() => {
    try { return JSON.parse(incident.timeline || '[]'); } catch { return []; }
  })();

  const updateStatus = async (status) => {
    const newEntry = { time: new Date().toISOString(), action: `Status changed to ${status}` };
    const updatedTimeline = JSON.stringify([...timeline, newEntry]);
    await base44.entities.Incident.update(incident.id, {
      status,
      timeline: updatedTimeline,
      ...(status === 'resolved' ? { resolved_at: new Date().toISOString() } : {}),
    });
    await base44.entities.Event.create({ type: 'system', description: `Incident "${incident.title}" status → ${status}` });
    onUpdate();
  };

  const addNote = async () => {
    if (!note.trim()) return;
    setSaving(true);
    const newEntry = { time: new Date().toISOString(), action: note.trim(), type: 'note' };
    const updatedTimeline = JSON.stringify([...timeline, newEntry]);
    await base44.entities.Incident.update(incident.id, { timeline: updatedTimeline });
    setNote('');
    setSaving(false);
    onUpdate();
  };

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center justify-between px-5 py-3 border-b border-border bg-card/40">
        <span className="text-xs font-mono text-muted-foreground uppercase tracking-wider">Incident Detail</span>
        <button onClick={onClose} className="p-1 rounded hover:bg-muted/50"><X className="w-3.5 h-3.5" /></button>
      </div>

      <div className="flex-1 overflow-auto scrollbar-thin p-5 space-y-5">
        {/* Title + meta */}
        <div>
          <h2 className="text-base font-semibold text-foreground">{incident.title}</h2>
          {incident.description && <p className="text-xs text-muted-foreground mt-1">{incident.description}</p>}
          <div className="flex flex-wrap gap-2 mt-2">
            {incident.assigned_to && (
              <span className="flex items-center gap-1 text-xs font-mono text-muted-foreground">
                <User className="w-3 h-3" />{incident.assigned_to}
              </span>
            )}
            {incident.root_cause && (
              <span className="flex items-center gap-1 text-xs font-mono text-muted-foreground">
                <Tag className="w-3 h-3" />{incident.root_cause}
              </span>
            )}
          </div>
        </div>

        {/* Status change */}
        <div>
          <div className="text-xs font-mono text-muted-foreground uppercase tracking-wider mb-2">Update Status</div>
          <div className="flex flex-wrap gap-2">
            {STATUSES.map(s => (
              <button key={s} onClick={() => updateStatus(s)}
                className={`text-xs font-mono px-3 py-1.5 rounded border transition-colors ${incident.status === s ? STATUS_COLORS[s] + ' bg-current/10 font-bold' : 'border-border text-muted-foreground hover:text-foreground hover:border-foreground/30'}`}>
                {s.toUpperCase()}
              </button>
            ))}
          </div>
        </div>

        {/* Timeline */}
        <div>
          <div className="text-xs font-mono text-muted-foreground uppercase tracking-wider mb-2">Timeline</div>
          {timeline.length === 0 && (
            <div className="text-xs text-muted-foreground font-mono">No timeline events yet</div>
          )}
          <div className="space-y-2">
            {/* Created entry */}
            <div className="flex items-start gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-neon-blue mt-1.5 flex-shrink-0" />
              <div>
                <div className="text-xs text-foreground/80">Incident created</div>
                <div className="text-xs text-muted-foreground font-mono">{format(new Date(incident.created_date), 'MMM dd HH:mm')}</div>
              </div>
            </div>
            {timeline.map((e, i) => (
              <div key={i} className="flex items-start gap-2">
                <div className={`w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0 ${e.type === 'note' ? 'bg-neon-amber' : 'bg-neon-green'}`} />
                <div>
                  <div className="text-xs text-foreground/80">{e.action}</div>
                  <div className="text-xs text-muted-foreground font-mono">{format(new Date(e.time), 'MMM dd HH:mm')}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Add note */}
        <div>
          <div className="text-xs font-mono text-muted-foreground uppercase tracking-wider mb-2">Add Note</div>
          <div className="flex gap-2">
            <input value={note} onChange={e => setNote(e.target.value)}
              placeholder="Document your investigation..."
              className="flex-1 h-8 bg-input border border-border rounded-md px-3 text-xs font-mono text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-neon-blue"
              onKeyDown={e => e.key === 'Enter' && addNote()}
            />
            <button onClick={addNote} disabled={saving || !note.trim()}
              className="h-8 px-3 rounded border border-neon-blue/30 bg-neon-blue/10 text-neon-blue text-xs font-mono hover:bg-neon-blue/20 disabled:opacity-40 transition-colors">
              ADD
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}