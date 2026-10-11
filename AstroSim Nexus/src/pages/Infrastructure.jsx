import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '../api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "../components/ui/dialog";
import { Label } from "../components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import { Building2, Zap, Database, Shield as ShieldIcon, Beaker, Heart, TrendingUp } from 'lucide-react';
import { toast } from 'sonner';

const moduleIcons = {
  'Power Plant': Zap,
  'Storage Facility': Database,
  'Defense Grid': ShieldIcon,
  'Research Lab': Beaker,
  'Medical Center': Heart
};

export default function Infrastructure() {
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    colony_id: '',
    type: 'Power Plant'
  });

  const { data: modules = [], isLoading } = useQuery({
    queryKey: ['infrastructure'],
    queryFn: () => base44.entities.InfrastructureModule.list()
  });

  const { data: colonies = [] } = useQuery({
    queryKey: ['colonies'],
    queryFn: () => base44.entities.Colony.list()
  });

  const createModuleMutation = useMutation({
    mutationFn: (data) => base44.entities.InfrastructureModule.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['infrastructure'] });
      setDialogOpen(false);
      setFormData({ colony_id: '', type: 'Power Plant' });
      toast.success('🏗️ Module constructed!');
    }
  });

  const upgradeModuleMutation = useMutation({
    mutationFn: ({ id, level }) => base44.entities.InfrastructureModule.update(id, { 
      level,
      efficiency_boost: level * 10,
      maintenance_cost: 100 * level
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['infrastructure'] });
      toast.success('⬆️ Module upgraded!');
    }
  });

  const getColonyName = (colonyId) => {
    const colony = colonies.find(c => c.id === colonyId);
    return colony?.name || 'Unknown';
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.colony_id) {
      toast.error('Please select a colony');
      return;
    }
    createModuleMutation.mutate(formData);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="text-white text-xl">Loading infrastructure...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900 p-6">
      <div className="max-w-[1800px] mx-auto space-y-6">
        <div className="border-b border-slate-700 pb-4 flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold text-white">🏗️ Infrastructure</h1>
            <p className="text-slate-400 mt-2">{modules.length} modules deployed</p>
          </div>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-blue-600 hover:bg-blue-700">
                <Building2 className="w-4 h-4 mr-2" />
                Build Module
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-slate-800 border-slate-700 text-white">
              <DialogHeader>
                <DialogTitle>Construct Infrastructure Module</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label>Colony</Label>
                  <Select value={formData.colony_id} onValueChange={(value) => setFormData({...formData, colony_id: value})}>
                    <SelectTrigger className="bg-slate-700 border-slate-600">
                      <SelectValue placeholder="Select colony" />
                    </SelectTrigger>
                    <SelectContent>
                      {colonies.map(colony => (
                        <SelectItem key={colony.id} value={colony.id}>{colony.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Module Type</Label>
                  <Select value={formData.type} onValueChange={(value) => setFormData({...formData, type: value})}>
                    <SelectTrigger className="bg-slate-700 border-slate-600">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.keys(moduleIcons).map(type => (
                        <SelectItem key={type} value={type}>{type}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700">
                  Construct Module
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {modules.length === 0 ? (
          <Card className="bg-slate-800 border-slate-700">
            <CardContent className="p-12 text-center">
              <Building2 className="w-16 h-16 text-slate-500 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-white mb-2">No Infrastructure</h3>
              <p className="text-slate-400">Build modules to enhance colony capabilities</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {modules.map((module) => {
              const Icon = moduleIcons[module.type] || Building2;
              return (
                <Card key={module.id} className="bg-slate-800 border-slate-700">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3">
                        <div className="p-2 bg-blue-600 rounded-lg">
                          <Icon className="w-5 h-5 text-white" />
                        </div>
                        <div>
                          <CardTitle className="text-white text-base">{module.type}</CardTitle>
                          <p className="text-sm text-slate-400 mt-1">{getColonyName(module.colony_id)}</p>
                        </div>
                      </div>
                      <Badge className="bg-blue-100 text-blue-800">Level {module.level}</Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-slate-400">Efficiency Boost</span>
                      <span className="text-green-400 font-semibold flex items-center gap-1">
                        <TrendingUp className="w-3 h-3" />
                        +{module.efficiency_boost}%
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-slate-400">Maintenance Cost</span>
                      <span className="text-white font-semibold">{module.maintenance_cost}/turn</span>
                    </div>
                    {module.level < 5 && (
                      <Button
                        onClick={() => upgradeModuleMutation.mutate({ id: module.id, level: module.level + 1 })}
                        className="w-full bg-slate-700 hover:bg-slate-600 text-white"
                        size="sm"
                        disabled={upgradeModuleMutation.isPending}
                      >
                        Upgrade to Level {module.level + 1}
                      </Button>
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