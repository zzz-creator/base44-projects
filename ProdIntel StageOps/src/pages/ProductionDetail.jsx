import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '../api/base44Client';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../utils';
import {
  Theater,
  MapPin,
  Calendar,
  Users,
  ListTodo,
  AlertTriangle,
  ArrowLeft,
  Plus,
  Pencil,
  Trash2,
  CheckCircle2,
  Clock,
  Loader2,
  MessageSquare,
  Activity,
  Hash,
  Sparkles,
  DollarSign,
  Copy
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { format } from 'date-fns';
import ProductionForm from '../components/productions/ProductionForm';
import CrewAssignmentForm from '../components/crew/CrewAssignmentForm';
import TaskForm from '../components/tasks/TaskForm';
import CommentSection from '../components/comments/CommentSection';
import ActivityFeed from '../components/activity/ActivityFeed';
import ProductionChannels from '../components/messaging/ProductionChannels';
import ProductionAssistant from '../components/ai/ProductionAssistant';
import SchedulingOptimizer from '../components/ai/SchedulingOptimizer';
import BudgetManager from '../components/budget/BudgetManager';
import SaveAsTemplateDialog from '../components/productions/SaveAsTemplateDialog';

const statusColors = {
  planning: 'bg-slate-100 text-slate-700',
  rehearsal: 'bg-blue-100 text-blue-700',
  active: 'bg-green-100 text-green-700',
  completed: 'bg-purple-100 text-purple-700',
  cancelled: 'bg-red-100 text-red-700',
};

const taskStatusColors = {
  pending: 'bg-slate-100 text-slate-700',
  in_progress: 'bg-blue-100 text-blue-700',
  completed: 'bg-green-100 text-green-700',
  blocked: 'bg-red-100 text-red-700',
};

const roleLabels = {
  stage_manager: 'Stage Manager',
  lighting: 'Lighting',
  sound: 'Sound',
  props: 'Props',
  wardrobe: 'Wardrobe',
  set: 'Set',
  technical_director: 'Technical Director',
  other: 'Other',
};

export default function ProductionDetail() {
  const urlParams = new URLSearchParams(window.location.search);
  const productionId = urlParams.get('id');

  const [showEditForm, setShowEditForm] = useState(false);
  const [showCrewForm, setShowCrewForm] = useState(false);
  const [showTaskForm, setShowTaskForm] = useState(false);
  const [showTemplateDialog, setShowTemplateDialog] = useState(false);
  const [editingCrew, setEditingCrew] = useState(null);
  const [editingTask, setEditingTask] = useState(null);

  const queryClient = useQueryClient();

  const { data: production, isLoading } = useQuery({
    queryKey: ['production', productionId],
    queryFn: () => base44.entities.Production.filter({ id: productionId }),
    select: (data) => data[0],
    enabled: !!productionId,
  });

  const { data: venues = [] } = useQuery({
    queryKey: ['venues'],
    queryFn: () => base44.entities.Venue.list(),
  });

  const { data: crewAssignments = [] } = useQuery({
    queryKey: ['crewAssignments', productionId],
    queryFn: () => base44.entities.CrewAssignment.filter({ production_id: productionId }),
    enabled: !!productionId,
  });

  const { data: tasks = [] } = useQuery({
    queryKey: ['tasks', productionId],
    queryFn: () => base44.entities.TaskChecklist.filter({ production_id: productionId }),
    enabled: !!productionId,
  });

  const { data: incidents = [] } = useQuery({
    queryKey: ['incidents', productionId],
    queryFn: () => base44.entities.IncidentLog.filter({ production_id: productionId }),
    enabled: !!productionId,
  });

  const deleteCrewMutation = useMutation({
    mutationFn: (id) => base44.entities.CrewAssignment.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['crewAssignments', productionId] }),
  });

  const deleteTaskMutation = useMutation({
    mutationFn: (id) => base44.entities.TaskChecklist.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['tasks', productionId] }),
  });

  const updateTaskMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.TaskChecklist.update(id, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['tasks', productionId] }),
  });

  const venue = venues.find(v => v.id === production?.venue_id);

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-slate-400" />
      </div>
    );
  }

  if (!production) {
    return (
      <div className="text-center py-12">
        <Theater className="w-12 h-12 mx-auto text-slate-300 mb-4" />
        <h3 className="text-lg font-medium text-slate-900 mb-1">Production not found</h3>
        <Link to={createPageUrl('Productions')}>
          <Button variant="link">Back to Productions</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Link to={createPageUrl('Productions')}>
            <Button variant="ghost" size="icon">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-slate-900">{production.name}</h1>
              <Badge className={statusColors[production.status]}>{production.status}</Badge>
            </div>
            {production.description && (
              <p className="text-slate-500 mt-1">{production.description}</p>
            )}
          </div>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => setShowTemplateDialog(true)} variant="outline">
            <Copy className="w-4 h-4 mr-2" />
            Save as Template
          </Button>
          <Button onClick={() => setShowEditForm(true)} variant="outline">
            <Pencil className="w-4 h-4 mr-2" />
            Edit Production
          </Button>
        </div>
      </div>

      {/* Info Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-blue-100">
              <MapPin className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-slate-500">Venue</p>
              <p className="font-medium">{venue?.name || 'Not assigned'}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-green-100">
              <Calendar className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-slate-500">Dates</p>
              <p className="font-medium">
                {production.start_date 
                  ? `${format(new Date(production.start_date), 'MMM d')}${production.end_date ? ` - ${format(new Date(production.end_date), 'MMM d')}` : ''}`
                  : 'Not set'}
              </p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-purple-100">
              <Users className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <p className="text-sm text-slate-500">Crew</p>
              <p className="font-medium">{crewAssignments.length} members</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="crew" className="space-y-4">
        <TabsList>
          <TabsTrigger value="crew" className="flex items-center gap-2">
            <Users className="w-4 h-4" />
            Crew ({crewAssignments.length})
          </TabsTrigger>
          <TabsTrigger value="tasks" className="flex items-center gap-2">
            <ListTodo className="w-4 h-4" />
            Tasks ({tasks.length})
          </TabsTrigger>
          <TabsTrigger value="incidents" className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4" />
            Incidents ({incidents.length})
          </TabsTrigger>
          <TabsTrigger value="budget" className="flex items-center gap-2">
            <DollarSign className="w-4 h-4" />
            Budget
          </TabsTrigger>
          <TabsTrigger value="ai" className="flex items-center gap-2">
            <Sparkles className="w-4 h-4" />
            AI Assistant
          </TabsTrigger>
          <TabsTrigger value="channels" className="flex items-center gap-2">
            <Hash className="w-4 h-4" />
            Channels
          </TabsTrigger>
          <TabsTrigger value="discussion" className="flex items-center gap-2">
            <MessageSquare className="w-4 h-4" />
            Comments
          </TabsTrigger>
          <TabsTrigger value="activity" className="flex items-center gap-2">
            <Activity className="w-4 h-4" />
            Activity
          </TabsTrigger>
        </TabsList>

        {/* Crew Tab */}
        <TabsContent value="crew">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-lg">Crew Assignments</CardTitle>
              <Button size="sm" onClick={() => setShowCrewForm(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Add Crew
              </Button>
            </CardHeader>
            <CardContent>
              {crewAssignments.length === 0 ? (
                <div className="text-center py-8 text-slate-500">
                  <Users className="w-10 h-10 mx-auto mb-2 text-slate-300" />
                  <p>No crew assigned yet</p>
                </div>
              ) : (
                <div className="divide-y">
                  {crewAssignments.map((crew) => (
                    <div key={crew.id} className="py-3 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center">
                          <span className="text-sm font-medium text-slate-600">
                            {crew.crew_member_name?.charAt(0)?.toUpperCase()}
                          </span>
                        </div>
                        <div>
                          <p className="font-medium text-slate-900">{crew.crew_member_name}</p>
                          <p className="text-sm text-slate-500">{roleLabels[crew.role] || crew.role}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">{crew.status}</Badge>
                        <Button 
                          variant="ghost" 
                          size="icon"
                          onClick={() => {
                            setEditingCrew(crew);
                            setShowCrewForm(true);
                          }}
                        >
                          <Pencil className="w-4 h-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon"
                          onClick={() => deleteCrewMutation.mutate(crew.id)}
                        >
                          <Trash2 className="w-4 h-4 text-red-500" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tasks Tab */}
        <TabsContent value="tasks">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-lg">Task Checklist</CardTitle>
              <Button size="sm" onClick={() => setShowTaskForm(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Add Task
              </Button>
            </CardHeader>
            <CardContent>
              {tasks.length === 0 ? (
                <div className="text-center py-8 text-slate-500">
                  <ListTodo className="w-10 h-10 mx-auto mb-2 text-slate-300" />
                  <p>No tasks created yet</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {tasks.map((task) => (
                    <div 
                      key={task.id} 
                      className="p-3 rounded-lg bg-slate-50 flex items-center justify-between"
                    >
                      <div className="flex items-center gap-3">
                        <button
                          onClick={() => updateTaskMutation.mutate({
                            id: task.id,
                            data: { 
                              completion_status: task.completion_status === 'completed' ? 'pending' : 'completed' 
                            }
                          })}
                          className={`w-5 h-5 rounded border-2 flex items-center justify-center ${
                            task.completion_status === 'completed' 
                              ? 'bg-green-500 border-green-500' 
                              : 'border-slate-300'
                          }`}
                        >
                          {task.completion_status === 'completed' && (
                            <CheckCircle2 className="w-4 h-4 text-white" />
                          )}
                        </button>
                        <div>
                          <p className={`font-medium ${task.completion_status === 'completed' ? 'line-through text-slate-400' : 'text-slate-900'}`}>
                            {task.task_name}
                          </p>
                          <div className="flex items-center gap-2 text-xs text-slate-500">
                            {task.assigned_to && <span>{task.assigned_to}</span>}
                            {task.due_date && (
                              <span className="flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                {format(new Date(task.due_date), 'MMM d')}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge className={taskStatusColors[task.completion_status]}>
                          {task.completion_status}
                        </Badge>
                        <Button 
                          variant="ghost" 
                          size="icon"
                          onClick={() => {
                            setEditingTask(task);
                            setShowTaskForm(true);
                          }}
                        >
                          <Pencil className="w-4 h-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon"
                          onClick={() => deleteTaskMutation.mutate(task.id)}
                        >
                          <Trash2 className="w-4 h-4 text-red-500" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Incidents Tab */}
        <TabsContent value="incidents">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-lg">Incident Log</CardTitle>
              <Link to={createPageUrl(`Incidents?production_id=${productionId}`)}>
                <Button size="sm">
                  <Plus className="w-4 h-4 mr-2" />
                  Log Incident
                </Button>
              </Link>
            </CardHeader>
            <CardContent>
              {incidents.length === 0 ? (
                <div className="text-center py-8 text-slate-500">
                  <CheckCircle2 className="w-10 h-10 mx-auto mb-2 text-green-400" />
                  <p>No incidents logged</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {incidents.map((incident) => (
                    <div key={incident.id} className="p-3 rounded-lg bg-slate-50">
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="font-medium text-slate-900">{incident.description}</p>
                          <p className="text-xs text-slate-500 mt-1">
                            {incident.created_date && format(new Date(incident.created_date), 'MMM d, h:mm a')}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant={incident.severity === 'critical' ? 'destructive' : 'outline'}>
                            {incident.severity}
                          </Badge>
                          <Badge variant="outline">{incident.resolution_status}</Badge>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Budget Tab */}
        <TabsContent value="budget">
          <BudgetManager productionId={productionId} />
        </TabsContent>

        {/* AI Assistant Tab */}
        <TabsContent value="ai" className="space-y-4">
          <ProductionAssistant production={production} />
          <SchedulingOptimizer production={production} />
        </TabsContent>

        {/* Channels Tab */}
        <TabsContent value="channels">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Hash className="w-5 h-5" />
                Production Channels
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ProductionChannels 
                productionId={productionId}
                productionName={production.name}
              />
            </CardContent>
          </Card>
        </TabsContent>

        {/* Comments Tab */}
        <TabsContent value="discussion">
          <CommentSection 
            entityType="production" 
            entityId={productionId}
            productionId={productionId}
          />
        </TabsContent>

        {/* Activity Tab */}
        <TabsContent value="activity">
          <ActivityFeed productionId={productionId} limit={50} />
        </TabsContent>
      </Tabs>

      {/* Forms */}
      <ProductionForm
        open={showEditForm}
        onClose={() => setShowEditForm(false)}
        production={production}
        venues={venues}
      />
      <CrewAssignmentForm
        open={showCrewForm}
        onClose={() => {
          setShowCrewForm(false);
          setEditingCrew(null);
        }}
        assignment={editingCrew}
        productionId={productionId}
      />
      <TaskForm
        open={showTaskForm}
        onClose={() => {
          setShowTaskForm(false);
          setEditingTask(null);
        }}
        task={editingTask}
        productionId={productionId}
        crewMembers={crewAssignments}
      />
      <SaveAsTemplateDialog
        open={showTemplateDialog}
        onClose={() => setShowTemplateDialog(false)}
        production={production}
        tasks={tasks}
        crewRoles={crewAssignments}
      />
    </div>
  );
}