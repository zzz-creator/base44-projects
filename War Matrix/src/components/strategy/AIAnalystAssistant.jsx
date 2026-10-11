import React, { useState, useEffect, useRef } from 'react';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Badge } from '../ui/badge';
import { Brain, Send, Loader2, AlertTriangle, TrendingUp, Lightbulb } from 'lucide-react';
import { base44 } from '../../api/base44Client';
import { useMutation } from '@tanstack/react-query';

export default function AIAnalystAssistant({ scenarioData, warData }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [proactiveInsights, setProactiveInsights] = useState([]);
  const messagesEndRef = useRef(null);

  const askQuestionMutation = useMutation({
    mutationFn: async (question) => {
      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `You are a senior geopolitical AI analyst assistant. Answer the user's question with precision and strategic insight.

CONTEXT:
Current Scenario Data: ${JSON.stringify(scenarioData || {})}
Current Wars: ${JSON.stringify(warData?.slice(0, 10) || [])}

USER QUESTION: ${question}

Provide a comprehensive but concise answer. Include:
1. Direct answer to the question
2. Key data points and statistics
3. Strategic implications
4. Recommended actions if applicable

Be specific and analytical.`,
        add_context_from_internet: true
      });

      return result;
    },
    onSuccess: (result) => {
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: result,
        timestamp: new Date()
      }]);
    }
  });

  const generateProactiveInsightsMutation = useMutation({
    mutationFn: async () => {
      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `You are a proactive AI analyst monitoring strategic scenarios and global events. Generate critical insights and warnings.

MONITORING DATA:
Scenario: ${JSON.stringify(scenarioData || {})}
Current Wars: ${JSON.stringify(warData?.slice(0, 10) || [])}

Analyze and provide:
1. Critical risks not immediately apparent (2-3 hidden risks)
2. Emerging opportunities (1-2 strategic pivots)
3. Cascading effects to watch for
4. Early warning indicators
5. Recommended immediate actions

Focus on non-obvious insights that require deep analysis.`,
        response_json_schema: {
          type: "object",
          properties: {
            hidden_risks: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  risk: { type: "string" },
                  severity: { type: "string" },
                  explanation: { type: "string" },
                  indicators: { type: "array", items: { type: "string" } }
                }
              }
            },
            strategic_opportunities: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  opportunity: { type: "string" },
                  approach: { type: "string" },
                  expected_outcome: { type: "string" }
                }
              }
            },
            cascading_effects: { type: "array", items: { type: "string" } },
            early_warnings: { type: "array", items: { type: "string" } },
            immediate_actions: { type: "array", items: { type: "string" } }
          }
        },
        add_context_from_internet: true
      });

      setProactiveInsights([result]);
      return result;
    }
  });

  useEffect(() => {
    if ((scenarioData || warData) && proactiveInsights.length === 0) {
      generateProactiveInsightsMutation.mutate();
    }
  }, [scenarioData, warData]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = () => {
    if (input.trim()) {
      setMessages(prev => [...prev, { 
        role: 'user', 
        content: input,
        timestamp: new Date()
      }]);
      askQuestionMutation.mutate(input);
      setInput('');
    }
  };

  const quickQuestions = [
    "What are the primary drivers of instability in the Middle East?",
    "How would a sudden oil embargo impact predicted conflicts?",
    "What regions face the highest climate-driven conflict risk?",
    "Which interventions would have the highest ROI?"
  ];

  return (
    <div className="space-y-4">
      {/* Proactive Insights */}
      {proactiveInsights.length > 0 && (
        <Card className="bg-gradient-to-br from-purple-950/50 to-pink-950/50 backdrop-blur-xl cyber-border p-6">
          <div className="flex items-center gap-3 mb-4">
            <Brain className="w-6 h-6 text-purple-400 animate-pulse" />
            <h3 className="text-xl font-bold text-purple-400 glow-text font-mono">
              PROACTIVE ANALYSIS
            </h3>
            <Button
              size="sm"
              onClick={() => generateProactiveInsightsMutation.mutate()}
              disabled={generateProactiveInsightsMutation.isPending}
              className="ml-auto bg-purple-500/20 hover:bg-purple-500/30 text-purple-400 border border-purple-500/30"
            >
              <Brain className="w-3 h-3 mr-2" />
              REFRESH
            </Button>
          </div>

          {proactiveInsights.map((insight, idx) => (
            <div key={idx} className="space-y-4">
              {/* Hidden Risks */}
              {insight.hidden_risks?.length > 0 && (
                <div>
                  <h4 className="text-sm font-bold text-red-400 font-mono mb-3 flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4" />
                    HIDDEN RISKS
                  </h4>
                  <div className="space-y-2">
                    {insight.hidden_risks.map((risk, i) => (
                      <div key={i} className="bg-red-950/20 cyber-border rounded p-3">
                        <div className="flex items-start justify-between mb-2">
                          <span className="text-yellow-400 font-mono text-sm font-bold">{risk.risk}</span>
                          <Badge className="bg-red-500/20 text-red-400 border-red-500/30 font-mono text-xs">
                            {risk.severity}
                          </Badge>
                        </div>
                        <p className="text-slate-300 font-mono text-xs mb-2">{risk.explanation}</p>
                        {risk.indicators?.length > 0 && (
                          <div className="flex flex-wrap gap-1">
                            {risk.indicators.map((indicator, j) => (
                              <Badge key={j} variant="outline" className="border-orange-500/30 text-orange-400 font-mono text-xs">
                                {indicator}
                              </Badge>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Strategic Opportunities */}
              {insight.strategic_opportunities?.length > 0 && (
                <div>
                  <h4 className="text-sm font-bold text-green-400 font-mono mb-3 flex items-center gap-2">
                    <TrendingUp className="w-4 h-4" />
                    STRATEGIC OPPORTUNITIES
                  </h4>
                  <div className="space-y-2">
                    {insight.strategic_opportunities.map((opp, i) => (
                      <div key={i} className="bg-green-950/20 cyber-border rounded p-3">
                        <h5 className="text-cyan-400 font-mono text-sm font-bold mb-2">{opp.opportunity}</h5>
                        <p className="text-slate-300 font-mono text-xs mb-1">
                          <span className="text-slate-500">Approach:</span> {opp.approach}
                        </p>
                        <p className="text-slate-300 font-mono text-xs">
                          <span className="text-slate-500">Expected:</span> {opp.expected_outcome}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Immediate Actions */}
              {insight.immediate_actions?.length > 0 && (
                <div>
                  <h4 className="text-sm font-bold text-cyan-400 font-mono mb-3 flex items-center gap-2">
                    <Lightbulb className="w-4 h-4" />
                    RECOMMENDED ACTIONS
                  </h4>
                  <ul className="space-y-1">
                    {insight.immediate_actions.map((action, i) => (
                      <li key={i} className="text-slate-300 font-mono text-xs flex items-start gap-2 bg-slate-900/50 cyber-border rounded p-2">
                        <span className="text-cyan-400">▸</span>
                        {action}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          ))}
        </Card>
      )}

      {/* Chat Interface */}
      <Card className="bg-slate-950/80 backdrop-blur-xl cyber-border">
        <div className="p-4 border-b border-cyan-500/30 flex items-center gap-3">
          <Brain className="w-5 h-5 text-cyan-400" />
          <h3 className="text-lg font-bold text-cyan-400 glow-text font-mono">
            AI STRATEGIC ANALYST
          </h3>
          <Badge className="ml-auto bg-green-500/20 text-green-400 border-green-500/30 font-mono text-xs">
            ACTIVE
          </Badge>
        </div>

        <div className="p-4 h-[300px] overflow-y-auto space-y-3">
          {messages.length === 0 && (
            <div className="text-center py-8">
              <Brain className="w-12 h-12 text-cyan-400/30 mx-auto mb-3" />
              <p className="text-slate-400 font-mono text-sm mb-4">
                Ask me anything about the data, scenarios, or strategic implications
              </p>
              <div className="flex flex-wrap gap-2 justify-center">
                {quickQuestions.map((q, i) => (
                  <Button
                    key={i}
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setInput(q);
                      setMessages([{ role: 'user', content: q, timestamp: new Date() }]);
                      askQuestionMutation.mutate(q);
                    }}
                    className="border-cyan-500/30 text-cyan-400 hover:bg-cyan-500/10 font-mono text-xs"
                  >
                    {q}
                  </Button>
                ))}
              </div>
            </div>
          )}

          {messages.map((msg, idx) => (
            <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[85%] rounded-lg p-3 ${
                msg.role === 'user' 
                  ? 'bg-cyan-500/20 border border-cyan-500/30' 
                  : 'bg-slate-900/50 cyber-border'
              }`}>
                <div className="text-xs text-slate-500 font-mono mb-1">
                  {msg.role === 'user' ? 'YOU' : 'AI ANALYST'}
                </div>
                <div className={`font-mono text-sm ${
                  msg.role === 'user' ? 'text-cyan-200' : 'text-slate-300'
                }`}>
                  {msg.content}
                </div>
              </div>
            </div>
          ))}

          {askQuestionMutation.isPending && (
            <div className="flex justify-start">
              <div className="bg-slate-900/50 cyber-border rounded-lg p-3">
                <div className="flex items-center gap-2">
                  <Loader2 className="w-4 h-4 text-cyan-400 animate-spin" />
                  <span className="text-slate-400 font-mono text-sm">Analyzing...</span>
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        <div className="p-4 border-t border-cyan-500/30">
          <div className="flex gap-2">
            <Input
              placeholder="Ask a strategic question..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && !askQuestionMutation.isPending && handleSend()}
              className="flex-1 bg-slate-900/50 border-cyan-500/30 text-cyan-400 font-mono"
              disabled={askQuestionMutation.isPending}
            />
            <Button
              onClick={handleSend}
              disabled={!input.trim() || askQuestionMutation.isPending}
              className="bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white"
            >
              <Send className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}