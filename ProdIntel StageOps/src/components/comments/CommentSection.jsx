import React, { useState, useRef, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '../../api/base44Client';
import { format } from 'date-fns';
import {
  MessageSquare,
  Send,
  Reply,
  Trash2,
  Loader2,
  AtSign
} from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Textarea } from '../../components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '../../components/ui/popover';
import { notifyMention } from '../../components/notifications/NotificationService';

export default function CommentSection({ entityType, entityId, productionId }) {
  const [newComment, setNewComment] = useState('');
  const [replyingTo, setReplyingTo] = useState(null);
  const [showMentions, setShowMentions] = useState(false);
  const [mentionFilter, setMentionFilter] = useState('');
  const [cursorPosition, setCursorPosition] = useState(0);
  const textareaRef = useRef(null);
  
  const queryClient = useQueryClient();

  const { data: currentUser } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  const { data: comments = [], isLoading } = useQuery({
    queryKey: ['comments', entityType, entityId],
    queryFn: () => base44.entities.Comment.filter({ 
      entity_type: entityType, 
      entity_id: entityId 
    }),
    enabled: !!entityId,
  });

  const { data: users = [] } = useQuery({
    queryKey: ['allUsers'],
    queryFn: () => base44.entities.User.list(),
  });

  const createCommentMutation = useMutation({
    mutationFn: async (commentData) => {
      const comment = await base44.entities.Comment.create(commentData);
      // Log activity if production-related
      if (productionId) {
        await base44.entities.ActivityLog.create({
          production_id: productionId,
          activity_type: 'comment',
          entity_type: entityType,
          entity_id: entityId,
          user_email: currentUser?.email,
          user_name: currentUser?.full_name,
          description: `${currentUser?.full_name || 'Someone'} commented on ${entityType}`,
          metadata: JSON.stringify({ comment_id: comment.id })
        });
      }
      
      // Send notifications for @mentions
      if (commentData.mentions) {
        const mentionedEmails = JSON.parse(commentData.mentions);
        for (const email of mentionedEmails) {
          if (email !== currentUser?.email) {
            await notifyMention({
              mentionedEmail: email,
              authorName: currentUser?.full_name || 'Someone',
              entityType,
              entityId,
              entityName: entityType
            });
          }
        }
      }
      
      return comment;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['comments', entityType, entityId] });
      queryClient.invalidateQueries({ queryKey: ['activityLog'] });
      setNewComment('');
      setReplyingTo(null);
    }
  });

  const deleteCommentMutation = useMutation({
    mutationFn: (id) => base44.entities.Comment.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['comments', entityType, entityId] }),
  });

  const handleTextChange = (e) => {
    const value = e.target.value;
    const pos = e.target.selectionStart;
    setNewComment(value);
    setCursorPosition(pos);

    // Check for @ trigger
    const textBeforeCursor = value.substring(0, pos);
    const lastAtIndex = textBeforeCursor.lastIndexOf('@');
    
    if (lastAtIndex !== -1) {
      const textAfterAt = textBeforeCursor.substring(lastAtIndex + 1);
      if (!textAfterAt.includes(' ')) {
        setMentionFilter(textAfterAt.toLowerCase());
        setShowMentions(true);
        return;
      }
    }
    setShowMentions(false);
  };

  const insertMention = (user) => {
    const textBeforeCursor = newComment.substring(0, cursorPosition);
    const lastAtIndex = textBeforeCursor.lastIndexOf('@');
    const textAfterCursor = newComment.substring(cursorPosition);
    
    const newText = 
      newComment.substring(0, lastAtIndex) + 
      `@${user.full_name || user.email} ` + 
      textAfterCursor;
    
    setNewComment(newText);
    setShowMentions(false);
    textareaRef.current?.focus();
  };

  const extractMentions = (text) => {
    const mentions = [];
    users.forEach(user => {
      const name = user.full_name || user.email;
      if (text.includes(`@${name}`)) {
        mentions.push(user.email);
      }
    });
    return mentions;
  };

  const handleSubmit = () => {
    if (!newComment.trim()) return;
    
    const mentions = extractMentions(newComment);
    
    createCommentMutation.mutate({
      entity_type: entityType,
      entity_id: entityId,
      content: newComment.trim(),
      mentions: mentions.length > 0 ? JSON.stringify(mentions) : null,
      author_email: currentUser?.email,
      author_name: currentUser?.full_name,
      parent_comment_id: replyingTo?.id || null
    });
  };

  const filteredUsers = users.filter(u => 
    (u.full_name?.toLowerCase().includes(mentionFilter) || 
     u.email?.toLowerCase().includes(mentionFilter))
  );

  const renderContent = (content) => {
    // Highlight @mentions
    let rendered = content;
    users.forEach(user => {
      const name = user.full_name || user.email;
      rendered = rendered.replace(
        new RegExp(`@${name}`, 'g'),
        `<span class="text-blue-600 font-medium">@${name}</span>`
      );
    });
    return <span dangerouslySetInnerHTML={{ __html: rendered }} />;
  };

  const topLevelComments = comments.filter(c => !c.parent_comment_id);
  const getReplies = (commentId) => comments.filter(c => c.parent_comment_id === commentId);

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <MessageSquare className="w-5 h-5" />
          Comments ({comments.length})
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Comment Input */}
        <div className="space-y-2">
          {replyingTo && (
            <div className="text-xs text-slate-500 flex items-center gap-2">
              <Reply className="w-3 h-3" />
              Replying to {replyingTo.author_name}
              <button 
                onClick={() => setReplyingTo(null)}
                className="text-red-500 hover:underline"
              >
                Cancel
              </button>
            </div>
          )}
          <div className="relative">
            <Textarea
              ref={textareaRef}
              placeholder="Add a comment... Use @ to mention someone"
              value={newComment}
              onChange={handleTextChange}
              className="min-h-[80px] pr-12"
            />
            <Button
              size="icon"
              className="absolute bottom-2 right-2 h-8 w-8"
              onClick={handleSubmit}
              disabled={!newComment.trim() || createCommentMutation.isPending}
            >
              {createCommentMutation.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
            </Button>
            
            {/* Mentions Dropdown */}
            {showMentions && filteredUsers.length > 0 && (
              <div className="absolute bottom-full left-0 mb-1 w-64 bg-white border rounded-lg shadow-lg max-h-48 overflow-y-auto z-50">
                {filteredUsers.slice(0, 5).map(user => (
                  <button
                    key={user.id}
                    onClick={() => insertMention(user)}
                    className="w-full px-3 py-2 text-left hover:bg-slate-100 flex items-center gap-2"
                  >
                    <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center text-xs font-medium text-blue-600">
                      {(user.full_name || user.email).charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="text-sm font-medium">{user.full_name || 'No name'}</p>
                      <p className="text-xs text-slate-500">{user.email}</p>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
          <p className="text-xs text-slate-400 flex items-center gap-1">
            <AtSign className="w-3 h-3" />
            Type @ to mention team members
          </p>
        </div>

        {/* Comments List */}
        {isLoading ? (
          <div className="flex justify-center py-4">
            <Loader2 className="w-5 h-5 animate-spin text-slate-400" />
          </div>
        ) : topLevelComments.length === 0 ? (
          <p className="text-center text-slate-500 py-4">No comments yet. Be the first to comment!</p>
        ) : (
          <div className="space-y-4">
            {topLevelComments
              .sort((a, b) => new Date(b.created_date) - new Date(a.created_date))
              .map(comment => (
                <CommentItem
                  key={comment.id}
                  comment={comment}
                  replies={getReplies(comment.id)}
                  onReply={() => setReplyingTo(comment)}
                  onDelete={() => deleteCommentMutation.mutate(comment.id)}
                  currentUserEmail={currentUser?.email}
                  renderContent={renderContent}
                />
              ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function CommentItem({ comment, replies, onReply, onDelete, currentUserEmail, renderContent }) {
  const isOwner = currentUserEmail === comment.author_email;

  return (
    <div className="space-y-2">
      <div className="flex gap-3">
        <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center flex-shrink-0">
          <span className="text-sm font-medium text-indigo-600">
            {(comment.author_name || comment.author_email || '?').charAt(0).toUpperCase()}
          </span>
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-medium text-sm text-slate-900">
              {comment.author_name || comment.author_email || 'Unknown'}
            </span>
            <span className="text-xs text-slate-400">
              {comment.created_date && format(new Date(comment.created_date), 'MMM d, h:mm a')}
            </span>
          </div>
          <p className="text-sm text-slate-700 mt-1">{renderContent(comment.content)}</p>
          <div className="flex items-center gap-3 mt-2">
            <button
              onClick={onReply}
              className="text-xs text-slate-500 hover:text-blue-600 flex items-center gap-1"
            >
              <Reply className="w-3 h-3" />
              Reply
            </button>
            {isOwner && (
              <button
                onClick={onDelete}
                className="text-xs text-slate-500 hover:text-red-600 flex items-center gap-1"
              >
                <Trash2 className="w-3 h-3" />
                Delete
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Replies */}
      {replies.length > 0 && (
        <div className="ml-11 space-y-2 border-l-2 border-slate-100 pl-4">
          {replies.map(reply => (
            <div key={reply.id} className="flex gap-3">
              <div className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center flex-shrink-0">
                <span className="text-xs font-medium text-slate-600">
                  {(reply.author_name || reply.author_email || '?').charAt(0).toUpperCase()}
                </span>
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-xs text-slate-900">
                    {reply.author_name || reply.author_email}
                  </span>
                  <span className="text-xs text-slate-400">
                    {reply.created_date && format(new Date(reply.created_date), 'MMM d, h:mm a')}
                  </span>
                </div>
                <p className="text-sm text-slate-700">{renderContent(reply.content)}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}