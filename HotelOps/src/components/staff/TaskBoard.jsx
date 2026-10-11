import React from 'react';
import { db } from '../dataClient';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/tabs';
import { CheckCircle2, Clock, AlertCircle, PlayCircle } from 'lucide-react';
import { toast } from 'sonner';

export default function TaskBoard({ staffMember }) {
  const queryClient = useQueryClient();

  const { data: tasks = [] } = useQuery({
    queryKey: ['staff-tasks', staffMember?.id],
    queryFn: () => staffMember ? db.entities.StaffTask.filter({ assigned_to: staffMember.id }) : [],
    enabled: !!staffMember
  });

  const updateTaskMutation = useMutation({
    mutationFn: ({ id, status }) => db.entities.StaffTask.update(id, {
      status,
      ...(status === 'in_progress' && { started_date: new Date().toISOString() }),
      ...(status === 'completed' && { completed_date: new Date().toISOString() })
    }),
    onSuccess: () => {
      queryClient.invalidateQueries();
      toast.success('Task updated!');
    }
  });

  const getPriorityColor = (priority) => {
    const colors = {
      low: 'bg-slate-100 text-slate-800',
      medium: 'bg-blue-100 text-blue-800',
      high: 'bg-orange-100 text-orange-800',
      urgent: 'bg-red-100 text-red-800'
    };
    return colors[priority] || colors.medium;
  };

  const pendingTasks = tasks.filter(t => t.status === 'pending');
  const inProgressTasks = tasks.filter(t => t.status === 'in_progress');
  const completedTasks = tasks.filter(t => t.status === 'completed');

  return (
    <Card>
      <CardHeader>
        <CardTitle>My Tasks</CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="pending">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="pending">
              Pending ({pendingTasks.length})
            </TabsTrigger>
            <TabsTrigger value="in_progress">
              In Progress ({inProgressTasks.length})
            </TabsTrigger>
            <TabsTrigger value="completed">
              Completed ({completedTasks.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="pending" className="space-y-3">
            {pendingTasks.map(task => (
              <Card key={task.id}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge className={getPriorityColor(task.priority)}>
                          {task.priority}
                        </Badge>
                        <Badge variant="outline">{task.task_type.replace('_', ' ')}</Badge>
                      </div>
                      <p className="font-medium">{task.description}</p>
                      <p className="text-xs text-slate-500 mt-1">
                        Created: {new Date(task.created_date).toLocaleString()}
                      </p>
                    </div>
                    <Button 
                      size="sm"
                      onClick={() => updateTaskMutation.mutate({ id: task.id, status: 'in_progress' })}
                    >
                      <PlayCircle className="w-4 h-4 mr-1" />
                      Start
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
            {pendingTasks.length === 0 && (
              <p className="text-center text-slate-500 py-8">No pending tasks</p>
            )}
          </TabsContent>

          <TabsContent value="in_progress" className="space-y-3">
            {inProgressTasks.map(task => (
              <Card key={task.id} className="border-blue-200">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge className={getPriorityColor(task.priority)}>
                          {task.priority}
                        </Badge>
                        <Badge variant="outline">{task.task_type.replace('_', ' ')}</Badge>
                      </div>
                      <p className="font-medium">{task.description}</p>
                      <p className="text-xs text-slate-500 mt-1">
                        Started: {new Date(task.started_date).toLocaleString()}
                      </p>
                    </div>
                    <Button 
                      size="sm"
                      onClick={() => updateTaskMutation.mutate({ id: task.id, status: 'completed' })}
                    >
                      <CheckCircle2 className="w-4 h-4 mr-1" />
                      Complete
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
            {inProgressTasks.length === 0 && (
              <p className="text-center text-slate-500 py-8">No tasks in progress</p>
            )}
          </TabsContent>

          <TabsContent value="completed" className="space-y-3">
            {completedTasks.slice(0, 10).map(task => (
              <Card key={task.id} className="opacity-60">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-1">
                    <CheckCircle2 className="w-4 h-4 text-green-600" />
                    <Badge variant="outline">{task.task_type.replace('_', ' ')}</Badge>
                  </div>
                  <p className="font-medium">{task.description}</p>
                  <p className="text-xs text-slate-500 mt-1">
                    Completed: {new Date(task.completed_date).toLocaleString()}
                  </p>
                </CardContent>
              </Card>
            ))}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}