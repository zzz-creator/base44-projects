import React, { useState } from 'react';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Label } from '../ui/label';
import { Badge } from '../ui/badge';
import { useMutation } from '@tanstack/react-query';
import { base44 } from '../../api/base44Client';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Area, AreaChart } from 'recharts';
import { TrendingUp, Loader2, BarChart3 } from 'lucide-react';

export default function TrendForecastingModule() {
  const [dataType, setDataType] = useState('economic_indicators');
  const [horizon, setHorizon] = useState('6_months');
  const [forecast, setForecast] = useState(null);

  const generateForecastMutation = useMutation({
    mutationFn: async () => {
      const horizonMonths = horizon === '6_months' ? 6 : 12;
      
      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `You are an advanced AI forecasting system. Generate detailed trend forecasts for ${dataType} over the next ${horizonMonths} months.

DATA TYPE: ${dataType}
FORECAST HORIZON: ${horizonMonths} months

Analyze current global trends, economic indicators, social media sentiment patterns, and geopolitical developments to create accurate forecasts.

For ECONOMIC INDICATORS, include:
- GDP growth rates
- Defense spending trends
- Energy prices
- Trade volumes
- Commodity prices
- Currency stability

For SOCIAL MEDIA SENTIMENT, include:
- Regional sentiment scores
- Key trending topics
- Sentiment volatility
- Early warning signals
- Public opinion shifts

Provide:
1. Monthly forecasts with confidence intervals
2. Key drivers and assumptions
3. Risk factors that could alter predictions
4. Early warning indicators to monitor
5. Scenario analysis (best case, base case, worst case)

Use real-world data and analysis patterns.`,
        response_json_schema: {
          type: "object",
          properties: {
            forecast_summary: { type: "string" },
            data_type: { type: "string" },
            horizon_months: { type: "number" },
            overall_trend: { type: "string" },
            confidence_level: { type: "number" },
            monthly_forecasts: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  month: { type: "string" },
                  forecast_value: { type: "number" },
                  confidence_upper: { type: "number" },
                  confidence_lower: { type: "number" },
                  key_factors: { type: "array", items: { type: "string" } }
                }
              }
            },
            key_drivers: { type: "array", items: { type: "string" } },
            risk_factors: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  risk: { type: "string" },
                  probability: { type: "number" },
                  impact: { type: "string" }
                }
              }
            },
            early_warning_indicators: { type: "array", items: { type: "string" } },
            scenarios: {
              type: "object",
              properties: {
                best_case: { type: "string" },
                base_case: { type: "string" },
                worst_case: { type: "string" }
              }
            },
            recommendations: { type: "array", items: { type: "string" } }
          }
        },
        add_context_from_internet: true
      });

      setForecast(result);
      return result;
    }
  });

  const getConfidenceColor = (confidence) => {
    if (confidence >= 80) return 'text-green-400';
    if (confidence >= 60) return 'text-yellow-400';
    return 'text-orange-400';
  };

  return (
    <Card className="bg-slate-950/80 backdrop-blur-xl cyber-border p-6">
      <div className="flex items-center gap-3 mb-6">
        <TrendingUp className="w-6 h-6 text-purple-400" />
        <h3 className="text-xl font-bold text-purple-400 glow-text font-mono">
          AI TREND FORECASTING
        </h3>
      </div>

      <div className="grid md:grid-cols-2 gap-4 mb-6">
        <div className="space-y-2">
          <Label className="text-cyan-400 font-mono text-xs">Data Type</Label>
          <Select value={dataType} onValueChange={setDataType}>
            <SelectTrigger className="bg-slate-900/50 border-green-500/30 text-green-400 font-mono">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-slate-900 border-green-500/30">
              <SelectItem value="economic_indicators" className="text-green-400 font-mono">
                Economic Indicators
              </SelectItem>
              <SelectItem value="social_media_sentiment" className="text-green-400 font-mono">
                Social Media Sentiment
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label className="text-cyan-400 font-mono text-xs">Forecast Horizon</Label>
          <Select value={horizon} onValueChange={setHorizon}>
            <SelectTrigger className="bg-slate-900/50 border-green-500/30 text-green-400 font-mono">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-slate-900 border-green-500/30">
              <SelectItem value="6_months" className="text-green-400 font-mono">
                6 Months
              </SelectItem>
              <SelectItem value="12_months" className="text-green-400 font-mono">
                12 Months (1 Year)
              </SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <Button
        onClick={() => generateForecastMutation.mutate()}
        disabled={generateForecastMutation.isPending}
        className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-mono py-6 mb-6"
      >
        {generateForecastMutation.isPending ? (
          <>
            <Loader2 className="w-5 h-5 mr-2 animate-spin" />
            GENERATING FORECAST...
          </>
        ) : (
          <>
            <BarChart3 className="w-5 h-5 mr-2" />
            GENERATE FORECAST
          </>
        )}
      </Button>

      {forecast && (
        <div className="space-y-6 animate-in fade-in duration-500">
          <Card className="bg-gradient-to-br from-purple-950/50 to-pink-950/50 cyber-border p-4">
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-lg font-bold text-purple-400 font-mono">FORECAST SUMMARY</h4>
              <Badge className={`${getConfidenceColor(forecast.confidence_level)} bg-opacity-20 font-mono`}>
                {forecast.confidence_level}% Confidence
              </Badge>
            </div>
            <p className="text-slate-300 font-mono text-sm mb-2">{forecast.forecast_summary}</p>
            <div className="text-sm font-mono">
              <span className="text-slate-400">Overall Trend: </span>
              <span className="text-cyan-400 font-bold">{forecast.overall_trend}</span>
            </div>
          </Card>

          {/* Forecast Chart */}
          <Card className="bg-slate-900/50 cyber-border p-4">
            <h4 className="text-md font-bold text-cyan-400 font-mono mb-4">FORECAST PROJECTION</h4>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={forecast.monthly_forecasts}>
                  <defs>
                    <linearGradient id="confidenceGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#06b6d4" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                  <XAxis 
                    dataKey="month" 
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
                      border: '1px solid #06b6d4', 
                      fontFamily: 'monospace',
                      fontSize: '11px'
                    }}
                  />
                  <Legend wrapperStyle={{ fontFamily: 'monospace', fontSize: '11px' }} />
                  
                  <Area 
                    type="monotone" 
                    dataKey="confidence_upper" 
                    stroke="none"
                    fill="url(#confidenceGradient)"
                    fillOpacity={0.3}
                    name="Upper Bound"
                  />
                  <Area 
                    type="monotone" 
                    dataKey="confidence_lower" 
                    stroke="none"
                    fill="url(#confidenceGradient)"
                    fillOpacity={0.3}
                    name="Lower Bound"
                  />
                  <Line 
                    type="monotone" 
                    dataKey="forecast_value" 
                    stroke="#a855f7" 
                    strokeWidth={3}
                    dot={{ fill: '#a855f7', r: 4 }}
                    name="Forecast"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </Card>

          {/* Key Drivers */}
          <Card className="bg-slate-900/50 cyber-border p-4">
            <h4 className="text-md font-bold text-green-400 font-mono mb-3">KEY DRIVERS</h4>
            <ul className="space-y-1">
              {forecast.key_drivers?.map((driver, idx) => (
                <li key={idx} className="text-slate-300 font-mono text-sm flex items-start gap-2">
                  <span className="text-green-400">▸</span>
                  {driver}
                </li>
              ))}
            </ul>
          </Card>

          {/* Risk Factors */}
          <Card className="bg-slate-900/50 cyber-border p-4">
            <h4 className="text-md font-bold text-red-400 font-mono mb-3">RISK FACTORS</h4>
            <div className="space-y-2">
              {forecast.risk_factors?.map((risk, idx) => (
                <div key={idx} className="bg-slate-950/50 cyber-border rounded p-2">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-bold text-yellow-400 font-mono">{risk.risk}</span>
                    <Badge className="bg-orange-500/20 text-orange-400 border-orange-500/30 text-xs font-mono">
                      {risk.probability}% Probability
                    </Badge>
                  </div>
                  <p className="text-xs text-slate-400 font-mono">{risk.impact}</p>
                </div>
              ))}
            </div>
          </Card>

          {/* Scenarios */}
          <Card className="bg-slate-900/50 cyber-border p-4">
            <h4 className="text-md font-bold text-cyan-400 font-mono mb-3">SCENARIO ANALYSIS</h4>
            <div className="space-y-3">
              <div className="p-2 bg-green-950/20 cyber-border rounded">
                <div className="text-xs font-bold text-green-400 font-mono mb-1">BEST CASE</div>
                <p className="text-xs text-slate-300 font-mono">{forecast.scenarios?.best_case}</p>
              </div>
              <div className="p-2 bg-blue-950/20 cyber-border rounded">
                <div className="text-xs font-bold text-blue-400 font-mono mb-1">BASE CASE</div>
                <p className="text-xs text-slate-300 font-mono">{forecast.scenarios?.base_case}</p>
              </div>
              <div className="p-2 bg-red-950/20 cyber-border rounded">
                <div className="text-xs font-bold text-red-400 font-mono mb-1">WORST CASE</div>
                <p className="text-xs text-slate-300 font-mono">{forecast.scenarios?.worst_case}</p>
              </div>
            </div>
          </Card>

          {/* Early Warning Indicators */}
          <Card className="bg-slate-900/50 cyber-border p-4">
            <h4 className="text-md font-bold text-yellow-400 font-mono mb-3">EARLY WARNING INDICATORS</h4>
            <ul className="space-y-1">
              {forecast.early_warning_indicators?.map((indicator, idx) => (
                <li key={idx} className="text-slate-300 font-mono text-sm flex items-start gap-2">
                  <span className="text-yellow-400">⚠</span>
                  {indicator}
                </li>
              ))}
            </ul>
          </Card>

          {/* Recommendations */}
          <Card className="bg-gradient-to-br from-green-950/50 to-cyan-950/50 cyber-border p-4">
            <h4 className="text-md font-bold text-green-400 font-mono mb-3">RECOMMENDATIONS</h4>
            <ul className="space-y-2">
              {forecast.recommendations?.map((rec, idx) => (
                <li key={idx} className="text-slate-300 font-mono text-sm flex items-start gap-2">
                  <span className="text-green-400 font-bold">{idx + 1}.</span>
                  {rec}
                </li>
              ))}
            </ul>
          </Card>
        </div>
      )}
    </Card>
  );
}