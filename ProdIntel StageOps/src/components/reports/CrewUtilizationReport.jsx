import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '../../api/base44Client';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { Loader2, Users, UserCheck, Calendar, Award } from 'lucide-react';
import ReportExporter from './ReportExporter';

const COLORS = ['#8b5cf6', '#f59e0b', '#10b981', '#3b82f6', '#ef4444', '#ec4899', '#6366f1'];

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
  other: 'Other'
};

export default function CrewUtilizationReport({ productionId, dateRange }) {
  const { data: crewMembers = [], isLoading: crewLoading } = useQuery({
    queryKey: ['crewMembers'],
    queryFn: () => base44.entities.CrewMember.list(),
  });

  const { data: assignments = [], isLoading: assignLoading } = useQuery({
    queryKey: ['crewAssignments'],
    queryFn: () => base44.entities.CrewAssignment.list(),
  });

  const { data: productions = [] } = useQuery({
    queryKey: ['productions'],
    queryFn: () => base44.entities.Production.list(),
  });

  const isLoading = crewLoading || assignLoading;

  // Filter assignments by production if selected
  const filteredAssignments = productionId && productionId !== 'all'
    ? assignments.filter(a => a.production_id === productionId)
    : assignments;

  // Calculate stats
  const activeCrewCount = crewMembers.filter(c => c.status === 'active').length;
  const assignedCrewIds = [...new Set(filteredAssignments.map(a => a.crew_member_id).filter(Boolean))];
  const assignedCount = assignedCrewIds.length;
  const unassignedCount = activeCrewCount - assignedCount;

  // Assignments by role
  const roleData = Object.entries(
    filteredAssignments.reduce((acc, a) => {
      acc[a.role] = (acc[a.role] || 0) + 1;
      return acc;
    }, {})
  ).map(([role, count], idx) => ({
    name: roleLabels[role] || role,
    value: count,
    color: COLORS[idx % COLORS.length]
  }));

  // Crew workload (assignments per crew member)
  const workloadData = crewMembers
    .filter(c => c.status === 'active')
    .map(crew => {
      const crewAssignments = filteredAssignments.filter(a => a.crew_member_id === crew.id);
      return {
        name: crew.full_name?.substring(0, 15) || 'Unknown',
        assignments: crewAssignments.length,
        active: crewAssignments.filter(a => a.status === 'active' || a.status === 'confirmed').length
      };
    })
    .sort((a, b) => b.assignments - a.assignments)
    .slice(0, 10);

  // Availability stats
  const availabilityStats = {
    active: crewMembers.filter(c => c.status === 'active').length,
    inactive: crewMembers.filter(c => c.status === 'inactive').length,
    onLeave: crewMembers.filter(c => c.status === 'on_leave').length
  };

  // CSV columns
  const csvColumns = [
    { header: 'Name', key: 'full_name' },
    { header: 'Email', key: 'email' },
    { header: 'Primary Role', accessor: (c) => roleLabels[c.primary_role] || c.primary_role },
    { header: 'Status', key: 'status' },
    { header: 'Hourly Rate', key: 'hourly_rate' },
    { header: 'Total Assignments', accessor: (c) => assignments.filter(a => a.crew_member_id === c.id).length },
  ];

  // PDF sections
  const pdfSections = [
    {
      title: 'Crew Summary',
      type: 'summary',
      items: [
        { label: 'Total Crew Members', value: crewMembers.length },
        { label: 'Active', value: availabilityStats.active },
        { label: 'Inactive', value: availabilityStats.inactive },
        { label: 'On Leave', value: availabilityStats.onLeave },
        { label: 'Currently Assigned', value: assignedCount },
        { label: 'Utilization Rate', value: `${activeCrewCount > 0 ? Math.round((assignedCount / activeCrewCount) * 100) : 0}%` },
      ]
    },
    {
      title: 'Assignments by Role',
      type: 'summary',
      items: roleData.map(r => ({ label: r.name, value: r.value }))
    },
    {
      title: 'Crew Details',
      type: 'table',
      columns: csvColumns.map(c => ({ ...c, width: 30 })),
      data: crewMembers
    }
  ];

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-slate-400" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Export Button */}
      <div className="flex justify-end">
        <ReportExporter
          title="Crew Utilization Report"
          csvData={crewMembers}
          csvColumns={csvColumns}
          pdfSections={pdfSections}
          filename="crew_utilization"
        />
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-purple-100">
                <Users className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{crewMembers.length}</p>
                <p className="text-xs text-slate-500">Total Crew</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-green-100">
                <UserCheck className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{activeCrewCount}</p>
                <p className="text-xs text-slate-500">Active</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-100">
                <Calendar className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{assignedCount}</p>
                <p className="text-xs text-slate-500">Assigned</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-amber-100">
                <Award className="w-5 h-5 text-amber-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {activeCrewCount > 0 ? Math.round((assignedCount / activeCrewCount) * 100) : 0}%
                </p>
                <p className="text-xs text-slate-500">Utilization</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Assignments by Role</CardTitle>
          </CardHeader>
          <CardContent>
            {roleData.length === 0 ? (
              <p className="text-center py-8 text-slate-500">No assignment data</p>
            ) : (
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={roleData}
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      dataKey="value"
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    >
                      {roleData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Crew Workload (Top 10)</CardTitle>
          </CardHeader>
          <CardContent>
            {workloadData.length === 0 ? (
              <p className="text-center py-8 text-slate-500">No workload data</p>
            ) : (
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={workloadData} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" />
                    <YAxis type="category" dataKey="name" width={100} tick={{ fontSize: 10 }} />
                    <Tooltip />
                    <Bar dataKey="assignments" fill="#8b5cf6" name="Total Assignments" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Crew Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Crew Members</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2 px-3">Name</th>
                  <th className="text-left py-2 px-3">Role</th>
                  <th className="text-left py-2 px-3">Status</th>
                  <th className="text-left py-2 px-3">Assignments</th>
                  <th className="text-left py-2 px-3">Rate</th>
                </tr>
              </thead>
              <tbody>
                {crewMembers.slice(0, 10).map(crew => {
                  const crewAssignCount = assignments.filter(a => a.crew_member_id === crew.id).length;
                  return (
                    <tr key={crew.id} className="border-b hover:bg-slate-50">
                      <td className="py-2 px-3 font-medium">{crew.full_name}</td>
                      <td className="py-2 px-3">{roleLabels[crew.primary_role] || crew.primary_role}</td>
                      <td className="py-2 px-3">
                        <Badge variant="outline">{crew.status}</Badge>
                      </td>
                      <td className="py-2 px-3">{crewAssignCount}</td>
                      <td className="py-2 px-3">{crew.hourly_rate ? `$${crew.hourly_rate}/hr` : '-'}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}