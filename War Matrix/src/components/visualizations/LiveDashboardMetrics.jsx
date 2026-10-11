import React, { useState, useEffect } from 'react';
import { Card } from '../ui/card';
import { Badge } from '../ui/badge';
import { Activity, TrendingUp, TrendingDown, AlertTriangle, Zap } from 'lucide-react';
import { LineChart, Line, AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export default function LiveDashboardMetrics({ data, autoRefresh = true, refreshInterval = 5000, onMetricsUpdate }) {
  const [liveData, setLiveData] = useState([]);
  const [metrics, setMetrics] = useState({
    activeConflicts: 0,
    threatLevel: 0,
    economicImpact: 0,
    casualties: 0
  });

  // Simulate real-time data updates
  useEffect(() => {
    if (!data) return;

    // Initial data
    setMetrics({
      activeConflicts: data.activeConflicts || 0,
      threatLevel: data.threatLevel || 0,
      economicImpact: data.economicImpact || 0,
      casualties: data.casualties || 0
    });

    setLiveData(data.timeSeriesData || []);

    if (!autoRefresh) return;

    const interval = setInterval(() => {
      // Simulate data changes
      setMetrics(prev => {
        const newMetrics = {
          activeConflicts: Math.max(0, prev.activeConflicts + Math.floor(Math.random() * 3 - 1)),
          threatLevel: Math.max(0, Math.min(100, prev.threatLevel + Math.random() * 10 - 5)),
          economicImpact: Math.max(0, prev.economicImpact + Math.random() * 5 - 2.5),
          casualties: prev.casualties + Math.floor(Math.random() * 100)
        };
        // Notify parent of metrics update for threshold monitoring
        if (onMetricsUpdate) {
          onMetricsUpdate(newMetrics);
        }
        return newMetrics;
      });

      // Add new data point to time series
      setLiveData(prev => {
        const newPoint = {
          time: new Date().toLocaleTimeString(),
          value: Math.random() * 100,
          conflicts: Math.floor(Math.random() * 20) + 10,
          threat: Math.random() * 100
        };
        return [...prev.slice(-20), newPoint];
      });
    }, refreshInterval);

    return () => clearInterval(interval);
  }, [data, autoRefresh, refreshInterval]);

  const getThreatColor = (level) => {
    if (level >= 80) return 'from-red-500 to-rose-600';
    if (level >= 60) return 'from-orange-500 to-red-500';
    if (level >= 40) return 'from-yellow-500 to-orange-500';
    return 'from-green-500 to-yellow-500';
  };

  const getTrendIcon = (current, previous) => {
    if (current > previous) return <TrendingUp className="w-4 h-4 text-red-400" />;
    if (current < previous) return <TrendingDown className="w-4 h-4 text-green-400" />;
    return <Activity className="w-4 h-4 text-slate-400" />;
  };

  return (
    <div className="space-y-6 col-span-full lg:col-span-3">
      {/* Real-time Metrics Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-slate-950/80 backdrop-blur-xl cyber-border p-5">
          <div className="flex items-center justify-between mb-3">
            <span className="text-slate-400 font-mono text-xs uppercase">Active Conflicts</span>
            <Activity className="w-5 h-5 text-cyan-400 animate-pulse" />
          </div>
          <div className="text-3xl font-bold text-cyan-400 font-mono mb-2">
            {metrics.activeConflicts}
          </div>
          <Badge className="bg-cyan-500/20 text-cyan-400 border-cyan-500/30 font-mono text-xs">
            LIVE
          </Badge>
        </Card>

        <Card className="bg-slate-950/80 backdrop-blur-xl cyber-border p-5">
          <div className="flex items-center justify-between mb-3">
            <span className="text-slate-400 font-mono text-xs uppercase">Threat Level</span>
            <AlertTriangle className="w-5 h-5 text-orange-400 animate-pulse" />
          </div>
          <div className="text-3xl font-bold text-orange-400 font-mono mb-2">
            {metrics.threatLevel.toFixed(0)}%
          </div>
          <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
            <div
              className={`h-full bg-gradient-to-r ${getThreatColor(metrics.threatLevel)} transition-all duration-300`}
              style={{ width: `${metrics.threatLevel}%` }}
            />
          </div>
        </Card>

        <Card className="bg-slate-950/80 backdrop-blur-xl cyber-border p-5">
          <div className="flex items-center justify-between mb-3">
            <span className="text-slate-400 font-mono text-xs uppercase">Economic Impact</span>
            <Zap className="w-5 h-5 text-yellow-400" />
          </div>
          <div className="text-3xl font-bold text-yellow-400 font-mono mb-2">
            ${metrics.economicImpact.toFixed(1)}B
          </div>
          <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30 font-mono text-xs">
            UPDATING
          </Badge>
        </Card>

        <Card className="bg-slate-950/80 backdrop-blur-xl cyber-border p-5">
          <div className="flex items-center justify-between mb-3">
            <span className="text-slate-400 font-mono text-xs uppercase">Total Casualties</span>
            <Activity className="w-5 h-5 text-red-400" />
          </div>
          <div className="text-3xl font-bold text-red-400 font-mono mb-2">
            {metrics.casualties.toLocaleString()}
          </div>
          <Badge className="bg-red-500/20 text-red-400 border-red-500/30 font-mono text-xs">
            CRITICAL
          </Badge>
        </Card>
      </div>

      {/* Live Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="bg-slate-950/80 backdrop-blur-xl cyber-border p-6">
          <h3 className="text-lg font-bold text-green-400 glow-text font-mono mb-4">
            REAL-TIME ACTIVITY STREAM
          </h3>
          <div className="h-[250px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={liveData}>
                <defs>
                  <linearGradient id="activityGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#00ff41" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#00ff41" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis 
                  dataKey="time" 
                  stroke="#94a3b8" 
                  style={{ fontFamily: 'monospace', fontSize: '10px' }}
                />
                <YAxis 
                  stroke="#94a3b8" 
                  style={{ fontFamily: 'monospace', fontSize: '10px' }}
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#0f172a', 
                    border: '1px solid #00ff41',
                    fontFamily: 'monospace',
                    fontSize: '12px'
                  }}
                />
                <Area 
                  type="monotone" 
                  dataKey="value" 
                  stroke="#00ff41" 
                  fillOpacity={1} 
                  fill="url(#activityGradient)"
                  animationDuration={300}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card className="bg-slate-950/80 backdrop-blur-xl cyber-border p-6">
          <h3 className="text-lg font-bold text-cyan-400 glow-text font-mono mb-4">
            CONFLICT INTENSITY
          </h3>
          <div className="h-[250px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={liveData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis 
                  dataKey="time" 
                  stroke="#94a3b8" 
                  style={{ fontFamily: 'monospace', fontSize: '10px' }}
                />
                <YAxis 
                  stroke="#94a3b8" 
                  style={{ fontFamily: 'monospace', fontSize: '10px' }}
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#0f172a', 
                    border: '1px solid #00d4ff',
                    fontFamily: 'monospace',
                    fontSize: '12px'
                  }}
                />
                <Bar 
                  dataKey="conflicts" 
                  fill="#00d4ff" 
                  animationDuration={300}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      {/* Live Status Indicators */}
      <Card className="bg-slate-950/80 backdrop-blur-xl cyber-border p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse shadow-lg shadow-green-400/50" />
            <span className="text-green-400 font-mono text-sm font-bold">DATA STREAM ACTIVE</span>
          </div>
          <span className="text-slate-400 font-mono text-xs">
            REFRESH: {refreshInterval / 1000}s
          </span>
        </div>
      </Card>
    </div>
  );
}