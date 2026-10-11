import React from 'react';
import { Card } from '../ui/card';
import { Badge } from '../ui/badge';
import { AlertTriangle, MapPin, TrendingUp } from 'lucide-react';

export default function FlashpointsPanel({ flashpoints }) {
  const getRiskColor = (risk_score) => {
    if (risk_score >= 80) return 'text-red-400';
    if (risk_score >= 60) return 'text-orange-400';
    if (risk_score >= 40) return 'text-yellow-400';
    return 'text-green-400';
  };

  const getRiskBadgeColor = (risk_score) => {
    if (risk_score >= 80) return 'bg-red-500/20 text-red-400 border-red-500/30';
    if (risk_score >= 60) return 'bg-orange-500/20 text-orange-400 border-orange-500/30';
    if (risk_score >= 40) return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
    return 'bg-green-500/20 text-green-400 border-green-500/30';
  };

  return (
    <Card className="bg-slate-950/80 backdrop-blur-xl cyber-border p-6">
      <div className="flex items-center gap-3 mb-4">
        <AlertTriangle className="w-6 h-6 text-red-400 animate-pulse" />
        <div>
          <h2 className="text-xl font-bold text-red-400 glow-text font-mono">
            POTENTIAL FLASHPOINTS
          </h2>
          <p className="text-slate-400 text-xs font-mono mt-1">
            High-risk regions for new conflict emergence
          </p>
        </div>
      </div>

      {!flashpoints || flashpoints.length === 0 ? (
        <div className="text-center py-8 text-slate-500 font-mono text-sm">
          No flashpoints detected
        </div>
      ) : (
        <div className="space-y-4">
          {flashpoints.map((flashpoint, idx) => (
            <div key={idx} className="bg-slate-900/50 cyber-border rounded-lg p-4 border-l-4 border-red-500/50">
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <h3 className="text-lg font-bold text-yellow-400 font-mono mb-1">
                    {flashpoint.region_name}
                  </h3>
                  <div className="flex items-center gap-2 mb-2">
                    <MapPin className="w-3 h-3 text-slate-400" />
                    <span className="text-slate-400 font-mono text-xs">{flashpoint.location}</span>
                  </div>
                  <Badge className={`${getRiskBadgeColor(flashpoint.risk_score)} font-mono text-xs`}>
                    RISK SCORE: {flashpoint.risk_score}/100
                  </Badge>
                </div>
                <div className={`text-4xl font-bold font-mono ${getRiskColor(flashpoint.risk_score)}`}>
                  {flashpoint.risk_score}
                </div>
              </div>

              <p className="text-slate-400 font-mono text-sm mb-3">{flashpoint.analysis}</p>

              {flashpoint.risk_factors && flashpoint.risk_factors.length > 0 && (
                <div className="mb-3 p-3 bg-red-950/20 cyber-border rounded">
                  <h4 className="text-xs font-bold text-red-400 font-mono mb-2">RISK FACTORS</h4>
                  <ul className="space-y-1">
                    {flashpoint.risk_factors.map((factor, i) => (
                      <li key={i} className="text-slate-300 font-mono text-xs flex items-start gap-2">
                        <span className="text-red-400">•</span>
                        {factor}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {flashpoint.involved_parties && flashpoint.involved_parties.length > 0 && (
                <div className="mb-3">
                  <h4 className="text-xs font-bold text-cyan-400 font-mono mb-2">INVOLVED PARTIES</h4>
                  <div className="flex flex-wrap gap-2">
                    {flashpoint.involved_parties.map((party, i) => (
                      <Badge key={i} variant="outline" className="border-cyan-500/30 text-cyan-400 font-mono text-xs">
                        {party}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {flashpoint.trigger_timeline && (
                <div className="pt-3 border-t border-slate-700/30">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-slate-500 font-mono">Potential Trigger Timeline:</span>
                    <span className="text-orange-400 font-mono text-xs font-bold">
                      {flashpoint.trigger_timeline}
                    </span>
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