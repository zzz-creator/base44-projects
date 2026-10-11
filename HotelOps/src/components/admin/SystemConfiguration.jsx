import React, { useState } from 'react';
import { db } from '../dataClient';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/tabs';
import { Building2, ArrowUpDown, Settings, Users, Shield, LogIn, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { startImpersonation } from '../ImpersonationBanner';

const API_BASE = 'http://localhost:3001';

export default function SystemConfiguration() {
  const queryClient = useQueryClient();
  const [floorGenConfig, setFloorGenConfig] = useState({ 
    total_floors: 10, 
    parking_floors: 2 
  });
  const [elevatorConfig, setElevatorConfig] = useState({ elevator_name: '', capacity: 10 });
  const [roomGenConfig, setRoomGenConfig] = useState({ 
    start_floor: 1, 
    end_floor: 10, 
    room_type: 'standard', 
    rate_per_night: 150 
  });
  const [parkingConfig, setParkingConfig] = useState({
    level: 'P1',
    spots_per_level: 100
  });

  const { data: floors = [] } = useQuery({
    queryKey: ['floors'],
    queryFn: () => db.entities.Floor.list('floor_number')
  });

  const { data: elevators = [] } = useQuery({
    queryKey: ['elevators'],
    queryFn: () => db.entities.Elevator.list()
  });

  const { data: rooms = [] } = useQuery({
    queryKey: ['rooms'],
    queryFn: () => db.entities.Room.list()
  });

  const { data: parkingSpots = [] } = useQuery({
    queryKey: ['parking-spots'],
    queryFn: () => db.entities.ParkingSpot.list()
  });

  const generateFloorsMutation = useMutation({
    mutationFn: async (config) => {
      const floorsToCreate = [];
      
      // Create parking floors (negative numbers)
      for (let i = 1; i <= config.parking_floors; i++) {
        const floorNum = -i;
        const exists = floors.some(f => f.floor_number === floorNum);
        if (!exists) {
          floorsToCreate.push({
            floor_number: floorNum,
            floor_name: `Parking Level ${i} (P${i})`,
            floor_type: 'parking',
            access_level: 'guest_only'
          });
        }
      }

      // Create ground floor
      if (!floors.some(f => f.floor_number === 0)) {
        floorsToCreate.push({
          floor_number: 0,
          floor_name: 'Ground Floor (Lobby)',
          floor_type: 'lobby',
          access_level: 'public'
        });
      }

      // Create guest floors
      for (let i = 1; i <= config.total_floors; i++) {
        const exists = floors.some(f => f.floor_number === i);
        if (!exists) {
          floorsToCreate.push({
            floor_number: i,
            floor_name: `Floor ${i}`,
            floor_type: 'guest_rooms',
            total_rooms: 100,
            access_level: 'guest_only'
          });
        }
      }

      if (floorsToCreate.length === 0) {
        throw new Error('All floors already exist');
      }

      await db.entities.Floor.bulkCreate(floorsToCreate);
      return floorsToCreate.length;
    },
    onSuccess: (count) => {
      queryClient.invalidateQueries({ queryKey: ['floors'] });
      toast.success(`${count} floors created!`);
    },
    onError: (error) => {
      toast.error(error.message);
    }
  });

  const createElevatorMutation = useMutation({
    mutationFn: (data) => db.entities.Elevator.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['elevators'] });
      setElevatorConfig({ elevator_name: '', capacity: 10 });
      toast.success('Elevator created!');
    }
  });

  const generateRoomsMutation = useMutation({
    mutationFn: async (config) => {
      const roomsToCreate = [];
      
      for (let floorNum = config.start_floor; floorNum <= config.end_floor; floorNum++) {
        const floor = floors.find(f => f.floor_number === floorNum);
        if (!floor || floor.floor_type !== 'guest_rooms') continue;

        for (let roomNum = 0; roomNum <= 99; roomNum++) {
          const roomNumber = `${floorNum}${roomNum.toString().padStart(2, '0')}`;
          
          const exists = rooms.some(r => r.room_number === roomNumber);
          if (!exists) {
            roomsToCreate.push({
              room_number: roomNumber,
              floor_id: floor.id,
              room_type: config.room_type,
              status: 'available',
              rate_per_night: config.rate_per_night,
              max_occupancy: config.room_type === 'penthouse' ? 6 : 
                             config.room_type === 'suite' ? 4 : 
                             config.room_type === 'deluxe' ? 3 : 2,
              amenities: []
            });
          }
        }
      }

      if (roomsToCreate.length === 0) {
        throw new Error('No new rooms to create. They may already exist.');
      }

      const batchSize = 50;
      for (let i = 0; i < roomsToCreate.length; i += batchSize) {
        const batch = roomsToCreate.slice(i, i + batchSize);
        await db.entities.Room.bulkCreate(batch);
      }

      return roomsToCreate.length;
    },
    onSuccess: (count) => {
      queryClient.invalidateQueries({ queryKey: ['rooms'] });
      toast.success(`${count} rooms generated!`);
    },
    onError: (error) => {
      toast.error(error.message);
    }
  });

  const generateParkingMutation = usMutation({
    mutationFn: async (config) => {
      const parkingFloor = floors.find(f => f.floor_name.includes(config.level));
      if (!parkingFloor) {
        throw new Error(`Parking floor ${config.level} not found. Please create floors first.`);
      }

      const existingSpots = await db.entities.ParkingSpot.filter({ level: config.level });
      const spotsToCreate = [];

      for (let i = 1; i <= config.spots_per_level; i++) {
        const spotNumber = `${config.level}-${i.toString().padStart(3, '0')}`;
        const exists = existingSpots.some(s => s.spot_number === spotNumber);
        
        if (!exists) {
          spotsToCreate.push({
            spot_number: spotNumber,
            level: config.level,
            zone: i <= config.spots_per_level * 0.1 ? 'vip' : 
                  i <= config.spots_per_level * 0.15 ? 'electric' :
                  i <= config.spots_per_level * 0.2 ? 'handicap' : 'standard',
            status: 'available',
            rate_per_hour: 5,
            has_charging: i <= config.spots_per_level * 0.15
          });
        }
      }

      if (spotsToCreate.length === 0) {
        throw new Error('All parking spots already exist for this level');
      }

      const batchSize = 50;
      for (let i = 0; i < spotsToCreate.length; i += batchSize) {
        const batch = spotsToCreate.slice(i, i + batchSize);
        await db.entities.ParkingSpot.bulkCreate(batch);
      }

      return spotsToCreate.length;
    },
    onSuccess: (count) => {
      queryClient.invalidateQueries();
      toast.success(`${count} parking spots created!`);
    },
    onError: (error) => {
      toast.error(error.message);
    }
  });

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="w-6 h-6" />
            System Configuration
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="floors">
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="floors">Floors</TabsTrigger>
              <TabsTrigger value="elevators">Elevators</TabsTrigger>
              <TabsTrigger value="rooms">Rooms</TabsTrigger>
              <TabsTrigger value="parking">Parking</TabsTrigger>
              <TabsTrigger value="users" className="flex items-center gap-1"><Users className="w-3 h-3" />Users</TabsTrigger>
            </TabsList>

            <TabsContent value="floors" className="space-y-4">
              <Card className="border-2 border-blue-200">
                <CardContent className="p-4 space-y-3">
                  <h3 className="font-semibold">Generate Building Floors</h3>
                  <p className="text-sm text-slate-600">Automatically create all floors for your hotel</p>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label>Number of Guest Floors</Label>
                      <Input
                        type="number"
                        min="1"
                        value={floorGenConfig.total_floors}
                        onChange={(e) => setFloorGenConfig({ ...floorGenConfig, total_floors: parseInt(e.target.value) })}
                      />
                      <p className="text-xs text-slate-500 mt-1">Floor 1 to {floorGenConfig.total_floors}</p>
                    </div>
                    <div>
                      <Label>Number of Parking Levels</Label>
                      <Input
                        type="number"
                        min="0"
                        value={floorGenConfig.parking_floors}
                        onChange={(e) => setFloorGenConfig({ ...floorGenConfig, parking_floors: parseInt(e.target.value) })}
                      />
                      <p className="text-xs text-slate-500 mt-1">P1 to P{floorGenConfig.parking_floors}</p>
                    </div>
                  </div>
                  <Button 
                    onClick={() => generateFloorsMutation.mutate(floorGenConfig)} 
                    className="w-full"
                    disabled={generateFloorsMutation.isPending}
                  >
                    {generateFloorsMutation.isPending ? 'Generating...' : 'Generate Floors'}
                  </Button>
                </CardContent>
              </Card>

              <div className="space-y-2">
                <h3 className="font-semibold">Existing Floors ({floors.length})</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {floors.sort((a, b) => b.floor_number - a.floor_number).map(floor => (
                    <Card key={floor.id}>
                      <CardContent className="p-3 text-center">
                        <Building2 className="w-6 h-6 mx-auto mb-2 text-blue-600" />
                        <p className="font-bold">Floor {floor.floor_number}</p>
                        <p className="text-xs text-slate-600">{floor.floor_name}</p>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            </TabsContent>

            <TabsContent value="elevators" className="space-y-4">
              <Card className="border-2 border-blue-200">
                <CardContent className="p-4 space-y-3">
                  <h3 className="font-semibold">Add New Elevator</h3>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label>Elevator Name</Label>
                      <Input
                        placeholder="e.g., Elevator A"
                        value={elevatorConfig.elevator_name}
                        onChange={(e) => setElevatorConfig({ ...elevatorConfig, elevator_name: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label>Capacity</Label>
                      <Input
                        type="number"
                        value={elevatorConfig.capacity}
                        onChange={(e) => setElevatorConfig({ ...elevatorConfig, capacity: parseInt(e.target.value) })}
                      />
                    </div>
                  </div>
                  <Button onClick={() => createElevatorMutation.mutate({ ...elevatorConfig, status: 'idle', current_floor: 1 })} className="w-full">
                    Create Elevator
                  </Button>
                </CardContent>
              </Card>

              <div className="space-y-2">
                <h3 className="font-semibold">Existing Elevators ({elevators.length})</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {elevators.map(elevator => (
                    <Card key={elevator.id}>
                      <CardContent className="p-3 text-center">
                        <ArrowUpDown className="w-6 h-6 mx-auto mb-2 text-green-600" />
                        <p className="font-bold">{elevator.elevator_name}</p>
                        <p className="text-xs text-slate-600">Cap: {elevator.capacity}</p>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            </TabsContent>

            <TabsContent value="rooms" className="space-y-4">
              <Card className="border-2 border-blue-200">
                <CardContent className="p-4 space-y-3">
                  <h3 className="font-semibold">Generate Rooms</h3>
                  <p className="text-sm text-slate-600">Automatically generate rooms X00-X99 for each floor</p>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label>Start Floor</Label>
                      <Input
                        type="number"
                        value={roomGenConfig.start_floor}
                        onChange={(e) => setRoomGenConfig({ ...roomGenConfig, start_floor: parseInt(e.target.value) })}
                      />
                    </div>
                    <div>
                      <Label>End Floor</Label>
                      <Input
                        type="number"
                        value={roomGenConfig.end_floor}
                        onChange={(e) => setRoomGenConfig({ ...roomGenConfig, end_floor: parseInt(e.target.value) })}
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label>Room Type</Label>
                      <Select value={roomGenConfig.room_type} onValueChange={(v) => setRoomGenConfig({ ...roomGenConfig, room_type: v })}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="standard">Standard</SelectItem>
                          <SelectItem value="deluxe">Deluxe</SelectItem>
                          <SelectItem value="suite">Suite</SelectItem>
                          <SelectItem value="penthouse">Penthouse</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>Rate per Night ($)</Label>
                      <Input
                        type="number"
                        value={roomGenConfig.rate_per_night}
                        onChange={(e) => setRoomGenConfig({ ...roomGenConfig, rate_per_night: parseFloat(e.target.value) })}
                      />
                    </div>
                  </div>
                  <Button 
                    onClick={() => generateRoomsMutation.mutate(roomGenConfig)} 
                    className="w-full"
                    disabled={generateRoomsMutation.isPending}
                  >
                    {generateRoomsMutation.isPending ? 'Generating...' : 'Generate Rooms'}
                  </Button>
                </CardContent>
              </Card>

              <div>
                <h3 className="font-semibold mb-2">Total Rooms: {rooms.length}</h3>
                <div className="grid grid-cols-4 gap-2 text-sm">
                  <Card>
                    <CardContent className="p-3 text-center">
                      <p className="text-2xl font-bold text-blue-600">
                        {rooms.filter(r => r.room_type === 'standard').length}
                      </p>
                      <p className="text-xs">Standard</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-3 text-center">
                      <p className="text-2xl font-bold text-green-600">
                        {rooms.filter(r => r.room_type === 'deluxe').length}
                      </p>
                      <p className="text-xs">Deluxe</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-3 text-center">
                      <p className="text-2xl font-bold text-purple-600">
                        {rooms.filter(r => r.room_type === 'suite').length}
                      </p>
                      <p className="text-xs">Suite</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-3 text-center">
                      <p className="text-2xl font-bold text-orange-600">
                        {rooms.filter(r => r.room_type === 'penthouse').length}
                      </p>
                      <p className="text-xs">Penthouse</p>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="parking" className="space-y-4">
              <Card className="border-2 border-blue-200">
                <CardContent className="p-4 space-y-3">
                  <h3 className="font-semibold">Generate Parking Spots</h3>
                  <p className="text-sm text-slate-600">Create parking spots for each parking level</p>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label>Parking Level</Label>
                      <select
                        value={parkingConfig.level}
                        onChange={(e) => setParkingConfig({ ...parkingConfig, level: e.target.value })}
                        className="w-full px-3 py-2 border rounded-md"
                      >
                        {floors.filter(f => f.floor_type === 'parking').map(f => {
                          const level = f.floor_name.match(/P\d+/)?.[0] || `P${Math.abs(f.floor_number)}`;
                          return <option key={f.id} value={level}>{f.floor_name}</option>;
                        })}
                      </select>
                    </div>
                    <div>
                      <Label>Spots per Level</Label>
                      <Input
                        type="number"
                        min="10"
                        value={parkingConfig.spots_per_level}
                        onChange={(e) => setParkingConfig({ ...parkingConfig, spots_per_level: parseInt(e.target.value) })}
                      />
                    </div>
                  </div>
                  <Button 
                    onClick={() => generateParkingMutation.mutate(parkingConfig)} 
                    className="w-full"
                    disabled={generateParkingMutation.isPending || floors.filter(f => f.floor_type === 'parking').length === 0}
                  >
                    {generateParkingMutation.isPending ? 'Generating...' : 'Generate Parking Spots'}
                  </Button>
                  {floors.filter(f => f.floor_type === 'parking').length === 0 && (
                    <p className="text-xs text-orange-600">Please create parking floors first</p>
                  )}
                </CardContent>
              </Card>

              <div className="space-y-2">
                <h3 className="font-semibold">Parking Levels</h3>
                {floors.filter(f => f.floor_type === 'parking').map(floor => {
                  const level = floor.floor_name.match(/P\d+/)?.[0] || `P${Math.abs(floor.floor_number)}`;
                  const levelSpots = queryClient.getQueryData(['parking-spots'])?.filter(s => s.level === level) || [];
                  return (
                    <Card key={floor.id}>
                      <CardContent className="p-3">
                        <div className="flex justify-between items-center">
                          <div>
                            <p className="font-semibold">{floor.floor_name}</p>
                            <p className="text-sm text-slate-600">{levelSpots.length} spots configured</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </TabsContent>

            <TabsContent value="users" className="space-y-4">
              <UserManagementTab />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}

function UserManagementTab() {
  const [loadingId, setLoadingId] = useState(null);

  const { data: users = [], isLoading } = useQuery({
    queryKey: ['admin-users'],
    queryFn: async () => {
      const token = localStorage.getItem('auth_token') || localStorage.getItem('hotelops_token') || localStorage.getItem('token');
      const res = await fetch(`${API_BASE}/api/auth/users`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) throw new Error('Failed to load users');
      return res.json();
    }
  });

  const handleImpersonate = async (user) => {
    setLoadingId(user.id);
    try {
      const token = localStorage.getItem('auth_token') || localStorage.getItem('hotelops_token') || localStorage.getItem('token');
      const res = await fetch(`${API_BASE}/api/auth/impersonate/${user.id}`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) throw new Error('Impersonation failed');
      const data = await res.json();
      startImpersonation(data.token, data.user);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoadingId(null);
    }
  };

  return (
    <Card className="border-2 border-purple-200">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-purple-700">
          <Shield className="w-5 h-5" />
          User Management &amp; Impersonation
        </CardTitle>
        <p className="text-sm text-slate-500">Click "Login As" to impersonate a user. A banner will appear — click Exit to return to your admin session.</p>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin text-slate-400" /></div>
        ) : (
          <div className="divide-y">
            {users.map(user => (
              <div key={user.id} className="flex items-center justify-between py-3">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-purple-100 flex items-center justify-center">
                    <span className="text-sm font-bold text-purple-700">{(user.full_name || user.email || '?').charAt(0).toUpperCase()}</span>
                  </div>
                  <div>
                    <p className="font-medium text-slate-900">{user.full_name || 'No name'}</p>
                    <p className="text-xs text-slate-500">{user.email}</p>
                  </div>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                    user.role === 'admin' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'
                  }`}>{user.role}</span>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  className="border-purple-300 text-purple-700 hover:bg-purple-50"
                  onClick={() => handleImpersonate(user)}
                  disabled={loadingId === user.id}
                >
                  {loadingId === user.id ? <Loader2 className="w-3 h-3 animate-spin mr-1" /> : <LogIn className="w-3 h-3 mr-1" />}
                  Login As
                </Button>
              </div>
            ))}
            {users.length === 0 && <p className="text-center py-8 text-slate-400">No users found</p>}
          </div>
        )}
      </CardContent>
    </Card>
  );
}