import React, { useState } from 'react';
import { base44 } from '../../api/base44Client';
import { useMutation } from '@tanstack/react-query';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Textarea } from '../ui/textarea';
import { Badge } from '../ui/badge';
import { Sparkles, Loader2, BookOpen } from 'lucide-react';

export default function FictionalWarGenerator({ onScenarioGenerated }) {
  const [prompt, setPrompt] = useState('');

  const generateScenarioMutation = useMutation({
    mutationFn: async (userPrompt) => {
      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `Generate a detailed fictional historical war scenario based on this prompt: "${userPrompt}"

Create a compelling, realistic alternative history war scenario with:
1. Unique narrative and historical context
2. Believable nations/factions with distinct characteristics
3. Clear causes and motivations
4. Strategic challenges and dilemmas
5. Key historical figures (fictional or reimagined)
6. Technological and tactical considerations
7. Multiple potential outcomes
8. Moral and ethical dimensions

Make it engaging, historically plausible (even if fictional), and strategically interesting.`,
        response_json_schema: {
          type: "object",
          properties: {
            title: { type: "string" },
            era: { type: "string" },
            year: { type: "string" },
            narrative: { type: "string" },
            historical_context: { type: "string" },
            factions: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  name: { type: "string" },
                  description: { type: "string" },
                  leader: { type: "string" },
                  strengths: { type: "array", items: { type: "string" } },
                  weaknesses: { type: "array", items: { type: "string" } },
                  motivations: { type: "string" },
                  military_strength: { type: "number" }
                }
              }
            },
            causes: { type: "array", items: { type: "string" } },
            key_events: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  event: { type: "string" },
                  date: { type: "string" },
                  significance: { type: "string" }
                }
              }
            },
            strategic_challenges: { type: "array", items: { type: "string" } },
            technology_level: { type: "string" },
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
            moral_dimensions: { type: "array", items: { type: "string" } }
          }
        }
      });

      return result;
    },
    onSuccess: (data) => {
      if (onScenarioGenerated) onScenarioGenerated(data);
    }
  });

  const quickPrompts = [
    "Victorian-era steam-powered colonial war",
    "1960s alternate Cold War turning hot",
    "Medieval crusade with advanced siege technology",
    "Ancient Rome vs advanced Carthaginian navy",
    "1920s global economic war with military intervention"
  ];

  return (
    <Card className="bg-slate-950/80 backdrop-blur-xl cyber-border p-6">
      <div className="flex items-center gap-3 mb-6">
        <Sparkles className="w-8 h-8 text-purple-400" />
        <div>
          <h3 className="text-2xl font-bold text-purple-400 glow-text font-mono">
            FICTIONAL WAR GENERATOR
          </h3>
          <p className="text-slate-400 font-mono text-sm">
            Create unique alternative history war scenarios
          </p>
        </div>
      </div>

      <div className="space-y-4">
        <div className="space-y-2">
          <label className="text-sm font-bold text-cyan-400 font-mono">
            Scenario Prompt
          </label>
          <Textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="e.g., A steampunk war between airship empires in 1880s Asia..."
            className="bg-slate-900/50 border-cyan-500/30 text-cyan-400 font-mono min-h-[100px]"
          />
        </div>

        <div className="space-y-2">
          <label className="text-xs text-slate-500 font-mono">Quick Prompts:</label>
          <div className="flex flex-wrap gap-2">
            {quickPrompts.map((qp, idx) => (
              <Button
                key={idx}
                onClick={() => setPrompt(qp)}
                variant="outline"
                className="border-purple-500/30 text-purple-400 hover:bg-purple-500/10 font-mono text-xs"
              >
                {qp}
              </Button>
            ))}
          </div>
        </div>

        <Button
          onClick={() => generateScenarioMutation.mutate(prompt)}
          disabled={generateScenarioMutation.isPending || !prompt.trim()}
          className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-mono py-6"
        >
          {generateScenarioMutation.isPending ? (
            <>
              <Loader2 className="w-5 h-5 mr-2 animate-spin" />
              GENERATING SCENARIO...
            </>
          ) : (
            <>
              <Sparkles className="w-5 h-5 mr-2" />
              GENERATE FICTIONAL WAR
            </>
          )}
        </Button>

        {generateScenarioMutation.data && (
          <div className="space-y-4 mt-6 animate-in fade-in duration-500">
            <Card className="bg-gradient-to-br from-purple-950/50 to-pink-950/50 cyber-border p-6">
              <div className="flex items-center gap-3 mb-3">
                <BookOpen className="w-6 h-6 text-purple-400" />
                <h4 className="text-2xl font-bold text-purple-400 font-mono">
                  {generateScenarioMutation.data.title}
                </h4>
              </div>
              <div className="flex gap-2 mb-4">
                <Badge className="bg-cyan-500/20 text-cyan-400 border-cyan-500/30 font-mono">
                  {generateScenarioMutation.data.era}
                </Badge>
                <Badge className="bg-purple-500/20 text-purple-400 border-purple-500/30 font-mono">
                  {generateScenarioMutation.data.year}
                </Badge>
              </div>
              <p className="text-slate-300 font-mono text-sm leading-relaxed mb-4">
                {generateScenarioMutation.data.narrative}
              </p>
              <div className="p-4 bg-slate-900/50 cyber-border rounded">
                <h5 className="text-sm font-bold text-yellow-400 font-mono mb-2">HISTORICAL CONTEXT</h5>
                <p className="text-slate-400 font-mono text-xs">
                  {generateScenarioMutation.data.historical_context}
                </p>
              </div>
            </Card>

            {generateScenarioMutation.data.factions?.length > 0 && (
              <Card className="bg-slate-950/80 cyber-border p-6">
                <h4 className="text-xl font-bold text-green-400 font-mono mb-4">FACTIONS</h4>
                <div className="grid md:grid-cols-2 gap-4">
                  {generateScenarioMutation.data.factions.map((faction, idx) => (
                    <div key={idx} className="bg-slate-900/50 cyber-border rounded p-4">
                      <h5 className="text-lg font-bold text-cyan-400 font-mono mb-1">{faction.name}</h5>
                      <p className="text-xs text-purple-400 font-mono mb-2">Led by {faction.leader}</p>
                      <p className="text-slate-400 font-mono text-xs mb-3">{faction.description}</p>
                      <div className="text-xs font-mono text-slate-500 mb-2">
                        Military Strength: <span className="text-orange-400 font-bold">{faction.military_strength}/100</span>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            )}
          </div>
        )}
      </div>
    </Card>
  );
}