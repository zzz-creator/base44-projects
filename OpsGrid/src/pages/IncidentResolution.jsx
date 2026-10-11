import { useState, useEffect, useRef } from 'react';
import { base44 } from '@/api/base44Client';
import { ShieldAlert, Send, Loader2, Plus, AlertTriangle } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

const priorityColor = {
  critical: 'text-neon-red border-neon-red/30 bg-neon-red/10',
  high: 'text-neon-amber border-neon-amber/30 bg-neon-amber/10',
  medium: 'text-neon-blue border-neon-blue/30 bg-neon-blue/10',
  low: 'text-muted-foreground border-border bg-muted/10',
};

const statusColor = {
  open: 'text-neon-red',
  investigating: 'text-neon-amber',
  mitigated: 'text-neon-blue',
  resolved: 'text-neon-green',
};

export default function IncidentResolution() {
  const [conversations, setConversations] = useState([]);
  const [activeConvId, setActiveConvId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [incidents, setIncidents] = useState([]);
  const bottomRef = useRef(null);

  useEffect(() => {
    base44.agents.listConversations({ agent_name: 'incident_resolution' }).then(convs => {
      setConversations(convs || []);
    });
    base44.entities.Incident.filter({ status: 'open' }, '-created_date', 10).then(setIncidents);
    const unsub = base44.entities.Incident.subscribe(async () => {
      const data = await base44.entities.Incident.filter({ status: 'open' }, '-created_date', 10);
      setIncidents(data);
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    if (!activeConvId) return;
    const unsub = base44.agents.subscribeToConversation(activeConvId, data => {
      setMessages(data.messages || []);
    });
    return () => unsub();
  }, [activeConvId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const newConversation = async () => {
    const conv = await base44.agents.createConversation({
      agent_name: 'incident_resolution',
      metadata: { name: `INC-${Date.now().toString().slice(-5)}` },
    });
    setConversations(p => [conv, ...p]);
    setActiveConvId(conv.id);
    setMessages([]);
  };

  const loadConversation = async (id) => {
    const conv = await base44.agents.getConversation(id);
    setActiveConvId(id);
    setMessages(conv.messages || []);
  };

  const startIncidentSession = async (incident) => {
    const conv = await base44.agents.createConversation({
      agent_name: 'incident_resolution',
      metadata: { name: incident.title.slice(0, 30) },
    });
    setConversations(p => [conv, ...p]);
    setActiveConvId(conv.id);
    setMessages([]);
    await base44.agents.addMessage(conv, {
      role: 'user',
      content: `I need help resolving incident: "${incident.title}" (Priority: ${incident.priority}, Status: ${incident.status}). Please guide me through the resolution steps.`,
    });
  };

  const send = async () => {
    if (!input.trim() || loading) return;
    let convId = activeConvId;
    if (!convId) {
      const conv = await base44.agents.createConversation({
        agent_name: 'incident_resolution',
        metadata: { name: `INC-${Date.now().toString().slice(-5)}` },
      });
      setConversations(p => [conv, ...p]);
      setActiveConvId(conv.id);
      convId = conv.id;
    }
    const conv = await base44.agents.getConversation(convId);
    setLoading(true);
    const text = input;
    setInput('');
    await base44.agents.addMessage(conv, { role: 'user', content: text });
    setLoading(false);
  };

  const handleKey = e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); } };

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center gap-3 px-6 py-4 border-b border-border bg-card/40 flex-shrink-0">
        <ShieldAlert className="w-4 h-4 text-neon-red" />
        <h1 className="text-sm font-mono font-semibold tracking-widest uppercase">Incident Resolution Agent</h1>
        {incidents.length > 0 && (
          <span className="px-2 py-0.5 rounded border border-neon-red/30 bg-neon-red/10 text-neon-red text-xs font-mono">
            {incidents.length} OPEN
          </span>
        )}
        <button
          onClick={newConversation}
          className="ml-auto flex items-center gap-1.5 text-xs font-mono px-3 py-1.5 rounded border border-neon-red/30 bg-neon-red/10 text-neon-red hover:bg-neon-red/20 transition-colors"
        >
          <Plus className="w-3 h-3" /> New Session
        </button>
      </div>

      <div className="flex-1 flex min-h-0">
        {/* Sidebar */}
        <div className="w-60 border-r border-border flex flex-col bg-card/20 flex-shrink-0">
          {/* Active incidents */}
          {incidents.length > 0 && (
            <div className="border-b border-border">
              <div className="px-3 py-2">
                <span className="text-xs font-mono text-muted-foreground uppercase tracking-widest">Active Incidents</span>
              </div>
              <div className="max-h-48 overflow-auto scrollbar-thin px-2 pb-2 space-y-1">
                {incidents.map(inc => (
                  <button
                    key={inc.id}
                    onClick={() => startIncidentSession(inc)}
                    className={`w-full text-left p-2 rounded border text-xs font-mono transition-colors hover:opacity-90 ${priorityColor[inc.priority] || priorityColor.low}`}
                  >
                    <div className="flex items-center gap-1 mb-0.5">
                      <AlertTriangle className="w-3 h-3 flex-shrink-0" />
                      <span className="truncate font-medium">{inc.title}</span>
                    </div>
                    <span className={`uppercase text-xs ${statusColor[inc.status]}`}>{inc.status}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Sessions */}
          <div className="px-3 py-2 border-b border-border">
            <span className="text-xs font-mono text-muted-foreground uppercase tracking-widest">Sessions</span>
          </div>
          <div className="flex-1 overflow-auto scrollbar-thin py-1">
            {conversations.length === 0 && (
              <p className="text-xs font-mono text-muted-foreground p-3">No sessions yet</p>
            )}
            {conversations.map(c => (
              <button
                key={c.id}
                onClick={() => loadConversation(c.id)}
                className={`w-full text-left px-3 py-2 text-xs font-mono truncate transition-colors hover:bg-muted/30 ${activeConvId === c.id ? 'bg-neon-red/10 text-neon-red' : 'text-muted-foreground'}`}
              >
                {c.metadata?.name || 'Session'}
              </button>
            ))}
          </div>
        </div>

        {/* Chat */}
        <div className="flex-1 flex flex-col min-h-0">
          <div className="flex-1 overflow-auto scrollbar-thin p-4 space-y-3">
            {messages.length === 0 && (
              <div className="text-center py-16 text-muted-foreground">
                <ShieldAlert className="w-10 h-10 mx-auto mb-3 opacity-20" />
                <p className="text-sm font-mono">Incident Resolution Agent ready</p>
                <p className="text-xs font-mono mt-1 opacity-60">Select an active incident or start a new session</p>
                <div className="mt-4 flex flex-wrap gap-2 justify-center">
                  {['List open incidents', 'Show critical incidents', 'Start triage protocol'].map(s => (
                    <button key={s} onClick={() => setInput(s)}
                      className="text-xs font-mono px-3 py-1.5 rounded border border-border text-muted-foreground hover:text-foreground hover:border-neon-red/40 transition-colors">
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            )}
            {messages.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[80%] rounded-xl px-4 py-2.5 text-sm ${
                  msg.role === 'user'
                    ? 'bg-neon-red/10 border border-neon-red/20 text-foreground font-mono'
                    : 'bg-card border border-border text-foreground'
                }`}>
                  {msg.role === 'user' ? (
                    <p>{msg.content}</p>
                  ) : (
                    <ReactMarkdown className="prose prose-sm prose-invert max-w-none text-sm [&>*:first-child]:mt-0 [&>*:last-child]:mb-0">
                      {msg.content}
                    </ReactMarkdown>
                  )}
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex justify-start">
                <div className="bg-card border border-border rounded-xl px-4 py-2.5 flex items-center gap-2">
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-neon-red" />
                  <span className="text-xs font-mono text-muted-foreground">Analyzing incident...</span>
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          <div className="p-4 border-t border-border bg-card/20">
            <div className="flex gap-2">
              <textarea
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={handleKey}
                rows={1}
                placeholder="Describe the incident or ask for resolution guidance..."
                className="flex-1 bg-input border border-border rounded-lg px-3 py-2 text-sm font-mono text-foreground placeholder:text-muted-foreground resize-none focus:outline-none focus:ring-1 focus:ring-neon-red"
              />
              <button
                onClick={send}
                disabled={!input.trim() || loading}
                className="px-4 py-2 rounded-lg border border-neon-red/30 bg-neon-red/10 text-neon-red hover:bg-neon-red/20 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}