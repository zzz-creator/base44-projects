import React from 'react';
import { Card } from '../ui/card';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ComposedChart, Bar } from 'recharts';
import { TrendingUp, DollarSign } from 'lucide-react';

export default function EconomicConflictCorrelation({ economicData, conflictData }) {
  // Combine economic indicators with conflict escalations
  const prepareTimeSeriesData = () => {
    if (!economicData || !conflictData) return [];

    // Create time series from 2025-2035
    const years = Array.from({ length: 11 }, (_, i) => 2025 + i);
    
    return years.map(year => {
      // Get conflicts predicted for this timeframe
      const yearConflicts = conflictData.filter(c => {
        const timeframe = c.timeframe?.toLowerCase() || '';
        return timeframe.includes(year.toString()) || 
               (year >= 2025 && year <= 2030 && timeframe.includes('near')) ||
               (year >= 2030 && year <= 2040 && timeframe.includes('medium'));
      });

      const avgProbability = yearConflicts.length > 0
        ? yearConflicts.reduce((sum, c) => sum + (c.probability || 0), 0) / yearConflicts.length
        : 0;

      const totalEconomicImpact = yearConflicts.reduce((sum, c) => 
        sum + (c.economic_impact_billions || 0), 0
      );

      // Simulate economic indicators (in production, use real data)
      const baseGDP = 100;
      const gdpVariation = Math.sin((year - 2025) * 0.5) * 10;
      const conflictImpact = avgProbability * -0.3;

      return {
        year,
        conflict_probability: avgProbability,
        gdp_growth: baseGDP + gdpVariation + conflictImpact,
        resource_scarcity: 20 + (year - 2025) * 3 + avgProbability * 0.2,
        economic_impact: totalEconomicImpact / 10, // Scale down for visualization
        instability_index: avgProbability * 0.8 + (year - 2025) * 2
      };
    });
  };

  const data = prepareTimeSeriesData();

  const correlationAnalysis = () => {
    if (data.length < 2) return [];

    const calculateCorrelation = (x, y) => {
      const n = x.length;
      const sumX = x.reduce((a, b) => a + b, 0);
      const sumY = y.reduce((a, b) => a + b, 0);
      const sumXY = x.reduce((sum, xi, i) => sum + xi * y[i], 0);
      const sumX2 = x.reduce((sum, xi) => sum + xi * xi, 0);
      const sumY2 = y.reduce((sum, yi) => sum + yi * yi, 0);

      const numerator = n * sumXY - sumX * sumY;
      const denominator = Math.sqrt((n * sumX2 - sumX * sumX) * (n * sumY2 - sumY * sumY));

      return denominator === 0 ? 0 : numerator / denominator;
    };

    const conflictProb = data.map(d => d.conflict_probability);
    const gdp = data.map(d => d.gdp_growth);
    const resources = data.map(d => d.resource_scarcity);
    const instability = data.map(d => d.instability_index);

    return [
      { factor: 'GDP Growth', correlation: calculateCorrelation(conflictProb, gdp) },
      { factor: 'Resource Scarcity', correlation: calculateCorrelation(conflictProb, resources) },
      { factor: 'Instability Index', correlation: calculateCorrelation(conflictProb, instability) }
    ];
  };

  const correlations = correlationAnalysis();

  return (
    <Card className="bg-slate-950/80 backdrop-blur-xl cyber-border p-6">
      <h3 className="text-xl font-bold text-yellow-400 glow-text font-mono mb-4 flex items-center gap-2">
        <DollarSign className="w-6 h-6" />
        ECONOMIC-CONFLICT CORRELATION ANALYSIS
      </h3>

      <div className="h-[400px] mb-6">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
            <XAxis 
              dataKey="year" 
              stroke="#94a3b8" 
              style={{ fontFamily: 'monospace', fontSize: '11px' }}
            />
            <YAxis 
              stroke="#94a3b8" 
              style={{ fontFamily: 'monospace', fontSize: '11px' }}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: '#0f172a',
                border: '1px solid #00ff41',
                borderRadius: '8px',
                fontFamily: 'monospace'
              }}
            />
            <Legend wrapperStyle={{ fontFamily: 'monospace', fontSize: '12px' }} />
            <Line 
              type="monotone" 
              dataKey="conflict_probability" 
              stroke="#ff0040" 
              strokeWidth={2}
              name="Conflict Probability (%)"
            />
            <Line 
              type="monotone" 
              dataKey="gdp_growth" 
              stroke="#00ff41" 
              strokeWidth={2}
              name="GDP Growth Index"
            />
            <Line 
              type="monotone" 
              dataKey="resource_scarcity" 
              stroke="#ffaa00" 
              strokeWidth={2}
              name="Resource Scarcity Index"
            />
            <Bar 
              dataKey="economic_impact" 
              fill="#a855f7" 
              opacity={0.6}
              name="Economic Impact ($B/10)"
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      <div className="grid md:grid-cols-3 gap-4">
        {correlations.map((corr, idx) => (
          <Card key={idx} className="bg-slate-900/50 cyber-border p-4">
            <div className="text-xs text-slate-400 font-mono mb-1">{corr.factor}</div>
            <div className="flex items-center gap-2">
              <div className={`text-2xl font-bold font-mono ${
                corr.correlation > 0.5 ? 'text-red-400' :
                corr.correlation < -0.5 ? 'text-green-400' :
                'text-yellow-400'
              }`}>
                {(corr.correlation * 100).toFixed(0)}%
              </div>
              <TrendingUp className={`w-4 h-4 ${
                corr.correlation > 0 ? 'text-red-400' : 'text-green-400 rotate-180'
              }`} />
            </div>
            <div className="text-xs text-slate-500 font-mono mt-1">
              {Math.abs(corr.correlation) > 0.7 ? 'Strong' :
               Math.abs(corr.correlation) > 0.4 ? 'Moderate' : 'Weak'} Correlation
            </div>
          </Card>
        ))}
      </div>
    </Card>
  );
}