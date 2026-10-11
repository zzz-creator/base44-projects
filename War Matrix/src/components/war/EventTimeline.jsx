import React from 'react';
import { Card } from '../ui/card';
import { Badge } from '../ui/badge';
import { Clock, AlertTriangle, TrendingUp, Shield, Flame } from 'lucide-react';

export default function EventTimeline({ events }) {
  const getEventIcon = (type) => {
    const icons = {
      'offensive': Flame,
      'defensive': Shield,
      'escalation': TrendingUp,
      'ceasefire': Clock,
      'incident': AlertTriangle
    };
    const Icon = icons[type] || AlertTriangle;
    return Icon;
  };

  const getEventColor = (type) => {
    const colors = {
      'offensive': 'border-red-500/30 bg-red-500/10',
      'defensive': 'border-blue-500/30 bg-blue-500/10',
      'escalation': 'border-orange-500/30 bg-orange-500/10',
      'ceasefire': 'border-green-500/30 bg-green-500/10',
      'incident': 'border-yellow-500/30 bg-yellow-500/10'
    };
    return colors[type] || colors['incident'];
  };

  return (
    <Card className="bg-slate-950/80 backdrop-blur-xl cyber-border h-full">
      <div className="p-4 border-b border-purple-900/30">
        <div className="flex items-center gap-2">
          <Clock className="w-5 h-5 text-purple-400" />
          <h3 className="text-lg font-bold text-purple-400 glow-text font-mono">
            EVENT TIMELINE
          </h3>
        </div>
      </div>

      <div className="h-[600px] overflow-y-auto">
        <div className="p-4">
          {!events || events.length === 0 ? (
            <div className="text-center py-12">
              <Clock className="w-12 h-12 text-slate-600 mx-auto mb-3" />
              <p className="text-slate-500 font-mono text-sm">No recent events</p>
            </div>
          ) : (
            <div className="relative space-y-4">
              {/* Timeline line */}
              <div className="absolute left-6 top-0 bottom-0 w-px bg-purple-500/20"></div>

              {events.map((event, idx) => {
                const Icon = getEventIcon(event.type);
                
                return (
                  <div key={idx} className="relative pl-14">
                    {/* Timeline dot */}
                    <div className={`absolute left-3 top-2 w-6 h-6 rounded-full cyber-border flex items-center justify-center ${getEventColor(event.type)}`}>
                      <Icon className="w-3 h-3 text-purple-400" />
                    </div>

                    <div className="bg-slate-900/50 cyber-border rounded-lg p-3">
                      <div className="flex items-start justify-between mb-2">
                        <h4 className="text-sm font-bold text-cyan-400 font-mono">
                          {event.title}
                        </h4>
                        <Badge variant="outline" className="border-purple-500/30 text-purple-400 font-mono text-xs">
                          {event.type}
                        </Badge>
                      </div>

                      <p className="text-slate-400 font-mono text-xs mb-2">
                        {event.description}
                      </p>

                      <div className="flex items-center justify-between">
                        <div className="text-xs text-slate-500 font-mono">
                          {event.timestamp}
                        </div>
                        {event.location && (
                          <div className="text-xs text-slate-500 font-mono">
                            📍 {event.location}
                          </div>
                        )}
                      </div>

                      {event.casualties && (
                        <div className="mt-2 pt-2 border-t border-slate-700/30">
                          <div className="flex gap-3 text-xs font-mono">
                            {event.casualties.killed && (
                              <div>
                                <span className="text-slate-500">Killed: </span>
                                <span className="text-red-400 font-bold">{event.casualties.killed}</span>
                              </div>
                            )}
                            {event.casualties.wounded && (
                              <div>
                                <span className="text-slate-500">Wounded: </span>
                                <span className="text-orange-400 font-bold">{event.casualties.wounded}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </Card>
  );
}