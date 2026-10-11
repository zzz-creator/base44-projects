import React, { useState } from 'react';
import { Card } from '../ui/card';
import { Badge } from '../ui/badge';
import { 
  ScatterChart, 
  Scatter, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  ZAxis,
  Cell,
  ReferenceLine
} from 'recharts';
import { AlertTriangle, TrendingUp } from 'lucide-react';

export default function EnhancedClimateConflictChart({ conflicts }) {
  const [highlightedPoint, setHighlightedPoint] = useState(null);

  const chartData = conflicts?.map(c => ({
    name: c.name,
    climate: c.climate_impact_score,
    resources: c.resource_scarcity_score,
    probability: c.probability,
    socioEconomic: c.socio_economic_score,
    region: c.region
  })) || [];

  // Calculate anomalies (high risk but low attention)
  const anomalies = chartData.filter(d => 
    (d.climate > 70 || d.resources > 70) && d.probability < 60
  );

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <Card className="bg-slate-950/95 backdrop-blur-xl cyber-border p-4">
          <h4 className="text-cyan-400 font-mono text-sm font-bold mb-2">{data.name}</h4>
          <div className="space-y-1 text-xs font-mono">
            <div className="flex justify-between gap-4">
              <span className="text-slate-400">Climate Impact:</span>
              <span className="text-blue-400 font-bold">{data.climate}/100</span>
            </div>
            <div className="flex justify-between gap-4">
              <span className="text-slate-400">Resource Scarcity:</span>
              <span className="text-orange-400 font-bold">{data.resources}/100</span>
            </div>
            <div className="flex justify-between gap-4">
              <span className="text-slate-400">Probability:</span>
              <span className="text-purple-400 font-bold">{data.probability}%</span>
            </div>
            <div className="flex justify-between gap-4">
              <span className="text-slate-400">Socio-Economic:</span>
              <span className="text-red-400 font-bold">{data.socioEconomic}/100</span>
            </div>
          </div>
          {anomalies.some(a => a.name === data.name) && (
            <Badge className="mt-2 bg-red-500/20 text-red-400 border-red-500/30 font-mono text-xs">
              ⚠ HIGH-RISK ANOMALY
            </Badge>
          )}
        </Card>
      );
    }
    return null;
  };

  const getPointColor = (data) => {
    // High risk = red, medium = yellow, low = green
    const avgRisk = (data.climate + data.resources + data.socioEconomic) / 3;
    if (avgRisk > 70) return '#ef4444';
    if (avgRisk > 50) return '#f97316';
    if (avgRisk > 30) return '#eab308';
    return '#22c55e';
  };

  return (
    <Card className="bg-slate-950/80 backdrop-blur-xl cyber-border p-6">
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="text-xl font-bold text-purple-400 glow-text font-mono mb-2">
            CLIMATE-RESOURCE-CONFLICT INTERPLAY
          </h3>
          <p className="text-slate-400 font-mono text-xs">
            Bubble size = conflict probability • Color = risk level
          </p>
        </div>
        {anomalies.length > 0 && (
          <Badge className="bg-red-500/20 text-red-400 border-red-500/30 font-mono flex items-center gap-2">
            <AlertTriangle className="w-3 h-3" />
            {anomalies.length} Anomalies Detected
          </Badge>
        )}
      </div>

      <div className="h-[400px]">
        <ResponsiveContainer width="100%" height="100%">
          <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
            <XAxis 
              type="number" 
              dataKey="climate" 
              name="Climate Impact" 
              domain={[0, 100]}
              stroke="#94a3b8"
              style={{ fontFamily: 'monospace', fontSize: '11px' }}
              label={{ value: 'Climate Impact Score', position: 'insideBottom', offset: -10, fill: '#94a3b8', fontFamily: 'monospace' }}
            />
            <YAxis 
              type="number" 
              dataKey="resources" 
              name="Resource Scarcity"
              domain={[0, 100]}
              stroke="#94a3b8"
              style={{ fontFamily: 'monospace', fontSize: '11px' }}
              label={{ value: 'Resource Scarcity Score', angle: -90, position: 'insideLeft', fill: '#94a3b8', fontFamily: 'monospace' }}
            />
            <ZAxis type="number" dataKey="probability" range={[50, 400]} name="Probability" />
            <Tooltip content={<CustomTooltip />} />
            <Legend wrapperStyle={{ fontFamily: 'monospace', fontSize: '12px' }} />
            
            {/* Reference lines for high-risk thresholds */}
            <ReferenceLine x={70} stroke="#ef4444" strokeDasharray="5 5" opacity={0.3} />
            <ReferenceLine y={70} stroke="#ef4444" strokeDasharray="5 5" opacity={0.3} />
            
            <Scatter 
              name="Conflicts" 
              data={chartData} 
              onMouseEnter={(data) => setHighlightedPoint(data.name)}
              onMouseLeave={() => setHighlightedPoint(null)}
            >
              {chartData.map((entry, index) => (
                <Cell 
                  key={`cell-${index}`} 
                  fill={getPointColor(entry)}
                  fillOpacity={highlightedPoint === entry.name ? 1 : 0.7}
                  stroke={anomalies.some(a => a.name === entry.name) ? '#ef4444' : 'none'}
                  strokeWidth={anomalies.some(a => a.name === entry.name) ? 3 : 0}
                />
              ))}
            </Scatter>
          </ScatterChart>
        </ResponsiveContainer>
      </div>

      {/* Anomaly List */}
      {anomalies.length > 0 && (
        <div className="mt-4 p-3 bg-red-950/20 cyber-border rounded">
          <h4 className="text-sm font-bold text-red-400 font-mono mb-2 flex items-center gap-2">
            <TrendingUp className="w-4 h-4" />
            HIGH-RISK ANOMALIES (High Impact, Lower Probability)
          </h4>
          <div className="flex flex-wrap gap-2">
            {anomalies.map((anomaly, i) => (
              <Badge key={i} variant="outline" className="border-red-500/30 text-red-400 font-mono text-xs">
                {anomaly.name} ({anomaly.probability}%)
              </Badge>
            ))}
          </div>
        </div>
      )}
    </Card>
  );
}