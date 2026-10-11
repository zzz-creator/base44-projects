import { useState } from 'react';
import { Settings, Bell, Shield, Database, Sliders, Save } from 'lucide-react';
import { toast } from 'sonner';
import TwoFactorAuth from '@/components/settings/TwoFactorAuth';

const sections = [
  {
    id: 'notifications',
    icon: Bell,
    label: 'Notifications',
    settings: [
      { key: 'emailAlerts', label: 'Email Alerts', description: 'Send email for critical alerts', type: 'toggle', default: true },
      { key: 'criticalOnly', label: 'Critical Only', description: 'Only notify for critical severity', type: 'toggle', default: false },
      { key: 'soundAlerts', label: 'Sound Alerts', description: 'Play sound on new alert', type: 'toggle', default: true },
    ]
  },
  {
    id: 'system',
    icon: Sliders,
    label: 'System',
    settings: [
      { key: 'refreshRate', label: 'Refresh Rate (s)', description: 'Dashboard data refresh interval', type: 'number', default: 5 },
      { key: 'dataRetention', label: 'Data Retention (days)', description: 'How long to keep event logs', type: 'number', default: 90 },
      { key: 'simMode', label: 'Simulation Mode', description: 'Generate simulated data for demo', type: 'toggle', default: true },
    ]
  },
  {
    id: 'security',
    icon: Shield,
    label: 'Security',
    settings: [
      { key: 'auditLog', label: 'Audit Logging', description: 'Log all user actions', type: 'toggle', default: true },
      { key: 'sessionTimeout', label: 'Session Timeout (min)', description: 'Idle session timeout duration', type: 'number', default: 60 },
      { key: 'mfa', label: '2FA Required', description: 'Require two-factor authentication', type: 'toggle', default: false },
    ]
  },
];

export default function SettingsPage() {
  const [values, setValues] = useState(() => {
    const initial = {};
    sections.forEach(s => s.settings.forEach(set => { initial[set.key] = set.default; }));
    return initial;
  });
  const [saved, setSaved] = useState(false);

  const update = (key, val) => setValues(p => ({ ...p, [key]: val }));

  const save = () => {
    toast.success('Settings saved', { description: 'Configuration updated successfully' });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="h-full overflow-auto scrollbar-thin">
      <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-card/40 sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <Settings className="w-4 h-4 text-neon-blue" />
          <h1 className="text-sm font-mono font-semibold tracking-widest uppercase">System Settings</h1>
        </div>
        <button
          onClick={save}
          className="flex items-center gap-1.5 text-xs font-mono px-4 py-1.5 rounded border border-neon-blue/30 bg-neon-blue/10 text-neon-blue hover:bg-neon-blue/20 transition-colors"
        >
          <Save className="w-3.5 h-3.5" />
          {saved ? 'SAVED!' : 'SAVE CHANGES'}
        </button>
      </div>

      <div className="p-6 space-y-6 max-w-2xl">
        {/* 2FA Section */}
        <div className="panel">
          <div className="flex items-center gap-2 px-5 py-3 border-b border-border">
            <Shield className="w-4 h-4 text-neon-blue" />
            <span className="text-xs font-mono uppercase tracking-widest text-foreground">Two-Factor Authentication</span>
          </div>
          <div className="px-5 py-4">
            <TwoFactorAuth />
          </div>
        </div>

        {sections.map(section => {
          const Icon = section.icon;
          return (
            <div key={section.id} className="panel">
              <div className="flex items-center gap-2 px-5 py-3 border-b border-border">
                <Icon className="w-4 h-4 text-neon-blue" />
                <span className="text-xs font-mono uppercase tracking-widest text-foreground">{section.label}</span>
              </div>
              <div className="divide-y divide-border">
                {section.settings.map(setting => (
                  <div key={setting.key} className="flex items-center justify-between px-5 py-4">
                    <div>
                      <div className="text-sm font-medium text-foreground">{setting.label}</div>
                      <div className="text-xs text-muted-foreground font-mono mt-0.5">{setting.description}</div>
                    </div>
                    {setting.type === 'toggle' ? (
                      <button
                        onClick={() => update(setting.key, !values[setting.key])}
                        className={`relative w-10 h-5 rounded-full transition-colors ${
                          values[setting.key] ? 'bg-neon-blue' : 'bg-muted border border-border'
                        }`}
                      >
                        <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${
                          values[setting.key] ? 'translate-x-5' : 'translate-x-0.5'
                        }`} />
                      </button>
                    ) : (
                      <input
                        type="number"
                        value={values[setting.key]}
                        onChange={e => update(setting.key, +e.target.value)}
                        className="w-20 h-8 bg-input border border-border rounded-md px-2 text-sm font-mono text-foreground text-right focus:outline-none focus:ring-1 focus:ring-neon-blue"
                      />
                    )}
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}