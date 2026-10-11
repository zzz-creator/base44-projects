import React, { useState } from 'react';
import { base44 } from '../../api/base44Client';
import { useQuery, useMutation } from '@tanstack/react-query';
import { callGemini } from './geminiClient';
import { Button } from '../../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { ScrollArea } from '../../components/ui/scroll-area';
import { Sparkles, Loader2, Calendar, Users, AlertTriangle, CheckCircle2, TrendingUp } from 'lucide-react';
import { format } from 'date-fns';

export default function SchedulingOptimizer({ production }) {
  const [analysis, setAnalysis] = useState(null);

  const { data: tasks = [] } = useQuery({
    queryKey: ['tasks', production.id],
    queryFn: () => base44.entities.TaskChecklist.filter({ production_id: production.id }),
  });

  const { data: crewAssignments = [] } = useQuery({
    queryKey: ['assignments', production.id],
    queryFn: () => base44.entities.CrewAssignment.filter({ production_id: production.id }),
  });

  const { data: crewMembers = [] } = useQuery({
    queryKey: ['crewMembers'],
    queryFn: () => base44.entities.CrewMember.list(),
  });

  const analyzeMutation = useMutation({
    mutationFn: async () => {
      // Build context for AI
      const crewData = crewMembers.map(cm => {
        const skills = cm.skills ? cm.skills.split(',').map(s => s.trim()) : [];
        const skillLevels = cm.skill_levels ? JSON.parse(cm.skill_levels) : {};
        const assignments = crewAssignments.filter(a => a.crew_member_id === cm.id);
        const blockedDates = cm.blocked_dates ? JSON.parse(cm.blocked_dates) : [];
        
        return {
          name: cm.full_name,
          role: cm.primary_role,
          skills,
          skillLevels,
          availability: cm.status === 'active',
          blockedDates,
          currentAssignments: assignments.length,
          maxHoursPerWeek: cm.max_hours_per_week
        };
      });

      const taskData = tasks.map(t => {
        const dependencies = t.depends_on ? JSON.parse(t.depends_on) : [];
        return {
          name: t.task_name,
          status: t.completion_status,
          priority: t.priority,
          assignedTo: t.assigned_to,
          dueDate: t.due_date,
          category: t.category,
          estimatedHours: t.estimated_hours,
          dependencies,
          isRecurring: t.is_recurring
        };
      });

      const prompt = `Analyze this production scheduling scenario:

Production: ${production.name}
Status: ${production.status}
Timeline: ${production.start_date ? format(new Date(production.start_date), 'MMM d') : 'TBD'} to ${production.end_date ? format(new Date(production.end_date), 'MMM d') : 'TBD'}

Available Crew (${crewData.length}):
${JSON.stringify(crewData, null, 2)}

Tasks (${taskData.length}):
${JSON.stringify(taskData, null, 2)}

Provide:
1. Task assignment recommendations (match crew skills to unassigned tasks)
2. Schedule optimization suggestions (reorder tasks, identify critical path)
3. Risk identification (crew conflicts, availability issues, dependency bottlenecks)
4. Workload balancing recommendations`;

      const response = await callGemini(prompt, {
        type: 'object',
        properties: {
          task_assignments: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                task_name: { type: 'string' },
                recommended_assignee: { type: 'string' },
                reason: { type: 'string' },
                confidence: { type: 'string', enum: ['high', 'medium', 'low'] }
              }
            }
          },
          schedule_optimizations: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                recommendation: { type: 'string' },
                impact: { type: 'string', enum: ['high', 'medium', 'low'] },
                priority: { type: 'string', enum: ['critical', 'high', 'medium', 'low'] }
              }
            }
          },
          identified_risks: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                risk: { type: 'string' },
                severity: { type: 'string', enum: ['critical', 'high', 'medium', 'low'] },
                mitigation: { type: 'string' }
              }
            }
          },
          workload_insights: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                crew_member: { type: 'string' },
                status: { type: 'string', enum: ['overloaded', 'balanced', 'underutilized'] },
                suggestion: { type: 'string' }
              }
            }
          },
          critical_path_tasks: {
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

  const confidenceColors = {
    high: 'bg-green-100 text-green-700',
    medium: 'bg-yellow-100 text-yellow-700',
    low: 'bg-red-100 text-red-700'
  };

  const severityColors = {
    critical: 'bg-red-100 text-red-700',
    high: 'bg-orange-100 text-orange-700',
    medium: 'bg-yellow-100 text-yellow-700',
    low: 'bg-blue-100 text-blue-700'
  };

  const statusColors = {
    overloaded: 'bg-red-100 text-red-700',
    balanced: 'bg-green-100 text-green-700',
    underutilized: 'bg-blue-100 text-blue-700'
  };

  return (
    <Card className="border-blue-200 bg-blue-50">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-blue-600" />
            <CardTitle>AI Scheduling Optimizer</CardTitle>
          </div>
          <Button 
            onClick={() => analyzeMutation.mutate()}
            disabled={analyzeMutation.isPending || tasks.length === 0}
            size="sm"
          >
            {analyzeMutation.isPending ? (
              <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Analyzing...</>
            ) : (
              <><Sparkles className="w-4 h-4 mr-2" /> Optimize Schedule</>
            )}
          </Button>
        </div>
      </CardHeader>

      {analysis && (
        <CardContent className="space-y-4">
          {/* Task Assignments */}
          {analysis.task_assignments?.length > 0 && (
            <div>
              <h4 className="font-semibold mb-3 flex items-center gap-2">
                <Users className="w-4 h-4" />
                Recommended Task Assignments ({analysis.task_assignments.length})
              </h4>
              <ScrollArea className="h-48">
                <div className="space-y-2">
                  {analysis.task_assignments.map((item, i) => (
                    <Card key={i}>
                      <CardContent className="p-3">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1">
                            <p className="font-medium text-sm">{item.task_name}</p>
                            <p className="text-xs text-muted-foreground mt-1">
                              → Assign to: <span className="font-medium text-blue-600">{item.recommended_assignee}</span>
                            </p>
                            <p className="text-xs text-muted-foreground mt-1">{item.reason}</p>
                          </div>
                          <Badge className={confidenceColors[item.confidence]}>{item.confidence}</Badge>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </ScrollArea>
            </div>
          )}

          {/* Schedule Optimizations */}
          {analysis.schedule_optimizations?.length > 0 && (
            <div>
              <h4 className="font-semibold mb-3 flex items-center gap-2">
                <TrendingUp className="w-4 h-4" />
                Schedule Optimizations
              </h4>
              <div className="space-y-2">
                {analysis.schedule_optimizations.map((item, i) => (
                  <Card key={i} className="border-l-4 border-l-blue-500">
                    <CardContent className="p-3">
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-sm flex-1">{item.recommendation}</p>
                        <div className="flex gap-1">
                          <Badge variant="outline">{item.impact} impact</Badge>
                          <Badge className={severityColors[item.priority]}>{item.priority}</Badge>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* Risks */}
          {analysis.identified_risks?.length > 0 && (
            <div>
              <h4 className="font-semibold mb-3 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-red-600" />
                Identified Risks ({analysis.identified_risks.length})
              </h4>
              <div className="space-y-2">
                {analysis.identified_risks.map((item, i) => (
                  <Card key={i} className="border-amber-200 bg-amber-50">
                    <CardContent className="p-3">
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <p className="font-medium text-sm flex-1">{item.risk}</p>
                        <Badge className={severityColors[item.severity]}>{item.severity}</Badge>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        <strong>Mitigation:</strong> {item.mitigation}
                      </p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* Workload Insights */}
          {analysis.workload_insights?.length > 0 && (
            <div>
              <h4 className="font-semibold mb-3 flex items-center gap-2">
                <Users className="w-4 h-4" />
                Workload Balance
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {analysis.workload_insights.map((item, i) => (
                  <Card key={i}>
                    <CardContent className="p-3">
                      <div className="flex items-center justify-between mb-1">
                        <p className="font-medium text-sm">{item.crew_member}</p>
                        <Badge className={statusColors[item.status]}>{item.status}</Badge>
                      </div>
                      <p className="text-xs text-muted-foreground">{item.suggestion}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* Critical Path */}
          {analysis.critical_path_tasks?.length > 0 && (
            <div>
              <h4 className="font-semibold mb-3 flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                Critical Path Tasks
              </h4>
              <div className="flex flex-wrap gap-2">
                {analysis.critical_path_tasks.map((task, i) => (
                  <Badge key={i} variant="outline" className="border-red-300">
                    <CheckCircle2 className="w-3 h-3 mr-1" />
                    {task}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      )}

      {!analysis && (
        <CardContent>
          <p className="text-sm text-muted-foreground text-center py-4">
            Click "Optimize Schedule" to get AI-powered scheduling recommendations
          </p>
        </CardContent>
      )}
    </Card>
  );
}