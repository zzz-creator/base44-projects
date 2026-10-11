import React, { useState, useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
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
import { Loader2 } from 'lucide-react';

const roles = [
  { value: 'stage_manager', label: 'Stage Manager' },
  { value: 'lighting', label: 'Lighting' },
  { value: 'sound', label: 'Sound' },
  { value: 'props', label: 'Props' },
  { value: 'wardrobe', label: 'Wardrobe' },
  { value: 'set', label: 'Set' },
  { value: 'technical_director', label: 'Technical Director' },
  { value: 'rigger', label: 'Rigger' },
  { value: 'carpenter', label: 'Carpenter' },
  { value: 'electrician', label: 'Electrician' },
  { value: 'other', label: 'Other' },
];

const initialFormState = {
  full_name: '',
  email: '',
  phone: '',
  primary_role: 'other',
  secondary_roles: '',
  status: 'active',
  notes: '',
  emergency_contact: '',
};

export default function CrewMemberForm({ open, onClose, member }) {
  const [formData, setFormData] = useState(initialFormState);
  const queryClient = useQueryClient();

  useEffect(() => {
    if (member) {
      setFormData({
        full_name: member.full_name || '',
        email: member.email || '',
        phone: member.phone || '',
        primary_role: member.primary_role || 'other',
        secondary_roles: member.secondary_roles || '',
        status: member.status || 'active',
        notes: member.notes || '',
        emergency_contact: member.emergency_contact || '',
      });
    } else {
      setFormData(initialFormState);
    }
  }, [member, open]);

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.CrewMember.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['crewMembers'] });
      onClose();
    },
  });

  const updateMutation = useMutation({
    mutationFn: (data) => base44.entities.CrewMember.update(member.id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['crewMembers'] });
      queryClient.invalidateQueries({ queryKey: ['crewMember', member.id] });
      onClose();
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (member) {
      updateMutation.mutate(formData);
    } else {
      createMutation.mutate(formData);
    }
  };

  const isLoading = createMutation.isPending || updateMutation.isPending;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{member ? 'Edit Crew Member' : 'Add Crew Member'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="full_name">Full Name *</Label>
            <Input
              id="full_name"
              value={formData.full_name}
              onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="phone">Phone</Label>
              <Input
                id="phone"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="primary_role">Primary Role *</Label>
              <Select
                value={formData.primary_role}
                onValueChange={(value) => setFormData({ ...formData, primary_role: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {roles.map((role) => (
                    <SelectItem key={role.value} value={role.value}>{role.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
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
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                  <SelectItem value="on_leave">On Leave</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label htmlFor="secondary_roles">Secondary Roles (comma-separated)</Label>
            <Input
              id="secondary_roles"
              value={formData.secondary_roles}
              onChange={(e) => setFormData({ ...formData, secondary_roles: e.target.value })}
              placeholder="e.g. Assistant Lighting, Follow Spot"
            />
          </div>

          <div>
            <Label htmlFor="emergency_contact">Emergency Contact</Label>
            <Input
              id="emergency_contact"
              value={formData.emergency_contact}
              onChange={(e) => setFormData({ ...formData, emergency_contact: e.target.value })}
              placeholder="Name and phone number"
            />
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
            <Button type="submit" disabled={isLoading}>
              {isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {member ? 'Update' : 'Add'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}