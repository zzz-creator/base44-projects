import React, { useState } from 'react';
import { db } from '../components/dataClient';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from "../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Badge } from "../components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import { Building2, Plus, Trash2, Calendar } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';

const CONFERENCE_ROOMS = [
  { name: "Willow IV Room", capacity: 200, rate: 250 },
  { name: "Butternut/Holly Room", capacity: 150, rate: 200 },
  { name: "Violet/Orchid Room", capacity: 150, rate: 200 },
  { name: "Markham Ballroom A", capacity: 185, rate: 300 },
  { name: "Markham Ballroom B", capacity: 185, rate: 300 },
  { name: "Markham Ballroom C", capacity: 185, rate: 300 },
  { name: "Birch Room", capacity: 150, rate: 180 },
  { name: "Willow II Room", capacity: 80, rate: 120 },
  { name: "Willow III Room", capacity: 80, rate: 120 },
  { name: "Elm II Room", capacity: 90, rate: 130 },
  { name: "Elm I Room", capacity: 90, rate: 130 },
  { name: "Iris Boardroom", capacity: 18, rate: 80 },
  { name: "Trillium Boardroom", capacity: 20, rate: 80 },
  { name: "Evergreen Room", capacity: 70, rate: 110 },
  { name: "Primrose Room", capacity: 70, rate: 110 },
  { name: "Butternut Room", capacity: 70, rate: 100 },
  { name: "Holly Room", capacity: 70, rate: 100 },
  { name: "Orchid Room", capacity: 70, rate: 100 },
  { name: "Violet Room", capacity: 70, rate: 100 },
  { name: "Oak II Room", capacity: 60, rate: 90 },
  { name: "Jasmine Room", capacity: 60, rate: 90 },
  { name: "Willow I Room", capacity: 60, rate: 90 },
  { name: "Maple Room", capacity: 60, rate: 90 },
  { name: "Oak I Room", capacity: 10, rate: 60 },
  { name: "Mahogany Boardroom", capacity: 8, rate: 50 }
];

export default function ConferenceRoomAdmin() {
  const queryClient = useQueryClient();
  const [editingRoom, setEditingRoom] = useState(null);
  const [editForm, setEditForm] = useState({ capacity: '', rate_per_hour: '' });
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRoomFilter, setSelectedRoomFilter] = useState('all');
  const [bookingForm, setBookingForm] = useState({
    guestEmail: '',
    conferenceRoomId: '',
    bookingDate: '',
    startTime: '',
    endTime: '',
    purpose: '',
    attendees: '',
    specialRequests: ''
  });

  const { data: rooms = [], isLoading: roomsLoading } = useQuery({
    queryKey: ['conference-rooms'],
    queryFn: () => db.entities.ConferenceRoom.list()
  });

  const { data: bookings = [], isLoading: bookingsLoading } = useQuery({
    queryKey: ['conference-bookings'],
    queryFn: () => db.entities.ConferenceRoomBooking.list('-booking_date')
  });

  const { data: guests = [] } = useQuery({
    queryKey: ['guests'],
    queryFn: () => db.entities.Guest.list()
  });

  const generateRoomsMutation = useMutation({
    mutationFn: async () => {
      const roomsToCreate = CONFERENCE_ROOMS.map(room => ({
        name: room.name,
        capacity: room.capacity,
        rate_per_hour: room.rate,
        status: 'available',
        amenities: ['Projector', 'Whiteboard', 'WiFi', 'Video Conferencing']
      }));
      return db.entities.ConferenceRoom.bulkCreate(roomsToCreate);
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['conference-rooms']);
      toast.success(`${CONFERENCE_ROOMS.length} conference rooms created`);
    },
    onError: () => {
      toast.error('Failed to create conference rooms');
    }
  });

  const deleteRoomMutation = useMutation({
    mutationFn: (roomId) => db.entities.ConferenceRoom.delete(roomId),
    onSuccess: () => {
      queryClient.invalidateQueries(['conference-rooms']);
      toast.success('Conference room deleted');
    },
    onError: () => {
      toast.error('Failed to delete conference room');
    }
  });

  const updateRoomMutation = useMutation({
    mutationFn: ({ id, data }) => db.entities.ConferenceRoom.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['conference-rooms']);
      setEditingRoom(null);
      toast.success('Conference room updated');
    },
    onError: () => {
      toast.error('Failed to update conference room');
    }
  });

  const handleEditRoom = (room) => {
    setEditingRoom(room.id);
    setEditForm({
      capacity: room.capacity,
      rate_per_hour: room.rate_per_hour
    });
  };

  const handleSaveEdit = (roomId) => {
    if (!editForm.capacity || !editForm.rate_per_hour) {
      toast.error('Please fill in all fields');
      return;
    }
    updateRoomMutation.mutate({
      id: roomId,
      data: {
        capacity: parseInt(editForm.capacity),
        rate_per_hour: parseFloat(editForm.rate_per_hour)
      }
    });
  };

  const calculateDuration = () => {
    if (!bookingForm.startTime || !bookingForm.endTime) return 0;
    const [startHour, startMin] = bookingForm.startTime.split(':').map(Number);
    const [endHour, endMin] = bookingForm.endTime.split(':').map(Number);
    const duration = (endHour + endMin / 60) - (startHour + startMin / 60);
    return Math.max(0, duration);
  };

  const calculateCost = () => {
    const room = rooms.find(r => r.id === bookingForm.conferenceRoomId);
    if (!room) return 0;
    const duration = calculateDuration();
    return (duration * room.rate_per_hour).toFixed(2);
  };

  const bookRoomMutation = useMutation({
    mutationFn: async () => {
      const guestList = await db.entities.Guest.filter({ email: bookingForm.guestEmail });
      if (!guestList || guestList.length === 0) {
        throw new Error('Guest not found. Please use a registered guest email.');
      }
      const guest = guestList[0];
      
      const duration = calculateDuration();
      const totalCost = parseFloat(calculateCost());
      
      return db.entities.ConferenceRoomBooking.create({
        guest_id: guest.id,
        conference_room_id: bookingForm.conferenceRoomId,
        booking_date: bookingForm.bookingDate,
        start_time: bookingForm.startTime,
        end_time: bookingForm.endTime,
        duration_hours: duration,
        total_cost: totalCost,
        status: 'confirmed',
        purpose: bookingForm.purpose,
        attendees: parseInt(bookingForm.attendees) || 0,
        special_requests: bookingForm.specialRequests
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['conference-bookings']);
      setBookingForm({
        guestEmail: '',
        conferenceRoomId: '',
        bookingDate: '',
        startTime: '',
        endTime: '',
        purpose: '',
        attendees: '',
        specialRequests: ''
      });
      toast.success('Conference room booked successfully');
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to book conference room');
    }
  });

  const handleBookingSubmit = (e) => {
    e.preventDefault();
    if (!bookingForm.guestEmail || !bookingForm.conferenceRoomId || !bookingForm.bookingDate || 
        !bookingForm.startTime || !bookingForm.endTime) {
      toast.error('Please fill in all required fields');
      return;
    }
    if (calculateDuration() <= 0) {
      toast.error('End time must be after start time');
      return;
    }
    bookRoomMutation.mutate();
  };

  const updateBookingMutation = useMutation({
    mutationFn: ({ id, status }) => db.entities.ConferenceRoomBooking.update(id, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries(['conference-bookings']);
      toast.success('Booking updated');
    },
    onError: () => {
      toast.error('Failed to update booking');
    }
  });

  const getGuestName = (guestId) => {
    const guest = guests.find(g => g.id === guestId);
    return guest ? `${guest.first_name} ${guest.last_name}` : 'Unknown';
  };

  const getRoomName = (roomId) => {
    const room = rooms.find(r => r.id === roomId);
    return room ? room.name : 'Unknown Room';
  };

  const filteredRooms = rooms.filter(room => {
    const matchesSearch = room.name.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
  });

  const filteredBookings = bookings.filter(booking => {
    if (selectedRoomFilter === 'all') return true;
    return booking.conference_room_id === selectedRoomFilter;
  });

  return (
    <div className="min-h-screen bg-slate-100 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-3">
            <Building2 className="w-8 h-8" />
            Conference Room Management
          </h1>
          <p className="text-slate-600 mt-2">Manage conference rooms and bookings</p>
        </div>

        <Tabs defaultValue="rooms" className="space-y-6">
          <TabsList>
            <TabsTrigger value="rooms">Conference Rooms</TabsTrigger>
            <TabsTrigger value="bookings">Bookings</TabsTrigger>
            <TabsTrigger value="book">Book Room</TabsTrigger>
          </TabsList>

          <TabsContent value="rooms">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>Conference Rooms ({rooms.length})</span>
                  <Button
                    onClick={() => generateRoomsMutation.mutate()}
                    disabled={generateRoomsMutation.isPending || rooms.length > 0}
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Generate All Rooms
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {rooms.length > 0 && (
                  <div className="mb-4">
                    <Input
                      placeholder="Search conference rooms..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="max-w-md"
                    />
                  </div>
                )}
                {roomsLoading ? (
                  <p className="text-slate-600">Loading rooms...</p>
                ) : rooms.length === 0 ? (
                  <div className="text-center py-8">
                    <Building2 className="w-12 h-12 text-slate-400 mx-auto mb-3" />
                    <p className="text-slate-600 mb-4">No conference rooms yet</p>
                    <Button onClick={() => generateRoomsMutation.mutate()}>
                      Generate Conference Rooms
                    </Button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filteredRooms.map((room) => (
                      <Card key={room.id} className="border-2">
                        <CardHeader>
                          <CardTitle className="text-lg flex items-center justify-between">
                            <span>{room.name}</span>
                            <Badge variant={room.status === 'available' ? 'default' : 'secondary'}>
                              {room.status}
                            </Badge>
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-2">
                          {editingRoom === room.id ? (
                            <>
                              <div>
                                <Label htmlFor={`capacity-${room.id}`}>Capacity</Label>
                                <Input
                                  id={`capacity-${room.id}`}
                                  type="number"
                                  value={editForm.capacity}
                                  onChange={(e) => setEditForm({...editForm, capacity: e.target.value})}
                                  placeholder="Max people"
                                />
                              </div>
                              <div>
                                <Label htmlFor={`rate-${room.id}`}>Rate per Hour ($)</Label>
                                <Input
                                  id={`rate-${room.id}`}
                                  type="number"
                                  step="0.01"
                                  value={editForm.rate_per_hour}
                                  onChange={(e) => setEditForm({...editForm, rate_per_hour: e.target.value})}
                                  placeholder="Hourly rate"
                                />
                              </div>
                              <div className="flex gap-2 mt-3">
                                <Button
                                  size="sm"
                                  onClick={() => handleSaveEdit(room.id)}
                                  className="flex-1"
                                >
                                  Save
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => setEditingRoom(null)}
                                  className="flex-1"
                                >
                                  Cancel
                                </Button>
                              </div>
                            </>
                          ) : (
                            <>
                              <p className="text-sm text-slate-600">
                                <span className="font-semibold">Capacity:</span> {room.capacity} people
                              </p>
                              <p className="text-sm text-slate-600">
                                <span className="font-semibold">Rate:</span> ${room.rate_per_hour}/hour
                              </p>
                              {room.amenities && room.amenities.length > 0 && (
                                <div className="flex flex-wrap gap-1 mt-2">
                                  {room.amenities.map((amenity, idx) => (
                                    <Badge key={idx} variant="outline" className="text-xs">
                                      {amenity}
                                    </Badge>
                                  ))}
                                </div>
                              )}
                              <div className="flex gap-2 mt-3">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="flex-1"
                                  onClick={() => handleEditRoom(room)}
                                >
                                  Edit
                                </Button>
                                <Button
                                  variant="destructive"
                                  size="sm"
                                  className="flex-1"
                                  onClick={() => deleteRoomMutation.mutate(room.id)}
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </div>
                            </>
                          )}
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="bookings">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="w-5 h-5" />
                  Conference Room Bookings ({bookings.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                {bookings.length > 0 && (
                  <div className="mb-4">
                    <Label htmlFor="roomFilter">Filter by Room</Label>
                    <select
                      id="roomFilter"
                      value={selectedRoomFilter}
                      onChange={(e) => setSelectedRoomFilter(e.target.value)}
                      className="flex h-9 w-full max-w-md rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm"
                    >
                      <option value="all">All Rooms ({bookings.length})</option>
                      {rooms.map((room) => {
                        const roomBookingCount = bookings.filter(b => b.conference_room_id === room.id).length;
                        return (
                          <option key={room.id} value={room.id}>
                            {room.name} ({roomBookingCount})
                          </option>
                        );
                      })}
                    </select>
                  </div>
                )}
                {bookingsLoading ? (
                  <p className="text-slate-600">Loading bookings...</p>
                ) : bookings.length === 0 ? (
                  <div className="text-center py-8">
                    <Calendar className="w-12 h-12 text-slate-400 mx-auto mb-3" />
                    <p className="text-slate-600">No bookings yet</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {filteredBookings.map((booking) => (
                      <Card key={booking.id} className="border-l-4 border-l-blue-500">
                        <CardContent className="pt-6">
                          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                            <div>
                              <p className="text-xs text-slate-500">Room</p>
                              <p className="font-semibold">{getRoomName(booking.conference_room_id)}</p>
                            </div>
                            <div>
                              <p className="text-xs text-slate-500">Guest</p>
                              <p className="font-semibold">{getGuestName(booking.guest_id)}</p>
                            </div>
                            <div>
                              <p className="text-xs text-slate-500">Date & Time</p>
                              <p className="font-semibold">
                                {format(new Date(booking.booking_date), 'MMM dd, yyyy')}
                              </p>
                              <p className="text-sm text-slate-600">
                                {booking.start_time} - {booking.end_time}
                              </p>
                            </div>
                            <div>
                              <p className="text-xs text-slate-500">Status</p>
                              <Badge variant={booking.status === 'confirmed' ? 'default' : 'secondary'}>
                                {booking.status}
                              </Badge>
                              <p className="text-sm font-semibold text-green-600 mt-1">
                                ${booking.total_cost}
                              </p>
                            </div>
                          </div>
                          {booking.purpose && (
                            <p className="text-sm text-slate-600 mt-3">
                              <span className="font-semibold">Purpose:</span> {booking.purpose}
                            </p>
                          )}
                          {booking.attendees && (
                            <p className="text-sm text-slate-600">
                              <span className="font-semibold">Attendees:</span> {booking.attendees}
                            </p>
                          )}
                          {booking.status === 'pending' && (
                            <div className="flex gap-2 mt-3">
                              <Button
                                size="sm"
                                onClick={() => updateBookingMutation.mutate({ id: booking.id, status: 'confirmed' })}
                              >
                                Confirm
                              </Button>
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => updateBookingMutation.mutate({ id: booking.id, status: 'cancelled' })}
                              >
                                Cancel
                              </Button>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="book">
            <Card>
              <CardHeader>
                <CardTitle>Book Conference Room for Guest</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleBookingSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="guestEmail">Guest Email *</Label>
                      <Input
                        id="guestEmail"
                        type="email"
                        value={bookingForm.guestEmail}
                        onChange={(e) => setBookingForm({...bookingForm, guestEmail: e.target.value})}
                        placeholder="guest@example.com"
                        required
                      />
                      <p className="text-xs text-slate-500 mt-1">Guest must be registered in the system</p>
                    </div>
                    <div>
                      <Label htmlFor="conferenceRoomId">Conference Room *</Label>
                      <select
                        id="conferenceRoomId"
                        value={bookingForm.conferenceRoomId}
                        onChange={(e) => setBookingForm({...bookingForm, conferenceRoomId: e.target.value})}
                        className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm"
                        required
                      >
                        <option value="">Select a room</option>
                        {rooms.filter(r => r.status === 'available').map((room) => (
                          <option key={room.id} value={room.id}>
                            {room.name} - ${room.rate_per_hour}/hr (Cap: {room.capacity})
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <Label htmlFor="bookingDate">Date *</Label>
                      <Input
                        id="bookingDate"
                        type="date"
                        value={bookingForm.bookingDate}
                        onChange={(e) => setBookingForm({...bookingForm, bookingDate: e.target.value})}
                        min={new Date().toISOString().split('T')[0]}
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="startTime">Start Time *</Label>
                      <Input
                        id="startTime"
                        type="time"
                        value={bookingForm.startTime}
                        onChange={(e) => setBookingForm({...bookingForm, startTime: e.target.value})}
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="endTime">End Time *</Label>
                      <Input
                        id="endTime"
                        type="time"
                        value={bookingForm.endTime}
                        onChange={(e) => setBookingForm({...bookingForm, endTime: e.target.value})}
                        required
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="purpose">Purpose</Label>
                      <Input
                        id="purpose"
                        value={bookingForm.purpose}
                        onChange={(e) => setBookingForm({...bookingForm, purpose: e.target.value})}
                        placeholder="Meeting, training, etc."
                      />
                    </div>
                    <div>
                      <Label htmlFor="attendees">Number of Attendees</Label>
                      <Input
                        id="attendees"
                        type="number"
                        value={bookingForm.attendees}
                        onChange={(e) => setBookingForm({...bookingForm, attendees: e.target.value})}
                        placeholder="10"
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="specialRequests">Special Requests</Label>
                    <Input
                      id="specialRequests"
                      value={bookingForm.specialRequests}
                      onChange={(e) => setBookingForm({...bookingForm, specialRequests: e.target.value})}
                      placeholder="Any special requirements?"
                    />
                  </div>

                  {bookingForm.startTime && bookingForm.endTime && bookingForm.conferenceRoomId && (
                    <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                      <div className="flex justify-between items-center">
                        <div>
                          <p className="text-sm text-slate-600">Duration</p>
                          <p className="text-lg font-semibold">{calculateDuration().toFixed(1)} hours</p>
                        </div>
                        <div>
                          <p className="text-sm text-slate-600">Total Cost</p>
                          <p className="text-2xl font-bold text-green-600">${calculateCost()}</p>
                        </div>
                      </div>
                    </div>
                  )}

                  <Button type="submit" disabled={bookRoomMutation.isPending} className="w-full">
                    {bookRoomMutation.isPending ? 'Booking...' : 'Book Conference Room'}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}