import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Zap, Plus, Trash2, ChevronRight, ToggleLeft, ToggleRight } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import RuleBuilder from '@/components/automation/RuleBuilder';

const triggerLabels = {
  alert_created: { label: 'Alert Created', color: 'text-neon-red', bg: 'bg-neon-red/10 border-neon-red/30' },
  metric_threshold: { label: 'Metric Threshold', color: 'text-neon-amber', bg: 'bg-neon-amber/10 border-neon-amber/30' },
  user_action: { label: 'User Action', color: 'text-neon-blue', bg: 'bg-neon-blue/10 border-neon-blue/30' },
  scheduled: { label: 'Scheduled', color: 'text-neon-purple', bg: 'bg-neon-purple/10 border-neon-purple/30' },
};

const actionLabels = {
  send_notification: 'Send Notification',
  trigger_workflow: 'Trigger Workflow',
  escalate_alert: 'Escalate Alert',
  execute_command: 'Execute Command',
  update_record: 'Update Record',
};

export default function AutomationEngine() {
  const [rules, setRules] = useState([]);
  const [showBuilder, setShowBuilder] = useState(false);
  const [loading, setLoading] = useState(true);

  const load = () => base44.entities.AutomationRule.list('-created_date').then(setRules).finally(() => setLoading(false));
  useEffect(() => { load(); }, []);

  const toggleStatus = async (rule) => {
    const next = rule.status === 'active' ? 'inactive' : 'active';
    await base44.entities.AutomationRule.update(rule.id, { status: next });
    load();
  };

  const deleteRule = async (id) => {
    await base44.entities.AutomationRule.delete(id);
    load();
  };

  const activeCount = rules.filter(r => r.status === 'active').length;
  const totalTriggered = rules.reduce((s, r) => s + (r.triggered_count || 0), 0);

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-card/40 flex-shrink-0">
        <div className="flex items-center gap-3">
          <Zap className="w-4 h-4 text-neon-amber" />
          <h1 className="text-sm font-mono font-semibold tracking-widest uppercase">Automation Engine</h1>
          <span className="px-2 py-0.5 rounded border border-neon-amber/30 bg-neon-amber/10 text-neon-amber text-xs font-mono">{activeCount} ACTIVE</span>
        </div>
        <button
          onClick={() => setShowBuilder(true)}
          className="flex items-center gap-1.5 text-xs font-mono px-4 py-1.5 rounded border border-neon-amber/30 bg-neon-amber/10 text-neon-amber hover:bg-neon-amber/20 transition-colors"
        >
          <Plus className="w-3.5 h-3.5" /> NEW RULE
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 px-6 py-4 border-b border-border flex-shrink-0">
        {[
          { label: 'Total Rules', value: rules.length, color: 'text-foreground' },
          { label: 'Active Rules', value: activeCount, color: 'text-neon-green' },
          { label: 'Total Triggered', value: totalTriggered, color: 'text-neon-amber' },
        ].map(s => (
          <div key={s.label} className="panel px-4 py-3">
            <div className="text-xs font-mono text-muted-foreground uppercase tracking-wider">{s.label}</div>
            <div className={`text-2xl font-mono font-bold mt-1 ${s.color}`}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* Rules list */}
      <div className="flex-1 overflow-auto scrollbar-thin p-6 space-y-3">
        {loading && <div className="text-center text-xs font-mono text-muted-foreground py-12">LOADING RULES...</div>}
        {!loading && rules.length === 0 && (
          <div className="text-center py-16">
            <Zap className="w-8 h-8 text-muted-foreground mx-auto mb-3" />
            <div className="text-sm font-mono text-muted-foreground">NO AUTOMATION RULES</div>
            <div className="text-xs text-muted-foreground/60 mt-1">Click "NEW RULE" to create your first automation</div>
          </div>
        )}
        {rules.map(rule => {
          const trig = triggerLabels[rule.trigger_type] || triggerLabels.alert_created;
          return (
            <div key={rule.id} className={`panel p-4 flex items-center gap-4 transition-all ${rule.status === 'inactive' ? 'opacity-50' : ''}`}>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1.5">
                  <span className="text-sm font-medium text-foreground">{rule.name}</span>
                  <span className={`text-xs font-mono px-1.5 py-0.5 rounded border ${trig.bg} ${trig.color}`}>{trig.label}</span>
                </div>
                <div className="flex items-center gap-1.5 text-xs font-mono text-muted-foreground">
                  <span className="text-muted-foreground/60">IF</span>
                  <span className="text-foreground/70">{rule.trigger_config ? JSON.parse(rule.trigger_config).summary || '...' : '...'}</span>
                  <ChevronRight className="w-3 h-3" />
                  <span className="text-muted-foreground/60">THEN</span>
                  <span className="text-foreground/70">{actionLabels[rule.action_type]}</span>
                </div>
                <div className="flex items-center gap-3 mt-1.5 text-xs font-mono text-muted-foreground/50">
                  <span>Triggered {rule.triggered_count || 0}×</span>
                  {rule.last_triggered && <span>Last: {formatDistanceToNow(new Date(rule.last_triggered), { addSuffix: true })}</span>}
                </div>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <button onClick={() => toggleStatus(rule)} className="p-1.5 rounded hover:bg-muted/50 transition-colors">
                  {rule.status === 'active'
                    ? <ToggleRight className="w-5 h-5 text-neon-green" />
                    : <ToggleLeft className="w-5 h-5 text-muted-foreground" />}
                </button>
                <button onClick={() => deleteRule(rule.id)} className="p-1.5 rounded hover:bg-neon-red/10 transition-colors">
                  <Trash2 className="w-4 h-4 text-muted-foreground hover:text-neon-red" />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {showBuilder && <RuleBuilder onClose={() => { setShowBuilder(false); load(); }} />}
    </div>
  );
}