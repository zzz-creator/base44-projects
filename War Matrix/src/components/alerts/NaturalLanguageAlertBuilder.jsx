import React, { useState } from 'react';
import { base44 } from '../../api/base44Client';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Textarea } from '../ui/textarea';
import { Badge } from '../ui/badge';
import { Switch } from '../ui/switch';
import { 
  Bell, Loader2, Sparkles, Plus, Trash2, Check,
  AlertTriangle, Brain, ChevronRight, Zap
} from 'lucide-react';
import { toast } from 'sonner';

export default function NaturalLanguageAlertBuilder() {
  const queryClient = useQueryClient();
  const [naturalLanguageQuery, setNaturalLanguageQuery] = useState('');
  const [parsedRule, setParsedRule] = useState(null);
  const [savedRules, setSavedRules] = useState(() => {
    const saved = localStorage.getItem('warMatrixNLAlertRules');
    return saved ? JSON.parse(saved) : [];
  });

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  const parseNaturalLanguageMutation = useMutation({
    mutationFn: async (query) => {
      const response = await base44.integrations.Core.InvokeLLM({
        prompt: `You are an alert rule parser. Convert the following natural language alert request into a structured alert rule.

USER REQUEST: "${query}"

Parse this into a structured alert rule with:
1. Conditions (what triggers the alert)
2. Thresholds (numeric values)
3. Regions/entities to monitor
4. Logical operators (AND/OR)
5. Alert priority
6. Suggested notification methods

Examples of valid inputs:
- "Alert me if threat level in Middle East exceeds 80%"
- "Notify when economic instability > 70 AND military buildup detected"
- "Watch for conflicts in Asia with confidence below 60%"
- "Alert on any critical threats in Europe or Africa"`,
        response_json_schema: {
          type: 'object',
          properties: {
            rule_name: { type: 'string' },
            natural_language_summary: { type: 'string' },
            conditions: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  metric: { type: 'string' },
                  operator: { type: 'string' },
                  value: { type: 'number' },
                  region: { type: 'string' },
                  entity_type: { type: 'string' }
                }
              }
            },
            logic_operator: { type: 'string' },
            priority: { type: 'string' },
            suggested_actions: { type: 'array', items: { type: 'string' } },
            notification_methods: { type: 'array', items: { type: 'string' } },
            is_valid: { type: 'boolean' },
            validation_notes: { type: 'string' }
          }
        }
      });

      return response;
    },
    onSuccess: (data) => {
      setParsedRule(data);
      if (data.is_valid) {
        toast.success('Alert rule parsed successfully');
      } else {
        toast.warning('Rule parsed with warnings - please review');
      }
    }
  });

  const saveRule = () => {
    if (!parsedRule) return;

    const newRule = {
      id: Date.now().toString(),
      ...parsedRule,
      originalQuery: naturalLanguageQuery,
      is_active: true,
      created_at: new Date().toISOString(),
      trigger_count: 0
    };

    const updated = [...savedRules, newRule];
    setSavedRules(updated);
    localStorage.setItem('warMatrixNLAlertRules', JSON.stringify(updated));
    
    setNaturalLanguageQuery('');
    setParsedRule(null);
    toast.success('Alert rule saved');
  };

  const deleteRule = (ruleId) => {
    const updated = savedRules.filter(r => r.id !== ruleId);
    setSavedRules(updated);
    localStorage.setItem('warMatrixNLAlertRules', JSON.stringify(updated));
    toast.success('Rule deleted');
  };

  const toggleRule = (ruleId) => {
    const updated = savedRules.map(r => 
      r.id === ruleId ? { ...r, is_active: !r.is_active } : r
    );
    setSavedRules(updated);
    localStorage.setItem('warMatrixNLAlertRules', JSON.stringify(updated));
  };

  const getOperatorSymbol = (op) => {
    const symbols = {
      'greater_than': '>',
      'less_than': '<',
      'equals': '=',
      'greater_than_or_equal': '≥',
      'less_than_or_equal': '≤',
      'not_equals': '≠'
    };
    return symbols[op] || op;
  };

  const getPriorityColor = (priority) => {
    const colors = {
      'CRITICAL': 'bg-red-500/20 text-red-400 border-red-500/30',
      'HIGH': 'bg-orange-500/20 text-orange-400 border-orange-500/30',
      'MEDIUM': 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
      'LOW': 'bg-green-500/20 text-green-400 border-green-500/30'
    };
    return colors[priority] || 'bg-slate-500/20 text-slate-400 border-slate-500/30';
  };

  const exampleQueries = [
    "Alert me if threat level in Middle East exceeds 80%",
    "Notify when any conflict has escalation probability above 70%",
    "Watch for economic instability greater than 60 in Asia",
    "Alert on military buildups in Eastern Europe with high confidence",
    "Monitor refugee flows exceeding 100,000 in any region"
  ];

  return (
    <Card className="bg-slate-950/80 backdrop-blur-xl border border-sky-900/40 p-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 rounded-lg bg-purple-500/20 border border-purple-500/30">
          <Brain className="w-6 h-6 text-purple-400" />
        </div>
        <div>
          <h3 className="text-xl font-bold text-purple-400 glow-text font-mono">
            NATURAL LANGUAGE ALERT BUILDER
          </h3>
          <p className="text-xs text-slate-400 font-mono">Create alerts using plain English</p>
        </div>
      </div>

      <div className="space-y-4">
        {/* Natural Language Input */}
        <div>
          <label className="text-purple-400 font-mono text-xs mb-1 block">DESCRIBE YOUR ALERT</label>
          <Textarea
            value={naturalLanguageQuery}
            onChange={(e) => setNaturalLanguageQuery(e.target.value)}
            placeholder="e.g., Alert me if threat level in Middle East exceeds 80% AND AI confidence is below 60%"
            className="bg-slate-900/50 border-purple-500/30 text-slate-200 font-mono h-20"
          />
        </div>

        {/* Example Queries */}
        <div>
          <div className="text-xs text-slate-500 font-mono mb-2">EXAMPLES (click to use)</div>
          <div className="flex flex-wrap gap-2">
            {exampleQueries.map((query, i) => (
              <Button
                key={i}
                size="sm"
                variant="outline"
                onClick={() => setNaturalLanguageQuery(query)}
                className="border-purple-500/30 text-purple-400 hover:bg-purple-500/10 font-mono text-[10px]"
              >
                {query.slice(0, 40)}...
              </Button>
            ))}
          </div>
        </div>

        <Button
          onClick={() => parseNaturalLanguageMutation.mutate(naturalLanguageQuery)}
          disabled={parseNaturalLanguageMutation.isPending || !naturalLanguageQuery.trim()}
          className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-mono"
        >
          {parseNaturalLanguageMutation.isPending ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              PARSING...
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4 mr-2" />
              PARSE ALERT RULE
            </>
          )}
        </Button>

        {/* Parsed Rule Preview */}
        {parsedRule && (
          <Card className="bg-purple-500/10 border border-purple-500/30 p-4 space-y-4">
            <div className="flex items-start justify-between">
              <div>
                <h4 className="text-lg font-bold text-purple-400 font-mono">{parsedRule.rule_name}</h4>
                <p className="text-slate-400 font-mono text-xs">{parsedRule.natural_language_summary}</p>
              </div>
              <Badge className={getPriorityColor(parsedRule.priority)}>
                {parsedRule.priority}
              </Badge>
            </div>

            {/* Conditions */}
            <div>
              <div className="text-xs text-purple-400 font-mono mb-2">CONDITIONS</div>
              <div className="space-y-2">
                {parsedRule.conditions?.map((cond, i) => (
                  <div key={i} className="flex items-center gap-2">
                    {i > 0 && (
                      <Badge className="bg-cyan-500/20 text-cyan-400 border-cyan-500/30 font-mono text-[10px]">
                        {parsedRule.logic_operator}
                      </Badge>
                    )}
                    <div className="bg-slate-800/50 rounded px-3 py-2 flex items-center gap-2">
                      <span className="text-slate-400 font-mono text-xs">{cond.metric}</span>
                      <span className="text-purple-400 font-mono font-bold">{getOperatorSymbol(cond.operator)}</span>
                      <span className="text-green-400 font-mono text-xs">{cond.value}</span>
                      {cond.region && (
                        <Badge variant="outline" className="border-slate-500/30 text-slate-400 font-mono text-[10px]">
                          {cond.region}
                        </Badge>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Validation */}
            <div className={`rounded p-3 ${parsedRule.is_valid ? 'bg-green-500/10 border border-green-500/30' : 'bg-yellow-500/10 border border-yellow-500/30'}`}>
              <div className="flex items-center gap-2">
                {parsedRule.is_valid ? (
                  <Check className="w-4 h-4 text-green-400" />
                ) : (
                  <AlertTriangle className="w-4 h-4 text-yellow-400" />
                )}
                <span className={`font-mono text-xs ${parsedRule.is_valid ? 'text-green-400' : 'text-yellow-400'}`}>
                  {parsedRule.validation_notes}
                </span>
              </div>
            </div>

            {/* Notification Methods */}
            {parsedRule.notification_methods?.length > 0 && (
              <div>
                <div className="text-xs text-slate-500 font-mono mb-1">NOTIFICATION METHODS</div>
                <div className="flex gap-2">
                  {parsedRule.notification_methods.map((method, i) => (
                    <Badge key={i} className="bg-cyan-500/20 text-cyan-400 border-cyan-500/30 font-mono text-xs">
                      {method}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            <Button
              onClick={saveRule}
              className="w-full bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white font-mono"
            >
              <Plus className="w-4 h-4 mr-2" />
              SAVE ALERT RULE
            </Button>
          </Card>
        )}

        {/* Saved Rules */}
        {savedRules.length > 0 && (
          <div className="space-y-3">
            <h4 className="text-cyan-400 font-mono font-bold text-sm">SAVED ALERT RULES ({savedRules.length})</h4>
            {savedRules.map((rule) => (
              <div
                key={rule.id}
                className={`bg-slate-900/50 border rounded-lg p-4 ${
                  rule.is_active ? 'border-cyan-500/30' : 'border-slate-700/30 opacity-60'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <h5 className="text-green-400 font-mono font-bold text-sm">{rule.rule_name}</h5>
                      <Badge className={getPriorityColor(rule.priority)}>
                        {rule.priority}
                      </Badge>
                    </div>
                    <p className="text-slate-500 font-mono text-xs mt-1">{rule.originalQuery}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={rule.is_active}
                      onCheckedChange={() => toggleRule(rule.id)}
                    />
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => deleteRule(rule.id)}
                      className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
                    >
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                </div>

                <div className="mt-3 flex flex-wrap gap-1">
                  {rule.conditions?.map((cond, i) => (
                    <Badge key={i} variant="outline" className="border-purple-500/30 text-purple-400 font-mono text-[10px]">
                      {cond.metric} {getOperatorSymbol(cond.operator)} {cond.value}
                    </Badge>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </Card>
  );
}