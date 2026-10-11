import React, { useState } from 'react';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Textarea } from '../ui/textarea';
import { Badge } from '../ui/badge';
import { Avatar, AvatarFallback } from '../ui/avatar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { 
  Users, 
  MessageSquare, 
  History, 
  UserPlus, 
  Send,
  GitBranch,
  CheckCircle2,
  Clock
} from 'lucide-react';

export default function CollaborativeScenario({ scenario, onUpdateScenario }) {
  const [collaborators, setCollaborators] = useState([
    { id: 1, name: 'John Doe', role: 'designer', email: 'john@example.com', active: true },
    { id: 2, name: 'Jane Smith', role: 'analyst', email: 'jane@example.com', active: true }
  ]);
  const [comments, setComments] = useState([
    {
      id: 1,
      user: 'John Doe',
      message: 'Should we increase the nuclear capability level?',
      parameter: 'technology.nuclear',
      timestamp: new Date(Date.now() - 3600000),
      resolved: false
    },
    {
      id: 2,
      user: 'Jane Smith',
      message: 'The resource scarcity seems too low for this scenario',
      parameter: 'resources.oil',
      timestamp: new Date(Date.now() - 1800000),
      resolved: false
    }
  ]);
  const [versionHistory, setVersionHistory] = useState([
    {
      version: 'v1.2',
      editor: 'John Doe',
      changes: 'Updated tensions to 75, added two more nations',
      timestamp: new Date(Date.now() - 7200000)
    },
    {
      version: 'v1.1',
      editor: 'Jane Smith',
      changes: 'Adjusted economic factors and alliances',
      timestamp: new Date(Date.now() - 14400000)
    },
    {
      version: 'v1.0',
      editor: 'John Doe',
      changes: 'Initial scenario creation',
      timestamp: new Date(Date.now() - 21600000)
    }
  ]);
  const [newComment, setNewComment] = useState('');
  const [commentParameter, setCommentParameter] = useState('');
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState('analyst');

  const getRoleColor = (role) => {
    const colors = {
      'designer': 'bg-purple-500/20 text-purple-400 border-purple-500/30',
      'analyst': 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30',
      'reviewer': 'bg-green-500/20 text-green-400 border-green-500/30'
    };
    return colors[role] || colors['analyst'];
  };

  const addComment = () => {
    if (newComment.trim()) {
      const comment = {
        id: comments.length + 1,
        user: 'Current User',
        message: newComment,
        parameter: commentParameter,
        timestamp: new Date(),
        resolved: false
      };
      setComments([comment, ...comments]);
      setNewComment('');
      setCommentParameter('');
    }
  };

  const toggleResolve = (commentId) => {
    setComments(comments.map(c => 
      c.id === commentId ? { ...c, resolved: !c.resolved } : c
    ));
  };

  const inviteCollaborator = () => {
    if (inviteEmail) {
      const newCollab = {
        id: collaborators.length + 1,
        name: inviteEmail.split('@')[0],
        role: inviteRole,
        email: inviteEmail,
        active: true
      };
      setCollaborators([...collaborators, newCollab]);
      setInviteEmail('');
    }
  };

  return (
    <div className="space-y-6">
      {/* Collaborators Panel */}
      <Card className="bg-slate-950/80 backdrop-blur-xl cyber-border p-6">
        <div className="flex items-center gap-3 mb-4">
          <Users className="w-6 h-6 text-cyan-400" />
          <h3 className="text-xl font-bold text-cyan-400 glow-text font-mono">
            COLLABORATORS ({collaborators.length})
          </h3>
        </div>

        {/* Active Collaborators */}
        <div className="space-y-3 mb-4">
          {collaborators.map(collab => (
            <div key={collab.id} className="bg-slate-900/50 cyber-border rounded-lg p-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Avatar className="w-10 h-10 bg-cyan-500/20 border-2 border-cyan-500/30">
                    <AvatarFallback className="text-cyan-400 font-mono font-bold">
                      {collab.name.split(' ').map(n => n[0]).join('')}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <div className="text-sm font-bold text-green-400 font-mono">{collab.name}</div>
                    <div className="text-xs text-slate-400 font-mono">{collab.email}</div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge className={`${getRoleColor(collab.role)} font-mono text-xs`}>
                    {collab.role.toUpperCase()}
                  </Badge>
                  {collab.active && (
                    <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Invite New Collaborator */}
        <div className="pt-4 border-t border-slate-700/30">
          <h4 className="text-sm font-bold text-purple-400 font-mono mb-3">INVITE COLLABORATOR</h4>
          <div className="flex gap-3">
            <Input
              placeholder="email@example.com"
              value={inviteEmail}
              onChange={(e) => setInviteEmail(e.target.value)}
              className="bg-slate-900/50 border-green-500/30 text-green-400 font-mono"
            />
            <Select value={inviteRole} onValueChange={setInviteRole}>
              <SelectTrigger className="w-32 bg-slate-900/50 border-green-500/30 text-green-400 font-mono">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="designer">Designer</SelectItem>
                <SelectItem value="analyst">Analyst</SelectItem>
                <SelectItem value="reviewer">Reviewer</SelectItem>
              </SelectContent>
            </Select>
            <Button
              onClick={inviteCollaborator}
              className="bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-400 border border-cyan-500/30 font-mono"
            >
              <UserPlus className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </Card>

      {/* Comments & Discussion */}
      <Card className="bg-slate-950/80 backdrop-blur-xl cyber-border p-6">
        <div className="flex items-center gap-3 mb-4">
          <MessageSquare className="w-6 h-6 text-purple-400" />
          <h3 className="text-xl font-bold text-purple-400 glow-text font-mono">
            COMMENTS & DISCUSSION
          </h3>
        </div>

        {/* New Comment */}
        <div className="mb-4 p-4 bg-slate-900/50 cyber-border rounded-lg">
          <div className="mb-3">
            <label className="text-xs text-slate-400 font-mono mb-1 block">
              Comment on specific parameter (optional):
            </label>
            <Select value={commentParameter} onValueChange={setCommentParameter}>
              <SelectTrigger className="bg-slate-900/50 border-green-500/30 text-green-400 font-mono">
                <SelectValue placeholder="Select parameter..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="tensions">Initial Tensions</SelectItem>
                <SelectItem value="technology.nuclear">Nuclear Capability</SelectItem>
                <SelectItem value="resources.oil">Oil Resources</SelectItem>
                <SelectItem value="economics.gdp">Global GDP</SelectItem>
                <SelectItem value="alliances">Alliance Structure</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Textarea
            placeholder="Add your comment or suggestion..."
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            className="bg-slate-900/50 border-green-500/30 text-green-400 font-mono mb-3"
          />
          <Button
            onClick={addComment}
            className="bg-purple-500/20 hover:bg-purple-500/30 text-purple-400 border border-purple-500/30 font-mono"
          >
            <Send className="w-4 h-4 mr-2" />
            POST COMMENT
          </Button>
        </div>

        {/* Comments List */}
        <div className="space-y-3">
          {comments.map(comment => (
            <div 
              key={comment.id} 
              className={`bg-slate-900/50 cyber-border rounded-lg p-4 ${comment.resolved ? 'opacity-60' : ''}`}
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Avatar className="w-8 h-8 bg-purple-500/20 border border-purple-500/30">
                    <AvatarFallback className="text-purple-400 font-mono text-xs">
                      {comment.user.split(' ').map(n => n[0]).join('')}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <div className="text-sm font-bold text-green-400 font-mono">{comment.user}</div>
                    <div className="text-xs text-slate-500 font-mono">
                      {comment.timestamp.toLocaleString()}
                    </div>
                  </div>
                </div>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => toggleResolve(comment.id)}
                  className={`${comment.resolved ? 'text-green-400' : 'text-slate-400'} hover:text-green-400`}
                >
                  <CheckCircle2 className="w-4 h-4" />
                </Button>
              </div>
              {comment.parameter && (
                <Badge className="bg-cyan-500/20 text-cyan-400 border-cyan-500/30 font-mono text-xs mb-2">
                  {comment.parameter}
                </Badge>
              )}
              <p className="text-slate-300 font-mono text-sm">{comment.message}</p>
            </div>
          ))}
        </div>
      </Card>

      {/* Version History */}
      <Card className="bg-slate-950/80 backdrop-blur-xl cyber-border p-6">
        <div className="flex items-center gap-3 mb-4">
          <History className="w-6 h-6 text-orange-400" />
          <h3 className="text-xl font-bold text-orange-400 glow-text font-mono">
            VERSION HISTORY
          </h3>
        </div>

        <div className="relative">
          <div className="absolute left-8 top-0 bottom-0 w-px bg-orange-500/20"></div>
          <div className="space-y-4">
            {versionHistory.map((version, idx) => (
              <div key={idx} className="relative pl-16">
                <div className="absolute left-6 w-5 h-5 rounded-full border-2 bg-orange-500 border-orange-500">
                  <GitBranch className="w-3 h-3 text-slate-950 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
                </div>
                <div className="bg-slate-900/50 cyber-border rounded-lg p-3">
                  <div className="flex items-center justify-between mb-2">
                    <Badge className="bg-orange-500/20 text-orange-400 border-orange-500/30 font-mono">
                      {version.version}
                    </Badge>
                    <div className="flex items-center gap-2 text-xs text-slate-500 font-mono">
                      <Clock className="w-3 h-3" />
                      {version.timestamp.toLocaleString()}
                    </div>
                  </div>
                  <div className="text-sm text-cyan-400 font-mono mb-1">
                    by {version.editor}
                  </div>
                  <p className="text-slate-400 font-mono text-xs">{version.changes}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </Card>

      {/* Permission Info */}
      <Card className="bg-gradient-to-br from-cyan-950/50 to-purple-950/50 backdrop-blur-xl cyber-border p-4">
        <h4 className="text-sm font-bold text-cyan-400 font-mono mb-2">ROLE PERMISSIONS</h4>
        <div className="grid md:grid-cols-3 gap-3 text-xs font-mono">
          <div className="bg-slate-900/50 cyber-border rounded p-2">
            <Badge className="bg-purple-500/20 text-purple-400 border-purple-500/30 font-mono text-xs mb-1">
              DESIGNER
            </Badge>
            <p className="text-slate-400">Full edit access, manage collaborators, run simulations</p>
          </div>
          <div className="bg-slate-900/50 cyber-border rounded p-2">
            <Badge className="bg-cyan-500/20 text-cyan-400 border-cyan-500/30 font-mono text-xs mb-1">
              ANALYST
            </Badge>
            <p className="text-slate-400">Edit parameters, add comments, view history</p>
          </div>
          <div className="bg-slate-900/50 cyber-border rounded p-2">
            <Badge className="bg-green-500/20 text-green-400 border-green-500/30 font-mono text-xs mb-1">
              REVIEWER
            </Badge>
            <p className="text-slate-400">View-only access, add comments, suggest changes</p>
          </div>
        </div>
      </Card>
    </div>
  );
}