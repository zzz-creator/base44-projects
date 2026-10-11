import React, { useState } from 'react';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Checkbox } from '../ui/checkbox';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar } from 'recharts';
import { TrendingUp, Users, DollarSign, Shield, AlertTriangle } from 'lucide-react';

export default function BranchComparisonChart({ branches, currentScenarioId }) {
  const [selectedBranches, setSelectedBranches] = useState([]);
  const [selectedMetrics, setSelectedMetrics] = useState(['casualties', 'economic', 'stability']);

  const availableMetrics = [
    { id: 'casualties', name: 'Casualties', icon: Users },
    { id: 'economic', name: 'Economic Cost', icon: DollarSign },
    { id: 'stability', name: 'Regional Stability', icon: Shield },
    { id: 'risk', name: 'Risk Score', icon: AlertTriangle },
    { id: 'probability', name: 'Conflict Probability', icon: TrendingUp },
    { id: 'duration', name: 'Conflict Duration', icon: TrendingUp }
  ];

  const toggleMetric = (metricId) => {
    setSelectedMetrics(prev =>
      prev.includes(metricId)
        ? prev.filter(id => id !== metricId)
        : [...prev, metricId]
    );
  };

  const toggleBranch = (branchId) => {
    setSelectedBranches(prev => 
      prev.includes(branchId) 
        ? prev.filter(id => id !== branchId)
        : [...prev, branchId]
    );
  };

  const getComparisonData = () => {
    if (selectedBranches.length === 0) return null;

    const selectedBranchData = branches.filter(b => selectedBranches.includes(b.id));
    
    // Casualties comparison
    const casualtiesData = selectedBranchData.map(branch => ({
      name: branch.name.substring(0, 20) + '...',
      military: branch.simulation?.potential_outcomes?.[0]?.casualties?.military || 0,
      civilian: branch.simulation?.potential_outcomes?.[0]?.casualties?.civilian || 0,
      total: branch.simulation?.potential_outcomes?.[0]?.casualties?.total || 0
    }));

    // Economic impact comparison
    const economicData = selectedBranchData.map(branch => {
      const economicCost = branch.simulation?.potential_outcomes?.[0]?.economic_cost || '0';
      const costValue = parseFloat(economicCost.replace(/[^0-9.]/g, '')) || 0;
      return {
        name: branch.name.substring(0, 20) + '...',
        cost: costValue,
        riskScore: branch.simulation?.overall_risk_score || 0
      };
    });

    // Strategic metrics radar
    const radarData = selectedBranchData.map(branch => {
      const sim = branch.simulation;
      return {
        branch: branch.name.substring(0, 15) + '...',
        riskScore: sim?.overall_risk_score || 0,
        conflictProb: sim?.conflict_probability || 0,
        duration: sim?.potential_outcomes?.[0]?.duration === 'Short-term' ? 25 : 
                  sim?.potential_outcomes?.[0]?.duration === 'Medium-term' ? 50 : 
                  sim?.potential_outcomes?.[0]?.duration === 'Long-term' ? 75 : 100,
        stability: 100 - (sim?.regional_stability?.[0]?.projected_stability || 50),
        casualties: Math.min(100, ((sim?.potential_outcomes?.[0]?.casualties?.total || 0) / 100000) * 100)
      };
    });

    // Regional stability comparison
    const stabilityData = selectedBranchData.map(branch => {
      const avgStability = branch.simulation?.regional_stability?.reduce((acc, r) => acc + r.projected_stability, 0) / 
                          (branch.simulation?.regional_stability?.length || 1);
      return {
        name: branch.name.substring(0, 20) + '...',
        stability: avgStability || 50
      };
    });

    return {
      casualties: casualtiesData,
      economic: economicData,
      radar: radarData,
      stability: stabilityData
    };
  };

  const comparisonData = getComparisonData();

  return (
    <Card className="bg-slate-950/80 backdrop-blur-xl cyber-border p-6">
      <div className="flex items-center gap-3 mb-6">
        <TrendingUp className="w-8 h-8 text-purple-400" />
        <div>
          <h2 className="text-2xl font-bold text-purple-400 glow-text font-mono">
            BRANCH COMPARISON ANALYSIS
          </h2>
          <p className="text-slate-400 text-sm font-mono mt-1">
            Select 2+ branches to compare key metrics side-by-side
          </p>
        </div>
      </div>

      {/* Branch Selection */}
      <div className="mb-6">
        <h3 className="text-lg font-bold text-cyan-400 font-mono mb-3">Select Branches to Compare</h3>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3">
          {branches.map((branch) => (
            <div 
              key={branch.id}
              className={`bg-slate-900/50 cyber-border rounded p-3 cursor-pointer hover:bg-slate-800/50 transition-colors ${
                selectedBranches.includes(branch.id) ? 'border-green-500' : ''
              }`}
              onClick={() => toggleBranch(branch.id)}
            >
              <div className="flex items-start gap-2">
                <Checkbox 
                  checked={selectedBranches.includes(branch.id)}
                  onCheckedChange={() => toggleBranch(branch.id)}
                />
                <div className="flex-1">
                  <div className="text-sm font-bold text-green-400 font-mono mb-1">{branch.name}</div>
                  {branch.simulation && (
                    <div className="text-xs text-slate-500 font-mono">
                      Risk: {branch.simulation.overall_risk_score}/100
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Metric Selection */}
      <div className="mb-6 bg-slate-900/30 cyber-border rounded p-4">
        <h3 className="text-lg font-bold text-cyan-400 font-mono mb-3">Select Metrics to Compare</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {availableMetrics.map((metric) => (
            <div
              key={metric.id}
              onClick={() => toggleMetric(metric.id)}
              className={`p-3 cyber-border rounded cursor-pointer transition-colors ${
                selectedMetrics.includes(metric.id)
                  ? 'bg-green-500/20 border-green-500'
                  : 'bg-slate-900/50 hover:bg-slate-800/50'
              }`}
            >
              <div className="flex items-center gap-2">
                <Checkbox checked={selectedMetrics.includes(metric.id)} />
                <metric.icon className="w-4 h-4 text-cyan-400" />
                <span className="text-sm font-mono text-slate-300">{metric.name}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Comparison Charts */}
      {comparisonData && selectedBranches.length >= 2 ? (
        <div className="space-y-6">
          {/* Casualties Comparison */}
          {selectedMetrics.includes('casualties') && (
          <div className="bg-slate-900/30 cyber-border rounded p-4">
            <div className="flex items-center gap-2 mb-4">
              <Users className="w-5 h-5 text-red-400" />
              <h3 className="text-lg font-bold text-red-400 font-mono">Casualties Comparison</h3>
            </div>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={comparisonData.casualties}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="name" stroke="#94a3b8" style={{ fontSize: '11px', fontFamily: 'monospace' }} />
                <YAxis stroke="#94a3b8" style={{ fontSize: '11px', fontFamily: 'monospace' }} />
                <Tooltip contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #22d3ee' }} />
                <Legend wrapperStyle={{ fontFamily: 'monospace' }} />
                <Bar dataKey="military" fill="#f87171" name="Military" />
                <Bar dataKey="civilian" fill="#fb923c" name="Civilian" />
                <Bar dataKey="total" fill="#dc2626" name="Total" />
              </BarChart>
            </ResponsiveContainer>
          </div>
          )}

          {/* Economic Impact */}
          {selectedMetrics.includes('economic') && (
          <div className="bg-slate-900/30 cyber-border rounded p-4">
            <div className="flex items-center gap-2 mb-4">
              <DollarSign className="w-5 h-5 text-yellow-400" />
              <h3 className="text-lg font-bold text-yellow-400 font-mono">Economic Impact & Risk</h3>
            </div>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={comparisonData.economic}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="name" stroke="#94a3b8" style={{ fontSize: '11px', fontFamily: 'monospace' }} />
                <YAxis stroke="#94a3b8" style={{ fontSize: '11px', fontFamily: 'monospace' }} />
                <Tooltip contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #22d3ee' }} />
                <Legend wrapperStyle={{ fontFamily: 'monospace' }} />
                <Line type="monotone" dataKey="cost" stroke="#fbbf24" strokeWidth={2} name="Economic Cost ($B)" />
                <Line type="monotone" dataKey="riskScore" stroke="#f87171" strokeWidth={2} name="Risk Score" />
              </LineChart>
            </ResponsiveContainer>
          </div>
          )}

          {/* Risk Score Comparison */}
          {selectedMetrics.includes('risk') && (
          <div className="bg-slate-900/30 cyber-border rounded p-4">
            <div className="flex items-center gap-2 mb-4">
              <AlertTriangle className="w-5 h-5 text-red-400" />
              <h3 className="text-lg font-bold text-red-400 font-mono">Risk Score Comparison</h3>
            </div>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={comparisonData.economic}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="name" stroke="#94a3b8" style={{ fontSize: '11px', fontFamily: 'monospace' }} />
                <YAxis stroke="#94a3b8" style={{ fontSize: '11px', fontFamily: 'monospace' }} domain={[0, 100]} />
                <Tooltip contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #22d3ee' }} />
                <Bar dataKey="riskScore" fill="#ef4444" name="Risk Score" />
              </BarChart>
            </ResponsiveContainer>
          </div>
          )}

          {/* Conflict Probability */}
          {selectedMetrics.includes('probability') && (
          <div className="bg-slate-900/30 cyber-border rounded p-4">
            <div className="flex items-center gap-2 mb-4">
              <TrendingUp className="w-5 h-5 text-orange-400" />
              <h3 className="text-lg font-bold text-orange-400 font-mono">Conflict Probability</h3>
            </div>
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={selectedBranchData.map(b => ({
                name: b.name.substring(0, 20) + '...',
                probability: b.simulation?.conflict_probability || 0
              }))}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="name" stroke="#94a3b8" style={{ fontSize: '11px', fontFamily: 'monospace' }} />
                <YAxis stroke="#94a3b8" style={{ fontSize: '11px', fontFamily: 'monospace' }} domain={[0, 100]} />
                <Tooltip contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #22d3ee' }} />
                <Line type="monotone" dataKey="probability" stroke="#fb923c" strokeWidth={2} name="Conflict Probability %" />
              </LineChart>
            </ResponsiveContainer>
          </div>
          )}

          {/* Strategic Metrics Radar */}
          {selectedMetrics.includes('risk') && selectedMetrics.includes('probability') && (
          <div className="bg-slate-900/30 cyber-border rounded p-4">
            <div className="flex items-center gap-2 mb-4">
              <Shield className="w-5 h-5 text-purple-400" />
              <h3 className="text-lg font-bold text-purple-400 font-mono">Strategic Metrics Radar</h3>
            </div>
            <ResponsiveContainer width="100%" height={400}>
              <RadarChart data={comparisonData.radar}>
                <PolarGrid stroke="#1e293b" />
                <PolarAngleAxis dataKey="branch" stroke="#94a3b8" style={{ fontSize: '10px', fontFamily: 'monospace' }} />
                <PolarRadiusAxis stroke="#94a3b8" />
                <Tooltip contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #22d3ee' }} />
                <Radar name="Risk Score" dataKey="riskScore" stroke="#f87171" fill="#f87171" fillOpacity={0.3} />
                <Radar name="Conflict Probability" dataKey="conflictProb" stroke="#fbbf24" fill="#fbbf24" fillOpacity={0.3} />
                <Radar name="Instability" dataKey="stability" stroke="#a855f7" fill="#a855f7" fillOpacity={0.3} />
                <Legend wrapperStyle={{ fontFamily: 'monospace' }} />
              </RadarChart>
            </ResponsiveContainer>
          </div>
          )}

          {/* Regional Stability */}
          {selectedMetrics.includes('stability') && (
          <div className="bg-slate-900/30 cyber-border rounded p-4">
            <div className="flex items-center gap-2 mb-4">
              <AlertTriangle className="w-5 h-5 text-cyan-400" />
              <h3 className="text-lg font-bold text-cyan-400 font-mono">Regional Stability</h3>
            </div>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={comparisonData.stability}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="name" stroke="#94a3b8" style={{ fontSize: '11px', fontFamily: 'monospace' }} />
                <YAxis stroke="#94a3b8" style={{ fontSize: '11px', fontFamily: 'monospace' }} domain={[0, 100]} />
                <Tooltip contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #22d3ee' }} />
                <Bar dataKey="stability" fill="#06b6d4" name="Avg Stability" />
              </BarChart>
            </ResponsiveContainer>
          </div>
          )}

          {/* Key Insights */}
          <div className="bg-gradient-to-br from-green-950/30 to-cyan-950/30 cyber-border rounded p-4">
            <h3 className="text-lg font-bold text-green-400 font-mono mb-3">Key Insights</h3>
            <div className="space-y-2 text-sm font-mono text-slate-300">
              <p>• <strong className="text-cyan-400">Highest Risk:</strong> {
                branches.find(b => b.id === selectedBranches[0])?.name || 'N/A'
              }</p>
              <p>• <strong className="text-cyan-400">Most Casualties:</strong> {
                comparisonData.casualties.reduce((max, b) => b.total > max.total ? b : max, comparisonData.casualties[0])?.name || 'N/A'
              }</p>
              <p>• <strong className="text-cyan-400">Highest Economic Cost:</strong> {
                comparisonData.economic.reduce((max, b) => b.cost > max.cost ? b : max, comparisonData.economic[0])?.name || 'N/A'
              }</p>
              <p>• <strong className="text-cyan-400">Most Stable Outcome:</strong> {
                comparisonData.stability.reduce((max, b) => b.stability > max.stability ? b : max, comparisonData.stability[0])?.name || 'N/A'
              }</p>
            </div>
          </div>
        </div>
      ) : (
        <div className="text-center py-12">
          <AlertTriangle className="w-16 h-16 text-yellow-400 mx-auto mb-4" />
          <p className="text-slate-400 font-mono">
            Select at least 2 branches to view comparative analysis
          </p>
        </div>
      )}
    </Card>
  );
}