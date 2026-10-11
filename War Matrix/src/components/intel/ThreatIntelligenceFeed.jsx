import React, { useState, useEffect } from 'react';
import { base44 } from '../../api/base44Client';
import { useMutation } from '@tanstack/react-query';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Input } from '../ui/input';
import { 
  Shield, 
  AlertTriangle, 
  Radio, 
  Filter, 
  Bell, 
  Loader2,
  Globe,
  TrendingUp
} from 'lucide-react';

export default function ThreatIntelligenceFeed({ subscriptions = [], onSubscriptionChange }) {
  const [feeds, setFeeds] = useState(null);
  const [selectedRegions, setSelectedRegions] = useState(subscriptions.regions || []);
  const [selectedThreatTypes, setSelectedThreatTypes] = useState(subscriptions.types || []);
  const [alertThreshold, setAlertThreshold] = useState(subscriptions.threshold || 'medium');

  const fetchThreatIntelMutation = useMutation({
    mutationFn: async () => {
      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `You are a threat intelligence analyst aggregating data from OSINT (Open Source Intelligence) sources and geopolitical risk providers.

Fetch real-time threat intelligence covering:

1. GEOPOLITICAL THREATS
   - State-level tensions and diplomatic incidents
   - Military movements and exercises
   - Border disputes and territorial claims
   - Alliance shifts and treaty developments
   
2. TERRORISM & NON-STATE ACTORS
   - Terrorist group activities
   - Insurgent movements
   - Militia operations
   - Cyberattack groups

3. ECONOMIC THREATS
   - Sanctions and trade restrictions
   - Supply chain disruptions
   - Currency crises
   - Resource monopolization

4. CYBER THREATS
   - State-sponsored cyber operations
   - Critical infrastructure targeting
   - Espionage campaigns
   - Disinformation operations

5. HUMANITARIAN CRISES
   - Refugee movements
   - Food insecurity hotspots
   - Disease outbreaks in conflict zones
   - Climate-induced displacement

For EACH threat, provide:
- Threat ID and classification
- Source credibility (high/medium/low)
- Severity level (critical/high/medium/low)
- Geographic region and specific location
- Affected parties
- Timeline and urgency
- Potential escalation pathways
- Recommended monitoring actions
- Related threats (IDs)

Use current real-world data. Be specific with locations, actors, and timeframes.`,
        response_json_schema: {
          type: "object",
          properties: {
            timestamp: { type: "string" },
            feed_summary: { type: "string" },
            threats: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  threat_id: { type: "string" },
                  category: { type: "string" },
                  title: { type: "string" },
                  description: { type: "string" },
                  severity: { type: "string" },
                  source: { type: "string" },
                  source_credibility: { type: "string" },
                  region: { type: "string" },
                  location: { type: "string" },
                  affected_parties: { type: "array", items: { type: "string" } },
                  timeline: { type: "string" },
                  urgency: { type: "string" },
                  escalation_pathways: { type: "array", items: { type: "string" } },
                  monitoring_actions: { type: "array", items: { type: "string" } },
                  related_threats: { type: "array", items: { type: "string" } },
                  confidence_score: { type: "number" }
                }
              }
            },
            regional_breakdown: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  region: { type: "string" },
                  threat_count: { type: "number" },
                  highest_severity: { type: "string" }
                }
              }
            },
            alerts: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  alert_type: { type: "string" },
                  message: { type: "string" },
                  urgency: { type: "string" }
                }
              }
            }
          }
        },
        add_context_from_internet: true
      });

      setFeeds(result);
      return result;
    }
  });

  useEffect(() => {
    fetchThreatIntelMutation.mutate();
    
    // Auto-refresh every 5 minutes
    const interval = setInterval(() => {
      fetchThreatIntelMutation.mutate();
    }, 5 * 60 * 1000);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (onSubscriptionChange) {
      onSubscriptionChange({
        regions: selectedRegions,
        types: selectedThreatTypes,
        threshold: alertThreshold
      });
    }
  }, [selectedRegions, selectedThreatTypes, alertThreshold]);

  const filterThreats = (threats) => {
    if (!threats) return [];
    
    return threats.filter(threat => {
      const regionMatch = selectedRegions.length === 0 || selectedRegions.includes(threat.region);
      const typeMatch = selectedThreatTypes.length === 0 || selectedThreatTypes.includes(threat.category);
      
      const severityLevels = { critical: 4, high: 3, medium: 2, low: 1 };
      const thresholdLevels = { critical: 4, high: 3, medium: 2, low: 1 };
      const severityMatch = severityLevels[threat.severity?.toLowerCase()] >= thresholdLevels[alertThreshold];
      
      return regionMatch && typeMatch && severityMatch;
    });
  };

  const filteredThreats = filterThreats(feeds?.threats);

  const getSeverityColor = (severity) => {
    const colors = {
      critical: 'red',
      high: 'orange',
      medium: 'yellow',
      low: 'green'
    };
    return colors[severity?.toLowerCase()] || 'slate';
  };

  const availableRegions = [...new Set(feeds?.threats?.map(t => t.region) || [])];
  const availableTypes = [...new Set(feeds?.threats?.map(t => t.category) || [])];

  return (
    <div className="space-y-4">
      <Card className="bg-slate-950/80 backdrop-blur-xl cyber-border p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <Shield className="w-6 h-6 text-cyan-400" />
            <div>
              <h3 className="text-xl font-bold text-cyan-400 glow-text font-mono">
                THREAT INTELLIGENCE FEED
              </h3>
              <p className="text-slate-400 text-xs font-mono mt-1">
                OSINT aggregation • Real-time monitoring • Multi-source verification
              </p>
            </div>
          </div>
          <Button
            onClick={() => fetchThreatIntelMutation.mutate()}
            disabled={fetchThreatIntelMutation.isPending}
            size="sm"
            className="bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-400 border border-cyan-500/30 font-mono"
          >
            {fetchThreatIntelMutation.isPending ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Radio className="w-4 h-4 mr-2 animate-pulse" />
            )}
            REFRESH
          </Button>
        </div>

        {feeds && (
          <div className="mb-4 p-3 bg-blue-950/20 cyber-border rounded">
            <p className="text-slate-300 font-mono text-sm">{feeds.feed_summary}</p>
            <div className="text-xs text-slate-500 font-mono mt-1">
              Last updated: {new Date(feeds.timestamp).toLocaleTimeString()}
            </div>
          </div>
        )}

        {/* Subscription Controls */}
        <div className="mb-4 p-4 bg-slate-900/50 cyber-border rounded">
          <div className="flex items-center gap-2 mb-3">
            <Filter className="w-4 h-4 text-purple-400" />
            <h4 className="text-sm font-bold text-purple-400 font-mono">SUBSCRIPTION FILTERS</h4>
          </div>

          <div className="grid md:grid-cols-3 gap-4">
            <div>
              <label className="text-xs text-slate-400 font-mono mb-2 block">Regions</label>
              <div className="flex flex-wrap gap-1">
                {availableRegions.map((region, idx) => (
                  <Badge
                    key={idx}
                    onClick={() => {
                      if (selectedRegions.includes(region)) {
                        setSelectedRegions(selectedRegions.filter(r => r !== region));
                      } else {
                        setSelectedRegions([...selectedRegions, region]);
                      }
                    }}
                    className={`cursor-pointer font-mono text-xs ${
                      selectedRegions.includes(region)
                        ? 'bg-cyan-500/30 text-cyan-400 border-cyan-500/50'
                        : 'bg-slate-800/50 text-slate-400 border-slate-600/30'
                    }`}
                  >
                    {region}
                  </Badge>
                ))}
              </div>
            </div>

            <div>
              <label className="text-xs text-slate-400 font-mono mb-2 block">Threat Types</label>
              <div className="flex flex-wrap gap-1">
                {availableTypes.map((type, idx) => (
                  <Badge
                    key={idx}
                    onClick={() => {
                      if (selectedThreatTypes.includes(type)) {
                        setSelectedThreatTypes(selectedThreatTypes.filter(t => t !== type));
                      } else {
                        setSelectedThreatTypes([...selectedThreatTypes, type]);
                      }
                    }}
                    className={`cursor-pointer font-mono text-xs ${
                      selectedThreatTypes.includes(type)
                        ? 'bg-purple-500/30 text-purple-400 border-purple-500/50'
                        : 'bg-slate-800/50 text-slate-400 border-slate-600/30'
                    }`}
                  >
                    {type}
                  </Badge>
                ))}
              </div>
            </div>

            <div>
              <label className="text-xs text-slate-400 font-mono mb-2 block">Alert Threshold</label>
              <div className="flex gap-1">
                {['low', 'medium', 'high', 'critical'].map((level) => (
                  <Badge
                    key={level}
                    onClick={() => setAlertThreshold(level)}
                    className={`cursor-pointer font-mono text-xs ${
                      alertThreshold === level
                        ? `bg-${getSeverityColor(level)}-500/30 text-${getSeverityColor(level)}-400 border-${getSeverityColor(level)}-500/50`
                        : 'bg-slate-800/50 text-slate-400 border-slate-600/30'
                    }`}
                  >
                    {level.toUpperCase()}
                  </Badge>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Active Alerts */}
        {feeds?.alerts && feeds.alerts.length > 0 && (
          <div className="mb-4 space-y-2">
            {feeds.alerts.map((alert, idx) => (
              <div key={idx} className={`p-3 bg-${getSeverityColor(alert.urgency)}-950/20 cyber-border rounded flex items-start gap-2`}>
                <Bell className={`w-4 h-4 text-${getSeverityColor(alert.urgency)}-400 mt-0.5 animate-pulse`} />
                <div className="flex-1">
                  <Badge className={`bg-${getSeverityColor(alert.urgency)}-500/20 text-${getSeverityColor(alert.urgency)}-400 border-${getSeverityColor(alert.urgency)}-500/30 font-mono text-xs mb-1`}>
                    {alert.alert_type}
                  </Badge>
                  <p className="text-slate-300 font-mono text-xs">{alert.message}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Threat Feed */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="text-md font-bold text-cyan-400 font-mono">
            ACTIVE THREATS ({filteredThreats?.length || 0})
          </h4>
        </div>

        {filteredThreats?.map((threat, idx) => (
          <Card key={idx} className={`bg-slate-950/80 backdrop-blur-xl cyber-border p-4 border-l-4 border-${getSeverityColor(threat.severity)}-500`}>
            <div className="flex items-start justify-between mb-3">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <Badge className={`bg-${getSeverityColor(threat.severity)}-500/20 text-${getSeverityColor(threat.severity)}-400 border-${getSeverityColor(threat.severity)}-500/30 font-mono text-xs`}>
                    {threat.severity?.toUpperCase()}
                  </Badge>
                  <Badge variant="outline" className="border-purple-500/30 text-purple-400 font-mono text-xs">
                    {threat.category}
                  </Badge>
                  <Badge variant="outline" className="border-slate-500/30 text-slate-400 font-mono text-xs">
                    {threat.threat_id}
                  </Badge>
                </div>
                <h4 className="text-lg font-bold text-cyan-400 font-mono mb-1">{threat.title}</h4>
                <p className="text-slate-400 font-mono text-sm mb-2">{threat.description}</p>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-3 mb-3">
              <div className="p-2 bg-slate-900/50 cyber-border rounded">
                <div className="text-xs text-slate-500 font-mono mb-1">Location</div>
                <div className="flex items-center gap-1">
                  <Globe className="w-3 h-3 text-cyan-400" />
                  <span className="text-cyan-400 font-mono text-sm">{threat.location}</span>
                </div>
              </div>

              <div className="p-2 bg-slate-900/50 cyber-border rounded">
                <div className="text-xs text-slate-500 font-mono mb-1">Timeline</div>
                <span className="text-yellow-400 font-mono text-sm">{threat.timeline}</span>
              </div>

              <div className="p-2 bg-slate-900/50 cyber-border rounded">
                <div className="text-xs text-slate-500 font-mono mb-1">Source</div>
                <div className="flex items-center gap-2">
                  <span className="text-slate-300 font-mono text-sm">{threat.source}</span>
                  <Badge className={`${
                    threat.source_credibility === 'high' ? 'bg-green-500/20 text-green-400 border-green-500/30' :
                    threat.source_credibility === 'medium' ? 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30' :
                    'bg-red-500/20 text-red-400 border-red-500/30'
                  } font-mono text-xs`}>
                    {threat.source_credibility}
                  </Badge>
                </div>
              </div>

              <div className="p-2 bg-slate-900/50 cyber-border rounded">
                <div className="text-xs text-slate-500 font-mono mb-1">Confidence</div>
                <div className="flex items-center gap-2">
                  <div className="flex-1 bg-slate-800 rounded-full h-2">
                    <div 
                      className={`bg-${getSeverityColor(threat.severity)}-400 h-2 rounded-full`}
                      style={{ width: `${threat.confidence_score}%` }}
                    ></div>
                  </div>
                  <span className="text-slate-300 font-mono text-xs">{threat.confidence_score}%</span>
                </div>
              </div>
            </div>

            {threat.affected_parties?.length > 0 && (
              <div className="mb-3">
                <div className="text-xs text-slate-500 font-mono mb-1">Affected Parties</div>
                <div className="flex flex-wrap gap-1">
                  {threat.affected_parties.map((party, i) => (
                    <Badge key={i} variant="outline" className="border-orange-500/30 text-orange-400 font-mono text-xs">
                      {party}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {threat.escalation_pathways?.length > 0 && (
              <div className="mb-3 p-2 bg-red-950/20 cyber-border rounded">
                <div className="text-xs font-bold text-red-400 font-mono mb-1 flex items-center gap-1">
                  <TrendingUp className="w-3 h-3" />
                  Escalation Pathways
                </div>
                <ul className="space-y-1">
                  {threat.escalation_pathways.map((pathway, i) => (
                    <li key={i} className="text-slate-400 font-mono text-xs flex items-start gap-2">
                      <span className="text-red-400">▸</span>
                      {pathway}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {threat.monitoring_actions?.length > 0 && (
              <div className="p-2 bg-green-950/20 cyber-border rounded">
                <div className="text-xs font-bold text-green-400 font-mono mb-1">Recommended Actions</div>
                <ul className="space-y-1">
                  {threat.monitoring_actions.map((action, i) => (
                    <li key={i} className="text-slate-400 font-mono text-xs flex items-start gap-2">
                      <span className="text-green-400">✓</span>
                      {action}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </Card>
        ))}
      </div>

      {/* Regional Breakdown */}
      {feeds?.regional_breakdown && (
        <Card className="bg-slate-950/80 backdrop-blur-xl cyber-border p-4">
          <h4 className="text-md font-bold text-purple-400 font-mono mb-3">REGIONAL THREAT DISTRIBUTION</h4>
          <div className="grid md:grid-cols-3 gap-3">
            {feeds.regional_breakdown.map((region, idx) => (
              <div key={idx} className="p-3 bg-slate-900/50 cyber-border rounded">
                <div className="text-cyan-400 font-mono font-bold mb-1">{region.region}</div>
                <div className="flex items-center justify-between text-xs font-mono">
                  <span className="text-slate-400">{region.threat_count} threats</span>
                  <Badge className={`bg-${getSeverityColor(region.highest_severity)}-500/20 text-${getSeverityColor(region.highest_severity)}-400 border-${getSeverityColor(region.highest_severity)}-500/30 text-xs`}>
                    {region.highest_severity}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}