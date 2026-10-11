import React, { useState } from 'react';
import { 
  MessageSquarePlus, Pencil, Trash2, Save, X, Pin, Clock,
  AlertCircle, CheckCircle, Info, Flag
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const ANNOTATION_TYPES = [
  { id: 'note', name: 'Note', icon: Info, color: 'blue' },
  { id: 'correction', name: 'Correction', icon: AlertCircle, color: 'red' },
  { id: 'praise', name: 'Praise', icon: CheckCircle, color: 'green' },
  { id: 'flag', name: 'Flag for Review', icon: Flag, color: 'yellow' }
];

export default function InstructorAnnotations({
  annotations,
  onAddAnnotation,
  onUpdateAnnotation,
  onDeleteAnnotation,
  currentPlaybackTime,
  logs,
  instructorName = 'Instructor'
}) {
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [newAnnotation, setNewAnnotation] = useState({
    type: 'note',
    content: '',
    linkedLogIndex: null
  });

  const handleAdd = () => {
    if (!newAnnotation.content.trim()) return;

    const annotation = {
      id: `ann-${Date.now()}`,
      type: newAnnotation.type,
      content: newAnnotation.content,
      timestamp: currentPlaybackTime,
      linkedLogIndex: newAnnotation.linkedLogIndex,
      createdAt: new Date().toISOString(),
      author: instructorName
    };

    onAddAnnotation(annotation);
    setNewAnnotation({ type: 'note', content: '', linkedLogIndex: null });
    setIsAdding(false);
  };

  const handleUpdate = (id, updates) => {
    onUpdateAnnotation(id, updates);
    setEditingId(null);
  };

  const getTypeConfig = (typeId) => {
    return ANNOTATION_TYPES.find(t => t.id === typeId) || ANNOTATION_TYPES[0];
  };

  const formatTime = (ms) => {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes}:${String(secs).padStart(2, '0')}`;
  };

  const sortedAnnotations = [...annotations].sort((a, b) => a.timestamp - b.timestamp);

  return (
    <div className="bg-[#12121a] border border-[#2a2a3e] rounded-lg overflow-hidden">
      {/* Header */}
      <div className="px-4 py-2 bg-[#1a1a2e] border-b border-[#2a2a3e] flex items-center justify-between">
        <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">
          Instructor Annotations
        </span>
        <button
          onClick={() => setIsAdding(true)}
          className="flex items-center gap-1 px-2 py-1 bg-purple-600/20 hover:bg-purple-600/30 border border-purple-600/50 text-purple-400 text-xs rounded transition-colors"
        >
          <MessageSquarePlus className="w-3 h-3" />
          Add
        </button>
      </div>

      {/* Add Annotation Form */}
      <AnimatePresence>
        {isAdding && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="border-b border-[#2a2a3e] overflow-hidden"
          >
            <div className="p-4 space-y-3">
              {/* Type Selector */}
              <div className="flex gap-2">
                {ANNOTATION_TYPES.map((type) => {
                  const Icon = type.icon;
                  return (
                    <button
                      key={type.id}
                      onClick={() => setNewAnnotation(prev => ({ ...prev, type: type.id }))}
                      className={`flex items-center gap-1 px-2 py-1 rounded text-xs transition-colors ${
                        newAnnotation.type === type.id
                          ? `bg-${type.color}-500/20 text-${type.color}-400 border border-${type.color}-500/50`
                          : 'bg-[#1a1a2e] text-gray-400 hover:text-gray-300'
                      }`}
                      style={{
                        backgroundColor: newAnnotation.type === type.id ? `rgb(var(--${type.color}-500) / 0.2)` : undefined,
                        color: newAnnotation.type === type.id ? 
                          type.color === 'blue' ? '#60a5fa' :
                          type.color === 'red' ? '#f87171' :
                          type.color === 'green' ? '#4ade80' :
                          '#facc15' : undefined
                      }}
                    >
                      <Icon className="w-3 h-3" />
                      {type.name}
                    </button>
                  );
                })}
              </div>

              {/* Link to Log Event */}
              <div>
                <label className="text-xs text-gray-500 block mb-1">Link to Event (optional)</label>
                <select
                  value={newAnnotation.linkedLogIndex ?? ''}
                  onChange={(e) => setNewAnnotation(prev => ({ 
                    ...prev, 
                    linkedLogIndex: e.target.value ? parseInt(e.target.value) : null 
                  }))}
                  className="w-full px-2 py-1.5 bg-[#0a0a0f] border border-[#2a2a3e] rounded text-xs text-gray-300"
                >
                  <option value="">No linked event</option>
                  {logs.slice(-20).map((log, idx) => (
                    <option key={idx} value={logs.length - 20 + idx}>
                      [{log.timestamp}] {log.message.substring(0, 50)}...
                    </option>
                  ))}
                </select>
              </div>

              {/* Content */}
              <textarea
                value={newAnnotation.content}
                onChange={(e) => setNewAnnotation(prev => ({ ...prev, content: e.target.value }))}
                placeholder="Enter your annotation..."
                className="w-full px-3 py-2 bg-[#0a0a0f] border border-[#2a2a3e] rounded text-sm text-gray-300 placeholder-gray-600 h-20 resize-none"
              />

              {/* Actions */}
              <div className="flex justify-end gap-2">
                <button
                  onClick={() => {
                    setIsAdding(false);
                    setNewAnnotation({ type: 'note', content: '', linkedLogIndex: null });
                  }}
                  className="px-3 py-1.5 text-gray-400 hover:text-gray-300 text-xs transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAdd}
                  disabled={!newAnnotation.content.trim()}
                  className="flex items-center gap-1 px-3 py-1.5 bg-purple-600 hover:bg-purple-500 disabled:bg-gray-700 disabled:cursor-not-allowed text-white text-xs rounded transition-colors"
                >
                  <Save className="w-3 h-3" />
                  Save Annotation
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Annotations List */}
      <div className="max-h-64 overflow-y-auto">
        {sortedAnnotations.length === 0 ? (
          <div className="p-4 text-center text-xs text-gray-500">
            No annotations yet. Click "Add" to create one.
          </div>
        ) : (
          <div className="divide-y divide-[#2a2a3e]">
            {sortedAnnotations.map((annotation) => {
              const typeConfig = getTypeConfig(annotation.type);
              const Icon = typeConfig.icon;
              const isEditing = editingId === annotation.id;

              return (
                <div
                  key={annotation.id}
                  className={`p-3 ${
                    typeConfig.color === 'blue' ? 'bg-blue-500/5' :
                    typeConfig.color === 'red' ? 'bg-red-500/5' :
                    typeConfig.color === 'green' ? 'bg-green-500/5' :
                    'bg-yellow-500/5'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <Icon className={`w-4 h-4 flex-shrink-0 mt-0.5 ${
                      typeConfig.color === 'blue' ? 'text-blue-400' :
                      typeConfig.color === 'red' ? 'text-red-400' :
                      typeConfig.color === 'green' ? 'text-green-400' :
                      'text-yellow-400'
                    }`} />
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-bold text-gray-300">{annotation.author}</span>
                        <span className="text-xs text-gray-600">•</span>
                        <span className="text-xs text-gray-500 flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {formatTime(annotation.timestamp)}
                        </span>
                        {annotation.linkedLogIndex !== null && (
                          <span className="text-xs text-purple-400 flex items-center gap-1">
                            <Pin className="w-3 h-3" />
                            Linked
                          </span>
                        )}
                      </div>

                      {isEditing ? (
                        <div className="space-y-2">
                          <textarea
                            defaultValue={annotation.content}
                            className="w-full px-2 py-1 bg-[#0a0a0f] border border-[#2a2a3e] rounded text-xs text-gray-300 h-16 resize-none"
                            id={`edit-${annotation.id}`}
                          />
                          <div className="flex gap-2">
                            <button
                              onClick={() => {
                                const textarea = document.getElementById(`edit-${annotation.id}`);
                                // @ts-ignore
                                handleUpdate(annotation.id, { content: textarea.value });
                              }}
                              className="px-2 py-1 bg-green-600/20 text-green-400 text-xs rounded"
                            >
                              Save
                            </button>
                            <button
                              onClick={() => setEditingId(null)}
                              className="px-2 py-1 text-gray-400 text-xs"
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      ) : (
                        <p className="text-sm text-gray-300">{annotation.content}</p>
                      )}

                      {annotation.linkedLogIndex !== null && logs[annotation.linkedLogIndex] && (
                        <div className="mt-2 p-2 bg-[#0a0a0f] rounded border border-[#2a2a3e]">
                          <p className="text-xs text-gray-500">
                            <span className="font-mono">[{logs[annotation.linkedLogIndex].timestamp}]</span>{' '}
                            {logs[annotation.linkedLogIndex].message}
                          </p>
                        </div>
                      )}
                    </div>

                    {!isEditing && (
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => setEditingId(annotation.id)}
                          className="p-1 text-gray-500 hover:text-gray-300 transition-colors"
                        >
                          <Pencil className="w-3 h-3" />
                        </button>
                        <button
                          onClick={() => onDeleteAnnotation(annotation.id)}
                          className="p-1 text-gray-500 hover:text-red-400 transition-colors"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Export Button */}
      {sortedAnnotations.length > 0 && (
        <div className="p-3 border-t border-[#2a2a3e]">
          <button
            onClick={() => {
              const exportData = sortedAnnotations.map(a => ({
                time: formatTime(a.timestamp),
                type: a.type,
                author: a.author,
                content: a.content,
                linkedEvent: a.linkedLogIndex !== null && logs[a.linkedLogIndex] 
                  ? logs[a.linkedLogIndex].message 
                  : null
              }));
              const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
              const url = URL.createObjectURL(blob);
              const a = document.createElement('a');
              a.href = url;
              a.download = `annotations-${Date.now()}.json`;
              document.body.appendChild(a);
              a.click();
              document.body.removeChild(a);
              URL.revokeObjectURL(url);
            }}
            className="w-full px-3 py-2 bg-[#1a1a2e] hover:bg-[#252540] border border-[#2a2a3e] text-gray-400 text-xs rounded transition-colors"
          >
            Export Annotations
          </button>
        </div>
      )}
    </div>
  );
}