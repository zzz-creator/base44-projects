import React, { useState, useEffect } from 'react';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { useMutation, useQuery } from '@tanstack/react-query';
import { base44 } from '../../api/base44Client';
import { AlertTriangle, Loader2, Bell, TrendingUp, Globe } from 'lucide-react';
import { MapContainer, TileLayer, Circle, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';

export default function KeyEventPredictor() {
  const [predictions, setPredictions] = useState(null);

  // Fetch historical data for context
  const { data: wars } = useQuery({
    queryKey: ['wars-for-prediction'],
    queryFn: () => base44.entities.War.filter({ era: 'current', status: 'ongoing' }),
    initialData: [],
  });

  const generatePredictionsMutation = useMutation({
    mutationFn: async () => {
      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `You are an advanced geopolitical early warning AI system. Analyze current global trends, historical conflict patterns, and real-time data to identify potential future flashpoints and key geopolitical events.

CURRENT CONFLICTS CONTEXT:
${wars.map(w => `- ${w.name}: ${w.description}`).join('\n')}

Using this context plus real-time internet data, identify:

1. IMMEDIATE FLASHPOINTS (next 7-30 days)
   - Specific locations at high risk
   - Trigger events that could spark conflict
   - Early warning signals currently present
   - Probability assessment

2. KEY EVENTS TO MONITOR (next 1-6 months)
   - Elections and leadership changes
   - Economic summits and trade negotiations
   - Military exercises and deployments
   - Resource disputes and environmental events
   - Diplomatic meetings and treaty negotiations

3. GEOPOLITICAL RISK FACTORS
   - Emerging tensions between nations
   - Alliance shifts and deteriorating relationships
   - Economic vulnerabilities
   - Social unrest indicators
   - Cyber warfare threats

4. PREDICTIVE INDICATORS
   - Economic indicators showing stress
   - Social media sentiment patterns
   - Military movements and buildups
   - Diplomatic communications breakdown
   - Resource scarcity signals

Provide specific, actionable intelligence with confidence levels and recommended monitoring priorities.`,
        response_json_schema: {
          type: "object",
          properties: {
            summary: { type: "string" },
            global_threat_level: { type: "string" },
            overall_confidence: { type: "number" },
            immediate_flashpoints: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  location: { type: "string" },
                  region: { type: "string" },
                  lat: { type: "number" },
                  lng: { type: "number" },
                  threat_level: { type: "string" },
                  probability: { type: "number" },
                  timeframe: { type: "string" },
                  trigger_events: { type: "array", items: { type: "string" } },
                  early_warning_signals: { type: "array", items: { type: "string" } },
                  involved_parties: { type: "array", items: { type: "string" } },
                  potential_impact: { type: "string" }
                }
              }
            },
            key_events: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  event: { type: "string" },
                  date: { type: "string" },
                  location: { type: "string" },
                  significance: { type: "string" },
                  risk_level: { type: "string" },
                  why_important: { type: "string" }
                }
              }
            },
            risk_factors: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  factor: { type: "string" },
                  severity: { type: "string" },
                  affected_regions: { type: "array", items: { type: "string" } },
                  trend: { type: "string" },
                  description: { type: "string" }
                }
              }
            },
            predictive_indicators: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  indicator: { type: "string" },
                  current_status: { type: "string" },
                  threshold: { type: "string" },
                  alert_level: { type: "string" }
                }
              }
            },
            monitoring_priorities: { type: "array", items: { type: "string" } },
            recommended_actions: { type: "array", items: { type: "string" } }
          }
        },
        add_context_from_internet: true
      });

      setPredictions(result);
      return result;
    }
  });

  const getThreatColor = (level) => {
    const colors = {
      'CRITICAL': '#ef4444',
      'HIGH': '#f97316',
      'ELEVATED': '#eab308',
      'MODERATE': '#22c55e',
      'critical': '#ef4444',
      'high': '#f97316',
      'elevated': '#eab308',
      'moderate': '#22c55e'
    };
    return colors[level] || '#06b6d4';
  };

  const getSeverityBadge = (severity) => {
    const classes = {
      'CRITICAL': 'bg-red-500/20 text-red-400 border-red-500/30',
      'HIGH': 'bg-orange-500/20 text-orange-400 border-orange-500/30',
      'ELEVATED': 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
      'MODERATE': 'bg-green-500/20 text-green-400 border-green-500/30',
      'critical': 'bg-red-500/20 text-red-400 border-red-500/30',
      'high': 'bg-orange-500/20 text-orange-400 border-orange-500/30',
      'elevated': 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
      'moderate': 'bg-green-500/20 text-green-400 border-green-500/30'
    };
    return classes[severity] || 'bg-blue-500/20 text-blue-400 border-blue-500/30';
  };

  return (
    <Card className="bg-slate-950/80 backdrop-blur-xl cyber-border p-6">
      <div className="flex items-center gap-3 mb-6">
        <Bell className="w-6 h-6 text-red-400 animate-pulse" />
        <h3 className="text-xl font-bold text-red-400 glow-text font-mono">
          KEY EVENT PREDICTOR - EARLY WARNING SYSTEM
        </h3>
      </div>

      <Button
        onClick={() => generatePredictionsMutation.mutate()}
        disabled={generatePredictionsMutation.isPending}
        className="w-full bg-gradient-to-r from-red-500 to-orange-500 hover:from-red-600 hover:to-orange-600 text-white font-mono py-6 mb-6"
      >
        {generatePredictionsMutation.isPending ? (
          <>
            <Loader2 className="w-5 h-5 mr-2 animate-spin" />
            ANALYZING GLOBAL TRENDS...
          </>
        ) : (
          <>
            <AlertTriangle className="w-5 h-5 mr-2" />
            GENERATE PREDICTIONS
          </>
        )}
      </Button>

      {predictions && (
        <div className="space-y-6 animate-in fade-in duration-500">
          <Card className="bg-gradient-to-br from-red-950/50 to-orange-950/50 cyber-border p-4">
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-lg font-bold text-red-400 font-mono">GLOBAL THREAT ASSESSMENT</h4>
              <Badge className={getSeverityBadge(predictions.global_threat_level)}>
                {predictions.global_threat_level} THREAT
              </Badge>
            </div>
            <p className="text-slate-300 font-mono text-sm mb-2">{predictions.summary}</p>
            <div className="text-sm font-mono">
              <span className="text-slate-400">Confidence: </span>
              <span className="text-green-400 font-bold">{predictions.overall_confidence}%</span>
            </div>
          </Card>

          {/* Flashpoint Map */}
          {predictions.immediate_flashpoints && predictions.immediate_flashpoints.length > 0 && (
            <Card className="bg-slate-900/50 cyber-border overflow-hidden">
              <div className="p-4 border-b border-red-500/30">
                <h4 className="text-md font-bold text-red-400 font-mono">IMMEDIATE FLASHPOINT MAP</h4>
              </div>
              <div className="h-[400px]">
                <MapContainer
                  center={[30, 20]}
                  zoom={2}
                  style={{ height: '100%', width: '100%', background: '#0a0e27' }}
                >
                  <TileLayer
                    url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
                    attribution='&copy; OpenStreetMap'
                  />
                  {predictions.immediate_flashpoints.map((flashpoint, idx) => (
                    <Circle
                      key={idx}
                      center={[flashpoint.lat, flashpoint.lng]}
                      radius={100000}
                      pathOptions={{
                        fillColor: getThreatColor(flashpoint.threat_level),
                        fillOpacity: 0.4,
                        color: getThreatColor(flashpoint.threat_level),
                        weight: 2
                      }}
                    >
                      <Popup>
                        <Card className="bg-slate-900/95 border-red-500/30 p-3 max-w-[300px]">
                          <h5 className="font-bold text-red-400 font-mono text-sm mb-2">{flashpoint.location}</h5>
                          <Badge className={`${getSeverityBadge(flashpoint.threat_level)} mb-2`}>
                            {flashpoint.threat_level} - {flashpoint.probability}%
                          </Badge>
                          <p className="text-xs text-slate-300 font-mono mb-2">{flashpoint.potential_impact}</p>
                          <div className="text-xs text-slate-400 font-mono">
                            <strong>Timeframe:</strong> {flashpoint.timeframe}
                          </div>
                        </Card>
                      </Popup>
                    </Circle>
                  ))}
                </MapContainer>
              </div>
            </Card>
          )}

          {/* Immediate Flashpoints */}
          <Card className="bg-slate-900/50 cyber-border p-4">
            <h4 className="text-md font-bold text-red-400 font-mono mb-4">IMMEDIATE FLASHPOINTS</h4>
            <div className="space-y-3">
              {predictions.immediate_flashpoints?.map((flashpoint, idx) => (
                <div key={idx} className="bg-slate-950/50 cyber-border rounded p-3">
                  <div className="flex items-start justify-between mb-2">
                    <h5 className="text-sm font-bold text-yellow-400 font-mono">{flashpoint.location}</h5>
                    <Badge className={getSeverityBadge(flashpoint.threat_level)}>
                      {flashpoint.probability}%
                    </Badge>
                  </div>
                  <p className="text-xs text-slate-400 font-mono mb-2">{flashpoint.potential_impact}</p>
                  <div className="grid grid-cols-2 gap-2 text-xs font-mono mb-2">
                    <div>
                      <span className="text-slate-500">Region: </span>
                      <span className="text-cyan-400">{flashpoint.region}</span>
                    </div>
                    <div>
                      <span className="text-slate-500">Timeframe: </span>
                      <span className="text-purple-400">{flashpoint.timeframe}</span>
                    </div>
                  </div>
                  {flashpoint.trigger_events && flashpoint.trigger_events.length > 0 && (
                    <div className="mb-2">
                      <div className="text-xs text-slate-500 font-mono mb-1">Trigger Events:</div>
                      <ul className="space-y-1">
                        {flashpoint.trigger_events.map((event, i) => (
                          <li key={i} className="text-xs text-slate-300 font-mono ml-2">• {event}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {flashpoint.early_warning_signals && flashpoint.early_warning_signals.length > 0 && (
                    <div>
                      <div className="text-xs text-slate-500 font-mono mb-1">Early Warning Signals:</div>
                      <ul className="space-y-1">
                        {flashpoint.early_warning_signals.map((signal, i) => (
                          <li key={i} className="text-xs text-yellow-300 font-mono ml-2">⚠ {signal}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </Card>

          {/* Key Events to Monitor */}
          <Card className="bg-slate-900/50 cyber-border p-4">
            <h4 className="text-md font-bold text-orange-400 font-mono mb-4">KEY EVENTS TO MONITOR</h4>
            <div className="space-y-2">
              {predictions.key_events?.map((event, idx) => (
                <div key={idx} className="bg-slate-950/50 cyber-border rounded p-3">
                  <div className="flex items-start justify-between mb-1">
                    <h5 className="text-sm font-bold text-cyan-400 font-mono">{event.event}</h5>
                    <Badge className={getSeverityBadge(event.risk_level)}>
                      {event.risk_level}
                    </Badge>
                  </div>
                  <div className="text-xs text-slate-400 font-mono mb-1">
                    <span className="text-slate-500">Date: </span>{event.date} • <span className="text-slate-500">Location: </span>{event.location}
                  </div>
                  <p className="text-xs text-slate-300 font-mono">{event.why_important}</p>
                </div>
              ))}
            </div>
          </Card>

          {/* Risk Factors */}
          <Card className="bg-slate-900/50 cyber-border p-4">
            <h4 className="text-md font-bold text-yellow-400 font-mono mb-4">GEOPOLITICAL RISK FACTORS</h4>
            <div className="space-y-2">
              {predictions.risk_factors?.map((risk, idx) => (
                <div key={idx} className="bg-slate-950/50 cyber-border rounded p-3">
                  <div className="flex items-start justify-between mb-1">
                    <h5 className="text-sm font-bold text-yellow-400 font-mono">{risk.factor}</h5>
                    <Badge className={getSeverityBadge(risk.severity)}>
                      {risk.severity}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2 mb-2">
                    <TrendingUp className="w-3 h-3 text-orange-400" />
                    <span className="text-xs text-orange-400 font-mono font-bold">Trend: {risk.trend}</span>
                  </div>
                  <p className="text-xs text-slate-300 font-mono mb-1">{risk.description}</p>
                  {risk.affected_regions && risk.affected_regions.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {risk.affected_regions.map((region, i) => (
                        <Badge key={i} variant="outline" className="border-cyan-500/30 text-cyan-400 text-xs font-mono">
                          {region}
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </Card>

          {/* Predictive Indicators */}
          <Card className="bg-slate-900/50 cyber-border p-4">
            <h4 className="text-md font-bold text-purple-400 font-mono mb-4">PREDICTIVE INDICATORS</h4>
            <div className="space-y-2">
              {predictions.predictive_indicators?.map((indicator, idx) => (
                <div key={idx} className="flex items-center justify-between bg-slate-950/50 cyber-border rounded p-2">
                  <div className="flex-1">
                    <div className="text-sm font-bold text-cyan-400 font-mono">{indicator.indicator}</div>
                    <div className="text-xs text-slate-400 font-mono">
                      Status: <span className="text-purple-400">{indicator.current_status}</span> • Threshold: {indicator.threshold}
                    </div>
                  </div>
                  <Badge className={getSeverityBadge(indicator.alert_level)}>
                    {indicator.alert_level}
                  </Badge>
                </div>
              ))}
            </div>
          </Card>

          {/* Monitoring Priorities */}
          <Card className="bg-slate-900/50 cyber-border p-4">
            <h4 className="text-md font-bold text-cyan-400 font-mono mb-3">MONITORING PRIORITIES</h4>
            <ul className="space-y-1">
              {predictions.monitoring_priorities?.map((priority, idx) => (
                <li key={idx} className="text-slate-300 font-mono text-sm flex items-start gap-2">
                  <Globe className="w-4 h-4 text-cyan-400 mt-0.5" />
                  {priority}
                </li>
              ))}
            </ul>
          </Card>

          {/* Recommended Actions */}
          <Card className="bg-gradient-to-br from-green-950/50 to-cyan-950/50 cyber-border p-4">
            <h4 className="text-md font-bold text-green-400 font-mono mb-3">RECOMMENDED ACTIONS</h4>
            <ul className="space-y-2">
              {predictions.recommended_actions?.map((action, idx) => (
                <li key={idx} className="text-slate-300 font-mono text-sm flex items-start gap-2">
                  <span className="text-green-400 font-bold">{idx + 1}.</span>
                  {action}
                </li>
              ))}
            </ul>
          </Card>
        </div>
      )}
    </Card>
  );
}