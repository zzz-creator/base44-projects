import React from 'react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '../utils';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Building2, UserCircle, Shield, Users, CheckCircle2 } from 'lucide-react';

export default function Home() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900">
      <div className="max-w-6xl mx-auto px-6 py-20">
        <div className="text-center mb-16">
          <Building2 className="w-20 h-20 mx-auto mb-4 text-blue-400" />
          <h1 className="text-5xl font-bold text-white mb-4">Welcome to HotelOps</h1>
          <p className="text-xl text-blue-200">Enterprise Hotel Operations Platform</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <Card className="bg-white/95 backdrop-blur hover:shadow-2xl transition-all cursor-pointer" 
                onClick={() => navigate(createPageUrl('GuestKiosk'))}>
            <CardHeader>
              <CardTitle className="flex items-center gap-3 text-2xl">
                <UserCircle className="w-8 h-8 text-blue-600" />
                Guest Services
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-slate-600">Access our self-service kiosk for:</p>
              <ul className="space-y-2 text-slate-700">
                <li>✓ Self-service check-in</li>
                <li>✓ Elevator requests</li>
                <li>✓ Parking information</li>
                <li>✓ Room services</li>
              </ul>
              <Button className="w-full bg-blue-600 hover:bg-blue-700 mt-4">
                Access Guest Kiosk
              </Button>
            </CardContent>
          </Card>

          <Card className="bg-white/95 backdrop-blur hover:shadow-2xl transition-all cursor-pointer"
                onClick={() => navigate(createPageUrl('StaffPortal'))}>
            <CardHeader>
              <CardTitle className="flex items-center gap-3 text-2xl">
                <Users className="w-8 h-8 text-purple-600" />
                Staff Portal
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-slate-600">Staff management access:</p>
              <ul className="space-y-2 text-slate-700">
                <li>✓ Task management</li>
                <li>✓ Real-time requests</li>
                <li>✓ Guest profiles</li>
                <li>✓ Performance tracking</li>
              </ul>
              <Button className="w-full bg-purple-600 hover:bg-purple-700 mt-4">
                Staff Access
              </Button>
            </CardContent>
          </Card>

          <Card className="bg-white/95 backdrop-blur hover:shadow-2xl transition-all cursor-pointer"
                onClick={() => navigate(createPageUrl('AdminLogin'))}>
            <CardHeader>
              <CardTitle className="flex items-center gap-3 text-2xl">
                <Shield className="w-8 h-8 text-indigo-600" />
                Admin Portal
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-slate-600">Management only:</p>
              <ul className="space-y-2 text-slate-700">
                <li>✓ Operations dashboard</li>
                <li>✓ Analytics & reporting</li>
                <li>✓ System controls</li>
                <li>✓ Marketing campaigns</li>
              </ul>
              <Button className="w-full bg-indigo-600 hover:bg-indigo-700 mt-4">
                Admin Login
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}