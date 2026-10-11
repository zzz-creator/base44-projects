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
import { Globe, Plus, TrendingUp, Users, Zap, Shield, AlertTriangle, Pencil } from "lucide-react";
import { toast } from 'sonner';

export default function Colonies() {
  const [selectedColony, setSelectedColony] = useState(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingColony, setEditingColony] = useState(null);
  const queryClient = useQueryClient();

  const { data: colonies = [] } = useQuery({
    queryKey: ['colonies'],
    queryFn: () => base44.entities.Colony.list('-created_date')
  });

  const { data: factions = [] } = useQuery({
    queryKey: ['factions'],
    queryFn: () => base44.entities.Faction.list()
  });

  const createColonyMutation = useMutation({
    mutationFn: (data) => base44.entities.Colony.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries(['colonies']);
      toast.success('🌍 Colony established successfully!');
      setIsDialogOpen(false);
    }
  });

  const updateColonyMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Colony.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['colonies']);
      toast.success('🌍 Colony updated!');
      setEditDialogOpen(false);
    }
  });

  const [formData, setFormData] = useState({
    name: '',
    planet_type: 'Terrestrial',
    population: 1000,
    owner_faction_id: ''
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.name || !formData.owner_faction_id) {
      toast.error('Name and faction are required');
      return;
    }
    createColonyMutation.mutate(formData);
  };

  const handleEdit = (e) => {
    e.preventDefault();
    updateColonyMutation.mutate({ id: editingColony.id, data: editingColony });
  };

  const getStabilityColor = (stability) => {
    if (stability >= 80) return 'text-green-400';
    if (stability >= 50) return 'text-yellow-400';
    return 'text-red-400';
  };

  return (
    <div className="min-h-screen bg-slate-900 p-6">
      <div className="max-w-[1600px] mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-white">🌍 Colony Management</h1>
            <p className="text-slate-400 mt-1">{colonies.length} colonies under management</p>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-blue-600 hover:bg-blue-700">
                <Plus className="w-4 h-4 mr-2" />
                Establish Colony
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-slate-800 border-slate-700 text-white">
              <DialogHeader>
                <DialogTitle>Establish New Colony</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label>Colony Name</Label>
                  <Input
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    className="bg-slate-700 border-slate-600 text-white"
                    placeholder="New Terra"
                  />
                </div>
                <div>
                  <Label>Planet Type</Label>
                  <Select
                    value={formData.planet_type}
                    onValueChange={(value) => setFormData({...formData, planet_type: value})}
                  >
                    <SelectTrigger className="bg-slate-700 border-slate-600 text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-700 border-slate-600">
                      <SelectItem value="Terrestrial">Terrestrial</SelectItem>
                      <SelectItem value="Desert">Desert</SelectItem>
                      <SelectItem value="Ice">Ice</SelectItem>
                      <SelectItem value="Gas Giant Moon">Gas Giant Moon</SelectItem>
                      <SelectItem value="Asteroid">Asteroid</SelectItem>
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
                  <Label>Initial Population</Label>
                  <Input
                    type="number"
                    value={formData.population}
                    onChange={(e) => setFormData({...formData, population: parseInt(e.target.value)})}
                    className="bg-slate-700 border-slate-600 text-white"
                  />
                </div>
                <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700">
                  Establish Colony
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {colonies.map(colony => (
            <Card 
              key={colony.id} 
              className="bg-slate-800 border-slate-700 hover:border-slate-600 transition-all"
            >
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <Globe className="w-5 h-5 text-blue-400" />
                    <CardTitle className="text-white">{colony.name}</CardTitle>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="border-slate-600 text-slate-300">
                      {colony.planet_type}
                    </Badge>
                    <Button 
                      size="icon" 
                      variant="ghost" 
                      className="h-7 w-7 text-slate-400 hover:text-white"
                      onClick={(e) => {
                        e.stopPropagation();
                        setEditingColony({...colony});
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
                    <div className="flex items-center gap-2 text-slate-400 text-xs mb-1">
                      <Users className="w-3 h-3" />
                      Population
                    </div>
                    <div className="text-white font-semibold">
                      {colony.population.toLocaleString()}
                    </div>
                  </div>
                  <div>
                    <div className="flex items-center gap-2 text-slate-400 text-xs mb-1">
                      <TrendingUp className="w-3 h-3" />
                      Stability
                    </div>
                    <div className={`font-semibold ${getStabilityColor(colony.stability_index)}`}>
                      {colony.stability_index}%
                    </div>
                  </div>
                  <div>
                    <div className="flex items-center gap-2 text-slate-400 text-xs mb-1">
                      <Zap className="w-3 h-3" />
                      Energy
                    </div>
                    <div className="text-white font-semibold">
                      {colony.energy_output}
                    </div>
                  </div>
                  <div>
                    <div className="flex items-center gap-2 text-slate-400 text-xs mb-1">
                      <Shield className="w-3 h-3" />
                      Defense
                    </div>
                    <div className="text-white font-semibold">
                      {colony.defense_rating}
                    </div>
                  </div>
                </div>
                {colony.threat_level > 0 && (
                  <div className="flex items-center gap-2 p-2 bg-red-900/20 border border-red-800 rounded">
                    <AlertTriangle className="w-4 h-4 text-red-400" />
                    <span className="text-red-400 text-sm">
                      Threat Level: {colony.threat_level}
                    </span>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>

        {colonies.length === 0 && (
          <div className="text-center py-12">
            <Globe className="w-16 h-16 text-slate-600 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-slate-400 mb-2">No Colonies Established</h3>
            <p className="text-slate-500">Create your first colony to begin</p>
          </div>
        )}

        <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
          <DialogContent className="bg-slate-800 border-slate-700 text-white">
            <DialogHeader>
              <DialogTitle>Edit Colony</DialogTitle>
            </DialogHeader>
            {editingColony && (
              <form onSubmit={handleEdit} className="space-y-4">
                <div>
                  <Label>Colony Name</Label>
                  <Input
                    value={editingColony.name}
                    onChange={(e) => setEditingColony({...editingColony, name: e.target.value})}
                    className="bg-slate-700 border-slate-600 text-white"
                  />
                </div>
                <div>
                  <Label>Population</Label>
                  <Input
                    type="number"
                    value={editingColony.population}
                    onChange={(e) => setEditingColony({...editingColony, population: parseInt(e.target.value)})}
                    className="bg-slate-700 border-slate-600 text-white"
                  />
                </div>
                <div>
                  <Label>Stability Index</Label>
                  <Input
                    type="number"
                    value={editingColony.stability_index}
                    onChange={(e) => setEditingColony({...editingColony, stability_index: parseInt(e.target.value)})}
                    className="bg-slate-700 border-slate-600 text-white"
                    min="0"
                    max="100"
                  />
                </div>
                <div>
                  <Label>Energy Output</Label>
                  <Input
                    type="number"
                    value={editingColony.energy_output}
                    onChange={(e) => setEditingColony({...editingColony, energy_output: parseInt(e.target.value)})}
                    className="bg-slate-700 border-slate-600 text-white"
                  />
                </div>
                <div>
                  <Label>Defense Rating</Label>
                  <Input
                    type="number"
                    value={editingColony.defense_rating}
                    onChange={(e) => setEditingColony({...editingColony, defense_rating: parseInt(e.target.value)})}
                    className="bg-slate-700 border-slate-600 text-white"
                  />
                </div>
                <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700">
                  Update Colony
                </Button>
              </form>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}