import React, { useState } from 'react';
import { Card } from '../ui/card';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Label } from '../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { FileText, Download, Calendar, Loader2, Zap } from 'lucide-react';

export default function ThreatBriefing({ briefing, onGenerate, isGenerating, wars, flashpoints, predictions, news }) {
  const [briefingType, setBriefingType] = useState('daily');
  const [regionFilter, setRegionFilter] = useState('all');
  const [conflictTypeFilter, setConflictTypeFilter] = useState('all');

  const regions = ['all', 'Middle East', 'Eastern Europe', 'Africa', 'Asia-Pacific', 'Americas'];
  const conflictTypes = ['all', 'territorial', 'civil', 'religious', 'economic', 'resource'];

  const handleGenerate = () => {
    onGenerate({
      type: briefingType,
      region: regionFilter,
      conflictType: conflictTypeFilter
    });
  };

  const exportBriefing = () => {
    if (!briefing) return;
    
    const text = `
WAR MATRIX - THREAT ASSESSMENT BRIEFING
${briefingType.toUpperCase()} REPORT
Generated: ${new Date().toLocaleString()}

${briefing.executive_summary}

THREAT LEVEL: ${briefing.overall_threat_level}
GLOBAL STABILITY: ${briefing.global_stability_score}/100

${briefing.key_developments?.length > 0 ? `
KEY DEVELOPMENTS:
${briefing.key_developments.map((dev, i) => `${i + 1}. ${dev}`).join('\n')}
` : ''}

${briefing.critical_conflicts?.length > 0 ? `
CRITICAL CONFLICTS REQUIRING IMMEDIATE ATTENTION:
${briefing.critical_conflicts.map((c, i) => `
${i + 1}. ${c.name}
   Status: ${c.status}
   Risk Level: ${c.risk_level}
   Recommendation: ${c.recommendation}
`).join('\n')}
` : ''}

${briefing.emerging_threats?.length > 0 ? `
EMERGING THREATS:
${briefing.emerging_threats.map((t, i) => `${i + 1}. ${t}`).join('\n')}
` : ''}

${briefing.recommendations?.length > 0 ? `
STRATEGIC RECOMMENDATIONS:
${briefing.recommendations.map((r, i) => `${i + 1}. ${r}`).join('\n')}
` : ''}

---
War Matrix Intelligence System
    `;

    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `threat-briefing-${briefingType}-${new Date().toISOString().split('T')[0]}.txt`;
    link.click();
  };

  const getThreatLevelColor = (level) => {
    const colors = {
      'CRITICAL': 'bg-red-500/20 text-red-400 border-red-500/30',
      'HIGH': 'bg-orange-500/20 text-orange-400 border-orange-500/30',
      'ELEVATED': 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
      'MODERATE': 'bg-green-500/20 text-green-400 border-green-500/30'
    };
    return colors[level] || colors['MODERATE'];
  };

  return (
    <Card className="bg-slate-950/80 backdrop-blur-xl cyber-border p-6">
      <div className="flex items-center gap-3 mb-6">
        <FileText className="w-6 h-6 text-purple-400" />
        <div>
          <h2 className="text-2xl font-bold text-purple-400 glow-text font-mono">
            THREAT ASSESSMENT BRIEFING
          </h2>
          <p className="text-slate-400 text-xs font-mono mt-1">
            AI-synthesized intelligence summary from all data sources
          </p>
        </div>
      </div>

      {/* Configuration */}
      <div className="space-y-4 mb-6">
        <div className="grid md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label className="text-cyan-400 font-mono text-xs">Briefing Type</Label>
            <Select value={briefingType} onValueChange={setBriefingType}>
              <SelectTrigger className="bg-slate-900/50 border-green-500/30 text-green-400 font-mono">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="daily">Daily Brief</SelectItem>
                <SelectItem value="weekly">Weekly Assessment</SelectItem>
                <SelectItem value="emergency">Emergency Alert</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label className="text-cyan-400 font-mono text-xs">Region of Interest</Label>
            <Select value={regionFilter} onValueChange={setRegionFilter}>
              <SelectTrigger className="bg-slate-900/50 border-green-500/30 text-green-400 font-mono">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {regions.map(region => (
                  <SelectItem key={region} value={region}>
                    {region.charAt(0).toUpperCase() + region.slice(1)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label className="text-cyan-400 font-mono text-xs">Conflict Type</Label>
            <Select value={conflictTypeFilter} onValueChange={setConflictTypeFilter}>
              <SelectTrigger className="bg-slate-900/50 border-green-500/30 text-green-400 font-mono">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {conflictTypes.map(type => (
                  <SelectItem key={type} value={type}>
                    {type.charAt(0).toUpperCase() + type.slice(1)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <Button
          onClick={handleGenerate}
          disabled={isGenerating || !wars || wars.length === 0}
          className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-mono py-6"
        >
          {isGenerating ? (
            <>
              <Loader2 className="w-5 h-5 mr-2 animate-spin" />
              GENERATING BRIEFING...
            </>
          ) : (
            <>
              <Zap className="w-5 h-5 mr-2" />
              GENERATE BRIEFING
            </>
          )}
        </Button>
      </div>

      {/* Briefing Display */}
      {briefing && (
        <div className="space-y-6 animate-in fade-in duration-500">
          {/* Header */}
          <div className="bg-gradient-to-r from-purple-950/50 to-pink-950/50 cyber-border rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Calendar className="w-5 h-5 text-purple-400" />
                <span className="text-purple-400 font-mono text-sm font-bold">
                  {briefingType.toUpperCase()} REPORT
                </span>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={exportBriefing}
                className="border-cyan-500/30 text-cyan-400 hover:bg-cyan-500/10 font-mono"
              >
                <Download className="w-4 h-4 mr-2" />
                EXPORT
              </Button>
            </div>
            <div className="text-xs text-slate-400 font-mono">
              Generated: {new Date().toLocaleString()}
            </div>
          </div>

          {/* Executive Summary */}
          <div className="bg-slate-900/50 cyber-border rounded-lg p-6">
            <h3 className="text-lg font-bold text-green-400 glow-text font-mono mb-3">
              EXECUTIVE SUMMARY
            </h3>
            <p className="text-slate-300 font-mono text-sm leading-relaxed">
              {briefing.executive_summary}
            </p>
          </div>

          {/* Threat Indicators */}
          <div className="grid md:grid-cols-2 gap-4">
            <div className="bg-slate-900/50 cyber-border rounded-lg p-4">
              <h4 className="text-sm font-bold text-cyan-400 font-mono mb-2">OVERALL THREAT LEVEL</h4>
              <Badge className={`${getThreatLevelColor(briefing.overall_threat_level)} font-mono text-lg px-4 py-2`}>
                {briefing.overall_threat_level}
              </Badge>
            </div>
            <div className="bg-slate-900/50 cyber-border rounded-lg p-4">
              <h4 className="text-sm font-bold text-cyan-400 font-mono mb-2">GLOBAL STABILITY</h4>
              <div className="text-3xl font-bold text-green-400 font-mono">
                {briefing.global_stability_score}/100
              </div>
            </div>
          </div>

          {/* Key Developments */}
          {briefing.key_developments && briefing.key_developments.length > 0 && (
            <div className="bg-slate-900/50 cyber-border rounded-lg p-6">
              <h3 className="text-lg font-bold text-yellow-400 glow-text font-mono mb-3">
                KEY DEVELOPMENTS (Last {briefingType === 'daily' ? '24 Hours' : '7 Days'})
              </h3>
              <ul className="space-y-2">
                {briefing.key_developments.map((dev, idx) => (
                  <li key={idx} className="flex items-start gap-2 text-slate-300 font-mono text-sm">
                    <span className="text-yellow-400 font-bold">{idx + 1}.</span>
                    {dev}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Critical Conflicts */}
          {briefing.critical_conflicts && briefing.critical_conflicts.length > 0 && (
            <div className="bg-red-950/20 cyber-border rounded-lg p-6">
              <h3 className="text-lg font-bold text-red-400 glow-text font-mono mb-4">
                CRITICAL CONFLICTS REQUIRING IMMEDIATE ATTENTION
              </h3>
              <div className="space-y-4">
                {briefing.critical_conflicts.map((conflict, idx) => (
                  <div key={idx} className="bg-slate-900/50 cyber-border rounded-lg p-4">
                    <div className="flex items-start justify-between mb-2">
                      <h4 className="text-md font-bold text-cyan-400 font-mono">{conflict.name}</h4>
                      <Badge className={`${getThreatLevelColor(conflict.risk_level)} font-mono text-xs`}>
                        {conflict.risk_level}
                      </Badge>
                    </div>
                    <p className="text-slate-400 font-mono text-sm mb-2">{conflict.status}</p>
                    <div className="pt-2 border-t border-slate-700/30">
                      <span className="text-xs text-slate-500 font-mono">Recommendation: </span>
                      <span className="text-green-400 font-mono text-sm">{conflict.recommendation}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Emerging Threats */}
          {briefing.emerging_threats && briefing.emerging_threats.length > 0 && (
            <div className="bg-orange-950/20 cyber-border rounded-lg p-6">
              <h3 className="text-lg font-bold text-orange-400 glow-text font-mono mb-3">
                EMERGING THREATS
              </h3>
              <ul className="space-y-2">
                {briefing.emerging_threats.map((threat, idx) => (
                  <li key={idx} className="flex items-start gap-2 text-slate-300 font-mono text-sm">
                    <span className="text-orange-400">⚠</span>
                    {threat}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Regional Analysis */}
          {briefing.regional_analysis && (
            <div className="bg-slate-900/50 cyber-border rounded-lg p-6">
              <h3 className="text-lg font-bold text-cyan-400 glow-text font-mono mb-3">
                REGIONAL ANALYSIS
              </h3>
              <p className="text-slate-300 font-mono text-sm leading-relaxed">
                {briefing.regional_analysis}
              </p>
            </div>
          )}

          {/* Strategic Recommendations */}
          {briefing.recommendations && briefing.recommendations.length > 0 && (
            <div className="bg-green-950/20 cyber-border rounded-lg p-6">
              <h3 className="text-lg font-bold text-green-400 glow-text font-mono mb-3">
                STRATEGIC RECOMMENDATIONS
              </h3>
              <ul className="space-y-2">
                {briefing.recommendations.map((rec, idx) => (
                  <li key={idx} className="flex items-start gap-2 text-slate-300 font-mono text-sm">
                    <span className="text-green-400 font-bold">→</span>
                    {rec}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Next Review */}
          <div className="bg-slate-900/50 cyber-border rounded-lg p-4">
            <div className="flex items-center justify-between">
              <span className="text-slate-400 font-mono text-sm">Next scheduled briefing:</span>
              <span className="text-purple-400 font-mono text-sm font-bold">
                {briefingType === 'daily' ? '24 hours' : '7 days'}
              </span>
            </div>
          </div>
        </div>
      )}
    </Card>
  );
}