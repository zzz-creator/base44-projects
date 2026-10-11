import React, { useState, useEffect } from 'react';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { base44 } from '../../api/base44Client';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from '../../components/ui/dialog';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Textarea } from '../../components/ui/textarea';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '../../components/ui/select';
import { Loader2, AlertTriangle, CheckCircle } from 'lucide-react';

const initialFormState = {
  asset_id: '',
  production_id: '',
  task_id: '',
  start_date: '',
  end_date: '',
  status: 'scheduled',
  notes: '',
  booked_by: '',
};

export default function EquipmentScheduleForm({ 
  open, onClose, schedule, assets = [], productions = [], 
  preSelectedAsset, preSelectedProductionId, checkAvailability 
}) {
  const [formData, setFormData] = useState(initialFormState);
  const [availabilityStatus, setAvailabilityStatus] = useState(null);
  const queryClient = useQueryClient();

  const { data: tasks = [] } = useQuery({
    queryKey: ['productionTasks', formData.production_id],
    queryFn: () => base44.entities.TaskChecklist.filter({ production_id: formData.production_id }),
    enabled: !!formData.production_id,
  });

  useEffect(() => {
    if (schedule) {
      setFormData({
        asset_id: schedule.asset_id || '',
        production_id: schedule.production_id || '',
        task_id: schedule.task_id || '',
        start_date: schedule.start_date || '',
        end_date: schedule.end_date || '',
        status: schedule.status || 'scheduled',
        notes: schedule.notes || '',
        booked_by: schedule.booked_by || '',
      });
    } else {
      setFormData({
        ...initialFormState,
        asset_id: preSelectedAsset?.id || '',
        production_id: preSelectedProductionId || '',
      });
    }
    setAvailabilityStatus(null);
  }, [schedule, open, preSelectedAsset, preSelectedProductionId]);

  useEffect(() => {
    if (formData.asset_id && formData.start_date && formData.end_date && checkAvailability) {
      const isAvailable = checkAvailability(
        formData.asset_id, 
        formData.start_date, 
        formData.end_date,
        schedule?.id
      );
      setAvailabilityStatus(isAvailable);
    } else {
      setAvailabilityStatus(null);
    }
  }, [formData.asset_id, formData.start_date, formData.end_date, checkAvailability, schedule]);

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.EquipmentSchedule.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['equipmentSchedules'] });
      onClose();
    },
  });

  const updateMutation = useMutation({
    mutationFn: (data) => base44.entities.EquipmentSchedule.update(schedule.id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['equipmentSchedules'] });
      onClose();
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    const data = { ...formData };
    if (!data.task_id) delete data.task_id;
    
    if (schedule) {
      updateMutation.mutate(data);
    } else {
      createMutation.mutate(data);
    }
  };

  const isLoading = createMutation.isPending || updateMutation.isPending;
  const availableAssets = assets.filter(a => a.status !== 'retired');

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{schedule ? 'Edit Booking' : 'Book Equipment'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="asset_id">Equipment *</Label>
            <Select
              value={formData.asset_id}
              onValueChange={(value) => setFormData({ ...formData, asset_id: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select equipment" />
              </SelectTrigger>
              <SelectContent>
                {availableAssets.map((asset) => (
                  <SelectItem key={asset.id} value={asset.id}>
                    {asset.asset_name} ({asset.category})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="production_id">Production *</Label>
            <Select
              value={formData.production_id}
              onValueChange={(value) => setFormData({ ...formData, production_id: value, task_id: '' })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select production" />
              </SelectTrigger>
              <SelectContent>
                {productions.map((prod) => (
                  <SelectItem key={prod.id} value={prod.id}>{prod.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {tasks.length > 0 && (
            <div>
              <Label htmlFor="task_id">Link to Task (Optional)</Label>
              <Select
                value={formData.task_id}
                onValueChange={(value) => setFormData({ ...formData, task_id: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select task" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={null}>None</SelectItem>
                  {tasks.map((task) => (
                    <SelectItem key={task.id} value={task.id}>{task.task_name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="start_date">Start Date *</Label>
              <Input
                id="start_date"
                type="date"
                value={formData.start_date}
                onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                required
              />
            </div>
            <div>
              <Label htmlFor="end_date">End Date *</Label>
              <Input
                id="end_date"
                type="date"
                value={formData.end_date}
                onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                required
              />
            </div>
          </div>

          {availabilityStatus !== null && (
            <div className={`p-3 rounded-lg flex items-center gap-2 ${
              availabilityStatus ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
            }`}>
              {availabilityStatus ? (
                <>
                  <CheckCircle className="w-4 h-4" />
                  <span className="text-sm">Equipment is available for these dates</span>
                </>
              ) : (
                <>
                  <AlertTriangle className="w-4 h-4" />
                  <span className="text-sm">Equipment has conflicting bookings</span>
                </>
              )}
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="status">Status</Label>
              <Select
                value={formData.status}
                onValueChange={(value) => setFormData({ ...formData, status: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="scheduled">Scheduled</SelectItem>
                  <SelectItem value="in_use">In Use</SelectItem>
                  <SelectItem value="returned">Returned</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="booked_by">Booked By</Label>
              <Input
                id="booked_by"
                value={formData.booked_by}
                onChange={(e) => setFormData({ ...formData, booked_by: e.target.value })}
                placeholder="Your name"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              rows={2}
            />
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
            <Button 
              type="submit" 
              disabled={isLoading || availabilityStatus === false}
            >
              {isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {schedule ? 'Update' : 'Book'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}