import React, { useState } from 'react';
import { base44 } from '../../api/base44Client';
import { useMutation } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Badge } from '../../components/ui/badge';
import { Key, Smartphone, Wifi, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';

export default function DigitalKey() {
  const [accessCode, setAccessCode] = useState('');
  const [keyData, setKeyData] = useState(null);

  const lookupKey = useMutation({
    mutationFn: async () => {
      const passes = await base44.entities.AccessPass.filter({ 
        pass_code: accessCode,
        status: 'active'
      });

      if (passes.length === 0) throw new Error('Invalid access code');

      const pass = passes[0];
      const guests = await base44.entities.Guest.list();
      const guest = guests.find(g => g.id === pass.guest_id);
      
      const reservations = await base44.entities.Reservation.filter({ 
        guest_id: pass.guest_id,
        status: 'checked_in'
      });

      if (reservations.length === 0) throw new Error('No active reservation found');

      const reservation = reservations[0];
      const rooms = await base44.entities.Room.list();
      const room = rooms.find(r => r.id === reservation.room_id);
      
      const floors = await base44.entities.Floor.list();
      const floor = floors.find(f => f.id === room.floor_id);

      return { pass, guest, reservation, room, floor };
    },
    onSuccess: (data) => {
      setKeyData(data);
      toast.success('Digital key activated!');
    },
    onError: (error) => {
      toast.error(error.message);
    }
  });

  if (keyData) {
    return (
      <Card className="max-w-2xl mx-auto">
        <CardHeader className="text-center">
          <div className="mx-auto w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
            <Key className="w-8 h-8 text-blue-600" />
          </div>
          <CardTitle className="text-2xl text-blue-600">Digital Key Active</CardTitle>
          <CardDescription>Your mobile key is ready to use</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="bg-gradient-to-br from-blue-600 to-blue-800 rounded-xl p-6 text-white">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-sm opacity-80">Room Number</p>
                <p className="text-3xl font-bold">{keyData.room.room_number}</p>
              </div>
              <Smartphone className="w-12 h-12 opacity-80" />
            </div>
            
            <div className="space-y-2 text-sm">
              <p><strong>Guest:</strong> {keyData.guest.first_name} {keyData.guest.last_name}</p>
              <p><strong>Access Code:</strong> <span className="text-2xl font-mono tracking-wider">{keyData.pass.pass_code}</span></p>
              <p><strong>Floor:</strong> {keyData.floor.floor_name}</p>
              {keyData.pass.vip_priority && (
                <Badge className="bg-yellow-500 hover:bg-yellow-600">
                  <CheckCircle2 className="w-3 h-3 mr-1" />
                  VIP Access
                </Badge>
              )}
            </div>
          </div>

          <div className="bg-slate-50 rounded-lg p-4 space-y-3">
            <h3 className="font-semibold flex items-center gap-2">
              <Wifi className="w-4 h-4" />
              How to Use Your Digital Key
            </h3>
            <ul className="text-sm text-slate-600 space-y-2">
              <li>✓ Approach your room door with your phone</li>
              <li>✓ The digital key will activate automatically via Bluetooth</li>
              <li>✓ Enter your access code at the elevator panel</li>
              <li>✓ Use the code for parking gate access</li>
            </ul>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Button variant="outline" onClick={() => setKeyData(null)}>
              Close
            </Button>
            <Button onClick={() => {
              navigator.clipboard.writeText(keyData.pass.pass_code);
              toast.success('Access code copied!');
            }}>
              Copy Access Code
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
          <Key className="w-6 h-6" />
          Digital Key Access
        </CardTitle>
        <CardDescription>Access your digital room key</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={(e) => { e.preventDefault(); lookupKey.mutate(); }} className="space-y-4">
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
            disabled={lookupKey.isPending}
          >
            {lookupKey.isPending ? 'Activating...' : 'Activate Digital Key'}
          </Button>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm">
            <p className="text-slate-700">
              <strong>Note:</strong> Your access code was provided during check-in. 
              If you don't have it, please visit the front desk.
            </p>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}