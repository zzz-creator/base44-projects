import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '../../api/base44Client';
import { format } from 'date-fns';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { Loader2, CheckCircle2, AlertTriangle, Clock, ListTodo } from 'lucide-react';
import ReportExporter from './ReportExporter';

const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444'];

export default function ProductionProgressReport({ productionId, dateRange }) {
  const { data: productions = [], isLoading: prodLoading } = useQuery({
    queryKey: ['productions'],
    queryFn: () => base44.entities.Production.list(),
  });

  const { data: allTasks = [], isLoading: tasksLoading } = useQuery({
    queryKey: ['allTasks'],
    queryFn: () => base44.entities.TaskChecklist.list(),
  });

  const { data: allIncidents = [], isLoading: incidentsLoading } = useQuery({
    queryKey: ['allIncidents'],
    queryFn: () => base44.entities.IncidentLog.list(),
  });

  const isLoading = prodLoading || tasksLoading || incidentsLoading;

  // Filter by production if selected
  const filteredProductions = productionId && productionId !== 'all'
    ? productions.filter(p => p.id === productionId)
    : productions;

  const tasks = productionId && productionId !== 'all'
    ? allTasks.filter(t => t.production_id === productionId)
    : allTasks;

  const incidents = productionId && productionId !== 'all'
    ? allIncidents.filter(i => i.production_id === productionId)
    : allIncidents;

  // Calculate stats
  const taskStats = {
    total: tasks.length,
    completed: tasks.filter(t => t.completion_status === 'completed').length,
    inProgress: tasks.filter(t => t.completion_status === 'in_progress').length,
    pending: tasks.filter(t => t.completion_status === 'pending').length,
    blocked: tasks.filter(t => t.completion_status === 'blocked').length,
  };

  const incidentStats = {
    total: incidents.length,
    open: incidents.filter(i => i.resolution_status === 'open').length,
    investigating: incidents.filter(i => i.resolution_status === 'investigating').length,
    resolved: incidents.filter(i => i.resolution_status === 'resolved').length,
    closed: incidents.filter(i => i.resolution_status === 'closed').length,
  };

  const taskChartData = [
    { name: 'Completed', value: taskStats.completed, color: '#10b981' },
    { name: 'In Progress', value: taskStats.inProgress, color: '#3b82f6' },
    { name: 'Pending', value: taskStats.pending, color: '#f59e0b' },
    { name: 'Blocked', value: taskStats.blocked, color: '#ef4444' },
  ].filter(d => d.value > 0);

  const productionTaskData = filteredProductions.map(prod => {
    const prodTasks = allTasks.filter(t => t.production_id === prod.id);
    return {
      name: prod.name.substring(0, 15),
      Completed: prodTasks.filter(t => t.completion_status === 'completed').length,
      'In Progress': prodTasks.filter(t => t.completion_status === 'in_progress').length,
      Pending: prodTasks.filter(t => t.completion_status === 'pending').length,
    };
  });

  // CSV Export columns
  const taskColumns = [
    { header: 'Task Name', key: 'task_name' },
    { header: 'Production', accessor: (t) => productions.find(p => p.id === t.production_id)?.name || 'N/A' },
    { header: 'Status', key: 'completion_status' },
    { header: 'Priority', key: 'priority' },
    { header: 'Assigned To', key: 'assigned_to' },
    { header: 'Due Date', key: 'due_date' },
  ];

  // PDF sections
  const pdfSections = [
    {
      title: 'Task Summary',
      type: 'summary',
      items: [
        { label: 'Total Tasks', value: taskStats.total },
        { label: 'Completed', value: taskStats.completed },
        { label: 'In Progress', value: taskStats.inProgress },
        { label: 'Pending', value: taskStats.pending },
        { label: 'Blocked', value: taskStats.blocked },
        { label: 'Completion Rate', value: `${taskStats.total > 0 ? Math.round((taskStats.completed / taskStats.total) * 100) : 0}%` },
      ]
    },
    {
      title: 'Incident Summary',
      type: 'summary',
      items: [
        { label: 'Total Incidents', value: incidentStats.total },
        { label: 'Open', value: incidentStats.open },
        { label: 'Investigating', value: incidentStats.investigating },
        { label: 'Resolved', value: incidentStats.resolved },
        { label: 'Closed', value: incidentStats.closed },
      ]
    },
    {
      title: 'Task Details',
      type: 'table',
      columns: taskColumns.map(c => ({ ...c, width: 30 })),
      data: tasks
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
          title="Production Progress Report"
          csvData={tasks}
          csvColumns={taskColumns}
          pdfSections={pdfSections}
          filename="production_progress"
        />
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-100">
                <ListTodo className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{taskStats.total}</p>
                <p className="text-xs text-slate-500">Total Tasks</p>
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
                <p className="text-2xl font-bold">
                  {taskStats.total > 0 ? Math.round((taskStats.completed / taskStats.total) * 100) : 0}%
                </p>
                <p className="text-xs text-slate-500">Completion Rate</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-red-100">
                <AlertTriangle className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{incidentStats.open}</p>
                <p className="text-xs text-slate-500">Open Incidents</p>
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
                <p className="text-2xl font-bold">{taskStats.blocked}</p>
                <p className="text-xs text-slate-500">Blocked Tasks</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Task Status Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            {taskChartData.length === 0 ? (
              <p className="text-center py-8 text-slate-500">No task data</p>
            ) : (
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={taskChartData}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={80}
                      dataKey="value"
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    >
                      {taskChartData.map((entry, index) => (
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
            <CardTitle className="text-lg">Tasks by Production</CardTitle>
          </CardHeader>
          <CardContent>
            {productionTaskData.length === 0 ? (
              <p className="text-center py-8 text-slate-500">No production data</p>
            ) : (
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={productionTaskData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="Completed" fill="#10b981" stackId="a" />
                    <Bar dataKey="In Progress" fill="#3b82f6" stackId="a" />
                    <Bar dataKey="Pending" fill="#f59e0b" stackId="a" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent Tasks Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Recent Tasks</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2 px-3">Task</th>
                  <th className="text-left py-2 px-3">Production</th>
                  <th className="text-left py-2 px-3">Status</th>
                  <th className="text-left py-2 px-3">Priority</th>
                  <th className="text-left py-2 px-3">Assigned</th>
                </tr>
              </thead>
              <tbody>
                {tasks.slice(0, 10).map(task => (
                  <tr key={task.id} className="border-b hover:bg-slate-50">
                    <td className="py-2 px-3 font-medium">{task.task_name}</td>
                    <td className="py-2 px-3 text-slate-600">
                      {productions.find(p => p.id === task.production_id)?.name || 'N/A'}
                    </td>
                    <td className="py-2 px-3">
                      <Badge variant="outline">{task.completion_status}</Badge>
                    </td>
                    <td className="py-2 px-3">
                      <Badge variant="outline">{task.priority}</Badge>
                    </td>
                    <td className="py-2 px-3 text-slate-600">{task.assigned_to || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}