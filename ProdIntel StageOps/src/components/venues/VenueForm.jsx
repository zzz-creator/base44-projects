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
import { Loader2 } from 'lucide-react';

const initialFormState = {
  name: '',
  location: '',
  capacity: '',
  contact_info: '',
};

export default function VenueForm({ open, onClose, venue }) {
  const [formData, setFormData] = useState(initialFormState);
  const queryClient = useQueryClient();

  useEffect(() => {
    if (venue) {
      setFormData({
        name: venue.name || '',
        location: venue.location || '',
        capacity: venue.capacity || '',
        contact_info: venue.contact_info || '',
      });
    } else {
      setFormData(initialFormState);
    }
  }, [venue, open]);

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.Venue.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['venues'] });
      onClose();
    },
  });

  const updateMutation = useMutation({
    mutationFn: (data) => base44.entities.Venue.update(venue.id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['venues'] });
      onClose();
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    const data = { 
      ...formData, 
      capacity: formData.capacity ? parseInt(formData.capacity) : undefined 
    };
    
    if (venue) {
      updateMutation.mutate(data);
    } else {
      createMutation.mutate(data);
    }
  };

  const isLoading = createMutation.isPending || updateMutation.isPending;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {venue ? 'Edit Venue' : 'Add Venue'}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="name">Venue Name *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Enter venue name"
              required
            />
          </div>

          <div>
            <Label htmlFor="location">Location</Label>
            <Input
              id="location"
              value={formData.location}
              onChange={(e) => setFormData({ ...formData, location: e.target.value })}
              placeholder="Address or location"
            />
          </div>

          <div>
            <Label htmlFor="capacity">Capacity</Label>
            <Input
              id="capacity"
              type="number"
              value={formData.capacity}
              onChange={(e) => setFormData({ ...formData, capacity: e.target.value })}
              placeholder="Seating capacity"
            />
          </div>

          <div>
            <Label htmlFor="contact_info">Contact Info</Label>
            <Textarea
              id="contact_info"
              value={formData.contact_info}
              onChange={(e) => setFormData({ ...formData, contact_info: e.target.value })}
              placeholder="Contact details..."
              rows={2}
            />
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {venue ? 'Update' : 'Add'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}