import React, { useState, useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '../../api/base44Client';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '../../components/ui/dialog';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Switch } from '../../components/ui/switch';
import { Badge } from '../../components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../components/ui/select';
import { 
  Loader2, 
  Zap, 
  ArrowDown, 
  Filter, 
  Play,
  Plus,
  Trash2,
  AlertTriangle,
  CheckCircle,
  Mail,
  Bell,
  ClipboardList,
  RefreshCw
} from 'lucide-react';
import { Card, CardContent } from '../../components/ui/card';

// Predefined trigger events
const TRIGGER_EVENTS = [
  { value: 'task_created', label: 'Task Created', entity: 'TaskChecklist', icon: ClipboardList },
  { value: 'task_status_changed', label: 'Task Status Changed', entity: 'TaskChecklist', icon: RefreshCw },
  { value: 'task_overdue', label: 'Task Overdue', entity: 'TaskChecklist', icon: AlertTriangle },
  { value: 'incident_created', label: 'Incident Logged', entity: 'IncidentLog', icon: AlertTriangle },
  { value: 'incident_severity_critical', label: 'Critical Incident', entity: 'IncidentLog', icon: AlertTriangle },
  { value: 'incident_resolved', label: 'Incident Resolved', entity: 'IncidentLog', icon: CheckCircle },
  { value: 'production_status_changed', label: 'Production Status Changed', entity: 'Production', icon: RefreshCw },
  { value: 'equipment_maintenance_due', label: 'Equipment Maintenance Due', entity: 'EquipmentAsset', icon: AlertTriangle },
  { value: 'crew_assignment_created', label: 'Crew Assignment Created', entity: 'CrewAssignment', icon: ClipboardList },
  { value: 'equipment_scheduled', label: 'Equipment Scheduled', entity: 'EquipmentSchedule', icon: ClipboardList },
];

// Predefined condition fields per entity
const CONDITION_FIELDS = {
  TaskChecklist: [
    { value: 'completion_status', label: 'Status', type: 'select', options: ['pending', 'in_progress', 'completed', 'blocked'] },
    { value: 'priority', label: 'Priority', type: 'select', options: ['low', 'medium', 'high', 'critical'] },
    { value: 'assigned_to', label: 'Assigned To', type: 'text' },
  ],
  IncidentLog: [
    { value: 'severity', label: 'Severity', type: 'select', options: ['low', 'medium', 'high', 'critical'] },
    { value: 'resolution_status', label: 'Resolution Status', type: 'select', options: ['open', 'investigating', 'resolved', 'closed'] },
  ],
  Production: [
    { value: 'status', label: 'Status', type: 'select', options: ['planning', 'rehearsal', 'active', 'completed', 'cancelled'] },
  ],
  EquipmentAsset: [
    { value: 'status', label: 'Status', type: 'select', options: ['available', 'in_use', 'maintenance', 'retired'] },
    { value: 'category', label: 'Category', type: 'select', options: ['lighting', 'sound', 'rigging', 'staging', 'video', 'props', 'tools', 'safety', 'other'] },
  ],
  CrewAssignment: [
    { value: 'status', label: 'Status', type: 'select', options: ['assigned', 'confirmed', 'active', 'completed', 'cancelled'] },
    { value: 'role', label: 'Role', type: 'select', options: ['stage_manager', 'lighting', 'sound', 'props', 'wardrobe', 'set', 'technical_director', 'rigger', 'carpenter', 'electrician', 'other'] },
  ],
  EquipmentSchedule: [
    { value: 'status', label: 'Status', type: 'select', options: ['scheduled', 'in_use', 'returned', 'cancelled'] },
  ],
};

const COMPARISON_OPERATORS = [
  { value: 'equals', label: 'Equals' },
  { value: 'not_equals', label: 'Not Equals' },
  { value: 'contains', label: 'Contains' },
  { value: 'is_empty', label: 'Is Empty' },
  { value: 'is_not_empty', label: 'Is Not Empty' },
];

// Predefined actions
const ACTION_TYPES = [
  { value: 'send_notification', label: 'Send Notification', icon: Bell, description: 'Send in-app notification' },
  { value: 'send_email', label: 'Send Email', icon: Mail, description: 'Send email to specified recipients' },
  { value: 'create_task', label: 'Create Task', icon: ClipboardList, description: 'Auto-create a follow-up task' },
  { value: 'update_status', label: 'Update Status', icon: RefreshCw, description: 'Update entity status' },
  { value: 'log_event', label: 'Log Event', icon: ClipboardList, description: 'Create an audit log entry' },
];

const initialFormState = {
  rule_name: '',
  trigger_event: '',
  conditions: [],
  action_type: '',
  action_config: {},
  is_active: true,
};

export default function AutomationRuleForm({ open, onClose, rule }) {
  const [formData, setFormData] = useState(initialFormState);
  const [currentEntity, setCurrentEntity] = useState(null);
  const queryClient = useQueryClient();

  useEffect(() => {
    if (rule) {
      // Parse existing rule data
      let conditions = [];
      let actionType = '';
      let actionConfig = {};
      
      // Try to parse condition_logic if it's JSON
      try {
        if (rule.condition_logic) {
          conditions = JSON.parse(rule.condition_logic);
        }
      } catch {
        conditions = [];
      }
      
      // Try to parse action_definition if it's JSON
      try {
        if (rule.action_definition) {
          const parsed = JSON.parse(rule.action_definition);
          actionType = parsed.type || '';
          actionConfig = parsed.config || {};
        }
      } catch {
        actionType = '';
        actionConfig = {};
      }

      setFormData({
        rule_name: rule.rule_name || '',
        trigger_event: rule.trigger_event || '',
        conditions: Array.isArray(conditions) ? conditions : [],
        action_type: actionType,
        action_config: actionConfig,
        is_active: rule.is_active !== false,
      });

      const trigger = TRIGGER_EVENTS.find(t => t.value === rule.trigger_event);
      setCurrentEntity(trigger?.entity || null);
    } else {
      setFormData(initialFormState);
      setCurrentEntity(null);
    }
  }, [rule, open]);

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.AutomationRule.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['automationRules'] });
      onClose();
    },
  });

  const updateMutation = useMutation({
    mutationFn: (data) => base44.entities.AutomationRule.update(rule.id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['automationRules'] });
      onClose();
    },
  });

  const handleTriggerChange = (value) => {
    const trigger = TRIGGER_EVENTS.find(t => t.value === value);
    setCurrentEntity(trigger?.entity || null);
    setFormData({ 
      ...formData, 
      trigger_event: value,
      conditions: [] // Reset conditions when trigger changes
    });
  };

  const addCondition = () => {
    setFormData({
      ...formData,
      conditions: [...formData.conditions, { field: '', operator: 'equals', value: '' }]
    });
  };

  const updateCondition = (index, updates) => {
    const newConditions = [...formData.conditions];
    newConditions[index] = { ...newConditions[index], ...updates };
    setFormData({ ...formData, conditions: newConditions });
  };

  const removeCondition = (index) => {
    setFormData({
      ...formData,
      conditions: formData.conditions.filter((_, i) => i !== index)
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Build the data for saving
    const data = {
      rule_name: formData.rule_name,
      trigger_event: formData.trigger_event,
      condition_logic: JSON.stringify(formData.conditions),
      action_definition: JSON.stringify({
        type: formData.action_type,
        config: formData.action_config
      }),
      is_active: formData.is_active,
    };
    
    if (rule) {
      updateMutation.mutate(data);
    } else {
      createMutation.mutate(data);
    }
  };

  const isLoading = createMutation.isPending || updateMutation.isPending;
  const availableFields = currentEntity ? CONDITION_FIELDS[currentEntity] || [] : [];
  const selectedTrigger = TRIGGER_EVENTS.find(t => t.value === formData.trigger_event);
  const selectedAction = ACTION_TYPES.find(a => a.value === formData.action_type);

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Zap className="w-5 h-5 text-amber-500" />
            {rule ? 'Edit Automation Rule' : 'Create Automation Rule'}
          </DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Rule Name */}
          <div>
            <Label htmlFor="rule_name">Rule Name *</Label>
            <Input
              id="rule_name"
              value={formData.rule_name}
              onChange={(e) => setFormData({ ...formData, rule_name: e.target.value })}
              placeholder="e.g., Alert on Critical Incidents"
              required
            />
          </div>

          {/* Flowchart Style Builder */}
          <div className="space-y-3">
            {/* TRIGGER NODE */}
            <Card className="border-2 border-blue-200 bg-blue-50/50">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-3">
                  <div className="p-1.5 rounded bg-blue-500 text-white">
                    <Zap className="w-4 h-4" />
                  </div>
                  <span className="font-semibold text-blue-900">WHEN</span>
                  <Badge variant="outline" className="text-blue-600 border-blue-300">Trigger</Badge>
                </div>
                <Select value={formData.trigger_event} onValueChange={handleTriggerChange}>
                  <SelectTrigger className="bg-white">
                    <SelectValue placeholder="Select a trigger event..." />
                  </SelectTrigger>
                  <SelectContent>
                    {TRIGGER_EVENTS.map((trigger) => {
                      const Icon = trigger.icon;
                      return (
                        <SelectItem key={trigger.value} value={trigger.value}>
                          <div className="flex items-center gap-2">
                            <Icon className="w-4 h-4 text-slate-500" />
                            {trigger.label}
                          </div>
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
                {selectedTrigger && (
                  <p className="text-xs text-blue-600 mt-2">
                    Monitors: {selectedTrigger.entity}
                  </p>
                )}
              </CardContent>
            </Card>

            {/* Connector Arrow */}
            <div className="flex justify-center">
              <ArrowDown className="w-5 h-5 text-slate-400" />
            </div>

            {/* CONDITIONS NODE */}
            <Card className="border-2 border-amber-200 bg-amber-50/50">
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 rounded bg-amber-500 text-white">
                      <Filter className="w-4 h-4" />
                    </div>
                    <span className="font-semibold text-amber-900">IF</span>
                    <Badge variant="outline" className="text-amber-600 border-amber-300">Conditions</Badge>
                    <span className="text-xs text-amber-600">(Optional)</span>
                  </div>
                  <Button 
                    type="button" 
                    variant="outline" 
                    size="sm"
                    onClick={addCondition}
                    disabled={!currentEntity}
                    className="h-7 text-xs"
                  >
                    <Plus className="w-3 h-3 mr-1" />
                    Add
                  </Button>
                </div>

                {formData.conditions.length === 0 ? (
                  <p className="text-sm text-amber-700 italic">
                    No conditions - rule will trigger for all matching events
                  </p>
                ) : (
                  <div className="space-y-2">
                    {formData.conditions.map((condition, index) => {
                      const selectedField = availableFields.find(f => f.value === condition.field);
                      return (
                        <div key={index} className="flex items-center gap-2 bg-white p-2 rounded border">
                          {index > 0 && (
                            <Badge variant="secondary" className="text-xs">AND</Badge>
                          )}
                          <Select 
                            value={condition.field} 
                            onValueChange={(v) => updateCondition(index, { field: v, value: '' })}
                          >
                            <SelectTrigger className="w-32 h-8 text-xs">
                              <SelectValue placeholder="Field" />
                            </SelectTrigger>
                            <SelectContent>
                              {availableFields.map((field) => (
                                <SelectItem key={field.value} value={field.value}>
                                  {field.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>

                          <Select 
                            value={condition.operator} 
                            onValueChange={(v) => updateCondition(index, { operator: v })}
                          >
                            <SelectTrigger className="w-28 h-8 text-xs">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {COMPARISON_OPERATORS.map((op) => (
                                <SelectItem key={op.value} value={op.value}>
                                  {op.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>

                          {!['is_empty', 'is_not_empty'].includes(condition.operator) && (
                            selectedField?.type === 'select' ? (
                              <Select 
                                value={condition.value} 
                                onValueChange={(v) => updateCondition(index, { value: v })}
                              >
                                <SelectTrigger className="w-32 h-8 text-xs">
                                  <SelectValue placeholder="Value" />
                                </SelectTrigger>
                                <SelectContent>
                                  {selectedField.options.map((opt) => (
                                    <SelectItem key={opt} value={opt}>
                                      {opt}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            ) : (
                              <Input
                                value={condition.value}
                                onChange={(e) => updateCondition(index, { value: e.target.value })}
                                placeholder="Value"
                                className="w-32 h-8 text-xs"
                              />
                            )
                          )}

                          <Button 
                            type="button" 
                            variant="ghost" 
                            size="icon"
                            onClick={() => removeCondition(index)}
                            className="h-8 w-8 text-red-500 hover:text-red-700 hover:bg-red-50"
                          >
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Connector Arrow */}
            <div className="flex justify-center">
              <ArrowDown className="w-5 h-5 text-slate-400" />
            </div>

            {/* ACTION NODE */}
            <Card className="border-2 border-green-200 bg-green-50/50">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-3">
                  <div className="p-1.5 rounded bg-green-500 text-white">
                    <Play className="w-4 h-4" />
                  </div>
                  <span className="font-semibold text-green-900">THEN</span>
                  <Badge variant="outline" className="text-green-600 border-green-300">Action</Badge>
                </div>
                
                <Select 
                  value={formData.action_type} 
                  onValueChange={(v) => setFormData({ ...formData, action_type: v, action_config: {} })}
                >
                  <SelectTrigger className="bg-white">
                    <SelectValue placeholder="Select an action..." />
                  </SelectTrigger>
                  <SelectContent>
                    {ACTION_TYPES.map((action) => {
                      const Icon = action.icon;
                      return (
                        <SelectItem key={action.value} value={action.value}>
                          <div className="flex items-center gap-2">
                            <Icon className="w-4 h-4 text-slate-500" />
                            {action.label}
                          </div>
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>

                {selectedAction && (
                  <p className="text-xs text-green-600 mt-2">
                    {selectedAction.description}
                  </p>
                )}

                {/* Action-specific configuration */}
                {formData.action_type === 'send_email' && (
                  <div className="mt-3 space-y-2">
                    <div>
                      <Label className="text-xs">Recipients (comma-separated)</Label>
                      <Input
                        value={formData.action_config.recipients || ''}
                        onChange={(e) => setFormData({
                          ...formData,
                          action_config: { ...formData.action_config, recipients: e.target.value }
                        })}
                        placeholder="email1@example.com, email2@example.com"
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label className="text-xs">Subject Template</Label>
                      <Input
                        value={formData.action_config.subject || ''}
                        onChange={(e) => setFormData({
                          ...formData,
                          action_config: { ...formData.action_config, subject: e.target.value }
                        })}
                        placeholder="[Alert] {{trigger_event}}"
                        className="mt-1"
                      />
                    </div>
                  </div>
                )}

                {formData.action_type === 'send_notification' && (
                  <div className="mt-3">
                    <Label className="text-xs">Notification Message</Label>
                    <Input
                      value={formData.action_config.message || ''}
                      onChange={(e) => setFormData({
                        ...formData,
                        action_config: { ...formData.action_config, message: e.target.value }
                      })}
                      placeholder="{{entity_name}} requires attention"
                      className="mt-1"
                    />
                  </div>
                )}

                {formData.action_type === 'create_task' && (
                  <div className="mt-3 space-y-2">
                    <div>
                      <Label className="text-xs">Task Name Template</Label>
                      <Input
                        value={formData.action_config.task_name || ''}
                        onChange={(e) => setFormData({
                          ...formData,
                          action_config: { ...formData.action_config, task_name: e.target.value }
                        })}
                        placeholder="Follow up: {{trigger_event}}"
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label className="text-xs">Priority</Label>
                      <Select 
                        value={formData.action_config.priority || 'medium'} 
                        onValueChange={(v) => setFormData({
                          ...formData,
                          action_config: { ...formData.action_config, priority: v }
                        })}
                      >
                        <SelectTrigger className="mt-1">
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
                  </div>
                )}

                {formData.action_type === 'update_status' && (
                  <div className="mt-3">
                    <Label className="text-xs">New Status</Label>
                    <Input
                      value={formData.action_config.new_status || ''}
                      onChange={(e) => setFormData({
                        ...formData,
                        action_config: { ...formData.action_config, new_status: e.target.value }
                      })}
                      placeholder="e.g., investigating"
                      className="mt-1"
                    />
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Active Toggle */}
          <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
            <div>
              <Label htmlFor="is_active" className="font-medium">Rule Active</Label>
              <p className="text-xs text-slate-500">Enable or disable this automation rule</p>
            </div>
            <Switch
              id="is_active"
              checked={formData.is_active}
              onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
            />
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={isLoading || !formData.trigger_event || !formData.action_type}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {rule ? 'Update Rule' : 'Create Rule'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}