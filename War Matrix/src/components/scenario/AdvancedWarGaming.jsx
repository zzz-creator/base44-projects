import React, { useState } from 'react';
import { base44 } from '../../api/base44Client';
import { useMutation } from '@tanstack/react-query';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Textarea } from '../ui/textarea';
import { Badge } from '../ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { 
  Swords, Loader2, Play, Users, Shield, DollarSign, 
  Skull, TrendingDown, Globe, ChevronRight, RotateCcw,
  GitBranch, Plus, Trash2, Eye, ArrowRight, Copy, BarChart3,
  TrendingUp, AlertTriangle
} from 'lucide-react';
import { toast } from 'sonner';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar } from 'recharts';

export default function AdvancedWarGaming() {
  const [scenario, setScenario] = useState({
    conflict_name: '',
    belligerents: { side_a: '', side_b: '' },
    theater: '',
    initial_conditions: '',
    strategy_a: '',
    strategy_b: ''
  });
  const [results, setResults] = useState(null);
  const [selectedRound, setSelectedRound] = useState(0);
  
  // Branching state
  const [branches, setBranches] = useState([]);
  const [activeBranchId, setActiveBranchId] = useState(null);
  const [branchName, setBranchName] = useState('');
  const [branchDivergence, setBranchDivergence] = useState('');
  const [branchFromRound, setBranchFromRound] = useState(0);
  const [showBranchModal, setShowBranchModal] = useState(false);
  
  // Branch comparison state
  const [selectedBranchesForComparison, setSelectedBranchesForComparison] = useState(['main']);

  const runWarGameMutation = useMutation({
    mutationFn: async (branchParams = null) => {
      const basePrompt = branchParams 
        ? `You are an advanced military simulation AI. Continue a war-gaming scenario from a BRANCHING POINT.

ORIGINAL SCENARIO:
Conflict: ${scenario.conflict_name}
Side A: ${scenario.belligerents.side_a}
Side B: ${scenario.belligerents.side_b}
Theater: ${scenario.theater}

BRANCHING FROM ROUND ${branchParams.fromRound + 1}:
Previous rounds completed: ${JSON.stringify(branchParams.previousRounds)}

DIVERGENCE POINT (What-If):
${branchParams.divergence}

Simulate the REMAINING ${5 - branchParams.fromRound} rounds with this new divergence. Consider how the what-if scenario changes the trajectory.`
        : `You are an advanced military simulation AI. Run a detailed war-gaming scenario:

Conflict: ${scenario.conflict_name}
Side A: ${scenario.belligerents.side_a}
Side B: ${scenario.belligerents.side_b}
Theater of Operations: ${scenario.theater}
Initial Conditions: ${scenario.initial_conditions}
Strategy A: ${scenario.strategy_a}
Strategy B: ${scenario.strategy_b}

Simulate 5 rounds of conflict, each representing a phase of the war.`;

      const response = await base44.integrations.Core.InvokeLLM({
        prompt: `${basePrompt}

For each round provide:
1. Key military actions by each side
2. Territorial changes
3. Casualty estimates (military and civilian)
4. Economic impact on both sides
5. International response
6. Momentum shift (which side gained advantage)

At the end, provide:
- Final outcome assessment
- Total casualty estimates
- Economic damage assessment
- Likelihood of each possible ending (victory A, victory B, stalemate, negotiated peace)
- Lessons learned

Be realistic and detailed in your simulation.`,
        response_json_schema: {
          type: 'object',
          properties: {
            simulation_id: { type: 'string' },
            rounds: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  round: { type: 'number' },
                  phase_name: { type: 'string' },
                  actions_side_a: { type: 'array', items: { type: 'string' } },
                  actions_side_b: { type: 'array', items: { type: 'string' } },
                  territorial_changes: { type: 'string' },
                  casualties_a: { type: 'number' },
                  casualties_b: { type: 'number' },
                  civilian_casualties: { type: 'number' },
                  economic_impact_a: { type: 'string' },
                  economic_impact_b: { type: 'string' },
                  international_response: { type: 'string' },
                  momentum: { type: 'string' }
                }
              }
            },
            final_outcome: {
              type: 'object',
              properties: {
                winner: { type: 'string' },
                outcome_type: { type: 'string' },
                total_casualties_a: { type: 'number' },
                total_casualties_b: { type: 'number' },
                total_civilian_casualties: { type: 'number' },
                economic_damage_global: { type: 'string' },
                probability_victory_a: { type: 'number' },
                probability_victory_b: { type: 'number' },
                probability_stalemate: { type: 'number' },
                probability_negotiated_peace: { type: 'number' }
              }
            },
            lessons_learned: { type: 'array', items: { type: 'string' } },
            strategic_recommendations: { type: 'array', items: { type: 'string' } }
          }
        },
        add_context_from_internet: true
      });
      return { response, branchParams };
    },
    onSuccess: ({ response, branchParams }) => {
      if (branchParams) {
        const newBranch = {
          id: Date.now().toString(),
          name: branchName || `Branch ${branches.length + 1}`,
          divergencePoint: branchParams.fromRound,
          divergenceDescription: branchParams.divergence,
          previousRounds: branchParams.previousRounds,
          results: response,
          createdAt: new Date().toISOString()
        };
        setBranches([...branches, newBranch]);
        setActiveBranchId(newBranch.id);
        setShowBranchModal(false);
        setBranchName('');
        setBranchDivergence('');
        toast.success(`Branch "${newBranch.name}" created successfully`);
      } else {
        setResults(response);
        setSelectedRound(0);
        setActiveBranchId(null);
      }
    }
  });

  const createBranch = () => {
    if (!branchDivergence.trim()) {
      toast.error('Please describe the what-if divergence');
      return;
    }

    const previousRounds = results.rounds.slice(0, branchFromRound + 1);
    
    runWarGameMutation.mutate({
      fromRound: branchFromRound,
      divergence: branchDivergence,
      previousRounds
    });
  };

  const deleteBranch = (branchId) => {
    setBranches(branches.filter(b => b.id !== branchId));
    if (activeBranchId === branchId) {
      setActiveBranchId(null);
    }
    setSelectedBranchesForComparison(prev => prev.filter(id => id !== branchId));
    toast.success('Branch deleted');
  };

  const toggleBranchComparison = (branchId) => {
    setSelectedBranchesForComparison(prev => {
      if (prev.includes(branchId)) {
        return prev.filter(id => id !== branchId);
      }
      return [...prev, branchId];
    });
  };

  const getActiveResults = () => {
    if (activeBranchId) {
      const branch = branches.find(b => b.id === activeBranchId);
      return branch?.results;
    }
    return results;
  };

  const getActiveBranch = () => {
    return branches.find(b => b.id === activeBranchId);
  };

  const formatNumber = (num) => {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return num?.toString() || '0';
  };

  const activeResults = getActiveResults();
  const activeBranch = getActiveBranch();

  // Prepare data for comparison charts
  const getComparisonData = () => {
    const data = [];
    
    if (selectedBranchesForComparison.includes('main') && results) {
      data.push({
        name: 'Main Timeline',
        id: 'main',
        casualties_a: results.final_outcome?.total_casualties_a || 0,
        casualties_b: results.final_outcome?.total_casualties_b || 0,
        civilian: results.final_outcome?.total_civilian_casualties || 0,
        victory_a: results.final_outcome?.probability_victory_a || 0,
        victory_b: results.final_outcome?.probability_victory_b || 0,
        stalemate: results.final_outcome?.probability_stalemate || 0,
        peace: results.final_outcome?.probability_negotiated_peace || 0,
        outcome: results.final_outcome?.winner || 'Unknown',
        divergence: 'Original'
      });
    }
    
    branches.forEach(branch => {
      if (selectedBranchesForComparison.includes(branch.id)) {
        data.push({
          name: branch.name,
          id: branch.id,
          casualties_a: branch.results?.final_outcome?.total_casualties_a || 0,
          casualties_b: branch.results?.final_outcome?.total_casualties_b || 0,
          civilian: branch.results?.final_outcome?.total_civilian_casualties || 0,
          victory_a: branch.results?.final_outcome?.probability_victory_a || 0,
          victory_b: branch.results?.final_outcome?.probability_victory_b || 0,
          stalemate: branch.results?.final_outcome?.probability_stalemate || 0,
          peace: branch.results?.final_outcome?.probability_negotiated_peace || 0,
          outcome: branch.results?.final_outcome?.winner || 'Unknown',
          divergence: branch.divergenceDescription?.slice(0, 50) + '...'
        });
      }
    });
    
    return data;
  };

  // Prepare timeline data for selected branches
  const getTimelineComparisonData = () => {
    const timelineData = [];
    
    for (let i = 0; i < 5; i++) {
      const roundData = { round: `Round ${i + 1}` };
      
      if (selectedBranchesForComparison.includes('main') && results?.rounds?.[i]) {
        roundData['Main_casualties'] = (results.rounds[i].casualties_a || 0) + (results.rounds[i].casualties_b || 0);
      }
      
      branches.forEach(branch => {
        if (selectedBranchesForComparison.includes(branch.id)) {
          const branchRound = branch.results?.rounds?.[i] || branch.previousRounds?.[i];
          if (branchRound) {
            roundData[`${branch.name}_casualties`] = (branchRound.casualties_a || 0) + (branchRound.casualties_b || 0);
          }
        }
      });
      
      timelineData.push(roundData);
    }
    
    return timelineData;
  };

  const comparisonData = getComparisonData();
  const timelineData = getTimelineComparisonData();

  return (
    <Card className="bg-slate-950/80 backdrop-blur-xl border border-sky-900/40 p-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 rounded-lg bg-orange-500/20 border border-orange-500/30">
          <Swords className="w-6 h-6 text-orange-400" />
        </div>
        <div>
          <h3 className="text-xl font-bold text-orange-400 glow-text font-mono">
            ADVANCED WAR-GAMING
          </h3>
          <p className="text-xs text-slate-400 font-mono">Strategic Conflict Simulation with Branching Scenarios</p>
        </div>
      </div>

      <Tabs defaultValue="setup" className="space-y-4">
        <TabsList className="grid grid-cols-5 bg-slate-900/50">
          <TabsTrigger value="setup" className="font-mono text-xs">SETUP</TabsTrigger>
          <TabsTrigger value="simulation" className="font-mono text-xs" disabled={!results}>SIMULATION</TabsTrigger>
          <TabsTrigger value="branches" className="font-mono text-xs" disabled={!results}>
            BRANCHES ({branches.length})
          </TabsTrigger>
          <TabsTrigger value="comparison" className="font-mono text-xs" disabled={!results}>
            COMPARISON
          </TabsTrigger>
          <TabsTrigger value="analysis" className="font-mono text-xs" disabled={!activeResults}>ANALYSIS</TabsTrigger>
        </TabsList>

        {/* Setup Tab */}
        <TabsContent value="setup" className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="text-sky-400 font-mono text-xs mb-1 block">CONFLICT NAME</label>
              <Input
                value={scenario.conflict_name}
                onChange={(e) => setScenario({ ...scenario, conflict_name: e.target.value })}
                placeholder="e.g., Taiwan Strait Crisis 2025"
                className="bg-slate-900/50 border-slate-600/30 text-slate-200 font-mono"
              />
            </div>
            <div>
              <label className="text-sky-400 font-mono text-xs mb-1 block">THEATER OF OPERATIONS</label>
              <Input
                value={scenario.theater}
                onChange={(e) => setScenario({ ...scenario, theater: e.target.value })}
                placeholder="e.g., Western Pacific"
                className="bg-slate-900/50 border-slate-600/30 text-slate-200 font-mono"
              />
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-3">
                <Shield className="w-4 h-4 text-blue-400" />
                <span className="text-blue-400 font-mono font-bold text-sm">SIDE A</span>
              </div>
              <Input
                value={scenario.belligerents.side_a}
                onChange={(e) => setScenario({ ...scenario, belligerents: { ...scenario.belligerents, side_a: e.target.value } })}
                placeholder="Countries/Forces..."
                className="bg-slate-900/50 border-blue-500/30 text-slate-200 font-mono mb-2"
              />
              <Textarea
                value={scenario.strategy_a}
                onChange={(e) => setScenario({ ...scenario, strategy_a: e.target.value })}
                placeholder="Strategy and objectives..."
                className="bg-slate-900/50 border-blue-500/30 text-slate-200 font-mono h-24"
              />
            </div>

            <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-3">
                <Shield className="w-4 h-4 text-red-400" />
                <span className="text-red-400 font-mono font-bold text-sm">SIDE B</span>
              </div>
              <Input
                value={scenario.belligerents.side_b}
                onChange={(e) => setScenario({ ...scenario, belligerents: { ...scenario.belligerents, side_b: e.target.value } })}
                placeholder="Countries/Forces..."
                className="bg-slate-900/50 border-red-500/30 text-slate-200 font-mono mb-2"
              />
              <Textarea
                value={scenario.strategy_b}
                onChange={(e) => setScenario({ ...scenario, strategy_b: e.target.value })}
                placeholder="Strategy and objectives..."
                className="bg-slate-900/50 border-red-500/30 text-slate-200 font-mono h-24"
              />
            </div>
          </div>

          <div>
            <label className="text-sky-400 font-mono text-xs mb-1 block">INITIAL CONDITIONS</label>
            <Textarea
              value={scenario.initial_conditions}
              onChange={(e) => setScenario({ ...scenario, initial_conditions: e.target.value })}
              placeholder="Describe the starting situation, force dispositions, political context..."
              className="bg-slate-900/50 border-slate-600/30 text-slate-200 font-mono h-24"
            />
          </div>

          <Button
            onClick={() => runWarGameMutation.mutate(null)}
            disabled={runWarGameMutation.isPending || !scenario.conflict_name}
            className="w-full bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white font-mono"
          >
            {runWarGameMutation.isPending && !showBranchModal ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                SIMULATING CONFLICT...
              </>
            ) : (
              <>
                <Play className="w-4 h-4 mr-2" />
                RUN WAR-GAME SIMULATION
              </>
            )}
          </Button>
        </TabsContent>

        {/* Simulation Tab */}
        <TabsContent value="simulation" className="space-y-4">
          {results && (
            <>
              {activeBranchId && activeBranch && (
                <div className="bg-purple-500/10 border border-purple-500/30 rounded-lg p-3 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <GitBranch className="w-4 h-4 text-purple-400" />
                    <span className="text-purple-400 font-mono text-sm font-bold">Viewing: {activeBranch.name}</span>
                    <Badge className="bg-purple-500/20 text-purple-400 border-purple-500/30 font-mono text-xs">
                      Branched from Round {activeBranch.divergencePoint + 1}
                    </Badge>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setActiveBranchId(null)}
                    className="border-purple-500/30 text-purple-400 hover:bg-purple-500/10 font-mono text-xs"
                  >
                    View Main Timeline
                  </Button>
                </div>
              )}

              <div className="flex gap-2 overflow-x-auto pb-2">
                {activeResults?.rounds?.map((round, idx) => (
                  <Button
                    key={idx}
                    size="sm"
                    onClick={() => setSelectedRound(idx)}
                    className={`font-mono text-xs whitespace-nowrap ${
                      selectedRound === idx
                        ? 'bg-sky-500/20 text-sky-400 border-sky-500/30'
                        : 'bg-slate-800/50 text-slate-400 border-slate-600/30'
                    }`}
                  >
                    ROUND {round.round}: {round.phase_name}
                  </Button>
                ))}
              </div>

              {!activeBranchId && (
                <div className="flex justify-end">
                  <Button
                    size="sm"
                    onClick={() => {
                      setBranchFromRound(selectedRound);
                      setShowBranchModal(true);
                    }}
                    className="bg-purple-500/20 hover:bg-purple-500/30 text-purple-400 border border-purple-500/30 font-mono text-xs"
                  >
                    <GitBranch className="w-3 h-3 mr-2" />
                    CREATE WHAT-IF BRANCH FROM ROUND {selectedRound + 1}
                  </Button>
                </div>
              )}

              {showBranchModal && (
                <div className="bg-purple-500/10 border border-purple-500/30 rounded-lg p-4 space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <GitBranch className="w-5 h-5 text-purple-400" />
                      <h4 className="text-lg font-bold text-purple-400 font-mono">CREATE SIMULATION BRANCH</h4>
                    </div>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setShowBranchModal(false)}
                      className="text-slate-400 hover:text-slate-200"
                    >
                      ✕
                    </Button>
                  </div>

                  <div className="bg-slate-900/50 rounded p-3">
                    <div className="text-xs text-slate-500 font-mono mb-1">BRANCHING FROM</div>
                    <div className="text-cyan-400 font-mono">
                      Round {branchFromRound + 1}: {results.rounds[branchFromRound]?.phase_name}
                    </div>
                  </div>

                  <div>
                    <label className="text-purple-400 font-mono text-xs mb-1 block">BRANCH NAME</label>
                    <Input
                      value={branchName}
                      onChange={(e) => setBranchName(e.target.value)}
                      placeholder="e.g., Early Ceasefire Scenario"
                      className="bg-slate-900/50 border-purple-500/30 text-slate-200 font-mono"
                    />
                  </div>

                  <div>
                    <label className="text-purple-400 font-mono text-xs mb-1 block">WHAT-IF DIVERGENCE</label>
                    <Textarea
                      value={branchDivergence}
                      onChange={(e) => setBranchDivergence(e.target.value)}
                      placeholder="Describe the divergence point..."
                      className="bg-slate-900/50 border-purple-500/30 text-slate-200 font-mono h-24"
                    />
                  </div>

                  <Button
                    onClick={createBranch}
                    disabled={runWarGameMutation.isPending || !branchDivergence.trim()}
                    className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-mono"
                  >
                    {runWarGameMutation.isPending ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        SIMULATING BRANCH...
                      </>
                    ) : (
                      <>
                        <GitBranch className="w-4 h-4 mr-2" />
                        CREATE BRANCH & SIMULATE
                      </>
                    )}
                  </Button>
                </div>
              )}

              {activeResults?.rounds?.[selectedRound] && (
                <div className="space-y-4">
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4">
                      <div className="text-blue-400 font-mono font-bold text-sm mb-3">
                        {scenario.belligerents.side_a} ACTIONS
                      </div>
                      <ul className="space-y-2">
                        {activeResults.rounds[selectedRound].actions_side_a?.map((action, i) => (
                          <li key={i} className="text-slate-300 font-mono text-xs flex items-start gap-2">
                            <ChevronRight className="w-3 h-3 mt-0.5 text-blue-400" />
                            {action}
                          </li>
                        ))}
                      </ul>
                      <div className="mt-3 pt-3 border-t border-blue-500/20">
                        <div className="flex items-center justify-between">
                          <span className="text-slate-400 font-mono text-xs">Casualties:</span>
                          <span className="text-red-400 font-mono font-bold">
                            {formatNumber(activeResults.rounds[selectedRound].casualties_a)}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4">
                      <div className="text-red-400 font-mono font-bold text-sm mb-3">
                        {scenario.belligerents.side_b} ACTIONS
                      </div>
                      <ul className="space-y-2">
                        {activeResults.rounds[selectedRound].actions_side_b?.map((action, i) => (
                          <li key={i} className="text-slate-300 font-mono text-xs flex items-start gap-2">
                            <ChevronRight className="w-3 h-3 mt-0.5 text-red-400" />
                            {action}
                          </li>
                        ))}
                      </ul>
                      <div className="mt-3 pt-3 border-t border-red-500/20">
                        <div className="flex items-center justify-between">
                          <span className="text-slate-400 font-mono text-xs">Casualties:</span>
                          <span className="text-red-400 font-mono font-bold">
                            {formatNumber(activeResults.rounds[selectedRound].casualties_b)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="bg-slate-900/50 border border-sky-800/30 rounded-lg p-4 space-y-3">
                    <div>
                      <div className="text-slate-400 font-mono text-xs mb-1">TERRITORIAL CHANGES</div>
                      <p className="text-cyan-400 font-mono text-sm">{activeResults.rounds[selectedRound].territorial_changes}</p>
                    </div>
                    <div>
                      <div className="text-slate-400 font-mono text-xs mb-1">INTERNATIONAL RESPONSE</div>
                      <p className="text-slate-300 font-mono text-sm">{activeResults.rounds[selectedRound].international_response}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-slate-400 font-mono text-xs">MOMENTUM:</span>
                      <Badge className="bg-purple-500/20 text-purple-400 border-purple-500/30 font-mono">
                        {activeResults.rounds[selectedRound].momentum}
                      </Badge>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </TabsContent>

        {/* Branches Tab */}
        <TabsContent value="branches" className="space-y-4">
          {branches.length === 0 ? (
            <div className="bg-slate-900/50 border border-sky-800/30 rounded-lg p-8 text-center">
              <GitBranch className="w-12 h-12 text-slate-600 mx-auto mb-3" />
              <p className="text-slate-500 font-mono text-sm mb-4">No branches created yet</p>
              <p className="text-slate-600 font-mono text-xs">
                Go to Simulation tab, select a round, and create a "What-If" branch
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              <div 
                onClick={() => setActiveBranchId(null)}
                className={`bg-slate-900/50 border rounded-lg p-4 cursor-pointer transition-all ${
                  !activeBranchId 
                    ? 'border-cyan-500 shadow-lg shadow-cyan-500/20' 
                    : 'border-sky-800/30 hover:border-sky-600/50'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-cyan-500/20 border border-cyan-500/30">
                      <Swords className="w-4 h-4 text-cyan-400" />
                    </div>
                    <div>
                      <h4 className="text-cyan-400 font-mono font-bold">MAIN TIMELINE</h4>
                      <p className="text-slate-500 font-mono text-xs">Original simulation</p>
                    </div>
                  </div>
                  <Badge className="bg-cyan-500/20 text-cyan-400 border-cyan-500/30 font-mono">
                    {results?.final_outcome?.winner}
                  </Badge>
                </div>
              </div>

              {branches.map((branch) => (
                <div 
                  key={branch.id}
                  onClick={() => setActiveBranchId(branch.id)}
                  className={`bg-slate-900/50 border rounded-lg p-4 cursor-pointer transition-all ${
                    activeBranchId === branch.id 
                      ? 'border-purple-500 shadow-lg shadow-purple-500/20' 
                      : 'border-sky-800/30 hover:border-sky-600/50'
                  }`}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-purple-500/20 border border-purple-500/30">
                        <GitBranch className="w-4 h-4 text-purple-400" />
                      </div>
                      <div>
                        <h4 className="text-purple-400 font-mono font-bold">{branch.name}</h4>
                        <p className="text-slate-500 font-mono text-xs">
                          Branched from Round {branch.divergencePoint + 1}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge className="bg-purple-500/20 text-purple-400 border-purple-500/30 font-mono text-xs">
                        {branch.results?.final_outcome?.winner}
                      </Badge>
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteBranch(branch.id);
                        }}
                        className="h-6 w-6 text-red-400 hover:text-red-300 hover:bg-red-500/10"
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>

                  <div className="bg-purple-500/10 border border-purple-500/20 rounded p-2 mb-3">
                    <div className="text-xs text-purple-400 font-mono mb-1">DIVERGENCE:</div>
                    <p className="text-slate-400 font-mono text-xs">{branch.divergenceDescription}</p>
                  </div>

                  <div className="grid grid-cols-3 gap-2 text-center">
                    <div className="bg-slate-800/50 rounded p-2">
                      <div className="text-xs text-slate-500 font-mono">Side A</div>
                      <div className="text-sm font-bold text-blue-400 font-mono">
                        {formatNumber(branch.results?.final_outcome?.total_casualties_a)}
                      </div>
                    </div>
                    <div className="bg-slate-800/50 rounded p-2">
                      <div className="text-xs text-slate-500 font-mono">Side B</div>
                      <div className="text-sm font-bold text-red-400 font-mono">
                        {formatNumber(branch.results?.final_outcome?.total_casualties_b)}
                      </div>
                    </div>
                    <div className="bg-slate-800/50 rounded p-2">
                      <div className="text-xs text-slate-500 font-mono">Civilian</div>
                      <div className="text-sm font-bold text-orange-400 font-mono">
                        {formatNumber(branch.results?.final_outcome?.total_civilian_casualties)}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Branch Comparison Tab */}
        <TabsContent value="comparison" className="space-y-6">
          {/* Branch Selection */}
          <Card className="bg-slate-900/50 border border-sky-800/30 p-4">
            <h4 className="text-lg font-bold text-cyan-400 font-mono mb-4 flex items-center gap-2">
              <BarChart3 className="w-5 h-5" />
              SELECT BRANCHES TO COMPARE
            </h4>
            <div className="flex flex-wrap gap-2">
              <Button
                size="sm"
                onClick={() => toggleBranchComparison('main')}
                className={`font-mono text-xs ${
                  selectedBranchesForComparison.includes('main')
                    ? 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30'
                    : 'bg-slate-800/50 text-slate-400 border-slate-600/30'
                }`}
              >
                Main Timeline
              </Button>
              {branches.map(branch => (
                <Button
                  key={branch.id}
                  size="sm"
                  onClick={() => toggleBranchComparison(branch.id)}
                  className={`font-mono text-xs ${
                    selectedBranchesForComparison.includes(branch.id)
                      ? 'bg-purple-500/20 text-purple-400 border-purple-500/30'
                      : 'bg-slate-800/50 text-slate-400 border-slate-600/30'
                  }`}
                >
                  {branch.name}
                </Button>
              ))}
            </div>
          </Card>

          {comparisonData.length > 0 && (
            <>
              {/* Visual Branch Tree */}
              <Card className="bg-slate-900/50 border border-sky-800/30 p-4">
                <h4 className="text-lg font-bold text-purple-400 font-mono mb-4 flex items-center gap-2">
                  <GitBranch className="w-5 h-5" />
                  BRANCH DIVERGENCE VISUALIZATION
                </h4>
                <div className="relative">
                  {/* Main timeline */}
                  <div className="flex items-center mb-4">
                    <div className="flex-1 h-2 bg-cyan-500/30 rounded-full relative">
                      {[1, 2, 3, 4, 5].map(round => (
                        <div
                          key={round}
                          className="absolute w-4 h-4 bg-cyan-500 rounded-full border-2 border-slate-900 -top-1"
                          style={{ left: `${(round - 1) * 25}%` }}
                        >
                          <span className="absolute -bottom-6 left-1/2 -translate-x-1/2 text-[10px] text-cyan-400 font-mono whitespace-nowrap">
                            R{round}
                          </span>
                        </div>
                      ))}
                    </div>
                    <div className="ml-4 text-cyan-400 font-mono text-xs">MAIN</div>
                  </div>

                  {/* Branch lines */}
                  {branches.map((branch, idx) => (
                    <div key={branch.id} className="flex items-center mb-4 ml-8">
                      <div 
                        className="h-6 w-px bg-purple-500/50 absolute"
                        style={{ left: `${branch.divergencePoint * 25 + 2}%`, top: `${28 + idx * 40}px` }}
                      />
                      <div 
                        className="flex-1 h-2 bg-purple-500/30 rounded-full relative"
                        style={{ marginLeft: `${branch.divergencePoint * 25}%` }}
                      >
                        <div className="absolute w-3 h-3 bg-purple-500 rounded-full border-2 border-slate-900 -top-0.5 -left-1">
                          <AlertTriangle className="w-2 h-2 text-slate-900 absolute top-0.5 left-0.5" />
                        </div>
                      </div>
                      <div className="ml-4 text-purple-400 font-mono text-xs whitespace-nowrap">
                        {branch.name}
                      </div>
                    </div>
                  ))}
                </div>
              </Card>

              {/* Casualties Comparison Chart */}
              <Card className="bg-slate-900/50 border border-sky-800/30 p-4">
                <h4 className="text-lg font-bold text-red-400 font-mono mb-4 flex items-center gap-2">
                  <Skull className="w-5 h-5" />
                  CASUALTY COMPARISON
                </h4>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={comparisonData} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                      <XAxis type="number" stroke="#64748b" style={{ fontSize: '10px', fontFamily: 'monospace' }} />
                      <YAxis dataKey="name" type="category" stroke="#64748b" style={{ fontSize: '10px', fontFamily: 'monospace' }} width={100} />
                      <Tooltip 
                        contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #334155', fontFamily: 'monospace' }}
                        formatter={(value) => formatNumber(value)}
                      />
                      <Legend wrapperStyle={{ fontFamily: 'monospace', fontSize: '10px' }} />
                      <Bar dataKey="casualties_a" name="Side A" fill="#3b82f6" />
                      <Bar dataKey="casualties_b" name="Side B" fill="#ef4444" />
                      <Bar dataKey="civilian" name="Civilian" fill="#f97316" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </Card>

              {/* Outcome Probabilities Comparison */}
              <Card className="bg-slate-900/50 border border-sky-800/30 p-4">
                <h4 className="text-lg font-bold text-green-400 font-mono mb-4 flex items-center gap-2">
                  <TrendingUp className="w-5 h-5" />
                  OUTCOME PROBABILITIES
                </h4>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={comparisonData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                      <XAxis dataKey="name" stroke="#64748b" style={{ fontSize: '10px', fontFamily: 'monospace' }} />
                      <YAxis stroke="#64748b" style={{ fontSize: '10px', fontFamily: 'monospace' }} domain={[0, 100]} />
                      <Tooltip 
                        contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #334155', fontFamily: 'monospace' }}
                        formatter={(value) => `${value}%`}
                      />
                      <Legend wrapperStyle={{ fontFamily: 'monospace', fontSize: '10px' }} />
                      <Bar dataKey="victory_a" name="Victory A" fill="#3b82f6" />
                      <Bar dataKey="victory_b" name="Victory B" fill="#ef4444" />
                      <Bar dataKey="stalemate" name="Stalemate" fill="#eab308" />
                      <Bar dataKey="peace" name="Negotiated Peace" fill="#22c55e" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </Card>

              {/* Timeline Casualties Comparison */}
              {timelineData.length > 0 && (
                <Card className="bg-slate-900/50 border border-sky-800/30 p-4">
                  <h4 className="text-lg font-bold text-yellow-400 font-mono mb-4 flex items-center gap-2">
                    <TrendingDown className="w-5 h-5" />
                    CASUALTY PROGRESSION BY ROUND
                  </h4>
                  <div className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={timelineData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                        <XAxis dataKey="round" stroke="#64748b" style={{ fontSize: '10px', fontFamily: 'monospace' }} />
                        <YAxis stroke="#64748b" style={{ fontSize: '10px', fontFamily: 'monospace' }} />
                        <Tooltip 
                          contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #334155', fontFamily: 'monospace' }}
                          formatter={(value) => formatNumber(value)}
                        />
                        <Legend wrapperStyle={{ fontFamily: 'monospace', fontSize: '10px' }} />
                        {selectedBranchesForComparison.includes('main') && (
                          <Line type="monotone" dataKey="Main_casualties" name="Main Timeline" stroke="#06b6d4" strokeWidth={2} dot />
                        )}
                        {branches.filter(b => selectedBranchesForComparison.includes(b.id)).map((branch, idx) => (
                          <Line 
                            key={branch.id}
                            type="monotone" 
                            dataKey={`${branch.name}_casualties`} 
                            name={branch.name} 
                            stroke={['#a855f7', '#ec4899', '#f97316', '#84cc16'][idx % 4]}
                            strokeWidth={2}
                            dot
                          />
                        ))}
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </Card>
              )}

              {/* Summary Comparison Table */}
              <Card className="bg-slate-900/50 border border-sky-800/30 p-4">
                <h4 className="text-lg font-bold text-cyan-400 font-mono mb-4 flex items-center gap-2">
                  <Eye className="w-5 h-5" />
                  COMPARISON SUMMARY TABLE
                </h4>
                <div className="overflow-x-auto">
                  <table className="w-full text-xs font-mono">
                    <thead>
                      <tr className="border-b border-slate-700">
                        <th className="text-left text-slate-400 py-2 px-2">Scenario</th>
                        <th className="text-left text-slate-400 py-2 px-2">Divergence</th>
                        <th className="text-center text-slate-400 py-2 px-2">Outcome</th>
                        <th className="text-center text-blue-400 py-2 px-2">Side A Cas.</th>
                        <th className="text-center text-red-400 py-2 px-2">Side B Cas.</th>
                        <th className="text-center text-orange-400 py-2 px-2">Civilian</th>
                        <th className="text-center text-slate-400 py-2 px-2">Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {comparisonData.map((row, idx) => (
                        <tr key={row.id} className="border-b border-slate-800">
                          <td className={`py-2 px-2 ${row.id === 'main' ? 'text-cyan-400' : 'text-purple-400'}`}>
                            {row.name}
                          </td>
                          <td className="text-slate-500 py-2 px-2 max-w-[200px] truncate">
                            {row.divergence}
                          </td>
                          <td className="text-center text-green-400 py-2 px-2">{row.outcome}</td>
                          <td className="text-center text-blue-400 py-2 px-2">{formatNumber(row.casualties_a)}</td>
                          <td className="text-center text-red-400 py-2 px-2">{formatNumber(row.casualties_b)}</td>
                          <td className="text-center text-orange-400 py-2 px-2">{formatNumber(row.civilian)}</td>
                          <td className="text-center text-yellow-400 py-2 px-2 font-bold">
                            {formatNumber(row.casualties_a + row.casualties_b + row.civilian)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Card>
            </>
          )}

          {comparisonData.length === 0 && (
            <div className="bg-slate-900/50 border border-sky-800/30 rounded-lg p-8 text-center">
              <BarChart3 className="w-12 h-12 text-slate-600 mx-auto mb-3" />
              <p className="text-slate-500 font-mono text-sm">Select branches above to compare</p>
            </div>
          )}
        </TabsContent>

        {/* Analysis Tab */}
        <TabsContent value="analysis" className="space-y-4">
          {activeResults?.final_outcome && (
            <>
              <div className="bg-slate-900/50 border border-sky-800/30 rounded-lg p-4">
                <div className="text-center mb-4">
                  <div className="text-slate-400 font-mono text-xs mb-2">FINAL OUTCOME</div>
                  <div className="text-2xl font-bold text-green-400 font-mono">{activeResults.final_outcome.winner}</div>
                  <Badge className="bg-purple-500/20 text-purple-400 border-purple-500/30 font-mono mt-2">
                    {activeResults.final_outcome.outcome_type}
                  </Badge>
                </div>

                <div className="grid grid-cols-3 gap-4 mt-6">
                  <div className="text-center">
                    <Skull className="w-6 h-6 text-blue-400 mx-auto mb-2" />
                    <div className="text-xl font-bold text-blue-400 font-mono">
                      {formatNumber(activeResults.final_outcome.total_casualties_a)}
                    </div>
                    <div className="text-xs text-slate-400 font-mono">Side A Casualties</div>
                  </div>
                  <div className="text-center">
                    <Users className="w-6 h-6 text-orange-400 mx-auto mb-2" />
                    <div className="text-xl font-bold text-orange-400 font-mono">
                      {formatNumber(activeResults.final_outcome.total_civilian_casualties)}
                    </div>
                    <div className="text-xs text-slate-400 font-mono">Civilian Casualties</div>
                  </div>
                  <div className="text-center">
                    <Skull className="w-6 h-6 text-red-400 mx-auto mb-2" />
                    <div className="text-xl font-bold text-red-400 font-mono">
                      {formatNumber(activeResults.final_outcome.total_casualties_b)}
                    </div>
                    <div className="text-xs text-slate-400 font-mono">Side B Casualties</div>
                  </div>
                </div>
              </div>

              <div className="bg-slate-900/50 border border-sky-800/30 rounded-lg p-4">
                <div className="text-sky-400 font-mono font-bold text-sm mb-4">OUTCOME PROBABILITIES</div>
                <div className="space-y-3">
                  {[
                    { label: 'Victory Side A', value: activeResults.final_outcome.probability_victory_a, color: 'blue' },
                    { label: 'Victory Side B', value: activeResults.final_outcome.probability_victory_b, color: 'red' },
                    { label: 'Stalemate', value: activeResults.final_outcome.probability_stalemate, color: 'yellow' },
                    { label: 'Negotiated Peace', value: activeResults.final_outcome.probability_negotiated_peace, color: 'green' }
                  ].map((item, idx) => (
                    <div key={idx}>
                      <div className="flex justify-between text-xs font-mono mb-1">
                        <span className="text-slate-400">{item.label}</span>
                        <span className={`text-${item.color}-400`}>{item.value}%</span>
                      </div>
                      <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                        <div 
                          className={`h-full bg-${item.color}-500 rounded-full transition-all`}
                          style={{ width: `${item.value}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-sky-500/10 border border-sky-500/30 rounded-lg p-4">
                <div className="text-sky-400 font-mono font-bold text-sm mb-3">LESSONS LEARNED</div>
                <ul className="space-y-2">
                  {activeResults.lessons_learned?.map((lesson, idx) => (
                    <li key={idx} className="text-slate-300 font-mono text-xs flex items-start gap-2">
                      <ChevronRight className="w-3 h-3 mt-0.5 text-sky-400" />
                      {lesson}
                    </li>
                  ))}
                </ul>
              </div>
            </>
          )}
        </TabsContent>
      </Tabs>
    </Card>
  );
}