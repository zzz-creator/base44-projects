import React, { useState } from 'react';
import { base44 } from '../../api/base44Client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { Badge } from '../ui/badge';
import { Sparkles, Loader2, Save, Zap } from 'lucide-react';
import { toast } from 'sonner';

export default function AIScenarioGenerator() {
  const [scenarioPrompt, setScenarioPrompt] = useState('');
  const [generatedScenario, setGeneratedScenario] = useState(null);
  const queryClient = useQueryClient();

  const generateScenarioMutation = useMutation({
    mutationFn: async (prompt) => {
      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `You are a military strategist and scenario planner. Generate a realistic or hypothetical war scenario based on the following input:

"${prompt}"

Create a comprehensive scenario including:
1. Scenario title and time period
2. Detailed description of the situation
3. Key factions/nations involved with their objectives
4. Starting conditions (military, economic, political)
5. Initial spark/trigger event
6. Strategic challenges and constraints
7. Potential outcomes and win conditions
8. Key resources and contested territories

Be detailed, realistic, and consider geopolitical, economic, and military factors.`,
        response_json_schema: {
          type: "object",
          properties: {
            scenario_title: { type: "string" },
            time_period: { type: "string" },
            description: { type: "string" },
            trigger_event: { type: "string" },
            factions: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  name: { type: "string" },
                  type: { type: "string" },
                  objectives: { type: "array", items: { type: "string" } },
                  military_strength: { type: "number" },
                  economic_power: { type: "number" },
                  initial_position: { type: "string" }
                }
              }
            },
            starting_conditions: {
              type: "object",
              properties: {
                military_balance: { type: "string" },
                economic_situation: { type: "string" },
                political_climate: { type: "string" },
                international_relations: { type: "string" }
              }
            },
            strategic_challenges: { type: "array", items: { type: "string" } },
            contested_resources: { type: "array", items: { type: "string" } },
            key_territories: { type: "array", items: { type: "string" } },
            potential_outcomes: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  outcome: { type: "string" },
                  probability: { type: "number" },
                  consequences: { type: "string" }
                }
              }
            },
            win_conditions: { type: "array", items: { type: "string" } },
            complexity_level: { type: "string" }
          }
        },
        add_context_from_internet: true
      });

      setGeneratedScenario(result);
      return result;
    }
  });

  const saveScenarioMutation = useMutation({
    mutationFn: async (scenario) => {
      // Create a war entry based on the scenario
      const warData = {
        name: scenario.scenario_title,
        status: 'predicted',
        era: 'near_future',
        type: 'territorial',
        description: scenario.description,
        countries_involved: scenario.factions?.map(f => f.name) || [],
        probability: scenario.potential_outcomes?.[0]?.probability || 50
      };

      await base44.entities.War.create(warData);
      return warData;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['wars']);
      toast.success('Scenario saved to database');
    },
    onError: () => {
      toast.error('Failed to save scenario');
    }
  });

  return (
    <Card className="bg-slate-950/80 backdrop-blur-xl cyber-border p-6">
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <Sparkles className="w-8 h-8 text-purple-400" />
          <div>
            <h2 className="text-2xl font-bold text-purple-400 glow-text font-mono">
              AI SCENARIO GENERATOR
            </h2>
            <p className="text-slate-400 font-mono text-sm">
              Generate realistic war scenarios using AI
            </p>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <Label className="text-slate-300 font-mono mb-2 block">
              Scenario Description
            </Label>
            <Textarea
              value={scenarioPrompt}
              onChange={(e) => setScenarioPrompt(e.target.value)}
              placeholder="e.g., A resource conflict over rare earth minerals in the Arctic between major powers..."
              className="min-h-[120px] bg-slate-900/50 border-purple-500/30 text-slate-200 font-mono"
            />
          </div>

          <Button
            onClick={() => generateScenarioMutation.mutate(scenarioPrompt)}
            disabled={!scenarioPrompt.trim() || generateScenarioMutation.isPending}
            className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-mono py-6"
          >
            {generateScenarioMutation.isPending ? (
              <>
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                GENERATING SCENARIO...
              </>
            ) : (
              <>
                <Zap className="w-5 h-5 mr-2" />
                GENERATE SCENARIO
              </>
            )}
          </Button>
        </div>

        {generatedScenario && (
          <div className="space-y-6 animate-in fade-in duration-500">
            <div className="border-t border-purple-500/30 pt-6">
              <div className="mb-4">
                <h3 className="text-2xl font-bold text-yellow-400 glow-text font-mono mb-2">
                  {generatedScenario.scenario_title}
                </h3>
                <Badge className="bg-cyan-500/20 text-cyan-400 border-cyan-500/30 font-mono">
                  {generatedScenario.time_period}
                </Badge>
              </div>

              <div className="bg-slate-900/50 cyber-border rounded-lg p-4 mb-4">
                <p className="text-slate-300 font-mono text-sm leading-relaxed">
                  {generatedScenario.description}
                </p>
              </div>

              {generatedScenario.trigger_event && (
                <div className="bg-red-950/20 cyber-border rounded-lg p-4 mb-4">
                  <h4 className="text-sm font-bold text-red-400 font-mono mb-2">TRIGGER EVENT</h4>
                  <p className="text-slate-300 font-mono text-sm">{generatedScenario.trigger_event}</p>
                </div>
              )}

              {generatedScenario.factions?.length > 0 && (
                <div className="space-y-3 mb-4">
                  <h4 className="text-lg font-bold text-green-400 glow-text font-mono">KEY FACTIONS</h4>
                  {generatedScenario.factions.map((faction, idx) => (
                    <div key={idx} className="bg-slate-900/50 cyber-border rounded-lg p-4">
                      <div className="flex items-start justify-between mb-2">
                        <h5 className="text-md font-bold text-cyan-400 font-mono">{faction.name}</h5>
                        <Badge variant="outline" className="border-cyan-500/30 text-cyan-400 font-mono text-xs">
                          {faction.type}
                        </Badge>
                      </div>
                      <p className="text-slate-400 font-mono text-sm mb-2">{faction.initial_position}</p>
                      
                      <div className="grid grid-cols-2 gap-3 mb-3">
                        <div className="p-2 bg-blue-950/20 cyber-border rounded">
                          <div className="text-xs text-slate-500 font-mono">Military</div>
                          <div className="text-lg font-bold text-blue-400 font-mono">{faction.military_strength}/100</div>
                        </div>
                        <div className="p-2 bg-green-950/20 cyber-border rounded">
                          <div className="text-xs text-slate-500 font-mono">Economic</div>
                          <div className="text-lg font-bold text-green-400 font-mono">{faction.economic_power}/100</div>
                        </div>
                      </div>

                      <div>
                        <div className="text-xs text-slate-500 font-mono mb-1">Objectives:</div>
                        <ul className="space-y-1">
                          {faction.objectives?.map((obj, i) => (
                            <li key={i} className="text-slate-300 font-mono text-xs flex items-start gap-2">
                              <span className="text-green-400">•</span>
                              {obj}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {generatedScenario.starting_conditions && (
                <div className="bg-slate-900/50 cyber-border rounded-lg p-4 mb-4">
                  <h4 className="text-lg font-bold text-orange-400 glow-text font-mono mb-3">STARTING CONDITIONS</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-slate-400 font-mono">Military Balance:</span>
                      <span className="text-slate-200 font-mono">{generatedScenario.starting_conditions.military_balance}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400 font-mono">Economic Situation:</span>
                      <span className="text-slate-200 font-mono">{generatedScenario.starting_conditions.economic_situation}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400 font-mono">Political Climate:</span>
                      <span className="text-slate-200 font-mono">{generatedScenario.starting_conditions.political_climate}</span>
                    </div>
                  </div>
                </div>
              )}

              {generatedScenario.potential_outcomes?.length > 0 && (
                <div className="bg-slate-900/50 cyber-border rounded-lg p-4 mb-4">
                  <h4 className="text-lg font-bold text-purple-400 glow-text font-mono mb-3">POTENTIAL OUTCOMES</h4>
                  <div className="space-y-3">
                    {generatedScenario.potential_outcomes.map((outcome, idx) => (
                      <div key={idx} className="border-l-4 border-purple-500/50 pl-3">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-slate-200 font-mono text-sm font-bold">{outcome.outcome}</span>
                          <Badge className="bg-purple-500/20 text-purple-400 border-purple-500/30 font-mono text-xs">
                            {outcome.probability}%
                          </Badge>
                        </div>
                        <p className="text-slate-400 font-mono text-xs">{outcome.consequences}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <Button
                onClick={() => saveScenarioMutation.mutate(generatedScenario)}
                disabled={saveScenarioMutation.isPending}
                className="w-full bg-gradient-to-r from-green-500 to-cyan-500 hover:from-green-600 hover:to-cyan-600 text-white font-mono py-4"
              >
                {saveScenarioMutation.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    SAVING...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    SAVE TO DATABASE
                  </>
                )}
              </Button>
            </div>
          </div>
        )}
      </div>
    </Card>
  );
}