import React, { useState, useEffect } from 'react';
import { Card } from '../ui/card';
import { Badge } from '../ui/badge';
import { Clock, TrendingUp, AlertTriangle, Shield } from 'lucide-react';

export default function TimelineVisualization({ timeline, isEvolution = false }) {
  const [activeIndex, setActiveIndex] = useState(-1);

  useEffect(() => {
    if (timeline && timeline.length > 0) {
      let index = 0;
      const interval = setInterval(() => {
        setActiveIndex(index);
        index++;
        if (index >= timeline.length) {
          clearInterval(interval);
        }
      }, 500);
      
      return () => clearInterval(interval);
    }
  }, [timeline]);

  if (!timeline || timeline.length === 0) return null;

  return (
    <Card className="bg-slate-950/80 backdrop-blur-xl cyber-border p-6">
      <div className="flex items-center gap-3 mb-6">
        <Clock className="w-6 h-6 text-cyan-400" />
        <h3 className="text-xl font-bold text-cyan-400 glow-text font-mono">
          {isEvolution ? 'EVOLVED TIMELINE' : 'CONFLICT TIMELINE'}
        </h3>
      </div>

      <div className="relative">
        {/* Timeline line */}
        <div className="absolute left-8 top-0 bottom-0 w-1 bg-gradient-to-b from-green-500 via-yellow-500 to-red-500 opacity-30"></div>

        <div className="space-y-6">
          {timeline.map((period, idx) => {
            const isVisible = idx <= activeIndex;
            const isActive = idx === activeIndex;

            return (
              <div
                key={idx}
                className={`relative pl-20 transition-all duration-500 ${
                  isVisible ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-8'
                }`}
              >
                {/* Timeline node */}
                <div
                  className={`absolute left-6 w-5 h-5 rounded-full border-2 transition-all duration-300 ${
                    isActive
                      ? 'bg-cyan-400 border-cyan-400 shadow-lg shadow-cyan-400/50 scale-125'
                      : isVisible
                      ? 'bg-green-500 border-green-500'
                      : 'bg-slate-700 border-slate-700'
                  }`}
                >
                  {isActive && (
                    <div className="absolute inset-0 rounded-full bg-cyan-400 animate-ping"></div>
                  )}
                </div>

                <div className={`bg-slate-900/50 cyber-border rounded-lg p-4 ${
                  isActive ? 'shadow-lg shadow-cyan-400/20' : ''
                }`}>
                  <div className="flex items-center gap-2 mb-2">
                    <Badge className="bg-purple-500/20 text-purple-400 border-purple-500/30 font-mono text-xs">
                      {period.period}
                    </Badge>
                    {isEvolution && (
                      <Badge className="bg-cyan-500/20 text-cyan-400 border-cyan-500/30 font-mono text-xs">
                        EVOLVED
                      </Badge>
                    )}
                  </div>

                  <ul className="space-y-2">
                    {period.events?.map((event, eventIdx) => (
                      <li
                        key={eventIdx}
                        className={`flex items-start gap-2 text-sm font-mono transition-all duration-300 delay-${eventIdx * 100} ${
                          isVisible ? 'opacity-100' : 'opacity-0'
                        }`}
                      >
                        <span className="text-green-400 mt-1">→</span>
                        <span className="text-slate-300">{event}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </Card>
  );
}