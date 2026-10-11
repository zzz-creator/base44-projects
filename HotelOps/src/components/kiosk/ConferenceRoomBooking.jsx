import React, { useState } from 'react';
import { base44 } from '../../api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from "../../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import { Badge } from "../../components/ui/badge";
import { Textarea } from "../../components/ui/textarea";
import { Building2, Users, Clock, DollarSign, Calendar, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';

export default function ConferenceRoomBooking() {
  const queryClient = useQueryClient();
  const [step, setStep] = useState(1);
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [bookingData, setBookingData] = useState({
    guestName: '',
    guestEmail: '',
    guestPhone: '',
    bookingDate: '',
    startTime: '',
    endTime: '',
    purpose: '',
    attendees: '',
    specialRequests: ''
  });
  const [confirmationCode, setConfirmationCode] = useState('');

  const { data: rooms = [], isLoading } = useQuery({
    queryKey: ['conference-rooms'],
    queryFn: () => base44.entities.ConferenceRoom.list()
  });

  const availableRooms = rooms.filter(r => r.status === 'available');

  const calculateDuration = () => {
    if (!bookingData.startTime || !bookingData.endTime) return 0;
    const [startHour, startMin] = bookingData.startTime.split(':').map(Number);
    const [endHour, endMin] = bookingData.endTime.split(':').map(Number);
    const duration = (endHour + endMin / 60) - (startHour + startMin / 60);
    return Math.max(0, duration);
  };

  const calculateCost = () => {
    if (!selectedRoom) return 0;
    const duration = calculateDuration();
    return (duration * selectedRoom.rate_per_hour).toFixed(2);
  };

  const bookRoomMutation = useMutation({
    mutationFn: async () => {
      // Find or create guest
      const existingGuest = await base44.entities.Guest.filter({ email: bookingData.guestEmail });
      let guest;
      
      if (existingGuest && existingGuest.length > 0) {
        guest = existingGuest[0];
      } else {
        const [firstName, ...lastNameParts] = bookingData.guestName.trim().split(' ');
        guest = await base44.entities.Guest.create({
          first_name: firstName,
          last_name: lastNameParts.join(' ') || firstName,
          email: bookingData.guestEmail,
          phone: bookingData.guestPhone,
          status: 'reserved'
        });
      }

      // Create booking
      const duration = calculateDuration();
      const totalCost = parseFloat(calculateCost());
      
      const booking = await base44.entities.ConferenceRoomBooking.create({
        guest_id: guest.id,
        conference_room_id: selectedRoom.id,
        booking_date: bookingData.bookingDate,
        start_time: bookingData.startTime,
        end_time: bookingData.endTime,
        duration_hours: duration,
        total_cost: totalCost,
        status: 'pending',
        purpose: bookingData.purpose,
        attendees: parseInt(bookingData.attendees) || 0,
        special_requests: bookingData.specialRequests
      });

      return { booking, guest };
    },
    onSuccess: ({ booking }) => {
      queryClient.invalidateQueries(['conference-bookings']);
      const code = `CR-${booking.id.slice(0, 8).toUpperCase()}`;
      setConfirmationCode(code);
      setStep(3);
      toast.success('Conference room booked successfully!');
    },
    onError: () => {
      toast.error('Failed to book conference room');
    }
  });

  const handleRoomSelect = (room) => {
    setSelectedRoom(room);
    setStep(2);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!bookingData.guestName || !bookingData.guestEmail || !bookingData.bookingDate || 
        !bookingData.startTime || !bookingData.endTime) {
      toast.error('Please fill in all required fields');
      return;
    }

    if (calculateDuration() <= 0) {
      toast.error('End time must be after start time');
      return;
    }

    bookRoomMutation.mutate();
  };

  if (step === 3) {
    return (
      <Card className="border-2 border-green-500">
        <CardHeader className="bg-green-50">
          <CardTitle className="flex items-center gap-3 text-green-700">
            <CheckCircle className="w-8 h-8" />
            Booking Confirmed!
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-6 space-y-4">
          <div className="text-center">
            <p className="text-lg mb-2">Your conference room has been booked</p>
            <div className="bg-slate-100 p-4 rounded-lg mb-4">
              <p className="text-sm text-slate-600 mb-1">Confirmation Code</p>
              <p className="text-3xl font-bold text-blue-600">{confirmationCode}</p>
            </div>
            <p className="text-sm text-slate-600">
              Room: <span className="font-semibold">{selectedRoom?.name}</span>
            </p>
            <p className="text-sm text-slate-600">
              Date: <span className="font-semibold">{bookingData.bookingDate}</span>
            </p>
            <p className="text-sm text-slate-600">
              Time: <span className="font-semibold">{bookingData.startTime} - {bookingData.endTime}</span>
            </p>
            <p className="text-lg font-semibold text-green-600 mt-4">
              Total: ${calculateCost()}
            </p>
          </div>
          <Button 
            onClick={() => {
              setStep(1);
              setSelectedRoom(null);
              setBookingData({
                guestName: '',
                guestEmail: '',
                guestPhone: '',
                bookingDate: '',
                startTime: '',
                endTime: '',
                purpose: '',
                attendees: '',
                specialRequests: ''
              });
            }}
            className="w-full"
          >
            Book Another Room
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (step === 2 && selectedRoom) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="w-5 h-5" />
            Book {selectedRoom.name}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="guestName">Full Name *</Label>
                <Input
                  id="guestName"
                  value={bookingData.guestName}
                  onChange={(e) => setBookingData({...bookingData, guestName: e.target.value})}
                  placeholder="John Doe"
                  required
                />
              </div>
              <div>
                <Label htmlFor="guestEmail">Email *</Label>
                <Input
                  id="guestEmail"
                  type="email"
                  value={bookingData.guestEmail}
                  onChange={(e) => setBookingData({...bookingData, guestEmail: e.target.value})}
                  placeholder="john@example.com"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="guestPhone">Phone</Label>
                <Input
                  id="guestPhone"
                  value={bookingData.guestPhone}
                  onChange={(e) => setBookingData({...bookingData, guestPhone: e.target.value})}
                  placeholder="(555) 123-4567"
                />
              </div>
              <div>
                <Label htmlFor="attendees">Number of Attendees</Label>
                <Input
                  id="attendees"
                  type="number"
                  value={bookingData.attendees}
                  onChange={(e) => setBookingData({...bookingData, attendees: e.target.value})}
                  placeholder="10"
                  max={selectedRoom.capacity}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="bookingDate">Date *</Label>
                <Input
                  id="bookingDate"
                  type="date"
                  value={bookingData.bookingDate}
                  onChange={(e) => setBookingData({...bookingData, bookingDate: e.target.value})}
                  min={new Date().toISOString().split('T')[0]}
                  required
                />
              </div>
              <div>
                <Label htmlFor="startTime">Start Time *</Label>
                <Input
                  id="startTime"
                  type="time"
                  value={bookingData.startTime}
                  onChange={(e) => setBookingData({...bookingData, startTime: e.target.value})}
                  required
                />
              </div>
              <div>
                <Label htmlFor="endTime">End Time *</Label>
                <Input
                  id="endTime"
                  type="time"
                  value={bookingData.endTime}
                  onChange={(e) => setBookingData({...bookingData, endTime: e.target.value})}
                  required
                />
              </div>
            </div>

            <div>
              <Label htmlFor="purpose">Purpose</Label>
              <Input
                id="purpose"
                value={bookingData.purpose}
                onChange={(e) => setBookingData({...bookingData, purpose: e.target.value})}
                placeholder="Business meeting, training session, etc."
              />
            </div>

            <div>
              <Label htmlFor="specialRequests">Special Requests</Label>
              <Textarea
                id="specialRequests"
                value={bookingData.specialRequests}
                onChange={(e) => setBookingData({...bookingData, specialRequests: e.target.value})}
                placeholder="Any special setup or equipment needed?"
                rows={3}
              />
            </div>

            {bookingData.startTime && bookingData.endTime && (
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

            <div className="flex gap-3">
              <Button type="button" variant="outline" onClick={() => setStep(1)} className="flex-1">
                Back
              </Button>
              <Button type="submit" disabled={bookRoomMutation.isPending} className="flex-1">
                {bookRoomMutation.isPending ? 'Booking...' : 'Confirm Booking'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Building2 className="w-5 h-5" />
          Available Conference Rooms
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <p className="text-slate-600">Loading rooms...</p>
        ) : availableRooms.length === 0 ? (
          <div className="text-center py-8">
            <Building2 className="w-12 h-12 text-slate-400 mx-auto mb-3" />
            <p className="text-slate-600">No conference rooms available</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {availableRooms.map((room) => (
              <Card key={room.id} className="border-2 hover:border-blue-500 cursor-pointer transition-all">
                <CardHeader>
                  <CardTitle className="text-lg">{room.name}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center gap-2 text-sm text-slate-600">
                    <Users className="w-4 h-4" />
                    <span>Capacity: {room.capacity}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-slate-600">
                    <DollarSign className="w-4 h-4" />
                    <span>${room.rate_per_hour}/hour</span>
                  </div>
                  {room.amenities && room.amenities.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {room.amenities.slice(0, 3).map((amenity, idx) => (
                        <Badge key={idx} variant="outline" className="text-xs">
                          {amenity}
                        </Badge>
                      ))}
                    </div>
                  )}
                  <Button
                    onClick={() => handleRoomSelect(room)}
                    className="w-full mt-3"
                  >
                    Book This Room
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}