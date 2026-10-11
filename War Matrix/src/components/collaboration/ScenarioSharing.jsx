import React, { useState } from 'react';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Textarea } from '../ui/textarea';
import { Badge } from '../ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog';
import { Share2, Users, MessageSquare, GitBranch, Copy, Check } from 'lucide-react';

export default function ScenarioSharing({ scenario, onShare, onComment, comments = [] }) {
  const [showShareDialog, setShowShareDialog] = useState(false);
  const [shareEmails, setShareEmails] = useState('');
  const [shareMessage, setShareMessage] = useState('');
  const [newComment, setNewComment] = useState('');
  const [copied, setCopied] = useState(false);

  const handleShare = () => {
    const emails = shareEmails.split(',').map(e => e.trim()).filter(e => e);
    
    if (onShare) {
      onShare({
        scenario_id: scenario.id,
        shared_with: emails,
        message: shareMessage,
        permissions: 'view' // or 'edit'
      });
    }
    
    setShowShareDialog(false);
    setShareEmails('');
    setShareMessage('');
  };

  const handleComment = () => {
    if (onComment && newComment.trim()) {
      onComment({
        scenario_id: scenario.id,
        comment: newComment,
        timestamp: new Date().toISOString()
      });
      setNewComment('');
    }
  };

  const copyShareLink = () => {
    const shareLink = `${window.location.origin}/strategy-hub?scenario=${scenario.id}`;
    navigator.clipboard.writeText(shareLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-4">
      <Card className="bg-slate-950/80 backdrop-blur-xl cyber-border p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <Users className="w-6 h-6 text-purple-400" />
            <h3 className="text-xl font-bold text-purple-400 glow-text font-mono">
              COLLABORATION
            </h3>
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
              </div>
            ))}
          </div>

          <div className="flex gap-2">
            <Textarea
              placeholder="Add a comment..."
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
    </div>
  );
}