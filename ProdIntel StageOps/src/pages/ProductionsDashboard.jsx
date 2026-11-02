import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '../api/base44Client';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../utils';
import { format, isAfter, parseISO } from 'date-fns';
import {
  Theater,
  Users,
  ListTodo,
  AlertTriangle,
  Calendar,
  Archive,
  Loader2,
  ChevronRight,
  Clock,
  CheckCircle2,
  Play,
  Pause,
  MoreVertical,
  Eye
} from 'lucide-react';
import { Card, CardContent, CardHeader } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Progress } from '../components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '../components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '../components/ui/alert-dialog';

const statusConfig = {
  planning: { color: 'bg-slate-100 text-slate-700', icon: Clock, label: 'Planning' },
  rehearsal: { color: 'bg-purple-100 text-purple-700', icon: Play, label: 'Rehearsal' },
  active: { color: 'bg-green-100 text-green-700', icon: CheckCircle2, label: 'Active' },
  completed: { color: 'bg-blue-100 text-blue-700', icon: CheckCircle2, label: 'Completed' },
  cancelled: { color: 'bg-red-100 text-red-700', icon: Pause, label: 'Cancelled' },
  archived: { color: 'bg-gray-100 text-gray-500', icon: Archive, label: 'Archived' },
};

export default function ProductionsDashboard() {
  const [archiveDialog, setArchiveDialog] = useState({ open: false, production: null });
  const queryClient = useQueryClient();

  const { data: productions = [], isLoading } = useQuery({
    queryKey: ['productions'],
    queryFn: () => base44.entities.Production.list('-start_date'),
  });

  const { data: crewAssignments = [] } = useQuery({
    queryKey: ['crewAssignments'],
    queryFn: () => base44.entities.CrewAssignment.list(),
  });

  const { data: tasks = [] } = useQuery({
    queryKey: ['allTasks'],
    queryFn: () => base44.entities.TaskChecklist.list(),
  });

  const { data: incidents = [] } = useQuery({
    queryKey: ['allIncidents'],
    queryFn: () => base44.entities.IncidentLog.list('-created_date'),
  });

  const { data: venues = [] } = useQuery({
    queryKey: ['venues'],
    queryFn: () => base44.entities.Venue.list(),
  });

  const archiveMutation = useMutation({
    mutationFn: (productionId) => 
      base44.entities.Production.update(productionId, { 
        status: 'archived',
        archived_date: new Date().toISOString().split('T')[0]
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['productions'] });
      setArchiveDialog({ open: false, production: null });
    },
  });

  const getProductionMetrics = (productionId) => {
    const prodCrew = crewAssignments.filter(c => c.production_id === productionId);
    const prodTasks = tasks.filter(t => t.production_id === productionId);
    const prodIncidents = incidents.filter(i => i.production_id === productionId);
    
    const completedTasks = prodTasks.filter(t => t.completion_status === 'completed').length;
    const openIncidents = prodIncidents.filter(i => i.resolution_status !== 'closed' && i.resolution_status !== 'resolved').length;
    
    return {
      crewCount: prodCrew.length,
      totalTasks: prodTasks.length,
      completedTasks,
      taskProgress: prodTasks.length > 0 ? Math.round((completedTasks / prodTasks.length) * 100) : 0,
      openIncidents,
      recentIncidents: prodIncidents.slice(0, 3),
    };
  };

  const getVenueName = (venueId) => {
    const venue = venues.find(v => v.id === venueId);
    return venue?.name || 'No venue';
  };

  // Filter productions by status
  const activeProductions = productions.filter(p => 
    ['active', 'rehearsal'].includes(p.status)
  );
  const upcomingProductions = productions.filter(p => 
    p.status === 'planning' || 
    (p.start_date && isAfter(parseISO(p.start_date), new Date()) && !['archived', 'cancelled'].includes(p.status))
  );
  const completedProductions = productions.filter(p => p.status === 'completed');
  const archivedProductions = productions.filter(p => p.status === 'archived');

  // Overall metrics
  const totalActiveCrew = new Set(
    crewAssignments
      .filter(c => activeProductions.some(p => p.id === c.production_id))
      .map(c => c.crew_member_id || c.crew_member_name)
  ).size;
  
  const totalOpenIncidents = incidents.filter(i => 
    i.resolution_status !== 'closed' && i.resolution_status !== 'resolved'
  ).length;

  const totalPendingTasks = tasks.filter(t => 
    t.completion_status !== 'completed' &&
    activeProductions.some(p => p.id === t.production_id)
  ).length;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-slate-400" />
      </div>
    );
  }

  const ProductionCard = ({ production }) => {
    const metrics = getProductionMetrics(production.id);
    const config = statusConfig[production.status] || statusConfig.planning;
    const StatusIcon = config.icon;

    return (
      <Card className="hover:shadow-md transition-shadow">
        <CardHeader className="pb-2">
          <div className="flex items-start justify-between">
            <div className="flex-1 min-w-0">
              <Link 
                to={createPageUrl(`ProductionDetail?id=${production.id}`)}
                className="font-semibold text-lg hover:text-blue-600 transition-colors line-clamp-1"
              >
                {production.name}
              </Link>
              <p className="text-sm text-muted-foreground">{getVenueName(production.venue_id)}</p>
            </div>
            <div className="flex items-center gap-2">
              <Badge className={config.color}>
                <StatusIcon className="w-3 h-3 mr-1" />
                {config.label}
              </Badge>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <MoreVertical className="w-4 h-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem asChild>
                    <Link to={createPageUrl(`ProductionDetail?id=${production.id}`)}>
                      <Eye className="w-4 h-4 mr-2" />
                      View Details
                    </Link>
                  </DropdownMenuItem>
                  {production.status === 'completed' && (
                    <DropdownMenuItem 
                      onClick={() => setArchiveDialog({ open: true, production })}
                    >
                      <Archive className="w-4 h-4 mr-2" />
                      Archive Production
                    </DropdownMenuItem>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {production.start_date && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Calendar className="w-4 h-4" />
              {format(parseISO(production.start_date), 'MMM d, yyyy')}
              {production.end_date && ` - ${format(parseISO(production.end_date), 'MMM d, yyyy')}`}
            </div>
          )}

          <div className="grid grid-cols-3 gap-3">
            <div className="text-center p-2 bg-slate-50 rounded-lg">
              <Users className="w-4 h-4 mx-auto text-slate-500 mb-1" />
              <p className="text-lg font-semibold">{metrics.crewCount}</p>
              <p className="text-xs text-muted-foreground">Crew</p>
            </div>
            <div className="text-center p-2 bg-slate-50 rounded-lg">
              <ListTodo className="w-4 h-4 mx-auto text-slate-500 mb-1" />
              <p className="text-lg font-semibold">{metrics.completedTasks}/{metrics.totalTasks}</p>
              <p className="text-xs text-muted-foreground">Tasks</p>
            </div>
            <div className="text-center p-2 bg-slate-50 rounded-lg">
              <AlertTriangle className={`w-4 h-4 mx-auto mb-1 ${metrics.openIncidents > 0 ? 'text-amber-500' : 'text-slate-500'}`} />
              <p className={`text-lg font-semibold ${metrics.openIncidents > 0 ? 'text-amber-600' : ''}`}>
                {metrics.openIncidents}
              </p>
              <p className="text-xs text-muted-foreground">Open Issues</p>
            </div>
          </div>

          {metrics.totalTasks > 0 && (
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-muted-foreground">Task Progress</span>
                <span className="font-medium">{metrics.taskProgress}%</span>
              </div>
              <Progress value={metrics.taskProgress} className="h-2" />
            </div>
          )}

          <Link 
            to={createPageUrl(`ProductionDetail?id=${production.id}`)}
            className="flex items-center justify-center gap-1 text-sm text-blue-600 hover:text-blue-700 pt-2"
          >
            View Dashboard <ChevronRight className="w-4 h-4" />
          </Link>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Productions Dashboard</h1>
        <p className="text-slate-500">Overview of all productions and key metrics</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <Theater className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{activeProductions.length}</p>
                <p className="text-sm text-muted-foreground">Active Productions</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Users className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{totalActiveCrew}</p>
                <p className="text-sm text-muted-foreground">Active Crew</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <ListTodo className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{totalPendingTasks}</p>
                <p className="text-sm text-muted-foreground">Pending Tasks</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg ${totalOpenIncidents > 0 ? 'bg-amber-100' : 'bg-slate-100'}`}>
                <AlertTriangle className={`w-5 h-5 ${totalOpenIncidents > 0 ? 'text-amber-600' : 'text-slate-600'}`} />
              </div>
              <div>
                <p className={`text-2xl font-bold ${totalOpenIncidents > 0 ? 'text-amber-600' : ''}`}>
                  {totalOpenIncidents}
                </p>
                <p className="text-sm text-muted-foreground">Open Incidents</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Productions Tabs */}
      <Tabs defaultValue="active" className="space-y-4">
        <TabsList>
          <TabsTrigger value="active">
            Active & Rehearsal ({activeProductions.length})
          </TabsTrigger>
          <TabsTrigger value="upcoming">
            Upcoming ({upcomingProductions.length})
          </TabsTrigger>
          <TabsTrigger value="completed">
            Completed ({completedProductions.length})
          </TabsTrigger>
          <TabsTrigger value="archived">
            Archived ({archivedProductions.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="active">
          {activeProductions.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Theater className="w-12 h-12 text-slate-300 mb-4" />
                <h3 className="text-lg font-medium text-slate-900 mb-1">No active productions</h3>
                <p className="text-slate-500">Productions in rehearsal or active status will appear here</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {activeProductions.map(production => (
                <ProductionCard key={production.id} production={production} />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="upcoming">
          {upcomingProductions.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Calendar className="w-12 h-12 text-slate-300 mb-4" />
                <h3 className="text-lg font-medium text-slate-900 mb-1">No upcoming productions</h3>
                <p className="text-slate-500">Future productions will appear here</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {upcomingProductions.map(production => (
                <ProductionCard key={production.id} production={production} />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="completed">
          {completedProductions.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <CheckCircle2 className="w-12 h-12 text-slate-300 mb-4" />
                <h3 className="text-lg font-medium text-slate-900 mb-1">No completed productions</h3>
                <p className="text-slate-500">Finished productions will appear here</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {completedProductions.map(production => (
                <ProductionCard key={production.id} production={production} />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="archived">
          {archivedProductions.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Archive className="w-12 h-12 text-slate-300 mb-4" />
                <h3 className="text-lg font-medium text-slate-900 mb-1">No archived productions</h3>
                <p className="text-slate-500">Archived productions will appear here</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {archivedProductions.map(production => (
                <ProductionCard key={production.id} production={production} />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Archive Dialog */}
      <AlertDialog 
        open={archiveDialog.open} 
        onOpenChange={(open) => !open && setArchiveDialog({ open: false, production: null })}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Archive Production</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to archive "{archiveDialog.production?.name}"? 
              Archived productions can still be viewed but will be hidden from active lists.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => archiveMutation.mutate(archiveDialog.production?.id)}
              disabled={archiveMutation.isPending}
            >
              {archiveMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Archive
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}