import React, { useState } from 'react';
import { db } from '../dataClient';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Badge } from '../../components/ui/badge';
import { ArrowUpDown, Check, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

export default function ElevatorCall() {
  const queryClient = useQueryClient();
  const [accessCode, setAccessCode] = useState('');
  const [fromFloor, setFromFloor] = useState(0);
  const [toFloor, setToFloor] = useState(1);
  const [requestStatus, setRequestStatus] = useState(null);

  const { data: floors = [] } = useQuery({
    queryKey: ['floors'],
    queryFn: () => db.entities.Floor.list()
  });

  const { data: elevators = [] } = useQuery({
    queryKey: ['elevators'],
    queryFn: () => db.entities.Elevator.list()
  });

  const callElevatorMutation = useMutation({
    mutationFn: async () => {
      // Verify access code
      const accessPasses = await db.entities.AccessPass.filter({ 
        pass_code: accessCode,
        status: 'active'
      });

      if (accessPasses.length === 0) {
        throw new Error('Invalid access code');
      }

      const pass = accessPasses[0];

      // Find closest available elevator
      const availableElevators = elevators.filter(e => 
        e.status === 'idle' || e.status === 'moving_up' || e.status === 'moving_down'
      );

      if (availableElevators.length === 0) {
        throw new Error('No elevators available');
      }

      const closestElevator = availableElevators.reduce((prev, curr) => {
        const prevDist = Math.abs(prev.current_floor - fromFloor);
        const currDist = Math.abs(curr.current_floor - fromFloor);
        return currDist < prevDist ? curr : prev;
      });

      // Create elevator request
      const request = await db.entities.ElevatorRequest.create({
        guest_id: pass.guest_id,
        access_pass_id: pass.id,
        elevator_id: closestElevator.id,
        from_floor: fromFloor,
        to_floor: toFloor,
        request_type: 'guest',
        priority_level: pass.vip_priority ? 8 : 5,
        status: 'assigned',
        request_time: new Date().toISOString()
      });

      // Simulate elevator moving
      await db.entities.Elevator.update(closestElevator.id, {
        status: fromFloor < toFloor ? 'moving_up' : 'moving_down'
      });

      // Simulate arrival after 3 seconds
      setTimeout(async () => {
        await db.entities.Elevator.update(closestElevator.id, {
          current_floor: toFloor,
          status: 'idle'
        });
        await db.entities.ElevatorRequest.update(request.id, {
          status: 'completed',
          completion_time: new Date().toISOString()
        });
        queryClient.invalidateQueries({ queryKey: ['elevators'] });
      }, 3000);

      return { elevator: closestElevator, request };
    },
    onSuccess: (data) => {
      setRequestStatus({
        elevator: data.elevator.elevator_name,
        eta: '~30 seconds'
      });
      toast.success(`${data.elevator.elevator_name} is on its way!`);
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to call elevator');
    }
  });

  const handleCallElevator = (e) => {
    e.preventDefault();
    callElevatorMutation.mutate();
  };

  if (requestStatus) {
    return (
      <Card className="max-w-2xl mx-auto">
        <CardHeader className="text-center">
          <div className="mx-auto w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
            <Check className="w-8 h-8 text-blue-600" />
          </div>
          <CardTitle className="text-2xl text-blue-600">Elevator Called!</CardTitle>
          <CardDescription>Your elevator is on its way</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 text-center">
            <p className="text-sm text-slate-600 mb-2">Assigned Elevator</p>
            <p className="text-3xl font-bold text-blue-600">{requestStatus.elevator}</p>
            <p className="text-sm text-slate-500 mt-2">ETA: {requestStatus.eta}</p>
          </div>
          
          <div className="space-y-2 text-sm text-center">
            <p className="text-slate-600">Going from Floor {fromFloor} to Floor {toFloor}</p>
          </div>

          <Button 
            className="w-full" 
            onClick={() => setRequestStatus(null)}
          >
            Call Another Elevator
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ArrowUpDown className="w-6 h-6" />
          Call Elevator
        </CardTitle>
        <CardDescription>Enter your access code and destination</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleCallElevator} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="access_code">Access Code</Label>
            <Input
              id="access_code"
              value={accessCode}
              onChange={(e) => setAccessCode(e.target.value.toUpperCase())}
              placeholder="Enter 6-digit code"
              maxLength={6}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="from_floor">Current Floor</Label>
              <Input
                id="from_floor"
                type="number"
                value={fromFloor}
                onChange={(e) => setFromFloor(parseInt(e.target.value))}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="to_floor">Destination Floor</Label>
              <Input
                id="to_floor"
                type="number"
                value={toFloor}
                onChange={(e) => setToFloor(parseInt(e.target.value))}
                required
              />
            </div>
          </div>

          <div className="bg-slate-50 rounded-lg p-4">
            <p className="text-sm text-slate-600 mb-2">Available Elevators</p>
            <div className="flex flex-wrap gap-2">
              {elevators.map((elevator) => (
                <Badge 
                  key={elevator.id}
                  variant={elevator.status === 'idle' ? 'default' : 'secondary'}
                >
                  {elevator.elevator_name}: Floor {elevator.current_floor}
                </Badge>
              ))}
            </div>
          </div>

          <Button 
            type="submit" 
            className="w-full bg-blue-600 hover:bg-blue-700"
            disabled={callElevatorMutation.isPending}
          >
            {callElevatorMutation.isPending ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Calling Elevator...
              </>
            ) : (
              'Call Elevator'
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}