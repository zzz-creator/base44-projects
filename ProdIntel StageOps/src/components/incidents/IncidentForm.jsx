import React, { useState, useEffect } from 'react';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
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
import IncidentAIAnalysis from './IncidentAIAnalysis';
import { notifyIncidentCreated } from '../../components/notifications/NotificationService';

const initialFormState = {
  production_id: '',
  description: '',
  severity: 'medium',
  resolution_status: 'open',
  reported_by: '',
  assigned_to: '',
  resolution_notes: '',
};

export default function IncidentForm({ open, onClose, incident, productions = [], preSelectedProductionId }) {
  const [formData, setFormData] = useState(initialFormState);
  const queryClient = useQueryClient();

  const { data: crewAssignments = [] } = useQuery({
    queryKey: ['crewAssignments'],
    queryFn: () => base44.entities.CrewAssignment.list()
  });

  useEffect(() => {
    if (incident) {
      setFormData({
        production_id: incident.production_id || '',
        description: incident.description || '',
        severity: incident.severity || 'medium',
        resolution_status: incident.resolution_status || 'open',
        reported_by: incident.reported_by || '',
        assigned_to: incident.assigned_to || '',
        resolution_notes: incident.resolution_notes || '',
      });
    } else {
      setFormData({
        ...initialFormState,
        production_id: preSelectedProductionId || '',
      });
    }
  }, [incident, open, preSelectedProductionId]);

  const createMutation = useMutation({
    mutationFn: async (data) => {
      const newIncident = await base44.entities.IncidentLog.create(data);
      
      // Notify crew members assigned to this production
      if (data.production_id) {
        const production = productions.find(p => p.id === data.production_id);
        const productionCrew = crewAssignments.filter(ca => ca.production_id === data.production_id);
        const crewEmails = productionCrew
          .map(ca => ca.contact_info)
          .filter(email => email && email.includes('@'));
        
        if (production && crewEmails.length > 0) {
          await notifyIncidentCreated({
            incident: newIncident,
            production,
            notifyEmails: crewEmails
          });
        }
      }
      
      return newIncident;
    },
    onMutate: async (newIncident) => {
      await queryClient.cancelQueries({ queryKey: ['incidents'] });
      const previousIncidents = queryClient.getQueryData(['incidents', newIncident.production_id]);
      
      queryClient.setQueryData(['incidents', newIncident.production_id], (old) => [
        ...(old || []),
        { ...newIncident, id: 'temp-' + Date.now(), created_date: new Date().toISOString() }
      ]);
      
      return { previousIncidents };
    },
    onError: (err, newIncident, context) => {
      queryClient.setQueryData(['incidents', newIncident.production_id], context.previousIncidents);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['incidents'] });
      onClose();
    },
  });

  const updateMutation = useMutation({
    mutationFn: (data) => base44.entities.IncidentLog.update(incident.id, data),
    onMutate: async (updatedIncident) => {
      await queryClient.cancelQueries({ queryKey: ['incidents'] });
      const previousIncidents = queryClient.getQueryData(['incidents', incident.production_id]);
      
      queryClient.setQueryData(['incidents', incident.production_id], (old) =>
        (old || []).map((i) => i.id === incident.id ? { ...i, ...updatedIncident } : i)
      );
      
      return { previousIncidents };
    },
    onError: (err, updatedIncident, context) => {
      queryClient.setQueryData(['incidents', incident.production_id], context.previousIncidents);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['incidents'] });
      onClose();
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    const data = { ...formData };
    if (!data.production_id) delete data.production_id;
    
    if (incident) {
      updateMutation.mutate(data);
    } else {
      createMutation.mutate(data);
    }
  };

  const isLoading = createMutation.isPending || updateMutation.isPending;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {incident ? 'Edit Incident' : 'Log Incident'}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="production_id">Production</Label>
            <Select
              value={formData.production_id}
              onValueChange={(value) => setFormData({ ...formData, production_id: value })}
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

          <div>
            <Label htmlFor="description">Description *</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Describe the incident..."
              rows={3}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="severity">Severity *</Label>
              <Select
                value={formData.severity}
                onValueChange={(value) => setFormData({ ...formData, severity: value })}
                required
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="critical">Critical</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="resolution_status">Status</Label>
              <Select
                value={formData.resolution_status}
                onValueChange={(value) => setFormData({ ...formData, resolution_status: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="open">Open</SelectItem>
                  <SelectItem value="investigating">Investigating</SelectItem>
                  <SelectItem value="resolved">Resolved</SelectItem>
                  <SelectItem value="closed">Closed</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="reported_by">Reported By</Label>
              <Input
                id="reported_by"
                value={formData.reported_by}
                onChange={(e) => setFormData({ ...formData, reported_by: e.target.value })}
                placeholder="Name"
              />
            </div>
            <div>
              <Label htmlFor="assigned_to">Assigned To</Label>
              <Input
                id="assigned_to"
                value={formData.assigned_to}
                onChange={(e) => setFormData({ ...formData, assigned_to: e.target.value })}
                placeholder="Name"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="resolution_notes">Resolution Notes</Label>
            <Textarea
              id="resolution_notes"
              value={formData.resolution_notes}
              onChange={(e) => setFormData({ ...formData, resolution_notes: e.target.value })}
              placeholder="Notes on resolution..."
              rows={2}
            />
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {incident ? 'Update' : 'Log'}
            </Button>
          </div>
        </form>

        {incident && (
          <div className="mt-6 pt-6 border-t">
            <IncidentAIAnalysis incident={incident} />
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}