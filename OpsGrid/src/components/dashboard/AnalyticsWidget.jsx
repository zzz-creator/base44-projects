import { useState, useEffect } from 'react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { TrendingUp } from 'lucide-react';

function generateData(points = 20) {
  return Array.from({ length: points }, (_, i) => ({
    t: `${String(i).padStart(2, '0')}:00`,
    requests: Math.floor(Math.random() * 800 + 200),
    errors: Math.floor(Math.random() * 50),
    latency: Math.floor(Math.random() * 200 + 50),
  }));
}

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-card border border-border rounded p-2 text-xs font-mono">
      <p className="text-muted-foreground mb-1">{label}</p>
      {payload.map(p => (
        <p key={p.dataKey} style={{ color: p.color }}>{p.dataKey}: {p.value}</p>
      ))}
    </div>
  );
};

export default function AnalyticsWidget() {
  const [data, setData] = useState(generateData());
  const [view, setView] = useState('requests');

  useEffect(() => {
    const t = setInterval(() => {
      setData(prev => {
        const next = [...prev.slice(1), {
          t: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false }),
          requests: Math.floor(Math.random() * 800 + 200),
          errors: Math.floor(Math.random() * 50),
          latency: Math.floor(Math.random() * 200 + 50),
        }];
        return next;
      });
    }, 3000);
    return () => clearInterval(t);
  }, []);

  const views = [
    { key: 'requests', label: 'REQ/s', color: '#22d3ee' },
    { key: 'errors', label: 'ERRORS', color: '#f43f5e' },
    { key: 'latency', label: 'LATENCY', color: '#f59e0b' },
  ];

  const current = views.find(v => v.key === view);

  return (
    <div className="h-full flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-neon-blue" />
          <span className="text-xs font-mono uppercase tracking-widest text-muted-foreground">Live Analytics</span>
        </div>
        <div className="flex gap-1">
          {views.map(v => (
            <button
              key={v.key}
              onClick={() => setView(v.key)}
              className={`text-xs font-mono px-2 py-0.5 rounded transition-colors ${
                view === v.key ? 'bg-neon-blue/20 text-neon-blue border border-neon-blue/30' : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {v.label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 min-h-0">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 4, right: 4, bottom: 0, left: -20 }}>
            <defs>
              <linearGradient id="grad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={current.color} stopOpacity={0.3} />
                <stop offset="95%" stopColor={current.color} stopOpacity={0} />
              </linearGradient>
            </defs>
            <XAxis dataKey="t" tick={{ fill: '#6b7280', fontSize: 9, fontFamily: 'JetBrains Mono' }} interval={4} />
            <YAxis tick={{ fill: '#6b7280', fontSize: 9, fontFamily: 'JetBrains Mono' }} />
            <Tooltip content={<CustomTooltip />} />
            <Area
              type="monotone"
              dataKey={view}
              stroke={current.color}
              strokeWidth={1.5}
              fill="url(#grad)"
              dot={false}
              isAnimationActive={false}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* KPI row */}
      <div className="grid grid-cols-3 gap-2 pt-1 border-t border-border">
        <KPI label="AVG REQ" value="487/s" color="text-neon-blue" />
        <KPI label="ERROR RATE" value="2.4%" color="text-neon-amber" />
        <KPI label="P99 LAT" value="142ms" color="text-neon-green" />
      </div>
    </div>
  );
}

function KPI({ label, value, color }) {
  return (
    <div className="text-center">
      <div className="text-xs text-muted-foreground font-mono">{label}</div>
      <div className={`text-sm font-mono font-bold ${color}`}>{value}</div>
    </div>
  );
}