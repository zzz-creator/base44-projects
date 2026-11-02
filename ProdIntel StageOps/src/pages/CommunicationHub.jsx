import React, { useState, useEffect, useRef } from 'react';
import { base44 } from '../api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { format, isAfter, parseISO } from 'date-fns';
import { Card, CardContent } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Badge } from '../components/ui/badge';
import { ScrollArea } from '../components/ui/scroll-area';
import { Avatar, AvatarFallback } from '../components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Textarea } from '../components/ui/textarea';
import { Label } from '../components/ui/label';
import { Checkbox } from '../components/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '../components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../components/ui/select';
import {
  MessageSquare,
  Megaphone,
  Users,
  Hash,
  Plus,
  Send,
  Pin,
  AlertTriangle,
  Loader2,
  Building2,
  ArrowLeft
} from 'lucide-react';

const DEPARTMENTS = [
  'Lighting', 'Sound', 'Staging', 'Props', 'Wardrobe', 'Set', 'Technical', 'Production'
];

const PRODUCTION_ROLES = [
  { value: 'stage_manager', label: 'Stage Manager' },
  { value: 'lighting_lead', label: 'Lighting Lead' },
  { value: 'sound_lead', label: 'Sound Lead' },
  { value: 'props_master', label: 'Props Master' },
  { value: 'technical_director', label: 'Technical Director' },
  { value: 'wardrobe_lead', label: 'Wardrobe Lead' },
  { value: 'set_lead', label: 'Set Lead' },
  { value: 'crew_member', label: 'Crew Member' },
];

export default function CommunicationHub() {
  const [currentUser, setCurrentUser] = useState(null);
  const [activeTab, setActiveTab] = useState('announcements');
  const [showNewAnnouncement, setShowNewAnnouncement] = useState(false);
  const [showNewChat, setShowNewChat] = useState(false);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [messageText, setMessageText] = useState('');
  const messagesEndRef = useRef(null);
  const queryClient = useQueryClient();

  useEffect(() => {
    base44.auth.me().then(setCurrentUser).catch(() => {});
  }, []);

  // Queries
  const { data: announcements = [], isLoading: loadingAnnouncements } = useQuery({
    queryKey: ['announcements'],
    queryFn: () => base44.entities.Announcement.list('-created_date'),
  });

  const { data: conversations = [] } = useQuery({
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

  const { data: messages = [] } = useQuery({
    queryKey: ['messages', selectedConversation?.id],
    queryFn: () => base44.entities.Message.filter({ conversation_id: selectedConversation?.id }, 'created_date'),
    enabled: !!selectedConversation?.id,
    refetchInterval: 5000
  });

  const { data: productions = [] } = useQuery({
    queryKey: ['productions'],
    queryFn: () => base44.entities.Production.list()
  });

  const { data: users = [] } = useQuery({
    queryKey: ['users'],
    queryFn: () => base44.entities.User.list()
  });

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Filter visible announcements based on user
  const visibleAnnouncements = announcements.filter(ann => {
    if (!currentUser) return false;
    
    // Check expiry
    if (ann.expires_at && isAfter(new Date(), parseISO(ann.expires_at))) return false;
    
    if (ann.visibility === 'all') return true;
    if (ann.visibility === 'role' && ann.target_roles) {
      const targetRoles = JSON.parse(ann.target_roles);
      return targetRoles.includes(currentUser.production_role);
    }
    return true;
  });

  const pinnedAnnouncements = visibleAnnouncements.filter(a => a.is_pinned);
  const regularAnnouncements = visibleAnnouncements.filter(a => !a.is_pinned);

  // Group conversations
  const directMessages = conversations.filter(c => c.type === 'direct_message');
  const productionChannels = conversations.filter(c => c.type === 'production_channel');
  const departmentChannels = conversations.filter(c => c.type === 'department_channel');
  const groupChats = conversations.filter(c => c.type === 'group_chat');

  const sendMessageMutation = useMutation({
    mutationFn: async (content) => {
      await base44.entities.Message.create({
        conversation_id: selectedConversation.id,
        sender_email: currentUser.email,
        sender_name: currentUser.full_name,
        content,
        read_by: JSON.stringify([currentUser.email])
      });
      await base44.entities.Conversation.update(selectedConversation.id, {
        last_message_preview: content.substring(0, 100),
        last_message_date: new Date().toISOString()
      });
    },
    onSuccess: () => {
      setMessageText('');
      queryClient.invalidateQueries({ queryKey: ['messages'] });
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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Communication Hub</h1>
          <p className="text-slate-500">Announcements, messages, and team communication</p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="announcements" className="gap-2">
            <Megaphone className="w-4 h-4" />
            Announcements
          </TabsTrigger>
          <TabsTrigger value="messages" className="gap-2">
            <MessageSquare className="w-4 h-4" />
            Messages
          </TabsTrigger>
        </TabsList>

        {/* Announcements Tab */}
        <TabsContent value="announcements" className="space-y-4">
          <div className="flex justify-end">
            <Button onClick={() => setShowNewAnnouncement(true)}>
              <Plus className="w-4 h-4 mr-2" />
              New Announcement
            </Button>
          </div>

          {/* Pinned Announcements */}
          {pinnedAnnouncements.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-muted-foreground flex items-center gap-2">
                <Pin className="w-4 h-4" />
                Pinned
              </h3>
              {pinnedAnnouncements.map(ann => (
                <AnnouncementCard key={ann.id} announcement={ann} currentUser={currentUser} />
              ))}
            </div>
          )}

          {/* Regular Announcements */}
          <div className="space-y-3">
            {regularAnnouncements.length === 0 && pinnedAnnouncements.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <Megaphone className="w-12 h-12 text-slate-300 mb-4" />
                  <h3 className="text-lg font-medium">No announcements</h3>
                  <p className="text-slate-500">Create one to notify your team</p>
                </CardContent>
              </Card>
            ) : (
              regularAnnouncements.map(ann => (
                <AnnouncementCard key={ann.id} announcement={ann} currentUser={currentUser} />
              ))
            )}
          </div>
        </TabsContent>

        {/* Messages Tab */}
        <TabsContent value="messages">
          <div className="h-[calc(100vh-14rem)] flex border rounded-lg overflow-hidden">
            {/* Sidebar */}
            <div className={`w-72 border-r bg-slate-50 flex flex-col ${selectedConversation ? 'hidden md:flex' : 'flex'}`}>
              <div className="p-3 border-b">
                <Button size="sm" className="w-full" onClick={() => setShowNewChat(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  New Conversation
                </Button>
              </div>
              
              <ScrollArea className="flex-1">
                {productionChannels.length > 0 && (
                  <div className="p-2">
                    <p className="text-xs font-semibold text-muted-foreground px-2 py-1 flex items-center gap-1">
                      <Hash className="w-3 h-3" />
                      Production Channels
                    </p>
                    {productionChannels.map(c => (
                      <ConversationItem
                        key={c.id}
                        conversation={c}
                        isSelected={selectedConversation?.id === c.id}
                        onClick={() => setSelectedConversation(c)}
                      />
                    ))}
                  </div>
                )}

                {departmentChannels.length > 0 && (
                  <div className="p-2">
                    <p className="text-xs font-semibold text-muted-foreground px-2 py-1 flex items-center gap-1">
                      <Building2 className="w-3 h-3" />
                      Department Channels
                    </p>
                    {departmentChannels.map(c => (
                      <ConversationItem
                        key={c.id}
                        conversation={c}
                        isSelected={selectedConversation?.id === c.id}
                        onClick={() => setSelectedConversation(c)}
                      />
                    ))}
                  </div>
                )}

                {groupChats.length > 0 && (
                  <div className="p-2">
                    <p className="text-xs font-semibold text-muted-foreground px-2 py-1 flex items-center gap-1">
                      <Users className="w-3 h-3" />
                      Group Chats
                    </p>
                    {groupChats.map(c => (
                      <ConversationItem
                        key={c.id}
                        conversation={c}
                        isSelected={selectedConversation?.id === c.id}
                        onClick={() => setSelectedConversation(c)}
                      />
                    ))}
                  </div>
                )}

                {directMessages.length > 0 && (
                  <div className="p-2">
                    <p className="text-xs font-semibold text-muted-foreground px-2 py-1 flex items-center gap-1">
                      <MessageSquare className="w-3 h-3" />
                      Direct Messages
                    </p>
                    {directMessages.map(c => (
                      <ConversationItem
                        key={c.id}
                        conversation={c}
                        isSelected={selectedConversation?.id === c.id}
                        onClick={() => setSelectedConversation(c)}
                      />
                    ))}
                  </div>
                )}
              </ScrollArea>
            </div>

            {/* Chat Area */}
            <div className={`flex-1 flex flex-col bg-white ${!selectedConversation ? 'hidden md:flex' : 'flex'}`}>
              {selectedConversation ? (
                <>
                  <div className="h-12 border-b flex items-center px-4 gap-3">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="md:hidden h-8 w-8"
                      onClick={() => setSelectedConversation(null)}
                    >
                      <ArrowLeft className="w-4 h-4" />
                    </Button>
                    <span className="font-semibold">{selectedConversation.name}</span>
                  </div>

                  <ScrollArea className="flex-1 p-4">
                    <div className="space-y-3">
                      {messages.map((msg, idx) => {
                        const isOwn = msg.sender_email === currentUser?.email;
                        return (
                          <div key={msg.id} className={`flex gap-2 ${isOwn ? 'flex-row-reverse' : ''}`}>
                            <Avatar className="h-7 w-7">
                              <AvatarFallback className={`text-xs ${isOwn ? 'bg-primary text-primary-foreground' : ''}`}>
                                {getInitials(msg.sender_name)}
                              </AvatarFallback>
                            </Avatar>
                            <div className={`max-w-[70%] ${isOwn ? 'text-right' : ''}`}>
                              <p className="text-xs text-muted-foreground mb-1">{msg.sender_name}</p>
                              <div className={`rounded-lg px-3 py-2 text-sm ${isOwn ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>
                                {msg.content}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                      <div ref={messagesEndRef} />
                    </div>
                  </ScrollArea>

                  <form onSubmit={handleSendMessage} className="p-3 border-t flex gap-2">
                    <Input
                      placeholder="Type a message..."
                      value={messageText}
                      onChange={(e) => setMessageText(e.target.value)}
                      className="flex-1"
                    />
                    <Button type="submit" disabled={!messageText.trim()}>
                      <Send className="w-4 h-4" />
                    </Button>
                  </form>
                </>
              ) : (
                <div className="flex-1 flex items-center justify-center text-muted-foreground">
                  <div className="text-center">
                    <MessageSquare className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>Select a conversation to start messaging</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </TabsContent>
      </Tabs>

      {/* New Announcement Dialog */}
      <NewAnnouncementDialog
        open={showNewAnnouncement}
        onClose={() => setShowNewAnnouncement(false)}
        currentUser={currentUser}
        productions={productions}
      />

      {/* New Chat Dialog */}
      <NewChatDialog
        open={showNewChat}
        onClose={() => setShowNewChat(false)}
        currentUser={currentUser}
        productions={productions}
        users={users}
        onCreated={(convo) => {
          setSelectedConversation(convo);
          setShowNewChat(false);
        }}
      />
    </div>
  );
}

function AnnouncementCard({ announcement, currentUser }) {
  const priorityStyles = {
    normal: '',
    important: 'border-amber-200 bg-amber-50',
    urgent: 'border-red-200 bg-red-50',
  };

  return (
    <Card className={priorityStyles[announcement.priority]}>
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              {announcement.priority === 'urgent' && (
                <AlertTriangle className="w-4 h-4 text-red-500" />
              )}
              <h4 className="font-semibold">{announcement.title}</h4>
              {announcement.is_pinned && <Pin className="w-3 h-3 text-muted-foreground" />}
            </div>
            <p className="text-sm text-muted-foreground mb-2">{announcement.content}</p>
            <div className="flex items-center gap-3 text-xs text-muted-foreground">
              <span>{announcement.author_name}</span>
              <span>•</span>
              <span>{format(new Date(announcement.created_date), 'MMM d, h:mm a')}</span>
              {announcement.visibility !== 'all' && (
                <>
                  <span>•</span>
                  <Badge variant="outline" className="text-xs">
                    {announcement.visibility === 'production' ? 'Production' : 
                     announcement.visibility === 'department' ? announcement.target_department : 
                     'Role-specific'}
                  </Badge>
                </>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function ConversationItem({ conversation, isSelected, onClick }) {
  const typeIcons = {
    direct_message: MessageSquare,
    production_channel: Hash,
    department_channel: Building2,
    group_chat: Users,
  };
  const Icon = typeIcons[conversation.type] || MessageSquare;

  return (
    <button
      onClick={onClick}
      className={`w-full text-left p-2 rounded-lg transition-colors ${isSelected ? 'bg-slate-200' : 'hover:bg-slate-100'}`}
    >
      <div className="flex items-center gap-2">
        <Icon className="w-4 h-4 text-muted-foreground" />
        <span className="text-sm font-medium truncate">{conversation.name}</span>
      </div>
      {conversation.last_message_preview && (
        <p className="text-xs text-muted-foreground truncate mt-1 ml-6">
          {conversation.last_message_preview}
        </p>
      )}
    </button>
  );
}

function NewAnnouncementDialog({ open, onClose, currentUser, productions }) {
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    visibility: 'all',
    target_production_id: '',
    target_department: '',
    target_roles: [],
    priority: 'normal',
    is_pinned: false,
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.Announcement.create({
      ...data,
      author_email: currentUser?.email,
      author_name: currentUser?.full_name,
      target_roles: data.target_roles.length > 0 ? JSON.stringify(data.target_roles) : null,
      read_by: JSON.stringify([currentUser?.email]),
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['announcements'] });
      onClose();
      setFormData({ title: '', content: '', visibility: 'all', target_production_id: '', target_department: '', target_roles: [], priority: 'normal', is_pinned: false });
    },
  });

  const handleRoleToggle = (role) => {
    const roles = formData.target_roles;
    if (roles.includes(role)) {
      setFormData({ ...formData, target_roles: roles.filter(r => r !== role) });
    } else {
      setFormData({ ...formData, target_roles: [...roles, role] });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>New Announcement</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div>
            <Label>Title *</Label>
            <Input
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="Announcement title"
            />
          </div>
          <div>
            <Label>Content *</Label>
            <Textarea
              value={formData.content}
              onChange={(e) => setFormData({ ...formData, content: e.target.value })}
              placeholder="Write your announcement..."
              rows={4}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Visibility</Label>
              <Select value={formData.visibility} onValueChange={(v) => setFormData({ ...formData, visibility: v })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Everyone</SelectItem>
                  <SelectItem value="production">Specific Production</SelectItem>
                  <SelectItem value="department">Department</SelectItem>
                  <SelectItem value="role">By Role</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Priority</Label>
              <Select value={formData.priority} onValueChange={(v) => setFormData({ ...formData, priority: v })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="normal">Normal</SelectItem>
                  <SelectItem value="important">Important</SelectItem>
                  <SelectItem value="urgent">Urgent</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {formData.visibility === 'production' && (
            <div>
              <Label>Production</Label>
              <Select value={formData.target_production_id} onValueChange={(v) => setFormData({ ...formData, target_production_id: v })}>
                <SelectTrigger>
                  <SelectValue placeholder="Select production" />
                </SelectTrigger>
                <SelectContent>
                  {productions.map(p => (
                    <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {formData.visibility === 'department' && (
            <div>
              <Label>Department</Label>
              <Select value={formData.target_department} onValueChange={(v) => setFormData({ ...formData, target_department: v })}>
                <SelectTrigger>
                  <SelectValue placeholder="Select department" />
                </SelectTrigger>
                <SelectContent>
                  {DEPARTMENTS.map(d => (
                    <SelectItem key={d} value={d}>{d}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {formData.visibility === 'role' && (
            <div>
              <Label>Target Roles</Label>
              <div className="flex flex-wrap gap-2 mt-2">
                {PRODUCTION_ROLES.map(role => (
                  <Badge
                    key={role.value}
                    variant={formData.target_roles.includes(role.value) ? 'default' : 'outline'}
                    className="cursor-pointer"
                    onClick={() => handleRoleToggle(role.value)}
                  >
                    {role.label}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          <div className="flex items-center gap-2">
            <Checkbox
              id="pinned"
              checked={formData.is_pinned}
              onCheckedChange={(checked) => setFormData({ ...formData, is_pinned: checked })}
            />
            <Label htmlFor="pinned">Pin this announcement</Label>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button
            onClick={() => createMutation.mutate(formData)}
            disabled={!formData.title || !formData.content || createMutation.isPending}
          >
            {createMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            Post Announcement
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function NewChatDialog({ open, onClose, currentUser, productions, users, onCreated }) {
  const queryClient = useQueryClient();
  const [chatType, setChatType] = useState('direct_message');
  const [name, setName] = useState('');
  const [selectedProduction, setSelectedProduction] = useState('');
  const [selectedDepartment, setSelectedDepartment] = useState('');
  const [selectedUsers, setSelectedUsers] = useState([]);

  const createMutation = useMutation({
    mutationFn: async () => {
      let participants = [currentUser.email];
      let convoName = name;

      if (chatType === 'direct_message' && selectedUsers.length === 1) {
        participants = [currentUser.email, selectedUsers[0]];
        const user = users.find(u => u.email === selectedUsers[0]);
        convoName = user?.full_name || selectedUsers[0];
      } else if (chatType === 'group_chat') {
        participants = [currentUser.email, ...selectedUsers];
      } else if (chatType === 'production_channel') {
        const prod = productions.find(p => p.id === selectedProduction);
        convoName = name || `${prod?.name} - General`;
      } else if (chatType === 'department_channel') {
        convoName = name || `${selectedDepartment} Team`;
      }

      const convo = await base44.entities.Conversation.create({
        type: chatType,
        name: convoName,
        participants: JSON.stringify(participants),
        production_id: chatType === 'production_channel' ? selectedProduction : undefined,
        department: chatType === 'department_channel' ? selectedDepartment : undefined,
        admins: JSON.stringify([currentUser.email]),
      });

      return convo;
    },
    onSuccess: (convo) => {
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
      onCreated(convo);
      setChatType('direct_message');
      setName('');
      setSelectedProduction('');
      setSelectedDepartment('');
      setSelectedUsers([]);
    },
  });

  const toggleUser = (email) => {
    if (selectedUsers.includes(email)) {
      setSelectedUsers(selectedUsers.filter(e => e !== email));
    } else {
      if (chatType === 'direct_message') {
        setSelectedUsers([email]);
      } else {
        setSelectedUsers([...selectedUsers, email]);
      }
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>New Conversation</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div>
            <Label>Type</Label>
            <Select value={chatType} onValueChange={(v) => { setChatType(v); setSelectedUsers([]); }}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="direct_message">Direct Message</SelectItem>
                <SelectItem value="group_chat">Group Chat</SelectItem>
                <SelectItem value="production_channel">Production Channel</SelectItem>
                <SelectItem value="department_channel">Department Channel</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {(chatType === 'direct_message' || chatType === 'group_chat') && (
            <div>
              <Label>{chatType === 'direct_message' ? 'Recipient' : 'Participants'}</Label>
              <div className="max-h-40 overflow-y-auto border rounded-lg mt-2">
                {users.filter(u => u.email !== currentUser?.email).map(user => (
                  <div
                    key={user.id}
                    className={`flex items-center gap-2 p-2 cursor-pointer hover:bg-slate-50 ${selectedUsers.includes(user.email) ? 'bg-blue-50' : ''}`}
                    onClick={() => toggleUser(user.email)}
                  >
                    <Checkbox checked={selectedUsers.includes(user.email)} />
                    <span className="text-sm">{user.full_name}</span>
                    <span className="text-xs text-muted-foreground">({user.email})</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {chatType === 'production_channel' && (
            <div>
              <Label>Production</Label>
              <Select value={selectedProduction} onValueChange={setSelectedProduction}>
                <SelectTrigger>
                  <SelectValue placeholder="Select production" />
                </SelectTrigger>
                <SelectContent>
                  {productions.map(p => (
                    <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {chatType === 'department_channel' && (
            <div>
              <Label>Department</Label>
              <Select value={selectedDepartment} onValueChange={setSelectedDepartment}>
                <SelectTrigger>
                  <SelectValue placeholder="Select department" />
                </SelectTrigger>
                <SelectContent>
                  {DEPARTMENTS.map(d => (
                    <SelectItem key={d} value={d}>{d}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {chatType !== 'direct_message' && (
            <div>
              <Label>Name</Label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Conversation name"
              />
            </div>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button
            onClick={() => createMutation.mutate()}
            disabled={
              createMutation.isPending ||
              (chatType === 'direct_message' && selectedUsers.length !== 1) ||
              (chatType === 'group_chat' && selectedUsers.length === 0) ||
              (chatType === 'production_channel' && !selectedProduction) ||
              (chatType === 'department_channel' && !selectedDepartment)
            }
          >
            {createMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            Create
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}