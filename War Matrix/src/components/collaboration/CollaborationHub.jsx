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
  Users, MessageSquare, Send, Plus, CheckCircle, Clock,
  AlertTriangle, User, Activity, ListTodo, FileText
} from 'lucide-react';
import { toast } from 'sonner';

export default function CollaborationHub({ workspaceId = 'default', alertId, scenarioId }) {
  const queryClient = useQueryClient();
  const [newMessage, setNewMessage] = useState('');
  const [newTask, setNewTask] = useState({ title: '', assignee: '', priority: 'medium' });
  const [currentUser, setCurrentUser] = useState(null);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const user = await base44.auth.me();
        setCurrentUser(user);
      } catch (e) {
        setCurrentUser({ email: 'guest@warmatrix.com', full_name: 'Guest User' });
      }
    };
    fetchUser();
  }, []);

  // Simulated messages and tasks (in production, these would be from database)
  const [messages, setMessages] = useState([
    {
      id: 1,
      author: 'analyst@warmatrix.com',
      author_name: 'John Analyst',
      content: 'Initial assessment of the Taiwan Strait situation complete. Recommend heightened monitoring.',
      timestamp: new Date(Date.now() - 3600000).toISOString(),
      type: 'message'
    },
    {
      id: 2,
      author: 'strategist@warmatrix.com',
      author_name: 'Sarah Strategist',
      content: 'Agreed. I\'ve added satellite imagery analysis to the task queue.',
      timestamp: new Date(Date.now() - 1800000).toISOString(),
      type: 'message'
    }
  ]);

  const [tasks, setTasks] = useState([
    {
      id: 1,
      title: 'Review satellite imagery for fleet movements',
      assignee: 'analyst@warmatrix.com',
      status: 'in_progress',
      priority: 'high',
      created: new Date(Date.now() - 7200000).toISOString()
    },
    {
      id: 2,
      title: 'Prepare diplomatic briefing summary',
      assignee: 'strategist@warmatrix.com',
      status: 'pending',
      priority: 'medium',
      created: new Date(Date.now() - 3600000).toISOString()
    }
  ]);

  const [activityLog, setActivityLog] = useState([
    { id: 1, action: 'Alert acknowledged', user: 'analyst@warmatrix.com', timestamp: new Date(Date.now() - 7200000).toISOString() },
    { id: 2, action: 'Task created: Review satellite imagery', user: 'strategist@warmatrix.com', timestamp: new Date(Date.now() - 3600000).toISOString() },
    { id: 3, action: 'Note added to alert', user: 'analyst@warmatrix.com', timestamp: new Date(Date.now() - 1800000).toISOString() }
  ]);

  const handleSendMessage = () => {
    if (!newMessage.trim()) return;

    const message = {
      id: messages.length + 1,
      author: currentUser?.email || 'guest@warmatrix.com',
      author_name: currentUser?.full_name || 'Guest',
      content: newMessage,
      timestamp: new Date().toISOString(),
      type: 'message'
    };

    setMessages([...messages, message]);
    setNewMessage('');

    // Add to activity log
    setActivityLog([
      ...activityLog,
      {
        id: activityLog.length + 1,
        action: 'Message sent',
        user: currentUser?.email || 'guest@warmatrix.com',
        timestamp: new Date().toISOString()
      }
    ]);

    toast.success('Message sent');
  };

  const handleCreateTask = () => {
    if (!newTask.title.trim()) return;

    const task = {
      id: tasks.length + 1,
      title: newTask.title,
      assignee: newTask.assignee || currentUser?.email,
      status: 'pending',
      priority: newTask.priority,
      created: new Date().toISOString()
    };

    setTasks([...tasks, task]);
    setNewTask({ title: '', assignee: '', priority: 'medium' });

    // Add to activity log
    setActivityLog([
      ...activityLog,
      {
        id: activityLog.length + 1,
        action: `Task created: ${task.title}`,
        user: currentUser?.email || 'guest@warmatrix.com',
        timestamp: new Date().toISOString()
      }
    ]);

    toast.success('Task created');
  };

  const toggleTaskStatus = (taskId) => {
    setTasks(tasks.map(t => 
      t.id === taskId 
        ? { ...t, status: t.status === 'completed' ? 'pending' : 'completed' }
        : t
    ));
  };

  const getPriorityColor = (priority) => {
    const colors = {
      high: 'bg-red-500/20 text-red-400 border-red-500/30',
      medium: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
      low: 'bg-green-500/20 text-green-400 border-green-500/30'
    };
    return colors[priority] || colors.medium;
  };

  const getStatusColor = (status) => {
    const colors = {
      pending: 'bg-slate-500/20 text-slate-400 border-slate-500/30',
      in_progress: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30',
      completed: 'bg-green-500/20 text-green-400 border-green-500/30'
    };
    return colors[status] || colors.pending;
  };

  const getInitials = (name) => {
    return name?.split(' ').map(n => n[0]).join('').toUpperCase() || '??';
  };

  return (
    <Card className="bg-slate-950/80 backdrop-blur-xl cyber-border p-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 rounded-lg bg-green-500/20 border border-green-500/30">
          <Users className="w-6 h-6 text-green-400" />
        </div>
        <div>
          <h3 className="text-xl font-bold text-green-400 glow-text font-mono">
            COLLABORATION HUB
          </h3>
          <p className="text-xs text-slate-400 font-mono">Team Communication & Task Management</p>
        </div>
      </div>

      <Tabs defaultValue="chat" className="space-y-4">
        <TabsList className="grid grid-cols-3 bg-slate-900/50">
          <TabsTrigger value="chat" className="font-mono text-xs">
            <MessageSquare className="w-3 h-3 mr-1" />
            CHAT
          </TabsTrigger>
          <TabsTrigger value="tasks" className="font-mono text-xs">
            <ListTodo className="w-3 h-3 mr-1" />
            TASKS
          </TabsTrigger>
          <TabsTrigger value="activity" className="font-mono text-xs">
            <Activity className="w-3 h-3 mr-1" />
            ACTIVITY
          </TabsTrigger>
        </TabsList>

        {/* Chat Tab */}
        <TabsContent value="chat" className="space-y-4">
          <div className="bg-slate-900/50 cyber-border rounded-lg p-4 h-64 overflow-y-auto space-y-4">
            {messages.map(msg => (
              <div key={msg.id} className="flex items-start gap-3">
                <Avatar className="w-8 h-8">
                  <AvatarFallback className="bg-cyan-500/20 text-cyan-400 text-xs font-mono">
                    {getInitials(msg.author_name)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-cyan-400 font-mono text-sm font-bold">{msg.author_name}</span>
                    <span className="text-slate-500 font-mono text-xs">
                      {new Date(msg.timestamp).toLocaleTimeString()}
                    </span>
                  </div>
                  <p className="text-slate-300 font-mono text-sm">{msg.content}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="flex gap-2">
            <Input
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
              placeholder="Type a message..."
              className="bg-slate-900/50 border-slate-600/30 text-slate-200 font-mono flex-1"
            />
            <Button
              onClick={handleSendMessage}
              disabled={!newMessage.trim()}
              className="bg-green-500/20 hover:bg-green-500/30 text-green-400 border border-green-500/30"
            >
              <Send className="w-4 h-4" />
            </Button>
          </div>
        </TabsContent>

        {/* Tasks Tab */}
        <TabsContent value="tasks" className="space-y-4">
          {/* Create Task */}
          <div className="bg-slate-900/50 cyber-border rounded-lg p-4 space-y-3">
            <div className="flex items-center gap-2 mb-2">
              <Plus className="w-4 h-4 text-cyan-400" />
              <span className="text-cyan-400 font-mono text-sm font-bold">CREATE TASK</span>
            </div>
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
              <select
                value={newTask.priority}
                onChange={(e) => setNewTask({ ...newTask, priority: e.target.value })}
                className="bg-slate-800/50 border border-slate-600/30 text-slate-200 font-mono rounded-md px-3"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
              <Button
                onClick={handleCreateTask}
                disabled={!newTask.title.trim()}
                className="bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-400 border border-cyan-500/30"
              >
                <Plus className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Task List */}
          <div className="space-y-2">
            {tasks.map(task => (
              <div 
                key={task.id}
                className="bg-slate-900/50 cyber-border rounded-lg p-3 flex items-center gap-3"
              >
                <button
                  onClick={() => toggleTaskStatus(task.id)}
                  className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-all ${
                    task.status === 'completed' 
                      ? 'bg-green-500 border-green-500' 
                      : 'border-slate-500 hover:border-cyan-500'
                  }`}
                >
                  {task.status === 'completed' && <CheckCircle className="w-3 h-3 text-white" />}
                </button>
                <div className="flex-1">
                  <div className={`font-mono text-sm ${task.status === 'completed' ? 'line-through text-slate-500' : 'text-slate-300'}`}>
                    {task.title}
                  </div>
                  <div className="text-xs text-slate-500 font-mono">{task.assignee}</div>
                </div>
                <Badge className={`${getPriorityColor(task.priority)} font-mono text-xs`}>
                  {task.priority.toUpperCase()}
                </Badge>
                <Badge className={`${getStatusColor(task.status)} font-mono text-xs`}>
                  {task.status.replace('_', ' ').toUpperCase()}
                </Badge>
              </div>
            ))}
          </div>
        </TabsContent>

        {/* Activity Tab */}
        <TabsContent value="activity" className="space-y-2">
          <div className="bg-slate-900/50 cyber-border rounded-lg p-4 max-h-80 overflow-y-auto">
            {activityLog.map(log => (
              <div key={log.id} className="flex items-center gap-3 py-2 border-b border-slate-700/30 last:border-0">
                <Activity className="w-4 h-4 text-cyan-400" />
                <div className="flex-1">
                  <span className="text-slate-300 font-mono text-sm">{log.action}</span>
                  <span className="text-slate-500 font-mono text-xs ml-2">by {log.user}</span>
                </div>
                <span className="text-slate-500 font-mono text-xs">
                  {new Date(log.timestamp).toLocaleString()}
                </span>
              </div>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </Card>
  );
}