import React, { useState } from 'react';
import { db } from '../dataClient';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Badge } from '../../components/ui/badge';
import { LogOut, Check, DollarSign } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';

export default function CheckOut() {
  const queryClient = useQueryClient();
  const [accessCode, setAccessCode] = useState('');
  const [guestData, setGuestData] = useState(null);
  const [checkoutComplete, setCheckoutComplete] = useState(false);

  const lookupMutation = useMutation({
    mutationFn: async () => {
      const passes = await db.entities.AccessPass.filter({ 
        pass_code: accessCode,
        status: 'active'
      });

      if (passes.length === 0) throw new Error('Invalid access code');

      const pass = passes[0];
      const guest = await db.entities.Guest.list();
      const guestRecord = guest.find(g => g.id === pass.guest_id);
      
      const reservations = await db.entities.Reservation.filter({ 
        guest_id: pass.guest_id,
        status: 'checked_in'
      });

      if (reservations.length === 0) throw new Error('No active reservation found');

      const reservation = reservations[0];
      const rooms = await db.entities.Room.list();
      const room = rooms.find(r => r.id === reservation.room_id);

      const vehicles = await db.entities.Vehicle.filter({ guest_id: pass.guest_id });
      
      return { guest: guestRecord, reservation, room, pass, vehicle: vehicles[0] };
    },
    onSuccess: (data) => {
      setGuestData(data);
    },
    onError: (error) => {
      toast.error(error.message);
    }
  });

  const checkoutMutation = useMutation({
    mutationFn: async () => {
      const now = new Date().toISOString();
      
      await db.entities.Reservation.update(guestData.reservation.id, {
        status: 'checked_out',
        actual_check_out: now
      });

      await db.entities.Guest.update(guestData.guest.id, {
        status: 'checked_out'
      });

      await db.entities.Room.update(guestData.room.id, {
        status: 'cleaning'
      });

      await db.entities.AccessPass.update(guestData.pass.id, {
        status: 'expired'
      });

      if (guestData.vehicle) {
        await db.entities.Vehicle.update(guestData.vehicle.id, {
          check_out_time: now
        });

        const parkingSpots = await db.entities.ParkingSpot.filter({
          vehicle_id: guestData.vehicle.id
        });
        
        if (parkingSpots.length > 0) {
          await db.entities.ParkingSpot.update(parkingSpots[0].id, {
            status: 'available',
            vehicle_id: '',
            reserved_for_room: ''
          });
        }
      }

      const checkInDate = new Date(guestData.reservation.actual_check_in);
      const nights = Math.ceil((new Date() - checkInDate) / (1000 * 60 * 60 * 24));
      const roomCharges = nights * guestData.room.rate_per_night;
      
      await db.entities.Invoice.create({
        reservation_id: guestData.reservation.id,
        guest_id: guestData.guest.id,
        invoice_number: `INV-${Date.now()}`,
        invoice_date: now,
        room_charges: roomCharges,
        parking_charges: guestData.vehicle ? nights * 20 : 0,
        tax_amount: (roomCharges * 0.1),
        total_amount: roomCharges + (roomCharges * 0.1),
        status: 'sent',
        payment_method: 'pending'
      });
    },
    onSuccess: () => {
      setCheckoutComplete(true);
      queryClient.invalidateQueries();
      toast.success('Checkout successful!');
    },
    onError: () => {
      toast.error('Checkout failed');
    }
  });

  if (checkoutComplete) {
    return (
      <Card className="max-w-2xl mx-auto">
        <CardHeader className="text-center">
          <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
            <Check className="w-8 h-8 text-green-600" />
          </div>
          <CardTitle className="text-2xl text-green-600">Checkout Complete!</CardTitle>
          <CardDescription>Thank you for staying with us</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
            <p className="text-sm text-slate-600 mb-2">Invoice Summary</p>
            <div className="space-y-2 text-sm">
              <p><strong>Guest:</strong> {guestData.guest.first_name} {guestData.guest.last_name}</p>
              <p><strong>Room:</strong> {guestData.room.room_number}</p>
              <p><strong>Email:</strong> {guestData.guest.email}</p>
              <p className="text-xs text-slate-500 mt-3">Invoice has been sent to your email</p>
            </div>
          </div>

          <Button className="w-full" onClick={() => window.location.reload()}>
            Return to Kiosk
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (guestData) {
    const checkInDate = new Date(guestData.reservation.actual_check_in);
    const nights = Math.ceil((new Date() - checkInDate) / (1000 * 60 * 60 * 24));
    const roomCharges = nights * guestData.room.rate_per_night;
    const parkingCharges = guestData.vehicle ? nights * 20 : 0;
    const tax = roomCharges * 0.1;
    const total = roomCharges + parkingCharges + tax;

    return (
      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="w-6 h-6" />
            Review & Checkout
          </CardTitle>
          <CardDescription>Please review your stay details</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-slate-600">Guest</span>
              <span className="font-medium">{guestData.guest.first_name} {guestData.guest.last_name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-600">Room</span>
              <span className="font-medium">{guestData.room.room_number} ({guestData.room.room_type})</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-600">Check-in</span>
              <span className="font-medium">{format(checkInDate, 'PPP')}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-600">Nights</span>
              <span className="font-medium">{nights}</span>
            </div>
          </div>

          <div className="border-t pt-4 space-y-2">
            <h3 className="font-semibold mb-3">Charges</h3>
            <div className="flex justify-between text-sm">
              <span>Room charges ({nights} nights × ${guestData.room.rate_per_night})</span>
              <span>${roomCharges.toFixed(2)}</span>
            </div>
            {guestData.vehicle && (
              <div className="flex justify-between text-sm">
                <span>Parking charges ({nights} nights × $20)</span>
                <span>${parkingCharges.toFixed(2)}</span>
              </div>
            )}
            <div className="flex justify-between text-sm">
              <span>Tax (10%)</span>
              <span>${tax.toFixed(2)}</span>
            </div>
            <div className="flex justify-between font-bold text-lg border-t pt-2 mt-2">
              <span>Total</span>
              <span>${total.toFixed(2)}</span>
            </div>
          </div>

          <div className="flex gap-3">
            <Button 
              className="flex-1 bg-blue-600 hover:bg-blue-700"
              onClick={() => checkoutMutation.mutate()}
              disabled={checkoutMutation.isPending}
            >
              Confirm Checkout
            </Button>
            <Button 
              variant="outline" 
              className="flex-1"
              onClick={() => setGuestData(null)}
            >
              Cancel
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <LogOut className="w-6 h-6" />
          Check Out
        </CardTitle>
        <CardDescription>Enter your access code to checkout</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={(e) => { e.preventDefault(); lookupMutation.mutate(); }} className="space-y-4">
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

          <Button 
            type="submit" 
            className="w-full bg-blue-600 hover:bg-blue-700"
            disabled={lookupMutation.isPending}
          >
            {lookupMutation.isPending ? 'Looking up...' : 'Continue'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}