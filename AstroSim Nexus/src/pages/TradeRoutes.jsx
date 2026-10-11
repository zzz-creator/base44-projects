import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '../api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Label } from "../components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "../components/ui/dialog";
import { Badge } from "../components/ui/badge";
import { Switch } from "../components/ui/switch";
import { TrendingUp, Plus, MapPin, Ship, AlertTriangle } from "lucide-react";
import { toast } from 'sonner';

export default function TradeRoutes() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const queryClient = useQueryClient();

  const { data: routes = [] } = useQuery({
    queryKey: ['routes'],
    queryFn: () => base44.entities.TradeRoute.list('-created_date')
  });

  const { data: ships = [] } = useQuery({
    queryKey: ['ships'],
    queryFn: () => base44.entities.Ship.list()
  });

  const { data: colonies = [] } = useQuery({
    queryKey: ['colonies'],
    queryFn: () => base44.entities.Colony.list()
  });

  const createRouteMutation = useMutation({
    mutationFn: (data) => base44.entities.TradeRoute.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries(['routes']);
      toast.success('📦 Trade route established!');
      setIsDialogOpen(false);
    }
  });

  const toggleRouteMutation = useMutation({
    mutationFn: ({ id, active }) => base44.entities.TradeRoute.update(id, { active_status: active }),
    onSuccess: () => {
      queryClient.invalidateQueries(['routes']);
    }
  });

  const [formData, setFormData] = useState({
    origin_colony_id: '',
    destination_colony_id: '',
    assigned_ship_id: '',
    distance: 100,
    risk_rating: 20
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.origin_colony_id || !formData.destination_colony_id || !formData.assigned_ship_id) {
      toast.error('All fields are required');
      return;
    }
    if (formData.origin_colony_id === formData.destination_colony_id) {
      toast.error('Origin and destination must be different');
      return;
    }
    createRouteMutation.mutate(formData);
  };

  const getRiskColor = (risk) => {
    if (risk < 30) return 'text-green-400 bg-green-900/20 border-green-800';
    if (risk < 60) return 'text-yellow-400 bg-yellow-900/20 border-yellow-800';
    return 'text-red-400 bg-red-900/20 border-red-800';
  };

  return (
    <div className="min-h-screen bg-slate-900 p-6">
      <div className="max-w-[1600px] mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-white">📦 Trade Routes</h1>
            <p className="text-slate-400 mt-1">
              {routes.filter(r => r.active_status).length} active / {routes.length} total routes
            </p>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-blue-600 hover:bg-blue-700">
                <Plus className="w-4 h-4 mr-2" />
                Establish Route
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-slate-800 border-slate-700 text-white">
              <DialogHeader>
                <DialogTitle>Establish Trade Route</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label>Origin Colony</Label>
                  <Select
                    value={formData.origin_colony_id}
                    onValueChange={(value) => setFormData({...formData, origin_colony_id: value})}
                  >
                    <SelectTrigger className="bg-slate-700 border-slate-600 text-white">
                      <SelectValue placeholder="Select origin" />
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
                <div>
                  <Label>Destination Colony</Label>
                  <Select
                    value={formData.destination_colony_id}
                    onValueChange={(value) => setFormData({...formData, destination_colony_id: value})}
                  >
                    <SelectTrigger className="bg-slate-700 border-slate-600 text-white">
                      <SelectValue placeholder="Select destination" />
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
                <div>
                  <Label>Assigned Ship</Label>
                  <Select
                    value={formData.assigned_ship_id}
                    onValueChange={(value) => setFormData({...formData, assigned_ship_id: value})}
                  >
                    <SelectTrigger className="bg-slate-700 border-slate-600 text-white">
                      <SelectValue placeholder="Select ship" />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-700 border-slate-600">
                      {ships.map(ship => (
                        <SelectItem key={ship.id} value={ship.id}>
                          {ship.name} ({ship.class})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700">
                  Establish Route
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {routes.map(route => {
            const originColony = colonies.find(c => c.id === route.origin_colony_id);
            const destColony = colonies.find(c => c.id === route.destination_colony_id);
            const assignedShip = ships.find(s => s.id === route.assigned_ship_id);

            return (
              <Card 
                key={route.id} 
                className="bg-slate-800 border-slate-700 hover:border-slate-600 transition-all"
              >
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      <TrendingUp className="w-5 h-5 text-blue-400" />
                      <CardTitle className="text-white text-base">
                        Route #{route.id.substring(0, 8)}
                      </CardTitle>
                    </div>
                    <Switch
                      checked={route.active_status}
                      onCheckedChange={(checked) => 
                        toggleRouteMutation.mutate({ id: route.id, active: checked })
                      }
                    />
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 text-slate-400 text-xs mb-1">
                        <MapPin className="w-3 h-3" />
                        Origin
                      </div>
                      <div className="text-white font-medium">
                        {originColony?.name || 'Unknown'}
                      </div>
                    </div>
                    <div className="text-slate-500">→</div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 text-slate-400 text-xs mb-1">
                        <MapPin className="w-3 h-3" />
                        Destination
                      </div>
                      <div className="text-white font-medium">
                        {destColony?.name || 'Unknown'}
                      </div>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-slate-700">
                    <div className="flex items-center gap-2 text-slate-400 text-xs mb-1">
                      <Ship className="w-3 h-3" />
                      Assigned Ship
                    </div>
                    <div className="text-white">
                      {assignedShip?.name || 'Unknown'} 
                      <span className="text-slate-400 text-sm ml-2">
                        ({assignedShip?.class})
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <div className="text-slate-400 text-xs mb-1">Distance</div>
                      <div className="text-white font-medium">{route.distance} units</div>
                    </div>
                    <div>
                      <div className="flex items-center gap-2 text-slate-400 text-xs mb-1">
                        <AlertTriangle className="w-3 h-3" />
                        Risk Level
                      </div>
                      <Badge className={`${getRiskColor(route.risk_rating)} border font-medium`}>
                        {route.risk_rating}%
                      </Badge>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-slate-700">
                    <Badge 
                      variant={route.active_status ? "default" : "secondary"}
                      className={route.active_status ? "bg-green-600" : "bg-slate-600"}
                    >
                      {route.active_status ? 'Active' : 'Inactive'}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {routes.length === 0 && (
          <div className="text-center py-12">
            <TrendingUp className="w-16 h-16 text-slate-600 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-slate-400 mb-2">No Trade Routes</h3>
            <p className="text-slate-500">Establish your first trade route to begin logistics operations</p>
          </div>
        )}
      </div>
    </div>
  );
}