import React, { useState } from 'react';
import { db } from '../dataClient';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Badge } from '../../components/ui/badge';
import { Calendar, Check } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';

export default function BookRoom() {
  const queryClient = useQueryClient();
  const [step, setStep] = useState(1);
  const [bookingData, setBookingData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    check_in_date: '',
    check_out_date: '',
    number_of_guests: 1,
    room_category: 'standard'
  });
  const [assignedRoom, setAssignedRoom] = useState(null);
  const [confirmationCode, setConfirmationCode] = useState('');

  const { data: availableRooms = [] } = useQuery({
    queryKey: ['available-rooms'],
    queryFn: () => db.entities.Room.filter({ status: 'available' })
  });

  const { data: floors = [] } = useQuery({
    queryKey: ['floors'],
    queryFn: () => db.entities.Floor.list()
  });

  const bookingMutation = useMutation({
    mutationFn: async () => {
      // Find available room of selected category
      const availableRoom = availableRooms.find(r => r.room_type === bookingData.room_category);
      if (!availableRoom) {
        throw new Error('No rooms available in this category');
      }

      const guest = await db.entities.Guest.create({
        first_name: bookingData.first_name,
        last_name: bookingData.last_name,
        email: bookingData.email,
        phone: bookingData.phone,
        status: 'reserved'
      });

      const reservation = await db.entities.Reservation.create({
        guest_id: guest.id,
        room_id: availableRoom.id,
        check_in_date: new Date(bookingData.check_in_date).toISOString(),
        check_out_date: new Date(bookingData.check_out_date).toISOString(),
        number_of_guests: bookingData.number_of_guests,
        status: 'confirmed'
      });

      await db.entities.Room.update(availableRoom.id, { status: 'reserved' });

      // Create access pass with confirmation code
      const code = reservation.id.substring(0, 8).toUpperCase();
      const roomFloor = floors.find(f => f.id === availableRoom.floor_id);
      
      await db.entities.AccessPass.create({
        guest_id: guest.id,
        pass_code: code,
        valid_from: new Date(bookingData.check_in_date).toISOString(),
        valid_until: new Date(bookingData.check_out_date).toISOString(),
        allowed_floors: roomFloor ? [roomFloor.id] : [],
        status: 'active'
      });

      // Award loyalty points
      const pointsEarned = Math.floor(availableRoom.rate_per_night * 10);
      let loyaltyPoints = await db.entities.LoyaltyPoints.filter({ guest_id: guest.id });
      
      if (loyaltyPoints.length === 0) {
        await db.entities.LoyaltyPoints.create({
          guest_id: guest.id,
          total_points: pointsEarned,
          lifetime_points: pointsEarned,
          total_bookings: 1,
          current_tier: 'standard'
        });
      } else {
        const loyalty = loyaltyPoints[0];
        const newLifetimePoints = loyalty.lifetime_points + pointsEarned;
        let newTier = loyalty.current_tier;
        
        if (newLifetimePoints >= 10000) newTier = 'platinum';
        else if (newLifetimePoints >= 5000) newTier = 'gold';
        else if (newLifetimePoints >= 1000) newTier = 'silver';
        
        await db.entities.LoyaltyPoints.update(loyalty.id, {
          total_points: loyalty.total_points + pointsEarned,
          lifetime_points: newLifetimePoints,
          total_bookings: loyalty.total_bookings + 1,
          current_tier: newTier
        });
      }

      await db.entities.LoyaltyTransaction.create({
        guest_id: guest.id,
        transaction_type: 'earned',
        points: pointsEarned,
        description: `Booking: Room ${availableRoom.room_number}`,
        related_reservation_id: reservation.id,
        transaction_date: new Date().toISOString()
      });

      await db.entities.AnalyticsData.create({
        metric_type: 'guest_satisfaction',
        metric_value: pointsEarned,
        metric_date: new Date().toISOString(),
        domain: 'overall',
        metadata: {
          event: 'loyalty_points_earned',
          guest_id: guest.id,
          points: pointsEarned,
          source: 'booking'
        }
      });

      return { guest, reservation, code, room: availableRoom };
    },
    onSuccess: (data) => {
      setAssignedRoom(data.room);
      setConfirmationCode(data.code);
      setStep(2);
      queryClient.invalidateQueries({ queryKey: ['available-rooms'] });
      toast.success('Room booked successfully!');
    },
    onError: () => {
      toast.error('Booking failed. Please try again.');
    }
  });

  const handleSubmitInfo = (e) => {
    e.preventDefault();
    bookingMutation.mutate();
  };

  if (step === 2) {
    return (
      <Card className="max-w-2xl mx-auto">
        <CardHeader className="text-center">
          <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
            <Check className="w-8 h-8 text-green-600" />
          </div>
          <CardTitle className="text-2xl text-green-600">Booking Confirmed!</CardTitle>
          <CardDescription>Your reservation has been confirmed</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 text-center">
            <p className="text-sm text-slate-600 mb-2">Confirmation Code</p>
            <p className="text-4xl font-bold text-blue-600 tracking-widest">{confirmationCode}</p>
            <p className="text-xs text-slate-500 mt-2">Save this code for check-in</p>
          </div>
          
          <div className="space-y-2 text-sm">
            <p><strong>Guest:</strong> {bookingData.first_name} {bookingData.last_name}</p>
            <p><strong>Room:</strong> {assignedRoom?.room_number} ({assignedRoom?.room_type})</p>
            <p><strong>Check-in:</strong> {format(new Date(bookingData.check_in_date), 'PPP')}</p>
            <p><strong>Check-out:</strong> {format(new Date(bookingData.check_out_date), 'PPP')}</p>
            <p><strong>Guests:</strong> {bookingData.number_of_guests}</p>
            <p><strong>Email:</strong> {bookingData.email}</p>
          </div>

          <Button className="w-full" onClick={() => window.location.reload()}>
            Return to Kiosk
          </Button>
        </CardContent>
      </Card>
    );
  }



  return (
    <Card className="max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="w-6 h-6" />
          Book a Room
        </CardTitle>
        <CardDescription>Reserve your room in advance</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmitInfo} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="first_name">First Name</Label>
              <Input
                id="first_name"
                value={bookingData.first_name}
                onChange={(e) => setBookingData({...bookingData, first_name: e.target.value})}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="last_name">Last Name</Label>
              <Input
                id="last_name"
                value={bookingData.last_name}
                onChange={(e) => setBookingData({...bookingData, last_name: e.target.value})}
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={bookingData.email}
              onChange={(e) => setBookingData({...bookingData, email: e.target.value})}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone">Phone</Label>
            <Input
              id="phone"
              type="tel"
              value={bookingData.phone}
              onChange={(e) => setBookingData({...bookingData, phone: e.target.value})}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="check_in">Check-in Date</Label>
              <Input
                id="check_in"
                type="date"
                value={bookingData.check_in_date}
                onChange={(e) => setBookingData({...bookingData, check_in_date: e.target.value})}
                min={new Date().toISOString().split('T')[0]}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="check_out">Check-out Date</Label>
              <Input
                id="check_out"
                type="date"
                value={bookingData.check_out_date}
                onChange={(e) => setBookingData({...bookingData, check_out_date: e.target.value})}
                min={bookingData.check_in_date || new Date().toISOString().split('T')[0]}
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="guests">Number of Guests</Label>
            <Input
              id="guests"
              type="number"
              min="1"
              max="6"
              value={bookingData.number_of_guests}
              onChange={(e) => setBookingData({...bookingData, number_of_guests: parseInt(e.target.value)})}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="room_category">Room Category</Label>
            <select
              id="room_category"
              value={bookingData.room_category}
              onChange={(e) => setBookingData({...bookingData, room_category: e.target.value})}
              className="w-full px-3 py-2 border rounded-md"
              required
            >
              <option value="standard">Standard Room</option>
              <option value="deluxe">Deluxe Room</option>
              <option value="suite">Suite</option>
              <option value="penthouse">Penthouse</option>
            </select>
          </div>

          <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700" disabled={bookingMutation.isPending}>
            {bookingMutation.isPending ? 'Booking...' : 'Complete Booking'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}