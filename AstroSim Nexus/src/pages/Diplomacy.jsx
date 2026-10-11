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
import { Checkbox } from "../components/ui/checkbox";
import { Handshake, Swords, Users, TrendingUp, Clock, Plus } from 'lucide-react';
import { toast } from 'sonner';

const agreementIcons = {
  'Trade Pact': TrendingUp,
  'Non-Aggression': Handshake,
  'Alliance': Users,
  'War': Swords
};

export default function Diplomacy() {
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    faction_a_id: '',
    faction_b_id: '',
    type: 'Trade Pact',
    duration: 10
  });
  const [isInfinite, setIsInfinite] = useState(false);

  const { data: agreements = [], isLoading } = useQuery({
    queryKey: ['diplomacy'],
    queryFn: () => base44.entities.DiplomacyAgreement.list()
  });

  const { data: factions = [] } = useQuery({
    queryKey: ['factions'],
    queryFn: () => base44.entities.Faction.list()
  });

  const createAgreementMutation = useMutation({
    mutationFn: (data) => base44.entities.DiplomacyAgreement.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['diplomacy'] });
      setDialogOpen(false);
      setFormData({ faction_a_id: '', faction_b_id: '', type: 'Trade Pact', duration: 10 });
      setIsInfinite(false);
      toast.success('🤝 Diplomatic agreement established!');
    }
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.faction_a_id || !formData.faction_b_id) {
      toast.error('Please select both factions');
      return;
    }
    if (formData.faction_a_id === formData.faction_b_id) {
      toast.error('Factions must be different');
      return;
    }
    createAgreementMutation.mutate({
      ...formData,
      duration: isInfinite ? 0 : formData.duration
    });
  };

  const getFactionName = (factionId) => {
    const faction = factions.find(f => f.id === factionId);
    return faction?.name || 'Unknown';
  };

  const getTypeColor = (type) => {
    const colors = {
      'Trade Pact': 'bg-blue-100 text-blue-800',
      'Non-Aggression': 'bg-green-100 text-green-800',
      'Alliance': 'bg-purple-100 text-purple-800',
      'War': 'bg-red-100 text-red-800'
    };
    return colors[type] || 'bg-gray-100 text-gray-800';
  };

  const getStatusColor = (status) => {
    const colors = {
      Active: 'bg-green-500',
      Expired: 'bg-gray-500',
      Broken: 'bg-red-500'
    };
    return colors[status] || 'bg-gray-500';
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="text-white text-xl">Loading diplomatic relations...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900 p-6">
      <div className="max-w-[1800px] mx-auto space-y-6">
        <div className="border-b border-slate-700 pb-4 flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold text-white">🤝 Diplomatic Relations</h1>
            <p className="text-slate-400 mt-2">{agreements.length} agreements</p>
          </div>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-purple-600 hover:bg-purple-700">
                <Plus className="w-4 h-4 mr-2" />
                New Agreement
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-slate-800 border-slate-700 text-white">
              <DialogHeader>
                <DialogTitle>Establish Diplomatic Agreement</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label>First Faction</Label>
                  <Select value={formData.faction_a_id} onValueChange={(value) => setFormData({...formData, faction_a_id: value})}>
                    <SelectTrigger className="bg-slate-700 border-slate-600">
                      <SelectValue placeholder="Select faction" />
                    </SelectTrigger>
                    <SelectContent>
                      {factions.map(faction => (
                        <SelectItem key={faction.id} value={faction.id}>{faction.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Second Faction</Label>
                  <Select value={formData.faction_b_id} onValueChange={(value) => setFormData({...formData, faction_b_id: value})}>
                    <SelectTrigger className="bg-slate-700 border-slate-600">
                      <SelectValue placeholder="Select faction" />
                    </SelectTrigger>
                    <SelectContent>
                      {factions.map(faction => (
                        <SelectItem key={faction.id} value={faction.id}>{faction.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Agreement Type</Label>
                  <Select value={formData.type} onValueChange={(value) => setFormData({...formData, type: value})}>
                    <SelectTrigger className="bg-slate-700 border-slate-600">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Trade Pact">📦 Trade Pact</SelectItem>
                      <SelectItem value="Non-Aggression">🕊️ Non-Aggression</SelectItem>
                      <SelectItem value="Alliance">🤝 Alliance</SelectItem>
                      <SelectItem value="War">⚔️ War</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Duration (turns)</Label>
                  <Input
                    type="number"
                    className="bg-slate-700 border-slate-600"
                    value={formData.duration}
                    onChange={(e) => setFormData({...formData, duration: parseInt(e.target.value)})}
                    min="1"
                    disabled={isInfinite}
                  />
                  <div className="flex items-center gap-2 mt-2">
                    <Checkbox 
                      id="infinite" 
                      checked={isInfinite}
                      onCheckedChange={setIsInfinite}
                    />
                    <Label htmlFor="infinite" className="text-sm cursor-pointer">
                      Infinite (permanent agreement)
                    </Label>
                  </div>
                </div>
                <Button type="submit" className="w-full bg-purple-600 hover:bg-purple-700">
                  Establish Agreement
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {agreements.length === 0 ? (
          <Card className="bg-slate-800 border-slate-700">
            <CardContent className="p-12 text-center">
              <Handshake className="w-16 h-16 text-slate-500 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-white mb-2">No Diplomatic Relations</h3>
              <p className="text-slate-400">Agreements will appear here</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {agreements.map((agreement) => {
              const Icon = agreementIcons[agreement.type] || Handshake;
              
              return (
                <Card key={agreement.id} className="bg-slate-800 border-slate-700">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3">
                        <div className="p-2 bg-purple-600 rounded-lg">
                          <Icon className="w-5 h-5 text-white" />
                        </div>
                        <div className="flex-1">
                          <CardTitle className="text-white text-base">{agreement.type}</CardTitle>
                          <div className="text-sm text-slate-400 mt-1">
                            {getFactionName(agreement.faction_a_id)} ↔ {getFactionName(agreement.faction_b_id)}
                          </div>
                        </div>
                      </div>
                      <div className={`w-2 h-2 rounded-full ${getStatusColor(agreement.status)}`} />
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-center justify-between">
                      <Badge className={getTypeColor(agreement.type)}>{agreement.type}</Badge>
                      <Badge variant="outline" className="text-white border-slate-600">
                        {agreement.status}
                      </Badge>
                    </div>

                    <div className="flex items-center gap-2 text-sm text-slate-400">
                      <Clock className="w-4 h-4" />
                      <span>{agreement.duration === 0 ? '∞ Permanent' : `${agreement.duration} turns remaining`}</span>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}