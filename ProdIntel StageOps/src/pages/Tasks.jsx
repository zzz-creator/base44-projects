import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '../api/base44Client';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../utils';
import { 
  ListTodo, 
  Plus, 
  Search, 
  Filter,
  CheckCircle2,
  Clock,
  Loader2,
  Theater,
  RefreshCw,
  Link as LinkIcon,
  ChevronRight,
  MoreVertical,
  Pencil,
  Trash2,
  ListTree
} from 'lucide-react';
import { Card, CardContent } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Badge } from '../components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../components/ui/select';
import { format, isPast, parseISO } from 'date-fns';
import TaskFormEnhanced from '../components/tasks/TaskFormEnhanced';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '../components/ui/dropdown-menu';

const statusColors = {
  pending: 'bg-slate-100 text-slate-700',
  in_progress: 'bg-blue-100 text-blue-700',
  completed: 'bg-green-100 text-green-700',
  blocked: 'bg-red-100 text-red-700',
};

const priorityColors = {
  low: 'bg-slate-100 text-slate-600',
  medium: 'bg-yellow-100 text-yellow-700',
  high: 'bg-orange-100 text-orange-700',
  critical: 'bg-red-100 text-red-700',
};

export default function Tasks() {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [showForm, setShowForm] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [parentTaskId, setParentTaskId] = useState(null);
  const [expandedTasks, setExpandedTasks] = useState(new Set());

  const queryClient = useQueryClient();

  const { data: tasks = [], isLoading } = useQuery({
    queryKey: ['allTasks'],
    queryFn: () => base44.entities.TaskChecklist.list('-created_date'),
  });

  const { data: productions = [] } = useQuery({
    queryKey: ['productions'],
    queryFn: () => base44.entities.Production.list(),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.TaskChecklist.update(id, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['allTasks'] }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.TaskChecklist.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['allTasks'] }),
  });

  const getProductionName = (productionId) => {
    const production = productions.find(p => p.id === productionId);
    return production?.name || 'Unknown';
  };

  // Filter and organize tasks (parent tasks only at top level)
  const filteredTasks = tasks.filter(task => {
    if (task.parent_task_id) return false; // Sub-tasks shown under parents
    const matchesSearch = 
      task.task_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      task.assigned_to?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || task.completion_status === statusFilter;
    const matchesPriority = priorityFilter === 'all' || task.priority === priorityFilter;
    return matchesSearch && matchesStatus && matchesPriority;
  });

  const getSubTasks = (taskId) => tasks.filter(t => t.parent_task_id === taskId);
  const getDependencies = (task) => {
    try {
      const deps = task.depends_on ? JSON.parse(task.depends_on) : [];
      return deps.map(id => tasks.find(t => t.id === id)).filter(Boolean);
    } catch { return []; }
  };
  const isOverdue = (task) => task.due_date && isPast(parseISO(task.due_date)) && task.completion_status !== 'completed';
  
  const toggleExpand = (taskId) => {
    const newExpanded = new Set(expandedTasks);
    if (newExpanded.has(taskId)) {
      newExpanded.delete(taskId);
    } else {
      newExpanded.add(taskId);
    }
    setExpandedTasks(newExpanded);
  };

  const toggleTaskStatus = (task) => {
    updateMutation.mutate({
      id: task.id,
      data: { 
        completion_status: task.completion_status === 'completed' ? 'pending' : 'completed' 
      }
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">All Tasks</h1>
          <p className="text-slate-500">Task checklist across all productions</p>
        </div>
        <Button onClick={() => { setEditingTask(null); setParentTaskId(null); setShowForm(true); }}>
          <Plus className="w-4 h-4 mr-2" />
          New Task
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input
            placeholder="Search tasks..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-36">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="in_progress">In Progress</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
            <SelectItem value="blocked">Blocked</SelectItem>
          </SelectContent>
        </Select>
        <Select value={priorityFilter} onValueChange={setPriorityFilter}>
          <SelectTrigger className="w-full sm:w-36">
            <SelectValue placeholder="Priority" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Priority</SelectItem>
            <SelectItem value="low">Low</SelectItem>
            <SelectItem value="medium">Medium</SelectItem>
            <SelectItem value="high">High</SelectItem>
            <SelectItem value="critical">Critical</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Tasks List */}
      {isLoading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-slate-400" />
        </div>
      ) : filteredTasks.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <CheckCircle2 className="w-12 h-12 text-green-400 mb-4" />
            <h3 className="text-lg font-medium text-slate-900 mb-1">No tasks found</h3>
            <p className="text-slate-500 mb-4">
              {searchTerm || statusFilter !== 'all' || priorityFilter !== 'all'
                ? 'Try adjusting your filters' 
                : 'Tasks are created within productions'}
            </p>
            <Link to={createPageUrl('Productions')}>
              <Button variant="outline">
                <Theater className="w-4 h-4 mr-2" />
                Go to Productions
              </Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {filteredTasks.map((task) => {
            const subTasks = getSubTasks(task.id);
            const dependencies = getDependencies(task);
            const hasSubTasks = subTasks.length > 0;
            const isExpanded = expandedTasks.has(task.id);
            const overdue = isOverdue(task);

            return (
              <div key={task.id}>
                <Card className={`hover:shadow-sm transition-shadow ${overdue ? 'border-red-200' : ''}`}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex items-center gap-3 flex-1">
                        {hasSubTasks && (
                          <button onClick={() => toggleExpand(task.id)} className="p-1">
                            <ChevronRight className={`w-4 h-4 transition-transform ${isExpanded ? 'rotate-90' : ''}`} />
                          </button>
                        )}
                        <button
                          onClick={() => toggleTaskStatus(task)}
                          className={`w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-colors ${
                            task.completion_status === 'completed' 
                              ? 'bg-green-500 border-green-500' 
                              : 'border-slate-300 hover:border-green-400'
                          }`}
                        >
                          {task.completion_status === 'completed' && (
                            <CheckCircle2 className="w-4 h-4 text-white" />
                          )}
                        </button>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <p className={`font-medium ${task.completion_status === 'completed' ? 'line-through text-slate-400' : 'text-slate-900'}`}>
                              {task.task_name}
                            </p>
                            {task.is_recurring && (
                              <RefreshCw className="w-3 h-3 text-purple-500" title="Recurring" />
                            )}
                            {dependencies.length > 0 && (
                              <LinkIcon className="w-3 h-3 text-blue-500" title={`Depends on ${dependencies.length} task(s)`} />
                            )}
                            {hasSubTasks && (
                              <Badge variant="outline" className="text-xs">
                                <ListTree className="w-3 h-3 mr-1" />
                                {subTasks.filter(s => s.completion_status === 'completed').length}/{subTasks.length}
                              </Badge>
                            )}
                          </div>
                          <div className="flex flex-wrap items-center gap-2 mt-1 text-xs text-slate-500">
                            {task.production_id && (
                              <Link 
                                to={createPageUrl(`ProductionDetail?id=${task.production_id}`)}
                                className="hover:text-blue-600"
                              >
                                {getProductionName(task.production_id)}
                              </Link>
                            )}
                            {task.assigned_to && (
                              <>
                                <span>•</span>
                                <span>{task.assigned_to}</span>
                              </>
                            )}
                            {task.due_date && (
                              <>
                                <span>•</span>
                                <span className={`flex items-center gap-1 ${overdue ? 'text-red-600 font-medium' : ''}`}>
                                  <Clock className="w-3 h-3" />
                                  {format(new Date(task.due_date), 'MMM d')}
                                  {overdue && ' (Overdue)'}
                                </span>
                              </>
                            )}
                            {task.category && (
                              <>
                                <span>•</span>
                                <span className="capitalize">{task.category}</span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge className={priorityColors[task.priority]}>
                          {task.priority}
                        </Badge>
                        <Badge className={statusColors[task.completion_status]}>
                          {task.completion_status?.replace('_', ' ')}
                        </Badge>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreVertical className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => { setEditingTask(task); setParentTaskId(null); setShowForm(true); }}>
                              <Pencil className="w-4 h-4 mr-2" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => { setEditingTask(null); setParentTaskId(task.id); setShowForm(true); }}>
                              <Plus className="w-4 h-4 mr-2" />
                              Add Sub-Task
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => deleteMutation.mutate(task.id)} className="text-red-600">
                              <Trash2 className="w-4 h-4 mr-2" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Sub-tasks */}
                {isExpanded && hasSubTasks && (
                  <div className="ml-8 mt-1 space-y-1">
                    {subTasks.map(subTask => (
                      <Card key={subTask.id} className="border-l-4 border-l-slate-200">
                        <CardContent className="p-3">
                          <div className="flex items-center justify-between gap-3">
                            <div className="flex items-center gap-2 flex-1">
                              <button
                                onClick={() => toggleTaskStatus(subTask)}
                                className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                                  subTask.completion_status === 'completed' 
                                    ? 'bg-green-500 border-green-500' 
                                    : 'border-slate-300'
                                }`}
                              >
                                {subTask.completion_status === 'completed' && (
                                  <CheckCircle2 className="w-3 h-3 text-white" />
                                )}
                              </button>
                              <span className={`text-sm ${subTask.completion_status === 'completed' ? 'line-through text-slate-400' : ''}`}>
                                {subTask.task_name}
                              </span>
                            </div>
                            <Badge variant="outline" className="text-xs">
                              {subTask.completion_status?.replace('_', ' ')}
                            </Badge>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      <TaskFormEnhanced
        open={showForm}
        onClose={() => { setShowForm(false); setEditingTask(null); setParentTaskId(null); }}
        task={editingTask}
        productions={productions}
        parentTaskId={parentTaskId}
      />
    </div>
  );
}