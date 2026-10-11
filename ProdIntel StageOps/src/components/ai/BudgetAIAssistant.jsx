import React, { useState } from 'react';
import { base44 } from '../../api/base44Client';
import { useQuery, useMutation } from '@tanstack/react-query';
import { callGemini } from './geminiClient';
import { Button } from '../../components/ui/button';
import { Textarea } from '../../components/ui/textarea';
import { Input } from '../../components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { ScrollArea } from '../../components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/tabs';
import { Sparkles, Loader2, DollarSign, TrendingDown, AlertTriangle, FileText, MessageSquare, Send } from 'lucide-react';

export default function BudgetAIAssistant({ production }) {
  const [activeTab, setActiveTab] = useState('analysis');
  const [chatMessages, setChatMessages] = useState([]);
  const [chatInput, setChatInput] = useState('');
  const [analysis, setAnalysis] = useState(null);
  const [scenarioInput, setScenarioInput] = useState('');
  const [scenarioResults, setScenarioResults] = useState([]);

  const { data: budgets = [] } = useQuery({
    queryKey: ['budgets', production.id],
    queryFn: () => base44.entities.Budget.filter({ production_id: production.id }),
  });

  const { data: expenses = [] } = useQuery({
    queryKey: ['expenses', production.id],
    queryFn: () => base44.entities.BudgetExpense.filter({ production_id: production.id }),
  });

  const { data: allBudgets = [] } = useQuery({
    queryKey: ['all-budgets'],
    queryFn: () => base44.entities.Budget.list('-created_date', 200),
  });

  const { data: allExpenses = [] } = useQuery({
    queryKey: ['all-expenses'],
    queryFn: () => base44.entities.BudgetExpense.list('-created_date', 500),
  });

  const analyzeMutation = useMutation({
    mutationFn: async () => {
      const budgetSummary = budgets.map(b => ({
        category: b.category,
        allocated: b.allocated_amount,
        spent: b.actual_amount,
        remaining: b.allocated_amount - b.actual_amount,
        percentUsed: ((b.actual_amount / b.allocated_amount) * 100).toFixed(1)
      }));

      const expenseSummary = expenses.map(e => ({
        description: e.description,
        amount: e.amount,
        vendor: e.vendor,
        status: e.status
      }));

      const historicalData = allBudgets.slice(0, 50).map(b => ({
        category: b.category,
        allocated: b.allocated_amount,
        spent: b.actual_amount
      }));

      const prompt = `Analyze this production budget:

Production: ${production.name}
Status: ${production.status}

CURRENT BUDGET:
${JSON.stringify(budgetSummary, null, 2)}

RECENT EXPENSES (${expenses.length}):
${JSON.stringify(expenseSummary.slice(0, 20), null, 2)}

HISTORICAL BUDGET DATA (${historicalData.length} past budgets):
${JSON.stringify(historicalData, null, 2)}

Provide comprehensive budget analysis:
1. COST-SAVING SUGGESTIONS: Actionable recommendations per department/category
2. OVERRUN PREDICTIONS: Which categories are at risk based on spending patterns
3. OPTIMIZATION OPPORTUNITIES: Where to reallocate funds
4. SPENDING INSIGHTS: Key patterns and trends`;

      const response = await callGemini(prompt, {
        type: 'object',
        properties: {
          cost_saving_suggestions: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                category: { type: 'string' },
                suggestion: { type: 'string' },
                potential_savings: { type: 'string' },
                priority: { type: 'string', enum: ['high', 'medium', 'low'] }
              }
            }
          },
          overrun_predictions: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                category: { type: 'string' },
                risk_level: { type: 'string', enum: ['critical', 'high', 'medium', 'low'] },
                predicted_overrun: { type: 'string' },
                reasoning: { type: 'string' }
              }
            }
          },
          optimization_opportunities: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                action: { type: 'string' },
                impact: { type: 'string' }
              }
            }
          },
          spending_insights: {
            type: 'array',
            items: { type: 'string' }
          }
        }
      });

      return response;
    },
    onSuccess: (data) => {
      setAnalysis(data);
    }
  });

  const generateTemplateMutation = useMutation({
    mutationFn: async () => {
      const historicalData = allBudgets.map(b => ({
        category: b.category,
        allocated: b.allocated_amount,
        spent: b.actual_amount
      }));

      const prompt = `Based on ${historicalData.length} historical production budgets, generate a comprehensive budget template for a new production similar to "${production.name}".

Historical Data:
${JSON.stringify(historicalData, null, 2)}

Generate recommended budget allocations for each category based on:
- Historical averages
- Category-specific trends
- Industry best practices
- Typical production needs`;

      const response = await callGemini(prompt, {
        type: 'object',
        properties: {
          template_budgets: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                category: { type: 'string', enum: ['labor', 'equipment', 'venue', 'materials', 'transportation', 'catering', 'marketing', 'insurance', 'permits', 'contingency', 'other'] },
                recommended_amount: { type: 'number' },
                rationale: { type: 'string' },
                percentage_of_total: { type: 'string' }
              }
            }
          },
          total_recommended_budget: { type: 'number' },
          notes: { type: 'string' }
        }
      });

      return response;
    }
  });

  const chatMutation = useMutation({
    mutationFn: async (question) => {
      const budgetContext = {
        budgets: budgets.map(b => ({
          category: b.category,
          allocated: b.allocated_amount,
          spent: b.actual_amount
        })),
        expenses: expenses.map(e => ({
          description: e.description,
          amount: e.amount,
          vendor: e.vendor,
          date: e.expense_date
        }))
      };

      const prompt = `You are a budget analysis assistant for the production "${production.name}".

Current Budget Data:
${JSON.stringify(budgetContext, null, 2)}

User Question: ${question}

Provide a clear, concise answer based on the budget data. If calculations are needed, show them. Be specific and actionable.`;

      const response = await callGemini(prompt);

      return response;
    },
    onSuccess: (response) => {
      setChatMessages(prev => [...prev, 
        { role: 'user', content: chatInput },
        { role: 'assistant', content: response }
      ]);
      setChatInput('');
    }
  });

  const scenarioMutation = useMutation({
    mutationFn: async (scenario) => {
      const totalAllocated = budgets.reduce((sum, b) => sum + (b.allocated_amount || 0), 0);
      const totalSpent = budgets.reduce((sum, b) => sum + (b.actual_amount || 0), 0);

      const budgetSummary = budgets.map(b => ({
        category: b.category,
        allocated: b.allocated_amount,
        spent: b.actual_amount,
        remaining: b.allocated_amount - b.actual_amount
      }));

      const prompt = `Analyze this "what-if" scenario for the production "${production.name}":

CURRENT BUDGET STATUS:
Total Allocated: $${totalAllocated}
Total Spent: $${totalSpent}
Remaining: $${totalAllocated - totalSpent}

Budget Breakdown:
${JSON.stringify(budgetSummary, null, 2)}

PROPOSED SCENARIO:
${scenario}

Provide detailed impact analysis of this change. Calculate specific costs, identify which budget categories would be affected, predict the overall financial impact, and recommend whether this is feasible given the current budget.`;

      const response = await callGemini(prompt, {
        type: 'object',
        properties: {
          scenario_summary: { type: 'string' },
          estimated_cost: { type: 'number' },
          affected_categories: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                category: { type: 'string' },
                additional_cost: { type: 'number' },
                new_total: { type: 'number' }
              }
            }
          },
          overall_impact: {
            type: 'object',
            properties: {
              new_total_budget: { type: 'number' },
              budget_increase_percentage: { type: 'string' },
              feasibility: { type: 'string', enum: ['feasible', 'tight', 'risky', 'unfeasible'] }
            }
          },
          recommendations: {
            type: 'array',
            items: { type: 'string' }
          },
          alternative_options: {
            type: 'array',
            items: { type: 'string' }
          }
        }
      });

      return { scenario, ...response };
    },
    onSuccess: (result) => {
      setScenarioResults(prev => [result, ...prev]);
      setScenarioInput('');
    }
  });

  const handleChatSubmit = (e) => {
    e.preventDefault();
    if (!chatInput.trim()) return;
    chatMutation.mutate(chatInput);
  };

  const handleScenarioSubmit = (e) => {
    e.preventDefault();
    if (!scenarioInput.trim()) return;
    scenarioMutation.mutate(scenarioInput);
  };

  const priorityColors = {
    high: 'bg-red-100 text-red-700',
    medium: 'bg-yellow-100 text-yellow-700',
    low: 'bg-blue-100 text-blue-700'
  };

  const riskColors = {
    critical: 'bg-red-100 text-red-700',
    high: 'bg-orange-100 text-orange-700',
    medium: 'bg-yellow-100 text-yellow-700',
    low: 'bg-green-100 text-green-700'
  };

  const feasibilityColors = {
    feasible: 'bg-green-100 text-green-700',
    tight: 'bg-yellow-100 text-yellow-700',
    risky: 'bg-orange-100 text-orange-700',
    unfeasible: 'bg-red-100 text-red-700'
  };

  return (
    <Card className="border-emerald-200 bg-emerald-50">
      <CardHeader>
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-emerald-600" />
          <CardTitle>AI Budget Assistant</CardTitle>
        </div>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid grid-cols-5 w-full">
            <TabsTrigger value="analysis">
              <TrendingDown className="w-4 h-4 mr-1" />
              Analysis
            </TabsTrigger>
            <TabsTrigger value="scenarios">
              <Sparkles className="w-4 h-4 mr-1" />
              What-If
            </TabsTrigger>
            <TabsTrigger value="template">
              <FileText className="w-4 h-4 mr-1" />
              Template
            </TabsTrigger>
            <TabsTrigger value="chat">
              <MessageSquare className="w-4 h-4 mr-1" />
              Ask AI
            </TabsTrigger>
            <TabsTrigger value="insights">
              <DollarSign className="w-4 h-4 mr-1" />
              Insights
            </TabsTrigger>
          </TabsList>

          {/* Budget Analysis Tab */}
          <TabsContent value="analysis" className="space-y-4">
            <div className="flex justify-between items-center">
              <p className="text-sm text-muted-foreground">
                AI-powered analysis of your budget with cost-saving suggestions and overrun predictions
              </p>
              <Button 
                onClick={() => analyzeMutation.mutate()}
                disabled={analyzeMutation.isPending || budgets.length === 0}
                size="sm"
              >
                {analyzeMutation.isPending ? (
                  <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Analyzing...</>
                ) : (
                  <><Sparkles className="w-4 h-4 mr-2" /> Analyze Budget</>
                )}
              </Button>
            </div>

            {analysis && (
              <div className="space-y-4 mt-4">
                {/* Cost Savings */}
                {analysis.cost_saving_suggestions?.length > 0 && (
                  <div>
                    <h4 className="font-semibold mb-3 flex items-center gap-2">
                      <TrendingDown className="w-4 h-4 text-emerald-600" />
                      Cost-Saving Suggestions ({analysis.cost_saving_suggestions.length})
                    </h4>
                    <div className="space-y-2">
                      {analysis.cost_saving_suggestions.map((item, i) => (
                        <Card key={i}>
                          <CardContent className="p-3">
                            <div className="flex items-start justify-between gap-2">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                  <Badge variant="outline">{item.category}</Badge>
                                  <Badge className={priorityColors[item.priority]}>{item.priority}</Badge>
                                </div>
                                <p className="text-sm mt-2">{item.suggestion}</p>
                                <p className="text-xs text-emerald-600 font-medium mt-1">
                                  Potential savings: {item.potential_savings}
                                </p>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </div>
                )}

                {/* Overrun Predictions */}
                {analysis.overrun_predictions?.length > 0 && (
                  <div>
                    <h4 className="font-semibold mb-3 flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 text-orange-600" />
                      Budget Overrun Predictions
                    </h4>
                    <div className="space-y-2">
                      {analysis.overrun_predictions.map((item, i) => (
                        <Card key={i} className="border-amber-200 bg-amber-50">
                          <CardContent className="p-3">
                            <div className="flex items-start justify-between gap-2 mb-2">
                              <div className="flex items-center gap-2">
                                <Badge variant="outline">{item.category}</Badge>
                                <Badge className={riskColors[item.risk_level]}>{item.risk_level} risk</Badge>
                              </div>
                              <span className="text-sm font-semibold text-red-600">{item.predicted_overrun}</span>
                            </div>
                            <p className="text-sm text-muted-foreground">{item.reasoning}</p>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </div>
                )}

                {/* Optimization */}
                {analysis.optimization_opportunities?.length > 0 && (
                  <div>
                    <h4 className="font-semibold mb-3">Optimization Opportunities</h4>
                    <div className="space-y-2">
                      {analysis.optimization_opportunities.map((item, i) => (
                        <Card key={i}>
                          <CardContent className="p-3">
                            <p className="text-sm font-medium">{item.action}</p>
                            <p className="text-xs text-muted-foreground mt-1">Impact: {item.impact}</p>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </TabsContent>

          {/* What-If Scenarios Tab */}
          <TabsContent value="scenarios" className="space-y-4">
            <div>
              <p className="text-sm text-muted-foreground mb-3">
                Explore hypothetical budget changes and see AI predictions of their impact
              </p>
              <form onSubmit={handleScenarioSubmit} className="flex gap-2 mb-4">
                <Input
                  placeholder='e.g., "Add 2 lighting technicians at $45/hr for 40 hours" or "Rent additional sound equipment for $5,000"'
                  value={scenarioInput}
                  onChange={(e) => setScenarioInput(e.target.value)}
                  disabled={scenarioMutation.isPending}
                  className="flex-1"
                />
                <Button type="submit" disabled={!scenarioInput.trim() || scenarioMutation.isPending}>
                  {scenarioMutation.isPending ? (
                    <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Analyzing...</>
                  ) : (
                    <><Sparkles className="w-4 h-4 mr-2" /> Analyze</>
                  )}
                </Button>
              </form>
            </div>

            {scenarioResults.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Sparkles className="w-12 h-12 mx-auto mb-3 text-slate-300" />
                <p className="text-sm">Run a scenario to see the predicted impact</p>
                <p className="text-xs mt-1">Examples: Adding crew, renting equipment, venue changes</p>
              </div>
            ) : (
              <div className="space-y-4">
                {scenarioResults.map((result, i) => (
                  <Card key={i} className="border-purple-200 bg-purple-50">
                    <CardContent className="p-4 space-y-3">
                      <div>
                        <p className="text-xs text-purple-600 font-medium mb-1">SCENARIO</p>
                        <p className="text-sm font-semibold">{result.scenario}</p>
                      </div>

                      <div className="bg-white rounded-lg p-3 space-y-2">
                        <p className="text-sm text-muted-foreground">{result.scenario_summary}</p>
                        
                        <div className="grid grid-cols-2 gap-3 pt-2">
                          <div>
                            <p className="text-xs text-muted-foreground">Estimated Cost</p>
                            <p className="text-lg font-bold text-purple-600">
                              ${result.estimated_cost?.toLocaleString()}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground">Feasibility</p>
                            <Badge className={feasibilityColors[result.overall_impact?.feasibility]}>
                              {result.overall_impact?.feasibility}
                            </Badge>
                          </div>
                        </div>
                      </div>

                      {result.affected_categories?.length > 0 && (
                        <div>
                          <p className="text-xs font-medium text-slate-700 mb-2">AFFECTED CATEGORIES</p>
                          <div className="space-y-1">
                            {result.affected_categories.map((cat, j) => (
                              <div key={j} className="bg-white rounded px-3 py-1.5 flex justify-between text-sm">
                                <span className="text-slate-700">{cat.category}</span>
                                <span className="font-semibold text-purple-600">
                                  +${cat.additional_cost?.toLocaleString()} → ${cat.new_total?.toLocaleString()}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {result.overall_impact && (
                        <div className="bg-slate-100 rounded-lg p-3">
                          <p className="text-xs font-medium text-slate-700 mb-2">OVERALL IMPACT</p>
                          <div className="grid grid-cols-2 gap-2 text-sm">
                            <div>
                              <p className="text-xs text-muted-foreground">New Total Budget</p>
                              <p className="font-semibold">${result.overall_impact.new_total_budget?.toLocaleString()}</p>
                            </div>
                            <div>
                              <p className="text-xs text-muted-foreground">Increase</p>
                              <p className="font-semibold text-purple-600">{result.overall_impact.budget_increase_percentage}</p>
                            </div>
                          </div>
                        </div>
                      )}

                      {result.recommendations?.length > 0 && (
                        <div>
                          <p className="text-xs font-medium text-slate-700 mb-2">RECOMMENDATIONS</p>
                          <ul className="space-y-1">
                            {result.recommendations.map((rec, j) => (
                              <li key={j} className="text-sm text-slate-600 flex gap-2">
                                <span className="text-emerald-600">•</span>
                                <span>{rec}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {result.alternative_options?.length > 0 && (
                        <div>
                          <p className="text-xs font-medium text-slate-700 mb-2">ALTERNATIVES</p>
                          <ul className="space-y-1">
                            {result.alternative_options.map((alt, j) => (
                              <li key={j} className="text-sm text-slate-600 flex gap-2">
                                <span className="text-blue-600">→</span>
                                <span>{alt}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Budget Template Tab */}
          <TabsContent value="template" className="space-y-4">
            <div>
              <p className="text-sm text-muted-foreground mb-3">
                Generate a budget template based on historical data from similar productions
              </p>
              <Button 
                onClick={() => generateTemplateMutation.mutate()}
                disabled={generateTemplateMutation.isPending}
              >
                {generateTemplateMutation.isPending ? (
                  <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Generating...</>
                ) : (
                  <><FileText className="w-4 h-4 mr-2" /> Generate Template</>
                )}
              </Button>
            </div>

            {generateTemplateMutation.data && (
              <div className="space-y-3 mt-4">
                <div className="bg-white p-4 rounded-lg border">
                  <h4 className="font-semibold mb-2">Recommended Total Budget</h4>
                  <p className="text-2xl font-bold text-emerald-600">
                    ${generateTemplateMutation.data.total_recommended_budget?.toLocaleString()}
                  </p>
                  {generateTemplateMutation.data.notes && (
                    <p className="text-sm text-muted-foreground mt-2">{generateTemplateMutation.data.notes}</p>
                  )}
                </div>

                <div className="space-y-2">
                  {generateTemplateMutation.data.template_budgets?.map((item, i) => (
                    <Card key={i}>
                      <CardContent className="p-3">
                        <div className="flex items-center justify-between mb-2">
                          <Badge variant="outline">{item.category}</Badge>
                          <div className="text-right">
                            <p className="font-semibold">${item.recommended_amount?.toLocaleString()}</p>
                            <p className="text-xs text-muted-foreground">{item.percentage_of_total}</p>
                          </div>
                        </div>
                        <p className="text-sm text-muted-foreground">{item.rationale}</p>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}
          </TabsContent>

          {/* Chat Tab */}
          <TabsContent value="chat" className="space-y-4">
            <ScrollArea className="h-96 border rounded-lg bg-white p-4">
              {chatMessages.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <MessageSquare className="w-12 h-12 mx-auto mb-3 text-slate-300" />
                  <p className="text-sm">Ask questions about your budget</p>
                  <p className="text-xs mt-1">e.g., "What's my largest expense category?" or "How much have I spent on equipment?"</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {chatMessages.map((msg, i) => (
                    <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[80%] rounded-lg px-4 py-2 ${
                        msg.role === 'user' 
                          ? 'bg-emerald-600 text-white' 
                          : 'bg-slate-100 text-slate-900'
                      }`}>
                        <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                      </div>
                    </div>
                  ))}
                  {chatMutation.isPending && (
                    <div className="flex justify-start">
                      <div className="bg-slate-100 rounded-lg px-4 py-2">
                        <Loader2 className="w-4 h-4 animate-spin text-slate-600" />
                      </div>
                    </div>
                  )}
                </div>
              )}
            </ScrollArea>

            <form onSubmit={handleChatSubmit} className="flex gap-2">
              <Input
                placeholder="Ask about your budget..."
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                disabled={chatMutation.isPending}
              />
              <Button type="submit" disabled={!chatInput.trim() || chatMutation.isPending}>
                <Send className="w-4 h-4" />
              </Button>
            </form>
          </TabsContent>

          {/* Insights Tab */}
          <TabsContent value="insights" className="space-y-4">
            {analysis?.spending_insights?.length > 0 ? (
              <div className="space-y-2">
                <h4 className="font-semibold mb-3">Key Spending Insights</h4>
                {analysis.spending_insights.map((insight, i) => (
                  <Card key={i}>
                    <CardContent className="p-3">
                      <p className="text-sm">{insight}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <DollarSign className="w-12 h-12 mx-auto mb-3 text-slate-300" />
                <p className="text-sm">Run budget analysis to see insights</p>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}