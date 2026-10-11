import { useState, useEffect, useRef } from 'react';
import { base44 } from '@/api/base44Client';
import { Bot, Send, RefreshCw, Zap, AlertTriangle, FileText, TrendingUp, Cpu, X } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

const SUGGESTIONS = [
  { icon: AlertTriangle, text: 'Summarize current active alerts' },
  { icon: TrendingUp, text: 'Analyze system performance trends' },
  { icon: FileText, text: 'Generate an incident report' },
  { icon: Cpu, text: 'Detect anomalies in recent metrics' },
  { icon: Zap, text: 'Recommend automation rules for current issues' },
];

async function gatherContext() {
  const [alerts, events, incidents] = await Promise.all([
    base44.entities.Alert.list('-created_date', 10).catch(() => []),
    base44.entities.Event.list('-created_date', 15).catch(() => []),
    base44.entities.Incident.list('-created_date', 5).catch(() => []),
  ]);

  const activeAlerts = alerts.filter(a => a.status === 'active');
  const openIncidents = incidents.filter(i => i.status === 'open' || i.status === 'investigating');

  return {
    alerts: activeAlerts,
    events,
    incidents: openIncidents,
    summary: `${activeAlerts.length} active alerts, ${openIncidents.length} open incidents. Recent events: ${events.slice(0, 5).map(e => e.description).join('; ')}.`
  };
}

export default function OpsAI() {
  const [messages, setMessages] = useState([
    { role: 'assistant', content: '**OpsGrid AI+ Online**\n\nI\'m your proactive operational intelligence assistant. I can analyze alerts, detect anomalies, predict issues, generate incident reports, and recommend automation rules.\n\nAsk me anything about your system state.' }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [context, setContext] = useState(null);
  const [contextLoading, setContextLoading] = useState(false);
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  useEffect(() => {
    loadContext();
  }, []);

  const loadContext = async () => {
    setContextLoading(true);
    const ctx = await gatherContext();
    setContext(ctx);
    setContextLoading(false);
  };

  const send = async (text) => {
    const msg = (text || input).trim();
    if (!msg || loading) return;
    setInput('');
    setMessages(p => [...p, { role: 'user', content: msg }]);
    setLoading(true);

    const ctx = context || await gatherContext();
    const systemPrompt = `You are OpsGrid AI+, a proactive operational intelligence assistant for an enterprise monitoring platform.

Current system state:
- Active alerts: ${ctx.alerts.length} (${ctx.alerts.map(a => `[${a.severity}] ${a.message}`).join('; ')})
- Open incidents: ${ctx.incidents.length} (${ctx.incidents.map(i => `${i.title} (${i.status})`).join('; ')})
- Recent events: ${ctx.events.slice(0, 8).map(e => e.description).join('; ')}

Your capabilities:
1. Anomaly detection in metrics and patterns
2. Alert likelihood prediction based on trends
3. Real-time system state summarization
4. Operator action recommendations
5. Plain-language event explanation
6. Automated incident report generation

Be concise, actionable, and use markdown formatting. Use bullet points for lists. Highlight critical issues.`;

    const result = await base44.integrations.Core.InvokeLLM({
      prompt: `${systemPrompt}\n\nUser: ${msg}`,
    });

    setMessages(p => [...p, { role: 'assistant', content: result }]);
    setLoading(false);

    await base44.entities.Event.create({ type: 'user_action', description: `Ops AI query: "${msg.slice(0, 60)}..."` }).catch(() => {});
  };

  const generateReport = async () => {
    setMessages(p => [...p, { role: 'user', content: 'Generate a full automated incident report for the current system state.' }]);
    setLoading(true);
    const ctx = context || await gatherContext();

    const result = await base44.integrations.Core.InvokeLLM({
      prompt: `Generate a structured incident report in markdown for an operations team. System state: ${ctx.summary}. Alerts: ${ctx.alerts.map(a => `[${a.severity}] ${a.message} from ${a.source}`).join('; ')}. Open incidents: ${ctx.incidents.map(i => `${i.title} - ${i.status}`).join('; ')}. Include: Executive Summary, Current Status, Active Issues, Risk Assessment, and Recommended Actions.`,
    });

    setMessages(p => [...p, { role: 'assistant', content: result }]);
    setLoading(false);
  };

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-card/40 flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-neon-blue/20 border border-neon-blue/30 flex items-center justify-center">
            <Bot className="w-4 h-4 text-neon-blue" />
          </div>
          <div>
            <h1 className="text-sm font-mono font-semibold tracking-widest uppercase">Ops AI+</h1>
            <div className="text-xs text-muted-foreground font-mono">Operational Intelligence Assistant</div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {context && (
            <div className="text-xs font-mono text-muted-foreground/60">
              {context.alerts.length} alerts · {context.incidents.length} incidents
            </div>
          )}
          <button onClick={loadContext} className="p-1.5 rounded hover:bg-muted/50 transition-colors" title="Refresh context">
            <RefreshCw className={`w-3.5 h-3.5 text-muted-foreground ${contextLoading ? 'animate-spin' : ''}`} />
          </button>
          <button onClick={generateReport}
            className="flex items-center gap-1.5 text-xs font-mono px-3 py-1.5 rounded border border-neon-blue/30 bg-neon-blue/10 text-neon-blue hover:bg-neon-blue/20 transition-colors">
            <FileText className="w-3 h-3" /> REPORT
          </button>
        </div>
      </div>

      {/* Context bar */}
      {context && (context.alerts.length > 0 || context.incidents.length > 0) && (
        <div className="flex items-center gap-3 px-6 py-2 border-b border-border bg-neon-red/5 overflow-x-auto flex-shrink-0">
          {context.alerts.slice(0, 3).map((a, i) => (
            <div key={i} className="flex items-center gap-1.5 text-xs font-mono text-neon-red flex-shrink-0">
              <AlertTriangle className="w-3 h-3" />
              <span className="truncate max-w-40">{a.message}</span>
            </div>
          ))}
          {context.alerts.length > 3 && (
            <span className="text-xs font-mono text-muted-foreground flex-shrink-0">+{context.alerts.length - 3} more</span>
          )}
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-auto scrollbar-thin px-6 py-4 space-y-4">
        {messages.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            {msg.role === 'assistant' && (
              <div className="w-7 h-7 rounded-lg bg-neon-blue/20 border border-neon-blue/30 flex items-center justify-center mr-2 mt-0.5 flex-shrink-0">
                <Bot className="w-3.5 h-3.5 text-neon-blue" />
              </div>
            )}
            <div className={`max-w-2xl rounded-xl px-4 py-3 ${
              msg.role === 'user'
                ? 'bg-neon-blue/10 border border-neon-blue/20 text-foreground'
                : 'bg-card border border-border text-foreground'
            }`}>
              {msg.role === 'user' ? (
                <p className="text-sm font-mono">{msg.content}</p>
              ) : (
                <ReactMarkdown
                  className="text-sm prose-sm prose-invert max-w-none [&>*:first-child]:mt-0 [&>*:last-child]:mb-0 [&_p]:my-1 [&_ul]:my-1 [&_li]:my-0.5 [&_h2]:text-neon-blue [&_h3]:text-neon-amber [&_strong]:text-foreground"
                >
                  {msg.content}
                </ReactMarkdown>
              )}
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex items-center gap-3">
            <div className="w-7 h-7 rounded-lg bg-neon-blue/20 border border-neon-blue/30 flex items-center justify-center flex-shrink-0">
              <Bot className="w-3.5 h-3.5 text-neon-blue" />
            </div>
            <div className="bg-card border border-border rounded-xl px-4 py-3 flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-neon-blue animate-pulse" />
              <div className="w-1.5 h-1.5 rounded-full bg-neon-blue animate-pulse" style={{ animationDelay: '0.2s' }} />
              <div className="w-1.5 h-1.5 rounded-full bg-neon-blue animate-pulse" style={{ animationDelay: '0.4s' }} />
              <span className="text-xs font-mono text-muted-foreground ml-1">Analyzing system state...</span>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Suggestions */}
      {messages.length <= 1 && (
        <div className="px-6 py-3 border-t border-border overflow-x-auto flex-shrink-0">
          <div className="flex gap-2">
            {SUGGESTIONS.map((s, i) => {
              const Icon = s.icon;
              return (
                <button key={i} onClick={() => send(s.text)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border text-xs font-mono text-muted-foreground hover:text-foreground hover:border-foreground/30 transition-colors whitespace-nowrap flex-shrink-0 bg-card/50">
                  <Icon className="w-3 h-3" />
                  {s.text}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Input */}
      <div className="px-6 py-4 border-t border-border bg-card/20 flex-shrink-0">
        <div className="flex gap-3">
          <input
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && !e.shiftKey && send()}
            placeholder="Ask Ops AI about your system, request analysis, or generate reports..."
            className="flex-1 h-10 bg-input border border-border rounded-lg px-4 text-sm font-mono text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-neon-blue"
          />
          <button onClick={() => send()} disabled={loading || !input.trim()}
            className="h-10 px-4 rounded-lg border border-neon-blue/30 bg-neon-blue/10 text-neon-blue hover:bg-neon-blue/20 disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}