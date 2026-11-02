import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '../api/base44Client';
import { 
  Calendar, Box, Plus, Search, Loader2, Trash2, Theater
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Badge } from '../components/ui/badge';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '../components/ui/select';
import { format, isWithinInterval, parseISO, isBefore, isAfter } from 'date-fns';
import EquipmentScheduleForm from '../components/equipment/EquipmentScheduleForm';

const statusColors = {
  scheduled: 'bg-blue-100 text-blue-700',
  in_use: 'bg-green-100 text-green-700',
  returned: 'bg-slate-100 text-slate-700',
  cancelled: 'bg-red-100 text-red-700',
};

export default function EquipmentScheduling() {
  const urlParams = new URLSearchParams(window.location.search);
  const preSelectedProductionId = urlParams.get('production_id');

  const [searchTerm, setSearchTerm] = useState('');
  const [productionFilter, setProductionFilter] = useState(preSelectedProductionId || 'all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showForm, setShowForm] = useState(false);
  const [editingSchedule, setEditingSchedule] = useState(null);
  const [selectedAssetForBooking, setSelectedAssetForBooking] = useState(null);

  const queryClient = useQueryClient();

  const { data: schedules = [], isLoading: schedulesLoading } = useQuery({
    queryKey: ['equipmentSchedules'],
    queryFn: () => base44.entities.EquipmentSchedule.list('-created_date'),
  });

  const { data: assets = [] } = useQuery({
    queryKey: ['equipment'],
    queryFn: () => base44.entities.EquipmentAsset.list(),
  });

  const { data: productions = [] } = useQuery({
    queryKey: ['productions'],
    queryFn: () => base44.entities.Production.list(),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.EquipmentSchedule.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['equipmentSchedules'] }),
  });

  const getAssetName = (assetId) => assets.find(a => a.id === assetId)?.asset_name || 'Unknown';
  const getProductionName = (prodId) => productions.find(p => p.id === prodId)?.name || 'Unknown';

  const isAssetAvailable = (assetId, startDate, endDate, excludeScheduleId = null) => {
    const start = parseISO(startDate);
    const end = parseISO(endDate);
    
    return !schedules.some(schedule => {
      if (schedule.asset_id !== assetId) return false;
      if (schedule.id === excludeScheduleId) return false;
      if (['returned', 'cancelled'].includes(schedule.status)) return false;
      
      const schedStart = parseISO(schedule.start_date);
      const schedEnd = parseISO(schedule.end_date);
      
      return (
        isWithinInterval(start, { start: schedStart, end: schedEnd }) ||
        isWithinInterval(end, { start: schedStart, end: schedEnd }) ||
        (isBefore(start, schedStart) && isAfter(end, schedEnd))
      );
    });
  };

  const filteredSchedules = schedules.filter(schedule => {
    const asset = assets.find(a => a.id === schedule.asset_id);
    const matchesSearch = asset?.asset_name?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesProduction = productionFilter === 'all' || schedule.production_id === productionFilter;
    const matchesStatus = statusFilter === 'all' || schedule.status === statusFilter;
    return matchesSearch && matchesProduction && matchesStatus;
  });

  const availableAssets = assets.filter(asset => asset.status !== 'retired');

  const handleBookAsset = (asset) => {
    setSelectedAssetForBooking(asset);
    setShowForm(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Equipment Scheduling</h1>
          <p className="text-slate-500">Book and manage equipment for productions</p>
        </div>
        <Button onClick={() => setShowForm(true)} className="bg-blue-600 hover:bg-blue-700">
          <Plus className="w-4 h-4 mr-2" />
          Book Equipment
        </Button>
      </div>

      {/* Quick Book Section */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Available Equipment</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-3">
            {availableAssets.slice(0, 12).map((asset) => {
              const activeBookings = schedules.filter(
                s => s.asset_id === asset.id && ['scheduled', 'in_use'].includes(s.status)
              ).length;
              
              return (
                <div 
                  key={asset.id}
                  className="p-3 border rounded-lg hover:border-blue-300 cursor-pointer transition-colors"
                  onClick={() => handleBookAsset(asset)}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <Box className="w-4 h-4 text-slate-400" />
                    <span className="text-sm font-medium truncate">{asset.asset_name}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    {activeBookings === 0 ? (
                      <Badge className="bg-green-100 text-green-700 text-xs">Available</Badge>
                    ) : (
                      <Badge className="bg-amber-100 text-amber-700 text-xs">{activeBookings} bookings</Badge>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input
            placeholder="Search equipment..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={productionFilter} onValueChange={setProductionFilter}>
          <SelectTrigger className="w-full sm:w-48">
            <SelectValue placeholder="Production" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Productions</SelectItem>
            {productions.map((prod) => (
              <SelectItem key={prod.id} value={prod.id}>{prod.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-36">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="scheduled">Scheduled</SelectItem>
            <SelectItem value="in_use">In Use</SelectItem>
            <SelectItem value="returned">Returned</SelectItem>
            <SelectItem value="cancelled">Cancelled</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Schedules List */}
      {schedulesLoading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-slate-400" />
        </div>
      ) : filteredSchedules.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Calendar className="w-12 h-12 text-slate-300 mb-4" />
            <h3 className="text-lg font-medium text-slate-900 mb-1">No bookings found</h3>
            <p className="text-slate-500 mb-4">Schedule equipment for your productions</p>
            <Button onClick={() => setShowForm(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Book Equipment
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {filteredSchedules.map((schedule) => (
            <Card key={schedule.id}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="p-2 rounded-lg bg-amber-100">
                      <Box className="w-5 h-5 text-amber-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-slate-900">{getAssetName(schedule.asset_id)}</h3>
                      <div className="flex items-center gap-2 text-sm text-slate-500">
                        <Theater className="w-3 h-3" />
                        <span>{getProductionName(schedule.production_id)}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <div className="flex items-center gap-2 text-sm">
                        <Calendar className="w-4 h-4 text-slate-400" />
                        <span>{format(new Date(schedule.start_date), 'MMM d')} - {format(new Date(schedule.end_date), 'MMM d, yyyy')}</span>
                      </div>
                      {schedule.booked_by && (
                        <p className="text-xs text-slate-400">Booked by: {schedule.booked_by}</p>
                      )}
                    </div>
                    <Badge className={statusColors[schedule.status]}>{schedule.status}</Badge>
                    <Button 
                      variant="ghost" 
                      size="icon"
                      onClick={() => deleteMutation.mutate(schedule.id)}
                      className="text-red-500 hover:text-red-600"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
                {schedule.notes && (
                  <p className="mt-2 text-sm text-slate-500 pl-14">{schedule.notes}</p>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <EquipmentScheduleForm
        open={showForm}
        onClose={() => {
          setShowForm(false);
          setEditingSchedule(null);
          setSelectedAssetForBooking(null);
        }}
        schedule={editingSchedule}
        assets={assets}
        productions={productions}
        preSelectedAsset={selectedAssetForBooking}
        preSelectedProductionId={preSelectedProductionId}
        checkAvailability={isAssetAvailable}
      />
    </div>
  );
}