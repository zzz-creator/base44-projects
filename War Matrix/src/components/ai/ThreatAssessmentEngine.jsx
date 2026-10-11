import React, { useState, useEffect } from 'react';
import { base44 } from '../../api/base44Client';
import { useMutation } from '@tanstack/react-query';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Progress } from '../ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { 
  Shield, Loader2, AlertTriangle, TrendingUp, Eye, 
  Radio, Globe, Zap, ChevronRight, Clock, Target,
  Search, FileText, Crosshair, CheckCircle, Info,
  TrendingDown, Activity, Users, Swords, Brain
} from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';

export default function ThreatAssessmentEngine({ onThreatDetected }) {
  const [threats, setThreats] = useState(null);
  const [isScanning, setIsScanning] = useState(false);
  const [scanProgress, setScanProgress] = useState(0);
  const [selectedThreat, setSelectedThreat] = useState(null);

  const scanThreatsMutation = useMutation({
    mutationFn: async () => {
      setIsScanning(true);
      setScanProgress(0);
      
      const progressInterval = setInterval(() => {
        setScanProgress(prev => Math.min(prev + 6, 90));
      }, 500);

      const response = await base44.integrations.Core.InvokeLLM({
        prompt: `You are an advanced geopolitical threat assessment AI with deep analytical capabilities. Perform a comprehensive global threat scan with IN-DEPTH ANALYSIS for each threat.

Analyze all current global conditions and identify emerging threats BEFORE they fully develop.

For each identified threat, provide EXTENSIVE DETAIL including:

1. BASIC THREAT INFO:
   - Threat name, type, and geographic region
   - Current threat level (1-100)
   - Probability of escalation within 30 days
   - Key indicators and early warning signs
   - Potential cascade effects

2. ROOT CAUSE ANALYSIS (CRITICAL - Be thorough):
   - Underlying geopolitical factors driving this threat
   - Economic factors contributing to instability
   - Social/demographic factors at play
   - Historical grievances or unresolved disputes
   - External actors and their interests
   - Resource competition aspects
   - Ideological or religious dimensions

3. PREDICTIVE TREND ANALYSIS (NEW - Critical):
   - Project threat level trajectory over next 30, 60, 90 days
   - Identify key inflection points that could accelerate escalation
   - Model probability curves for different escalation scenarios
   - Factor in seasonal, political, and economic cycles
   - Provide data points for visualization (10 time periods)

4. COUNTER-STRATEGIES WITH AI SCENARIO MODELING:
   - For each strategy, simulate potential outcomes
   - Model effectiveness under different conditions
   - Estimate probability of success with confidence intervals
   - Identify potential failure modes and their likelihood
   - Recommend optimal timing for intervention

5. RED TEAM ASSESSMENT (NEW - Critical):
   - Challenge the primary threat assessment
   - Present alternative interpretations of the data
   - Identify blind spots and assumptions in the analysis
   - Propose "devil's advocate" scenarios
   - Rate confidence in the primary assessment vs alternatives
   - Highlight what could make the assessment wrong

6. INFORMATION CONFIDENCE SCORE:
   - Overall confidence in assessment (0-100)
   - Data quality score
   - Source reliability assessment
   - Key uncertainties and intelligence gaps

Identify 5-7 emerging threats with this comprehensive analysis.`,
        response_json_schema: {
          type: 'object',
          properties: {
            scan_timestamp: { type: 'string' },
            global_threat_index: { type: 'number' },
            threats: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  id: { type: 'number' },
                  name: { type: 'string' },
                  type: { type: 'string' },
                  region: { type: 'string' },
                  threat_level: { type: 'number' },
                  escalation_probability: { type: 'number' },
                  timeframe: { type: 'string' },
                  indicators: { type: 'array', items: { type: 'string' } },
                  early_warnings: { type: 'array', items: { type: 'string' } },
                  monitoring_priorities: { type: 'array', items: { type: 'string' } },
                  cascade_effects: { type: 'array', items: { type: 'string' } },
                  root_cause_analysis: {
                    type: 'object',
                    properties: {
                      geopolitical_factors: { type: 'array', items: { type: 'string' } },
                      economic_factors: { type: 'array', items: { type: 'string' } },
                      social_factors: { type: 'array', items: { type: 'string' } },
                      historical_grievances: { type: 'array', items: { type: 'string' } },
                      external_actors: { type: 'array', items: { type: 'object', properties: { actor: { type: 'string' }, interest: { type: 'string' } } } },
                      resource_competition: { type: 'string' },
                      ideological_dimensions: { type: 'string' },
                      summary: { type: 'string' }
                    }
                  },
                  predictive_trends: {
                    type: 'object',
                    properties: {
                      trend_summary: { type: 'string' },
                      projection_30_days: { type: 'number' },
                      projection_60_days: { type: 'number' },
                      projection_90_days: { type: 'number' },
                      trend_direction: { type: 'string' },
                      key_inflection_points: { type: 'array', items: { type: 'object', properties: { timeframe: { type: 'string' }, event: { type: 'string' }, impact: { type: 'string' } } } },
                      escalation_scenarios: { type: 'array', items: { type: 'object', properties: { scenario: { type: 'string' }, probability: { type: 'number' }, trigger: { type: 'string' } } } },
                      trend_data: { type: 'array', items: { type: 'object', properties: { period: { type: 'string' }, threat_level: { type: 'number' }, escalation_risk: { type: 'number' } } } }
                    }
                  },
                  counter_strategies: {
                    type: 'array',
                    items: {
                      type: 'object',
                      properties: {
                        strategy_type: { type: 'string' },
                        strategy_name: { type: 'string' },
                        description: { type: 'string' },
                        key_actions: { type: 'array', items: { type: 'string' } },
                        success_probability: { type: 'number' },
                        risks: { type: 'array', items: { type: 'string' } },
                        timeline: { type: 'string' },
                        resources_required: { type: 'string' },
                        scenario_modeling: {
                          type: 'object',
                          properties: {
                            best_case_outcome: { type: 'string' },
                            best_case_probability: { type: 'number' },
                            worst_case_outcome: { type: 'string' },
                            worst_case_probability: { type: 'number' },
                            most_likely_outcome: { type: 'string' },
                            most_likely_probability: { type: 'number' },
                            failure_modes: { type: 'array', items: { type: 'object', properties: { mode: { type: 'string' }, probability: { type: 'number' } } } },
                            optimal_timing: { type: 'string' }
                          }
                        }
                      }
                    }
                  },
                  red_team_assessment: {
                    type: 'object',
                    properties: {
                      primary_assessment_confidence: { type: 'number' },
                      challenge_summary: { type: 'string' },
                      alternative_interpretations: { type: 'array', items: { type: 'object', properties: { interpretation: { type: 'string' }, plausibility: { type: 'number' }, supporting_evidence: { type: 'string' } } } },
                      blind_spots: { type: 'array', items: { type: 'string' } },
                      key_assumptions: { type: 'array', items: { type: 'object', properties: { assumption: { type: 'string' }, confidence: { type: 'number' }, what_if_wrong: { type: 'string' } } } },
                      devils_advocate_scenarios: { type: 'array', items: { type: 'object', properties: { scenario: { type: 'string' }, probability: { type: 'number' }, implications: { type: 'string' } } } },
                      overall_assessment_reliability: { type: 'string' }
                    }
                  },
                  confidence_assessment: {
                    type: 'object',
                    properties: {
                      overall_confidence: { type: 'number' },
                      data_quality_score: { type: 'number' },
                      source_reliability: { type: 'string' },
                      key_uncertainties: { type: 'array', items: { type: 'string' } },
                      intelligence_gaps: { type: 'array', items: { type: 'string' } },
                      confidence_rationale: { type: 'string' }
                    }
                  }
                }
              }
            },
            summary: { type: 'string' }
          }
        },
        add_context_from_internet: true
      });

      clearInterval(progressInterval);
      setScanProgress(100);
      setIsScanning(false);
      return response;
    },
    onSuccess: (data) => {
      setThreats(data);
      if (data.threats?.length > 0) {
        setSelectedThreat(data.threats[0]);
      }
      if (onThreatDetected) {
        onThreatDetected(data.threats);
      }
    }
  });

  const getThreatColor = (level) => {
    if (level >= 80) return 'text-red-400 bg-red-500/20 border-red-500/30';
    if (level >= 60) return 'text-orange-400 bg-orange-500/20 border-orange-500/30';
    if (level >= 40) return 'text-yellow-400 bg-yellow-500/20 border-yellow-500/30';
    return 'text-green-400 bg-green-500/20 border-green-500/30';
  };

  const getConfidenceColor = (score) => {
    if (score >= 80) return 'text-green-400';
    if (score >= 60) return 'text-yellow-400';
    if (score >= 40) return 'text-orange-400';
    return 'text-red-400';
  };

  const getThreatIcon = (type) => {
    const icons = {
      'military': Shield,
      'economic': TrendingUp,
      'political': Globe,
      'social': Eye,
      'environmental': Radio
    };
    return icons[type?.toLowerCase()] || AlertTriangle;
  };

  const getStrategyIcon = (type) => {
    const icons = {
      'diplomatic': Globe,
      'economic': TrendingUp,
      'military': Shield,
      'intelligence': Eye,
      'humanitarian': CheckCircle,
      'information': Radio
    };
    return icons[type?.toLowerCase()] || Zap;
  };

  const getTrendIcon = (direction) => {
    if (direction === 'escalating' || direction === 'increasing') return <TrendingUp className="w-4 h-4 text-red-400" />;
    if (direction === 'de-escalating' || direction === 'decreasing') return <TrendingDown className="w-4 h-4 text-green-400" />;
    return <Activity className="w-4 h-4 text-yellow-400" />;
  };

  return (
    <Card className="bg-slate-950/80 backdrop-blur-xl border border-sky-900/40 p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-red-500/20 border border-red-500/30">
            <Target className="w-6 h-6 text-red-400" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-red-400 glow-text font-mono">
              THREAT ASSESSMENT ENGINE
            </h3>
            <p className="text-xs text-slate-400 font-mono">AI-Powered Early Warning with Predictive Analytics & Red Team Analysis</p>
          </div>
        </div>
        <Button
          onClick={() => scanThreatsMutation.mutate()}
          disabled={isScanning}
          className="bg-gradient-to-r from-red-500 to-orange-500 hover:from-red-600 hover:to-orange-600 text-white font-mono"
        >
          {isScanning ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              SCANNING...
            </>
          ) : (
            <>
              <Radio className="w-4 h-4 mr-2" />
              SCAN THREATS
            </>
          )}
        </Button>
      </div>

      {isScanning && (
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-cyan-400 font-mono text-sm">Performing deep threat analysis with predictive modeling...</span>
            <span className="text-cyan-400 font-mono text-sm">{scanProgress}%</span>
          </div>
          <Progress value={scanProgress} className="h-2" />
        </div>
      )}

      {threats && (
        <div className="space-y-6">
          {/* Global Threat Index */}
          <div className="bg-slate-900/50 border border-sky-800/30 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-slate-400 font-mono text-xs mb-1">GLOBAL THREAT INDEX</div>
                <div className={`text-4xl font-bold font-mono ${
                  threats.global_threat_index >= 70 ? 'text-red-400' :
                  threats.global_threat_index >= 50 ? 'text-orange-400' : 'text-yellow-400'
                }`}>
                  {threats.global_threat_index}
                  <span className="text-lg text-slate-500">/100</span>
                </div>
              </div>
              <div className="text-right">
                <div className="text-slate-400 font-mono text-xs mb-1">LAST SCAN</div>
                <div className="text-sky-400 font-mono text-sm flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {new Date().toLocaleTimeString()}
                </div>
              </div>
            </div>
          </div>

          {/* Threat List and Detail View */}
          <div className="grid lg:grid-cols-3 gap-4">
            {/* Threat List */}
            <div className="space-y-3">
              <div className="text-slate-400 font-mono text-xs mb-2">SELECT THREAT FOR ANALYSIS</div>
              {threats.threats?.map((threat, idx) => {
                const Icon = getThreatIcon(threat.type);
                return (
                  <div
                    key={idx}
                    onClick={() => setSelectedThreat(threat)}
                    className={`bg-slate-900/50 border rounded-lg p-3 cursor-pointer transition-all ${
                      selectedThreat?.id === threat.id 
                        ? 'border-cyan-500 shadow-lg shadow-cyan-500/20' 
                        : 'border-sky-800/30 hover:border-sky-600/50'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className={`p-2 rounded-lg ${getThreatColor(threat.threat_level)}`}>
                        <Icon className="w-4 h-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="text-green-400 font-mono font-bold text-sm truncate">{threat.name}</h4>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge className="bg-slate-700/50 text-slate-300 font-mono text-[10px]">
                            {threat.region}
                          </Badge>
                          <span className={`font-mono text-xs font-bold ${
                            threat.threat_level >= 70 ? 'text-red-400' : 'text-orange-400'
                          }`}>
                            {threat.threat_level}%
                          </span>
                        </div>
                        {/* Trend Indicator */}
                        {threat.predictive_trends && (
                          <div className="flex items-center gap-1 mt-2">
                            {getTrendIcon(threat.predictive_trends.trend_direction)}
                            <span className="font-mono text-[10px] text-slate-400">
                              {threat.predictive_trends.trend_direction}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Detail Panel */}
            <div className="lg:col-span-2">
              {selectedThreat ? (
                <Tabs defaultValue="overview" className="space-y-4">
                  <TabsList className="grid grid-cols-6 bg-slate-900/50">
                    <TabsTrigger value="overview" className="font-mono text-[10px]">OVERVIEW</TabsTrigger>
                    <TabsTrigger value="trends" className="font-mono text-[10px]">TRENDS</TabsTrigger>
                    <TabsTrigger value="rootcause" className="font-mono text-[10px]">ROOT CAUSE</TabsTrigger>
                    <TabsTrigger value="strategies" className="font-mono text-[10px]">STRATEGIES</TabsTrigger>
                    <TabsTrigger value="redteam" className="font-mono text-[10px]">RED TEAM</TabsTrigger>
                    <TabsTrigger value="confidence" className="font-mono text-[10px]">CONFIDENCE</TabsTrigger>
                  </TabsList>

                  {/* Overview Tab */}
                  <TabsContent value="overview" className="space-y-4">
                    <div className="bg-slate-900/50 border border-sky-800/30 rounded-lg p-4">
                      <h4 className="text-xl font-bold text-green-400 font-mono mb-3">{selectedThreat.name}</h4>
                      <div className="grid grid-cols-2 gap-4 mb-4">
                        <div>
                          <div className="text-xs text-slate-500 font-mono mb-1">THREAT LEVEL</div>
                          <div className="flex items-center gap-2">
                            <Progress value={selectedThreat.threat_level} className="h-2 flex-1" />
                            <span className={`font-mono text-lg font-bold ${
                              selectedThreat.threat_level >= 70 ? 'text-red-400' : 'text-orange-400'
                            }`}>{selectedThreat.threat_level}%</span>
                          </div>
                        </div>
                        <div>
                          <div className="text-xs text-slate-500 font-mono mb-1">ESCALATION PROBABILITY</div>
                          <div className="flex items-center gap-2">
                            <Progress value={selectedThreat.escalation_probability} className="h-2 flex-1" />
                            <span className="text-orange-400 font-mono">{selectedThreat.escalation_probability}%</span>
                          </div>
                        </div>
                      </div>

                      <div className="space-y-3">
                        <div>
                          <div className="text-xs text-slate-500 font-mono mb-2">EARLY WARNING INDICATORS</div>
                          <div className="flex flex-wrap gap-2">
                            {selectedThreat.early_warnings?.map((warning, i) => (
                              <Badge key={i} className="bg-red-500/10 text-red-400 border-red-500/20 font-mono text-xs">
                                <AlertTriangle className="w-3 h-3 mr-1" />
                                {warning}
                              </Badge>
                            ))}
                          </div>
                        </div>

                        <div>
                          <div className="text-xs text-slate-500 font-mono mb-2">CASCADE EFFECTS</div>
                          <ul className="space-y-1">
                            {selectedThreat.cascade_effects?.map((effect, i) => (
                              <li key={i} className="text-slate-400 font-mono text-xs flex items-start gap-2">
                                <ChevronRight className="w-3 h-3 mt-0.5 text-orange-400" />
                                {effect}
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    </div>
                  </TabsContent>

                  {/* Predictive Trends Tab */}
                  <TabsContent value="trends" className="space-y-4">
                    <div className="bg-slate-900/50 border border-sky-800/30 rounded-lg p-4">
                      <div className="flex items-center gap-2 mb-4">
                        <Activity className="w-5 h-5 text-purple-400" />
                        <h4 className="text-lg font-bold text-purple-400 font-mono">PREDICTIVE TREND ANALYSIS</h4>
                      </div>

                      {selectedThreat.predictive_trends && (
                        <>
                          {/* Summary */}
                          <div className="bg-purple-500/10 border border-purple-500/30 rounded-lg p-3 mb-4">
                            <p className="text-slate-300 font-mono text-sm">{selectedThreat.predictive_trends.trend_summary}</p>
                          </div>

                          {/* Projections */}
                          <div className="grid grid-cols-3 gap-4 mb-4">
                            <div className="bg-slate-800/50 rounded-lg p-3 text-center">
                              <div className="text-xs text-slate-500 font-mono mb-1">30 DAYS</div>
                              <div className={`text-2xl font-bold font-mono ${
                                selectedThreat.predictive_trends.projection_30_days >= 70 ? 'text-red-400' :
                                selectedThreat.predictive_trends.projection_30_days >= 50 ? 'text-orange-400' : 'text-yellow-400'
                              }`}>
                                {selectedThreat.predictive_trends.projection_30_days}%
                              </div>
                            </div>
                            <div className="bg-slate-800/50 rounded-lg p-3 text-center">
                              <div className="text-xs text-slate-500 font-mono mb-1">60 DAYS</div>
                              <div className={`text-2xl font-bold font-mono ${
                                selectedThreat.predictive_trends.projection_60_days >= 70 ? 'text-red-400' :
                                selectedThreat.predictive_trends.projection_60_days >= 50 ? 'text-orange-400' : 'text-yellow-400'
                              }`}>
                                {selectedThreat.predictive_trends.projection_60_days}%
                              </div>
                            </div>
                            <div className="bg-slate-800/50 rounded-lg p-3 text-center">
                              <div className="text-xs text-slate-500 font-mono mb-1">90 DAYS</div>
                              <div className={`text-2xl font-bold font-mono ${
                                selectedThreat.predictive_trends.projection_90_days >= 70 ? 'text-red-400' :
                                selectedThreat.predictive_trends.projection_90_days >= 50 ? 'text-orange-400' : 'text-yellow-400'
                              }`}>
                                {selectedThreat.predictive_trends.projection_90_days}%
                              </div>
                            </div>
                          </div>

                          {/* Trend Chart */}
                          {selectedThreat.predictive_trends.trend_data?.length > 0 && (
                            <div className="h-[200px] mb-4">
                              <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={selectedThreat.predictive_trends.trend_data}>
                                  <defs>
                                    <linearGradient id="threatGradient" x1="0" y1="0" x2="0" y2="1">
                                      <stop offset="5%" stopColor="#ef4444" stopOpacity={0.8}/>
                                      <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                                    </linearGradient>
                                  </defs>
                                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                                  <XAxis dataKey="period" stroke="#64748b" style={{ fontSize: '10px', fontFamily: 'monospace' }} />
                                  <YAxis stroke="#64748b" style={{ fontSize: '10px', fontFamily: 'monospace' }} domain={[0, 100]} />
                                  <Tooltip 
                                    contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #334155', fontFamily: 'monospace' }}
                                    labelStyle={{ color: '#94a3b8' }}
                                  />
                                  <Area type="monotone" dataKey="threat_level" stroke="#ef4444" fillOpacity={1} fill="url(#threatGradient)" name="Threat Level" />
                                  <Line type="monotone" dataKey="escalation_risk" stroke="#f59e0b" strokeWidth={2} dot={false} name="Escalation Risk" />
                                </AreaChart>
                              </ResponsiveContainer>
                            </div>
                          )}

                          {/* Key Inflection Points */}
                          {selectedThreat.predictive_trends.key_inflection_points?.length > 0 && (
                            <div className="mb-4">
                              <div className="text-xs text-orange-400 font-mono mb-2 font-bold">KEY INFLECTION POINTS</div>
                              <div className="space-y-2">
                                {selectedThreat.predictive_trends.key_inflection_points.map((point, i) => (
                                  <div key={i} className="bg-orange-500/10 border border-orange-500/20 rounded p-2">
                                    <div className="flex items-center justify-between mb-1">
                                      <span className="text-orange-400 font-mono text-xs font-bold">{point.timeframe}</span>
                                      <Badge className="bg-orange-500/20 text-orange-400 font-mono text-[10px]">
                                        {point.impact}
                                      </Badge>
                                    </div>
                                    <p className="text-slate-400 font-mono text-xs">{point.event}</p>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Escalation Scenarios */}
                          {selectedThreat.predictive_trends.escalation_scenarios?.length > 0 && (
                            <div>
                              <div className="text-xs text-red-400 font-mono mb-2 font-bold">ESCALATION SCENARIOS</div>
                              <div className="space-y-2">
                                {selectedThreat.predictive_trends.escalation_scenarios.map((scenario, i) => (
                                  <div key={i} className="bg-red-500/10 border border-red-500/20 rounded p-2">
                                    <div className="flex items-center justify-between mb-1">
                                      <span className="text-red-400 font-mono text-xs font-bold">{scenario.scenario}</span>
                                      <Badge className="bg-red-500/20 text-red-400 font-mono text-[10px]">
                                        {scenario.probability}% probability
                                      </Badge>
                                    </div>
                                    <p className="text-slate-400 font-mono text-xs">Trigger: {scenario.trigger}</p>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  </TabsContent>

                  {/* Root Cause Tab */}
                  <TabsContent value="rootcause" className="space-y-4">
                    <div className="bg-slate-900/50 border border-sky-800/30 rounded-lg p-4">
                      <div className="flex items-center gap-2 mb-4">
                        <Search className="w-5 h-5 text-purple-400" />
                        <h4 className="text-lg font-bold text-purple-400 font-mono">ROOT CAUSE ANALYSIS</h4>
                      </div>

                      {selectedThreat.root_cause_analysis?.summary && (
                        <div className="bg-purple-500/10 border border-purple-500/30 rounded-lg p-3 mb-4">
                          <p className="text-slate-300 font-mono text-sm">{selectedThreat.root_cause_analysis.summary}</p>
                        </div>
                      )}

                      <div className="grid md:grid-cols-2 gap-4">
                        {selectedThreat.root_cause_analysis?.geopolitical_factors?.length > 0 && (
                          <div>
                            <div className="text-xs text-cyan-400 font-mono mb-2 font-bold">GEOPOLITICAL FACTORS</div>
                            <ul className="space-y-1">
                              {selectedThreat.root_cause_analysis.geopolitical_factors.map((f, i) => (
                                <li key={i} className="text-slate-400 font-mono text-xs flex items-start gap-2">
                                  <Globe className="w-3 h-3 mt-0.5 text-cyan-400 flex-shrink-0" />
                                  {f}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}

                        {selectedThreat.root_cause_analysis?.economic_factors?.length > 0 && (
                          <div>
                            <div className="text-xs text-yellow-400 font-mono mb-2 font-bold">ECONOMIC FACTORS</div>
                            <ul className="space-y-1">
                              {selectedThreat.root_cause_analysis.economic_factors.map((f, i) => (
                                <li key={i} className="text-slate-400 font-mono text-xs flex items-start gap-2">
                                  <TrendingUp className="w-3 h-3 mt-0.5 text-yellow-400 flex-shrink-0" />
                                  {f}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}

                        {selectedThreat.root_cause_analysis?.social_factors?.length > 0 && (
                          <div>
                            <div className="text-xs text-green-400 font-mono mb-2 font-bold">SOCIAL FACTORS</div>
                            <ul className="space-y-1">
                              {selectedThreat.root_cause_analysis.social_factors.map((f, i) => (
                                <li key={i} className="text-slate-400 font-mono text-xs flex items-start gap-2">
                                  <Users className="w-3 h-3 mt-0.5 text-green-400 flex-shrink-0" />
                                  {f}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}

                        {selectedThreat.root_cause_analysis?.historical_grievances?.length > 0 && (
                          <div>
                            <div className="text-xs text-orange-400 font-mono mb-2 font-bold">HISTORICAL GRIEVANCES</div>
                            <ul className="space-y-1">
                              {selectedThreat.root_cause_analysis.historical_grievances.map((f, i) => (
                                <li key={i} className="text-slate-400 font-mono text-xs flex items-start gap-2">
                                  <FileText className="w-3 h-3 mt-0.5 text-orange-400 flex-shrink-0" />
                                  {f}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>

                      {selectedThreat.root_cause_analysis?.external_actors?.length > 0 && (
                        <div className="mt-4">
                          <div className="text-xs text-red-400 font-mono mb-2 font-bold">EXTERNAL ACTORS & INTERESTS</div>
                          <div className="grid md:grid-cols-2 gap-2">
                            {selectedThreat.root_cause_analysis.external_actors.map((a, i) => (
                              <div key={i} className="bg-red-500/10 border border-red-500/20 rounded p-2">
                                <div className="text-red-400 font-mono text-sm font-bold">{a.actor}</div>
                                <div className="text-slate-400 font-mono text-xs">{a.interest}</div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </TabsContent>

                  {/* Counter-Strategies Tab with Scenario Modeling */}
                  <TabsContent value="strategies" className="space-y-4">
                    <div className="bg-slate-900/50 border border-sky-800/30 rounded-lg p-4">
                      <div className="flex items-center gap-2 mb-4">
                        <Crosshair className="w-5 h-5 text-green-400" />
                        <h4 className="text-lg font-bold text-green-400 font-mono">COUNTER-STRATEGIES WITH AI MODELING</h4>
                      </div>

                      <div className="space-y-4">
                        {selectedThreat.counter_strategies?.map((strategy, idx) => {
                          const StratIcon = getStrategyIcon(strategy.strategy_type);
                          return (
                            <div key={idx} className="bg-slate-800/50 border border-slate-700/30 rounded-lg p-4">
                              <div className="flex items-start justify-between mb-3">
                                <div className="flex items-center gap-2">
                                  <div className="p-2 rounded-lg bg-green-500/20 border border-green-500/30">
                                    <StratIcon className="w-4 h-4 text-green-400" />
                                  </div>
                                  <div>
                                    <Badge className="bg-slate-700/50 text-slate-300 font-mono text-[10px] mb-1">
                                      {strategy.strategy_type}
                                    </Badge>
                                    <h5 className="text-cyan-400 font-mono font-bold text-sm">{strategy.strategy_name}</h5>
                                  </div>
                                </div>
                                <div className="text-right">
                                  <div className="text-xs text-slate-500 font-mono">Success Probability</div>
                                  <div className={`text-lg font-bold font-mono ${
                                    strategy.success_probability >= 70 ? 'text-green-400' :
                                    strategy.success_probability >= 40 ? 'text-yellow-400' : 'text-red-400'
                                  }`}>{strategy.success_probability}%</div>
                                </div>
                              </div>

                              <p className="text-slate-400 font-mono text-xs mb-3">{strategy.description}</p>

                              {/* Scenario Modeling Results */}
                              {strategy.scenario_modeling && (
                                <div className="bg-cyan-500/10 border border-cyan-500/30 rounded-lg p-3 mb-3">
                                  <div className="text-xs text-cyan-400 font-mono font-bold mb-2 flex items-center gap-1">
                                    <Brain className="w-3 h-3" />
                                    AI SCENARIO MODELING
                                  </div>
                                  <div className="grid grid-cols-3 gap-2 mb-2">
                                    <div className="bg-green-500/10 rounded p-2 text-center">
                                      <div className="text-[10px] text-slate-500 font-mono">BEST CASE</div>
                                      <div className="text-green-400 font-mono text-xs font-bold">{strategy.scenario_modeling.best_case_probability}%</div>
                                      <div className="text-slate-400 font-mono text-[10px]">{strategy.scenario_modeling.best_case_outcome}</div>
                                    </div>
                                    <div className="bg-yellow-500/10 rounded p-2 text-center">
                                      <div className="text-[10px] text-slate-500 font-mono">MOST LIKELY</div>
                                      <div className="text-yellow-400 font-mono text-xs font-bold">{strategy.scenario_modeling.most_likely_probability}%</div>
                                      <div className="text-slate-400 font-mono text-[10px]">{strategy.scenario_modeling.most_likely_outcome}</div>
                                    </div>
                                    <div className="bg-red-500/10 rounded p-2 text-center">
                                      <div className="text-[10px] text-slate-500 font-mono">WORST CASE</div>
                                      <div className="text-red-400 font-mono text-xs font-bold">{strategy.scenario_modeling.worst_case_probability}%</div>
                                      <div className="text-slate-400 font-mono text-[10px]">{strategy.scenario_modeling.worst_case_outcome}</div>
                                    </div>
                                  </div>
                                  {strategy.scenario_modeling.optimal_timing && (
                                    <div className="text-xs font-mono">
                                      <span className="text-slate-500">Optimal Timing: </span>
                                      <span className="text-cyan-400">{strategy.scenario_modeling.optimal_timing}</span>
                                    </div>
                                  )}
                                  {strategy.scenario_modeling.failure_modes?.length > 0 && (
                                    <div className="mt-2">
                                      <div className="text-[10px] text-red-400 font-mono mb-1">FAILURE MODES:</div>
                                      <div className="flex flex-wrap gap-1">
                                        {strategy.scenario_modeling.failure_modes.map((fm, i) => (
                                          <Badge key={i} variant="outline" className="border-red-500/30 text-red-400 font-mono text-[10px]">
                                            {fm.mode} ({fm.probability}%)
                                          </Badge>
                                        ))}
                                      </div>
                                    </div>
                                  )}
                                </div>
                              )}

                              {strategy.key_actions?.length > 0 && (
                                <div className="mb-3">
                                  <div className="text-xs text-slate-500 font-mono mb-1">KEY ACTIONS</div>
                                  <ul className="space-y-1">
                                    {strategy.key_actions.map((action, i) => (
                                      <li key={i} className="text-slate-300 font-mono text-xs flex items-start gap-2">
                                        <CheckCircle className="w-3 h-3 mt-0.5 text-green-400 flex-shrink-0" />
                                        {action}
                                      </li>
                                    ))}
                                  </ul>
                                </div>
                              )}

                              <div className="grid grid-cols-2 gap-4 pt-3 border-t border-slate-700/30">
                                <div>
                                  <div className="text-xs text-slate-500 font-mono">Timeline</div>
                                  <div className="text-cyan-400 font-mono text-xs">{strategy.timeline}</div>
                                </div>
                                <div>
                                  <div className="text-xs text-slate-500 font-mono">Resources</div>
                                  <div className="text-yellow-400 font-mono text-xs">{strategy.resources_required}</div>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </TabsContent>

                  {/* Red Team Assessment Tab */}
                  <TabsContent value="redteam" className="space-y-4">
                    <div className="bg-slate-900/50 border border-sky-800/30 rounded-lg p-4">
                      <div className="flex items-center gap-2 mb-4">
                        <Swords className="w-5 h-5 text-red-400" />
                        <h4 className="text-lg font-bold text-red-400 font-mono">RED TEAM ASSESSMENT</h4>
                      </div>

                      {selectedThreat.red_team_assessment && (
                        <>
                          {/* Primary Assessment Confidence */}
                          <div className="grid grid-cols-2 gap-4 mb-4">
                            <div className="bg-slate-800/50 rounded-lg p-3">
                              <div className="text-xs text-slate-500 font-mono mb-1">PRIMARY ASSESSMENT CONFIDENCE</div>
                              <div className={`text-3xl font-bold font-mono ${getConfidenceColor(selectedThreat.red_team_assessment.primary_assessment_confidence)}`}>
                                {selectedThreat.red_team_assessment.primary_assessment_confidence}%
                              </div>
                            </div>
                            <div className="bg-slate-800/50 rounded-lg p-3">
                              <div className="text-xs text-slate-500 font-mono mb-1">RELIABILITY</div>
                              <div className="text-cyan-400 font-mono text-sm">
                                {selectedThreat.red_team_assessment.overall_assessment_reliability}
                              </div>
                            </div>
                          </div>

                          {/* Challenge Summary */}
                          <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3 mb-4">
                            <div className="text-xs text-red-400 font-mono font-bold mb-1">CHALLENGE SUMMARY</div>
                            <p className="text-slate-300 font-mono text-sm">{selectedThreat.red_team_assessment.challenge_summary}</p>
                          </div>

                          {/* Alternative Interpretations */}
                          {selectedThreat.red_team_assessment.alternative_interpretations?.length > 0 && (
                            <div className="mb-4">
                              <div className="text-xs text-orange-400 font-mono font-bold mb-2">ALTERNATIVE INTERPRETATIONS</div>
                              <div className="space-y-2">
                                {selectedThreat.red_team_assessment.alternative_interpretations.map((alt, i) => (
                                  <div key={i} className="bg-orange-500/10 border border-orange-500/20 rounded p-3">
                                    <div className="flex items-start justify-between mb-1">
                                      <span className="text-orange-400 font-mono text-sm font-bold">{alt.interpretation}</span>
                                      <Badge className="bg-orange-500/20 text-orange-400 font-mono text-[10px]">
                                        {alt.plausibility}% plausible
                                      </Badge>
                                    </div>
                                    <p className="text-slate-400 font-mono text-xs">{alt.supporting_evidence}</p>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Blind Spots */}
                          {selectedThreat.red_team_assessment.blind_spots?.length > 0 && (
                            <div className="mb-4">
                              <div className="text-xs text-yellow-400 font-mono font-bold mb-2">IDENTIFIED BLIND SPOTS</div>
                              <ul className="space-y-1">
                                {selectedThreat.red_team_assessment.blind_spots.map((spot, i) => (
                                  <li key={i} className="text-slate-400 font-mono text-xs flex items-start gap-2">
                                    <AlertTriangle className="w-3 h-3 mt-0.5 text-yellow-400 flex-shrink-0" />
                                    {spot}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}

                          {/* Key Assumptions */}
                          {selectedThreat.red_team_assessment.key_assumptions?.length > 0 && (
                            <div className="mb-4">
                              <div className="text-xs text-cyan-400 font-mono font-bold mb-2">KEY ASSUMPTIONS CHALLENGED</div>
                              <div className="space-y-2">
                                {selectedThreat.red_team_assessment.key_assumptions.map((assumption, i) => (
                                  <div key={i} className="bg-cyan-500/10 border border-cyan-500/20 rounded p-2">
                                    <div className="flex items-start justify-between mb-1">
                                      <span className="text-cyan-400 font-mono text-xs font-bold">{assumption.assumption}</span>
                                      <Badge className="bg-cyan-500/20 text-cyan-400 font-mono text-[10px]">
                                        {assumption.confidence}% confident
                                      </Badge>
                                    </div>
                                    <div className="text-slate-400 font-mono text-xs">
                                      <span className="text-red-400">If wrong: </span>{assumption.what_if_wrong}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Devil's Advocate Scenarios */}
                          {selectedThreat.red_team_assessment.devils_advocate_scenarios?.length > 0 && (
                            <div>
                              <div className="text-xs text-purple-400 font-mono font-bold mb-2">DEVIL'S ADVOCATE SCENARIOS</div>
                              <div className="space-y-2">
                                {selectedThreat.red_team_assessment.devils_advocate_scenarios.map((scenario, i) => (
                                  <div key={i} className="bg-purple-500/10 border border-purple-500/20 rounded p-2">
                                    <div className="flex items-start justify-between mb-1">
                                      <span className="text-purple-400 font-mono text-xs font-bold">{scenario.scenario}</span>
                                      <Badge className="bg-purple-500/20 text-purple-400 font-mono text-[10px]">
                                        {scenario.probability}% chance
                                      </Badge>
                                    </div>
                                    <p className="text-slate-400 font-mono text-xs">{scenario.implications}</p>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  </TabsContent>

                  {/* Confidence Tab */}
                  <TabsContent value="confidence" className="space-y-4">
                    <div className="bg-slate-900/50 border border-sky-800/30 rounded-lg p-4">
                      <div className="flex items-center gap-2 mb-4">
                        <Info className="w-5 h-5 text-blue-400" />
                        <h4 className="text-lg font-bold text-blue-400 font-mono">INFORMATION CONFIDENCE ASSESSMENT</h4>
                      </div>

                      {selectedThreat.confidence_assessment && (
                        <>
                          <div className="grid grid-cols-2 gap-4 mb-6">
                            <div className="bg-slate-800/50 rounded-lg p-4 text-center">
                              <div className="text-xs text-slate-500 font-mono mb-2">OVERALL CONFIDENCE</div>
                              <div className={`text-4xl font-bold font-mono ${getConfidenceColor(selectedThreat.confidence_assessment.overall_confidence)}`}>
                                {selectedThreat.confidence_assessment.overall_confidence}%
                              </div>
                            </div>
                            <div className="bg-slate-800/50 rounded-lg p-4 text-center">
                              <div className="text-xs text-slate-500 font-mono mb-2">DATA QUALITY</div>
                              <div className={`text-4xl font-bold font-mono ${getConfidenceColor(selectedThreat.confidence_assessment.data_quality_score)}`}>
                                {selectedThreat.confidence_assessment.data_quality_score}%
                              </div>
                            </div>
                          </div>

                          <div className="mb-4">
                            <div className="text-xs text-slate-500 font-mono mb-2">SOURCE RELIABILITY</div>
                            <p className="text-cyan-400 font-mono text-sm">{selectedThreat.confidence_assessment.source_reliability}</p>
                          </div>

                          <div className="mb-4 bg-blue-500/10 border border-blue-500/30 rounded-lg p-3">
                            <div className="text-xs text-blue-400 font-mono mb-2 font-bold">CONFIDENCE RATIONALE</div>
                            <p className="text-slate-300 font-mono text-xs">{selectedThreat.confidence_assessment.confidence_rationale}</p>
                          </div>

                          {selectedThreat.confidence_assessment.key_uncertainties?.length > 0 && (
                            <div className="mb-4">
                              <div className="text-xs text-orange-400 font-mono mb-2 font-bold">KEY UNCERTAINTIES</div>
                              <ul className="space-y-1">
                                {selectedThreat.confidence_assessment.key_uncertainties.map((u, i) => (
                                  <li key={i} className="text-slate-400 font-mono text-xs flex items-start gap-2">
                                    <AlertTriangle className="w-3 h-3 mt-0.5 text-orange-400 flex-shrink-0" />
                                    {u}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}

                          {selectedThreat.confidence_assessment.intelligence_gaps?.length > 0 && (
                            <div>
                              <div className="text-xs text-red-400 font-mono mb-2 font-bold">INTELLIGENCE GAPS</div>
                              <ul className="space-y-1">
                                {selectedThreat.confidence_assessment.intelligence_gaps.map((g, i) => (
                                  <li key={i} className="text-slate-400 font-mono text-xs flex items-start gap-2">
                                    <Eye className="w-3 h-3 mt-0.5 text-red-400 flex-shrink-0" />
                                    {g}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  </TabsContent>
                </Tabs>
              ) : (
                <div className="bg-slate-900/50 border border-sky-800/30 rounded-lg p-8 text-center">
                  <Target className="w-12 h-12 text-slate-600 mx-auto mb-3" />
                  <p className="text-slate-500 font-mono text-sm">Select a threat to view detailed analysis</p>
                </div>
              )}
            </div>
          </div>

          {/* Summary */}
          <div className="bg-sky-500/10 border border-sky-500/30 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <Eye className="w-5 h-5 text-sky-400" />
              <h4 className="text-sky-400 font-mono font-bold text-sm">ASSESSMENT SUMMARY</h4>
            </div>
            <p className="text-slate-300 font-mono text-sm">{threats.summary}</p>
          </div>
        </div>
      )}

      {!threats && !isScanning && (
        <div className="text-center py-12">
          <Target className="w-16 h-16 text-slate-600 mx-auto mb-4" />
          <p className="text-slate-500 font-mono text-sm">
            Click "Scan Threats" to initiate comprehensive global threat assessment with predictive analytics
          </p>
        </div>
      )}
    </Card>
  );
}