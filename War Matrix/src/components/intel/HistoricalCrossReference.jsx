import React from 'react';
import { Card } from '../ui/card';
import { Badge } from '../ui/badge';
import { History, TrendingUp, TrendingDown, AlertTriangle } from 'lucide-react';

export default function HistoricalCrossReference({ crossRefData }) {
  if (!crossRefData) return null;

  return (
    <Card className="bg-gradient-to-br from-blue-950/50 to-purple-950/50 backdrop-blur-xl cyber-border p-6">
      <div className="flex items-center gap-3 mb-4">
        <History className="w-6 h-6 text-blue-400" />
        <h3 className="text-xl font-bold text-blue-400 glow-text font-mono">
          HISTORICAL CROSS-REFERENCE ANALYSIS
        </h3>
      </div>

      <p className="text-slate-300 font-mono text-sm mb-4">
        {crossRefData.contextualized_assessment}
      </p>

      {crossRefData.historical_parallels?.length > 0 && (
        <div className="mb-6">
          <h4 className="text-md font-bold text-cyan-400 font-mono mb-3">HISTORICAL PARALLELS</h4>
          <div className="space-y-3">
            {crossRefData.historical_parallels.map((parallel, idx) => (
              <div key={idx} className="bg-slate-900/50 cyber-border rounded-lg p-4">
                <div className="flex items-start justify-between mb-2">
                  <h5 className="text-md font-bold text-yellow-400 font-mono">{parallel.historical_event}</h5>
                  <Badge className="bg-purple-500/20 text-purple-400 border-purple-500/30 font-mono text-xs">
                    {parallel.similarity_score}% Similar
                  </Badge>
                </div>
                <p className="text-slate-400 font-mono text-xs mb-2">{parallel.comparison}</p>
                <div className="pt-2 border-t border-purple-500/20">
                  <span className="text-xs text-slate-500 font-mono">Key Takeaway: </span>
                  <span className="text-cyan-400 font-mono text-xs">{parallel.key_lesson}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {crossRefData.deviation_analysis && (
        <div className="mb-6">
          <h4 className="text-md font-bold text-orange-400 font-mono mb-3 flex items-center gap-2">
            <AlertTriangle className="w-5 h-5" />
            DEVIATION ANALYSIS
          </h4>
          <div className="bg-slate-900/50 cyber-border rounded-lg p-4">
            <p className="text-slate-300 font-mono text-sm mb-3">{crossRefData.deviation_analysis.observation}</p>
            <div className="grid md:grid-cols-2 gap-3">
              <div className="p-3 bg-red-950/20 cyber-border rounded">
                <div className="text-xs text-slate-500 font-mono mb-1">Historical Pattern</div>
                <p className="text-slate-300 font-mono text-xs">{crossRefData.deviation_analysis.historical_pattern}</p>
              </div>
              <div className="p-3 bg-orange-950/20 cyber-border rounded">
                <div className="text-xs text-slate-500 font-mono mb-1">Current Deviation</div>
                <p className="text-slate-300 font-mono text-xs">{crossRefData.deviation_analysis.current_deviation}</p>
              </div>
            </div>
            <div className="mt-3 p-3 bg-yellow-950/20 cyber-border rounded">
              <div className="text-xs text-slate-500 font-mono mb-1">Implications</div>
              <p className="text-yellow-400 font-mono text-xs">{crossRefData.deviation_analysis.implications}</p>
            </div>
          </div>
        </div>
      )}

      {crossRefData.news_correlation && (
        <div className="mb-6">
          <h4 className="text-md font-bold text-green-400 font-mono mb-3">NEWS CORRELATION</h4>
          <div className="space-y-2">
            {crossRefData.news_correlation.map((news, idx) => (
              <div key={idx} className="bg-slate-900/50 cyber-border rounded p-3">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-slate-300 font-mono text-xs font-bold">{news.headline}</span>
                  <Badge className="bg-green-500/20 text-green-400 border-green-500/30 font-mono text-xs">
                    {news.relevance_score}% Relevant
                  </Badge>
                </div>
                <p className="text-slate-400 font-mono text-xs">{news.connection}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {crossRefData.risk_adjustment && (
        <div className="p-4 bg-slate-900/50 cyber-border rounded-lg">
          <h4 className="text-sm font-bold text-purple-400 font-mono mb-2">RISK ADJUSTMENT</h4>
          <div className="flex items-center justify-between">
            <div>
              <div className="text-xs text-slate-500 font-mono mb-1">Original Risk Assessment</div>
              <div className="text-xl font-bold text-yellow-400 font-mono">{crossRefData.risk_adjustment.original_risk}</div>
            </div>
            <div className="text-cyan-400">
              {crossRefData.risk_adjustment.adjustment > 0 ? (
                <TrendingUp className="w-8 h-8" />
              ) : (
                <TrendingDown className="w-8 h-8" />
              )}
            </div>
            <div>
              <div className="text-xs text-slate-500 font-mono mb-1">Adjusted Risk Assessment</div>
              <div className="text-xl font-bold text-red-400 font-mono">{crossRefData.risk_adjustment.adjusted_risk}</div>
            </div>
          </div>
          <p className="text-slate-400 font-mono text-xs mt-3">{crossRefData.risk_adjustment.rationale}</p>
        </div>
      )}
    </Card>
  );
}