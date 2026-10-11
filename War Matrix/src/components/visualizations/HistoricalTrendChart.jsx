import React, { useState, useEffect } from 'react';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { TrendingUp, TrendingDown, Activity, AlertTriangle, RefreshCw } from 'lucide-react';
import { LineChart, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ComposedChart, Bar } from 'recharts';

export default function HistoricalTrendChart({ 
  title = "Historical Trends",
  refreshInterval = 30000 
}) {
  const [timeRange, setTimeRange] = useState('7d');
  const [historicalData, setHistoricalData] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  // Generate simulated historical data
  useEffect(() => {
    generateHistoricalData();
    const interval = setInterval(generateHistoricalData, refreshInterval);
    return () => clearInterval(interval);
  }, [timeRange]);

  const generateHistoricalData = () => {
    setIsLoading(true);
    const now = new Date();
    const dataPoints = timeRange === '24h' ? 24 : timeRange === '7d' ? 7 : timeRange === '30d' ? 30 : 12;
    const data = [];

    for (let i = dataPoints - 1; i >= 0; i--) {
      const date = new Date(now);
      if (timeRange === '24h') {
        date.setHours(date.getHours() - i);
      } else if (timeRange === '7d') {
        date.setDate(date.getDate() - i);
      } else if (timeRange === '30d') {
        date.setDate(date.getDate() - i);
      } else {
        date.setMonth(date.getMonth() - i);
      }

      // Simulate trends with some variability
      const baseThreat = 50 + Math.sin(i * 0.5) * 15;
      const baseConflicts = 8 + Math.sin(i * 0.3) * 4;
      
      data.push({
        date: timeRange === '24h' 
          ? date.toLocaleTimeString('en-US', { hour: '2-digit' })
          : timeRange === '12m'
          ? date.toLocaleDateString('en-US', { month: 'short' })
          : date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        threatLevel: Math.round(baseThreat + (Math.random() - 0.5) * 20),
        activeConflicts: Math.round(baseConflicts + (Math.random() - 0.5) * 3),
        economicImpact: Math.round((150 + Math.sin(i * 0.2) * 50 + (Math.random() - 0.5) * 30) * 10) / 10,
        casualties: Math.round((10000 + Math.sin(i * 0.4) * 5000 + (Math.random() - 0.5) * 2000))
      });
    }

    setHistoricalData(data);
    setIsLoading(false);
  };

  const calculateTrend = (dataKey) => {
    if (historicalData.length < 2) return 0;
    const recent = historicalData.slice(-3);
    const earlier = historicalData.slice(0, 3);
    const recentAvg = recent.reduce((sum, d) => sum + d[dataKey], 0) / recent.length;
    const earlierAvg = earlier.reduce((sum, d) => sum + d[dataKey], 0) / earlier.length;
    return ((recentAvg - earlierAvg) / earlierAvg * 100).toFixed(1);
  };

  const TrendBadge = ({ value, inverse = false }) => {
    const numValue = parseFloat(value);
    const isPositive = inverse ? numValue < 0 : numValue > 0;
    const isNegative = inverse ? numValue > 0 : numValue < 0;
    
    return (
      <Badge className={`font-mono text-xs flex items-center gap-1 ${
        isNegative ? 'bg-green-500/20 text-green-400 border-green-500/30' :
        isPositive ? 'bg-red-500/20 text-red-400 border-red-500/30' :
        'bg-slate-500/20 text-slate-400 border-slate-500/30'
      }`}>
        {numValue > 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
        {numValue > 0 ? '+' : ''}{value}%
      </Badge>
    );
  };

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <Card className="bg-slate-950/95 backdrop-blur-xl border-green-500/30 p-3">
          <p className="text-cyan-400 font-mono text-xs mb-2">{label}</p>
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
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          <Activity className="w-6 h-6 text-cyan-400" />
          <div>
            <h3 className="text-xl font-bold text-cyan-400 glow-text font-mono">{title}</h3>
            <p className="text-slate-400 font-mono text-xs">Real-time trend analysis</p>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-[120px] bg-slate-900/50 border-cyan-500/30 text-cyan-400 font-mono text-sm">
              <SelectValue placeholder="Time range" />
            </SelectTrigger>
            <SelectContent className="bg-slate-900 border-cyan-500/30">
              <SelectItem value="24h" className="text-cyan-400 font-mono">24 Hours</SelectItem>
              <SelectItem value="7d" className="text-cyan-400 font-mono">7 Days</SelectItem>
              <SelectItem value="30d" className="text-cyan-400 font-mono">30 Days</SelectItem>
              <SelectItem value="12m" className="text-cyan-400 font-mono">12 Months</SelectItem>
            </SelectContent>
          </Select>
          
          <Button
            variant="outline"
            size="icon"
            onClick={generateHistoricalData}
            disabled={isLoading}
            className="border-cyan-500/30 text-cyan-400 hover:bg-cyan-500/10"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </div>

      {/* Trend Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="p-3 bg-red-950/20 rounded-lg border border-red-500/30">
          <div className="flex items-center justify-between mb-1">
            <span className="text-slate-400 font-mono text-xs">Threat Level</span>
            <TrendBadge value={calculateTrend('threatLevel')} />
          </div>
          <div className="text-2xl font-bold text-red-400 font-mono">
            {historicalData[historicalData.length - 1]?.threatLevel || 0}%
          </div>
        </div>
        
        <div className="p-3 bg-orange-950/20 rounded-lg border border-orange-500/30">
          <div className="flex items-center justify-between mb-1">
            <span className="text-slate-400 font-mono text-xs">Active Conflicts</span>
            <TrendBadge value={calculateTrend('activeConflicts')} />
          </div>
          <div className="text-2xl font-bold text-orange-400 font-mono">
            {historicalData[historicalData.length - 1]?.activeConflicts || 0}
          </div>
        </div>
        
        <div className="p-3 bg-yellow-950/20 rounded-lg border border-yellow-500/30">
          <div className="flex items-center justify-between mb-1">
            <span className="text-slate-400 font-mono text-xs">Economic Impact</span>
            <TrendBadge value={calculateTrend('economicImpact')} />
          </div>
          <div className="text-2xl font-bold text-yellow-400 font-mono">
            ${historicalData[historicalData.length - 1]?.economicImpact || 0}B
          </div>
        </div>
        
        <div className="p-3 bg-purple-950/20 rounded-lg border border-purple-500/30">
          <div className="flex items-center justify-between mb-1">
            <span className="text-slate-400 font-mono text-xs">Casualties</span>
            <TrendBadge value={calculateTrend('casualties')} inverse />
          </div>
          <div className="text-2xl font-bold text-purple-400 font-mono">
            {((historicalData[historicalData.length - 1]?.casualties || 0) / 1000).toFixed(1)}K
          </div>
        </div>
      </div>

      {/* Main Chart */}
      <div className="h-[300px]">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={historicalData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
            <XAxis 
              dataKey="date" 
              stroke="#64748b" 
              style={{ fontSize: '10px', fontFamily: 'monospace' }}
              tick={{ fill: '#64748b' }}
            />
            <YAxis 
              yAxisId="left"
              stroke="#64748b"
              style={{ fontSize: '10px', fontFamily: 'monospace' }}
              tick={{ fill: '#64748b' }}
            />
            <YAxis 
              yAxisId="right"
              orientation="right"
              stroke="#64748b"
              style={{ fontSize: '10px', fontFamily: 'monospace' }}
              tick={{ fill: '#64748b' }}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend 
              wrapperStyle={{ fontFamily: 'monospace', fontSize: '11px' }}
            />
            <Area 
              yAxisId="left"
              type="monotone" 
              dataKey="threatLevel" 
              stroke="#ef4444" 
              fill="#ef4444"
              fillOpacity={0.2}
              name="Threat Level (%)"
            />
            <Line 
              yAxisId="right"
              type="monotone" 
              dataKey="activeConflicts" 
              stroke="#f97316" 
              strokeWidth={2}
              dot={false}
              name="Active Conflicts"
            />
            <Bar 
              yAxisId="left"
              dataKey="economicImpact" 
              fill="#eab308"
              fillOpacity={0.5}
              name="Economic Impact ($B)"
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}