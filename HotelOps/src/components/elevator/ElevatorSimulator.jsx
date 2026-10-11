import React from 'react';
import { base44 } from '../../api/base44Client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { ArrowUp, ArrowDown, Pause, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';

export default function ElevatorSimulator({ elevator }) {
  const queryClient = useQueryClient();

  const moveElevator = useMutation({
    mutationFn: async (direction) => {
      const newFloor = direction === 'up' ? elevator.current_floor + 1 : elevator.current_floor - 1;
      const newStatus = direction === 'up' ? 'moving_up' : 'moving_down';
      
      await base44.entities.Elevator.update(elevator.id, {
        current_floor: newFloor,
        status: newStatus
      });

      // Auto-idle after moving
      setTimeout(async () => {
        await base44.entities.Elevator.update(elevator.id, { status: 'idle' });
        queryClient.invalidateQueries({ queryKey: ['elevators'] });
      }, 1000);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['elevators'] });
      toast.success('Elevator moved');
    }
  });

  const toggleEmergency = useMutation({
    mutationFn: async () => {
      await base44.entities.Elevator.update(elevator.id, {
        emergency_mode: !elevator.emergency_mode,
        status: !elevator.emergency_mode ? 'emergency' : 'idle'
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['elevators'] });
      toast.success(elevator.emergency_mode ? 'Emergency mode disabled' : 'Emergency mode enabled');
    }
  });

  const setIdle = useMutation({
    mutationFn: async () => {
      await base44.entities.Elevator.update(elevator.id, { status: 'idle' });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['elevators'] });
    }
  });

  return (
    <Card className="border-2">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm">{elevator.elevator_name}</CardTitle>
          {elevator.emergency_mode && (
            <Badge variant="destructive">EMERGENCY</Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="text-center p-4 bg-slate-100 rounded-lg">
          <div className="text-3xl font-bold">Floor {elevator.current_floor}</div>
          <div className="text-xs text-slate-600 mt-1">{elevator.status}</div>
        </div>

        <div className="grid grid-cols-3 gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => moveElevator.mutate('up')}
            disabled={moveElevator.isPending}
          >
            <ArrowUp className="w-3 h-3" />
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => setIdle.mutate()}
          >
            <Pause className="w-3 h-3" />
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => moveElevator.mutate('down')}
            disabled={moveElevator.isPending}
          >
            <ArrowDown className="w-3 h-3" />
          </Button>
        </div>

        <Button
          size="sm"
          variant={elevator.emergency_mode ? "default" : "destructive"}
          className="w-full"
          onClick={() => toggleEmergency.mutate()}
        >
          <AlertTriangle className="w-3 h-3 mr-2" />
          {elevator.emergency_mode ? 'Clear Emergency' : 'Emergency Mode'}
        </Button>
      </CardContent>
    </Card>
  );
}