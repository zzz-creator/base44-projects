import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '../api/base44Client';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../utils';
import { 
  Users, 
  Search, 
  Filter,
  Theater,
  Loader2,
  Phone,
  Mail
} from 'lucide-react';
import { Card, CardContent } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Badge } from '../components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../components/ui/select';

const statusColors = {
  assigned: 'bg-slate-100 text-slate-700',
  confirmed: 'bg-blue-100 text-blue-700',
  active: 'bg-green-100 text-green-700',
  completed: 'bg-purple-100 text-purple-700',
  cancelled: 'bg-red-100 text-red-700',
};

const roleLabels = {
  stage_manager: 'Stage Manager',
  lighting: 'Lighting',
  sound: 'Sound',
  props: 'Props',
  wardrobe: 'Wardrobe',
  set: 'Set',
  technical_director: 'Technical Director',
  other: 'Other',
};

export default function CrewAssignments() {
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');

  const { data: assignments = [], isLoading } = useQuery({
    queryKey: ['allCrewAssignments'],
    queryFn: () => base44.entities.CrewAssignment.list('-created_date'),
  });

  const { data: productions = [] } = useQuery({
    queryKey: ['productions'],
    queryFn: () => base44.entities.Production.list(),
  });

  const getProductionName = (productionId) => {
    const production = productions.find(p => p.id === productionId);
    return production?.name || 'Unknown';
  };

  const filteredAssignments = assignments.filter(assignment => {
    const matchesSearch = 
      assignment.crew_member_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      assignment.contact_info?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = roleFilter === 'all' || assignment.role === roleFilter;
    const matchesStatus = statusFilter === 'all' || assignment.status === statusFilter;
    return matchesSearch && matchesRole && matchesStatus;
  });

  // Group by production
  const groupedByProduction = filteredAssignments.reduce((acc, assignment) => {
    const prodId = assignment.production_id || 'unassigned';
    if (!acc[prodId]) acc[prodId] = [];
    acc[prodId].push(assignment);
    return acc;
  }, {});

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Crew Assignments</h1>
        <p className="text-slate-500">All crew assignments across productions</p>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input
            placeholder="Search crew members..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={roleFilter} onValueChange={setRoleFilter}>
          <SelectTrigger className="w-full sm:w-40">
            <SelectValue placeholder="Role" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Roles</SelectItem>
            {Object.entries(roleLabels).map(([value, label]) => (
              <SelectItem key={value} value={value}>{label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-36">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="assigned">Assigned</SelectItem>
            <SelectItem value="confirmed">Confirmed</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
            <SelectItem value="cancelled">Cancelled</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Assignments */}
      {isLoading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-slate-400" />
        </div>
      ) : filteredAssignments.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Users className="w-12 h-12 text-slate-300 mb-4" />
            <h3 className="text-lg font-medium text-slate-900 mb-1">No crew assignments found</h3>
            <p className="text-slate-500 mb-4">
              {searchTerm || roleFilter !== 'all' || statusFilter !== 'all'
                ? 'Try adjusting your filters' 
                : 'Crew is assigned within productions'}
            </p>
            <Link to={createPageUrl('Productions')}>
              <Button variant="outline">
                <Theater className="w-4 h-4 mr-2" />
                Go to Productions
              </Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {Object.entries(groupedByProduction).map(([prodId, crewList]) => (
            <div key={prodId}>
              <div className="flex items-center gap-2 mb-3">
                <Theater className="w-4 h-4 text-slate-400" />
                <h3 className="font-semibold text-slate-700">
                  {prodId === 'unassigned' ? 'Unassigned' : (
                    <Link 
                      to={createPageUrl(`ProductionDetail?id=${prodId}`)}
                      className="hover:text-blue-600"
                    >
                      {getProductionName(prodId)}
                    </Link>
                  )}
                </h3>
                <Badge variant="outline" className="text-xs">{crewList.length} members</Badge>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {crewList.map((crew) => (
                  <Card key={crew.id}>
                    <CardContent className="p-4">
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center flex-shrink-0">
                          <span className="text-sm font-medium text-indigo-600">
                            {crew.crew_member_name?.charAt(0)?.toUpperCase()}
                          </span>
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="font-medium text-slate-900">{crew.crew_member_name}</p>
                          <p className="text-sm text-slate-500">{roleLabels[crew.role] || crew.role}</p>
                          {crew.contact_info && (
                            <p className="text-xs text-slate-400 mt-1 truncate">{crew.contact_info}</p>
                          )}
                        </div>
                        <Badge className={statusColors[crew.status]}>{crew.status}</Badge>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}