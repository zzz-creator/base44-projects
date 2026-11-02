import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '../api/base44Client';
import { 
  Zap, 
  Plus, 
  Search, 
  MoreVertical,
  Pencil,
  Trash2,
  Loader2,
  Clock,
  CheckCircle,
  XCircle
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Badge } from '../components/ui/badge';
import { Switch } from '../components/ui/switch';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '../components/ui/dropdown-menu';
import { format } from 'date-fns';
import AutomationRuleForm from '../components/automation/AutomationRuleForm';

const statusColors = {
  success: 'bg-green-100 text-green-700',
  failed: 'bg-red-100 text-red-700',
  partial: 'bg-amber-100 text-amber-700',
};

export default function Automation() {
  const [searchTerm, setSearchTerm] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingRule, setEditingRule] = useState(null);

  const queryClient = useQueryClient();

  const { data: rules = [], isLoading } = useQuery({
    queryKey: ['automationRules'],
    queryFn: () => base44.entities.AutomationRule.list('-created_date'),
  });

  const { data: executions = [] } = useQuery({
    queryKey: ['executionLogs'],
    queryFn: () => base44.entities.ExecutionLog.list('-execution_date', 20),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.AutomationRule.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['automationRules'] }),
  });

  const toggleMutation = useMutation({
    mutationFn: ({ id, is_active }) => base44.entities.AutomationRule.update(id, { is_active }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['automationRules'] }),
  });

  const filteredRules = rules.filter(rule =>
    rule.rule_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    rule.trigger_event?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getRuleName = (ruleId) => {
    const rule = rules.find(r => r.id === ruleId);
    return rule?.rule_name || 'Unknown';
  };

  const handleEdit = (rule) => {
    setEditingRule(rule);
    setShowForm(true);
  };

  const handleCloseForm = () => {
    setShowForm(false);
    setEditingRule(null);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Automation Rules</h1>
          <p className="text-slate-500">Configure automated workflows and triggers</p>
        </div>
        <Button onClick={() => setShowForm(true)} className="bg-blue-600 hover:bg-blue-700">
          <Plus className="w-4 h-4 mr-2" />
          Create Rule
        </Button>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <Input
          placeholder="Search rules..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Rules List */}
        <div className="lg:col-span-2 space-y-4">
          <h2 className="font-semibold text-slate-700">Active Rules</h2>
          {isLoading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-slate-400" />
            </div>
          ) : filteredRules.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Zap className="w-12 h-12 text-slate-300 mb-4" />
                <h3 className="text-lg font-medium text-slate-900 mb-1">No automation rules</h3>
                <p className="text-slate-500 mb-4">
                  {searchTerm ? 'Try a different search' : 'Create your first automation rule'}
                </p>
                {!searchTerm && (
                  <Button onClick={() => setShowForm(true)}>
                    <Plus className="w-4 h-4 mr-2" />
                    Create Rule
                  </Button>
                )}
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {filteredRules.map((rule) => (
                <Card key={rule.id} className="hover:shadow-sm transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-start gap-3">
                        <div className={`p-2 rounded-lg ${rule.is_active ? 'bg-green-100' : 'bg-slate-100'}`}>
                          <Zap className={`w-5 h-5 ${rule.is_active ? 'text-green-600' : 'text-slate-400'}`} />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="font-semibold text-slate-900">{rule.rule_name}</h3>
                            <Badge variant={rule.is_active ? 'default' : 'secondary'}>
                              {rule.is_active ? 'Active' : 'Inactive'}
                            </Badge>
                          </div>
                          <p className="text-sm text-slate-600 mt-1">
                            <span className="font-medium">Trigger:</span> {rule.trigger_event}
                          </p>
                          <p className="text-sm text-slate-600">
                            <span className="font-medium">Action:</span> {rule.action_definition}
                          </p>
                          {rule.condition_logic && (
                            <p className="text-xs text-slate-500 mt-1">
                              Condition: {rule.condition_logic}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Switch
                          checked={rule.is_active}
                          onCheckedChange={(checked) => toggleMutation.mutate({ id: rule.id, is_active: checked })}
                        />
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreVertical className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleEdit(rule)}>
                              <Pencil className="w-4 h-4 mr-2" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              onClick={() => deleteMutation.mutate(rule.id)}
                              className="text-red-600"
                            >
                              <Trash2 className="w-4 h-4 mr-2" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* Execution Log */}
        <div>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <Clock className="w-4 h-4" />
                Recent Executions
              </CardTitle>
            </CardHeader>
            <CardContent>
              {executions.length === 0 ? (
                <div className="text-center py-6 text-slate-500">
                  <p className="text-sm">No executions yet</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {executions.slice(0, 10).map((exec) => (
                    <div key={exec.id} className="flex items-start gap-2 text-sm">
                      {exec.status === 'success' ? (
                        <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                      ) : exec.status === 'failed' ? (
                        <XCircle className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />
                      ) : (
                        <Clock className="w-4 h-4 text-amber-500 mt-0.5 flex-shrink-0" />
                      )}
                      <div className="min-w-0 flex-1">
                        <p className="font-medium text-slate-700 truncate">
                          {getRuleName(exec.rule_id)}
                        </p>
                        <p className="text-xs text-slate-500">
                          {exec.execution_date && format(new Date(exec.execution_date), 'MMM d, h:mm a')}
                        </p>
                        {exec.result_message && (
                          <p className="text-xs text-slate-500 truncate">{exec.result_message}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      <AutomationRuleForm
        open={showForm}
        onClose={handleCloseForm}
        rule={editingRule}
      />
    </div>
  );
}