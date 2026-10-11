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
import { Loader2, Copy } from 'lucide-react';
import TemplateSelector from './TemplateSelector';

const initialFormState = {
  name: '',
  venue_id: '',
  start_date: '',
  end_date: '',
  status: 'planning',
  description: '',
};

export default function ProductionForm({ open, onClose, production, venues = [] }) {
  const [formData, setFormData] = useState(initialFormState);
  const [showTemplateSelector, setShowTemplateSelector] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const queryClient = useQueryClient();

  useEffect(() => {
    if (production) {
      setFormData({
        name: production.name || '',
        venue_id: production.venue_id || '',
        start_date: production.start_date || '',
        end_date: production.end_date || '',
        status: production.status || 'planning',
        description: production.description || '',
      });
    } else {
      setFormData(initialFormState);
    }
  }, [production, open]);

  const createMutation = useMutation({
    mutationFn: async (data) => {
      const newProduction = await base44.entities.Production.create(data);
      
      // If creating from template, also create tasks and crew roles
      if (selectedTemplate) {
        const tasks = selectedTemplate.template_tasks || [];
        const roles = selectedTemplate.template_roles || [];
        
        // Create tasks
        if (tasks.length > 0) {
          await base44.entities.TaskChecklist.bulkCreate(
            tasks.map(t => ({
              ...t,
              production_id: newProduction.id,
              completion_status: 'pending',
            }))
          );
        }
        
        // Create crew assignment placeholders
        if (roles.length > 0) {
          await base44.entities.CrewAssignment.bulkCreate(
            roles.map(r => ({
              production_id: newProduction.id,
              role: r.role,
              status: 'assigned',
            }))
          );
        }
        
        // Increment template usage
        await base44.entities.ProductionTemplate.update(selectedTemplate.id, {
          usage_count: (selectedTemplate.usage_count || 0) + 1,
        });
      }
      
      return newProduction;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['productions'] });
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      queryClient.invalidateQueries({ queryKey: ['crewAssignments'] });
      setSelectedTemplate(null);
      onClose();
    },
  });

  const updateMutation = useMutation({
    mutationFn: (data) => base44.entities.Production.update(production.id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['productions'] });
      onClose();
    },
  });

  const handleTemplateSelect = (template) => {
    setSelectedTemplate(template);
    setFormData({
      ...formData,
      status: template.default_settings?.status || 'planning',
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const data = { ...formData };
    if (!data.venue_id) delete data.venue_id;
    
    if (production) {
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
            {production ? 'Edit Production' : 'New Production'}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          {!production && (
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowTemplateSelector(true)}
                className="flex-1"
              >
                <Copy className="w-4 h-4 mr-2" />
                Use Template
              </Button>
              {selectedTemplate && (
                <div className="flex items-center gap-2 px-3 py-2 bg-blue-50 border border-blue-200 rounded-lg text-sm text-blue-700">
                  Using: {selectedTemplate.name}
                </div>
              )}
            </div>
          )}
          <div>
            <Label htmlFor="name">Production Name *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Enter production name"
              required
            />
          </div>

          <div>
            <Label htmlFor="venue">Venue</Label>
            <Select
              value={formData.venue_id}
              onValueChange={(value) => setFormData({ ...formData, venue_id: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select venue" />
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

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="start_date">Start Date</Label>
              <Input
                id="start_date"
                type="date"
                value={formData.start_date}
                onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="end_date">End Date</Label>
              <Input
                id="end_date"
                type="date"
                value={formData.end_date}
                onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
              />
            </div>
          </div>

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
                <SelectItem value="planning">Planning</SelectItem>
                <SelectItem value="rehearsal">Rehearsal</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Production description..."
              rows={3}
            />
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {production ? 'Update' : 'Create'}
            </Button>
          </div>
        </form>
      </DialogContent>

      <TemplateSelector
        open={showTemplateSelector}
        onClose={() => setShowTemplateSelector(false)}
        onSelectTemplate={handleTemplateSelect}
      />
    </Dialog>
  );
}