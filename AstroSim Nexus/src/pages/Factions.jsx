import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '../api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "../components/ui/dialog";
import { Badge } from "../components/ui/badge";
import { Slider } from "../components/ui/slider";
import { Users, Plus, Coins, TrendingUp, Swords, Pencil } from "lucide-react";
import { toast } from 'sonner';

export default function Factions() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingFaction, setEditingFaction] = useState(null);
  const queryClient = useQueryClient();

  const { data: factions = [] } = useQuery({
    queryKey: ['factions'],
    queryFn: () => base44.entities.Faction.list('-created_date')
  });

  const createFactionMutation = useMutation({
    mutationFn: async (data) => {
      const faction = await base44.entities.Faction.create(data);
      // Create default strategy profile
      await base44.entities.FactionStrategyProfile.create({
        faction_id: faction.id,
        economic_priority_weight: 0.33,
        military_priority_weight: 0.33,
        expansion_priority_weight: 0.34,
        risk_tolerance: 0.5,
        historical_success_rate: 0.5
      });
      return faction;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['factions']);
      toast.success('Faction created successfully');
      setIsDialogOpen(false);
    }
  });

  const updateFactionMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Faction.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['factions']);
      toast.success('Faction updated!');
      setEditDialogOpen(false);
    }
  });

  const [formData, setFormData] = useState({
    name: '',
    aggression_level: 50,
    economic_focus: 50,
    technology_level: 1,
    credits: 10000
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.name) {
      toast.error('Faction name is required');
      return;
    }
    createFactionMutation.mutate(formData);
  };

  const handleEdit = (e) => {
    e.preventDefault();
    updateFactionMutation.mutate({ id: editingFaction.id, data: editingFaction });
  };

  const getStanceColor = (stance) => {
    const colors = {
      'Neutral': 'bg-slate-600',
      'Friendly': 'bg-green-600',
      'Hostile': 'bg-red-600',
      'Allied': 'bg-blue-600'
    };
    return colors[stance] || 'bg-slate-600';
  };

  return (
    <div className="min-h-screen bg-slate-900 p-6">
      <div className="max-w-[1600px] mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-white">Faction Management</h1>
            <p className="text-slate-400 mt-1">{factions.length} active factions</p>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-blue-600 hover:bg-blue-700">
                <Plus className="w-4 h-4 mr-2" />
                Create Faction
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-slate-800 border-slate-700 text-white max-w-md">
              <DialogHeader>
                <DialogTitle>Create New Faction</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label>Faction Name</Label>
                  <Input
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    className="bg-slate-700 border-slate-600 text-white"
                    placeholder="United Earth Alliance"
                  />
                </div>
                <div>
                  <Label>Aggression Level: {formData.aggression_level}</Label>
                  <Slider
                    value={[formData.aggression_level]}
                    onValueChange={([value]) => setFormData({...formData, aggression_level: value})}
                    max={100}
                    step={1}
                    className="mt-2"
                  />
                </div>
                <div>
                  <Label>Economic Focus: {formData.economic_focus}</Label>
                  <Slider
                    value={[formData.economic_focus]}
                    onValueChange={([value]) => setFormData({...formData, economic_focus: value})}
                    max={100}
                    step={1}
                    className="mt-2"
                  />
                </div>
                <div>
                  <Label>Technology Level</Label>
                  <Input
                    type="number"
                    value={formData.technology_level}
                    onChange={(e) => setFormData({...formData, technology_level: parseInt(e.target.value)})}
                    className="bg-slate-700 border-slate-600 text-white"
                    min="1"
                  />
                </div>
                <div>
                  <Label>Starting Credits</Label>
                  <Input
                    type="number"
                    value={formData.credits}
                    onChange={(e) => setFormData({...formData, credits: parseInt(e.target.value)})}
                    className="bg-slate-700 border-slate-600 text-white"
                  />
                </div>
                <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700">
                  Create Faction
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {factions.map(faction => (
            <Card 
              key={faction.id} 
              className="bg-slate-800 border-slate-700 hover:border-slate-600 transition-all"
            >
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <Users className="w-5 h-5 text-blue-400" />
                    <CardTitle className="text-white">{faction.name}</CardTitle>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge className={`${getStanceColor(faction.diplomatic_stance)} text-white border-0`}>
                      {faction.diplomatic_stance}
                    </Badge>
                    <Button 
                      size="icon" 
                      variant="ghost" 
                      className="h-7 w-7 text-slate-400 hover:text-white"
                      onClick={() => {
                        setEditingFaction({...faction});
                        setEditDialogOpen(true);
                      }}
                    >
                      <Pencil className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-3 p-3 bg-slate-700/50 rounded-lg">
                  <Coins className="w-5 h-5 text-yellow-400" />
                  <div className="flex-1">
                    <div className="text-slate-400 text-xs">Treasury</div>
                    <div className="text-white font-bold text-lg">
                      {faction.credits.toLocaleString()}
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <div>
                    <div className="flex items-center justify-between text-xs mb-1">
                      <div className="flex items-center gap-2 text-slate-400">
                        <Swords className="w-3 h-3" />
                        Aggression
                      </div>
                      <span className="text-white">{faction.aggression_level}%</span>
                    </div>
                    <div className="w-full bg-slate-700 rounded-full h-2">
                      <div 
                        className="bg-red-500 h-2 rounded-full transition-all"
                        style={{ width: `${faction.aggression_level}%` }}
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between text-xs mb-1">
                      <div className="flex items-center gap-2 text-slate-400">
                        <TrendingUp className="w-3 h-3" />
                        Economic Focus
                      </div>
                      <span className="text-white">{faction.economic_focus}%</span>
                    </div>
                    <div className="w-full bg-slate-700 rounded-full h-2">
                      <div 
                        className="bg-green-500 h-2 rounded-full transition-all"
                        style={{ width: `${faction.economic_focus}%` }}
                      />
                    </div>
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-700 flex items-center justify-between text-sm">
                  <span className="text-slate-400">Technology Level</span>
                  <span className="text-white font-semibold">{faction.technology_level}</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {factions.length === 0 && (
          <div className="text-center py-12">
            <Users className="w-16 h-16 text-slate-600 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-slate-400 mb-2">No Factions Created</h3>
            <p className="text-slate-500">Create your first faction to begin strategic operations</p>
          </div>
        )}

        <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
          <DialogContent className="bg-slate-800 border-slate-700 text-white max-w-md">
            <DialogHeader>
              <DialogTitle>Edit Faction</DialogTitle>
            </DialogHeader>
            {editingFaction && (
              <form onSubmit={handleEdit} className="space-y-4">
                <div>
                  <Label>Faction Name</Label>
                  <Input
                    value={editingFaction.name}
                    onChange={(e) => setEditingFaction({...editingFaction, name: e.target.value})}
                    className="bg-slate-700 border-slate-600 text-white"
                  />
                </div>
                <div>
                  <Label>Aggression Level: {editingFaction.aggression_level}</Label>
                  <Slider
                    value={[editingFaction.aggression_level]}
                    onValueChange={([value]) => setEditingFaction({...editingFaction, aggression_level: value})}
                    max={100}
                    step={1}
                    className="mt-2"
                  />
                </div>
                <div>
                  <Label>Economic Focus: {editingFaction.economic_focus}</Label>
                  <Slider
                    value={[editingFaction.economic_focus]}
                    onValueChange={([value]) => setEditingFaction({...editingFaction, economic_focus: value})}
                    max={100}
                    step={1}
                    className="mt-2"
                  />
                </div>
                <div>
                  <Label>Credits</Label>
                  <Input
                    type="number"
                    value={editingFaction.credits}
                    onChange={(e) => setEditingFaction({...editingFaction, credits: parseInt(e.target.value)})}
                    className="bg-slate-700 border-slate-600 text-white"
                  />
                </div>
                <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700">
                  Update Faction
                </Button>
              </form>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}