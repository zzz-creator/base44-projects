import React from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { base44 } from '../api/base44Client';
import PullToRefresh from '../components/mobile/PullToRefresh';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../utils';
import { 
  Theater, 
  Users, 
  Wrench, 
  AlertTriangle,
  ListTodo,
  ArrowRight,
  Calendar,
  Clock,
  TrendingUp,
  CheckCircle2,
  AlertCircle,
  Loader2
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import { format } from 'date-fns';

const StatCard = ({ title, value, icon: Icon, trend, color, isLoading }) => (
  <Card>
    <CardContent className="p-6">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-slate-500">{title}</p>
          {isLoading ? (
            <Loader2 className="w-6 h-6 animate-spin mt-2 text-slate-400" />
          ) : (
            <p className="text-3xl font-bold mt-1">{value}</p>
          )}
          {trend && (
            <p className="text-xs text-green-600 flex items-center gap-1 mt-1">
              <TrendingUp className="w-3 h-3" />
              {trend}
            </p>
          )}
        </div>
        <div className={`p-3 rounded-xl ${color}`}>
          <Icon className="w-6 h-6 text-white" />
        </div>
      </div>
    </CardContent>
  </Card>
);

const statusColors = {
  planning: 'bg-slate-100 text-slate-700',
  rehearsal: 'bg-blue-100 text-blue-700',
  active: 'bg-green-100 text-green-700',
  completed: 'bg-purple-100 text-purple-700',
  cancelled: 'bg-red-100 text-red-700',
};

const severityColors = {
  low: 'bg-slate-100 text-slate-700',
  medium: 'bg-yellow-100 text-yellow-700',
  high: 'bg-orange-100 text-orange-700',
  critical: 'bg-red-100 text-red-700',
};

export default function Dashboard() {
  const queryClient = useQueryClient();

  const { data: productions = [], isLoading: loadingProductions } = useQuery({
    queryKey: ['productions'],
    queryFn: () => base44.entities.Production.list('-created_date', 10),
  });

  const handleRefresh = async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ['productions'] }),
      queryClient.invalidateQueries({ queryKey: ['tasks'] }),
      queryClient.invalidateQueries({ queryKey: ['incidents'] }),
      queryClient.invalidateQueries({ queryKey: ['crewAssignments'] }),
    ]);
  };

  const { data: tasks = [], isLoading: loadingTasks } = useQuery({
    queryKey: ['tasks'],
    queryFn: () => base44.entities.TaskChecklist.list('-created_date', 50),
  });

  const { data: incidents = [], isLoading: loadingIncidents } = useQuery({
    queryKey: ['incidents'],
    queryFn: () => base44.entities.IncidentLog.filter({ resolution_status: 'open' }, '-created_date', 10),
  });

  const { data: equipment = [], isLoading: loadingEquipment } = useQuery({
    queryKey: ['equipment'],
    queryFn: () => base44.entities.EquipmentAsset.list('-created_date', 50),
  });

  const { data: crewAssignments = [], isLoading: loadingCrew } = useQuery({
    queryKey: ['crewAssignments'],
    queryFn: () => base44.entities.CrewAssignment.list('-created_date', 50),
  });

  const activeProductions = productions.filter(p => p.status === 'active' || p.status === 'rehearsal');
  const pendingTasks = tasks.filter(t => t.completion_status === 'pending' || t.completion_status === 'in_progress');
  const equipmentInMaintenance = equipment.filter(e => e.status === 'maintenance');

  return (
    <PullToRefresh onRefresh={handleRefresh}>
      <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Operations Dashboard</h1>
        <p className="text-slate-500">Production intelligence overview</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Active Productions"
          value={activeProductions.length}
          icon={Theater}
          color="bg-blue-500"
          isLoading={loadingProductions}
        />
        <StatCard
          title="Crew Assigned"
          value={crewAssignments.filter(c => c.status === 'active' || c.status === 'confirmed').length}
          icon={Users}
          color="bg-indigo-500"
          isLoading={loadingCrew}
        />
        <StatCard
          title="Pending Tasks"
          value={pendingTasks.length}
          icon={ListTodo}
          color="bg-amber-500"
          isLoading={loadingTasks}
        />
        <StatCard
          title="Open Incidents"
          value={incidents.length}
          icon={AlertTriangle}
          color="bg-red-500"
          isLoading={loadingIncidents}
        />
      </div>

      {/* Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Active Productions */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-lg font-semibold">Active Productions</CardTitle>
            <Link to={createPageUrl('Productions')}>
              <Button variant="ghost" size="sm" className="text-blue-600">
                View All <ArrowRight className="w-4 h-4 ml-1" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            {loadingProductions ? (
              <div className="flex justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
              </div>
            ) : activeProductions.length === 0 ? (
              <div className="text-center py-8 text-slate-500">
                <Theater className="w-10 h-10 mx-auto mb-2 text-slate-300" />
                <p>No active productions</p>
                <Link to={createPageUrl('Productions')}>
                  <Button variant="link" className="mt-2">Create Production</Button>
                </Link>
              </div>
            ) : (
              <div className="space-y-3">
                {activeProductions.slice(0, 5).map((prod) => (
                  <Link
                    key={prod.id}
                    to={createPageUrl(`ProductionDashboard?id=${prod.id}`)}
                    className="flex items-center justify-between p-3 rounded-lg hover:bg-slate-50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                        <Theater className="w-5 h-5 text-blue-600" />
                      </div>
                      <div>
                        <p className="font-medium text-slate-900">{prod.name}</p>
                        <div className="flex items-center gap-2 text-xs text-slate-500">
                          <Calendar className="w-3 h-3" />
                          {prod.start_date && format(new Date(prod.start_date), 'MMM d')}
                          {prod.end_date && ` - ${format(new Date(prod.end_date), 'MMM d')}`}
                        </div>
                      </div>
                    </div>
                    <Badge className={statusColors[prod.status]}>
                      {prod.status}
                    </Badge>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Open Incidents */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-lg font-semibold">Open Incidents</CardTitle>
            <Link to={createPageUrl('Incidents')}>
              <Button variant="ghost" size="sm" className="text-blue-600">
                View All <ArrowRight className="w-4 h-4 ml-1" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            {loadingIncidents ? (
              <div className="flex justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
              </div>
            ) : incidents.length === 0 ? (
              <div className="text-center py-8 text-slate-500">
                <CheckCircle2 className="w-10 h-10 mx-auto mb-2 text-green-400" />
                <p>No open incidents</p>
              </div>
            ) : (
              <div className="space-y-3">
                {incidents.slice(0, 5).map((incident) => (
                  <div
                    key={incident.id}
                    className="flex items-start justify-between p-3 rounded-lg bg-slate-50"
                  >
                    <div className="flex items-start gap-3">
                      <div className={`p-2 rounded-lg ${
                        incident.severity === 'critical' ? 'bg-red-100' : 
                        incident.severity === 'high' ? 'bg-orange-100' : 'bg-yellow-100'
                      }`}>
                        <AlertCircle className={`w-4 h-4 ${
                          incident.severity === 'critical' ? 'text-red-600' : 
                          incident.severity === 'high' ? 'text-orange-600' : 'text-yellow-600'
                        }`} />
                      </div>
                      <div>
                        <p className="font-medium text-slate-900 text-sm line-clamp-1">
                          {incident.description}
                        </p>
                        <p className="text-xs text-slate-500 mt-1">
                          {incident.created_date && format(new Date(incident.created_date), 'MMM d, h:mm a')}
                        </p>
                      </div>
                    </div>
                    <Badge className={severityColors[incident.severity]}>
                      {incident.severity}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Pending Tasks */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-lg font-semibold">Pending Tasks</CardTitle>
            <Link to={createPageUrl('Tasks')}>
              <Button variant="ghost" size="sm" className="text-blue-600">
                View All <ArrowRight className="w-4 h-4 ml-1" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            {loadingTasks ? (
              <div className="flex justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
              </div>
            ) : pendingTasks.length === 0 ? (
              <div className="text-center py-8 text-slate-500">
                <CheckCircle2 className="w-10 h-10 mx-auto mb-2 text-green-400" />
                <p>All tasks completed</p>
              </div>
            ) : (
              <div className="space-y-2">
                {pendingTasks.slice(0, 6).map((task) => (
                  <div
                    key={task.id}
                    className="flex items-center justify-between p-3 rounded-lg hover:bg-slate-50"
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-2 h-2 rounded-full ${
                        task.priority === 'critical' ? 'bg-red-500' :
                        task.priority === 'high' ? 'bg-orange-500' :
                        task.priority === 'medium' ? 'bg-yellow-500' : 'bg-slate-400'
                      }`} />
                      <div>
                        <p className="font-medium text-slate-900 text-sm">{task.task_name}</p>
                        {task.assigned_to && (
                          <p className="text-xs text-slate-500">{task.assigned_to}</p>
                        )}
                      </div>
                    </div>
                    {task.due_date && (
                      <div className="flex items-center gap-1 text-xs text-slate-500">
                        <Clock className="w-3 h-3" />
                        {format(new Date(task.due_date), 'MMM d')}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Equipment Status */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-lg font-semibold">Equipment Status</CardTitle>
            <Link to={createPageUrl('Equipment')}>
              <Button variant="ghost" size="sm" className="text-blue-600">
                View All <ArrowRight className="w-4 h-4 ml-1" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            {loadingEquipment ? (
              <div className="flex justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
              </div>
            ) : equipment.length === 0 ? (
              <div className="text-center py-8 text-slate-500">
                <Wrench className="w-10 h-10 mx-auto mb-2 text-slate-300" />
                <p>No equipment tracked</p>
                <Link to={createPageUrl('Equipment')}>
                  <Button variant="link" className="mt-2">Add Equipment</Button>
                </Link>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 rounded-lg bg-green-50 border border-green-100">
                    <p className="text-2xl font-bold text-green-700">
                      {equipment.filter(e => e.status === 'available').length}
                    </p>
                    <p className="text-xs text-green-600">Available</p>
                  </div>
                  <div className="p-3 rounded-lg bg-blue-50 border border-blue-100">
                    <p className="text-2xl font-bold text-blue-700">
                      {equipment.filter(e => e.status === 'in_use').length}
                    </p>
                    <p className="text-xs text-blue-600">In Use</p>
                  </div>
                  <div className="p-3 rounded-lg bg-amber-50 border border-amber-100">
                    <p className="text-2xl font-bold text-amber-700">
                      {equipmentInMaintenance.length}
                    </p>
                    <p className="text-xs text-amber-600">Maintenance</p>
                  </div>
                  <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
                    <p className="text-2xl font-bold text-slate-700">
                      {equipment.filter(e => e.status === 'retired').length}
                    </p>
                    <p className="text-xs text-slate-600">Retired</p>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
    </PullToRefresh>
  );
}