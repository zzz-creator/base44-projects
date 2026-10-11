import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '../../api/base44Client';
import { Card } from '../ui/card';
import { Badge } from '../ui/badge';
import { Bell, AlertTriangle } from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../../utils';

export default function RecentAlertsWidget({ limit = 5 }) {
  const { data: alerts } = useQuery({
    queryKey: ['recent-alerts'],
    queryFn: async () => {
      const allAlerts = await base44.entities.Alert.list('-updated_date', limit * 2);
      return allAlerts.filter(a => a.is_active && (a.trigger_count || 0) > 0).slice(0, limit);
    },
    initialData: [],
    refetchInterval: 30000
  });

  const getSeverityColor = (severity) => {
    const colors = {
      low: 'bg-green-500/20 text-green-400 border-green-500/30',
      medium: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
      high: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
      critical: 'bg-red-500/20 text-red-400 border-red-500/30'
    };
    return colors[severity] || colors.medium;
  };

  return (
    <Card className="bg-slate-950/80 backdrop-blur-xl cyber-border p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Bell className="w-5 h-5 text-cyan-400 animate-pulse" />
          <h3 className="text-lg font-bold text-cyan-400 font-mono">RECENT ALERTS</h3>
        </div>
        <Link 
          to={createPageUrl('AlertsManagement')}
          className="text-xs text-cyan-400 hover:text-cyan-300 font-mono"
        >
          MANAGE →
        </Link>
      </div>

      {alerts.length === 0 ? (
        <div className="text-center py-4">
          <AlertTriangle className="w-8 h-8 text-slate-600 mx-auto mb-2" />
          <p className="text-slate-400 font-mono text-xs">No recent alerts triggered</p>
        </div>
      ) : (
        <div className="space-y-2">
          {alerts.map((alert) => (
            <div 
              key={alert.id} 
              className="bg-slate-900/50 cyber-border rounded p-3 hover:bg-slate-900/70 transition-colors"
            >
              <div className="flex items-start justify-between mb-1">
                <h4 className="text-sm font-bold text-green-400 font-mono">{alert.alert_name}</h4>
                <Badge className={`${getSeverityColor(alert.severity_threshold)} font-mono text-xs`}>
                  {alert.severity_threshold}
                </Badge>
              </div>
              <div className="text-xs text-slate-400 font-mono">
                Triggered: {alert.trigger_count || 0}x
              </div>
              {alert.last_triggered && (
                <div className="text-xs text-slate-500 font-mono mt-1">
                  Last: {new Date(alert.last_triggered).toLocaleString()}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}