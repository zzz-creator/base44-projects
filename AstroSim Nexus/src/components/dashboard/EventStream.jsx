import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { ScrollArea } from "../ui/scroll-area";
import { Badge } from "../ui/badge";
import { Activity, TrendingUp, AlertTriangle, Zap, DollarSign, Wrench, Users } from "lucide-react";
import { format } from "date-fns";

const eventIcons = {
  'Turn': Activity,
  'Trade': TrendingUp,
  'Threat': AlertTriangle,
  'AI Decision': Users,
  'Production': Zap,
  'Market': DollarSign,
  'Maintenance': Wrench
};

const eventColors = {
  'Turn': 'bg-blue-500',
  'Trade': 'bg-green-500',
  'Threat': 'bg-red-500',
  'AI Decision': 'bg-purple-500',
  'Production': 'bg-yellow-500',
  'Market': 'bg-cyan-500',
  'Maintenance': 'bg-orange-500'
};

export default function EventStream({ events, maxHeight = "600px" }) {
  return (
    <Card className="bg-slate-800 border-slate-700">
      <CardHeader className="border-b border-slate-700">
        <CardTitle className="text-white flex items-center gap-2">
          <Activity className="w-5 h-5" />
          Event Stream
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <ScrollArea style={{ height: maxHeight }}>
          <div className="p-4 space-y-3">
            {events.length === 0 ? (
              <div className="text-center text-slate-400 py-8">
                No events recorded yet
              </div>
            ) : (
              events.map((event) => {
                const Icon = eventIcons[event.event_type] || Activity;
                const colorClass = eventColors[event.event_type] || 'bg-slate-500';
                
                return (
                  <div key={event.id} className="flex gap-3 p-3 rounded-lg bg-slate-700/50 hover:bg-slate-700 transition-colors">
                    <div className={`p-2 rounded-lg ${colorClass} bg-opacity-20 h-fit`}>
                      <Icon className={`w-4 h-4 ${colorClass.replace('bg-', 'text-')}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-white font-medium truncate">{event.description}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge variant="outline" className="text-xs border-slate-600 text-slate-400">
                              {event.event_type}
                            </Badge>
                            {event.source_entity && (
                              <span className="text-xs text-slate-500">
                                {event.source_entity}
                              </span>
                            )}
                          </div>
                        </div>
                        {event.impact_score > 0 && (
                          <div className="text-right">
                            <div className="text-xs font-medium text-slate-400">
                              Impact
                            </div>
                            <div className="text-sm font-bold text-white">
                              {event.impact_score}
                            </div>
                          </div>
                        )}
                      </div>
                      {event.timestamp && (
                        <p className="text-xs text-slate-500 mt-1">
                          {format(new Date(event.timestamp), 'MMM d, HH:mm:ss')}
                        </p>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}