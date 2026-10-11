import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '../../api/base44Client';
import { format, parseISO } from 'date-fns';
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
import { Badge } from '../../components/ui/badge';
import { Checkbox } from '../../components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../components/ui/select';
import { Calendar, Clock, Plus, Trash2, Loader2 } from 'lucide-react';

const DAYS_OF_WEEK = [
  { value: 0, label: 'Sunday' },
  { value: 1, label: 'Monday' },
  { value: 2, label: 'Tuesday' },
  { value: 3, label: 'Wednesday' },
  { value: 4, label: 'Thursday' },
  { value: 5, label: 'Friday' },
  { value: 6, label: 'Saturday' },
];

const ROLES = [
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
];

export default function AvailabilityManager({ open, onClose, crewMember }) {
  const queryClient = useQueryClient();

  const [blockedDates, setBlockedDates] = useState(() => {
    try {
      return crewMember?.blocked_dates ? JSON.parse(crewMember.blocked_dates) : [];
    } catch { return []; }
  });

  const [availableDays, setAvailableDays] = useState(() => {
    try {
      return crewMember?.available_days ? JSON.parse(crewMember.available_days) : [1, 2, 3, 4, 5];
    } catch { return [1, 2, 3, 4, 5]; }
  });

  const [preferredRoles, setPreferredRoles] = useState(() => {
    try {
      return crewMember?.preferred_roles ? JSON.parse(crewMember.preferred_roles) : [];
    } catch { return []; }
  });

  const [maxHours, setMaxHours] = useState(crewMember?.max_hours_per_week || 40);
  const [newBlockedDate, setNewBlockedDate] = useState({ start_date: '', end_date: '', reason: '' });

  const updateMutation = useMutation({
    mutationFn: (data) => base44.entities.CrewMember.update(crewMember.id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['crewMembers'] });
      queryClient.invalidateQueries({ queryKey: ['crewMember'] });
      onClose();
    },
  });

  const handleAddBlockedDate = () => {
    if (newBlockedDate.start_date && newBlockedDate.end_date) {
      setBlockedDates([...blockedDates, { ...newBlockedDate }]);
      setNewBlockedDate({ start_date: '', end_date: '', reason: '' });
    }
  };

  const handleRemoveBlockedDate = (index) => {
    setBlockedDates(blockedDates.filter((_, i) => i !== index));
  };

  const handleToggleDay = (day) => {
    if (availableDays.includes(day)) {
      setAvailableDays(availableDays.filter(d => d !== day));
    } else {
      setAvailableDays([...availableDays, day].sort());
    }
  };

  const handleTogglePreferredRole = (role) => {
    if (preferredRoles.includes(role)) {
      setPreferredRoles(preferredRoles.filter(r => r !== role));
    } else {
      setPreferredRoles([...preferredRoles, role]);
    }
  };

  const handleSave = () => {
    updateMutation.mutate({
      blocked_dates: JSON.stringify(blockedDates),
      available_days: JSON.stringify(availableDays),
      preferred_roles: JSON.stringify(preferredRoles),
      max_hours_per_week: maxHours,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Manage Availability - {crewMember?.full_name}</DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Available Days */}
          <div>
            <Label className="text-sm font-medium mb-3 block">Available Days</Label>
            <div className="flex flex-wrap gap-2">
              {DAYS_OF_WEEK.map(day => (
                <Button
                  key={day.value}
                  variant={availableDays.includes(day.value) ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => handleToggleDay(day.value)}
                >
                  {day.label.substring(0, 3)}
                </Button>
              ))}
            </div>
          </div>

          {/* Max Hours */}
          <div>
            <Label className="text-sm font-medium mb-2 block">Max Hours Per Week</Label>
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-muted-foreground" />
              <Input
                type="number"
                value={maxHours}
                onChange={(e) => setMaxHours(parseInt(e.target.value) || 0)}
                className="w-24"
                min={0}
                max={168}
              />
              <span className="text-sm text-muted-foreground">hours</span>
            </div>
          </div>

          {/* Preferred Roles */}
          <div>
            <Label className="text-sm font-medium mb-3 block">Preferred Roles (in order of preference)</Label>
            <div className="flex flex-wrap gap-2">
              {ROLES.map(role => (
                <Badge
                  key={role.value}
                  variant={preferredRoles.includes(role.value) ? 'default' : 'outline'}
                  className="cursor-pointer"
                  onClick={() => handleTogglePreferredRole(role.value)}
                >
                  {preferredRoles.includes(role.value) && (
                    <span className="mr-1">{preferredRoles.indexOf(role.value) + 1}.</span>
                  )}
                  {role.label}
                </Badge>
              ))}
            </div>
          </div>

          {/* Blocked Dates */}
          <div>
            <Label className="text-sm font-medium mb-3 block flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              Blocked/Unavailable Dates
            </Label>
            
            {blockedDates.length > 0 && (
              <div className="space-y-2 mb-4">
                {blockedDates.map((blocked, index) => (
                  <div key={index} className="flex items-center justify-between bg-red-50 border border-red-200 rounded-lg p-2">
                    <div className="text-sm">
                      <span className="font-medium">
                        {format(parseISO(blocked.start_date), 'MMM d, yyyy')} - {format(parseISO(blocked.end_date), 'MMM d, yyyy')}
                      </span>
                      {blocked.reason && (
                        <span className="text-muted-foreground ml-2">({blocked.reason})</span>
                      )}
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 text-red-500"
                      onClick={() => handleRemoveBlockedDate(index)}
                    >
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                ))}
              </div>
            )}

            <div className="space-y-2 border rounded-lg p-3 bg-slate-50">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label className="text-xs">From</Label>
                  <Input
                    type="date"
                    value={newBlockedDate.start_date}
                    onChange={(e) => setNewBlockedDate({ ...newBlockedDate, start_date: e.target.value })}
                  />
                </div>
                <div>
                  <Label className="text-xs">To</Label>
                  <Input
                    type="date"
                    value={newBlockedDate.end_date}
                    onChange={(e) => setNewBlockedDate({ ...newBlockedDate, end_date: e.target.value })}
                  />
                </div>
              </div>
              <div>
                <Label className="text-xs">Reason (optional)</Label>
                <Input
                  placeholder="e.g., Vacation, Personal"
                  value={newBlockedDate.reason}
                  onChange={(e) => setNewBlockedDate({ ...newBlockedDate, reason: e.target.value })}
                />
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={handleAddBlockedDate}
                disabled={!newBlockedDate.start_date || !newBlockedDate.end_date}
              >
                <Plus className="w-3 h-3 mr-1" />
                Add Blocked Period
              </Button>
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-4 border-t">
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSave} disabled={updateMutation.isPending}>
            {updateMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            Save Availability
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}