import React from 'react';
import { db } from '../dataClient';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { Bell, AlertTriangle, Sparkles, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';

export default function AlertsPanel({ staffMember }) {
  const queryClient = useQueryClient();

  const { data: alerts = [] } = useQuery({
    queryKey: ['staff-alerts', staffMember?.role],
    queryFn: async () => {
      if (!staffMember) return [];
      const allAlerts = await db.entities.StaffAlert.list('-created_date');
      return allAlerts.filter(a => 
        a.status !== 'resolved' && 
        (a.target_role === staffMember.role || a.assigned_to === staffMember.id)
      );
    },
    enabled: !!staffMember
  });

  const acknowledgeMutation = useMutation({
    mutationFn: ({ id }) => db.entities.StaffAlert.update(id, {
      status: 'acknowledged',
      acknowledged_by: staffMember?.id,
      acknowledged_date: new Date().toISOString()
    }),
    onSuccess: () => {
      queryClient.invalidateQueries();
      toast.success('Alert acknowledged');
    }
  });

  const resolveMutation = useMutation({
    mutationFn: ({ id }) => db.entities.StaffAlert.update(id, {
      status: 'resolved'
    }),
    onSuccess: () => {
      queryClient.invalidateQueries();
      toast.success('Alert resolved');
    }
  });

  const getSeverityColor = (severity) => {
    const colors = {
      low: 'bg-blue-100 text-blue-800',
      medium: 'bg-yellow-100 text-yellow-800',
      high: 'bg-orange-100 text-orange-800',
      critical: 'bg-red-100 text-red-800'
    };
    return colors[severity] || colors.medium;
  };

  const unreadAlerts = alerts.filter(a => a.status === 'unread');
  const acknowledgedAlerts = alerts.filter(a => a.status === 'acknowledged');

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bell className="w-5 h-5" />
          Alerts & Notifications
          {unreadAlerts.length > 0 && (
            <Badge className="bg-red-500">{unreadAlerts.length}</Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {unreadAlerts.map(alert => (
          <Card key={alert.id} className="border-2 border-red-200">
            <CardContent className="p-4">
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <Badge className={getSeverityColor(alert.severity)}>
                      {alert.severity}
                    </Badge>
                    <Badge variant="outline">{alert.alert_type.replace('_', ' ')}</Badge>
                    {alert.ai_generated && (
                      <Badge variant="outline" className="bg-purple-50">
                        <Sparkles className="w-3 h-3 mr-1" />
                        AI
                      </Badge>
                    )}
                  </div>
                  <p className="font-semibold">{alert.title}</p>
                  <p className="text-sm text-slate-600 mt-1">{alert.message}</p>
                </div>
              </div>
              <div className="flex gap-2 mt-3">
                <Button 
                  size="sm"
                  onClick={() => acknowledgeMutation.mutate({ id: alert.id })}
                >
                  Acknowledge
                </Button>
                <Button 
                  size="sm"
                  variant="outline"
                  onClick={() => resolveMutation.mutate({ id: alert.id })}
                >
                  <CheckCircle2 className="w-4 h-4 mr-1" />
                  Resolve
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}

        {acknowledgedAlerts.map(alert => (
          <Card key={alert.id} className="opacity-60">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-1">
                <Badge className={getSeverityColor(alert.severity)}>{alert.severity}</Badge>
                <Badge variant="outline">Acknowledged</Badge>
              </div>
              <p className="font-medium">{alert.title}</p>
              <Button 
                size="sm"
                variant="outline"
                className="mt-2"
                onClick={() => resolveMutation.mutate({ id: alert.id })}
              >
                <CheckCircle2 className="w-4 h-4 mr-1" />
                Resolve
              </Button>
            </CardContent>
          </Card>
        ))}

        {alerts.length === 0 && (
          <p className="text-center text-slate-500 py-8">No active alerts</p>
        )}
      </CardContent>
    </Card>
  );
}