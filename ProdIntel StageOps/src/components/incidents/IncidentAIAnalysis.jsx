import React, { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { base44 } from '../../api/base44Client';
import { callGemini } from '../../components/ai/geminiClient';
import { Button } from '../../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Textarea } from '../../components/ui/textarea';
import { Label } from '../../components/ui/label';
import { Badge } from '../../components/ui/badge';
import { Sparkles, Loader2, Save, RefreshCw, CheckCircle } from 'lucide-react';

export default function IncidentAIAnalysis({ incident, onSaved }) {
  const queryClient = useQueryClient();
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState({
    summary: '',
    root_cause: '',
    corrective_action: '',
    preventative_action: '',
    category: ''
  });
  const [saved, setSaved] = useState(false);

  const { data: historicalIncidents = [] } = useQuery({
    queryKey: ['incidents'],
    queryFn: () => base44.entities.IncidentLog.list('-created_date', 50),
  });

  const { data: existingAnalyses = [] } = useQuery({
    queryKey: ['historical-analyses'],
    queryFn: () => base44.entities.HistoricalIncidentAnalysis.list(),
  });

  const saveMutation = useMutation({
    mutationFn: (data) => base44.entities.HistoricalIncidentAnalysis.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['historical-analyses'] });
      setSaved(true);
      onSaved?.();
    },
  });

  const analyzeIncident = async () => {
    setIsAnalyzing(true);
    setSaved(false);

    const similarIncidents = historicalIncidents
      .filter(i => i.id !== incident.id)
      .slice(0, 20);

    const pastAnalyses = existingAnalyses.slice(0, 10);

    const prompt = `You are a production operations expert analyzing incidents for a stage/production management system.

CURRENT INCIDENT TO ANALYZE:
- Description: ${incident.description}
- Severity: ${incident.severity}
- Resolution Status: ${incident.resolution_status}
- Resolution Notes: ${incident.resolution_notes || 'None provided'}

HISTORICAL INCIDENTS FOR CONTEXT (${similarIncidents.length} recent incidents):
${similarIncidents.map(i => `- [${i.severity}] ${i.description} (Status: ${i.resolution_status})`).join('\n')}

PREVIOUS ROOT CAUSE ANALYSES (${pastAnalyses.length} analyses):
${pastAnalyses.map(a => `- Root Cause: ${a.root_cause}\n  Corrective: ${a.corrective_action}\n  Preventative: ${a.preventative_action}`).join('\n\n')}

Provide:
1. SUMMARY: Brief key details (2-3 sentences)
2. ROOT CAUSE: Likely underlying cause (be specific to production/stage operations)
3. CORRECTIVE ACTION: Immediate steps to fix/resolve
4. PREVENTATIVE ACTION: Long-term measures to prevent recurrence
5. CATEGORY: Auto-categorize as one of: equipment_failure, human_error, safety_violation, communication_breakdown, environmental, process_gap, other

Consider recurring patterns, equipment issues, procedural gaps, and training needs.`;

    const result = await callGemini(prompt, {
      type: 'object',
      properties: {
        summary: { type: 'string' },
        root_cause: { type: 'string' },
        corrective_action: { type: 'string' },
        preventative_action: { type: 'string' },
        category: { type: 'string', enum: ['equipment_failure', 'human_error', 'safety_violation', 'communication_breakdown', 'environmental', 'process_gap', 'other'] }
      },
      required: ['summary', 'root_cause', 'corrective_action', 'preventative_action', 'category'],
    });

    setAnalysis(result);
    setIsAnalyzing(false);
  };

  const handleSave = () => {
    saveMutation.mutate({
      incident_id: incident.id,
      summary: analysis.summary,
      root_cause: analysis.root_cause,
      corrective_action: analysis.corrective_action,
      preventative_action: analysis.preventative_action,
      category: analysis.category,
      analyzed_by: 'AI Assistant',
    });
  };

  const hasAnalysis = analysis.root_cause || analysis.corrective_action || analysis.preventative_action;

  const categoryColors = {
    equipment_failure: 'bg-red-100 text-red-700',
    human_error: 'bg-orange-100 text-orange-700',
    safety_violation: 'bg-red-100 text-red-700',
    communication_breakdown: 'bg-yellow-100 text-yellow-700',
    environmental: 'bg-blue-100 text-blue-700',
    process_gap: 'bg-purple-100 text-purple-700',
    other: 'bg-slate-100 text-slate-700'
  };

  return (
    <Card className="border-blue-200 bg-blue-50/30">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-blue-600" />
            AI Incident Analysis
          </CardTitle>
          <Badge variant="outline" className="text-blue-600 border-blue-300">
            Powered by AI
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {!hasAnalysis ? (
          <div className="text-center py-4">
            <p className="text-sm text-slate-600 mb-4">
              Analyze this incident using AI to generate root cause, corrective actions, and preventative measures based on historical patterns.
            </p>
            <Button onClick={analyzeIncident} disabled={isAnalyzing} className="bg-blue-600 hover:bg-blue-700">
              {isAnalyzing ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Analyzing...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 mr-2" />
                  Analyze Incident
                </>
              )}
            </Button>
          </div>
        ) : (
          <>
            {analysis.category && (
              <div className="flex items-center gap-2">
                <Label className="text-slate-700">Category:</Label>
                <Badge className={categoryColors[analysis.category]}>
                  {analysis.category.replace('_', ' ')}
                </Badge>
              </div>
            )}
            {analysis.summary && (
              <div>
                <Label className="text-slate-700">Summary</Label>
                <p className="mt-1 text-sm bg-white border rounded-md p-3">{analysis.summary}</p>
              </div>
            )}
            <div>
              <Label className="text-slate-700">Root Cause</Label>
              <Textarea
                value={analysis.root_cause}
                onChange={(e) => setAnalysis({ ...analysis, root_cause: e.target.value })}
                rows={3}
                className="mt-1 bg-white"
              />
            </div>
            <div>
              <Label className="text-slate-700">Corrective Action</Label>
              <Textarea
                value={analysis.corrective_action}
                onChange={(e) => setAnalysis({ ...analysis, corrective_action: e.target.value })}
                rows={3}
                className="mt-1 bg-white"
              />
            </div>
            <div>
              <Label className="text-slate-700">Preventative Action</Label>
              <Textarea
                value={analysis.preventative_action}
                onChange={(e) => setAnalysis({ ...analysis, preventative_action: e.target.value })}
                rows={3}
                className="mt-1 bg-white"
              />
            </div>
            <div className="flex items-center justify-between pt-2">
              <Button variant="outline" size="sm" onClick={analyzeIncident} disabled={isAnalyzing}>
                <RefreshCw className={`w-4 h-4 mr-2 ${isAnalyzing ? 'animate-spin' : ''}`} />
                Re-analyze
              </Button>
              <div className="flex items-center gap-2">
                {saved && (
                  <span className="text-sm text-green-600 flex items-center gap-1">
                    <CheckCircle className="w-4 h-4" />
                    Saved
                  </span>
                )}
                <Button onClick={handleSave} disabled={saveMutation.isPending || saved} size="sm">
                  {saveMutation.isPending ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Save className="w-4 h-4 mr-2" />
                  )}
                  Save Analysis
                </Button>
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}