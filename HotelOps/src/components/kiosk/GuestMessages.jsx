import React, { useState } from 'react';
import { db } from '../dataClient';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Badge } from '../../components/ui/badge';
import { Label } from '../../components/ui/label';
import { toast } from 'sonner';
import { MessageSquare, Mail, Clock, CheckCircle2, AlertCircle } from 'lucide-react';
import moment from 'moment';

export default function GuestMessages() {
  const queryClient = useQueryClient();
  const [accessCode, setAccessCode] = useState('');
  const [guestData, setGuestData] = useState(null);
  const [selectedMessage, setSelectedMessage] = useState(null);

  const { data: messages = [], refetch: refetchMessages } = useQuery({
    queryKey: ['guest-messages', guestData?.guest?.id],
    queryFn: () => {
      if (!guestData?.guest?.id) return [];
      return db.entities.GuestMessage.filter({ guest_id: guestData.guest.id }, '-sent_date');
    },
    enabled: !!guestData?.guest?.id
  });

  const lookupMutation = useMutation({
    mutationFn: async (code) => {
      const passes = await db.entities.AccessPass.filter({ access_code: code });
      if (passes.length === 0) {
        throw new Error('Invalid access code');
      }
      const pass = passes[0];
      const reservation = await db.entities.Reservation.filter({ id: pass.reservation_id });
      if (reservation.length === 0) {
        throw new Error('Reservation not found');
      }
      const guest = await db.entities.Guest.filter({ id: reservation[0].guest_id });
      if (guest.length === 0) {
        throw new Error('Guest not found');
      }
      return { guest: guest[0], reservation: reservation[0] };
    },
    onSuccess: (data) => {
      setGuestData(data);
      toast.success('Access verified');
    },
    onError: (error) => {
      toast.error(error.message || 'Invalid access code');
    }
  });

  const markAsReadMutation = useMutation({
    mutationFn: async (messageId) => {
      return db.entities.GuestMessage.update(messageId, {
        status: 'read',
        read_date: new Date().toISOString()
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['guest-messages'] });
    }
  });

  const handleLookup = () => {
    if (!accessCode) {
      toast.error('Please enter your access code');
      return;
    }
    lookupMutation.mutate(accessCode);
  };

  const handleViewMessage = (message) => {
    setSelectedMessage(message);
    if (message.status === 'unread') {
      markAsReadMutation.mutate(message.id);
    }
  };

  const unreadCount = messages.filter(m => m.status === 'unread').length;

  const messageTypeColors = {
    announcement: 'bg-blue-100 text-blue-800',
    promotion: 'bg-green-100 text-green-800',
    reminder: 'bg-yellow-100 text-yellow-800',
    service_update: 'bg-purple-100 text-purple-800',
    urgent: 'bg-red-100 text-red-800'
  };

  const priorityIcons = {
    low: Clock,
    normal: MessageSquare,
    high: AlertCircle
  };

  if (!guestData) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="w-6 h-6" />
            Guest Messages
          </CardTitle>
          <CardDescription>View messages and notifications from hotel staff</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Access Code</Label>
            <Input
              placeholder="Enter your access code"
              value={accessCode}
              onChange={(e) => setAccessCode(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleLookup()}
            />
          </div>
          <Button 
            onClick={handleLookup} 
            disabled={lookupMutation.isPending}
            className="w-full"
          >
            {lookupMutation.isPending ? 'Verifying...' : 'View Messages'}
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (selectedMessage) {
    const PriorityIcon = priorityIcons[selectedMessage.priority] || MessageSquare;
    
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Message Details</CardTitle>
            <Button variant="outline" onClick={() => setSelectedMessage(null)}>
              Back to Inbox
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <h2 className="text-2xl font-bold">{selectedMessage.subject}</h2>
              <Badge className={messageTypeColors[selectedMessage.message_type]}>
                {selectedMessage.message_type}
              </Badge>
            </div>
            <div className="flex items-center gap-2 text-sm text-slate-600">
              <PriorityIcon className="w-4 h-4" />
              <span className="capitalize">{selectedMessage.priority} Priority</span>
              <span>•</span>
              <span>{moment(selectedMessage.sent_date).format('MMM D, YYYY h:mm A')}</span>
            </div>
          </div>
          <div className="border-t pt-4">
            <p className="text-slate-700 whitespace-pre-wrap">{selectedMessage.message}</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Mail className="w-6 h-6" />
              Your Messages
            </CardTitle>
            <CardDescription>
              Welcome, {guestData.guest.first_name} {guestData.guest.last_name}
            </CardDescription>
          </div>
          {unreadCount > 0 && (
            <Badge className="bg-red-500 text-white">
              {unreadCount} Unread
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {messages.length === 0 ? (
            <div className="text-center py-12 text-slate-500">
              <Mail className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>No messages yet</p>
            </div>
          ) : (
            messages.map((msg) => {
              const PriorityIcon = priorityIcons[msg.priority] || MessageSquare;
              
              return (
                <div
                  key={msg.id}
                  onClick={() => handleViewMessage(msg)}
                  className={`border rounded-lg p-4 cursor-pointer transition-all hover:shadow-md ${
                    msg.status === 'unread' ? 'bg-blue-50 border-blue-200' : 'bg-white'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center gap-2">
                        <h3 className={`font-semibold ${msg.status === 'unread' ? 'text-blue-900' : 'text-slate-900'}`}>
                          {msg.subject}
                        </h3>
                        <Badge className={messageTypeColors[msg.message_type]} variant="outline">
                          {msg.message_type}
                        </Badge>
                        {msg.priority === 'high' && (
                          <Badge className="bg-red-100 text-red-800">
                            High Priority
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-slate-600 line-clamp-2">{msg.message}</p>
                      <div className="flex items-center gap-2 text-xs text-slate-500">
                        <PriorityIcon className="w-3 h-3" />
                        <span>{moment(msg.sent_date).fromNow()}</span>
                      </div>
                    </div>
                    <div className="ml-4">
                      {msg.status === 'unread' ? (
                        <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                      ) : (
                        <CheckCircle2 className="w-5 h-5 text-green-500" />
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
        
        <div className="mt-4 pt-4 border-t">
          <Button 
            variant="outline" 
            onClick={() => {
              setGuestData(null);
              setAccessCode('');
            }}
            className="w-full"
          >
            Sign Out
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}