import React, { useState } from 'react';
import { db } from '../dataClient';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../components/ui/card';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { Car, MapPin, Zap, Check, CreditCard } from 'lucide-react';
import { toast } from 'sonner';

export default function ParkingInfo() {
  const [licensePlate, setLicensePlate] = useState('');
  const [vehicleInfo, setVehicleInfo] = useState(null);
  const [accessCode, setAccessCode] = useState('');
  const [showAccessConfirmation, setShowAccessConfirmation] = useState(false);

  const { data: parkingSpots = [] } = useQuery({
    queryKey: ['parking-spots'],
    queryFn: () => db.entities.ParkingSpot.list()
  });

  const verifyAccessMutation = useMutation({
    mutationFn: async (code) => {
      const accessPasses = await db.entities.AccessPass.filter({ 
        pass_code: code,
        status: 'active'
      });
      
      if (accessPasses.length === 0) {
        throw new Error('Invalid access code');
      }
      
      const pass = accessPasses[0];
      
      if (!pass.vehicle_id) {
        throw new Error('No parking assigned to this access code');
      }
      
      const vehicles = await db.entities.Vehicle.filter({ id: pass.vehicle_id });
      if (vehicles.length === 0) {
        throw new Error('Vehicle not found');
      }
      
      const vehicle = vehicles[0];
      const spot = parkingSpots.find(s => s.id === vehicle.parking_spot_id);
      
      return { vehicle, spot };
    },
    onSuccess: (data) => {
      setVehicleInfo(data);
      setShowAccessConfirmation(true);
      toast.success('Access verified! Proceed to your parking spot.');
    },
    onError: (error) => {
      toast.error(error.message || 'Access verification failed');
    }
  });

  const handleSearch = async (e) => {
    e.preventDefault();
    
    const vehicles = await db.entities.Vehicle.filter({ 
      license_plate: licensePlate.toUpperCase()
    });

    if (vehicles.length > 0) {
      const vehicle = vehicles[0];
      const spot = parkingSpots.find(s => s.id === vehicle.parking_spot_id);
      setVehicleInfo({ vehicle, spot });
      toast.success('Vehicle found!');
    } else {
      setVehicleInfo(null);
      toast.error('Vehicle not found');
    }
  };

  const handleAccessCardTap = (e) => {
    e.preventDefault();
    if (!accessCode) {
      toast.error('Please enter your access code');
      return;
    }
    verifyAccessMutation.mutate(accessCode);
  };

  const availableSpots = parkingSpots.filter(s => s.status === 'available');
  const occupancyRate = ((parkingSpots.length - availableSpots.length) / parkingSpots.length * 100).toFixed(0);

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {showAccessConfirmation && vehicleInfo && (
        <Card className="border-green-500 border-2 bg-green-50">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                <Check className="w-8 h-8 text-green-600" />
              </div>
              <div className="flex-1">
                <h3 className="text-xl font-bold text-green-900">Access Confirmed!</h3>
                <p className="text-sm text-green-700">Please proceed to your reserved parking spot</p>
              </div>
            </div>
            <div className="mt-4 bg-white rounded-lg p-4">
              <p className="text-sm text-slate-600 mb-2">Your Reserved Parking Spot:</p>
              <p className="text-2xl font-bold text-blue-600">Spot {vehicleInfo.spot?.spot_number}</p>
              <p className="text-sm text-slate-600">Level {vehicleInfo.spot?.level} • {vehicleInfo.spot?.zone} zone</p>
            </div>
            <Button 
              variant="outline" 
              className="w-full mt-4"
              onClick={() => {
                setShowAccessConfirmation(false);
                setAccessCode('');
              }}
            >
              Close
            </Button>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="w-6 h-6" />
            Parking Access
          </CardTitle>
          <CardDescription>Tap your access card to view your parking assignment</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleAccessCardTap} className="space-y-4">
            <div className="flex gap-4">
              <div className="flex-1 space-y-2">
                <Label htmlFor="access_code">Access Code</Label>
                <Input
                  id="access_code"
                  value={accessCode}
                  onChange={(e) => setAccessCode(e.target.value.toUpperCase())}
                  placeholder="Enter your access code"
                  maxLength={6}
                  required
                />
              </div>
              <div className="flex items-end">
                <Button 
                  type="submit" 
                  className="bg-green-600 hover:bg-green-700"
                  disabled={verifyAccessMutation.isPending}
                >
                  {verifyAccessMutation.isPending ? 'Verifying...' : 'Verify Access'}
                </Button>
              </div>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Car className="w-6 h-6" />
            Find Your Vehicle
          </CardTitle>
          <CardDescription>Enter your license plate to locate your parking spot</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSearch} className="space-y-4">
            <div className="flex gap-4">
              <div className="flex-1 space-y-2">
                <Label htmlFor="license">License Plate</Label>
                <Input
                  id="license"
                  value={licensePlate}
                  onChange={(e) => setLicensePlate(e.target.value.toUpperCase())}
                  placeholder="ABC-1234"
                  required
                />
              </div>
              <div className="flex items-end">
                <Button type="submit" className="bg-blue-600 hover:bg-blue-700">
                  Find Vehicle
                </Button>
              </div>
            </div>
          </form>

          {vehicleInfo && !showAccessConfirmation && (
            <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center">
                  <MapPin className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="font-bold text-lg">Vehicle Located!</h3>
                  <p className="text-sm text-slate-600">Your parking information</p>
                </div>
              </div>
              <div className="space-y-2 text-sm">
                <p><strong>License Plate:</strong> {vehicleInfo.vehicle.license_plate}</p>
                <p><strong>Parking Spot:</strong> {vehicleInfo.spot?.spot_number}</p>
                <p><strong>Level:</strong> {vehicleInfo.spot?.level}</p>
                <p><strong>Zone:</strong> {vehicleInfo.spot?.zone}</p>
                {vehicleInfo.spot?.has_charging && (
                  <Badge className="bg-green-600">
                    <Zap className="w-3 h-3 mr-1" />
                    EV Charging Available
                  </Badge>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Parking Availability</CardTitle>
          <CardDescription>Real-time parking status</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="p-4 bg-slate-50 rounded-lg text-center">
              <div className="text-3xl font-bold text-slate-900">{availableSpots.length}</div>
              <div className="text-xs text-slate-600">Available Spots</div>
            </div>
            <div className="p-4 bg-slate-50 rounded-lg text-center">
              <div className="text-3xl font-bold text-slate-900">{parkingSpots.length}</div>
              <div className="text-xs text-slate-600">Total Spots</div>
            </div>
            <div className="p-4 bg-slate-50 rounded-lg text-center">
              <div className="text-3xl font-bold text-blue-600">{occupancyRate}%</div>
              <div className="text-xs text-slate-600">Occupancy</div>
            </div>
            <div className="p-4 bg-slate-50 rounded-lg text-center">
              <div className="text-3xl font-bold text-green-600">
                {parkingSpots.filter(s => s.has_charging && s.status === 'available').length}
              </div>
              <div className="text-xs text-slate-600">EV Chargers</div>
            </div>
          </div>

          <div className="space-y-2">
            <h4 className="font-semibold text-sm">Available by Zone</h4>
            <div className="flex flex-wrap gap-2">
              {['standard', 'vip', 'electric', 'handicap', 'compact'].map((zone) => {
                const count = availableSpots.filter(s => s.zone === zone).length;
                return (
                  <Badge key={zone} variant={count > 0 ? 'default' : 'secondary'}>
                    {zone}: {count}
                  </Badge>
                );
              })}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}