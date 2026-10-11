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
  title: '',
  category: '',
  description: '',
  last_reviewed_date: '',
  version: 1,
};

export default function ProcedureForm({ open, onClose, procedure }) {
  const [formData, setFormData] = useState(initialFormState);
  const queryClient = useQueryClient();

  useEffect(() => {
    if (procedure) {
      setFormData({
        title: procedure.title || '',
        category: procedure.category || '',
        description: procedure.description || '',
        last_reviewed_date: procedure.last_reviewed_date || '',
        version: procedure.version || 1,
      });
    } else {
      setFormData({
        ...initialFormState,
        last_reviewed_date: new Date().toISOString().split('T')[0],
      });
    }
  }, [procedure, open]);

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.ProcedureLibrary.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['procedures'] });
      onClose();
    },
  });

  const updateMutation = useMutation({
    mutationFn: (data) => base44.entities.ProcedureLibrary.update(procedure.id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['procedures'] });
      onClose();
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    const data = { ...formData };
    
    if (procedure) {
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
            {procedure ? 'Edit Procedure' : 'Add Procedure'}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="title">Title *</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="Procedure title"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="category">Category *</Label>
              <Select
                value={formData.category}
                onValueChange={(value) => setFormData({ ...formData, category: value })}
                required
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="safety">Safety</SelectItem>
                  <SelectItem value="technical">Technical</SelectItem>
                  <SelectItem value="operational">Operational</SelectItem>
                  <SelectItem value="emergency">Emergency</SelectItem>
                  <SelectItem value="maintenance">Maintenance</SelectItem>
                  <SelectItem value="setup">Setup</SelectItem>
                  <SelectItem value="teardown">Teardown</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="version">Version</Label>
              <Input
                id="version"
                type="number"
                min="1"
                value={formData.version}
                onChange={(e) => setFormData({ ...formData, version: parseInt(e.target.value) || 1 })}
              />
            </div>
          </div>

          <div>
            <Label htmlFor="description">Procedure Content</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Procedure steps and instructions..."
              rows={6}
            />
          </div>

          <div>
            <Label htmlFor="last_reviewed_date">Last Reviewed Date</Label>
            <Input
              id="last_reviewed_date"
              type="date"
              value={formData.last_reviewed_date}
              onChange={(e) => setFormData({ ...formData, last_reviewed_date: e.target.value })}
            />
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {procedure ? 'Update' : 'Add'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}