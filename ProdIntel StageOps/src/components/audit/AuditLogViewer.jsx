import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '../../api/base44Client';
import { format } from 'date-fns';
import {
  History,
  Search,
  Plus,
  Pencil,
  Trash2,
  ChevronDown,
  ChevronRight,
  Loader2,
  User
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Input } from '../../components/ui/input';
import { Badge } from '../../components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../components/ui/select';

const actionColors = {
  create: 'bg-green-100 text-green-700',
  update: 'bg-blue-100 text-blue-700',
  delete: 'bg-red-100 text-red-700'
};

const actionIcons = {
  create: Plus,
  update: Pencil,
  delete: Trash2
};

export default function AuditLogViewer() {
  const [searchTerm, setSearchTerm] = useState('');
  const [entityFilter, setEntityFilter] = useState('all');
  const [actionFilter, setActionFilter] = useState('all');
  const [expandedLog, setExpandedLog] = useState(null);

  const { data: logs = [], isLoading } = useQuery({
    queryKey: ['auditLogs'],
    queryFn: () => base44.entities.AuditLog.list('-created_date', 100),
  });

  const filteredLogs = logs.filter(log => {
    const matchesSearch = 
      log.entity_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.user_email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.user_name?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesEntity = entityFilter === 'all' || log.entity_type === entityFilter;
    const matchesAction = actionFilter === 'all' || log.action === actionFilter;
    return matchesSearch && matchesEntity && matchesAction;
  });

  const entityTypes = [...new Set(logs.map(l => l.entity_type))].filter(Boolean);

  const formatChanges = (changesStr) => {
    try {
      const changes = JSON.parse(changesStr);
      return Object.entries(changes).map(([key, value]) => (
        <div key={key} className="text-xs">
          <span className="font-medium text-slate-600">{key}:</span>{' '}
          <span className="text-slate-800">
            {typeof value === 'object' ? JSON.stringify(value) : String(value)}
          </span>
        </div>
      ));
    } catch {
      return <span className="text-xs text-slate-500">{changesStr}</span>;
    }
  };

  return (
    <Card>
      <CardHeader className="pb-4">
        <CardTitle className="text-lg flex items-center gap-2">
          <History className="w-5 h-5" />
          Audit Log
        </CardTitle>
      </CardHeader>
      <CardContent>
        {/* Filters */}
        <div className="flex flex-wrap gap-3 mb-4">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input
              placeholder="Search by entity or user..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={entityFilter} onValueChange={setEntityFilter}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Entity Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Entities</SelectItem>
              {entityTypes.map(type => (
                <SelectItem key={type} value={type}>{type}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={actionFilter} onValueChange={setActionFilter}>
            <SelectTrigger className="w-[120px]">
              <SelectValue placeholder="Action" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Actions</SelectItem>
              <SelectItem value="create">Create</SelectItem>
              <SelectItem value="update">Update</SelectItem>
              <SelectItem value="delete">Delete</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Log List */}
        {isLoading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
          </div>
        ) : filteredLogs.length === 0 ? (
          <div className="text-center py-8 text-slate-500">
            <History className="w-10 h-10 mx-auto mb-2 text-slate-300" />
            <p>No audit logs found</p>
          </div>
        ) : (
          <div className="space-y-2 max-h-[500px] overflow-y-auto">
            {filteredLogs.map((log) => {
              const ActionIcon = actionIcons[log.action] || Pencil;
              const isExpanded = expandedLog === log.id;
              
              return (
                <div 
                  key={log.id} 
                  className="border rounded-lg hover:bg-slate-50 transition-colors"
                >
                  <button
                    onClick={() => setExpandedLog(isExpanded ? null : log.id)}
                    className="w-full p-3 flex items-start gap-3 text-left"
                  >
                    <div className={`p-1.5 rounded ${actionColors[log.action]}`}>
                      <ActionIcon className="w-3 h-3" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-medium text-slate-900">
                          {log.entity_name || log.entity_id}
                        </span>
                        <Badge variant="outline" className="text-xs">
                          {log.entity_type}
                        </Badge>
                        <Badge className={`text-xs ${actionColors[log.action]}`}>
                          {log.action}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-2 mt-1 text-xs text-slate-500">
                        <User className="w-3 h-3" />
                        <span>{log.user_name || log.user_email}</span>
                        <span>•</span>
                        <span>
                          {log.created_date && format(new Date(log.created_date), 'MMM d, yyyy h:mm a')}
                        </span>
                      </div>
                    </div>
                    {isExpanded ? (
                      <ChevronDown className="w-4 h-4 text-slate-400" />
                    ) : (
                      <ChevronRight className="w-4 h-4 text-slate-400" />
                    )}
                  </button>
                  
                  {isExpanded && (
                    <div className="px-3 pb-3 pt-0 border-t bg-slate-50">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-3">
                        {log.changes && (
                          <div>
                            <p className="text-xs font-semibold text-slate-600 mb-1">Changes Made:</p>
                            <div className="bg-white p-2 rounded border space-y-1">
                              {formatChanges(log.changes)}
                            </div>
                          </div>
                        )}
                        {log.previous_values && (
                          <div>
                            <p className="text-xs font-semibold text-slate-600 mb-1">Previous Values:</p>
                            <div className="bg-white p-2 rounded border space-y-1">
                              {formatChanges(log.previous_values)}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}