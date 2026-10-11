import React, { useState } from 'react';
import { base44 } from '../../api/base44Client';
import { useMutation } from '@tanstack/react-query';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Textarea } from '../ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Progress } from '../ui/progress';
import { 
  Brain, Loader2, Shield, Globe, DollarSign, Users,
  ChevronRight, AlertTriangle, CheckCircle, TrendingUp,
  Clock, Target, Zap
} from 'lucide-react';
import { toast } from 'sonner';
import { RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';

export default function PolicyRecommendationEngine({ threatData, simulationData }) {
  const [customContext, setCustomContext] = useState('');
  const [recommendations, setRecommendations] = useState(null);

  const generateRecommendationsMutation = useMutation({
    mutationFn: async () => {
      const context = customContext || JSON.stringify(threatData || simulationData || {});

      const response = await base44.integrations.Core.InvokeLLM({
        prompt: `You are a senior policy advisor with expertise in conflict resolution, international relations, and crisis management. Based on the following threat assessment or simulation data, generate comprehensive policy recommendations.

CONTEXT:
${context}

Generate detailed policy recommendations across these domains:

1. DIPLOMATIC OPTIONS
   - Bilateral negotiations
   - Multilateral frameworks
   - UN/regional organization involvement
   - Track II diplomacy options

2. ECONOMIC MEASURES
   - Sanctions packages (targeted vs broad)
   - Economic incentives
   - Trade policy adjustments
   - Financial assistance programs

3. MILITARY POSTURE
   - Deterrence options
   - Alliance coordination
   - Force positioning
   - Rules of engagement recommendations

4. HUMANITARIAN INTERVENTIONS
   - Refugee assistance
   - Medical aid deployment
   - Food security programs
   - Civilian protection measures

For each recommendation provide:
- Success probability with confidence interval
- Resource cost estimate
- Timeline to implementation
- Potential side effects and risks
- Prerequisites and dependencies`,
        response_json_schema: {
          type: 'object',
          properties: {
            executive_summary: { type: 'string' },
            overall_situation_assessment: { type: 'string' },
            diplomatic_recommendations: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  title: { type: 'string' },
                  description: { type: 'string' },
                  success_probability: { type: 'number' },
                  confidence_interval: { type: 'string' },
                  resource_cost: { type: 'string' },
                  timeline: { type: 'string' },
                  key_actions: { type: 'array', items: { type: 'string' } },
                  risks: { type: 'array', items: { type: 'string' } },
                  prerequisites: { type: 'array', items: { type: 'string' } }
                }
              }
            },
            economic_recommendations: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  title: { type: 'string' },
                  description: { type: 'string' },
                  success_probability: { type: 'number' },
                  confidence_interval: { type: 'string' },
                  resource_cost: { type: 'string' },
                  economic_impact: { type: 'string' },
                  timeline: { type: 'string' },
                  key_actions: { type: 'array', items: { type: 'string' } },
                  side_effects: { type: 'array', items: { type: 'string' } }
                }
              }
            },
            military_recommendations: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  title: { type: 'string' },
                  description: { type: 'string' },
                  success_probability: { type: 'number' },
                  confidence_interval: { type: 'string' },
                  resource_cost: { type: 'string' },
                  escalation_risk: { type: 'number' },
                  timeline: { type: 'string' },
                  key_actions: { type: 'array', items: { type: 'string' } },
                  risks: { type: 'array', items: { type: 'string' } }
                }
              }
            },
            humanitarian_recommendations: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  title: { type: 'string' },
                  description: { type: 'string' },
                  success_probability: { type: 'number' },
                  resource_cost: { type: 'string' },
                  beneficiaries_estimate: { type: 'number' },
                  timeline: { type: 'string' },
                  key_actions: { type: 'array', items: { type: 'string' } },
                  coordination_needs: { type: 'array', items: { type: 'string' } }
                }
              }
            },
            integrated_strategy: {
              type: 'object',
              properties: {
                recommended_approach: { type: 'string' },
                sequencing: { type: 'array', items: { type: 'string' } },
                total_cost_estimate: { type: 'string' },
                overall_success_probability: { type: 'number' },
                critical_success_factors: { type: 'array', items: { type: 'string' } }
              }
            },
            risk_assessment: {
              type: 'object',
              properties: {
                inaction_risk: { type: 'string' },
                escalation_scenarios: { type: 'array', items: { type: 'string' } },
                mitigation_strategies: { type: 'array', items: { type: 'string' } }
              }
            }
          }
        },
        add_context_from_internet: true
      });

      return response;
    },
    onSuccess: (data) => {
      setRecommendations(data);
      toast.success('Policy recommendations generated');
    }
  });

  const getCategoryIcon = (category) => {
    const icons = {
      diplomatic: Globe,
      economic: DollarSign,
      military: Shield,
      humanitarian: Users
    };
    return icons[category] || Brain;
  };

  const prepareRadarData = () => {
    if (!recommendations) return [];
    return [
      { domain: 'Diplomatic', value: recommendations.diplomatic_recommendations?.[0]?.success_probability || 0 },
      { domain: 'Economic', value: recommendations.economic_recommendations?.[0]?.success_probability || 0 },
      { domain: 'Military', value: recommendations.military_recommendations?.[0]?.success_probability || 0 },
      { domain: 'Humanitarian', value: recommendations.humanitarian_recommendations?.[0]?.success_probability || 0 }
    ];
  };

  const RecommendationCard = ({ rec, category }) => {
    const Icon = getCategoryIcon(category);
    const colorMap = {
      diplomatic: 'blue',
      economic: 'yellow',
      military: 'red',
      humanitarian: 'green'
    };
    const color = colorMap[category] || 'cyan';

    return (
      <div className={`bg-${color}-500/10 border border-${color}-500/30 rounded-lg p-4`}>
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-2">
            <Icon className={`w-5 h-5 text-${color}-400`} />
            <h5 className={`text-${color}-400 font-mono font-bold text-sm`}>{rec.title}</h5>
          </div>
          <Badge className={`bg-${color}-500/20 text-${color}-400 font-mono text-xs`}>
            {rec.success_probability}% success
          </Badge>
        </div>

        <p className="text-slate-400 font-mono text-xs mb-3">{rec.description}</p>

        <div className="grid grid-cols-3 gap-2 mb-3">
          <div className="bg-slate-800/50 rounded p-2">
            <div className="text-[10px] text-slate-500 font-mono">COST</div>
            <div className={`text-${color}-400 font-mono text-xs`}>{rec.resource_cost}</div>
          </div>
          <div className="bg-slate-800/50 rounded p-2">
            <div className="text-[10px] text-slate-500 font-mono">TIMELINE</div>
            <div className={`text-${color}-400 font-mono text-xs`}>{rec.timeline}</div>
          </div>
          <div className="bg-slate-800/50 rounded p-2">
            <div className="text-[10px] text-slate-500 font-mono">CONFIDENCE</div>
            <div className={`text-${color}-400 font-mono text-xs`}>{rec.confidence_interval}</div>
          </div>
        </div>

        {rec.key_actions?.length > 0 && (
          <div className="mb-3">
            <div className="text-[10px] text-slate-500 font-mono mb-1">KEY ACTIONS</div>
            <ul className="space-y-1">
              {rec.key_actions.slice(0, 3).map((action, i) => (
                <li key={i} className="text-slate-300 font-mono text-[10px] flex items-start gap-1">
                  <CheckCircle className="w-3 h-3 mt-0.5 text-green-400 flex-shrink-0" />
                  {action}
                </li>
              ))}
            </ul>
          </div>
        )}

        {rec.risks?.length > 0 && (
          <div>
            <div className="text-[10px] text-red-400 font-mono mb-1">RISKS</div>
            <div className="flex flex-wrap gap-1">
              {rec.risks.slice(0, 3).map((risk, i) => (
                <Badge key={i} variant="outline" className="border-red-500/30 text-red-400 font-mono text-[10px]">
                  {risk}
                </Badge>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <Card className="bg-slate-950/80 backdrop-blur-xl border border-sky-900/40 p-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 rounded-lg bg-green-500/20 border border-green-500/30">
          <Brain className="w-6 h-6 text-green-400" />
        </div>
        <div>
          <h3 className="text-xl font-bold text-green-400 glow-text font-mono">
            AI POLICY RECOMMENDATION ENGINE
          </h3>
          <p className="text-xs text-slate-400 font-mono">AI-generated diplomatic, economic, military & humanitarian recommendations</p>
        </div>
      </div>

      <div className="space-y-4">
        {/* Custom Context */}
        <div>
          <label className="text-green-400 font-mono text-xs mb-1 block">CONTEXT (Optional - uses threat/simulation data if empty)</label>
          <Textarea
            value={customContext}
            onChange={(e) => setCustomContext(e.target.value)}
            placeholder="Describe the situation requiring policy recommendations..."
            className="bg-slate-900/50 border-green-500/30 text-slate-200 font-mono h-20"
          />
        </div>

        <Button
          onClick={() => generateRecommendationsMutation.mutate()}
          disabled={generateRecommendationsMutation.isPending}
          className="w-full bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white font-mono"
        >
          {generateRecommendationsMutation.isPending ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              GENERATING RECOMMENDATIONS...
            </>
          ) : (
            <>
              <Brain className="w-4 h-4 mr-2" />
              GENERATE POLICY RECOMMENDATIONS
            </>
          )}
        </Button>

        {recommendations && (
          <Tabs defaultValue="overview" className="space-y-4">
            <TabsList className="grid grid-cols-5 bg-slate-900/50">
              <TabsTrigger value="overview" className="font-mono text-[10px]">OVERVIEW</TabsTrigger>
              <TabsTrigger value="diplomatic" className="font-mono text-[10px]">DIPLOMATIC</TabsTrigger>
              <TabsTrigger value="economic" className="font-mono text-[10px]">ECONOMIC</TabsTrigger>
              <TabsTrigger value="military" className="font-mono text-[10px]">MILITARY</TabsTrigger>
              <TabsTrigger value="humanitarian" className="font-mono text-[10px]">HUMANITARIAN</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-4">
              {/* Executive Summary */}
              <Card className="bg-green-500/10 border border-green-500/30 p-4">
                <h4 className="text-green-400 font-mono font-bold text-sm mb-2">EXECUTIVE SUMMARY</h4>
                <p className="text-slate-300 font-mono text-sm">{recommendations.executive_summary}</p>
              </Card>

              {/* Radar Chart */}
              <Card className="bg-slate-900/50 border border-sky-800/30 p-4">
                <h4 className="text-cyan-400 font-mono font-bold text-sm mb-4">SUCCESS PROBABILITY BY DOMAIN</h4>
                <div className="h-[250px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <RadarChart data={prepareRadarData()}>
                      <PolarGrid stroke="#334155" />
                      <PolarAngleAxis dataKey="domain" stroke="#94a3b8" style={{ fontSize: '11px', fontFamily: 'monospace' }} />
                      <PolarRadiusAxis domain={[0, 100]} stroke="#64748b" />
                      <Radar name="Success %" dataKey="value" stroke="#22c55e" fill="#22c55e" fillOpacity={0.5} />
                    </RadarChart>
                  </ResponsiveContainer>
                </div>
              </Card>

              {/* Integrated Strategy */}
              {recommendations.integrated_strategy && (
                <Card className="bg-purple-500/10 border border-purple-500/30 p-4">
                  <h4 className="text-purple-400 font-mono font-bold text-sm mb-3 flex items-center gap-2">
                    <Target className="w-4 h-4" />
                    INTEGRATED STRATEGY
                  </h4>
                  <p className="text-slate-300 font-mono text-sm mb-3">{recommendations.integrated_strategy.recommended_approach}</p>
                  
                  <div className="grid grid-cols-2 gap-4 mb-3">
                    <div className="bg-slate-800/50 rounded p-2">
                      <div className="text-[10px] text-slate-500 font-mono">TOTAL COST</div>
                      <div className="text-purple-400 font-mono text-sm">{recommendations.integrated_strategy.total_cost_estimate}</div>
                    </div>
                    <div className="bg-slate-800/50 rounded p-2">
                      <div className="text-[10px] text-slate-500 font-mono">OVERALL SUCCESS</div>
                      <div className="text-green-400 font-mono text-sm">{recommendations.integrated_strategy.overall_success_probability}%</div>
                    </div>
                  </div>

                  {recommendations.integrated_strategy.sequencing?.length > 0 && (
                    <div>
                      <div className="text-[10px] text-purple-400 font-mono mb-2">RECOMMENDED SEQUENCING</div>
                      <ol className="space-y-1">
                        {recommendations.integrated_strategy.sequencing.map((step, i) => (
                          <li key={i} className="text-slate-300 font-mono text-xs flex items-start gap-2">
                            <span className="text-purple-400 font-bold">{i + 1}.</span>
                            {step}
                          </li>
                        ))}
                      </ol>
                    </div>
                  )}
                </Card>
              )}
            </TabsContent>

            <TabsContent value="diplomatic" className="space-y-4">
              {recommendations.diplomatic_recommendations?.map((rec, i) => (
                <RecommendationCard key={i} rec={rec} category="diplomatic" />
              ))}
            </TabsContent>

            <TabsContent value="economic" className="space-y-4">
              {recommendations.economic_recommendations?.map((rec, i) => (
                <RecommendationCard key={i} rec={rec} category="economic" />
              ))}
            </TabsContent>

            <TabsContent value="military" className="space-y-4">
              {recommendations.military_recommendations?.map((rec, i) => (
                <RecommendationCard key={i} rec={rec} category="military" />
              ))}
            </TabsContent>

            <TabsContent value="humanitarian" className="space-y-4">
              {recommendations.humanitarian_recommendations?.map((rec, i) => (
                <RecommendationCard key={i} rec={rec} category="humanitarian" />
              ))}
            </TabsContent>
          </Tabs>
        )}
      </div>
    </Card>
  );
}