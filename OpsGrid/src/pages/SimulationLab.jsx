import { useState, useEffect, useRef } from 'react';
import { base44 } from '@/api/base44Client';
import { FlaskConical, Play, Square, Activity, Monitor, Download } from 'lucide-react';

const SIM_TYPES = [
  { value: 'stress_test', label: 'Stress Test', description: 'Simulate high CPU/memory load across all nodes', color: 'neon-red' },
  { value: 'traffic_spike', label: 'Traffic Spike', description: 'Simulate 10x normal request volume', color: 'neon-amber' },
  { value: 'failure_scenario', label: 'Failure Scenario', description: 'Simulate cascading service failures', color: 'neon-red' },
  { value: 'security_drill', label: 'Security Drill', description: 'Simulate auth attacks and anomalous access patterns', color: 'neon-purple' },
  { value: 'custom', label: 'Custom', description: 'Configure your own simulation parameters', color: 'neon-blue' },
];

const SPEEDS = [0.5, 1, 2, 5];

const EVENT_TEMPLATES = {
  stress_test: ['CPU spike detected on node-prod-01', 'Memory pressure on API gateway', 'Scheduler queue depth increasing', 'Load balancer health check warning'],
  traffic_spike: ['Request rate exceeded 10k/s threshold', 'CDN cache miss rate at 78%', 'DB connection pool exhausted', 'Rate limiter activated on /api/v2'],
  failure_scenario: ['Data pipeline service unreachable', 'Auth service restart initiated', 'Cache layer disconnected', 'Database replica lag > 5s'],
  security_drill: ['Brute force attempt detected from 10.0.1.99', 'Unusual API access pattern flagged', 'JWT token anomaly detected', 'Geo-blocked access attempt'],
  custom: ['Synthetic event generated', 'Test metric threshold crossed', 'Simulated user action logged'],
};

const ALERT_TEMPLATES = {
  stress_test: [{ severity: 'critical', message: 'CPU > 92% on node-prod-01', type: 'CPU Spike' }],
  traffic_spike: [{ severity: 'medium', message: 'Traffic spike: 12,847 req/s (threshold: 10,000)', type: 'Traffic Anomaly' }],
  failure_scenario: [{ severity: 'critical', message: 'Service chain failure: auth → api → db', type: 'Cascade Failure' }],
  security_drill: [{ severity: 'critical', message: 'Intrusion pattern detected — IP quarantined', type: 'Security Breach' }],
  custom: [{ severity: 'low', message: 'Simulated test alert', type: 'Simulation' }],
};

// Generate metrics per simulation type
const SIM_METRIC_PROFILES = {
  stress_test:      { cpu: [75, 22], ram: [70, 25], storage: [60, 20], gpu: [80, 18] },
  traffic_spike:    { cpu: [60, 20], ram: [65, 20], storage: [40, 15], gpu: [30, 15] },
  failure_scenario: { cpu: [20, 30], ram: [30, 30], storage: [70, 20], gpu: [10, 10] },
  security_drill:   { cpu: [50, 20], ram: [45, 20], storage: [35, 15], gpu: [20, 15] },
  custom:           { cpu: [40, 30], ram: [40, 30], storage: [40, 20], gpu: [30, 20] },
};

function generateSimMetrics(computer, type) {
  const profile = SIM_METRIC_PROFILES[type] || SIM_METRIC_PROFILES.custom;
  const metrics = {};
  if (computer.has_cpu)     metrics.cpu_usage     = profile.cpu[0]     + Math.random() * profile.cpu[1];
  if (computer.has_ram)     metrics.ram_usage     = profile.ram[0]     + Math.random() * profile.ram[1];
  if (computer.has_storage) metrics.storage_usage = profile.storage[0] + Math.random() * profile.storage[1];
  if (computer.has_gpu)     metrics.gpu_usage     = profile.gpu[0]     + Math.random() * profile.gpu[1];
  return metrics;
}

function generateIdleMetrics(computer) {
  const metrics = {};
  if (computer.has_cpu)     metrics.cpu_usage     = 5  + Math.random() * 15;
  if (computer.has_ram)     metrics.ram_usage     = 20 + Math.random() * 20;
  if (computer.has_storage) metrics.storage_usage = 30 + Math.random() * 10;
  if (computer.has_gpu)     metrics.gpu_usage     = 2  + Math.random() * 8;
  return metrics;
}

const COMPONENT_ICONS = [
  { key: 'has_cpu', usageKey: 'cpu_usage', label: 'CPU', colorText: 'text-neon-blue', colorBg: 'bg-neon-blue' },
  { key: 'has_ram', usageKey: 'ram_usage', label: 'RAM', colorText: 'text-neon-green', colorBg: 'bg-neon-green' },
  { key: 'has_storage', usageKey: 'storage_usage', label: 'STO', colorText: 'text-neon-amber', colorBg: 'bg-neon-amber' },
  { key: 'has_gpu', usageKey: 'gpu_usage', label: 'GPU', colorText: 'text-neon-purple', colorBg: 'bg-neon-purple' },
];

function UsageBar({ label, value, colorText, colorBg }) {
  const pct = Math.min(100, Math.max(0, value || 0));
  return (
    <div className="space-y-0.5">
      <div className="flex justify-between text-xs font-mono">
        <span className="text-muted-foreground">{label}</span>
        <span className={colorText}>{pct.toFixed(0)}%</span>
      </div>
      <div className="h-1 rounded-full bg-muted overflow-hidden">
        <div className={`h-full rounded-full transition-all duration-700 ${colorBg}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

export default function SimulationLab() {
  const [selectedType, setSelectedType] = useState('stress_test');
  const [speed, setSpeed] = useState(1);
  const [running, setRunning] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [log, setLog] = useState([]);
  const [eventsGenerated, setEventsGenerated] = useState(0);
  const [alertsGenerated, setAlertsGenerated] = useState(0);

  const [computers, setComputers] = useState([]);
  const [selectedComputerId, setSelectedComputerId] = useState('');
  const [liveComputer, setLiveComputer] = useState(null);
  // Track metric snapshots per tick for averaging
  const [metricHistory, setMetricHistory] = useState([]);

  const intervalRef = useRef(null);
  const logRef = useRef(null);
  const tickingRef = useRef(false);
  const selectedComputerIdRef = useRef(selectedComputerId);
  const liveComputerRef = useRef(liveComputer);
  const selectedTypeRef = useRef(selectedType);
  const logRef2 = useRef([]); // always-current log for export

  useEffect(() => {
    base44.entities.Computer.list('-created_date').then(setComputers);
    const unsub = base44.entities.Computer.subscribe(async () => {
      const data = await base44.entities.Computer.list('-created_date');
      setComputers(data);
    });
    return () => unsub();
  }, []);

  // Keep liveComputer in sync
  useEffect(() => {
    if (selectedComputerId) {
      const c = computers.find(c => c.id === selectedComputerId);
      setLiveComputer(c || null);
      liveComputerRef.current = c || null;
    } else {
      setLiveComputer(null);
      liveComputerRef.current = null;
    }
  }, [selectedComputerId, computers]);

  useEffect(() => { selectedComputerIdRef.current = selectedComputerId; }, [selectedComputerId]);
  useEffect(() => { selectedTypeRef.current = selectedType; }, [selectedType]);

  const addLog = (msg, type = 'event') => {
    const entry = { msg, type, time: new Date().toISOString() };
    setLog(p => {
      const next = [entry, ...p].slice(0, 50);
      logRef2.current = next;
      return next;
    });
  };

  const tick = async () => {
    if (tickingRef.current) return; // skip if previous tick still in flight
    tickingRef.current = true;

    const type = selectedTypeRef.current;
    const computerId = selectedComputerIdRef.current;
    const computer = liveComputerRef.current;

    try {
      const templates = EVENT_TEMPLATES[type] || EVENT_TEMPLATES.custom;
      const alertTemplates = ALERT_TEMPLATES[type] || ALERT_TEMPLATES.custom;
      const shouldAlert = Math.random() < 0.2;
      const eventMsg = templates[Math.floor(Math.random() * templates.length)];

      await base44.entities.Event.create({ type: 'system', description: `[SIM] ${eventMsg}` });
      setEventsGenerated(p => p + 1);
      addLog(eventMsg, 'event');

      if (shouldAlert) {
        const alert = alertTemplates[Math.floor(Math.random() * alertTemplates.length)];
        await base44.entities.Alert.create({ ...alert, status: 'active', source: 'simulation' });
        setAlertsGenerated(p => p + 1);
        addLog(`ALERT: ${alert.message}`, 'alert');
      }

      // Update computer metrics for all sim types
      if (computerId && computer) {
        const metrics = generateSimMetrics(computer, type);
        await base44.entities.Computer.update(computerId, { ...metrics, status: 'stressed' });
        const updated = { ...liveComputerRef.current, ...metrics, status: 'stressed' };
        liveComputerRef.current = updated;
        setLiveComputer(updated);
        setMetricHistory(p => [...p, { ...metrics, time: new Date().toISOString() }]);
      }
    } finally {
      tickingRef.current = false;
    }
  };

  const avgMetrics = () => {
    if (metricHistory.length === 0) return null;
    const keys = ['cpu_usage', 'ram_usage', 'storage_usage', 'gpu_usage'];
    const avgs = {};
    keys.forEach(k => {
      const vals = metricHistory.map(m => m[k]).filter(v => v !== undefined);
      if (vals.length) avgs[k] = (vals.reduce((a, b) => a + b, 0) / vals.length).toFixed(1);
    });
    return avgs;
  };

  const exportCSV = () => {
    const avgs = avgMetrics();
    const rows = [['Time', 'Type', 'Message']];
    [...logRef2.current].reverse().forEach(e => rows.push([e.time, e.type, `"${e.msg.replace(/"/g, '""')}"`]));
    if (avgs) {
      rows.push([]);
      rows.push(['--- AVERAGE METRICS DURING SESSION ---']);
      if (avgs.cpu_usage) rows.push(['Avg CPU Usage', `${avgs.cpu_usage}%`]);
      if (avgs.ram_usage) rows.push(['Avg RAM Usage', `${avgs.ram_usage}%`]);
      if (avgs.storage_usage) rows.push(['Avg Storage Usage', `${avgs.storage_usage}%`]);
      if (avgs.gpu_usage) rows.push(['Avg GPU Usage', `${avgs.gpu_usage}%`]);
    }
    const csv = rows.map(r => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = `sim-report-${Date.now()}.csv`; a.click();
    URL.revokeObjectURL(url);
  };

  const exportPDF = () => {
    const avgs = avgMetrics();
    const computerName = liveComputer?.name || 'N/A';
    const simLabel = SIM_TYPES.find(s => s.value === selectedType)?.label || selectedType;
    let html = `<html><head><style>
      body { font-family: monospace; font-size: 12px; padding: 24px; color: #111; }
      h1 { font-size: 18px; margin-bottom: 4px; } h2 { font-size: 14px; margin-top: 20px; border-bottom: 1px solid #ccc; padding-bottom: 4px; }
      table { width: 100%; border-collapse: collapse; margin-top: 8px; }
      th, td { text-align: left; padding: 4px 8px; border: 1px solid #ddd; font-size: 11px; }
      th { background: #f0f0f0; } .alert { color: #c00; } .system { color: #006; }
    </style></head><body>
      <h1>OpsGrid Simulation Report</h1>
      <p>Generated: ${new Date().toLocaleString()} &nbsp;|&nbsp; Type: <b>${simLabel}</b> &nbsp;|&nbsp; Target: <b>${computerName}</b> &nbsp;|&nbsp; Duration: <b>${Math.floor(elapsed)}s</b> &nbsp;|&nbsp; Speed: <b>${speed}x</b></p>
      <p>Events: <b>${eventsGenerated}</b> &nbsp;|&nbsp; Alerts: <b>${alertsGenerated}</b></p>`;
    if (avgs && Object.keys(avgs).length > 0) {
      html += `<h2>Average Load on Target Computer</h2><table><tr><th>Metric</th><th>Average</th></tr>`;
      if (avgs.cpu_usage) html += `<tr><td>CPU Usage</td><td>${avgs.cpu_usage}%</td></tr>`;
      if (avgs.ram_usage) html += `<tr><td>RAM Usage</td><td>${avgs.ram_usage}%</td></tr>`;
      if (avgs.storage_usage) html += `<tr><td>Storage Usage</td><td>${avgs.storage_usage}%</td></tr>`;
      if (avgs.gpu_usage) html += `<tr><td>GPU Usage</td><td>${avgs.gpu_usage}%</td></tr>`;
      html += `</table>`;
    }
    html += `<h2>Event Log</h2><table><tr><th>Time</th><th>Type</th><th>Message</th></tr>`;
    [...logRef2.current].reverse().forEach(e => {
      html += `<tr><td>${new Date(e.time).toLocaleTimeString()}</td><td class="${e.type}">${e.type.toUpperCase()}</td><td>${e.msg}</td></tr>`;
    });
    html += `</table></body></html>`;
    const win = window.open('', '_blank');
    win.document.write(html);
    win.document.close();
    win.print();
  };

  const start = () => {
    setRunning(true);
    setElapsed(0);
    setLog([]);
    logRef2.current = [];
    setEventsGenerated(0);
    setAlertsGenerated(0);
    setMetricHistory([]);

    const label = selectedType.replace(/_/g, ' ').toUpperCase();
    const target = liveComputer ? ` → target: ${liveComputer.name}` : '';
    addLog(`Simulation started: ${label} at ${speed}x speed${target}`, 'system');

    // Mark computer as stressed immediately for all sim types
    if (selectedComputerId && liveComputer) {
      const metrics = generateSimMetrics(liveComputer, selectedType);
      base44.entities.Computer.update(selectedComputerId, { ...metrics, status: 'stressed' });
    }

    const baseInterval = 3000;
    const tickInterval = Math.max(1500, Math.round(baseInterval / speed)); // min 1.5s to avoid flooding
    intervalRef.current = setInterval(() => {
      tick();
      setElapsed(p => p + tickInterval / 1000);
    }, tickInterval);
  };

  const stop = async () => {
    clearInterval(intervalRef.current);
    setRunning(false);
    addLog('Simulation stopped.', 'system');

    // Reset computer to idle
    if (selectedComputerId && liveComputer) {
      const metrics = generateIdleMetrics(liveComputer);
      await base44.entities.Computer.update(selectedComputerId, { ...metrics, status: 'idle' });
    }
  };

  useEffect(() => () => clearInterval(intervalRef.current), []);

  const simType = SIM_TYPES.find(s => s.value === selectedType);
  const logColors = { event: 'text-foreground/70', alert: 'text-neon-red', system: 'text-neon-blue' };

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center gap-3 px-6 py-4 border-b border-border bg-card/40 flex-shrink-0">
        <FlaskConical className="w-4 h-4 text-neon-green" />
        <h1 className="text-sm font-mono font-semibold tracking-widest uppercase">Simulation Lab</h1>
        {running && (
          <span className="px-2 py-0.5 rounded border border-neon-green/30 bg-neon-green/10 text-neon-green text-xs font-mono animate-pulse">RUNNING</span>
        )}
        <div className="ml-auto flex gap-2">
          <button
            onClick={exportCSV}
            disabled={logRef2.current.length === 0}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-mono rounded border border-neon-blue/30 text-neon-blue hover:bg-neon-blue/10 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
          >
            <Download className="w-3 h-3" /> CSV
          </button>
          <button
            onClick={exportPDF}
            disabled={logRef2.current.length === 0}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-mono rounded border border-neon-amber/30 text-neon-amber hover:bg-neon-amber/10 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
          >
            <Download className="w-3 h-3" /> PDF
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-hidden flex flex-col lg:flex-row">
        {/* Config panel */}
        <div className="w-full lg:w-80 border-b lg:border-b-0 lg:border-r border-border overflow-auto scrollbar-thin p-5 space-y-5 flex-shrink-0">

          {/* Target Computer */}
          <div>
            <div className="text-xs font-mono text-muted-foreground uppercase tracking-wider mb-2">Target Computer</div>
            <select
              value={selectedComputerId}
              onChange={e => setSelectedComputerId(e.target.value)}
              disabled={running}
              className={`w-full bg-input border border-border rounded-md text-xs font-mono h-8 px-2 text-foreground ${running ? 'opacity-60 cursor-not-allowed' : ''}`}
            >
              <option value="">— None (global simulation) —</option>
              {computers.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
            {liveComputer && (
              <div className="mt-2 p-2.5 rounded-lg border border-border bg-muted/10 space-y-1.5">
                <div className="flex items-center gap-1.5 mb-1">
                  <Monitor className="w-3 h-3 text-muted-foreground" />
                  <span className="text-xs font-mono text-foreground">{liveComputer.name}</span>
                  <span className={`text-xs font-mono ml-auto ${liveComputer.status === 'stressed' ? 'text-neon-red' : 'text-neon-blue'}`}>
                    {(liveComputer.status || 'idle').toUpperCase()}
                  </span>
                </div>
                {COMPONENT_ICONS.filter(ci => liveComputer[ci.key]).map(ci => (
                  <UsageBar key={ci.key} label={ci.label} value={liveComputer[ci.usageKey]} colorText={ci.colorText} colorBg={ci.colorBg} />
                ))}
              </div>
            )}
          </div>

          {/* Simulation type */}
          <div>
            <div className="text-xs font-mono text-muted-foreground uppercase tracking-wider mb-3">Simulation Type</div>
            <div className="space-y-2">
              {SIM_TYPES.map(s => (
                <button key={s.value} onClick={() => !running && setSelectedType(s.value)}
                  disabled={running}
                  className={`w-full text-left p-3 rounded-lg border transition-all ${selectedType === s.value ? `border-${s.color}/50 bg-${s.color}/10` : 'border-border hover:bg-muted/20'} ${running ? 'opacity-60 cursor-not-allowed' : ''}`}>
                  <div className="text-sm font-medium">{s.label}</div>
                  <div className="text-xs text-muted-foreground font-mono mt-0.5">{s.description}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Speed */}
          <div>
            <div className="text-xs font-mono text-muted-foreground uppercase tracking-wider mb-3">Playback Speed</div>
            <div className="flex gap-2">
              {SPEEDS.map(s => (
                <button key={s} onClick={() => !running && setSpeed(s)}
                  disabled={running}
                  className={`flex-1 py-1.5 text-xs font-mono rounded border transition-colors ${speed === s ? 'border-neon-blue/50 bg-neon-blue/10 text-neon-blue' : 'border-border text-muted-foreground hover:text-foreground'} ${running ? 'opacity-60 cursor-not-allowed' : ''}`}>
                  {s}x
                </button>
              ))}
            </div>
          </div>

          {/* Stats */}
          <div className="panel p-4 space-y-3">
            <div className="text-xs font-mono text-muted-foreground uppercase tracking-wider">Session Stats</div>
            <div className="space-y-2">
              <div className="flex justify-between text-xs font-mono">
                <span className="text-muted-foreground">Elapsed</span>
                <span className="text-foreground">{Math.floor(elapsed)}s</span>
              </div>
              <div className="flex justify-between text-xs font-mono">
                <span className="text-muted-foreground">Events Generated</span>
                <span className="text-neon-blue">{eventsGenerated}</span>
              </div>
              <div className="flex justify-between text-xs font-mono">
                <span className="text-muted-foreground">Alerts Triggered</span>
                <span className="text-neon-red">{alertsGenerated}</span>
              </div>
              <div className="flex justify-between text-xs font-mono">
                <span className="text-muted-foreground">Speed</span>
                <span className="text-neon-green">{speed}x</span>
              </div>
            </div>
          </div>

          {/* Controls */}
          <div className="flex gap-2">
            {!running ? (
              <button onClick={start}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded border border-neon-green/40 bg-neon-green/10 text-neon-green text-sm font-mono hover:bg-neon-green/20 transition-colors">
                <Play className="w-4 h-4" /> START
              </button>
            ) : (
              <button onClick={stop}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded border border-neon-red/40 bg-neon-red/10 text-neon-red text-sm font-mono hover:bg-neon-red/20 transition-colors">
                <Square className="w-4 h-4" /> STOP
              </button>
            )}
          </div>
        </div>

        {/* Live event log */}
        <div className="flex-1 flex flex-col min-h-0">
          <div className="flex items-center justify-between px-5 py-3 border-b border-border bg-card/20">
            <div className="flex items-center gap-2">
              <Activity className="w-3.5 h-3.5 text-neon-green" />
              <span className="text-xs font-mono text-muted-foreground uppercase tracking-wider">Live Event Stream</span>
            </div>
            <button onClick={() => setLog([])} className="text-xs font-mono text-muted-foreground hover:text-foreground transition-colors">CLEAR</button>
          </div>
          <div ref={logRef} className="flex-1 overflow-auto scrollbar-thin p-4 space-y-1 font-mono text-xs">
            {log.length === 0 && (
              <div className="text-center text-muted-foreground py-12">
                <FlaskConical className="w-8 h-8 mx-auto mb-3 opacity-30" />
                <div>Configure a simulation and press START</div>
              </div>
            )}
            {log.map((entry, i) => (
              <div key={i} className={`flex items-start gap-2 py-0.5 ${logColors[entry.type]}`}>
                <span className="text-muted-foreground/50 flex-shrink-0 tabular-nums">{new Date(entry.time).toLocaleTimeString('en-US', { hour12: false })}</span>
                <span className={entry.type === 'alert' ? 'text-neon-red font-medium' : entry.type === 'system' ? 'text-neon-blue' : ''}>{entry.msg}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}