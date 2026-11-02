import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '../api/base44Client';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../utils';
import {
  Theater, Calendar, Clock, CheckCircle2, Loader2, Users, Filter
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '../components/ui/select';
import { format, isPast, isFuture } from 'date-fns';
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip } from 'recharts';

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
  rigger: 'Rigger',
  carpenter: 'Carpenter',
  electrician: 'Electrician',
  other: 'Other',
};

const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

export default function MyAssignments() {
  const [currentUser, setCurrentUser] = useState(null);
  const [statusFilter, setStatusFilter] = useState('active');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUser = async () => {
      const user = await base44.auth.me();
      setCurrentUser(user);
      setLoading(false);
    };
    fetchUser();
  }, []);

  // Find the crew member record for current user
  const { data: crewMember } = useQuery({
    queryKey: ['myCrewMember', currentUser?.email],
    queryFn: () => base44.entities.CrewMember.filter({ email: currentUser.email }),
    select: (data) => data[0],
    enabled: !!currentUser?.email,
  });

  // Get all assignments for this crew member
  const { data: assignments = [], isLoading: assignmentsLoading } = useQuery({
    queryKey: ['myAssignments', crewMember?.id],
    queryFn: () => base44.entities.CrewAssignment.filter({ crew_member_id: crewMember.id }),
    enabled: !!crewMember?.id,
  });

  const { data: productions = [] } = useQuery({
    queryKey: ['productions'],
    queryFn: () => base44.entities.Production.list(),
  });

  const getProduction = (prodId) => productions.find(p => p.id === prodId);

  if (loading || assignmentsLoading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-slate-400" />
      </div>
    );
  }

  if (!crewMember) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <Users className="w-16 h-16 text-slate-300 mb-4" />
        <h2 className="text-xl font-semibold text-slate-900 mb-2">No Crew Profile Found</h2>
        <p className="text-slate-500 text-center max-w-md">
          Your email ({currentUser?.email}) is not linked to a crew member profile. 
          Please contact an administrator to set up your profile.
        </p>
      </div>
    );
  }

  // Filter assignments
  const filteredAssignments = assignments.filter(a => {
    if (statusFilter === 'active') return ['assigned', 'confirmed', 'active'].includes(a.status);
    if (statusFilter === 'completed') return a.status === 'completed';
    if (statusFilter === 'all') return true;
    return a.status === statusFilter;
  });

  // Stats
  const activeCount = assignments.filter(a => ['assigned', 'confirmed', 'active'].includes(a.status)).length;
  const completedCount = assignments.filter(a => a.status === 'completed').length;

  // Role distribution chart data
  const roleDistribution = assignments.reduce((acc, a) => {
    acc[a.role] = (acc[a.role] || 0) + 1;
    return acc;
  }, {});
  
  const roleChartData = Object.entries(roleDistribution).map(([role, count]) => ({
    name: roleLabels[role] || role,
    value: count,
  }));

  // Status chart data
  const statusChartData = [
    { name: 'Active', value: activeCount, color: '#10b981' },
    { name: 'Completed', value: completedCount, color: '#8b5cf6' },
    { name: 'Cancelled', value: assignments.filter(a => a.status === 'cancelled').length, color: '#ef4444' },
  ].filter(d => d.value > 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-full bg-indigo-100 flex items-center justify-center">
            <span className="text-xl font-bold text-indigo-600">
              {crewMember.full_name?.charAt(0)?.toUpperCase()}
            </span>
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">My Assignments</h1>
            <p className="text-slate-500">{crewMember.full_name} • {roleLabels[crewMember.primary_role]}</p>
          </div>
        </div>
        <Link to={createPageUrl(`CrewMemberDetail?id=${crewMember.id}`)}>
          <Button variant="outline">View Full Profile</Button>
        </Link>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-green-100">
                <CheckCircle2 className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-900">{activeCount}</p>
                <p className="text-xs text-slate-500">Active Assignments</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-purple-100">
                <Theater className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-900">{completedCount}</p>
                <p className="text-xs text-slate-500">Completed</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-100">
                <Users className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-900">{assignments.length}</p>
                <p className="text-xs text-slate-500">Total Assignments</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-amber-100">
                <Clock className="w-5 h-5 text-amber-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-900">{Object.keys(roleDistribution).length}</p>
                <p className="text-xs text-slate-500">Different Roles</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row */}
      {assignments.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Assignments by Role</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={roleChartData} layout="vertical">
                    <XAxis type="number" hide />
                    <YAxis type="category" dataKey="name" width={100} tick={{ fontSize: 12 }} />
                    <Tooltip />
                    <Bar dataKey="value" fill="#6366f1" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Assignment Status</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-6">
                <div className="w-32 h-32">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={statusChartData}
                        cx="50%"
                        cy="50%"
                        innerRadius={25}
                        outerRadius={50}
                        dataKey="value"
                      >
                        {statusChartData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="flex-1 space-y-2">
                  {statusChartData.map((item) => (
                    <div key={item.name} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                        <span className="text-sm text-slate-600">{item.name}</span>
                      </div>
                      <span className="font-medium">{item.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Assignments List */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-lg">Assignments</CardTitle>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-36">
              <Filter className="w-4 h-4 mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="all">All</SelectItem>
            </SelectContent>
          </Select>
        </CardHeader>
        <CardContent>
          {filteredAssignments.length === 0 ? (
            <div className="text-center py-8 text-slate-500">
              <Theater className="w-10 h-10 mx-auto mb-2 text-slate-300" />
              <p>No assignments found</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredAssignments.map((assignment) => {
                const production = getProduction(assignment.production_id);
                const isUpcoming = assignment.start_date && isFuture(new Date(assignment.start_date));
                const isOngoing = assignment.start_date && assignment.end_date && 
                  isPast(new Date(assignment.start_date)) && isFuture(new Date(assignment.end_date));

                return (
                  <div key={assignment.id} className="p-4 bg-slate-50 rounded-lg">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3">
                        <div className={`p-2 rounded-lg ${
                          isOngoing ? 'bg-green-100' : isUpcoming ? 'bg-blue-100' : 'bg-slate-100'
                        }`}>
                          <Theater className={`w-5 h-5 ${
                            isOngoing ? 'text-green-600' : isUpcoming ? 'text-blue-600' : 'text-slate-600'
                          }`} />
                        </div>
                        <div>
                          <Link 
                            to={createPageUrl(`ProductionDashboard?id=${assignment.production_id}`)}
                            className="font-semibold text-slate-900 hover:text-blue-600"
                          >
                            {production?.name || 'Unknown Production'}
                          </Link>
                          <p className="text-sm text-slate-500">{roleLabels[assignment.role]}</p>
                          {(assignment.start_date || assignment.end_date) && (
                            <p className="text-xs text-slate-400 mt-1 flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              {assignment.start_date && format(new Date(assignment.start_date), 'MMM d, yyyy')}
                              {assignment.end_date && ` - ${format(new Date(assignment.end_date), 'MMM d, yyyy')}`}
                            </p>
                          )}
                          {assignment.notes && (
                            <p className="text-xs text-slate-500 mt-2">{assignment.notes}</p>
                          )}
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        <Badge className={statusColors[assignment.status]}>{assignment.status}</Badge>
                        {isOngoing && <Badge className="bg-green-100 text-green-700">Ongoing</Badge>}
                        {isUpcoming && <Badge className="bg-blue-100 text-blue-700">Upcoming</Badge>}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}