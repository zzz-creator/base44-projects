import React from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { base44 } from '../../api/base44Client';
import PullToRefresh from '../../components/mobile/PullToRefresh';
import { format, formatDistanceToNow } from 'date-fns';
import {
  Activity,
  MessageSquare,
  CheckCircle2,
  AlertTriangle,
  Users,
  ListTodo,
  DollarSign,
  RefreshCw,
  Loader2
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { ScrollArea } from '../../components/ui/scroll-area';

const activityIcons = {
  comment: MessageSquare,
  task_created: ListTodo,
  task_completed: CheckCircle2,
  task_updated: RefreshCw,
  incident_logged: AlertTriangle,
  incident_resolved: CheckCircle2,
  crew_assigned: Users,
  status_change: RefreshCw,
  budget_update: DollarSign
};

const activityColors = {
  comment: 'bg-blue-100 text-blue-600',
  task_created: 'bg-purple-100 text-purple-600',
  task_completed: 'bg-green-100 text-green-600',
  task_updated: 'bg-amber-100 text-amber-600',
  incident_logged: 'bg-red-100 text-red-600',
  incident_resolved: 'bg-green-100 text-green-600',
  crew_assigned: 'bg-indigo-100 text-indigo-600',
  status_change: 'bg-slate-100 text-slate-600',
  budget_update: 'bg-emerald-100 text-emerald-600'
};

export default function ActivityFeed({ productionId, limit = 20 }) {
  const queryClient = useQueryClient();

  const { data: activities = [], isLoading, refetch } = useQuery({
    queryKey: ['activityLog', productionId],
    queryFn: async () => {
      if (productionId) {
        return base44.entities.ActivityLog.filter(
          { production_id: productionId }, 
          '-created_date', 
          limit
        );
      }
      return base44.entities.ActivityLog.list('-created_date', limit);
    },
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  const handleRefresh = async () => {
    await queryClient.invalidateQueries({ 
      queryKey: ['activityLog', productionId] 
    });
  };

  const groupActivitiesByDate = (activities) => {
    const groups = {};
    activities.forEach(activity => {
      const date = activity.created_date 
        ? format(new Date(activity.created_date), 'yyyy-MM-dd')
        : 'unknown';
      if (!groups[date]) groups[date] = [];
      groups[date].push(activity);
    });
    return groups;
  };

  const groupedActivities = groupActivitiesByDate(activities);

  const formatDateHeader = (dateStr) => {
    if (dateStr === 'unknown') return 'Unknown Date';
    const date = new Date(dateStr);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (format(date, 'yyyy-MM-dd') === format(today, 'yyyy-MM-dd')) {
      return 'Today';
    }
    if (format(date, 'yyyy-MM-dd') === format(yesterday, 'yyyy-MM-dd')) {
      return 'Yesterday';
    }
    return format(date, 'EEEE, MMMM d');
  };

  return (
    <PullToRefresh onRefresh={handleRefresh}>
      <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <Activity className="w-5 h-5" />
            Activity Feed
          </CardTitle>
          <button
            onClick={() => refetch()}
            className="text-slate-400 hover:text-slate-600"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
          </div>
        ) : activities.length === 0 ? (
          <div className="text-center py-8 text-slate-500">
            <Activity className="w-10 h-10 mx-auto mb-2 text-slate-300" />
            <p>No activity yet</p>
          </div>
        ) : (
          <ScrollArea className="h-[400px] pr-4">
            <div className="space-y-6">
              {Object.entries(groupedActivities).map(([date, dayActivities]) => (
                <div key={date}>
                  <h4 className="text-xs font-semibold text-slate-500 uppercase mb-3">
                    {formatDateHeader(date)}
                  </h4>
                  <div className="space-y-3">
                    {dayActivities.map(activity => {
                      const Icon = activityIcons[activity.activity_type] || Activity;
                      const colorClass = activityColors[activity.activity_type] || 'bg-slate-100 text-slate-600';
                      
                      return (
                        <div key={activity.id} className="flex gap-3">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${colorClass}`}>
                            <Icon className="w-4 h-4" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm text-slate-700">
                              {activity.description}
                            </p>
                            <div className="flex items-center gap-2 mt-1">
                              <span className="text-xs text-slate-400">
                                {activity.created_date && formatDistanceToNow(new Date(activity.created_date), { addSuffix: true })}
                              </span>
                              {activity.user_name && (
                                <>
                                  <span className="text-xs text-slate-300">•</span>
                                  <span className="text-xs text-slate-500">{activity.user_name}</span>
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
    </PullToRefresh>
  );
}