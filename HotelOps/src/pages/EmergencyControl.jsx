import React, { useState } from 'react';
import { db } from '../components/dataClient';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from "../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "../components/ui/alert";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { ArrowLeft, AlertTriangle, Shield, Lock, Unlock } from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../utils';
import { toast } from 'sonner';

export default function EmergencyControl() {
  const queryClient = useQueryClient();
  const [showPasswordPrompt, setShowPasswordPrompt] = useState(false);
  const [password, setPassword] = useState('');

  const { data: elevators = [] } = useQuery({
    queryKey: ['elevators'],
    queryFn: () => db.entities.Elevator.list()
  });

  // Derive lockdown state from actual elevator data (persisted in DB)
  const systemLockdown = elevators.some(e => e.emergency_mode);

  const { data: parkingSpots = [] } = useQuery({
    queryKey: ['parking-spots'],
    queryFn: () => db.entities.ParkingSpot.list()
  });

  const { data: accessPasses = [] } = useQuery({
    queryKey: ['access-passes'],
    queryFn: () => db.entities.AccessPass.list()
  });

  const handleSystemLockdown = async () => {
    // If activating lockdown, just do it
    if (!systemLockdown) {
      try {
        const elevatorPromises = elevators.map(elevator =>
          db.entities.Elevator.update(elevator.id, {
            emergency_mode: true,
            status: 'emergency'
          })
        );

        const passPromises = accessPasses.map(pass =>
          db.entities.AccessPass.update(pass.id, {
            status: 'suspended'
          })
        );

        await Promise.all([...elevatorPromises, ...passPromises]);

        queryClient.invalidateQueries({ queryKey: ['elevators'] });
        queryClient.invalidateQueries({ queryKey: ['access-passes'] });

          toast.success('System lockdown activated');
      } catch (error) {
        toast.error('Failed to activate system lockdown');
      }
    } else {
      // If deactivating, show password prompt
      setShowPasswordPrompt(true);
    }
  };

  const handleDeactivateLockdown = async () => {
    if (password !== 'emergency123') {
      toast.error('Incorrect password');
      return;
    }

    try {
      // Fetch all suspended passes fresh to ensure we get all of them
      const suspendedPasses = await db.entities.AccessPass.filter({ status: 'suspended' });

      const elevatorPromises = elevators.map(elevator =>
        db.entities.Elevator.update(elevator.id, {
          emergency_mode: false,
          status: 'idle'
        })
      );

      const passPromises = suspendedPasses.map(pass =>
        db.entities.AccessPass.update(pass.id, {
          status: 'active'
        })
      );

      await Promise.all([...elevatorPromises, ...passPromises]);

      setShowPasswordPrompt(false);
      setPassword('');
      await queryClient.invalidateQueries({ queryKey: ['elevators'] });
      await queryClient.invalidateQueries({ queryKey: ['access-passes'] });
      
      toast.success('System lockdown deactivated');
    } catch (error) {
      toast.error('Failed to deactivate system lockdown');
    }
  };

  const handleElevatorEmergencyOverride = async (elevatorId, activate) => {
    try {
      await db.entities.Elevator.update(elevatorId, {
        emergency_mode: activate,
        status: activate ? 'emergency' : 'idle'
      });
      queryClient.invalidateQueries({ queryKey: ['elevators'] });
      toast.success(`Elevator emergency ${activate ? 'activated' : 'deactivated'}`);
    } catch (error) {
      toast.error('Failed to update elevator');
    }
  };

  const emergencyElevators = elevators.filter(e => e.emergency_mode || e.status === 'emergency');

  return (
    <div className="min-h-screen bg-slate-100">
      <div className="bg-red-900 text-white p-6">
        <div className="max-w-7xl mx-auto">
          <Link to={createPageUrl('Dashboard')}>
            <Button variant="ghost" className="text-white mb-4">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Dashboard
            </Button>
          </Link>
          <div className="flex items-center gap-3">
            <Shield className="w-10 h-10" />
            <div>
              <h1 className="text-3xl font-bold">Emergency Control Center</h1>
              <p className="text-red-200 mt-1">System-wide emergency override and lockdown simulation</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-6 space-y-6">
        {systemLockdown && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>SYSTEM LOCKDOWN ACTIVE</AlertTitle>
            <AlertDescription>
              All elevators in emergency mode. All access passes suspended. Parking gates locked.
            </AlertDescription>
          </Alert>
        )}

        {/* System-Wide Lockdown */}
        <Card className="border-4 border-red-500">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span className="flex items-center gap-2">
                <AlertTriangle className="w-6 h-6" />
                System-Wide Emergency Lockdown
              </span>
              {systemLockdown && (
                <Badge variant="destructive" className="text-lg px-4 py-1">
                  ACTIVE
                </Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-slate-600 mb-4">
              Activate full system lockdown: All elevators enter emergency mode, all access passes are suspended,
              and parking gates are locked. Use only in critical emergency situations.
            </p>
            
            {showPasswordPrompt ? (
              <div className="space-y-4">
                <Alert variant="destructive">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    Enter password to deactivate system lockdown
                  </AlertDescription>
                </Alert>
                <div className="space-y-2">
                  <Label htmlFor="password">Admin Password</Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="Enter password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleDeactivateLockdown()}
                  />
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setShowPasswordPrompt(false);
                      setPassword('');
                    }}
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                  <Button
                    variant="destructive"
                    onClick={handleDeactivateLockdown}
                    className="flex-1"
                  >
                    Deactivate Lockdown
                  </Button>
                </div>
              </div>
            ) : (
              <Button
                variant={systemLockdown ? "outline" : "destructive"}
                size="lg"
                onClick={handleSystemLockdown}
                className="w-full"
              >
                {systemLockdown ? (
                  <>
                    <Unlock className="w-5 h-5 mr-2" />
                    Deactivate System Lockdown
                  </>
                ) : (
                  <>
                    <Lock className="w-5 h-5 mr-2" />
                    Activate System Lockdown
                  </>
                )}
              </Button>
            )}
          </CardContent>
        </Card>

        {/* Elevator Emergency Override */}
        <Card>
          <CardHeader>
            <CardTitle>Individual Elevator Emergency Override</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {elevators.map((elevator) => (
                <div
                  key={elevator.id}
                  className={`p-4 border-2 rounded-lg ${
                    elevator.emergency_mode ? 'border-red-500 bg-red-50' : 'border-slate-200'
                  }`}
                >
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-semibold">{elevator.elevator_name}</h3>
                    {elevator.emergency_mode && (
                      <Badge variant="destructive">EMERGENCY</Badge>
                    )}
                  </div>
                  <p className="text-sm text-slate-600 mb-3">
                    Floor: {elevator.current_floor || 0} | Status: {elevator.status}
                  </p>
                  <Button
                    variant={elevator.emergency_mode ? "outline" : "destructive"}
                    className="w-full"
                    onClick={() => handleElevatorEmergencyOverride(elevator.id, !elevator.emergency_mode)}
                    disabled={systemLockdown && elevator.emergency_mode}
                  >
                    {elevator.emergency_mode ? 'Deactivate' : 'Activate'} Emergency
                  </Button>
                  {systemLockdown && elevator.emergency_mode && (
                    <p className="text-xs text-red-600 mt-2 text-center">
                      Disabled during system lockdown
                    </p>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Emergency Status Summary */}
        <Card>
          <CardHeader>
            <CardTitle>Emergency Status Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center p-4 bg-slate-50 rounded-lg">
                <p className="text-sm text-slate-600">Elevators in Emergency</p>
                <p className="text-3xl font-bold text-red-600">{emergencyElevators.length}</p>
                <p className="text-xs text-slate-500">of {elevators.length} total</p>
              </div>
              <div className="text-center p-4 bg-slate-50 rounded-lg">
                <p className="text-sm text-slate-600">Suspended Access Passes</p>
                <p className="text-3xl font-bold text-yellow-600">
                  {accessPasses.filter(p => p.status === 'suspended').length}
                </p>
                <p className="text-xs text-slate-500">of {accessPasses.length} total</p>
              </div>
              <div className="text-center p-4 bg-slate-50 rounded-lg">
                <p className="text-sm text-slate-600">System Status</p>
                <p className="text-3xl font-bold">
                  {systemLockdown ? (
                    <span className="text-red-600">LOCKED</span>
                  ) : (
                    <span className="text-green-600">NORMAL</span>
                  )}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}