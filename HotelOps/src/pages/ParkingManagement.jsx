import React, { useState } from 'react';
import { db } from '../components/dataClient';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from "../components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "../components/ui/dialog";
import { ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../utils';
import { toast } from 'sonner';
import ParkingHeatmap from '../components/parking/ParkingHeatmap';
import ParkingSpotList from '../components/parking/ParkingSpotList';

export default function ParkingManagement() {
  const queryClient = useQueryClient();
  const [selectedLevel, setSelectedLevel] = useState('ALL');
  const [reserveDialogOpen, setReserveDialogOpen] = useState(false);
  const [selectedSpot, setSelectedSpot] = useState(null);
  const [roomNumber, setRoomNumber] = useState('');

  const { data: parkingSpots = [] } = useQuery({
    queryKey: ['parking-spots'],
    queryFn: () => db.entities.ParkingSpot.list()
  });

  const { data: vehicles = [] } = useQuery({
    queryKey: ['vehicles'],
    queryFn: () => db.entities.Vehicle.list()
  });

  const { data: rooms = [] } = useQuery({
    queryKey: ['rooms'],
    queryFn: () => db.entities.Room.list()
  });

  const levels = [...new Set(parkingSpots.map(s => s.level))].sort();

  const handleMarkMaintenance = async (spotId) => {
    try {
      await db.entities.ParkingSpot.update(spotId, {
        status: 'maintenance'
      });
      queryClient.invalidateQueries(['parking-spots']);
      toast.success('Parking spot marked for maintenance');
    } catch (error) {
      toast.error('Failed to update parking spot');
    }
  };

  const handleMarkAvailable = async (spotId) => {
    try {
      await db.entities.ParkingSpot.update(spotId, {
        status: 'available',
        reserved_for_room: ''
      });
      queryClient.invalidateQueries(['parking-spots']);
      toast.success('Parking spot marked as available');
    } catch (error) {
      toast.error('Failed to update parking spot');
    }
  };

  const reserveSpotMutation = useMutation({
    mutationFn: async () => {
      const room = rooms.find(r => r.room_number === roomNumber);
      if (!room) {
        throw new Error('Room not found');
      }
      
      await db.entities.ParkingSpot.update(selectedSpot.id, {
        status: 'reserved',
        reserved_for_room: roomNumber
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['parking-spots']);
      toast.success(`Parking spot reserved for room ${roomNumber}`);
      setReserveDialogOpen(false);
      setRoomNumber('');
      setSelectedSpot(null);
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to reserve parking spot');
    }
  });

  const handleReserveSpot = (spot) => {
    setSelectedSpot(spot);
    setReserveDialogOpen(true);
  };

  const filteredSpots = selectedLevel === 'ALL' 
    ? parkingSpots 
    : parkingSpots.filter(s => s.level === selectedLevel);

  const occupancyStats = {
    total: parkingSpots.length,
    occupied: parkingSpots.filter(s => s.status === 'occupied').length,
    available: parkingSpots.filter(s => s.status === 'available').length,
    reserved: parkingSpots.filter(s => s.status === 'reserved').length,
    maintenance: parkingSpots.filter(s => s.status === 'maintenance').length
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
          <h1 className="text-3xl font-bold">Parking Management</h1>
          <p className="text-slate-300 mt-1">Real-time parking occupancy and predictive allocation</p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-6 space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-4 gap-4">
          <div className="bg-white rounded-lg p-4 border-2 border-green-500">
            <p className="text-sm text-slate-600">Available</p>
            <p className="text-3xl font-bold text-green-600">{occupancyStats.available}</p>
          </div>
          <div className="bg-white rounded-lg p-4 border-2 border-red-500">
            <p className="text-sm text-slate-600">Occupied</p>
            <p className="text-3xl font-bold text-red-600">{occupancyStats.occupied}</p>
          </div>
          <div className="bg-white rounded-lg p-4 border-2 border-yellow-500">
            <p className="text-sm text-slate-600">Reserved</p>
            <p className="text-3xl font-bold text-yellow-600">{occupancyStats.reserved}</p>
          </div>
          <div className="bg-white rounded-lg p-4 border-2 border-slate-500">
            <p className="text-sm text-slate-600">Maintenance</p>
            <p className="text-3xl font-bold text-slate-600">{occupancyStats.maintenance}</p>
          </div>
        </div>

        {/* Level Selector */}
        <Tabs value={selectedLevel} onValueChange={setSelectedLevel}>
          <TabsList>
            <TabsTrigger value="ALL">All Levels</TabsTrigger>
            {levels.map(level => (
              <TabsTrigger key={level} value={level}>{level}</TabsTrigger>
            ))}
          </TabsList>

          <TabsContent value={selectedLevel} className="space-y-4">
            <ParkingHeatmap spots={filteredSpots} level={selectedLevel} />
            <ParkingSpotList
              spots={filteredSpots}
              onMarkMaintenance={handleMarkMaintenance}
              onMarkAvailable={handleMarkAvailable}
              onReserveSpot={handleReserveSpot}
            />
          </TabsContent>
        </Tabs>
      </div>

      <Dialog open={reserveDialogOpen} onOpenChange={setReserveDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reserve Parking Spot {selectedSpot?.spot_number}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <div className="space-y-2">
              <Label>Room Number</Label>
              <Input
                placeholder="Enter room number..."
                value={roomNumber}
                onChange={(e) => setRoomNumber(e.target.value)}
              />
            </div>
            <div className="flex gap-2">
              <Button 
                onClick={() => reserveSpotMutation.mutate()}
                disabled={!roomNumber || reserveSpotMutation.isPending}
                className="flex-1"
              >
                {reserveSpotMutation.isPending ? 'Reserving...' : 'Reserve Spot'}
              </Button>
              <Button 
                variant="outline" 
                onClick={() => {
                  setReserveDialogOpen(false);
                  setRoomNumber('');
                }}
                className="flex-1"
              >
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}