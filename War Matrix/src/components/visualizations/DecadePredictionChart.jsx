import React, { useState } from 'react';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { TrendingUp, Calendar, AlertTriangle, BarChart3 } from 'lucide-react';
import { 
  BarChart, Bar, LineChart, Line, AreaChart, Area, RadarChart, PolarGrid, 
  PolarAngleAxis, PolarRadiusAxis, Radar, XAxis, YAxis, CartesianGrid, 
  Tooltip, Legend, ResponsiveContainer, ComposedChart, Scatter
} from 'recharts';

export default function DecadePredictionChart({ predictionsData }) {
  const [selectedDecade, setSelectedDecade] = useState(null);

  if (!predictionsData?.predictions_by_decade?.length) {
    return null;
  }

  // Process data for visualization
  const decadeOverviewData = predictionsData.predictions_by_decade.map((decade, idx) => {
    const conflicts = decade.potential_conflicts || [];
    const avgProbability = conflicts.length > 0 
      ? conflicts.reduce((sum, c) => sum + (c.probability || 0), 0) / conflicts.length 
      : 0;
    
    const categories = {};
    conflicts.forEach(c => {
      const cat = c.cause_category?.toLowerCase() || 'other';
      categories[cat] = (categories[cat] || 0) + 1;
    });

    return {
      decade: decade.decade,
      years: decade.years,
      avgProbability: Math.round(avgProbability),
      conflictCount: conflicts.length,
      economic: categories.economic || 0,
      territorial: categories.territorial || 0,
      climate: categories.climate || 0,
      technology: categories.technology || 0,
      religious: categories.religious || 0,
      energy: categories.energy || 0
    };
  });

  // Flatten conflicts for timeline view
  const allConflicts = predictionsData.predictions_by_decade.flatMap((decade, decadeIdx) => 
    (decade.potential_conflicts || []).map(conflict => ({
      ...conflict,
      decade: decade.decade,
      decadeIdx
    }))
  );

  const categoryColors = {
    economic: '#eab308',
    territorial: '#ef4444',
    climate: '#22c55e',
    technology: '#06b6d4',
    religious: '#a855f7',
    energy: '#f97316'
  };

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <Card className="bg-slate-950/95 backdrop-blur-xl border-purple-500/30 p-3">
          <p className="text-purple-400 font-mono text-sm font-bold mb-2">{label}</p>
          {payload.map((entry, index) => (
            <p key={index} className="font-mono text-xs" style={{ color: entry.color }}>
              {entry.name}: {entry.value}
            </p>
          ))}
        </Card>
      );
    }
    return null;
  };

  return (
    <Card className="bg-slate-950/80 backdrop-blur-xl cyber-border p-6">
      <div className="flex items-center gap-3 mb-6">
        <Calendar className="w-6 h-6 text-purple-400" />
        <div>
          <h3 className="text-xl font-bold text-purple-400 glow-text font-mono">
            DECADE CONFLICT EVOLUTION
          </h3>
          <p className="text-slate-400 font-mono text-xs">
            Interactive visualization of conflict predictions across eras
          </p>
        </div>
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4 bg-slate-900/50 border border-purple-500/30">
          <TabsTrigger value="overview" className="font-mono text-xs">OVERVIEW</TabsTrigger>
          <TabsTrigger value="categories" className="font-mono text-xs">CATEGORIES</TabsTrigger>
          <TabsTrigger value="timeline" className="font-mono text-xs">TIMELINE</TabsTrigger>
          <TabsTrigger value="radar" className="font-mono text-xs">RISK RADAR</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4">
          <div className="h-[350px]">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={decadeOverviewData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis 
                  dataKey="decade" 
                  stroke="#64748b" 
                  style={{ fontSize: '10px', fontFamily: 'monospace' }}
                />
                <YAxis 
                  yAxisId="left"
                  stroke="#64748b"
                  style={{ fontSize: '10px', fontFamily: 'monospace' }}
                />
                <YAxis 
                  yAxisId="right"
                  orientation="right"
                  stroke="#64748b"
                  style={{ fontSize: '10px', fontFamily: 'monospace' }}
                />
                <Tooltip content={<CustomTooltip />} />
                <Legend wrapperStyle={{ fontFamily: 'monospace', fontSize: '11px' }} />
                <Bar 
                  yAxisId="left"
                  dataKey="conflictCount" 
                  fill="#a855f7" 
                  fillOpacity={0.7}
                  name="Predicted Conflicts"
                />
                <Line 
                  yAxisId="right"
                  type="monotone" 
                  dataKey="avgProbability" 
                  stroke="#ef4444" 
                  strokeWidth={3}
                  dot={{ fill: '#ef4444', strokeWidth: 2 }}
                  name="Avg Probability (%)"
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>

          {/* Decade Details */}
          <div className="grid md:grid-cols-3 gap-4">
            {decadeOverviewData.map((decade, idx) => (
              <div 
                key={idx}
                className="p-4 bg-slate-900/50 rounded-lg border border-purple-500/20 hover:border-purple-500/50 transition-all cursor-pointer"
                onClick={() => setSelectedDecade(decade)}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-purple-400 font-mono font-bold">{decade.decade}</span>
                  <Badge className={`font-mono text-xs ${
                    decade.avgProbability >= 60 ? 'bg-red-500/20 text-red-400 border-red-500/30' :
                    decade.avgProbability >= 40 ? 'bg-orange-500/20 text-orange-400 border-orange-500/30' :
                    'bg-green-500/20 text-green-400 border-green-500/30'
                  }`}>
                    {decade.avgProbability}% Risk
                  </Badge>
                </div>
                <p className="text-slate-400 font-mono text-xs mb-2">{decade.years}</p>
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-orange-400" />
                  <span className="text-orange-400 font-mono text-sm">{decade.conflictCount} conflicts</span>
                </div>
              </div>
            ))}
          </div>
        </TabsContent>

        {/* Categories Tab */}
        <TabsContent value="categories" className="space-y-4">
          <div className="h-[350px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={decadeOverviewData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis type="number" stroke="#64748b" style={{ fontSize: '10px', fontFamily: 'monospace' }} />
                <YAxis type="category" dataKey="decade" stroke="#64748b" style={{ fontSize: '10px', fontFamily: 'monospace' }} width={80} />
                <Tooltip content={<CustomTooltip />} />
                <Legend wrapperStyle={{ fontFamily: 'monospace', fontSize: '10px' }} />
                <Bar dataKey="economic" stackId="a" fill={categoryColors.economic} name="Economic" />
                <Bar dataKey="territorial" stackId="a" fill={categoryColors.territorial} name="Territorial" />
                <Bar dataKey="climate" stackId="a" fill={categoryColors.climate} name="Climate" />
                <Bar dataKey="technology" stackId="a" fill={categoryColors.technology} name="Technology" />
                <Bar dataKey="religious" stackId="a" fill={categoryColors.religious} name="Religious" />
                <Bar dataKey="energy" stackId="a" fill={categoryColors.energy} name="Energy" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Category Legend */}
          <div className="flex flex-wrap gap-3 justify-center">
            {Object.entries(categoryColors).map(([cat, color]) => (
              <Badge 
                key={cat}
                className="font-mono text-xs capitalize"
                style={{ background: color + '20', color: color, borderColor: color + '50' }}
              >
                {cat}
              </Badge>
            ))}
          </div>
        </TabsContent>

        {/* Timeline Tab */}
        <TabsContent value="timeline" className="space-y-4">
          <div className="h-[350px]">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={allConflicts}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis 
                  dataKey="decade" 
                  stroke="#64748b" 
                  style={{ fontSize: '10px', fontFamily: 'monospace' }}
                />
                <YAxis 
                  stroke="#64748b"
                  style={{ fontSize: '10px', fontFamily: 'monospace' }}
                  domain={[0, 100]}
                />
                <Tooltip 
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload;
                      return (
                        <Card className="bg-slate-950/95 backdrop-blur-xl border-cyan-500/30 p-3 max-w-xs">
                          <p className="text-cyan-400 font-mono text-sm font-bold mb-1">{data.name}</p>
                          <p className="text-slate-400 font-mono text-xs mb-2">{data.decade}</p>
                          <Badge className={`font-mono text-xs ${
                            data.probability >= 60 ? 'bg-red-500/20 text-red-400' : 'bg-yellow-500/20 text-yellow-400'
                          }`}>
                            {data.probability}% Probability
                          </Badge>
                          <p className="text-slate-300 font-mono text-xs mt-2">{data.description?.slice(0, 100)}...</p>
                        </Card>
                      );
                    }
                    return null;
                  }}
                />
                <Scatter 
                  dataKey="probability" 
                  fill="#06b6d4"
                  name="Conflicts"
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </TabsContent>

        {/* Radar Tab */}
        <TabsContent value="radar" className="space-y-4">
          <div className="h-[350px]">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart data={decadeOverviewData}>
                <PolarGrid stroke="#475569" />
                <PolarAngleAxis 
                  dataKey="decade" 
                  stroke="#94a3b8" 
                  style={{ fontFamily: 'monospace', fontSize: '10px' }} 
                />
                <PolarRadiusAxis stroke="#64748b" domain={[0, 100]} />
                <Radar 
                  name="Risk Level" 
                  dataKey="avgProbability" 
                  stroke="#ef4444" 
                  fill="#ef4444" 
                  fillOpacity={0.4} 
                />
                <Radar 
                  name="Conflict Count x10" 
                  dataKey={(d) => d.conflictCount * 10} 
                  stroke="#a855f7" 
                  fill="#a855f7" 
                  fillOpacity={0.4} 
                />
                <Legend wrapperStyle={{ fontFamily: 'monospace', fontSize: '11px' }} />
                <Tooltip content={<CustomTooltip />} />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </TabsContent>
      </Tabs>
    </Card>
  );
}