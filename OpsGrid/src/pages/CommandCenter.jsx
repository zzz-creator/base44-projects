import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { format } from 'date-fns';
import { Terminal, Play, CheckCircle, AlertTriangle, Loader2, Clock, Trash2, RefreshCw } from 'lucide-react';

const commandTemplates = [
  {
    category: 'System',
    commands: [
      { name: 'Restart API Gateway', type: 'system', critical: true, description: 'Gracefully restart the API gateway service' },
      { name: 'Flush Redis Cache', type: 'system', critical: false, description: 'Clear all keys from the cache layer' },
      { name: 'Run Health Check', type: 'system', critical: false, description: 'Execute full system health diagnostic' },
      { name: 'Rotate SSL Certs', type: 'system', critical: true, description: 'Renew and rotate SSL/TLS certificates' },
    ]
  },
  {
    category: 'Workflow',
    commands: [
      { name: 'Trigger ETL Pipeline', type: 'workflow', critical: false, description: 'Start the scheduled ETL data pipeline' },
      { name: 'Sync User Database', type: 'batch', critical: false, description: 'Force synchronize user database replicas' },
      { name: 'Generate Report', type: 'workflow', critical: false, description: 'Create system performance report' },
      { name: 'Purge Old Logs', type: 'batch', critical: true, description: 'Permanently delete logs older than 90 days' },
    ]
  },
  {
    category: 'Toggles',
    commands: [
      { name: 'Enable Maintenance Mode', type: 'toggle', critical: true, description: 'Put system into maintenance mode' },
      { name: 'Toggle Rate Limiting', type: 'toggle', critical: false, description: 'Enable/disable API rate limiting' },
      { name: 'Dark Launch Feature', type: 'toggle', critical: false, description: 'Toggle feature flag for dark launch' },
    ]
  }
];

const statusConfig = {
  pending: { color: 'text-muted-foreground', icon: Clock },
  running: { color: 'text-neon-blue', icon: Loader2, spin: true },
  completed: { color: 'text-neon-green', icon: CheckCircle },
  failed: { color: 'text-neon-red', icon: AlertTriangle },
};

export default function CommandCenter() {
  const [actions, setActions] = useState([]);
  const [running, setRunning] = useState({});
  const [confirm, setConfirm] = useState(null);

  const loadActions = () => {
    base44.entities.Action.list('-created_date', 30).then(setActions).catch(() => {});
  };

  useEffect(() => {
    loadActions();
    const unsub = base44.entities.Action.subscribe(loadActions);
    return () => unsub();
  }, []);

  const execute = async (cmd) => {
    if (cmd.critical && confirm !== cmd.name) {
      setConfirm(cmd.name);
      return;
    }
    setConfirm(null);
    setRunning(p => ({ ...p, [cmd.name]: true }));

    const action = await base44.entities.Action.create({
      name: cmd.name, type: cmd.type, status: 'running',
      triggered_by: 'admin', is_critical: cmd.critical,
    });

    await base44.entities.Event.create({
      type: 'user_action', description: `Command executed: ${cmd.name}`,
    });

    const delay = 1500 + Math.random() * 3000;
    await new Promise(r => setTimeout(r, delay));

    const success = Math.random() > 0.15;
    await base44.entities.Action.update(action.id, {
      status: success ? 'completed' : 'failed',
      result: success ? 'Executed successfully' : 'Execution failed - check logs',
    });
    setRunning(p => ({ ...p, [cmd.name]: false }));
  };

  const clearHistory = async () => {
    const completed = actions.filter(a => a.status === 'completed' || a.status === 'failed');
    await Promise.all(completed.map(a => base44.entities.Action.delete(a.id)));
  };

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-card/40 flex-shrink-0">
        <div className="flex items-center gap-3">
          <Terminal className="w-4 h-4 text-neon-green" />
          <h1 className="text-sm font-mono font-semibold tracking-widest uppercase">Command Center</h1>
        </div>
        <div className="flex gap-2">
          <button onClick={loadActions} className="p-1.5 rounded hover:bg-muted transition-colors">
            <RefreshCw className="w-3.5 h-3.5 text-muted-foreground" />
          </button>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Commands panel */}
        <div className="w-96 flex-shrink-0 border-r border-border overflow-y-auto scrollbar-thin">
          {commandTemplates.map(category => (
            <div key={category.category} className="border-b border-border">
              <div className="px-4 py-2 bg-muted/30 text-xs font-mono text-muted-foreground uppercase tracking-widest">
                {category.category}
              </div>
              {category.commands.map(cmd => (
                <div key={cmd.name} className="px-4 py-3 border-b border-border/50 hover:bg-muted/20 transition-colors">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 mb-0.5">
                        {cmd.critical && <AlertTriangle className="w-3 h-3 text-neon-red flex-shrink-0" />}
                        <span className="text-xs font-medium text-foreground">{cmd.name}</span>
                      </div>
                      <p className="text-xs text-muted-foreground font-mono">{cmd.description}</p>
                    </div>

                    <div className="flex flex-col gap-1 flex-shrink-0">
                      {confirm === cmd.name ? (
                        <div className="flex gap-1">
                          <button
                            onClick={() => setConfirm(null)}
                            className="text-xs px-2 py-1 rounded border border-border text-muted-foreground hover:bg-muted font-mono"
                          >NO</button>
                          <button
                            onClick={() => execute(cmd)}
                            className="text-xs px-2 py-1 rounded border border-neon-red/40 bg-neon-red/10 text-neon-red font-mono"
                          >YES</button>
                        </div>
                      ) : (
                        <button
                          onClick={() => execute(cmd)}
                          disabled={!!running[cmd.name]}
                          className={`flex items-center gap-1 text-xs px-3 py-1 rounded border font-mono transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                            cmd.critical
                              ? 'border-neon-red/30 bg-neon-red/5 text-neon-red hover:bg-neon-red/10'
                              : 'border-neon-blue/30 bg-neon-blue/5 text-neon-blue hover:bg-neon-blue/10'
                          }`}
                        >
                          {running[cmd.name] ? (
                            <><Loader2 className="w-3 h-3 animate-spin" /> RUNNING</>
                          ) : (
                            <><Play className="w-3 h-3" /> EXEC</>
                          )}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ))}
        </div>

        {/* Execution log */}
        <div className="flex-1 flex flex-col overflow-hidden">
          <div className="flex items-center justify-between px-4 py-2 border-b border-border bg-card/20">
            <span className="text-xs font-mono text-muted-foreground uppercase tracking-widest">Execution Log</span>
            <button onClick={clearHistory} className="flex items-center gap-1 text-xs font-mono text-muted-foreground hover:text-neon-red transition-colors">
              <Trash2 className="w-3 h-3" /> Clear
            </button>
          </div>
          <div className="flex-1 overflow-y-auto scrollbar-thin p-4 space-y-2">
            {actions.length === 0 && (
              <div className="text-center py-12 text-muted-foreground font-mono text-xs">NO COMMANDS EXECUTED YET</div>
            )}
            {actions.map(action => {
              const cfg = statusConfig[action.status] || statusConfig.pending;
              const Icon = cfg.icon;
              return (
                <div key={action.id} className="flex items-start gap-3 p-3 rounded border border-border/50 bg-muted/20 font-mono text-xs">
                  <Icon className={`w-4 h-4 flex-shrink-0 mt-0.5 ${cfg.color} ${cfg.spin ? 'animate-spin' : ''}`} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="text-foreground font-medium">{action.name}</span>
                      <span className={`${cfg.color} uppercase text-xs`}>{action.status}</span>
                      {action.is_critical && <span className="text-neon-red text-xs">● CRITICAL</span>}
                    </div>
                    {action.result && (
                      <div className="text-muted-foreground">{action.result}</div>
                    )}
                    <div className="text-muted-foreground/60 mt-0.5">
                      {format(new Date(action.created_date), 'HH:mm:ss')} • {action.triggered_by || 'system'}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}