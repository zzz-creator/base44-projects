import { useState, useEffect } from 'react';
import {
  AreaChart, Area, BarChart, Bar, LineChart, Line,
  XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend
} from 'recharts';
import { BarChart3, TrendingUp, TrendingDown } from 'lucide-react';

function generateTimeData(n = 24) {
  return Array.from({ length: n }, (_, i) => ({
    hour: `${String(i).padStart(2, '0')}:00`,
    requests: Math.floor(Math.random() * 900 + 100),
    errors: Math.floor(Math.random() * 60),
    latency: Math.floor(Math.random() * 180 + 40),
    users: Math.floor(Math.random() * 400 + 50),
  }));
}

function generateServiceData() {
  return [
    { name: 'API Gateway', uptime: 99.97, req: 12847 },
    { name: 'Auth Service', uptime: 100, req: 8291 },
    { name: 'Data Pipeline', uptime: 98.2, req: 3421 },
    { name: 'Scheduler', uptime: 99.5, req: 1847 },
    { name: 'Cache', uptime: 100, req: 24891 },
  ];
}

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-card border border-border rounded p-2 text-xs font-mono shadow-xl">
      <p className="text-muted-foreground mb-1">{label}</p>
      {payload.map(p => (
        <p key={p.dataKey} style={{ color: p.color }}>{p.dataKey}: {p.value}</p>
      ))}
    </div>
  );
};

export default function Analytics() {
  const [timeData] = useState(generateTimeData());
  const [serviceData] = useState(generateServiceData());
  const [period, setPeriod] = useState('24H');

  return (
    <div className="h-full overflow-auto scrollbar-thin">
      <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-card/40 sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <BarChart3 className="w-4 h-4 text-neon-blue" />
          <h1 className="text-sm font-mono font-semibold tracking-widest uppercase">Analytics</h1>
        </div>
        <div className="flex gap-1">
          {['1H', '6H', '24H', '7D', '30D'].map(p => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`text-xs font-mono px-2.5 py-1 rounded border transition-colors ${
                period === p ? 'bg-neon-blue/10 border-neon-blue/30 text-neon-blue' : 'border-border text-muted-foreground hover:text-foreground'
              }`}
            >
              {p}
            </button>
          ))}
        </div>
      </div>

      <div className="p-6 space-y-6">
        {/* KPI summary */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: 'Total Requests', value: '1.2M', change: '+8.3%', up: true, color: 'text-neon-blue' },
            { label: 'Error Rate', value: '0.42%', change: '-12%', up: false, good: true, color: 'text-neon-amber' },
            { label: 'Avg Latency', value: '87ms', change: '-5ms', up: false, good: true, color: 'text-neon-green' },
            { label: 'Active Users', value: '1,247', change: '+14%', up: true, color: 'text-neon-blue' },
          ].map(kpi => (
            <div key={kpi.label} className="panel p-4 border-t-2 border-t-neon-blue/40">
              <div className="text-xs font-mono text-muted-foreground uppercase tracking-wider mb-2">{kpi.label}</div>
              <div className={`text-2xl font-mono font-bold ${kpi.color}`}>{kpi.value}</div>
              <div className={`flex items-center gap-1 text-xs font-mono mt-1 ${kpi.good || kpi.up ? 'text-neon-green' : 'text-neon-red'}`}>
                {kpi.up ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                {kpi.change} vs last period
              </div>
            </div>
          ))}
        </div>

        {/* Request volume */}
        <div className="panel p-5">
          <div className="text-xs font-mono text-muted-foreground uppercase tracking-wider mb-4">Request Volume</div>
          <div className="h-52">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={timeData} margin={{ top: 4, right: 4, bottom: 0, left: -20 }}>
                <defs>
                  <linearGradient id="reqGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#22d3ee" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#22d3ee" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(222 30% 15%)" />
                <XAxis dataKey="hour" tick={{ fill: '#6b7280', fontSize: 9, fontFamily: 'JetBrains Mono' }} interval={3} />
                <YAxis tick={{ fill: '#6b7280', fontSize: 9, fontFamily: 'JetBrains Mono' }} />
                <Tooltip content={<CustomTooltip />} />
                <Area type="monotone" dataKey="requests" stroke="#22d3ee" strokeWidth={2} fill="url(#reqGrad)" dot={false} />
                <Area type="monotone" dataKey="errors" stroke="#f43f5e" strokeWidth={1.5} fill="none" dot={false} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Latency */}
          <div className="panel p-5">
            <div className="text-xs font-mono text-muted-foreground uppercase tracking-wider mb-4">Response Latency (ms)</div>
            <div className="h-44">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={timeData} margin={{ top: 4, right: 4, bottom: 0, left: -20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(222 30% 15%)" />
                  <XAxis dataKey="hour" tick={{ fill: '#6b7280', fontSize: 9, fontFamily: 'JetBrains Mono' }} interval={5} />
                  <YAxis tick={{ fill: '#6b7280', fontSize: 9, fontFamily: 'JetBrains Mono' }} />
                  <Tooltip content={<CustomTooltip />} />
                  <Line type="monotone" dataKey="latency" stroke="#f59e0b" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Service uptime */}
          <div className="panel p-5">
            <div className="text-xs font-mono text-muted-foreground uppercase tracking-wider mb-4">Service Uptime %</div>
            <div className="h-44">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={serviceData} margin={{ top: 4, right: 4, bottom: 0, left: -20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(222 30% 15%)" />
                  <XAxis dataKey="name" tick={{ fill: '#6b7280', fontSize: 8, fontFamily: 'JetBrains Mono' }} />
                  <YAxis domain={[97, 100.1]} tick={{ fill: '#6b7280', fontSize: 9, fontFamily: 'JetBrains Mono' }} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="uptime" fill="#10b981" radius={[2, 2, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}