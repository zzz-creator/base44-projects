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
  production_id: '',
  cue_number: '',
  description: '',
  department: '',
  revision_number: 1,
  notes: '',
};

export default function CueDocForm({ open, onClose, cue, productions = [] }) {
  const [formData, setFormData] = useState(initialFormState);
  const queryClient = useQueryClient();

  useEffect(() => {
    if (cue) {
      setFormData({
        production_id: cue.production_id || '',
        cue_number: cue.cue_number || '',
        description: cue.description || '',
        department: cue.department || '',
        revision_number: cue.revision_number || 1,
        notes: cue.notes || '',
      });
    } else {
      setFormData(initialFormState);
    }
  }, [cue, open]);

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.CueDocumentation.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cueDocs'] });
      onClose();
    },
  });

  const updateMutation = useMutation({
    mutationFn: (data) => base44.entities.CueDocumentation.update(cue.id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cueDocs'] });
      onClose();
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    const data = { ...formData };
    
    if (cue) {
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
            {cue ? 'Edit Cue' : 'Add Cue'}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="production_id">Production *</Label>
            <Select
              value={formData.production_id}
              onValueChange={(value) => setFormData({ ...formData, production_id: value })}
              required
            >
              <SelectTrigger>
                <SelectValue placeholder="Select production" />
              </SelectTrigger>
              <SelectContent>
                {productions.map((prod) => (
                  <SelectItem key={prod.id} value={prod.id}>
                    {prod.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="cue_number">Cue Number *</Label>
              <Input
                id="cue_number"
                value={formData.cue_number}
                onChange={(e) => setFormData({ ...formData, cue_number: e.target.value })}
                placeholder="e.g., LX-101"
                required
              />
            </div>
            <div>
              <Label htmlFor="department">Department *</Label>
              <Select
                value={formData.department}
                onValueChange={(value) => setFormData({ ...formData, department: value })}
                required
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="lighting">Lighting</SelectItem>
                  <SelectItem value="sound">Sound</SelectItem>
                  <SelectItem value="staging">Staging</SelectItem>
                  <SelectItem value="video">Video</SelectItem>
                  <SelectItem value="fly">Fly</SelectItem>
                  <SelectItem value="props">Props</SelectItem>
                  <SelectItem value="special_effects">Special Effects</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Cue description..."
              rows={2}
            />
          </div>

          <div>
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Additional notes..."
              rows={2}
            />
          </div>

          <div>
            <Label htmlFor="revision_number">Revision</Label>
            <Input
              id="revision_number"
              type="number"
              min="1"
              value={formData.revision_number}
              onChange={(e) => setFormData({ ...formData, revision_number: parseInt(e.target.value) || 1 })}
              className="w-24"
            />
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {cue ? 'Update' : 'Add'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}