import React, { useState } from 'react';
import { db } from '../components/dataClient';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from "../components/ui/button";
import { ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../utils';
import { toast } from 'sonner';
import CheckInForm from '../components/guest/CheckInForm';

export default function CheckIn() {
  const queryClient = useQueryClient();
  const [isProcessing, setIsProcessing] = useState(false);

  const { data: rooms = [] } = useQuery({
    queryKey: ['rooms'],
    queryFn: () => db.entities.Room.list()
  });

  const { data: parkingSpots = [] } = useQuery({
    queryKey: ['parking-spots'],
    queryFn: () => db.entities.ParkingSpot.list()
  });

  const { data: floors = [] } = useQuery({
    queryKey: ['floors'],
    queryFn: () => db.entities.Floor.list()
  });

  const handleCheckIn = async (formData) => {
    setIsProcessing(true);
    try {
      // 1. Create guest
      const guest = await db.entities.Guest.create({
        first_name: formData.firstName,
        last_name: formData.lastName,
        email: formData.email,
        phone: formData.phone,
        vip_status: formData.vipStatus,
        status: 'checked_in'
      });

      // 2. Get room and floor details
      const room = rooms.find(r => r.id === formData.roomId);
      const floor = floors.find(f => f.id === room.floor_id);

      // 3. Create reservation
      const checkInDate = new Date();
      const checkOutDate = new Date();
      checkOutDate.setDate(checkOutDate.getDate() + 1);

      const reservation = await db.entities.Reservation.create({
        guest_id: guest.id,
        room_id: formData.roomId,
        check_in_date: checkInDate.toISOString(),
        check_out_date: checkOutDate.toISOString(),
        actual_check_in: checkInDate.toISOString(),
        status: 'checked_in',
        number_of_guests: 1
      });

      // 4. Update room status
      await db.entities.Room.update(formData.roomId, {
        status: 'occupied'
      });

      let vehicle = null;
      let accessPassData = {
        guest_id: guest.id,
        pass_code: `PASS-${Date.now()}`,
        valid_from: checkInDate.toISOString(),
        valid_until: checkOutDate.toISOString(),
        allowed_floors: [room.floor_id],
        parking_levels: [],
        vip_priority: formData.vipStatus,
        status: 'active'
      };

      // 5. If vehicle, create vehicle and parking
      if (formData.hasVehicle && formData.licensePlate) {
        vehicle = await db.entities.Vehicle.create({
          guest_id: guest.id,
          parking_spot_id: formData.parkingSpotId,
          license_plate: formData.licensePlate,
          make: formData.vehicleMake,
          model: formData.vehicleModel,
          check_in_time: checkInDate.toISOString()
        });

        // Update parking spot
        const parkingSpot = parkingSpots.find(p => p.id === formData.parkingSpotId);
        await db.entities.ParkingSpot.update(formData.parkingSpotId, {
          status: 'occupied',
          vehicle_id: vehicle.id
        });

        accessPassData.vehicle_id = vehicle.id;
        accessPassData.parking_levels = [parkingSpot.level];
      }

      // 6. Create access pass
      const accessPass = await db.entities.AccessPass.create(accessPassData);

      // 7. Create initial invoice
      await db.entities.Invoice.create({
        reservation_id: reservation.id,
        guest_id: guest.id,
        invoice_number: `INV-${Date.now()}`,
        invoice_date: checkInDate.toISOString(),
        room_charges: room.rate_per_night,
        parking_charges: 0,
        elevator_service_charges: 0,
        other_charges: 0,
        tax_amount: 0,
        total_amount: room.rate_per_night,
        status: 'draft'
      });

      // Invalidate queries
      queryClient.invalidateQueries(['guests']);
      queryClient.invalidateQueries(['rooms']);
      queryClient.invalidateQueries(['parking-spots']);
      queryClient.invalidateQueries(['vehicles']);

      toast.success('Guest checked in successfully!');
      
      // Navigate back to dashboard
      window.location.href = createPageUrl('Dashboard');
    } catch (error) {
      console.error('Check-in error:', error);
      toast.error('Failed to complete check-in');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100">
      <div className="bg-slate-900 text-white p-6">
        <div className="max-w-4xl mx-auto">
          <Link to={createPageUrl('Dashboard')}>
            <Button variant="ghost" className="text-white mb-4">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Dashboard
            </Button>
          </Link>
          <h1 className="text-3xl font-bold">Guest Check-In</h1>
          <p className="text-slate-300 mt-1">Complete guest registration and room assignment</p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto p-6">
        <CheckInForm
          rooms={rooms}
          parkingSpots={parkingSpots}
          floors={floors}
          onSubmit={handleCheckIn}
          isProcessing={isProcessing}
        />
      </div>
    </div>
  );
}