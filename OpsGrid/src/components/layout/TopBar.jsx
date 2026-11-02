import { useState, useEffect } from 'react';
import { Bell, Search, Menu, Wifi, Shield } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function TopBar({ onToggleSidebar, alertCount = 0, onOpenCommandBar }) {
  const [time, setTime] = useState(new Date());
  const [searchOpen, setSearchOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const t = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  const timeStr = time.toLocaleTimeString('en-US', { hour12: false });
  const dateStr = time.toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' });

  return (
    <header className="h-14 flex items-center justify-between px-4 border-b border-border bg-card/80 backdrop-blur-sm flex-shrink-0 z-20">
      {/* Left */}
      <div className="flex items-center gap-3">
        <button
          onClick={onToggleSidebar}
          className="p-2 rounded-md hover:bg-muted transition-colors"
        >
          <Menu className="w-4 h-4 text-muted-foreground" />
        </button>

        {/* Status indicators */}
        <div className="hidden md:flex items-center gap-4 ml-2">
          <StatusPill color="green" label="NOMINAL" />
          <StatusPill color="amber" label="2 WARNINGS" />
          <StatusPill color="red" label={`${alertCount} ALERTS`} blink={alertCount > 0} />
        </div>
      </div>

      {/* Center - Live clock */}
      <div className="hidden md:flex flex-col items-center">
        <div className="font-mono text-lg font-medium text-neon-blue neon-text-blue tracking-widest">
          {timeStr}
        </div>
        <div className="font-mono text-xs text-muted-foreground tracking-widest">{dateStr} UTC</div>
      </div>

      {/* Right */}
      <div className="flex items-center gap-2">
        <button
          onClick={onOpenCommandBar}
          className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-md border border-border text-xs font-mono text-muted-foreground hover:text-foreground hover:border-foreground/30 transition-colors"
        >
          <Search className="w-3.5 h-3.5" />
          <span>Search</span>
          <span className="ml-1 px-1.5 py-0.5 rounded bg-muted text-muted-foreground/60 text-xs">⌘K</span>
        </button>

        <div className="flex items-center gap-1 px-2 py-1 rounded-md bg-muted/60">
          <Wifi className="w-3 h-3 text-neon-green" />
          <span className="font-mono text-xs text-neon-green">LIVE</span>
        </div>

        <button
          onClick={() => navigate('/alerts')}
          className="relative p-2 rounded-md hover:bg-muted transition-colors"
        >
          <Bell className="w-4 h-4 text-muted-foreground" />
          {alertCount > 0 && (
            <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-neon-red status-pulse-red" />
          )}
        </button>

        <div className="flex items-center gap-2 ml-1 px-2 py-1 rounded-md bg-muted/40 border border-border">
          <Shield className="w-3 h-3 text-neon-blue" />
          <span className="text-xs font-mono text-muted-foreground">ADMIN</span>
        </div>
      </div>
    </header>
  );
}

function StatusPill({ color, label, blink = false }) {
  const colors = {
    green: 'bg-neon-green/10 text-neon-green border-neon-green/30',
    amber: 'bg-neon-amber/10 text-neon-amber border-neon-amber/30',
    red: 'bg-neon-red/10 text-neon-red border-neon-red/30',
  };
  return (
    <div className={`flex items-center gap-1.5 px-2 py-1 rounded border text-xs font-mono ${colors[color]}`}>
      <div className={`w-1.5 h-1.5 rounded-full ${
        color === 'green' ? 'bg-neon-green' : color === 'amber' ? 'bg-neon-amber' : 'bg-neon-red'
      } ${blink ? 'animate-pulse' : ''}`} />
      {label}
    </div>
  );
}