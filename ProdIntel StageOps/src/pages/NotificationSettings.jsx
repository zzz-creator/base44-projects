import React, { useState, useEffect } from 'react';
import { base44 } from '../api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { Switch } from '../components/ui/switch';
import { Label } from '../components/ui/label';
import { Button } from '../components/ui/button';
import { Bell, AtSign, AlertTriangle, ClipboardList, Clapperboard, MessageSquare, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

const notificationTypes = [
  { key: 'mention_enabled', label: 'Mentions', description: 'When someone @mentions you', icon: AtSign },
  { key: 'incident_enabled', label: 'New Incidents', description: 'When a new incident is created', icon: AlertTriangle },
  { key: 'task_overdue_enabled', label: 'Overdue Tasks', description: 'When your tasks become overdue', icon: ClipboardList },
  { key: 'task_assigned_enabled', label: 'Task Assignments', description: 'When a task is assigned to you', icon: ClipboardList },
  { key: 'production_status_enabled', label: 'Production Status', description: 'When production status changes', icon: Clapperboard },
  { key: 'message_enabled', label: 'Messages', description: 'When you receive new messages', icon: MessageSquare },
];

export default function NotificationSettings() {
  const [currentUser, setCurrentUser] = useState(null);
  const [preferences, setPreferences] = useState({
    mention_enabled: true,
    incident_enabled: true,
    task_overdue_enabled: true,
    task_assigned_enabled: true,
    production_status_enabled: true,
    message_enabled: true
  });
  const queryClient = useQueryClient();

  useEffect(() => {
    base44.auth.me().then(setCurrentUser).catch(() => {});
  }, []);

  const { data: existingPrefs, isLoading } = useQuery({
    queryKey: ['notificationPrefs', currentUser?.email],
    queryFn: () => base44.entities.NotificationPreference.filter({ user_email: currentUser?.email }),
    enabled: !!currentUser?.email
  });

  useEffect(() => {
    if (existingPrefs && existingPrefs[0]) {
      setPreferences({
        mention_enabled: existingPrefs[0].mention_enabled ?? true,
        incident_enabled: existingPrefs[0].incident_enabled ?? true,
        task_overdue_enabled: existingPrefs[0].task_overdue_enabled ?? true,
        task_assigned_enabled: existingPrefs[0].task_assigned_enabled ?? true,
        production_status_enabled: existingPrefs[0].production_status_enabled ?? true,
        message_enabled: existingPrefs[0].message_enabled ?? true
      });
    }
  }, [existingPrefs]);

  const saveMutation = useMutation({
    mutationFn: async (prefs) => {
      if (existingPrefs && existingPrefs[0]) {
        return base44.entities.NotificationPreference.update(existingPrefs[0].id, prefs);
      } else {
        return base44.entities.NotificationPreference.create({
          user_email: currentUser.email,
          ...prefs
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notificationPrefs'] });
      toast.success('Notification preferences saved');
    }
  });

  const handleToggle = (key) => {
    setPreferences(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const handleSave = () => {
    saveMutation.mutate(preferences);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Bell className="h-6 w-6" />
          Notification Settings
        </h1>
        <p className="text-muted-foreground mt-1">
          Control which notifications you receive
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>In-App Notifications</CardTitle>
          <CardDescription>
            Choose which events trigger notifications in your notification bell
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {notificationTypes.map(({ key, label, description, icon: Icon }) => (
            <div key={key} className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-muted rounded-lg">
                  <Icon className="h-4 w-4 text-muted-foreground" />
                </div>
                <div>
                  <Label htmlFor={key} className="font-medium cursor-pointer">
                    {label}
                  </Label>
                  <p className="text-sm text-muted-foreground">{description}</p>
                </div>
              </div>
              <Switch
                id={key}
                checked={preferences[key]}
                onCheckedChange={() => handleToggle(key)}
              />
            </div>
          ))}
          
          <div className="pt-4 border-t">
            <Button onClick={handleSave} disabled={saveMutation.isPending}>
              {saveMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                'Save Preferences'
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}