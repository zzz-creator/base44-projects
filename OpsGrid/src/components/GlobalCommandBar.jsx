import { useState, useEffect, useRef } from 'react';
import { base44 } from '@/api/base44Client';
import { Search, Zap, AlertTriangle, Activity, Bot, BarChart2, Terminal, X, ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const COMMANDS = [
  { id: 'nav-dashboard', label: 'Go to Dashboard', icon: Activity, action: 'navigate', path: '/', group: 'Navigation' },
  { id: 'nav-alerts', label: 'Go to Alerts', icon: AlertTriangle, action: 'navigate', path: '/alerts', group: 'Navigation' },
  { id: 'nav-incidents', label: 'Go to Incidents', icon: AlertTriangle, action: 'navigate', path: '/incidents', group: 'Navigation' },
  { id: 'nav-analytics', label: 'Go to Analytics', icon: BarChart2, action: 'navigate', path: '/analytics', group: 'Navigation' },
  { id: 'nav-automation', label: 'Go to Automation Engine', icon: Zap, action: 'navigate', path: '/automation', group: 'Navigation' },
  { id: 'nav-simulation', label: 'Go to Simulation Lab', icon: Activity, action: 'navigate', path: '/simulation', group: 'Navigation' },
  { id: 'nav-command', label: 'Go to Command Center', icon: Terminal, action: 'navigate', path: '/command', group: 'Navigation' },
  { id: 'nav-ai', label: 'Open Ops AI', icon: Bot, action: 'navigate', path: '/ai', group: 'Navigation' },
  { id: 'ask-ai', label: 'Ask Ops AI...', icon: Bot, action: 'ai', group: 'AI' },
];

export default function GlobalCommandBar({ onClose }) {
  const [query, setQuery] = useState('');
  const [aiMode, setAiMode] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiAnswer, setAiAnswer] = useState('');
  const inputRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => { inputRef.current?.focus(); }, []);

  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  const filtered = COMMANDS.filter(c =>
    !query || c.label.toLowerCase().includes(query.toLowerCase())
  );

  const askAI = async () => {
    if (!query.trim()) return;
    setAiLoading(true);
    setAiMode(true);
    const [alerts, events] = await Promise.all([
      base44.entities.Alert.list('-created_date', 5).catch(() => []),
      base44.entities.Event.list('-created_date', 5).catch(() => []),
    ]);

    const context = `Active alerts: ${alerts.map(a => `[${a.severity}] ${a.message}`).join('; ')}. Recent events: ${events.map(e => e.description).join('; ')}.`;

    const result = await base44.integrations.Core.InvokeLLM({
      prompt: `You are OpsGrid AI assistant. System context: ${context}. User question: ${query}. Answer concisely in 2-3 sentences.`,
    });
    setAiAnswer(result);
    setAiLoading(false);
  };

  const handleSelect = (cmd) => {
    if (cmd.action === 'navigate') { navigate(cmd.path); onClose(); }
    if (cmd.action === 'ai') { setAiMode(true); }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-start justify-center pt-24 bg-background/70 backdrop-blur-sm" onClick={onClose}>
      <div className="w-full max-w-xl bg-card border border-border rounded-xl shadow-2xl overflow-hidden" onClick={e => e.stopPropagation()}>
        {/* Input */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-border">
          {aiMode ? <Bot className="w-4 h-4 text-neon-blue flex-shrink-0" /> : <Search className="w-4 h-4 text-muted-foreground flex-shrink-0" />}
          <input
            ref={inputRef}
            value={query}
            onChange={e => { setQuery(e.target.value); setAiMode(false); setAiAnswer(''); }}
            onKeyDown={e => { if (e.key === 'Enter' && query.trim()) askAI(); }}
            placeholder={aiMode ? 'Ask Ops AI...' : 'Search commands or ask AI... (Enter to ask AI)'}
            className="flex-1 bg-transparent text-sm font-mono text-foreground placeholder:text-muted-foreground focus:outline-none"
          />
          {query && <button onClick={() => { setQuery(''); setAiMode(false); setAiAnswer(''); }} className="p-0.5 rounded hover:bg-muted/50"><X className="w-3.5 h-3.5 text-muted-foreground" /></button>}
          <button onClick={askAI} className="text-xs font-mono px-2 py-1 rounded border border-neon-blue/30 bg-neon-blue/10 text-neon-blue hover:bg-neon-blue/20 transition-colors flex-shrink-0">ASK AI</button>
        </div>

        {/* AI Answer */}
        {aiMode && (
          <div className="px-4 py-3 border-b border-border bg-neon-blue/5">
            {aiLoading ? (
              <div className="flex items-center gap-2 text-xs font-mono text-neon-blue">
                <div className="w-3 h-3 rounded-full border border-neon-blue border-t-transparent animate-spin" />
                Analyzing system state...
              </div>
            ) : aiAnswer ? (
              <div className="text-sm text-foreground/90 leading-relaxed">{aiAnswer}</div>
            ) : null}
          </div>
        )}

        {/* Command list */}
        {!aiMode && (
          <div className="max-h-80 overflow-auto scrollbar-thin">
            {filtered.length === 0 && (
              <div className="text-center py-8 text-xs font-mono text-muted-foreground">No commands found. Press Enter to ask AI.</div>
            )}
            {['Navigation', 'AI'].map(group => {
              const items = filtered.filter(c => c.group === group);
              if (items.length === 0) return null;
              return (
                <div key={group}>
                  <div className="px-4 py-1.5 text-xs font-mono text-muted-foreground/60 uppercase tracking-widest bg-muted/20">{group}</div>
                  {items.map(cmd => {
                    const Icon = cmd.icon;
                    return (
                      <button key={cmd.id} onClick={() => handleSelect(cmd)}
                        className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-muted/30 transition-colors text-left">
                        <Icon className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
                        <span className="text-sm text-foreground flex-1">{cmd.label}</span>
                        <ChevronRight className="w-3.5 h-3.5 text-muted-foreground/40" />
                      </button>
                    );
                  })}
                </div>
              );
            })}
          </div>
        )}

        <div className="px-4 py-2 border-t border-border bg-muted/10 flex items-center gap-4 text-xs font-mono text-muted-foreground/60">
          <span>↑↓ navigate</span>
          <span>↵ select / ask AI</span>
          <span>Esc close</span>
        </div>
      </div>
    </div>
  );
}