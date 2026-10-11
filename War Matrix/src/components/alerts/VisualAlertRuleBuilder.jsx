import React, { useState } from 'react';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Slider } from '../ui/slider';
import { Badge } from '../ui/badge';
import { Plus, X, Trash2, GitBranch, Zap } from 'lucide-react';

export default function VisualAlertRuleBuilder({ onSave }) {
  const [ruleName, setRuleName] = useState('');
  const [conditions, setConditions] = useState([{
    id: 1,
    type: 'region',
    operator: 'equals',
    value: '',
    weight: 50
  }]);
  const [logic, setLogic] = useState('AND'); // AND or OR
  const [notificationMethods, setNotificationMethods] = useState(['in_app']);

  const conditionTypes = [
    { value: 'region', label: 'Region' },
    { value: 'conflict_type', label: 'Conflict Type' },
    { value: 'probability', label: 'Probability' },
    { value: 'severity', label: 'Severity Level' },
    { value: 'keyword', label: 'Keyword Mention' },
    { value: 'casualties', label: 'Casualty Count' },
    { value: 'economic_impact', label: 'Economic Impact' }
  ];

  const operators = {
    region: ['equals', 'contains'],
    conflict_type: ['equals', 'contains'],
    probability: ['greater_than', 'less_than', 'equals'],
    severity: ['equals', 'greater_than_or_equal'],
    keyword: ['contains', 'equals'],
    casualties: ['greater_than', 'less_than'],
    economic_impact: ['greater_than', 'less_than']
  };

  const addCondition = () => {
    setConditions([...conditions, {
      id: Date.now(),
      type: 'region',
      operator: 'equals',
      value: '',
      weight: 50
    }]);
  };

  const removeCondition = (id) => {
    if (conditions.length > 1) {
      setConditions(conditions.filter(c => c.id !== id));
    }
  };

  const updateCondition = (id, field, value) => {
    setConditions(conditions.map(c => 
      c.id === id ? { ...c, [field]: value } : c
    ));
  };

  const calculateTotalScore = () => {
    return conditions.reduce((sum, c) => sum + c.weight, 0);
  };

  const handleSave = () => {
    const rule = {
      name: ruleName,
      conditions,
      logic,
      notification_methods: notificationMethods,
      total_score: calculateTotalScore()
    };
    onSave(rule);
  };

  const getWeightColor = (weight) => {
    if (weight >= 70) return 'text-red-400';
    if (weight >= 40) return 'text-yellow-400';
    return 'text-green-400';
  };

  return (
    <Card className="bg-slate-950/80 backdrop-blur-xl cyber-border p-6">
      <div className="flex items-center gap-3 mb-6">
        <GitBranch className="w-6 h-6 text-cyan-400" />
        <h3 className="text-xl font-bold text-cyan-400 glow-text font-mono">
          VISUAL ALERT RULE BUILDER
        </h3>
      </div>

      <div className="space-y-6">
        {/* Rule Name */}
        <div className="space-y-2">
          <Label className="text-cyan-400 font-mono">Alert Rule Name</Label>
          <Input
            value={ruleName}
            onChange={(e) => setRuleName(e.target.value)}
            placeholder="e.g., High-Risk Middle East Escalation"
            className="bg-slate-900/50 border-green-500/30 text-green-400 font-mono"
          />
        </div>

        {/* Logic Selector */}
        <div className="space-y-2">
          <Label className="text-cyan-400 font-mono">Condition Logic</Label>
          <div className="flex gap-2">
            <Button
              variant={logic === 'AND' ? 'default' : 'outline'}
              onClick={() => setLogic('AND')}
              className={logic === 'AND' ? 'bg-purple-500/20 text-purple-400 border-purple-500/30' : ''}
            >
              ALL Conditions (AND)
            </Button>
            <Button
              variant={logic === 'OR' ? 'default' : 'outline'}
              onClick={() => setLogic('OR')}
              className={logic === 'OR' ? 'bg-blue-500/20 text-blue-400 border-blue-500/30' : ''}
            >
              ANY Condition (OR)
            </Button>
          </div>
        </div>

        {/* Conditions Builder */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Label className="text-cyan-400 font-mono">Conditions & Weights</Label>
            <Badge className="bg-purple-500/20 text-purple-400 border-purple-500/30 font-mono">
              Total Score: {calculateTotalScore()}
            </Badge>
          </div>

          {conditions.map((condition, idx) => (
            <div key={condition.id} className="relative">
              {idx > 0 && (
                <div className="absolute -top-3 left-4 bg-slate-950 px-2">
                  <Badge 
                    variant="outline" 
                    className={`text-xs font-mono ${logic === 'AND' ? 'border-purple-500/30 text-purple-400' : 'border-blue-500/30 text-blue-400'}`}
                  >
                    {logic}
                  </Badge>
                </div>
              )}
              
              <Card className="bg-slate-900/50 cyber-border p-4">
                <div className="grid md:grid-cols-4 gap-3 mb-3">
                  <div className="space-y-2">
                    <Label className="text-xs text-slate-400 font-mono">Condition Type</Label>
                    <Select
                      value={condition.type}
                      onValueChange={(value) => updateCondition(condition.id, 'type', value)}
                    >
                      <SelectTrigger className="bg-slate-950 border-cyan-500/30 text-green-400 font-mono text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-slate-900 border-cyan-500/30">
                        {conditionTypes.map(type => (
                          <SelectItem key={type.value} value={type.value} className="text-green-400 font-mono">
                            {type.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-xs text-slate-400 font-mono">Operator</Label>
                    <Select
                      value={condition.operator}
                      onValueChange={(value) => updateCondition(condition.id, 'operator', value)}
                    >
                      <SelectTrigger className="bg-slate-950 border-cyan-500/30 text-green-400 font-mono text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-slate-900 border-cyan-500/30">
                        {operators[condition.type]?.map(op => (
                          <SelectItem key={op} value={op} className="text-green-400 font-mono">
                            {op.replace('_', ' ')}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-xs text-slate-400 font-mono">Value</Label>
                    <Input
                      value={condition.value}
                      onChange={(e) => updateCondition(condition.id, 'value', e.target.value)}
                      placeholder="Enter value..."
                      className="bg-slate-950 border-cyan-500/30 text-green-400 font-mono text-xs"
                    />
                  </div>

                  <div className="flex items-end">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => removeCondition(condition.id)}
                      disabled={conditions.length === 1}
                      className="w-full border-red-500/30 text-red-400 hover:bg-red-500/10"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label className="text-xs text-slate-400 font-mono">Priority Weight</Label>
                    <span className={`text-sm font-bold font-mono ${getWeightColor(condition.weight)}`}>
                      {condition.weight}
                    </span>
                  </div>
                  <Slider
                    value={[condition.weight]}
                    onValueChange={(value) => updateCondition(condition.id, 'weight', value[0])}
                    min={0}
                    max={100}
                    step={5}
                    className="cursor-pointer"
                  />
                  <div className="flex justify-between text-xs text-slate-500 font-mono">
                    <span>Low Priority</span>
                    <span>High Priority</span>
                  </div>
                </div>
              </Card>
            </div>
          ))}

          <Button
            onClick={addCondition}
            variant="outline"
            className="w-full border-green-500/30 text-green-400 hover:bg-green-500/10 font-mono"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Condition
          </Button>
        </div>

        {/* Notification Methods */}
        <div className="space-y-2">
          <Label className="text-cyan-400 font-mono">Notification Methods</Label>
          <div className="flex gap-2">
            {['in_app', 'email'].map(method => (
              <Button
                key={method}
                variant={notificationMethods.includes(method) ? 'default' : 'outline'}
                onClick={() => {
                  if (notificationMethods.includes(method)) {
                    setNotificationMethods(notificationMethods.filter(m => m !== method));
                  } else {
                    setNotificationMethods([...notificationMethods, method]);
                  }
                }}
                className={notificationMethods.includes(method) ? 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30' : ''}
              >
                {method === 'in_app' ? 'In-App' : 'Email'}
              </Button>
            ))}
          </div>
        </div>

        {/* Visual Flow Preview */}
        <Card className="bg-slate-900/50 cyber-border p-4">
          <Label className="text-yellow-400 font-mono text-xs mb-3 block">RULE FLOW PREVIEW</Label>
          <div className="space-y-2">
            {conditions.map((condition, idx) => (
              <div key={condition.id} className="flex items-center gap-2 text-xs font-mono">
                <Badge variant="outline" className="border-cyan-500/30 text-cyan-400">
                  {condition.type}
                </Badge>
                <span className="text-slate-400">{condition.operator}</span>
                <Badge variant="outline" className="border-green-500/30 text-green-400">
                  {condition.value || '???'}
                </Badge>
                <span className={`ml-auto ${getWeightColor(condition.weight)}`}>
                  Weight: {condition.weight}
                </span>
                {idx < conditions.length - 1 && (
                  <Badge className={`${logic === 'AND' ? 'bg-purple-500/20 text-purple-400' : 'bg-blue-500/20 text-blue-400'}`}>
                    {logic}
                  </Badge>
                )}
              </div>
            ))}
          </div>
        </Card>

        {/* Save Button */}
        <Button
          onClick={handleSave}
          disabled={!ruleName || conditions.some(c => !c.value)}
          className="w-full bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white font-mono text-lg py-6"
        >
          <Zap className="w-5 h-5 mr-2" />
          SAVE ALERT RULE
        </Button>
      </div>
    </Card>
  );
}