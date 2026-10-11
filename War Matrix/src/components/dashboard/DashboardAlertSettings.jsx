import React, { useState, useEffect } from 'react';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { Slider } from '../ui/slider';
import { Switch } from '../ui/switch';
import { Label } from '../ui/label';
import { Badge } from '../ui/badge';
import { Bell, AlertTriangle, Activity, DollarSign, Users, Save, X } from 'lucide-react';
import { toast } from 'sonner';

export default function DashboardAlertSettings({ 
  userProfile, 
  onSave, 
  onClose,
  isOpen 
}) {
  const [thresholds, setThresholds] = useState({
    threat_level_threshold: 70,
    active_conflicts_threshold: 10,
    economic_impact_threshold: 100,
    casualty_threshold: 10000,
    enabled: true
  });

  useEffect(() => {
    if (userProfile?.dashboard_alert_thresholds) {
      setThresholds({
        ...thresholds,
        ...userProfile.dashboard_alert_thresholds
      });
    }
  }, [userProfile]);

  const handleSave = () => {
    onSave(thresholds);
    toast.success('Alert thresholds saved successfully');
  };

  if (!isOpen) return null;

  return (
    <Card className="bg-slate-950/95 backdrop-blur-xl border-orange-500/30 p-6 mb-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Bell className="w-6 h-6 text-orange-400" />
          <div>
            <h3 className="text-xl font-bold text-orange-400 font-mono">
              PERSONALIZED ALERT THRESHOLDS
            </h3>
            <p className="text-slate-400 font-mono text-xs">
              Set custom thresholds to trigger alerts when metrics exceed your defined limits
            </p>
          </div>
        </div>
        <Button variant="ghost" size="icon" onClick={onClose}>
          <X className="w-5 h-5 text-slate-400" />
        </Button>
      </div>

      <div className="space-y-6">
        {/* Master Enable/Disable */}
        <div className="flex items-center justify-between p-4 bg-slate-900/50 rounded-lg border border-slate-700/50">
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 text-yellow-400" />
            <div>
              <Label className="text-slate-200 font-mono">Enable Dashboard Alerts</Label>
              <p className="text-xs text-slate-400 font-mono">Toggle all dashboard threshold alerts</p>
            </div>
          </div>
          <Switch
            checked={thresholds.enabled}
            onCheckedChange={(checked) => setThresholds({ ...thresholds, enabled: checked })}
          />
        </div>

        {thresholds.enabled && (
          <div className="grid md:grid-cols-2 gap-6">
            {/* Threat Level Threshold */}
            <div className="p-4 bg-red-950/20 rounded-lg border border-red-500/30">
              <div className="flex items-center gap-2 mb-4">
                <Activity className="w-5 h-5 text-red-400" />
                <Label className="text-red-400 font-mono font-bold">Threat Level Threshold</Label>
              </div>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-slate-400 font-mono text-sm">Alert when exceeds:</span>
                  <Badge className="bg-red-500/20 text-red-400 border-red-500/30 font-mono">
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
                <div className="flex justify-between text-xs text-slate-500 font-mono">
                  <span>10% (Sensitive)</span>
                  <span>100% (Critical Only)</span>
                </div>
              </div>
            </div>

            {/* Active Conflicts Threshold */}
            <div className="p-4 bg-orange-950/20 rounded-lg border border-orange-500/30">
              <div className="flex items-center gap-2 mb-4">
                <AlertTriangle className="w-5 h-5 text-orange-400" />
                <Label className="text-orange-400 font-mono font-bold">Active Conflicts Threshold</Label>
              </div>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-slate-400 font-mono text-sm">Alert when exceeds:</span>
                  <Badge className="bg-orange-500/20 text-orange-400 border-orange-500/30 font-mono">
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
                <div className="flex justify-between text-xs text-slate-500 font-mono">
                  <span>1 (Any conflict)</span>
                  <span>50 (Major escalation)</span>
                </div>
              </div>
            </div>

            {/* Economic Impact Threshold */}
            <div className="p-4 bg-yellow-950/20 rounded-lg border border-yellow-500/30">
              <div className="flex items-center gap-2 mb-4">
                <DollarSign className="w-5 h-5 text-yellow-400" />
                <Label className="text-yellow-400 font-mono font-bold">Economic Impact Threshold</Label>
              </div>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-slate-400 font-mono text-sm">Alert when exceeds:</span>
                  <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30 font-mono">
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
                <div className="flex justify-between text-xs text-slate-500 font-mono">
                  <span>$10B</span>
                  <span>$1000B</span>
                </div>
              </div>
            </div>

            {/* Casualty Threshold */}
            <div className="p-4 bg-purple-950/20 rounded-lg border border-purple-500/30">
              <div className="flex items-center gap-2 mb-4">
                <Users className="w-5 h-5 text-purple-400" />
                <Label className="text-purple-400 font-mono font-bold">Casualty Threshold</Label>
              </div>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-slate-400 font-mono text-sm">Alert when exceeds:</span>
                  <Badge className="bg-purple-500/20 text-purple-400 border-purple-500/30 font-mono">
                    {(thresholds.casualty_threshold / 1000).toFixed(0)}K
                  </Badge>
                </div>
                <Slider
                  value={[thresholds.casualty_threshold]}
                  onValueChange={(v) => setThresholds({ ...thresholds, casualty_threshold: v[0] })}
                  min={1000}
                  max={100000}
                  step={1000}
                  className="py-2"
                />
                <div className="flex justify-between text-xs text-slate-500 font-mono">
                  <span>1K</span>
                  <span>100K</span>
                </div>
              </div>
            </div>
          </div>
        )}

        <Button
          onClick={handleSave}
          className="w-full bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white font-mono py-4"
        >
          <Save className="w-5 h-5 mr-2" />
          SAVE ALERT THRESHOLDS
        </Button>
      </div>
    </Card>
  );
}