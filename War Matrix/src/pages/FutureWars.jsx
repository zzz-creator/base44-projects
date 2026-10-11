import React, { useState } from 'react';
import { base44 } from '../api/base44Client';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Card } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Slider } from '../components/ui/slider';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { TrendingUp, Clock, Construction, Zap, Loader2, CloudRain, Droplets, Users, Shield, DollarSign, History, Target, Flame, Orbit, Sparkles, Rocket, Plus, Minus } from 'lucide-react';
import MatrixBackground from '../components/war/MatrixBackground';
import InteractiveWarMap from '../components/war/InteractiveWarMap';
import EnhancedClimateConflictChart from '../components/visualizations/EnhancedClimateConflictChart';
import ClimateResourceConflictNetwork from '../components/visualizations/ClimateResourceConflictNetwork';
import RealTimeDataFeed from '../components/data/RealTimeDataFeed';
import ChoroplethConflictMap from '../components/visualizations/ChoroplethConflictMap';
import EconomicConflictCorrelation from '../components/visualizations/EconomicConflictCorrelation';
import GeopoliticalActorNetwork from '../components/visualizations/GeopoliticalActorNetwork';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar } from 'recharts';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import DecadePredictionChart from '../components/visualizations/DecadePredictionChart';
import PolicyComparisonChart from '../components/visualizations/PolicyComparisonChart';

export default function FutureWars() {
  const [advancedAnalysis, setAdvancedAnalysis] = useState(null);
  const [policySimulation, setPolicySimulation] = useState(null);
  const [policyInputs, setPolicyInputs] = useState({
    intervention_type: '',
    target_region: '',
    climate_investment: 50,
    diplomatic_effort: 50,
    economic_aid: 50
  });
  const [liveData, setLiveData] = useState(null);
  
  // Predictability War state
  const [predictabilityAnalysis, setPredictabilityAnalysis] = useState(null);
  const [selectedYears, setSelectedYears] = useState(50);
  
  // Inevitable Wars state
  const [inevitableWars, setInevitableWars] = useState([]);
  const [userScenario, setUserScenario] = useState('');
  const [aiAnalysis, setAiAnalysis] = useState(null);
  
  // Galaxy Wars state
  const [selectedGalaxyYear, setSelectedGalaxyYear] = useState(2100);
  const [galaxyIncrement, setGalaxyIncrement] = useState(10000);
  const [galaxyPrediction, setGalaxyPrediction] = useState(null);
  
  // Saved simulations for comparison
  const [savedSimulations, setSavedSimulations] = useState(() => {
    const saved = localStorage.getItem('warMatrixSavedSimulations');
    return saved ? JSON.parse(saved) : [];
  });

  // Get settings
  const settings = JSON.parse(localStorage.getItem('warMatrixSettings') || '{}');
  const refreshInterval = settings.dataRefresh?.predictions || 60;

  const { data: wars, isLoading } = useQuery({
    queryKey: ['wars', 'future'],
    queryFn: () => base44.entities.War.filter({ era: 'near_future' }, 'year'),
    initialData: [],
  });

  const generateAdvancedAnalysisMutation = useMutation({
    mutationFn: async () => {
      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `You are an advanced geopolitical AI analyzing future conflict risks with comprehensive factor integration.

Analyze future conflict probabilities (next 5-20 years) incorporating:

1. CLIMATE CHANGE IMPACTS:
   - Sea level rise displacing populations
   - Water scarcity creating regional tensions
   - Agricultural disruption leading to food insecurity
   - Climate migration patterns
   - Resource competition in Arctic/Antarctic regions

2. RESOURCE SCARCITY:
   - Critical mineral shortages (lithium, rare earths)
   - Energy transition conflicts
   - Water resource competition
   - Arable land scarcity
   - Fish stock depletion

3. SOCIO-ECONOMIC INSTABILITY:
   - Wealth inequality trends
   - Unemployment and economic displacement
   - Democratic backsliding
   - Rise of authoritarianism
   - Social fragmentation and polarization
   - Technology-driven job displacement

4. EMERGING TECHNOLOGIES:
   - AI military capabilities
   - Cyber warfare escalation
   - Autonomous weapons systems
   - Space militarization

5. MILITARY & INTELLIGENCE FACTORS:
   - Specific military technologies (drones, hypersonic missiles, AI-guided weapons)
   - Intelligence sharing network effectiveness between allies
   - Cyber defense capabilities and vulnerabilities
   - Space-based surveillance and communication assets

6. PUBLIC SENTIMENT & SOCIAL FACTORS:
   - Public opinion trends on military intervention
   - Social media influence on conflict narratives
   - Domestic political pressures for/against military action
   - Civil society resilience and war-weariness indicators

For each predicted conflict, provide:
- Probability adjusted by all factors
- Primary and secondary drivers
- Climate impact score (0-100)
- Resource scarcity score (0-100)
- Socio-economic instability score (0-100)
- Recommended preventive measures
- Critical intervention points`,
        response_json_schema: {
          type: "object",
          properties: {
            executive_summary: { type: "string" },
            global_risk_trajectory: { type: "string" },
            predicted_conflicts: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  name: { type: "string" },
                  region: { type: "string" },
                  timeframe: { type: "string" },
                  probability: { type: "number" },
                  primary_driver: { type: "string" },
                  secondary_drivers: { type: "array", items: { type: "string" } },
                  climate_impact_score: { type: "number" },
                  resource_scarcity_score: { type: "number" },
                  socio_economic_score: { type: "number" },
                  affected_populations: { type: "number" },
                  potential_casualties: { type: "number" },
                  economic_impact_billions: { type: "number" },
                  intervention_points: { type: "array", items: { type: "string" } },
                  preventive_measures: { type: "array", items: { type: "string" } },
                  coordinates: {
                    type: "object",
                    properties: {
                      latitude: { type: "number" },
                      longitude: { type: "number" }
                    }
                  },
                  military_tech_factors: {
                    type: "object",
                    properties: {
                      key_technologies: { type: "array", items: { type: "string" } },
                      tech_advantage_side: { type: "string" },
                      cyber_warfare_risk: { type: "number" },
                      autonomous_weapons_involvement: { type: "string" }
                    }
                  },
                  intelligence_network_score: { type: "number" },
                  public_sentiment_indicators: {
                    type: "object",
                    properties: {
                      war_support_level: { type: "number" },
                      media_influence_score: { type: "number" },
                      civil_society_resilience: { type: "string" },
                      domestic_political_pressure: { type: "string" }
                    }
                  }
                }
              }
            },
            climate_hotspots: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  region: { type: "string" },
                  climate_risk: { type: "string" },
                  conflict_probability: { type: "number" },
                  analysis: { type: "string" }
                }
              }
            },
            resource_flashpoints: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  resource_type: { type: "string" },
                  competing_nations: { type: "array", items: { type: "string" } },
                  scarcity_level: { type: "number" },
                  conflict_risk: { type: "string" }
                }
              }
            },
            systemic_risks: { type: "array", items: { type: "string" } }
          }
        },
        add_context_from_internet: true
      });

      setAdvancedAnalysis(result);
      return result;
    }
  });

  const simulatePolicyInterventionMutation = useMutation({
    mutationFn: async () => {
      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `Simulate the impact of policy interventions on future conflict scenarios.

INTERVENTION PARAMETERS:
- Type: ${policyInputs.intervention_type}
- Target Region: ${policyInputs.target_region}
- Climate Investment Level: ${policyInputs.climate_investment}/100
- Diplomatic Effort Level: ${policyInputs.diplomatic_effort}/100
- Economic Aid Level: ${policyInputs.economic_aid}/100

CURRENT CONTEXT:
${advancedAnalysis ? JSON.stringify(advancedAnalysis.predicted_conflicts) : 'Use general global conflict trends'}

Analyze:
1. How would these interventions affect conflict probabilities?
2. Which conflicts could be prevented or delayed?
3. What are the second-order effects?
4. Cost-effectiveness analysis
5. Timeline to impact
6. Risk of unintended consequences
7. Detailed second-order effects categorized by:
   - Economic ripple effects (supply chains, trade, markets)
   - Political ramifications (alliances, diplomatic relations)
   - Social impacts (migration, public opinion shifts)
   - Environmental consequences
8. Unintended consequences analysis based on:
   - Game theory models (Nash equilibrium shifts)
   - Historical intervention failure patterns
   - Regional power vacuum risks
   - Proxy conflict escalation potential

Provide before/after conflict probability comparisons with granular analysis.`,
        response_json_schema: {
          type: "object",
          properties: {
            intervention_summary: { type: "string" },
            overall_effectiveness: { type: "number" },
            conflicts_prevented: { type: "number" },
            conflicts_delayed: { type: "number" },
            affected_scenarios: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  conflict_name: { type: "string" },
                  baseline_probability: { type: "number" },
                  post_intervention_probability: { type: "number" },
                  probability_reduction: { type: "number" },
                  timeline_impact: { type: "string" },
                  mechanism: { type: "string" }
                }
              }
            },
            cost_benefit: {
              type: "object",
              properties: {
                estimated_cost_billions: { type: "number" },
                conflicts_prevented_value: { type: "number" },
                roi_ratio: { type: "number" },
                analysis: { type: "string" }
              }
            },
            second_order_effects: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  category: { type: "string" },
                  effect: { type: "string" },
                  likelihood: { type: "number" },
                  timeline: { type: "string" },
                  affected_regions: { type: "array", items: { type: "string" } }
                }
              }
            },
            unintended_consequences: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  consequence: { type: "string" },
                  severity: { type: "string" },
                  probability: { type: "number" },
                  mitigation_strategy: { type: "string" },
                  geopolitical_model: { type: "string" }
                }
              }
            },
            implementation_roadmap: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  phase: { type: "string" },
                  timeframe: { type: "string" },
                  actions: { type: "array", items: { type: "string" } },
                  expected_outcome: { type: "string" }
                }
              }
            },
            recommendations: { type: "array", items: { type: "string" } }
          }
        },
        add_context_from_internet: true
      });

      setPolicySimulation(result);
      return result;
    }
  });

  // Save simulation for comparison
  const saveSimulation = (simulation) => {
    const newSim = {
      id: Date.now().toString(),
      name: `${policyInputs.intervention_type} - ${policyInputs.target_region}`,
      inputs: { ...policyInputs },
      results: simulation,
      created_at: new Date().toISOString()
    };
    const updated = [...savedSimulations, newSim];
    setSavedSimulations(updated);
    localStorage.setItem('warMatrixSavedSimulations', JSON.stringify(updated));
  };

  const prepareRadarData = (conflict) => [
    { factor: 'Climate', value: conflict.climate_impact_score },
    { factor: 'Resources', value: conflict.resource_scarcity_score },
    { factor: 'Socio-Econ', value: conflict.socio_economic_score },
    { factor: 'Probability', value: conflict.probability },
  ];

  const yearOptions = [10, 20, 30, 40, 50, 60, 70, 80, 90, 100];

  const generatePredictabilityAnalysisMutation = useMutation({
    mutationFn: async (years) => {
      const endYear = 2025 + years;
      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `You are a geopolitical analyst and economist. Analyze global trends and predict potential wars over the next ${years} years (2025-${endYear}).
        
        Consider these conflict drivers:
        1. Economic factors: Resource scarcity, trade disputes, economic inequality
        2. Territory: Disputed borders, climate migration, strategic locations
        3. Religion: Ideological conflicts, extremism, religious tensions
        4. Technology: Cyber warfare, AI arms race, space resources
        5. Climate: Water wars, food scarcity, climate refugee crises
        6. Energy: Oil/gas conflicts, rare earth minerals, renewable energy competition
        
        Break down the analysis by decades within this ${years}-year period. For each decade, identify high-probability conflict scenarios with economic indicators, affected regions, and likelihood percentages. Be specific and realistic.`,
        response_json_schema: {
          type: "object",
          properties: {
            overview: { type: "string" },
            time_range: { type: "string" },
            global_trends: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  trend: { type: "string" },
                  impact: { type: "string" },
                  conflict_potential: { type: "number" }
                }
              }
            },
            predictions_by_decade: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  decade: { type: "string" },
                  years: { type: "string" },
                  economic_outlook: { type: "string" },
                  potential_conflicts: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        name: { type: "string" },
                        cause_category: { type: "string" },
                        description: { type: "string" },
                        affected_regions: { type: "array", items: { type: "string" } },
                        probability: { type: "number" },
                        economic_impact: { type: "string" }
                      }
                    }
                  }
                }
              }
            },
            highest_risk_factors: {
              type: "array",
              items: { type: "string" }
            }
          }
        },
        add_context_from_internet: true
      });

      setPredictabilityAnalysis(result);
      return result;
    }
  });

  const generateInevitablePredictionsMutation = useMutation({
    mutationFn: async () => {
      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `You are a geopolitical analyst. Identify inevitable wars and conflicts over the next 20 years based on current tensions, resource disputes, and territorial conflicts.
        
        Focus on conflicts with probability > 70% including:
        - Ongoing territorial disputes (South China Sea, Kashmir, etc.)
        - Resource scarcity conflicts (water, rare earth minerals)
        - Climate-driven migration conflicts
        - Regional power struggles
        
        For each conflict, provide: name, description, probability, economic impact, affected regions. Return 5-8 high-probability conflicts with complete data.`,
        response_json_schema: {
          type: "object",
          properties: {
            wars: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  name: { type: "string" },
                  description: { type: "string" },
                  probability: { type: "number" },
                  economic_impact: { type: "number" },
                  affected_regions: { type: "array", items: { type: "string" } },
                  type: { type: "string" }
                }
              }
            }
          }
        },
        add_context_from_internet: true
      });

      setInevitableWars(result.wars || []);
      return result;
    }
  });

  const analyzeScenarioMutation = useMutation({
    mutationFn: async (scenario) => {
      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `You are an advanced geopolitical AI analyst. Analyze the following scenario and predict potential inevitable conflicts with ENHANCED DETAIL:

SCENARIO/NEWS INPUT:
${scenario}

HISTORICAL CONTEXT:
Provide comparative analysis against major historical conflicts (e.g., World Wars, Cold War, regional conflicts).

Your analysis MUST include:

1. DETAILED CONFLICT PROJECTIONS:
   - Economic Impact: GDP effects, market disruptions, trade impacts, resource price changes
   - Humanitarian Impact: Displacement figures, casualty estimates, refugee crises, health impacts
   - Timeline with specific milestones

2. COMPARATIVE HISTORICAL ANALYSIS:
   - Similar historical conflicts and their outcomes
   - Lessons learned from past interventions
   - Parallel patterns and deviations

3. DIPLOMATIC & INTERVENTION STRATEGIES:
   - Multilateral diplomatic initiatives
   - Economic sanctions/incentives
   - Peacekeeping operations
   - Humanitarian interventions
   - Military posture recommendations
   - Success probability for each strategy`,
        response_json_schema: {
          type: "object",
          properties: {
            scenario_summary: { type: "string" },
            overall_risk_assessment: { type: "string" },
            global_stability_score: { type: "number" },
            predicted_conflicts: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  conflict_name: { type: "string" },
                  risk_score: { type: "number" },
                  risk_level: { type: "string" },
                  probability_percentage: { type: "number" },
                  timeline: { type: "string" },
                  root_causes: { type: "array", items: { type: "string" } },
                  affected_regions: { type: "array", items: { type: "string" } },
                  economic_impact_detailed: {
                    type: "object",
                    properties: {
                      gdp_impact_billions: { type: "number" },
                      market_disruption: { type: "string" },
                      trade_impact: { type: "string" },
                      resource_prices: { type: "string" }
                    }
                  },
                  humanitarian_impact_detailed: {
                    type: "object",
                    properties: {
                      estimated_casualties: { type: "number" },
                      displaced_population: { type: "number" },
                      refugee_crisis_scale: { type: "string" },
                      health_impacts: { type: "array", items: { type: "string" } }
                    }
                  },
                  escalation_pathways: { type: "array", items: { type: "string" } },
                  preventive_measures: { type: "array", items: { type: "string" } }
                }
              }
            },
            historical_comparisons: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  historical_conflict: { type: "string" },
                  similarities: { type: "array", items: { type: "string" } },
                  differences: { type: "array", items: { type: "string" } },
                  lessons_learned: { type: "array", items: { type: "string" } },
                  outcome: { type: "string" }
                }
              }
            },
            diplomatic_strategies: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  strategy_name: { type: "string" },
                  approach: { type: "string" },
                  key_actors: { type: "array", items: { type: "string" } },
                  timeline: { type: "string" },
                  success_probability: { type: "number" },
                  resources_required: { type: "string" }
                }
              }
            },
            intervention_strategies: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  intervention_type: { type: "string" },
                  description: { type: "string" },
                  effectiveness: { type: "number" },
                  risks: { type: "array", items: { type: "string" } },
                  implementation_steps: { type: "array", items: { type: "string" } }
                }
              }
            },
            systemic_risks: { type: "array", items: { type: "string" } },
            recommendations: { type: "array", items: { type: "string" } }
          }
        },
        add_context_from_internet: true
      });

      setAiAnalysis(result);
      return result;
    }
  });

  const generateGalaxyPredictionMutation = useMutation({
    mutationFn: async (year) => {
      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `You are a far-future war historian. Generate a detailed prediction for the year ${year}. Consider: early space colonization (2100-2500), interplanetary wars (2500-10000), interstellar expansion (10000-100000), or galactic empires (100000+). Be creative but scientifically grounded. Include potential alien species if relevant to the timeline.`,
        response_json_schema: {
          type: "object",
          properties: {
            year: { type: "number" },
            era_name: { type: "string" },
            scenario_title: { type: "string" },
            description: { type: "string" },
            earth_status: { type: "string" },
            human_status: { type: "string" },
            major_conflicts: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  name: { type: "string" },
                  participants: { type: "array", items: { type: "string" } },
                  cause: { type: "string" },
                  scale: { type: "string" }
                }
              }
            },
            alien_species: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  name: { type: "string" },
                  description: { type: "string" },
                  relationship: { type: "string" }
                }
              }
            },
            technology_level: { type: "string" },
            probability_note: { type: "string" }
          }
        }
      });

      setGalaxyPrediction(result);
      return result;
    }
  });

  const getCategoryColor = (category) => {
    const colors = {
      economic: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
      territorial: 'bg-red-500/20 text-red-400 border-red-500/30',
      religious: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
      technology: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30',
      climate: 'bg-green-500/20 text-green-400 border-green-500/30',
      energy: 'bg-orange-500/20 text-orange-400 border-orange-500/30'
    };
    return colors[category?.toLowerCase()] || 'bg-slate-500/20 text-slate-400 border-slate-500/30';
  };

  const getRiskColor = (riskScore) => {
    if (riskScore >= 81) return 'from-red-500 to-rose-600';
    if (riskScore >= 61) return 'from-orange-500 to-red-500';
    if (riskScore >= 31) return 'from-yellow-500 to-orange-500';
    return 'from-green-500 to-yellow-500';
  };

  const getRiskBadgeColor = (riskLevel) => {
    const colors = {
      'CRITICAL': 'bg-red-500/20 text-red-400 border-red-500/30',
      'HIGH': 'bg-orange-500/20 text-orange-400 border-orange-500/30',
      'MEDIUM': 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
      'LOW': 'bg-green-500/20 text-green-400 border-green-500/30'
    };
    return colors[riskLevel] || colors['MEDIUM'];
  };

  const yearToDisplay = selectedGalaxyYear >= 1000000 
    ? `${(selectedGalaxyYear / 1000000).toFixed(1)}M` 
    : selectedGalaxyYear >= 100000
    ? `${(selectedGalaxyYear / 1000).toFixed(0)}K`
    : selectedGalaxyYear.toLocaleString();

  const adjustYear = (delta) => {
    const newYear = selectedGalaxyYear + delta;
    if (newYear >= 2025 && newYear <= 2000000) {
      setSelectedGalaxyYear(newYear);
    }
  };

  return (
    <div className="relative min-h-screen">
      <MatrixBackground />
      
      <div className="relative z-10 p-8">
        <div className="max-w-7xl mx-auto space-y-6">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-purple-400 glow-text font-mono mb-2">
              FUTURE WARS
            </h1>
            <p className="text-cyan-400/70 font-mono text-sm">
              Advanced AI Conflict Predictions • Climate + Resources + Socio-Economic Analysis
            </p>
          </div>

          {/* Live Data Feed */}
          <RealTimeDataFeed 
            refreshInterval={refreshInterval}
            onDataUpdate={(data) => {
              setLiveData(data);
              // Could trigger re-analysis based on new climate/economic data
            }}
          />

          {!advancedAnalysis && (
            <Card className="bg-slate-950/80 backdrop-blur-xl cyber-border p-8">
              <div className="text-center space-y-4">
                <Zap className="w-16 h-16 text-purple-400 mx-auto" />
                <h2 className="text-2xl font-bold text-green-400 glow-text font-mono">
                  ADVANCED CONFLICT PREDICTION ENGINE
                </h2>
                <p className="text-slate-400 font-mono text-sm max-w-2xl mx-auto">
                  Generate comprehensive future conflict analysis integrating climate change impacts, 
                  resource scarcity forecasts, and socio-economic instability metrics
                </p>
                <Button
                  onClick={() => generateAdvancedAnalysisMutation.mutate()}
                  disabled={generateAdvancedAnalysisMutation.isPending}
                  className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-mono text-lg py-6 px-8"
                >
                  {generateAdvancedAnalysisMutation.isPending ? (
                    <>
                      <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                      ANALYZING GLOBAL TRENDS...
                    </>
                  ) : (
                    <>
                      <Zap className="w-5 h-5 mr-2" />
                      GENERATE PREDICTIONS
                    </>
                  )}
                </Button>
              </div>
            </Card>
          )}

          {advancedAnalysis && (
            <Tabs defaultValue="predictions" className="space-y-6">
                <TabsList className="grid w-full grid-cols-7 bg-slate-950/80 border border-purple-500/30">
                  <TabsTrigger value="predictions" className="text-xs">PREDICTIONS</TabsTrigger>
                  <TabsTrigger value="predictability" className="text-xs">PREDICTABILITY</TabsTrigger>
                  <TabsTrigger value="inevitable" className="text-xs">INEVITABLE</TabsTrigger>
                  <TabsTrigger value="galactic" className="text-xs">GALACTIC</TabsTrigger>
                  <TabsTrigger value="policy" className="text-xs">POLICY SIM</TabsTrigger>
                  <TabsTrigger value="climate" className="text-xs">CLIMATE</TabsTrigger>
                  <TabsTrigger value="resources" className="text-xs">RESOURCES</TabsTrigger>
                </TabsList>

              {/* Predictability War Tab */}
              <TabsContent value="predictability" className="space-y-6">
                <Card className="bg-slate-950/80 backdrop-blur-xl cyber-border p-6">
                  <div className="space-y-6">
                    <div className="text-center">
                      <Target className="w-12 h-12 text-yellow-400 mx-auto mb-4" />
                      <h2 className="text-2xl font-bold text-yellow-400 glow-text font-mono mb-2">
                        ECONOMIC CONFLICT ANALYSIS
                      </h2>
                      <p className="text-slate-400 font-mono text-sm max-w-2xl mx-auto">
                        Deploy advanced AI models to analyze global economic indicators and forecast potential conflicts
                      </p>
                    </div>

                    <div className="max-w-3xl mx-auto">
                      <label className="text-sm font-mono text-cyan-400 mb-3 block text-center">
                        SELECT FORECAST DURATION
                      </label>
                      <div className="grid grid-cols-5 gap-3">
                        {yearOptions.map((years) => (
                          <Button
                            key={years}
                            onClick={() => setSelectedYears(years)}
                            variant={selectedYears === years ? "default" : "outline"}
                            className={`font-mono ${
                              selectedYears === years
                                ? 'bg-yellow-500 hover:bg-yellow-600 text-black'
                                : 'border-yellow-500/30 text-yellow-400 hover:bg-yellow-500/10'
                            }`}
                          >
                            {years} YRS
                          </Button>
                        ))}
                      </div>
                      <div className="text-center mt-4">
                        <span className="text-green-400 font-mono text-lg font-bold">
                          2025 - {2025 + selectedYears}
                        </span>
                      </div>
                    </div>

                    <Button
                      onClick={() => generatePredictabilityAnalysisMutation.mutate(selectedYears)}
                      disabled={generatePredictabilityAnalysisMutation.isPending}
                      className="w-full bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-white font-mono text-lg py-6 px-8"
                    >
                      {generatePredictabilityAnalysisMutation.isPending ? (
                        <>
                          <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                          ANALYZING GLOBAL TRENDS...
                        </>
                      ) : (
                        <>
                          <Target className="w-5 h-5 mr-2" />
                          GENERATE {selectedYears}-YEAR FORECAST
                        </>
                      )}
                    </Button>
                  </div>
                </Card>

                {predictabilityAnalysis && (
                  <div className="space-y-6 animate-in fade-in duration-500">
                    <Card className="bg-slate-950/80 backdrop-blur-xl cyber-border p-6">
                      <h2 className="text-2xl font-bold text-green-400 glow-text font-mono mb-4">
                        EXECUTIVE SUMMARY
                      </h2>
                      <Badge className="mb-3 bg-cyan-500/20 text-cyan-400 border-cyan-500/30 font-mono">
                        {predictabilityAnalysis.time_range || `${selectedYears}-Year Forecast`}
                      </Badge>
                      <p className="text-slate-300 font-mono leading-relaxed">{predictabilityAnalysis.overview}</p>
                    </Card>

                    {/* Interactive Decade Prediction Chart */}
                    <DecadePredictionChart predictionsData={predictabilityAnalysis} />

                    {predictabilityAnalysis.predictions_by_decade?.length > 0 && (
                      <div className="space-y-6">
                        <h2 className="text-2xl font-bold text-purple-400 glow-text font-mono">
                          DECADE-BY-DECADE FORECAST
                        </h2>
                        {predictabilityAnalysis.predictions_by_decade.map((decade, idx) => (
                          <Card key={idx} className="bg-slate-950/80 backdrop-blur-xl cyber-border p-6">
                            <h3 className="text-2xl font-bold text-green-400 glow-text font-mono mb-2">
                              {decade.decade}
                            </h3>
                            <p className="text-cyan-400 font-mono text-sm mb-4">{decade.years}</p>

                            <div className="mb-6 p-4 bg-slate-900/50 cyber-border rounded-lg">
                              <h4 className="text-sm font-bold text-cyan-400 font-mono mb-2">ECONOMIC OUTLOOK</h4>
                              <p className="text-slate-300 font-mono text-sm">{decade.economic_outlook}</p>
                            </div>

                            <div className="space-y-4">
                              {decade.potential_conflicts?.map((conflict, cIdx) => (
                                <div key={cIdx} className="bg-slate-900/50 cyber-border rounded-lg p-4">
                                  <div className="flex items-start justify-between mb-2">
                                    <h5 className="text-lg font-bold text-yellow-400 font-mono">{conflict.name}</h5>
                                    <Badge className={`font-mono text-xs ${
                                      conflict.probability > 70 ? 'bg-red-500/20 text-red-400 border-red-500/30' :
                                      conflict.probability > 40 ? 'bg-orange-500/20 text-orange-400 border-orange-500/30' :
                                      'bg-yellow-500/20 text-yellow-400 border-yellow-500/30'
                                    }`}>
                                      {conflict.probability}% PROBABILITY
                                    </Badge>
                                  </div>
                                  <Badge className={`mb-3 font-mono text-xs ${getCategoryColor(conflict.cause_category)}`}>
                                    {conflict.cause_category}
                                  </Badge>
                                  <p className="text-slate-400 font-mono text-sm mb-2">{conflict.description}</p>
                                  <div className="text-xs text-slate-500 font-mono">
                                    Economic Impact: <span className="text-orange-400 font-bold">{conflict.economic_impact}</span>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </Card>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </TabsContent>

              {/* Inevitable Wars Tab */}
              <TabsContent value="inevitable" className="space-y-6">
                <Card className="bg-gradient-to-r from-red-950/50 to-orange-950/50 backdrop-blur-xl cyber-border p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <Flame className="w-8 h-8 text-red-400 animate-pulse" />
                    <div>
                      <h2 className="text-2xl font-bold text-red-400 glow-text font-mono">
                        CRITICAL WARNING SYSTEM
                      </h2>
                      <p className="text-slate-300 font-mono text-sm">
                        AI analysis of high-probability conflicts (70%+). Input custom scenarios or view database predictions.
                      </p>
                    </div>
                  </div>
                </Card>

                <Card className="bg-slate-950/80 backdrop-blur-xl cyber-border p-6">
                  <div className="space-y-4">
                    <div className="flex items-center gap-3">
                      <Flame className="w-6 h-6 text-purple-400" />
                      <h3 className="text-xl font-bold text-purple-400 glow-text font-mono">
                        AI SCENARIO ANALYZER
                      </h3>
                    </div>

                    <Textarea
                      value={userScenario}
                      onChange={(e) => setUserScenario(e.target.value)}
                      placeholder="Enter a geopolitical scenario or news to analyze..."
                      className="min-h-[150px] bg-slate-900/50 border-purple-500/30 text-slate-200 font-mono text-sm"
                    />

                    <div className="flex gap-3">
                      <Button
                        onClick={() => analyzeScenarioMutation.mutate(userScenario)}
                        disabled={!userScenario.trim() || analyzeScenarioMutation.isPending}
                        className="flex-1 bg-gradient-to-r from-red-500 to-orange-500 hover:from-red-600 hover:to-orange-600 text-white font-mono py-4"
                      >
                        {analyzeScenarioMutation.isPending ? (
                          <>
                            <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                            ANALYZING...
                          </>
                        ) : (
                          <>
                            <Flame className="w-5 h-5 mr-2" />
                            ANALYZE SCENARIO
                          </>
                        )}
                      </Button>
                      <Button
                        onClick={() => generateInevitablePredictionsMutation.mutate()}
                        disabled={generateInevitablePredictionsMutation.isPending}
                        className="bg-orange-500/20 hover:bg-orange-500/30 text-orange-400 border border-orange-500/30 font-mono"
                      >
                        {generateInevitablePredictionsMutation.isPending ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          'DATABASE'
                        )}
                      </Button>
                    </div>
                  </div>
                </Card>

                {aiAnalysis && (
                  <div className="space-y-6">
                    <Card className="bg-gradient-to-br from-purple-950/50 to-pink-950/50 backdrop-blur-xl cyber-border p-6">
                      <h3 className="text-2xl font-bold text-purple-400 glow-text font-mono mb-3">
                        OVERALL RISK ASSESSMENT
                      </h3>
                      <div className="text-4xl font-bold text-green-400 glow-text font-mono mb-4">
                        {aiAnalysis.global_stability_score}/100
                      </div>
                      <p className="text-slate-300 font-mono text-sm">{aiAnalysis.overall_risk_assessment}</p>
                    </Card>

                    {/* Historical Comparisons */}
                    {aiAnalysis.historical_comparisons?.length > 0 && (
                      <Card className="bg-slate-950/80 backdrop-blur-xl cyber-border p-6">
                        <h3 className="text-xl font-bold text-cyan-400 glow-text font-mono mb-4 flex items-center gap-2">
                          <History className="w-6 h-6" />
                          HISTORICAL COMPARATIVE ANALYSIS
                        </h3>
                        <div className="space-y-4">
                          {aiAnalysis.historical_comparisons.map((comp, idx) => (
                            <div key={idx} className="bg-slate-900/50 cyber-border rounded p-4">
                              <h4 className="text-lg font-bold text-yellow-400 font-mono mb-3">{comp.historical_conflict}</h4>
                              <div className="grid md:grid-cols-2 gap-4 mb-3">
                                <div>
                                  <h5 className="text-xs font-bold text-green-400 font-mono mb-2">SIMILARITIES</h5>
                                  <ul className="space-y-1">
                                    {comp.similarities?.map((sim, i) => (
                                      <li key={i} className="text-slate-300 font-mono text-xs">• {sim}</li>
                                    ))}
                                  </ul>
                                </div>
                                <div>
                                  <h5 className="text-xs font-bold text-orange-400 font-mono mb-2">DIFFERENCES</h5>
                                  <ul className="space-y-1">
                                    {comp.differences?.map((diff, i) => (
                                      <li key={i} className="text-slate-300 font-mono text-xs">• {diff}</li>
                                    ))}
                                  </ul>
                                </div>
                              </div>
                              <div className="pt-3 border-t border-slate-700/30">
                                <h5 className="text-xs font-bold text-purple-400 font-mono mb-2">LESSONS LEARNED</h5>
                                <ul className="space-y-1">
                                  {comp.lessons_learned?.map((lesson, i) => (
                                    <li key={i} className="text-slate-300 font-mono text-xs">✓ {lesson}</li>
                                  ))}
                                </ul>
                              </div>
                            </div>
                          ))}
                        </div>
                      </Card>
                    )}

                    {/* Predicted Conflicts with Enhanced Details */}
                    {aiAnalysis.predicted_conflicts?.map((conflict, idx) => (
                      <Card key={idx} className="bg-slate-950/80 backdrop-blur-xl cyber-border p-6">
                        <div className="flex items-start justify-between mb-3">
                          <h4 className="text-xl font-bold text-yellow-400 font-mono">{conflict.conflict_name}</h4>
                          <Badge className={`font-mono ${getRiskBadgeColor(conflict.risk_level)}`}>
                            {conflict.risk_score}/100
                          </Badge>
                        </div>
                        <p className="text-slate-400 font-mono text-sm mb-4">{conflict.timeline}</p>

                        {/* Economic Impact Details */}
                        {conflict.economic_impact_detailed && (
                          <div className="bg-yellow-950/20 cyber-border rounded p-4 mb-3">
                            <h5 className="text-sm font-bold text-yellow-400 font-mono mb-3 flex items-center gap-2">
                              <DollarSign className="w-4 h-4" />
                              ECONOMIC IMPACT ANALYSIS
                            </h5>
                            <div className="grid md:grid-cols-2 gap-3">
                              <div>
                                <div className="text-xs text-slate-500 font-mono">GDP Impact</div>
                                <div className="text-lg font-bold text-red-400 font-mono">
                                  -${conflict.economic_impact_detailed.gdp_impact_billions}B
                                </div>
                              </div>
                              <div>
                                <div className="text-xs text-slate-500 font-mono">Market Disruption</div>
                                <div className="text-sm text-orange-400 font-mono">
                                  {conflict.economic_impact_detailed.market_disruption}
                                </div>
                              </div>
                            </div>
                            <div className="mt-2 text-xs text-slate-400 font-mono">
                              <strong>Trade Impact:</strong> {conflict.economic_impact_detailed.trade_impact}
                            </div>
                          </div>
                        )}

                        {/* Humanitarian Impact Details */}
                        {conflict.humanitarian_impact_detailed && (
                          <div className="bg-red-950/20 cyber-border rounded p-4 mb-3">
                            <h5 className="text-sm font-bold text-red-400 font-mono mb-3 flex items-center gap-2">
                              <Users className="w-4 h-4" />
                              HUMANITARIAN IMPACT ANALYSIS
                            </h5>
                            <div className="grid md:grid-cols-3 gap-3 mb-3">
                              <div>
                                <div className="text-xs text-slate-500 font-mono">Est. Casualties</div>
                                <div className="text-lg font-bold text-red-400 font-mono">
                                  {conflict.humanitarian_impact_detailed.estimated_casualties?.toLocaleString()}
                                </div>
                              </div>
                              <div>
                                <div className="text-xs text-slate-500 font-mono">Displaced</div>
                                <div className="text-lg font-bold text-orange-400 font-mono">
                                  {(conflict.humanitarian_impact_detailed.displaced_population / 1000000).toFixed(1)}M
                                </div>
                              </div>
                              <div>
                                <div className="text-xs text-slate-500 font-mono">Refugee Crisis</div>
                                <div className="text-sm text-yellow-400 font-mono">
                                  {conflict.humanitarian_impact_detailed.refugee_crisis_scale}
                                </div>
                              </div>
                            </div>
                            {conflict.humanitarian_impact_detailed.health_impacts?.length > 0 && (
                              <div>
                                <div className="text-xs text-slate-500 font-mono mb-1">Health Impacts:</div>
                                <div className="flex flex-wrap gap-1">
                                  {conflict.humanitarian_impact_detailed.health_impacts.map((impact, i) => (
                                    <Badge key={i} variant="outline" className="border-red-500/30 text-red-400 font-mono text-xs">
                                      {impact}
                                    </Badge>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        )}

                        {conflict.escalation_pathways?.length > 0 && (
                          <div className="bg-red-950/20 cyber-border rounded p-3 mb-3">
                            <h5 className="text-sm font-bold text-red-400 font-mono mb-2">ESCALATION PATHWAYS</h5>
                            <ul className="space-y-1">
                              {conflict.escalation_pathways.map((path, i) => (
                                <li key={i} className="text-slate-300 font-mono text-xs flex gap-2">
                                  <span className="text-red-400">{i + 1}.</span>
                                  {path}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}

                        {conflict.preventive_measures?.length > 0 && (
                          <div className="bg-green-950/20 cyber-border rounded p-3">
                            <h5 className="text-sm font-bold text-green-400 font-mono mb-2">PREVENTIVE MEASURES</h5>
                            <ul className="space-y-1">
                              {conflict.preventive_measures.map((measure, i) => (
                                <li key={i} className="text-slate-300 font-mono text-xs flex gap-2">
                                  <span className="text-green-400">✓</span>
                                  {measure}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </Card>
                    ))}

                    {/* Diplomatic Strategies */}
                    {aiAnalysis.diplomatic_strategies?.length > 0 && (
                      <Card className="bg-slate-950/80 backdrop-blur-xl cyber-border p-6">
                        <h3 className="text-xl font-bold text-green-400 glow-text font-mono mb-4 flex items-center gap-2">
                          <Shield className="w-6 h-6" />
                          DIPLOMATIC INTERVENTION STRATEGIES
                        </h3>
                        <div className="space-y-3">
                          {aiAnalysis.diplomatic_strategies.map((strategy, idx) => (
                            <div key={idx} className="bg-slate-900/50 cyber-border rounded p-4">
                              <div className="flex items-start justify-between mb-2">
                                <h4 className="text-md font-bold text-cyan-400 font-mono">{strategy.strategy_name}</h4>
                                <Badge className="bg-green-500/20 text-green-400 border-green-500/30 font-mono">
                                  {strategy.success_probability}% Success
                                </Badge>
                              </div>
                              <p className="text-slate-400 font-mono text-sm mb-2">{strategy.approach}</p>
                              <div className="grid md:grid-cols-2 gap-2 text-xs font-mono">
                                <div>
                                  <span className="text-slate-500">Timeline:</span>
                                  <span className="text-cyan-400 ml-1">{strategy.timeline}</span>
                                </div>
                                <div>
                                  <span className="text-slate-500">Resources:</span>
                                  <span className="text-yellow-400 ml-1">{strategy.resources_required}</span>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </Card>
                    )}

                    {/* Intervention Strategies */}
                    {aiAnalysis.intervention_strategies?.length > 0 && (
                      <Card className="bg-slate-950/80 backdrop-blur-xl cyber-border p-6">
                        <h3 className="text-xl font-bold text-purple-400 glow-text font-mono mb-4 flex items-center gap-2">
                          <Target className="w-6 h-6" />
                          INTERVENTION STRATEGIES
                        </h3>
                        <div className="space-y-3">
                          {aiAnalysis.intervention_strategies.map((intervention, idx) => (
                            <div key={idx} className="bg-slate-900/50 cyber-border rounded p-4">
                              <div className="flex items-start justify-between mb-2">
                                <h4 className="text-md font-bold text-purple-400 font-mono">{intervention.intervention_type}</h4>
                                <Badge className="bg-purple-500/20 text-purple-400 border-purple-500/30 font-mono">
                                  {intervention.effectiveness}% Effective
                                </Badge>
                              </div>
                              <p className="text-slate-400 font-mono text-sm mb-3">{intervention.description}</p>
                              {intervention.implementation_steps?.length > 0 && (
                                <div>
                                  <div className="text-xs text-slate-500 font-mono mb-1">Implementation Steps:</div>
                                  <ol className="space-y-1">
                                    {intervention.implementation_steps.map((step, i) => (
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
                  </div>
                )}

                {inevitableWars.length > 0 && (
                  <Card className="bg-slate-950/80 backdrop-blur-xl cyber-border p-6">
                    <h3 className="text-xl font-bold text-red-400 glow-text font-mono mb-4 flex items-center gap-2">
                      <Flame className="w-5 h-5" />
                      DATABASE PREDICTIONS ({inevitableWars.length})
                    </h3>
                    <div className="space-y-3">
                      {inevitableWars.map((war, idx) => (
                        <div key={idx} className="bg-slate-900/50 cyber-border rounded p-4 border-l-4 border-red-500">
                          <div className="flex items-start justify-between mb-2">
                            <h4 className="text-lg font-bold text-yellow-400 font-mono">{war.name}</h4>
                            <Badge className="bg-red-500/20 text-red-400 border-red-500/30 font-mono">
                              {war.probability}% INEVITABLE
                            </Badge>
                          </div>
                          <p className="text-slate-400 font-mono text-sm">{war.description}</p>
                        </div>
                      ))}
                    </div>
                  </Card>
                )}
              </TabsContent>

              {/* Galactic Wars Tab */}
              <TabsContent value="galactic" className="space-y-6">
                <Card className="bg-slate-950/80 backdrop-blur-xl cyber-border p-8">
                  <div className="space-y-6">
                    <div className="text-center">
                      <div className="text-6xl font-bold text-purple-400 glow-text font-mono mb-2">
                        {yearToDisplay}
                      </div>
                      <p className="text-slate-400 font-mono text-sm">YEAR CE</p>
                    </div>

                    <div className="bg-slate-900/50 cyber-border rounded-lg p-4">
                      <Label className="text-cyan-400 font-mono text-sm mb-3 block">
                        TIME INCREMENT
                      </Label>
                      <div className="grid grid-cols-5 gap-2">
                        {[10, 100, 1000, 10000, 100000].map((inc) => (
                          <Button
                            key={inc}
                            onClick={() => setGalaxyIncrement(inc)}
                            className={`font-mono text-xs ${
                              galaxyIncrement === inc
                                ? 'bg-cyan-500/30 text-cyan-400 border-cyan-500/50'
                                : 'bg-slate-800/50 text-slate-400 border-slate-700/30'
                            } border hover:bg-cyan-500/20`}
                          >
                            {inc >= 100000 ? `${inc / 1000}K` : inc >= 1000 ? `${inc / 1000}K` : inc}
                          </Button>
                        ))}
                      </div>
                    </div>

                    <div className="flex gap-3">
                      <Button
                        onClick={() => adjustYear(-galaxyIncrement)}
                        disabled={selectedGalaxyYear - galaxyIncrement < 2025}
                        className="flex-1 bg-red-500/20 hover:bg-red-500/30 text-red-400 border border-red-500/30 font-mono py-6"
                      >
                        <Minus className="w-5 h-5 mr-2" />
                        -{galaxyIncrement >= 100000 ? `${(galaxyIncrement / 1000).toFixed(0)}K` : galaxyIncrement >= 1000 ? `${(galaxyIncrement / 1000).toFixed(0)}K` : galaxyIncrement}
                      </Button>
                      <Button
                        onClick={() => adjustYear(galaxyIncrement)}
                        disabled={selectedGalaxyYear + galaxyIncrement > 2000000}
                        className="flex-1 bg-green-500/20 hover:bg-green-500/30 text-green-400 border border-green-500/30 font-mono py-6"
                      >
                        <Plus className="w-5 h-5 mr-2" />
                        +{galaxyIncrement >= 100000 ? `${(galaxyIncrement / 1000).toFixed(0)}K` : galaxyIncrement >= 1000 ? `${(galaxyIncrement / 1000).toFixed(0)}K` : galaxyIncrement}
                      </Button>
                    </div>

                    <div className="bg-slate-900/50 cyber-border rounded-lg p-4">
                      <Label className="text-purple-400 font-mono text-sm mb-3 block">
                        QUICK JUMP TO ERA
                      </Label>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                        <Button onClick={() => setSelectedGalaxyYear(2100)} variant="outline" className="border-purple-500/30 text-purple-400 hover:bg-purple-500/10 font-mono text-xs">
                          2100 (Early Space)
                        </Button>
                        <Button onClick={() => setSelectedGalaxyYear(2500)} variant="outline" className="border-purple-500/30 text-purple-400 hover:bg-purple-500/10 font-mono text-xs">
                          2500 (Solar Era)
                        </Button>
                        <Button onClick={() => setSelectedGalaxyYear(10000)} variant="outline" className="border-purple-500/30 text-purple-400 hover:bg-purple-500/10 font-mono text-xs">
                          10K (Interstellar)
                        </Button>
                        <Button onClick={() => setSelectedGalaxyYear(100000)} variant="outline" className="border-purple-500/30 text-purple-400 hover:bg-purple-500/10 font-mono text-xs">
                          100K (Galactic)
                        </Button>
                        <Button onClick={() => setSelectedGalaxyYear(500000)} variant="outline" className="border-purple-500/30 text-purple-400 hover:bg-purple-500/10 font-mono text-xs">
                          500K (Trans-Galactic)
                        </Button>
                        <Button onClick={() => setSelectedGalaxyYear(1000000)} variant="outline" className="border-purple-500/30 text-purple-400 hover:bg-purple-500/10 font-mono text-xs">
                          1M (Beyond)
                        </Button>
                      </div>
                    </div>

                    <Button
                      onClick={() => generateGalaxyPredictionMutation.mutate(selectedGalaxyYear)}
                      disabled={generateGalaxyPredictionMutation.isPending}
                      className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-mono text-lg py-6"
                    >
                      {generateGalaxyPredictionMutation.isPending ? (
                        <>
                          <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                          SIMULATING TIMELINE...
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-5 h-5 mr-2" />
                          GENERATE PREDICTION
                        </>
                      )}
                    </Button>
                  </div>
                </Card>

                {galaxyPrediction && (
                  <div className="space-y-6 animate-in fade-in duration-500">
                    <Card className="bg-slate-950/80 backdrop-blur-xl cyber-border p-6">
                      <div className="flex items-center gap-3 mb-4">
                        <Rocket className="w-6 h-6 text-purple-400" />
                        <h2 className="text-2xl font-bold text-purple-400 glow-text font-mono">
                          {galaxyPrediction.scenario_title}
                        </h2>
                      </div>
                      <Badge className="mb-4 bg-indigo-500/20 text-indigo-400 border-indigo-500/30 font-mono">
                        {galaxyPrediction.era_name}
                      </Badge>
                      <p className="text-slate-300 font-mono leading-relaxed">{galaxyPrediction.description}</p>
                    </Card>

                    <div className="grid md:grid-cols-2 gap-6">
                      <Card className="bg-slate-950/80 backdrop-blur-xl cyber-border p-6">
                        <h3 className="text-lg font-bold text-cyan-400 glow-text font-mono mb-3">
                          EARTH STATUS
                        </h3>
                        <p className="text-slate-300 font-mono text-sm">{galaxyPrediction.earth_status}</p>
                      </Card>

                      <Card className="bg-slate-950/80 backdrop-blur-xl cyber-border p-6">
                        <h3 className="text-lg font-bold text-green-400 glow-text font-mono mb-3">
                          HUMAN STATUS
                        </h3>
                        <p className="text-slate-300 font-mono text-sm">{galaxyPrediction.human_status}</p>
                      </Card>
                    </div>

                    {galaxyPrediction.alien_species?.length > 0 && (
                      <Card className="bg-slate-950/80 backdrop-blur-xl cyber-border p-6">
                        <div className="flex items-center gap-3 mb-4">
                          <Orbit className="w-6 h-6 text-pink-400" />
                          <h3 className="text-xl font-bold text-pink-400 glow-text font-mono">
                            XENOBIOLOGICAL ENTITIES
                          </h3>
                        </div>
                        <div className="space-y-4">
                          {galaxyPrediction.alien_species.map((species, idx) => (
                            <div key={idx} className="bg-slate-900/50 cyber-border rounded-lg p-4">
                              <div className="flex items-center justify-between mb-2">
                                <h4 className="text-lg font-bold text-cyan-400 font-mono">{species.name}</h4>
                                <Badge className="bg-pink-500/20 text-pink-400 border-pink-500/30 font-mono text-xs">
                                  {species.relationship}
                                </Badge>
                              </div>
                              <p className="text-slate-400 font-mono text-sm">{species.description}</p>
                            </div>
                          ))}
                        </div>
                      </Card>
                    )}

                    {galaxyPrediction.major_conflicts?.length > 0 && (
                      <Card className="bg-slate-950/80 backdrop-blur-xl cyber-border p-6">
                        <h3 className="text-xl font-bold text-red-400 glow-text font-mono mb-4">
                          MAJOR CONFLICTS
                        </h3>
                        <div className="space-y-4">
                          {galaxyPrediction.major_conflicts.map((conflict, idx) => (
                            <div key={idx} className="bg-slate-900/50 cyber-border rounded-lg p-4">
                              <h4 className="text-lg font-bold text-yellow-400 font-mono mb-2">{conflict.name}</h4>
                              <p className="text-slate-400 font-mono text-sm mb-3">{conflict.cause}</p>
                              <Badge className="bg-orange-500/20 text-orange-400 border-orange-500/30 font-mono text-xs">
                                Scale: {conflict.scale}
                              </Badge>
                            </div>
                          ))}
                        </div>
                      </Card>
                    )}
                  </div>
                )}

                {inevitableWars.length > 0 && !aiAnalysis && (
                  <Card className="bg-slate-950/80 backdrop-blur-xl cyber-border p-6">
                    <h3 className="text-xl font-bold text-red-400 glow-text font-mono mb-4">
                      HIGH-PROBABILITY CONFLICTS
                    </h3>
                    <div className="space-y-3">
                      {inevitableWars.map((war, idx) => (
                        <div key={idx} className="bg-slate-900/50 cyber-border rounded p-4 border-l-4 border-red-500">
                          <div className="flex items-start justify-between">
                            <h4 className="text-lg font-bold text-yellow-400 font-mono">{war.name}</h4>
                            <Badge className="bg-red-500/20 text-red-400 border-red-500/30 font-mono">
                              {war.probability}%
                            </Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  </Card>
                )}
              </TabsContent>

              <TabsContent value="predictions" className="space-y-6">
                <Card className="bg-gradient-to-br from-purple-950/50 to-pink-950/50 backdrop-blur-xl cyber-border p-6">
                  <h2 className="text-2xl font-bold text-purple-400 glow-text font-mono mb-2">
                    {advancedAnalysis.executive_summary}
                  </h2>
                  <p className="text-slate-300 font-mono text-sm">{advancedAnalysis.global_risk_trajectory}</p>
                </Card>

                {advancedAnalysis.predicted_conflicts?.map((conflict, idx) => (
                  <Card key={idx} className="bg-slate-950/80 backdrop-blur-xl cyber-border p-6">
                    <div className="grid md:grid-cols-2 gap-6">
                      <div>
                        <h3 className="text-2xl font-bold text-cyan-400 font-mono mb-3">{conflict.name}</h3>
                        <Badge className="mb-4 bg-purple-500/20 text-purple-400 border-purple-500/30 font-mono text-lg py-1 px-3">
                          {conflict.probability}% PROBABILITY
                        </Badge>
                        
                        <div className="space-y-3 mb-4">
                          <div className="flex items-center gap-2">
                            <Clock className="w-4 h-4 text-slate-400" />
                            <span className="text-slate-300 font-mono text-sm">Timeframe: {conflict.timeframe}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Shield className="w-4 h-4 text-slate-400" />
                            <span className="text-slate-300 font-mono text-sm">Primary Driver: {conflict.primary_driver}</span>
                          </div>
                        </div>

                        <div className="space-y-2 mb-4">
                          <div className="flex items-center justify-between p-2 bg-blue-950/30 rounded">
                            <span className="text-slate-300 font-mono text-sm flex items-center gap-2">
                              <CloudRain className="w-4 h-4 text-blue-400" />
                              Climate Impact
                            </span>
                            <span className="text-blue-400 font-mono font-bold">{conflict.climate_impact_score}/100</span>
                          </div>
                          <div className="flex items-center justify-between p-2 bg-orange-950/30 rounded">
                            <span className="text-slate-300 font-mono text-sm flex items-center gap-2">
                              <Droplets className="w-4 h-4 text-orange-400" />
                              Resource Scarcity
                            </span>
                            <span className="text-orange-400 font-mono font-bold">{conflict.resource_scarcity_score}/100</span>
                          </div>
                          <div className="flex items-center justify-between p-2 bg-red-950/30 rounded">
                            <span className="text-slate-300 font-mono text-sm flex items-center gap-2">
                              <Users className="w-4 h-4 text-red-400" />
                              Socio-Economic
                            </span>
                            <span className="text-red-400 font-mono font-bold">{conflict.socio_economic_score}/100</span>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3 mb-4">
                          <div className="p-3 bg-slate-900/50 cyber-border rounded">
                            <div className="text-xs text-slate-500 font-mono mb-1">Affected Pop.</div>
                            <div className="text-yellow-400 font-mono font-bold">{(conflict.affected_populations / 1e6).toFixed(1)}M</div>
                          </div>
                          <div className="p-3 bg-slate-900/50 cyber-border rounded">
                            <div className="text-xs text-slate-500 font-mono mb-1">Economic Impact</div>
                            <div className="text-orange-400 font-mono font-bold">${conflict.economic_impact_billions}B</div>
                          </div>
                        </div>
                      </div>

                      <div className="h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                          <RadarChart data={prepareRadarData(conflict)}>
                            <PolarGrid stroke="#475569" />
                            <PolarAngleAxis dataKey="factor" stroke="#94a3b8" style={{ fontFamily: 'monospace', fontSize: '11px' }} />
                            <PolarRadiusAxis stroke="#64748b" domain={[0, 100]} />
                            <Radar name="Risk Factors" dataKey="value" stroke="#a855f7" fill="#a855f7" fillOpacity={0.6} />
                            <Tooltip />
                          </RadarChart>
                        </ResponsiveContainer>
                      </div>
                    </div>

                    {conflict.secondary_drivers?.length > 0 && (
                      <div className="mt-4 pt-4 border-t border-purple-500/20">
                        <div className="text-xs text-slate-500 font-mono mb-2">Secondary Drivers:</div>
                        <div className="flex flex-wrap gap-2">
                          {conflict.secondary_drivers.map((driver, i) => (
                            <Badge key={i} variant="outline" className="border-purple-500/30 text-purple-400 font-mono text-xs">
                              {driver}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Military & Intelligence Factors */}
                    {conflict.military_tech_factors && (
                      <div className="mt-4 p-4 bg-cyan-950/20 cyber-border rounded">
                        <h4 className="text-sm font-bold text-cyan-400 font-mono mb-3 flex items-center gap-2">
                          <Zap className="w-4 h-4" />
                          MILITARY TECHNOLOGY FACTORS
                        </h4>
                        <div className="grid md:grid-cols-2 gap-4">
                          {conflict.military_tech_factors.key_technologies?.length > 0 && (
                            <div>
                              <div className="text-xs text-slate-500 font-mono mb-2">Key Technologies:</div>
                              <div className="flex flex-wrap gap-1">
                                {conflict.military_tech_factors.key_technologies.map((tech, i) => (
                                  <Badge key={i} variant="outline" className="border-cyan-500/30 text-cyan-400 font-mono text-xs">
                                    {tech}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                          )}
                          <div className="space-y-2">
                            {conflict.military_tech_factors.tech_advantage_side && (
                              <div className="flex items-center justify-between">
                                <span className="text-xs text-slate-400 font-mono">Tech Advantage:</span>
                                <span className="text-xs text-cyan-400 font-mono">{conflict.military_tech_factors.tech_advantage_side}</span>
                              </div>
                            )}
                            {conflict.military_tech_factors.cyber_warfare_risk !== undefined && (
                              <div className="flex items-center justify-between">
                                <span className="text-xs text-slate-400 font-mono">Cyber Warfare Risk:</span>
                                <span className="text-xs text-red-400 font-mono">{conflict.military_tech_factors.cyber_warfare_risk}/100</span>
                              </div>
                            )}
                            {conflict.military_tech_factors.autonomous_weapons_involvement && (
                              <div className="flex items-center justify-between">
                                <span className="text-xs text-slate-400 font-mono">Autonomous Weapons:</span>
                                <span className="text-xs text-orange-400 font-mono">{conflict.military_tech_factors.autonomous_weapons_involvement}</span>
                              </div>
                            )}
                          </div>
                        </div>
                        {conflict.intelligence_network_score !== undefined && (
                          <div className="mt-3 pt-3 border-t border-cyan-500/20">
                            <div className="flex items-center justify-between">
                              <span className="text-xs text-slate-400 font-mono">Intelligence Network Effectiveness:</span>
                              <span className="text-lg font-bold text-cyan-400 font-mono">{conflict.intelligence_network_score}/100</span>
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Public Sentiment Indicators */}
                    {conflict.public_sentiment_indicators && (
                      <div className="mt-4 p-4 bg-purple-950/20 cyber-border rounded">
                        <h4 className="text-sm font-bold text-purple-400 font-mono mb-3 flex items-center gap-2">
                          <Users className="w-4 h-4" />
                          PUBLIC SENTIMENT INDICATORS
                        </h4>
                        <div className="grid md:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            {conflict.public_sentiment_indicators.war_support_level !== undefined && (
                              <div>
                                <div className="flex items-center justify-between mb-1">
                                  <span className="text-xs text-slate-400 font-mono">War Support Level:</span>
                                  <span className="text-xs text-purple-400 font-mono">{conflict.public_sentiment_indicators.war_support_level}%</span>
                                </div>
                                <div className="h-1.5 bg-slate-800 rounded-full">
                                  <div 
                                    className="h-full bg-purple-500 rounded-full"
                                    style={{ width: `${conflict.public_sentiment_indicators.war_support_level}%` }}
                                  />
                                </div>
                              </div>
                            )}
                            {conflict.public_sentiment_indicators.media_influence_score !== undefined && (
                              <div>
                                <div className="flex items-center justify-between mb-1">
                                  <span className="text-xs text-slate-400 font-mono">Media Influence:</span>
                                  <span className="text-xs text-pink-400 font-mono">{conflict.public_sentiment_indicators.media_influence_score}/100</span>
                                </div>
                                <div className="h-1.5 bg-slate-800 rounded-full">
                                  <div 
                                    className="h-full bg-pink-500 rounded-full"
                                    style={{ width: `${conflict.public_sentiment_indicators.media_influence_score}%` }}
                                  />
                                </div>
                              </div>
                            )}
                          </div>
                          <div className="space-y-2">
                            {conflict.public_sentiment_indicators.civil_society_resilience && (
                              <div className="flex items-center justify-between">
                                <span className="text-xs text-slate-400 font-mono">Civil Society Resilience:</span>
                                <Badge variant="outline" className="border-purple-500/30 text-purple-400 font-mono text-xs">
                                  {conflict.public_sentiment_indicators.civil_society_resilience}
                                </Badge>
                              </div>
                            )}
                            {conflict.public_sentiment_indicators.domestic_political_pressure && (
                              <div className="flex items-center justify-between">
                                <span className="text-xs text-slate-400 font-mono">Political Pressure:</span>
                                <Badge variant="outline" className="border-pink-500/30 text-pink-400 font-mono text-xs">
                                  {conflict.public_sentiment_indicators.domestic_political_pressure}
                                </Badge>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    )}

                    {conflict.preventive_measures?.length > 0 && (
                      <div className="mt-4 p-4 bg-green-950/20 cyber-border rounded">
                        <h4 className="text-sm font-bold text-green-400 font-mono mb-2 flex items-center gap-2">
                          <Shield className="w-4 h-4" />
                          PREVENTIVE MEASURES
                        </h4>
                        <ul className="space-y-1">
                          {conflict.preventive_measures.map((measure, i) => (
                            <li key={i} className="text-slate-300 font-mono text-xs flex items-start gap-2">
                              <span className="text-green-400">✓</span>
                              {measure}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </Card>
                ))}

                {/* Enhanced Visualizations */}
                {advancedAnalysis.predicted_conflicts?.length > 0 && (
                  <>
                    <ChoroplethConflictMap conflictData={advancedAnalysis.predicted_conflicts} />
                    <EconomicConflictCorrelation 
                      economicData={liveData?.economic_indicators} 
                      conflictData={advancedAnalysis.predicted_conflicts} 
                    />
                    <GeopoliticalActorNetwork conflictData={advancedAnalysis.predicted_conflicts} />
                    <EnhancedClimateConflictChart conflicts={advancedAnalysis.predicted_conflicts} />
                    <ClimateResourceConflictNetwork conflicts={advancedAnalysis.predicted_conflicts} />
                  </>
                )}
              </TabsContent>

              <TabsContent value="policy" className="space-y-6">
                <Card className="bg-slate-950/80 backdrop-blur-xl cyber-border p-6">
                  <h2 className="text-2xl font-bold text-cyan-400 glow-text font-mono mb-4">
                    POLICY INTERVENTION SIMULATOR
                  </h2>
                  
                  <div className="grid md:grid-cols-2 gap-6 mb-6">
                    <div className="space-y-4">
                      <div>
                        <label className="text-slate-300 font-mono text-sm mb-2 block">Intervention Type</label>
                        <Input
                          placeholder="e.g., Green Climate Fund, Peace Diplomacy..."
                          value={policyInputs.intervention_type}
                          onChange={(e) => setPolicyInputs({...policyInputs, intervention_type: e.target.value})}
                          className="bg-slate-900/50 border-cyan-500/30 text-cyan-400 font-mono"
                        />
                      </div>
                      <div>
                        <label className="text-slate-300 font-mono text-sm mb-2 block">Target Region</label>
                        <Input
                          placeholder="e.g., Sub-Saharan Africa, South Asia..."
                          value={policyInputs.target_region}
                          onChange={(e) => setPolicyInputs({...policyInputs, target_region: e.target.value})}
                          className="bg-slate-900/50 border-cyan-500/30 text-cyan-400 font-mono"
                        />
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div>
                        <label className="text-slate-300 font-mono text-sm mb-2 block">
                          Climate Investment: {policyInputs.climate_investment}%
                        </label>
                        <Slider
                          value={[policyInputs.climate_investment]}
                          onValueChange={(v) => setPolicyInputs({...policyInputs, climate_investment: v[0]})}
                          max={100}
                          step={10}
                          className="py-4"
                        />
                      </div>
                      <div>
                        <label className="text-slate-300 font-mono text-sm mb-2 block">
                          Diplomatic Effort: {policyInputs.diplomatic_effort}%
                        </label>
                        <Slider
                          value={[policyInputs.diplomatic_effort]}
                          onValueChange={(v) => setPolicyInputs({...policyInputs, diplomatic_effort: v[0]})}
                          max={100}
                          step={10}
                          className="py-4"
                        />
                      </div>
                      <div>
                        <label className="text-slate-300 font-mono text-sm mb-2 block">
                          Economic Aid: {policyInputs.economic_aid}%
                        </label>
                        <Slider
                          value={[policyInputs.economic_aid]}
                          onValueChange={(v) => setPolicyInputs({...policyInputs, economic_aid: v[0]})}
                          max={100}
                          step={10}
                          className="py-4"
                        />
                      </div>
                    </div>
                  </div>

                  <Button
                    onClick={() => simulatePolicyInterventionMutation.mutate()}
                    disabled={simulatePolicyInterventionMutation.isPending || !policyInputs.intervention_type || !policyInputs.target_region}
                    className="w-full bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white font-mono py-6"
                  >
                    {simulatePolicyInterventionMutation.isPending ? (
                      <>
                        <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                        SIMULATING IMPACT...
                      </>
                    ) : (
                      <>
                        <Zap className="w-5 h-5 mr-2" />
                        RUN SIMULATION
                      </>
                    )}
                  </Button>
                </Card>

                {/* Policy Comparison Chart */}
                {savedSimulations.length > 0 && (
                  <PolicyComparisonChart 
                    savedSimulations={savedSimulations}
                    currentSimulation={policySimulation}
                    onSaveSimulation={saveSimulation}
                  />
                )}

                {policySimulation && (
                  <>
                    <Card className="bg-gradient-to-br from-green-950/50 to-cyan-950/50 backdrop-blur-xl cyber-border p-6">
                      <h3 className="text-xl font-bold text-green-400 glow-text font-mono mb-3">
                        SIMULATION RESULTS
                      </h3>
                      <p className="text-slate-300 font-mono text-sm mb-4">{policySimulation.intervention_summary}</p>
                      
                      <div className="grid md:grid-cols-3 gap-4">
                        <div className="p-4 bg-slate-900/50 cyber-border rounded">
                          <div className="text-xs text-slate-500 font-mono mb-1">Overall Effectiveness</div>
                          <div className="text-3xl font-bold text-green-400 font-mono">{policySimulation.overall_effectiveness}%</div>
                        </div>
                        <div className="p-4 bg-slate-900/50 cyber-border rounded">
                          <div className="text-xs text-slate-500 font-mono mb-1">Conflicts Prevented</div>
                          <div className="text-3xl font-bold text-cyan-400 font-mono">{policySimulation.conflicts_prevented}</div>
                        </div>
                        <div className="p-4 bg-slate-900/50 cyber-border rounded">
                          <div className="text-xs text-slate-500 font-mono mb-1">Conflicts Delayed</div>
                          <div className="text-3xl font-bold text-yellow-400 font-mono">{policySimulation.conflicts_delayed}</div>
                        </div>
                      </div>
                    </Card>

                    {policySimulation.affected_scenarios?.length > 0 && (
                      <Card className="bg-slate-950/80 backdrop-blur-xl cyber-border p-6">
                        <h3 className="text-xl font-bold text-purple-400 glow-text font-mono mb-4">
                          PROBABILITY CHANGES
                        </h3>
                        <div className="space-y-3">
                          {policySimulation.affected_scenarios.map((scenario, idx) => (
                            <div key={idx} className="bg-slate-900/50 cyber-border rounded p-4">
                              <h4 className="text-md font-bold text-cyan-400 font-mono mb-3">{scenario.conflict_name}</h4>
                              <div className="grid grid-cols-3 gap-4 mb-3">
                                <div>
                                  <div className="text-xs text-slate-500 font-mono mb-1">Baseline</div>
                                  <div className="text-xl font-bold text-red-400 font-mono">{scenario.baseline_probability}%</div>
                                </div>
                                <div>
                                  <div className="text-xs text-slate-500 font-mono mb-1">After Intervention</div>
                                  <div className="text-xl font-bold text-green-400 font-mono">{scenario.post_intervention_probability}%</div>
                                </div>
                                <div>
                                  <div className="text-xs text-slate-500 font-mono mb-1">Reduction</div>
                                  <div className="text-xl font-bold text-cyan-400 font-mono">-{scenario.probability_reduction}%</div>
                                </div>
                              </div>
                              <p className="text-slate-400 font-mono text-xs">{scenario.mechanism}</p>
                            </div>
                          ))}
                        </div>
                      </Card>
                    )}

                    {policySimulation.cost_benefit && (
                      <Card className="bg-slate-950/80 backdrop-blur-xl cyber-border p-6">
                        <h3 className="text-xl font-bold text-yellow-400 glow-text font-mono mb-4 flex items-center gap-2">
                          <DollarSign className="w-6 h-6" />
                          COST-BENEFIT ANALYSIS
                        </h3>
                        <div className="grid md:grid-cols-3 gap-4 mb-4">
                          <div className="p-4 bg-orange-950/20 cyber-border rounded">
                            <div className="text-xs text-slate-500 font-mono mb-1">Estimated Cost</div>
                            <div className="text-2xl font-bold text-orange-400 font-mono">${policySimulation.cost_benefit.estimated_cost_billions}B</div>
                          </div>
                          <div className="p-4 bg-green-950/20 cyber-border rounded">
                            <div className="text-xs text-slate-500 font-mono mb-1">Value of Prevented Conflicts</div>
                            <div className="text-2xl font-bold text-green-400 font-mono">${policySimulation.cost_benefit.conflicts_prevented_value}B</div>
                          </div>
                          <div className="p-4 bg-cyan-950/20 cyber-border rounded">
                            <div className="text-xs text-slate-500 font-mono mb-1">ROI Ratio</div>
                            <div className="text-2xl font-bold text-cyan-400 font-mono">{policySimulation.cost_benefit.roi_ratio}x</div>
                          </div>
                        </div>
                        <p className="text-slate-300 font-mono text-sm">{policySimulation.cost_benefit.analysis}</p>
                      </Card>
                    )}

                    {/* Enhanced Second-Order Effects */}
                    {policySimulation.second_order_effects?.length > 0 && (
                      <Card className="bg-slate-950/80 backdrop-blur-xl cyber-border p-6">
                        <h3 className="text-xl font-bold text-purple-400 glow-text font-mono mb-4">
                          SECOND-ORDER EFFECTS ANALYSIS
                        </h3>
                        <div className="space-y-3">
                          {policySimulation.second_order_effects.map((effect, idx) => (
                            <div key={idx} className="bg-slate-900/50 cyber-border rounded p-4">
                              <div className="flex items-start justify-between mb-2">
                                <Badge className="bg-purple-500/20 text-purple-400 border-purple-500/30 font-mono text-xs">
                                  {effect.category || 'General'}
                                </Badge>
                                <span className="text-xs text-slate-400 font-mono">
                                  {effect.likelihood ? `${effect.likelihood}% likely` : ''}
                                </span>
                              </div>
                              <p className="text-slate-300 font-mono text-sm mb-2">
                                {typeof effect === 'string' ? effect : effect.effect}
                              </p>
                              {effect.timeline && (
                                <span className="text-xs text-cyan-400 font-mono">Timeline: {effect.timeline}</span>
                              )}
                            </div>
                          ))}
                        </div>
                      </Card>
                    )}

                    {/* Enhanced Unintended Consequences */}
                    {policySimulation.unintended_consequences?.length > 0 && (
                      <Card className="bg-slate-950/80 backdrop-blur-xl cyber-border p-6">
                        <h3 className="text-xl font-bold text-red-400 glow-text font-mono mb-4">
                          UNINTENDED CONSEQUENCES ANALYSIS
                        </h3>
                        <div className="space-y-3">
                          {policySimulation.unintended_consequences.map((consequence, idx) => (
                            <div key={idx} className="bg-red-950/20 cyber-border rounded p-4 border-l-4 border-red-500/50">
                              <div className="flex items-start justify-between mb-2">
                                <Badge className={`font-mono text-xs ${
                                  (consequence.severity === 'HIGH' || consequence.severity === 'CRITICAL')
                                    ? 'bg-red-500/20 text-red-400 border-red-500/30'
                                    : 'bg-orange-500/20 text-orange-400 border-orange-500/30'
                                }`}>
                                  {consequence.severity || 'MEDIUM'} SEVERITY
                                </Badge>
                                {consequence.probability && (
                                  <span className="text-xs text-slate-400 font-mono">
                                    {consequence.probability}% probability
                                  </span>
                                )}
                              </div>
                              <p className="text-slate-300 font-mono text-sm mb-2">
                                {typeof consequence === 'string' ? consequence : consequence.consequence}
                              </p>
                              {consequence.geopolitical_model && (
                                <div className="text-xs text-purple-400 font-mono mb-2">
                                  Model: {consequence.geopolitical_model}
                                </div>
                              )}
                              {consequence.mitigation_strategy && (
                                <div className="mt-2 p-2 bg-green-950/20 rounded">
                                  <span className="text-xs text-green-400 font-mono">
                                    Mitigation: {consequence.mitigation_strategy}
                                  </span>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </Card>
                    )}
                  </>
                )}
              </TabsContent>

              <TabsContent value="climate" className="space-y-6">
                <Card className="bg-slate-950/80 backdrop-blur-xl cyber-border p-6">
                  <h2 className="text-2xl font-bold text-blue-400 glow-text font-mono mb-4 flex items-center gap-2">
                    <CloudRain className="w-8 h-8" />
                    CLIMATE CONFLICT HOTSPOTS
                  </h2>
                  <div className="space-y-4">
                    {advancedAnalysis.climate_hotspots?.map((hotspot, idx) => (
                      <div key={idx} className="bg-slate-900/50 cyber-border rounded-lg p-4">
                        <div className="flex items-start justify-between mb-2">
                          <h3 className="text-lg font-bold text-cyan-400 font-mono">{hotspot.region}</h3>
                          <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30 font-mono">
                            {hotspot.conflict_probability}% Risk
                          </Badge>
                        </div>
                        <Badge className="mb-3 bg-orange-500/20 text-orange-400 border-orange-500/30 font-mono text-xs">
                          {hotspot.climate_risk}
                        </Badge>
                        <p className="text-slate-400 font-mono text-sm">{hotspot.analysis}</p>
                      </div>
                    ))}
                  </div>
                </Card>
              </TabsContent>

              <TabsContent value="resources" className="space-y-6">
                <Card className="bg-slate-950/80 backdrop-blur-xl cyber-border p-6">
                  <h2 className="text-2xl font-bold text-orange-400 glow-text font-mono mb-4 flex items-center gap-2">
                    <Droplets className="w-8 h-8" />
                    RESOURCE SCARCITY FLASHPOINTS
                  </h2>
                  <div className="space-y-4">
                    {advancedAnalysis.resource_flashpoints?.map((flashpoint, idx) => (
                      <div key={idx} className="bg-slate-900/50 cyber-border rounded-lg p-4">
                        <div className="flex items-start justify-between mb-3">
                          <h3 className="text-lg font-bold text-yellow-400 font-mono">{flashpoint.resource_type}</h3>
                          <Badge className="bg-red-500/20 text-red-400 border-red-500/30 font-mono">
                            {flashpoint.conflict_risk}
                          </Badge>
                        </div>
                        <div className="mb-3 p-3 bg-orange-950/20 cyber-border rounded">
                          <div className="text-xs text-slate-500 font-mono mb-1">Scarcity Level</div>
                          <div className="text-2xl font-bold text-orange-400 font-mono">{flashpoint.scarcity_level}/100</div>
                        </div>
                        <div>
                          <div className="text-xs text-slate-500 font-mono mb-2">Competing Nations:</div>
                          <div className="flex flex-wrap gap-2">
                            {flashpoint.competing_nations?.map((nation, i) => (
                              <Badge key={i} variant="outline" className="border-orange-500/30 text-orange-400 font-mono text-xs">
                                {nation}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </Card>
              </TabsContent>
            </Tabs>
          )}
        </div>
      </div>
    </div>
  );
}