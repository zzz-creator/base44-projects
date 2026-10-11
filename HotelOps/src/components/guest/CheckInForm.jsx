import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../components/ui/select";
import { Checkbox } from "../../components/ui/checkbox";
import { Loader2 } from 'lucide-react';

export default function CheckInForm({ 
  rooms = [], 
  parkingSpots = [], 
  floors = [],
  onSubmit,
  isProcessing = false 
}) {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    roomId: '',
    hasVehicle: false,
    licensePlate: '',
    vehicleMake: '',
    vehicleModel: '',
    parkingSpotId: '',
    vipStatus: false
  });

  const availableRooms = rooms.filter(r => r.status === 'available');
  const availableParking = parkingSpots.filter(p => p.status === 'available');

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Guest Check-In</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="firstName">First Name *</Label>
              <Input
                id="firstName"
                value={formData.firstName}
                onChange={(e) => setFormData({...formData, firstName: e.target.value})}
                required
              />
            </div>
            <div>
              <Label htmlFor="lastName">Last Name *</Label>
              <Input
                id="lastName"
                value={formData.lastName}
                onChange={(e) => setFormData({...formData, lastName: e.target.value})}
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="email">Email *</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({...formData, email: e.target.value})}
                required
              />
            </div>
            <div>
              <Label htmlFor="phone">Phone</Label>
              <Input
                id="phone"
                value={formData.phone}
                onChange={(e) => setFormData({...formData, phone: e.target.value})}
              />
            </div>
          </div>

          <div>
            <Label htmlFor="roomId">Room *</Label>
            <Select value={formData.roomId} onValueChange={(value) => setFormData({...formData, roomId: value})}>
              <SelectTrigger>
                <SelectValue placeholder="Select a room" />
              </SelectTrigger>
              <SelectContent>
                {availableRooms.map((room) => (
                  <SelectItem key={room.id} value={room.id}>
                    {room.room_number} - {room.room_type} (${room.rate_per_night}/night)
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="vipStatus"
              checked={formData.vipStatus}
              onCheckedChange={(checked) => setFormData({...formData, vipStatus: checked})}
            />
            <Label htmlFor="vipStatus" className="cursor-pointer">VIP Guest</Label>
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="hasVehicle"
              checked={formData.hasVehicle}
              onCheckedChange={(checked) => setFormData({...formData, hasVehicle: checked})}
            />
            <Label htmlFor="hasVehicle" className="cursor-pointer">Guest has vehicle</Label>
          </div>

          {formData.hasVehicle && (
            <div className="border-l-4 border-blue-500 pl-4 space-y-4">
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="licensePlate">License Plate *</Label>
                  <Input
                    id="licensePlate"
                    value={formData.licensePlate}
                    onChange={(e) => setFormData({...formData, licensePlate: e.target.value})}
                    required={formData.hasVehicle}
                  />
                </div>
                <div>
                  <Label htmlFor="vehicleMake">Make</Label>
                  <Input
                    id="vehicleMake"
                    value={formData.vehicleMake}
                    onChange={(e) => setFormData({...formData, vehicleMake: e.target.value})}
                  />
                </div>
                <div>
                  <Label htmlFor="vehicleModel">Model</Label>
                  <Input
                    id="vehicleModel"
                    value={formData.vehicleModel}
                    onChange={(e) => setFormData({...formData, vehicleModel: e.target.value})}
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="parkingSpotId">Parking Spot *</Label>
                <Select value={formData.parkingSpotId} onValueChange={(value) => setFormData({...formData, parkingSpotId: value})}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select parking spot" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableParking.map((spot) => (
                      <SelectItem key={spot.id} value={spot.id}>
                        {spot.spot_number} - {spot.level} ({spot.zone})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}

          <Button type="submit" className="w-full" disabled={isProcessing}>
            {isProcessing ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Processing Check-In...
              </>
            ) : (
              'Complete Check-In'
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}