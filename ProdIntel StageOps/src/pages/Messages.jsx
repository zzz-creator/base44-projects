import React, { useState, useEffect, useRef } from 'react';
import { base44 } from '../api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { ScrollArea } from '../components/ui/scroll-area';
import { Avatar, AvatarFallback } from '../components/ui/avatar';
import { 
  MessageSquare, Send, Plus, Search, Users, Hash, 
  ArrowLeft, MoreVertical, Loader2 
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter
} from '../components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../components/ui/select';
import moment from 'moment';
import { notifyNewMessage } from '../components/notifications/NotificationService';

export default function Messages() {
  const [currentUser, setCurrentUser] = useState(null);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [messageText, setMessageText] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [showNewConversation, setShowNewConversation] = useState(false);
  const [newConvoType, setNewConvoType] = useState('direct_message');
  const [newConvoName, setNewConvoName] = useState('');
  const [selectedProduction, setSelectedProduction] = useState('');
  const [selectedRecipient, setSelectedRecipient] = useState('');
  const messagesEndRef = useRef(null);
  const queryClient = useQueryClient();

  useEffect(() => {
    base44.auth.me().then(setCurrentUser).catch(() => {});
  }, []);

  // Get conversation ID from URL if present
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const convoId = params.get('conversation');
    if (convoId && conversations.length > 0) {
      const convo = conversations.find(c => c.id === convoId);
      if (convo) setSelectedConversation(convo);
    }
  }, []);

  const { data: conversations = [], isLoading: loadingConversations } = useQuery({
    queryKey: ['conversations', currentUser?.email],
    queryFn: async () => {
      const allConvos = await base44.entities.Conversation.list('-last_message_date');
      return allConvos.filter(c => {
        const participants = JSON.parse(c.participants || '[]');
        return participants.includes(currentUser?.email);
      });
    },
    enabled: !!currentUser?.email,
    refetchInterval: 10000
  });

  const { data: messages = [], isLoading: loadingMessages } = useQuery({
    queryKey: ['messages', selectedConversation?.id],
    queryFn: () => base44.entities.Message.filter({ conversation_id: selectedConversation?.id }, 'created_date'),
    enabled: !!selectedConversation?.id,
    refetchInterval: 5000
  });

  const { data: productions = [] } = useQuery({
    queryKey: ['productions'],
    queryFn: () => base44.entities.Production.list()
  });

  const { data: crewMembers = [] } = useQuery({
    queryKey: ['crewMembers'],
    queryFn: () => base44.entities.CrewMember.list()
  });

  const { data: users = [] } = useQuery({
    queryKey: ['users'],
    queryFn: () => base44.entities.User.list()
  });

  // Scroll to bottom when messages update
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessageMutation = useMutation({
    mutationFn: async (content) => {
      const message = await base44.entities.Message.create({
        conversation_id: selectedConversation.id,
        sender_email: currentUser.email,
        sender_name: currentUser.full_name,
        content,
        read_by: JSON.stringify([currentUser.email])
      });
      
      // Update conversation preview
      await base44.entities.Conversation.update(selectedConversation.id, {
        last_message_preview: content.substring(0, 100),
        last_message_date: new Date().toISOString()
      });
      
      // Notify other participants
      const participants = JSON.parse(selectedConversation.participants || '[]');
      const otherParticipants = participants.filter(p => p !== currentUser.email);
      await notifyNewMessage({
        conversation: selectedConversation,
        message,
        senderName: currentUser.full_name,
        recipientEmails: otherParticipants
      });
      
      return message;
    },
    onSuccess: () => {
      setMessageText('');
      queryClient.invalidateQueries({ queryKey: ['messages'] });
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
    }
  });

  const createConversationMutation = useMutation({
    mutationFn: async () => {
      let participants, name;
      
      if (newConvoType === 'direct_message') {
        participants = [currentUser.email, selectedRecipient];
        const recipientUser = users.find(u => u.email === selectedRecipient) || 
                             crewMembers.find(c => c.email === selectedRecipient);
        name = recipientUser?.full_name || selectedRecipient;
      } else {
        const production = productions.find(p => p.id === selectedProduction);
        participants = [currentUser.email];
        name = newConvoName || `${production?.name} - General`;
      }
      
      const convo = await base44.entities.Conversation.create({
        type: newConvoType,
        production_id: newConvoType === 'production_channel' ? selectedProduction : undefined,
        name,
        participants: JSON.stringify(participants)
      });
      
      return convo;
    },
    onSuccess: (convo) => {
      setShowNewConversation(false);
      setNewConvoName('');
      setSelectedProduction('');
      setSelectedRecipient('');
      setSelectedConversation(convo);
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
    }
  });

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (messageText.trim()) {
      sendMessageMutation.mutate(messageText.trim());
    }
  };

  const getInitials = (name) => {
    if (!name) return '?';
    return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
  };

  const filteredConversations = conversations.filter(c => 
    c.name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const directMessages = filteredConversations.filter(c => c.type === 'direct_message');
  const productionChannels = filteredConversations.filter(c => c.type === 'production_channel');

  return (
    <div className="h-[calc(100vh-4rem)] flex">
      {/* Sidebar */}
      <div className={`w-80 border-r bg-background flex flex-col ${selectedConversation ? 'hidden md:flex' : 'flex'}`}>
        <div className="p-4 border-b">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-xl font-bold flex items-center gap-2">
              <MessageSquare className="h-5 w-5" />
              Messages
            </h1>
            <Button size="icon" variant="ghost" onClick={() => setShowNewConversation(true)}>
              <Plus className="h-5 w-5" />
            </Button>
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="Search conversations..." 
              className="pl-9"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
        
        <ScrollArea className="flex-1">
          {productionChannels.length > 0 && (
            <div className="p-2">
              <div className="flex items-center gap-2 px-2 py-1 text-xs font-semibold text-muted-foreground uppercase">
                <Hash className="h-3 w-3" />
                Production Channels
              </div>
              {productionChannels.map(convo => (
                <ConversationItem 
                  key={convo.id}
                  conversation={convo}
                  isSelected={selectedConversation?.id === convo.id}
                  onClick={() => setSelectedConversation(convo)}
                  currentUserEmail={currentUser?.email}
                />
              ))}
            </div>
          )}
          
          {directMessages.length > 0 && (
            <div className="p-2">
              <div className="flex items-center gap-2 px-2 py-1 text-xs font-semibold text-muted-foreground uppercase">
                <Users className="h-3 w-3" />
                Direct Messages
              </div>
              {directMessages.map(convo => (
                <ConversationItem 
                  key={convo.id}
                  conversation={convo}
                  isSelected={selectedConversation?.id === convo.id}
                  onClick={() => setSelectedConversation(convo)}
                  currentUserEmail={currentUser?.email}
                />
              ))}
            </div>
          )}
          
          {filteredConversations.length === 0 && !loadingConversations && (
            <div className="p-4 text-center text-muted-foreground text-sm">
              No conversations yet. Start a new one!
            </div>
          )}
        </ScrollArea>
      </div>

      {/* Chat Area */}
      <div className={`flex-1 flex flex-col ${!selectedConversation ? 'hidden md:flex' : 'flex'}`}>
        {selectedConversation ? (
          <>
            {/* Chat Header */}
            <div className="h-14 border-b flex items-center justify-between px-4">
              <div className="flex items-center gap-3">
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="md:hidden"
                  onClick={() => setSelectedConversation(null)}
                >
                  <ArrowLeft className="h-5 w-5" />
                </Button>
                <div>
                  <h2 className="font-semibold">{selectedConversation.name}</h2>
                  {selectedConversation.topic && (
                    <p className="text-xs text-muted-foreground">{selectedConversation.topic}</p>
                  )}
                </div>
              </div>
              <Button variant="ghost" size="icon">
                <MoreVertical className="h-5 w-5" />
              </Button>
            </div>

            {/* Messages */}
            <ScrollArea className="flex-1 p-4">
              {loadingMessages ? (
                <div className="flex items-center justify-center h-full">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              ) : messages.length === 0 ? (
                <div className="flex items-center justify-center h-full text-muted-foreground">
                  No messages yet. Start the conversation!
                </div>
              ) : (
                <div className="space-y-4">
                  {messages.map((message, index) => {
                    const isOwn = message.sender_email === currentUser?.email;
                    const showAvatar = index === 0 || messages[index - 1].sender_email !== message.sender_email;
                    
                    return (
                      <div 
                        key={message.id}
                        className={`flex gap-3 ${isOwn ? 'flex-row-reverse' : ''}`}
                      >
                        {showAvatar ? (
                          <Avatar className="h-8 w-8">
                            <AvatarFallback className={isOwn ? 'bg-primary text-primary-foreground' : ''}>
                              {getInitials(message.sender_name)}
                            </AvatarFallback>
                          </Avatar>
                        ) : (
                          <div className="w-8" />
                        )}
                        <div className={`max-w-[70%] ${isOwn ? 'items-end' : ''}`}>
                          {showAvatar && (
                            <div className={`flex items-center gap-2 mb-1 ${isOwn ? 'flex-row-reverse' : ''}`}>
                              <span className="text-sm font-medium">{message.sender_name}</span>
                              <span className="text-xs text-muted-foreground">
                                {moment(message.created_date).format('h:mm A')}
                              </span>
                            </div>
                          )}
                          <div className={`rounded-lg px-3 py-2 ${
                            isOwn 
                              ? 'bg-primary text-primary-foreground' 
                              : 'bg-muted'
                          }`}>
                            <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                  <div ref={messagesEndRef} />
                </div>
              )}
            </ScrollArea>

            {/* Message Input */}
            <form onSubmit={handleSendMessage} className="p-4 border-t">
              <div className="flex gap-2">
                <Input
                  placeholder="Type a message..."
                  value={messageText}
                  onChange={(e) => setMessageText(e.target.value)}
                  className="flex-1"
                />
                <Button type="submit" disabled={!messageText.trim() || sendMessageMutation.isPending}>
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </form>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-muted-foreground">
            <div className="text-center">
              <MessageSquare className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Select a conversation or start a new one</p>
            </div>
          </div>
        )}
      </div>

      {/* New Conversation Dialog */}
      <Dialog open={showNewConversation} onOpenChange={setShowNewConversation}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>New Conversation</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Type</label>
              <Select value={newConvoType} onValueChange={setNewConvoType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="direct_message">Direct Message</SelectItem>
                  <SelectItem value="production_channel">Production Channel</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {newConvoType === 'direct_message' ? (
              <div className="space-y-2">
                <label className="text-sm font-medium">Recipient</label>
                <Select value={selectedRecipient} onValueChange={setSelectedRecipient}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a person" />
                  </SelectTrigger>
                  <SelectContent>
                    {users.filter(u => u.email !== currentUser?.email).map(user => (
                      <SelectItem key={user.id} value={user.email}>
                        {user.full_name} ({user.email})
                      </SelectItem>
                    ))}
                    {crewMembers.filter(c => c.email && !users.find(u => u.email === c.email)).map(crew => (
                      <SelectItem key={crew.id} value={crew.email}>
                        {crew.full_name} ({crew.email})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            ) : (
              <>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Production</label>
                  <Select value={selectedProduction} onValueChange={setSelectedProduction}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select production" />
                    </SelectTrigger>
                    <SelectContent>
                      {productions.map(prod => (
                        <SelectItem key={prod.id} value={prod.id}>
                          {prod.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Channel Name</label>
                  <Input
                    placeholder="e.g., Lighting Team, General"
                    value={newConvoName}
                    onChange={(e) => setNewConvoName(e.target.value)}
                  />
                </div>
              </>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowNewConversation(false)}>
              Cancel
            </Button>
            <Button 
              onClick={() => createConversationMutation.mutate()}
              disabled={
                createConversationMutation.isPending ||
                (newConvoType === 'direct_message' && !selectedRecipient) ||
                (newConvoType === 'production_channel' && !selectedProduction)
              }
            >
              {createConversationMutation.isPending ? (
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

function ConversationItem({ conversation, isSelected, onClick, currentUserEmail }) {
  const isChannel = conversation.type === 'production_channel';
  
  return (
    <button
      onClick={onClick}
      className={`w-full text-left p-3 rounded-lg transition-colors ${
        isSelected ? 'bg-accent' : 'hover:bg-muted'
      }`}
    >
      <div className="flex items-center gap-3">
        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
          isChannel ? 'bg-purple-100 text-purple-600' : 'bg-blue-100 text-blue-600'
        }`}>
          {isChannel ? <Hash className="h-4 w-4" /> : <Users className="h-4 w-4" />}
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-medium truncate">{conversation.name}</p>
          {conversation.last_message_preview && (
            <p className="text-xs text-muted-foreground truncate">
              {conversation.last_message_preview}
            </p>
          )}
        </div>
        {conversation.last_message_date && (
          <span className="text-xs text-muted-foreground">
            {moment(conversation.last_message_date).fromNow(true)}
          </span>
        )}
      </div>
    </button>
  );
}