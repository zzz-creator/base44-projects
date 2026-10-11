import React, { useState } from 'react';
import { db } from '../components/dataClient';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Textarea } from '../components/ui/textarea';
import { Label } from '../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Badge } from '../components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { toast } from 'sonner';
import { Send, MessageSquare, Clock, CheckCircle2, Search } from 'lucide-react';
import moment from 'moment';

export default function MessageCenter() {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [messageForm, setMessageForm] = useState({
    target_type: 'individual',
    room_number: '',
    guest_name: '',
    message_type: 'announcement',
    priority: 'normal',
    subject: '',
    message: ''
  });

  const { data: guests = [] } = useQuery({
    queryKey: ['guests'],
    queryFn: () => db.entities.Guest.list()
  });

  const { data: reservations = [] } = useQuery({
    queryKey: ['reservations'],
    queryFn: () => db.entities.Reservation.list()
  });

  const { data: rooms = [] } = useQuery({
    queryKey: ['rooms'],
    queryFn: () => db.entities.Room.list()
  });

  const { data: messages = [] } = useQuery({
    queryKey: ['guest-messages'],
    queryFn: () => db.entities.GuestMessage.list('-sent_date')
  });

  const sendMessageMutation = useMutation({
    mutationFn: async (data) => {
      const { target_type, room_number, guest_name, ...messageData } = data;
      
      let targetGuests = [];
      
      if (target_type === 'individual') {
        if (room_number) {
          const room = rooms.find(r => r.room_number === room_number);
          if (room) {
            const activeReservations = reservations.filter(
              r => r.room_id === room.id && r.status === 'checked_in'
            );
            targetGuests = activeReservations.map(r => r.guest_id);
          }
        } else if (guest_name) {
          const guest = guests.find(g => 
            `${g.first_name} ${g.last_name}`.toLowerCase().includes(guest_name.toLowerCase())
          );
          if (guest) targetGuests = [guest.id];
        }
      } else if (target_type === 'all_checked_in') {
        const activeReservations = reservations.filter(r => r.status === 'checked_in');
        targetGuests = activeReservations.map(r => r.guest_id);
      } else if (target_type === 'vip') {
        targetGuests = guests.filter(g => g.vip_status).map(g => g.id);
      }

      if (targetGuests.length === 0) {
        throw new Error('No guests found matching the criteria');
      }

      const messagesToCreate = targetGuests.map(guestId => {
        const reservation = reservations.find(r => r.guest_id === guestId && r.status === 'checked_in');
        return {
          guest_id: guestId,
          reservation_id: reservation?.id,
          room_id: reservation?.room_id,
          ...messageData,
          sent_date: new Date().toISOString(),
          sent_by: 'Staff'
        };
      });

      return db.entities.GuestMessage.bulkCreate(messagesToCreate);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['guest-messages'] });
      toast.success('Message sent successfully');
      setMessageForm({
        target_type: 'individual',
        room_number: '',
        guest_name: '',
        message_type: 'announcement',
        priority: 'normal',
        subject: '',
        message: ''
      });
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to send message');
    }
  });

  const handleSendMessage = () => {
    if (!messageForm.subject || !messageForm.message) {
      toast.error('Please fill in subject and message');
      return;
    }
    sendMessageMutation.mutate(messageForm);
  };

  const checkedInGuests = reservations.filter(r => r.status === 'checked_in');
  const guestsWithRooms = checkedInGuests.map(res => {
    const guest = guests.find(g => g.id === res.guest_id);
    const room = rooms.find(r => r.id === res.room_id);
    return { guest, room, reservation: res };
  }).filter(item => item.guest && item.room);

  const filteredMessages = messages.filter(msg => {
    const guest = guests.find(g => g.id === msg.guest_id);
    const room = rooms.find(r => r.id === msg.room_id);
    const searchLower = searchTerm.toLowerCase();
    return (
      msg.subject?.toLowerCase().includes(searchLower) ||
      msg.message?.toLowerCase().includes(searchLower) ||
      guest?.first_name?.toLowerCase().includes(searchLower) ||
      guest?.last_name?.toLowerCase().includes(searchLower) ||
      room?.room_number?.toLowerCase().includes(searchLower)
    );
  });

  const messageTypeColors = {
    announcement: 'bg-blue-100 text-blue-800',
    promotion: 'bg-green-100 text-green-800',
    reminder: 'bg-yellow-100 text-yellow-800',
    service_update: 'bg-purple-100 text-purple-800',
    urgent: 'bg-red-100 text-red-800'
  };

  const priorityColors = {
    low: 'bg-gray-100 text-gray-800',
    normal: 'bg-blue-100 text-blue-800',
    high: 'bg-red-100 text-red-800'
  };

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-900">Guest Communication Center</h1>
        <p className="text-slate-600 mt-1">Send messages and notifications to guests</p>
      </div>

      <Tabs defaultValue="compose" className="space-y-4">
        <TabsList>
          <TabsTrigger value="compose">
            <Send className="w-4 h-4 mr-2" />
            Compose Message
          </TabsTrigger>
          <TabsTrigger value="sent">
            <MessageSquare className="w-4 h-4 mr-2" />
            Sent Messages ({messages.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="compose">
          <Card>
            <CardHeader>
              <CardTitle>New Message</CardTitle>
              <CardDescription>Send a message to guests</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Target Audience</Label>
                  <Select value={messageForm.target_type} onValueChange={(val) => setMessageForm({...messageForm, target_type: val})}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="individual">Individual Guest</SelectItem>
                      <SelectItem value="all_checked_in">All Checked-In Guests ({checkedInGuests.length})</SelectItem>
                      <SelectItem value="vip">VIP Guests Only</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {messageForm.target_type === 'individual' && (
                  <>
                    <div className="space-y-2">
                      <Label>Room Number</Label>
                      <Input 
                        placeholder="e.g., 101" 
                        value={messageForm.room_number}
                        onChange={(e) => setMessageForm({...messageForm, room_number: e.target.value, guest_name: ''})}
                      />
                    </div>
                    <div className="space-y-2 md:col-span-2">
                      <Label>Or Guest Name</Label>
                      <Input 
                        placeholder="Search by name..." 
                        value={messageForm.guest_name}
                        onChange={(e) => setMessageForm({...messageForm, guest_name: e.target.value, room_number: ''})}
                      />
                    </div>
                  </>
                )}

                <div className="space-y-2">
                  <Label>Message Type</Label>
                  <Select value={messageForm.message_type} onValueChange={(val) => setMessageForm({...messageForm, message_type: val})}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="announcement">Announcement</SelectItem>
                      <SelectItem value="promotion">Promotion</SelectItem>
                      <SelectItem value="reminder">Reminder</SelectItem>
                      <SelectItem value="service_update">Service Update</SelectItem>
                      <SelectItem value="urgent">Urgent</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Priority</Label>
                  <Select value={messageForm.priority} onValueChange={(val) => setMessageForm({...messageForm, priority: val})}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="normal">Normal</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2 md:col-span-2">
                  <Label>Subject</Label>
                  <Input 
                    placeholder="Message subject..." 
                    value={messageForm.subject}
                    onChange={(e) => setMessageForm({...messageForm, subject: e.target.value})}
                  />
                </div>

                <div className="space-y-2 md:col-span-2">
                  <Label>Message</Label>
                  <Textarea 
                    placeholder="Type your message here..." 
                    value={messageForm.message}
                    onChange={(e) => setMessageForm({...messageForm, message: e.target.value})}
                    rows={6}
                  />
                </div>
              </div>

              <Button 
                onClick={handleSendMessage} 
                disabled={sendMessageMutation.isPending}
                className="w-full"
              >
                <Send className="w-4 h-4 mr-2" />
                {sendMessageMutation.isPending ? 'Sending...' : 'Send Message'}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="sent">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Sent Messages</CardTitle>
                  <CardDescription>View all messages sent to guests</CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <Search className="w-4 h-4 text-slate-400" />
                  <Input 
                    placeholder="Search messages..." 
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-64"
                  />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {filteredMessages.length === 0 ? (
                  <p className="text-center text-slate-500 py-8">No messages sent yet</p>
                ) : (
                  filteredMessages.map((msg) => {
                    const guest = guests.find(g => g.id === msg.guest_id);
                    const room = rooms.find(r => r.id === msg.room_id);
                    
                    return (
                      <div key={msg.id} className="border rounded-lg p-4 space-y-2">
                        <div className="flex items-start justify-between">
                          <div className="space-y-1 flex-1">
                            <div className="flex items-center gap-2">
                              <h3 className="font-semibold">{msg.subject}</h3>
                              <Badge className={messageTypeColors[msg.message_type]}>
                                {msg.message_type}
                              </Badge>
                              <Badge className={priorityColors[msg.priority]}>
                                {msg.priority}
                              </Badge>
                            </div>
                            <p className="text-sm text-slate-600">{msg.message}</p>
                            <div className="flex items-center gap-4 text-xs text-slate-500">
                              <span>To: {guest ? `${guest.first_name} ${guest.last_name}` : 'Unknown'}</span>
                              {room && <span>Room {room.room_number}</span>}
                              <span>{moment(msg.sent_date).format('MMM D, YYYY h:mm A')}</span>
                            </div>
                          </div>
                          <div className="ml-4">
                            {msg.status === 'read' ? (
                              <CheckCircle2 className="w-5 h-5 text-green-500" />
                            ) : (
                              <Clock className="w-5 h-5 text-slate-400" />
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}