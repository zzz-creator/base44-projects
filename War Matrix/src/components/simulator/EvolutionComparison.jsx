import React from 'react';
import { Card } from '../ui/card';
import { Badge } from '../ui/badge';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { GitBranch, TrendingUp, TrendingDown } from 'lucide-react';

export default function EvolutionComparison({ originalSimulation, evolutionResult }) {
  if (!originalSimulation || !evolutionResult) return null;

  // Compare outcomes
  const outcomeComparison = originalSimulation.potential_outcomes?.map((original, idx) => {
    const evolved = evolutionResult.revised_outcomes?.[idx];
    return {
      name: original.outcome_name.substring(0, 15),
      original: original.probability,
      evolved: evolved?.probability || 0,
      change: (evolved?.probability || 0) - original.probability
    };
  }) || [];

  // Compare regional stability
  const stabilityComparison = evolutionResult.stability_comparison?.map(region => ({
    region: region.region.substring(0, 15),
    original: region.original_stability,
    evolved: region.revised_stability,
    change: region.revised_stability - region.original_stability
  })) || [];

  return (
    <div className="space-y-6">
      {/* Probability Shift Visualization */}
      <Card className="bg-slate-950/80 backdrop-blur-xl cyber-border p-6">
        <div className="flex items-center gap-3 mb-4">
          <GitBranch className="w-6 h-6 text-cyan-400" />
          <h3 className="text-xl font-bold text-cyan-400 glow-text font-mono">
            OUTCOME PROBABILITY SHIFT
          </h3>
        </div>
        <ResponsiveContainer width="100%" height={350}>
          <BarChart data={outcomeComparison}>
            <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
            <XAxis dataKey="name" stroke="#94a3b8" style={{ fontSize: '11px', fontFamily: 'monospace' }} />
            <YAxis stroke="#94a3b8" style={{ fontSize: '12px', fontFamily: 'monospace' }} />
            <Tooltip
              contentStyle={{
                backgroundColor: '#0f172a',
                border: '1px solid #06b6d4',
                borderRadius: '8px',
                fontFamily: 'monospace'
              }}
              formatter={(value) => `${value}%`}
            />
            <Legend wrapperStyle={{ fontFamily: 'monospace', fontSize: '12px' }} />
            <Bar dataKey="original" fill="#ef4444" name="Original" />
            <Bar dataKey="evolved" fill="#22c55e" name="Evolved" />
          </BarChart>
        </ResponsiveContainer>

        {/* Change Indicators */}
        <div className="mt-4 grid grid-cols-2 md:grid-cols-3 gap-3">
          {outcomeComparison.map((outcome, idx) => (
            <div key={idx} className="bg-slate-900/50 cyber-border rounded p-3">
              <div className="text-xs text-slate-400 font-mono mb-1">{outcome.name}</div>
              <div className="flex items-center gap-2">
                {outcome.change > 0 ? (
                  <TrendingUp className="w-4 h-4 text-green-400" />
                ) : outcome.change < 0 ? (
                  <TrendingDown className="w-4 h-4 text-red-400" />
                ) : null}
                <span className={`font-mono text-sm font-bold ${
                  outcome.change > 0 ? 'text-green-400' : outcome.change < 0 ? 'text-red-400' : 'text-slate-400'
                }`}>
                  {outcome.change > 0 ? '+' : ''}{outcome.change.toFixed(1)}%
                </span>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Regional Stability Comparison */}
      {stabilityComparison.length > 0 && (
        <Card className="bg-slate-950/80 backdrop-blur-xl cyber-border p-6">
          <div className="flex items-center gap-3 mb-4">
            <TrendingUp className="w-6 h-6 text-blue-400" />
            <h3 className="text-xl font-bold text-blue-400 glow-text font-mono">
              REGIONAL STABILITY SHIFT
            </h3>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={stabilityComparison}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
              <XAxis dataKey="region" stroke="#94a3b8" style={{ fontSize: '11px', fontFamily: 'monospace' }} />
              <YAxis stroke="#94a3b8" style={{ fontSize: '12px', fontFamily: 'monospace' }} />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#0f172a',
                  border: '1px solid #3b82f6',
                  borderRadius: '8px',
                  fontFamily: 'monospace'
                }}
              />
              <Legend wrapperStyle={{ fontFamily: 'monospace', fontSize: '12px' }} />
              <Bar dataKey="original" fill="#f59e0b" name="Original" />
              <Bar dataKey="evolved" fill="#06b6d4" name="Evolved" />
            </BarChart>
          </ResponsiveContainer>
        </Card>
      )}

      {/* Key Divergence Summary */}
      <Card className="bg-gradient-to-br from-purple-950/50 to-pink-950/50 backdrop-blur-xl cyber-border p-6">
        <h3 className="text-lg font-bold text-purple-400 glow-text font-mono mb-4">
          KEY DIVERGENCE INDICATORS
        </h3>
        <div className="grid md:grid-cols-3 gap-4">
          <div className="bg-slate-900/50 cyber-border rounded-lg p-4">
            <div className="text-xs text-slate-400 font-mono mb-1">Impact Score</div>
            <div className="text-3xl font-bold text-cyan-400 font-mono">
              {evolutionResult.change_impact_score}/100
            </div>
          </div>
          <div className="bg-slate-900/50 cyber-border rounded-lg p-4">
            <div className="text-xs text-slate-400 font-mono mb-1">Cascading Effects</div>
            <div className="text-3xl font-bold text-orange-400 font-mono">
              {evolutionResult.cascading_effects?.length || 0}
            </div>
          </div>
          <div className="bg-slate-900/50 cyber-border rounded-lg p-4">
            <div className="text-xs text-slate-400 font-mono mb-1">Timeline Shifts</div>
            <div className="text-3xl font-bold text-purple-400 font-mono">
              {evolutionResult.timeline_divergence_points?.length || 0}
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}