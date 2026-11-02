import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '../../api/base44Client';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { Loader2, Wrench, Box, Calendar } from 'lucide-react';
import ReportExporter from './ReportExporter';

const COLORS = ['#f59e0b', '#3b82f6', '#10b981', '#8b5cf6', '#ef4444', '#ec4899', '#6366f1', '#14b8a6'];

const categoryLabels = {
  lighting: 'Lighting',
  sound: 'Sound',
  rigging: 'Rigging',
  staging: 'Staging',
  video: 'Video',
  props: 'Props',
  tools: 'Tools',
  safety: 'Safety',
  other: 'Other'
};

export default function EquipmentUsageReport({ productionId, dateRange }) {
  const { data: equipment = [], isLoading: equipLoading } = useQuery({
    queryKey: ['equipment'],
    queryFn: () => base44.entities.EquipmentAsset.list(),
  });

  const { data: schedules = [], isLoading: schedLoading } = useQuery({
    queryKey: ['equipmentSchedules'],
    queryFn: () => base44.entities.EquipmentSchedule.list(),
  });

  const { data: maintenance = [], isLoading: maintLoading } = useQuery({
    queryKey: ['maintenanceRecords'],
    queryFn: () => base44.entities.MaintenanceRecord.list(),
  });

  const { data: productions = [] } = useQuery({
    queryKey: ['productions'],
    queryFn: () => base44.entities.Production.list(),
  });

  const isLoading = equipLoading || schedLoading || maintLoading;

  // Filter schedules by production if selected
  const filteredSchedules = productionId && productionId !== 'all'
    ? schedules.filter(s => s.production_id === productionId)
    : schedules;

  // Calculate stats
  const totalEquipment = equipment.length;
  const availableCount = equipment.filter(e => e.status === 'available').length;
  const inUseCount = equipment.filter(e => e.status === 'in_use').length;
  const maintenanceCount = equipment.filter(e => e.status === 'maintenance').length;

  // Equipment by category
  const categoryData = Object.entries(
    equipment.reduce((acc, e) => {
      acc[e.category] = (acc[e.category] || 0) + 1;
      return acc;
    }, {})
  ).map(([cat, count], idx) => ({
    name: categoryLabels[cat] || cat,
    value: count,
    color: COLORS[idx % COLORS.length]
  }));

  // Usage frequency (how many times each piece has been scheduled)
  const usageData = equipment
    .map(eq => {
      const eqSchedules = filteredSchedules.filter(s => s.asset_id === eq.id);
      return {
        name: eq.asset_name?.substring(0, 15) || 'Unknown',
        bookings: eqSchedules.length,
        category: categoryLabels[eq.category] || eq.category
      };
    })
    .sort((a, b) => b.bookings - a.bookings)
    .slice(0, 10);

  // Maintenance by type
  const maintenanceData = Object.entries(
    maintenance.reduce((acc, m) => {
      acc[m.maintenance_type] = (acc[m.maintenance_type] || 0) + 1;
      return acc;
    }, {})
  ).map(([type, count]) => ({
    name: type.charAt(0).toUpperCase() + type.slice(1),
    count
  }));

  // CSV columns
  const csvColumns = [
    { header: 'Asset Name', key: 'asset_name' },
    { header: 'Category', accessor: (e) => categoryLabels[e.category] || e.category },
    { header: 'Status', key: 'status' },
    { header: 'Serial Number', key: 'serial_number' },
    { header: 'Total Bookings', accessor: (e) => schedules.filter(s => s.asset_id === e.id).length },
    { header: 'Maintenance Records', accessor: (e) => maintenance.filter(m => m.asset_id === e.id).length },
  ];

  // PDF sections
  const pdfSections = [
    {
      title: 'Equipment Summary',
      type: 'summary',
      items: [
        { label: 'Total Equipment', value: totalEquipment },
        { label: 'Available', value: availableCount },
        { label: 'In Use', value: inUseCount },
        { label: 'Under Maintenance', value: maintenanceCount },
        { label: 'Availability Rate', value: `${totalEquipment > 0 ? Math.round((availableCount / totalEquipment) * 100) : 0}%` },
      ]
    },
    {
      title: 'Equipment by Category',
      type: 'summary',
      items: categoryData.map(c => ({ label: c.name, value: c.value }))
    },
    {
      title: 'Equipment Details',
      type: 'table',
      columns: csvColumns.map(c => ({ ...c, width: 30 })),
      data: equipment
    }
  ];

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-slate-400" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Export Button */}
      <div className="flex justify-end">
        <ReportExporter
          title="Equipment Usage Report"
          csvData={equipment}
          csvColumns={csvColumns}
          pdfSections={pdfSections}
          filename="equipment_usage"
        />
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-amber-100">
                <Box className="w-5 h-5 text-amber-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{totalEquipment}</p>
                <p className="text-xs text-slate-500">Total Assets</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-green-100">
                <Box className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{availableCount}</p>
                <p className="text-xs text-slate-500">Available</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-100">
                <Calendar className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{inUseCount}</p>
                <p className="text-xs text-slate-500">In Use</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-red-100">
                <Wrench className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{maintenanceCount}</p>
                <p className="text-xs text-slate-500">Maintenance</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Equipment by Category</CardTitle>
          </CardHeader>
          <CardContent>
            {categoryData.length === 0 ? (
              <p className="text-center py-8 text-slate-500">No equipment data</p>
            ) : (
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={categoryData}
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      dataKey="value"
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    >
                      {categoryData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Most Used Equipment</CardTitle>
          </CardHeader>
          <CardContent>
            {usageData.length === 0 ? (
              <p className="text-center py-8 text-slate-500">No usage data</p>
            ) : (
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={usageData} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" />
                    <YAxis type="category" dataKey="name" width={100} tick={{ fontSize: 10 }} />
                    <Tooltip />
                    <Bar dataKey="bookings" fill="#f59e0b" name="Bookings" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Maintenance History */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Maintenance History</CardTitle>
        </CardHeader>
        <CardContent>
          {maintenanceData.length === 0 ? (
            <p className="text-center py-8 text-slate-500">No maintenance records</p>
          ) : (
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={maintenanceData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="count" fill="#ef4444" name="Records" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Equipment Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Equipment Assets</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2 px-3">Asset</th>
                  <th className="text-left py-2 px-3">Category</th>
                  <th className="text-left py-2 px-3">Status</th>
                  <th className="text-left py-2 px-3">Bookings</th>
                  <th className="text-left py-2 px-3">Maintenance</th>
                </tr>
              </thead>
              <tbody>
                {equipment.slice(0, 10).map(eq => {
                  const bookings = schedules.filter(s => s.asset_id === eq.id).length;
                  const maint = maintenance.filter(m => m.asset_id === eq.id).length;
                  return (
                    <tr key={eq.id} className="border-b hover:bg-slate-50">
                      <td className="py-2 px-3 font-medium">{eq.asset_name}</td>
                      <td className="py-2 px-3">{categoryLabels[eq.category] || eq.category}</td>
                      <td className="py-2 px-3">
                        <Badge variant="outline">{eq.status}</Badge>
                      </td>
                      <td className="py-2 px-3">{bookings}</td>
                      <td className="py-2 px-3">{maint}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}