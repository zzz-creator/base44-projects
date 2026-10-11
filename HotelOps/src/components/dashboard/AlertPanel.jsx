import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { Badge } from "../../components/ui/badge";
import { AlertTriangle, AlertCircle, Info, CheckCircle } from 'lucide-react';
import { cn } from "../../lib/utils";

export default function AlertPanel({ alerts = [] }) {
  const getAlertIcon = (severity) => {
    switch (severity) {
      case 'critical': return AlertTriangle;
      case 'warning': return AlertCircle;
      case 'info': return Info;
      case 'success': return CheckCircle;
      default: return Info;
    }
  };

  const getAlertColor = (severity) => {
    switch (severity) {
      case 'critical': return 'bg-red-100 border-red-300 text-red-800';
      case 'warning': return 'bg-yellow-100 border-yellow-300 text-yellow-800';
      case 'info': return 'bg-blue-100 border-blue-300 text-blue-800';
      case 'success': return 'bg-green-100 border-green-300 text-green-800';
      default: return 'bg-slate-100 border-slate-300 text-slate-800';
    }
  };

  return (
    <Card className="h-full">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-semibold uppercase tracking-wide">System Alerts</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2 max-h-96 overflow-y-auto">
        {alerts.length === 0 ? (
          <div className="text-center py-8 text-slate-400">
            <CheckCircle className="w-12 h-12 mx-auto mb-2" />
            <p className="text-sm">All systems operational</p>
          </div>
        ) : (
          alerts.map((alert, idx) => {
            const Icon = getAlertIcon(alert.severity);
            return (
              <div
                key={idx}
                className={cn("p-3 rounded-lg border flex items-start gap-3", getAlertColor(alert.severity))}
              >
                <Icon className="w-4 h-4 mt-0.5 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium">{alert.title}</p>
                  <p className="text-xs mt-1 opacity-90">{alert.message}</p>
                  <p className="text-xs mt-1 opacity-75">{alert.timestamp}</p>
                </div>
              </div>
            );
          })
        )}
      </CardContent>
    </Card>
  );
}