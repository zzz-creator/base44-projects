import React, { useState, useEffect } from 'react';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { base44 } from '../../api/base44Client';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '../../components/ui/dialog';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../components/ui/select';
import { Loader2 } from 'lucide-react';
import { notifyTaskAssigned } from '../../components/notifications/NotificationService';

const initialFormState = {
  task_name: '',
  assigned_to: '',
  due_date: '',
  completion_status: 'pending',
  priority: 'medium',
};

export default function TaskForm({ open, onClose, task, productionId, crewMembers = [] }) {
  const [formData, setFormData] = useState(initialFormState);
  const queryClient = useQueryClient();

  const { data: currentUser } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me()
  });

  const { data: productions = [] } = useQuery({
    queryKey: ['productions'],
    queryFn: () => base44.entities.Production.list()
  });

  useEffect(() => {
    if (task) {
      setFormData({
        task_name: task.task_name || '',
        assigned_to: task.assigned_to || '',
        due_date: task.due_date || '',
        completion_status: task.completion_status || 'pending',
        priority: task.priority || 'medium',
      });
    } else {
      setFormData(initialFormState);
    }
  }, [task, open]);

  const createMutation = useMutation({
    mutationFn: async (data) => {
      const newTask = await base44.entities.TaskChecklist.create(data);
      
      // Notify assignee if task is assigned
      if (data.assigned_to) {
        const assignee = crewMembers.find(c => c.crew_member_name === data.assigned_to);
        const production = productions.find(p => p.id === productionId);
        
        if (assignee?.contact_info && assignee.contact_info.includes('@') && production) {
          await notifyTaskAssigned({
            task: newTask,
            production,
            assigneeEmail: assignee.contact_info,
            assignerName: currentUser?.full_name || 'Someone'
          });
        }
      }
      
      return newTask;
    },
    onMutate: async (newTask) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['tasks'] });
      
      // Snapshot previous value
      const previousTasks = queryClient.getQueryData(['tasks', productionId]);
      
      // Optimistically update
      queryClient.setQueryData(['tasks', productionId], (old) => [
        ...(old || []),
        { ...newTask, id: 'temp-' + Date.now(), created_date: new Date().toISOString() }
      ]);
      
      return { previousTasks };
    },
    onError: (err, newTask, context) => {
      // Rollback on error
      queryClient.setQueryData(['tasks', productionId], context.previousTasks);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      onClose();
    },
  });

  const updateMutation = useMutation({
    mutationFn: (data) => base44.entities.TaskChecklist.update(task.id, data),
    onMutate: async (updatedTask) => {
      await queryClient.cancelQueries({ queryKey: ['tasks'] });
      const previousTasks = queryClient.getQueryData(['tasks', productionId]);
      
      queryClient.setQueryData(['tasks', productionId], (old) =>
        (old || []).map((t) => t.id === task.id ? { ...t, ...updatedTask } : t)
      );
      
      return { previousTasks };
    },
    onError: (err, updatedTask, context) => {
      queryClient.setQueryData(['tasks', productionId], context.previousTasks);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      onClose();
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    const data = { ...formData, production_id: productionId };
    
    if (task) {
      updateMutation.mutate(data);
    } else {
      createMutation.mutate(data);
    }
  };

  const isLoading = createMutation.isPending || updateMutation.isPending;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {task ? 'Edit Task' : 'Add Task'}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="task_name">Task Name *</Label>
            <Input
              id="task_name"
              value={formData.task_name}
              onChange={(e) => setFormData({ ...formData, task_name: e.target.value })}
              placeholder="Enter task name"
              required
            />
          </div>

          <div>
            <Label htmlFor="assigned_to">Assigned To</Label>
            <Select
              value={formData.assigned_to}
              onValueChange={(value) => setFormData({ ...formData, assigned_to: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select crew member" />
              </SelectTrigger>
              <SelectContent>
                {crewMembers.map((crew) => (
                  <SelectItem key={crew.id} value={crew.crew_member_name}>
                    {crew.crew_member_name}
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

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="priority">Priority</Label>
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
              <Label htmlFor="completion_status">Status</Label>
              <Select
                value={formData.completion_status}
                onValueChange={(value) => setFormData({ ...formData, completion_status: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="in_progress">In Progress</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="blocked">Blocked</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {task ? 'Update' : 'Add'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}