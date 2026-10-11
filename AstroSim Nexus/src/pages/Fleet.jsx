import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '../api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "../components/ui/dialog";
import { Badge } from "../components/ui/badge";
import { Ship, Plus, Fuel, Wrench, MapPin, Pencil } from "lucide-react";
import { toast } from 'sonner';

export default function Fleet() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingShip, setEditingShip] = useState(null);
  const queryClient = useQueryClient();

  const { data: ships = [] } = useQuery({
    queryKey: ['ships'],
    queryFn: () => base44.entities.Ship.list('-created_date')
  });

  const { data: factions = [] } = useQuery({
    queryKey: ['factions'],
    queryFn: () => base44.entities.Faction.list()
  });

  const { data: colonies = [] } = useQuery({
    queryKey: ['colonies'],
    queryFn: () => base44.entities.Colony.list()
  });

  const createShipMutation = useMutation({
    mutationFn: (data) => base44.entities.Ship.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries(['ships']);
      toast.success('🚀 Ship commissioned successfully!');
      setIsDialogOpen(false);
    }
  });

  const updateShipMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Ship.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['ships']);
      toast.success('🚀 Ship updated!');
      setEditDialogOpen(false);
    }
  });

  const [formData, setFormData] = useState({
    name: '',
    class: 'Freighter',
    owner_faction_id: '',
    current_colony_id: ''
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.name || !formData.owner_faction_id) {
      toast.error('Name and faction are required');
      return;
    }
    createShipMutation.mutate(formData);
  };

  const handleEdit = (e) => {
    e.preventDefault();
    updateShipMutation.mutate({ id: editingShip.id, data: editingShip });
  };

  const getStatusColor = (status) => {
    const colors = {
      'Docked': 'bg-green-500',
      'In Transit': 'bg-blue-500',
      'Maintenance': 'bg-yellow-500',
      'Destroyed': 'bg-red-500'
    };
    return colors[status] || 'bg-slate-500';
  };

  const getMaintenanceColor = (level) => {
    if (level >= 70) return 'text-green-400';
    if (level >= 40) return 'text-yellow-400';
    return 'text-red-400';
  };

  return (
    <div className="min-h-screen bg-slate-900 p-6">
      <div className="max-w-[1600px] mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-white">🚀 Fleet Management</h1>
            <p className="text-slate-400 mt-1">{ships.length} ships in service</p>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-blue-600 hover:bg-blue-700">
                <Plus className="w-4 h-4 mr-2" />
                Commission Ship
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-slate-800 border-slate-700 text-white">
              <DialogHeader>
                <DialogTitle>Commission New Ship</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label>Ship Name</Label>
                  <Input
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    className="bg-slate-700 border-slate-600 text-white"
                    placeholder="SS Enterprise"
                  />
                </div>
                <div>
                  <Label>Ship Class</Label>
                  <Select
                    value={formData.class}
                    onValueChange={(value) => setFormData({...formData, class: value})}
                  >
                    <SelectTrigger className="bg-slate-700 border-slate-600 text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-700 border-slate-600">
                      <SelectItem value="Shuttle">Shuttle</SelectItem>
                      <SelectItem value="Freighter">Freighter</SelectItem>
                      <SelectItem value="Hauler">Hauler</SelectItem>
                      <SelectItem value="Tanker">Tanker</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Owning Faction</Label>
                  <Select
                    value={formData.owner_faction_id}
                    onValueChange={(value) => setFormData({...formData, owner_faction_id: value})}
                  >
                    <SelectTrigger className="bg-slate-700 border-slate-600 text-white">
                      <SelectValue placeholder="Select faction" />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-700 border-slate-600">
                      {factions.map(faction => (
                        <SelectItem key={faction.id} value={faction.id}>
                          {faction.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Initial Location</Label>
                  <Select
                    value={formData.current_colony_id}
                    onValueChange={(value) => setFormData({...formData, current_colony_id: value})}
                  >
                    <SelectTrigger className="bg-slate-700 border-slate-600 text-white">
                      <SelectValue placeholder="Select colony (optional)" />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-700 border-slate-600">
                      {colonies.map(colony => (
                        <SelectItem key={colony.id} value={colony.id}>
                          {colony.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700">
                  Commission Ship
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {ships.map(ship => (
            <Card 
              key={ship.id} 
              className="bg-slate-800 border-slate-700 hover:border-slate-600 transition-all"
            >
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <Ship className="w-5 h-5 text-blue-400" />
                    <CardTitle className="text-white">{ship.name}</CardTitle>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge className={`${getStatusColor(ship.status)} text-white border-0`}>
                      {ship.status}
                    </Badge>
                    <Button 
                      size="icon" 
                      variant="ghost" 
                      className="h-7 w-7 text-slate-400 hover:text-white"
                      onClick={() => {
                        setEditingShip({...ship});
                        setEditDialogOpen(true);
                      }}
                    >
                      <Pencil className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
                <p className="text-slate-400 text-sm mt-1">{ship.class}</p>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="flex items-center gap-2 text-slate-400 text-xs mb-1">
                      <Fuel className="w-3 h-3" />
                      Fuel Level
                    </div>
                    <div className="w-full bg-slate-700 rounded-full h-2">
                      <div 
                        className="bg-blue-500 h-2 rounded-full transition-all"
                        style={{ width: `${(ship.fuel_level / ship.fuel_capacity) * 100}%` }}
                      />
                    </div>
                    <div className="text-white text-xs mt-1">
                      {ship.fuel_level} / {ship.fuel_capacity}
                    </div>
                  </div>
                  <div>
                    <div className="flex items-center gap-2 text-slate-400 text-xs mb-1">
                      <Wrench className="w-3 h-3" />
                      Maintenance
                    </div>
                    <div className={`font-semibold ${getMaintenanceColor(ship.maintenance_level)}`}>
                      {ship.maintenance_level}%
                    </div>
                  </div>
                </div>
                <div className="pt-2 border-t border-slate-700">
                  <div className="flex items-center gap-2 text-slate-400 text-xs mb-1">
                    <MapPin className="w-3 h-3" />
                    Current Location
                  </div>
                  <div className="text-white text-sm">
                    {ship.current_colony_id ? (
                      colonies.find(c => c.id === ship.current_colony_id)?.name || 'Unknown'
                    ) : (
                      'In Space'
                    )}
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <span className="text-slate-400">Cargo Cap:</span>
                    <span className="text-white ml-1">{ship.cargo_capacity}</span>
                  </div>
                  <div>
                    <span className="text-slate-400">Fuel Cap:</span>
                    <span className="text-white ml-1">{ship.fuel_capacity}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {ships.length === 0 && (
          <div className="text-center py-12">
            <Ship className="w-16 h-16 text-slate-600 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-slate-400 mb-2">No Ships Commissioned</h3>
            <p className="text-slate-500">Build your first ship to begin trading</p>
          </div>
        )}

        <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
          <DialogContent className="bg-slate-800 border-slate-700 text-white">
            <DialogHeader>
              <DialogTitle>Edit Ship</DialogTitle>
            </DialogHeader>
            {editingShip && (
              <form onSubmit={handleEdit} className="space-y-4">
                <div>
                  <Label>Ship Name</Label>
                  <Input
                    value={editingShip.name}
                    onChange={(e) => setEditingShip({...editingShip, name: e.target.value})}
                    className="bg-slate-700 border-slate-600 text-white"
                  />
                </div>
                <div>
                  <Label>Status</Label>
                  <Select
                    value={editingShip.status}
                    onValueChange={(value) => setEditingShip({...editingShip, status: value})}
                  >
                    <SelectTrigger className="bg-slate-700 border-slate-600 text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Docked">Docked</SelectItem>
                      <SelectItem value="In Transit">In Transit</SelectItem>
                      <SelectItem value="Maintenance">Maintenance</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Fuel Level</Label>
                  <Input
                    type="number"
                    value={editingShip.fuel_level}
                    onChange={(e) => setEditingShip({...editingShip, fuel_level: parseInt(e.target.value)})}
                    className="bg-slate-700 border-slate-600 text-white"
                    max={editingShip.fuel_capacity}
                  />
                </div>
                <div>
                  <Label>Maintenance Level</Label>
                  <Input
                    type="number"
                    value={editingShip.maintenance_level}
                    onChange={(e) => setEditingShip({...editingShip, maintenance_level: parseInt(e.target.value)})}
                    className="bg-slate-700 border-slate-600 text-white"
                    min="0"
                    max="100"
                  />
                </div>
                <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700">
                  Update Ship
                </Button>
              </form>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}