import React, { useState, useEffect } from 'react';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Textarea } from '../ui/textarea';
import { Badge } from '../ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Checkbox } from '../ui/checkbox';
import { Share2, Users, MessageSquare, GitBranch, Copy, Check, Bell, CheckCircle, Circle, UserPlus, Settings as SettingsIcon } from 'lucide-react';

export default function EnhancedScenarioSharing({ scenario, onShare, onComment, comments = [], tasks = [], onTaskCreate, onTaskUpdate }) {
  const [showShareDialog, setShowShareDialog] = useState(false);
  const [showPermissionsDialog, setShowPermissionsDialog] = useState(false);
  const [showTaskDialog, setShowTaskDialog] = useState(false);
  const [shareEmails, setShareEmails] = useState('');
  const [shareMessage, setShareMessage] = useState('');
  const [sharePermissions, setSharePermissions] = useState('view');
  const [newComment, setNewComment] = useState('');
  const [copied, setCopied] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [collaborators, setCollaborators] = useState([
    { email: 'user@example.com', permission: 'owner', status: 'editing' }
  ]);
  
  // Task management
  const [newTask, setNewTask] = useState({
    title: '',
    description: '',
    assignee: '',
    priority: 'medium',
    dueDate: ''
  });

  // Simulate real-time notifications
  useEffect(() => {
    // In a real app, this would be WebSocket or polling
    const mockNotifications = [
      { id: 1, type: 'comment', user: 'analyst@team.com', message: 'Added new comment', time: '2 min ago', read: false },
      { id: 2, type: 'edit', user: 'strategist@team.com', message: 'Updated scenario parameters', time: '5 min ago', read: false },
    ];
    setNotifications(mockNotifications);
  }, []);

  const handleShare = () => {
    const emails = shareEmails.split(',').map(e => e.trim()).filter(e => e);
    
    if (onShare) {
      onShare({
        scenario_id: scenario.id,
        shared_with: emails,
        message: shareMessage,
        permissions: sharePermissions
      });
    }
    
    // Add collaborators
    emails.forEach(email => {
      setCollaborators([...collaborators, { email, permission: sharePermissions, status: 'offline' }]);
    });
    
    setShowShareDialog(false);
    setShareEmails('');
    setShareMessage('');
  };

  const handleComment = () => {
    if (onComment && newComment.trim()) {
      const mentionedUsers = newComment.match(/@(\w+)/g);
      
      onComment({
        scenario_id: scenario.id,
        comment: newComment,
        timestamp: new Date().toISOString(),
        author: 'current-user@email.com',
        mentions: mentionedUsers
      });
      
      // Create notifications for mentioned users
      if (mentionedUsers) {
        mentionedUsers.forEach(user => {
          setNotifications([...notifications, {
            id: Date.now(),
            type: 'mention',
            user: user.replace('@', ''),
            message: 'Mentioned you in a comment',
            time: 'just now',
            read: false
          }]);
        });
      }
      
      setNewComment('');
    }
  };

  const handleTaskCreate = () => {
    if (onTaskCreate && newTask.title.trim()) {
      onTaskCreate({
        scenario_id: scenario.id,
        ...newTask,
        id: Date.now(),
        status: 'pending',
        created: new Date().toISOString()
      });
      
      setNewTask({ title: '', description: '', assignee: '', priority: 'medium', dueDate: '' });
      setShowTaskDialog(false);
    }
  };

  const copyShareLink = () => {
    const shareLink = `${window.location.origin}/strategy-hub?scenario=${scenario.id}`;
    navigator.clipboard.writeText(shareLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const updatePermission = (email, newPermission) => {
    setCollaborators(collaborators.map(c => 
      c.email === email ? { ...c, permission: newPermission } : c
    ));
  };

  const markNotificationRead = (id) => {
    setNotifications(notifications.map(n => 
      n.id === id ? { ...n, read: true } : n
    ));
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <div className="space-y-4">
      <Card className="bg-slate-950/80 backdrop-blur-xl cyber-border p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <Users className="w-6 h-6 text-purple-400" />
            <h3 className="text-xl font-bold text-purple-400 glow-text font-mono">
              COLLABORATION
            </h3>
            {unreadCount > 0 && (
              <Badge className="bg-red-500/20 text-red-400 border-red-500/30 font-mono">
                {unreadCount} NEW
              </Badge>
            )}
          </div>
          <div className="flex gap-2">
            <Button
              onClick={copyShareLink}
              size="sm"
              className="bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-400 border border-cyan-500/30 font-mono"
            >
              {copied ? (
                <>
                  <Check className="w-4 h-4 mr-2" />
                  COPIED
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4 mr-2" />
                  COPY LINK
                </>
              )}
            </Button>
            <Button
              onClick={() => setShowShareDialog(true)}
              size="sm"
              className="bg-purple-500/20 hover:bg-purple-500/30 text-purple-400 border border-purple-500/30 font-mono"
            >
              <Share2 className="w-4 h-4 mr-2" />
              SHARE
            </Button>
            <Button
              onClick={() => setShowPermissionsDialog(true)}
              size="sm"
              className="bg-yellow-500/20 hover:bg-yellow-500/30 text-yellow-400 border border-yellow-500/30 font-mono"
            >
              <SettingsIcon className="w-4 h-4 mr-2" />
              PERMISSIONS
            </Button>
          </div>
        </div>

        {/* Real-time Notifications */}
        {notifications.length > 0 && (
          <div className="mb-4 p-3 bg-blue-950/20 cyber-border rounded">
            <div className="flex items-center gap-2 mb-2">
              <Bell className="w-4 h-4 text-cyan-400 animate-pulse" />
              <h4 className="text-sm font-bold text-cyan-400 font-mono">REAL-TIME NOTIFICATIONS</h4>
            </div>
            <div className="space-y-2">
              {notifications.slice(0, 3).map((notif) => (
                <div 
                  key={notif.id} 
                  className={`flex items-start justify-between p-2 rounded ${notif.read ? 'bg-slate-900/30' : 'bg-cyan-950/30'}`}
                  onClick={() => markNotificationRead(notif.id)}
                >
                  <div className="flex items-start gap-2 flex-1">
                    <div className={`w-2 h-2 rounded-full mt-1.5 ${notif.read ? 'bg-slate-500' : 'bg-cyan-400'}`}></div>
                    <div>
                      <p className="text-slate-300 font-mono text-xs">
                        <span className="text-cyan-400 font-bold">{notif.user}</span> {notif.message}
                      </p>
                      <p className="text-slate-500 font-mono text-xs">{notif.time}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Active Collaborators */}
        <div className="mb-4">
          <div className="flex items-center gap-2 mb-3">
            <UserPlus className="w-4 h-4 text-green-400" />
            <h4 className="text-sm font-bold text-green-400 font-mono">
              ACTIVE COLLABORATORS ({collaborators.length})
            </h4>
          </div>
          <div className="grid md:grid-cols-2 gap-2">
            {collaborators.map((collab, idx) => (
              <div key={idx} className="bg-slate-900/50 cyber-border rounded p-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${collab.status === 'editing' ? 'bg-green-400 animate-pulse' : 'bg-slate-500'}`}></div>
                  <div>
                    <p className="text-slate-300 font-mono text-xs">{collab.email}</p>
                    <Badge className="bg-purple-500/20 text-purple-400 border-purple-500/30 font-mono text-xs">
                      {collab.permission}
                    </Badge>
                  </div>
                </div>
                {collab.status === 'editing' && (
                  <Badge className="bg-green-500/20 text-green-400 border-green-500/30 font-mono text-xs">
                    EDITING
                  </Badge>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Scenario Info */}
        <div className="mb-4 p-3 bg-purple-950/20 cyber-border rounded">
          <h4 className="text-md font-bold text-cyan-400 font-mono mb-1">{scenario.name || 'Untitled Scenario'}</h4>
          <p className="text-slate-400 font-mono text-xs">{scenario.description || 'No description'}</p>
          <div className="flex items-center gap-2 mt-2">
            <Badge className="bg-green-500/20 text-green-400 border-green-500/30 font-mono text-xs">
              Version {scenario.version || 1}
            </Badge>
            <Badge className="bg-cyan-500/20 text-cyan-400 border-cyan-500/30 font-mono text-xs">
              {new Date(scenario.timestamp || Date.now()).toLocaleDateString()}
            </Badge>
          </div>
        </div>

        {/* Tasks Section */}
        <div className="mb-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-yellow-400" />
              <h4 className="text-sm font-bold text-yellow-400 font-mono">
                TASKS ({tasks?.length || 0})
              </h4>
            </div>
            <Button
              onClick={() => setShowTaskDialog(true)}
              size="sm"
              className="bg-yellow-500/20 hover:bg-yellow-500/30 text-yellow-400 border border-yellow-500/30 font-mono text-xs"
            >
              + ASSIGN TASK
            </Button>
          </div>

          <div className="space-y-2 max-h-[200px] overflow-y-auto">
            {tasks?.map((task, idx) => (
              <div key={idx} className="bg-slate-900/50 cyber-border rounded p-3">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-start gap-2 flex-1">
                    <Button
                      onClick={() => onTaskUpdate && onTaskUpdate(task.id, { ...task, status: task.status === 'completed' ? 'pending' : 'completed' })}
                      size="sm"
                      variant="ghost"
                      className="h-5 w-5 p-0"
                    >
                      {task.status === 'completed' ? (
                        <CheckCircle className="w-4 h-4 text-green-400" />
                      ) : (
                        <Circle className="w-4 h-4 text-slate-400" />
                      )}
                    </Button>
                    <div className="flex-1">
                      <p className={`text-slate-300 font-mono text-sm ${task.status === 'completed' ? 'line-through' : ''}`}>
                        {task.title}
                      </p>
                      {task.description && (
                        <p className="text-slate-500 font-mono text-xs mt-1">{task.description}</p>
                      )}
                    </div>
                  </div>
                  <Badge className={`${
                    task.priority === 'high' ? 'bg-red-500/20 text-red-400 border-red-500/30' :
                    task.priority === 'medium' ? 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30' :
                    'bg-green-500/20 text-green-400 border-green-500/30'
                  } font-mono text-xs`}>
                    {task.priority}
                  </Badge>
                </div>
                <div className="flex items-center justify-between text-xs font-mono text-slate-500">
                  <span>Assigned: {task.assignee}</span>
                  {task.dueDate && <span>Due: {new Date(task.dueDate).toLocaleDateString()}</span>}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Comments Section */}
        <div className="mb-4">
          <div className="flex items-center gap-2 mb-3">
            <MessageSquare className="w-4 h-4 text-cyan-400" />
            <h4 className="text-sm font-bold text-cyan-400 font-mono">
              COMMENTS ({comments.length})
            </h4>
          </div>

          <div className="space-y-2 mb-3 max-h-[300px] overflow-y-auto">
            {comments.map((comment, idx) => (
              <div key={idx} className="bg-slate-900/50 cyber-border rounded p-3">
                <div className="flex items-start justify-between mb-1">
                  <Badge className="bg-purple-500/20 text-purple-400 border-purple-500/30 font-mono text-xs">
                    {comment.author || 'User'}
                  </Badge>
                  <span className="text-xs text-slate-500 font-mono">
                    {new Date(comment.timestamp).toLocaleString()}
                  </span>
                </div>
                <p className="text-slate-300 font-mono text-sm">{comment.comment}</p>
                {comment.mentions && (
                  <div className="mt-2 flex flex-wrap gap-1">
                    {comment.mentions.map((mention, i) => (
                      <Badge key={i} variant="outline" className="border-cyan-500/30 text-cyan-400 font-mono text-xs">
                        {mention}
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>

          <div className="flex gap-2">
            <Textarea
              placeholder="Add a comment... (use @ to mention collaborators)"
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              className="bg-slate-900/50 border-cyan-500/30 text-cyan-400 font-mono"
              rows={2}
            />
            <Button
              onClick={handleComment}
              disabled={!newComment.trim()}
              className="bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-400 border border-cyan-500/30 font-mono"
            >
              <MessageSquare className="w-4 h-4 mr-2" />
              POST
            </Button>
          </div>
        </div>

        {/* Version History */}
        {scenario.history && scenario.history.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-2">
              <GitBranch className="w-4 h-4 text-green-400" />
              <h4 className="text-sm font-bold text-green-400 font-mono">VERSION HISTORY</h4>
            </div>
            <div className="space-y-1 max-h-[150px] overflow-y-auto">
              {scenario.history.map((version, idx) => (
                <div key={idx} className="bg-slate-900/50 cyber-border rounded p-2 text-xs font-mono">
                  <div className="flex items-center justify-between">
                    <Badge className="bg-green-500/20 text-green-400 border-green-500/30 text-xs">
                      v{version.version}
                    </Badge>
                    <span className="text-slate-500">{new Date(version.timestamp).toLocaleString()}</span>
                  </div>
                  <p className="text-slate-400 mt-1">{version.change_summary}</p>
                  <p className="text-slate-500 text-xs">By: {version.author || 'Unknown'}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </Card>

      {/* Share Dialog */}
      <Dialog open={showShareDialog} onOpenChange={setShowShareDialog}>
        <DialogContent className="bg-slate-950/95 backdrop-blur-xl cyber-border">
          <DialogHeader>
            <DialogTitle className="text-cyan-400 font-mono">SHARE SCENARIO</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-slate-300 font-mono text-sm mb-2 block">
                Email Addresses (comma-separated)
              </label>
              <Input
                placeholder="user1@example.com, user2@example.com"
                value={shareEmails}
                onChange={(e) => setShareEmails(e.target.value)}
                className="bg-slate-900/50 border-cyan-500/30 text-cyan-400 font-mono"
              />
            </div>
            <div>
              <label className="text-slate-300 font-mono text-sm mb-2 block">
                Permission Level
              </label>
              <Select value={sharePermissions} onValueChange={setSharePermissions}>
                <SelectTrigger className="bg-slate-900/50 border-cyan-500/30 text-cyan-400 font-mono">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-slate-900/90 border-cyan-500/30 font-mono">
                  <SelectItem value="view">View Only</SelectItem>
                  <SelectItem value="comment">Can Comment</SelectItem>
                  <SelectItem value="edit">Can Edit</SelectItem>
                  <SelectItem value="admin">Admin (Full Control)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-slate-300 font-mono text-sm mb-2 block">
                Message (optional)
              </label>
              <Textarea
                placeholder="Add a message about this scenario..."
                value={shareMessage}
                onChange={(e) => setShareMessage(e.target.value)}
                className="bg-slate-900/50 border-cyan-500/30 text-cyan-400 font-mono"
                rows={3}
              />
            </div>
            <Button
              onClick={handleShare}
              disabled={!shareEmails.trim()}
              className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-mono"
            >
              <Share2 className="w-4 h-4 mr-2" />
              SHARE SCENARIO
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Permissions Dialog */}
      <Dialog open={showPermissionsDialog} onOpenChange={setShowPermissionsDialog}>
        <DialogContent className="bg-slate-950/95 backdrop-blur-xl cyber-border">
          <DialogHeader>
            <DialogTitle className="text-yellow-400 font-mono">MANAGE PERMISSIONS</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 max-h-[400px] overflow-y-auto">
            {collaborators.map((collab, idx) => (
              <div key={idx} className="bg-slate-900/50 cyber-border rounded p-3 flex items-center justify-between">
                <div>
                  <p className="text-slate-300 font-mono text-sm">{collab.email}</p>
                  <p className="text-slate-500 font-mono text-xs">{collab.permission}</p>
                </div>
                <Select 
                  value={collab.permission} 
                  onValueChange={(val) => updatePermission(collab.email, val)}
                  disabled={collab.permission === 'owner'}
                >
                  <SelectTrigger className="w-[130px] bg-slate-900/50 border-yellow-500/30 text-yellow-400 font-mono text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-900/90 border-yellow-500/30 font-mono">
                    <SelectItem value="view">View</SelectItem>
                    <SelectItem value="comment">Comment</SelectItem>
                    <SelectItem value="edit">Edit</SelectItem>
                    <SelectItem value="admin">Admin</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>

      {/* Task Creation Dialog */}
      <Dialog open={showTaskDialog} onOpenChange={setShowTaskDialog}>
        <DialogContent className="bg-slate-950/95 backdrop-blur-xl cyber-border">
          <DialogHeader>
            <DialogTitle className="text-yellow-400 font-mono">CREATE TASK</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-slate-300 font-mono text-sm mb-2 block">Task Title</label>
              <Input
                placeholder="e.g., Review scenario assumptions"
                value={newTask.title}
                onChange={(e) => setNewTask({...newTask, title: e.target.value})}
                className="bg-slate-900/50 border-cyan-500/30 text-cyan-400 font-mono"
              />
            </div>
            <div>
              <label className="text-slate-300 font-mono text-sm mb-2 block">Description</label>
              <Textarea
                placeholder="Task details..."
                value={newTask.description}
                onChange={(e) => setNewTask({...newTask, description: e.target.value})}
                className="bg-slate-900/50 border-cyan-500/30 text-cyan-400 font-mono"
                rows={2}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-slate-300 font-mono text-sm mb-2 block">Assign To</label>
                <Select value={newTask.assignee} onValueChange={(val) => setNewTask({...newTask, assignee: val})}>
                  <SelectTrigger className="bg-slate-900/50 border-cyan-500/30 text-cyan-400 font-mono">
                    <SelectValue placeholder="Select user" />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-900/90 border-cyan-500/30 font-mono">
                    {collaborators.map((c, i) => (
                      <SelectItem key={i} value={c.email}>{c.email}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-slate-300 font-mono text-sm mb-2 block">Priority</label>
                <Select value={newTask.priority} onValueChange={(val) => setNewTask({...newTask, priority: val})}>
                  <SelectTrigger className="bg-slate-900/50 border-cyan-500/30 text-cyan-400 font-mono">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-900/90 border-cyan-500/30 font-mono">
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <label className="text-slate-300 font-mono text-sm mb-2 block">Due Date</label>
              <Input
                type="date"
                value={newTask.dueDate}
                onChange={(e) => setNewTask({...newTask, dueDate: e.target.value})}
                className="bg-slate-900/50 border-cyan-500/30 text-cyan-400 font-mono"
              />
            </div>
            <Button
              onClick={handleTaskCreate}
              disabled={!newTask.title.trim() || !newTask.assignee}
              className="w-full bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-white font-mono"
            >
              <CheckCircle className="w-4 h-4 mr-2" />
              CREATE TASK
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}