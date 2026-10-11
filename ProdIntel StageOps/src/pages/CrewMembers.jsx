import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '../api/base44Client';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../utils';
import { 
  Users, Plus, Search, MoreVertical, Pencil, Trash2, 
  Loader2, Phone, Mail, Shield
} from 'lucide-react';
import { useCurrentUser } from '../components/auth/RoleGuard';
import { Card, CardContent } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Badge } from '../components/ui/badge';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from '../components/ui/dropdown-menu';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '../components/ui/select';
import CrewMemberForm from '../components/crew/CrewMemberForm';

const statusColors = {
  active: 'bg-green-100 text-green-700',
  inactive: 'bg-slate-100 text-slate-700',
  on_leave: 'bg-amber-100 text-amber-700',
};

const roleLabels = {
  stage_manager: 'Stage Manager',
  lighting: 'Lighting',
  sound: 'Sound',
  props: 'Props',
  wardrobe: 'Wardrobe',
  set: 'Set',
  technical_director: 'Technical Director',
  rigger: 'Rigger',
  carpenter: 'Carpenter',
  electrician: 'Electrician',
  other: 'Other',
};

export default function CrewMembers() {
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showForm, setShowForm] = useState(false);
  const [editingMember, setEditingMember] = useState(null);
  const { user, loading: userLoading, isAdmin } = useCurrentUser();

  const queryClient = useQueryClient();

  const { data: crewMembers = [], isLoading } = useQuery({
    queryKey: ['crewMembers'],
    queryFn: () => base44.entities.CrewMember.list('-created_date'),
  });

  const { data: assignments = [] } = useQuery({
    queryKey: ['allCrewAssignments'],
    queryFn: () => base44.entities.CrewAssignment.list(),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.CrewMember.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['crewMembers'] }),
  });

  const getAssignmentCount = (memberId) => {
    return assignments.filter(a => a.crew_member_id === memberId).length;
  };

  const filteredMembers = crewMembers.filter(member => {
    const matchesSearch = 
      member.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      member.email?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = roleFilter === 'all' || member.primary_role === roleFilter;
    const matchesStatus = statusFilter === 'all' || member.status === statusFilter;
    return matchesSearch && matchesRole && matchesStatus;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Crew Members</h1>
          <p className="text-slate-500">Manage your crew roster</p>
        </div>
        {isAdmin && (
          <Button onClick={() => setShowForm(true)} className="bg-blue-600 hover:bg-blue-700">
            <Plus className="w-4 h-4 mr-2" />
            Add Crew Member
          </Button>
        )}
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input
            placeholder="Search by name or email..."
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
          <SelectTrigger className="w-full sm:w-32">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="inactive">Inactive</SelectItem>
            <SelectItem value="on_leave">On Leave</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-slate-400" />
        </div>
      ) : filteredMembers.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Users className="w-12 h-12 text-slate-300 mb-4" />
            <h3 className="text-lg font-medium text-slate-900 mb-1">No crew members found</h3>
            <p className="text-slate-500 mb-4">Add crew members to your roster</p>
            {isAdmin && (
              <Button onClick={() => setShowForm(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Add Crew Member
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredMembers.map((member) => (
            <Card key={member.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-5">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-indigo-100 flex items-center justify-center">
                      <span className="text-lg font-semibold text-indigo-600">
                        {member.full_name?.charAt(0)?.toUpperCase()}
                      </span>
                    </div>
                    <div>
                      <Link 
                        to={createPageUrl(`CrewMemberDetail?id=${member.id}`)}
                        className="font-semibold text-slate-900 hover:text-blue-600"
                      >
                        {member.full_name}
                      </Link>
                      <p className="text-sm text-slate-500">{roleLabels[member.primary_role]}</p>
                    </div>
                  </div>
                  {isAdmin && (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreVertical className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => { setEditingMember(member); setShowForm(true); }}>
                          <Pencil className="w-4 h-4 mr-2" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => deleteMutation.mutate(member.id)} className="text-red-600">
                          <Trash2 className="w-4 h-4 mr-2" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  )}
                </div>

                <div className="space-y-2 text-sm">
                  {member.email && (
                    <div className="flex items-center gap-2 text-slate-500">
                      <Mail className="w-4 h-4" />
                      <span className="truncate">{member.email}</span>
                    </div>
                  )}
                  {member.phone && (
                    <div className="flex items-center gap-2 text-slate-500">
                      <Phone className="w-4 h-4" />
                      <span>{member.phone}</span>
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-between mt-4 pt-3 border-t">
                  <Badge className={statusColors[member.status]}>{member.status}</Badge>
                  <span className="text-xs text-slate-500">{getAssignmentCount(member.id)} assignments</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <CrewMemberForm
        open={showForm}
        onClose={() => { setShowForm(false); setEditingMember(null); }}
        member={editingMember}
      />
    </div>
  );
}