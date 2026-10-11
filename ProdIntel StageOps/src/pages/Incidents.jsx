import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '../api/base44Client';
import { 
  AlertTriangle, 
  Plus, 
  Search, 
  Filter,
  MoreVertical,
  Pencil,
  Trash2,
  CheckCircle,
  Loader2,
  Calendar
} from 'lucide-react';
import { Card, CardContent } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Badge } from '../components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '../components/ui/dropdown-menu';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../components/ui/select';
import { format } from 'date-fns';
import IncidentForm from '../components/incidents/IncidentForm';

const severityColors = {
  low: 'bg-slate-100 text-slate-700',
  medium: 'bg-yellow-100 text-yellow-700',
  high: 'bg-orange-100 text-orange-700',
  critical: 'bg-red-100 text-red-700',
};

const statusColors = {
  open: 'bg-red-100 text-red-700',
  investigating: 'bg-amber-100 text-amber-700',
  resolved: 'bg-blue-100 text-blue-700',
  closed: 'bg-green-100 text-green-700',
};

export default function Incidents() {
  const urlParams = new URLSearchParams(window.location.search);
  const preSelectedProductionId = urlParams.get('production_id');

  const [searchTerm, setSearchTerm] = useState('');
  const [severityFilter, setSeverityFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showForm, setShowForm] = useState(!!preSelectedProductionId);
  const [editingIncident, setEditingIncident] = useState(null);

  const queryClient = useQueryClient();

  const { data: incidents = [], isLoading } = useQuery({
    queryKey: ['incidents'],
    queryFn: () => base44.entities.IncidentLog.list('-created_date'),
  });

  const { data: productions = [] } = useQuery({
    queryKey: ['productions'],
    queryFn: () => base44.entities.Production.list(),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.IncidentLog.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['incidents'] }),
  });

  const getProductionName = (productionId) => {
    const production = productions.find(p => p.id === productionId);
    return production?.name || 'Unknown';
  };

  const filteredIncidents = incidents.filter(incident => {
    const matchesSearch = incident.description?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesSeverity = severityFilter === 'all' || incident.severity === severityFilter;
    const matchesStatus = statusFilter === 'all' || incident.resolution_status === statusFilter;
    return matchesSearch && matchesSeverity && matchesStatus;
  });

  const handleEdit = (incident) => {
    setEditingIncident(incident);
    setShowForm(true);
  };

  const handleCloseForm = () => {
    setShowForm(false);
    setEditingIncident(null);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Incident Log</h1>
          <p className="text-slate-500">Track and resolve production incidents</p>
        </div>
        <Button onClick={() => setShowForm(true)} className="bg-blue-600 hover:bg-blue-700">
          <Plus className="w-4 h-4 mr-2" />
          Log Incident
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input
            placeholder="Search incidents..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={severityFilter} onValueChange={setSeverityFilter}>
          <SelectTrigger className="w-full sm:w-36">
            <SelectValue placeholder="Severity" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Severity</SelectItem>
            <SelectItem value="low">Low</SelectItem>
            <SelectItem value="medium">Medium</SelectItem>
            <SelectItem value="high">High</SelectItem>
            <SelectItem value="critical">Critical</SelectItem>
          </SelectContent>
        </Select>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-36">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="open">Open</SelectItem>
            <SelectItem value="investigating">Investigating</SelectItem>
            <SelectItem value="resolved">Resolved</SelectItem>
            <SelectItem value="closed">Closed</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Incidents List */}
      {isLoading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-slate-400" />
        </div>
      ) : filteredIncidents.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <CheckCircle className="w-12 h-12 text-green-400 mb-4" />
            <h3 className="text-lg font-medium text-slate-900 mb-1">No incidents found</h3>
            <p className="text-slate-500 mb-4">
              {searchTerm || severityFilter !== 'all' || statusFilter !== 'all'
                ? 'Try adjusting your filters' 
                : 'Great! No incidents have been logged'}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {filteredIncidents.map((incident) => (
            <Card key={incident.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3">
                    <div className={`p-2 rounded-lg ${
                      incident.severity === 'critical' ? 'bg-red-100' : 
                      incident.severity === 'high' ? 'bg-orange-100' : 
                      incident.severity === 'medium' ? 'bg-yellow-100' : 'bg-slate-100'
                    }`}>
                      <AlertTriangle className={`w-5 h-5 ${
                        incident.severity === 'critical' ? 'text-red-600' : 
                        incident.severity === 'high' ? 'text-orange-600' : 
                        incident.severity === 'medium' ? 'text-yellow-600' : 'text-slate-600'
                      }`} />
                    </div>
                    <div>
                      <p className="font-medium text-slate-900">{incident.description}</p>
                      <div className="flex flex-wrap items-center gap-2 mt-2">
                        <Badge className={severityColors[incident.severity]}>
                          {incident.severity}
                        </Badge>
                        <Badge className={statusColors[incident.resolution_status]}>
                          {incident.resolution_status}
                        </Badge>
                        {incident.production_id && (
                          <span className="text-xs text-slate-500">
                            {getProductionName(incident.production_id)}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-4 mt-2 text-xs text-slate-500">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {incident.created_date && format(new Date(incident.created_date), 'MMM d, h:mm a')}
                        </span>
                        {incident.reported_by && (
                          <span>Reported by: {incident.reported_by}</span>
                        )}
                      </div>
                    </div>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <MoreVertical className="w-4 h-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => handleEdit(incident)}>
                        <Pencil className="w-4 h-4 mr-2" />
                        Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        onClick={() => deleteMutation.mutate(incident.id)}
                        className="text-red-600"
                      >
                        <Trash2 className="w-4 h-4 mr-2" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <IncidentForm
        open={showForm}
        onClose={handleCloseForm}
        incident={editingIncident}
        productions={productions}
        preSelectedProductionId={preSelectedProductionId}
      />
    </div>
  );
}