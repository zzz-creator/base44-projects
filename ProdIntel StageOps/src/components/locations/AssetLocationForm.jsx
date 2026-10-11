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
  location_name: '',
  description: '',
  venue_id: '',
};

export default function AssetLocationForm({ open, onClose, location, venues = [] }) {
  const [formData, setFormData] = useState(initialFormState);
  const queryClient = useQueryClient();

  useEffect(() => {
    if (location) {
      setFormData({
        location_name: location.location_name || '',
        description: location.description || '',
        venue_id: location.venue_id || '',
      });
    } else {
      setFormData(initialFormState);
    }
  }, [location, open]);

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.AssetLocation.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assetLocations'] });
      onClose();
    },
  });

  const updateMutation = useMutation({
    mutationFn: (data) => base44.entities.AssetLocation.update(location.id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assetLocations'] });
      onClose();
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    const data = { ...formData };
    if (!data.venue_id) delete data.venue_id;
    
    if (location) {
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
            {location ? 'Edit Location' : 'Add Location'}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="location_name">Location Name *</Label>
            <Input
              id="location_name"
              value={formData.location_name}
              onChange={(e) => setFormData({ ...formData, location_name: e.target.value })}
              placeholder="Enter location name"
              required
            />
          </div>

          <div>
            <Label htmlFor="venue_id">Associated Venue</Label>
            <Select
              value={formData.venue_id}
              onValueChange={(value) => setFormData({ ...formData, venue_id: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select venue (optional)" />
              </SelectTrigger>
              <SelectContent>
                {venues.map((venue) => (
                  <SelectItem key={venue.id} value={venue.id}>
                    {venue.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Location description..."
              rows={2}
            />
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {location ? 'Update' : 'Add'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}