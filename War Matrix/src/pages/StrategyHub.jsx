import React, { useState } from 'react';
import { base44 } from '../api/base44Client';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Card } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Brain, TrendingUp, Globe, AlertTriangle, Target, Loader2, Lightbulb, Shield, Zap, Bell, Boxes } from 'lucide-react';
import MatrixBackground from '../components/war/MatrixBackground';
import CustomScenarioBuilder from '../components/strategy/CustomScenarioBuilder';
import AIAnalystAssistant from '../components/strategy/AIAnalystAssistant';
import AIStrategyAdvisor from '../components/strategy/AIStrategyAdvisor';
import ComparativeScenarioChart from '../components/visualizations/ComparativeScenarioChart';
import ScenarioBranching from '../components/strategy/ScenarioBranching';
import AdvancedAnalysisSection from '../components/analysis/AdvancedAnalysisSection';
import ScenarioExplainer from '../components/strategy/ScenarioExplainer';
import EnhancedScenarioSimulator from '../components/strategy/EnhancedScenarioSimulator';
import EnhancedScenarioSharing from '../components/collaboration/EnhancedScenarioSharing';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

export default function StrategyHub() {
  const [analysis, setAnalysis] = useState(null);
  const [proactiveAlerts, setProactiveAlerts] = useState(null);
  const [customScenarioResults, setCustomScenarioResults] = useState(null);
  const [scenarioHistory, setScenarioHistory] = useState([]);
  const [activeSection, setActiveSection] = useState('overview');
  const [currentScenario, setCurrentScenario] = useState(null);
  const [allScenarios, setAllScenarios] = useState([]);
  const [scenarioComments, setScenarioComments] = useState([]);
  const [scenarioTasks, setScenarioTasks] = useState([]);

  const { data: wars } = useQuery({
    queryKey: ['wars', 'current'],
    queryFn: () => base44.entities.War.filter({ era: 'current', status: 'ongoing' }),
    initialData: [],
  });

  const generateAnalysisMutation = useMutation({
    mutationFn: async () => {
      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `You are a senior strategic advisor analyzing global conflict data. Provide a comprehensive strategic analysis.

CURRENT WARS DATA:
${wars.map(w => `- ${w.name}: ${w.description} (Casualties: ${w.casualties?.total || 'Unknown'})`).join('\n')}

Your analysis should include:
1. Global threat landscape assessment
2. Long-term geopolitical trends (5-10 year outlook)
3. Emerging conflict patterns and root causes
4. Power shift analysis (rising/declining powers)
5. Strategic recommendations for conflict prevention
6. Potential diplomatic initiatives
7. High-risk regions requiring attention
8. Economic implications of current conflicts
9. Technology and warfare evolution trends
10. Recommendations for policy makers

Provide actionable, high-level strategic insights suitable for decision-makers.`,
        response_json_schema: {
          type: "object",
          properties: {
            executive_summary: { type: "string" },
            global_threat_level: { type: "string" },
            stability_index: { type: "number" },
            long_term_trends: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  trend: { type: "string" },
                  description: { type: "string" },
                  impact: { type: "string" },
                  timeframe: { type: "string" }
                }
              }
            },
            conflict_patterns: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  pattern: { type: "string" },
                  examples: { type: "array", items: { type: "string" } },
                  root_causes: { type: "array", items: { type: "string" } }
                }
              }
            },
            power_shifts: {
              type: "object",
              properties: {
                rising_powers: { type: "array", items: { type: "string" } },
                declining_powers: { type: "array", items: { type: "string" } },
                analysis: { type: "string" }
              }
            },
            strategic_recommendations: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  category: { type: "string" },
                  recommendation: { type: "string" },
                  priority: { type: "string" },
                  expected_impact: { type: "string" }
                }
              }
            },
            diplomatic_initiatives: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  initiative: { type: "string" },
                  target_regions: { type: "array", items: { type: "string" } },
                  approach: { type: "string" },
                  success_factors: { type: "array", items: { type: "string" } }
                }
              }
            },
            high_risk_regions: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  region: { type: "string" },
                  risk_score: { type: "number" },
                  concerns: { type: "array", items: { type: "string" } },
                  mitigation_strategies: { type: "array", items: { type: "string" } }
                }
              }
            },
            economic_implications: {
              type: "object",
              properties: {
                global_impact: { type: "string" },
                trade_disruptions: { type: "array", items: { type: "string" } },
                resource_concerns: { type: "array", items: { type: "string" } },
                economic_forecast: { type: "string" }
              }
            },
            technology_trends: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  technology: { type: "string" },
                  military_application: { type: "string" },
                  geopolitical_impact: { type: "string" }
                }
              }
            },
            policy_recommendations: { type: "array", items: { type: "string" } }
          }
        },
        add_context_from_internet: true
      });

      setAnalysis(result);
      return result;
    }
  });

  const generateProactiveAlertsMutation = useMutation({
    mutationFn: async () => {
      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `You are an AI early warning system for geopolitical conflicts. Analyze current trends and generate PROACTIVE ALERTS for potential future flashpoints.

CURRENT CONTEXT:
${wars.map(w => `- ${w.name}: ${w.description}`).join('\n')}

Based on trend analysis, historical patterns, and current geopolitical dynamics, identify:

1. EMERGING FLASHPOINTS (Next 30-90 days)
   - Regions showing early warning signs
   - Trigger events that could spark conflict
   - Probability assessment
   - Recommended preventive actions

2. TREND-BASED ALERTS
   - Deteriorating situations
   - Escalation risks
   - Alliance shifts that could destabilize
   - Resource competition hotspots

3. AUTOMATED RECOMMENDATIONS
   - Immediate actions needed
   - Monitoring priorities
   - Diplomatic engagement suggestions
   - Military posture adjustments

Use real-time internet data. Be specific about locations, actors, and timeframes.`,
        response_json_schema: {
          type: "object",
          properties: {
            alert_summary: { type: "string" },
            overall_threat_trajectory: { type: "string" },
            emerging_flashpoints: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  location: { type: "string" },
                  region: { type: "string" },
                  alert_level: { type: "string" },
                  probability: { type: "number" },
                  timeframe: { type: "string" },
                  trigger_events: { type: "array", items: { type: "string" } },
                  involved_parties: { type: "array", items: { type: "string" } },
                  early_warning_signs: { type: "array", items: { type: "string" } },
                  potential_impact: { type: "string" },
                  preventive_actions: { type: "array", items: { type: "string" } }
                }
              }
            },
            trend_alerts: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  trend_type: { type: "string" },
                  description: { type: "string" },
                  severity: { type: "string" },
                  affected_regions: { type: "array", items: { type: "string" } },
                  analysis: { type: "string" }
                }
              }
            },
            automated_recommendations: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  action: { type: "string" },
                  urgency: { type: "string" },
                  target: { type: "string" },
                  expected_outcome: { type: "string" }
                }
              }
            },
            monitoring_priorities: { type: "array", items: { type: "string" } }
          }
        },
        add_context_from_internet: true
      });

      setProactiveAlerts(result);
      return result;
    }
  });

  const getPriorityColor = (priority) => {
    const colors = {
      'CRITICAL': 'bg-red-500/20 text-red-400 border-red-500/30',
      'HIGH': 'bg-orange-500/20 text-orange-400 border-orange-500/30',
      'MEDIUM': 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
      'LOW': 'bg-green-500/20 text-green-400 border-green-500/30'
    };
    return colors[priority] || colors['MEDIUM'];
  };

  return (
    <div className="relative min-h-screen">
      <MatrixBackground />
      
      <div className="relative z-10 p-8">
        <div className="max-w-7xl mx-auto space-y-6">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="flex items-center justify-center gap-3 mb-4">
              <Brain className="w-12 h-12 text-purple-400" />
              <h1 className="text-4xl font-bold text-purple-400 glow-text font-mono">
                STRATEGY HUB
              </h1>
            </div>
            <p className="text-cyan-400/70 font-mono text-sm">
              AI Strategic Advisor • Global Analysis • Proactive Threat Detection
            </p>
          </div>

          {/* Action Buttons */}
          {!analysis && !proactiveAlerts && (
            <div className="grid md:grid-cols-2 gap-6">
              <Card className="bg-slate-950/80 backdrop-blur-xl cyber-border p-8">
                <div className="text-center space-y-4">
                  <Brain className="w-16 h-16 text-purple-400 mx-auto" />
                  <h2 className="text-2xl font-bold text-green-400 glow-text font-mono">
                    STRATEGIC ANALYSIS
                  </h2>
                  <p className="text-slate-400 font-mono text-sm">
                    Generate comprehensive strategic analysis by synthesizing data from active wars, 
                    simulations, predictions, and global intelligence.
                  </p>
                  <Button
                    onClick={() => generateAnalysisMutation.mutate()}
                    disabled={generateAnalysisMutation.isPending || wars.length === 0}
                    className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-mono text-lg py-6 px-8"
                  >
                    {generateAnalysisMutation.isPending ? (
                      <>
                        <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                        ANALYZING...
                      </>
                    ) : (
                      <>
                        <Zap className="w-5 h-5 mr-2" />
                        GENERATE ANALYSIS
                      </>
                    )}
                  </Button>
                </div>
              </Card>

              <Card className="bg-slate-950/80 backdrop-blur-xl cyber-border p-8">
                <div className="text-center space-y-4">
                  <Bell className="w-16 h-16 text-red-400 mx-auto animate-pulse" />
                  <h2 className="text-2xl font-bold text-red-400 glow-text font-mono">
                    PROACTIVE ALERTS
                  </h2>
                  <p className="text-slate-400 font-mono text-sm">
                    AI-powered early warning system that identifies emerging flashpoints 
                    and generates automated recommendations based on trend analysis.
                  </p>
                  <Button
                    onClick={() => generateProactiveAlertsMutation.mutate()}
                    disabled={generateProactiveAlertsMutation.isPending}
                    className="bg-gradient-to-r from-red-500 to-orange-500 hover:from-red-600 hover:to-orange-600 text-white font-mono text-lg py-6 px-8"
                  >
                    {generateProactiveAlertsMutation.isPending ? (
                      <>
                        <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                        ANALYZING THREATS...
                      </>
                    ) : (
                      <>
                        <Bell className="w-5 h-5 mr-2" />
                        GENERATE ALERTS
                      </>
                    )}
                  </Button>
                </div>
              </Card>
            </div>
          )}

          {/* Proactive Alerts Display */}
          {proactiveAlerts && (
            <div className="space-y-6 animate-in fade-in duration-500">
              <Card className="bg-gradient-to-br from-red-950/50 to-orange-950/50 backdrop-blur-xl cyber-border p-6">
                <div className="flex items-center gap-3 mb-4">
                  <Bell className="w-8 h-8 text-red-400 animate-pulse" />
                  <div>
                    <h2 className="text-2xl font-bold text-red-400 glow-text font-mono">
                      PROACTIVE THREAT ALERTS
                    </h2>
                    <p className="text-orange-400 text-sm font-mono mt-1">Early Warning System Active</p>
                  </div>
                </div>
                <p className="text-slate-300 font-mono text-sm mb-4">{proactiveAlerts.alert_summary}</p>
                <Badge className="bg-red-500/20 text-red-400 border-red-500/30 font-mono">
                  THREAT TRAJECTORY: {proactiveAlerts.overall_threat_trajectory}
                </Badge>
              </Card>

              {/* Emerging Flashpoints */}
              <Card className="bg-slate-950/80 backdrop-blur-xl cyber-border p-6">
                <h3 className="text-xl font-bold text-red-400 glow-text font-mono mb-4 flex items-center gap-2">
                  <AlertTriangle className="w-6 h-6 animate-pulse" />
                  EMERGING FLASHPOINTS (Next 30-90 Days)
                </h3>
                <div className="space-y-4">
                  {proactiveAlerts.emerging_flashpoints?.map((flashpoint, idx) => (
                    <div key={idx} className="bg-slate-900/50 cyber-border rounded-lg p-4 border-l-4 border-red-500">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <h4 className="text-lg font-bold text-yellow-400 font-mono mb-1">{flashpoint.location}</h4>
                          <Badge variant="outline" className="border-slate-500/30 text-slate-400 font-mono text-xs mb-2">
                            {flashpoint.region}
                          </Badge>
                        </div>
                        <div className="flex flex-col items-end gap-2">
                          <Badge className={getPriorityColor(flashpoint.alert_level)} font-mono text-xs>
                            {flashpoint.alert_level}
                          </Badge>
                          <div className="text-right">
                            <div className="text-2xl font-bold text-red-400 font-mono">{flashpoint.probability}%</div>
                            <div className="text-xs text-slate-400 font-mono">Probability</div>
                          </div>
                        </div>
                      </div>

                      <div className="mb-3">
                        <Badge className="bg-purple-500/20 text-purple-400 border-purple-500/30 font-mono text-xs">
                          TIMEFRAME: {flashpoint.timeframe}
                        </Badge>
                      </div>

                      <div className="mb-3 p-3 bg-red-950/20 cyber-border rounded">
                        <h5 className="text-xs font-bold text-red-400 font-mono mb-2">TRIGGER EVENTS</h5>
                        <ul className="space-y-1">
                          {flashpoint.trigger_events?.map((event, i) => (
                            <li key={i} className="text-slate-400 font-mono text-xs flex items-start gap-2">
                              <span className="text-red-400">▸</span>
                              {event}
                            </li>
                          ))}
                        </ul>
                      </div>

                      <div className="mb-3 p-3 bg-yellow-950/20 cyber-border rounded">
                        <h5 className="text-xs font-bold text-yellow-400 font-mono mb-2">EARLY WARNING SIGNS</h5>
                        <ul className="space-y-1">
                          {flashpoint.early_warning_signs?.map((sign, i) => (
                            <li key={i} className="text-slate-400 font-mono text-xs flex items-start gap-2">
                              <span className="text-yellow-400">⚠</span>
                              {sign}
                            </li>
                          ))}
                        </ul>
                      </div>

                      <div className="mb-3">
                        <h5 className="text-xs font-bold text-cyan-400 font-mono mb-2">INVOLVED PARTIES</h5>
                        <div className="flex flex-wrap gap-2">
                          {flashpoint.involved_parties?.map((party, i) => (
                            <Badge key={i} variant="outline" className="border-cyan-500/30 text-cyan-400 font-mono text-xs">
                              {party}
                            </Badge>
                          ))}
                        </div>
                      </div>

                      <div className="mb-3 p-3 bg-slate-950/50 cyber-border rounded">
                        <h5 className="text-xs font-bold text-orange-400 font-mono mb-2">POTENTIAL IMPACT</h5>
                        <p className="text-slate-400 font-mono text-xs">{flashpoint.potential_impact}</p>
                      </div>

                      <div className="p-3 bg-green-950/20 cyber-border rounded">
                        <h5 className="text-xs font-bold text-green-400 font-mono mb-2 flex items-center gap-2">
                          <Shield className="w-3 h-3" />
                          PREVENTIVE ACTIONS
                        </h5>
                        <ul className="space-y-1">
                          {flashpoint.preventive_actions?.map((action, i) => (
                            <li key={i} className="text-slate-400 font-mono text-xs flex items-start gap-2">
                              <span className="text-green-400">✓</span>
                              {action}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>

              {/* Trend Alerts */}
              <Card className="bg-slate-950/80 backdrop-blur-xl cyber-border p-6">
                <h3 className="text-xl font-bold text-orange-400 glow-text font-mono mb-4">
                  TREND-BASED ALERTS
                </h3>
                <div className="space-y-3">
                  {proactiveAlerts.trend_alerts?.map((alert, idx) => (
                    <div key={idx} className="bg-slate-900/50 cyber-border rounded-lg p-4">
                      <div className="flex items-start justify-between mb-2">
                        <h4 className="text-md font-bold text-yellow-400 font-mono">{alert.trend_type}</h4>
                        <Badge className={getPriorityColor(alert.severity)} font-mono text-xs>
                          {alert.severity}
                        </Badge>
                      </div>
                      <p className="text-slate-400 font-mono text-sm mb-2">{alert.description}</p>
                      <div className="mb-2">
                        <span className="text-xs text-slate-500 font-mono">Affected Regions: </span>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {alert.affected_regions?.map((region, i) => (
                            <Badge key={i} variant="outline" className="border-orange-500/30 text-orange-400 font-mono text-xs">
                              {region}
                            </Badge>
                          ))}
                        </div>
                      </div>
                      <div className="pt-2 border-t border-slate-700/30">
                        <p className="text-slate-400 font-mono text-xs">{alert.analysis}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>

              {/* Automated Recommendations */}
              <Card className="bg-gradient-to-br from-green-950/50 to-cyan-950/50 backdrop-blur-xl cyber-border p-6">
                <h3 className="text-xl font-bold text-green-400 glow-text font-mono mb-4 flex items-center gap-2">
                  <Lightbulb className="w-6 h-6" />
                  AUTOMATED RECOMMENDATIONS
                </h3>
                <div className="space-y-3">
                  {proactiveAlerts.automated_recommendations?.map((rec, idx) => (
                    <div key={idx} className="bg-slate-900/50 cyber-border rounded-lg p-4">
                      <div className="flex items-start justify-between mb-2">
                        <h4 className="text-md font-bold text-cyan-400 font-mono flex-1">{rec.action}</h4>
                        <Badge className={getPriorityColor(rec.urgency)} font-mono text-xs ml-2>
                          {rec.urgency}
                        </Badge>
                      </div>
                      <div className="mb-2">
                        <span className="text-xs text-slate-500 font-mono">Target: </span>
                        <span className="text-slate-300 font-mono text-sm">{rec.target}</span>
                      </div>
                      <div className="pt-2 border-t border-slate-700/30">
                        <span className="text-xs text-slate-500 font-mono">Expected Outcome: </span>
                        <span className="text-green-400 font-mono text-sm">{rec.expected_outcome}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>

              {/* Monitoring Priorities */}
              <Card className="bg-slate-950/80 backdrop-blur-xl cyber-border p-6">
                <h3 className="text-lg font-bold text-purple-400 glow-text font-mono mb-4">
                  MONITORING PRIORITIES
                </h3>
                <div className="grid md:grid-cols-2 gap-2">
                  {proactiveAlerts.monitoring_priorities?.map((priority, idx) => (
                    <div key={idx} className="bg-slate-900/50 cyber-border rounded p-3">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-purple-400 rounded-full"></div>
                        <span className="text-slate-300 font-mono text-sm">{priority}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>

              {/* Regenerate Button */}
              <div className="flex gap-4">
                <Button
                  onClick={() => generateProactiveAlertsMutation.mutate()}
                  disabled={generateProactiveAlertsMutation.isPending}
                  className="flex-1 bg-gradient-to-r from-red-500 to-orange-500 hover:from-red-600 hover:to-orange-600 text-white font-mono py-6"
                >
                  {generateProactiveAlertsMutation.isPending ? (
                    <>
                      <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                      UPDATING ALERTS...
                    </>
                  ) : (
                    <>
                      <Bell className="w-5 h-5 mr-2" />
                      REFRESH ALERTS
                    </>
                  )}
                </Button>
                <Button
                  onClick={() => setProactiveAlerts(null)}
                  variant="outline"
                  className="border-slate-500/30 text-slate-400 hover:bg-slate-800 font-mono py-6"
                >
                  CLEAR
                </Button>
              </div>
            </div>
          )}

          {/* Custom Scenario Builder */}
          {!analysis && !proactiveAlerts && !customScenarioResults && (
            <Card className="bg-slate-950/80 backdrop-blur-xl cyber-border p-8 mt-6">
              <div className="text-center space-y-4">
                <Boxes className="w-16 h-16 text-cyan-400 mx-auto" />
                <h2 className="text-2xl font-bold text-cyan-400 glow-text font-mono">
                  CUSTOM SCENARIO BUILDER
                </h2>
                <p className="text-slate-400 font-mono text-sm max-w-2xl mx-auto">
                  Create and simulate custom strategic scenarios with hypothetical geopolitical events, 
                  policy changes, and resource distributions
                </p>
                <CustomScenarioBuilder 
                  onResultsGenerated={(results, scenarioInputs, aiSuggestions) => {
                    setCustomScenarioResults({
                      ...results,
                      scenarioInputs,
                      aiSuggestions
                    });
                  }} 
                />
              </div>
            </Card>
          )}

          {/* AI Assistant */}
          {(customScenarioResults || wars.length > 0) && (
            <AIAnalystAssistant scenarioData={customScenarioResults} warData={wars} />
          )}

          {/* AI Strategy Advisor */}
          {customScenarioResults && (
            <AIStrategyAdvisor 
              scenarioData={customScenarioResults.scenarioInputs}
              simulationResults={customScenarioResults}
              autoAnalyze={true}
            />
          )}

          {/* Scenario Branching */}
          {(customScenarioResults || allScenarios.length > 0) && (
            <ScenarioBranching
              scenarios={allScenarios}
              currentScenario={currentScenario}
              onCreateBranch={(branchData) => {
                const newScenario = {
                  id: Date.now(),
                  ...branchData,
                  results: customScenarioResults
                };
                setAllScenarios([...allScenarios, newScenario]);
                setCurrentScenario(newScenario);
              }}
              onSwitchScenario={(scenario) => {
                setCurrentScenario(scenario);
                setCustomScenarioResults(scenario.results);
              }}
            />
          )}

          {/* Comparative Visualization */}
          {scenarioHistory.length >= 2 && (
            <ComparativeScenarioChart scenarios={scenarioHistory} linkedScenarios={allScenarios} />
          )}

          {/* Custom Scenario Results */}
          {customScenarioResults && (
            <div className="space-y-6 animate-in fade-in duration-500">
              {/* Scenario Explainer */}
              <ScenarioExplainer 
                scenario={customScenarioResults.scenarioInputs} 
                aiSuggestions={customScenarioResults.aiSuggestions}
              />

              <Card className="bg-gradient-to-br from-cyan-950/50 to-blue-950/50 backdrop-blur-xl cyber-border p-6">
                <h2 className="text-2xl font-bold text-cyan-400 glow-text font-mono mb-3">
                  {customScenarioResults.scenario_summary}
                </h2>
                <p className="text-slate-300 font-mono text-sm">{customScenarioResults.overall_assessment}</p>
              </Card>

              {customScenarioResults.immediate_outcomes?.length > 0 && (
                <Card className="bg-slate-950/80 backdrop-blur-xl cyber-border p-6">
                  <h3 className="text-xl font-bold text-green-400 glow-text font-mono mb-4">
                    IMMEDIATE OUTCOMES (0-1 Year)
                  </h3>
                  <div className="space-y-3">
                    {customScenarioResults.immediate_outcomes.map((outcome, idx) => (
                      <div key={idx} className="bg-slate-900/50 cyber-border rounded-lg p-4">
                        <div className="flex items-start justify-between mb-2">
                          <h4 className="text-md font-bold text-yellow-400 font-mono">{outcome.outcome}</h4>
                          <Badge className="bg-purple-500/20 text-purple-400 border-purple-500/30 font-mono">
                            {outcome.probability}% Probability
                          </Badge>
                        </div>
                        <div className="grid md:grid-cols-2 gap-3">
                          <div className="p-2 bg-blue-950/20 cyber-border rounded">
                            <div className="text-xs text-slate-500 font-mono mb-1">Impact Score</div>
                            <div className="text-xl font-bold text-blue-400 font-mono">{outcome.impact_score}/100</div>
                          </div>
                          <div className="p-2 bg-cyan-950/20 cyber-border rounded">
                            <div className="text-xs text-slate-500 font-mono mb-1">Affected Regions</div>
                            <div className="flex flex-wrap gap-1">
                              {outcome.affected_regions?.map((region, i) => (
                                <Badge key={i} variant="outline" className="border-cyan-500/30 text-cyan-400 font-mono text-xs">
                                  {region}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </Card>
              )}

              {customScenarioResults.conflict_escalations?.length > 0 && (
                <Card className="bg-slate-950/80 backdrop-blur-xl cyber-border p-6">
                  <h3 className="text-xl font-bold text-red-400 glow-text font-mono mb-4 flex items-center gap-2">
                    <AlertTriangle className="w-6 h-6" />
                    POTENTIAL CONFLICT ESCALATIONS
                  </h3>
                  <div className="space-y-4">
                    {customScenarioResults.conflict_escalations.map((conflict, idx) => (
                      <div key={idx} className="bg-slate-900/50 cyber-border rounded-lg p-4 border-l-4 border-red-500">
                        <div className="flex items-start justify-between mb-3">
                          <h4 className="text-lg font-bold text-yellow-400 font-mono">{conflict.conflict_name}</h4>
                          <Badge className="bg-red-500/20 text-red-400 border-red-500/30 font-mono">
                            {conflict.escalation_probability}% Risk
                          </Badge>
                        </div>
                        <div className="grid md:grid-cols-2 gap-3">
                          <div className="p-2 bg-red-950/20 cyber-border rounded">
                            <div className="text-xs text-slate-500 font-mono mb-1">Potential Casualties</div>
                            <div className="text-lg font-bold text-red-400 font-mono">
                              {conflict.potential_casualties?.toLocaleString()}
                            </div>
                          </div>
                          <div className="p-2 bg-orange-950/20 cyber-border rounded">
                            <div className="text-xs text-slate-500 font-mono mb-1">Economic Cost</div>
                            <div className="text-lg font-bold text-orange-400 font-mono">
                              ${conflict.economic_cost_billions}B
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </Card>
              )}

              {customScenarioResults.regional_stability?.length > 0 && (
                <Card className="bg-slate-950/80 backdrop-blur-xl cyber-border p-6">
                  <h3 className="text-xl font-bold text-purple-400 glow-text font-mono mb-4">
                    REGIONAL STABILITY CHANGES
                  </h3>
                  <div className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={customScenarioResults.regional_stability}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                        <XAxis dataKey="region" stroke="#94a3b8" style={{ fontFamily: 'monospace', fontSize: '11px' }} />
                        <YAxis stroke="#94a3b8" style={{ fontFamily: 'monospace', fontSize: '11px' }} domain={[0, 100]} />
                        <Tooltip />
                        <Legend wrapperStyle={{ fontFamily: 'monospace' }} />
                        <Bar dataKey="baseline_stability" fill="#06b6d4" name="Baseline" />
                        <Bar dataKey="projected_stability" fill="#a855f7" name="Projected" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </Card>
              )}

              {/* Enhanced Scenario Simulator */}
              {customScenarioResults?.scenarioInputs && (
                <EnhancedScenarioSimulator
                  baseScenario={customScenarioResults.scenarioInputs}
                  onSimulationComplete={(simResults) => {
                    setCustomScenarioResults({
                      ...customScenarioResults,
                      enhancedSimulation: simResults
                    });
                  }}
                />
              )}

              {/* Enhanced Collaboration Features */}
              {customScenarioResults && (
                <EnhancedScenarioSharing
                  scenario={{
                    id: currentScenario?.id || Date.now(),
                    name: customScenarioResults.scenario_summary,
                    description: customScenarioResults.overall_assessment,
                    timestamp: new Date().toISOString(),
                    version: currentScenario?.version || 1,
                    history: currentScenario?.history || []
                  }}
                  comments={scenarioComments}
                  tasks={scenarioTasks}
                  onShare={(shareData) => {
                    console.log('Sharing scenario with permissions:', shareData);
                    // In a real app, this would call an API to share
                  }}
                  onComment={(comment) => {
                    setScenarioComments([...scenarioComments, {
                      ...comment,
                      author: 'current-user@email.com',
                      timestamp: new Date().toISOString()
                    }]);
                  }}
                  onTaskCreate={(task) => {
                    setScenarioTasks([...scenarioTasks, task]);
                  }}
                  onTaskUpdate={(taskId, updatedTask) => {
                    setScenarioTasks(scenarioTasks.map(t => t.id === taskId ? updatedTask : t));
                  }}
                />
              )}

              <div className="flex gap-4">
                <Button
                  onClick={() => {
                    const scenario = {
                      id: Date.now(),
                      name: customScenarioResults.scenario_summary || 'Scenario',
                      description: customScenarioResults.overall_assessment || '',
                      results: customScenarioResults,
                      timestamp: new Date().toISOString(),
                      parentId: currentScenario?.id || null,
                      version: 1,
                      history: []
                    };
                    setScenarioHistory(prev => [...prev, customScenarioResults]);
                    setAllScenarios(prev => [...prev, scenario]);
                    setCurrentScenario(scenario);
                    setCustomScenarioResults(null);
                    setScenarioComments([]);
                    setScenarioTasks([]);
                  }}
                  variant="outline"
                  className="flex-1 border-slate-500/30 text-slate-400 hover:bg-slate-800 font-mono py-6"
                >
                  SAVE & BUILD NEW
                </Button>
                {scenarioHistory.length > 0 && (
                  <Button
                    onClick={() => {
                      setScenarioHistory([]);
                      setAllScenarios([]);
                      setCurrentScenario(null);
                    }}
                    variant="outline"
                    className="border-red-500/30 text-red-400 hover:bg-red-900/20 font-mono py-6"
                  >
                    CLEAR ALL ({scenarioHistory.length})
                  </Button>
                )}
              </div>
            </div>
          )}
          </div>
          </div>

          {/* Advanced Analysis Integration */}
          <AdvancedAnalysisSection />
          </div>
          );
          }