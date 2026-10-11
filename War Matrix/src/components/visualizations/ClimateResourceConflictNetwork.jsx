import React, { useState } from 'react';
import { Card } from '../ui/card';
import { Badge } from '../ui/badge';
import { 
  Sankey, 
  Tooltip, 
  ResponsiveContainer
} from 'recharts';
import { CloudRain, Droplets, Users, AlertTriangle } from 'lucide-react';

export default function ClimateResourceConflictNetwork({ conflicts }) {
  const [selectedNode, setSelectedNode] = useState(null);

  // Build causal network data
  const buildNetworkData = () => {
    const nodes = [];
    const links = [];
    
    // Root causes
    const causes = [
      { name: 'Climate Change', color: '#3b82f6' },
      { name: 'Resource Scarcity', color: '#f97316' },
      { name: 'Socio-Economic', color: '#ef4444' }
    ];
    
    causes.forEach(cause => nodes.push(cause));

    // Conflicts as target nodes
    conflicts?.forEach((conflict, idx) => {
      nodes.push({ 
        name: conflict.name, 
        color: '#a855f7',
        data: conflict
      });

      // Create links based on scores
      if (conflict.climate_impact_score > 30) {
        links.push({
          source: 0, // Climate Change
          target: causes.length + idx,
          value: conflict.climate_impact_score
        });
      }
      if (conflict.resource_scarcity_score > 30) {
        links.push({
          source: 1, // Resource Scarcity
          target: causes.length + idx,
          value: conflict.resource_scarcity_score
        });
      }
      if (conflict.socio_economic_score > 30) {
        links.push({
          source: 2, // Socio-Economic
          target: causes.length + idx,
          value: conflict.socio_economic_score
        });
      }
    });

    return { nodes, links };
  };

  const { nodes, links } = buildNetworkData();

  // Calculate correlation matrix
  const calculateCorrelations = () => {
    if (!conflicts || conflicts.length === 0) return [];

    const factors = ['climate_impact_score', 'resource_scarcity_score', 'socio_economic_score', 'probability'];
    const correlations = [];

    for (let i = 0; i < factors.length; i++) {
      for (let j = i + 1; j < factors.length; j++) {
        const x = conflicts.map(c => c[factors[i]] || 0);
        const y = conflicts.map(c => c[factors[j]] || 0);
        
        // Simple correlation calculation
        const n = x.length;
        const sumX = x.reduce((a, b) => a + b, 0);
        const sumY = y.reduce((a, b) => a + b, 0);
        const sumXY = x.reduce((sum, xi, idx) => sum + xi * y[idx], 0);
        const sumX2 = x.reduce((sum, xi) => sum + xi * xi, 0);
        const sumY2 = y.reduce((sum, yi) => sum + yi * yi, 0);
        
        const correlation = (n * sumXY - sumX * sumY) / 
          Math.sqrt((n * sumX2 - sumX * sumX) * (n * sumY2 - sumY * sumY));

        correlations.push({
          factor1: factors[i].replace(/_/g, ' '),
          factor2: factors[j].replace(/_/g, ' '),
          correlation: (correlation * 100).toFixed(0)
        });
      }
    }

    return correlations;
  };

  const correlations = calculateCorrelations();

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      return (
        <Card className="bg-slate-950/95 backdrop-blur-xl cyber-border p-3">
          <div className="text-xs font-mono space-y-1">
            <div className="text-cyan-400 font-bold">{payload[0].name}</div>
            <div className="text-slate-400">Impact: {payload[0].value}</div>
          </div>
        </Card>
      );
    }
    return null;
  };

  return (
    <Card className="bg-slate-950/80 backdrop-blur-xl cyber-border p-6">
      <h3 className="text-xl font-bold text-purple-400 glow-text font-mono mb-4">
        CAUSAL NETWORK ANALYSIS
      </h3>

      {/* Correlation Matrix */}
      <div className="mb-6">
        <h4 className="text-sm font-bold text-cyan-400 font-mono mb-3">FACTOR CORRELATIONS</h4>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3">
          {correlations.map((corr, idx) => {
            const strength = Math.abs(parseFloat(corr.correlation));
            const color = strength > 70 ? 'red' : strength > 50 ? 'orange' : strength > 30 ? 'yellow' : 'green';
            
            return (
              <div key={idx} className={`p-3 bg-${color}-950/20 cyber-border rounded`}>
                <div className="text-xs text-slate-400 font-mono mb-1 capitalize">
                  {corr.factor1} ↔ {corr.factor2}
                </div>
                <div className={`text-lg font-bold text-${color}-400 font-mono`}>
                  {corr.correlation}%
                </div>
                <div className="text-xs text-slate-500 font-mono">
                  {strength > 70 ? 'Strong' : strength > 50 ? 'Moderate' : strength > 30 ? 'Weak' : 'Minimal'} correlation
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Primary Drivers Analysis */}
      <div className="grid md:grid-cols-3 gap-4">
        {[
          { name: 'Climate Change', icon: CloudRain, key: 'climate_impact_score', color: 'blue' },
          { name: 'Resource Scarcity', icon: Droplets, key: 'resource_scarcity_score', color: 'orange' },
          { name: 'Socio-Economic', icon: Users, key: 'socio_economic_score', color: 'red' }
        ].map((factor, idx) => {
          const avgScore = conflicts?.reduce((sum, c) => sum + (c[factor.key] || 0), 0) / (conflicts?.length || 1);
          const highImpact = conflicts?.filter(c => (c[factor.key] || 0) > 70).length || 0;
          
          return (
            <div key={idx} className={`p-4 bg-${factor.color}-950/20 cyber-border rounded`}>
              <div className="flex items-center gap-2 mb-3">
                <factor.icon className={`w-5 h-5 text-${factor.color}-400`} />
                <h4 className={`text-sm font-bold text-${factor.color}-400 font-mono`}>
                  {factor.name.toUpperCase()}
                </h4>
              </div>
              <div className={`text-3xl font-bold text-${factor.color}-400 font-mono mb-1`}>
                {avgScore.toFixed(0)}/100
              </div>
              <div className="text-xs text-slate-400 font-mono mb-2">Average Impact</div>
              <Badge className={`bg-${factor.color}-500/20 text-${factor.color}-400 border-${factor.color}-500/30 font-mono text-xs`}>
                {highImpact} high-impact conflicts
              </Badge>
            </div>
          );
        })}
      </div>

      {/* Key Findings */}
      <div className="mt-4 p-3 bg-purple-950/20 cyber-border rounded">
        <h4 className="text-sm font-bold text-purple-400 font-mono mb-2 flex items-center gap-2">
          <AlertTriangle className="w-4 h-4" />
          KEY FINDINGS
        </h4>
        <ul className="space-y-1">
          {correlations.slice(0, 3).map((corr, idx) => (
            <li key={idx} className="text-slate-300 font-mono text-xs flex items-start gap-2">
              <span className="text-purple-400">▸</span>
              {Math.abs(parseFloat(corr.correlation)) > 60 ? 'Strong' : 'Moderate'} link between {corr.factor1} and {corr.factor2} ({corr.correlation}% correlation)
            </li>
          ))}
        </ul>
      </div>
    </Card>
  );
}