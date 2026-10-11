import React from 'react';
import { Card } from "../../components/ui/card";
import { Badge } from "../../components/ui/badge";
import { ArrowUp, ArrowDown, Circle, AlertTriangle, Wrench } from 'lucide-react';
import { cn } from "../../lib/utils";

export default function ElevatorCard({ elevator, onClick }) {
  const getStatusIcon = () => {
    switch (elevator.status) {
      case 'moving_up': return <ArrowUp className="w-4 h-4" />;
      case 'moving_down': return <ArrowDown className="w-4 h-4" />;
      case 'maintenance': return <Wrench className="w-4 h-4" />;
      case 'emergency': return <AlertTriangle className="w-4 h-4" />;
      default: return <Circle className="w-4 h-4" />;
    }
  };

  const getStatusColor = () => {
    switch (elevator.status) {
      case 'idle': return 'bg-green-500';
      case 'moving_up': return 'bg-blue-500';
      case 'moving_down': return 'bg-blue-500';
      case 'maintenance': return 'bg-yellow-500';
      case 'emergency': return 'bg-red-500';
      default: return 'bg-slate-500';
    }
  };

  const getStatusLabel = () => {
    return elevator.status.replace(/_/g, ' ').toUpperCase();
  };

  return (
    <Card 
      className={cn(
        "p-4 cursor-pointer transition-all hover:shadow-lg border-2",
        elevator.emergency_mode ? "border-red-500" : "border-slate-200"
      )}
      onClick={onClick}
    >
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold text-lg">{elevator.elevator_name}</h3>
        <div className={cn("w-3 h-3 rounded-full", getStatusColor())} />
      </div>
      
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-sm text-slate-600">Floor</span>
          <span className="text-2xl font-bold">{elevator.current_floor || 0}</span>
        </div>
        
        <div className="flex items-center gap-2">
          {getStatusIcon()}
          <span className="text-xs font-medium">{getStatusLabel()}</span>
        </div>
        
        <div className="flex items-center justify-between text-xs">
          <span className="text-slate-600">Load</span>
          <span className="font-medium">{elevator.current_load || 0}/{elevator.capacity || 10}</span>
        </div>

        {elevator.emergency_mode && (
          <Badge variant="destructive" className="w-full justify-center">
            EMERGENCY MODE
          </Badge>
        )}
      </div>
    </Card>
  );
}