import * as React from 'react';
const { useState, useEffect, useRef, useCallback } = React;
import { MessageSquare, Send, Radio, Volume2, VolumeX, Minimize2, Maximize2 } from 'lucide-react';
// base44 import removed - using direct API calls
// @ts-ignore
import { motion, AnimatePresence } from 'framer-motion';

export default function CommandCenterChat({ 
  systemState, 
  currentPhase, 
  diagnostics, 
  logs,
  runId 
}) {
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const messagesEndRef = useRef(null);
  const lastEventRef = useRef(null);

  // Initial greeting
  useEffect(() => {
    if (runId && messages.length === 0) {
        sendSystemMessage(null, `CENTCOM online. Mission ID: ${runId}. Standing by for operator actions.`);
    }
  }, [runId]);


  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // React to system state changes
  useEffect(() => {
    // conversation check removed
    
    const eventKey = `${systemState}-${currentPhase}`;
    if (lastEventRef.current === eventKey) return;
    lastEventRef.current = eventKey;

    const reactToState = async () => {
      let message = null;

      switch (systemState) {
        case 'INITIALIZING':
          if (currentPhase === 0) {
            message = "CENTCOM acknowledges system initialization. Monitoring boot sequence. Stand by for diagnostics clearance.";
          }
          break;
        case 'READY':
          if (currentPhase === 1) {
            message = "Systems nominal. CENTCOM authorizes diagnostic sequence. Execute when ready, operator.";
          }
          break;
        case 'DEGRADED':
          message = "⚠️ CENTCOM ALERT: Degraded system status detected. Recommend reviewing affected subsystems before proceeding. Request permission to continue?";
          break;
        case 'FAILED':
          message = "🔴 CENTCOM CRITICAL: System failure detected. Mission hold in effect. Initiate fault isolation procedures or request maintenance override.";
          break;
        case 'AUTHORIZED':
          message = "CENTCOM confirms dual-key authorization received. Final launch authority granted. Await your command, operator.";
          break;
        case 'COUNTDOWN':
          message = "🚀 CENTCOM: Countdown sequence active. All stations report ready. T-minus counting.";
          break;
        case 'COMPLETE':
          message = "CENTCOM confirms successful launch execution. Mission complete. Excellent work, operator. Prepare for debrief.";
          break;
        case 'ABORTED':
          message = "CENTCOM acknowledges abort sequence. All systems safe. Standing by for debrief or mission restart.";
          break;
      }

      if (message && !isMuted) {
        await sendSystemMessage(null, message);
      }
    };

    // Delay slightly to avoid rapid-fire messages
    const timeout = setTimeout(reactToState, 1500);
    return () => clearTimeout(timeout);
  }, [systemState, currentPhase, isMuted]);

  // React to phase changes
  useEffect(() => {
    if (isMuted) return;

    const reactToPhase = async () => {
      let message = null;

      switch (currentPhase) {
        case 2:
          message = "CENTCOM: Authentication phase initiated. Awaiting dual-officer authorization codes. Time-critical.";
          break;
        case 3:
          message = "CENTCOM: Authentication verified. Proceed to command validation. Input target coordinates when ready.";
          break;
        case 4:
          message = "CENTCOM: Command validated. Proceed to final authorization. Simultaneous key turn required within 3 seconds.";
          break;
        case 5:
          message = "⚡ CENTCOM: LAUNCH AUTHORIZED. Final sequence standing by. Execute launch command when ready.";
          break;
      }

      if (message) {
        await sendSystemMessage(null, message);
      }
    };

    const timeout = setTimeout(reactToPhase, 2000);
    return () => clearTimeout(timeout);
  }, [currentPhase, isMuted]);

  // React to diagnostic results
  useEffect(() => {
    if (!diagnostics || Object.keys(diagnostics).length === 0 || isMuted) return;

    const failedSystems = Object.entries(diagnostics)
      .filter(([_, status]) => status === 'FAILED')
      .map(([id]) => id);

    const degradedSystems = Object.entries(diagnostics)
      .filter(([_, status]) => status === 'DEGRADED')
      .map(([id]) => id);

    if (failedSystems.length > 0) {
      sendSystemMessage(null, `CENTCOM DIAGNOSTIC ALERT: Critical failures detected in: ${failedSystems.join(', ').toUpperCase()}. Mission cannot proceed until resolved.`);
    } else if (degradedSystems.length > 0) {
      sendSystemMessage(null, `CENTCOM ADVISORY: Degraded performance in: ${degradedSystems.join(', ').toUpperCase()}. Mission may proceed with caution.`);
    }
  }, [diagnostics, isMuted]);

  const sendSystemMessage = async (conv, content) => {
    try {
      // Add as assistant message directly to local state
      // We don't need to persist system messages to the AI history necessarily, 
      // or we could sending them to the backend context if needed.
      // For now, just display them.
      setMessages(prev => [...prev, {
        role: 'assistant',
        content,
        timestamp: new Date().toISOString()
      }]);
    } catch (err) {
      console.error('Failed to send system message:', err);
    }
  };

  const sendMessage = async () => {
    if (!inputMessage.trim() || isLoading) return;

    const userMessage = inputMessage.trim();
    setInputMessage('');
    setIsLoading(true);

    // Optimistic update
    const newHistory = [...messages, {
        role: 'user',
        content: userMessage,
        timestamp: new Date().toISOString()
    }];
    setMessages(newHistory);

    try {
      const response = await fetch('/api/comms/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
            message: userMessage,
            history: messages.map(m => ({
                role: m.role === 'assistant' ? 'model' : 'user',
                parts: [{ text: m.content }]
            }))
        })
      });

      if (!response.ok) throw new Error('Failed to get response');
      
      const data = await response.json();
      
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: data.content,
        timestamp: new Date().toISOString()
      }]);

    } catch (err) {
      console.error('Failed to send message:', err);
      // Optional: Add error message to chat
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    // @ts-ignore
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`fixed bottom-16 right-4 z-50 ${isMinimized ? 'w-auto' : 'w-80 sm:w-96'}`}
    >
      {/* Header */}
      <div 
        className="flex items-center justify-between px-3 py-2 bg-gradient-to-r from-cyan-900/90 to-blue-900/90 border border-cyan-500/30 rounded-t-lg cursor-pointer"
        onClick={() => {
          if (isMinimized) {
            setIsMinimized(false);
            setUnreadCount(0);
          }
        }}
      >
        <div className="flex items-center gap-2">
          {/* @ts-ignore */}
          <Radio className="w-4 h-4 text-cyan-400 animate-pulse" />
          <span className="text-xs font-bold text-cyan-300 tracking-wider">CENTCOM COMMS</span>
          {isMinimized && unreadCount > 0 && (
            <span className="px-1.5 py-0.5 bg-red-500 text-white text-xs rounded-full">
              {unreadCount}
            </span>
          )}
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={(e) => { e.stopPropagation(); setIsMuted(!isMuted); }}
            className="p-1 hover:bg-white/10 rounded"
            title={isMuted ? 'Unmute' : 'Mute auto-messages'}
          >
            {/* @ts-ignore */}
            {isMuted ? <VolumeX className="w-3 h-3 text-gray-400" /> : <Volume2 className="w-3 h-3 text-cyan-400" />}
          </button>
          <button
            onClick={(e) => { 
              e.stopPropagation(); 
              setIsMinimized(!isMinimized);
              if (!isMinimized) setUnreadCount(0);
            }}
            className="p-1 hover:bg-white/10 rounded"
          >
            {/* @ts-ignore */}
            {isMinimized ? <Maximize2 className="w-3 h-3 text-gray-400" /> : <Minimize2 className="w-3 h-3 text-gray-400" />}
          </button>
        </div>
      </div>

      {/* Chat Body */}
      <AnimatePresence>
        {!isMinimized && (
          /* @ts-ignore */
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="bg-[#0a0a0f]/95 border-x border-b border-cyan-500/30 rounded-b-lg overflow-hidden"
          >
            {/* Messages */}
            <div className="h-64 overflow-y-auto p-3 space-y-2">
              {messages.length === 0 ? (
                <p className="text-xs text-gray-500 text-center py-4">Establishing secure channel...</p>
              ) : (
                messages.map((msg, idx) => (
                  <div
                    key={idx}
                    className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div className={`max-w-[85%] px-3 py-2 rounded-lg text-xs ${
                      msg.role === 'user'
                        ? 'bg-blue-600/30 border border-blue-500/30 text-blue-200'
                        : 'bg-cyan-900/30 border border-cyan-500/30 text-cyan-200'
                    }`}>
                      {msg.role === 'assistant' && (
                        <div className="flex items-center gap-1 mb-1 text-cyan-400 text-[10px] font-bold">
                          {/* @ts-ignore */}
                          <Radio className="w-2.5 h-2.5" />
                          CENTCOM
                        </div>
                      )}
                      <p className="whitespace-pre-wrap">{msg.content}</p>
                    </div>
                  </div>
                ))
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="p-2 border-t border-cyan-500/20">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Message CENTCOM..."
                  className="flex-1 px-3 py-2 bg-[#1a1a2e] border border-[#2a2a3e] rounded text-xs text-gray-200 placeholder-gray-500 focus:outline-none focus:border-cyan-500/50"
                  disabled={isLoading}
                />
                <button
                  onClick={sendMessage}
                   disabled={!inputMessage.trim() || isLoading}
                  className="px-3 py-2 bg-cyan-600/20 hover:bg-cyan-600/30 disabled:bg-gray-700 disabled:cursor-not-allowed border border-cyan-500/50 text-cyan-400 rounded transition-colors"
                >
                  {/* @ts-ignore */}
                  <Send className="w-4 h-4" />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}