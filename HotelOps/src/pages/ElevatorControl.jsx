import React, { useState } from 'react';
import { db } from '../components/dataClient';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from "../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import { ArrowLeft, Plus } from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../utils';
import { toast } from 'sonner';
import ElevatorCard from '../components/elevator/ElevatorCard';
import ElevatorDispatch from '../components/elevator/ElevatorDispatch';
import ElevatorSimulator from '../components/elevator/ElevatorSimulator';

export default function ElevatorControl() {
  const queryClient = useQueryClient();
  const [showRequestForm, setShowRequestForm] = useState(false);
  const [requestData, setRequestData] = useState({
    fromFloor: 0,
    toFloor: 1,
    requestType: 'guest',
    priorityLevel: 5
  });

  const { data: elevators = [] } = useQuery({
    queryKey: ['elevators'],
    queryFn: () => db.entities.Elevator.list()
  });

  const { data: elevatorRequests = [] } = useQuery({
    queryKey: ['elevator-requests'],
    queryFn: () => db.entities.ElevatorRequest.list()
  });

  const { data: floors = [] } = useQuery({
    queryKey: ['floors'],
    queryFn: () => db.entities.Floor.list()
  });

  const createRequestMutation = useMutation({
    mutationFn: async (data) => {
      return await db.entities.ElevatorRequest.create({
        from_floor: parseInt(data.fromFloor),
        to_floor: parseInt(data.toFloor),
        request_type: data.requestType,
        priority_level: parseInt(data.priorityLevel),
        status: 'pending',
        request_time: new Date().toISOString()
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['elevator-requests']);
      setShowRequestForm(false);
      toast.success('Elevator request created');
    }
  });

  const handleAssignElevator = async (requestId, elevatorId) => {
    try {
      const request = elevatorRequests.find(r => r.id === requestId);
      await db.entities.ElevatorRequest.update(requestId, {
        elevator_id: elevatorId,
        status: 'assigned'
      });
      await db.entities.Elevator.update(elevatorId, {
        status: request.to_floor > request.from_floor ? 'moving_up' : 'moving_down',
        current_floor: request.from_floor
      });
      queryClient.invalidateQueries(['elevators']);
      queryClient.invalidateQueries(['elevator-requests']);
      toast.success('Elevator assigned successfully');
    } catch (error) {
      toast.error('Failed to assign elevator');
    }
  };

  const handleToggleEmergency = async (elevatorId, currentMode) => {
    try {
      await db.entities.Elevator.update(elevatorId, {
        emergency_mode: !currentMode,
        status: !currentMode ? 'emergency' : 'idle'
      });
      queryClient.invalidateQueries(['elevators']);
      toast.success(`Emergency mode ${!currentMode ? 'activated' : 'deactivated'}`);
    } catch (error) {
      toast.error('Failed to toggle emergency mode');
    }
  };

  return (
    <div className="min-h-screen bg-slate-100">
      <div className="bg-slate-900 text-white p-6">
        <div className="max-w-7xl mx-auto">
          <Link to={createPageUrl('Dashboard')}>
            <Button variant="ghost" className="text-white mb-4">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Dashboard
            </Button>
          </Link>
          <h1 className="text-3xl font-bold">Elevator Dispatch Control</h1>
          <p className="text-slate-300 mt-1">Real-time elevator monitoring and smart dispatch</p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-6 space-y-6">
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-semibold">Active Elevators</h2>
          <Button onClick={() => setShowRequestForm(!showRequestForm)}>
            <Plus className="w-4 h-4 mr-2" />
            New Request
          </Button>
        </div>

        {showRequestForm && (
          <Card>
            <CardHeader>
              <CardTitle>Create Elevator Request</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>From Floor</Label>
                  <Input
                    type="number"
                    value={requestData.fromFloor}
                    onChange={(e) => setRequestData({...requestData, fromFloor: e.target.value})}
                  />
                </div>
                <div>
                  <Label>To Floor</Label>
                  <Input
                    type="number"
                    value={requestData.toFloor}
                    onChange={(e) => setRequestData({...requestData, toFloor: e.target.value})}
                  />
                </div>
                <div>
                  <Label>Request Type</Label>
                  <Select value={requestData.requestType} onValueChange={(v) => setRequestData({...requestData, requestType: v})}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="guest">Guest</SelectItem>
                      <SelectItem value="service">Service</SelectItem>
                      <SelectItem value="emergency">Emergency</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Priority (1-10)</Label>
                  <Input
                    type="number"
                    min="1"
                    max="10"
                    value={requestData.priorityLevel}
                    onChange={(e) => setRequestData({...requestData, priorityLevel: e.target.value})}
                  />
                </div>
              </div>
              <div className="flex gap-2 mt-4">
                <Button onClick={() => createRequestMutation.mutate(requestData)}>
                  Create Request
                </Button>
                <Button variant="outline" onClick={() => setShowRequestForm(false)}>
                  Cancel
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {elevators.map((elevator) => (
                <ElevatorCard key={elevator.id} elevator={elevator} />
              ))}
            </div>

            <ElevatorDispatch
              requests={elevatorRequests}
              elevators={elevators}
              onAssignElevator={handleAssignElevator}
            />
          </div>

          <div className="space-y-4">
            <h2 className="text-lg font-semibold">Elevator Simulation</h2>
            {elevators.map((elevator) => (
              <ElevatorSimulator key={elevator.id} elevator={elevator} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}