import React, { useState, useEffect } from 'react';
import { base44 } from '../../api/base44Client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { Slider } from '../ui/slider';
import { Switch } from '../ui/switch';
import { Label } from '../ui/label';
import { Badge } from '../ui/badge';
import { AlertTriangle, Activity, DollarSign, Bell, Save, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

export default function DashboardAlertThresholds({ userProfile, onUpdate }) {
  const queryClient = useQueryClient();
  
  const [thresholds, setThresholds] = useState({
    threat_level_threshold: userProfile?.dashboard_alert_thresholds?.threat_level_threshold || 70,
    active_conflicts_threshold: userProfile?.dashboard_alert_thresholds?.active_conflicts_threshold || 10,
    economic_impact_threshold: userProfile?.dashboard_alert_thresholds?.economic_impact_threshold || 100,
    enabled: userProfile?.dashboard_alert_thresholds?.enabled ?? true
  });

  useEffect(() => {
    if (userProfile?.dashboard_alert_thresholds) {
      setThresholds({
        threat_level_threshold: userProfile.dashboard_alert_thresholds.threat_level_threshold || 70,
        active_conflicts_threshold: userProfile.dashboard_alert_thresholds.active_conflicts_threshold || 10,
        economic_impact_threshold: userProfile.dashboard_alert_thresholds.economic_impact_threshold || 100,
        enabled: userProfile.dashboard_alert_thresholds.enabled ?? true
      });
    }
  }, [userProfile]);

  const saveThresholdsMutation = useMutation({
    mutationFn: async () => {
      const updatedProfile = {
        ...userProfile,
        dashboard_alert_thresholds: thresholds
      };
      
      if (userProfile?.id) {
        return base44.entities.UserProfile.update(userProfile.id, updatedProfile);
      } else {
        return base44.entities.UserProfile.create(updatedProfile);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['userProfile'] });
      toast.success('Alert thresholds saved successfully');
      if (onUpdate) onUpdate(thresholds);
    },
    onError: () => {
      toast.error('Failed to save thresholds');
    }
  });

  const getThreatColor = (value) => {
    if (value >= 80) return 'text-red-400';
    if (value >= 60) return 'text-orange-400';
    if (value >= 40) return 'text-yellow-400';
    return 'text-green-400';
  };

  return (
    <Card className="bg-slate-950/80 backdrop-blur-xl cyber-border p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Bell className="w-6 h-6 text-yellow-400" />
          <div>
            <h3 className="text-xl font-bold text-yellow-400 glow-text font-mono">
              ALERT THRESHOLDS
            </h3>
            <p className="text-xs text-slate-400 font-mono">
              Configure personalized alert triggers
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Label className="text-slate-400 font-mono text-sm">Enable Alerts</Label>
          <Switch
            checked={thresholds.enabled}
            onCheckedChange={(checked) => setThresholds({ ...thresholds, enabled: checked })}
          />
        </div>
      </div>

      <div className={`space-y-6 ${!thresholds.enabled ? 'opacity-50 pointer-events-none' : ''}`}>
        {/* Threat Level Threshold */}
        <div className="bg-slate-900/50 cyber-border rounded-lg p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-red-400" />
              <Label className="text-slate-200 font-mono">Threat Level Threshold</Label>
            </div>
            <Badge className={`font-mono ${getThreatColor(thresholds.threat_level_threshold)}`}>
              {thresholds.threat_level_threshold}%
            </Badge>
          </div>
          <Slider
            value={[thresholds.threat_level_threshold]}
            onValueChange={(v) => setThresholds({ ...thresholds, threat_level_threshold: v[0] })}
            min={10}
            max={100}
            step={5}
            className="py-2"
          />
          <p className="text-xs text-slate-500 font-mono mt-2">
            Alert when global threat level exceeds this value
          </p>
        </div>

        {/* Active Conflicts Threshold */}
        <div className="bg-slate-900/50 cyber-border rounded-lg p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Activity className="w-5 h-5 text-orange-400" />
              <Label className="text-slate-200 font-mono">Active Conflicts Threshold</Label>
            </div>
            <Badge className="font-mono text-orange-400">
              {thresholds.active_conflicts_threshold} conflicts
            </Badge>
          </div>
          <Slider
            value={[thresholds.active_conflicts_threshold]}
            onValueChange={(v) => setThresholds({ ...thresholds, active_conflicts_threshold: v[0] })}
            min={1}
            max={50}
            step={1}
            className="py-2"
          />
          <p className="text-xs text-slate-500 font-mono mt-2">
            Alert when number of active conflicts exceeds this count
          </p>
        </div>

        {/* Economic Impact Threshold */}
        <div className="bg-slate-900/50 cyber-border rounded-lg p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-cyan-400" />
              <Label className="text-slate-200 font-mono">Economic Impact Threshold</Label>
            </div>
            <Badge className="font-mono text-cyan-400">
              ${thresholds.economic_impact_threshold}B
            </Badge>
          </div>
          <Slider
            value={[thresholds.economic_impact_threshold]}
            onValueChange={(v) => setThresholds({ ...thresholds, economic_impact_threshold: v[0] })}
            min={10}
            max={1000}
            step={10}
            className="py-2"
          />
          <p className="text-xs text-slate-500 font-mono mt-2">
            Alert when cumulative economic impact exceeds this amount (in billions USD)
          </p>
        </div>
      </div>

      <Button
        onClick={() => saveThresholdsMutation.mutate()}
        disabled={saveThresholdsMutation.isPending}
        className="w-full mt-6 bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-white font-mono"
      >
        {saveThresholdsMutation.isPending ? (
          <>
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            SAVING...
          </>
        ) : (
          <>
            <Save className="w-4 h-4 mr-2" />
            SAVE THRESHOLDS
          </>
        )}
      </Button>
    </Card>
  );
}