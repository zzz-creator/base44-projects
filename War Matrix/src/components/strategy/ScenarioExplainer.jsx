import React, { useEffect, useState } from 'react';
import { base44 } from '../../api/base44Client';
import { useMutation } from '@tanstack/react-query';
import { Card } from '../ui/card';
import { Badge } from '../ui/badge';
import { Lightbulb, AlertTriangle, TrendingUp, Info, Loader2 } from 'lucide-react';

export default function ScenarioExplainer({ scenario, aiSuggestions }) {
  const [explanation, setExplanation] = useState(null);

  const generateExplanationMutation = useMutation({
    mutationFn: async () => {
      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `You are an AI analyst providing clear explanations for complex geopolitical scenarios.

SCENARIO DETAILS:
${JSON.stringify(scenario, null, 2)}

${aiSuggestions ? `AI SUGGESTIONS PROVIDED:
${JSON.stringify(aiSuggestions, null, 2)}` : ''}

Provide a comprehensive explanation that includes:

1. KEY DRIVERS & ASSUMPTIONS
   - What are the primary forces driving this scenario?
   - What assumptions are being made?
   - What initial conditions matter most?

2. CASCADING EFFECTS
   - How do geopolitical changes cascade?
   - Economic domain impacts and feedback loops
   - Climate and environmental consequences
   - Social and humanitarian effects

3. RISK ASSESSMENT
   - Overall risk level (low, medium, high)
   - Specific risk factors with severity ratings
   - Likelihood of different outcomes
   - Critical decision points

4. AI REASONING (if suggestions were provided)
   - Why did the AI suggest specific events/policies?
   - What patterns or historical precedents informed suggestions?
   - How do suggestions address scenario vulnerabilities?

Make explanations clear, concise, and actionable for strategic decision-makers.`,
        response_json_schema: {
          type: "object",
          properties: {
            summary: { type: "string" },
            key_drivers: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  driver: { type: "string" },
                  importance: { type: "string" },
                  explanation: { type: "string" }
                }
              }
            },
            assumptions: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  assumption: { type: "string" },
                  validity: { type: "string" },
                  impact_if_wrong: { type: "string" }
                }
              }
            },
            cascading_effects: {
              type: "object",
              properties: {
                geopolitical: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      effect: { type: "string" },
                      timeline: { type: "string" },
                      probability: { type: "number" }
                    }
                  }
                },
                economic: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      effect: { type: "string" },
                      severity: { type: "string" },
                      affected_sectors: { type: "array", items: { type: "string" } }
                    }
                  }
                },
                climate: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      effect: { type: "string" },
                      timeframe: { type: "string" },
                      irreversibility_risk: { type: "string" }
                    }
                  }
                },
                humanitarian: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      effect: { type: "string" },
                      affected_population: { type: "number" },
                      urgency: { type: "string" }
                    }
                  }
                }
              }
            },
            risk_assessment: {
              type: "object",
              properties: {
                overall_risk_level: { type: "string" },
                risk_factors: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      factor: { type: "string" },
                      severity: { type: "string" },
                      likelihood: { type: "string" },
                      mitigation_options: { type: "array", items: { type: "string" } }
                    }
                  }
                },
                critical_decision_points: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      decision_point: { type: "string" },
                      timeframe: { type: "string" },
                      importance: { type: "string" }
                    }
                  }
                }
              }
            },
            ai_reasoning: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  suggestion_type: { type: "string" },
                  rationale: { type: "string" },
                  historical_precedent: { type: "string" },
                  expected_impact: { type: "string" }
                }
              }
            }
          }
        },
        add_context_from_internet: false
      });

      setExplanation(result);
      return result;
    }
  });

  useEffect(() => {
    if (scenario && !explanation) {
      generateExplanationMutation.mutate();
    }
  }, [scenario]);

  if (generateExplanationMutation.isPending) {
    return (
      <Card className="bg-slate-950/80 backdrop-blur-xl cyber-border p-6">
        <div className="flex items-center justify-center py-8">
          <div className="text-center space-y-3">
            <Loader2 className="w-8 h-8 text-purple-400 animate-spin mx-auto" />
            <p className="text-purple-400 font-mono text-sm">Generating scenario explanation...</p>
          </div>
        </div>
      </Card>
    );
  }

  if (!explanation) return null;

  const getRiskColor = (level) => {
    const colors = {
      'low': 'green',
      'medium': 'yellow',
      'high': 'red',
      'critical': 'red'
    };
    return colors[level?.toLowerCase()] || 'slate';
  };

  return (
    <div className="space-y-6">
      {/* Summary */}
      <Card className="bg-gradient-to-br from-purple-950/50 to-blue-950/50 backdrop-blur-xl cyber-border p-6">
        <div className="flex items-start gap-3 mb-3">
          <Info className="w-6 h-6 text-purple-400" />
          <h3 className="text-xl font-bold text-purple-400 glow-text font-mono">
            SCENARIO EXPLANATION
          </h3>
        </div>
        <p className="text-slate-300 font-mono text-sm">{explanation.summary}</p>
      </Card>

      {/* Risk Assessment */}
      {explanation.risk_assessment && (
        <Card className="bg-slate-950/80 backdrop-blur-xl cyber-border p-6">
          <div className="flex items-start gap-3 mb-4">
            <AlertTriangle className="w-6 h-6 text-red-400" />
            <div>
              <h3 className="text-xl font-bold text-red-400 glow-text font-mono">
                RISK ASSESSMENT
              </h3>
              <Badge className={`mt-2 bg-${getRiskColor(explanation.risk_assessment.overall_risk_level)}-500/20 text-${getRiskColor(explanation.risk_assessment.overall_risk_level)}-400 border-${getRiskColor(explanation.risk_assessment.overall_risk_level)}-500/30 font-mono text-lg py-1 px-3`}>
                {explanation.risk_assessment.overall_risk_level?.toUpperCase()} RISK
              </Badge>
            </div>
          </div>

          <div className="space-y-3">
            {explanation.risk_assessment.risk_factors?.map((risk, idx) => (
              <div key={idx} className={`bg-${getRiskColor(risk.severity)}-950/20 cyber-border rounded p-4`}>
                <div className="flex items-start justify-between mb-2">
                  <h4 className={`text-md font-bold text-${getRiskColor(risk.severity)}-400 font-mono`}>
                    {risk.factor}
                  </h4>
                  <div className="flex gap-2">
                    <Badge className={`bg-${getRiskColor(risk.severity)}-500/20 text-${getRiskColor(risk.severity)}-400 border-${getRiskColor(risk.severity)}-500/30 font-mono text-xs`}>
                      {risk.severity}
                    </Badge>
                    <Badge className="bg-purple-500/20 text-purple-400 border-purple-500/30 font-mono text-xs">
                      {risk.likelihood} likely
                    </Badge>
                  </div>
                </div>
                {risk.mitigation_options?.length > 0 && (
                  <div>
                    <div className="text-xs text-slate-500 font-mono mb-1">Mitigation Options:</div>
                    <ul className="space-y-1">
                      {risk.mitigation_options.map((option, i) => (
                        <li key={i} className="text-slate-400 font-mono text-xs flex items-start gap-2">
                          <span className="text-green-400">✓</span>
                          {option}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Key Drivers */}
      {explanation.key_drivers?.length > 0 && (
        <Card className="bg-slate-950/80 backdrop-blur-xl cyber-border p-6">
          <h3 className="text-xl font-bold text-cyan-400 glow-text font-mono mb-4">
            KEY DRIVERS & ASSUMPTIONS
          </h3>
          <div className="grid md:grid-cols-2 gap-3">
            {explanation.key_drivers.map((driver, idx) => (
              <div key={idx} className="bg-slate-900/50 cyber-border rounded p-3">
                <div className="flex items-start justify-between mb-2">
                  <h4 className="text-sm font-bold text-yellow-400 font-mono">{driver.driver}</h4>
                  <Badge className={`${driver.importance === 'HIGH' ? 'bg-red-500/20 text-red-400 border-red-500/30' : driver.importance === 'MEDIUM' ? 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30' : 'bg-green-500/20 text-green-400 border-green-500/30'} font-mono text-xs`}>
                    {driver.importance}
                  </Badge>
                </div>
                <p className="text-slate-400 font-mono text-xs">{driver.explanation}</p>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Cascading Effects */}
      {explanation.cascading_effects && (
        <Card className="bg-slate-950/80 backdrop-blur-xl cyber-border p-6">
          <div className="flex items-start gap-3 mb-4">
            <TrendingUp className="w-6 h-6 text-orange-400" />
            <h3 className="text-xl font-bold text-orange-400 glow-text font-mono">
              CASCADING EFFECTS
            </h3>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            {/* Geopolitical */}
            {explanation.cascading_effects.geopolitical?.length > 0 && (
              <div className="bg-purple-950/20 cyber-border rounded p-4">
                <h4 className="text-sm font-bold text-purple-400 font-mono mb-3">GEOPOLITICAL</h4>
                <div className="space-y-2">
                  {explanation.cascading_effects.geopolitical.map((effect, idx) => (
                    <div key={idx} className="text-xs">
                      <div className="flex items-start justify-between mb-1">
                        <span className="text-slate-300 font-mono">{effect.effect}</span>
                        <Badge className="bg-purple-500/20 text-purple-400 border-purple-500/30 font-mono text-xs">
                          {effect.probability}%
                        </Badge>
                      </div>
                      <div className="text-slate-500 font-mono">{effect.timeline}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Economic */}
            {explanation.cascading_effects.economic?.length > 0 && (
              <div className="bg-yellow-950/20 cyber-border rounded p-4">
                <h4 className="text-sm font-bold text-yellow-400 font-mono mb-3">ECONOMIC</h4>
                <div className="space-y-2">
                  {explanation.cascading_effects.economic.map((effect, idx) => (
                    <div key={idx} className="text-xs">
                      <div className="flex items-start justify-between mb-1">
                        <span className="text-slate-300 font-mono">{effect.effect}</span>
                        <Badge className={`bg-${getRiskColor(effect.severity)}-500/20 text-${getRiskColor(effect.severity)}-400 border-${getRiskColor(effect.severity)}-500/30 font-mono text-xs`}>
                          {effect.severity}
                        </Badge>
                      </div>
                      {effect.affected_sectors?.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-1">
                          {effect.affected_sectors.map((sector, i) => (
                            <span key={i} className="text-slate-500 font-mono text-xs">{sector}</span>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Climate */}
            {explanation.cascading_effects.climate?.length > 0 && (
              <div className="bg-blue-950/20 cyber-border rounded p-4">
                <h4 className="text-sm font-bold text-blue-400 font-mono mb-3">CLIMATE</h4>
                <div className="space-y-2">
                  {explanation.cascading_effects.climate.map((effect, idx) => (
                    <div key={idx} className="text-xs">
                      <div className="text-slate-300 font-mono mb-1">{effect.effect}</div>
                      <div className="flex items-center justify-between">
                        <span className="text-slate-500 font-mono">{effect.timeframe}</span>
                        <Badge className={`bg-${getRiskColor(effect.irreversibility_risk)}-500/20 text-${getRiskColor(effect.irreversibility_risk)}-400 border-${getRiskColor(effect.irreversibility_risk)}-500/30 font-mono text-xs`}>
                          {effect.irreversibility_risk} irreversibility
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Humanitarian */}
            {explanation.cascading_effects.humanitarian?.length > 0 && (
              <div className="bg-red-950/20 cyber-border rounded p-4">
                <h4 className="text-sm font-bold text-red-400 font-mono mb-3">HUMANITARIAN</h4>
                <div className="space-y-2">
                  {explanation.cascading_effects.humanitarian.map((effect, idx) => (
                    <div key={idx} className="text-xs">
                      <div className="text-slate-300 font-mono mb-1">{effect.effect}</div>
                      <div className="flex items-center justify-between">
                        <span className="text-slate-500 font-mono">
                          {(effect.affected_population / 1e6).toFixed(1)}M affected
                        </span>
                        <Badge className={`bg-${getRiskColor(effect.urgency)}-500/20 text-${getRiskColor(effect.urgency)}-400 border-${getRiskColor(effect.urgency)}-500/30 font-mono text-xs`}>
                          {effect.urgency} urgency
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </Card>
      )}

      {/* AI Reasoning */}
      {aiSuggestions && explanation.ai_reasoning?.length > 0 && (
        <Card className="bg-gradient-to-br from-green-950/50 to-cyan-950/50 backdrop-blur-xl cyber-border p-6">
          <div className="flex items-start gap-3 mb-4">
            <Lightbulb className="w-6 h-6 text-green-400" />
            <h3 className="text-xl font-bold text-green-400 glow-text font-mono">
              AI REASONING & SUGGESTIONS
            </h3>
          </div>
          <div className="space-y-3">
            {explanation.ai_reasoning.map((reasoning, idx) => (
              <div key={idx} className="bg-slate-900/50 cyber-border rounded p-4">
                <h4 className="text-md font-bold text-cyan-400 font-mono mb-2">{reasoning.suggestion_type}</h4>
                <div className="space-y-2 text-xs font-mono">
                  <div>
                    <span className="text-slate-500">Rationale: </span>
                    <span className="text-slate-300">{reasoning.rationale}</span>
                  </div>
                  {reasoning.historical_precedent && (
                    <div>
                      <span className="text-slate-500">Historical Precedent: </span>
                      <span className="text-purple-400">{reasoning.historical_precedent}</span>
                    </div>
                  )}
                  <div>
                    <span className="text-slate-500">Expected Impact: </span>
                    <span className="text-green-400">{reasoning.expected_impact}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}