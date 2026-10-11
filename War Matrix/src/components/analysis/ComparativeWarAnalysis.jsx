import React, { useState } from 'react';
import { base44 } from '../../api/base44Client';
import { useMutation } from '@tanstack/react-query';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Loader2, TrendingUp, Users, DollarSign, Target, AlertTriangle } from 'lucide-react';
import { LineChart, Line, BarChart, Bar, ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

export default function ComparativeWarAnalysis({ selectedWars }) {
  const [analysis, setAnalysis] = useState(null);

  const generateComparativeAnalysisMutation = useMutation({
    mutationFn: async () => {
      const warsData = selectedWars.map(w => ({
        name: w.name,
        start_date: w.start_date,
        end_date: w.end_date,
        type: w.type,
        description: w.description,
        casualties: w.casualties,
        economic_impact: w.economic_impact,
        outcome: w.outcome,
        consequences: w.consequences,
        countries_involved: w.countries_data?.map(c => c.country_name)
      }));

      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `You are a military historian conducting comparative analysis of ${selectedWars.length} historical conflicts.

WARS TO ANALYZE:
${warsData.map(w => `- ${w.name} (${w.start_date} to ${w.end_date}): ${w.description}`).join('\n')}

Provide comprehensive comparative analysis:

1. COMMON CAUSES & TRIGGERS
   - Identify shared root causes
   - Compare triggering events
   - Analyze similarities in conditions that led to conflict

2. CASUALTY & ECONOMIC TRENDS
   - Compare casualty rates (military vs civilian)
   - Analyze economic impact trends over time
   - Identify patterns in destruction/recovery

3. MILITARY STRATEGIES & DIPLOMATIC EFFECTIVENESS
   - Compare tactical approaches
   - Evaluate success of diplomatic interventions
   - Assess effectiveness of different strategies

4. LONG-TERM GEOPOLITICAL CONSEQUENCES
   - Border changes and territorial impact
   - Power shifts and alliance formations
   - Cultural and societal impacts
   - Lessons learned and policy changes

5. COMPARATIVE METRICS
   - Duration comparison
   - Intensity (casualties per day/month)
   - Economic cost per casualty
   - Post-war recovery periods

Be specific, use actual data, identify patterns and outliers.`,
        response_json_schema: {
          type: "object",
          properties: {
            executive_summary: { type: "string" },
            common_causes: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  cause: { type: "string" },
                  wars_affected: { type: "array", items: { type: "string" } },
                  analysis: { type: "string" }
                }
              }
            },
            casualty_trends: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  war_name: { type: "string" },
                  year: { type: "number" },
                  military_casualties: { type: "number" },
                  civilian_casualties: { type: "number" },
                  casualty_rate_per_day: { type: "number" }
                }
              }
            },
            economic_analysis: {
              type: "object",
              properties: {
                comparative_costs: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      war_name: { type: "string" },
                      total_cost_billions: { type: "number" },
                      cost_per_casualty: { type: "number" },
                      gdp_impact_percent: { type: "number" }
                    }
                  }
                },
                trend_analysis: { type: "string" }
              }
            },
            strategy_effectiveness: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  strategy_type: { type: "string" },
                  wars_used: { type: "array", items: { type: "string" } },
                  success_rate: { type: "number" },
                  effectiveness_analysis: { type: "string" }
                }
              }
            },
            diplomatic_interventions: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  intervention_type: { type: "string" },
                  war_name: { type: "string" },
                  outcome: { type: "string" },
                  effectiveness_score: { type: "number" }
                }
              }
            },
            geopolitical_consequences: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  consequence_type: { type: "string" },
                  wars_involved: { type: "array", items: { type: "string" } },
                  long_term_impact: { type: "string" },
                  modern_relevance: { type: "string" }
                }
              }
            },
            comparative_metrics: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  war_name: { type: "string" },
                  duration_days: { type: "number" },
                  intensity_score: { type: "number" },
                  recovery_period_years: { type: "number" }
                }
              }
            },
            key_insights: { type: "array", items: { type: "string" } },
            historical_patterns: { type: "array", items: { type: "string" } }
          }
        },
        add_context_from_internet: true
      });

      setAnalysis(result);
      return result;
    }
  });

  if (!selectedWars || selectedWars.length < 2) {
    return (
      <Card className="bg-slate-950/80 backdrop-blur-xl cyber-border p-6">
        <div className="text-center py-8">
          <AlertTriangle className="w-12 h-12 text-yellow-400 mx-auto mb-3" />
          <p className="text-yellow-400 font-mono text-sm">
            Select at least 2 wars to perform comparative analysis
          </p>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {!analysis && (
        <Card className="bg-slate-950/80 backdrop-blur-xl cyber-border p-6">
          <div className="text-center space-y-4">
            <h3 className="text-xl font-bold text-cyan-400 glow-text font-mono">
              COMPARATIVE ANALYSIS
            </h3>
            <p className="text-slate-400 font-mono text-sm">
              Analyzing {selectedWars.length} conflicts: {selectedWars.map(w => w.name).join(', ')}
            </p>
            <Button
              onClick={() => generateComparativeAnalysisMutation.mutate()}
              disabled={generateComparativeAnalysisMutation.isPending}
              className="bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white font-mono"
            >
              {generateComparativeAnalysisMutation.isPending ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  ANALYZING...
                </>
              ) : (
                'GENERATE ANALYSIS'
              )}
            </Button>
          </div>
        </Card>
      )}

      {analysis && (
        <>
          <Card className="bg-gradient-to-br from-cyan-950/50 to-blue-950/50 backdrop-blur-xl cyber-border p-6">
            <h3 className="text-2xl font-bold text-cyan-400 glow-text font-mono mb-3">
              EXECUTIVE SUMMARY
            </h3>
            <p className="text-slate-300 font-mono text-sm">{analysis.executive_summary}</p>
          </Card>

          {/* Common Causes */}
          <Card className="bg-slate-950/80 backdrop-blur-xl cyber-border p-6">
            <h3 className="text-xl font-bold text-purple-400 glow-text font-mono mb-4">
              COMMON CAUSES & TRIGGERS
            </h3>
            <div className="space-y-3">
              {analysis.common_causes?.map((cause, idx) => (
                <div key={idx} className="bg-slate-900/50 cyber-border rounded p-4">
                  <h4 className="text-md font-bold text-yellow-400 font-mono mb-2">{cause.cause}</h4>
                  <div className="mb-2">
                    <span className="text-xs text-slate-500 font-mono">Affected Wars: </span>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {cause.wars_affected?.map((war, i) => (
                        <Badge key={i} variant="outline" className="border-purple-500/30 text-purple-400 font-mono text-xs">
                          {war}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  <p className="text-slate-400 font-mono text-xs">{cause.analysis}</p>
                </div>
              ))}
            </div>
          </Card>

          {/* Casualty Trends Chart */}
          {analysis.casualty_trends?.length > 0 && (
            <Card className="bg-slate-950/80 backdrop-blur-xl cyber-border p-6">
              <h3 className="text-xl font-bold text-red-400 glow-text font-mono mb-4 flex items-center gap-2">
                <Users className="w-6 h-6" />
                CASUALTY TRENDS OVER TIME
              </h3>
              <div className="h-[400px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={analysis.casualty_trends}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                    <XAxis dataKey="year" stroke="#94a3b8" style={{ fontFamily: 'monospace', fontSize: '11px' }} />
                    <YAxis stroke="#94a3b8" style={{ fontFamily: 'monospace', fontSize: '11px' }} />
                    <Tooltip contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #334155' }} />
                    <Legend wrapperStyle={{ fontFamily: 'monospace' }} />
                    <Line type="monotone" dataKey="military_casualties" stroke="#ef4444" name="Military" />
                    <Line type="monotone" dataKey="civilian_casualties" stroke="#f97316" name="Civilian" />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </Card>
          )}

          {/* Economic Analysis */}
          {analysis.economic_analysis?.comparative_costs && (
            <Card className="bg-slate-950/80 backdrop-blur-xl cyber-border p-6">
              <h3 className="text-xl font-bold text-yellow-400 glow-text font-mono mb-4 flex items-center gap-2">
                <DollarSign className="w-6 h-6" />
                ECONOMIC IMPACT COMPARISON
              </h3>
              <div className="h-[350px] mb-4">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={analysis.economic_analysis.comparative_costs}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                    <XAxis dataKey="war_name" stroke="#94a3b8" style={{ fontFamily: 'monospace', fontSize: '10px' }} angle={-15} textAnchor="end" height={80} />
                    <YAxis stroke="#94a3b8" style={{ fontFamily: 'monospace', fontSize: '11px' }} />
                    <Tooltip contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #334155' }} />
                    <Legend wrapperStyle={{ fontFamily: 'monospace' }} />
                    <Bar dataKey="total_cost_billions" fill="#fbbf24" name="Total Cost (Billions)" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div className="p-3 bg-yellow-950/20 cyber-border rounded">
                <p className="text-slate-300 font-mono text-sm">{analysis.economic_analysis.trend_analysis}</p>
              </div>
            </Card>
          )}

          {/* Strategy Effectiveness */}
          {analysis.strategy_effectiveness?.length > 0 && (
            <Card className="bg-slate-950/80 backdrop-blur-xl cyber-border p-6">
              <h3 className="text-xl font-bold text-green-400 glow-text font-mono mb-4 flex items-center gap-2">
                <Target className="w-6 h-6" />
                MILITARY STRATEGY EFFECTIVENESS
              </h3>
              <div className="space-y-3">
                {analysis.strategy_effectiveness.map((strategy, idx) => (
                  <div key={idx} className="bg-slate-900/50 cyber-border rounded p-4">
                    <div className="flex items-start justify-between mb-2">
                      <h4 className="text-md font-bold text-cyan-400 font-mono">{strategy.strategy_type}</h4>
                      <Badge className={`${strategy.success_rate > 70 ? 'bg-green-500/20 text-green-400 border-green-500/30' : strategy.success_rate > 40 ? 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30' : 'bg-red-500/20 text-red-400 border-red-500/30'} font-mono`}>
                        {strategy.success_rate}% Success
                      </Badge>
                    </div>
                    <div className="mb-2">
                      <span className="text-xs text-slate-500 font-mono">Used in: </span>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {strategy.wars_used?.map((war, i) => (
                          <Badge key={i} variant="outline" className="border-green-500/30 text-green-400 font-mono text-xs">
                            {war}
                          </Badge>
                        ))}
                      </div>
                    </div>
                    <p className="text-slate-400 font-mono text-xs">{strategy.effectiveness_analysis}</p>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {/* Geopolitical Consequences */}
          {analysis.geopolitical_consequences?.length > 0 && (
            <Card className="bg-slate-950/80 backdrop-blur-xl cyber-border p-6">
              <h3 className="text-xl font-bold text-purple-400 glow-text font-mono mb-4 flex items-center gap-2">
                <TrendingUp className="w-6 h-6" />
                LONG-TERM GEOPOLITICAL CONSEQUENCES
              </h3>
              <div className="space-y-3">
                {analysis.geopolitical_consequences.map((consequence, idx) => (
                  <div key={idx} className="bg-slate-900/50 cyber-border rounded p-4">
                    <h4 className="text-md font-bold text-purple-400 font-mono mb-2">{consequence.consequence_type}</h4>
                    <div className="mb-2">
                      <span className="text-xs text-slate-500 font-mono">Wars Involved: </span>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {consequence.wars_involved?.map((war, i) => (
                          <Badge key={i} variant="outline" className="border-purple-500/30 text-purple-400 font-mono text-xs">
                            {war}
                          </Badge>
                        ))}
                      </div>
                    </div>
                    <div className="mb-2">
                      <div className="text-xs text-slate-500 font-mono mb-1">Long-term Impact:</div>
                      <p className="text-slate-400 font-mono text-xs">{consequence.long_term_impact}</p>
                    </div>
                    <div>
                      <div className="text-xs text-slate-500 font-mono mb-1">Modern Relevance:</div>
                      <p className="text-cyan-400 font-mono text-xs">{consequence.modern_relevance}</p>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {/* Key Insights */}
          <Card className="bg-gradient-to-br from-green-950/50 to-cyan-950/50 backdrop-blur-xl cyber-border p-6">
            <h3 className="text-xl font-bold text-green-400 glow-text font-mono mb-4">
              KEY INSIGHTS & PATTERNS
            </h3>
            <div className="grid md:grid-cols-2 gap-3">
              <div>
                <h4 className="text-sm font-bold text-cyan-400 font-mono mb-2">Key Insights</h4>
                <ul className="space-y-1">
                  {analysis.key_insights?.map((insight, idx) => (
                    <li key={idx} className="text-slate-300 font-mono text-xs flex items-start gap-2">
                      <span className="text-green-400">▸</span>
                      {insight}
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <h4 className="text-sm font-bold text-purple-400 font-mono mb-2">Historical Patterns</h4>
                <ul className="space-y-1">
                  {analysis.historical_patterns?.map((pattern, idx) => (
                    <li key={idx} className="text-slate-300 font-mono text-xs flex items-start gap-2">
                      <span className="text-purple-400">▸</span>
                      {pattern}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </Card>
        </>
      )}
    </div>
  );
}