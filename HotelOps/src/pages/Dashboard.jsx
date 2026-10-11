import React, { useState, useEffect } from 'react';
import { db } from '../components/dataClient';
import { useQuery } from '@tanstack/react-query';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import { Building2, Car, Users, ArrowUpDown, DollarSign, AlertTriangle } from 'lucide-react';
import StatsCard from '../components/dashboard/StatsCard';
import AlertPanel from '../components/dashboard/AlertPanel';
import ElevatorCard from '../components/elevator/ElevatorCard';
import ElevatorDispatch from '../components/elevator/ElevatorDispatch';
import ParkingHeatmap from '../components/parking/ParkingHeatmap';
import GuestList from '../components/guest/GuestList';

export default function Dashboard() {
  const [selectedTab, setSelectedTab] = useState('overview');

  const { data: guests = [] } = useQuery({
    queryKey: ['guests'],
    queryFn: () => db.entities.Guest.list()
  });

  const { data: rooms = [] } = useQuery({
    queryKey: ['rooms'],
    queryFn: () => db.entities.Room.list()
  });

  const { data: elevators = [] } = useQuery({
    queryKey: ['elevators'],
    queryFn: () => db.entities.Elevator.list()
  });

  const { data: elevatorRequests = [] } = useQuery({
    queryKey: ['elevator-requests'],
    queryFn: () => db.entities.ElevatorRequest.list()
  });

  const { data: parkingSpots = [] } = useQuery({
    queryKey: ['parking-spots'],
    queryFn: () => db.entities.ParkingSpot.list()
  });

  const { data: vehicles = [] } = useQuery({
    queryKey: ['vehicles'],
    queryFn: () => db.entities.Vehicle.list()
  });

  // Calculate stats
  const stats = {
    activeGuests: guests.filter(g => g.status === 'checked_in').length,
    occupiedRooms: rooms.filter(r => r.status === 'occupied').length,
    totalRooms: rooms.length,
    occupiedParking: parkingSpots.filter(p => p.status === 'occupied').length,
    totalParking: parkingSpots.length,
    elevatorOperational: elevators.filter(e => e.status !== 'maintenance' && e.status !== 'emergency').length,
    totalElevators: elevators.length
  };

  // System alerts
  const alerts = [
    ...elevators.filter(e => e.status === 'maintenance').map(e => ({
      severity: 'warning',
      title: `${e.elevator_name} Under Maintenance`,
      message: 'Scheduled maintenance in progress',
      timestamp: new Date().toLocaleTimeString()
    })),
    ...elevators.filter(e => e.emergency_mode).map(e => ({
      severity: 'critical',
      title: `${e.elevator_name} Emergency Mode`,
      message: 'Emergency override activated',
      timestamp: new Date().toLocaleTimeString()
    })),
    ...(stats.occupiedParking / stats.totalParking > 0.9 ? [{
      severity: 'warning',
      title: 'Parking Near Capacity',
      message: `${stats.occupiedParking}/${stats.totalParking} spots occupied`,
      timestamp: new Date().toLocaleTimeString()
    }] : [])
  ];

  const handleAssignElevator = async (requestId, elevatorId) => {
    await db.entities.ElevatorRequest.update(requestId, {
      elevator_id: elevatorId,
      status: 'assigned'
    });
    await db.entities.Elevator.update(elevatorId, {
      status: 'moving_up'
    });
  };

  return (
    <div className="min-h-screen bg-slate-100">
      <div className="bg-slate-900 text-white p-6">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-3xl font-bold">HotelOps Command Center</h1>
          <p className="text-slate-300 mt-1">Enterprise Hotel Operations Platform</p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-6 space-y-6">
        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatsCard
            title="Active Guests"
            value={stats.activeGuests}
            subtitle={`${guests.length} total guests`}
            icon={Users}
            variant="info"
          />
          <StatsCard
            title="Room Occupancy"
            value={`${stats.occupiedRooms}/${stats.totalRooms}`}
            subtitle={`${((stats.occupiedRooms/stats.totalRooms)*100).toFixed(0)}% occupied`}
            icon={Building2}
            variant={stats.occupiedRooms/stats.totalRooms > 0.8 ? "warning" : "success"}
          />
          <StatsCard
            title="Parking Occupancy"
            value={`${stats.occupiedParking}/${stats.totalParking}`}
            subtitle={`${((stats.occupiedParking/stats.totalParking)*100).toFixed(0)}% occupied`}
            icon={Car}
            variant={stats.occupiedParking/stats.totalParking > 0.9 ? "danger" : "default"}
          />
          <StatsCard
            title="Elevators Online"
            value={`${stats.elevatorOperational}/${stats.totalElevators}`}
            subtitle={`${elevatorRequests.filter(r => r.status === 'pending').length} pending requests`}
            icon={ArrowUpDown}
            variant={stats.elevatorOperational === stats.totalElevators ? "success" : "warning"}
          />
        </div>

        {/* Alert Panel */}
        <AlertPanel alerts={alerts} />

        {/* Main Content Tabs */}
        <Tabs value={selectedTab} onValueChange={setSelectedTab}>
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="elevators">Elevator Dispatch</TabsTrigger>
            <TabsTrigger value="parking">Parking Control</TabsTrigger>
            <TabsTrigger value="guests">Guest Management</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <div className="space-y-4">
                <h2 className="text-lg font-semibold">Elevator Status</h2>
                <div className="grid grid-cols-2 gap-4">
                  {elevators.slice(0, 4).map((elevator) => (
                    <ElevatorCard key={elevator.id} elevator={elevator} onClick={() => setSelectedTab('elevators')} />
                  ))}
                </div>
              </div>
              <div>
                <h2 className="text-lg font-semibold mb-4">Parking Overview</h2>
                <ParkingHeatmap spots={parkingSpots} level="ALL" />
              </div>
            </div>
          </TabsContent>

          <TabsContent value="elevators" className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              <div className="lg:col-span-2">
                <ElevatorDispatch 
                  requests={elevatorRequests} 
                  elevators={elevators}
                  onAssignElevator={handleAssignElevator}
                />
              </div>
              <div className="space-y-4">
                {elevators.map((elevator) => (
                  <ElevatorCard key={elevator.id} elevator={elevator} />
                ))}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="parking" className="space-y-4">
            <ParkingHeatmap spots={parkingSpots} level="ALL" />
          </TabsContent>

          <TabsContent value="guests" className="space-y-4">
            <GuestList guests={guests.filter(g => g.status === 'checked_in')} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}