import React from 'react';
import { Card } from '../ui/card';
import { Badge } from '../ui/badge';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  Cell
} from 'recharts';

export default function ComparativeScenarioChart({ scenarios, linkedScenarios = [] }) {
  if (!scenarios || scenarios.length < 2) return null;

  const hasLinkedScenarios = linkedScenarios.length > 0;

  const comparisonData = scenarios[0].regional_stability?.map(region => {
    const comparison = {
      region: region.region,
      baseline: region.baseline_stability
    };
    
    scenarios.forEach((scenario, idx) => {
      const scenarioRegion = scenario.regional_stability?.find(r => r.region === region.region);
      comparison[`scenario${idx + 1}`] = scenarioRegion?.projected_stability || 0;
    });
    
    return comparison;
  }) || [];

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <Card className="bg-slate-950/95 backdrop-blur-xl cyber-border p-4">
          <h4 className="text-cyan-400 font-mono text-sm font-bold mb-2">{label}</h4>
          <div className="space-y-1">
            {payload.map((entry, index) => (
              <div key={index} className="flex justify-between gap-4 text-xs font-mono">
                <span style={{ color: entry.color }}>{entry.name}:</span>
                <span style={{ color: entry.color }} className="font-bold">{entry.value}/100</span>
              </div>
            ))}
          </div>
        </Card>
      );
    }
    return null;
  };

  const colors = ['#06b6d4', '#a855f7', '#22c55e', '#f97316'];

  return (
    <Card className="bg-slate-950/80 backdrop-blur-xl cyber-border p-6">
      <div className="mb-4">
        <h3 className="text-xl font-bold text-cyan-400 glow-text font-mono mb-2">
          SCENARIO COMPARISON: REGIONAL STABILITY
        </h3>
        <div className="flex flex-wrap gap-2">
          <Badge className="bg-slate-700/50 text-slate-300 border-slate-600/30 font-mono text-xs">
            Baseline
          </Badge>
          {scenarios.map((scenario, idx) => (
            <Badge key={idx} style={{ backgroundColor: `${colors[idx]}20`, color: colors[idx], borderColor: `${colors[idx]}50` }} className="font-mono text-xs">
              Scenario {idx + 1}
            </Badge>
          ))}
        </div>
      </div>

      <div className="h-[400px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={comparisonData} margin={{ top: 20, right: 30, left: 20, bottom: 80 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
            <XAxis 
              dataKey="region" 
              stroke="#94a3b8"
              style={{ fontFamily: 'monospace', fontSize: '10px' }}
              angle={-45}
              textAnchor="end"
              height={80}
            />
            <YAxis 
              stroke="#94a3b8"
              style={{ fontFamily: 'monospace', fontSize: '11px' }}
              domain={[0, 100]}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend wrapperStyle={{ fontFamily: 'monospace', fontSize: '11px' }} />
            
            <Bar dataKey="baseline" fill="#64748b" name="Baseline" />
            {scenarios.map((scenario, idx) => (
              <Bar 
                key={idx}
                dataKey={`scenario${idx + 1}`} 
                fill={colors[idx]} 
                name={`Scenario ${idx + 1}`}
              />
            ))}
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Key Insights */}
      <div className="mt-4 p-3 bg-purple-950/20 cyber-border rounded">
        <h4 className="text-sm font-bold text-purple-400 font-mono mb-2">KEY INSIGHTS</h4>
        <ul className="space-y-1">
          {comparisonData.slice(0, 3).map((region, idx) => {
            const changes = scenarios.map((_, sIdx) => 
              region[`scenario${sIdx + 1}`] - region.baseline
            );
            const maxChange = Math.max(...changes.map(Math.abs));
            const maxChangeIdx = changes.findIndex(c => Math.abs(c) === maxChange);
            
            return (
              <li key={idx} className="text-slate-300 font-mono text-xs flex items-start gap-2">
                <span className="text-cyan-400">▸</span>
                {region.region}: Scenario {maxChangeIdx + 1} shows {changes[maxChangeIdx] > 0 ? 'improvement' : 'decline'} of {Math.abs(changes[maxChangeIdx]).toFixed(0)} points
              </li>
            );
          })}
        </ul>
      </div>

      {/* Linked Scenarios Info */}
      {hasLinkedScenarios && (
        <div className="mt-4 p-3 bg-cyan-950/20 cyber-border rounded">
          <h4 className="text-sm font-bold text-cyan-400 font-mono mb-2">LINKED SCENARIOS</h4>
          <div className="flex flex-wrap gap-2">
            {linkedScenarios.map((scenario, idx) => (
              <Badge key={idx} className="bg-cyan-500/20 text-cyan-400 border-cyan-500/30 font-mono text-xs">
                {scenario.name}
                {scenario.parentId && ' (Branch)'}
              </Badge>
            ))}
          </div>
        </div>
      )}
    </Card>
  );
}