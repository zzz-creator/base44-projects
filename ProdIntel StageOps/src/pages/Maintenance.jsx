import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '../api/base44Client';
import { 
  ClipboardList, 
  Plus, 
  Search, 
  MoreVertical,
  Pencil,
  Trash2,
  Wrench,
  Calendar,
  Loader2
} from 'lucide-react';
import { Card, CardContent } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Badge } from '../components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '../components/ui/dropdown-menu';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../components/ui/select';
import { format } from 'date-fns';
import MaintenanceForm from '../components/maintenance/MaintenanceForm';

const typeColors = {
  routine: 'bg-blue-100 text-blue-700',
  repair: 'bg-orange-100 text-orange-700',
  inspection: 'bg-green-100 text-green-700',
  calibration: 'bg-purple-100 text-purple-700',
  emergency: 'bg-red-100 text-red-700',
};

export default function Maintenance() {
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [showForm, setShowForm] = useState(false);
  const [editingRecord, setEditingRecord] = useState(null);

  const queryClient = useQueryClient();

  const { data: records = [], isLoading } = useQuery({
    queryKey: ['maintenanceRecords'],
    queryFn: () => base44.entities.MaintenanceRecord.list('-performed_date'),
  });

  const { data: assets = [] } = useQuery({
    queryKey: ['equipment'],
    queryFn: () => base44.entities.EquipmentAsset.list(),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.MaintenanceRecord.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['maintenanceRecords'] }),
  });

  const getAssetName = (assetId) => {
    const asset = assets.find(a => a.id === assetId);
    return asset?.asset_name || 'Unknown';
  };

  const filteredRecords = records.filter(record => {
    const asset = assets.find(a => a.id === record.asset_id);
    const matchesSearch = 
      asset?.asset_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      record.performed_by?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      record.notes?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = typeFilter === 'all' || record.maintenance_type === typeFilter;
    return matchesSearch && matchesType;
  });

  const handleEdit = (record) => {
    setEditingRecord(record);
    setShowForm(true);
  };

  const handleCloseForm = () => {
    setShowForm(false);
    setEditingRecord(null);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Maintenance Records</h1>
          <p className="text-slate-500">Track equipment maintenance history</p>
        </div>
        <Button onClick={() => setShowForm(true)} className="bg-blue-600 hover:bg-blue-700">
          <Plus className="w-4 h-4 mr-2" />
          Log Maintenance
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input
            placeholder="Search records..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-full sm:w-40">
            <SelectValue placeholder="Type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="routine">Routine</SelectItem>
            <SelectItem value="repair">Repair</SelectItem>
            <SelectItem value="inspection">Inspection</SelectItem>
            <SelectItem value="calibration">Calibration</SelectItem>
            <SelectItem value="emergency">Emergency</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Records List */}
      {isLoading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-slate-400" />
        </div>
      ) : filteredRecords.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <ClipboardList className="w-12 h-12 text-slate-300 mb-4" />
            <h3 className="text-lg font-medium text-slate-900 mb-1">No maintenance records</h3>
            <p className="text-slate-500 mb-4">
              {searchTerm || typeFilter !== 'all'
                ? 'Try adjusting your filters' 
                : 'Log your first maintenance activity'}
            </p>
            {!searchTerm && typeFilter === 'all' && (
              <Button onClick={() => setShowForm(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Log Maintenance
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {filteredRecords.map((record) => (
            <Card key={record.id} className="hover:shadow-sm transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3">
                    <div className="p-2 rounded-lg bg-amber-100">
                      <Wrench className="w-5 h-5 text-amber-600" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-slate-900">
                          {getAssetName(record.asset_id)}
                        </p>
                        <Badge className={typeColors[record.maintenance_type]}>
                          {record.maintenance_type}
                        </Badge>
                      </div>
                      {record.notes && (
                        <p className="text-sm text-slate-600 mt-1">{record.notes}</p>
                      )}
                      <div className="flex items-center gap-4 mt-2 text-xs text-slate-500">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {record.performed_date && format(new Date(record.performed_date), 'MMM d, yyyy')}
                        </span>
                        {record.performed_by && (
                          <span>By: {record.performed_by}</span>
                        )}
                        {record.next_scheduled_date && (
                          <span className="text-blue-600">
                            Next: {format(new Date(record.next_scheduled_date), 'MMM d')}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <MoreVertical className="w-4 h-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => handleEdit(record)}>
                        <Pencil className="w-4 h-4 mr-2" />
                        Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        onClick={() => deleteMutation.mutate(record.id)}
                        className="text-red-600"
                      >
                        <Trash2 className="w-4 h-4 mr-2" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <MaintenanceForm
        open={showForm}
        onClose={handleCloseForm}
        record={editingRecord}
        assets={assets}
      />
    </div>
  );
}