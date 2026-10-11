import React, { useState, useEffect } from 'react';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { Slider } from '../ui/slider';
import { Switch } from '../ui/switch';
import { Label } from '../ui/label';
import { Badge } from '../ui/badge';
import { Input } from '../ui/input';
import { Bell, AlertTriangle, CloudRain, Droplets, Globe, Save, X, Plus } from 'lucide-react';
import { toast } from 'sonner';

export default function FutureWarsAlertSettings({ 
  userProfile, 
  onSave, 
  onClose,
  isOpen 
}) {
  const [thresholds, setThresholds] = useState({
    conflict_probability_threshold: 60,
    climate_impact_threshold: 70,
    resource_scarcity_threshold: 70,
    monitored_regions: [],
    monitored_conflict_types: [],
    enabled: true
  });

  const [newRegion, setNewRegion] = useState('');
  const [newConflictType, setNewConflictType] = useState('');

  useEffect(() => {
    if (userProfile?.future_wars_alert_thresholds) {
      setThresholds({
        ...thresholds,
        ...userProfile.future_wars_alert_thresholds
      });
    }
  }, [userProfile]);

  const handleSave = () => {
    onSave(thresholds);
    toast.success('Alert thresholds saved successfully');
  };

  const addRegion = () => {
    if (newRegion.trim() && !thresholds.monitored_regions.includes(newRegion.trim())) {
      setThresholds({
        ...thresholds,
        monitored_regions: [...thresholds.monitored_regions, newRegion.trim()]
      });
      setNewRegion('');
    }
  };

  const removeRegion = (region) => {
    setThresholds({
      ...thresholds,
      monitored_regions: thresholds.monitored_regions.filter(r => r !== region)
    });
  };

  const addConflictType = () => {
    if (newConflictType.trim() && !thresholds.monitored_conflict_types.includes(newConflictType.trim())) {
      setThresholds({
        ...thresholds,
        monitored_conflict_types: [...thresholds.monitored_conflict_types, newConflictType.trim()]
      });
      setNewConflictType('');
    }
  };

  const removeConflictType = (type) => {
    setThresholds({
      ...thresholds,
      monitored_conflict_types: thresholds.monitored_conflict_types.filter(t => t !== type)
    });
  };

  if (!isOpen) return null;

  return (
    <Card className="bg-slate-950/95 backdrop-blur-xl border-purple-500/30 p-6 mb-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Bell className="w-6 h-6 text-purple-400" />
          <div>
            <h3 className="text-xl font-bold text-purple-400 font-mono">
              FUTURE WARS ALERT THRESHOLDS
            </h3>
            <p className="text-slate-400 font-mono text-xs">
              Set custom thresholds for predictive conflict alerts
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
              <Label className="text-slate-200 font-mono">Enable Predictive Alerts</Label>
              <p className="text-xs text-slate-400 font-mono">Toggle all future wars alerts</p>
            </div>
          </div>
          <Switch
            checked={thresholds.enabled}
            onCheckedChange={(checked) => setThresholds({ ...thresholds, enabled: checked })}
          />
        </div>

        {thresholds.enabled && (
          <>
            <div className="grid md:grid-cols-3 gap-6">
              {/* Conflict Probability Threshold */}
              <div className="p-4 bg-red-950/20 rounded-lg border border-red-500/30">
                <div className="flex items-center gap-2 mb-4">
                  <AlertTriangle className="w-5 h-5 text-red-400" />
                  <Label className="text-red-400 font-mono font-bold text-sm">Conflict Probability</Label>
                </div>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-slate-400 font-mono text-xs">Alert when exceeds:</span>
                    <Badge className="bg-red-500/20 text-red-400 border-red-500/30 font-mono">
                      {thresholds.conflict_probability_threshold}%
                    </Badge>
                  </div>
                  <Slider
                    value={[thresholds.conflict_probability_threshold]}
                    onValueChange={(v) => setThresholds({ ...thresholds, conflict_probability_threshold: v[0] })}
                    min={10}
                    max={100}
                    step={5}
                    className="py-2"
                  />
                </div>
              </div>

              {/* Climate Impact Threshold */}
              <div className="p-4 bg-blue-950/20 rounded-lg border border-blue-500/30">
                <div className="flex items-center gap-2 mb-4">
                  <CloudRain className="w-5 h-5 text-blue-400" />
                  <Label className="text-blue-400 font-mono font-bold text-sm">Climate Impact</Label>
                </div>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-slate-400 font-mono text-xs">Alert when exceeds:</span>
                    <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30 font-mono">
                      {thresholds.climate_impact_threshold}/100
                    </Badge>
                  </div>
                  <Slider
                    value={[thresholds.climate_impact_threshold]}
                    onValueChange={(v) => setThresholds({ ...thresholds, climate_impact_threshold: v[0] })}
                    min={10}
                    max={100}
                    step={5}
                    className="py-2"
                  />
                </div>
              </div>

              {/* Resource Scarcity Threshold */}
              <div className="p-4 bg-orange-950/20 rounded-lg border border-orange-500/30">
                <div className="flex items-center gap-2 mb-4">
                  <Droplets className="w-5 h-5 text-orange-400" />
                  <Label className="text-orange-400 font-mono font-bold text-sm">Resource Scarcity</Label>
                </div>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-slate-400 font-mono text-xs">Alert when exceeds:</span>
                    <Badge className="bg-orange-500/20 text-orange-400 border-orange-500/30 font-mono">
                      {thresholds.resource_scarcity_threshold}/100
                    </Badge>
                  </div>
                  <Slider
                    value={[thresholds.resource_scarcity_threshold]}
                    onValueChange={(v) => setThresholds({ ...thresholds, resource_scarcity_threshold: v[0] })}
                    min={10}
                    max={100}
                    step={5}
                    className="py-2"
                  />
                </div>
              </div>
            </div>

            {/* Monitored Regions */}
            <div className="p-4 bg-cyan-950/20 rounded-lg border border-cyan-500/30">
              <div className="flex items-center gap-2 mb-4">
                <Globe className="w-5 h-5 text-cyan-400" />
                <Label className="text-cyan-400 font-mono font-bold">Monitored Regions</Label>
              </div>
              <div className="flex gap-2 mb-3">
                <Input
                  value={newRegion}
                  onChange={(e) => setNewRegion(e.target.value)}
                  placeholder="Add region (e.g., Middle East, South Asia...)"
                  className="bg-slate-900/50 border-cyan-500/30 text-slate-200 font-mono text-sm"
                  onKeyPress={(e) => e.key === 'Enter' && addRegion()}
                />
                <Button onClick={addRegion} variant="outline" className="border-cyan-500/30 text-cyan-400">
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
              <div className="flex flex-wrap gap-2">
                {thresholds.monitored_regions.map((region, idx) => (
                  <Badge 
                    key={idx}
                    className="bg-cyan-500/20 text-cyan-400 border-cyan-500/30 font-mono text-xs cursor-pointer hover:bg-red-500/20"
                    onClick={() => removeRegion(region)}
                  >
                    {region} ×
                  </Badge>
                ))}
                {thresholds.monitored_regions.length === 0 && (
                  <span className="text-slate-500 font-mono text-xs">No regions added (all regions monitored)</span>
                )}
              </div>
            </div>

            {/* Monitored Conflict Types */}
            <div className="p-4 bg-purple-950/20 rounded-lg border border-purple-500/30">
              <div className="flex items-center gap-2 mb-4">
                <AlertTriangle className="w-5 h-5 text-purple-400" />
                <Label className="text-purple-400 font-mono font-bold">Monitored Conflict Types</Label>
              </div>
              <div className="flex gap-2 mb-3">
                <Input
                  value={newConflictType}
                  onChange={(e) => setNewConflictType(e.target.value)}
                  placeholder="Add type (e.g., territorial, economic, climate...)"
                  className="bg-slate-900/50 border-purple-500/30 text-slate-200 font-mono text-sm"
                  onKeyPress={(e) => e.key === 'Enter' && addConflictType()}
                />
                <Button onClick={addConflictType} variant="outline" className="border-purple-500/30 text-purple-400">
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
              <div className="flex flex-wrap gap-2">
                {thresholds.monitored_conflict_types.map((type, idx) => (
                  <Badge 
                    key={idx}
                    className="bg-purple-500/20 text-purple-400 border-purple-500/30 font-mono text-xs cursor-pointer hover:bg-red-500/20"
                    onClick={() => removeConflictType(type)}
                  >
                    {type} ×
                  </Badge>
                ))}
                {thresholds.monitored_conflict_types.length === 0 && (
                  <span className="text-slate-500 font-mono text-xs">No types added (all types monitored)</span>
                )}
              </div>
            </div>
          </>
        )}

        <Button
          onClick={handleSave}
          className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-mono py-4"
        >
          <Save className="w-5 h-5 mr-2" />
          SAVE ALERT THRESHOLDS
        </Button>
      </div>
    </Card>
  );
}