import React, { useState } from 'react';
import { base44 } from '../../api/base44Client';
import { useMutation } from '@tanstack/react-query';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Textarea } from '../ui/textarea';
import { Badge } from '../ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { 
  History, Loader2, Play, GitBranch, Clock, Users, 
  MapPin, Sword, Scale, ChevronRight, RotateCcw
} from 'lucide-react';

export default function HistoricalSimulator() {
  const [scenario, setScenario] = useState({
    event: '',
    year: '',
    region: '',
    actors: '',
    whatIf: ''
  });
  const [simulation, setSimulation] = useState(null);
  const [selectedBranch, setSelectedBranch] = useState(null);

  const historicalEvents = [
    { value: 'wwi_start', label: 'WWI - Assassination of Archduke Franz Ferdinand (1914)' },
    { value: 'wwii_munich', label: 'WWII - Munich Agreement (1938)' },
    { value: 'cuban_missile', label: 'Cuban Missile Crisis (1962)' },
    { value: 'berlin_wall', label: 'Fall of Berlin Wall (1989)' },
    { value: 'gulf_war', label: 'Gulf War - Iraqi Invasion of Kuwait (1990)' },
    { value: 'custom', label: 'Custom Historical Event' }
  ];

  const simulateMutation = useMutation({
    mutationFn: async () => {
      const response = await base44.integrations.Core.InvokeLLM({
        prompt: `You are a historical analyst and alternative history expert. Simulate an alternative history based on the following scenario:

Historical Event: ${scenario.event}
Year: ${scenario.year}
Region: ${scenario.region}
Key Actors: ${scenario.actors}
What-If Scenario: ${scenario.whatIf}

Provide a detailed alternative history simulation including:
1. The divergence point - what changed and why
2. Immediate consequences (first 1-5 years)
3. Medium-term effects (5-20 years)
4. Long-term implications (20+ years)
5. 3 possible branching outcomes with probability percentages
6. Key figures who would have risen/fallen in this timeline
7. Economic and social changes
8. How this would affect the modern world

Be historically accurate in your analysis and provide plausible alternative outcomes.`,
        response_json_schema: {
          type: 'object',
          properties: {
            divergence_point: {
              type: 'object',
              properties: {
                description: { type: 'string' },
                date: { type: 'string' },
                key_change: { type: 'string' }
              }
            },
            timeline: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  period: { type: 'string' },
                  events: { type: 'array', items: { type: 'string' } },
                  consequences: { type: 'string' }
                }
              }
            },
            branching_outcomes: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  name: { type: 'string' },
                  probability: { type: 'number' },
                  description: { type: 'string' },
                  modern_world_impact: { type: 'string' }
                }
              }
            },
            key_figures: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  name: { type: 'string' },
                  original_fate: { type: 'string' },
                  alternate_fate: { type: 'string' }
                }
              }
            },
            economic_changes: { type: 'string' },
            social_changes: { type: 'string' },
            modern_implications: { type: 'string' }
          }
        },
        add_context_from_internet: true
      });
      return response;
    },
    onSuccess: (data) => {
      setSimulation(data);
    }
  });

  const handlePresetEvent = (value) => {
    if (value === 'custom') {
      setScenario({ event: '', year: '', region: '', actors: '', whatIf: '' });
      return;
    }
    
    const presets = {
      'wwi_start': {
        event: 'Assassination of Archduke Franz Ferdinand',
        year: '1914',
        region: 'Europe - Balkans',
        actors: 'Austria-Hungary, Serbia, Germany, Russia, France, Britain',
        whatIf: 'What if the assassination attempt failed?'
      },
      'wwii_munich': {
        event: 'Munich Agreement',
        year: '1938',
        region: 'Europe - Czechoslovakia',
        actors: 'Nazi Germany, Britain, France, Italy, Czechoslovakia',
        whatIf: 'What if Britain and France refused to appease Hitler?'
      },
      'cuban_missile': {
        event: 'Cuban Missile Crisis',
        year: '1962',
        region: 'Caribbean - Cuba',
        actors: 'United States, Soviet Union, Cuba',
        whatIf: 'What if the US had invaded Cuba?'
      },
      'berlin_wall': {
        event: 'Fall of Berlin Wall',
        year: '1989',
        region: 'Europe - Germany',
        actors: 'East Germany, West Germany, Soviet Union, NATO',
        whatIf: 'What if the wall never fell?'
      },
      'gulf_war': {
        event: 'Iraqi Invasion of Kuwait',
        year: '1990',
        region: 'Middle East - Persian Gulf',
        actors: 'Iraq, Kuwait, United States, Saudi Arabia, Coalition Forces',
        whatIf: 'What if Saddam Hussein withdrew before the coalition attack?'
      }
    };
    
    setScenario(presets[value] || { event: '', year: '', region: '', actors: '', whatIf: '' });
  };

  return (
    <Card className="bg-slate-950/80 backdrop-blur-xl cyber-border p-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 rounded-lg bg-blue-500/20 border border-blue-500/30">
          <History className="w-6 h-6 text-blue-400" />
        </div>
        <div>
          <h3 className="text-xl font-bold text-blue-400 glow-text font-mono">
            HISTORICAL SIMULATION MODULE
          </h3>
          <p className="text-xs text-slate-400 font-mono">Alternative History Analysis Engine</p>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Input Section */}
        <div className="space-y-4">
          <div>
            <label className="text-cyan-400 font-mono text-sm mb-2 block">PRESET SCENARIOS</label>
            <Select onValueChange={handlePresetEvent}>
              <SelectTrigger className="bg-slate-900/50 border-slate-600/30 text-slate-200 font-mono">
                <SelectValue placeholder="Select a historical event..." />
              </SelectTrigger>
              <SelectContent>
                {historicalEvents.map(event => (
                  <SelectItem key={event.value} value={event.value}>{event.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-slate-400 font-mono text-xs mb-1 block">YEAR</label>
              <Input
                value={scenario.year}
                onChange={(e) => setScenario({ ...scenario, year: e.target.value })}
                placeholder="e.g., 1914"
                className="bg-slate-900/50 border-slate-600/30 text-slate-200 font-mono"
              />
            </div>
            <div>
              <label className="text-slate-400 font-mono text-xs mb-1 block">REGION</label>
              <Input
                value={scenario.region}
                onChange={(e) => setScenario({ ...scenario, region: e.target.value })}
                placeholder="e.g., Europe"
                className="bg-slate-900/50 border-slate-600/30 text-slate-200 font-mono"
              />
            </div>
          </div>

          <div>
            <label className="text-slate-400 font-mono text-xs mb-1 block">HISTORICAL EVENT</label>
            <Input
              value={scenario.event}
              onChange={(e) => setScenario({ ...scenario, event: e.target.value })}
              placeholder="Describe the historical event..."
              className="bg-slate-900/50 border-slate-600/30 text-slate-200 font-mono"
            />
          </div>

          <div>
            <label className="text-slate-400 font-mono text-xs mb-1 block">KEY ACTORS</label>
            <Input
              value={scenario.actors}
              onChange={(e) => setScenario({ ...scenario, actors: e.target.value })}
              placeholder="Countries, leaders, organizations..."
              className="bg-slate-900/50 border-slate-600/30 text-slate-200 font-mono"
            />
          </div>

          <div>
            <label className="text-slate-400 font-mono text-xs mb-1 block">WHAT-IF SCENARIO</label>
            <Textarea
              value={scenario.whatIf}
              onChange={(e) => setScenario({ ...scenario, whatIf: e.target.value })}
              placeholder="What if... (describe the alternative scenario)"
              className="bg-slate-900/50 border-slate-600/30 text-slate-200 font-mono h-24"
            />
          </div>

          <Button
            onClick={() => simulateMutation.mutate()}
            disabled={simulateMutation.isPending || !scenario.whatIf}
            className="w-full bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white font-mono"
          >
            {simulateMutation.isPending ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                SIMULATING TIMELINE...
              </>
            ) : (
              <>
                <Play className="w-4 h-4 mr-2" />
                RUN SIMULATION
              </>
            )}
          </Button>
        </div>

        {/* Results Section */}
        <div className="space-y-4">
          {simulation ? (
            <>
              {/* Divergence Point */}
              <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <GitBranch className="w-5 h-5 text-red-400" />
                  <h4 className="text-red-400 font-mono font-bold text-sm">DIVERGENCE POINT</h4>
                </div>
                <p className="text-slate-300 font-mono text-sm">{simulation.divergence_point?.description}</p>
                <div className="mt-2 flex items-center gap-2">
                  <Badge className="bg-red-500/20 text-red-400 border-red-500/30 font-mono text-xs">
                    {simulation.divergence_point?.date}
                  </Badge>
                </div>
              </div>

              {/* Timeline */}
              <div className="bg-slate-900/50 cyber-border rounded-lg p-4">
                <div className="flex items-center gap-2 mb-3">
                  <Clock className="w-5 h-5 text-cyan-400" />
                  <h4 className="text-cyan-400 font-mono font-bold text-sm">ALTERNATE TIMELINE</h4>
                </div>
                <div className="space-y-4">
                  {simulation.timeline?.map((period, idx) => (
                    <div key={idx} className="border-l-2 border-cyan-500/30 pl-4">
                      <div className="text-cyan-400 font-mono font-bold text-xs mb-1">{period.period}</div>
                      <ul className="space-y-1">
                        {period.events?.map((event, i) => (
                          <li key={i} className="text-slate-400 font-mono text-xs flex items-start gap-2">
                            <ChevronRight className="w-3 h-3 mt-0.5 text-cyan-500" />
                            {event}
                          </li>
                        ))}
                      </ul>
                      <p className="text-slate-500 font-mono text-xs mt-2 italic">{period.consequences}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Branching Outcomes */}
              <div className="bg-slate-900/50 cyber-border rounded-lg p-4">
                <div className="flex items-center gap-2 mb-3">
                  <GitBranch className="w-5 h-5 text-purple-400" />
                  <h4 className="text-purple-400 font-mono font-bold text-sm">BRANCHING OUTCOMES</h4>
                </div>
                <div className="space-y-3">
                  {simulation.branching_outcomes?.map((branch, idx) => (
                    <div 
                      key={idx}
                      className={`p-3 rounded-lg cursor-pointer transition-all ${
                        selectedBranch === idx 
                          ? 'bg-purple-500/20 border border-purple-500/30' 
                          : 'bg-slate-800/30 hover:bg-slate-800/50'
                      }`}
                      onClick={() => setSelectedBranch(selectedBranch === idx ? null : idx)}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-green-400 font-mono font-bold text-sm">{branch.name}</span>
                        <Badge className="bg-purple-500/20 text-purple-400 border-purple-500/30 font-mono">
                          {branch.probability}% PROBABILITY
                        </Badge>
                      </div>
                      <p className="text-slate-400 font-mono text-xs">{branch.description}</p>
                      {selectedBranch === idx && (
                        <div className="mt-3 pt-3 border-t border-slate-700/30">
                          <div className="text-xs text-slate-500 font-mono mb-1">MODERN WORLD IMPACT:</div>
                          <p className="text-cyan-400/80 font-mono text-xs">{branch.modern_world_impact}</p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Key Figures */}
              {simulation.key_figures?.length > 0 && (
                <div className="bg-slate-900/50 cyber-border rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <Users className="w-5 h-5 text-yellow-400" />
                    <h4 className="text-yellow-400 font-mono font-bold text-sm">KEY FIGURES</h4>
                  </div>
                  <div className="space-y-2">
                    {simulation.key_figures?.map((figure, idx) => (
                      <div key={idx} className="flex items-center justify-between text-xs font-mono">
                        <span className="text-slate-300">{figure.name}</span>
                        <div className="flex items-center gap-2">
                          <span className="text-slate-500">{figure.original_fate}</span>
                          <ChevronRight className="w-3 h-3 text-cyan-500" />
                          <span className="text-cyan-400">{figure.alternate_fate}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Modern Implications */}
              <div className="bg-cyan-500/10 border border-cyan-500/30 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <MapPin className="w-5 h-5 text-cyan-400" />
                  <h4 className="text-cyan-400 font-mono font-bold text-sm">MODERN IMPLICATIONS</h4>
                </div>
                <p className="text-slate-300 font-mono text-sm">{simulation.modern_implications}</p>
              </div>
            </>
          ) : (
            <div className="h-full flex items-center justify-center">
              <div className="text-center">
                <History className="w-16 h-16 text-slate-600 mx-auto mb-4" />
                <p className="text-slate-500 font-mono text-sm">
                  Configure a historical scenario and run the simulation
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </Card>
  );
}