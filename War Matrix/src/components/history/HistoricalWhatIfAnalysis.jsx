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
  History, Loader2, GitBranch, Sparkles, ArrowRight, 
  Clock, Globe, Users, Swords, ChevronRight
} from 'lucide-react';
import { toast } from 'sonner';

export default function HistoricalWhatIfAnalysis({ selectedWar }) {
  const [divergencePoint, setDivergencePoint] = useState('');
  const [divergenceType, setDivergenceType] = useState('battle');
  const [customDivergence, setCustomDivergence] = useState('');
  const [analysisResult, setAnalysisResult] = useState(null);

  const divergenceTypes = [
    { id: 'battle', name: 'Battle Outcome', description: 'Change the result of a key battle' },
    { id: 'diplomatic', name: 'Diplomatic Decision', description: 'Alter a diplomatic choice or treaty' },
    { id: 'leadership', name: 'Leadership Change', description: 'Change a leader\'s decision or fate' },
    { id: 'technology', name: 'Technology', description: 'Alter technological availability' },
    { id: 'alliance', name: 'Alliance Shift', description: 'Change alliance structures' },
    { id: 'resource', name: 'Resource Availability', description: 'Modify resource access' }
  ];

  const analyzeWhatIfMutation = useMutation({
    mutationFn: async () => {
      const warContext = selectedWar ? `
Historical Conflict: ${selectedWar.name}
Period: ${selectedWar.start_date} - ${selectedWar.end_date || 'Ongoing'}
Belligerents: ${selectedWar.countries_involved?.join(', ')}
Actual Outcome: ${selectedWar.description}
` : '';

      const response = await base44.integrations.Core.InvokeLLM({
        prompt: `You are a counterfactual historian specializing in alternate history analysis. Analyze the following "What-If" scenario and project how history might have unfolded differently.

${warContext}

DIVERGENCE POINT: ${divergencePoint}
DIVERGENCE TYPE: ${divergenceType}
SPECIFIC CHANGE: ${customDivergence}

Provide a comprehensive alternate history analysis including:

1. IMMEDIATE CONSEQUENCES (Days to Weeks)
   - Direct military/political impact
   - Reaction of key actors
   - Chain of events triggered

2. SHORT-TERM EFFECTS (Months to 1 Year)
   - Strategic shifts
   - Alliance changes
   - Economic impacts

3. LONG-TERM DIVERGENCE (Years to Decades)
   - How would the war have ended differently?
   - Territorial changes
   - Political systems affected
   - Technology development paths

4. BUTTERFLY EFFECTS
   - What other historical events would be changed?
   - How would the modern world look different?

5. PROBABILITY ASSESSMENT
   - How likely was this alternate path?
   - What factors would have needed to align?

Be historically rigorous while exploring creative possibilities.`,
        response_json_schema: {
          type: 'object',
          properties: {
            scenario_title: { type: 'string' },
            divergence_summary: { type: 'string' },
            plausibility_score: { type: 'number' },
            immediate_consequences: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  event: { type: 'string' },
                  timeframe: { type: 'string' },
                  impact: { type: 'string' }
                }
              }
            },
            short_term_effects: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  category: { type: 'string' },
                  description: { type: 'string' },
                  affected_parties: { type: 'array', items: { type: 'string' } }
                }
              }
            },
            long_term_divergence: {
              type: 'object',
              properties: {
                alternate_war_outcome: { type: 'string' },
                territorial_changes: { type: 'array', items: { type: 'string' } },
                political_shifts: { type: 'array', items: { type: 'string' } },
                technology_paths: { type: 'array', items: { type: 'string' } }
              }
            },
            butterfly_effects: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  original_event: { type: 'string' },
                  altered_outcome: { type: 'string' },
                  significance: { type: 'string' }
                }
              }
            },
            modern_world_differences: { type: 'array', items: { type: 'string' } },
            key_factors_required: { type: 'array', items: { type: 'string' } },
            historian_notes: { type: 'string' }
          }
        },
        add_context_from_internet: true
      });

      return response;
    },
    onSuccess: (data) => {
      setAnalysisResult(data);
      toast.success('Alternate history analysis complete');
    }
  });

  return (
    <Card className="bg-slate-950/80 backdrop-blur-xl border border-sky-900/40 p-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 rounded-lg bg-amber-500/20 border border-amber-500/30">
          <History className="w-6 h-6 text-amber-400" />
        </div>
        <div>
          <h3 className="text-xl font-bold text-amber-400 glow-text font-mono">
            HISTORICAL "WHAT-IF" ANALYSIS
          </h3>
          <p className="text-xs text-slate-400 font-mono">Explore alternate history divergences</p>
        </div>
      </div>

      <div className="space-y-4">
        {/* War Context */}
        {selectedWar && (
          <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-3">
            <div className="text-xs text-amber-400 font-mono mb-1">ANALYZING CONFLICT</div>
            <div className="text-lg font-bold text-green-400 font-mono">{selectedWar.name}</div>
            <div className="text-slate-400 font-mono text-xs">{selectedWar.start_date} - {selectedWar.end_date || 'Ongoing'}</div>
          </div>
        )}

        {/* Divergence Type */}
        <div>
          <label className="text-amber-400 font-mono text-xs mb-2 block">DIVERGENCE TYPE</label>
          <div className="grid grid-cols-3 gap-2">
            {divergenceTypes.map((type) => (
              <Button
                key={type.id}
                onClick={() => setDivergenceType(type.id)}
                className={`flex flex-col items-start p-3 h-auto text-left ${
                  divergenceType === type.id
                    ? 'bg-amber-500/20 text-amber-400 border-amber-500/30'
                    : 'bg-slate-800/50 text-slate-400 border-slate-600/30'
                } border`}
              >
                <span className="text-xs font-mono font-bold">{type.name}</span>
                <span className="text-[10px] font-mono opacity-70">{type.description}</span>
              </Button>
            ))}
          </div>
        </div>

        {/* Divergence Point */}
        <div>
          <label className="text-amber-400 font-mono text-xs mb-1 block">DIVERGENCE POINT</label>
          <Input
            value={divergencePoint}
            onChange={(e) => setDivergencePoint(e.target.value)}
            placeholder="e.g., Battle of Stalingrad, 1942"
            className="bg-slate-900/50 border-amber-500/30 text-slate-200 font-mono"
          />
        </div>

        {/* Custom Divergence */}
        <div>
          <label className="text-amber-400 font-mono text-xs mb-1 block">WHAT IF...</label>
          <Textarea
            value={customDivergence}
            onChange={(e) => setCustomDivergence(e.target.value)}
            placeholder="Describe the specific change... e.g., 'What if Germany had won the Battle of Stalingrad?'"
            className="bg-slate-900/50 border-amber-500/30 text-slate-200 font-mono h-20"
          />
        </div>

        <Button
          onClick={() => analyzeWhatIfMutation.mutate()}
          disabled={analyzeWhatIfMutation.isPending || !divergencePoint || !customDivergence}
          className="w-full bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-mono"
        >
          {analyzeWhatIfMutation.isPending ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ANALYZING DIVERGENCE...
            </>
          ) : (
            <>
              <GitBranch className="w-4 h-4 mr-2" />
              ANALYZE ALTERNATE HISTORY
            </>
          )}
        </Button>

        {/* Results */}
        {analysisResult && (
          <div className="space-y-4 mt-6">
            {/* Header */}
            <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-xl font-bold text-amber-400 font-mono">{analysisResult.scenario_title}</h4>
                <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/30 font-mono">
                  {analysisResult.plausibility_score}% Plausible
                </Badge>
              </div>
              <p className="text-slate-300 font-mono text-sm">{analysisResult.divergence_summary}</p>
            </div>

            {/* Immediate Consequences */}
            {analysisResult.immediate_consequences?.length > 0 && (
              <div className="bg-slate-900/50 border border-sky-800/30 rounded-lg p-4">
                <h5 className="text-red-400 font-mono font-bold text-sm mb-3 flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  IMMEDIATE CONSEQUENCES
                </h5>
                <div className="space-y-2">
                  {analysisResult.immediate_consequences.map((cons, i) => (
                    <div key={i} className="bg-red-500/10 border border-red-500/20 rounded p-2">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-red-400 font-mono text-xs font-bold">{cons.event}</span>
                        <Badge className="bg-slate-700/50 text-slate-300 font-mono text-[10px]">
                          {cons.timeframe}
                        </Badge>
                      </div>
                      <p className="text-slate-400 font-mono text-xs">{cons.impact}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Long-term Divergence */}
            {analysisResult.long_term_divergence && (
              <div className="bg-slate-900/50 border border-sky-800/30 rounded-lg p-4">
                <h5 className="text-purple-400 font-mono font-bold text-sm mb-3 flex items-center gap-2">
                  <Globe className="w-4 h-4" />
                  LONG-TERM DIVERGENCE
                </h5>
                <div className="space-y-3">
                  <div className="bg-purple-500/10 border border-purple-500/20 rounded p-3">
                    <div className="text-xs text-purple-400 font-mono mb-1">ALTERNATE WAR OUTCOME</div>
                    <p className="text-slate-300 font-mono text-sm">{analysisResult.long_term_divergence.alternate_war_outcome}</p>
                  </div>
                  
                  {analysisResult.long_term_divergence.territorial_changes?.length > 0 && (
                    <div>
                      <div className="text-xs text-cyan-400 font-mono mb-1">TERRITORIAL CHANGES</div>
                      <ul className="space-y-1">
                        {analysisResult.long_term_divergence.territorial_changes.map((change, i) => (
                          <li key={i} className="text-slate-400 font-mono text-xs flex items-start gap-2">
                            <ChevronRight className="w-3 h-3 mt-0.5 text-cyan-400" />
                            {change}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Butterfly Effects */}
            {analysisResult.butterfly_effects?.length > 0 && (
              <div className="bg-slate-900/50 border border-sky-800/30 rounded-lg p-4">
                <h5 className="text-pink-400 font-mono font-bold text-sm mb-3 flex items-center gap-2">
                  <Sparkles className="w-4 h-4" />
                  BUTTERFLY EFFECTS
                </h5>
                <div className="space-y-2">
                  {analysisResult.butterfly_effects.map((effect, i) => (
                    <div key={i} className="bg-pink-500/10 border border-pink-500/20 rounded p-2">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-slate-400 font-mono text-xs">{effect.original_event}</span>
                        <ArrowRight className="w-3 h-3 text-pink-400" />
                        <span className="text-pink-400 font-mono text-xs font-bold">{effect.altered_outcome}</span>
                      </div>
                      <p className="text-slate-500 font-mono text-[10px]">{effect.significance}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Modern World Differences */}
            {analysisResult.modern_world_differences?.length > 0 && (
              <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-4">
                <h5 className="text-green-400 font-mono font-bold text-sm mb-3">HOW WOULD TODAY BE DIFFERENT?</h5>
                <ul className="space-y-1">
                  {analysisResult.modern_world_differences.map((diff, i) => (
                    <li key={i} className="text-slate-300 font-mono text-xs flex items-start gap-2">
                      <ChevronRight className="w-3 h-3 mt-0.5 text-green-400" />
                      {diff}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Historian Notes */}
            {analysisResult.historian_notes && (
              <div className="bg-slate-800/50 rounded-lg p-4">
                <div className="text-xs text-slate-500 font-mono mb-2">HISTORIAN'S NOTES</div>
                <p className="text-slate-400 font-mono text-sm italic">"{analysisResult.historian_notes}"</p>
              </div>
            )}
          </div>
        )}
      </div>
    </Card>
  );
}