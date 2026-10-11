
import React, { useState } from 'react';
import { base44 } from '../../api/base44Client';
import { useMutation } from '@tanstack/react-query';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { 
  XCircle, 
  Loader2, 
  FileText, 
  TrendingUp, 
  TrendingDown, 
  AlertCircle,
  CheckCircle2,
  Target,
  DollarSign,
  Calendar,
  Users
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  LineChart, 
  Line, 
  RadarChart, 
  Radar, 
  PolarGrid, 
  PolarAngleAxis, 
  PolarRadiusAxis,
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  ComposedChart,
  Area
} from 'recharts';

export default function WarDebriefing({ war, onClose }) {
  const [debriefing, setDebriefing] = useState(null);
  const [showComparison, setShowComparison] = useState(true);

  const generateDebriefingMutation = useMutation({
    mutationFn: async () => {
      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `You are a military historian conducting a comprehensive post-conflict analysis.

WAR: ${war.name}
PERIOD: ${war.start_date} to ${war.end_date}
DESCRIPTION: ${war.description}
ACTUAL CASUALTIES: ${war.casualties?.total?.toLocaleString() || 'Unknown'}
ECONOMIC IMPACT: $${(war.economic_impact / 1e9)?.toFixed(1)}B

Generate a detailed debriefing including:

1. STRATEGIC OVERVIEW
   - War summary and phases
   - Key turning points
   - Final outcome assessment

2. PRE-WAR SIMULATIONS VS REALITY
   Generate hypothetical AI predictions that would have been made before the war:
   - Predicted casualties vs actual
   - Predicted duration vs actual
   - Predicted economic impact vs actual
   - Predicted outcomes vs actual outcome
   
3. COMPARATIVE ANALYSIS
   - Casualty comparison (predicted vs actual by type)
   - Timeline comparison (predicted vs actual milestones)
   - Economic impact comparison
   - Geopolitical shifts (predicted vs actual)

4. KEY DECISIONS & OUTCOMES
   - Critical decisions made during the war
   - Their actual impact
   - Success rate of each decision

5. DISCREPANCY ANALYSIS
   - Why predictions differed from reality
   - Unexpected factors that emerged
   - Lessons learned for future simulations

6. POST-CONFLICT ASSESSMENT
   - Long-term consequences
   - Regional stability changes
   - International relations impact

Provide realistic comparative data with specific numbers for visualizations.`,
        response_json_schema: {
          type: "object",
          properties: {
            strategic_overview: {
              type: "object",
              properties: {
                summary: { type: "string" },
                phases: { type: "array", items: { type: "string" } },
                turning_points: { type: "array", items: { type: "string" } },
                outcome: { type: "string" }
              }
            },
            ai_simulation_comparison: {
              type: "object",
              properties: {
                casualties_predicted: {
                  type: "object",
                  properties: {
                    military: { type: "number" },
                    civilian: { type: "number" },
                    total: { type: "number" }
                  }
                },
                casualties_actual: {
                  type: "object",
                  properties: {
                    military: { type: "number" },
                    civilian: { type: "number" },
                    total: { type: "number" }
                  }
                },
                duration_predicted_months: { type: "number" },
                duration_actual_months: { type: "number" },
                economic_impact_predicted_billions: { type: "number" },
                economic_impact_actual_billions: { type: "number" },
                predicted_outcomes: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      outcome: { type: "string" },
                      probability: { type: "number" }
                    }
                  }
                },
                actual_outcome: { type: "string" }
              }
            },
            timeline_comparison: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  milestone: { type: "string" },
                  predicted_date: { type: "string" },
                  actual_date: { type: "string" },
                  discrepancy_days: { type: "number" }
                }
              }
            },
            key_decisions: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  decision: { type: "string" },
                  decision_maker: { type: "string" },
                  timing: { type: "string" },
                  predicted_outcome: { type: "string" },
                  actual_outcome: { type: "string" },
                  success_rating: { type: "number" }
                }
              }
            },
            discrepancy_analysis: {
              type: "object",
              properties: {
                prediction_accuracy: { type: "number" },
                major_discrepancies: { type: "array", items: { type: "string" } },
                unexpected_factors: { type: "array", items: { type: "string" } },
                simulation_limitations: { type: "array", items: { type: "string" } },
                lessons_learned: { type: "array", items: { type: "string" } }
              }
            },
            accuracy_metrics: {
              type: "object",
              properties: {
                casualty_accuracy: { type: "number" },
                duration_accuracy: { type: "number" },
                economic_accuracy: { type: "number" },
                outcome_accuracy: { type: "number" },
                overall_accuracy: { type: "number" }
              }
            },
            geopolitical_shifts: {
              type: "object",
              properties: {
                predicted_shifts: { type: "array", items: { type: "string" } },
                actual_shifts: { type: "array", items: { type: "string" } },
                unexpected_consequences: { type: "array", items: { type: "string" } }
              }
            },
            post_conflict_assessment: {
              type: "object",
              properties: {
                long_term_consequences: { type: "array", items: { type: "string" } },
                regional_stability_before: { type: "number" },
                regional_stability_after: { type: "number" },
                international_relations_impact: { type: "string" }
              }
            }
          }
        },
        add_context_from_internet: true
      });

      setDebriefing(result);
      return result;
    }
  });

  React.useEffect(() => {
    if (war) {
      generateDebriefingMutation.mutate();
    }
  }, [war]);

  const getSuccessColor = (rating) => {
    if (rating >= 80) return '#22c55e';
    if (rating >= 60) return '#eab308';
    if (rating >= 40) return '#f97316';
    return '#ef4444';
  };

  // Prepare casualty comparison data
  const casualtyComparisonData = debriefing?.ai_simulation_comparison ? [
    {
      category: 'Military',
      Predicted: debriefing.ai_simulation_comparison.casualties_predicted?.military || 0,
      Actual: debriefing.ai_simulation_comparison.casualties_actual?.military || 0
    },
    {
      category: 'Civilian',
      Predicted: debriefing.ai_simulation_comparison.casualties_predicted?.civilian || 0,
      Actual: debriefing.ai_simulation_comparison.casualties_actual?.civilian || 0
    },
    {
      category: 'Total',
      Predicted: debriefing.ai_simulation_comparison.casualties_predicted?.total || 0,
      Actual: debriefing.ai_simulation_comparison.casualties_actual?.total || 0
    }
  ] : [];

  // Prepare accuracy radar data
  const accuracyRadarData = debriefing?.accuracy_metrics ? [
    { metric: 'Casualties', score: debriefing.accuracy_metrics.casualty_accuracy },
    { metric: 'Duration', score: debriefing.accuracy_metrics.duration_accuracy },
    { metric: 'Economic', score: debriefing.accuracy_metrics.economic_accuracy },
    { metric: 'Outcome', score: debriefing.accuracy_metrics.outcome_accuracy },
  ] : [];

  // Prepare decision success data
  const decisionSuccessData = debriefing?.key_decisions?.map(d => ({
    decision: d.decision.substring(0, 30) + '...',
    success: d.success_rating
  })) || [];

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <Card className="bg-slate-950/95 backdrop-blur-xl cyber-border p-3">
          <p className="text-cyan-400 font-mono text-xs mb-1">{label}</p>
          {payload.map((entry, index) => (
            <p key={index} className="font-mono text-xs" style={{ color: entry.color }}>
              {entry.name}: {typeof entry.value === 'number' ? entry.value.toLocaleString() : entry.value}
            </p>
          ))}
        </Card>
      );
    }
    return null;
  };

  return (
    <Card className="bg-slate-950/95 backdrop-blur-xl cyber-border overflow-hidden max-h-[90vh] flex flex-col">
      {/* Header */}
      <div className="p-6 border-b border-purple-900/30 flex items-center justify-between bg-gradient-to-r from-purple-950/50 to-blue-950/50">
        <div>
          <h2 className="text-2xl font-bold text-purple-400 glow-text font-mono flex items-center gap-3">
            <FileText className="w-7 h-7" />
            WAR DEBRIEFING
          </h2>
          <p className="text-cyan-400 font-mono text-sm mt-1">{war.name}</p>
        </div>
        <Button
          onClick={onClose}
          variant="ghost"
          size="icon"
          className="hover:bg-red-500/20 text-red-400"
        >
          <XCircle className="w-5 h-5" />
        </Button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {generateDebriefingMutation.isPending ? (
          <div className="flex flex-col items-center justify-center py-20 space-y-4">
            <Loader2 className="w-16 h-16 text-purple-400 animate-spin" />
            <div className="text-purple-400 font-mono text-lg">GENERATING DEBRIEFING...</div>
            <p className="text-slate-400 font-mono text-sm">
              Analyzing historical data and comparing with AI predictions
            </p>
          </div>
        ) : debriefing ? (
          <>
            {/* Toggle Comparison View */}
            <Card className="bg-slate-900/50 cyber-border p-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-bold text-cyan-400 font-mono">AI SIMULATION COMPARISON</h3>
                  <p className="text-slate-400 font-mono text-xs mt-1">
                    Compare pre-war AI predictions against actual historical outcomes
                  </p>
                </div>
                <Button
                  onClick={() => setShowComparison(!showComparison)}
                  className="bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-400 border border-cyan-500/30 font-mono"
                >
                  {showComparison ? 'HIDE' : 'SHOW'} COMPARISON
                </Button>
              </div>
            </Card>

            {/* Comparison Section */}
            {showComparison && (
              <div className="space-y-6 animate-in fade-in duration-500">
                {/* Overall Accuracy Score */}
                <Card className="bg-gradient-to-br from-cyan-950/30 to-blue-950/30 backdrop-blur-xl cyber-border p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-xl font-bold text-cyan-400 font-mono">
                      PREDICTION ACCURACY
                    </h3>
                    <div className="text-right">
                      <div className="text-5xl font-bold text-green-400 glow-text font-mono">
                        {debriefing.accuracy_metrics?.overall_accuracy || 0}%
                      </div>
                      <div className="text-xs text-slate-400 font-mono">Overall Score</div>
                    </div>
                  </div>
                  
                  {/* Accuracy Radar Chart */}
                  <div className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <RadarChart data={accuracyRadarData}>
                        <PolarGrid stroke="#334155" />
                        <PolarAngleAxis 
                          dataKey="metric" 
                          tick={{ fill: '#94a3b8', fontFamily: 'monospace', fontSize: 12 }}
                        />
                        <PolarRadiusAxis 
                          angle={90} 
                          domain={[0, 100]}
                          tick={{ fill: '#94a3b8', fontFamily: 'monospace', fontSize: 10 }}
                        />
                        <Radar 
                          name="Accuracy %" 
                          dataKey="score" 
                          stroke="#06b6d4" 
                          fill="#06b6d4" 
                          fillOpacity={0.6}
                        />
                        <Tooltip content={<CustomTooltip />} />
                      </RadarChart>
                    </ResponsiveContainer>
                  </div>
                </Card>

                {/* Casualty Comparison Chart */}
                <Card className="bg-slate-950/80 backdrop-blur-xl cyber-border p-6">
                  <h3 className="text-xl font-bold text-red-400 font-mono mb-4">
                    CASUALTY COMPARISON
                  </h3>
                  <div className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={casualtyComparisonData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                        <XAxis 
                          dataKey="category" 
                          stroke="#64748b"
                          style={{ fontFamily: 'monospace', fontSize: 12 }}
                        />
                        <YAxis 
                          stroke="#64748b"
                          style={{ fontFamily: 'monospace', fontSize: 11 }}
                        />
                        <Tooltip content={<CustomTooltip />} />
                        <Legend wrapperStyle={{ fontFamily: 'monospace', fontSize: 12 }} />
                        <Bar dataKey="Predicted" fill="#eab308" name="AI Predicted" />
                        <Bar dataKey="Actual" fill="#ef4444" name="Actual" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                  
                  {/* Discrepancy Indicators */}
                  <div className="mt-4 grid grid-cols-3 gap-3">
                    {casualtyComparisonData.map((item, idx) => {
                      const diff = ((item.Actual - item.Predicted) / item.Predicted * 100).toFixed(1);
                      return (
                        <div key={idx} className="bg-slate-900/50 cyber-border rounded p-3">
                          <div className="text-xs text-slate-400 font-mono mb-1">{item.category}</div>
                          <div className="flex items-center gap-2">
                            {diff > 0 ? (
                              <TrendingUp className="w-4 h-4 text-red-400" />
                            ) : (
                              <TrendingDown className="w-4 h-4 text-green-400" />
                            )}
                            <span className={`font-mono text-sm font-bold ${diff > 0 ? 'text-red-400' : 'text-green-400'}`}>
                              {diff > 0 ? '+' : ''}{diff}%
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </Card>

                {/* Duration & Economic Comparison */}
                <div className="grid md:grid-cols-2 gap-6">
                  <Card className="bg-slate-950/80 backdrop-blur-xl cyber-border p-6">
                    <h3 className="text-lg font-bold text-yellow-400 font-mono mb-4 flex items-center gap-2">
                      <Calendar className="w-5 h-5" />
                      DURATION COMPARISON
                    </h3>
                    <div className="space-y-4">
                      <div className="bg-slate-900/50 cyber-border rounded p-4">
                        <div className="text-xs text-slate-400 font-mono mb-2">AI Predicted</div>
                        <div className="text-3xl font-bold text-yellow-400 font-mono">
                          {debriefing.ai_simulation_comparison?.duration_predicted_months || 0} months
                        </div>
                      </div>
                      <div className="bg-slate-900/50 cyber-border rounded p-4">
                        <div className="text-xs text-slate-400 font-mono mb-2">Actual Duration</div>
                        <div className="text-3xl font-bold text-orange-400 font-mono">
                          {debriefing.ai_simulation_comparison?.duration_actual_months || 0} months
                        </div>
                      </div>
                      <div className="bg-purple-950/20 cyber-border rounded p-3">
                        <div className="text-xs text-purple-400 font-mono">
                          Difference: {Math.abs(
                            (debriefing.ai_simulation_comparison?.duration_actual_months || 0) - 
                            (debriefing.ai_simulation_comparison?.duration_predicted_months || 0)
                          )} months
                        </div>
                      </div>
                    </div>
                  </Card>

                  <Card className="bg-slate-950/80 backdrop-blur-xl cyber-border p-6">
                    <h3 className="text-lg font-bold text-green-400 font-mono mb-4 flex items-center gap-2">
                      <DollarSign className="w-5 h-5" />
                      ECONOMIC IMPACT
                    </h3>
                    <div className="space-y-4">
                      <div className="bg-slate-900/50 cyber-border rounded p-4">
                        <div className="text-xs text-slate-400 font-mono mb-2">AI Predicted</div>
                        <div className="text-3xl font-bold text-green-400 font-mono">
                          ${(debriefing.ai_simulation_comparison?.economic_impact_predicted_billions || 0).toFixed(1)}B
                        </div>
                      </div>
                      <div className="bg-slate-900/50 cyber-border rounded p-4">
                        <div className="text-xs text-slate-400 font-mono mb-2">Actual Cost</div>
                        <div className="text-3xl font-bold text-red-400 font-mono">
                          ${(debriefing.ai_simulation_comparison?.economic_impact_actual_billions || 0).toFixed(1)}B
                        </div>
                      </div>
                      <div className="bg-purple-950/20 cyber-border rounded p-3">
                        <div className="text-xs text-purple-400 font-mono">
                          Accuracy: {debriefing.accuracy_metrics?.economic_accuracy || 0}%
                        </div>
                      </div>
                    </div>
                  </Card>
                </div>

                {/* Timeline Milestones */}
                {debriefing.timeline_comparison && debriefing.timeline_comparison.length > 0 && (
                  <Card className="bg-slate-950/80 backdrop-blur-xl cyber-border p-6">
                    <h3 className="text-xl font-bold text-purple-400 font-mono mb-4">
                      TIMELINE MILESTONES
                    </h3>
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="border-b border-purple-900/30">
                            <th className="text-left p-3 text-cyan-400 font-mono text-sm">Milestone</th>
                            <th className="text-left p-3 text-yellow-400 font-mono text-sm">Predicted</th>
                            <th className="text-left p-3 text-green-400 font-mono text-sm">Actual</th>
                            <th className="text-left p-3 text-orange-400 font-mono text-sm">Discrepancy</th>
                          </tr>
                        </thead>
                        <tbody>
                          {debriefing.timeline_comparison.map((item, idx) => (
                            <tr key={idx} className="border-b border-slate-800/30 hover:bg-slate-900/30">
                              <td className="p-3 text-slate-300 font-mono text-xs">{item.milestone}</td>
                              <td className="p-3 text-yellow-400 font-mono text-xs">{item.predicted_date}</td>
                              <td className="p-3 text-green-400 font-mono text-xs">{item.actual_date}</td>
                              <td className="p-3 text-orange-400 font-mono text-xs">
                                {Math.abs(item.discrepancy_days)} days {item.discrepancy_days > 0 ? 'late' : 'early'}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </Card>
                )}

                {/* Key Decisions Analysis */}
                {debriefing.key_decisions && debriefing.key_decisions.length > 0 && (
                  <Card className="bg-slate-950/80 backdrop-blur-xl cyber-border p-6">
                    <h3 className="text-xl font-bold text-cyan-400 font-mono mb-4">
                      DECISION SUCCESS RATE
                    </h3>
                    <div className="h-[250px] mb-6">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={decisionSuccessData} layout="vertical">
                          <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                          <XAxis type="number" domain={[0, 100]} stroke="#64748b" style={{ fontFamily: 'monospace', fontSize: 10 }} />
                          <YAxis type="category" dataKey="decision" width={150} stroke="#64748b" style={{ fontFamily: 'monospace', fontSize: 9 }} />
                          <Tooltip content={<CustomTooltip />} />
                          <Bar dataKey="success" fill="#06b6d4" name="Success Rating (%)" />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                    
                    <div className="space-y-3">
                      {debriefing.key_decisions.map((decision, idx) => (
                        <div key={idx} className="bg-slate-900/50 cyber-border rounded p-4">
                          <div className="flex items-start justify-between mb-2">
                            <h4 className="text-sm font-bold text-yellow-400 font-mono flex-1">
                              {decision.decision}
                            </h4>
                            <Badge 
                              style={{ 
                                backgroundColor: `${getSuccessColor(decision.success_rating)}20`,
                                borderColor: `${getSuccessColor(decision.success_rating)}50`,
                                color: getSuccessColor(decision.success_rating)
                              }}
                              className="font-mono text-xs"
                            >
                              {decision.success_rating}% Success
                            </Badge>
                          </div>
                          <div className="grid md:grid-cols-2 gap-3 text-xs font-mono">
                            <div>
                              <span className="text-slate-500">Predicted: </span>
                              <span className="text-slate-300">{decision.predicted_outcome}</span>
                            </div>
                            <div>
                              <span className="text-slate-500">Actual: </span>
                              <span className="text-slate-300">{decision.actual_outcome}</span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </Card>
                )}

                {/* Discrepancy Analysis */}
                <Card className="bg-gradient-to-br from-red-950/30 to-orange-950/30 backdrop-blur-xl cyber-border p-6">
                  <h3 className="text-xl font-bold text-red-400 font-mono mb-4 flex items-center gap-2">
                    <AlertCircle className="w-6 h-6" />
                    DISCREPANCY ANALYSIS
                  </h3>
                  
                  <div className="space-y-4">
                    <div>
                      <h4 className="text-sm font-bold text-orange-400 font-mono mb-2">MAJOR DISCREPANCIES</h4>
                      <ul className="space-y-1">
                        {debriefing.discrepancy_analysis?.major_discrepancies?.map((disc, idx) => (
                          <li key={idx} className="text-slate-300 font-mono text-xs flex items-start gap-2">
                            <span className="text-red-400">•</span>
                            {disc}
                          </li>
                        ))}
                      </ul>
                    </div>
                    
                    <div>
                      <h4 className="text-sm font-bold text-yellow-400 font-mono mb-2">UNEXPECTED FACTORS</h4>
                      <ul className="space-y-1">
                        {debriefing.discrepancy_analysis?.unexpected_factors?.map((factor, idx) => (
                          <li key={idx} className="text-slate-300 font-mono text-xs flex items-start gap-2">
                            <AlertCircle className="w-3 h-3 text-yellow-400 mt-0.5" />
                            {factor}
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div>
                      <h4 className="text-sm font-bold text-cyan-400 font-mono mb-2">LESSONS LEARNED</h4>
                      <ul className="space-y-1">
                        {debriefing.discrepancy_analysis?.lessons_learned?.map((lesson, idx) => (
                          <li key={idx} className="text-slate-300 font-mono text-xs flex items-start gap-2">
                            <CheckCircle2 className="w-3 h-3 text-green-400 mt-0.5" />
                            {lesson}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </Card>
              </div>
            )}

            {/* Strategic Overview */}
            <Card className="bg-slate-950/80 backdrop-blur-xl cyber-border p-6">
              <h3 className="text-xl font-bold text-purple-400 font-mono mb-4">
                STRATEGIC OVERVIEW
              </h3>
              <p className="text-slate-300 font-mono text-sm leading-relaxed mb-4">
                {debriefing.strategic_overview?.summary}
              </p>
              
              {debriefing.strategic_overview?.turning_points && (
                <div className="mb-4">
                  <h4 className="text-sm font-bold text-cyan-400 font-mono mb-2">KEY TURNING POINTS</h4>
                  <ul className="space-y-1">
                    {debriefing.strategic_overview.turning_points.map((point, idx) => (
                      <li key={idx} className="text-slate-400 font-mono text-xs flex items-start gap-2">
                        <Target className="w-3 h-3 text-cyan-400 mt-0.5" />
                        {point}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              
              <div className="p-4 bg-green-950/20 cyber-border rounded">
                <h4 className="text-sm font-bold text-green-400 font-mono mb-2">FINAL OUTCOME</h4>
                <p className="text-slate-300 font-mono text-xs">{debriefing.strategic_overview?.outcome}</p>
              </div>
            </Card>
          </>
        ) : null}
      </div>
    </Card>
  );
}
