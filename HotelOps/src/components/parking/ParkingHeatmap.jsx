import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { Badge } from "../../components/ui/badge";
import { Car, Zap, Users, Wrench } from 'lucide-react';
import { cn } from "../../lib/utils";

export default function ParkingHeatmap({ spots = [], level = "ALL" }) {
  const filteredSpots = level === "ALL" ? spots : spots.filter(s => s.level === level);
  
  const levels = [...new Set(spots.map(s => s.level))].sort();
  
  const getStatusColor = (status) => {
    switch (status) {
      case 'available': return 'bg-green-500 hover:bg-green-600';
      case 'occupied': return 'bg-red-500 hover:bg-red-600';
      case 'reserved': return 'bg-yellow-500 hover:bg-yellow-600';
      case 'maintenance': return 'bg-slate-500 hover:bg-slate-600';
      default: return 'bg-slate-300';
    }
  };

  const getZoneIcon = (zone) => {
    switch (zone) {
      case 'electric': return <Zap className="w-3 h-3" />;
      case 'vip': return <Users className="w-3 h-3" />;
      case 'handicap': return <Users className="w-3 h-3" />;
      default: return <Car className="w-3 h-3" />;
    }
  };

  const stats = {
    total: filteredSpots.length,
    available: filteredSpots.filter(s => s.status === 'available').length,
    occupied: filteredSpots.filter(s => s.status === 'occupied').length,
    reserved: filteredSpots.filter(s => s.status === 'reserved').length,
    maintenance: filteredSpots.filter(s => s.status === 'maintenance').length
  };

  const occupancyRate = stats.total > 0 ? ((stats.occupied + stats.reserved) / stats.total * 100).toFixed(1) : 0;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-semibold uppercase tracking-wide">
            Parking Occupancy - {level}
          </CardTitle>
          <Badge variant={occupancyRate > 80 ? "destructive" : occupancyRate > 50 ? "secondary" : "default"}>
            {occupancyRate}% Full
          </Badge>
        </div>
        <div className="grid grid-cols-4 gap-2 mt-3 text-xs">
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded bg-green-500" />
            <span>{stats.available} Available</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded bg-red-500" />
            <span>{stats.occupied} Occupied</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded bg-yellow-500" />
            <span>{stats.reserved} Reserved</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded bg-slate-500" />
            <span>{stats.maintenance} Maint.</span>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-10 gap-1">
          {filteredSpots.map((spot) => (
            <div
              key={spot.id}
              className={cn(
                "aspect-square rounded cursor-pointer transition-all flex items-center justify-center text-white",
                getStatusColor(spot.status)
              )}
              title={`${spot.spot_number} - ${spot.status} - ${spot.zone}`}
            >
              {getZoneIcon(spot.zone)}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}