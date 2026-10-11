import React, { useState } from 'react';
import { base44 } from '../../api/base44Client';
import { useMutation } from '@tanstack/react-query';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Slider } from '../ui/slider';
import { Badge } from '../ui/badge';
import { Loader2, Zap, TrendingUp, AlertTriangle } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Area, AreaChart } from 'recharts';

export default function EnhancedScenarioSimulator({ baseScenario, onSimulationComplete }) {
  const [parameters, setParameters] = useState({
    policy_intervention_strength: 50,
    economic_shock_severity: 50,
    climate_event_severity: 50,
    diplomatic_effort: 50,
    military_posture: 50,
    simulation_iterations: 100,
    time_horizon_years: 10
  });

  const [results, setResults] = useState(null);

  const runSimulationMutation = useMutation({
    mutationFn: async () => {
      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `You are an advanced geopolitical simulation engine running Monte Carlo-style scenario analysis.

BASE SCENARIO:
${JSON.stringify(baseScenario, null, 2)}

CUSTOM PARAMETERS:
- Policy Intervention Strength: ${parameters.policy_intervention_strength}/100
- Economic Shock Severity: ${parameters.economic_shock_severity}/100
- Climate Event Severity: ${parameters.climate_event_severity}/100
- Diplomatic Effort: ${parameters.diplomatic_effort}/100
- Military Posture: ${parameters.military_posture}/100
- Simulation Iterations: ${parameters.simulation_iterations}
- Time Horizon: ${parameters.time_horizon_years} years

Run ${parameters.simulation_iterations} probabilistic simulations with these parameters. For each major outcome pathway:

1. PROBABILISTIC OUTCOMES
   - Calculate probability distribution of outcomes
   - Identify divergence points where scenarios branch
   - Provide confidence intervals for key metrics
   - Highlight most likely vs worst-case vs best-case scenarios

2. SENSITIVITY ANALYSIS
   - Which parameters have the most impact on outcomes?
   - What are the critical thresholds for each variable?
   - Identify cascading effect multipliers
   - Determine stability vs chaos boundaries

3. TEMPORAL EVOLUTION
   - Year-by-year progression of key metrics
   - Confidence bands showing uncertainty over time
   - Critical decision windows
   - Point of no return identification

4. OUTCOME VARIATIONS
   - Major scenario branches (at least 5)
   - Probability of each branch
   - Key distinguishing factors
   - Convergence or divergence patterns

Provide detailed quantitative data for visualization with confidence intervals.`,
        response_json_schema: {
          type: "object",
          properties: {
            simulation_summary: { type: "string" },
            total_iterations: { type: "number" },
            outcome_branches: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  branch_name: { type: "string" },
                  probability: { type: "number" },
                  description: { type: "string" },
                  divergence_point: { type: "string" },
                  key_factors: { type: "array", items: { type: "string" } },
                  final_stability_score: { type: "number" },
                  confidence_interval: {
                    type: "object",
                    properties: {
                      lower: { type: "number" },
                      upper: { type: "number" }
                    }
                  }
                }
              }
            },
            sensitivity_analysis: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  parameter: { type: "string" },
                  impact_score: { type: "number" },
                  critical_threshold: { type: "number" },
                  explanation: { type: "string" }
                }
              }
            },
            temporal_evolution: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  year: { type: "number" },
                  stability_mean: { type: "number" },
                  stability_lower: { type: "number" },
                  stability_upper: { type: "number" },
                  conflict_probability_mean: { type: "number" },
                  conflict_probability_lower: { type: "number" },
                  conflict_probability_upper: { type: "number" },
                  economic_health_mean: { type: "number" },
                  economic_health_lower: { type: "number" },
                  economic_health_upper: { type: "number" }
                }
              }
            },
            critical_variables: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  variable: { type: "string" },
                  current_value: { type: "number" },
                  tipping_point: { type: "number" },
                  consequence: { type: "string" }
                }
              }
            },
            recommendations: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  recommendation: { type: "string" },
                  timing: { type: "string" },
                  expected_impact: { type: "string" }
                }
              }
            }
          }
        },
        add_context_from_internet: false
      });

      setResults(result);
      if (onSimulationComplete) {
        onSimulationComplete(result);
      }
      return result;
    }
  });

  return (
    <div className="space-y-6">
      <Card className="bg-slate-950/80 backdrop-blur-xl cyber-border p-6">
        <h3 className="text-xl font-bold text-purple-400 glow-text font-mono mb-4 flex items-center gap-2">
          <Zap className="w-6 h-6" />
          ENHANCED SCENARIO SIMULATOR
        </h3>

        <div className="space-y-4">
          <div>
            <label className="text-slate-300 font-mono text-sm mb-2 block">
              Policy Intervention Strength: {parameters.policy_intervention_strength}%
            </label>
            <Slider
              value={[parameters.policy_intervention_strength]}
              onValueChange={(v) => setParameters({...parameters, policy_intervention_strength: v[0]})}
              max={100}
              step={5}
              className="py-4"
            />
          </div>

          <div>
            <label className="text-slate-300 font-mono text-sm mb-2 block">
              Economic Shock Severity: {parameters.economic_shock_severity}%
            </label>
            <Slider
              value={[parameters.economic_shock_severity]}
              onValueChange={(v) => setParameters({...parameters, economic_shock_severity: v[0]})}
              max={100}
              step={5}
              className="py-4"
            />
          </div>

          <div>
            <label className="text-slate-300 font-mono text-sm mb-2 block">
              Climate Event Severity: {parameters.climate_event_severity}%
            </label>
            <Slider
              value={[parameters.climate_event_severity]}
              onValueChange={(v) => setParameters({...parameters, climate_event_severity: v[0]})}
              max={100}
              step={5}
              className="py-4"
            />
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="text-slate-300 font-mono text-sm mb-2 block">
                Diplomatic Effort: {parameters.diplomatic_effort}%
              </label>
              <Slider
                value={[parameters.diplomatic_effort]}
                onValueChange={(v) => setParameters({...parameters, diplomatic_effort: v[0]})}
                max={100}
                step={5}
                className="py-4"
              />
            </div>

            <div>
              <label className="text-slate-300 font-mono text-sm mb-2 block">
                Military Posture: {parameters.military_posture}%
              </label>
              <Slider
                value={[parameters.military_posture]}
                onValueChange={(v) => setParameters({...parameters, military_posture: v[0]})}
                max={100}
                step={5}
                className="py-4"
              />
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="text-slate-300 font-mono text-sm mb-2 block">Simulation Iterations</label>
              <Input
                type="number"
                value={parameters.simulation_iterations}
                onChange={(e) => setParameters({...parameters, simulation_iterations: parseInt(e.target.value)})}
                min={10}
                max={1000}
                className="bg-slate-900/50 border-cyan-500/30 text-cyan-400 font-mono"
              />
            </div>

            <div>
              <label className="text-slate-300 font-mono text-sm mb-2 block">Time Horizon (Years)</label>
              <Input
                type="number"
                value={parameters.time_horizon_years}
                onChange={(e) => setParameters({...parameters, time_horizon_years: parseInt(e.target.value)})}
                min={1}
                max={50}
                className="bg-slate-900/50 border-cyan-500/30 text-cyan-400 font-mono"
              />
            </div>
          </div>

          <Button
            onClick={() => runSimulationMutation.mutate()}
            disabled={runSimulationMutation.isPending}
            className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-mono py-6"
          >
            {runSimulationMutation.isPending ? (
              <>
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                RUNNING {parameters.simulation_iterations} SIMULATIONS...
              </>
            ) : (
              <>
                <Zap className="w-5 h-5 mr-2" />
                RUN PROBABILISTIC SIMULATION
              </>
            )}
          </Button>
        </div>
      </Card>

      {results && (
        <>
          <Card className="bg-gradient-to-br from-purple-950/50 to-blue-950/50 backdrop-blur-xl cyber-border p-6">
            <h3 className="text-2xl font-bold text-purple-400 glow-text font-mono mb-3">
              SIMULATION RESULTS
            </h3>
            <p className="text-slate-300 font-mono text-sm mb-2">{results.simulation_summary}</p>
            <Badge className="bg-cyan-500/20 text-cyan-400 border-cyan-500/30 font-mono">
              {results.total_iterations} iterations completed
            </Badge>
          </Card>

          {/* Temporal Evolution with Confidence Bands */}
          {results.temporal_evolution?.length > 0 && (
            <Card className="bg-slate-950/80 backdrop-blur-xl cyber-border p-6">
              <h3 className="text-xl font-bold text-cyan-400 glow-text font-mono mb-4">
                TEMPORAL EVOLUTION (with Confidence Intervals)
              </h3>
              <div className="h-[400px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={results.temporal_evolution}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                    <XAxis dataKey="year" stroke="#94a3b8" style={{ fontFamily: 'monospace', fontSize: '11px' }} />
                    <YAxis stroke="#94a3b8" style={{ fontFamily: 'monospace', fontSize: '11px' }} domain={[0, 100]} />
                    <Tooltip contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #334155' }} />
                    <Legend wrapperStyle={{ fontFamily: 'monospace' }} />
                    <Area type="monotone" dataKey="stability_upper" stackId="1" stroke="#06b6d4" fill="#06b6d4" fillOpacity={0.1} name="Stability (High)" />
                    <Area type="monotone" dataKey="stability_mean" stackId="2" stroke="#06b6d4" fill="#06b6d4" fillOpacity={0.6} name="Stability (Mean)" />
                    <Area type="monotone" dataKey="stability_lower" stackId="1" stroke="#06b6d4" fill="#06b6d4" fillOpacity={0.1} name="Stability (Low)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </Card>
          )}

          {/* Outcome Branches */}
          {results.outcome_branches?.length > 0 && (
            <Card className="bg-slate-950/80 backdrop-blur-xl cyber-border p-6">
              <h3 className="text-xl font-bold text-yellow-400 glow-text font-mono mb-4">
                OUTCOME BRANCHES
              </h3>
              <div className="space-y-3">
                {results.outcome_branches.map((branch, idx) => (
                  <div key={idx} className="bg-slate-900/50 cyber-border rounded p-4">
                    <div className="flex items-start justify-between mb-2">
                      <h4 className="text-lg font-bold text-cyan-400 font-mono">{branch.branch_name}</h4>
                      <Badge className="bg-purple-500/20 text-purple-400 border-purple-500/30 font-mono text-lg py-1 px-3">
                        {branch.probability}%
                      </Badge>
                    </div>
                    <p className="text-slate-400 font-mono text-sm mb-3">{branch.description}</p>
                    
                    <div className="grid md:grid-cols-2 gap-3 mb-3">
                      <div className="p-2 bg-blue-950/20 cyber-border rounded">
                        <div className="text-xs text-slate-500 font-mono mb-1">Divergence Point</div>
                        <div className="text-blue-400 font-mono text-sm">{branch.divergence_point}</div>
                      </div>
                      <div className="p-2 bg-green-950/20 cyber-border rounded">
                        <div className="text-xs text-slate-500 font-mono mb-1">Final Stability</div>
                        <div className="text-green-400 font-mono text-sm">
                          {branch.final_stability_score}/100
                          <span className="text-xs text-slate-500 ml-2">
                            (±{(branch.confidence_interval.upper - branch.confidence_interval.lower).toFixed(0)})
                          </span>
                        </div>
                      </div>
                    </div>

                    <div>
                      <div className="text-xs text-slate-500 font-mono mb-1">Key Factors</div>
                      <div className="flex flex-wrap gap-1">
                        {branch.key_factors?.map((factor, i) => (
                          <Badge key={i} variant="outline" className="border-cyan-500/30 text-cyan-400 font-mono text-xs">
                            {factor}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {/* Sensitivity Analysis */}
          {results.sensitivity_analysis?.length > 0 && (
            <Card className="bg-slate-950/80 backdrop-blur-xl cyber-border p-6">
              <h3 className="text-xl font-bold text-orange-400 glow-text font-mono mb-4 flex items-center gap-2">
                <TrendingUp className="w-6 h-6" />
                SENSITIVITY ANALYSIS
              </h3>
              <div className="space-y-3">
                {results.sensitivity_analysis
                  .sort((a, b) => b.impact_score - a.impact_score)
                  .map((param, idx) => (
                    <div key={idx} className="bg-slate-900/50 cyber-border rounded p-4">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="text-md font-bold text-cyan-400 font-mono">{param.parameter}</h4>
                        <Badge className={`${
                          param.impact_score > 80 ? 'bg-red-500/20 text-red-400 border-red-500/30' :
                          param.impact_score > 60 ? 'bg-orange-500/20 text-orange-400 border-orange-500/30' :
                          param.impact_score > 40 ? 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30' :
                          'bg-green-500/20 text-green-400 border-green-500/30'
                        } font-mono`}>
                          Impact: {param.impact_score}/100
                        </Badge>
                      </div>
                      <div className="mb-2">
                        <div className="flex-1 bg-slate-800 rounded-full h-2 mb-2">
                          <div 
                            className="bg-gradient-to-r from-green-400 via-yellow-400 to-red-400 h-2 rounded-full"
                            style={{ width: `${param.impact_score}%` }}
                          ></div>
                        </div>
                      </div>
                      <div className="text-xs font-mono mb-2">
                        <span className="text-slate-500">Critical Threshold: </span>
                        <span className="text-orange-400 font-bold">{param.critical_threshold}%</span>
                      </div>
                      <p className="text-slate-400 font-mono text-xs">{param.explanation}</p>
                    </div>
                  ))}
              </div>
            </Card>
          )}

          {/* Critical Variables */}
          {results.critical_variables?.length > 0 && (
            <Card className="bg-slate-950/80 backdrop-blur-xl cyber-border p-6">
              <h3 className="text-xl font-bold text-red-400 glow-text font-mono mb-4 flex items-center gap-2">
                <AlertTriangle className="w-6 h-6" />
                CRITICAL VARIABLES & TIPPING POINTS
              </h3>
              <div className="space-y-2">
                {results.critical_variables.map((variable, idx) => (
                  <div key={idx} className="p-3 bg-red-950/20 cyber-border rounded">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-yellow-400 font-mono font-bold text-sm">{variable.variable}</span>
                      <div className="flex gap-2 text-xs font-mono">
                        <span className="text-slate-400">Current: <span className="text-cyan-400">{variable.current_value}</span></span>
                        <span className="text-slate-400">Tipping: <span className="text-red-400">{variable.tipping_point}</span></span>
                      </div>
                    </div>
                    <p className="text-slate-400 font-mono text-xs">{variable.consequence}</p>
                  </div>
                ))}
              </div>
            </Card>
          )}
        </>
      )}
    </div>
  );
}