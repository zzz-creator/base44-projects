import React, { useState } from 'react';
import { base44 } from '../api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Badge } from '../components/ui/badge';
import { Switch } from '../components/ui/switch';
import { Slider } from '../components/ui/slider';
import { Bell, Plus, Trash2, Edit, Mail, AlertTriangle, Workflow, GitBranch } from 'lucide-react';
import MatrixBackground from '../components/war/MatrixBackground';
import AlertNotificationSystem from '../components/alerts/AlertNotificationSystem';
import VisualAlertRuleBuilder from '../components/alerts/VisualAlertRuleBuilder';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '../components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../components/ui/select';

export default function AlertsManagement() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('simple');
  const [showDialog, setShowDialog] = useState(false);
  const [showVisualBuilder, setShowVisualBuilder] = useState(false);
  const [editingAlert, setEditingAlert] = useState(null);
  const [formData, setFormData] = useState({
    alert_name: '',
    regions: [],
    conflict_types: [],
    keywords: [],
    probability_threshold: 50,
    severity_threshold: 'medium',
    notification_methods: ['in_app'],
    is_active: true
  });

  const { data: alerts, isLoading } = useQuery({
    queryKey: ['alerts'],
    queryFn: () => base44.entities.Alert.filter({ created_by: base44.auth.me().email }),
    initialData: [],
  });

  const { data: alertRules } = useQuery({
    queryKey: ['alertRules'],
    queryFn: async () => {
      const user = await base44.auth.me();
      return base44.entities.AlertRule.filter({ created_by: user.email });
    },
    initialData: [],
  });

  const createAlertMutation = useMutation({
    mutationFn: (alertData) => base44.entities.Alert.create(alertData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['alerts'] });
      setShowDialog(false);
      resetForm();
    },
  });

  const updateAlertMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Alert.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['alerts'] });
      setShowDialog(false);
      setEditingAlert(null);
      resetForm();
    },
  });

  const deleteAlertMutation = useMutation({
    mutationFn: (id) => base44.entities.Alert.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['alerts'] });
    },
  });

  const createAlertRuleMutation = useMutation({
    mutationFn: (ruleData) => base44.entities.AlertRule.create(ruleData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['alertRules'] });
      setShowVisualBuilder(false);
    },
  });

  const deleteAlertRuleMutation = useMutation({
    mutationFn: (id) => base44.entities.AlertRule.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['alertRules'] });
    },
  });

  const resetForm = () => {
    setFormData({
      alert_name: '',
      regions: [],
      conflict_types: [],
      keywords: [],
      probability_threshold: 50,
      severity_threshold: 'medium',
      notification_methods: ['in_app'],
      is_active: true
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (editingAlert) {
      updateAlertMutation.mutate({ id: editingAlert.id, data: formData });
    } else {
      createAlertMutation.mutate(formData);
    }
  };

  const handleEdit = (alert) => {
    setEditingAlert(alert);
    setFormData({
      alert_name: alert.alert_name,
      regions: alert.regions || [],
      conflict_types: alert.conflict_types || [],
      keywords: alert.keywords || [],
      probability_threshold: alert.probability_threshold || 50,
      severity_threshold: alert.severity_threshold || 'medium',
      notification_methods: alert.notification_methods || ['in_app'],
      is_active: alert.is_active !== false
    });
    setShowDialog(true);
  };

  const toggleArrayItem = (array, item) => {
    if (array.includes(item)) {
      return array.filter(i => i !== item);
    }
    return [...array, item];
  };

  const regions = ['Middle East', 'East Asia', 'Europe', 'Sub-Saharan Africa', 'South Asia', 'Latin America', 'North America', 'Central Asia'];
  const conflictTypes = ['territorial', 'civil', 'religious', 'economic', 'climate', 'resource'];

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
    <div className="relative min-h-screen">
      <AlertNotificationSystem />
      <MatrixBackground />
      
      <div className="relative z-10 p-8">
        <div className="max-w-7xl mx-auto space-y-6">
          <div className="flex items-center justify-between mb-8">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <Bell className="w-10 h-10 text-cyan-400" />
                <h1 className="text-4xl font-bold text-cyan-400 glow-text font-mono">
                  ALERT MANAGEMENT
                </h1>
              </div>
              <p className="text-slate-400 font-mono text-sm">
                Configure personalized alerts for regions, conflict types, and geopolitical events
              </p>
            </div>

            <Button
              onClick={() => setShowVisualBuilder(true)}
              className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-mono"
            >
              <Workflow className="w-5 h-5 mr-2" />
              CREATE ALERT RULE
            </Button>
          </div>

          {/* Visual Alert Rule Builder Dialog */}
          <Dialog open={showVisualBuilder} onOpenChange={setShowVisualBuilder}>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-slate-950 border-cyan-500/30">
              <VisualAlertRuleBuilder 
                onSave={(rule) => {
                  createAlertRuleMutation.mutate(rule);
                }}
              />
            </DialogContent>
          </Dialog>

          {/* Tabs for Simple vs Advanced Rules */}
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-2 bg-slate-950/80 border border-cyan-500/30 mb-6">
              <TabsTrigger value="simple" className="data-[state=active]:bg-cyan-500/20 data-[state=active]:text-cyan-400 font-mono">
                <Bell className="w-4 h-4 mr-2" />
                SIMPLE ALERTS
              </TabsTrigger>
              <TabsTrigger value="advanced" className="data-[state=active]:bg-purple-500/20 data-[state=active]:text-purple-400 font-mono">
                <GitBranch className="w-4 h-4 mr-2" />
                ADVANCED RULES
              </TabsTrigger>
            </TabsList>

            <TabsContent value="simple">
              <div className="flex justify-end mb-4">
                <Dialog open={showDialog} onOpenChange={setShowDialog}>
                  <DialogTrigger asChild>
                    <Button
                      onClick={() => {
                        setEditingAlert(null);
                        resetForm();
                      }}
                      className="bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white font-mono"
                    >
                      <Plus className="w-5 h-5 mr-2" />
                      CREATE SIMPLE ALERT
                    </Button>
                  </DialogTrigger>
              
              <DialogContent className="bg-slate-950 border-cyan-500/30 max-w-2xl">
                <DialogHeader>
                  <DialogTitle className="text-cyan-400 font-mono text-xl">
                    {editingAlert ? 'EDIT ALERT' : 'CREATE NEW ALERT'}
                  </DialogTitle>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <Label className="text-slate-300 font-mono">Alert Name</Label>
                    <Input
                      value={formData.alert_name}
                      onChange={(e) => setFormData({...formData, alert_name: e.target.value})}
                      placeholder="e.g., Middle East Conflicts"
                      className="bg-slate-900/50 border-cyan-500/30 text-cyan-400 font-mono"
                      required
                    />
                  </div>

                  <div>
                    <Label className="text-slate-300 font-mono mb-2 block">Regions to Monitor</Label>
                    <div className="grid grid-cols-2 gap-2">
                      {regions.map(region => (
                        <Button
                          key={region}
                          type="button"
                          variant={formData.regions.includes(region) ? 'default' : 'outline'}
                          className={`font-mono text-xs ${
                            formData.regions.includes(region)
                              ? 'bg-cyan-500 hover:bg-cyan-600'
                              : 'border-cyan-500/30 text-cyan-400 hover:bg-cyan-500/10'
                          }`}
                          onClick={() => setFormData({
                            ...formData,
                            regions: toggleArrayItem(formData.regions, region)
                          })}
                        >
                          {region}
                        </Button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <Label className="text-slate-300 font-mono mb-2 block">Conflict Types</Label>
                    <div className="grid grid-cols-3 gap-2">
                      {conflictTypes.map(type => (
                        <Button
                          key={type}
                          type="button"
                          variant={formData.conflict_types.includes(type) ? 'default' : 'outline'}
                          className={`font-mono text-xs ${
                            formData.conflict_types.includes(type)
                              ? 'bg-purple-500 hover:bg-purple-600'
                              : 'border-purple-500/30 text-purple-400 hover:bg-purple-500/10'
                          }`}
                          onClick={() => setFormData({
                            ...formData,
                            conflict_types: toggleArrayItem(formData.conflict_types, type)
                          })}
                        >
                          {type}
                        </Button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <Label className="text-slate-300 font-mono">
                      Probability Threshold: {formData.probability_threshold}%
                    </Label>
                    <Slider
                      value={[formData.probability_threshold]}
                      onValueChange={(v) => setFormData({...formData, probability_threshold: v[0]})}
                      max={100}
                      step={5}
                      className="py-4"
                    />
                  </div>

                  <div>
                    <Label className="text-slate-300 font-mono mb-2 block">Severity Threshold</Label>
                    <Select
                      value={formData.severity_threshold}
                      onValueChange={(value) => setFormData({...formData, severity_threshold: value})}
                    >
                      <SelectTrigger className="bg-slate-900/50 border-cyan-500/30 text-cyan-400 font-mono">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="low">Low</SelectItem>
                        <SelectItem value="medium">Medium</SelectItem>
                        <SelectItem value="high">High</SelectItem>
                        <SelectItem value="critical">Critical</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label className="text-slate-300 font-mono mb-2 block">Notification Methods</Label>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <Switch
                          checked={formData.notification_methods.includes('in_app')}
                          onCheckedChange={(checked) => {
                            const methods = checked
                              ? [...formData.notification_methods, 'in_app']
                              : formData.notification_methods.filter(m => m !== 'in_app');
                            setFormData({...formData, notification_methods: methods});
                          }}
                        />
                        <Label className="text-slate-300 font-mono text-sm">In-App Notifications</Label>
                      </div>
                      <div className="flex items-center gap-2">
                        <Switch
                          checked={formData.notification_methods.includes('email')}
                          onCheckedChange={(checked) => {
                            const methods = checked
                              ? [...formData.notification_methods, 'email']
                              : formData.notification_methods.filter(m => m !== 'email');
                            setFormData({...formData, notification_methods: methods});
                          }}
                        />
                        <Label className="text-slate-300 font-mono text-sm">Email Notifications</Label>
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-end gap-3 pt-4">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        setShowDialog(false);
                        setEditingAlert(null);
                        resetForm();
                      }}
                      className="border-slate-500/30 text-slate-400 hover:bg-slate-800 font-mono"
                    >
                      CANCEL
                    </Button>
                    <Button
                      type="submit"
                      className="bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white font-mono"
                    >
                      {editingAlert ? 'UPDATE' : 'CREATE'} ALERT
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>

          {/* Simple Alerts List */}
          {isLoading ? (
            <Card className="bg-slate-950/80 backdrop-blur-xl cyber-border p-8 text-center">
              <p className="text-slate-400 font-mono">Loading alerts...</p>
            </Card>
          ) : alerts.length === 0 ? (
            <Card className="bg-slate-950/80 backdrop-blur-xl cyber-border p-8 text-center">
              <Bell className="w-16 h-16 text-slate-600 mx-auto mb-4" />
              <p className="text-slate-400 font-mono mb-2">No alerts configured</p>
              <p className="text-slate-500 font-mono text-sm">Create your first alert to start monitoring</p>
            </Card>
          ) : (
            <div className="grid md:grid-cols-2 gap-6">
              {alerts.map((alert) => (
                <Card key={alert.id} className="bg-slate-950/80 backdrop-blur-xl cyber-border p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-xl font-bold text-cyan-400 font-mono">{alert.alert_name}</h3>
                        {!alert.is_active && (
                          <Badge className="bg-slate-500/20 text-slate-400 border-slate-500/30 font-mono text-xs">
                            PAUSED
                          </Badge>
                        )}
                      </div>
                      <Badge className={`${getSeverityColor(alert.severity_threshold)} font-mono text-xs`}>
                        {alert.severity_threshold?.toUpperCase()} SEVERITY
                      </Badge>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleEdit(alert)}
                        className="hover:bg-cyan-500/10"
                      >
                        <Edit className="w-4 h-4 text-cyan-400" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => deleteAlertMutation.mutate(alert.id)}
                        className="hover:bg-red-500/10"
                      >
                        <Trash2 className="w-4 h-4 text-red-400" />
                      </Button>
                    </div>
                  </div>

                  <div className="space-y-3">
                    {alert.regions?.length > 0 && (
                      <div>
                        <div className="text-xs text-slate-500 font-mono mb-1">Regions:</div>
                        <div className="flex flex-wrap gap-1">
                          {alert.regions.map((region, idx) => (
                            <Badge key={idx} variant="outline" className="border-green-500/30 text-green-400 font-mono text-xs">
                              {region}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}

                    {alert.conflict_types?.length > 0 && (
                      <div>
                        <div className="text-xs text-slate-500 font-mono mb-1">Conflict Types:</div>
                        <div className="flex flex-wrap gap-1">
                          {alert.conflict_types.map((type, idx) => (
                            <Badge key={idx} variant="outline" className="border-purple-500/30 text-purple-400 font-mono text-xs">
                              {type}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="grid grid-cols-2 gap-3">
                      <div className="p-2 bg-slate-900/50 cyber-border rounded">
                        <div className="text-xs text-slate-500 font-mono">Threshold</div>
                        <div className="text-lg font-bold text-orange-400 font-mono">
                          {alert.probability_threshold}%
                        </div>
                      </div>
                      <div className="p-2 bg-slate-900/50 cyber-border rounded">
                        <div className="text-xs text-slate-500 font-mono">Triggered</div>
                        <div className="text-lg font-bold text-yellow-400 font-mono">
                          {alert.trigger_count || 0}x
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 text-xs text-slate-400 font-mono">
                      {alert.notification_methods?.includes('in_app') && (
                        <div className="flex items-center gap-1">
                          <Bell className="w-3 h-3" />
                          <span>In-App</span>
                        </div>
                      )}
                      {alert.notification_methods?.includes('email') && (
                        <div className="flex items-center gap-1">
                          <Mail className="w-3 h-3" />
                          <span>Email</span>
                        </div>
                      )}
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
            </TabsContent>

            <TabsContent value="advanced">
              {/* Advanced Alert Rules */}
              {alertRules.length === 0 ? (
                <Card className="bg-slate-950/80 backdrop-blur-xl cyber-border p-8 text-center">
                  <GitBranch className="w-16 h-16 text-slate-600 mx-auto mb-4" />
                  <p className="text-slate-400 font-mono mb-2">No advanced rules configured</p>
                  <p className="text-slate-500 font-mono text-sm">Create complex alert rules with weighted conditions</p>
                </Card>
              ) : (
                <Card className="bg-slate-950/80 backdrop-blur-xl cyber-border p-6">
                  <h2 className="text-2xl font-bold text-purple-400 glow-text font-mono mb-6 flex items-center gap-2">
                    <GitBranch className="w-6 h-6" />
                    ACTIVE ADVANCED RULES
                  </h2>
                  <div className="space-y-4">
                    {alertRules.map((rule) => (
                      <div key={rule.id} className="bg-gradient-to-br from-purple-950/30 to-pink-950/30 cyber-border rounded-lg p-5">
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex-1">
                            <h3 className="text-lg font-bold text-purple-400 font-mono mb-2">
                              {rule.rule_name}
                            </h3>
                            <Badge className="bg-purple-500/20 text-purple-400 border-purple-500/30 font-mono">
                              Total Score: {rule.total_score}
                            </Badge>
                          </div>
                          <Button
                            onClick={() => deleteAlertRuleMutation.mutate(rule.id)}
                            variant="outline"
                            size="sm"
                            className="border-red-500/30 text-red-400 hover:bg-red-900/20 font-mono"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>

                        <div className="space-y-2 mb-4">
                          <div className="text-xs text-slate-400 font-mono mb-2">
                            Logic: <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30 ml-1">{rule.rule_logic}</Badge>
                          </div>
                          {rule.conditions?.map((condition, idx) => (
                            <div key={idx} className="flex items-center gap-2 text-xs font-mono">
                              <Badge variant="outline" className="border-cyan-500/30 text-cyan-400">
                                {condition.type}
                              </Badge>
                              <span className="text-slate-400">{condition.operator}</span>
                              <Badge variant="outline" className="border-green-500/30 text-green-400">
                                {condition.value}
                              </Badge>
                              <span className="ml-auto text-yellow-400">Weight: {condition.weight}</span>
                              {idx < rule.conditions.length - 1 && (
                                <Badge className="bg-purple-500/20 text-purple-400">{rule.rule_logic}</Badge>
                              )}
                            </div>
                          ))}
                        </div>

                        <div className="flex flex-wrap gap-2 mb-3">
                          {rule.notification_methods?.map((method, idx) => (
                            <Badge key={idx} variant="outline" className="border-cyan-500/30 text-cyan-400 font-mono text-xs">
                              {method}
                            </Badge>
                          ))}
                        </div>

                        {rule.trigger_count > 0 && (
                          <div className="pt-3 border-t border-purple-500/30">
                            <div className="text-xs text-slate-400 font-mono">
                              Triggered: <span className="text-purple-400 font-bold">{rule.trigger_count}x</span>
                              {rule.last_triggered && (
                                <span className="ml-3">
                                  Last: {new Date(rule.last_triggered).toLocaleString()}
                                </span>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </Card>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}