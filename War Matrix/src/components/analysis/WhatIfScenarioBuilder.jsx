import React, { useState } from 'react';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Slider } from '../ui/slider';
import { Badge } from '../ui/badge';
import { Loader2, Zap, RefreshCw } from 'lucide-react';
import { useMutation } from '@tanstack/react-query';
import { base44 } from '../../api/base44Client';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, Bar } from 'recharts';

export default function WhatIfScenarioBuilder({ baseScenario }) {
  const [parameters, setParameters] = useState({
    military_strength: 50,
    economic_sanctions: 0,
    diplomatic_pressure: 50,
    alliance_support: 50,
    resource_availability: 50,
    public_opinion: 50
  });
  const [projection, setProjection] = useState(null);

  const generateProjectionMutation = useMutation({
    mutationFn: async () => {
      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `You are an advanced scenario impact projection AI. Given the following parameter adjustments, calculate immediate impacts on the geopolitical scenario.

BASE SCENARIO: ${baseScenario ? JSON.stringify(baseScenario) : 'Current global state'}

ADJUSTED PARAMETERS:
- Military Strength: ${parameters.military_strength}/100
- Economic Sanctions Level: ${parameters.economic_sanctions}/100
- Diplomatic Pressure: ${parameters.diplomatic_pressure}/100
- Alliance Support: ${parameters.alliance_support}/100
- Resource Availability: ${parameters.resource_availability}/100
- Public Opinion: ${parameters.public_opinion}/100

Calculate IMMEDIATE IMPACTS (next 30-90 days) on:
1. Conflict probability
2. Regional stability
3. Economic indicators
4. Casualty projections
5. Diplomatic outcomes
6. Long-term consequences

Provide detailed analysis of how each parameter change affects the overall scenario outcome.`,
        response_json_schema: {
          type: "object",
          properties: {
            projection_summary: { type: "string" },
            conflict_probability: { type: "number" },
            stability_index: { type: "number" },
            immediate_impacts: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  category: { type: "string" },
                  impact_score: { type: "number" },
                  description: { type: "string" },
                  timeframe: { type: "string" }
                }
              }
            },
            parameter_sensitivity: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  parameter: { type: "string" },
                  influence_score: { type: "number" },
                  analysis: { type: "string" }
                }
              }
            },
            projected_outcomes: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  outcome: { type: "string" },
                  probability: { type: "number" },
                  description: { type: "string" }
                }
              }
            },
            timeline_projection: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  day: { type: "number" },
                  conflict_risk: { type: "number" },
                  stability: { type: "number" }
                }
              }
            },
            recommendations: { type: "array", items: { type: "string" } }
          }
        }
      });

      setProjection(result);
      return result;
    }
  });

  const handleParameterChange = (param, value) => {
    setParameters({ ...parameters, [param]: value });
  };

  const resetParameters = () => {
    setParameters({
      military_strength: 50,
      economic_sanctions: 0,
      diplomatic_pressure: 50,
      alliance_support: 50,
      resource_availability: 50,
      public_opinion: 50
    });
    setProjection(null);
  };

  const getImpactColor = (score) => {
    if (score >= 70) return 'text-red-400';
    if (score >= 40) return 'text-yellow-400';
    return 'text-green-400';
  };

  return (
    <Card className="bg-slate-950/80 backdrop-blur-xl cyber-border p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Zap className="w-6 h-6 text-yellow-400" />
          <h3 className="text-xl font-bold text-yellow-400 glow-text font-mono">
            WHAT-IF SCENARIO BUILDER
          </h3>
        </div>
        <Button
          onClick={resetParameters}
          variant="outline"
          size="sm"
          className="border-slate-500/30 text-slate-400 hover:bg-slate-800 font-mono"
        >
          <RefreshCw className="w-4 h-4 mr-1" />
          Reset
        </Button>
      </div>

      <div className="space-y-4 mb-6">
        {Object.entries(parameters).map(([key, value]) => (
          <div key={key} className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-cyan-400 font-mono text-xs capitalize">
                {key.replace('_', ' ')}
              </Label>
              <Badge className={`${getImpactColor(value)} bg-opacity-20 font-mono text-xs`}>
                {value}
              </Badge>
            </div>
            <Slider
              value={[value]}
              onValueChange={(val) => handleParameterChange(key, val[0])}
              min={0}
              max={100}
              step={5}
            />
          </div>
        ))}
      </div>

      <Button
        onClick={() => generateProjectionMutation.mutate()}
        disabled={generateProjectionMutation.isPending}
        className="w-full bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-white font-mono py-6 mb-6"
      >
        {generateProjectionMutation.isPending ? (
          <>
            <Loader2 className="w-5 h-5 mr-2 animate-spin" />
            CALCULATING IMPACT...
          </>
        ) : (
          <>
            <Zap className="w-5 h-5 mr-2" />
            GENERATE PROJECTION
          </>
        )}
      </Button>

      {projection && (
        <div className="space-y-6 animate-in fade-in duration-500">
          <Card className="bg-gradient-to-br from-yellow-950/50 to-orange-950/50 cyber-border p-4">
            <h4 className="text-lg font-bold text-yellow-400 font-mono mb-2">PROJECTION SUMMARY</h4>
            <p className="text-slate-300 font-mono text-sm mb-3">{projection.projection_summary}</p>
            <div className="grid grid-cols-2 gap-3">
              <div className="p-2 bg-slate-950/50 cyber-border rounded">
                <div className="text-xs text-slate-400 font-mono">Conflict Probability</div>
                <div className={`text-2xl font-bold font-mono ${getImpactColor(projection.conflict_probability)}`}>
                  {projection.conflict_probability}%
                </div>
              </div>
              <div className="p-2 bg-slate-950/50 cyber-border rounded">
                <div className="text-xs text-slate-400 font-mono">Stability Index</div>
                <div className={`text-2xl font-bold font-mono ${getImpactColor(100 - projection.stability_index)}`}>
                  {projection.stability_index}/100
                </div>
              </div>
            </div>
          </Card>

          {/* Timeline Projection Chart */}
          <Card className="bg-slate-900/50 cyber-border p-4">
            <h4 className="text-md font-bold text-cyan-400 font-mono mb-4">TIMELINE PROJECTION (90 Days)</h4>
            <div className="h-[250px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={projection.timeline_projection}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                  <XAxis 
                    dataKey="day" 
                    stroke="#94a3b8" 
                    style={{ fontFamily: 'monospace', fontSize: '10px' }}
                    label={{ value: 'Days', position: 'insideBottom', offset: -5, style: { fill: '#94a3b8', fontFamily: 'monospace' } }}
                  />
                  <YAxis 
                    stroke="#94a3b8" 
                    style={{ fontFamily: 'monospace', fontSize: '10px' }}
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: '#0f172a', 
                      border: '1px solid #06b6d4', 
                      fontFamily: 'monospace',
                      fontSize: '11px'
                    }}
                  />
                  <Legend wrapperStyle={{ fontFamily: 'monospace', fontSize: '11px' }} />
                  <Line 
                    type="monotone" 
                    dataKey="conflict_risk" 
                    stroke="#ef4444" 
                    strokeWidth={2}
                    name="Conflict Risk"
                  />
                  <Line 
                    type="monotone" 
                    dataKey="stability" 
                    stroke="#22c55e" 
                    strokeWidth={2}
                    name="Stability"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </Card>

          {/* Immediate Impacts */}
          <Card className="bg-slate-900/50 cyber-border p-4">
            <h4 className="text-md font-bold text-orange-400 font-mono mb-3">IMMEDIATE IMPACTS</h4>
            <div className="space-y-2">
              {projection.immediate_impacts?.map((impact, idx) => (
                <div key={idx} className="bg-slate-950/50 cyber-border rounded p-3">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-bold text-cyan-400 font-mono">{impact.category}</span>
                    <Badge className="bg-purple-500/20 text-purple-400 border-purple-500/30 text-xs font-mono">
                      {impact.timeframe}
                    </Badge>
                  </div>
                  <div className={`text-lg font-bold font-mono mb-1 ${getImpactColor(impact.impact_score)}`}>
                    Impact: {impact.impact_score}/100
                  </div>
                  <p className="text-xs text-slate-400 font-mono">{impact.description}</p>
                </div>
              ))}
            </div>
          </Card>

          {/* Parameter Sensitivity */}
          <Card className="bg-slate-900/50 cyber-border p-4">
            <h4 className="text-md font-bold text-purple-400 font-mono mb-4">PARAMETER SENSITIVITY</h4>
            <div className="h-[250px] mb-3">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={projection.parameter_sensitivity}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                  <XAxis 
                    dataKey="parameter" 
                    stroke="#94a3b8" 
                    style={{ fontFamily: 'monospace', fontSize: '9px' }}
                    angle={-45}
                    textAnchor="end"
                    height={80}
                  />
                  <YAxis 
                    stroke="#94a3b8" 
                    style={{ fontFamily: 'monospace', fontSize: '10px' }}
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: '#0f172a', 
                      border: '1px solid #a855f7', 
                      fontFamily: 'monospace',
                      fontSize: '11px'
                    }}
                  />
                  <Bar dataKey="influence_score" fill="#a855f7" name="Influence Score" />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="space-y-2">
              {projection.parameter_sensitivity?.map((param, idx) => (
                <div key={idx} className="text-xs text-slate-400 font-mono">
                  <span className="text-cyan-400 font-bold">{param.parameter}:</span> {param.analysis}
                </div>
              ))}
            </div>
          </Card>

          {/* Projected Outcomes */}
          <Card className="bg-slate-900/50 cyber-border p-4">
            <h4 className="text-md font-bold text-green-400 font-mono mb-3">PROJECTED OUTCOMES</h4>
            <div className="space-y-2">
              {projection.projected_outcomes?.map((outcome, idx) => (
                <div key={idx} className="bg-slate-950/50 cyber-border rounded p-2">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-bold text-yellow-400 font-mono">{outcome.outcome}</span>
                    <Badge className="bg-green-500/20 text-green-400 border-green-500/30 text-xs font-mono">
                      {outcome.probability}%
                    </Badge>
                  </div>
                  <p className="text-xs text-slate-400 font-mono">{outcome.description}</p>
                </div>
              ))}
            </div>
          </Card>

          {/* Recommendations */}
          <Card className="bg-gradient-to-br from-green-950/50 to-cyan-950/50 cyber-border p-4">
            <h4 className="text-md font-bold text-green-400 font-mono mb-3">RECOMMENDATIONS</h4>
            <ul className="space-y-2">
              {projection.recommendations?.map((rec, idx) => (
                <li key={idx} className="text-slate-300 font-mono text-sm flex items-start gap-2">
                  <span className="text-green-400 font-bold">{idx + 1}.</span>
                  {rec}
                </li>
              ))}
            </ul>
          </Card>
        </div>
      )}
    </Card>
  );
}