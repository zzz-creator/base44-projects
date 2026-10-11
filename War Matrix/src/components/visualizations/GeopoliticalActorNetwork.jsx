import React, { useState, useEffect, useRef } from 'react';
import { Card } from '../ui/card';
import { Badge } from '../ui/badge';
import { Network, Shield, Zap } from 'lucide-react';

export default function GeopoliticalActorNetwork({ conflictData }) {
  const canvasRef = useRef(null);
  const [hoveredNode, setHoveredNode] = useState(null);
  const [nodes, setNodes] = useState([]);
  const [edges, setEdges] = useState([]);

  useEffect(() => {
    if (!conflictData || conflictData.length === 0) return;

    // Extract actors and their relationships
    const actorMap = new Map();
    const edgeList = [];

    conflictData.forEach(conflict => {
      const regions = conflict.affected_regions || [];
      
      regions.forEach(region => {
        if (!actorMap.has(region)) {
          actorMap.set(region, {
            id: region,
            name: region,
            conflicts: [],
            totalRisk: 0,
            resourceDependencies: []
          });
        }
        
        const actor = actorMap.get(region);
        actor.conflicts.push(conflict);
        actor.totalRisk += conflict.probability || 0;
      });

      // Create edges between co-involved regions
      for (let i = 0; i < regions.length; i++) {
        for (let j = i + 1; j < regions.length; j++) {
          edgeList.push({
            source: regions[i],
            target: regions[j],
            conflict: conflict.name,
            strength: conflict.probability || 50
          });
        }
      }
    });

    // Convert to array and position nodes
    const nodeArray = Array.from(actorMap.values()).map((actor, idx) => ({
      ...actor,
      x: 400 + Math.cos(idx * 2 * Math.PI / actorMap.size) * 200,
      y: 300 + Math.sin(idx * 2 * Math.PI / actorMap.size) * 200,
      radius: 10 + (actor.totalRisk / 100) * 20
    }));

    setNodes(nodeArray);
    setEdges(edgeList);
  }, [conflictData]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || nodes.length === 0) return;

    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;

    // Clear canvas
    ctx.clearRect(0, 0, width, height);

    // Draw edges
    ctx.strokeStyle = 'rgba(0, 255, 65, 0.2)';
    edges.forEach(edge => {
      const source = nodes.find(n => n.id === edge.source);
      const target = nodes.find(n => n.id === edge.target);
      
      if (source && target) {
        ctx.beginPath();
        ctx.moveTo(source.x, source.y);
        ctx.lineTo(target.x, target.y);
        ctx.lineWidth = edge.strength / 25;
        ctx.stroke();
      }
    });

    // Draw nodes
    nodes.forEach(node => {
      const isHovered = hoveredNode === node.id;
      
      // Node circle
      ctx.beginPath();
      ctx.arc(node.x, node.y, node.radius, 0, 2 * Math.PI);
      
      const riskLevel = node.totalRisk / node.conflicts.length;
      if (riskLevel > 70) {
        ctx.fillStyle = isHovered ? '#ff0040' : 'rgba(255, 0, 64, 0.6)';
      } else if (riskLevel > 40) {
        ctx.fillStyle = isHovered ? '#ffaa00' : 'rgba(255, 170, 0, 0.6)';
      } else {
        ctx.fillStyle = isHovered ? '#00ff41' : 'rgba(0, 255, 65, 0.6)';
      }
      ctx.fill();
      
      ctx.strokeStyle = '#00ff41';
      ctx.lineWidth = isHovered ? 3 : 1;
      ctx.stroke();

      // Node label
      if (isHovered) {
        ctx.fillStyle = '#00ff41';
        ctx.font = '12px monospace';
        ctx.textAlign = 'center';
        ctx.fillText(node.name, node.x, node.y - node.radius - 10);
      }
    });
  }, [nodes, edges, hoveredNode]);

  const handleMouseMove = (e) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const hoveredNodeFound = nodes.find(node => {
      const dx = x - node.x;
      const dy = y - node.y;
      return Math.sqrt(dx * dx + dy * dy) <= node.radius;
    });

    setHoveredNode(hoveredNodeFound ? hoveredNodeFound.id : null);
  };

  const hoveredNodeData = nodes.find(n => n.id === hoveredNode);

  return (
    <Card className="bg-slate-950/80 backdrop-blur-xl cyber-border p-6">
      <h3 className="text-xl font-bold text-cyan-400 glow-text font-mono mb-4 flex items-center gap-2">
        <Network className="w-6 h-6" />
        GEOPOLITICAL ACTOR NETWORK
      </h3>

      <div className="relative">
        <canvas
          ref={canvasRef}
          width={800}
          height={600}
          className="w-full h-[600px] bg-slate-900/50 rounded-lg cyber-border"
          onMouseMove={handleMouseMove}
          onMouseLeave={() => setHoveredNode(null)}
        />
        
        {hoveredNodeData && (
          <div className="absolute top-4 right-4 bg-slate-950/95 cyber-border rounded-lg p-4 min-w-[250px]">
            <h4 className="text-lg font-bold text-green-400 font-mono mb-2">
              {hoveredNodeData.name}
            </h4>
            
            <div className="space-y-2 text-sm font-mono">
              <div className="flex justify-between">
                <span className="text-slate-400">Conflicts:</span>
                <span className="text-cyan-400 font-bold">{hoveredNodeData.conflicts.length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Avg Risk:</span>
                <span className="text-orange-400 font-bold">
                  {(hoveredNodeData.totalRisk / hoveredNodeData.conflicts.length).toFixed(0)}%
                </span>
              </div>
            </div>

            <div className="mt-3 pt-3 border-t border-green-500/20">
              <div className="text-xs text-slate-500 font-mono mb-2">Involved In:</div>
              <div className="space-y-1">
                {hoveredNodeData.conflicts.slice(0, 3).map((conflict, idx) => (
                  <Badge 
                    key={idx} 
                    variant="outline" 
                    className="text-xs border-purple-500/30 text-purple-400 font-mono block"
                  >
                    {conflict.name}
                  </Badge>
                ))}
                {hoveredNodeData.conflicts.length > 3 && (
                  <div className="text-xs text-slate-500 font-mono">
                    +{hoveredNodeData.conflicts.length - 3} more
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="mt-4 grid md:grid-cols-3 gap-4">
        <div className="p-3 bg-slate-900/50 cyber-border rounded">
          <Shield className="w-5 h-5 text-green-400 mb-2" />
          <div className="text-xs text-slate-400 font-mono">Total Actors</div>
          <div className="text-2xl font-bold text-green-400 font-mono">{nodes.length}</div>
        </div>
        <div className="p-3 bg-slate-900/50 cyber-border rounded">
          <Zap className="w-5 h-5 text-yellow-400 mb-2" />
          <div className="text-xs text-slate-400 font-mono">Connections</div>
          <div className="text-2xl font-bold text-yellow-400 font-mono">{edges.length}</div>
        </div>
        <div className="p-3 bg-slate-900/50 cyber-border rounded">
          <Network className="w-5 h-5 text-purple-400 mb-2" />
          <div className="text-xs text-slate-400 font-mono">Avg Conflicts/Actor</div>
          <div className="text-2xl font-bold text-purple-400 font-mono">
            {nodes.length > 0 ? (nodes.reduce((sum, n) => sum + n.conflicts.length, 0) / nodes.length).toFixed(1) : 0}
          </div>
        </div>
      </div>

      <div className="mt-4 p-3 bg-slate-900/50 cyber-border rounded">
        <div className="text-xs font-bold text-slate-400 font-mono mb-2">NODE COLORS</div>
        <div className="flex gap-4">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-full bg-red-500"></div>
            <span className="text-xs text-slate-300 font-mono">High Risk (70%+)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-full bg-yellow-500"></div>
            <span className="text-xs text-slate-300 font-mono">Medium Risk (40-69%)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-full bg-green-500"></div>
            <span className="text-xs text-slate-300 font-mono">Low Risk (&lt;40%)</span>
          </div>
        </div>
      </div>
    </Card>
  );
}