import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '../api/base44Client';
import PullToRefresh from '../components/mobile/PullToRefresh';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../utils';
import { 
  Theater, 
  Plus, 
  Search, 
  Filter,
  Calendar,
  MapPin,
  MoreVertical,
  Pencil,
  Trash2,
  Eye,
  Loader2,
  Users
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
import ProductionForm from '../components/productions/ProductionForm';

const statusColors = {
  planning: 'bg-slate-100 text-slate-700',
  rehearsal: 'bg-blue-100 text-blue-700',
  active: 'bg-green-100 text-green-700',
  completed: 'bg-purple-100 text-purple-700',
  cancelled: 'bg-red-100 text-red-700',
};

export default function Productions() {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showForm, setShowForm] = useState(false);
  const [editingProduction, setEditingProduction] = useState(null);

  const queryClient = useQueryClient();

  const { data: productions = [], isLoading } = useQuery({
    queryKey: ['productions'],
    queryFn: () => base44.entities.Production.list('-created_date'),
  });

  const { data: venues = [] } = useQuery({
    queryKey: ['venues'],
    queryFn: () => base44.entities.Venue.list(),
  });

  const { data: crewAssignments = [] } = useQuery({
    queryKey: ['crewAssignments'],
    queryFn: () => base44.entities.CrewAssignment.list(),
  });

  const handleRefresh = async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ['productions'] }),
      queryClient.invalidateQueries({ queryKey: ['venues'] }),
      queryClient.invalidateQueries({ queryKey: ['crewAssignments'] }),
    ]);
  };

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.Production.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['productions'] }),
  });

  const getVenueName = (venueId) => {
    const venue = venues.find(v => v.id === venueId);
    return venue?.name || 'No venue';
  };

  const getCrewCount = (productionId) => {
    return crewAssignments.filter(c => c.production_id === productionId).length;
  };

  const filteredProductions = productions.filter(prod => {
    const matchesSearch = prod.name?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || prod.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleEdit = (production) => {
    setEditingProduction(production);
    setShowForm(true);
  };

  const handleCloseForm = () => {
    setShowForm(false);
    setEditingProduction(null);
  };

  return (
    <PullToRefresh onRefresh={handleRefresh}>
      <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Productions</h1>
          <p className="text-slate-500">Manage your productions and shows</p>
        </div>
        <Button onClick={() => setShowForm(true)} className="bg-blue-600 hover:bg-blue-700">
          <Plus className="w-4 h-4 mr-2" />
          New Production
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input
            placeholder="Search productions..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-40">
            <Filter className="w-4 h-4 mr-2" />
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="planning">Planning</SelectItem>
            <SelectItem value="rehearsal">Rehearsal</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
            <SelectItem value="cancelled">Cancelled</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Productions Grid */}
      {isLoading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-slate-400" />
        </div>
      ) : filteredProductions.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Theater className="w-12 h-12 text-slate-300 mb-4" />
            <h3 className="text-lg font-medium text-slate-900 mb-1">No productions found</h3>
            <p className="text-slate-500 mb-4">
              {searchTerm || statusFilter !== 'all' 
                ? 'Try adjusting your filters' 
                : 'Get started by creating your first production'}
            </p>
            {!searchTerm && statusFilter === 'all' && (
              <Button onClick={() => setShowForm(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Create Production
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredProductions.map((production) => (
            <Card key={production.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-5">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                      <Theater className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <Link 
                        to={createPageUrl(`ProductionDashboard?id=${production.id}`)}
                        className="font-semibold text-slate-900 hover:text-blue-600"
                      >
                        {production.name}
                      </Link>
                      <Badge className={`${statusColors[production.status]} ml-2 text-xs`}>
                        {production.status}
                      </Badge>
                    </div>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <MoreVertical className="w-4 h-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem asChild>
                        <Link to={createPageUrl(`ProductionDashboard?id=${production.id}`)}>
                          <Eye className="w-4 h-4 mr-2" />
                          Dashboard
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link to={createPageUrl(`ProductionDetail?id=${production.id}`)}>
                          <Eye className="w-4 h-4 mr-2" />
                          Full Details
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleEdit(production)}>
                        <Pencil className="w-4 h-4 mr-2" />
                        Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        onClick={() => deleteMutation.mutate(production.id)}
                        className="text-red-600"
                      >
                        <Trash2 className="w-4 h-4 mr-2" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>

                {production.description && (
                  <p className="text-sm text-slate-600 mb-3 line-clamp-2">
                    {production.description}
                  </p>
                )}

                <div className="space-y-2 text-sm text-slate-500">
                  {production.venue_id && (
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4" />
                      <span>{getVenueName(production.venue_id)}</span>
                    </div>
                  )}
                  {(production.start_date || production.end_date) && (
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4" />
                      <span>
                        {production.start_date && format(new Date(production.start_date), 'MMM d')}
                        {production.end_date && ` - ${format(new Date(production.end_date), 'MMM d, yyyy')}`}
                      </span>
                    </div>
                  )}
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4" />
                    <span>{getCrewCount(production.id)} crew members</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Production Form Dialog */}
      <ProductionForm
        open={showForm}
        onClose={handleCloseForm}
        production={editingProduction}
        venues={venues}
      />
    </div>
    </PullToRefresh>
  );
}