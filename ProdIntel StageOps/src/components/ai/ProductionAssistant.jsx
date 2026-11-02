import React, { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { callGemini } from './geminiClient';
import GeminiKeySetup from './GeminiKeySetup';
import { Button } from '../../components/ui/button';
import { Textarea } from '../../components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { Sparkles, Loader2, FileText, BookOpen, Theater, Copy, Check } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/tabs';

export default function ProductionAssistant({ production }) {
  const [prompt, setPrompt] = useState('');
  const [activeTab, setActiveTab] = useState('knowledge');
  const [result, setResult] = useState(null);
  const [copied, setCopied] = useState(false);

  const generateMutation = useMutation({
    mutationFn: async ({ type, customPrompt }) => {
      let systemPrompt = '';
      let schema = null;

      if (type === 'knowledge') {
        systemPrompt = `You are an expert production knowledge curator. Based on the production "${production.name}" and user request: "${customPrompt}", create a comprehensive knowledge base article.`;
        schema = {
          type: 'object',
          properties: {
            title: { type: 'string' },
            content: { type: 'string' },
            tags: { type: 'array', items: { type: 'string' } },
            category: { type: 'string', enum: ['safety', 'best_practice', 'technical', 'troubleshooting', 'equipment', 'process'] }
          }
        };
      } else if (type === 'procedure') {
        systemPrompt = `You are an expert production procedure writer. Based on the production "${production.name}" and user request: "${customPrompt}", create a detailed step-by-step procedure.`;
        schema = {
          type: 'object',
          properties: {
            procedure_name: { type: 'string' },
            description: { type: 'string' },
            steps: { type: 'array', items: { type: 'object', properties: { step_number: { type: 'number' }, description: { type: 'string' } } } },
            safety_notes: { type: 'string' },
            required_equipment: { type: 'array', items: { type: 'string' } }
          }
        };
      } else if (type === 'cuedoc') {
        systemPrompt = `You are an expert stage manager. Based on the production "${production.name}" and user request: "${customPrompt}", create a comprehensive cue documentation.`;
        schema = {
          type: 'object',
          properties: {
            title: { type: 'string' },
            act_scene: { type: 'string' },
            cues: { type: 'array', items: { type: 'object', properties: { cue_number: { type: 'string' }, cue_type: { type: 'string' }, description: { type: 'string' }, timing_notes: { type: 'string' } } } }
          }
        };
      } else if (type === 'suggestions') {
        systemPrompt = `You are a production expert advisor. Analyze the production "${production.name}" with description: "${production.description || 'No description'}". Provide actionable suggestions for: task planning, crew assignments, risk mitigation, and production optimization.`;
        schema = {
          type: 'object',
          properties: {
            task_suggestions: { type: 'array', items: { type: 'string' } },
            crew_recommendations: { type: 'array', items: { type: 'string' } },
            risk_alerts: { type: 'array', items: { type: 'string' } },
            optimization_tips: { type: 'array', items: { type: 'string' } }
          }
        };
      }

      const response = await callGemini(systemPrompt, schema);

      return { type, data: response };
    },
    onSuccess: (data) => {
      setResult(data);
      setPrompt('');
    }
  });

  const handleCopy = async (text) => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-4">
      <GeminiKeySetup />
      <Card className="border-purple-200 bg-purple-50">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-purple-600" />
            <CardTitle>AI Production Assistant</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid grid-cols-4 w-full">
              <TabsTrigger value="knowledge">
                <BookOpen className="w-4 h-4 mr-2" />
                Knowledge
              </TabsTrigger>
              <TabsTrigger value="procedure">
                <FileText className="w-4 h-4 mr-2" />
                Procedure
              </TabsTrigger>
              <TabsTrigger value="cuedoc">
                <Theater className="w-4 h-4 mr-2" />
                Cue Doc
              </TabsTrigger>
              <TabsTrigger value="suggestions">
                <Sparkles className="w-4 h-4 mr-2" />
                Suggestions
              </TabsTrigger>
            </TabsList>

            <TabsContent value="knowledge" className="space-y-3">
              <Textarea
                placeholder="E.g., 'Create an article about proper lighting safety protocols for this production'"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                rows={3}
              />
              <Button 
                onClick={() => generateMutation.mutate({ type: 'knowledge', customPrompt: prompt })}
                disabled={!prompt.trim() || generateMutation.isPending}
                className="w-full"
              >
                {generateMutation.isPending ? (
                  <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Generating...</>
                ) : (
                  <><Sparkles className="w-4 h-4 mr-2" /> Generate Knowledge Article</>
                )}
              </Button>
            </TabsContent>

            <TabsContent value="procedure" className="space-y-3">
              <Textarea
                placeholder="E.g., 'Create a procedure for daily sound check and equipment setup'"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                rows={3}
              />
              <Button 
                onClick={() => generateMutation.mutate({ type: 'procedure', customPrompt: prompt })}
                disabled={!prompt.trim() || generateMutation.isPending}
                className="w-full"
              >
                {generateMutation.isPending ? (
                  <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Generating...</>
                ) : (
                  <><Sparkles className="w-4 h-4 mr-2" /> Generate Procedure</>
                )}
              </Button>
            </TabsContent>

            <TabsContent value="cuedoc" className="space-y-3">
              <Textarea
                placeholder="E.g., 'Generate lighting cues for Act 1, Scene 2 - bedroom scene at dawn'"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                rows={3}
              />
              <Button 
                onClick={() => generateMutation.mutate({ type: 'cuedoc', customPrompt: prompt })}
                disabled={!prompt.trim() || generateMutation.isPending}
                className="w-full"
              >
                {generateMutation.isPending ? (
                  <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Generating...</>
                ) : (
                  <><Sparkles className="w-4 h-4 mr-2" /> Generate Cue Documentation</>
                )}
              </Button>
            </TabsContent>

            <TabsContent value="suggestions" className="space-y-3">
              <p className="text-sm text-muted-foreground">
                Get AI-powered suggestions for optimizing your production based on current status and setup.
              </p>
              <Button 
                onClick={() => generateMutation.mutate({ type: 'suggestions', customPrompt: '' })}
                disabled={generateMutation.isPending}
                className="w-full"
              >
                {generateMutation.isPending ? (
                  <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Analyzing...</>
                ) : (
                  <><Sparkles className="w-4 h-4 mr-2" /> Get Production Suggestions</>
                )}
              </Button>
            </TabsContent>
          </Tabs>

          {/* Results */}
          {result && (
            <Card className="mt-4 border-purple-200">
              <CardContent className="p-4 space-y-3">
                {result.type === 'knowledge' && (
                  <>
                    <div className="flex items-center justify-between">
                      <h4 className="font-semibold text-lg">{result.data.title}</h4>
                      <Button size="sm" variant="ghost" onClick={() => handleCopy(JSON.stringify(result.data, null, 2))}>
                        {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                      </Button>
                    </div>
                    <Badge>{result.data.category}</Badge>
                    <p className="text-sm whitespace-pre-wrap">{result.data.content}</p>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {result.data.tags?.map((tag, i) => (
                        <Badge key={i} variant="outline">{tag}</Badge>
                      ))}
                    </div>
                  </>
                )}

                {result.type === 'procedure' && (
                  <>
                    <div className="flex items-center justify-between">
                      <h4 className="font-semibold text-lg">{result.data.procedure_name}</h4>
                      <Button size="sm" variant="ghost" onClick={() => handleCopy(JSON.stringify(result.data, null, 2))}>
                        {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                      </Button>
                    </div>
                    <p className="text-sm text-muted-foreground">{result.data.description}</p>
                    <div className="space-y-2 mt-3">
                      {result.data.steps?.map((step, i) => (
                        <div key={i} className="flex gap-3">
                          <div className="w-6 h-6 rounded-full bg-purple-100 text-purple-700 flex items-center justify-center text-xs font-semibold flex-shrink-0">
                            {step.step_number}
                          </div>
                          <p className="text-sm">{step.description}</p>
                        </div>
                      ))}
                    </div>
                    {result.data.safety_notes && (
                      <div className="mt-3 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                        <p className="text-xs font-semibold text-amber-900 mb-1">Safety Notes:</p>
                        <p className="text-sm text-amber-800">{result.data.safety_notes}</p>
                      </div>
                    )}
                  </>
                )}

                {result.type === 'cuedoc' && (
                  <>
                    <div className="flex items-center justify-between">
                      <h4 className="font-semibold text-lg">{result.data.title}</h4>
                      <Button size="sm" variant="ghost" onClick={() => handleCopy(JSON.stringify(result.data, null, 2))}>
                        {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                      </Button>
                    </div>
                    <Badge>{result.data.act_scene}</Badge>
                    <div className="space-y-2 mt-3">
                      {result.data.cues?.map((cue, i) => (
                        <div key={i} className="border-l-4 border-purple-400 pl-3 py-1">
                          <div className="flex items-center gap-2">
                            <Badge variant="outline">{cue.cue_number}</Badge>
                            <span className="text-xs font-semibold">{cue.cue_type}</span>
                          </div>
                          <p className="text-sm mt-1">{cue.description}</p>
                          {cue.timing_notes && (
                            <p className="text-xs text-muted-foreground mt-1">{cue.timing_notes}</p>
                          )}
                        </div>
                      ))}
                    </div>
                  </>
                )}

                {result.type === 'suggestions' && (
                  <>
                    <h4 className="font-semibold text-lg">Production Optimization Suggestions</h4>
                    
                    {result.data.task_suggestions?.length > 0 && (
                      <div>
                        <p className="text-sm font-semibold mb-2">📋 Task Planning:</p>
                        <ul className="space-y-1 ml-4">
                          {result.data.task_suggestions.map((item, i) => (
                            <li key={i} className="text-sm list-disc">{item}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {result.data.crew_recommendations?.length > 0 && (
                      <div>
                        <p className="text-sm font-semibold mb-2">👥 Crew Assignments:</p>
                        <ul className="space-y-1 ml-4">
                          {result.data.crew_recommendations.map((item, i) => (
                            <li key={i} className="text-sm list-disc">{item}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {result.data.risk_alerts?.length > 0 && (
                      <div className="bg-amber-50 border border-amber-200 rounded p-3">
                        <p className="text-sm font-semibold mb-2">⚠️ Risk Alerts:</p>
                        <ul className="space-y-1 ml-4">
                          {result.data.risk_alerts.map((item, i) => (
                            <li key={i} className="text-sm list-disc text-amber-900">{item}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {result.data.optimization_tips?.length > 0 && (
                      <div>
                        <p className="text-sm font-semibold mb-2">💡 Optimization Tips:</p>
                        <ul className="space-y-1 ml-4">
                          {result.data.optimization_tips.map((item, i) => (
                            <li key={i} className="text-sm list-disc">{item}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </>
                )}
              </CardContent>
            </Card>
          )}
        </CardContent>
      </Card>
    </div>
  );
}