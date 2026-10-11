import React from 'react';
import { Card } from '../ui/card';
import { Badge } from '../ui/badge';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  ReferenceDot,
  Area,
  ComposedChart
} from 'recharts';
import { TrendingUp, TrendingDown, AlertTriangle } from 'lucide-react';

export default function PredictiveEconomicChart({ historicalData, indicator, currentValue, newsEvents }) {
  // Generate short-term prediction based on trend
  const generatePrediction = () => {
    if (!historicalData || historicalData.length < 3) return [];
    
    const recent = historicalData.slice(-5);
    const trend = (recent[recent.length - 1].price - recent[0].price) / recent.length;
    
    const prediction = [];
    for (let i = 1; i <= 7; i++) {
      const lastPrice = i === 1 ? currentValue : prediction[i - 2].price;
      const volatility = Math.random() * 2 - 1;
      prediction.push({
        date: `+${i}d`,
        price: lastPrice + trend + volatility,
        isPrediction: true,
        confidence: Math.max(50, 90 - i * 5)
      });
    }
    
    return prediction;
  };

  const prediction = generatePrediction();
  const combinedData = [
    ...historicalData.map(d => ({ ...d, isPrediction: false })),
    ...prediction
  ];

  // Detect anomalies (sharp changes)
  const anomalies = [];
  for (let i = 1; i < historicalData.length; i++) {
    const change = Math.abs(historicalData[i].price - historicalData[i - 1].price);
    const avgChange = historicalData.slice(Math.max(0, i - 5), i)
      .reduce((sum, d, idx, arr) => {
        if (idx === 0) return 0;
        return sum + Math.abs(arr[idx].price - arr[idx - 1].price);
      }, 0) / 5;
    
    if (change > avgChange * 2) {
      anomalies.push(historicalData[i]);
    }
  }

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <Card className="bg-slate-950/95 backdrop-blur-xl cyber-border p-3">
          <div className="text-xs font-mono space-y-1">
            <div className="text-cyan-400 font-bold">{label}</div>
            <div className="flex justify-between gap-3">
              <span className="text-slate-400">Price:</span>
              <span className="text-yellow-400 font-bold">${data.price?.toFixed(2)}</span>
            </div>
            {data.isPrediction && (
              <>
                <Badge className="bg-purple-500/20 text-purple-400 border-purple-500/30 font-mono text-xs">
                  Prediction ({data.confidence}% confidence)
                </Badge>
                <div className="text-xs text-slate-500 mt-1">
                  Based on recent trends + volatility
                </div>
              </>
            )}
          </div>
        </Card>
      );
    }
    return null;
  };

  const lastHistorical = historicalData[historicalData.length - 1];
  const lastPrediction = prediction[prediction.length - 1];
  const predictedChange = lastPrediction ? ((lastPrediction.price - currentValue) / currentValue * 100) : 0;

  return (
    <Card className="bg-slate-950/80 backdrop-blur-xl cyber-border p-6">
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="text-xl font-bold text-yellow-400 glow-text font-mono mb-1">
            {indicator.toUpperCase()} - PREDICTIVE ANALYSIS
          </h3>
          <p className="text-slate-400 font-mono text-xs">
            Historical + 7-day AI prediction
          </p>
        </div>
        <div className="text-right">
          <div className="text-2xl font-bold text-yellow-400 font-mono">${currentValue?.toFixed(2)}</div>
          <div className="flex items-center gap-2 text-xs font-mono">
            {predictedChange > 0 ? (
              <TrendingUp className="w-3 h-3 text-green-400" />
            ) : (
              <TrendingDown className="w-3 h-3 text-red-400" />
            )}
            <span className={predictedChange > 0 ? 'text-green-400' : 'text-red-400'}>
              {predictedChange > 0 ? '+' : ''}{predictedChange.toFixed(1)}% (7d forecast)
            </span>
          </div>
        </div>
      </div>

      <div className="h-[300px]">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={combinedData}>
            <defs>
              <linearGradient id="predictionGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#a855f7" stopOpacity={0.3}/>
                <stop offset="95%" stopColor="#a855f7" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
            <XAxis 
              dataKey="date" 
              stroke="#94a3b8"
              style={{ fontFamily: 'monospace', fontSize: '10px' }}
            />
            <YAxis 
              stroke="#94a3b8"
              style={{ fontFamily: 'monospace', fontSize: '11px' }}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend wrapperStyle={{ fontFamily: 'monospace', fontSize: '11px' }} />
            
            {/* Historical data as solid line */}
            <Line 
              type="monotone" 
              dataKey="price" 
              stroke="#eab308" 
              strokeWidth={2}
              dot={false}
              name="Historical"
              data={historicalData}
            />
            
            {/* Prediction as dashed line with area */}
            <Area
              type="monotone"
              dataKey="price"
              stroke="none"
              fill="url(#predictionGradient)"
              data={prediction}
            />
            <Line 
              type="monotone" 
              dataKey="price" 
              stroke="#a855f7" 
              strokeWidth={2}
              strokeDasharray="5 5"
              dot={false}
              name="Prediction"
              data={prediction}
            />
            
            {/* Anomaly markers */}
            {anomalies.map((anomaly, idx) => (
              <ReferenceDot
                key={idx}
                x={anomaly.date}
                y={anomaly.price}
                r={6}
                fill="#ef4444"
                stroke="#ffffff"
                strokeWidth={2}
              />
            ))}
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      {/* Anomalies */}
      {anomalies.length > 0 && (
        <div className="mt-4 p-3 bg-red-950/20 cyber-border rounded">
          <h4 className="text-sm font-bold text-red-400 font-mono mb-2 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4" />
            DETECTED ANOMALIES
          </h4>
          <div className="flex flex-wrap gap-2">
            {anomalies.slice(0, 3).map((anomaly, idx) => (
              <Badge key={idx} variant="outline" className="border-red-500/30 text-red-400 font-mono text-xs">
                {anomaly.date}: ${anomaly.price?.toFixed(2)}
              </Badge>
            ))}
          </div>
        </div>
      )}

      {/* News Impact */}
      {newsEvents && newsEvents.length > 0 && (
        <div className="mt-3 p-3 bg-cyan-950/20 cyber-border rounded">
          <h4 className="text-sm font-bold text-cyan-400 font-mono mb-2">RECENT NEWS IMPACT</h4>
          <ul className="space-y-1">
            {newsEvents.slice(0, 2).map((event, idx) => (
              <li key={idx} className="text-slate-300 font-mono text-xs flex items-start gap-2">
                <span className="text-cyan-400">▸</span>
                {event.headline}
              </li>
            ))}
          </ul>
        </div>
      )}
    </Card>
  );
}