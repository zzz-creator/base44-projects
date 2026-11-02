import { useState, useEffect } from 'react';
import { BarChart2, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';

function generateHourlyData() {
  return Array.from({ length: 24 }, (_, i) => ({
    hour: `${String(i).padStart(2, '0')}:00`,
    requests: Math.floor(3000 + Math.random() * 8000),
    errors: Math.floor(Math.random() * 200),
    latency: Math.floor(40 + Math.random() * 120),
  }));
}

const METRICS = [
  { key: 'requests', label: 'Requests/hr', color: '#0ea5e9', format: v => v.toLocaleString() },
  { key: 'errors',   label: 'Errors/hr',   color: '#ef4444', format: v => v.toLocaleString() },
  { key: 'latency',  label: 'Avg Latency', color: '#f59e0b', format: v => `${v}ms` },
];

function StatCard({ label, value, trend, color }) {
  const TrendIcon = trend > 0 ? TrendingUp : trend < 0 ? TrendingDown : Minus;
  return (
    <div className="p-3 rounded-lg border border-border bg-muted/10 flex flex-col gap-1">
      <span className="text-xs font-mono text-muted-foreground uppercase tracking-wider">{label}</span>
      <span className="text-xl font-mono font-bold" style={{ color }}>{value}</span>
      <TrendIcon className="w-3 h-3" style={{ color: trend > 0 ? '#22c55e' : trend < 0 ? '#ef4444' : '#64748b' }} />
    </div>
  );
}

export default function AnalyticsProfileWidget() {
  const [data, setData] = useState(generateHourlyData);
  const [activeMetric, setActiveMetric] = useState('requests');

  useEffect(() => {
    const id = setInterval(() => setData(generateHourlyData()), 10000);
    return () => clearInterval(id);
  }, []);

  const metric = METRICS.find(m => m.key === activeMetric);
  const latest = data[data.length - 1];
  const prev = data[data.length - 2];

  return (
    <div className="h-full flex flex-col gap-3">
      <div className="flex items-center gap-2">
        <BarChart2 className="w-4 h-4 text-neon-blue" />
        <span className="text-xs font-mono uppercase tracking-widest text-muted-foreground">Analytics — 24h Breakdown</span>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-3 gap-2">
        {METRICS.map(m => (
          <StatCard
            key={m.key}
            label={m.label}
            value={m.format(latest[m.key])}
            trend={latest[m.key] - prev[m.key]}
            color={m.color}
          />
        ))}
      </div>

      {/* Metric tabs */}
      <div className="flex gap-1">
        {METRICS.map(m => (
          <button
            key={m.key}
            onClick={() => setActiveMetric(m.key)}
            className={`text-xs font-mono px-2 py-0.5 rounded border transition-colors ${activeMetric === m.key ? 'border-neon-blue/40 bg-neon-blue/10 text-neon-blue' : 'border-border text-muted-foreground hover:text-foreground'}`}
          >
            {m.label}
          </button>
        ))}
      </div>

      {/* Chart */}
      <div className="flex-1 min-h-0">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 4, right: 4, bottom: 0, left: -20 }}>
            <defs>
              <linearGradient id="aGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={metric.color} stopOpacity={0.3} />
                <stop offset="95%" stopColor={metric.color} stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(222 30% 15%)" />
            <XAxis dataKey="hour" tick={{ fill: '#64748b', fontSize: 9 }} interval={3} />
            <YAxis tick={{ fill: '#64748b', fontSize: 9 }} />
            <Tooltip
              contentStyle={{ background: 'hsl(222 40% 8%)', border: '1px solid hsl(222 30% 15%)', borderRadius: 6, fontSize: 11, fontFamily: 'monospace' }}
              labelStyle={{ color: '#94a3b8' }}
              itemStyle={{ color: metric.color }}
            />
            <Area type="monotone" dataKey={activeMetric} stroke={metric.color} fill="url(#aGrad)" strokeWidth={1.5} dot={false} />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}