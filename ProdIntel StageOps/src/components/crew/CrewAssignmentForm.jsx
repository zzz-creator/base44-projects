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

const initialFormState = {
  crew_member_id: '',
  crew_member_name: '',
  role: '',
  contact_info: '',
  status: 'assigned',
  start_date: '',
  end_date: '',
  notes: '',
};

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

export default function CrewAssignmentForm({ open, onClose, assignment, productionId }) {
  const [formData, setFormData] = useState(initialFormState);
  const [useExistingMember, setUseExistingMember] = useState(true);
  const queryClient = useQueryClient();

  const { data: crewMembers = [] } = useQuery({
    queryKey: ['crewMembers'],
    queryFn: () => base44.entities.CrewMember.list(),
  });

  useEffect(() => {
    if (assignment) {
      setFormData({
        crew_member_id: assignment.crew_member_id || '',
        crew_member_name: assignment.crew_member_name || '',
        role: assignment.role || '',
        contact_info: assignment.contact_info || '',
        status: assignment.status || 'assigned',
        start_date: assignment.start_date || '',
        end_date: assignment.end_date || '',
        notes: assignment.notes || '',
      });
      setUseExistingMember(!!assignment.crew_member_id);
    } else {
      setFormData(initialFormState);
      setUseExistingMember(true);
    }
  }, [assignment, open]);

  const handleMemberSelect = (memberId) => {
    const member = crewMembers.find(m => m.id === memberId);
    if (member) {
      setFormData({
        ...formData,
        crew_member_id: memberId,
        crew_member_name: member.full_name,
        contact_info: member.email || member.phone || '',
        role: member.primary_role || formData.role,
      });
    }
  };

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.CrewAssignment.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['crewAssignments'] });
      onClose();
    },
  });

  const updateMutation = useMutation({
    mutationFn: (data) => base44.entities.CrewAssignment.update(assignment.id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['crewAssignments'] });
      onClose();
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    const data = { ...formData, production_id: productionId };
    if (!data.crew_member_id) delete data.crew_member_id;
    if (!data.start_date) delete data.start_date;
    if (!data.end_date) delete data.end_date;
    
    if (assignment) {
      updateMutation.mutate(data);
    } else {
      createMutation.mutate(data);
    }
  };

  const isLoading = createMutation.isPending || updateMutation.isPending;
  const activeCrewMembers = crewMembers.filter(m => m.status === 'active');

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {assignment ? 'Edit Crew Assignment' : 'Add Crew Member'}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="flex gap-2">
            <Button
              type="button"
              variant={useExistingMember ? 'default' : 'outline'}
              size="sm"
              onClick={() => setUseExistingMember(true)}
            >
              Select Existing
            </Button>
            <Button
              type="button"
              variant={!useExistingMember ? 'default' : 'outline'}
              size="sm"
              onClick={() => setUseExistingMember(false)}
            >
              Manual Entry
            </Button>
          </div>

          {useExistingMember ? (
            <div>
              <Label htmlFor="crew_member_id">Crew Member *</Label>
              <Select
                value={formData.crew_member_id}
                onValueChange={handleMemberSelect}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select crew member" />
                </SelectTrigger>
                <SelectContent>
                  {activeCrewMembers.map((member) => (
                    <SelectItem key={member.id} value={member.id}>
                      {member.full_name} ({member.primary_role})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          ) : (
            <div>
              <Label htmlFor="crew_member_name">Name *</Label>
              <Input
                id="crew_member_name"
                value={formData.crew_member_name}
                onChange={(e) => setFormData({ ...formData, crew_member_name: e.target.value })}
                placeholder="Enter crew member name"
                required
              />
            </div>
          )}

          <div>
            <Label htmlFor="role">Role for this Production *</Label>
            <Select
              value={formData.role}
              onValueChange={(value) => setFormData({ ...formData, role: value })}
              required
            >
              <SelectTrigger>
                <SelectValue placeholder="Select role" />
              </SelectTrigger>
              <SelectContent>
                {roles.map((role) => (
                  <SelectItem key={role.value} value={role.value}>
                    {role.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="contact_info">Contact Info</Label>
            <Input
              id="contact_info"
              value={formData.contact_info}
              onChange={(e) => setFormData({ ...formData, contact_info: e.target.value })}
              placeholder="Email or phone"
            />
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
                <SelectItem value="assigned">Assigned</SelectItem>
                <SelectItem value="confirmed">Confirmed</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
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
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {assignment ? 'Update' : 'Add'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}