import React, { useState } from 'react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Badge } from '../ui/badge';
import { 
  CheckCircle, UserPlus, Play, XCircle, Mail, 
  MessageSquare, Loader2, Clock
} from 'lucide-react';
import { base44 } from '../../api/base44Client';
import { toast } from 'sonner';

export default function AlertActionPanel({ alert, onAction, onStatusChange }) {
  const [assignEmail, setAssignEmail] = useState('');
  const [notifyEmail, setNotifyEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [selectedAction, setSelectedAction] = useState('');

  const statusColors = {
    'new': 'bg-blue-500/20 text-blue-400 border-blue-500/30',
    'acknowledged': 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
    'assigned': 'bg-purple-500/20 text-purple-400 border-purple-500/30',
    'in_progress': 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30',
    'resolved': 'bg-green-500/20 text-green-400 border-green-500/30',
    'dismissed': 'bg-slate-500/20 text-slate-400 border-slate-500/30'
  };

  const handleAction = async (action) => {
    setIsLoading(true);
    setSelectedAction(action);
    
    try {
      const actionRecord = {
        action,
        by: 'current_user',
        timestamp: new Date().toISOString(),
        notified: []
      };

      // Send email notification if specified
      if (notifyEmail && (action === 'acknowledge' || action === 'assign' || action === 'escalate')) {
        try {
          await base44.integrations.Core.SendEmail({
            to: notifyEmail,
            subject: `Alert Action: ${alert.title}`,
            body: `An action "${action}" has been taken on alert: ${alert.title}\n\nMessage: ${alert.message}\n\nSeverity: ${alert.severity}`
          });
          actionRecord.notified.push(notifyEmail);
          toast.success(`Notification sent to ${notifyEmail}`);
        } catch (emailErr) {
          toast.error('Failed to send email notification');
        }
      }

      onAction(action, actionRecord);
      
      // Update status based on action
      const statusMap = {
        'acknowledge': 'acknowledged',
        'assign': 'assigned',
        'start_work': 'in_progress',
        'resolve': 'resolved',
        'dismiss': 'dismissed'
      };
      
      if (statusMap[action]) {
        onStatusChange(statusMap[action], assignEmail || null);
      }

      toast.success(`Alert ${action}d successfully`);
    } catch (err) {
      toast.error(`Failed to ${action} alert`);
    } finally {
      setIsLoading(false);
      setSelectedAction('');
    }
  };

  return (
    <div className="space-y-4">
      {/* Current Status */}
      <div className="flex items-center justify-between">
        <span className="text-slate-400 font-mono text-sm">Current Status:</span>
        <Badge className={`${statusColors[alert.status || 'new']} font-mono uppercase`}>
          {alert.status || 'NEW'}
        </Badge>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 gap-2">
        <Button
          onClick={() => handleAction('acknowledge')}
          disabled={isLoading || alert.status === 'acknowledged'}
          className="bg-yellow-500/20 hover:bg-yellow-500/30 text-yellow-400 border border-yellow-500/30 font-mono text-xs"
        >
          {isLoading && selectedAction === 'acknowledge' ? (
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          ) : (
            <CheckCircle className="w-4 h-4 mr-2" />
          )}
          ACKNOWLEDGE
        </Button>
        
        <Button
          onClick={() => handleAction('start_work')}
          disabled={isLoading || alert.status === 'in_progress'}
          className="bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-400 border border-cyan-500/30 font-mono text-xs"
        >
          {isLoading && selectedAction === 'start_work' ? (
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          ) : (
            <Play className="w-4 h-4 mr-2" />
          )}
          START WORK
        </Button>

        <Button
          onClick={() => handleAction('resolve')}
          disabled={isLoading || alert.status === 'resolved'}
          className="bg-green-500/20 hover:bg-green-500/30 text-green-400 border border-green-500/30 font-mono text-xs"
        >
          {isLoading && selectedAction === 'resolve' ? (
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          ) : (
            <CheckCircle className="w-4 h-4 mr-2" />
          )}
          RESOLVE
        </Button>

        <Button
          onClick={() => handleAction('dismiss')}
          disabled={isLoading || alert.status === 'dismissed'}
          className="bg-slate-500/20 hover:bg-slate-500/30 text-slate-400 border border-slate-500/30 font-mono text-xs"
        >
          {isLoading && selectedAction === 'dismiss' ? (
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          ) : (
            <XCircle className="w-4 h-4 mr-2" />
          )}
          DISMISS
        </Button>
      </div>

      {/* Assign To */}
      <div className="space-y-2">
        <label className="text-slate-400 font-mono text-xs">ASSIGN TO:</label>
        <div className="flex gap-2">
          <Input
            type="email"
            value={assignEmail}
            onChange={(e) => setAssignEmail(e.target.value)}
            placeholder="email@example.com"
            className="bg-slate-800/50 border-slate-600/30 text-slate-200 font-mono text-sm flex-1"
          />
          <Button
            onClick={() => handleAction('assign')}
            disabled={isLoading || !assignEmail}
            className="bg-purple-500/20 hover:bg-purple-500/30 text-purple-400 border border-purple-500/30"
          >
            {isLoading && selectedAction === 'assign' ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <UserPlus className="w-4 h-4" />
            )}
          </Button>
        </div>
      </div>

      {/* Notify */}
      <div className="space-y-2">
        <label className="text-slate-400 font-mono text-xs">NOTIFY VIA EMAIL:</label>
        <div className="flex gap-2">
          <Input
            type="email"
            value={notifyEmail}
            onChange={(e) => setNotifyEmail(e.target.value)}
            placeholder="notify@example.com"
            className="bg-slate-800/50 border-slate-600/30 text-slate-200 font-mono text-sm flex-1"
          />
          <Button
            onClick={async () => {
              if (!notifyEmail) return;
              setIsLoading(true);
              try {
                await base44.integrations.Core.SendEmail({
                  to: notifyEmail,
                  subject: `Alert: ${alert.title}`,
                  body: `Alert Details:\n\nTitle: ${alert.title}\nSeverity: ${alert.severity}\nMessage: ${alert.message}\n\nPlease review and take appropriate action.`
                });
                toast.success(`Alert sent to ${notifyEmail}`);
              } catch (err) {
                toast.error('Failed to send notification');
              }
              setIsLoading(false);
            }}
            disabled={isLoading || !notifyEmail}
            className="bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 border border-blue-500/30"
          >
            <Mail className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Action History */}
      {alert.actions_taken?.length > 0 && (
        <div className="mt-4">
          <label className="text-slate-400 font-mono text-xs mb-2 block">ACTION HISTORY:</label>
          <div className="space-y-2 max-h-32 overflow-y-auto">
            {alert.actions_taken.map((action, idx) => (
              <div key={idx} className="flex items-center gap-2 text-xs font-mono bg-slate-800/30 rounded p-2">
                <Clock className="w-3 h-3 text-slate-500" />
                <span className="text-cyan-400">{action.action}</span>
                <span className="text-slate-500">by {action.by}</span>
                <span className="text-slate-600 ml-auto">
                  {new Date(action.timestamp).toLocaleString()}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}