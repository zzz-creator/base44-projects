import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../../components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "../../components/ui/alert";
import { Badge } from '../../components/ui/badge';
import { Button } from '../../components/ui/button';
import { Wrench, AlertTriangle, Clock, TrendingUp, CheckCircle2 } from 'lucide-react';
import { format } from 'date-fns';

export default function MaintenanceAlerts({ alerts, onAcknowledge, onSchedule }) {
  const getSeverityIcon = (severity) => {
    switch (severity) {
      case 'critical': return <AlertTriangle className="w-4 h-4" />;
      case 'high': return <AlertTriangle className="w-4 h-4" />;
      case 'medium': return <Clock className="w-4 h-4" />;
      default: return <Wrench className="w-4 h-4" />;
    }
  };

  const getSeverityColor = (severity) => {
    switch (severity) {
      case 'critical': return 'destructive';
      case 'high': return 'destructive';
      case 'medium': return 'default';
      default: return 'secondary';
    }
  };

  const pendingAlerts = alerts?.filter(a => a.status === 'pending') || [];
  const acknowledgedAlerts = alerts?.filter(a => a.status === 'acknowledged' || a.status === 'scheduled') || [];

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Wrench className="w-5 h-5" />
              Predictive Maintenance Alerts
            </CardTitle>
            <CardDescription>AI-detected maintenance needs</CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="destructive">{pendingAlerts.length} Pending</Badge>
            <Badge variant="secondary">{acknowledgedAlerts.length} In Progress</Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {pendingAlerts.length > 0 ? (
          pendingAlerts.map((alert) => (
            <Alert key={alert.id} className="border-l-4 border-l-red-500">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    {getSeverityIcon(alert.severity)}
                    <AlertTitle className="mb-0">
                      {alert.asset_type.replace('_', ' ').toUpperCase()} - {alert.issue_description}
                    </AlertTitle>
                    <Badge variant={getSeverityColor(alert.severity)} className="ml-2">
                      {alert.severity}
                    </Badge>
                    {alert.alert_type === 'predictive' && (
                      <Badge variant="outline" className="ml-1">
                        <TrendingUp className="w-3 h-3 mr-1" />
                        AI Predicted
                      </Badge>
                    )}
                  </div>
                  <AlertDescription>
                    <div className="space-y-1 text-sm">
                      <p><strong>Recommended Action:</strong> {alert.recommended_action}</p>
                      {alert.predicted_failure_date && (
                        <p className="text-orange-600">
                          <strong>Predicted Failure:</strong> {format(new Date(alert.predicted_failure_date), 'PPP')}
                        </p>
                      )}
                      {alert.confidence_score && (
                        <p className="text-slate-600">
                          <strong>AI Confidence:</strong> {alert.confidence_score}%
                        </p>
                      )}
                    </div>
                  </AlertDescription>
                </div>
                <div className="flex flex-col gap-2 ml-4">
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={() => onAcknowledge && onAcknowledge(alert.id)}
                  >
                    <CheckCircle2 className="w-3 h-3 mr-1" />
                    Acknowledge
                  </Button>
                  <Button 
                    size="sm"
                    onClick={() => onSchedule && onSchedule(alert.id)}
                  >
                    <Clock className="w-3 h-3 mr-1" />
                    Schedule
                  </Button>
                </div>
              </div>
            </Alert>
          ))
        ) : (
          <div className="text-center py-8 text-slate-500">
            <CheckCircle2 className="w-12 h-12 mx-auto mb-2 text-green-500 opacity-50" />
            <p className="font-medium">All systems operational</p>
            <p className="text-xs">No maintenance alerts at this time</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}