import { useState } from 'react';
import { Terminal, Play, AlertTriangle, CheckCircle, Loader2 } from 'lucide-react';
import { base44 } from '@/api/base44Client';

const commands = [
  { name: 'Flush Cache', type: 'system', critical: false, description: 'Clear all cached data' },
  { name: 'Restart Services', type: 'system', critical: true, description: 'Restart all microservices' },
  { name: 'Run Diagnostics', type: 'workflow', critical: false, description: 'Execute system diagnostic suite' },
  { name: 'Force Sync', type: 'batch', critical: false, description: 'Force data synchronization' },
  { name: 'Emergency Stop', type: 'toggle', critical: true, description: 'Halt all active operations' },
];

export default function CommandWidget() {
  const [running, setRunning] = useState({});
  const [confirm, setConfirm] = useState(null);
  const [log, setLog] = useState([]);

  const execute = async (cmd) => {
    if (cmd.critical && confirm !== cmd.name) {
      setConfirm(cmd.name);
      return;
    }
    setConfirm(null);
    setRunning(p => ({ ...p, [cmd.name]: true }));

    const action = await base44.entities.Action.create({
      name: cmd.name,
      type: cmd.type,
      status: 'running',
      triggered_by: 'admin',
      is_critical: cmd.critical,
    });

    await base44.entities.Event.create({
      type: 'user_action',
      description: `Command executed: ${cmd.name}`,
    });

    await new Promise(r => setTimeout(r, 2000 + Math.random() * 1500));
    const success = Math.random() > 0.15;
    await base44.entities.Action.update(action.id, { status: success ? 'completed' : 'failed', result: success ? 'OK' : 'ERR' });
    setLog(p => [{ cmd: cmd.name, ok: success, ts: new Date().toLocaleTimeString() }, ...p.slice(0, 4)]);
    setRunning(p => ({ ...p, [cmd.name]: false }));
  };

  return (
    <div className="h-full flex flex-col gap-3">
      <div className="flex items-center gap-2">
        <Terminal className="w-4 h-4 text-neon-green" />
        <span className="text-xs font-mono uppercase tracking-widest text-muted-foreground">Command Center</span>
      </div>

      <div className="space-y-1.5">
        {commands.map(cmd => (
          <div key={cmd.name}>
            <div className={`flex items-center justify-between p-2 rounded border transition-colors ${
              cmd.critical ? 'border-neon-red/20 bg-neon-red/5' : 'border-border bg-muted/30'
            }`}>
              <div>
                <div className="text-xs font-medium text-foreground flex items-center gap-1">
                  {cmd.critical && <AlertTriangle className="w-3 h-3 text-neon-red" />}
                  {cmd.name}
                </div>
                <div className="text-xs text-muted-foreground font-mono">{cmd.description}</div>
              </div>

              {confirm === cmd.name ? (
                <div className="flex gap-1">
                  <button onClick={() => setConfirm(null)} className="text-xs px-2 py-1 rounded border border-border text-muted-foreground hover:bg-muted">
                    Cancel
                  </button>
                  <button onClick={() => execute(cmd)} className="text-xs px-2 py-1 rounded bg-neon-red/20 border border-neon-red/40 text-neon-red font-mono">
                    CONFIRM
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => execute(cmd)}
                  disabled={!!running[cmd.name]}
                  className="flex items-center gap-1 text-xs px-2 py-1 rounded border border-neon-blue/30 bg-neon-blue/10 text-neon-blue hover:bg-neon-blue/20 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-mono"
                >
                  {running[cmd.name] ? <Loader2 className="w-3 h-3 animate-spin" /> : <Play className="w-3 h-3" />}
                  {running[cmd.name] ? 'RUNNING' : 'RUN'}
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {log.length > 0 && (
        <div className="mt-auto border-t border-border pt-2 space-y-1">
          <div className="text-xs font-mono text-muted-foreground">EXEC LOG</div>
          {log.map((entry, i) => (
            <div key={i} className="flex items-center gap-2 text-xs font-mono">
              {entry.ok ? <CheckCircle className="w-3 h-3 text-neon-green" /> : <AlertTriangle className="w-3 h-3 text-neon-red" />}
              <span className={entry.ok ? 'text-neon-green' : 'text-neon-red'}>{entry.cmd}</span>
              <span className="text-muted-foreground ml-auto">{entry.ts}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}