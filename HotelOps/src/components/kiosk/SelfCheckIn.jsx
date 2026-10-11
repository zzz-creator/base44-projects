import React, { useState } from 'react';
import { db } from '../dataClient';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Checkbox } from '../../components/ui/checkbox';
import { Badge } from '../../components/ui/badge';
import { UserPlus, Check, CreditCard } from 'lucide-react';
import { toast } from 'sonner';

export default function SelfCheckIn() {
  const queryClient = useQueryClient();
  const [step, setStep] = useState(1);
  const [confirmationCode, setConfirmationCode] = useState('');
  const [reservation, setReservation] = useState(null);
  const [guest, setGuest] = useState(null);
  const [assignedRoom, setAssignedRoom] = useState(null);
  const [assignedParkingSpot, setAssignedParkingSpot] = useState(null);
  const [guestData, setGuestData] = useState({
    has_vehicle: false,
    license_plate: ''
  });

  const { data: floors = [] } = useQuery({
    queryKey: ['floors'],
    queryFn: () => db.entities.Floor.list()
  });

  const lookupMutation = useMutation({
    mutationFn: async (code) => {
      const accessPasses = await db.entities.AccessPass.filter({ pass_code: code });
      if (accessPasses.length === 0) {
        throw new Error('Invalid confirmation code');
      }

      const accessPass = accessPasses[0];
      const guestData = await db.entities.Guest.filter({ id: accessPass.guest_id });
      const reservations = await db.entities.Reservation.filter({ guest_id: accessPass.guest_id, status: 'confirmed' });
      
      if (reservations.length === 0) {
        throw new Error('No confirmed reservation found');
      }

      const reservation = reservations[0];
      const room = await db.entities.Room.filter({ id: reservation.room_id });

      return { guest: guestData[0], reservation, room: room[0] };
    },
    onSuccess: (data) => {
      setGuest(data.guest);
      setReservation(data.reservation);
      setAssignedRoom(data.room);
      setStep(2);
    },
    onError: (error) => {
      toast.error(error.message);
    }
  });

  const checkInMutation = useMutation({
    mutationFn: async () => {
      const checkInDate = new Date();
      
      // Update guest status
      await db.entities.Guest.update(guest.id, { status: 'checked_in' });

      // Update reservation
      await db.entities.Reservation.update(reservation.id, {
        status: 'checked_in',
        actual_check_in: checkInDate.toISOString()
      });

      // Update room status
      await db.entities.Room.update(assignedRoom.id, { status: 'occupied' });

      // Handle vehicle if provided
      let vehicle = null;
      let assignedParkingSpot = null;
      if (guestData.has_vehicle && guestData.license_plate) {
        // First check for reserved spots for this room
        let parkingSpots = await db.entities.ParkingSpot.filter({ 
          status: 'reserved',
          reserved_for_room: assignedRoom.room_number
        });
        
        // If no reserved spot, get any available spot
        if (parkingSpots.length === 0) {
          parkingSpots = await db.entities.ParkingSpot.filter({ status: 'available' });
        }
        
        if (parkingSpots.length > 0) {
          const spot = parkingSpots[0];
          assignedParkingSpot = spot;
          vehicle = await db.entities.Vehicle.create({
            guest_id: guest.id,
            parking_spot_id: spot.id,
            license_plate: guestData.license_plate,
            check_in_time: checkInDate.toISOString()
          });
          await db.entities.ParkingSpot.update(spot.id, { 
            status: 'occupied',
            vehicle_id: vehicle.id,
            reserved_for_room: assignedRoom.room_number
          });
        }
      }

      // Update access pass with vehicle if provided
      const accessPasses = await db.entities.AccessPass.filter({ pass_code: confirmationCode });
      if (accessPasses.length > 0) {
        const updateData = {};
        if (vehicle) {
          updateData.vehicle_id = vehicle.id;
          updateData.parking_levels = ['P1', 'P2'];
        }
        if (Object.keys(updateData).length > 0) {
          await db.entities.AccessPass.update(accessPasses[0].id, updateData);
        }
      }

      return { guest, reservation, parkingSpot: assignedParkingSpot };
    },
    onSuccess: (data) => {
      setAssignedParkingSpot(data.parkingSpot);
      setStep(3);
      queryClient.invalidateQueries();
      toast.success('Check-in successful!');
    },
    onError: () => {
      toast.error('Check-in failed. Please try again.');
    }
  });

  const handleLookup = (e) => {
    e.preventDefault();
    lookupMutation.mutate(confirmationCode);
  };

  const handleCheckIn = (e) => {
    e.preventDefault();
    checkInMutation.mutate();
  };

  if (step === 3) {
    return (
      <Card className="max-w-2xl mx-auto">
        <CardHeader className="text-center">
          <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
            <Check className="w-8 h-8 text-green-600" />
          </div>
          <CardTitle className="text-2xl text-green-600">Check-In Complete!</CardTitle>
          <CardDescription>Welcome to HotelOps</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 text-center">
            <p className="text-sm text-slate-600 mb-2">Your Access Code</p>
            <p className="text-4xl font-bold text-blue-600 tracking-widest">{confirmationCode}</p>
            <p className="text-xs text-slate-500 mt-2">Use this code for all hotel services</p>
          </div>
          
          <div className="bg-slate-50 rounded-lg p-4 space-y-3">
            <div>
              <p className="text-xs text-slate-600 mb-1">Guest Information</p>
              <p className="text-sm"><strong>Name:</strong> {guest?.first_name} {guest?.last_name}</p>
              <p className="text-sm"><strong>Email:</strong> {guest?.email}</p>
            </div>
            
            <div className="border-t pt-3">
              <p className="text-xs text-slate-600 mb-1">Room Assignment</p>
              <p className="text-lg font-bold text-blue-600">Room {assignedRoom?.room_number}</p>
              <p className="text-xs text-slate-500">{assignedRoom?.room_type}</p>
            </div>

            {assignedParkingSpot && (
              <div className="border-t pt-3">
                <p className="text-xs text-slate-600 mb-1">Parking Assignment</p>
                <p className="text-lg font-bold text-green-600">Spot {assignedParkingSpot?.spot_number}</p>
                <p className="text-xs text-slate-500">Level {assignedParkingSpot?.level} • {assignedParkingSpot?.zone} zone</p>
              </div>
            )}
          </div>

          <Button 
            className="w-full" 
            onClick={() => window.location.reload()}
          >
            Return to Kiosk
          </Button>
        </CardContent>
      </Card>
    );
  }



  if (step === 2) {
    return (
      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserPlus className="w-6 h-6" />
            Complete Check-In
          </CardTitle>
          <CardDescription>Review your reservation and complete check-in</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            <div className="bg-slate-50 p-4 rounded-lg space-y-2">
              <p><strong>Guest:</strong> {guest?.first_name} {guest?.last_name}</p>
              <p><strong>Email:</strong> {guest?.email}</p>
              <p><strong>Room:</strong> {assignedRoom?.room_number} ({assignedRoom?.room_type})</p>
              <p><strong>Check-in:</strong> {new Date(reservation?.check_in_date).toLocaleDateString()}</p>
              <p><strong>Check-out:</strong> {new Date(reservation?.check_out_date).toLocaleDateString()}</p>
            </div>

            <form onSubmit={handleCheckIn} className="space-y-4">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="has_vehicle"
                  checked={guestData.has_vehicle}
                  onCheckedChange={(checked) => setGuestData({...guestData, has_vehicle: checked})}
                />
                <Label htmlFor="has_vehicle">I have a vehicle</Label>
              </div>

              {guestData.has_vehicle && (
                <div className="space-y-2">
                  <Label htmlFor="license_plate">License Plate</Label>
                  <Input
                    id="license_plate"
                    value={guestData.license_plate}
                    onChange={(e) => setGuestData({...guestData, license_plate: e.target.value})}
                    placeholder="ABC-1234"
                  />
                </div>
              )}

              <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700" disabled={checkInMutation.isPending}>
                {checkInMutation.isPending ? 'Processing...' : 'Complete Check-In'}
              </Button>
            </form>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <UserPlus className="w-6 h-6" />
          Self Check-In
        </CardTitle>
        <CardDescription>Enter your confirmation code to check in</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleLookup} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="confirmation_code">Confirmation Code</Label>
            <Input
              id="confirmation_code"
              value={confirmationCode}
              onChange={(e) => setConfirmationCode(e.target.value.toUpperCase())}
              placeholder="Enter your 8-character code"
              maxLength={8}
              required
              className="text-lg tracking-wider text-center"
            />
            <p className="text-xs text-slate-500">Enter the code you received when booking</p>
          </div>

          <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700" disabled={lookupMutation.isPending}>
            {lookupMutation.isPending ? 'Looking up...' : 'Continue'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}