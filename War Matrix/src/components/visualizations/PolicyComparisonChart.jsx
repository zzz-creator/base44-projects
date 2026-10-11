import React, { useState } from 'react';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Checkbox } from '../ui/checkbox';
import { Label } from '../ui/label';
import { ScrollArea } from '../ui/scroll-area';
import { GitCompare, TrendingDown, DollarSign, Shield, Trash2, X } from 'lucide-react';
import { 
  BarChart, Bar, LineChart, Line, RadarChart, PolarGrid, 
  PolarAngleAxis, PolarRadiusAxis, Radar, XAxis, YAxis, 
  CartesianGrid, Tooltip, Legend, ResponsiveContainer 
} from 'recharts';

const COLORS = ['#06b6d4', '#a855f7', '#22c55e', '#f97316', '#ec4899', '#eab308'];

export default function PolicyComparisonChart({ 
  savedSimulations = [], 
  onDeleteSimulation,
  currentSimulation 
}) {
  const [selectedSimulations, setSelectedSimulations] = useState([]);

  const toggleSimulation = (id) => {
    setSelectedSimulations(prev => 
      prev.includes(id) 
        ? prev.filter(s => s !== id)
        : [...prev, id].slice(-6) // Max 6 comparisons
    );
  };

  const selectedData = savedSimulations.filter(s => selectedSimulations.includes(s.id));

  // Prepare comparison data
  const comparisonMetrics = selectedData.map((sim, idx) => ({
    name: sim.name || `Simulation ${idx + 1}`,
    effectiveness: sim.results?.overall_effectiveness || 0,
    conflictsPrevented: sim.results?.conflicts_prevented || 0,
    conflictsDelayed: sim.results?.conflicts_delayed || 0,
    estimatedCost: sim.results?.cost_benefit?.estimated_cost_billions || 0,
    roi: sim.results?.cost_benefit?.roi_ratio || 0,
    color: COLORS[idx % COLORS.length]
  }));

  // Prepare affected scenarios comparison
  const allScenarios = {};
  selectedData.forEach((sim, idx) => {
    (sim.results?.affected_scenarios || []).forEach(scenario => {
      if (!allScenarios[scenario.conflict_name]) {
        allScenarios[scenario.conflict_name] = { name: scenario.conflict_name };
      }
      allScenarios[scenario.conflict_name][sim.id] = scenario.probability_reduction || 0;
    });
  });
  const scenarioComparisonData = Object.values(allScenarios);

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <Card className="bg-slate-950/95 backdrop-blur-xl border-cyan-500/30 p-3">
          <p className="text-cyan-400 font-mono text-sm font-bold mb-2">{label}</p>
          {payload.map((entry, index) => (
            <p key={index} className="font-mono text-xs" style={{ color: entry.color }}>
              {entry.name}: {entry.value}
            </p>
          ))}
        </Card>
      );
    }
    return null;
  };

  if (savedSimulations.length === 0 && !currentSimulation) {
    return (
      <Card className="bg-slate-950/80 backdrop-blur-xl cyber-border p-6">
        <div className="flex items-center gap-3 mb-4">
          <GitCompare className="w-6 h-6 text-purple-400" />
          <h3 className="text-xl font-bold text-purple-400 glow-text font-mono">
            POLICY COMPARISON ANALYSIS
          </h3>
        </div>
        <div className="text-center py-8">
          <p className="text-slate-400 font-mono text-sm">
            Run policy simulations to compare their effectiveness.
          </p>
          <p className="text-slate-500 font-mono text-xs mt-2">
            Save simulations using the "Save for Comparison" button after running a simulation.
          </p>
        </div>
      </Card>
    );
  }

  return (
    <Card className="bg-slate-950/80 backdrop-blur-xl cyber-border p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <GitCompare className="w-6 h-6 text-purple-400" />
          <div>
            <h3 className="text-xl font-bold text-purple-400 glow-text font-mono">
              POLICY COMPARISON ANALYSIS
            </h3>
            <p className="text-slate-400 font-mono text-xs">
              Compare effectiveness of different policy interventions
            </p>
          </div>
        </div>
        {selectedSimulations.length > 0 && (
          <Badge className="bg-purple-500/20 text-purple-400 border-purple-500/30 font-mono">
            {selectedSimulations.length} Selected
          </Badge>
        )}
      </div>

      <div className="grid lg:grid-cols-4 gap-6">
        {/* Selection Panel */}
        <div className="lg:col-span-1">
          <h4 className="text-sm font-bold text-cyan-400 font-mono mb-3">SELECT SIMULATIONS</h4>
          <ScrollArea className="h-[400px] pr-4">
            <div className="space-y-2">
              {savedSimulations.map((sim, idx) => (
                <div 
                  key={sim.id}
                  className={`p-3 rounded-lg border transition-all cursor-pointer ${
                    selectedSimulations.includes(sim.id)
                      ? 'bg-purple-500/20 border-purple-500/50'
                      : 'bg-slate-900/50 border-slate-700/50 hover:border-slate-600'
                  }`}
                >
                  <div className="flex items-start gap-2">
                    <Checkbox
                      checked={selectedSimulations.includes(sim.id)}
                      onCheckedChange={() => toggleSimulation(sim.id)}
                      className="mt-1"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <div 
                          className="w-3 h-3 rounded-full"
                          style={{ background: COLORS[idx % COLORS.length] }}
                        />
                        <Label className="text-slate-200 font-mono text-xs truncate cursor-pointer">
                          {sim.name || `Sim ${idx + 1}`}
                        </Label>
                      </div>
                      <p className="text-slate-500 font-mono text-[10px] mt-1">
                        {sim.inputs?.intervention_type} • {sim.inputs?.target_region}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge className="bg-green-500/20 text-green-400 border-green-500/30 font-mono text-[10px]">
                          {sim.results?.overall_effectiveness || 0}% Effective
                        </Badge>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={(e) => {
                        e.stopPropagation();
                        onDeleteSimulation?.(sim.id);
                      }}
                      className="h-6 w-6 text-slate-500 hover:text-red-400"
                    >
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        </div>

        {/* Charts Panel */}
        <div className="lg:col-span-3 space-y-6">
          {selectedSimulations.length === 0 ? (
            <div className="text-center py-12 text-slate-400 font-mono">
              Select simulations from the left panel to compare
            </div>
          ) : (
            <>
              {/* Overall Effectiveness Comparison */}
              <div>
                <h4 className="text-sm font-bold text-green-400 font-mono mb-3 flex items-center gap-2">
                  <Shield className="w-4 h-4" />
                  EFFECTIVENESS COMPARISON
                </h4>
                <div className="h-[200px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={comparisonMetrics} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                      <XAxis type="number" domain={[0, 100]} stroke="#64748b" style={{ fontSize: '10px', fontFamily: 'monospace' }} />
                      <YAxis type="category" dataKey="name" stroke="#64748b" style={{ fontSize: '10px', fontFamily: 'monospace' }} width={100} />
                      <Tooltip content={<CustomTooltip />} />
                      <Bar dataKey="effectiveness" name="Effectiveness %" fill="#22c55e">
                        {comparisonMetrics.map((entry, index) => (
                          <rect key={`bar-${index}`} fill={entry.color} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Conflicts Prevention Comparison */}
              <div>
                <h4 className="text-sm font-bold text-orange-400 font-mono mb-3 flex items-center gap-2">
                  <TrendingDown className="w-4 h-4" />
                  CONFLICTS PREVENTED / DELAYED
                </h4>
                <div className="h-[200px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={comparisonMetrics}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                      <XAxis dataKey="name" stroke="#64748b" style={{ fontSize: '10px', fontFamily: 'monospace' }} />
                      <YAxis stroke="#64748b" style={{ fontSize: '10px', fontFamily: 'monospace' }} />
                      <Tooltip content={<CustomTooltip />} />
                      <Legend wrapperStyle={{ fontFamily: 'monospace', fontSize: '10px' }} />
                      <Bar dataKey="conflictsPrevented" name="Prevented" fill="#22c55e" />
                      <Bar dataKey="conflictsDelayed" name="Delayed" fill="#eab308" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Cost-Benefit Comparison */}
              <div>
                <h4 className="text-sm font-bold text-yellow-400 font-mono mb-3 flex items-center gap-2">
                  <DollarSign className="w-4 h-4" />
                  COST-BENEFIT ANALYSIS
                </h4>
                <div className="h-[200px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={comparisonMetrics}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                      <XAxis dataKey="name" stroke="#64748b" style={{ fontSize: '10px', fontFamily: 'monospace' }} />
                      <YAxis yAxisId="left" stroke="#64748b" style={{ fontSize: '10px', fontFamily: 'monospace' }} />
                      <YAxis yAxisId="right" orientation="right" stroke="#64748b" style={{ fontSize: '10px', fontFamily: 'monospace' }} />
                      <Tooltip content={<CustomTooltip />} />
                      <Legend wrapperStyle={{ fontFamily: 'monospace', fontSize: '10px' }} />
                      <Bar yAxisId="left" dataKey="estimatedCost" name="Cost ($B)" fill="#ef4444" />
                      <Bar yAxisId="right" dataKey="roi" name="ROI Ratio" fill="#06b6d4" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Scenario Impact Comparison */}
              {scenarioComparisonData.length > 0 && (
                <div>
                  <h4 className="text-sm font-bold text-purple-400 font-mono mb-3">
                    PROBABILITY REDUCTION BY CONFLICT
                  </h4>
                  <div className="h-[250px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={scenarioComparisonData} layout="vertical">
                        <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                        <XAxis type="number" stroke="#64748b" style={{ fontSize: '10px', fontFamily: 'monospace' }} />
                        <YAxis type="category" dataKey="name" stroke="#64748b" style={{ fontSize: '8px', fontFamily: 'monospace' }} width={120} />
                        <Tooltip content={<CustomTooltip />} />
                        <Legend wrapperStyle={{ fontFamily: 'monospace', fontSize: '10px' }} />
                        {selectedData.map((sim, idx) => (
                          <Bar 
                            key={sim.id}
                            dataKey={sim.id} 
                            name={sim.name || `Sim ${idx + 1}`}
                            fill={COLORS[idx % COLORS.length]}
                          />
                        ))}
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </Card>
  );
}