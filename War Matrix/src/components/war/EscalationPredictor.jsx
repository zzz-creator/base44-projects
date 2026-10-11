import React from 'react';
import { Card } from '../ui/card';
import { Badge } from '../ui/badge';
import { TrendingUp, AlertTriangle, Flame, Shield } from 'lucide-react';

export default function EscalationPredictor({ predictions }) {
  const getRiskColor = (probability) => {
    if (probability >= 80) return 'text-red-400';
    if (probability >= 60) return 'text-orange-400';
    if (probability >= 40) return 'text-yellow-400';
    return 'text-green-400';
  };

  const getRiskBadgeColor = (probability) => {
    if (probability >= 80) return 'bg-red-500/20 text-red-400 border-red-500/30';
    if (probability >= 60) return 'bg-orange-500/20 text-orange-400 border-orange-500/30';
    if (probability >= 40) return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
    return 'bg-green-500/20 text-green-400 border-green-500/30';
  };

  const getRiskLevel = (probability) => {
    if (probability >= 80) return 'CRITICAL';
    if (probability >= 60) return 'HIGH';
    if (probability >= 40) return 'MEDIUM';
    return 'LOW';
  };

  return (
    <Card className="bg-slate-950/80 backdrop-blur-xl cyber-border p-6">
      <div className="flex items-center gap-3 mb-4">
        <TrendingUp className="w-6 h-6 text-orange-400" />
        <div>
          <h2 className="text-xl font-bold text-orange-400 glow-text font-mono">
            7-DAY ESCALATION FORECAST
          </h2>
          <p className="text-slate-400 text-xs font-mono mt-1">
            AI-powered short-term conflict escalation predictions
          </p>
        </div>
      </div>

      {!predictions || predictions.length === 0 ? (
        <div className="text-center py-8 text-slate-500 font-mono text-sm">
          No escalation predictions available
        </div>
      ) : (
        <div className="space-y-4">
          {predictions.map((prediction, idx) => (
            <div key={idx} className="bg-slate-900/50 cyber-border rounded-lg p-4">
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <h3 className="text-lg font-bold text-cyan-400 font-mono mb-1">
                    {prediction.conflict_name}
                  </h3>
                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge className={`${getRiskBadgeColor(prediction.escalation_probability)} font-mono text-xs`}>
                      {getRiskLevel(prediction.escalation_probability)} RISK
                    </Badge>
                    <Badge variant="outline" className="border-cyan-500/30 text-cyan-400 font-mono text-xs">
                      {prediction.escalation_probability}% ESCALATION PROBABILITY
                    </Badge>
                  </div>
                </div>
                <div className={`text-4xl font-bold font-mono ${getRiskColor(prediction.escalation_probability)}`}>
                  {prediction.escalation_probability}
                </div>
              </div>

              <p className="text-slate-400 font-mono text-sm mb-3">{prediction.forecast_summary}</p>

              {prediction.key_triggers && prediction.key_triggers.length > 0 && (
                <div className="mb-3 p-3 bg-slate-950/50 cyber-border rounded">
                  <h4 className="text-xs font-bold text-red-400 font-mono mb-2 flex items-center gap-2">
                    <Flame className="w-3 h-3" />
                    KEY TRIGGERS (Next 7 Days)
                  </h4>
                  <ul className="space-y-1">
                    {prediction.key_triggers.map((trigger, i) => (
                      <li key={i} className="text-slate-300 font-mono text-xs flex items-start gap-2">
                        <span className="text-red-400">•</span>
                        {trigger}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {prediction.mitigation_factors && prediction.mitigation_factors.length > 0 && (
                <div className="mb-3 p-3 bg-green-950/20 cyber-border rounded">
                  <h4 className="text-xs font-bold text-green-400 font-mono mb-2 flex items-center gap-2">
                    <Shield className="w-3 h-3" />
                    MITIGATION FACTORS
                  </h4>
                  <ul className="space-y-1">
                    {prediction.mitigation_factors.map((factor, i) => (
                      <li key={i} className="text-slate-300 font-mono text-xs flex items-start gap-2">
                        <span className="text-green-400">✓</span>
                        {factor}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {prediction.predicted_events && prediction.predicted_events.length > 0 && (
                <div className="pt-3 border-t border-slate-700/30">
                  <h4 className="text-xs font-bold text-yellow-400 font-mono mb-2">PREDICTED EVENTS</h4>
                  <div className="space-y-2">
                    {prediction.predicted_events.map((event, i) => (
                      <div key={i} className="bg-slate-950/50 rounded p-2">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-cyan-400 font-mono text-xs font-bold">{event.event}</span>
                          <span className="text-slate-500 font-mono text-xs">{event.timeframe}</span>
                        </div>
                        <p className="text-slate-400 font-mono text-xs">{event.description}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}