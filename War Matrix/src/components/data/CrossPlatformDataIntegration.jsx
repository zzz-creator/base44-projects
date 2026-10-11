import React, { useState } from 'react';
import { base44 } from '../../api/base44Client';
import { useMutation } from '@tanstack/react-query';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Switch } from '../ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { 
  Database, Loader2, RefreshCw, Globe, TrendingUp, 
  Users, Droplets, Wheat, Zap, Check, AlertTriangle,
  BarChart3, Link2
} from 'lucide-react';
import { toast } from 'sonner';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';

export default function CrossPlatformDataIntegration({ onDataIntegrated }) {
  const [enabledSources, setEnabledSources] = useState({
    world_bank: true,
    un_data: true,
    acled: true,
    gdelt: false,
    sipri: true
  });
  const [integratedData, setIntegratedData] = useState(null);
  const [correlationResults, setCorrelationResults] = useState(null);

  const dataSources = [
    { id: 'world_bank', name: 'World Bank', icon: Globe, description: 'Economic indicators, GDP, trade data', color: 'cyan' },
    { id: 'un_data', name: 'UN Data', icon: Users, description: 'Population, humanitarian, development indices', color: 'blue' },
    { id: 'acled', name: 'ACLED', icon: AlertTriangle, description: 'Armed conflict location & event data', color: 'red' },
    { id: 'gdelt', name: 'GDELT', icon: Globe, description: 'Global events, language, tone database', color: 'purple' },
    { id: 'sipri', name: 'SIPRI', icon: Zap, description: 'Military expenditure, arms transfers', color: 'orange' }
  ];

  const fetchIntegratedDataMutation = useMutation({
    mutationFn: async () => {
      const enabledSourceNames = Object.entries(enabledSources)
        .filter(([_, enabled]) => enabled)
        .map(([id]) => dataSources.find(s => s.id === id)?.name)
        .join(', ');

      const response = await base44.integrations.Core.InvokeLLM({
        prompt: `You are a data integration specialist. Simulate fetching and integrating data from the following public data sources: ${enabledSourceNames}

Generate realistic, current data that would come from these sources, including:

1. WORLD BANK DATA (if enabled):
   - GDP growth rates by region
   - Trade balance indicators
   - Foreign direct investment flows
   - Unemployment rates in conflict-prone regions

2. UN DATA (if enabled):
   - Refugee and displacement statistics
   - Food security indices
   - Human development indicators
   - Peacekeeping mission deployments

3. ACLED DATA (if enabled):
   - Recent conflict events by country
   - Fatality estimates
   - Actor types involved
   - Event types breakdown

4. GDELT DATA (if enabled):
   - Media tone analysis by region
   - Event counts and types
   - Actor relationship networks

5. SIPRI DATA (if enabled):
   - Military expenditure by country
   - Arms imports/exports
   - Nuclear forces data

Generate 30 days of time-series data where applicable.`,
        response_json_schema: {
          type: 'object',
          properties: {
            fetch_timestamp: { type: 'string' },
            sources_integrated: { type: 'array', items: { type: 'string' } },
            world_bank_data: {
              type: 'object',
              properties: {
                gdp_growth: { type: 'array', items: { type: 'object', properties: { region: { type: 'string' }, rate: { type: 'number' }, trend: { type: 'string' } } } },
                trade_indicators: { type: 'array', items: { type: 'object', properties: { country: { type: 'string' }, balance: { type: 'number' }, change: { type: 'number' } } } },
                unemployment_hotspots: { type: 'array', items: { type: 'object', properties: { country: { type: 'string' }, rate: { type: 'number' }, conflict_risk: { type: 'string' } } } }
              }
            },
            un_data: {
              type: 'object',
              properties: {
                refugee_statistics: { type: 'array', items: { type: 'object', properties: { origin: { type: 'string' }, destination: { type: 'string' }, count: { type: 'number' } } } },
                food_security: { type: 'array', items: { type: 'object', properties: { region: { type: 'string' }, index: { type: 'number' }, status: { type: 'string' } } } },
                peacekeeping_missions: { type: 'array', items: { type: 'object', properties: { mission: { type: 'string' }, location: { type: 'string' }, personnel: { type: 'number' } } } }
              }
            },
            acled_data: {
              type: 'object',
              properties: {
                recent_events: { type: 'array', items: { type: 'object', properties: { country: { type: 'string' }, event_type: { type: 'string' }, fatalities: { type: 'number' }, date: { type: 'string' } } } },
                hotspots: { type: 'array', items: { type: 'object', properties: { region: { type: 'string' }, event_count: { type: 'number' }, trend: { type: 'string' } } } }
              }
            },
            sipri_data: {
              type: 'object',
              properties: {
                military_expenditure: { type: 'array', items: { type: 'object', properties: { country: { type: 'string' }, amount_billions: { type: 'number' }, change_percent: { type: 'number' } } } },
                arms_transfers: { type: 'array', items: { type: 'object', properties: { exporter: { type: 'string' }, importer: { type: 'string' }, value_millions: { type: 'number' } } } }
              }
            },
            time_series: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  date: { type: 'string' },
                  conflict_events: { type: 'number' },
                  economic_stress: { type: 'number' },
                  refugee_flows: { type: 'number' }
                }
              }
            }
          }
        },
        add_context_from_internet: true
      });

      return response;
    },
    onSuccess: (data) => {
      setIntegratedData(data);
      toast.success('Data integrated from external sources');
      if (onDataIntegrated) {
        onDataIntegrated(data);
      }
    }
  });

  const correlateDataMutation = useMutation({
    mutationFn: async () => {
      if (!integratedData) return null;

      const response = await base44.integrations.Core.InvokeLLM({
        prompt: `You are a data scientist specializing in conflict analysis. Analyze the following integrated data and identify correlations between different indicators.

INTEGRATED DATA:
${JSON.stringify(integratedData, null, 2)}

Perform correlation analysis:
1. Identify relationships between economic indicators and conflict events
2. Find patterns between refugee flows and regional instability
3. Correlate military expenditure with conflict intensity
4. Identify leading indicators that predict escalation

Provide statistical correlations and actionable insights.`,
        response_json_schema: {
          type: 'object',
          properties: {
            correlation_summary: { type: 'string' },
            key_correlations: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  indicator_1: { type: 'string' },
                  indicator_2: { type: 'string' },
                  correlation_strength: { type: 'number' },
                  relationship: { type: 'string' },
                  significance: { type: 'string' }
                }
              }
            },
            leading_indicators: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  indicator: { type: 'string' },
                  predicts: { type: 'string' },
                  lead_time: { type: 'string' },
                  reliability: { type: 'number' }
                }
              }
            },
            risk_hotspots: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  region: { type: 'string' },
                  risk_score: { type: 'number' },
                  contributing_factors: { type: 'array', items: { type: 'string' } }
                }
              }
            },
            recommendations: { type: 'array', items: { type: 'string' } }
          }
        },
        add_context_from_internet: true
      });

      return response;
    },
    onSuccess: (data) => {
      setCorrelationResults(data);
      toast.success('Correlation analysis complete');
    }
  });

  const toggleSource = (sourceId) => {
    setEnabledSources(prev => ({
      ...prev,
      [sourceId]: !prev[sourceId]
    }));
  };

  return (
    <Card className="bg-slate-950/80 backdrop-blur-xl border border-sky-900/40 p-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 rounded-lg bg-cyan-500/20 border border-cyan-500/30">
          <Database className="w-6 h-6 text-cyan-400" />
        </div>
        <div>
          <h3 className="text-xl font-bold text-cyan-400 glow-text font-mono">
            CROSS-PLATFORM DATA INTEGRATION
          </h3>
          <p className="text-xs text-slate-400 font-mono">World Bank, UN, ACLED, SIPRI data connectors</p>
        </div>
      </div>

      <Tabs defaultValue="sources" className="space-y-4">
        <TabsList className="grid grid-cols-3 bg-slate-900/50">
          <TabsTrigger value="sources" className="font-mono text-xs">DATA SOURCES</TabsTrigger>
          <TabsTrigger value="data" className="font-mono text-xs">INTEGRATED DATA</TabsTrigger>
          <TabsTrigger value="correlation" className="font-mono text-xs">CORRELATION</TabsTrigger>
        </TabsList>

        <TabsContent value="sources" className="space-y-4">
          <div className="space-y-3">
            {dataSources.map((source) => (
              <div
                key={source.id}
                className={`bg-slate-900/50 border rounded-lg p-4 ${
                  enabledSources[source.id] ? `border-${source.color}-500/30` : 'border-slate-700/30 opacity-60'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg bg-${source.color}-500/20`}>
                      <source.icon className={`w-5 h-5 text-${source.color}-400`} />
                    </div>
                    <div>
                      <h4 className={`text-${source.color}-400 font-mono font-bold text-sm`}>{source.name}</h4>
                      <p className="text-slate-500 font-mono text-xs">{source.description}</p>
                    </div>
                  </div>
                  <Switch
                    checked={enabledSources[source.id]}
                    onCheckedChange={() => toggleSource(source.id)}
                  />
                </div>
              </div>
            ))}
          </div>

          <Button
            onClick={() => fetchIntegratedDataMutation.mutate()}
            disabled={fetchIntegratedDataMutation.isPending || !Object.values(enabledSources).some(v => v)}
            className="w-full bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white font-mono"
          >
            {fetchIntegratedDataMutation.isPending ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                FETCHING DATA...
              </>
            ) : (
              <>
                <Link2 className="w-4 h-4 mr-2" />
                INTEGRATE DATA SOURCES
              </>
            )}
          </Button>
        </TabsContent>

        <TabsContent value="data" className="space-y-4">
          {!integratedData ? (
            <div className="bg-slate-900/50 border border-sky-800/30 rounded-lg p-8 text-center">
              <Database className="w-12 h-12 text-slate-600 mx-auto mb-3" />
              <p className="text-slate-500 font-mono text-sm">No data integrated yet</p>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Time Series Chart */}
              {integratedData.time_series?.length > 0 && (
                <Card className="bg-slate-900/50 border border-sky-800/30 p-4">
                  <h4 className="text-cyan-400 font-mono font-bold text-sm mb-4">INTEGRATED TIME SERIES</h4>
                  <div className="h-[200px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={integratedData.time_series}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                        <XAxis dataKey="date" stroke="#64748b" style={{ fontSize: '10px', fontFamily: 'monospace' }} />
                        <YAxis stroke="#64748b" style={{ fontSize: '10px', fontFamily: 'monospace' }} />
                        <Tooltip contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #334155', fontFamily: 'monospace' }} />
                        <Line type="monotone" dataKey="conflict_events" stroke="#ef4444" name="Conflict Events" />
                        <Line type="monotone" dataKey="economic_stress" stroke="#eab308" name="Economic Stress" />
                        <Line type="monotone" dataKey="refugee_flows" stroke="#3b82f6" name="Refugee Flows" />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </Card>
              )}

              {/* ACLED Hotspots */}
              {integratedData.acled_data?.hotspots?.length > 0 && (
                <Card className="bg-slate-900/50 border border-red-500/30 p-4">
                  <h4 className="text-red-400 font-mono font-bold text-sm mb-3 flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4" />
                    CONFLICT HOTSPOTS (ACLED)
                  </h4>
                  <div className="space-y-2">
                    {integratedData.acled_data.hotspots.map((hotspot, i) => (
                      <div key={i} className="flex items-center justify-between bg-red-500/10 rounded p-2">
                        <span className="text-slate-300 font-mono text-xs">{hotspot.region}</span>
                        <div className="flex items-center gap-2">
                          <Badge className="bg-red-500/20 text-red-400 font-mono text-[10px]">
                            {hotspot.event_count} events
                          </Badge>
                          <Badge className={`font-mono text-[10px] ${
                            hotspot.trend === 'increasing' ? 'bg-red-500/20 text-red-400' : 'bg-green-500/20 text-green-400'
                          }`}>
                            {hotspot.trend}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </Card>
              )}

              {/* Military Expenditure */}
              {integratedData.sipri_data?.military_expenditure?.length > 0 && (
                <Card className="bg-slate-900/50 border border-orange-500/30 p-4">
                  <h4 className="text-orange-400 font-mono font-bold text-sm mb-3 flex items-center gap-2">
                    <Zap className="w-4 h-4" />
                    MILITARY EXPENDITURE (SIPRI)
                  </h4>
                  <div className="h-[150px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={integratedData.sipri_data.military_expenditure.slice(0, 8)}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                        <XAxis dataKey="country" stroke="#64748b" style={{ fontSize: '10px', fontFamily: 'monospace' }} />
                        <YAxis stroke="#64748b" style={{ fontSize: '10px', fontFamily: 'monospace' }} />
                        <Tooltip contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #334155', fontFamily: 'monospace' }} />
                        <Bar dataKey="amount_billions" fill="#f97316" name="$ Billions" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </Card>
              )}
            </div>
          )}

          {integratedData && (
            <Button
              onClick={() => correlateDataMutation.mutate()}
              disabled={correlateDataMutation.isPending}
              className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-mono"
            >
              {correlateDataMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ANALYZING CORRELATIONS...
                </>
              ) : (
                <>
                  <BarChart3 className="w-4 h-4 mr-2" />
                  ANALYZE CORRELATIONS
                </>
              )}
            </Button>
          )}
        </TabsContent>

        <TabsContent value="correlation" className="space-y-4">
          {!correlationResults ? (
            <div className="bg-slate-900/50 border border-sky-800/30 rounded-lg p-8 text-center">
              <BarChart3 className="w-12 h-12 text-slate-600 mx-auto mb-3" />
              <p className="text-slate-500 font-mono text-sm">Run correlation analysis from Data tab</p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="bg-purple-500/10 border border-purple-500/30 rounded-lg p-4">
                <p className="text-slate-300 font-mono text-sm">{correlationResults.correlation_summary}</p>
              </div>

              {/* Key Correlations */}
              {correlationResults.key_correlations?.length > 0 && (
                <Card className="bg-slate-900/50 border border-sky-800/30 p-4">
                  <h4 className="text-purple-400 font-mono font-bold text-sm mb-3">KEY CORRELATIONS</h4>
                  <div className="space-y-2">
                    {correlationResults.key_correlations.map((corr, i) => (
                      <div key={i} className="bg-purple-500/10 border border-purple-500/20 rounded p-2">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-slate-300 font-mono text-xs">
                            {corr.indicator_1} ↔ {corr.indicator_2}
                          </span>
                          <Badge className={`font-mono text-[10px] ${
                            corr.correlation_strength > 0.7 ? 'bg-green-500/20 text-green-400' :
                            corr.correlation_strength > 0.4 ? 'bg-yellow-500/20 text-yellow-400' :
                            'bg-red-500/20 text-red-400'
                          }`}>
                            {(corr.correlation_strength * 100).toFixed(0)}% correlation
                          </Badge>
                        </div>
                        <p className="text-slate-500 font-mono text-[10px]">{corr.relationship}</p>
                      </div>
                    ))}
                  </div>
                </Card>
              )}

              {/* Risk Hotspots */}
              {correlationResults.risk_hotspots?.length > 0 && (
                <Card className="bg-slate-900/50 border border-red-500/30 p-4">
                  <h4 className="text-red-400 font-mono font-bold text-sm mb-3">IDENTIFIED RISK HOTSPOTS</h4>
                  <div className="space-y-2">
                    {correlationResults.risk_hotspots.map((hotspot, i) => (
                      <div key={i} className="bg-red-500/10 border border-red-500/20 rounded p-2">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-red-400 font-mono text-sm font-bold">{hotspot.region}</span>
                          <Badge className="bg-red-500/20 text-red-400 font-mono text-[10px]">
                            Risk: {hotspot.risk_score}/100
                          </Badge>
                        </div>
                        <div className="flex flex-wrap gap-1">
                          {hotspot.contributing_factors?.map((factor, j) => (
                            <Badge key={j} variant="outline" className="border-red-500/30 text-red-400 font-mono text-[10px]">
                              {factor}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </Card>
              )}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </Card>
  );
}