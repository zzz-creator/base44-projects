import React, { useState, useMemo } from 'react';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { TrendingUp, Activity } from 'lucide-react';

export default function AdvancedTimeSeriesChart({ data, title, dataKey, color = '#00ff41' }) {
  const [showRollingAvg, setShowRollingAvg] = useState(true);
  const [showVolatility, setShowVolatility] = useState(false);
  const [avgWindow, setAvgWindow] = useState(7);

  const enhancedData = useMemo(() => {
    if (!data || data.length === 0) return [];

    return data.map((item, idx) => {
      const result = { ...item };

      // Calculate rolling average
      if (showRollingAvg && idx >= avgWindow - 1) {
        const sum = data.slice(idx - avgWindow + 1, idx + 1)
          .reduce((acc, d) => acc + (d[dataKey] || 0), 0);
        result.rollingAvg = sum / avgWindow;
      }

      // Calculate volatility (standard deviation over window)
      if (showVolatility && idx >= avgWindow - 1) {
        const windowData = data.slice(idx - avgWindow + 1, idx + 1).map(d => d[dataKey] || 0);
        const mean = windowData.reduce((a, b) => a + b, 0) / windowData.length;
        const variance = windowData.reduce((acc, val) => acc + Math.pow(val - mean, 2), 0) / windowData.length;
        result.volatility = Math.sqrt(variance);
      }

      return result;
    });
  }, [data, dataKey, showRollingAvg, showVolatility, avgWindow]);

  return (
    <Card className="bg-slate-950/80 backdrop-blur-xl cyber-border p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xl font-bold text-cyan-400 glow-text font-mono">{title}</h3>
        <div className="flex gap-2">
          <Button
            size="sm"
            variant={showRollingAvg ? "default" : "outline"}
            onClick={() => setShowRollingAvg(!showRollingAvg)}
            className={showRollingAvg ? "bg-green-500/20 text-green-400 border-green-500/30" : ""}
          >
            <TrendingUp className="w-4 h-4 mr-1" />
            Rolling Avg
          </Button>
          <Button
            size="sm"
            variant={showVolatility ? "default" : "outline"}
            onClick={() => setShowVolatility(!showVolatility)}
            className={showVolatility ? "bg-orange-500/20 text-orange-400 border-orange-500/30" : ""}
          >
            <Activity className="w-4 h-4 mr-1" />
            Volatility
          </Button>
        </div>
      </div>

      {showRollingAvg && (
        <div className="mb-4 flex items-center gap-4">
          <span className="text-xs text-slate-400 font-mono">Window Size:</span>
          {[3, 7, 14, 30].map(window => (
            <Badge
              key={window}
              className={`cursor-pointer ${avgWindow === window ? 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30' : 'bg-slate-800 text-slate-400'}`}
              onClick={() => setAvgWindow(window)}
            >
              {window}D
            </Badge>
          ))}
        </div>
      )}

      <div className="h-[300px]">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={enhancedData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
            <XAxis 
              dataKey="time" 
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
                fontFamily: 'monospace' 
              }}
            />
            <Legend wrapperStyle={{ fontFamily: 'monospace' }} />
            
            <Line 
              type="monotone" 
              dataKey={dataKey} 
              stroke={color} 
              strokeWidth={2}
              dot={false}
              name="Actual"
            />
            
            {showRollingAvg && (
              <Line 
                type="monotone" 
                dataKey="rollingAvg" 
                stroke="#06b6d4" 
                strokeWidth={2}
                strokeDasharray="5 5"
                dot={false}
                name={`${avgWindow}D Avg`}
              />
            )}
            
            {showVolatility && (
              <Line 
                type="monotone" 
                dataKey="volatility" 
                stroke="#f97316" 
                strokeWidth={2}
                dot={false}
                name="Volatility"
                yAxisId="right"
              />
            )}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}