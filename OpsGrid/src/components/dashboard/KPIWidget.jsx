import { useState, useEffect } from 'react';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

const kpis = [
  { label: 'Active Sessions', value: 1247, prev: 1189, unit: '', color: 'text-neon-blue' },
  { label: 'Throughput', value: 98.4, prev: 97.1, unit: '%', color: 'text-neon-green' },
  { label: 'Incident MTTR', value: 12.3, prev: 15.6, unit: 'min', color: 'text-neon-amber', invertTrend: true },
  { label: 'SLA Compliance', value: 99.7, prev: 99.5, unit: '%', color: 'text-neon-green' },
];

export default function KPIWidget() {
  const [liveKpis, setLiveKpis] = useState(kpis);

  useEffect(() => {
    const t = setInterval(() => {
      setLiveKpis(prev => prev.map(k => ({
        ...k,
        value: +(k.value + (Math.random() - 0.5) * (k.value * 0.02)).toFixed(1),
      })));
    }, 4000);
    return () => clearInterval(t);
  }, []);

  return (
    <div className="h-full grid grid-cols-2 gap-3">
      {liveKpis.map((kpi, i) => {
        const diff = kpi.value - kpi.prev;
        const pct = ((diff / kpi.prev) * 100).toFixed(1);
        const isUp = diff > 0;
        const isGood = kpi.invertTrend ? !isUp : isUp;
        return (
          <div key={i} className="panel p-3 flex flex-col justify-between neon-border-blue">
            <div className="text-xs font-mono text-muted-foreground uppercase tracking-wider">{kpi.label}</div>
            <div>
              <div className={`text-2xl font-mono font-bold ${kpi.color}`}>
                {kpi.value.toFixed(kpi.unit === '%' ? 1 : 0)}{kpi.unit}
              </div>
              <div className={`flex items-center gap-1 text-xs font-mono mt-1 ${isGood ? 'text-neon-green' : 'text-neon-red'}`}>
                {Math.abs(+pct) < 0.01 ? (
                  <Minus className="w-3 h-3" />
                ) : isUp ? (
                  <TrendingUp className="w-3 h-3" />
                ) : (
                  <TrendingDown className="w-3 h-3" />
                )}
                {Math.abs(+pct)}%
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}