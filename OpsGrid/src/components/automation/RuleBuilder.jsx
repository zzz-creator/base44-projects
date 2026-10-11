import { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { X, Zap, ChevronRight } from 'lucide-react';

const TRIGGERS = [
  { value: 'alert_created', label: 'Alert Created', description: 'When any new alert is created' },
  { value: 'metric_threshold', label: 'Metric Threshold', description: 'When a metric crosses a value' },
  { value: 'user_action', label: 'User Action', description: 'When a user performs an action' },
  { value: 'scheduled', label: 'Scheduled', description: 'On a time-based schedule' },
];

const ACTIONS = [
  { value: 'send_notification', label: 'Send Notification', description: 'Notify users via email/alert' },
  { value: 'trigger_workflow', label: 'Trigger Workflow', description: 'Start an automated workflow' },
  { value: 'escalate_alert', label: 'Escalate Alert', description: 'Increase alert severity' },
  { value: 'execute_command', label: 'Execute Command', description: 'Run a system command' },
  { value: 'update_record', label: 'Update Record', description: 'Modify a data record' },
];

const METRIC_THRESHOLD_CONFIG = [
  { value: 'cpu', label: 'CPU Usage' },
  { value: 'memory', label: 'Memory Usage' },
  { value: 'network', label: 'Network I/O' },
  { value: 'error_rate', label: 'Error Rate' },
];

export default function RuleBuilder({ onClose }) {
  const [step, setStep] = useState(1);
  const [form, setForm] = useState({
    name: '',
    trigger_type: '',
    action_type: '',
    metric: 'cpu',
    threshold: 80,
    operator: '>',
    severity_filter: 'critical',
    notification_target: 'all_operators',
    schedule: 'every_hour',
  });
  const [saving, setSaving] = useState(false);

  const buildTriggerConfig = () => {
    if (form.trigger_type === 'metric_threshold') {
      return JSON.stringify({ summary: `${form.metric} ${form.operator} ${form.threshold}%`, metric: form.metric, operator: form.operator, value: form.threshold });
    }
    if (form.trigger_type === 'alert_created') {
      return JSON.stringify({ summary: `severity = ${form.severity_filter}`, severity: form.severity_filter });
    }
    if (form.trigger_type === 'scheduled') {
      return JSON.stringify({ summary: form.schedule.replace(/_/g, ' '), schedule: form.schedule });
    }
    return JSON.stringify({ summary: 'any user action' });
  };

  const buildActionConfig = () => {
    if (form.action_type === 'send_notification') {
      return JSON.stringify({ target: form.notification_target });
    }
    return JSON.stringify({});
  };

  const save = async () => {
    setSaving(true);
    await base44.entities.AutomationRule.create({
      name: form.name,
      trigger_type: form.trigger_type,
      action_type: form.action_type,
      trigger_config: buildTriggerConfig(),
      action_config: buildActionConfig(),
      status: 'active',
      triggered_count: 0,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
      <div className="w-full max-w-lg bg-card border border-border rounded-xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <div className="flex items-center gap-2">
            <Zap className="w-4 h-4 text-neon-amber" />
            <span className="text-sm font-mono font-semibold uppercase tracking-widest">New Automation Rule</span>
          </div>
          <button onClick={onClose} className="p-1 rounded hover:bg-muted/50"><X className="w-4 h-4" /></button>
        </div>

        {/* Step indicator */}
        <div className="flex items-center gap-2 px-6 py-3 border-b border-border bg-muted/20">
          {['Name', 'Trigger', 'Action', 'Review'].map((s, i) => (
            <div key={s} className="flex items-center gap-1">
              <div className={`w-5 h-5 rounded-full text-xs font-mono flex items-center justify-center ${step > i + 1 ? 'bg-neon-green text-background' : step === i + 1 ? 'bg-neon-amber text-background' : 'bg-muted text-muted-foreground'}`}>{i + 1}</div>
              <span className={`text-xs font-mono ${step === i + 1 ? 'text-foreground' : 'text-muted-foreground'}`}>{s}</span>
              {i < 3 && <ChevronRight className="w-3 h-3 text-muted-foreground" />}
            </div>
          ))}
        </div>

        <div className="p-6 space-y-4">
          {/* Step 1: Name */}
          {step === 1 && (
            <div className="space-y-3">
              <label className="text-xs font-mono text-muted-foreground uppercase tracking-wider">Rule Name</label>
              <input
                autoFocus
                value={form.name}
                onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
                placeholder="e.g. CPU Critical Alert"
                className="w-full h-10 bg-input border border-border rounded-md px-3 text-sm font-mono text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-neon-amber"
              />
            </div>
          )}

          {/* Step 2: Trigger */}
          {step === 2 && (
            <div className="space-y-3">
              <label className="text-xs font-mono text-muted-foreground uppercase tracking-wider">Select Trigger</label>
              <div className="space-y-2">
                {TRIGGERS.map(t => (
                  <button key={t.value} onClick={() => setForm(p => ({ ...p, trigger_type: t.value }))}
                    className={`w-full text-left p-3 rounded-lg border transition-all ${form.trigger_type === t.value ? 'border-neon-amber/50 bg-neon-amber/10' : 'border-border hover:border-border/80 hover:bg-muted/30'}`}>
                    <div className="text-sm font-medium">{t.label}</div>
                    <div className="text-xs text-muted-foreground font-mono mt-0.5">{t.description}</div>
                  </button>
                ))}
              </div>
              {form.trigger_type === 'metric_threshold' && (
                <div className="flex gap-2 mt-3">
                  <select value={form.metric} onChange={e => setForm(p => ({ ...p, metric: e.target.value }))}
                    className="flex-1 h-9 bg-input border border-border rounded-md px-2 text-sm font-mono text-foreground">
                    {METRIC_THRESHOLD_CONFIG.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
                  </select>
                  <select value={form.operator} onChange={e => setForm(p => ({ ...p, operator: e.target.value }))}
                    className="w-16 h-9 bg-input border border-border rounded-md px-2 text-sm font-mono text-foreground">
                    <option>{'>'}</option><option>{'<'}</option><option>{'>='}</option>
                  </select>
                  <input type="number" value={form.threshold} onChange={e => setForm(p => ({ ...p, threshold: +e.target.value }))}
                    className="w-20 h-9 bg-input border border-border rounded-md px-2 text-sm font-mono text-foreground" />
                  <span className="flex items-center text-xs text-muted-foreground">%</span>
                </div>
              )}
              {form.trigger_type === 'alert_created' && (
                <select value={form.severity_filter} onChange={e => setForm(p => ({ ...p, severity_filter: e.target.value }))}
                  className="w-full h-9 bg-input border border-border rounded-md px-2 text-sm font-mono text-foreground mt-2">
                  <option value="any">Any Severity</option>
                  <option value="critical">Critical Only</option>
                  <option value="medium">Medium+</option>
                </select>
              )}
            </div>
          )}

          {/* Step 3: Action */}
          {step === 3 && (
            <div className="space-y-3">
              <label className="text-xs font-mono text-muted-foreground uppercase tracking-wider">Select Action</label>
              <div className="space-y-2">
                {ACTIONS.map(a => (
                  <button key={a.value} onClick={() => setForm(p => ({ ...p, action_type: a.value }))}
                    className={`w-full text-left p-3 rounded-lg border transition-all ${form.action_type === a.value ? 'border-neon-blue/50 bg-neon-blue/10' : 'border-border hover:border-border/80 hover:bg-muted/30'}`}>
                    <div className="text-sm font-medium">{a.label}</div>
                    <div className="text-xs text-muted-foreground font-mono mt-0.5">{a.description}</div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Step 4: Review */}
          {step === 4 && (
            <div className="space-y-3">
              <div className="panel p-4 space-y-3">
                <div className="text-xs font-mono text-muted-foreground uppercase tracking-wider mb-2">Rule Summary</div>
                <div><span className="text-xs text-muted-foreground">Name: </span><span className="text-sm font-mono text-foreground">{form.name}</span></div>
                <div><span className="text-xs text-muted-foreground">Trigger: </span><span className="text-sm font-mono text-neon-amber">{TRIGGERS.find(t => t.value === form.trigger_type)?.label}</span></div>
                <div><span className="text-xs text-muted-foreground">Action: </span><span className="text-sm font-mono text-neon-blue">{ACTIONS.find(a => a.value === form.action_type)?.label}</span></div>
                <div className="pt-2 border-t border-border">
                  <div className="text-xs font-mono text-muted-foreground">IF {form.trigger_config ? '' : `${form.trigger_type}`}</div>
                  <div className="text-xs font-mono text-foreground/80 mt-1">{(() => { try { return JSON.parse(buildTriggerConfig()).summary; } catch { return '...'; } })()}</div>
                  <div className="text-xs font-mono text-muted-foreground mt-1">THEN {ACTIONS.find(a => a.value === form.action_type)?.label}</div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-border bg-muted/10">
          <button onClick={() => step > 1 ? setStep(s => s - 1) : onClose()}
            className="text-xs font-mono px-4 py-1.5 rounded border border-border text-muted-foreground hover:text-foreground hover:border-foreground/30 transition-colors">
            {step === 1 ? 'CANCEL' : '← BACK'}
          </button>
          <button
            disabled={
              (step === 1 && !form.name.trim()) ||
              (step === 2 && !form.trigger_type) ||
              (step === 3 && !form.action_type) ||
              saving
            }
            onClick={() => step < 4 ? setStep(s => s + 1) : save()}
            className="text-xs font-mono px-4 py-1.5 rounded border border-neon-amber/40 bg-neon-amber/10 text-neon-amber hover:bg-neon-amber/20 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            {step < 4 ? 'NEXT →' : saving ? 'SAVING...' : 'CREATE RULE'}
          </button>
        </div>
      </div>
    </div>
  );
}