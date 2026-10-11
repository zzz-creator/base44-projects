import React, { useState, useEffect, useRef } from 'react';
import { base44 } from '../../api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { ScrollArea } from '../../components/ui/scroll-area';
import { Avatar, AvatarFallback } from '../../components/ui/avatar';
import { 
  Hash, Send, Plus, Loader2, MessageSquare, MoreVertical 
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter
} from '../../components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '../../components/ui/dropdown-menu';
import moment from 'moment';
import { notifyNewMessage } from '../../components/notifications/NotificationService';

export default function ProductionChannels({ productionId, productionName }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [selectedChannel, setSelectedChannel] = useState(null);
  const [messageText, setMessageText] = useState('');
  const [showNewChannel, setShowNewChannel] = useState(false);
  const [newChannelName, setNewChannelName] = useState('');
  const messagesEndRef = useRef(null);
  const queryClient = useQueryClient();

  useEffect(() => {
    base44.auth.me().then(setCurrentUser).catch(() => {});
  }, []);

  const { data: channels = [] } = useQuery({
    queryKey: ['productionChannels', productionId],
    queryFn: async () => {
      const allConvos = await base44.entities.Conversation.filter({ 
        production_id: productionId,
        type: 'production_channel'
      }, '-last_message_date');
      return allConvos;
    },
    enabled: !!productionId,
    refetchInterval: 10000
  });

  const { data: messages = [] } = useQuery({
    queryKey: ['channelMessages', selectedChannel?.id],
    queryFn: () => base44.entities.Message.filter({ conversation_id: selectedChannel?.id }, 'created_date'),
    enabled: !!selectedChannel?.id,
    refetchInterval: 5000
  });

  const { data: crewAssignments = [] } = useQuery({
    queryKey: ['productionCrew', productionId],
    queryFn: () => base44.entities.CrewAssignment.filter({ production_id: productionId }),
    enabled: !!productionId
  });

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Auto-select first channel or create default if none exist
  useEffect(() => {
    if (channels.length > 0 && !selectedChannel) {
      setSelectedChannel(channels[0]);
    }
  }, [channels, selectedChannel]);

  const createChannelMutation = useMutation({
    mutationFn: async () => {
      const convo = await base44.entities.Conversation.create({
        type: 'production_channel',
        production_id: productionId,
        name: newChannelName || 'General',
        participants: JSON.stringify([currentUser.email])
      });
      return convo;
    },
    onSuccess: (convo) => {
      setShowNewChannel(false);
      setNewChannelName('');
      setSelectedChannel(convo);
      queryClient.invalidateQueries({ queryKey: ['productionChannels'] });
    }
  });

  const sendMessageMutation = useMutation({
    mutationFn: async (content) => {
      const message = await base44.entities.Message.create({
        conversation_id: selectedChannel.id,
        sender_email: currentUser.email,
        sender_name: currentUser.full_name,
        content,
        read_by: JSON.stringify([currentUser.email])
      });
      
      await base44.entities.Conversation.update(selectedChannel.id, {
        last_message_preview: content.substring(0, 100),
        last_message_date: new Date().toISOString()
      });
      
      // Notify other participants
      const participants = JSON.parse(selectedChannel.participants || '[]');
      const otherParticipants = participants.filter(p => p !== currentUser.email);
      if (otherParticipants.length > 0) {
        await notifyNewMessage({
          conversation: selectedChannel,
          message,
          senderName: currentUser.full_name,
          recipientEmails: otherParticipants
        });
      }
      
      return message;
    },
    onSuccess: () => {
      setMessageText('');
      queryClient.invalidateQueries({ queryKey: ['channelMessages'] });
      queryClient.invalidateQueries({ queryKey: ['productionChannels'] });
    }
  });

  const joinChannelMutation = useMutation({
    mutationFn: async (channel) => {
      const participants = JSON.parse(channel.participants || '[]');
      if (!participants.includes(currentUser.email)) {
        participants.push(currentUser.email);
        await base44.entities.Conversation.update(channel.id, {
          participants: JSON.stringify(participants)
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['productionChannels'] });
    }
  });

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (messageText.trim()) {
      // Join channel if not a participant
      const participants = JSON.parse(selectedChannel?.participants || '[]');
      if (!participants.includes(currentUser?.email)) {
        joinChannelMutation.mutate(selectedChannel);
      }
      sendMessageMutation.mutate(messageText.trim());
    }
  };

  const getInitials = (name) => {
    if (!name) return '?';
    return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
  };

  return (
    <div className="flex h-[500px] border rounded-lg overflow-hidden bg-background">
      {/* Channels Sidebar */}
      <div className="w-48 border-r bg-muted/30 flex flex-col">
        <div className="p-3 border-b flex items-center justify-between">
          <span className="text-sm font-medium">Channels</span>
          <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => setShowNewChannel(true)}>
            <Plus className="h-4 w-4" />
          </Button>
        </div>
        <ScrollArea className="flex-1">
          {channels.length === 0 ? (
            <div className="p-3 text-xs text-muted-foreground text-center">
              No channels yet
            </div>
          ) : (
            channels.map(channel => (
              <button
                key={channel.id}
                onClick={() => setSelectedChannel(channel)}
                className={`w-full text-left px-3 py-2 text-sm flex items-center gap-2 hover:bg-muted transition-colors ${
                  selectedChannel?.id === channel.id ? 'bg-muted' : ''
                }`}
              >
                <Hash className="h-4 w-4 text-muted-foreground" />
                <span className="truncate">{channel.name}</span>
              </button>
            ))
          )}
        </ScrollArea>
      </div>

      {/* Chat Area */}
      <div className="flex-1 flex flex-col">
        {selectedChannel ? (
          <>
            <div className="h-12 border-b flex items-center justify-between px-4">
              <div className="flex items-center gap-2">
                <Hash className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium">{selectedChannel.name}</span>
              </div>
            </div>

            <ScrollArea className="flex-1 p-4">
              {messages.length === 0 ? (
                <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
                  No messages yet. Start the conversation!
                </div>
              ) : (
                <div className="space-y-3">
                  {messages.map((message, index) => {
                    const isOwn = message.sender_email === currentUser?.email;
                    const showAvatar = index === 0 || messages[index - 1].sender_email !== message.sender_email;
                    
                    return (
                      <div key={message.id} className="flex gap-2">
                        {showAvatar ? (
                          <Avatar className="h-7 w-7">
                            <AvatarFallback className="text-xs">
                              {getInitials(message.sender_name)}
                            </AvatarFallback>
                          </Avatar>
                        ) : (
                          <div className="w-7" />
                        )}
                        <div className="flex-1 min-w-0">
                          {showAvatar && (
                            <div className="flex items-center gap-2 mb-0.5">
                              <span className="text-sm font-medium">{message.sender_name}</span>
                              <span className="text-xs text-muted-foreground">
                                {moment(message.created_date).format('h:mm A')}
                              </span>
                            </div>
                          )}
                          <p className="text-sm">{message.content}</p>
                        </div>
                      </div>
                    );
                  })}
                  <div ref={messagesEndRef} />
                </div>
              )}
            </ScrollArea>

            <form onSubmit={handleSendMessage} className="p-3 border-t">
              <div className="flex gap-2">
                <Input
                  placeholder={`Message #${selectedChannel.name}`}
                  value={messageText}
                  onChange={(e) => setMessageText(e.target.value)}
                  className="flex-1"
                />
                <Button type="submit" size="icon" disabled={!messageText.trim() || sendMessageMutation.isPending}>
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </form>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-muted-foreground">
            <div className="text-center">
              <MessageSquare className="h-10 w-10 mx-auto mb-2 opacity-50" />
              <p className="text-sm">Create a channel to start chatting</p>
              <Button size="sm" className="mt-2" onClick={() => setShowNewChannel(true)}>
                <Plus className="h-4 w-4 mr-1" />
                New Channel
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* New Channel Dialog */}
      <Dialog open={showNewChannel} onOpenChange={setShowNewChannel}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>New Channel</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <Input
              placeholder="Channel name (e.g., Lighting Team)"
              value={newChannelName}
              onChange={(e) => setNewChannelName(e.target.value)}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowNewChannel(false)}>
              Cancel
            </Button>
            <Button 
              onClick={() => createChannelMutation.mutate()}
              disabled={createChannelMutation.isPending}
            >
              {createChannelMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                'Create'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}