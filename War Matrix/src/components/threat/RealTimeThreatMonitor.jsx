import React, { useState, useEffect } from 'react';
import { base44 } from '../../api/base44Client';
import { useMutation } from '@tanstack/react-query';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { 
  RefreshCw, 
  Satellite, 
  Radio, 
  AlertTriangle,
  TrendingUp,
  MapPin,
  Activity,
  Zap,
  Shield
} from 'lucide-react';

export default function RealTimeThreatMonitor({ onDataUpdate }) {
  const [threatData, setThreatData] = useState(null);
  const [lastUpdate, setLastUpdate] = useState(null);

  const fetchThreatIntelMutation = useMutation({
    mutationFn: async () => {
      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `You are a real-time geopolitical threat intelligence analyst. Provide current global threat assessment based on latest news and intelligence.

Generate comprehensive threat intelligence including:

1. HIGH-THREAT ZONES (5-8 locations)
   - Exact coordinates (latitude, longitude)
   - Current threat level (CRITICAL, HIGH, MEDIUM, LOW)
   - Risk score (0-100)
   - Active situation description
   - Contributing factors
   - Estimated radius of impact (in meters)
   - Active military units if applicable

2. SATELLITE ANOMALIES (3-5 detections)
   - Location with coordinates
   - Anomaly type (troop buildup, missile deployment, naval movement, etc.)
   - Detection timestamp
   - Severity level
   - Analysis

3. EMERGING FLASHPOINTS (3-5 locations)
   - Region name and coordinates
   - Escalation probability (0-100)
   - Time window for potential escalation
   - Key triggers
   - Involved parties

4. REAL-TIME ALERTS (5-10 items)
   - Alert type (military, diplomatic, economic, cyber)
   - Priority (URGENT, HIGH, MEDIUM)
   - Brief description
   - Location
   - Timestamp (recent)

5. THREAT TRENDS
   - Overall global threat level (0-100)
   - Regional threat changes (improving/worsening)
   - Key developments in last 24 hours

Use CURRENT real-world data and intelligence. Be specific with coordinates and details.`,
        response_json_schema: {
          type: "object",
          properties: {
            timestamp: { type: "string" },
            global_threat_level: { type: "number" },
            threat_assessment: { type: "string" },
            high_threat_zones: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  name: { type: "string" },
                  coordinates: {
                    type: "object",
                    properties: {
                      latitude: { type: "number" },
                      longitude: { type: "number" }
                    }
                  },
                  threat_level: { type: "string" },
                  risk_score: { type: "number" },
                  description: { type: "string" },
                  factors: { type: "array", items: { type: "string" } },
                  radius: { type: "number" },
                  active_units: { type: "number" }
                }
              }
            },
            satellite_anomalies: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  location: { type: "string" },
                  coordinates: {
                    type: "object",
                    properties: {
                      latitude: { type: "number" },
                      longitude: { type: "number" }
                    }
                  },
                  anomaly_type: { type: "string" },
                  timestamp: { type: "string" },
                  severity: { type: "string" },
                  analysis: { type: "string" }
                }
              }
            },
            emerging_flashpoints: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  region_name: { type: "string" },
                  location: { type: "string" },
                  coordinates: {
                    type: "object",
                    properties: {
                      latitude: { type: "number" },
                      longitude: { type: "number" }
                    }
                  },
                  escalation_probability: { type: "number" },
                  time_window: { type: "string" },
                  triggers: { type: "array", items: { type: "string" } },
                  involved_parties: { type: "array", items: { type: "string" } }
                }
              }
            },
            realtime_alerts: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  alert_type: { type: "string" },
                  priority: { type: "string" },
                  description: { type: "string" },
                  location: { type: "string" },
                  timestamp: { type: "string" }
                }
              }
            },
            threat_trends: {
              type: "object",
              properties: {
                regional_changes: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      region: { type: "string" },
                      trend: { type: "string" },
                      change_description: { type: "string" }
                    }
                  }
                },
                key_developments: { type: "array", items: { type: "string" } }
              }
            }
          }
        },
        add_context_from_internet: true
      });

      setThreatData(result);
      setLastUpdate(new Date().toISOString());
      
      // Notify parent component with new data
      if (onDataUpdate) {
        onDataUpdate(result);
      }

      return result;
    }
  });

  // Auto-fetch on mount and every 15 minutes
  useEffect(() => {
    fetchThreatIntelMutation.mutate();
    
    const interval = setInterval(() => {
      fetchThreatIntelMutation.mutate();
    }, 15 * 60 * 1000);

    return () => clearInterval(interval);
  }, []);

  const getThreatColor = (level) => {
    const colors = {
      'CRITICAL': 'text-red-400 bg-red-950/30 border-red-500/30',
      'HIGH': 'text-orange-400 bg-orange-950/30 border-orange-500/30',
      'MEDIUM': 'text-yellow-400 bg-yellow-950/30 border-yellow-500/30',
      'LOW': 'text-green-400 bg-green-950/30 border-green-500/30'
    };
    return colors[level] || 'text-slate-400 bg-slate-950/30 border-slate-500/30';
  };

  const getPriorityColor = (priority) => {
    const colors = {
      'URGENT': 'bg-red-500/20 text-red-400 border-red-500/30',
      'HIGH': 'bg-orange-500/20 text-orange-400 border-orange-500/30',
      'MEDIUM': 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30'
    };
    return colors[priority] || 'bg-slate-500/20 text-slate-400 border-slate-500/30';
  };

  return (
    <div className="space-y-6">
      {/* Header with Sync */}
      <Card className="bg-slate-950/80 backdrop-blur-xl cyber-border p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <Radio className="w-6 h-6 text-green-400 animate-pulse" />
            <div>
              <h2 className="text-2xl font-bold text-green-400 glow-text font-mono">
                REAL-TIME THREAT INTELLIGENCE
              </h2>
              <p className="text-cyan-400/70 font-mono text-xs mt-1">
                Live feeds from open-source intelligence • Satellite anomaly detection • Auto-refresh every 15min
              </p>
            </div>
          </div>
          <Button
            onClick={() => fetchThreatIntelMutation.mutate()}
            disabled={fetchThreatIntelMutation.isPending}
            className="bg-green-500/20 hover:bg-green-500/30 text-green-400 border border-green-500/30 font-mono"
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${fetchThreatIntelMutation.isPending ? 'animate-spin' : ''}`} />
            SYNC INTEL
          </Button>
        </div>

        {threatData && (
          <div className="grid md:grid-cols-3 gap-4">
            <div className="p-4 bg-red-950/20 cyber-border rounded-lg">
              <div className="text-xs text-slate-400 font-mono mb-1">Global Threat Level</div>
              <div className="text-3xl font-bold text-red-400 font-mono">
                {threatData.global_threat_level}/100
              </div>
            </div>
            <div className="p-4 bg-orange-950/20 cyber-border rounded-lg">
              <div className="text-xs text-slate-400 font-mono mb-1">Active Zones</div>
              <div className="text-3xl font-bold text-orange-400 font-mono">
                {threatData.high_threat_zones?.length || 0}
              </div>
            </div>
            <div className="p-4 bg-cyan-950/20 cyber-border rounded-lg">
              <div className="text-xs text-slate-400 font-mono mb-1">Last Update</div>
              <div className="text-sm font-bold text-cyan-400 font-mono">
                {lastUpdate ? new Date(lastUpdate).toLocaleTimeString() : 'N/A'}
              </div>
            </div>
          </div>
        )}
      </Card>

      {fetchThreatIntelMutation.isPending && !threatData ? (
        <Card className="bg-slate-950/80 backdrop-blur-xl cyber-border p-12">
          <div className="flex flex-col items-center justify-center space-y-4">
            <Activity className="w-16 h-16 text-green-400 animate-pulse" />
            <div className="text-green-400 font-mono text-lg">SYNCING INTELLIGENCE FEEDS...</div>
            <p className="text-slate-400 font-mono text-sm">
              Accessing open-source intelligence • Satellite data • News feeds
            </p>
          </div>
        </Card>
      ) : threatData ? (
        <Tabs defaultValue="zones" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4 bg-slate-950/80 border border-green-500/30">
            <TabsTrigger value="zones" className="data-[state=active]:bg-red-500/20 data-[state=active]:text-red-400 font-mono">
              <MapPin className="w-4 h-4 mr-2" />
              THREAT ZONES
            </TabsTrigger>
            <TabsTrigger value="satellites" className="data-[state=active]:bg-orange-500/20 data-[state=active]:text-orange-400 font-mono">
              <Satellite className="w-4 h-4 mr-2" />
              SATELLITES
            </TabsTrigger>
            <TabsTrigger value="flashpoints" className="data-[state=active]:bg-yellow-500/20 data-[state=active]:text-yellow-400 font-mono">
              <Zap className="w-4 h-4 mr-2" />
              FLASHPOINTS
            </TabsTrigger>
            <TabsTrigger value="alerts" className="data-[state=active]:bg-cyan-500/20 data-[state=active]:text-cyan-400 font-mono">
              <AlertTriangle className="w-4 h-4 mr-2" />
              ALERTS
            </TabsTrigger>
          </TabsList>

          {/* Threat Zones */}
          <TabsContent value="zones">
            <div className="grid md:grid-cols-2 gap-4">
              {threatData.high_threat_zones?.map((zone, idx) => (
                <Card key={idx} className={`p-4 ${getThreatColor(zone.threat_level)} cyber-border`}>
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="w-5 h-5" />
                      <h3 className="text-lg font-bold font-mono">{zone.name}</h3>
                    </div>
                    <Badge className={getThreatColor(zone.threat_level)} style={{ fontSize: '10px' }}>
                      {zone.threat_level}
                    </Badge>
                  </div>
                  
                  <div className="mb-3">
                    <div className="text-xs font-mono mb-1 opacity-70">Risk Score</div>
                    <div className="text-2xl font-bold font-mono">{zone.risk_score}/100</div>
                  </div>

                  <p className="text-sm font-mono mb-3 opacity-90">{zone.description}</p>

                  <div className="space-y-2 text-xs font-mono">
                    <div className="flex items-center justify-between">
                      <span className="opacity-70">Coordinates:</span>
                      <span>{zone.coordinates?.latitude?.toFixed(2)}, {zone.coordinates?.longitude?.toFixed(2)}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="opacity-70">Impact Radius:</span>
                      <span>{(zone.radius / 1000).toFixed(0)} km</span>
                    </div>
                    {zone.active_units && (
                      <div className="flex items-center justify-between">
                        <span className="opacity-70">Active Units:</span>
                        <span>{zone.active_units.toLocaleString()}</span>
                      </div>
                    )}
                  </div>

                  {zone.factors && zone.factors.length > 0 && (
                    <div className="mt-3 pt-3 border-t border-current/20">
                      <div className="text-xs font-mono opacity-70 mb-1">Contributing Factors:</div>
                      <div className="flex flex-wrap gap-1">
                        {zone.factors.map((factor, i) => (
                          <Badge key={i} variant="outline" className="text-xs font-mono border-current/30">
                            {factor}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Satellite Anomalies */}
          <TabsContent value="satellites">
            <div className="space-y-4">
              {threatData.satellite_anomalies?.map((anomaly, idx) => (
                <Card key={idx} className="bg-slate-950/80 backdrop-blur-xl cyber-border p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <Satellite className="w-5 h-5 text-orange-400" />
                      <div>
                        <h3 className="text-lg font-bold text-orange-400 font-mono">{anomaly.location}</h3>
                        <p className="text-xs text-slate-400 font-mono">{anomaly.timestamp}</p>
                      </div>
                    </div>
                    <Badge className="bg-orange-500/20 text-orange-400 border-orange-500/30 font-mono text-xs">
                      {anomaly.severity}
                    </Badge>
                  </div>

                  <div className="mb-3">
                    <Badge variant="outline" className="border-cyan-500/30 text-cyan-400 font-mono text-xs">
                      {anomaly.anomaly_type}
                    </Badge>
                  </div>

                  <p className="text-slate-300 font-mono text-sm mb-3">{anomaly.analysis}</p>

                  <div className="text-xs font-mono text-slate-400">
                    <span className="opacity-70">Coordinates: </span>
                    <span>{anomaly.coordinates?.latitude?.toFixed(2)}, {anomaly.coordinates?.longitude?.toFixed(2)}</span>
                  </div>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Emerging Flashpoints */}
          <TabsContent value="flashpoints">
            <div className="grid md:grid-cols-2 gap-4">
              {threatData.emerging_flashpoints?.map((flashpoint, idx) => (
                <Card key={idx} className="bg-slate-950/80 backdrop-blur-xl cyber-border p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <Zap className="w-5 h-5 text-yellow-400" />
                      <h3 className="text-lg font-bold text-yellow-400 font-mono">{flashpoint.region_name}</h3>
                    </div>
                    <div className="text-right">
                      <div className="text-xs text-slate-400 font-mono">Probability</div>
                      <div className="text-xl font-bold text-yellow-400 font-mono">
                        {flashpoint.escalation_probability}%
                      </div>
                    </div>
                  </div>

                  <p className="text-sm text-slate-400 font-mono mb-3">{flashpoint.location}</p>

                  <div className="mb-3">
                    <div className="text-xs text-slate-500 font-mono mb-1">Time Window:</div>
                    <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30 font-mono text-xs">
                      {flashpoint.time_window}
                    </Badge>
                  </div>

                  {flashpoint.triggers && flashpoint.triggers.length > 0 && (
                    <div className="mb-3">
                      <div className="text-xs text-slate-500 font-mono mb-1">Key Triggers:</div>
                      <ul className="space-y-1">
                        {flashpoint.triggers.map((trigger, i) => (
                          <li key={i} className="text-slate-300 font-mono text-xs flex items-start gap-2">
                            <TrendingUp className="w-3 h-3 text-yellow-400 mt-0.5 flex-shrink-0" />
                            {trigger}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {flashpoint.involved_parties && flashpoint.involved_parties.length > 0 && (
                    <div className="pt-3 border-t border-yellow-500/20">
                      <div className="text-xs text-slate-500 font-mono mb-1">Involved Parties:</div>
                      <div className="flex flex-wrap gap-1">
                        {flashpoint.involved_parties.map((party, i) => (
                          <Badge key={i} variant="outline" className="border-yellow-500/30 text-yellow-400 font-mono text-xs">
                            {party}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Real-Time Alerts */}
          <TabsContent value="alerts">
            <div className="space-y-3">
              {threatData.realtime_alerts?.map((alert, idx) => (
                <Card key={idx} className="bg-slate-950/80 backdrop-blur-xl cyber-border p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3 flex-1">
                      <AlertTriangle className="w-5 h-5 text-cyan-400" />
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <Badge className={getPriorityColor(alert.priority)} style={{ fontSize: '10px' }}>
                            {alert.priority}
                          </Badge>
                          <Badge variant="outline" className="border-cyan-500/30 text-cyan-400 font-mono text-xs">
                            {alert.alert_type}
                          </Badge>
                        </div>
                        <p className="text-slate-300 font-mono text-sm mb-1">{alert.description}</p>
                        <div className="flex items-center gap-3 text-xs font-mono text-slate-400">
                          <span>{alert.location}</span>
                          <span>•</span>
                          <span>{alert.timestamp}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      ) : null}

      {/* Assessment Summary */}
      {threatData && (
        <Card className="bg-slate-950/80 backdrop-blur-xl cyber-border p-6">
          <div className="flex items-center gap-3 mb-4">
            <Shield className="w-6 h-6 text-purple-400" />
            <h3 className="text-xl font-bold text-purple-400 glow-text font-mono">
              GLOBAL THREAT ASSESSMENT
            </h3>
          </div>
          <p className="text-slate-300 font-mono text-sm leading-relaxed mb-4">
            {threatData.threat_assessment}
          </p>

          {threatData.threat_trends?.key_developments && (
            <div>
              <h4 className="text-sm font-bold text-cyan-400 font-mono mb-2">KEY DEVELOPMENTS (24H)</h4>
              <ul className="space-y-1">
                {threatData.threat_trends.key_developments.map((dev, idx) => (
                  <li key={idx} className="text-slate-400 font-mono text-xs flex items-start gap-2">
                    <span className="text-cyan-400">→</span>
                    {dev}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </Card>
      )}
    </div>
  );
}