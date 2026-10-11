import React, { useState, useEffect } from 'react';
import { base44 } from '../../api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Switch } from '../ui/switch';
import { Label } from '../ui/label';
import { Slider } from '../ui/slider';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { 
  Bell, BellOff, Mail, Settings, AlertTriangle, TrendingUp, MapPin, FileText, X,
  Brain, Zap, ChevronRight, ChevronDown, Loader2, Filter, ArrowUpDown
} from 'lucide-react';
import { toast } from 'sonner';
import AlertDetailPanel from './AlertDetailPanel';
import AlertActionPanel from './AlertActionPanel';

export default function AlertCenter({ onClose }) {
  const queryClient = useQueryClient();
  const [alerts, setAlerts] = useState([]);
  const [selectedAlert, setSelectedAlert] = useState(null);
  const [sortBy, setSortBy] = useState('ai_priority'); // 'ai_priority', 'severity', 'time'
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [preferences, setPreferences] = useState({
    enabled: true,
    email_notifications: false,
    critical_news: true,
    high_escalation: true,
    flashpoint_alerts: true,
    simulation_changes: false,
    min_escalation_probability: 70,
    min_flashpoint_risk: 80
  });

  // Fetch alerts from database
  const { data: dbAlerts, isLoading } = useQuery({
    queryKey: ['alertRecords'],
    queryFn: async () => {
      try {
        return await base44.entities.AlertRecord.list('-created_date', 50);
      } catch (e) {
        return [];
      }
    },
    initialData: []
  });

  // Generate sample alerts if database is empty
  useEffect(() => {
    if (dbAlerts.length > 0) {
      setAlerts(dbAlerts);
    } else {
      // Generate sample alerts for demo
      const sampleAlerts = [
        {
          id: 1,
          alert_type: 'critical_news',
          severity: 'CRITICAL',
          title: 'Major Offensive Detected',
          message: 'Large-scale military operation detected in Ukraine',
          ai_summary: 'AI Analysis: This offensive represents a significant escalation with potential to draw in NATO forces. Historical patterns suggest a 72-hour window before international response. Recommend immediate diplomatic engagement.',
          ai_priority_score: 95,
          historical_context: 'Similar offensive patterns were observed in February 2022 and Summer 2023. Both led to significant territorial changes and international sanctions escalation.',
          related_events: ['Eastern Front Buildup (3 days ago)', 'Diplomatic Talks Breakdown', 'NATO Emergency Meeting'],
          geographical_context: {
            region: 'Eastern Europe',
            countries: ['Ukraine', 'Russia', 'Belarus']
          },
          impact_analysis: {
            economic_impact: 'Expected 15% increase in global energy prices',
            military_impact: 'NATO readiness level elevated to DEFCON 3',
            civilian_impact: 'Estimated 50,000 displaced persons',
            regional_stability: 'Critical - Risk of wider conflict'
          },
          status: 'new',
          notes: [],
          actions_taken: [],
          created_date: new Date()
        },
        {
          id: 2,
          alert_type: 'high_escalation',
          severity: 'HIGH',
          title: 'Escalation Probability Increased',
          message: 'Russia-Ukraine War escalation probability: 85%',
          ai_summary: 'AI models detect increased troop movements and communication chatter consistent with preparation for major operations. Recommend enhanced monitoring.',
          ai_priority_score: 82,
          historical_context: 'Escalation patterns match pre-offensive indicators from historical data.',
          related_events: ['Troop Repositioning', 'Supply Line Activity'],
          geographical_context: {
            region: 'Eastern Europe',
            countries: ['Ukraine', 'Russia']
          },
          impact_analysis: {
            economic_impact: 'Moderate market volatility expected',
            military_impact: 'Increased defensive posturing',
            civilian_impact: 'Evacuation advisories in border regions',
            regional_stability: 'Deteriorating'
          },
          status: 'new',
          notes: [],
          actions_taken: [],
          created_date: new Date(Date.now() - 3600000)
        },
        {
          id: 3,
          alert_type: 'flashpoint',
          severity: 'HIGH',
          title: 'New Flashpoint Detected',
          message: 'Taiwan Strait tensions rising - Risk Score: 92/100',
          ai_summary: 'Naval exercises and diplomatic rhetoric indicate heightened risk of confrontation. Historical analysis suggests current situation mirrors 1996 crisis patterns.',
          ai_priority_score: 88,
          historical_context: '1996 Taiwan Strait Crisis led to US carrier group deployment. Current indicators show similar escalation trajectory.',
          related_events: ['PLA Naval Exercises', 'US Congressional Visit', 'Trade Restrictions'],
          geographical_context: {
            region: 'East Asia',
            countries: ['Taiwan', 'China', 'United States', 'Japan']
          },
          impact_analysis: {
            economic_impact: 'Global semiconductor supply at risk',
            military_impact: 'US 7th Fleet on heightened alert',
            civilian_impact: 'Limited direct impact currently',
            regional_stability: 'High tension, contained'
          },
          status: 'acknowledged',
          notes: [
            { author: 'analyst@warmatrix.com', content: 'Monitoring satellite imagery for fleet movements', timestamp: new Date(Date.now() - 1800000).toISOString() }
          ],
          actions_taken: [],
          created_date: new Date(Date.now() - 7200000)
        }
      ];
      setAlerts(sampleAlerts);
    }
  }, [dbAlerts]);

  // AI Analysis mutation
  const analyzeAlertMutation = useMutation({
    mutationFn: async (alert) => {
      const response = await base44.integrations.Core.InvokeLLM({
        prompt: `Analyze this geopolitical alert and provide a concise, actionable intelligence summary:

Alert Title: ${alert.title}
Type: ${alert.alert_type}
Severity: ${alert.severity}
Message: ${alert.message}

Provide:
1. A 2-3 sentence executive summary with actionable insights
2. Priority score (0-100) based on urgency and global impact
3. Key historical parallels
4. Recommended immediate actions

Format as JSON.`,
        response_json_schema: {
          type: 'object',
          properties: {
            summary: { type: 'string' },
            priority_score: { type: 'number' },
            historical_parallels: { type: 'array', items: { type: 'string' } },
            recommended_actions: { type: 'array', items: { type: 'string' } }
          }
        },
        add_context_from_internet: true
      });
      return response;
    }
  });

  // AI Smart Sort mutation
  const smartSortMutation = useMutation({
    mutationFn: async (alertsList) => {
      setIsAnalyzing(true);
      const response = await base44.integrations.Core.InvokeLLM({
        prompt: `Analyze these alerts and rank them by priority. Consider:
- Severity and potential for escalation
- Current geopolitical context
- Time sensitivity
- Potential global impact

Alerts:
${alertsList.map((a, i) => `${i+1}. [${a.severity}] ${a.title}: ${a.message}`).join('\n')}

Return the alert indices in order of priority (most critical first) as a JSON array of numbers.`,
        response_json_schema: {
          type: 'object',
          properties: {
            priority_order: { type: 'array', items: { type: 'number' } },
            reasoning: { type: 'string' }
          }
        },
        add_context_from_internet: true
      });
      setIsAnalyzing(false);
      return response;
    },
    onSuccess: (data) => {
      if (data.priority_order) {
        const reordered = data.priority_order.map(idx => alerts[idx - 1]).filter(Boolean);
        setAlerts(reordered);
        toast.success('Alerts prioritized by AI');
      }
    }
  });

  const getSeverityColor = (severity) => {
    const colors = {
      'CRITICAL': 'bg-red-500/20 text-red-400 border-red-500/30',
      'HIGH': 'bg-orange-500/20 text-orange-400 border-orange-500/30',
      'MEDIUM': 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
      'LOW': 'bg-green-500/20 text-green-400 border-green-500/30'
    };
    return colors[severity] || colors['MEDIUM'];
  };

  const getTypeIcon = (type) => {
    const icons = {
      'critical_news': FileText,
      'high_escalation': TrendingUp,
      'flashpoint': MapPin,
      'simulation_changes': AlertTriangle
    };
    return icons[type] || Bell;
  };

  const sortAlerts = (method) => {
    setSortBy(method);
    let sorted = [...alerts];
    
    if (method === 'ai_priority') {
      sorted.sort((a, b) => (b.ai_priority_score || 0) - (a.ai_priority_score || 0));
    } else if (method === 'severity') {
      const severityOrder = { 'CRITICAL': 4, 'HIGH': 3, 'MEDIUM': 2, 'LOW': 1 };
      sorted.sort((a, b) => (severityOrder[b.severity] || 0) - (severityOrder[a.severity] || 0));
    } else if (method === 'time') {
      sorted.sort((a, b) => new Date(b.created_date) - new Date(a.created_date));
    }
    
    setAlerts(sorted);
  };

  const handleAddNote = async (noteContent) => {
    if (!selectedAlert) return;
    
    const newNote = {
      author: 'current_user@warmatrix.com',
      content: noteContent,
      timestamp: new Date().toISOString()
    };

    const updatedAlerts = alerts.map(a => 
      a.id === selectedAlert.id 
        ? { ...a, notes: [...(a.notes || []), newNote] }
        : a
    );
    setAlerts(updatedAlerts);
    setSelectedAlert({ ...selectedAlert, notes: [...(selectedAlert.notes || []), newNote] });
    toast.success('Note added');
  };

  const handleAction = (action, actionRecord) => {
    if (!selectedAlert) return;
    
    const updatedAlerts = alerts.map(a => 
      a.id === selectedAlert.id 
        ? { ...a, actions_taken: [...(a.actions_taken || []), actionRecord] }
        : a
    );
    setAlerts(updatedAlerts);
    setSelectedAlert({ ...selectedAlert, actions_taken: [...(selectedAlert.actions_taken || []), actionRecord] });
  };

  const handleStatusChange = (status, assignedTo) => {
    if (!selectedAlert) return;
    
    const updatedAlerts = alerts.map(a => 
      a.id === selectedAlert.id 
        ? { ...a, status, assigned_to: assignedTo || a.assigned_to }
        : a
    );
    setAlerts(updatedAlerts);
    setSelectedAlert({ ...selectedAlert, status, assigned_to: assignedTo || selectedAlert.assigned_to });
  };

  const markAsRead = (id) => {
    setAlerts(alerts.map(alert => 
      alert.id === id ? { ...alert, read: true } : alert
    ));
  };

  const savePreferences = () => {
    localStorage.setItem('alertPreferences', JSON.stringify(preferences));
    toast.success('Preferences saved');
  };

  return (
    <Card className="bg-slate-950/95 backdrop-blur-xl cyber-border p-6 max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <Bell className="w-6 h-6 text-cyan-400" />
          <h2 className="text-2xl font-bold text-cyan-400 glow-text font-mono">
            ALERT CENTER
          </h2>
        </div>
        <Button variant="ghost" size="icon" onClick={onClose}>
          <X className="w-5 h-5 text-slate-400" />
        </Button>
      </div>

      <Tabs defaultValue="alerts" className="flex-1 flex flex-col overflow-hidden">
        <TabsList className="grid grid-cols-3 bg-slate-900/50 mb-4">
          <TabsTrigger value="alerts" className="font-mono text-xs">ALERTS ({alerts.filter(a => !a.read).length})</TabsTrigger>
          <TabsTrigger value="preferences" className="font-mono text-xs">PREFERENCES</TabsTrigger>
          <TabsTrigger value="detail" className="font-mono text-xs" disabled={!selectedAlert}>DETAIL VIEW</TabsTrigger>
        </TabsList>

        {/* Alerts Tab */}
        <TabsContent value="alerts" className="flex-1 overflow-hidden flex flex-col">
          {/* Sort Controls */}
          <div className="flex items-center gap-2 mb-4">
            <span className="text-slate-400 font-mono text-xs">SORT BY:</span>
            <Button
              size="sm"
              variant={sortBy === 'ai_priority' ? 'default' : 'outline'}
              onClick={() => sortAlerts('ai_priority')}
              className={`font-mono text-xs ${sortBy === 'ai_priority' ? 'bg-purple-500/20 text-purple-400 border-purple-500/30' : 'border-slate-600/30 text-slate-400'}`}
            >
              <Brain className="w-3 h-3 mr-1" />
              AI PRIORITY
            </Button>
            <Button
              size="sm"
              variant={sortBy === 'severity' ? 'default' : 'outline'}
              onClick={() => sortAlerts('severity')}
              className={`font-mono text-xs ${sortBy === 'severity' ? 'bg-red-500/20 text-red-400 border-red-500/30' : 'border-slate-600/30 text-slate-400'}`}
            >
              <AlertTriangle className="w-3 h-3 mr-1" />
              SEVERITY
            </Button>
            <Button
              size="sm"
              variant={sortBy === 'time' ? 'default' : 'outline'}
              onClick={() => sortAlerts('time')}
              className={`font-mono text-xs ${sortBy === 'time' ? 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30' : 'border-slate-600/30 text-slate-400'}`}
            >
              <ArrowUpDown className="w-3 h-3 mr-1" />
              TIME
            </Button>
            <Button
              size="sm"
              onClick={() => smartSortMutation.mutate(alerts)}
              disabled={isAnalyzing}
              className="ml-auto bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-mono text-xs"
            >
              {isAnalyzing ? <Loader2 className="w-3 h-3 mr-1 animate-spin" /> : <Zap className="w-3 h-3 mr-1" />}
              SMART SORT
            </Button>
          </div>

          {/* Alert List */}
          <div className="flex-1 overflow-y-auto space-y-3">
            {alerts.length === 0 ? (
              <div className="text-center py-8">
                <BellOff className="w-12 h-12 text-slate-600 mx-auto mb-3" />
                <p className="text-slate-500 font-mono text-sm">No active alerts</p>
              </div>
            ) : (
              alerts.map(alert => {
                const Icon = getTypeIcon(alert.alert_type);
                return (
                  <div
                    key={alert.id}
                    className={`bg-slate-900/50 cyber-border rounded-lg p-4 cursor-pointer transition-all ${
                      alert.read ? 'opacity-60' : 'hover-glow'
                    } ${selectedAlert?.id === alert.id ? 'ring-2 ring-cyan-500' : ''}`}
                    onClick={() => {
                      markAsRead(alert.id);
                      setSelectedAlert(alert);
                    }}
                  >
                    <div className="flex items-start gap-3">
                      <div className="p-2 rounded-lg bg-cyan-500/10 border border-cyan-500/30">
                        <Icon className="w-4 h-4 text-cyan-400" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2 mb-1">
                          <h4 className="text-sm font-bold text-green-400 font-mono truncate">{alert.title}</h4>
                          <div className="flex items-center gap-2 flex-shrink-0">
                            {alert.ai_priority_score && (
                              <Badge className="bg-purple-500/20 text-purple-400 border-purple-500/30 font-mono text-xs">
                                AI: {alert.ai_priority_score}
                              </Badge>
                            )}
                            <Badge className={`${getSeverityColor(alert.severity)} font-mono text-xs`}>
                              {alert.severity}
                            </Badge>
                          </div>
                        </div>
                        <p className="text-slate-400 font-mono text-xs mb-2 line-clamp-2">{alert.message}</p>
                        <div className="flex items-center justify-between">
                          <div className="text-xs text-slate-500 font-mono">
                            {new Date(alert.created_date).toLocaleString()}
                          </div>
                          <ChevronRight className="w-4 h-4 text-slate-500" />
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </TabsContent>

        {/* Preferences Tab */}
        <TabsContent value="preferences" className="flex-1 overflow-y-auto">
          <div className="bg-slate-900/50 cyber-border rounded-lg p-4 space-y-4">
            <div className="flex items-center gap-2 mb-4">
              <Settings className="w-5 h-5 text-purple-400" />
              <h3 className="text-lg font-bold text-purple-400 font-mono">PREFERENCES</h3>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label className="text-cyan-400 font-mono text-sm">Enable Alerts</Label>
                <Switch
                  checked={preferences.enabled}
                  onCheckedChange={(checked) => setPreferences({ ...preferences, enabled: checked })}
                />
              </div>

              <div className="flex items-center justify-between">
                <Label className="text-cyan-400 font-mono text-sm flex items-center gap-2">
                  <Mail className="w-4 h-4" />
                  Email Notifications
                </Label>
                <Switch
                  checked={preferences.email_notifications}
                  onCheckedChange={(checked) => setPreferences({ ...preferences, email_notifications: checked })}
                  disabled={!preferences.enabled}
                />
              </div>

              <div className="pt-3 border-t border-slate-700/30">
                <div className="text-xs text-slate-400 font-mono mb-3">ALERT TYPES</div>
                <div className="space-y-3">
                  {['critical_news', 'high_escalation', 'flashpoint_alerts', 'simulation_changes'].map(type => (
                    <div key={type} className="flex items-center justify-between">
                      <Label className="text-slate-300 font-mono text-xs capitalize">{type.replace(/_/g, ' ')}</Label>
                      <Switch
                        checked={preferences[type]}
                        onCheckedChange={(checked) => setPreferences({ ...preferences, [type]: checked })}
                        disabled={!preferences.enabled}
                      />
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-3 border-t border-slate-700/30 space-y-4">
                <div className="text-xs text-slate-400 font-mono mb-3">THRESHOLDS</div>
                <div>
                  <Label className="text-slate-300 font-mono text-xs flex justify-between mb-2">
                    <span>Min Escalation Probability</span>
                    <span className="text-orange-400">{preferences.min_escalation_probability}%</span>
                  </Label>
                  <Slider
                    value={[preferences.min_escalation_probability]}
                    onValueChange={(value) => setPreferences({ ...preferences, min_escalation_probability: value[0] })}
                    min={50}
                    max={100}
                    step={5}
                    disabled={!preferences.enabled}
                  />
                </div>
                <div>
                  <Label className="text-slate-300 font-mono text-xs flex justify-between mb-2">
                    <span>Min Flashpoint Risk</span>
                    <span className="text-red-400">{preferences.min_flashpoint_risk}/100</span>
                  </Label>
                  <Slider
                    value={[preferences.min_flashpoint_risk]}
                    onValueChange={(value) => setPreferences({ ...preferences, min_flashpoint_risk: value[0] })}
                    min={50}
                    max={100}
                    step={5}
                    disabled={!preferences.enabled}
                  />
                </div>
              </div>

              <Button
                onClick={savePreferences}
                className="w-full bg-green-500/20 hover:bg-green-500/30 text-green-400 border border-green-500/30 font-mono"
              >
                SAVE PREFERENCES
              </Button>
            </div>
          </div>
        </TabsContent>

        {/* Detail View Tab */}
        <TabsContent value="detail" className="flex-1 overflow-y-auto">
          {selectedAlert ? (
            <div className="space-y-4">
              {/* Alert Header */}
              <div className="bg-slate-900/50 cyber-border rounded-lg p-4">
                <div className="flex items-start justify-between mb-3">
                  <h3 className="text-xl font-bold text-green-400 font-mono">{selectedAlert.title}</h3>
                  <Badge className={`${getSeverityColor(selectedAlert.severity)} font-mono`}>
                    {selectedAlert.severity}
                  </Badge>
                </div>
                <p className="text-slate-300 font-mono text-sm">{selectedAlert.message}</p>
              </div>

              {/* Two Column Layout */}
              <div className="grid md:grid-cols-2 gap-4">
                {/* Left: Details */}
                <div>
                  <AlertDetailPanel 
                    alert={selectedAlert}
                    onAddNote={handleAddNote}
                    isLoadingAI={analyzeAlertMutation.isPending}
                  />
                </div>

                {/* Right: Actions */}
                <div className="bg-slate-900/50 cyber-border rounded-lg p-4">
                  <h4 className="text-orange-400 font-mono font-bold text-sm mb-4 flex items-center gap-2">
                    <Zap className="w-4 h-4" />
                    RESPONSE ACTIONS
                  </h4>
                  <AlertActionPanel
                    alert={selectedAlert}
                    onAction={handleAction}
                    onStatusChange={handleStatusChange}
                  />
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-8">
              <AlertTriangle className="w-12 h-12 text-slate-600 mx-auto mb-3" />
              <p className="text-slate-500 font-mono text-sm">Select an alert to view details</p>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </Card>
  );
}