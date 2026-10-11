import React, { useEffect, useRef } from 'react';
import { toast } from 'sonner';
import { AlertTriangle, Activity, DollarSign } from 'lucide-react';

export default function ThresholdAlertMonitor({ 
  threatLevel, 
  activeConflicts, 
  economicImpact,
  thresholds 
}) {
  const lastAlertRef = useRef({});

  useEffect(() => {
    if (!thresholds?.enabled) return;

    const now = Date.now();
    const ALERT_COOLDOWN = 60000; // 1 minute cooldown between same alerts

    // Check threat level threshold
    if (threatLevel && thresholds.threat_level_threshold) {
      if (threatLevel >= thresholds.threat_level_threshold) {
        if (!lastAlertRef.current.threatLevel || 
            now - lastAlertRef.current.threatLevel > ALERT_COOLDOWN) {
          toast.warning(
            <div className="flex items-center gap-2">
              <Activity className="w-4 h-4 text-red-400" />
              <div>
                <div className="font-bold">THREAT LEVEL ALERT</div>
                <div className="text-sm">Current: {threatLevel}% | Threshold: {thresholds.threat_level_threshold}%</div>
              </div>
            </div>,
            { duration: 8000 }
          );
          lastAlertRef.current.threatLevel = now;
        }
      }
    }

    // Check active conflicts threshold
    if (activeConflicts && thresholds.active_conflicts_threshold) {
      if (activeConflicts >= thresholds.active_conflicts_threshold) {
        if (!lastAlertRef.current.activeConflicts || 
            now - lastAlertRef.current.activeConflicts > ALERT_COOLDOWN) {
          toast.warning(
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-orange-400" />
              <div>
                <div className="font-bold">ACTIVE CONFLICTS ALERT</div>
                <div className="text-sm">Current: {activeConflicts} | Threshold: {thresholds.active_conflicts_threshold}</div>
              </div>
            </div>,
            { duration: 8000 }
          );
          lastAlertRef.current.activeConflicts = now;
        }
      }
    }

    // Check economic impact threshold
    if (economicImpact && thresholds.economic_impact_threshold) {
      if (economicImpact >= thresholds.economic_impact_threshold) {
        if (!lastAlertRef.current.economicImpact || 
            now - lastAlertRef.current.economicImpact > ALERT_COOLDOWN) {
          toast.warning(
            <div className="flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-yellow-400" />
              <div>
                <div className="font-bold">ECONOMIC IMPACT ALERT</div>
                <div className="text-sm">Current: ${economicImpact}B | Threshold: ${thresholds.economic_impact_threshold}B</div>
              </div>
            </div>,
            { duration: 8000 }
          );
          lastAlertRef.current.economicImpact = now;
        }
      }
    }
  }, [threatLevel, activeConflicts, economicImpact, thresholds]);

  return null; // This is a monitoring component, no UI
}