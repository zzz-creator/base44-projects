import React, { useState, useEffect } from 'react';
import { base44 } from '../../api/base44Client';
import { useMutation } from '@tanstack/react-query';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Brain, Loader2, Target, Shield, Users, AlertTriangle, Lightbulb, Zap } from 'lucide-react';

export default function AIStrategyAdvisor({ scenarioData, simulationResults, autoAnalyze = false }) {
  const [analysis, setAnalysis] = useState(null);

  const generateAdvisoryMutation = useMutation({
    mutationFn: async () => {
      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `You are a senior geopolitical strategy advisor with access to real-time global data and historical war analysis.

SCENARIO DETAILS:
${scenarioData ? JSON.stringify(scenarioData, null, 2) : 'No scenario data'}

SIMULATION RESULTS:
${simulationResults ? JSON.stringify(simulationResults, null, 2) : 'No simulation results'}

TASK: Provide comprehensive strategic advisory that includes PREDICTIVE ANALYSIS, COUNTER-NARRATIVES, and BRANCH SUGGESTIONS.

Your analysis should include:

1. PROACTIVE MEASURES (Pre-Conflict)
   - Early warning indicators to monitor
   - Preventive diplomatic actions
   - Economic incentives/disincentives
   - Military posture adjustments
   - Intelligence gathering priorities

2. DIPLOMATIC APPROACHES
   - Multilateral negotiation strategies
   - Key stakeholder engagement
   - Mediation frameworks
   - Confidence-building measures
   - Track-two diplomacy options

3. COUNTER-STRATEGIES (If Conflict Escalates)
   - Crisis management protocols
   - De-escalation pathways
   - Humanitarian intervention options
   - Coalition-building strategies
   - Exit strategies

4. RISK MITIGATION
   - Contingency planning
   - Resource stockpiling
   - Alliance reinforcement
   - Cyber defense measures
   - Information operations

5. LONG-TERM STRATEGIC POSITIONING
   - Post-conflict planning
   - Regional stability investments
   - International order adjustments
   - Technology development priorities

6. PREDICTIVE INSIGHTS (Based on Past Wars & Real-time Data)
   - Analyze similar historical conflicts
   - Current global trends indicating escalation
   - Probability-based future scenarios
   - Early warning indicators

7. COUNTER-NARRATIVES & INFORMATION OPERATIONS
   - Disinformation campaign strategies
   - Narrative control recommendations
   - Psychological operations approaches
   - Media influence tactics

8. STRATEGIC BRANCH SUGGESTIONS
   - Alternative scenario paths to explore
   - "What-if" questions for further analysis
   - High-impact variables to modify
   - Recommended simulation variations

Provide specific, actionable recommendations tailored to this exact scenario.`,
        response_json_schema: {
          type: "object",
          properties: {
            executive_summary: { type: "string" },
            overall_recommendation: { type: "string" },
            confidence_level: { type: "number" },
            proactive_measures: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  measure: { type: "string" },
                  priority: { type: "string" },
                  timeline: { type: "string" },
                  expected_impact: { type: "string" },
                  implementation_steps: { type: "array", items: { type: "string" } }
                }
              }
            },
            diplomatic_approaches: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  approach: { type: "string" },
                  stakeholders: { type: "array", items: { type: "string" } },
                  success_probability: { type: "number" },
                  timeline: { type: "string" },
                  framework: { type: "string" },
                  prerequisites: { type: "array", items: { type: "string" } }
                }
              }
            },
            counter_strategies: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  strategy: { type: "string" },
                  trigger_condition: { type: "string" },
                  action_plan: { type: "array", items: { type: "string" } },
                  resources_required: { type: "string" },
                  effectiveness: { type: "number" }
                }
              }
            },
            risk_mitigation: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  risk: { type: "string" },
                  mitigation_action: { type: "string" },
                  priority: { type: "string" },
                  cost_estimate: { type: "string" }
                }
              }
            },
            long_term_positioning: {
              type: "object",
              properties: {
                post_conflict_strategy: { type: "string" },
                stability_investments: { type: "array", items: { type: "string" } },
                alliance_recommendations: { type: "array", items: { type: "string" } },
                technology_priorities: { type: "array", items: { type: "string" } }
              }
            },
            critical_warnings: { type: "array", items: { type: "string" } },
            opportunities: { type: "array", items: { type: "string" } }
          }
        },
        add_context_from_internet: true
      });

      setAnalysis(result);
      if (result.what_if_strategic_questions) {
        setWhatIfQuestions(result.what_if_strategic_questions);
      }
      return result;
    }
  });

  useEffect(() => {
    if (autoAnalyze && (scenarioData || simulationResults) && !analysis) {
      generateAdvisoryMutation.mutate();
    }
  }, [autoAnalyze, scenarioData, simulationResults]);

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
    <Card className="bg-slate-950/80 backdrop-blur-xl cyber-border p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Brain className="w-8 h-8 text-purple-400" />
          <div>
            <h2 className="text-2xl font-bold text-purple-400 glow-text font-mono">
              AI STRATEGY ADVISOR
            </h2>
            <p className="text-slate-400 font-mono text-sm">
              Tailored strategic recommendations based on scenario analysis
            </p>
          </div>
        </div>
        {!analysis && (
          <Button
            onClick={() => generateAdvisoryMutation.mutate()}
            disabled={generateAdvisoryMutation.isPending}
            className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-mono"
          >
            {generateAdvisoryMutation.isPending ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ANALYZING...
              </>
            ) : (
              <>
                <Zap className="w-4 h-4 mr-2" />
                GENERATE ADVISORY
              </>
            )}
          </Button>
        )}
      </div>

      {analysis && (
        <div className="space-y-6 animate-in fade-in duration-500">
          <Card className="bg-gradient-to-br from-purple-950/50 to-pink-950/50 cyber-border p-6">
            <div className="mb-4">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-xl font-bold text-green-400 glow-text font-mono">
                  EXECUTIVE SUMMARY
                </h3>
                <Badge className="bg-cyan-500/20 text-cyan-400 border-cyan-500/30 font-mono">
                  CONFIDENCE: {analysis.confidence_level}%
                </Badge>
              </div>
              <p className="text-slate-300 font-mono text-sm leading-relaxed">
                {analysis.executive_summary}
              </p>
            </div>
            <div className="p-4 bg-green-950/20 cyber-border rounded">
              <h4 className="text-sm font-bold text-green-400 font-mono mb-2">OVERALL RECOMMENDATION</h4>
              <p className="text-slate-300 font-mono text-sm">{analysis.overall_recommendation}</p>
            </div>
          </Card>

          {/* Critical Warnings & Opportunities */}
          <div className="grid md:grid-cols-2 gap-6">
            {analysis.critical_warnings?.length > 0 && (
              <Card className="bg-red-950/20 cyber-border p-4">
                <h4 className="text-sm font-bold text-red-400 font-mono mb-3 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4" />
                  CRITICAL WARNINGS
                </h4>
                <ul className="space-y-2">
                  {analysis.critical_warnings.map((warning, idx) => (
                    <li key={idx} className="text-slate-300 font-mono text-xs flex items-start gap-2">
                      <span className="text-red-400">⚠</span>
                      {warning}
                    </li>
                  ))}
                </ul>
              </Card>
            )}

            {analysis.opportunities?.length > 0 && (
              <Card className="bg-green-950/20 cyber-border p-4">
                <h4 className="text-sm font-bold text-green-400 font-mono mb-3 flex items-center gap-2">
                  <Lightbulb className="w-4 h-4" />
                  STRATEGIC OPPORTUNITIES
                </h4>
                <ul className="space-y-2">
                  {analysis.opportunities.map((opp, idx) => (
                    <li key={idx} className="text-slate-300 font-mono text-xs flex items-start gap-2">
                      <span className="text-green-400">✓</span>
                      {opp}
                    </li>
                  ))}
                </ul>
              </Card>
            )}
          </div>

          {/* Proactive Measures */}
          {analysis.proactive_measures?.length > 0 && (
            <Card className="bg-slate-950/80 cyber-border p-6">
              <h3 className="text-xl font-bold text-cyan-400 glow-text font-mono mb-4 flex items-center gap-2">
                <Target className="w-5 h-5" />
                PROACTIVE MEASURES
              </h3>
              <div className="space-y-3">
                {analysis.proactive_measures.map((measure, idx) => (
                  <div key={idx} className="bg-slate-900/50 cyber-border rounded-lg p-4">
                    <div className="flex items-start justify-between mb-2">
                      <h4 className="text-md font-bold text-yellow-400 font-mono">{measure.measure}</h4>
                      <Badge className={`font-mono text-xs ${getPriorityColor(measure.priority)}`}>
                        {measure.priority}
                      </Badge>
                    </div>
                    <div className="grid md:grid-cols-2 gap-2 mb-2 text-xs font-mono">
                      <span className="text-slate-400">Timeline: <span className="text-cyan-400">{measure.timeline}</span></span>
                      <span className="text-slate-400">Impact: <span className="text-green-400">{measure.expected_impact}</span></span>
                    </div>
                    {measure.implementation_steps?.length > 0 && (
                      <div className="mt-2 pt-2 border-t border-slate-700/30">
                        <div className="text-xs text-slate-500 font-mono mb-1">Implementation:</div>
                        <ol className="space-y-1">
                          {measure.implementation_steps.map((step, i) => (
                            <li key={i} className="text-slate-300 font-mono text-xs">
                              {i + 1}. {step}
                            </li>
                          ))}
                        </ol>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </Card>
          )}

          {/* Diplomatic Approaches */}
          {analysis.diplomatic_approaches?.length > 0 && (
            <Card className="bg-slate-950/80 cyber-border p-6">
              <h3 className="text-xl font-bold text-blue-400 glow-text font-mono mb-4 flex items-center gap-2">
                <Users className="w-5 h-5" />
                DIPLOMATIC APPROACHES
              </h3>
              <div className="space-y-3">
                {analysis.diplomatic_approaches.map((approach, idx) => (
                  <div key={idx} className="bg-slate-900/50 cyber-border rounded-lg p-4">
                    <div className="flex items-start justify-between mb-2">
                      <h4 className="text-md font-bold text-cyan-400 font-mono">{approach.approach}</h4>
                      <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30 font-mono text-xs">
                        {approach.success_probability}% Success
                      </Badge>
                    </div>
                    <div className="mb-2 text-xs font-mono text-slate-400">
                      Framework: <span className="text-purple-400">{approach.framework}</span>
                    </div>
                    <div className="mb-2">
                      <span className="text-xs text-slate-500 font-mono">Key Stakeholders: </span>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {approach.stakeholders?.map((stakeholder, i) => (
                          <Badge key={i} variant="outline" className="border-cyan-500/30 text-cyan-400 font-mono text-xs">
                            {stakeholder}
                          </Badge>
                        ))}
                      </div>
                    </div>
                    {approach.prerequisites?.length > 0 && (
                      <div className="mt-2 pt-2 border-t border-slate-700/30">
                        <div className="text-xs text-slate-500 font-mono mb-1">Prerequisites:</div>
                        <ul className="space-y-1">
                          {approach.prerequisites.map((prereq, i) => (
                            <li key={i} className="text-slate-300 font-mono text-xs">• {prereq}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </Card>
          )}

          {/* Counter-Strategies */}
          {analysis.counter_strategies?.length > 0 && (
            <Card className="bg-slate-950/80 cyber-border p-6">
              <h3 className="text-xl font-bold text-red-400 glow-text font-mono mb-4 flex items-center gap-2">
                <Shield className="w-5 h-5" />
                COUNTER-STRATEGIES
              </h3>
              <div className="space-y-3">
                {analysis.counter_strategies.map((strategy, idx) => (
                  <div key={idx} className="bg-slate-900/50 cyber-border rounded-lg p-4">
                    <div className="flex items-start justify-between mb-2">
                      <h4 className="text-md font-bold text-yellow-400 font-mono">{strategy.strategy}</h4>
                      <Badge className="bg-red-500/20 text-red-400 border-red-500/30 font-mono text-xs">
                        {strategy.effectiveness}% Effective
                      </Badge>
                    </div>
                    <div className="mb-2 p-2 bg-orange-950/20 cyber-border rounded">
                      <span className="text-xs text-slate-500 font-mono">Trigger: </span>
                      <span className="text-orange-400 font-mono text-xs">{strategy.trigger_condition}</span>
                    </div>
                    {strategy.action_plan?.length > 0 && (
                      <div>
                        <div className="text-xs text-slate-500 font-mono mb-1">Action Plan:</div>
                        <ol className="space-y-1">
                          {strategy.action_plan.map((action, i) => (
                            <li key={i} className="text-slate-300 font-mono text-xs">
                              {i + 1}. {action}
                            </li>
                          ))}
                        </ol>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </Card>
          )}

          {/* Risk Mitigation */}
          {analysis.risk_mitigation?.length > 0 && (
            <Card className="bg-slate-950/80 cyber-border p-6">
              <h3 className="text-xl font-bold text-orange-400 glow-text font-mono mb-4 flex items-center gap-2">
                <AlertTriangle className="w-5 h-5" />
                RISK MITIGATION
              </h3>
              <div className="space-y-3">
                {analysis.risk_mitigation.map((risk, idx) => (
                  <div key={idx} className="bg-slate-900/50 cyber-border rounded-lg p-4">
                    <div className="flex items-start justify-between mb-2">
                      <h4 className="text-sm font-bold text-orange-400 font-mono">{risk.risk}</h4>
                      <Badge className={`font-mono text-xs ${getPriorityColor(risk.priority)}`}>
                        {risk.priority}
                      </Badge>
                    </div>
                    <p className="text-slate-300 font-mono text-xs mb-1">
                      <strong>Action:</strong> {risk.mitigation_action}
                    </p>
                    <p className="text-slate-400 font-mono text-xs">
                      <strong>Cost:</strong> {risk.cost_estimate}
                    </p>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {/* Long-term Positioning */}
          {analysis.long_term_positioning && (
            <Card className="bg-gradient-to-br from-blue-950/50 to-purple-950/50 cyber-border p-6">
              <h3 className="text-xl font-bold text-purple-400 glow-text font-mono mb-4">
                LONG-TERM STRATEGIC POSITIONING
              </h3>
              <div className="space-y-4">
                <div className="p-4 bg-slate-900/50 cyber-border rounded">
                  <h4 className="text-sm font-bold text-cyan-400 font-mono mb-2">Post-Conflict Strategy</h4>
                  <p className="text-slate-300 font-mono text-sm">{analysis.long_term_positioning.post_conflict_strategy}</p>
                </div>

                {analysis.long_term_positioning.stability_investments?.length > 0 && (
                  <div className="p-4 bg-slate-900/50 cyber-border rounded">
                    <h4 className="text-sm font-bold text-green-400 font-mono mb-2">Stability Investments</h4>
                    <ul className="space-y-1">
                      {analysis.long_term_positioning.stability_investments.map((inv, i) => (
                        <li key={i} className="text-slate-300 font-mono text-xs">✓ {inv}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {analysis.long_term_positioning.technology_priorities?.length > 0 && (
                  <div className="p-4 bg-slate-900/50 cyber-border rounded">
                    <h4 className="text-sm font-bold text-purple-400 font-mono mb-2">Technology Priorities</h4>
                    <ul className="space-y-1">
                      {analysis.long_term_positioning.technology_priorities.map((tech, i) => (
                        <li key={i} className="text-slate-300 font-mono text-xs">→ {tech}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </Card>
          )}

          {/* Predictive Insights */}
          {analysis.predictive_insights && (
            <Card className="bg-slate-950/80 cyber-border p-6">
              <h3 className="text-xl font-bold text-cyan-400 glow-text font-mono mb-4">
                PREDICTIVE INSIGHTS
              </h3>
              {analysis.predictive_insights.similar_conflicts?.length > 0 && (
                <div className="mb-4">
                  <h4 className="text-sm font-bold text-yellow-400 font-mono mb-2">Similar Historical Conflicts</h4>
                  <div className="space-y-2">
                    {analysis.predictive_insights.similar_conflicts.map((conf, i) => (
                      <div key={i} className="bg-slate-900/50 cyber-border rounded p-3">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-cyan-400 font-mono text-sm">{conf.conflict}</span>
                          <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30 font-mono text-xs">
                            {conf.similarity}% Similar
                          </Badge>
                        </div>
                        <p className="text-slate-400 font-mono text-xs">{conf.outcome}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </Card>
          )}

          {/* Counter-Narratives */}
          {analysis.counter_narratives && (
            <Card className="bg-gradient-to-br from-red-950/30 to-orange-950/30 cyber-border p-6">
              <h3 className="text-xl font-bold text-orange-400 glow-text font-mono mb-4">
                INFORMATION WARFARE STRATEGIES
              </h3>
              <p className="text-slate-300 font-mono text-sm mb-4">{analysis.counter_narratives.primary_narrative}</p>
              {analysis.counter_narratives.counter_strategies?.length > 0 && (
                <div className="space-y-3">
                  {analysis.counter_narratives.counter_strategies.map((strat, i) => (
                    <div key={i} className="bg-slate-900/50 cyber-border rounded p-4">
                      <h4 className="text-sm font-bold text-yellow-400 font-mono mb-2">{strat.strategy}</h4>
                      <div className="text-xs font-mono text-slate-400 mb-2">
                        Target: {strat.target_audience?.join(', ')}
                      </div>
                      <ul className="space-y-1">
                        {strat.key_messages?.map((msg, j) => (
                          <li key={j} className="text-slate-300 font-mono text-xs">• {msg}</li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          )}

          {/* Branch Suggestions */}
          {analysis.branch_suggestions?.length > 0 && (
            <Card className="bg-gradient-to-br from-purple-950/30 to-pink-950/30 cyber-border p-6">
              <h3 className="text-xl font-bold text-pink-400 glow-text font-mono mb-4">
                RECOMMENDED SCENARIO BRANCHES
              </h3>
              <div className="space-y-3">
                {analysis.branch_suggestions.map((branch, i) => (
                  <div key={i} className="bg-slate-900/50 cyber-border rounded p-4">
                    <h4 className="text-md font-bold text-cyan-400 font-mono mb-2">{branch.branch_name}</h4>
                    <p className="text-purple-400 font-mono text-sm italic mb-2">"{branch.what_if_question}"</p>
                    <div className="text-xs font-mono text-slate-400 mb-2">
                      Strategic Value: <span className="text-green-400">{branch.strategic_value}</span>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {/* Effectiveness Analysis */}
          {analysis?.effectiveness_analysis && (
            <Card className="bg-slate-950/80 backdrop-blur-xl cyber-border p-6">
              <h3 className="text-xl font-bold text-orange-400 glow-text font-mono mb-4">
                STRATEGY EFFECTIVENESS ANALYSIS
              </h3>
              <div className="space-y-4">
                <div className="bg-slate-900/50 cyber-border rounded p-4">
                  <div className="text-sm text-slate-400 font-mono mb-1">Effectiveness Score</div>
                  <div className="text-3xl font-bold text-orange-400 font-mono">
                    {analysis.effectiveness_analysis.strategy_effectiveness_score}/100
                  </div>
                </div>

                {analysis.effectiveness_analysis.specific_adjustments?.length > 0 && (
                  <div>
                    <h4 className="text-md font-bold text-cyan-400 font-mono mb-3">Specific Adjustments</h4>
                    <div className="space-y-3">
                      {analysis.effectiveness_analysis.specific_adjustments.map((adj, idx) => (
                        <div key={idx} className="bg-slate-900/50 cyber-border rounded p-4">
                          <h5 className="text-sm font-bold text-yellow-400 font-mono mb-3">{adj.parameter}</h5>
                          <div className="space-y-2 text-xs">
                            <p className="text-slate-400 font-mono"><strong>Current:</strong> {adj.current_approach}</p>
                            <p className="text-green-400 font-mono"><strong>Recommended:</strong> {adj.recommended_adjustment}</p>
                            <p className="text-cyan-400 font-mono"><strong>Expected Impact:</strong> {adj.expected_improvement}</p>
                            
                            {adj.projected_impact && (
                              <div className="mt-3 pt-3 border-t border-slate-700/30">
                                <h6 className="text-xs font-bold text-purple-400 font-mono mb-2">PROJECTED IMPACT ON KEY METRICS</h6>
                                <div className="grid grid-cols-2 gap-2">
                                  {adj.projected_impact.casualties_reduction && (
                                    <div className="bg-red-950/20 cyber-border rounded p-2">
                                      <div className="text-xs text-slate-500 font-mono">Casualties</div>
                                      <div className="text-sm text-red-400 font-mono">{adj.projected_impact.casualties_reduction}</div>
                                    </div>
                                  )}
                                  {adj.projected_impact.economic_improvement && (
                                    <div className="bg-green-950/20 cyber-border rounded p-2">
                                      <div className="text-xs text-slate-500 font-mono">Economy</div>
                                      <div className="text-sm text-green-400 font-mono">{adj.projected_impact.economic_improvement}</div>
                                    </div>
                                  )}
                                  {adj.projected_impact.stability_increase && (
                                    <div className="bg-blue-950/20 cyber-border rounded p-2">
                                      <div className="text-xs text-slate-500 font-mono">Stability</div>
                                      <div className="text-sm text-blue-400 font-mono">{adj.projected_impact.stability_increase}</div>
                                    </div>
                                  )}
                                  {adj.projected_impact.conflict_probability_change && (
                                    <div className="bg-orange-950/20 cyber-border rounded p-2">
                                      <div className="text-xs text-slate-500 font-mono">Conflict Prob</div>
                                      <div className="text-sm text-orange-400 font-mono">{adj.projected_impact.conflict_probability_change}</div>
                                    </div>
                                  )}
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {analysis.effectiveness_analysis.alternative_approaches?.length > 0 && (
                  <div>
                    <h4 className="text-md font-bold text-cyan-400 font-mono mb-3">Alternative Approaches</h4>
                    <div className="space-y-3">
                      {analysis.effectiveness_analysis.alternative_approaches.map((alt, idx) => (
                        <div key={idx} className="bg-slate-900/50 cyber-border rounded p-4">
                          <div className="flex items-start justify-between mb-2">
                            <h5 className="text-sm font-bold text-purple-400 font-mono">{alt.approach_name}</h5>
                            {alt.success_probability && (
                              <Badge className="bg-purple-500/20 text-purple-400 border-purple-500/30 font-mono text-xs">
                                {alt.success_probability}% Success
                              </Badge>
                            )}
                          </div>
                          <p className="text-slate-400 font-mono text-xs mb-3">{alt.description}</p>
                          
                          {alt.strategic_rationale && (
                            <div className="mb-3 p-2 bg-cyan-950/20 cyber-border rounded">
                              <div className="text-xs font-bold text-cyan-400 font-mono mb-1">Strategic Rationale:</div>
                              <p className="text-slate-300 font-mono text-xs">{alt.strategic_rationale}</p>
                            </div>
                          )}
                          
                          <div className="grid md:grid-cols-2 gap-3 mb-3">
                            <div>
                              <div className="text-xs text-green-400 font-mono mb-1 font-bold">Advantages:</div>
                              <ul className="list-disc list-inside text-xs text-slate-400 font-mono space-y-0.5">
                                {alt.advantages?.map((adv, i) => <li key={i}>{adv}</li>)}
                              </ul>
                            </div>
                            <div>
                              <div className="text-xs text-red-400 font-mono mb-1 font-bold">Risks:</div>
                              <ul className="list-disc list-inside text-xs text-slate-400 font-mono space-y-0.5">
                                {alt.risks?.map((risk, i) => <li key={i}>{risk}</li>)}
                              </ul>
                            </div>
                          </div>
                          
                          {alt.counter_arguments && alt.counter_arguments.length > 0 && (
                            <div className="p-2 bg-orange-950/20 cyber-border rounded">
                              <div className="text-xs font-bold text-orange-400 font-mono mb-1">Counter-Arguments:</div>
                              <ul className="list-disc list-inside text-xs text-slate-300 font-mono space-y-0.5">
                                {alt.counter_arguments.map((arg, i) => <li key={i}>{arg}</li>)}
                              </ul>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {analysis.effectiveness_analysis.historical_comparison && (
                  <div className="bg-blue-950/20 cyber-border rounded p-4">
                    <h4 className="text-md font-bold text-blue-400 font-mono mb-2">Historical Comparison</h4>
                    <p className="text-slate-300 font-mono text-sm">{analysis.effectiveness_analysis.historical_comparison}</p>
                  </div>
                )}
              </div>
            </Card>
          )}

          {/* What-If Strategic Questions */}
          {whatIfQuestions.length > 0 && (
            <Card className="bg-gradient-to-br from-purple-950/50 to-pink-950/50 backdrop-blur-xl cyber-border p-6">
              <h3 className="text-xl font-bold text-purple-400 glow-text font-mono mb-4">
                WHAT-IF STRATEGIC QUESTIONS
              </h3>
              <p className="text-slate-400 font-mono text-sm mb-4">
                Click a question to create a new scenario branch exploring that what-if scenario
              </p>
              <div className="space-y-3">
                {whatIfQuestions.map((q, idx) => (
                  <button
                    key={idx}
                    onClick={() => {
                      if (window.createScenarioBranch) {
                        window.createScenarioBranch({
                          name: q.question,
                          whatIfQuestion: q.question,
                          description: `Exploring: ${q.potential_impact}`,
                          category: q.category
                        });
                      }
                    }}
                    className="w-full bg-slate-900/50 cyber-border rounded p-4 text-left hover:bg-slate-800/50 transition-colors"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <h4 className="text-sm font-bold text-cyan-400 font-mono flex-1">{q.question}</h4>
                      <Badge className="bg-purple-500/20 text-purple-400 border-purple-500/30 font-mono text-xs ml-2">
                        {q.category}
                      </Badge>
                    </div>
                    <p className="text-slate-400 font-mono text-xs mb-2">{q.potential_impact}</p>
                    {q.parameters_to_modify?.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        <span className="text-xs text-slate-500 font-mono">Modifies:</span>
                        {q.parameters_to_modify.map((param, i) => (
                          <Badge key={i} variant="outline" className="border-green-500/30 text-green-400 font-mono text-xs">
                            {param}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </button>
                ))}
              </div>
            </Card>
          )}

          <Button
            onClick={() => generateAdvisoryMutation.mutate()}
            disabled={generateAdvisoryMutation.isPending}
            variant="outline"
            className="w-full border-purple-500/30 text-purple-400 hover:bg-purple-500/10 font-mono py-4"
          >
            <Zap className="w-4 h-4 mr-2" />
            REFRESH ADVISORY
          </Button>
        </div>
      )}
    </Card>
  );
}