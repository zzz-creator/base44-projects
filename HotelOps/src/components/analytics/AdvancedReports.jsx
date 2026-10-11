import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../../components/ui/card";
import { Button } from '../../components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../../components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../components/ui/select";
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { FileText, Download, Calendar, TrendingUp } from 'lucide-react';
import { toast } from 'sonner';

export default function AdvancedReports({ analyticsData, domain = 'overall' }) {
  const [timeRange, setTimeRange] = useState('7d');
  const [reportType, setReportType] = useState('overview');

  const handleExport = (format) => {
    toast.success(`Exporting report as ${format.toUpperCase()}...`);
    // In a real implementation, this would generate and download the report
  };

  // Mock data - in real implementation, this would come from analyticsData prop
  const revenueData = [
    { date: 'Mon', rooms: 4500, parking: 850, services: 320 },
    { date: 'Tue', rooms: 5200, parking: 920, services: 410 },
    { date: 'Wed', rooms: 4800, parking: 880, services: 390 },
    { date: 'Thu', rooms: 5500, parking: 1100, services: 480 },
    { date: 'Fri', rooms: 6200, parking: 1250, services: 620 },
    { date: 'Sat', rooms: 7100, parking: 1400, services: 780 },
    { date: 'Sun', rooms: 6800, parking: 1350, services: 690 }
  ];

  const utilizationData = [
    { name: 'Rooms', value: 78 },
    { name: 'Parking', value: 65 },
    { name: 'Elevators', value: 92 }
  ];

  const trafficPatterns = [
    { hour: '6am', guests: 12, vehicles: 5 },
    { hour: '9am', guests: 45, vehicles: 28 },
    { hour: '12pm', guests: 68, vehicles: 42 },
    { hour: '3pm', guests: 52, vehicles: 35 },
    { hour: '6pm', guests: 78, vehicles: 58 },
    { hour: '9pm', guests: 34, vehicles: 22 },
    { hour: '12am', guests: 8, vehicles: 3 }
  ];

  const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444'];

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5" />
              Advanced Analytics & Reports
            </CardTitle>
            <CardDescription>Comprehensive operational insights</CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Select value={timeRange} onValueChange={setTimeRange}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="24h">Last 24 Hours</SelectItem>
                <SelectItem value="7d">Last 7 Days</SelectItem>
                <SelectItem value="30d">Last 30 Days</SelectItem>
                <SelectItem value="90d">Last 90 Days</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" size="sm" onClick={() => handleExport('pdf')}>
              <Download className="w-4 h-4 mr-2" />
              Export PDF
            </Button>
            <Button variant="outline" size="sm" onClick={() => handleExport('csv')}>
              <Download className="w-4 h-4 mr-2" />
              Export CSV
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <Tabs value={reportType} onValueChange={setReportType}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="revenue">Revenue Analysis</TabsTrigger>
            <TabsTrigger value="traffic">Traffic Patterns</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4 mt-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <div>
                <h3 className="text-sm font-semibold mb-3">Revenue by Department</h3>
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={revenueData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="rooms" fill="#3b82f6" name="Rooms" />
                    <Bar dataKey="parking" fill="#10b981" name="Parking" />
                    <Bar dataKey="services" fill="#f59e0b" name="Services" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div>
                <h3 className="text-sm font-semibold mb-3">Resource Utilization</h3>
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart>
                    <Pie
                      data={utilizationData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, value }) => `${name}: ${value}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {utilizationData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="revenue" className="space-y-4 mt-4">
            <h3 className="text-sm font-semibold mb-3">7-Day Revenue Trend</h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={revenueData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="rooms" stroke="#3b82f6" strokeWidth={2} name="Rooms Revenue" />
                <Line type="monotone" dataKey="parking" stroke="#10b981" strokeWidth={2} name="Parking Revenue" />
                <Line type="monotone" dataKey="services" stroke="#f59e0b" strokeWidth={2} name="Services Revenue" />
              </LineChart>
            </ResponsiveContainer>
            <div className="grid grid-cols-3 gap-4 mt-4">
              <div className="p-4 bg-blue-50 rounded-lg">
                <div className="text-xs text-blue-600 font-medium">Total Room Revenue</div>
                <div className="text-2xl font-bold text-blue-900">
                  ${revenueData.reduce((sum, d) => sum + d.rooms, 0).toLocaleString()}
                </div>
              </div>
              <div className="p-4 bg-green-50 rounded-lg">
                <div className="text-xs text-green-600 font-medium">Total Parking Revenue</div>
                <div className="text-2xl font-bold text-green-900">
                  ${revenueData.reduce((sum, d) => sum + d.parking, 0).toLocaleString()}
                </div>
              </div>
              <div className="p-4 bg-orange-50 rounded-lg">
                <div className="text-xs text-orange-600 font-medium">Total Services Revenue</div>
                <div className="text-2xl font-bold text-orange-900">
                  ${revenueData.reduce((sum, d) => sum + d.services, 0).toLocaleString()}
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="traffic" className="space-y-4 mt-4">
            <h3 className="text-sm font-semibold mb-3">Daily Traffic Patterns</h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={trafficPatterns}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="hour" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="guests" stroke="#3b82f6" strokeWidth={2} name="Guest Traffic" />
                <Line type="monotone" dataKey="vehicles" stroke="#10b981" strokeWidth={2} name="Vehicle Traffic" />
              </LineChart>
            </ResponsiveContainer>
            <div className="grid grid-cols-2 gap-4 mt-4">
              <div className="p-4 bg-slate-50 rounded-lg">
                <div className="text-xs text-slate-600 font-medium">Peak Guest Traffic</div>
                <div className="text-xl font-bold text-slate-900">6pm - 78 guests</div>
              </div>
              <div className="p-4 bg-slate-50 rounded-lg">
                <div className="text-xs text-slate-600 font-medium">Peak Vehicle Traffic</div>
                <div className="text-xl font-bold text-slate-900">6pm - 58 vehicles</div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}