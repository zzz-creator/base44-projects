import React, { useState } from 'react';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Textarea } from '../ui/textarea';
import { Badge } from '../ui/badge';
import { Slider } from '../ui/slider';
import { Zap, Loader2, Plus, X, Lightbulb } from 'lucide-react';
import { base44 } from '../../api/base44Client';
import { useMutation } from '@tanstack/react-query';

export default function CustomScenarioBuilder({ onResultsGenerated }) {
  const [scenario, setScenario] = useState({
    title: '',
    description: '',
    geopolitical_events: [],
    policy_changes: [],
    resource_distributions: [],
    timeframe: '5 years'
  });

  const [newEvent, setNewEvent] = useState({ text: '', intensity: 50 });
  const [newPolicy, setNewPolicy] = useState({ text: '', impact: 50 });
  const [newResource, setNewResource] = useState({ resource: '', region: '', amount: 50 });
  const [aiSuggestions, setAiSuggestions] = useState([]);

  const generateSuggestionsMutation = useMutation({
    mutationFn: async () => {
      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `You are an AI strategic advisor. Based on current global trends and the user's scenario context, suggest plausible geopolitical events and policy changes.

CURRENT SCENARIO CONTEXT:
${JSON.stringify(scenario)}

Provide 3-4 relevant suggestions for each category that would create realistic and interesting scenario variations.
Consider current global tensions, economic trends, climate patterns, and technological developments.`,
        response_json_schema: {
          type: "object",
          properties: {
            geopolitical_events: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  event: { type: "string" },
                  rationale: { type: "string" },
                  suggested_intensity: { type: "number" }
                }
              }
            },
            policy_changes: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  policy: { type: "string" },
                  rationale: { type: "string" },
                  suggested_impact: { type: "number" }
                }
              }
            },
            resource_changes: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  resource: { type: "string" },
                  region: { type: "string" },
                  rationale: { type: "string" }
                }
              }
            }
          }
        },
        add_context_from_internet: true
      });

      setAiSuggestions(result);
      return result;
    }
  });

  const generateScenarioMutation = useMutation({
    mutationFn: async () => {
      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `You are a strategic geopolitical simulator. Analyze this custom scenario and generate detailed predictions.

CUSTOM SCENARIO:
Title: ${scenario.title}
Description: ${scenario.description}
Timeframe: ${scenario.timeframe}

HYPOTHETICAL INPUTS:
Geopolitical Events: ${scenario.geopolitical_events.map(e => `${e.text} (Intensity: ${e.intensity}/100)`).join(', ')}
Policy Changes: ${scenario.policy_changes.map(p => `${p.text} (Impact: ${p.impact}/100)`).join(', ')}
Resource Distribution Changes: ${scenario.resource_distributions.map(r => `${r.resource} in ${r.region}: ${r.amount}% allocation`).join(', ')}

Generate comprehensive analysis including:
1. Immediate outcomes (0-1 year)
2. Medium-term effects (1-3 years)
3. Long-term consequences (3+ years)
4. Potential conflict escalations
5. Economic impacts
6. Regional stability changes
7. Strategic recommendations
8. Risk mitigation strategies
9. Probability of different outcomes
10. Critical decision points

Use real-world geopolitical knowledge and historical patterns.`,
        response_json_schema: {
          type: "object",
          properties: {
            scenario_summary: { type: "string" },
            overall_assessment: { type: "string" },
            immediate_outcomes: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  outcome: { type: "string" },
                  probability: { type: "number" },
                  impact_score: { type: "number" },
                  affected_regions: { type: "array", items: { type: "string" } }
                }
              }
            },
            medium_term_effects: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  effect: { type: "string" },
                  likelihood: { type: "string" },
                  severity: { type: "string" }
                }
              }
            },
            long_term_consequences: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  consequence: { type: "string" },
                  timeframe: { type: "string" },
                  reversibility: { type: "string" }
                }
              }
            },
            conflict_escalations: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  conflict_name: { type: "string" },
                  escalation_probability: { type: "number" },
                  trigger_events: { type: "array", items: { type: "string" } },
                  potential_casualties: { type: "number" },
                  economic_cost_billions: { type: "number" }
                }
              }
            },
            economic_impacts: {
              type: "object",
              properties: {
                global_gdp_change: { type: "number" },
                trade_disruptions: { type: "array", items: { type: "string" } },
                commodity_price_changes: { type: "array", items: { type: "object", properties: { commodity: { type: "string" }, change_percent: { type: "number" } } } },
                currency_impacts: { type: "string" }
              }
            },
            regional_stability: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  region: { type: "string" },
                  baseline_stability: { type: "number" },
                  projected_stability: { type: "number" },
                  stability_change: { type: "number" }
                }
              }
            },
            strategic_recommendations: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  recommendation: { type: "string" },
                  priority: { type: "string" },
                  implementation_difficulty: { type: "string" },
                  expected_effectiveness: { type: "number" }
                }
              }
            },
            risk_mitigation: { type: "array", items: { type: "string" } },
            outcome_probabilities: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  outcome: { type: "string" },
                  probability: { type: "number" }
                }
              }
            },
            critical_decision_points: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  timeframe: { type: "string" },
                  decision: { type: "string" },
                  importance: { type: "string" }
                }
              }
            }
          }
        },
        add_context_from_internet: true
      });

      onResultsGenerated(result, scenario, suggestions);
      return result;
    }
  });

  const addEvent = () => {
    if (newEvent.text.trim()) {
      setScenario({
        ...scenario,
        geopolitical_events: [...scenario.geopolitical_events, newEvent]
      });
      setNewEvent({ text: '', intensity: 50 });
    }
  };

  const addPolicy = () => {
    if (newPolicy.text.trim()) {
      setScenario({
        ...scenario,
        policy_changes: [...scenario.policy_changes, newPolicy]
      });
      setNewPolicy({ text: '', impact: 50 });
    }
  };

  const applySuggestion = (type, suggestion) => {
    if (type === 'event') {
      setNewEvent({ text: suggestion.event, intensity: suggestion.suggested_intensity || 50 });
    } else if (type === 'policy') {
      setNewPolicy({ text: suggestion.policy, impact: suggestion.suggested_impact || 50 });
    } else if (type === 'resource') {
      setNewResource({ resource: suggestion.resource, region: suggestion.region, amount: 50 });
    }
  };

  const addResource = () => {
    if (newResource.resource.trim() && newResource.region.trim()) {
      setScenario({
        ...scenario,
        resource_distributions: [...scenario.resource_distributions, { ...newResource }]
      });
      setNewResource({ resource: '', region: '', amount: 50 });
    }
  };

  const removeItem = (type, index) => {
    setScenario({
      ...scenario,
      [type]: scenario[type].filter((_, i) => i !== index)
    });
  };

  const isScenarioValid = scenario.title && scenario.description && 
    (scenario.geopolitical_events.length > 0 || scenario.policy_changes.length > 0 || scenario.resource_distributions.length > 0);

  return (
    <Card className="bg-slate-950/80 backdrop-blur-xl cyber-border p-6">
      <h2 className="text-2xl font-bold text-cyan-400 glow-text font-mono mb-4">
        CUSTOM SCENARIO BUILDER
      </h2>

      <div className="space-y-6">
        <div>
          <label className="text-slate-300 font-mono text-sm mb-2 block">Scenario Title</label>
          <Input
            placeholder="e.g., South China Sea Resource Competition 2030"
            value={scenario.title}
            onChange={(e) => setScenario({...scenario, title: e.target.value})}
            className="bg-slate-900/50 border-cyan-500/30 text-cyan-400 font-mono"
          />
        </div>

        <div>
          <label className="text-slate-300 font-mono text-sm mb-2 block">Scenario Description</label>
          <Textarea
            placeholder="Describe the hypothetical geopolitical situation..."
            value={scenario.description}
            onChange={(e) => setScenario({...scenario, description: e.target.value})}
            className="bg-slate-900/50 border-cyan-500/30 text-cyan-400 font-mono h-24"
          />
        </div>

        <div>
          <label className="text-slate-300 font-mono text-sm mb-2 block">Analysis Timeframe</label>
          <select
            value={scenario.timeframe}
            onChange={(e) => setScenario({...scenario, timeframe: e.target.value})}
            className="w-full bg-slate-900/50 border border-cyan-500/30 text-cyan-400 font-mono p-2 rounded"
          >
            <option value="1 year">1 Year</option>
            <option value="3 years">3 Years</option>
            <option value="5 years">5 Years</option>
            <option value="10 years">10 Years</option>
          </select>
        </div>

        {/* AI Suggestions */}
        <div className="flex justify-end">
          <Button
            onClick={() => generateSuggestionsMutation.mutate()}
            disabled={generateSuggestionsMutation.isPending}
            className="bg-purple-500/20 hover:bg-purple-500/30 text-purple-400 border border-purple-500/30 font-mono"
          >
            {generateSuggestionsMutation.isPending ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                GENERATING...
              </>
            ) : (
              <>
                <Lightbulb className="w-4 h-4 mr-2" />
                GET AI SUGGESTIONS
              </>
            )}
          </Button>
        </div>

        {/* Geopolitical Events */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-slate-300 font-mono text-sm">Hypothetical Geopolitical Events</label>
          </div>
          <div className="space-y-2 mb-2">
            <Input
              placeholder="e.g., Major trade agreement collapses"
              value={newEvent.text}
              onChange={(e) => setNewEvent({...newEvent, text: e.target.value})}
              onKeyPress={(e) => e.key === 'Enter' && addEvent()}
              className="bg-slate-900/50 border-green-500/30 text-green-400 font-mono"
            />
            <div className="flex items-center gap-3">
              <label className="text-slate-400 font-mono text-xs flex-shrink-0">Intensity: {newEvent.intensity}%</label>
              <Slider
                value={[newEvent.intensity]}
                onValueChange={(v) => setNewEvent({...newEvent, intensity: v[0]})}
                max={100}
                step={10}
                className="flex-1"
              />
              <Button onClick={addEvent} className="bg-green-500/20 hover:bg-green-500/30 text-green-400 border border-green-500/30">
                <Plus className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {aiSuggestions?.geopolitical_events && (
            <div className="mb-2 p-3 bg-purple-950/20 cyber-border rounded">
              <div className="text-xs text-purple-400 font-mono mb-2 font-bold">AI SUGGESTIONS:</div>
              <div className="space-y-1">
                {aiSuggestions.geopolitical_events.map((sug, i) => (
                  <button
                    key={i}
                    onClick={() => applySuggestion('event', sug)}
                    className="w-full text-left p-2 bg-slate-900/50 hover:bg-slate-800/50 cyber-border rounded text-xs font-mono text-slate-300 transition-colors"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <span>{sug.event}</span>
                      <Badge className="bg-purple-500/20 text-purple-400 border-purple-500/30 text-xs shrink-0">
                        {sug.suggested_intensity}%
                      </Badge>
                    </div>
                    <div className="text-xs text-slate-500 mt-1">{sug.rationale}</div>
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="flex flex-wrap gap-2">
            {scenario.geopolitical_events.map((event, idx) => (
              <Badge key={idx} className="bg-green-500/20 text-green-400 border-green-500/30 font-mono text-xs pr-1">
                {event.text} ({event.intensity}%)
                <button onClick={() => removeItem('geopolitical_events', idx)} className="ml-2">
                  <X className="w-3 h-3" />
                </button>
              </Badge>
            ))}
          </div>
        </div>

        {/* Policy Changes */}
        <div>
          <label className="text-slate-300 font-mono text-sm mb-2 block">Policy Changes</label>
          <div className="space-y-2 mb-2">
            <Input
              placeholder="e.g., Carbon tax implemented globally"
              value={newPolicy.text}
              onChange={(e) => setNewPolicy({...newPolicy, text: e.target.value})}
              onKeyPress={(e) => e.key === 'Enter' && addPolicy()}
              className="bg-slate-900/50 border-purple-500/30 text-purple-400 font-mono"
            />
            <div className="flex items-center gap-3">
              <label className="text-slate-400 font-mono text-xs flex-shrink-0">Impact: {newPolicy.impact}%</label>
              <Slider
                value={[newPolicy.impact]}
                onValueChange={(v) => setNewPolicy({...newPolicy, impact: v[0]})}
                max={100}
                step={10}
                className="flex-1"
              />
              <Button onClick={addPolicy} className="bg-purple-500/20 hover:bg-purple-500/30 text-purple-400 border border-purple-500/30">
                <Plus className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {aiSuggestions?.policy_changes && (
            <div className="mb-2 p-3 bg-purple-950/20 cyber-border rounded">
              <div className="text-xs text-purple-400 font-mono mb-2 font-bold">AI SUGGESTIONS:</div>
              <div className="space-y-1">
                {aiSuggestions.policy_changes.map((sug, i) => (
                  <button
                    key={i}
                    onClick={() => applySuggestion('policy', sug)}
                    className="w-full text-left p-2 bg-slate-900/50 hover:bg-slate-800/50 cyber-border rounded text-xs font-mono text-slate-300 transition-colors"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <span>{sug.policy}</span>
                      <Badge className="bg-purple-500/20 text-purple-400 border-purple-500/30 text-xs shrink-0">
                        {sug.suggested_impact}%
                      </Badge>
                    </div>
                    <div className="text-xs text-slate-500 mt-1">{sug.rationale}</div>
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="flex flex-wrap gap-2">
            {scenario.policy_changes.map((policy, idx) => (
              <Badge key={idx} className="bg-purple-500/20 text-purple-400 border-purple-500/30 font-mono text-xs pr-1">
                {policy.text} ({policy.impact}%)
                <button onClick={() => removeItem('policy_changes', idx)} className="ml-2">
                  <X className="w-3 h-3" />
                </button>
              </Badge>
            ))}
          </div>
        </div>

        {/* Resource Distributions */}
        <div>
          <label className="text-slate-300 font-mono text-sm mb-2 block">Resource Distribution Changes</label>
          <div className="grid md:grid-cols-3 gap-2 mb-2">
            <Input
              placeholder="Resource (e.g., Oil)"
              value={newResource.resource}
              onChange={(e) => setNewResource({...newResource, resource: e.target.value})}
              className="bg-slate-900/50 border-yellow-500/30 text-yellow-400 font-mono"
            />
            <Input
              placeholder="Region (e.g., Middle East)"
              value={newResource.region}
              onChange={(e) => setNewResource({...newResource, region: e.target.value})}
              className="bg-slate-900/50 border-yellow-500/30 text-yellow-400 font-mono"
            />
            <div className="flex gap-2">
              <div className="flex-1">
                <Slider
                  value={[newResource.amount]}
                  onValueChange={(v) => setNewResource({...newResource, amount: v[0]})}
                  max={100}
                  step={10}
                />
                <div className="text-xs text-center text-yellow-400 font-mono mt-1">{newResource.amount}%</div>
              </div>
              <Button onClick={addResource} className="bg-yellow-500/20 hover:bg-yellow-500/30 text-yellow-400 border border-yellow-500/30">
                <Plus className="w-4 h-4" />
              </Button>
            </div>
          </div>
          <div className="space-y-2">
            {scenario.resource_distributions.map((res, idx) => (
              <div key={idx} className="bg-slate-900/50 cyber-border rounded p-2 flex items-center justify-between">
                <span className="text-yellow-400 font-mono text-sm">
                  {res.resource} • {res.region} • {res.amount}% allocation
                </span>
                <button onClick={() => removeItem('resource_distributions', idx)}>
                  <X className="w-4 h-4 text-red-400" />
                </button>
              </div>
            ))}
          </div>
        </div>

        <Button
          onClick={() => generateScenarioMutation.mutate()}
          disabled={!isScenarioValid || generateScenarioMutation.isPending}
          className="w-full bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white font-mono text-lg py-6"
        >
          {generateScenarioMutation.isPending ? (
            <>
              <Loader2 className="w-5 h-5 mr-2 animate-spin" />
              SIMULATING SCENARIO...
            </>
          ) : (
            <>
              <Zap className="w-5 h-5 mr-2" />
              RUN SIMULATION
            </>
          )}
        </Button>
      </div>
    </Card>
  );
}