import React, { useState } from 'react';
import { db } from '../dataClient';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Switch } from '../../components/ui/switch';
import { DoorClosed, Sparkles, Thermometer, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';

export default function RoomControls() {
  const queryClient = useQueryClient();
  const [accessCode, setAccessCode] = useState('');
  const [guestData, setGuestData] = useState(null);
  const [controls, setControls] = useState(null);

  const lookupMutation = useMutation({
    mutationFn: async () => {
      const passes = await db.entities.AccessPass.filter({ 
        pass_code: accessCode,
        status: 'active'
      });

      if (passes.length === 0) throw new Error('Invalid access code');

      const pass = passes[0];
      const guests = await db.entities.Guest.list();
      const guest = guests.find(g => g.id === pass.guest_id);
      
      const reservations = await db.entities.Reservation.filter({ 
        guest_id: pass.guest_id,
        status: 'checked_in'
      });

      if (reservations.length === 0) throw new Error('No active reservation');

      const reservation = reservations[0];
      const rooms = await db.entities.Room.list();
      const room = rooms.find(r => r.id === reservation.room_id);

      const existingControls = await db.entities.RoomControl.filter({ room_id: room.id });
      
      return { guest, reservation, room, controls: existingControls[0] || null };
    },
    onSuccess: (data) => {
      setGuestData(data);
      setControls({
        do_not_disturb: data.controls?.do_not_disturb || false,
        make_up_room: data.controls?.make_up_room || false,
        temperature_preference: data.controls?.temperature_preference || 72
      });
    },
    onError: (error) => {
      toast.error(error.message);
    }
  });

  const updateControlsMutation = useMutation({
    mutationFn: async (updates) => {
      const controlData = {
        room_id: guestData.room.id,
        guest_id: guestData.guest.id,
        ...controls,
        ...updates,
        last_updated: new Date().toISOString()
      };

      if (guestData.controls) {
        await db.entities.RoomControl.update(guestData.controls.id, controlData);
      } else {
        await db.entities.RoomControl.create(controlData);
      }

      return controlData;
    },
    onSuccess: () => {
      queryClient.invalidateQueries();
      toast.success('Room settings updated!');
    },
    onError: () => {
      toast.error('Failed to update settings');
    }
  });

  const handleToggle = (field, value) => {
    setControls({ ...controls, [field]: value });
    updateControlsMutation.mutate({ [field]: value });
  };

  if (guestData && controls) {
    return (
      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DoorClosed className="w-6 h-6" />
            Room Controls
          </CardTitle>
          <CardDescription>Room {guestData.room.room_number}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <Card className="border-2">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-red-100 flex items-center justify-center">
                    <DoorClosed className="w-5 h-5 text-red-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold">Do Not Disturb</h3>
                    <p className="text-sm text-slate-600">Prevent housekeeping from entering</p>
                  </div>
                </div>
                <Switch
                  checked={controls.do_not_disturb}
                  onCheckedChange={(checked) => handleToggle('do_not_disturb', checked)}
                />
              </div>
            </CardContent>
          </Card>

          <Card className="border-2">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                    <Sparkles className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold">Make Up Room</h3>
                    <p className="text-sm text-slate-600">Request room cleaning service</p>
                  </div>
                </div>
                <Switch
                  checked={controls.make_up_room}
                  onCheckedChange={(checked) => handleToggle('make_up_room', checked)}
                />
              </div>
            </CardContent>
          </Card>

          <Card className="border-2">
            <CardContent className="p-4">
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-orange-100 flex items-center justify-center">
                    <Thermometer className="w-5 h-5 text-orange-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold">Temperature Preference</h3>
                    <p className="text-sm text-slate-600">Set your preferred room temperature</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <Input
                    type="number"
                    min="60"
                    max="80"
                    value={controls.temperature_preference}
                    onChange={(e) => setControls({ ...controls, temperature_preference: parseInt(e.target.value) })}
                    className="w-24"
                  />
                  <span className="text-2xl font-bold">{controls.temperature_preference}°F</span>
                  <Button 
                    onClick={() => updateControlsMutation.mutate({ temperature_preference: controls.temperature_preference })}
                    size="sm"
                  >
                    Update
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="bg-slate-50 rounded-lg p-4 text-sm text-slate-600">
            <p>💡 These settings will be applied immediately. Housekeeping will respect your preferences.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <DoorClosed className="w-6 h-6" />
          Room Controls
        </CardTitle>
        <CardDescription>Manage your room settings</CardDescription>
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
          <Button type="submit" className="w-full" disabled={lookupMutation.isPending}>
            Continue
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}