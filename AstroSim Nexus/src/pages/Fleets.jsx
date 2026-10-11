import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '../api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "../components/ui/dialog";
import { Label } from "../components/ui/label";
import { Input } from "../components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import { Ship, Shield, Target, Navigation, Users, Plus, X, Pencil } from 'lucide-react';
import { toast } from 'sonner';

export default function Fleets() {
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [assignDialogOpen, setAssignDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedFleet, setSelectedFleet] = useState(null);
  const [editingFleet, setEditingFleet] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    faction_id: '',
    task: 'Idle',
    formation: 'Line'
  });
  const [assignData, setAssignData] = useState({
    ship_id: '',
    role: 'Escort'
  });

  const { data: fleets = [] } = useQuery({
    queryKey: ['fleets'],
    queryFn: () => base44.entities.Fleet.list('-created_date')
  });

  const { data: factions = [] } = useQuery({
    queryKey: ['factions'],
    queryFn: () => base44.entities.Faction.list()
  });

  const { data: ships = [] } = useQuery({
    queryKey: ['ships'],
    queryFn: () => base44.entities.Ship.list()
  });

  const { data: assignments = [] } = useQuery({
    queryKey: ['assignments'],
    queryFn: () => base44.entities.FleetAssignment.list()
  });

  const { data: colonies = [] } = useQuery({
    queryKey: ['colonies'],
    queryFn: () => base44.entities.Colony.list()
  });

  const createFleetMutation = useMutation({
    mutationFn: (data) => base44.entities.Fleet.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries(['fleets']);
      setDialogOpen(false);
      setFormData({ name: '', faction_id: '', task: 'Idle', formation: 'Line' });
      toast.success('⚓ Fleet formed!');
    }
  });

  const assignShipMutation = useMutation({
    mutationFn: (data) => base44.entities.FleetAssignment.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries(['assignments']);
      setAssignDialogOpen(false);
      setAssignData({ ship_id: '', role: 'Escort' });
      toast.success('🚀 Ship assigned to fleet!');
    }
  });

  const removeShipMutation = useMutation({
    mutationFn: (assignmentId) => base44.entities.FleetAssignment.delete(assignmentId),
    onSuccess: () => {
      queryClient.invalidateQueries(['assignments']);
      toast.success('Ship removed from fleet');
    }
  });

  const updateFleetMutation = useMutation({
    mutationFn: ({ fleetId, data }) => base44.entities.Fleet.update(fleetId, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['fleets']);
      toast.success('⚓ Fleet updated!');
      setEditDialogOpen(false);
    }
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.name || !formData.faction_id) {
      toast.error('Please fill in all fields');
      return;
    }
    createFleetMutation.mutate(formData);
  };

  const handleEdit = (e) => {
    e.preventDefault();
    updateFleetMutation.mutate({ fleetId: editingFleet.id, data: editingFleet });
  };

  const handleAssignShip = (e) => {
    e.preventDefault();
    if (!assignData.ship_id || !selectedFleet) {
      toast.error('Please select a ship');
      return;
    }
    assignShipMutation.mutate({
      fleet_id: selectedFleet.id,
      ship_id: assignData.ship_id,
      role: assignData.role
    });
  };

  const getFactionName = (factionId) => {
    const faction = factions.find(f => f.id === factionId);
    return faction?.name || 'Unknown';
  };

  const getShipName = (shipId) => {
    const ship = ships.find(s => s.id === shipId);
    return ship?.name || 'Unknown';
  };

  const getColonyName = (colonyId) => {
    const colony = colonies.find(c => c.id === colonyId);
    return colony?.name || 'None';
  };

  const getFleetShips = (fleetId) => {
    return assignments.filter(a => a.fleet_id === fleetId);
  };

  const getAvailableShips = () => {
    const assignedShipIds = assignments.map(a => a.ship_id);
    return ships.filter(s => !assignedShipIds.includes(s.id) && s.status === 'Docked');
  };

  const getStatusColor = (status) => {
    const colors = {
      'Active': 'bg-green-600',
      'Idling': 'bg-yellow-600',
      'In Transit': 'bg-blue-600',
      'Under Attack': 'bg-red-600',
      'Retreating': 'bg-orange-600',
      'Docked': 'bg-slate-600'
    };
    return colors[status] || 'bg-slate-600';
  };

  const getTaskIcon = (task) => {
    const icons = {
      'Patrol': Shield,
      'Trade Escort': Ship,
      'Attack': Target,
      'Defense': Shield,
      'Exploration': Navigation,
      'Idle': Users
    };
    return icons[task] || Users;
  };

  return (
    <div className="min-h-screen bg-slate-900 p-6">
      <div className="max-w-[1800px] mx-auto space-y-6">
        <div className="border-b border-slate-700 pb-4 flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold text-white">⚓ Fleet Command</h1>
            <p className="text-slate-400 mt-2">{fleets.length} fleets deployed</p>
          </div>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-blue-600 hover:bg-blue-700">
                <Plus className="w-4 h-4 mr-2" />
                Form New Fleet
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-slate-800 border-slate-700 text-white">
              <DialogHeader>
                <DialogTitle>Form New Fleet</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label>Fleet Name</Label>
                  <Input
                    className="bg-slate-700 border-slate-600"
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    placeholder="e.g., Alpha Strike Force"
                  />
                </div>
                <div>
                  <Label>Faction</Label>
                  <Select value={formData.faction_id} onValueChange={(value) => setFormData({...formData, faction_id: value})}>
                    <SelectTrigger className="bg-slate-700 border-slate-600">
                      <SelectValue placeholder="Select faction" />
                    </SelectTrigger>
                    <SelectContent>
                      {factions.length > 0 ? (
                        factions.map(f => (
                          <SelectItem key={f.id} value={f.id}>{f.name}</SelectItem>
                        ))
                      ) : (
                        <div className="p-2 text-sm text-slate-400">No factions available</div>
                      )}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Initial Task</Label>
                  <Select value={formData.task} onValueChange={(value) => setFormData({...formData, task: value})}>
                    <SelectTrigger className="bg-slate-700 border-slate-600">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Idle">Idle</SelectItem>
                      <SelectItem value="Patrol">Patrol</SelectItem>
                      <SelectItem value="Trade Escort">Trade Escort</SelectItem>
                      <SelectItem value="Attack">Attack</SelectItem>
                      <SelectItem value="Defense">Defense</SelectItem>
                      <SelectItem value="Exploration">Exploration</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Formation</Label>
                  <Select value={formData.formation} onValueChange={(value) => setFormData({...formData, formation: value})}>
                    <SelectTrigger className="bg-slate-700 border-slate-600">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Line">Line (Balanced)</SelectItem>
                      <SelectItem value="Wedge">Wedge (Offensive)</SelectItem>
                      <SelectItem value="Screen">Screen (Defensive)</SelectItem>
                      <SelectItem value="Box">Box (Protection)</SelectItem>
                      <SelectItem value="Sphere">Sphere (Max Defense)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700">
                  Form Fleet
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {fleets.length === 0 ? (
          <Card className="bg-slate-800 border-slate-700">
            <CardContent className="p-12 text-center">
              <Ship className="w-16 h-16 text-slate-500 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-white mb-2">No Fleets Formed</h3>
              <p className="text-slate-400">Create a fleet to organize your ships</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {fleets.map((fleet) => {
              const fleetShips = getFleetShips(fleet.id);
              const TaskIcon = getTaskIcon(fleet.task);
              
              return (
                <Card key={fleet.id} className="bg-slate-800 border-slate-700">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3">
                        <div className="p-2 bg-blue-600 rounded-lg">
                          <TaskIcon className="w-5 h-5 text-white" />
                        </div>
                        <div>
                          <CardTitle className="text-white text-lg">{fleet.name}</CardTitle>
                          <div className="text-sm text-slate-400 mt-1">
                            {getFactionName(fleet.faction_id)} • {fleetShips.length} ships
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className={`px-2 py-1 rounded text-xs text-white ${getStatusColor(fleet.status)}`}>
                          {fleet.status}
                        </div>
                        <Button 
                          size="icon" 
                          variant="ghost" 
                          className="h-7 w-7 text-slate-400 hover:text-white"
                          onClick={() => {
                            setEditingFleet({...fleet});
                            setEditDialogOpen(true);
                          }}
                        >
                          <Pencil className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <div className="text-xs text-slate-400">Task</div>
                        <div className="text-white font-bold">{fleet.task}</div>
                      </div>
                      <div>
                        <div className="text-xs text-slate-400">Formation</div>
                        <div className="text-white font-bold">{fleet.formation}</div>
                      </div>
                      <div>
                        <div className="text-xs text-slate-400">Morale</div>
                        <div className="flex items-center gap-2">
                          <div className="flex-1 bg-slate-700 rounded-full h-2">
                            <div 
                              className={`h-2 rounded-full ${fleet.morale > 70 ? 'bg-green-500' : fleet.morale > 40 ? 'bg-yellow-500' : 'bg-red-500'}`}
                              style={{width: `${fleet.morale}%`}}
                            />
                          </div>
                          <span className="text-white text-sm">{Math.floor(fleet.morale)}%</span>
                        </div>
                      </div>
                      <div>
                        <div className="text-xs text-slate-400">Effectiveness</div>
                        <div className="text-white font-bold">{Math.floor(fleet.combat_effectiveness)}%</div>
                      </div>
                    </div>

                    {fleet.target_colony_id && (
                      <div className="p-2 bg-slate-700 rounded">
                        <div className="text-xs text-slate-400">Target Location</div>
                        <div className="text-white font-bold">{getColonyName(fleet.target_colony_id)}</div>
                      </div>
                    )}

                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="text-sm font-bold text-white">Fleet Composition</div>
                        <Button 
                          size="sm" 
                          variant="outline"
                          className="border-blue-600 text-blue-400 hover:bg-blue-600 hover:text-white"
                          onClick={() => {
                            setSelectedFleet(fleet);
                            setAssignDialogOpen(true);
                          }}
                        >
                          <Plus className="w-3 h-3 mr-1" />
                          Assign Ship
                        </Button>
                      </div>
                      {fleetShips.length === 0 ? (
                        <div className="text-slate-400 text-sm text-center py-2">No ships assigned</div>
                      ) : (
                        <div className="space-y-1">
                          {fleetShips.map(assignment => (
                            <div key={assignment.id} className="flex items-center justify-between p-2 bg-slate-700 rounded text-sm">
                              <div>
                                <span className="text-white font-bold">{getShipName(assignment.ship_id)}</span>
                                <Badge className="ml-2 bg-purple-600 text-xs">{assignment.role}</Badge>
                              </div>
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-6 w-6 p-0 text-red-400 hover:text-red-300"
                                onClick={() => removeShipMutation.mutate(assignment.id)}
                              >
                                <X className="w-4 h-4" />
                              </Button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="flex gap-2">
                      <Select 
                        value={fleet.task} 
                        onValueChange={(value) => updateFleetMutation.mutate({ fleetId: fleet.id, data: { task: value } })}
                      >
                        <SelectTrigger className="bg-slate-700 border-slate-600 text-white text-sm">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Idle">Idle</SelectItem>
                          <SelectItem value="Patrol">Patrol</SelectItem>
                          <SelectItem value="Trade Escort">Trade Escort</SelectItem>
                          <SelectItem value="Attack">Attack</SelectItem>
                          <SelectItem value="Defense">Defense</SelectItem>
                          <SelectItem value="Exploration">Exploration</SelectItem>
                        </SelectContent>
                      </Select>
                      <Select 
                        value={fleet.status} 
                        onValueChange={(value) => updateFleetMutation.mutate({ fleetId: fleet.id, data: { status: value } })}
                      >
                        <SelectTrigger className="bg-slate-700 border-slate-600 text-white text-sm">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Active">Active</SelectItem>
                          <SelectItem value="Idling">Idling</SelectItem>
                          <SelectItem value="In Transit">In Transit</SelectItem>
                          <SelectItem value="Docked">Docked</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
          <DialogContent className="bg-slate-800 border-slate-700 text-white">
            <DialogHeader>
              <DialogTitle>Edit Fleet</DialogTitle>
            </DialogHeader>
            {editingFleet && (
              <form onSubmit={handleEdit} className="space-y-4">
                <div>
                  <Label>Fleet Name</Label>
                  <Input
                    className="bg-slate-700 border-slate-600"
                    value={editingFleet.name}
                    onChange={(e) => setEditingFleet({...editingFleet, name: e.target.value})}
                  />
                </div>
                <div>
                  <Label>Formation</Label>
                  <Select value={editingFleet.formation} onValueChange={(value) => setEditingFleet({...editingFleet, formation: value})}>
                    <SelectTrigger className="bg-slate-700 border-slate-600">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Line">Line (Balanced)</SelectItem>
                      <SelectItem value="Wedge">Wedge (Offensive)</SelectItem>
                      <SelectItem value="Screen">Screen (Defensive)</SelectItem>
                      <SelectItem value="Box">Box (Protection)</SelectItem>
                      <SelectItem value="Sphere">Sphere (Max Defense)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Morale</Label>
                  <Input
                    type="number"
                    value={editingFleet.morale}
                    onChange={(e) => setEditingFleet({...editingFleet, morale: parseInt(e.target.value)})}
                    className="bg-slate-700 border-slate-600"
                    min="0"
                    max="100"
                  />
                </div>
                <div>
                  <Label>Combat Effectiveness</Label>
                  <Input
                    type="number"
                    value={editingFleet.combat_effectiveness}
                    onChange={(e) => setEditingFleet({...editingFleet, combat_effectiveness: parseInt(e.target.value)})}
                    className="bg-slate-700 border-slate-600"
                  />
                </div>
                <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700">
                  Update Fleet
                </Button>
              </form>
            )}
          </DialogContent>
        </Dialog>

        <Dialog open={assignDialogOpen} onOpenChange={setAssignDialogOpen}>
          <DialogContent className="bg-slate-800 border-slate-700 text-white">
            <DialogHeader>
              <DialogTitle>Assign Ship to {selectedFleet?.name}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleAssignShip} className="space-y-4">
              <div>
                <Label>Ship</Label>
                <Select value={assignData.ship_id} onValueChange={(value) => setAssignData({...assignData, ship_id: value})}>
                  <SelectTrigger className="bg-slate-700 border-slate-600">
                    <SelectValue placeholder="Select ship" />
                  </SelectTrigger>
                  <SelectContent>
                    {getAvailableShips().length > 0 ? (
                      getAvailableShips().map(s => (
                        <SelectItem key={s.id} value={s.id}>{s.name} ({s.class})</SelectItem>
                      ))
                    ) : (
                      <div className="p-2 text-sm text-slate-400">No available ships</div>
                    )}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Fleet Role</Label>
                <Select value={assignData.role} onValueChange={(value) => setAssignData({...assignData, role: value})}>
                  <SelectTrigger className="bg-slate-700 border-slate-600">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Flagship">Flagship (Command)</SelectItem>
                    <SelectItem value="Vanguard">Vanguard (Front-line)</SelectItem>
                    <SelectItem value="Flanker">Flanker (Hit & Run)</SelectItem>
                    <SelectItem value="Escort">Escort (Standard)</SelectItem>
                    <SelectItem value="Support">Support (Rear Guard)</SelectItem>
                    <SelectItem value="Reserve">Reserve (Backup)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700">
                Assign to Fleet
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}