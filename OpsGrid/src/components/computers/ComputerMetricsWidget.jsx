import { useState, useEffect } from 'react';
import { Monitor, Cpu, HardDrive, Wifi, MemoryStick, RefreshCw, AlertCircle } from 'lucide-react';

function GaugeBar({ value, color }) {
  return (
    <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden">
      <div
        className={`h-full rounded-full transition-all duration-500 ${color}`}
        style={{ width: `${Math.min(100, value)}%` }}
      />
    </div>
  );
}

function MetricRow({ label, value, unit, barValue, color }) {
  return (
    <div className="space-y-0.5">
      <div className="flex items-center justify-between text-xs font-mono">
        <span className="text-muted-foreground">{label}</span>
        <span className={color}>{value}<span className="text-muted-foreground ml-0.5">{unit}</span></span>
      </div>
      {barValue !== undefined && <GaugeBar value={barValue} color={color === 'text-neon-red' ? 'bg-neon-red' : color === 'text-neon-amber' ? 'bg-neon-amber' : 'bg-neon-green'} />}
    </div>
  );
}

function formatBytes(bytes) {
  if (bytes < 1024) return `${bytes} B/s`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB/s`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB/s`;
}

export default function ComputerMetricsWidget({ computer }) {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [lastFetch, setLastFetch] = useState(null);

  const fetchMetrics = async () => {
    if (!computer) return;
    setLoading(true);
    setError(null);
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 5000);
      const res = await fetch(`http://${computer.ip_address}:${computer.port}/system-report`, { signal: controller.signal });
      clearTimeout(timeout);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      setData(json);
      setLastFetch(new Date());
    } catch (e) {
      setError(e.name === 'AbortError' ? 'Connection timed out' : 'Unable to reach computer');
    }
    setLoading(false);
  };

  useEffect(() => {
    if (!computer) return;
    fetchMetrics();
    const interval = setInterval(fetchMetrics, 10000);
    return () => clearInterval(interval);
  }, [computer?.id]);

  if (!computer) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-center p-4">
        <Monitor className="w-8 h-8 text-muted-foreground mb-2" />
        <p className="text-xs font-mono text-muted-foreground">No computer selected</p>
        <p className="text-xs font-mono text-muted-foreground/60">Use the switcher above to select or add a computer</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-center p-4">
        <AlertCircle className="w-6 h-6 text-neon-red mb-2" />
        <p className="text-xs font-mono text-neon-red">{error}</p>
        <p className="text-xs font-mono text-muted-foreground mt-1">{computer.ip_address}:{computer.port}</p>
        <button onClick={fetchMetrics} className="mt-3 flex items-center gap-1 text-xs font-mono text-neon-blue hover:underline">
          <RefreshCw className="w-3 h-3" /> Retry
        </button>
      </div>
    );
  }

  if (loading && !data) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-xs font-mono text-muted-foreground animate-pulse">CONNECTING TO {computer.name.toUpperCase()}...</div>
      </div>
    );
  }

  if (!data) return null;

  const cpuColor = data.cpu.usage_percent > 80 ? 'text-neon-red' : data.cpu.usage_percent > 60 ? 'text-neon-amber' : 'text-neon-green';
  const memColor = data.memory.usage_percent > 85 ? 'text-neon-red' : data.memory.usage_percent > 70 ? 'text-neon-amber' : 'text-neon-green';
  const storColor = data.storage.usage_percent > 90 ? 'text-neon-red' : data.storage.usage_percent > 75 ? 'text-neon-amber' : 'text-neon-green';

  return (
    <div className="h-full flex flex-col gap-2">
      <div className="flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-2">
          <Monitor className="w-3.5 h-3.5 text-neon-blue" />
          <span className="text-xs font-mono font-semibold text-foreground">{data.computer_name || computer.name}</span>
        </div>
        <div className="flex items-center gap-2">
          {loading && <div className="w-1.5 h-1.5 rounded-full bg-neon-blue animate-pulse" />}
          {lastFetch && <span className="text-xs font-mono text-muted-foreground/60">{lastFetch.toLocaleTimeString('en-US', { hour12: false })}</span>}
        </div>
      </div>

      <div className="flex-1 grid grid-cols-2 gap-3">
        {/* CPU */}
        <div className="p-2.5 rounded border border-border bg-muted/10 space-y-2">
          <div className="flex items-center gap-1.5">
            <Cpu className="w-3 h-3 text-neon-blue" />
            <span className="text-xs font-mono text-muted-foreground uppercase tracking-wider">CPU</span>
          </div>
          <MetricRow label="Usage" value={data.cpu.usage_percent.toFixed(1)} unit="%" barValue={data.cpu.usage_percent} color={cpuColor} />
          <MetricRow label="Cores" value={data.cpu.logical_cores} unit="" color="text-foreground" />
        </div>

        {/* Memory */}
        <div className="p-2.5 rounded border border-border bg-muted/10 space-y-2">
          <div className="flex items-center gap-1.5">
            <MemoryStick className="w-3 h-3 text-neon-purple" />
            <span className="text-xs font-mono text-muted-foreground uppercase tracking-wider">Memory</span>
          </div>
          <MetricRow label="Usage" value={data.memory.usage_percent.toFixed(1)} unit="%" barValue={data.memory.usage_percent} color={memColor} />
          <MetricRow label="Used" value={data.memory.used_gb} unit=" GB" color="text-foreground" />
          <MetricRow label="Total" value={data.memory.total_gb} unit=" GB" color="text-muted-foreground" />
        </div>

        {/* Storage */}
        <div className="p-2.5 rounded border border-border bg-muted/10 space-y-2">
          <div className="flex items-center gap-1.5">
            <HardDrive className="w-3 h-3 text-neon-amber" />
            <span className="text-xs font-mono text-muted-foreground uppercase tracking-wider">Storage</span>
          </div>
          <MetricRow label="Usage" value={data.storage.usage_percent.toFixed(1)} unit="%" barValue={data.storage.usage_percent} color={storColor} />
          <MetricRow label="Free" value={data.storage.free_gb} unit=" GB" color="text-foreground" />
          <MetricRow label="Total" value={data.storage.total_gb} unit=" GB" color="text-muted-foreground" />
        </div>

        {/* Network */}
        <div className="p-2.5 rounded border border-border bg-muted/10 space-y-2">
          <div className="flex items-center gap-1.5">
            <Wifi className="w-3 h-3 text-neon-green" />
            <span className="text-xs font-mono text-muted-foreground uppercase tracking-wider">Network</span>
          </div>
          <MetricRow label="↑ Upload" value={formatBytes(data.network.upload_speed_Bps)} unit="" color="text-neon-blue" />
          <MetricRow label="↓ Download" value={formatBytes(data.network.download_speed_Bps)} unit="" color="text-neon-green" />
        </div>
      </div>
    </div>
  );
}