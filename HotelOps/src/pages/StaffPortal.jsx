import React, { useState } from 'react';
import { db } from '../components/dataClient';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Badge } from '../components/ui/badge';
import { Users, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '../utils';
import TaskBoard from '../components/staff/TaskBoard';
import OrdersPanel from '../components/staff/OrdersPanel';
import GuestProfiles from '../components/staff/GuestProfiles';
import AlertsPanel from '../components/staff/AlertsPanel';
import PerformanceMetrics from '../components/staff/PerformanceMetrics';

export default function StaffPortal() {
  const navigate = useNavigate();
  const [employeeId, setEmployeeId] = useState('');
  const [staffMember, setStaffMember] = useState(null);

  const { data: staffMembers = [] } = useQuery({
    queryKey: ['staff-members'],
    queryFn: () => db.entities.StaffMember.list()
  });

  const handleLogin = () => {
    const member = staffMembers.find(s => s.employee_id === employeeId);
    if (member) {
      setStaffMember(member);
    }
  };

  if (!staffMember) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-100 to-blue-50 flex items-center justify-center p-6">
        <Card className="max-w-md w-full">
          <CardHeader>
            <div className="flex items-center gap-3 mb-2">
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => navigate(createPageUrl('Home'))}
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </Button>
            </div>
            <CardTitle className="flex items-center gap-2">
              <Users className="w-6 h-6" />
              Staff Portal Login
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={(e) => { e.preventDefault(); handleLogin(); }} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="employee_id">Employee ID</Label>
                <Input
                  id="employee_id"
                  value={employeeId}
                  onChange={(e) => setEmployeeId(e.target.value)}
                  placeholder="Enter your employee ID"
                  required
                />
              </div>
              <Button type="submit" className="w-full">
                Sign In
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }

  const getStatusColor = (status) => {
    const colors = {
      on_duty: 'bg-green-100 text-green-800',
      off_duty: 'bg-slate-200 text-slate-800',
      on_break: 'bg-yellow-100 text-yellow-800'
    };
    return colors[status] || colors.off_duty;
  };

  return (
    <div className="min-h-screen bg-slate-100">
      <div className="bg-white border-b shadow-sm p-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button 
              variant="ghost" 
              onClick={() => setStaffMember(null)}
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Sign Out
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-slate-900">Staff Portal</h1>
              <p className="text-sm text-slate-600">Welcome, {staffMember.staff_name}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Badge className={getStatusColor(staffMember.status)}>
              {staffMember.status.replace('_', ' ')}
            </Badge>
            <Badge variant="outline">{staffMember.role}</Badge>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <TaskBoard staffMember={staffMember} />
            <OrdersPanel />
            <GuestProfiles />
          </div>

          <div className="space-y-6">
            <PerformanceMetrics staffMember={staffMember} />
            <AlertsPanel staffMember={staffMember} />
          </div>
        </div>
      </div>
    </div>
  );
}