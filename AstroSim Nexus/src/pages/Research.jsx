import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '../api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import { Progress } from "../components/ui/progress";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "../components/ui/dialog";
import { Label } from "../components/ui/label";
import { Input } from "../components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import { Beaker, Zap, Shield, TrendingUp, DollarSign, Rocket, Plus } from 'lucide-react';
import { toast } from 'sonner';

const categoryIcons = {
  Energy: Zap,
  Defense: Shield,
  Logistics: TrendingUp,
  Economics: DollarSign,
  Expansion: Rocket
};

export default function Research() {
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    faction_id: '',
    category: 'Energy',
    unlock_type: ''
  });

  const { data: projects = [], isLoading } = useQuery({
    queryKey: ['research'],
    queryFn: () => base44.entities.ResearchProject.list()
  });

  const { data: factions = [] } = useQuery({
    queryKey: ['factions'],
    queryFn: () => base44.entities.Faction.list()
  });

  const createProjectMutation = useMutation({
    mutationFn: (data) => base44.entities.ResearchProject.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['research'] });
      setDialogOpen(false);
      setFormData({ faction_id: '', category: 'Energy', unlock_type: '' });
      toast.success('🔬 Research project initiated!');
    }
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.faction_id) {
      toast.error('Please select a faction');
      return;
    }
    createProjectMutation.mutate(formData);
  };

  const getFactionName = (factionId) => {
    const faction = factions.find(f => f.id === factionId);
    return faction?.name || 'Unknown Faction';
  };

  const getProgressPercent = (project) => {
    return Math.min(100, (project.progress / project.completion_threshold) * 100);
  };

  const getCategoryColor = (category) => {
    const colors = {
      Energy: 'bg-yellow-100 text-yellow-800',
      Defense: 'bg-red-100 text-red-800',
      Logistics: 'bg-blue-100 text-blue-800',
      Economics: 'bg-green-100 text-green-800',
      Expansion: 'bg-purple-100 text-purple-800'
    };
    return colors[category] || 'bg-gray-100 text-gray-800';
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="text-white text-xl">Loading research data...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900 p-6">
      <div className="max-w-[1800px] mx-auto space-y-6">
        <div className="border-b border-slate-700 pb-4 flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold text-white">🔬 Research & Development</h1>
            <p className="text-slate-400 mt-2">{projects.length} active projects</p>
          </div>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-blue-600 hover:bg-blue-700">
                <Plus className="w-4 h-4 mr-2" />
                Start Research
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-slate-800 border-slate-700 text-white">
              <DialogHeader>
                <DialogTitle>Initiate Research Project</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label>Faction</Label>
                  <Select value={formData.faction_id} onValueChange={(value) => setFormData({...formData, faction_id: value})}>
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
                  <Label>Category</Label>
                  <Select value={formData.category} onValueChange={(value) => setFormData({...formData, category: value})}>
                    <SelectTrigger className="bg-slate-700 border-slate-600">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Energy">⚡ Energy</SelectItem>
                      <SelectItem value="Defense">🛡️ Defense</SelectItem>
                      <SelectItem value="Logistics">📦 Logistics</SelectItem>
                      <SelectItem value="Economics">💰 Economics</SelectItem>
                      <SelectItem value="Expansion">🚀 Expansion</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Unlock Type (optional)</Label>
                  <Input
                    className="bg-slate-700 border-slate-600"
                    placeholder="e.g., Advanced Solar Panels"
                    value={formData.unlock_type}
                    onChange={(e) => setFormData({...formData, unlock_type: e.target.value})}
                  />
                </div>
                <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700">
                  Start Research
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {projects.length === 0 ? (
          <Card className="bg-slate-800 border-slate-700">
            <CardContent className="p-12 text-center">
              <Beaker className="w-16 h-16 text-slate-500 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-white mb-2">No Active Research</h3>
              <p className="text-slate-400">Research projects will appear here</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {projects.map((project) => {
              const Icon = categoryIcons[project.category] || Beaker;
              const progressPercent = getProgressPercent(project);
              const isComplete = progressPercent >= 100;

              return (
                <Card key={project.id} className="bg-slate-800 border-slate-700">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3">
                        <div className={`p-2 rounded-lg ${isComplete ? 'bg-green-600' : 'bg-blue-600'}`}>
                          <Icon className="w-5 h-5 text-white" />
                        </div>
                        <div>
                          <CardTitle className="text-white text-base">{project.category} Research</CardTitle>
                          <p className="text-sm text-slate-400 mt-1">{getFactionName(project.faction_id)}</p>
                        </div>
                      </div>
                      <Badge className={getCategoryColor(project.category)}>{project.category}</Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <div className="flex items-center justify-between text-sm text-slate-400 mb-2">
                        <span>Progress</span>
                        <span className="text-white font-semibold">
                          {project.progress} / {project.completion_threshold}
                        </span>
                      </div>
                      <Progress value={progressPercent} className="h-2" />
                      {isComplete && (
                        <div className="mt-2 text-sm text-green-400 font-semibold">
                          ✓ Research Complete
                        </div>
                      )}
                    </div>

                    {project.unlock_type && (
                      <div className="text-sm">
                        <span className="text-slate-400">Unlocks: </span>
                        <span className="text-white">{project.unlock_type}</span>
                      </div>
                    )}
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