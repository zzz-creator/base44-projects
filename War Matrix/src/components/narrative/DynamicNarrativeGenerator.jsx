import React, { useState } from 'react';
import { base44 } from '../../api/base44Client';
import { useMutation } from '@tanstack/react-query';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Textarea } from '../ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { 
  FileText, Loader2, Newspaper, ScrollText, Shield, 
  Globe, MessageSquare, RefreshCw, Copy, Download
} from 'lucide-react';
import { toast } from 'sonner';

export default function DynamicNarrativeGenerator({ contextData, simulationData }) {
  const [narrativeType, setNarrativeType] = useState('news_report');
  const [customContext, setCustomContext] = useState('');
  const [generatedNarratives, setGeneratedNarratives] = useState([]);

  const narrativeTypes = [
    { id: 'news_report', name: 'News Report', icon: Newspaper, description: 'Breaking news style coverage' },
    { id: 'diplomatic_cable', name: 'Diplomatic Cable', icon: ScrollText, description: 'Official diplomatic communiqué' },
    { id: 'intel_brief', name: 'Intelligence Brief', icon: Shield, description: 'Classified intelligence assessment' },
    { id: 'situation_report', name: 'SITREP', icon: Globe, description: 'Military situation report' },
    { id: 'press_release', name: 'Press Release', icon: MessageSquare, description: 'Official government statement' }
  ];

  const generateNarrativeMutation = useMutation({
    mutationFn: async () => {
      const context = customContext || JSON.stringify(contextData || simulationData || {});
      
      const prompts = {
        news_report: `You are a veteran war correspondent. Write a compelling, realistic breaking news report based on the following geopolitical situation. Include quotes from officials, eyewitness accounts, and analysis. Make it feel like authentic journalism.`,
        diplomatic_cable: `You are a senior diplomat. Write a formal diplomatic cable/communiqué regarding the following situation. Use proper diplomatic language, classification markings, and formal structure. Include recommendations for policy response.`,
        intel_brief: `You are a senior intelligence analyst. Write a classified intelligence brief on the following situation. Include source reliability ratings, confidence assessments, key findings, and recommended collection priorities.`,
        situation_report: `You are a military commander. Write a formal SITREP (Situation Report) based on the following tactical/strategic situation. Include current disposition, enemy activity, friendly actions, and commander's assessment.`,
        press_release: `You are a government spokesperson. Write an official press release regarding the following situation. Use formal language, key talking points, and carefully crafted messaging.`
      };

      const response = await base44.integrations.Core.InvokeLLM({
        prompt: `${prompts[narrativeType]}

SITUATION CONTEXT:
${context}

Generate a detailed, immersive narrative document that feels authentic and professional. Include realistic details, proper formatting for the document type, and maintain consistency with the provided context.`,
        response_json_schema: {
          type: 'object',
          properties: {
            document_type: { type: 'string' },
            classification: { type: 'string' },
            date: { type: 'string' },
            headline: { type: 'string' },
            summary: { type: 'string' },
            full_content: { type: 'string' },
            key_points: { type: 'array', items: { type: 'string' } },
            sources_cited: { type: 'array', items: { type: 'string' } },
            metadata: {
              type: 'object',
              properties: {
                author: { type: 'string' },
                organization: { type: 'string' },
                distribution: { type: 'string' }
              }
            }
          }
        },
        add_context_from_internet: true
      });

      return response;
    },
    onSuccess: (data) => {
      setGeneratedNarratives([{ ...data, id: Date.now(), type: narrativeType }, ...generatedNarratives.slice(0, 9)]);
      toast.success('Narrative generated successfully');
    }
  });

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard');
  };

  const getTypeIcon = (type) => {
    const found = narrativeTypes.find(t => t.id === type);
    return found?.icon || FileText;
  };

  const getClassificationColor = (classification) => {
    if (classification?.includes('TOP SECRET')) return 'bg-red-500/20 text-red-400 border-red-500/30';
    if (classification?.includes('SECRET')) return 'bg-orange-500/20 text-orange-400 border-orange-500/30';
    if (classification?.includes('CONFIDENTIAL')) return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
    return 'bg-green-500/20 text-green-400 border-green-500/30';
  };

  return (
    <Card className="bg-slate-950/80 backdrop-blur-xl border border-sky-900/40 p-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 rounded-lg bg-purple-500/20 border border-purple-500/30">
          <FileText className="w-6 h-6 text-purple-400" />
        </div>
        <div>
          <h3 className="text-xl font-bold text-purple-400 glow-text font-mono">
            DYNAMIC NARRATIVE GENERATOR
          </h3>
          <p className="text-xs text-slate-400 font-mono">AI-generated news, briefs, and diplomatic documents</p>
        </div>
      </div>

      <Tabs defaultValue="generate" className="space-y-4">
        <TabsList className="grid grid-cols-2 bg-slate-900/50">
          <TabsTrigger value="generate" className="font-mono text-xs">GENERATE</TabsTrigger>
          <TabsTrigger value="library" className="font-mono text-xs">LIBRARY ({generatedNarratives.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="generate" className="space-y-4">
          {/* Narrative Type Selection */}
          <div className="grid grid-cols-5 gap-2">
            {narrativeTypes.map((type) => (
              <Button
                key={type.id}
                onClick={() => setNarrativeType(type.id)}
                className={`flex flex-col items-center p-3 h-auto ${
                  narrativeType === type.id
                    ? 'bg-purple-500/20 text-purple-400 border-purple-500/30'
                    : 'bg-slate-800/50 text-slate-400 border-slate-600/30'
                } border`}
              >
                <type.icon className="w-5 h-5 mb-1" />
                <span className="text-[10px] font-mono">{type.name}</span>
              </Button>
            ))}
          </div>

          {/* Custom Context */}
          <div>
            <label className="text-purple-400 font-mono text-xs mb-1 block">CUSTOM CONTEXT (Optional)</label>
            <Textarea
              value={customContext}
              onChange={(e) => setCustomContext(e.target.value)}
              placeholder="Add specific details, events, or context for the narrative..."
              className="bg-slate-900/50 border-purple-500/30 text-slate-200 font-mono h-24"
            />
          </div>

          <Button
            onClick={() => generateNarrativeMutation.mutate()}
            disabled={generateNarrativeMutation.isPending}
            className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-mono"
          >
            {generateNarrativeMutation.isPending ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                GENERATING NARRATIVE...
              </>
            ) : (
              <>
                <FileText className="w-4 h-4 mr-2" />
                GENERATE {narrativeTypes.find(t => t.id === narrativeType)?.name.toUpperCase()}
              </>
            )}
          </Button>

          {/* Latest Generated */}
          {generatedNarratives[0] && (
            <Card className="bg-slate-900/50 border border-purple-500/30 p-4">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <Badge className={getClassificationColor(generatedNarratives[0].classification)}>
                    {generatedNarratives[0].classification || 'UNCLASSIFIED'}
                  </Badge>
                  <h4 className="text-lg font-bold text-green-400 font-mono mt-2">
                    {generatedNarratives[0].headline}
                  </h4>
                </div>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => copyToClipboard(generatedNarratives[0].full_content)}
                  className="text-slate-400 hover:text-slate-200"
                >
                  <Copy className="w-4 h-4" />
                </Button>
              </div>

              <p className="text-slate-400 font-mono text-sm mb-4">{generatedNarratives[0].summary}</p>

              <div className="bg-slate-800/50 rounded-lg p-4 max-h-64 overflow-y-auto">
                <pre className="text-slate-300 font-mono text-xs whitespace-pre-wrap">
                  {generatedNarratives[0].full_content}
                </pre>
              </div>

              {generatedNarratives[0].key_points?.length > 0 && (
                <div className="mt-4">
                  <div className="text-xs text-purple-400 font-mono mb-2">KEY POINTS</div>
                  <ul className="space-y-1">
                    {generatedNarratives[0].key_points.map((point, i) => (
                      <li key={i} className="text-slate-400 font-mono text-xs">• {point}</li>
                    ))}
                  </ul>
                </div>
              )}
            </Card>
          )}
        </TabsContent>

        <TabsContent value="library" className="space-y-4">
          {generatedNarratives.length === 0 ? (
            <div className="bg-slate-900/50 border border-sky-800/30 rounded-lg p-8 text-center">
              <FileText className="w-12 h-12 text-slate-600 mx-auto mb-3" />
              <p className="text-slate-500 font-mono text-sm">No narratives generated yet</p>
            </div>
          ) : (
            <div className="space-y-3">
              {generatedNarratives.map((narrative) => {
                const TypeIcon = getTypeIcon(narrative.type);
                return (
                  <Card key={narrative.id} className="bg-slate-900/50 border border-sky-800/30 p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <TypeIcon className="w-5 h-5 text-purple-400" />
                        <div>
                          <h5 className="text-green-400 font-mono font-bold text-sm">{narrative.headline}</h5>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge className={getClassificationColor(narrative.classification)}>
                              {narrative.classification || 'UNCLASSIFIED'}
                            </Badge>
                            <span className="text-slate-500 font-mono text-xs">{narrative.date}</span>
                          </div>
                        </div>
                      </div>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => copyToClipboard(narrative.full_content)}
                        className="text-slate-400 hover:text-slate-200"
                      >
                        <Copy className="w-4 h-4" />
                      </Button>
                    </div>
                    <p className="text-slate-400 font-mono text-xs mt-2">{narrative.summary}</p>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </Card>
  );
}