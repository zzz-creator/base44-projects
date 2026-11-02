import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '../../api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Checkbox } from '../../components/ui/checkbox';
import { Badge } from '../../components/ui/badge';
import { Progress } from '../../components/ui/progress';
import { Loader2, CheckCircle2, Clock } from 'lucide-react';



const defaultChecklist = [
  { title: 'Complete employee paperwork', completed: false },
  { title: 'Safety orientation and training', completed: false },
  { title: 'Equipment familiarization', completed: false },
  { title: 'Assign locker/workspace', completed: false },
  { title: 'Introduction to team members', completed: false },
  { title: 'Review policies and procedures', completed: false },
  { title: 'Set up system access credentials', completed: false },
  { title: 'Schedule shadowing session', completed: false },
];

export default function CrewOnboardingManager({ crewMemberId, crewMemberName }) {
  const [showForm, setShowForm] = useState(false);
  const queryClient = useQueryClient();

  const { data: onboarding, isLoading } = useQuery({
    queryKey: ['crewOnboarding', crewMemberId],
    queryFn: async () => {
      const results = await base44.entities.CrewOnboarding.filter({ crew_member_id: crewMemberId });
      return results[0];
    },
    enabled: !!crewMemberId,
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.CrewOnboarding.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['crewOnboarding', crewMemberId] });
      setShowForm(false);
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.CrewOnboarding.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['crewOnboarding', crewMemberId] });
    },
  });

  const handleStartOnboarding = () => {
    createMutation.mutate({
      crew_member_id: crewMemberId,
      crew_member_name: crewMemberName,
      status: 'in_progress',
      checklist_items: JSON.stringify(defaultChecklist),
      start_date: new Date().toISOString().split('T')[0],
    });
  };

  const handleToggleItem = (index) => {
    const items = JSON.parse(onboarding.checklist_items || '[]');
    items[index].completed = !items[index].completed;
    items[index].completed_date = items[index].completed ? new Date().toISOString() : null;

    const allCompleted = items.every(item => item.completed);
    
    updateMutation.mutate({
      id: onboarding.id,
      data: {
        checklist_items: JSON.stringify(items),
        status: allCompleted ? 'completed' : 'in_progress',
        completion_date: allCompleted ? new Date().toISOString().split('T')[0] : null,
      },
    });
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-8">
        <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
      </div>
    );
  }

  if (!onboarding) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Onboarding Checklist</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <Clock className="w-10 h-10 mx-auto mb-3 text-slate-300" />
            <p className="text-slate-500 mb-4">No onboarding process started</p>
            <Button onClick={handleStartOnboarding} disabled={createMutation.isPending}>
              {createMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Start Onboarding
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  const items = JSON.parse(onboarding.checklist_items || '[]');
  const completedCount = items.filter(i => i.completed).length;
  const progress = (completedCount / items.length) * 100;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg">Onboarding Checklist</CardTitle>
            <div className="flex items-center gap-2 mt-2">
              <Badge variant={onboarding.status === 'completed' ? 'default' : 'outline'}>
                {onboarding.status}
              </Badge>
              <span className="text-sm text-slate-500">
                {completedCount} of {items.length} completed
              </span>
            </div>
          </div>
          {onboarding.status === 'completed' && (
            <CheckCircle2 className="w-8 h-8 text-green-500" />
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <Progress value={progress} className="h-2" />
        
        <div className="space-y-2">
          {items.map((item, index) => (
            <div
              key={index}
              className="flex items-start gap-3 p-3 rounded-lg hover:bg-slate-50 transition-colors"
            >
              <Checkbox
                checked={item.completed}
                onCheckedChange={() => handleToggleItem(index)}
                className="mt-0.5"
              />
              <div className="flex-1">
                <p className={`text-sm ${item.completed ? 'line-through text-slate-400' : 'text-slate-900'}`}>
                  {item.title}
                </p>
                {item.completed && item.completed_date && (
                  <p className="text-xs text-slate-400 mt-1">
                    Completed {new Date(item.completed_date).toLocaleDateString()}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}