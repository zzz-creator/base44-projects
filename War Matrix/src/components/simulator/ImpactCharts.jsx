import React from 'react';
import { Card } from '../ui/card';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Area, AreaChart } from 'recharts';
import { TrendingUp, DollarSign, Skull } from 'lucide-react';

export default function ImpactCharts({ outcomes, escalationPathways, isEvolution = false }) {
  // Prepare casualty data
  const casualtyData = outcomes?.map((outcome, idx) => ({
    name: outcome.outcome_name.substring(0, 20),
    military: outcome.casualties?.military || 0,
    civilian: outcome.casualties?.civilian || 0,
    probability: outcome.probability
  })) || [];

  // Prepare escalation data
  const escalationData = escalationPathways?.map((pathway, idx) => ({
    stage: `Stage ${idx + 1}`,
    intensity: pathway.intensity,
    timeframe: pathway.timeframe
  })) || [];

  // Prepare economic impact data
  const economicData = outcomes?.map((outcome, idx) => ({
    name: outcome.outcome_name.substring(0, 20),
    cost: parseFloat(outcome.economic_cost?.replace(/[^0-9.]/g, '') || 0),
    probability: outcome.probability
  })) || [];

  return (
    <div className="space-y-6">
      {/* Casualty Projections */}
      <Card className="bg-slate-950/80 backdrop-blur-xl cyber-border p-6">
        <div className="flex items-center gap-3 mb-4">
          <Skull className="w-6 h-6 text-red-400" />
          <h3 className="text-xl font-bold text-red-400 glow-text font-mono">
            {isEvolution ? 'EVOLVED CASUALTY PROJECTIONS' : 'CASUALTY PROJECTIONS'}
          </h3>
        </div>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={casualtyData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
            <XAxis dataKey="name" stroke="#94a3b8" style={{ fontSize: '12px', fontFamily: 'monospace' }} />
            <YAxis stroke="#94a3b8" style={{ fontSize: '12px', fontFamily: 'monospace' }} />
            <Tooltip
              contentStyle={{
                backgroundColor: '#0f172a',
                border: '1px solid #22c55e',
                borderRadius: '8px',
                fontFamily: 'monospace'
              }}
            />
            <Legend wrapperStyle={{ fontFamily: 'monospace', fontSize: '12px' }} />
            <Bar dataKey="military" fill="#ef4444" name="Military" />
            <Bar dataKey="civilian" fill="#f97316" name="Civilian" />
          </BarChart>
        </ResponsiveContainer>
        {isEvolution && (
          <div className="mt-3 p-3 bg-cyan-950/20 cyber-border rounded">
            <p className="text-cyan-400 font-mono text-xs">
              ⚡ Evolution Impact: Casualty projections adjusted based on new variables
            </p>
          </div>
        )}
      </Card>

      {/* Escalation Intensity */}
      <Card className="bg-slate-950/80 backdrop-blur-xl cyber-border p-6">
        <div className="flex items-center gap-3 mb-4">
          <TrendingUp className="w-6 h-6 text-orange-400" />
          <h3 className="text-xl font-bold text-orange-400 glow-text font-mono">
            {isEvolution ? 'EVOLVED ESCALATION CURVE' : 'ESCALATION INTENSITY CURVE'}
          </h3>
        </div>
        <ResponsiveContainer width="100%" height={300}>
          <AreaChart data={escalationData}>
            <defs>
              <linearGradient id="intensityGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.8}/>
                <stop offset="95%" stopColor="#f59e0b" stopOpacity={0.1}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
            <XAxis dataKey="stage" stroke="#94a3b8" style={{ fontSize: '12px', fontFamily: 'monospace' }} />
            <YAxis stroke="#94a3b8" style={{ fontSize: '12px', fontFamily: 'monospace' }} />
            <Tooltip
              contentStyle={{
                backgroundColor: '#0f172a',
                border: '1px solid #f59e0b',
                borderRadius: '8px',
                fontFamily: 'monospace'
              }}
            />
            <Area type="monotone" dataKey="intensity" stroke="#f59e0b" fill="url(#intensityGradient)" />
          </AreaChart>
        </ResponsiveContainer>
      </Card>

      {/* Economic Impact */}
      <Card className="bg-slate-950/80 backdrop-blur-xl cyber-border p-6">
        <div className="flex items-center gap-3 mb-4">
          <DollarSign className="w-6 h-6 text-yellow-400" />
          <h3 className="text-xl font-bold text-yellow-400 glow-text font-mono">
            {isEvolution ? 'EVOLVED ECONOMIC IMPACT' : 'ECONOMIC IMPACT PROJECTION'}
          </h3>
        </div>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={economicData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
            <XAxis dataKey="name" stroke="#94a3b8" style={{ fontSize: '12px', fontFamily: 'monospace' }} />
            <YAxis stroke="#94a3b8" style={{ fontSize: '12px', fontFamily: 'monospace' }} />
            <Tooltip
              contentStyle={{
                backgroundColor: '#0f172a',
                border: '1px solid #eab308',
                borderRadius: '8px',
                fontFamily: 'monospace'
              }}
              formatter={(value) => `$${value}B`}
            />
            <Legend wrapperStyle={{ fontFamily: 'monospace', fontSize: '12px' }} />
            <Line type="monotone" dataKey="cost" stroke="#eab308" strokeWidth={3} dot={{ r: 6 }} name="Economic Cost ($B)" />
          </LineChart>
        </ResponsiveContainer>
      </Card>
    </div>
  );
}