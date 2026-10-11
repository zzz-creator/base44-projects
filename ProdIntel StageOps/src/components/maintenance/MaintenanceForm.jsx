import React, { useState, useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '../../api/base44Client';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '../../components/ui/dialog';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Textarea } from '../../components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../components/ui/select';
import { Loader2 } from 'lucide-react';

const initialFormState = {
  asset_id: '',
  maintenance_type: '',
  performed_by: '',
  performed_date: '',
  notes: '',
  next_scheduled_date: '',
};

export default function MaintenanceForm({ open, onClose, record, assets = [] }) {
  const [formData, setFormData] = useState(initialFormState);
  const queryClient = useQueryClient();

  useEffect(() => {
    if (record) {
      setFormData({
        asset_id: record.asset_id || '',
        maintenance_type: record.maintenance_type || '',
        performed_by: record.performed_by || '',
        performed_date: record.performed_date || '',
        notes: record.notes || '',
        next_scheduled_date: record.next_scheduled_date || '',
      });
    } else {
      setFormData({
        ...initialFormState,
        performed_date: new Date().toISOString().split('T')[0],
      });
    }
  }, [record, open]);

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.MaintenanceRecord.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['maintenanceRecords'] });
      onClose();
    },
  });

  const updateMutation = useMutation({
    mutationFn: (data) => base44.entities.MaintenanceRecord.update(record.id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['maintenanceRecords'] });
      onClose();
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    const data = { ...formData };
    
    if (record) {
      updateMutation.mutate(data);
    } else {
      createMutation.mutate(data);
    }
  };

  const isLoading = createMutation.isPending || updateMutation.isPending;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {record ? 'Edit Maintenance Record' : 'Log Maintenance'}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="asset_id">Equipment Asset *</Label>
            <Select
              value={formData.asset_id}
              onValueChange={(value) => setFormData({ ...formData, asset_id: value })}
              required
            >
              <SelectTrigger>
                <SelectValue placeholder="Select equipment" />
              </SelectTrigger>
              <SelectContent>
                {assets.map((asset) => (
                  <SelectItem key={asset.id} value={asset.id}>
                    {asset.asset_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="maintenance_type">Type *</Label>
              <Select
                value={formData.maintenance_type}
                onValueChange={(value) => setFormData({ ...formData, maintenance_type: value })}
                required
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="routine">Routine</SelectItem>
                  <SelectItem value="repair">Repair</SelectItem>
                  <SelectItem value="inspection">Inspection</SelectItem>
                  <SelectItem value="calibration">Calibration</SelectItem>
                  <SelectItem value="emergency">Emergency</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="performed_date">Date Performed *</Label>
              <Input
                id="performed_date"
                type="date"
                value={formData.performed_date}
                onChange={(e) => setFormData({ ...formData, performed_date: e.target.value })}
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="performed_by">Performed By</Label>
              <Input
                id="performed_by"
                value={formData.performed_by}
                onChange={(e) => setFormData({ ...formData, performed_by: e.target.value })}
                placeholder="Name"
              />
            </div>
            <div>
              <Label htmlFor="next_scheduled_date">Next Scheduled</Label>
              <Input
                id="next_scheduled_date"
                type="date"
                value={formData.next_scheduled_date}
                onChange={(e) => setFormData({ ...formData, next_scheduled_date: e.target.value })}
              />
            </div>
          </div>

          <div>
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Maintenance notes..."
              rows={3}
            />
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {record ? 'Update' : 'Log'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}