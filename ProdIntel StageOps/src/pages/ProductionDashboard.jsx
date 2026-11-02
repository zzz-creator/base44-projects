import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '../api/base44Client';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../utils';
import {
  Theater, ArrowLeft, Calendar, Users, ListTodo,
  AlertTriangle, Box, Loader2, CheckCircle2, Clock, TrendingUp, DollarSign
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { format, differenceInDays, isAfter, isBefore } from 'date-fns';
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip } from 'recharts';
import BudgetManager from '../components/budget/BudgetManager';
import BudgetChart from '../components/budget/BudgetChart';

const statusColors = {
  planning: 'bg-slate-100 text-slate-700',
  rehearsal: 'bg-blue-100 text-blue-700',
  active: 'bg-green-100 text-green-700',
  completed: 'bg-purple-100 text-purple-700',
  cancelled: 'bg-red-100 text-red-700',
};

const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444'];

export default function ProductionDashboard() {
  const urlParams = new URLSearchParams(window.location.search);
  const productionId = urlParams.get('id');

  const { data: production, isLoading } = useQuery({
    queryKey: ['production', productionId],
    queryFn: () => base44.entities.Production.filter({ id: productionId }),
    select: (data) => data[0],
    enabled: !!productionId,
  });

  const { data: venue } = useQuery({
    queryKey: ['venue', production?.venue_id],
    queryFn: () => base44.entities.Venue.filter({ id: production.venue_id }),
    select: (data) => data[0],
    enabled: !!production?.venue_id,
  });

  const { data: crewAssignments = [] } = useQuery({
    queryKey: ['crewAssignments', productionId],
    queryFn: () => base44.entities.CrewAssignment.filter({ production_id: productionId }),
    enabled: !!productionId,
  });

  const { data: tasks = [] } = useQuery({
    queryKey: ['tasks', productionId],
    queryFn: () => base44.entities.TaskChecklist.filter({ production_id: productionId }),
    enabled: !!productionId,
  });

  const { data: incidents = [] } = useQuery({
    queryKey: ['incidents', productionId],
    queryFn: () => base44.entities.IncidentLog.filter({ production_id: productionId }),
    enabled: !!productionId,
  });

  const { data: equipmentSchedules = [] } = useQuery({
    queryKey: ['equipmentSchedules', productionId],
    queryFn: () => base44.entities.EquipmentSchedule.filter({ production_id: productionId }),
    enabled: !!productionId,
  });

  const { data: assets = [] } = useQuery({
    queryKey: ['equipment'],
    queryFn: () => base44.entities.EquipmentAsset.list(),
  });

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-slate-400" />
      </div>
    );
  }

  if (!production) {
    return (
      <div className="text-center py-12">
        <Theater className="w-12 h-12 mx-auto text-slate-300 mb-4" />
        <h3 className="text-lg font-medium text-slate-900 mb-1">Production not found</h3>
        <Link to={createPageUrl('Productions')}>
          <Button variant="link">Back to Productions</Button>
        </Link>
      </div>
    );
  }

  // Calculate stats
  const completedTasks = tasks.filter(t => t.completion_status === 'completed').length;
  const pendingTasks = tasks.filter(t => t.completion_status === 'pending').length;
  const inProgressTasks = tasks.filter(t => t.completion_status === 'in_progress').length;
  const blockedTasks = tasks.filter(t => t.completion_status === 'blocked').length;

  const openIncidents = incidents.filter(i => ['open', 'investigating'].includes(i.resolution_status)).length;
  const criticalIncidents = incidents.filter(i => i.severity === 'critical' && i.resolution_status !== 'closed').length;

  const upcomingTasks = tasks
    .filter(t => t.due_date && t.completion_status !== 'completed' && isAfter(new Date(t.due_date), new Date()))
    .sort((a, b) => new Date(a.due_date) - new Date(b.due_date))
    .slice(0, 5);

  const overdueTasks = tasks.filter(t => 
    t.due_date && t.completion_status !== 'completed' && isBefore(new Date(t.due_date), new Date())
  );

  const taskChartData = [
    { name: 'Completed', value: completedTasks, color: '#10b981' },
    { name: 'In Progress', value: inProgressTasks, color: '#3b82f6' },
    { name: 'Pending', value: pendingTasks, color: '#f59e0b' },
    { name: 'Blocked', value: blockedTasks, color: '#ef4444' },
  ].filter(d => d.value > 0);

  const crewByRole = crewAssignments.reduce((acc, crew) => {
    acc[crew.role] = (acc[crew.role] || 0) + 1;
    return acc;
  }, {});

  const crewChartData = Object.entries(crewByRole).map(([role, count]) => ({
    name: role.replace('_', ' '),
    count,
  }));

  const daysUntilStart = production.start_date 
    ? differenceInDays(new Date(production.start_date), new Date())
    : null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Link to={createPageUrl('Productions')}>
            <Button variant="ghost" size="icon">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-slate-900">{production.name}</h1>
              <Badge className={statusColors[production.status]}>{production.status}</Badge>
            </div>
            <p className="text-slate-500">Production Dashboard</p>
          </div>
        </div>
        <Link to={createPageUrl(`ProductionDetail?id=${productionId}`)}>
          <Button variant="outline">View Full Details</Button>
        </Link>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-100">
                <Calendar className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-900">
                  {daysUntilStart !== null ? (daysUntilStart > 0 ? daysUntilStart : 'Live') : '-'}
                </p>
                <p className="text-xs text-slate-500">
                  {daysUntilStart > 0 ? 'Days to Start' : daysUntilStart === 0 ? 'Starts Today' : 'In Progress'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-green-100">
                <CheckCircle2 className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-900">
                  {tasks.length > 0 ? Math.round((completedTasks / tasks.length) * 100) : 0}%
                </p>
                <p className="text-xs text-slate-500">Tasks Complete</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-purple-100">
                <Users className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-900">{crewAssignments.length}</p>
                <p className="text-xs text-slate-500">Crew Members</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className={openIncidents > 0 ? 'border-red-200 bg-red-50/50' : ''}>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg ${openIncidents > 0 ? 'bg-red-100' : 'bg-slate-100'}`}>
                <AlertTriangle className={`w-5 h-5 ${openIncidents > 0 ? 'text-red-600' : 'text-slate-600'}`} />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-900">{openIncidents}</p>
                <p className="text-xs text-slate-500">Open Incidents</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Task Progress */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <ListTodo className="w-5 h-5" />
              Task Progress
            </CardTitle>
          </CardHeader>
          <CardContent>
            {tasks.length === 0 ? (
              <p className="text-center py-8 text-slate-500">No tasks created yet</p>
            ) : (
              <div className="flex items-center gap-6">
                <div className="w-32 h-32">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={taskChartData}
                        cx="50%"
                        cy="50%"
                        innerRadius={25}
                        outerRadius={50}
                        dataKey="value"
                      >
                        {taskChartData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="flex-1 space-y-2">
                  {taskChartData.map((item) => (
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
            )}
          </CardContent>
        </Card>

        {/* Crew by Role */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Users className="w-5 h-5" />
              Crew by Role
            </CardTitle>
          </CardHeader>
          <CardContent>
            {crewAssignments.length === 0 ? (
              <p className="text-center py-8 text-slate-500">No crew assigned yet</p>
            ) : (
              <div className="h-40">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={crewChartData} layout="vertical">
                    <XAxis type="number" hide />
                    <YAxis type="category" dataKey="name" width={80} tick={{ fontSize: 12 }} />
                    <Tooltip />
                    <Bar dataKey="count" fill="#6366f1" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Details Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Upcoming Tasks */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center justify-between">
              <span className="flex items-center gap-2">
                <Clock className="w-5 h-5" />
                Upcoming Tasks
              </span>
              {overdueTasks.length > 0 && (
                <Badge variant="destructive">{overdueTasks.length} overdue</Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {upcomingTasks.length === 0 ? (
              <p className="text-center py-4 text-slate-500">No upcoming tasks</p>
            ) : (
              <div className="space-y-3">
                {upcomingTasks.map((task) => (
                  <div key={task.id} className="flex items-center justify-between p-2 bg-slate-50 rounded">
                    <div>
                      <p className="font-medium text-sm text-slate-900">{task.task_name}</p>
                      <p className="text-xs text-slate-500">{task.assigned_to || 'Unassigned'}</p>
                    </div>
                    <Badge variant="outline" className="text-xs">
                      {format(new Date(task.due_date), 'MMM d')}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Incidents */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <AlertTriangle className="w-5 h-5" />
              Recent Incidents
            </CardTitle>
          </CardHeader>
          <CardContent>
            {incidents.length === 0 ? (
              <div className="text-center py-4">
                <CheckCircle2 className="w-8 h-8 mx-auto text-green-400 mb-2" />
                <p className="text-slate-500">No incidents</p>
              </div>
            ) : (
              <div className="space-y-3">
                {incidents.slice(0, 4).map((incident) => (
                  <div key={incident.id} className="p-2 bg-slate-50 rounded">
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-sm text-slate-900 line-clamp-1">{incident.description}</p>
                      <Badge variant={incident.severity === 'critical' ? 'destructive' : 'outline'} className="text-xs flex-shrink-0">
                        {incident.severity}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Equipment */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Box className="w-5 h-5" />
              Equipment Scheduled
            </CardTitle>
          </CardHeader>
          <CardContent>
            {equipmentSchedules.length === 0 ? (
              <div className="text-center py-4">
                <Box className="w-8 h-8 mx-auto text-slate-300 mb-2" />
                <p className="text-slate-500">No equipment scheduled</p>
                <Link to={createPageUrl(`EquipmentScheduling?production_id=${productionId}`)}>
                  <Button variant="link" size="sm">Schedule Equipment</Button>
                </Link>
              </div>
            ) : (
              <div className="space-y-3">
                {equipmentSchedules.slice(0, 4).map((schedule) => {
                  const asset = assets.find(a => a.id === schedule.asset_id);
                  return (
                    <div key={schedule.id} className="flex items-center justify-between p-2 bg-slate-50 rounded">
                      <span className="text-sm font-medium text-slate-900">{asset?.asset_name || 'Unknown'}</span>
                      <span className="text-xs text-slate-500">
                        {format(new Date(schedule.start_date), 'MMM d')} - {format(new Date(schedule.end_date), 'MMM d')}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Incident Severity Distribution */}
      {incidents.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <AlertTriangle className="w-5 h-5" />
                Incidents by Severity
              </CardTitle>
            </CardHeader>
            <CardContent>
              {(() => {
                const severityData = [
                  { name: 'Critical', value: incidents.filter(i => i.severity === 'critical').length, color: '#ef4444' },
                  { name: 'High', value: incidents.filter(i => i.severity === 'high').length, color: '#f97316' },
                  { name: 'Medium', value: incidents.filter(i => i.severity === 'medium').length, color: '#f59e0b' },
                  { name: 'Low', value: incidents.filter(i => i.severity === 'low').length, color: '#94a3b8' },
                ].filter(d => d.value > 0);

                return (
                  <div className="flex items-center gap-6">
                    <div className="w-32 h-32">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={severityData}
                            cx="50%"
                            cy="50%"
                            innerRadius={25}
                            outerRadius={50}
                            dataKey="value"
                          >
                            {severityData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                          </Pie>
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                    <div className="flex-1 space-y-2">
                      {severityData.map((item) => (
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
                );
              })()}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <TrendingUp className="w-5 h-5" />
                Equipment by Category
              </CardTitle>
            </CardHeader>
            <CardContent>
              {(() => {
                const scheduledAssetIds = equipmentSchedules.map(s => s.asset_id);
                const scheduledAssets = assets.filter(a => scheduledAssetIds.includes(a.id));
                const categoryData = scheduledAssets.reduce((acc, asset) => {
                  acc[asset.category] = (acc[asset.category] || 0) + 1;
                  return acc;
                }, {});
                
                const chartData = Object.entries(categoryData).map(([cat, count]) => ({
                  name: cat,
                  count,
                }));

                if (chartData.length === 0) {
                  return <p className="text-center py-4 text-slate-500">No equipment data</p>;
                }

                return (
                  <div className="h-40">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={chartData}>
                        <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                        <YAxis hide />
                        <Tooltip />
                        <Bar dataKey="count" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                );
              })()}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Budget Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <DollarSign className="w-5 h-5" />
              Budget Management
            </CardTitle>
          </CardHeader>
          <CardContent>
            <BudgetManager productionId={productionId} />
          </CardContent>
        </Card>
        <BudgetChart productionId={productionId} />
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-3">
            <Link to={createPageUrl(`ProductionDetail?id=${productionId}`)}>
              <Button variant="outline">
                <ListTodo className="w-4 h-4 mr-2" />
                Manage Tasks
              </Button>
            </Link>
            <Link to={createPageUrl(`EquipmentScheduling?production_id=${productionId}`)}>
              <Button variant="outline">
                <Box className="w-4 h-4 mr-2" />
                Schedule Equipment
              </Button>
            </Link>
            <Link to={createPageUrl('Incidents')}>
              <Button variant="outline">
                <AlertTriangle className="w-4 h-4 mr-2" />
                Log Incident
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}