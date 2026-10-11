import React from 'react';
import { Card } from '../ui/card';
import { TrendingUp, Skull, Globe, AlertTriangle } from 'lucide-react';

export default function WarStatsPanel({ wars }) {
  const ongoingWars = wars.filter(w => w.status === 'ongoing').length;
  const totalCasualties = wars.reduce((sum, w) => sum + (w.casualties?.total || 0), 0);
  const countriesInvolved = new Set(wars.flatMap(w => w.countries_involved || [])).size;
  const economicImpact = wars.reduce((sum, w) => sum + (w.economic_impact || 0), 0);

  const stats = [
    {
      label: 'Active Conflicts',
      value: ongoingWars,
      icon: AlertTriangle,
      color: 'text-red-400',
      glow: 'shadow-red-500/50'
    },
    {
      label: 'Total Casualties',
      value: totalCasualties.toLocaleString(),
      icon: Skull,
      color: 'text-orange-400',
      glow: 'shadow-orange-500/50'
    },
    {
      label: 'Countries Involved',
      value: countriesInvolved,
      icon: Globe,
      color: 'text-cyan-400',
      glow: 'shadow-cyan-500/50'
    },
    {
      label: 'Economic Impact',
      value: `$${(economicImpact / 1e9).toFixed(1)}B`,
      icon: TrendingUp,
      color: 'text-yellow-400',
      glow: 'shadow-yellow-500/50'
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {stats.map((stat, idx) => (
        <Card key={idx} className="bg-slate-950/80 backdrop-blur-xl cyber-border hover-glow transition-all duration-300 p-6">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-slate-400 font-mono mb-2">{stat.label}</p>
              <p className={`text-3xl font-bold ${stat.color} glow-text font-mono`}>
                {stat.value}
              </p>
            </div>
            <div className={`p-3 rounded-lg bg-slate-900/50 border border-slate-700/50 shadow-lg ${stat.glow}`}>
              <stat.icon className={`w-6 h-6 ${stat.color}`} />
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
}