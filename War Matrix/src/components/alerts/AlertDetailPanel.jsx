import React, { useState } from 'react';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Textarea } from '../ui/textarea';
import { Input } from '../ui/input';
import { 
  MapPin, Clock, TrendingUp, Users, DollarSign, Shield, 
  MessageSquare, Send, ChevronDown, ChevronUp, Loader2,
  Brain, AlertTriangle, Globe, History
} from 'lucide-react';

export default function AlertDetailPanel({ alert, onAddNote, onClose, isLoadingAI }) {
  const [newNote, setNewNote] = useState('');
  const [expandedSections, setExpandedSections] = useState({
    impact: true,
    historical: false,
    geographical: true
  });

  const toggleSection = (section) => {
    setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  const handleAddNote = () => {
    if (newNote.trim()) {
      onAddNote(newNote);
      setNewNote('');
    }
  };

  const getSeverityColor = (severity) => {
    const colors = {
      'CRITICAL': 'bg-red-500/20 text-red-400 border-red-500/30',
      'HIGH': 'bg-orange-500/20 text-orange-400 border-orange-500/30',
      'MEDIUM': 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
      'LOW': 'bg-green-500/20 text-green-400 border-green-500/30'
    };
    return colors[severity] || colors['MEDIUM'];
  };

  return (
    <div className="space-y-4">
      {/* AI Summary Section */}
      {alert.ai_summary && (
        <div className="bg-purple-500/10 border border-purple-500/30 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <Brain className="w-5 h-5 text-purple-400" />
            <h4 className="text-purple-400 font-mono font-bold text-sm">AI INSIGHT</h4>
            {isLoadingAI && <Loader2 className="w-4 h-4 text-purple-400 animate-spin" />}
          </div>
          <p className="text-slate-300 font-mono text-sm leading-relaxed">
            {alert.ai_summary}
          </p>
          {alert.ai_priority_score && (
            <div className="mt-3 flex items-center gap-2">
              <span className="text-xs text-slate-400 font-mono">AI Priority Score:</span>
              <Badge className={`${alert.ai_priority_score >= 80 ? 'bg-red-500/20 text-red-400' : alert.ai_priority_score >= 50 ? 'bg-orange-500/20 text-orange-400' : 'bg-green-500/20 text-green-400'} font-mono`}>
                {alert.ai_priority_score}/100
              </Badge>
            </div>
          )}
        </div>
      )}

      {/* Impact Analysis Section */}
      {alert.impact_analysis && (
        <div className="bg-slate-900/50 border border-slate-700/30 rounded-lg overflow-hidden">
          <button
            onClick={() => toggleSection('impact')}
            className="w-full flex items-center justify-between p-4 hover:bg-slate-800/30 transition-colors"
          >
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-orange-400" />
              <h4 className="text-orange-400 font-mono font-bold text-sm">IMPACT ANALYSIS</h4>
            </div>
            {expandedSections.impact ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
          </button>
          {expandedSections.impact && (
            <div className="p-4 pt-0 grid grid-cols-2 gap-3">
              {alert.impact_analysis.economic_impact && (
                <div className="bg-slate-800/30 rounded p-3">
                  <div className="flex items-center gap-2 mb-1">
                    <DollarSign className="w-4 h-4 text-green-400" />
                    <span className="text-xs text-green-400 font-mono">ECONOMIC</span>
                  </div>
                  <p className="text-slate-300 text-xs font-mono">{alert.impact_analysis.economic_impact}</p>
                </div>
              )}
              {alert.impact_analysis.military_impact && (
                <div className="bg-slate-800/30 rounded p-3">
                  <div className="flex items-center gap-2 mb-1">
                    <Shield className="w-4 h-4 text-red-400" />
                    <span className="text-xs text-red-400 font-mono">MILITARY</span>
                  </div>
                  <p className="text-slate-300 text-xs font-mono">{alert.impact_analysis.military_impact}</p>
                </div>
              )}
              {alert.impact_analysis.civilian_impact && (
                <div className="bg-slate-800/30 rounded p-3">
                  <div className="flex items-center gap-2 mb-1">
                    <Users className="w-4 h-4 text-cyan-400" />
                    <span className="text-xs text-cyan-400 font-mono">CIVILIAN</span>
                  </div>
                  <p className="text-slate-300 text-xs font-mono">{alert.impact_analysis.civilian_impact}</p>
                </div>
              )}
              {alert.impact_analysis.regional_stability && (
                <div className="bg-slate-800/30 rounded p-3">
                  <div className="flex items-center gap-2 mb-1">
                    <TrendingUp className="w-4 h-4 text-purple-400" />
                    <span className="text-xs text-purple-400 font-mono">STABILITY</span>
                  </div>
                  <p className="text-slate-300 text-xs font-mono">{alert.impact_analysis.regional_stability}</p>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Geographical Context */}
      {alert.geographical_context && (
        <div className="bg-slate-900/50 border border-slate-700/30 rounded-lg overflow-hidden">
          <button
            onClick={() => toggleSection('geographical')}
            className="w-full flex items-center justify-between p-4 hover:bg-slate-800/30 transition-colors"
          >
            <div className="flex items-center gap-2">
              <Globe className="w-5 h-5 text-cyan-400" />
              <h4 className="text-cyan-400 font-mono font-bold text-sm">GEOGRAPHICAL CONTEXT</h4>
            </div>
            {expandedSections.geographical ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
          </button>
          {expandedSections.geographical && (
            <div className="p-4 pt-0">
              {alert.geographical_context.region && (
                <div className="flex items-center gap-2 mb-2">
                  <MapPin className="w-4 h-4 text-cyan-400" />
                  <span className="text-slate-300 font-mono text-sm">{alert.geographical_context.region}</span>
                </div>
              )}
              {alert.geographical_context.countries?.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {alert.geographical_context.countries.map((country, idx) => (
                    <Badge key={idx} className="bg-cyan-500/10 text-cyan-400 border-cyan-500/30 font-mono text-xs">
                      {country}
                    </Badge>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Historical Context */}
      {alert.historical_context && (
        <div className="bg-slate-900/50 border border-slate-700/30 rounded-lg overflow-hidden">
          <button
            onClick={() => toggleSection('historical')}
            className="w-full flex items-center justify-between p-4 hover:bg-slate-800/30 transition-colors"
          >
            <div className="flex items-center gap-2">
              <History className="w-5 h-5 text-blue-400" />
              <h4 className="text-blue-400 font-mono font-bold text-sm">HISTORICAL CONTEXT</h4>
            </div>
            {expandedSections.historical ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
          </button>
          {expandedSections.historical && (
            <div className="p-4 pt-0">
              <p className="text-slate-300 font-mono text-sm leading-relaxed">{alert.historical_context}</p>
            </div>
          )}
        </div>
      )}

      {/* Related Events */}
      {alert.related_events?.length > 0 && (
        <div className="bg-slate-900/50 border border-slate-700/30 rounded-lg p-4">
          <h4 className="text-yellow-400 font-mono font-bold text-sm mb-3">RELATED EVENTS</h4>
          <div className="space-y-2">
            {alert.related_events.map((event, idx) => (
              <div key={idx} className="flex items-center gap-2 text-slate-300 font-mono text-xs">
                <div className="w-2 h-2 bg-yellow-400 rounded-full"></div>
                {event}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Notes Section */}
      <div className="bg-slate-900/50 border border-slate-700/30 rounded-lg p-4">
        <div className="flex items-center gap-2 mb-3">
          <MessageSquare className="w-5 h-5 text-green-400" />
          <h4 className="text-green-400 font-mono font-bold text-sm">COLLABORATION NOTES</h4>
        </div>
        
        {alert.notes?.length > 0 && (
          <div className="space-y-3 mb-4 max-h-40 overflow-y-auto">
            {alert.notes.map((note, idx) => (
              <div key={idx} className="bg-slate-800/50 rounded p-3">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-cyan-400 font-mono text-xs">{note.author}</span>
                  <span className="text-slate-500 font-mono text-xs">
                    {new Date(note.timestamp).toLocaleString()}
                  </span>
                </div>
                <p className="text-slate-300 font-mono text-sm">{note.content}</p>
              </div>
            ))}
          </div>
        )}

        <div className="flex gap-2">
          <Textarea
            value={newNote}
            onChange={(e) => setNewNote(e.target.value)}
            placeholder="Add a note..."
            className="bg-slate-800/50 border-slate-600/30 text-slate-200 font-mono text-sm resize-none h-20"
          />
          <Button
            onClick={handleAddNote}
            disabled={!newNote.trim()}
            className="bg-green-500/20 hover:bg-green-500/30 text-green-400 border border-green-500/30"
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}