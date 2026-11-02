import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '../api/base44Client';
import { calculateCustomClassStats, validateLoadout } from '../components/shipUtils';
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import { Badge } from "../components/ui/badge";
import { Rocket, Package, Shield, Wrench, X, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';

export default function ShipDesigner() {
  const queryClient = useQueryClient();
  const [designState, setDesignState] = useState({
    name: '',
    faction_id: '',
    hull_id: '',
    component_ids: []
  });
  const [previewStats, setPreviewStats] = useState(null);

  const { data: hulls = [] } = useQuery({
    queryKey: ['hulls'],
    queryFn: () => base44.entities.ShipHull.list()
  });

  const { data: components = [] } = useQuery({
    queryKey: ['components'],
    queryFn: () => base44.entities.ShipComponent.list()
  });

  const { data: factions = [] } = useQuery({
    queryKey: ['factions'],
    queryFn: () => base44.entities.Faction.list()
  });

  const { data: customClasses = [] } = useQuery({
    queryKey: ['customClasses'],
    queryFn: () => base44.entities.CustomShipClass.list()
  });

  const createClassMutation = useMutation({
    mutationFn: async (data) => {
      const validation = await validateLoadout(data.hull_id, data.component_ids);
      if (!validation.valid) {
        throw new Error(validation.error);
      }
      const stats = await calculateCustomClassStats(data.hull_id, data.component_ids);
      return base44.entities.CustomShipClass.create({
        ...data,
        total_cargo_capacity: stats.cargo_capacity,
        total_speed: stats.speed,
        total_defense: stats.defense,
        total_maintenance_cost: stats.maintenance_cost,
        production_cost_credits: stats.production_cost
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customClasses'] });
      setDesignState({ name: '', faction_id: '', hull_id: '', component_ids: [] });
      setPreviewStats(null);
      toast.success('🚀 Ship class created!');
    },
    onError: (error) => {
      toast.error(error.message);
    }
  });

  const updatePreview = async () => {
    if (!designState.hull_id) return;
    const stats = await calculateCustomClassStats(designState.hull_id, designState.component_ids);
    setPreviewStats(stats);
  };

  React.useEffect(() => {
    updatePreview();
  }, [designState.hull_id, designState.component_ids]);

  const addComponent = (componentId) => {
    setDesignState({
      ...designState,
      component_ids: [...designState.component_ids, componentId]
    });
  };

  const removeComponent = (index) => {
    const newIds = [...designState.component_ids];
    newIds.splice(index, 1);
    setDesignState({ ...designState, component_ids: newIds });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!designState.name || !designState.faction_id || !designState.hull_id) {
      toast.error('Name, faction, and hull required');
      return;
    }
    createClassMutation.mutate(designState);
  };

  const selectedHull = hulls.find(h => h.id === designState.hull_id);
  const installedComponents = designState.component_ids
    .map(id => components.find(c => c.id === id))
    .filter(Boolean);

  const weaponCount = installedComponents.filter(c => c.category === 'Weapon').length;
  const utilityCount = installedComponents.filter(c => c.category !== 'Weapon').length;
  const totalPower = installedComponents.reduce((sum, c) => sum + c.power_consumption, 0);

  return (
    <div className="min-h-screen bg-slate-900 p-6">
      <div className="max-w-[1800px] mx-auto space-y-6">
        <div className="border-b border-slate-700 pb-4">
          <h1 className="text-4xl font-bold text-white">🏗️ Ship Class Designer</h1>
          <p className="text-slate-400 mt-2">{customClasses.length} custom classes designed</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Designer Panel */}
          <div className="lg:col-span-2 space-y-4">
            <Card className="bg-slate-800 border-slate-700">
              <CardHeader>
                <CardTitle className="text-white">Design Configuration</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Class Name</Label>
                      <Input
                        className="bg-slate-700 border-slate-600 text-white"
                        value={designState.name}
                        onChange={(e) => setDesignState({...designState, name: e.target.value})}
                        placeholder="Titan Hauler MK-II"
                      />
                    </div>
                    <div>
                      <Label>Faction</Label>
                      <Select value={designState.faction_id} onValueChange={(v) => setDesignState({...designState, faction_id: v})}>
                        <SelectTrigger className="bg-slate-700 border-slate-600 text-white">
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
                  </div>

                  <div>
                    <Label>Hull Type</Label>
                    <Select value={designState.hull_id} onValueChange={(v) => setDesignState({...designState, hull_id: v})}>
                      <SelectTrigger className="bg-slate-700 border-slate-600 text-white">
                        <SelectValue placeholder="Select hull" />
                      </SelectTrigger>
                      <SelectContent>
                        {hulls.length > 0 ? (
                          hulls.map(h => (
                            <SelectItem key={h.id} value={h.id}>
                              {h.name} (⚡{h.power_capacity}W, 🔫{h.base_weapon_slots}, 🔧{h.base_utility_slots})
                            </SelectItem>
                          ))
                        ) : (
                          <div className="p-2 text-sm text-slate-400">No hulls available</div>
                        )}
                      </SelectContent>
                    </Select>
                  </div>

                  {selectedHull && (
                    <div className="p-4 bg-slate-700 rounded border border-slate-600">
                      <div className="text-sm text-slate-300 mb-2">Slot Usage</div>
                      <div className="grid grid-cols-3 gap-3 text-xs">
                        <div>
                          <span className="text-slate-400">Weapons:</span>
                          <span className={`ml-2 font-bold ${weaponCount > selectedHull.base_weapon_slots ? 'text-red-400' : 'text-green-400'}`}>
                            {weaponCount}/{selectedHull.base_weapon_slots}
                          </span>
                        </div>
                        <div>
                          <span className="text-slate-400">Utility:</span>
                          <span className={`ml-2 font-bold ${utilityCount > selectedHull.base_utility_slots ? 'text-red-400' : 'text-green-400'}`}>
                            {utilityCount}/{selectedHull.base_utility_slots}
                          </span>
                        </div>
                        <div>
                          <span className="text-slate-400">Power:</span>
                          <span className={`ml-2 font-bold ${totalPower > selectedHull.power_capacity ? 'text-red-400' : 'text-green-400'}`}>
                            {totalPower}/{selectedHull.power_capacity}W
                          </span>
                        </div>
                      </div>
                    </div>
                  )}

                  <div>
                    <Label>Add Components</Label>
                    <Select onValueChange={addComponent}>
                      <SelectTrigger className="bg-slate-700 border-slate-600 text-white">
                        <SelectValue placeholder="Select component" />
                      </SelectTrigger>
                      <SelectContent>
                        {components.length > 0 ? (
                          components.map(c => (
                            <SelectItem key={c.id} value={c.id}>
                              {c.name} ({c.category}, ⚡{c.power_consumption}W)
                            </SelectItem>
                          ))
                        ) : (
                          <div className="p-2 text-sm text-slate-400">No components available</div>
                        )}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label>Installed Components</Label>
                    <div className="space-y-2 mt-2">
                      {installedComponents.map((comp, idx) => (
                        <div key={idx} className="flex items-center justify-between p-2 bg-slate-700 rounded">
                          <div className="flex items-center gap-2">
                            <Badge className="bg-blue-600">{comp.category}</Badge>
                            <span className="text-white text-sm">{comp.name}</span>
                          </div>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => removeComponent(idx)}
                            className="text-red-400 hover:text-red-300"
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        </div>
                      ))}
                      {installedComponents.length === 0 && (
                        <div className="text-slate-500 text-sm text-center py-4">No components installed</div>
                      )}
                    </div>
                  </div>

                  <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700">
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Create Ship Class
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>

          {/* Stats Preview */}
          <div className="space-y-4">
            <Card className="bg-slate-800 border-slate-700">
              <CardHeader>
                <CardTitle className="text-white">Performance Preview</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {previewStats ? (
                  <>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="p-3 bg-slate-700 rounded">
                        <div className="flex items-center gap-2 text-slate-400 text-xs mb-1">
                          <Rocket className="w-3 h-3" />
                          Speed
                        </div>
                        <div className="text-white font-bold">{previewStats.speed}</div>
                      </div>
                      <div className="p-3 bg-slate-700 rounded">
                        <div className="flex items-center gap-2 text-slate-400 text-xs mb-1">
                          <Package className="w-3 h-3" />
                          Cargo
                        </div>
                        <div className="text-white font-bold">{previewStats.cargo_capacity}</div>
                      </div>
                      <div className="p-3 bg-slate-700 rounded">
                        <div className="flex items-center gap-2 text-slate-400 text-xs mb-1">
                          <Shield className="w-3 h-3" />
                          Defense
                        </div>
                        <div className="text-white font-bold">{previewStats.defense}</div>
                      </div>
                      <div className="p-3 bg-slate-700 rounded">
                        <div className="flex items-center gap-2 text-slate-400 text-xs mb-1">
                          <Wrench className="w-3 h-3" />
                          Maintenance
                        </div>
                        <div className="text-white font-bold">{previewStats.maintenance_cost}/turn</div>
                      </div>
                    </div>
                    <div className="p-4 bg-blue-900/20 border border-blue-800 rounded">
                      <div className="text-blue-400 text-sm font-semibold mb-1">Build Cost</div>
                      <div className="text-white text-2xl font-bold">{previewStats.production_cost.toLocaleString()} CR</div>
                    </div>
                  </>
                ) : (
                  <div className="text-slate-500 text-center py-8">Select a hull to preview stats</div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Existing Classes */}
        <Card className="bg-slate-800 border-slate-700">
          <CardHeader>
            <CardTitle className="text-white">Custom Ship Classes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {customClasses.map(cls => (
                <div key={cls.id} className="p-4 bg-slate-700 rounded border border-slate-600">
                  <div className="font-bold text-white mb-2">{cls.name}</div>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div><span className="text-slate-400">Speed:</span> <span className="text-white">{cls.total_speed}</span></div>
                    <div><span className="text-slate-400">Cargo:</span> <span className="text-white">{cls.total_cargo_capacity}</span></div>
                    <div><span className="text-slate-400">Defense:</span> <span className="text-white">{cls.total_defense}</span></div>
                    <div><span className="text-slate-400">Cost:</span> <span className="text-white">{cls.production_cost_credits} CR</span></div>
                  </div>
                </div>
              ))}
            </div>
            {customClasses.length === 0 && (
              <div className="text-slate-500 text-center py-8">No custom classes created</div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}