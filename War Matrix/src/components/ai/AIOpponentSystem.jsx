import React, { useState } from 'react';
import { base44 } from '../../api/base44Client';
import { useMutation } from '@tanstack/react-query';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Slider } from '../ui/slider';
import { Badge } from '../ui/badge';
import { Bot, Loader2, Zap, Target, Shield } from 'lucide-react';

export default function AIOpponentSystem({ onOpponentGenerated }) {
  const [opponentParams, setOpponentParams] = useState({
    name: '',
    aggression: 50,
    technological_focus: 50,
    diplomatic_approach: 50,
    economic_strategy: 50,
    military_doctrine: 'balanced'
  });

  const generateOpponentMutation = useMutation({
    mutationFn: async (params) => {
      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `Generate a detailed AI opponent for a war simulation with the following parameters:

Name: ${params.name || 'Unnamed Opponent'}
Aggression Level: ${params.aggression}/100
Technological Focus: ${params.technological_focus}/100
Diplomatic Approach: ${params.diplomatic_approach}/100 (0=hostile, 100=cooperative)
Economic Strategy: ${params.economic_strategy}/100 (0=isolationist, 100=free trade)
Military Doctrine: ${params.military_doctrine}

Create a comprehensive AI opponent profile that will dynamically adapt its strategy based on:
1. User actions and decisions
2. Resource availability
3. Battlefield conditions
4. Diplomatic relations
5. Economic factors

The AI should have clear strategic goals, decision-making patterns, and response protocols.`,
        response_json_schema: {
          type: "object",
          properties: {
            name: { type: "string" },
            description: { type: "string" },
            strategic_goals: { type: "array", items: { type: "string" } },
            strengths: { type: "array", items: { type: "string" } },
            weaknesses: { type: "array", items: { type: "string" } },
            decision_patterns: {
              type: "object",
              properties: {
                offensive_triggers: { type: "array", items: { type: "string" } },
                defensive_triggers: { type: "array", items: { type: "string" } },
                diplomatic_conditions: { type: "array", items: { type: "string" } },
                economic_priorities: { type: "array", items: { type: "string" } }
              }
            },
            adaptation_rules: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  condition: { type: "string" },
                  response: { type: "string" },
                  priority: { type: "string" }
                }
              }
            },
            starting_resources: {
              type: "object",
              properties: {
                military: { type: "number" },
                economic: { type: "number" },
                technological: { type: "number" },
                diplomatic: { type: "number" }
              }
            },
            personality_traits: { type: "array", items: { type: "string" } }
          }
        }
      });

      return result;
    },
    onSuccess: (data) => {
      if (onOpponentGenerated) onOpponentGenerated(data);
    }
  });

  return (
    <Card className="bg-slate-950/80 backdrop-blur-xl cyber-border p-6">
      <div className="flex items-center gap-3 mb-6">
        <Bot className="w-8 h-8 text-cyan-400" />
        <div>
          <h3 className="text-2xl font-bold text-cyan-400 glow-text font-mono">
            AI OPPONENT GENERATOR
          </h3>
          <p className="text-slate-400 font-mono text-sm">
            Create adaptive AI adversaries with custom parameters
          </p>
        </div>
      </div>

      <div className="space-y-6">
        <div className="space-y-2">
          <Label className="text-green-400 font-mono">Opponent Name</Label>
          <Input
            value={opponentParams.name}
            onChange={(e) => setOpponentParams({...opponentParams, name: e.target.value})}
            placeholder="e.g., Red Empire, Coalition Forces..."
            className="bg-slate-900/50 border-green-500/30 text-green-400 font-mono"
          />
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div>
              <Label className="text-cyan-400 font-mono mb-2 block">
                Aggression: {opponentParams.aggression}%
              </Label>
              <Slider
                value={[opponentParams.aggression]}
                onValueChange={(v) => setOpponentParams({...opponentParams, aggression: v[0]})}
                max={100}
                step={1}
                className="py-4"
              />
              <p className="text-xs text-slate-500 font-mono mt-1">
                {opponentParams.aggression < 30 ? 'Defensive' : opponentParams.aggression < 70 ? 'Balanced' : 'Aggressive'}
              </p>
            </div>

            <div>
              <Label className="text-purple-400 font-mono mb-2 block">
                Technological Focus: {opponentParams.technological_focus}%
              </Label>
              <Slider
                value={[opponentParams.technological_focus]}
                onValueChange={(v) => setOpponentParams({...opponentParams, technological_focus: v[0]})}
                max={100}
                step={1}
                className="py-4"
              />
              <p className="text-xs text-slate-500 font-mono mt-1">
                {opponentParams.technological_focus < 30 ? 'Traditional' : opponentParams.technological_focus < 70 ? 'Moderate' : 'Advanced'}
              </p>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <Label className="text-yellow-400 font-mono mb-2 block">
                Diplomatic Approach: {opponentParams.diplomatic_approach}%
              </Label>
              <Slider
                value={[opponentParams.diplomatic_approach]}
                onValueChange={(v) => setOpponentParams({...opponentParams, diplomatic_approach: v[0]})}
                max={100}
                step={1}
                className="py-4"
              />
              <p className="text-xs text-slate-500 font-mono mt-1">
                {opponentParams.diplomatic_approach < 30 ? 'Hostile' : opponentParams.diplomatic_approach < 70 ? 'Neutral' : 'Cooperative'}
              </p>
            </div>

            <div>
              <Label className="text-orange-400 font-mono mb-2 block">
                Economic Strategy: {opponentParams.economic_strategy}%
              </Label>
              <Slider
                value={[opponentParams.economic_strategy]}
                onValueChange={(v) => setOpponentParams({...opponentParams, economic_strategy: v[0]})}
                max={100}
                step={1}
                className="py-4"
              />
              <p className="text-xs text-slate-500 font-mono mt-1">
                {opponentParams.economic_strategy < 30 ? 'Isolationist' : opponentParams.economic_strategy < 70 ? 'Mixed' : 'Free Trade'}
              </p>
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <Label className="text-red-400 font-mono">Military Doctrine</Label>
          <div className="grid grid-cols-3 gap-2">
            {['offensive', 'balanced', 'defensive'].map((doctrine) => (
              <Button
                key={doctrine}
                onClick={() => setOpponentParams({...opponentParams, military_doctrine: doctrine})}
                variant={opponentParams.military_doctrine === doctrine ? 'default' : 'outline'}
                className={`font-mono ${
                  opponentParams.military_doctrine === doctrine
                    ? 'bg-red-500/20 text-red-400 border-red-500/50'
                    : 'border-slate-500/30'
                }`}
              >
                {doctrine.toUpperCase()}
              </Button>
            ))}
          </div>
        </div>

        <Button
          onClick={() => generateOpponentMutation.mutate(opponentParams)}
          disabled={generateOpponentMutation.isPending || !opponentParams.name}
          className="w-full bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white font-mono py-6"
        >
          {generateOpponentMutation.isPending ? (
            <>
              <Loader2 className="w-5 h-5 mr-2 animate-spin" />
              GENERATING AI OPPONENT...
            </>
          ) : (
            <>
              <Zap className="w-5 h-5 mr-2" />
              GENERATE OPPONENT
            </>
          )}
        </Button>

        {generateOpponentMutation.data && (
          <Card className="bg-gradient-to-br from-cyan-950/50 to-purple-950/50 cyber-border p-6 mt-6">
            <div className="flex items-center gap-3 mb-4">
              <Bot className="w-6 h-6 text-cyan-400" />
              <h4 className="text-xl font-bold text-cyan-400 font-mono">
                {generateOpponentMutation.data.name}
              </h4>
            </div>
            <p className="text-slate-300 font-mono text-sm mb-4">
              {generateOpponentMutation.data.description}
            </p>

            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <h5 className="text-sm font-bold text-green-400 font-mono">STRENGTHS</h5>
                <ul className="space-y-1">
                  {generateOpponentMutation.data.strengths?.map((s, i) => (
                    <li key={i} className="text-slate-400 font-mono text-xs">✓ {s}</li>
                  ))}
                </ul>
              </div>
              <div className="space-y-2">
                <h5 className="text-sm font-bold text-red-400 font-mono">WEAKNESSES</h5>
                <ul className="space-y-1">
                  {generateOpponentMutation.data.weaknesses?.map((w, i) => (
                    <li key={i} className="text-slate-400 font-mono text-xs">× {w}</li>
                  ))}
                </ul>
              </div>
            </div>
          </Card>
        )}
      </div>
    </Card>
  );
}