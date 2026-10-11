import React, { useState, useEffect } from 'react';
import { base44 } from '../../api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Textarea } from '../ui/textarea';
import { Badge } from '../ui/badge';
import { Avatar, AvatarFallback } from '../ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { 
  Users, Plus, Share2, MessageSquare, Clock, 
  GitBranch, Shield, Eye, Edit3, CheckCircle,
  UserPlus, Send, Loader2
} from 'lucide-react';
import { toast } from 'sonner';

export default function CollaborativeWarGaming({ scenarioId, scenarioData }) {
  const queryClient = useQueryClient();
  const [collaborators, setCollaborators] = useState([]);
  const [newCollaboratorEmail, setNewCollaboratorEmail] = useState('');
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [tasks, setTasks] = useState([]);
  const [newTask, setNewTask] = useState({ title: '', assignee: '', description: '' });
  const [activityLog, setActivityLog] = useState([]);

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  // Load saved collaboration data
  useEffect(() => {
    const saved = localStorage.getItem(`warMatrix_collab_${scenarioId}`);
    if (saved) {
      const data = JSON.parse(saved);
      setCollaborators(data.collaborators || []);
      setComments(data.comments || []);
      setTasks(data.tasks || []);
      setActivityLog(data.activityLog || []);
    }
  }, [scenarioId]);

  // Save collaboration data
  const saveCollabData = (data) => {
    localStorage.setItem(`warMatrix_collab_${scenarioId}`, JSON.stringify({
      collaborators,
      comments,
      tasks,
      activityLog,
      ...data
    }));
  };

  const addCollaborator = () => {
    if (!newCollaboratorEmail.trim()) return;

    const newCollab = {
      id: Date.now().toString(),
      email: newCollaboratorEmail,
      role: 'viewer',
      addedAt: new Date().toISOString(),
      addedBy: user?.email || 'Unknown'
    };

    const updated = [...collaborators, newCollab];
    setCollaborators(updated);
    saveCollabData({ collaborators: updated });

    logActivity(`Added ${newCollaboratorEmail} as collaborator`);
    setNewCollaboratorEmail('');
    toast.success('Collaborator added');
  };

  const updateCollaboratorRole = (collabId, newRole) => {
    const updated = collaborators.map(c => 
      c.id === collabId ? { ...c, role: newRole } : c
    );
    setCollaborators(updated);
    saveCollabData({ collaborators: updated });
    
    const collab = collaborators.find(c => c.id === collabId);
    logActivity(`Changed ${collab?.email}'s role to ${newRole}`);
  };

  const removeCollaborator = (collabId) => {
    const collab = collaborators.find(c => c.id === collabId);
    const updated = collaborators.filter(c => c.id !== collabId);
    setCollaborators(updated);
    saveCollabData({ collaborators: updated });
    
    logActivity(`Removed ${collab?.email} from collaborators`);
    toast.success('Collaborator removed');
  };

  const addComment = () => {
    if (!newComment.trim()) return;

    const comment = {
      id: Date.now().toString(),
      author: user?.email || 'Anonymous',
      content: newComment,
      timestamp: new Date().toISOString(),
      resolved: false
    };

    const updated = [...comments, comment];
    setComments(updated);
    saveCollabData({ comments: updated });
    
    logActivity(`Added comment: "${newComment.slice(0, 50)}..."`);
    setNewComment('');
  };

  const toggleCommentResolved = (commentId) => {
    const updated = comments.map(c => 
      c.id === commentId ? { ...c, resolved: !c.resolved } : c
    );
    setComments(updated);
    saveCollabData({ comments: updated });
  };

  const addTask = () => {
    if (!newTask.title.trim()) return;

    const task = {
      id: Date.now().toString(),
      ...newTask,
      status: 'pending',
      createdBy: user?.email || 'Anonymous',
      createdAt: new Date().toISOString()
    };

    const updated = [...tasks, task];
    setTasks(updated);
    saveCollabData({ tasks: updated });
    
    logActivity(`Created task: "${newTask.title}"`);
    setNewTask({ title: '', assignee: '', description: '' });
  };

  const updateTaskStatus = (taskId, newStatus) => {
    const updated = tasks.map(t => 
      t.id === taskId ? { ...t, status: newStatus } : t
    );
    setTasks(updated);
    saveCollabData({ tasks: updated });
    
    const task = tasks.find(t => t.id === taskId);
    logActivity(`Updated task "${task?.title}" to ${newStatus}`);
  };

  const logActivity = (action) => {
    const entry = {
      id: Date.now().toString(),
      action,
      user: user?.email || 'Anonymous',
      timestamp: new Date().toISOString()
    };
    const updated = [entry, ...activityLog.slice(0, 49)];
    setActivityLog(updated);
    saveCollabData({ activityLog: updated });
  };

  const getRoleColor = (role) => {
    const colors = {
      owner: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
      editor: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30',
      viewer: 'bg-slate-500/20 text-slate-400 border-slate-500/30'
    };
    return colors[role] || colors.viewer;
  };

  const getStatusColor = (status) => {
    const colors = {
      pending: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
      in_progress: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
      completed: 'bg-green-500/20 text-green-400 border-green-500/30'
    };
    return colors[status] || colors.pending;
  };

  return (
    <Card className="bg-slate-950/80 backdrop-blur-xl border border-sky-900/40 p-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 rounded-lg bg-blue-500/20 border border-blue-500/30">
          <Users className="w-6 h-6 text-blue-400" />
        </div>
        <div>
          <h3 className="text-xl font-bold text-blue-400 glow-text font-mono">
            COLLABORATIVE WAR-GAMING
          </h3>
          <p className="text-xs text-slate-400 font-mono">Multi-user scenario planning and collaboration</p>
        </div>
      </div>

      <Tabs defaultValue="team" className="space-y-4">
        <TabsList className="grid grid-cols-4 bg-slate-900/50">
          <TabsTrigger value="team" className="font-mono text-xs">TEAM</TabsTrigger>
          <TabsTrigger value="comments" className="font-mono text-xs">COMMENTS ({comments.length})</TabsTrigger>
          <TabsTrigger value="tasks" className="font-mono text-xs">TASKS ({tasks.length})</TabsTrigger>
          <TabsTrigger value="activity" className="font-mono text-xs">ACTIVITY</TabsTrigger>
        </TabsList>

        {/* Team Tab */}
        <TabsContent value="team" className="space-y-4">
          {/* Add Collaborator */}
          <div className="flex gap-2">
            <Input
              value={newCollaboratorEmail}
              onChange={(e) => setNewCollaboratorEmail(e.target.value)}
              placeholder="Enter email to invite..."
              className="bg-slate-900/50 border-blue-500/30 text-slate-200 font-mono flex-1"
            />
            <Button
              onClick={addCollaborator}
              className="bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 border border-blue-500/30 font-mono"
            >
              <UserPlus className="w-4 h-4 mr-2" />
              INVITE
            </Button>
          </div>

          {/* Current User (Owner) */}
          <div className="bg-purple-500/10 border border-purple-500/30 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Avatar className="h-10 w-10">
                  <AvatarFallback className="bg-purple-500/20 text-purple-400 font-mono">
                    {user?.email?.slice(0, 2).toUpperCase() || 'ME'}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <div className="text-purple-400 font-mono font-bold text-sm">{user?.email || 'You'}</div>
                  <div className="text-slate-500 font-mono text-xs">Scenario Owner</div>
                </div>
              </div>
              <Badge className={getRoleColor('owner')}>OWNER</Badge>
            </div>
          </div>

          {/* Collaborators List */}
          {collaborators.length > 0 ? (
            <div className="space-y-2">
              {collaborators.map((collab) => (
                <div key={collab.id} className="bg-slate-900/50 border border-sky-800/30 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-10 w-10">
                        <AvatarFallback className="bg-cyan-500/20 text-cyan-400 font-mono">
                          {collab.email.slice(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="text-cyan-400 font-mono font-bold text-sm">{collab.email}</div>
                        <div className="text-slate-500 font-mono text-xs">
                          Added {new Date(collab.addedAt).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <select
                        value={collab.role}
                        onChange={(e) => updateCollaboratorRole(collab.id, e.target.value)}
                        className="bg-slate-800/50 border border-slate-600/30 rounded text-slate-300 font-mono text-xs px-2 py-1"
                      >
                        <option value="viewer">Viewer</option>
                        <option value="editor">Editor</option>
                      </select>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => removeCollaborator(collab.id)}
                        className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
                      >
                        ✕
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-slate-900/50 border border-sky-800/30 rounded-lg p-8 text-center">
              <Users className="w-12 h-12 text-slate-600 mx-auto mb-3" />
              <p className="text-slate-500 font-mono text-sm">No collaborators yet</p>
            </div>
          )}
        </TabsContent>

        {/* Comments Tab */}
        <TabsContent value="comments" className="space-y-4">
          {/* Add Comment */}
          <div className="flex gap-2">
            <Textarea
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="Add a comment..."
              className="bg-slate-900/50 border-cyan-500/30 text-slate-200 font-mono flex-1 h-20"
            />
            <Button
              onClick={addComment}
              className="bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-400 border border-cyan-500/30 font-mono"
            >
              <Send className="w-4 h-4" />
            </Button>
          </div>

          {/* Comments List */}
          {comments.length > 0 ? (
            <div className="space-y-3">
              {comments.map((comment) => (
                <div 
                  key={comment.id} 
                  className={`bg-slate-900/50 border rounded-lg p-4 ${
                    comment.resolved ? 'border-green-500/30 opacity-60' : 'border-sky-800/30'
                  }`}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Avatar className="h-6 w-6">
                        <AvatarFallback className="bg-cyan-500/20 text-cyan-400 font-mono text-xs">
                          {comment.author.slice(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <span className="text-cyan-400 font-mono text-xs">{comment.author}</span>
                      <span className="text-slate-500 font-mono text-xs">
                        {new Date(comment.timestamp).toLocaleString()}
                      </span>
                    </div>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => toggleCommentResolved(comment.id)}
                      className={comment.resolved ? 'text-green-400' : 'text-slate-400'}
                    >
                      <CheckCircle className="w-4 h-4" />
                    </Button>
                  </div>
                  <p className="text-slate-300 font-mono text-sm">{comment.content}</p>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-slate-900/50 border border-sky-800/30 rounded-lg p-8 text-center">
              <MessageSquare className="w-12 h-12 text-slate-600 mx-auto mb-3" />
              <p className="text-slate-500 font-mono text-sm">No comments yet</p>
            </div>
          )}
        </TabsContent>

        {/* Tasks Tab */}
        <TabsContent value="tasks" className="space-y-4">
          {/* Add Task */}
          <div className="bg-slate-900/50 border border-sky-800/30 rounded-lg p-4 space-y-3">
            <Input
              value={newTask.title}
              onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
              placeholder="Task title..."
              className="bg-slate-800/50 border-slate-600/30 text-slate-200 font-mono"
            />
            <div className="flex gap-2">
              <Input
                value={newTask.assignee}
                onChange={(e) => setNewTask({ ...newTask, assignee: e.target.value })}
                placeholder="Assign to (email)..."
                className="bg-slate-800/50 border-slate-600/30 text-slate-200 font-mono flex-1"
              />
              <Button
                onClick={addTask}
                className="bg-green-500/20 hover:bg-green-500/30 text-green-400 border border-green-500/30 font-mono"
              >
                <Plus className="w-4 h-4 mr-2" />
                ADD TASK
              </Button>
            </div>
          </div>

          {/* Tasks List */}
          {tasks.length > 0 ? (
            <div className="space-y-2">
              {tasks.map((task) => (
                <div key={task.id} className="bg-slate-900/50 border border-sky-800/30 rounded-lg p-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <h5 className="text-green-400 font-mono font-bold text-sm">{task.title}</h5>
                      {task.assignee && (
                        <div className="text-slate-500 font-mono text-xs mt-1">
                          Assigned to: {task.assignee}
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <select
                        value={task.status}
                        onChange={(e) => updateTaskStatus(task.id, e.target.value)}
                        className="bg-slate-800/50 border border-slate-600/30 rounded text-slate-300 font-mono text-xs px-2 py-1"
                      >
                        <option value="pending">Pending</option>
                        <option value="in_progress">In Progress</option>
                        <option value="completed">Completed</option>
                      </select>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-slate-900/50 border border-sky-800/30 rounded-lg p-8 text-center">
              <CheckCircle className="w-12 h-12 text-slate-600 mx-auto mb-3" />
              <p className="text-slate-500 font-mono text-sm">No tasks yet</p>
            </div>
          )}
        </TabsContent>

        {/* Activity Tab */}
        <TabsContent value="activity" className="space-y-4">
          {activityLog.length > 0 ? (
            <div className="space-y-2">
              {activityLog.map((entry) => (
                <div key={entry.id} className="flex items-start gap-3 p-2">
                  <Clock className="w-4 h-4 text-slate-500 mt-0.5" />
                  <div>
                    <p className="text-slate-300 font-mono text-xs">{entry.action}</p>
                    <div className="text-slate-500 font-mono text-[10px]">
                      {entry.user} • {new Date(entry.timestamp).toLocaleString()}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-slate-900/50 border border-sky-800/30 rounded-lg p-8 text-center">
              <Clock className="w-12 h-12 text-slate-600 mx-auto mb-3" />
              <p className="text-slate-500 font-mono text-sm">No activity yet</p>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </Card>
  );
}