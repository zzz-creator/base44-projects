import React, { useState, useEffect } from 'react';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { base44 } from '../../api/base44Client';
import { format, addDays, addWeeks, addMonths } from 'date-fns';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '../../components/ui/dialog';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Textarea } from '../../components/ui/textarea';
import { Checkbox } from '../../components/ui/checkbox';
import { Badge } from '../../components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../components/ui/select';
import { Loader2, Link as LinkIcon, RefreshCw, AlertTriangle } from 'lucide-react';
import { notifyTaskAssigned, notifyTaskOverdue } from '../../components/notifications/NotificationService';

const CATEGORIES = [
  { value: 'technical', label: 'Technical' },
  { value: 'administrative', label: 'Administrative' },
  { value: 'creative', label: 'Creative' },
  { value: 'logistics', label: 'Logistics' },
  { value: 'safety', label: 'Safety' },
  { value: 'other', label: 'Other' },
];

const RECURRENCE_PATTERNS = [
  { value: 'daily', label: 'Daily' },
  { value: 'weekly', label: 'Weekly' },
  { value: 'biweekly', label: 'Bi-weekly' },
  { value: 'monthly', label: 'Monthly' },
];

export default function TaskFormEnhanced({ open, onClose, task, productions = [], parentTaskId = null }) {
  const queryClient = useQueryClient();
  
  const [formData, setFormData] = useState({
    production_id: '',
    task_name: '',
    description: '',
    assigned_to: '',
    assigned_to_email: '',
    due_date: '',
    priority: 'medium',
    category: 'other',
    parent_task_id: parentTaskId || '',
    depends_on: [],
    is_recurring: false,
    recurrence_pattern: 'weekly',
    recurrence_end_date: '',
    estimated_hours: '',
  });

  const { data: allTasks = [] } = useQuery({
    queryKey: ['allTasks'],
    queryFn: () => base44.entities.TaskChecklist.list(),
  });

  const { data: crewMembers = [] } = useQuery({
    queryKey: ['crewMembers'],
    queryFn: () => base44.entities.CrewMember.list(),
  });

  const { data: users = [] } = useQuery({
    queryKey: ['users'],
    queryFn: () => base44.entities.User.list(),
  });

  useEffect(() => {
    if (task) {
      let dependsOn = [];
      try {
        dependsOn = task.depends_on ? JSON.parse(task.depends_on) : [];
      } catch { dependsOn = []; }

      setFormData({
        production_id: task.production_id || '',
        task_name: task.task_name || '',
        description: task.description || '',
        assigned_to: task.assigned_to || '',
        assigned_to_email: task.assigned_to_email || '',
        due_date: task.due_date || '',
        priority: task.priority || 'medium',
        category: task.category || 'other',
        parent_task_id: task.parent_task_id || '',
        depends_on: dependsOn,
        is_recurring: task.is_recurring || false,
        recurrence_pattern: task.recurrence_pattern || 'weekly',
        recurrence_end_date: task.recurrence_end_date || '',
        estimated_hours: task.estimated_hours || '',
      });
    } else {
      setFormData({
        production_id: '',
        task_name: '',
        description: '',
        assigned_to: '',
        assigned_to_email: '',
        due_date: '',
        priority: 'medium',
        category: 'other',
        parent_task_id: parentTaskId || '',
        depends_on: [],
        is_recurring: false,
        recurrence_pattern: 'weekly',
        recurrence_end_date: '',
        estimated_hours: '',
      });
    }
  }, [task, open, parentTaskId]);

  const createMutation = useMutation({
    mutationFn: async (data) => {
      const taskData = {
        ...data,
        depends_on: JSON.stringify(data.depends_on),
        estimated_hours: data.estimated_hours ? parseFloat(data.estimated_hours) : null,
      };
      const newTask = await base44.entities.TaskChecklist.create(taskData);
      
      // Send notification if assigned
      if (data.assigned_to_email) {
        await notifyTaskAssigned({
          task: newTask,
          assigneeEmail: data.assigned_to_email,
          assigneeName: data.assigned_to,
        });
      }
      
      return newTask;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      queryClient.invalidateQueries({ queryKey: ['allTasks'] });
      onClose();
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (data) => {
      const previousAssignee = task.assigned_to_email;
      const taskData = {
        ...data,
        depends_on: JSON.stringify(data.depends_on),
        estimated_hours: data.estimated_hours ? parseFloat(data.estimated_hours) : null,
      };
      const updatedTask = await base44.entities.TaskChecklist.update(task.id, taskData);
      
      // Notify if newly assigned
      if (data.assigned_to_email && data.assigned_to_email !== previousAssignee) {
        await notifyTaskAssigned({
          task: updatedTask,
          assigneeEmail: data.assigned_to_email,
          assigneeName: data.assigned_to,
        });
      }
      
      return updatedTask;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      queryClient.invalidateQueries({ queryKey: ['allTasks'] });
      onClose();
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (task) {
      updateMutation.mutate(formData);
    } else {
      createMutation.mutate(formData);
    }
  };

  const handleAssigneeChange = (email) => {
    const person = [...users, ...crewMembers].find(p => p.email === email);
    setFormData({
      ...formData,
      assigned_to_email: email,
      assigned_to: person?.full_name || email,
    });
  };

  const handleDependencyToggle = (taskId) => {
    const deps = formData.depends_on;
    if (deps.includes(taskId)) {
      setFormData({ ...formData, depends_on: deps.filter(id => id !== taskId) });
    } else {
      setFormData({ ...formData, depends_on: [...deps, taskId] });
    }
  };

  // Get available tasks for dependencies (same production, not self, not circular)
  const availableDependencies = allTasks.filter(t => 
    t.production_id === formData.production_id && 
    t.id !== task?.id &&
    !t.parent_task_id // Don't depend on sub-tasks
  );

  // Get sub-tasks if editing
  const subTasks = task ? allTasks.filter(t => t.parent_task_id === task.id) : [];

  const isLoading = createMutation.isPending || updateMutation.isPending;
  const allPeople = [...users, ...crewMembers.filter(c => c.email && !users.find(u => u.email === c.email))];

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {task ? 'Edit Task' : parentTaskId ? 'Add Sub-Task' : 'Add Task'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          <div>
            <Label htmlFor="production">Production *</Label>
            <Select
              value={formData.production_id}
              onValueChange={(value) => setFormData({ ...formData, production_id: value })}
              required
            >
              <SelectTrigger>
                <SelectValue placeholder="Select production" />
              </SelectTrigger>
              <SelectContent>
                {productions.map(prod => (
                  <SelectItem key={prod.id} value={prod.id}>{prod.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="task_name">Task Name *</Label>
            <Input
              id="task_name"
              value={formData.task_name}
              onChange={(e) => setFormData({ ...formData, task_name: e.target.value })}
              required
            />
          </div>

          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={2}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Assigned To</Label>
              <Select
                value={formData.assigned_to_email}
                onValueChange={handleAssigneeChange}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select person" />
                </SelectTrigger>
                <SelectContent>
                  {allPeople.map(person => (
                    <SelectItem key={person.id} value={person.email}>
                      {person.full_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="due_date">Due Date</Label>
              <Input
                id="due_date"
                type="date"
                value={formData.due_date}
                onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <Label>Priority</Label>
              <Select
                value={formData.priority}
                onValueChange={(value) => setFormData({ ...formData, priority: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="critical">Critical</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Category</Label>
              <Select
                value={formData.category}
                onValueChange={(value) => setFormData({ ...formData, category: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map(cat => (
                    <SelectItem key={cat.value} value={cat.value}>{cat.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="estimated_hours">Est. Hours</Label>
              <Input
                id="estimated_hours"
                type="number"
                min="0"
                step="0.5"
                value={formData.estimated_hours}
                onChange={(e) => setFormData({ ...formData, estimated_hours: e.target.value })}
              />
            </div>
          </div>

          {/* Recurring Task */}
          {!parentTaskId && (
            <div className="border rounded-lg p-3 space-y-3">
              <div className="flex items-center gap-2">
                <Checkbox
                  id="is_recurring"
                  checked={formData.is_recurring}
                  onCheckedChange={(checked) => setFormData({ ...formData, is_recurring: checked })}
                />
                <Label htmlFor="is_recurring" className="flex items-center gap-2 cursor-pointer">
                  <RefreshCw className="w-4 h-4" />
                  Recurring Task
                </Label>
              </div>
              
              {formData.is_recurring && (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-xs">Repeat</Label>
                    <Select
                      value={formData.recurrence_pattern}
                      onValueChange={(value) => setFormData({ ...formData, recurrence_pattern: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {RECURRENCE_PATTERNS.map(p => (
                          <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="text-xs">Until</Label>
                    <Input
                      type="date"
                      value={formData.recurrence_end_date}
                      onChange={(e) => setFormData({ ...formData, recurrence_end_date: e.target.value })}
                    />
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Dependencies */}
          {formData.production_id && availableDependencies.length > 0 && !parentTaskId && (
            <div className="border rounded-lg p-3">
              <Label className="flex items-center gap-2 mb-2">
                <LinkIcon className="w-4 h-4" />
                Task Dependencies
              </Label>
              <p className="text-xs text-muted-foreground mb-2">
                This task will be blocked until selected tasks are completed
              </p>
              <div className="space-y-1 max-h-32 overflow-y-auto">
                {availableDependencies.map(depTask => (
                  <div key={depTask.id} className="flex items-center gap-2">
                    <Checkbox
                      id={`dep-${depTask.id}`}
                      checked={formData.depends_on.includes(depTask.id)}
                      onCheckedChange={() => handleDependencyToggle(depTask.id)}
                    />
                    <Label htmlFor={`dep-${depTask.id}`} className="text-sm cursor-pointer">
                      {depTask.task_name}
                    </Label>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Show existing sub-tasks */}
          {subTasks.length > 0 && (
            <div className="border rounded-lg p-3">
              <Label className="mb-2 block">Sub-Tasks ({subTasks.length})</Label>
              <div className="space-y-1">
                {subTasks.map(sub => (
                  <div key={sub.id} className="flex items-center gap-2 text-sm">
                    <Badge variant={sub.completion_status === 'completed' ? 'secondary' : 'outline'}>
                      {sub.completion_status}
                    </Badge>
                    <span>{sub.task_name}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {task ? 'Update' : 'Create'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}