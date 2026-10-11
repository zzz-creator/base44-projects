import React, { useState } from 'react';
import { base44 } from '../../api/base44Client';
import { useMutation } from '@tanstack/react-query';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { Slider } from '../ui/slider';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Badge } from '../ui/badge';
import { Brain, TrendingUp, AlertTriangle, Zap, FileText, Loader2, Bell, Activity } from 'lucide-react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import TrendForecastingModule from './TrendForecastingModule';
import WhatIfScenarioBuilder from './WhatIfScenarioBuilder';
import KeyEventPredictor from './KeyEventPredictor';

export default function AdvancedAnalysisSection() {
  const [activeTab, setActiveTab] = useState('escalation');
  const [escalationParams, setEscalationParams] = useState({
    region: '',
    timeframe: 30,
    factors: '',
    sensitivity: 50
  });
  const [anomalyParams, setAnomalyParams] = useState({
    dataSource: 'news',
    threshold: 70,
    lookbackDays: 7
  });
  const [simulationParams, setSimulationParams] = useState({
    scenario: '',
    variables: '',
    iterations: 100
  });
  const [results, setResults] = useState({
    escalation: null,
    anomaly: null,
    simulation: null
  });

  const escalationMutation = useMutation({
    mutationFn: async () => {
      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `You are an advanced AI predictive model for conflict escalation. Analyze and predict conflict escalation patterns.

PARAMETERS:
- Region: ${escalationParams.region || 'Global'}
- Timeframe: ${escalationParams.timeframe} days
- Key Factors: ${escalationParams.factors || 'All factors'}
- Sensitivity: ${escalationParams.sensitivity}/100

Provide comprehensive escalation prediction including:
1. Escalation probability curve over time
2. Key trigger events that could accelerate escalation
3. De-escalation opportunities and windows
4. Confidence intervals for predictions
5. Similar historical escalation patterns
6. Risk factors ranked by impact`,
        response_json_schema: {
          type: "object",
          properties: {
            overall_probability: { type: "number" },
            confidence_level: { type: "number" },
            escalation_timeline: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  day: { type: "number" },
                  probability: { type: "number" },
                  confidence_low: { type: "number" },
                  confidence_high: { type: "number" }
                }
              }
            },
            trigger_events: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  event: { type: "string" },
                  impact_score: { type: "number" },
                  timeframe: { type: "string" }
                }
              }
            },
            deescalation_windows: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  period: { type: "string" },
                  opportunity: { type: "string" },
                  success_probability: { type: "number" }
                }
              }
            },
            risk_factors: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  factor: { type: "string" },
                  impact: { type: "number" },
                  trend: { type: "string" }
                }
              }
            },
            recommendations: { type: "array", items: { type: "string" } }
          }
        },
        add_context_from_internet: true
      });
      setResults(prev => ({ ...prev, escalation: result }));
      return result;
    }
  });

  const anomalyMutation = useMutation({
    mutationFn: async () => {
      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `You are an AI anomaly detection system for geopolitical events. Detect unusual patterns and anomalies.

PARAMETERS:
- Data Source: ${anomalyParams.dataSource}
- Detection Threshold: ${anomalyParams.threshold}%
- Lookback Period: ${anomalyParams.lookbackDays} days

Identify and analyze anomalies including:
1. Statistical deviations from normal patterns
2. Unusual activity clusters
3. Breaking patterns vs historical norms
4. Potential causes of anomalies
5. Severity and urgency assessment
6. Recommended immediate actions`,
        response_json_schema: {
          type: "object",
          properties: {
            anomalies_detected: { type: "number" },
            severity_distribution: {
              type: "object",
              properties: {
                critical: { type: "number" },
                high: { type: "number" },
                medium: { type: "number" },
                low: { type: "number" }
              }
            },
            detected_anomalies: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  type: { type: "string" },
                  description: { type: "string" },
                  severity: { type: "string" },
                  deviation_score: { type: "number" },
                  location: { type: "string" },
                  detected_at: { type: "string" },
                  potential_cause: { type: "string" }
                }
              }
            },
            pattern_analysis: { type: "string" },
            immediate_actions: { type: "array", items: { type: "string" } }
          }
        },
        add_context_from_internet: true
      });
      setResults(prev => ({ ...prev, anomaly: result }));
      return result;
    }
  });

  const simulationMutation = useMutation({
    mutationFn: async () => {
      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `You are an advanced scenario simulation AI. Run detailed what-if analysis.

SCENARIO:
${simulationParams.scenario}

VARIABLES TO TEST:
${simulationParams.variables}

NUMBER OF ITERATIONS: ${simulationParams.iterations}

Provide comprehensive simulation results including:
1. Outcome distribution across iterations
2. Most likely scenarios with probabilities
3. Best and worst case scenarios
4. Key decision points that alter outcomes
5. Sensitivity analysis for each variable
6. Strategic recommendations based on results`,
        response_json_schema: {
          type: "object",
          properties: {
            simulation_summary: { type: "string" },
            outcome_distribution: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  outcome: { type: "string" },
                  probability: { type: "number" },
                  iterations: { type: "number" }
                }
              }
            },
            scenarios: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  name: { type: "string" },
                  probability: { type: "number" },
                  description: { type: "string" },
                  impact_score: { type: "number" }
                }
              }
            },
            decision_points: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  decision: { type: "string" },
                  impact_on_outcome: { type: "string" },
                  optimal_choice: { type: "string" }
                }
              }
            },
            sensitivity_analysis: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  variable: { type: "string" },
                  sensitivity_score: { type: "number" },
                  effect: { type: "string" }
                }
              }
            },
            recommendations: { type: "array", items: { type: "string" } }
          }
        },
        add_context_from_internet: true
      });
      setResults(prev => ({ ...prev, simulation: result }));
      return result;
    }
  });

  return (
    <Card className="bg-slate-950/80 backdrop-blur-xl cyber-border p-6">
      <div className="flex items-center gap-3 mb-6">
        <Brain className="w-8 h-8 text-purple-400" />
        <div>
          <h2 className="text-2xl font-bold text-purple-400 glow-text font-mono">
            ADVANCED AI ANALYSIS
          </h2>
          <p className="text-slate-400 text-sm font-mono mt-1">
            Predictive modeling • Anomaly detection • Scenario simulation
          </p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-6 bg-slate-950/80 border border-purple-500/30">
          <TabsTrigger value="escalation" className="data-[state=active]:bg-red-500/20 data-[state=active]:text-red-400 font-mono text-xs">
            <TrendingUp className="w-4 h-4 mr-1" />
            ESCALATION
          </TabsTrigger>
          <TabsTrigger value="anomaly" className="data-[state=active]:bg-orange-500/20 data-[state=active]:text-orange-400 font-mono text-xs">
            <AlertTriangle className="w-4 h-4 mr-1" />
            ANOMALY
          </TabsTrigger>
          <TabsTrigger value="simulation" className="data-[state=active]:bg-cyan-500/20 data-[state=active]:text-cyan-400 font-mono text-xs">
            <Zap className="w-4 h-4 mr-1" />
            SIMULATION
          </TabsTrigger>
          <TabsTrigger value="forecasting" className="data-[state=active]:bg-purple-500/20 data-[state=active]:text-purple-400 font-mono text-xs">
            <Activity className="w-4 h-4 mr-1" />
            FORECAST
          </TabsTrigger>
          <TabsTrigger value="whatif" className="data-[state=active]:bg-yellow-500/20 data-[state=active]:text-yellow-400 font-mono text-xs">
            <Zap className="w-4 h-4 mr-1" />
            WHAT-IF
          </TabsTrigger>
          <TabsTrigger value="predictor" className="data-[state=active]:bg-red-500/20 data-[state=active]:text-red-400 font-mono text-xs">
            <Bell className="w-4 h-4 mr-1" />
            PREDICTOR
          </TabsTrigger>
        </TabsList>

        <TabsContent value="escalation" className="mt-6 space-y-6">
          <Card className="bg-slate-900/50 cyber-border p-4">
            <h3 className="text-lg font-bold text-red-400 font-mono mb-4">ESCALATION PREDICTION</h3>
            <div className="space-y-4">
              <div>
                <Label className="text-slate-300 font-mono text-sm">Region/Conflict</Label>
                <Input
                  value={escalationParams.region}
                  onChange={(e) => setEscalationParams({ ...escalationParams, region: e.target.value })}
                  placeholder="e.g., Middle East, Ukraine"
                  className="bg-slate-950/50 border-red-500/30 text-red-400 font-mono"
                />
              </div>
              <div>
                <Label className="text-slate-300 font-mono text-sm">
                  Prediction Timeframe: {escalationParams.timeframe} days
                </Label>
                <Slider
                  value={[escalationParams.timeframe]}
                  onValueChange={(v) => setEscalationParams({ ...escalationParams, timeframe: v[0] })}
                  min={7}
                  max={180}
                  step={1}
                />
              </div>
              <div>
                <Label className="text-slate-300 font-mono text-sm">Key Factors to Consider</Label>
                <Textarea
                  value={escalationParams.factors}
                  onChange={(e) => setEscalationParams({ ...escalationParams, factors: e.target.value })}
                  placeholder="e.g., military build-up, diplomatic tensions, economic sanctions"
                  className="bg-slate-950/50 border-red-500/30 text-red-400 font-mono"
                />
              </div>
              <Button
                onClick={() => escalationMutation.mutate()}
                disabled={escalationMutation.isPending}
                className="w-full bg-gradient-to-r from-red-500 to-orange-500 hover:from-red-600 hover:to-orange-600 text-white font-mono"
              >
                {escalationMutation.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ANALYZING...
                  </>
                ) : (
                  <>
                    <Brain className="w-4 h-4 mr-2" />
                    RUN PREDICTION
                  </>
                )}
              </Button>
            </div>
          </Card>

          {results.escalation && (
            <div className="space-y-4">
              <Card className="bg-gradient-to-br from-red-950/50 to-orange-950/50 cyber-border p-6">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="text-xl font-bold text-red-400 font-mono">PREDICTION RESULTS</h4>
                  <Badge className="bg-red-500/20 text-red-400 border-red-500/30 font-mono">
                    {results.escalation.overall_probability}% PROBABILITY
                  </Badge>
                </div>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={results.escalation.escalation_timeline}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                      <XAxis dataKey="day" stroke="#64748b" style={{ fontSize: '10px', fontFamily: 'monospace' }} />
                      <YAxis stroke="#64748b" style={{ fontSize: '10px', fontFamily: 'monospace' }} />
                      <Tooltip />
                      <Legend wrapperStyle={{ fontFamily: 'monospace', fontSize: '11px' }} />
                      <Line type="monotone" dataKey="probability" stroke="#ef4444" strokeWidth={2} name="Probability" />
                      <Line type="monotone" dataKey="confidence_high" stroke="#f97316" strokeWidth={1} strokeDasharray="5 5" name="Upper Bound" />
                      <Line type="monotone" dataKey="confidence_low" stroke="#fb923c" strokeWidth={1} strokeDasharray="5 5" name="Lower Bound" />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </Card>

              <Card className="bg-slate-900/50 cyber-border p-6">
                <h4 className="text-lg font-bold text-orange-400 font-mono mb-4">TRIGGER EVENTS</h4>
                <div className="space-y-2">
                  {results.escalation.trigger_events?.map((event, idx) => (
                    <div key={idx} className="bg-slate-950/50 cyber-border rounded p-3">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-yellow-400 font-mono text-sm font-bold">{event.event}</span>
                        <Badge className="bg-orange-500/20 text-orange-400 border-orange-500/30 font-mono text-xs">
                          Impact: {event.impact_score}/100
                        </Badge>
                      </div>
                      <div className="text-xs text-slate-400 font-mono">Timeframe: {event.timeframe}</div>
                    </div>
                  ))}
                </div>
              </Card>

              <Card className="bg-slate-900/50 cyber-border p-6">
                <h4 className="text-lg font-bold text-green-400 font-mono mb-4">RECOMMENDATIONS</h4>
                <ul className="space-y-2">
                  {results.escalation.recommendations?.map((rec, idx) => (
                    <li key={idx} className="flex items-start gap-2 text-slate-300 font-mono text-sm">
                      <span className="text-green-400 font-bold">{idx + 1}.</span>
                      {rec}
                    </li>
                  ))}
                </ul>
              </Card>
            </div>
          )}
        </TabsContent>

        <TabsContent value="anomaly" className="mt-6 space-y-6">
          <Card className="bg-slate-900/50 cyber-border p-4">
            <h3 className="text-lg font-bold text-orange-400 font-mono mb-4">ANOMALY DETECTION</h3>
            <div className="space-y-4">
              <div>
                <Label className="text-slate-300 font-mono text-sm">Detection Threshold: {anomalyParams.threshold}%</Label>
                <Slider
                  value={[anomalyParams.threshold]}
                  onValueChange={(v) => setAnomalyParams({ ...anomalyParams, threshold: v[0] })}
                  min={50}
                  max={95}
                  step={5}
                />
              </div>
              <div>
                <Label className="text-slate-300 font-mono text-sm">Lookback Period: {anomalyParams.lookbackDays} days</Label>
                <Slider
                  value={[anomalyParams.lookbackDays]}
                  onValueChange={(v) => setAnomalyParams({ ...anomalyParams, lookbackDays: v[0] })}
                  min={1}
                  max={30}
                  step={1}
                />
              </div>
              <Button
                onClick={() => anomalyMutation.mutate()}
                disabled={anomalyMutation.isPending}
                className="w-full bg-gradient-to-r from-orange-500 to-yellow-500 hover:from-orange-600 hover:to-yellow-600 text-white font-mono"
              >
                {anomalyMutation.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    DETECTING...
                  </>
                ) : (
                  <>
                    <AlertTriangle className="w-4 h-4 mr-2" />
                    DETECT ANOMALIES
                  </>
                )}
              </Button>
            </div>
          </Card>

          {results.anomaly && (
            <div className="space-y-4">
              <Card className="bg-gradient-to-br from-orange-950/50 to-yellow-950/50 cyber-border p-6">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="text-xl font-bold text-orange-400 font-mono">DETECTED ANOMALIES</h4>
                  <Badge className="bg-orange-500/20 text-orange-400 border-orange-500/30 font-mono">
                    {results.anomaly.anomalies_detected} FOUND
                  </Badge>
                </div>
                <div className="space-y-3">
                  {results.anomaly.detected_anomalies?.map((anomaly, idx) => (
                    <div key={idx} className="bg-slate-950/50 cyber-border rounded p-4 border-l-4 border-orange-500">
                      <div className="flex items-start justify-between mb-2">
                        <h5 className="text-md font-bold text-yellow-400 font-mono">{anomaly.type}</h5>
                        <Badge className={`font-mono text-xs ${
                          anomaly.severity === 'critical' ? 'bg-red-500/20 text-red-400 border-red-500/30' :
                          anomaly.severity === 'high' ? 'bg-orange-500/20 text-orange-400 border-orange-500/30' :
                          'bg-yellow-500/20 text-yellow-400 border-yellow-500/30'
                        }`}>
                          {anomaly.severity.toUpperCase()}
                        </Badge>
                      </div>
                      <p className="text-slate-300 font-mono text-sm mb-2">{anomaly.description}</p>
                      <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                        <div>
                          <span className="text-slate-500">Location:</span>
                          <span className="text-cyan-400 ml-1">{anomaly.location}</span>
                        </div>
                        <div>
                          <span className="text-slate-500">Deviation:</span>
                          <span className="text-red-400 ml-1">{anomaly.deviation_score}/100</span>
                        </div>
                      </div>
                      <div className="mt-2 pt-2 border-t border-slate-700/30">
                        <span className="text-xs text-slate-500 font-mono">Potential Cause: </span>
                        <span className="text-xs text-slate-300 font-mono">{anomaly.potential_cause}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>

              <Card className="bg-slate-900/50 cyber-border p-6">
                <h4 className="text-lg font-bold text-red-400 font-mono mb-4">IMMEDIATE ACTIONS</h4>
                <ul className="space-y-2">
                  {results.anomaly.immediate_actions?.map((action, idx) => (
                    <li key={idx} className="flex items-start gap-2 text-slate-300 font-mono text-sm">
                      <AlertTriangle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
                      {action}
                    </li>
                  ))}
                </ul>
              </Card>
            </div>
          )}
        </TabsContent>

        <TabsContent value="simulation" className="mt-6 space-y-6">
          <Card className="bg-slate-900/50 cyber-border p-4">
            <h3 className="text-lg font-bold text-cyan-400 font-mono mb-4">SCENARIO SIMULATION</h3>
            <div className="space-y-4">
              <div>
                <Label className="text-slate-300 font-mono text-sm">Scenario Description</Label>
                <Textarea
                  value={simulationParams.scenario}
                  onChange={(e) => setSimulationParams({ ...simulationParams, scenario: e.target.value })}
                  placeholder="Describe the scenario to simulate..."
                  className="bg-slate-950/50 border-cyan-500/30 text-cyan-400 font-mono min-h-[100px]"
                />
              </div>
              <div>
                <Label className="text-slate-300 font-mono text-sm">Variables to Test</Label>
                <Textarea
                  value={simulationParams.variables}
                  onChange={(e) => setSimulationParams({ ...simulationParams, variables: e.target.value })}
                  placeholder="e.g., diplomatic pressure, economic sanctions, military response"
                  className="bg-slate-950/50 border-cyan-500/30 text-cyan-400 font-mono"
                />
              </div>
              <div>
                <Label className="text-slate-300 font-mono text-sm">
                  Iterations: {simulationParams.iterations}
                </Label>
                <Slider
                  value={[simulationParams.iterations]}
                  onValueChange={(v) => setSimulationParams({ ...simulationParams, iterations: v[0] })}
                  min={50}
                  max={1000}
                  step={50}
                />
              </div>
              <Button
                onClick={() => simulationMutation.mutate()}
                disabled={simulationMutation.isPending}
                className="w-full bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white font-mono"
              >
                {simulationMutation.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    SIMULATING...
                  </>
                ) : (
                  <>
                    <Zap className="w-4 h-4 mr-2" />
                    RUN SIMULATION
                  </>
                )}
              </Button>
            </div>
          </Card>

          {results.simulation && (
            <div className="space-y-4">
              <Card className="bg-gradient-to-br from-cyan-950/50 to-blue-950/50 cyber-border p-6">
                <h4 className="text-xl font-bold text-cyan-400 font-mono mb-4">SIMULATION RESULTS</h4>
                <p className="text-slate-300 font-mono text-sm mb-4">{results.simulation.simulation_summary}</p>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={results.simulation.outcome_distribution}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                      <XAxis dataKey="outcome" stroke="#64748b" style={{ fontSize: '10px', fontFamily: 'monospace' }} />
                      <YAxis stroke="#64748b" style={{ fontSize: '10px', fontFamily: 'monospace' }} />
                      <Tooltip />
                      <Legend wrapperStyle={{ fontFamily: 'monospace', fontSize: '11px' }} />
                      <Bar dataKey="probability" fill="#06b6d4" name="Probability %" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </Card>

              <Card className="bg-slate-900/50 cyber-border p-6">
                <h4 className="text-lg font-bold text-purple-400 font-mono mb-4">KEY SCENARIOS</h4>
                <div className="space-y-3">
                  {results.simulation.scenarios?.map((scenario, idx) => (
                    <div key={idx} className="bg-slate-950/50 cyber-border rounded p-4">
                      <div className="flex items-center justify-between mb-2">
                        <h5 className="text-md font-bold text-green-400 font-mono">{scenario.name}</h5>
                        <Badge className="bg-purple-500/20 text-purple-400 border-purple-500/30 font-mono">
                          {scenario.probability}%
                        </Badge>
                      </div>
                      <p className="text-slate-300 font-mono text-sm mb-2">{scenario.description}</p>
                      <div className="text-xs text-slate-400 font-mono">
                        Impact Score: <span className="text-orange-400">{scenario.impact_score}/100</span>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>

              <Card className="bg-slate-900/50 cyber-border p-6">
                <h4 className="text-lg font-bold text-green-400 font-mono mb-4">STRATEGIC RECOMMENDATIONS</h4>
                <ul className="space-y-2">
                  {results.simulation.recommendations?.map((rec, idx) => (
                    <li key={idx} className="flex items-start gap-2 text-slate-300 font-mono text-sm">
                      <FileText className="w-4 h-4 text-green-400 flex-shrink-0 mt-0.5" />
                      {rec}
                    </li>
                  ))}
                </ul>
              </Card>
            </div>
          )}
        </TabsContent>

        {/* Trend Forecasting Tab */}
        <TabsContent value="forecasting" className="mt-6">
          <TrendForecastingModule />
        </TabsContent>

        {/* What-If Scenario Builder Tab */}
        <TabsContent value="whatif" className="mt-6">
          <WhatIfScenarioBuilder />
        </TabsContent>

        {/* Key Event Predictor Tab */}
        <TabsContent value="predictor" className="mt-6">
          <KeyEventPredictor />
        </TabsContent>
      </Tabs>
    </Card>
  );
}