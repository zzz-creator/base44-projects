import React, { useState } from 'react';
import { base44 } from '../api/base44Client';
import { useMutation } from '@tanstack/react-query';
import { Card } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { Slider } from '../components/ui/slider';
import { Badge } from '../components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs'; // New import
import {
  Play,
  Loader2,
  Plus,
  XCircle, // Changed from X to XCircle
  Zap,
  TrendingUp,
  AlertTriangle,
  Users,
  Droplet,
  Cpu,
  DollarSign,
  Shield,
  Target,
  Globe,
  GitBranch,
  RefreshCw,
  BarChart3,
  Lightbulb // Added Lightbulb icon
} from 'lucide-react';
import MatrixBackground from '../components/war/MatrixBackground';
import TimelineVisualization from '../components/simulator/TimelineVisualization';
import ImpactCharts from '../components/simulator/ImpactCharts';
import EvolutionComparison from '../components/simulator/EvolutionComparison';
import ScenarioBranching from '../components/simulator/ScenarioBranching';
import AIScenarioGenerator from '../components/scenario/AIScenarioGenerator';
import AIStrategyAdvisor from '../components/strategy/AIStrategyAdvisor';
import AIOpponentSystem from '../components/ai/AIOpponentSystem';
import FictionalWarGenerator from '../components/ai/FictionalWarGenerator';
import BranchComparisonChart from '../components/visualizations/BranchComparisonChart';

export default function ConflictSimulator() {
  const [activeTab, setActiveTab] = useState('builder'); // New state
  const [simulation, setSimulation] = useState(null);
  const [counterStrategies, setCounterStrategies] = useState(null); // New state
  const [evolutionResult, setEvolutionResult] = useState(null);
  const [branches, setBranches] = useState([]); // New state
  const [currentScenarioId, setCurrentScenarioId] = useState('main'); // New state
  const [scenario, setScenario] = useState({
    id: 'main', // Added id to scenario state
    name: '',
    description: '',
    nations: [],
    tensions: 50,
    resources: {
      oil: 50,
      water: 50,
      rare_earth: 50,
      food: 50
    },
    technology: {
      conventional: 50,
      nuclear: 0,
      cyber: 50,
      space: 20
    },
    economics: {
      global_gdp: 50,
      trade_relations: 50,
      sanctions_level: 0
    },
    alliances: '',
    timeframe: 5
  });
  const [evolutionConfig, setEvolutionConfig] = useState({
    changeType: 'alliance_shift',
    changeDescription: '',
    selectedOutcome: null
  });
  const [currentNation, setCurrentNation] = useState({ name: '', role: '', military_strength: 50 });

  // Expose branch creation to global scope for AI Strategy Advisor
  React.useEffect(() => {
    window.createScenarioBranch = (branchData) => {
      handleCreateBranch(branchData);
    };
    return () => {
      delete window.createScenarioBranch;
    };
  }, [scenario, branches, currentScenarioId]);

  // Helper to update the current branch's state in the branches array
  const updateCurrentBranchData = (updatedSimulation, updatedEvolutionResult, updatedCounterStrategies) => {
    setBranches(prevBranches =>
      prevBranches.map(branch =>
        branch.id === currentScenarioId
          ? {
              ...branch,
              scenario: { ...scenario }, // Save current scenario state to branch
              simulation: updatedSimulation !== undefined ? updatedSimulation : branch.simulation,
              evolutionResult: updatedEvolutionResult !== undefined ? updatedEvolutionResult : branch.evolutionResult,
              counterStrategies: updatedCounterStrategies !== undefined ? updatedCounterStrategies : branch.counterStrategies
            }
          : branch
      )
    );
  };

  // Modified setters to also update the branches state
  const setSimulationAndBranch = (simResult) => {
    setSimulation(simResult);
    updateCurrentBranchData(simResult, null, null); // Clear evolution/strategies for new simulation
  };

  const setEvolutionResultAndBranch = (evoResult) => {
    setEvolutionResult(evoResult);
    updateCurrentBranchData(undefined, evoResult, null);
  };

  const setCounterStrategiesAndBranch = (strategiesResult) => {
    setCounterStrategies(strategiesResult);
    updateCurrentBranchData(undefined, undefined, strategiesResult);
  };

  const runSimulationMutation = useMutation({
    mutationFn: async (scenarioData) => {
      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `You are an advanced geopolitical simulation AI. Analyze and simulate the following custom conflict scenario:

SCENARIO NAME: ${scenarioData.name}
DESCRIPTION: ${scenarioData.description}

INVOLVED NATIONS:
${scenarioData.nations.map(n => `- ${n.name} (Role: ${n.role}, Military Strength: ${n.military_strength}/100)`).join('\n')}

INITIAL CONDITIONS:
- Overall Tensions: ${scenarioData.tensions}/100
- Timeframe: ${scenarioData.timeframe} years

RESOURCE AVAILABILITY:
- Oil/Energy: ${scenarioData.resources.oil}/100
- Water: ${scenarioData.resources.water}/100
- Rare Earth Minerals: ${scenarioData.resources.rare_earth}/100
- Food Security: ${scenarioData.resources.food}/100

TECHNOLOGICAL LEVELS:
- Conventional Weapons: ${scenarioData.technology.conventional}/100
- Nuclear Capability: ${scenarioData.technology.nuclear}/100
- Cyber Warfare: ${scenarioData.technology.cyber}/100
- Space Assets: ${scenarioData.technology.space}/100

ECONOMIC FACTORS:
- Global GDP Health: ${scenarioData.economics.global_gdp}/100
- Trade Relations: ${scenarioData.economics.trade_relations}/100
- Sanctions Level: ${scenarioData.economics.sanctions_level}/100

ALLIANCE STRUCTURE: ${scenarioData.alliances || 'Not specified'}

Based on this scenario, provide a comprehensive simulation including:
1. Multiple potential outcomes with probabilities
2. Detailed escalation pathways
3. Timeline of key events
4. Long-term geopolitical shifts (5-20 years)
5. Casualty estimates for each outcome
6. Economic impacts
7. Technology evolution during conflict
8. Regional stability changes
9. Post-conflict world order predictions
10. Critical decision points that could alter the outcome

Be detailed, realistic, and consider historical parallels. Use game theory and geopolitical analysis.`,
        response_json_schema: {
          type: "object",
          properties: {
            scenario_summary: { type: "string" },
            overall_risk_score: { type: "number" },
            conflict_probability: { type: "number" },
            potential_outcomes: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  outcome_name: { type: "string" },
                  probability: { type: "number" },
                  description: { type: "string" },
                  duration: { type: "string" },
                  casualties: {
                    type: "object",
                    properties: {
                      military: { type: "number" },
                      civilian: { type: "number" },
                      total: { type: "number" }
                    }
                  },
                  economic_cost: { type: "string" },
                  victor: { type: "string" },
                  consequences: { type: "array", items: { type: "string" } }
                }
              }
            },
            escalation_pathways: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  stage: { type: "string" },
                  trigger: { type: "string" },
                  description: { type: "string" },
                  timeframe: { type: "string" },
                  intensity: { type: "number" }
                }
              }
            },
            timeline: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  period: { type: "string" },
                  events: { type: "array", items: { type: "string" } }
                }
              }
            },
            geopolitical_shifts: {
              type: "object",
              properties: {
                power_balance: { type: "string" },
                new_alliances: { type: "array", items: { type: "string" } },
                collapsed_alliances: { type: "array", items: { type: "string" } },
                emerging_powers: { type: "array", items: { type: "string" } },
                declining_powers: { type: "array", items: { type: "string" } },
                regional_changes: { type: "array", items: { type: "string" } }
              }
            },
            technology_evolution: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  technology: { type: "string" },
                  advancement: { type: "string" },
                  impact: { type: "string" }
                }
              }
            },
            critical_decision_points: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  decision: { type: "string" },
                  timing: { type: "string" },
                  impact: { type: "string" },
                  alternatives: { type: "array", items: { type: "string" } }
                }
              }
            },
            regional_stability: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  region: { type: "string" },
                  current_stability: { type: "number" },
                  projected_stability: { type: "number" },
                  analysis: { type: "string" }
                }
              }
            },
            post_conflict_order: {
              type: "object",
              properties: {
                global_power_structure: { type: "string" },
                international_institutions: { type: "string" },
                economic_order: { type: "string" },
                security_architecture: { type: "string" }
              }
            },
            recommendations: { type: "array", items: { type: "string" } }
          }
        },
        add_context_from_internet: true
      });

      setSimulationAndBranch(result);
      setActiveTab('results'); // Switch to results tab automatically
      return result;
    }
  });

  const generateCounterStrategiesMutation = useMutation({
    mutationFn: async ({ simulation, scenario }) => {
      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `You are a strategic advisor analyzing a conflict simulation. Generate COUNTER-STRATEGIES to mitigate risks and improve outcomes.

SIMULATION RESULTS:
- Risk Score: ${simulation.overall_risk_score}/100
- Conflict Probability: ${simulation.conflict_probability}%
- Most Likely Outcome: ${simulation.potential_outcomes[0]?.outcome_name}

SCENARIO PARAMETERS:
- Tensions: ${scenario.tensions}/100
- Nations: ${scenario.nations.map(n => n.name).join(', ')}
- Nuclear Capability: ${scenario.technology.nuclear}/100
- Economic Health: ${scenario.economics.global_gdp}/100

Generate comprehensive counter-strategies including:

1. PARAMETER ADJUSTMENTS
   - Specific changes to reduce conflict probability
   - Target values for key parameters
   - Expected impact of each adjustment

2. DIPLOMATIC INTERVENTIONS
   - Timing and approach
   - Key stakeholders to engage
   - Success factors

3. ECONOMIC MEASURES
   - Sanctions relief/application
   - Trade incentives
   - Development aid strategies

4. MILITARY POSTURE ADJUSTMENTS
   - De-escalation moves
   - Confidence-building measures
   - Strategic positioning changes

5. TECHNOLOGY-BASED SOLUTIONS
   - Verification mechanisms
   - Communication channels
   - Early warning systems

Provide actionable, scenario-specific recommendations.`,
        response_json_schema: {
          type: "object",
          properties: {
            strategy_summary: { type: "string" },
            risk_reduction_potential: { type: "number" },
            parameter_adjustments: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  parameter: { type: "string" },
                  current_value: { type: "number" },
                  recommended_value: { type: "number" },
                  rationale: { type: "string" },
                  expected_impact: { type: "string" },
                  difficulty: { type: "string" }
                }
              }
            },
            diplomatic_interventions: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  intervention: { type: "string" },
                  timing: { type: "string" },
                  stakeholders: { type: "array", items: { type: "string" } },
                  approach: { type: "string" },
                  success_probability: { type: "number" }
                }
              }
            },
            economic_measures: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  measure: { type: "string" },
                  type: { type: "string" },
                  target_nations: { type: "array", items: { type: "string" } },
                  expected_effect: { type: "string" }
                }
              }
            },
            military_adjustments: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  adjustment: { type: "string" },
                  rationale: { type: "string" },
                  implementation: { type: "string" }
                }
              }
            },
            technology_solutions: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  solution: { type: "string" },
                  description: { type: "string" },
                  benefits: { type: "array", items: { type: "string" } }
                }
              }
            },
            implementation_roadmap: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  phase: { type: "string" },
                  actions: { type: "array", items: { type: "string" } },
                  timeline: { type: "string" }
                }
              }
            }
          }
        }
      });

      setCounterStrategiesAndBranch(result);
      setActiveTab('strategies'); // Switch to strategies tab automatically
      return result;
    }
  });

  const evolveScenarioMutation = useMutation({
    mutationFn: async ({ baseSimulation, changeType, changeDescription, outcomeIndex }) => {
      const selectedOutcome = baseSimulation.potential_outcomes[outcomeIndex];

      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `You are a geopolitical evolution simulator. Take a previous conflict simulation and introduce a NEW VARIABLE to see how it changes outcomes.

ORIGINAL SCENARIO: ${scenario.name}
${scenario.description}

ORIGINAL SIMULATION OUTCOME SELECTED: "${selectedOutcome.outcome_name}"
Probability: ${selectedOutcome.probability}%
Description: ${selectedOutcome.description}
Duration: ${selectedOutcome.duration}
Victor: ${selectedOutcome.victor || 'No clear victor'}

ORIGINAL GEOPOLITICAL STATE:
${JSON.stringify(baseSimulation.geopolitical_shifts, null, 2)}

NEW VARIABLE INTRODUCED:
Type: ${changeType}
Description: ${changeDescription}

SCENARIO EVOLUTION ANALYSIS:
Re-simulate the conflict from this point forward with this new variable. Analyze:
1. How does this change affect the original outcome?
2. New probability distribution of outcomes
3. Changed escalation pathways
4. Impact on casualties and duration
5. Altered geopolitical shifts
6. Technology evolution changes
7. Regional stability impacts
8. New post-conflict world order
9. Comparison with original simulation

Provide a comprehensive evolution analysis showing the divergence from the original path.`,
        response_json_schema: {
          type: "object",
          properties: {
            evolution_summary: { type: "string" },
            change_impact_score: { type: "number" },
            original_vs_new: {
              type: "object",
              properties: {
                original_outcome_probability: { type: "number" },
                new_outcome_probability: { type: "number" },
                outcome_shift_analysis: { type: "string" }
              }
            },
            revised_outcomes: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  outcome_name: { type: "string" },
                  probability: { type: "number" },
                  description: { type: "string" },
                  duration: { type: "string" },
                  casualties: {
                    type: "object",
                    properties: {
                      military: { type: "number" },
                      civilian: { type: "number" },
                      total: { type: "number" }
                    }
                  },
                  economic_cost: { type: "string" },
                  victor: { type: "string" },
                  divergence_explanation: { type: "string" }
                }
              }
            },
            escalation_pathways: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  stage: { type: "string" },
                  trigger: { type: "string" },
                  description: { type: "string" },
                  timeframe: { type: "string" },
                  intensity: { type: "number" }
                }
              }
            },
            timeline: { // Added timeline to evolutionResult schema
              type: "array",
              items: {
                type: "object",
                properties: {
                  period: { type: "string" },
                  events: { type: "array", items: { type: "string" } }
                }
              }
            },
            cascading_effects: { type: "array", items: { type: "string" } },
            revised_geopolitical_shifts: {
              type: "object",
              properties: {
                power_balance: { type: "string" },
                new_alliances: { type: "array", items: { type: "string" } },
                collapsed_alliances: { type: "array", items: { type: "string" } },
                emerging_powers: { type: "array", items: { type: "string" } },
                declining_powers: { type: "array", items: { type: "string" } }
              }
            },
            stability_comparison: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  region: { type: "string" },
                  original_stability: { type: "number" },
                  revised_stability: { type: "number" },
                  change_explanation: { type: "string" }
                }
              }
            },
            timeline_divergence_points: { type: "array", items: { type: "string" } },
            new_critical_decisions: { type: "array", items: { type: "string" } },
            recommendations: { type: "array", items: { type: "string" } }
          }
        },
        add_context_from_internet: true
      });

      setEvolutionResultAndBranch(result);
      return result;
    }
  });

  const handleCreateBranch = (branchData) => {
    // Create a new scenario state for the branch, making a deep copy
    const newBranchScenario = JSON.parse(JSON.stringify(scenario));
    newBranchScenario.id = `branch-${Date.now()}`;
    newBranchScenario.name = branchData.name; // Use the provided name for the new scenario
    newBranchScenario.description = branchData.description || newBranchScenario.description;

    const newBranch = {
      ...branchData,
      id: newBranchScenario.id, // Ensure the branch object also has the ID
      scenario: newBranchScenario,
      simulation: null, // New branches start without a simulation result
      evolutionResult: null, // New branches start without evolution results
      counterStrategies: null // New branches start without counter strategies
    };

    setBranches(prevBranches => [...prevBranches, newBranch]);
    // Optionally switch to the new branch immediately
    handleSwitchBranch(newBranch);
  };

  const handleSwitchBranch = (branch) => {
    setScenario(branch.scenario || branch);
    setCurrentScenarioId(branch.id);
    setSimulation(branch.simulation || null);
    setEvolutionResult(branch.evolutionResult || null);
    setCounterStrategies(branch.counterStrategies || null);
    setActiveTab(branch.simulation ? 'results' : 'builder');
  };

  const handleMergeBranches = (branchIds) => {
    const selectedBranches = branches.filter(b => branchIds.includes(b.id));
    const mergedScenario = {
      id: `merged-${Date.now()}`,
      name: `Merged: ${selectedBranches.map(b => b.name).join(' + ')}`,
      description: `Combined scenario from: ${selectedBranches.map(b => b.name).join(', ')}`,
      ...scenario,
      nations: [...new Set(selectedBranches.flatMap(b => b.scenario?.nations || []))]
    };
    
    const newBranch = {
      ...mergedScenario,
      parentId: currentScenarioId,
      timestamp: new Date().toISOString(),
      whatIfQuestion: 'Merged analysis from multiple branches',
      scenario: mergedScenario
    };
    
    setBranches([...branches, newBranch]);
    handleSwitchBranch(newBranch);
  };

  const handleRevertToState = (branch) => {
    if (confirm(`Revert to "${branch.name}"? Current changes will be lost.`)) {
      handleSwitchBranch(branch);
    }
  };

  const handleDeleteBranch = (branchId) => {
    const childBranches = branches.filter(b => b.parentId === branchId);
    if (childBranches.length > 0) {
      alert('Cannot delete branch with children. Delete child branches first.');
      return;
    }
    setBranches(branches.filter(b => b.id !== branchId));
  };

  const addNation = () => {
    if (currentNation.name && currentNation.role) {
      setScenario({
        ...scenario,
        nations: [...scenario.nations, currentNation]
      });
      setCurrentNation({ name: '', role: '', military_strength: 50 });
    }
  };

  const removeNation = (index) => {
    setScenario({
      ...scenario,
      nations: scenario.nations.filter((_, i) => i !== index)
    });
  };

  const getRiskColor = (score) => {
    if (score >= 80) return 'text-red-400';
    if (score >= 60) return 'text-orange-400';
    if (score >= 40) return 'text-yellow-400';
    return 'text-green-400';
  };

  const getIntensityColor = (intensity) => {
    if (intensity >= 80) return 'bg-red-500';
    if (intensity >= 60) return 'bg-orange-500';
    if (intensity >= 40) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  return (
    <div className="relative min-h-screen">
      <MatrixBackground />

      <div className="relative z-10 p-8">
        <div className="max-w-7xl mx-auto space-y-6">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-purple-400 glow-text font-mono mb-2">
              CONFLICT SIMULATOR
            </h1>
            <p className="text-cyan-400/70 font-mono text-sm">
              Advanced AI-powered scenario modeling • Scenario branching • Counter-strategy generation
            </p>
          </div>

          {/* Tab Navigation */}
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-6 bg-slate-950/80 border border-green-500/30">
              <TabsTrigger value="builder" className="data-[state=active]:bg-purple-500/20 data-[state=active]:text-purple-400 font-mono">
                <Target className="w-4 h-4 mr-2" />
                BUILDER
              </TabsTrigger>
              <TabsTrigger value="ai-gen" className="data-[state=active]:bg-pink-500/20 data-[state=active]:text-pink-400 font-mono">
                <Zap className="w-4 h-4 mr-2" />
                AI GEN
              </TabsTrigger>
              <TabsTrigger value="results" className="data-[state=active]:bg-green-500/20 data-[state=active]:text-green-400 font-mono" disabled={!simulation}>
                <BarChart3 className="w-4 h-4 mr-2" />
                RESULTS
              </TabsTrigger>
              <TabsTrigger value="strategies" className="data-[state=active]:bg-cyan-500/20 data-[state=active]:text-cyan-400 font-mono" disabled={!simulation}>
                <Lightbulb className="w-4 h-4 mr-2" />
                STRATEGIES
              </TabsTrigger>
              <TabsTrigger value="branches" className="data-[state=active]:bg-yellow-500/20 data-[state=active]:text-yellow-400 font-mono">
                <GitBranch className="w-4 h-4 mr-2" />
                BRANCHES
              </TabsTrigger>
              <TabsTrigger value="compare" className="data-[state=active]:bg-orange-500/20 data-[state=active]:text-orange-400 font-mono" disabled={branches.length < 2}>
                <BarChart3 className="w-4 h-4 mr-2" />
                COMPARE
              </TabsTrigger>
            </TabsList>

            {/* AI Scenario Generator Tab */}
            <TabsContent value="ai-gen" className="mt-6">
              <AIScenarioGenerator />
            </TabsContent>

            {/* Scenario Builder Tab */}
            <TabsContent value="builder" className="mt-6">
              <Card className="bg-slate-950/80 backdrop-blur-xl cyber-border p-6">
                <div className="flex items-center gap-3 mb-6">
                  <Target className="w-6 h-6 text-purple-400" />
                  <h2 className="text-2xl font-bold text-purple-400 glow-text font-mono">
                    SCENARIO BUILDER
                  </h2>
                </div>

                <div className="space-y-6">
                  {/* Basic Info */}
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-cyan-400 font-mono">Scenario Name</Label>
                      <Input
                        value={scenario.name}
                        onChange={(e) => setScenario({ ...scenario, name: e.target.value })}
                        placeholder="e.g., South China Sea Escalation 2025"
                        className="bg-slate-900/50 border-green-500/30 text-green-400 font-mono"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-cyan-400 font-mono">Timeframe (Years)</Label>
                      <Input
                        type="number"
                        value={scenario.timeframe}
                        onChange={(e) => setScenario({ ...scenario, timeframe: parseInt(e.target.value) })}
                        min="1"
                        max="50"
                        className="bg-slate-900/50 border-green-500/30 text-green-400 font-mono"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-cyan-400 font-mono">Description</Label>
                    <Textarea
                      value={scenario.description}
                      onChange={(e) => setScenario({ ...scenario, description: e.target.value })}
                      placeholder="Describe the initial situation, tensions, and context..."
                      className="bg-slate-900/50 border-green-500/30 text-green-400 font-mono min-h-[100px]"
                    />
                  </div>

                  {/* Nations */}
                  <div className="space-y-4">
                    <Label className="text-cyan-400 font-mono flex items-center gap-2">
                      <Users className="w-4 h-4" />
                      Involved Nations
                    </Label>

                    <div className="flex flex-wrap gap-2 mb-4">
                      {scenario.nations.map((nation, idx) => (
                        <Badge key={idx} className="bg-green-500/20 text-green-400 border-green-500/30 font-mono">
                          {nation.name} ({nation.role})
                          <button
                            onClick={() => removeNation(idx)}
                            className="ml-2 hover:text-red-400"
                          >
                            <XCircle className="w-3 h-3" /> {/* Replaced X with XCircle */}
                          </button>
                        </Badge>
                      ))}
                    </div>

                    <div className="grid md:grid-cols-4 gap-3">
                      <Input
                        placeholder="Nation name"
                        value={currentNation.name}
                        onChange={(e) => setCurrentNation({ ...currentNation, name: e.target.value })}
                        className="bg-slate-900/50 border-green-500/30 text-green-400 font-mono"
                      />
                      <Input
                        placeholder="Role (e.g., Aggressor)"
                        value={currentNation.role}
                        onChange={(e) => setCurrentNation({ ...currentNation, role: e.target.value })}
                        className="bg-slate-900/50 border-green-500/30 text-green-400 font-mono"
                      />
                      <div className="space-y-1">
                        <Label className="text-xs text-slate-400 font-mono">
                          Military: {currentNation.military_strength}
                        </Label>
                        <Slider
                          value={[currentNation.military_strength]}
                          onValueChange={(value) => setCurrentNation({ ...currentNation, military_strength: value[0] })}
                          min={0}
                          max={100}
                          step={5}
                        />
                      </div>
                      <Button
                        onClick={addNation}
                        className="bg-green-500/20 hover:bg-green-500/30 text-green-400 border border-green-500/30 font-mono"
                      >
                        <Plus className="w-4 h-4 mr-2" />
                        Add
                      </Button>
                    </div>
                  </div>

                  {/* Tensions */}
                  <div className="space-y-2">
                    <Label className="text-cyan-400 font-mono flex items-center justify-between">
                      <span className="flex items-center gap-2">
                        <AlertTriangle className="w-4 h-4" />
                        Initial Tensions
                      </span>
                      <span className={`${getRiskColor(scenario.tensions)} font-bold`}>
                        {scenario.tensions}/100
                      </span>
                    </Label>
                    <Slider
                      value={[scenario.tensions]}
                      onValueChange={(value) => setScenario({ ...scenario, tensions: value[0] })}
                      min={0}
                      max={100}
                      step={5}
                    />
                  </div>

                  {/* Resources */}
                  <div className="space-y-4">
                    <Label className="text-cyan-400 font-mono flex items-center gap-2">
                      <Droplet className="w-4 h-4" />
                      Resource Availability
                    </Label>
                    <div className="grid md:grid-cols-2 gap-4">
                      {Object.entries(scenario.resources).map(([key, value]) => (
                        <div key={key} className="space-y-2">
                          <Label className="text-xs text-slate-400 font-mono capitalize flex justify-between">
                            <span>{key.replace('_', ' ')}</span>
                            <span className="text-green-400">{value}/100</span>
                          </Label>
                          <Slider
                            value={[value]}
                            onValueChange={(v) => setScenario({
                              ...scenario,
                              resources: { ...scenario.resources, [key]: v[0] }
                            })}
                            min={0}
                            max={100}
                            step={5}
                          />
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Technology */}
                  <div className="space-y-4">
                    <Label className="text-cyan-400 font-mono flex items-center gap-2">
                      <Cpu className="w-4 h-4" />
                      Technological Levels
                    </Label>
                    <div className="grid md:grid-cols-2 gap-4">
                      {Object.entries(scenario.technology).map(([key, value]) => (
                        <div key={key} className="space-y-2">
                          <Label className="text-xs text-slate-400 font-mono capitalize flex justify-between">
                            <span>{key.replace('_', ' ')}</span>
                            <span className="text-cyan-400">{value}/100</span>
                          </Label>
                          <Slider
                            value={[value]}
                            onValueChange={(v) => setScenario({
                              ...scenario,
                              technology: { ...scenario.technology, [key]: v[0] }
                            })}
                            min={0}
                            max={100}
                            step={5}
                          />
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Economics */}
                  <div className="space-y-4">
                    <Label className="text-cyan-400 font-mono flex items-center gap-2">
                      <DollarSign className="w-4 h-4" />
                      Economic Factors
                    </Label>
                    <div className="grid md:grid-cols-3 gap-4">
                      {Object.entries(scenario.economics).map(([key, value]) => (
                        <div key={key} className="space-y-2">
                          <Label className="text-xs text-slate-400 font-mono capitalize flex justify-between">
                            <span>{key.replace('_', ' ')}</span>
                            <span className="text-yellow-400">{value}/100</span>
                          </Label>
                          <Slider
                            value={[value]}
                            onValueChange={(v) => setScenario({
                              ...scenario,
                              economics: { ...scenario.economics, [key]: v[0] }
                            })}
                            min={0}
                            max={100}
                            step={5}
                          />
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Alliances */}
                  <div className="space-y-2">
                    <Label className="text-cyan-400 font-mono flex items-center gap-2">
                      <Shield className="w-4 h-4" />
                      Alliance Structure
                    </Label>
                    <Textarea
                      value={scenario.alliances}
                      onChange={(e) => setScenario({ ...scenario, alliances: e.target.value })}
                      placeholder="Describe existing alliances, treaties, and defense pacts..."
                      className="bg-slate-900/50 border-green-500/30 text-green-400 font-mono"
                    />
                  </div>

                  {/* Run Simulation */}
                  <Button
                    onClick={() => runSimulationMutation.mutate(scenario)}
                    disabled={runSimulationMutation.isPending || !scenario.name || scenario.nations.length < 2}
                    className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-mono text-lg py-6"
                  >
                    {runSimulationMutation.isPending ? (
                      <>
                        <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                        SIMULATING SCENARIO...
                      </>
                    ) : (
                      <>
                        <Play className="w-5 h-5 mr-2" />
                        RUN SIMULATION
                      </>
                    )}
                  </Button>
                </div>
              </Card>
            </TabsContent>

            {/* Results Tab */}
            <TabsContent value="results" className="mt-6">
              {simulation && (
                <div className="space-y-6 animate-in fade-in duration-500">
                  {/* Scenario Evolution Panel */}
                  {simulation.potential_outcomes && (
                    <Card className="bg-slate-950/80 backdrop-blur-xl cyber-border p-6">
                      <div className="flex items-center gap-3 mb-6">
                        <GitBranch className="w-6 h-6 text-cyan-400" />
                        <div>
                          <h2 className="text-2xl font-bold text-cyan-400 glow-text font-mono">
                            SCENARIO EVOLUTION
                          </h2>
                          <p className="text-slate-400 text-xs font-mono mt-1">
                            Introduce new variables to see how outcomes change
                          </p>
                        </div>
                      </div>

                      <div className="space-y-4">
                        <div className="grid md:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label className="text-cyan-400 font-mono text-xs">Select Base Outcome</Label>
                            <Select
                              value={evolutionConfig.selectedOutcome !== null ? evolutionConfig.selectedOutcome.toString() : ''}
                              onValueChange={(value) => setEvolutionConfig({
                                ...evolutionConfig,
                                selectedOutcome: parseInt(value)
                              })}
                            >
                              <SelectTrigger className="bg-slate-900/50 border-green-500/30 text-green-400 font-mono">
                                <SelectValue placeholder="Choose an outcome..." />
                              </SelectTrigger>
                              <SelectContent className="bg-slate-900 border-green-500/30 text-green-400">
                                {simulation.potential_outcomes.map((outcome, idx) => (
                                  <SelectItem key={idx} value={idx.toString()} className="hover:bg-slate-800 focus:bg-slate-800">
                                    {outcome.outcome_name} ({outcome.probability}%)
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>

                          <div className="space-y-2">
                            <Label className="text-cyan-400 font-mono text-xs">Change Type</Label>
                            <Select
                              value={evolutionConfig.changeType}
                              onValueChange={(value) => setEvolutionConfig({
                                ...evolutionConfig,
                                changeType: value
                              })}
                            >
                              <SelectTrigger className="bg-slate-900/50 border-green-500/30 text-green-400 font-mono">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent className="bg-slate-900 border-green-500/30 text-green-400">
                                <SelectItem value="alliance_shift" className="hover:bg-slate-800 focus:bg-slate-800">Alliance Shift</SelectItem>
                                <SelectItem value="tech_breakthrough" className="hover:bg-slate-800 focus:bg-slate-800">Technological Breakthrough</SelectItem>
                                <SelectItem value="resource_discovery" className="hover:bg-slate-800 focus:bg-slate-800">Resource Discovery</SelectItem>
                                <SelectItem value="leadership_change" className="hover:bg-slate-800 focus:bg-slate-800">Leadership Change</SelectItem>
                                <SelectItem value="natural_disaster" className="hover:bg-slate-800 focus:bg-slate-800">Natural Disaster</SelectItem>
                                <SelectItem value="economic_crisis" className="hover:bg-slate-800 focus:bg-slate-800">Economic Crisis</SelectItem>
                                <SelectItem value="third_party_intervention" className="hover:bg-slate-800 focus:bg-slate-800">Third-Party Intervention</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>

                        <div className="space-y-2">
                          <Label className="text-cyan-400 font-mono text-xs">Describe the Change</Label>
                          <Textarea
                            value={evolutionConfig.changeDescription}
                            onChange={(e) => setEvolutionConfig({
                              ...evolutionConfig,
                              changeDescription: e.target.value
                            })}
                            placeholder="Describe the new variable in detail (e.g., 'Nation X suddenly switches alliance to side with Nation Y due to economic incentives')"
                            className="bg-slate-900/50 border-green-500/30 text-green-400 font-mono min-h-[80px]"
                          />
                        </div>

                        <Button
                          onClick={() => evolveScenarioMutation.mutate({
                            baseSimulation: simulation,
                            changeType: evolutionConfig.changeType,
                            changeDescription: evolutionConfig.changeDescription,
                            outcomeIndex: evolutionConfig.selectedOutcome
                          })}
                          disabled={
                            evolveScenarioMutation.isPending ||
                            evolutionConfig.selectedOutcome === null ||
                            !evolutionConfig.changeDescription
                          }
                          className="w-full bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white font-mono py-6"
                        >
                          {evolveScenarioMutation.isPending ? (
                            <>
                              <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                              EVOLVING SCENARIO...
                            </>
                          ) : (
                            <>
                              <RefreshCw className="w-5 h-5 mr-2" />
                              EVOLVE SCENARIO
                            </>
                          )}
                        </Button>
                      </div>
                    </Card>
                  )}

                  {/* Visualizations Section */}
                  {/* Show comparison if evolution exists, otherwise show original */}
                  {evolutionResult ? (
                    <>
                      <Card className="bg-gradient-to-br from-cyan-950/50 to-purple-950/50 backdrop-blur-xl cyber-border p-6">
                        <div className="flex items-center gap-3 mb-4">
                          <BarChart3 className="w-8 h-8 text-cyan-400" />
                          <h2 className="text-2xl font-bold text-cyan-400 glow-text font-mono">
                            EVOLUTION VS ORIGINAL COMPARISON
                          </h2>
                        </div>
                      </Card>
                      <EvolutionComparison originalSimulation={simulation} evolutionResult={evolutionResult} />
                      <div className="grid lg:grid-cols-2 gap-6">
                        <TimelineVisualization timeline={simulation.timeline} isEvolution={false} />
                        <TimelineVisualization timeline={evolutionResult.timeline} isEvolution={true} />
                      </div>
                      <ImpactCharts
                        outcomes={evolutionResult.revised_outcomes}
                        escalationPathways={evolutionResult.escalation_pathways}
                        isEvolution={true}
                      />
                    </>
                  ) : (
                    <>
                      <Card className="bg-gradient-to-br from-purple-950/50 to-pink-950/50 backdrop-blur-xl cyber-border p-6">
                        <div className="flex items-center gap-3">
                          <BarChart3 className="w-8 h-8 text-purple-400" />
                          <h2 className="text-2xl font-bold text-purple-400 glow-text font-mono">
                            SIMULATION VISUALIZATIONS
                          </h2>
                        </div>
                      </Card>
                      <TimelineVisualization timeline={simulation.timeline} />
                      <ImpactCharts
                        outcomes={simulation.potential_outcomes}
                        escalationPathways={simulation.escalation_pathways}
                      />
                    </>
                  )}

                  {/* Evolution Results */}
                  {evolutionResult && (
                    <div className="space-y-6 animate-in fade-in duration-500">
                      <Card className="bg-gradient-to-br from-cyan-950/50 to-blue-950/50 backdrop-blur-xl cyber-border p-6">
                        <div className="flex items-center gap-3 mb-4">
                          <GitBranch className="w-8 h-8 text-cyan-400" />
                          <div>
                            <h3 className="text-2xl font-bold text-cyan-400 glow-text font-mono">
                              EVOLUTION ANALYSIS
                            </h3>
                            <p className="text-purple-400 text-sm font-mono mt-1">Scenario Divergence Assessment</p>
                          </div>
                        </div>

                        <div className="mb-4">
                          <div className="text-sm text-slate-400 font-mono mb-1">Change Impact Score</div>
                          <div className="text-4xl font-bold text-cyan-400 font-mono">
                            {evolutionResult.change_impact_score}/100
                          </div>
                        </div>

                        <p className="text-slate-300 font-mono text-sm leading-relaxed">
                          {evolutionResult.evolution_summary}
                        </p>
                      </Card>

                      {/* Original vs New Comparison */}
                      <Card className="bg-slate-950/80 backdrop-blur-xl cyber-border p-6">
                        <h3 className="text-xl font-bold text-yellow-400 glow-text font-mono mb-4">
                          OUTCOME PROBABILITY SHIFT
                        </h3>
                        <div className="grid md:grid-cols-2 gap-4 mb-4">
                          <div className="p-4 bg-slate-900/50 cyber-border rounded-lg">
                            <div className="text-sm text-slate-400 font-mono mb-1">Original Probability</div>
                            <div className="text-3xl font-bold text-red-400 font-mono">
                              {evolutionResult.original_vs_new.original_outcome_probability}%
                            </div>
                          </div>
                          <div className="p-4 bg-slate-900/50 cyber-border rounded-lg">
                            <div className="text-sm text-slate-400 font-mono mb-1">New Probability</div>
                            <div className="text-3xl font-bold text-green-400 font-mono">
                              {evolutionResult.original_vs_new.new_outcome_probability}%
                            </div>
                          </div>
                        </div>
                        <p className="text-slate-300 font-mono text-sm">
                          {evolutionResult.original_vs_new.outcome_shift_analysis}
                        </p>
                      </Card>

                      {/* Revised Outcomes */}
                      <Card className="bg-slate-950/80 backdrop-blur-xl cyber-border p-6">
                        <h3 className="text-xl font-bold text-purple-400 glow-text font-mono mb-4">
                          REVISED POTENTIAL OUTCOMES
                        </h3>
                        <div className="space-y-4">
                          {evolutionResult.revised_outcomes?.map((outcome, idx) => (
                            <div key={idx} className="bg-slate-900/50 cyber-border rounded-lg p-4">
                              <div className="flex items-start justify-between mb-3">
                                <h4 className="text-lg font-bold text-yellow-400 font-mono">
                                  {outcome.outcome_name}
                                </h4>
                                <Badge className="bg-purple-500/20 text-purple-400 border-purple-500/30 font-mono">
                                  {outcome.probability}% PROBABILITY
                                </Badge>
                              </div>

                              <p className="text-slate-400 font-mono text-sm mb-3">{outcome.description}</p>

                              <div className="grid md:grid-cols-3 gap-3 mb-3">
                                <div className="p-2 bg-slate-950/50 cyber-border rounded">
                                  <div className="text-xs text-slate-500 font-mono">Duration</div>
                                  <div className="text-cyan-400 font-mono text-sm font-bold">{outcome.duration}</div>
                                </div>
                                <div className="p-2 bg-slate-950/50 cyber-border rounded">
                                  <div className="text-xs text-slate-500 font-mono">Casualties</div>
                                  <div className="text-red-400 font-mono text-sm font-bold">
                                    {outcome.casualties?.total?.toLocaleString() || 'N/A'}
                                  </div>
                                </div>
                                <div className="p-2 bg-slate-950/50 cyber-border rounded">
                                  <div className="text-xs text-slate-500 font-mono">Economic Cost</div>
                                  <div className="text-orange-400 font-mono text-sm font-bold">{outcome.economic_cost}</div>
                                </div>
                              </div>

                              <div className="p-3 bg-cyan-950/20 cyber-border rounded mb-2">
                                <h5 className="text-xs font-bold text-cyan-400 font-mono mb-1">DIVERGENCE EXPLANATION</h5>
                                <p className="text-slate-300 font-mono text-xs">{outcome.divergence_explanation}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </Card>

                      {/* Cascading Effects */}
                      {evolutionResult.cascading_effects && evolutionResult.cascading_effects.length > 0 && (
                        <Card className="bg-orange-950/20 backdrop-blur-xl cyber-border p-6">
                          <h3 className="text-xl font-bold text-orange-400 glow-text font-mono mb-4">
                            CASCADING EFFECTS
                          </h3>
                          <ul className="space-y-2">
                            {evolutionResult.cascading_effects.map((effect, idx) => (
                              <li key={idx} className="flex items-start gap-2 text-slate-300 font-mono text-sm">
                                <span className="text-orange-400">⚡</span>
                                {effect}
                              </li>
                            ))}
                          </ul>
                        </Card>
                      )}

                      {/* Regional Stability Comparison */}
                      {evolutionResult.stability_comparison && evolutionResult.stability_comparison.length > 0 && (
                        <Card className="bg-slate-950/80 backdrop-blur-xl cyber-border p-6">
                          <h3 className="text-xl font-bold text-blue-400 glow-text font-mono mb-4">
                            REGIONAL STABILITY COMPARISON
                          </h3>
                          <div className="grid md:grid-cols-2 gap-4">
                            {evolutionResult.stability_comparison.map((region, idx) => (
                              <div key={idx} className="bg-slate-900/50 cyber-border rounded-lg p-4">
                                <h4 className="text-sm font-bold text-cyan-400 font-mono mb-3">{region.region}</h4>
                                <div className="flex items-center justify-between mb-2">
                                  <span className="text-xs text-slate-500 font-mono">Original Stability</span>
                                  <span className={`text-sm font-bold font-mono ${getRiskColor(100 - region.original_stability)}`}>
                                    {region.original_stability}/100
                                  </span>
                                </div>
                                <div className="flex items-center justify-between mb-3">
                                  <span className="text-xs text-slate-500 font-mono">Revised Stability</span>
                                  <span className={`text-sm font-bold font-mono ${getRiskColor(100 - region.revised_stability)}`}>
                                    {region.revised_stability}/100
                                  </span>
                                </div>
                                <p className="text-slate-400 font-mono text-xs">{region.change_explanation}</p>
                              </div>
                            ))}
                          </div>
                        </Card>
                      )}

                      {/* Timeline Divergence */}
                      {evolutionResult.timeline_divergence_points && evolutionResult.timeline_divergence_points.length > 0 && (
                        <Card className="bg-slate-950/80 backdrop-blur-xl cyber-border p-6">
                          <h3 className="text-xl font-bold text-green-400 glow-text font-mono mb-4">
                            TIMELINE DIVERGENCE POINTS
                          </h3>
                          <ul className="space-y-2">
                            {evolutionResult.timeline_divergence_points.map((point, idx) => (
                              <li key={idx} className="flex items-start gap-2 text-slate-300 font-mono text-sm">
                                <span className="text-green-400">→</span>
                                {point}
                              </li>
                            ))}
                          </ul>
                        </Card>
                      )}

                      {/* New Recommendations */}
                      {evolutionResult.recommendations && evolutionResult.recommendations.length > 0 && (
                        <Card className="bg-gradient-to-br from-green-950/50 to-cyan-950/50 backdrop-blur-xl cyber-border p-6">
                          <h3 className="text-xl font-bold text-green-400 glow-text font-mono mb-4">
                            UPDATED STRATEGIC RECOMMENDATIONS
                          </h3>
                          <ul className="space-y-2">
                            {evolutionResult.recommendations.map((rec, idx) => (
                              <li key={idx} className="flex items-start gap-2 text-slate-300 font-mono text-sm">
                                <span className="text-green-400 font-bold">{idx + 1}.</span>
                                {rec}
                              </li>
                            ))}
                          </ul>
                        </Card>
                      )}
                    </div>
                  )}

                  {/* Original Simulation Results (displayed only if no evolution result is active) */}
                  {!evolutionResult && (
                    <div className="space-y-6 animate-in fade-in duration-500">
                      {/* Overview */}
                      <Card className="bg-gradient-to-br from-purple-950/50 to-pink-950/50 backdrop-blur-xl cyber-border p-6">
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex items-center gap-3">
                            <Zap className="w-8 h-8 text-purple-400" />
                            <div>
                              <h3 className="text-2xl font-bold text-purple-400 glow-text font-mono">
                                SIMULATION RESULTS
                              </h3>
                              <p className="text-cyan-400 text-sm font-mono mt-1">{scenario.name}</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className={`text-4xl font-bold font-mono ${getRiskColor(simulation.overall_risk_score)}`}>
                              {simulation.overall_risk_score}
                            </div>
                            <div className="text-xs text-slate-400 font-mono">Risk Score</div>
                          </div>
                        </div>

                        <div className="grid md:grid-cols-2 gap-4 mb-4">
                          <div className="p-4 bg-slate-900/50 cyber-border rounded-lg">
                            <div className="text-sm text-slate-400 font-mono mb-1">Conflict Probability</div>
                            <div className="text-3xl font-bold text-red-400 font-mono">
                              {simulation.conflict_probability}%
                            </div>
                          </div>
                          <div className="p-4 bg-slate-900/50 cyber-border rounded-lg">
                            <div className="text-sm text-slate-400 font-mono mb-1">Timeframe</div>
                            <div className="text-3xl font-bold text-cyan-400 font-mono">
                              {scenario.timeframe} YRS
                            </div>
                          </div>
                        </div>

                        <p className="text-slate-300 font-mono text-sm leading-relaxed">
                          {simulation.scenario_summary}
                        </p>
                      </Card>

                      {/* Potential Outcomes */}
                      <Card className="bg-slate-950/80 backdrop-blur-xl cyber-border p-6">
                        <h3 className="text-xl font-bold text-red-400 glow-text font-mono mb-4 flex items-center gap-2">
                          <Target className="w-5 h-5" />
                          POTENTIAL OUTCOMES
                        </h3>
                        <div className="space-y-4">
                          {simulation.potential_outcomes?.map((outcome, idx) => (
                            <div key={idx} className="bg-slate-900/50 cyber-border rounded-lg p-4">
                              <div className="flex items-start justify-between mb-3">
                                <h4 className="text-lg font-bold text-yellow-400 font-mono">
                                  {outcome.outcome_name}
                                </h4>
                                <Badge className="bg-purple-500/20 text-purple-400 border-purple-500/30 font-mono">
                                  {outcome.probability}% PROBABILITY
                                </Badge>
                              </div>

                              <p className="text-slate-400 font-mono text-sm mb-3">{outcome.description}</p>

                              <div className="grid md:grid-cols-3 gap-3 mb-3">
                                <div className="p-2 bg-slate-950/50 cyber-border rounded">
                                  <div className="text-xs text-slate-500 font-mono">Duration</div>
                                  <div className="text-cyan-400 font-mono text-sm font-bold">{outcome.duration}</div>
                                </div>
                                <div className="p-2 bg-slate-950/50 cyber-border rounded">
                                  <div className="text-xs text-slate-500 font-mono">Casualties</div>
                                  <div className="text-red-400 font-mono text-sm font-bold">
                                    {outcome.casualties?.total?.toLocaleString() || 'N/A'}
                                  </div>
                                </div>
                                <div className="p-2 bg-slate-950/50 cyber-border rounded">
                                  <div className="text-xs text-slate-500 font-mono">Economic Cost</div>
                                  <div className="text-orange-400 font-mono text-sm font-bold">{outcome.economic_cost}</div>
                                </div>
                              </div>

                              {outcome.victor && (
                                <div className="mb-3">
                                  <span className="text-xs text-slate-500 font-mono">Victor: </span>
                                  <span className="text-green-400 font-mono text-sm font-bold">{outcome.victor}</span>
                                </div>
                              )}

                              <div className="pt-3 border-t border-slate-700/30">
                                <div className="text-xs text-slate-500 font-mono mb-2">Consequences:</div>
                                <ul className="space-y-1">
                                  {outcome.consequences?.map((consequence, i) => (
                                    <li key={i} className="text-slate-400 font-mono text-xs flex items-start gap-2">
                                      <span className="text-cyan-400">•</span>
                                      {consequence}
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            </div>
                          ))}
                        </div>
                      </Card>

                      {/* Escalation Pathways */}
                      <Card className="bg-slate-950/80 backdrop-blur-xl cyber-border p-6">
                        <h3 className="text-xl font-bold text-orange-400 glow-text font-mono mb-4 flex items-center gap-2">
                          <TrendingUp className="w-5 h-5" />
                          ESCALATION PATHWAYS
                        </h3>
                        <div className="space-y-3">
                          {simulation.escalation_pathways?.map((pathway, idx) => (
                            <div key={idx} className="bg-slate-900/50 cyber-border rounded-lg p-4">
                              <div className="flex items-start justify-between mb-2">
                                <div>
                                  <h4 className="text-sm font-bold text-cyan-400 font-mono mb-1">
                                    STAGE {idx + 1}: {pathway.stage}
                                  </h4>
                                  <div className="text-xs text-slate-500 font-mono">{pathway.timeframe}</div>
                                </div>
                                <div className="flex items-center gap-2">
                                  <div className="text-xs text-slate-500 font-mono">Intensity:</div>
                                  <div className="h-2 w-20 bg-slate-900 rounded-full overflow-hidden">
                                    <div
                                      className={`h-full ${getIntensityColor(pathway.intensity)}`}
                                      style={{ width: `${pathway.intensity}%` }}
                                    />
                                  </div>
                                </div>
                              </div>

                              <div className="mb-2">
                                <span className="text-xs text-yellow-400 font-mono">Trigger: </span>
                                <span className="text-slate-400 font-mono text-xs">{pathway.trigger}</span>
                              </div>

                              <p className="text-slate-400 font-mono text-xs">{pathway.description}</p>
                            </div>
                          ))}
                        </div>
                      </Card>

                      {/* Timeline */}
                      {simulation.timeline && simulation.timeline.length > 0 && (
                        <Card className="bg-slate-950/80 backdrop-blur-xl cyber-border p-6">
                          <h3 className="text-xl font-bold text-green-400 glow-text font-mono mb-4">
                            EVENT TIMELINE
                          </h3>
                          <div className="space-y-4">
                            {simulation.timeline.map((period, idx) => (
                              <div key={idx} className="border-l-2 border-green-500/30 pl-4">
                                <h4 className="text-sm font-bold text-cyan-400 font-mono mb-2">{period.period}</h4>
                                <ul className="space-y-1">
                                  {period.events?.map((event, i) => (
                                    <li key={i} className="text-slate-400 font-mono text-xs flex items-start gap-2">
                                      <span className="text-green-400">→</span>
                                      {event}
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            ))}
                          </div>
                        </Card>
                      )}

                      {/* Geopolitical Shifts */}
                      <Card className="bg-slate-950/80 backdrop-blur-xl cyber-border p-6">
                        <h3 className="text-xl font-bold text-purple-400 glow-text font-mono mb-4 flex items-center gap-2">
                          <Globe className="w-5 h-5" />
                          GEOPOLITICAL SHIFTS
                        </h3>
                        <div className="space-y-4">
                          <div className="p-4 bg-slate-900/50 cyber-border rounded-lg">
                            <h4 className="text-sm font-bold text-cyan-400 font-mono mb-2">Power Balance</h4>
                            <p className="text-slate-300 font-mono text-sm">{simulation.geopolitical_shifts?.power_balance}</p>
                          </div>

                          <div className="grid md:grid-cols-2 gap-4">
                            {simulation.geopolitical_shifts?.new_alliances?.length > 0 && (
                              <div className="p-4 bg-green-950/20 cyber-border rounded-lg">
                                <h4 className="text-sm font-bold text-green-400 font-mono mb-2">New Alliances</h4>
                                <ul className="space-y-1">
                                  {simulation.geopolitical_shifts.new_alliances.map((alliance, i) => (
                                    <li key={i} className="text-slate-400 font-mono text-xs">• {alliance}</li>
                                  ))}
                                </ul>
                              </div>
                            )}

                            {simulation.geopolitical_shifts?.collapsed_alliances?.length > 0 && (
                              <div className="p-4 bg-red-950/20 cyber-border rounded-lg">
                                <h4 className="text-sm font-bold text-red-400 font-mono mb-2">Collapsed Alliances</h4>
                                <ul className="space-y-1">
                                  {simulation.geopolitical_shifts.collapsed_alliances.map((alliance, i) => (
                                    <li key={i} className="text-slate-400 font-mono text-xs">• {alliance}</li>
                                  ))}
                                </ul>
                              </div>
                            )}

                            {simulation.geopolitical_shifts?.emerging_powers?.length > 0 && (
                              <div className="p-4 bg-cyan-950/20 cyber-border rounded-lg">
                                <h4 className="text-sm font-bold text-cyan-400 font-mono mb-2">Emerging Powers</h4>
                                <ul className="space-y-1">
                                  {simulation.geopolitical_shifts.emerging_powers.map((power, i) => (
                                    <li key={i} className="text-slate-400 font-mono text-xs">• {power}</li>
                                  ))}
                                </ul>
                              </div>
                            )}

                            {simulation.geopolitical_shifts?.declining_powers?.length > 0 && (
                              <div className="p-4 bg-orange-950/20 cyber-border rounded-lg">
                                <h4 className="text-sm font-bold text-orange-400 font-mono mb-2">Declining Powers</h4>
                                <ul className="space-y-1">
                                  {simulation.geopolitical_shifts.declining_powers.map((power, i) => (
                                    <li key={i} className="text-slate-400 font-mono text-xs">• {power}</li>
                                  ))}
                                </ul>
                              </div>
                            )}
                          </div>
                        </div>
                      </Card>

                      {/* Technology Evolution */}
                      {simulation.technology_evolution && simulation.technology_evolution.length > 0 && (
                        <Card className="bg-slate-950/80 backdrop-blur-xl cyber-border p-6">
                          <h3 className="text-xl font-bold text-cyan-400 glow-text font-mono mb-4">
                            TECHNOLOGY EVOLUTION
                          </h3>
                          <div className="space-y-3">
                            {simulation.technology_evolution.map((tech, idx) => (
                              <div key={idx} className="bg-slate-900/50 cyber-border rounded-lg p-4">
                                <h4 className="text-sm font-bold text-green-400 font-mono mb-2">{tech.technology}</h4>
                                <div className="mb-2">
                                  <span className="text-xs text-slate-500 font-mono">Advancement: </span>
                                  <span className="text-cyan-400 font-mono text-xs">{tech.advancement}</span>
                                </div>
                                <p className="text-slate-400 font-mono text-xs">{tech.impact}</p>
                              </div>
                            ))}
                          </div>
                        </Card>
                      )}

                      {/* Critical Decision Points */}
                      {simulation.critical_decision_points && simulation.critical_decision_points.length > 0 && (
                        <Card className="bg-slate-950/80 backdrop-blur-xl cyber-border p-6">
                          <h3 className="text-xl font-bold text-yellow-400 glow-text font-mono mb-4">
                            CRITICAL DECISION POINTS
                          </h3>
                          <div className="space-y-3">
                            {simulation.critical_decision_points.map((decision, idx) => (
                              <div key={idx} className="bg-slate-900/50 cyber-border rounded-lg p-4">
                                <div className="flex items-start justify-between mb-2">
                                  <h4 className="text-sm font-bold text-yellow-400 font-mono">{decision.decision}</h4>
                                  <Badge variant="outline" className="border-yellow-500/30 text-yellow-400 font-mono text-xs">
                                    {decision.timing}
                                  </Badge>
                                </div>
                                <p className="text-slate-400 font-mono text-xs mb-2">{decision.impact}</p>
                                {decision.alternatives?.length > 0 && (
                                  <div className="pt-2 border-t border-slate-700/30">
                                    <div className="text-xs text-slate-500 font-mono mb-1">Alternatives:</div>
                                    <ul className="space-y-1">
                                      {decision.alternatives.map((alt, i) => (
                                        <li key={i} className="text-slate-400 font-mono text-xs">• {alt}</li>
                                      ))}
                                    </ul>
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        </Card>
                      )}

                      {/* Regional Stability */}
                      {simulation.regional_stability && simulation.regional_stability.length > 0 && (
                        <Card className="bg-slate-950/80 backdrop-blur-xl cyber-border p-6">
                          <h3 className="text-xl font-bold text-blue-400 glow-text font-mono mb-4">
                            REGIONAL STABILITY ANALYSIS
                          </h3>
                          <div className="grid md:grid-cols-2 gap-4">
                            {simulation.regional_stability.map((region, idx) => (
                              <div key={idx} className="bg-slate-900/50 cyber-border rounded-lg p-4">
                                <h4 className="text-sm font-bold text-cyan-400 font-mono mb-3">{region.region}</h4>
                                <div className="flex items-center justify-between mb-2">
                                  <span className="text-xs text-slate-500 font-mono">Current</span>
                                  <span className={`text-sm font-bold font-mono ${getRiskColor(100 - region.current_stability)}`}>
                                    {region.current_stability}/100
                                  </span>
                                </div>
                                <div className="flex items-center justify-between mb-3">
                                  <span className="text-xs text-slate-500 font-mono">Projected</span>
                                  <span className={`text-sm font-bold font-mono ${getRiskColor(100 - region.projected_stability)}`}>
                                    {region.projected_stability}/100
                                  </span>
                                </div>
                                <p className="text-slate-400 font-mono text-xs">{region.analysis}</p>
                              </div>
                            ))}
                          </div>
                        </Card>
                      )}

                      {/* Post-Conflict Order */}
                      {simulation.post_conflict_order && (
                        <Card className="bg-gradient-to-br from-blue-950/50 to-purple-950/50 backdrop-blur-xl cyber-border p-6">
                          <h3 className="text-xl font-bold text-blue-400 glow-text font-mono mb-4">
                            POST-CONFLICT WORLD ORDER
                          </h3>
                          <div className="grid md:grid-cols-2 gap-4">
                            <div className="p-4 bg-slate-900/50 cyber-border rounded-lg">
                              <h4 className="text-sm font-bold text-cyan-400 font-mono mb-2">Global Power Structure</h4>
                              <p className="text-slate-300 font-mono text-xs">{simulation.post_conflict_order.global_power_structure}</p>
                            </div>
                            <div className="p-4 bg-slate-900/50 cyber-border rounded-lg">
                              <h4 className="text-sm font-bold text-cyan-400 font-mono mb-2">International Institutions</h4>
                              <p className="text-slate-300 font-mono text-xs">{simulation.post_conflict_order.international_institutions}</p>
                            </div>
                            <div className="p-4 bg-slate-900/50 cyber-border rounded-lg">
                              <h4 className="text-sm font-bold text-cyan-400 font-mono mb-2">Economic Order</h4>
                              <p className="text-slate-300 font-mono text-xs">{simulation.post_conflict_order.economic_order}</p>
                            </div>
                            <div className="p-4 bg-slate-900/50 cyber-border rounded-lg">
                              <h4 className="text-sm font-bold text-cyan-400 font-mono mb-2">Security Architecture</h4>
                              <p className="text-slate-300 font-mono text-xs">{simulation.post_conflict_order.security_architecture}</p>
                            </div>
                          </div>
                        </Card>
                      )}

                      {/* Recommendations */}
                      {simulation.recommendations && simulation.recommendations.length > 0 && (
                        <Card className="bg-gradient-to-br from-green-950/50 to-cyan-950/50 backdrop-blur-xl cyber-border p-6">
                          <h3 className="text-xl font-bold text-green-400 glow-text font-mono mb-4">
                            STRATEGIC RECOMMENDATIONS
                          </h3>
                          <ul className="space-y-2">
                            {simulation.recommendations.map((rec, idx) => (
                              <li key={idx} className="flex items-start gap-2 text-slate-300 font-mono text-sm">
                                <span className="text-green-400 font-bold">{idx + 1}.</span>
                                {rec}
                              </li>
                            ))}
                          </ul>
                        </Card>
                      )}
                    </div>
                  )}

                  {/* AI Strategy Advisor */}
                  <AIStrategyAdvisor 
                    scenarioData={scenario}
                    simulationResults={simulation}
                    autoAnalyze={false}
                  />
                </div>
              )}
            </TabsContent>

            {/* Counter-Strategies Tab */}
            <TabsContent value="strategies" className="mt-6">
              {counterStrategies ? (
                <div className="space-y-6 animate-in fade-in duration-500">
                  <Card className="bg-gradient-to-br from-cyan-950/50 to-blue-950/50 backdrop-blur-xl cyber-border p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <Lightbulb className="w-8 h-8 text-cyan-400" />
                        <div>
                          <h3 className="text-2xl font-bold text-cyan-400 glow-text font-mono">
                            COUNTER-STRATEGIES
                          </h3>
                          <p className="text-purple-400 text-sm font-mono mt-1">Strategic Recommendations for De-escalation</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className={`text-4xl font-bold font-mono ${getRiskColor(100 - counterStrategies.risk_reduction_potential)}`}>
                          {counterStrategies.risk_reduction_potential}%
                        </div>
                        <div className="text-xs text-slate-400 font-mono">Risk Reduction Potential</div>
                      </div>
                    </div>
                    <p className="text-slate-300 font-mono text-sm leading-relaxed">
                      {counterStrategies.strategy_summary}
                    </p>
                  </Card>

                  {/* Parameter Adjustments */}
                  {counterStrategies.parameter_adjustments && counterStrategies.parameter_adjustments.length > 0 && (
                    <Card className="bg-slate-950/80 backdrop-blur-xl cyber-border p-6">
                      <h3 className="text-xl font-bold text-green-400 glow-text font-mono mb-4">
                        PARAMETER ADJUSTMENTS
                      </h3>
                      <div className="space-y-3">
                        {counterStrategies.parameter_adjustments.map((adj, idx) => (
                          <div key={idx} className="bg-slate-900/50 cyber-border rounded-lg p-4">
                            <h4 className="text-sm font-bold text-cyan-400 font-mono mb-2">{adj.parameter}</h4>
                            <div className="grid grid-cols-2 gap-2 text-xs text-slate-400 font-mono mb-2">
                              <span>Current Value: <span className="text-green-400">{adj.current_value}/100</span></span>
                              <span>Recommended Value: <span className="text-yellow-400">{adj.recommended_value}/100</span></span>
                              <span>Difficulty: <span className="text-orange-400">{adj.difficulty}</span></span>
                            </div>
                            <p className="text-slate-400 font-mono text-xs mb-1"><strong>Rationale:</strong> {adj.rationale}</p>
                            <p className="text-slate-400 font-mono text-xs"><strong>Expected Impact:</strong> {adj.expected_impact}</p>
                          </div>
                        ))}
                      </div>
                    </Card>
                  )}

                  {/* Diplomatic Interventions */}
                  {counterStrategies.diplomatic_interventions && counterStrategies.diplomatic_interventions.length > 0 && (
                    <Card className="bg-slate-950/80 backdrop-blur-xl cyber-border p-6">
                      <h3 className="text-xl font-bold text-blue-400 glow-text font-mono mb-4">
                        DIPLOMATIC INTERVENTIONS
                      </h3>
                      <div className="space-y-3">
                        {counterStrategies.diplomatic_interventions.map((di, idx) => (
                          <div key={idx} className="bg-slate-900/50 cyber-border rounded-lg p-4">
                            <h4 className="text-sm font-bold text-purple-400 font-mono mb-2">{di.intervention}</h4>
                            <div className="grid grid-cols-2 gap-2 text-xs text-slate-400 font-mono mb-2">
                              <span>Timing: <span className="text-cyan-400">{di.timing}</span></span>
                              <span>Success Probability: <span className="text-green-400">{di.success_probability}%</span></span>
                            </div>
                            <p className="text-slate-400 font-mono text-xs mb-1"><strong>Approach:</strong> {di.approach}</p>
                            {di.stakeholders && di.stakeholders.length > 0 && (
                              <p className="text-slate-400 font-mono text-xs">
                                <strong>Stakeholders:</strong> {di.stakeholders.join(', ')}
                              </p>
                            )}
                          </div>
                        ))}
                      </div>
                    </Card>
                  )}

                  {/* Economic Measures */}
                  {counterStrategies.economic_measures && counterStrategies.economic_measures.length > 0 && (
                    <Card className="bg-slate-950/80 backdrop-blur-xl cyber-border p-6">
                      <h3 className="text-xl font-bold text-yellow-400 glow-text font-mono mb-4">
                        ECONOMIC MEASURES
                      </h3>
                      <div className="space-y-3">
                        {counterStrategies.economic_measures.map((em, idx) => (
                          <div key={idx} className="bg-slate-900/50 cyber-border rounded-lg p-4">
                            <h4 className="text-sm font-bold text-orange-400 font-mono mb-2">{em.measure} ({em.type})</h4>
                            <p className="text-slate-400 font-mono text-xs mb-1"><strong>Target Nations:</strong> {em.target_nations.join(', ')}</p>
                            <p className="text-slate-400 font-mono text-xs"><strong>Expected Effect:</strong> {em.expected_effect}</p>
                          </div>
                        ))}
                      </div>
                    </Card>
                  )}

                  {/* Military Adjustments */}
                  {counterStrategies.military_adjustments && counterStrategies.military_adjustments.length > 0 && (
                    <Card className="bg-slate-950/80 backdrop-blur-xl cyber-border p-6">
                      <h3 className="text-xl font-bold text-red-400 glow-text font-mono mb-4">
                        MILITARY POSTURE ADJUSTMENTS
                      </h3>
                      <div className="space-y-3">
                        {counterStrategies.military_adjustments.map((ma, idx) => (
                          <div key={idx} className="bg-slate-900/50 cyber-border rounded-lg p-4">
                            <h4 className="text-sm font-bold text-yellow-400 font-mono mb-2">{ma.adjustment}</h4>
                            <p className="text-slate-400 font-mono text-xs mb-1"><strong>Rationale:</strong> {ma.rationale}</p>
                            <p className="text-slate-400 font-mono text-xs"><strong>Implementation:</strong> {ma.implementation}</p>
                          </div>
                        ))}
                      </div>
                    </Card>
                  )}

                  {/* Technology Solutions */}
                  {counterStrategies.technology_solutions && counterStrategies.technology_solutions.length > 0 && (
                    <Card className="bg-slate-950/80 backdrop-blur-xl cyber-border p-6">
                      <h3 className="text-xl font-bold text-cyan-400 glow-text font-mono mb-4">
                        TECHNOLOGY-BASED SOLUTIONS
                      </h3>
                      <div className="space-y-3">
                        {counterStrategies.technology_solutions.map((ts, idx) => (
                          <div key={idx} className="bg-slate-900/50 cyber-border rounded-lg p-4">
                            <h4 className="text-sm font-bold text-green-400 font-mono mb-2">{ts.solution}</h4>
                            <p className="text-slate-400 font-mono text-xs mb-1"><strong>Description:</strong> {ts.description}</p>
                            {ts.benefits && ts.benefits.length > 0 && (
                              <div>
                                <p className="text-slate-400 font-mono text-xs mb-1"><strong>Benefits:</strong></p>
                                <ul className="list-disc list-inside text-slate-400 font-mono text-xs">
                                  {ts.benefits.map((benefit, i) => (
                                    <li key={i}>{benefit}</li>
                                  ))}
                                </ul>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </Card>
                  )}

                  {/* Implementation Roadmap */}
                  {counterStrategies.implementation_roadmap && counterStrategies.implementation_roadmap.length > 0 && (
                    <Card className="bg-gradient-to-br from-green-950/50 to-cyan-950/50 backdrop-blur-xl cyber-border p-6">
                      <h3 className="text-xl font-bold text-green-400 glow-text font-mono mb-4">
                        IMPLEMENTATION ROADMAP
                      </h3>
                      <div className="space-y-3">
                        {counterStrategies.implementation_roadmap.map((roadmap, idx) => (
                          <div key={idx} className="bg-slate-900/50 cyber-border rounded-lg p-4">
                            <h4 className="text-sm font-bold text-cyan-400 font-mono mb-2">{roadmap.phase} <span className="text-xs text-slate-500">({roadmap.timeline})</span></h4>
                            <ul className="space-y-1">
                              {roadmap.actions.map((action, i) => (
                                <li key={i} className="text-slate-400 font-mono text-xs flex items-start gap-2">
                                  <span className="text-green-400">→</span>
                                  {action}
                                </li>
                              ))}
                            </ul>
                          </div>
                        ))}
                      </div>
                    </Card>
                  )}
                </div>
              ) : (
                <Card className="bg-slate-950/80 backdrop-blur-xl cyber-border p-12">
                  <div className="text-center">
                    <Lightbulb className="w-16 h-16 text-cyan-400 mx-auto mb-4" />
                    <p className="text-slate-400 font-mono">
                      Run a simulation first, then generate counter-strategies from the Results tab
                    </p>
                  </div>
                </Card>
              )}
            </TabsContent>

            {/* Branches Tab */}
            <TabsContent value="branches" className="mt-6">
              <ScenarioBranching
                currentScenario={scenario}
                branches={branches}
                onCreateBranch={handleCreateBranch}
                onSwitchBranch={handleSwitchBranch}
                onMergeBranches={handleMergeBranches}
                onRevertToState={handleRevertToState}
                onDeleteBranch={handleDeleteBranch}
                currentScenarioId={currentScenarioId}
              />
            </TabsContent>

            {/* Compare Tab */}
            <TabsContent value="compare" className="mt-6">
              <BranchComparisonChart 
                branches={branches}
                currentScenarioId={currentScenarioId}
              />
            </TabsContent>
            </Tabs>
        </div>
      </div>
    </div>
  );
}