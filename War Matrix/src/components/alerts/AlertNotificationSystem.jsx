import React, { useEffect, useState, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '../../api/base44Client';
import { toast } from 'sonner';
import { AlertTriangle, Bell, Activity, DollarSign, Users } from 'lucide-react';

export default function AlertNotificationSystem() {
  const lastThresholdCheck = useRef({});
  const [currentMetrics, setCurrentMetrics] = useState({
    threatLevel: 0,
    activeConflicts: 0,
    economicImpact: 0,
    casualties: 0
  });

  const { data: alerts } = useQuery({
    queryKey: ['active-alerts'],
    queryFn: async () => {
      try {
        const user = await base44.auth.me();
        return base44.entities.Alert.filter({ created_by: user.email, is_active: true });
      } catch {
        return [];
      }
    },
    initialData: [],
    refetchInterval: 60000
  });

  const { data: currentWars } = useQuery({
    queryKey: ['wars', 'current'],
    queryFn: () => base44.entities.War.filter({ era: 'current', status: 'ongoing' }),
    initialData: [],
    refetchInterval: 60000
  });

  const { data: userProfile } = useQuery({
    queryKey: ['userProfile-alerts'],
    queryFn: async () => {
      try {
        const user = await base44.auth.me();
        const profiles = await base44.entities.UserProfile.filter({ created_by: user.email });
        return profiles[0] || null;
      } catch {
        return null;
      }
    },
    initialData: null,
    refetchInterval: 60000
  });

  // Simulate current metrics (in production, these would come from real data feeds)
  useEffect(() => {
    const updateMetrics = () => {
      setCurrentMetrics({
        threatLevel: 50 + Math.random() * 40,
        activeConflicts: currentWars.length || Math.floor(8 + Math.random() * 8),
        economicImpact: 150 + Math.random() * 100,
        casualties: 8000 + Math.random() * 10000
      });
    };

    updateMetrics();
    const interval = setInterval(updateMetrics, 30000);
    return () => clearInterval(interval);
  }, [currentWars.length]);

  // Check dashboard alert thresholds
  useEffect(() => {
    const thresholds = userProfile?.dashboard_alert_thresholds;
    if (!thresholds?.enabled) return;

    const now = Date.now();
    const COOLDOWN = 300000; // 5 minute cooldown between same alerts

    // Threat Level Check
    if (thresholds.threat_level_threshold && currentMetrics.threatLevel >= thresholds.threat_level_threshold) {
      if (!lastThresholdCheck.current.threatLevel || now - lastThresholdCheck.current.threatLevel > COOLDOWN) {
        lastThresholdCheck.current.threatLevel = now;
        toast.error(
          <div className="flex items-start gap-2">
            <Activity className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
            <div>
              <div className="font-bold text-sm">Threat Level Threshold Exceeded</div>
              <div className="text-xs mt-1">Current: {currentMetrics.threatLevel.toFixed(0)}%</div>
              <div className="text-xs text-slate-400 mt-1">Threshold: {thresholds.threat_level_threshold}%</div>
            </div>
          </div>,
          { duration: 10000, position: 'top-right' }
        );
      }
    }

    // Active Conflicts Check
    if (thresholds.active_conflicts_threshold && currentMetrics.activeConflicts >= thresholds.active_conflicts_threshold) {
      if (!lastThresholdCheck.current.activeConflicts || now - lastThresholdCheck.current.activeConflicts > COOLDOWN) {
        lastThresholdCheck.current.activeConflicts = now;
        toast.warning(
          <div className="flex items-start gap-2">
            <AlertTriangle className="w-5 h-5 text-orange-400 flex-shrink-0 mt-0.5" />
            <div>
              <div className="font-bold text-sm">Active Conflicts Threshold Exceeded</div>
              <div className="text-xs mt-1">Current: {currentMetrics.activeConflicts} conflicts</div>
              <div className="text-xs text-slate-400 mt-1">Threshold: {thresholds.active_conflicts_threshold}</div>
            </div>
          </div>,
          { duration: 10000, position: 'top-right' }
        );
      }
    }

    // Economic Impact Check
    if (thresholds.economic_impact_threshold && currentMetrics.economicImpact >= thresholds.economic_impact_threshold) {
      if (!lastThresholdCheck.current.economicImpact || now - lastThresholdCheck.current.economicImpact > COOLDOWN) {
        lastThresholdCheck.current.economicImpact = now;
        toast.warning(
          <div className="flex items-start gap-2">
            <DollarSign className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-0.5" />
            <div>
              <div className="font-bold text-sm">Economic Impact Threshold Exceeded</div>
              <div className="text-xs mt-1">Current: ${currentMetrics.economicImpact.toFixed(1)}B</div>
              <div className="text-xs text-slate-400 mt-1">Threshold: ${thresholds.economic_impact_threshold}B</div>
            </div>
          </div>,
          { duration: 10000, position: 'top-right' }
        );
      }
    }

    // Casualty Check
    if (thresholds.casualty_threshold && currentMetrics.casualties >= thresholds.casualty_threshold) {
      if (!lastThresholdCheck.current.casualties || now - lastThresholdCheck.current.casualties > COOLDOWN) {
        lastThresholdCheck.current.casualties = now;
        toast.error(
          <div className="flex items-start gap-2">
            <Users className="w-5 h-5 text-purple-400 flex-shrink-0 mt-0.5" />
            <div>
              <div className="font-bold text-sm">Casualty Threshold Exceeded</div>
              <div className="text-xs mt-1">Current: {(currentMetrics.casualties / 1000).toFixed(1)}K</div>
              <div className="text-xs text-slate-400 mt-1">Threshold: {(thresholds.casualty_threshold / 1000).toFixed(0)}K</div>
            </div>
          </div>,
          { duration: 10000, position: 'top-right' }
        );
      }
    }
  }, [currentMetrics, userProfile?.dashboard_alert_thresholds]);

  // Original alert checking logic
  useEffect(() => {
    if (!alerts.length || !currentWars.length) return;

    alerts.forEach(alert => {
      const matchingWars = currentWars.filter(war => {
        const regionMatch = !alert.regions?.length || 
          alert.regions.some(region => war.name?.toLowerCase().includes(region.toLowerCase()));
        
        const typeMatch = !alert.conflict_types?.length || 
          alert.conflict_types.includes(war.type);
        
        const probabilityMatch = !alert.probability_threshold || 
          (war.probability || 100) >= alert.probability_threshold;

        return regionMatch && typeMatch && probabilityMatch;
      });

      if (matchingWars.length > 0) {
        matchingWars.forEach(war => {
          if (alert.notification_methods?.includes('in_app')) {
            toast.warning(
              <div className="flex items-start gap-2">
                <AlertTriangle className="w-5 h-5 text-orange-400 flex-shrink-0 mt-0.5" />
                <div>
                  <div className="font-bold text-sm">{alert.alert_name}</div>
                  <div className="text-xs mt-1">{war.name}</div>
                  <div className="text-xs text-slate-400 mt-1">
                    Type: {war.type} • Severity: {alert.severity_threshold}
                  </div>
                </div>
              </div>,
              {
                duration: 8000,
                position: 'top-right'
              }
            );
          }

          if (alert.notification_methods?.includes('email')) {
            base44.integrations.Core.SendEmail({
              to: alert.created_by,
              subject: `Alert Triggered: ${alert.alert_name}`,
              body: `Your custom alert "${alert.alert_name}" has been triggered.\n\nConflict: ${war.name}\nType: ${war.type}\nDescription: ${war.description}\n\nView details in War Matrix: ${window.location.origin}`
            }).catch(() => {});
          }
        });

        base44.entities.Alert.update(alert.id, {
          trigger_count: (alert.trigger_count || 0) + matchingWars.length,
          last_triggered: new Date().toISOString()
        }).catch(() => {});
      }
    });
  }, [alerts, currentWars]);

  return null;
}