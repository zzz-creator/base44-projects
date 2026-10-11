import React from 'react';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { Switch } from '../ui/switch';
import { Slider } from '../ui/slider';
import { AlertTriangle, Satellite, Zap, Globe, Edit3, Trash2 } from 'lucide-react';

export default function EnhancedMapControls({ 
  layers, 
  onLayerToggle, 
  heatmapIntensity, 
  onHeatmapChange,
  drawingMode,
  onDrawingToggle,
  onClearDrawing
}) {
  return (
    <Card className="bg-slate-950/95 backdrop-blur-xl cyber-border p-4 min-w-[250px]">
      <h3 className="font-bold text-green-400 mb-4 glow-text text-sm font-mono">MAP CONTROLS</h3>
      
      <div className="space-y-4">
        {/* Layer Toggles */}
        <div>
          <div className="text-xs text-slate-500 font-mono mb-2">LAYERS</div>
          <div className="space-y-2">
            <div className="flex items-center justify-between p-2 bg-slate-900/50 rounded">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-red-400" />
                <span className="text-slate-300 font-mono text-xs">Threat Zones</span>
              </div>
              <Switch 
                checked={layers.threatZones} 
                onCheckedChange={() => onLayerToggle('threatZones')}
              />
            </div>

            <div className="flex items-center justify-between p-2 bg-slate-900/50 rounded">
              <div className="flex items-center gap-2">
                <Satellite className="w-4 h-4 text-orange-400" />
                <span className="text-slate-300 font-mono text-xs">Anomalies</span>
              </div>
              <Switch 
                checked={layers.anomalies} 
                onCheckedChange={() => onLayerToggle('anomalies')}
              />
            </div>

            <div className="flex items-center justify-between p-2 bg-slate-900/50 rounded">
              <div className="flex items-center gap-2">
                <Zap className="w-4 h-4 text-yellow-400" />
                <span className="text-slate-300 font-mono text-xs">Flashpoints</span>
              </div>
              <Switch 
                checked={layers.flashpoints} 
                onCheckedChange={() => onLayerToggle('flashpoints')}
              />
            </div>

            <div className="flex items-center justify-between p-2 bg-slate-900/50 rounded">
              <div className="flex items-center gap-2">
                <Globe className="w-4 h-4 text-cyan-400" />
                <span className="text-slate-300 font-mono text-xs">Countries</span>
              </div>
              <Switch 
                checked={layers.countries} 
                onCheckedChange={() => onLayerToggle('countries')}
              />
            </div>
          </div>
        </div>

        {/* Heatmap Intensity */}
        <div>
          <div className="text-xs text-slate-500 font-mono mb-2">HEATMAP INTENSITY</div>
          <Slider
            value={[heatmapIntensity]}
            onValueChange={(v) => onHeatmapChange(v[0])}
            max={100}
            step={10}
            className="py-4"
          />
          <div className="text-xs text-center text-cyan-400 font-mono">{heatmapIntensity}%</div>
        </div>

        {/* Drawing Tools */}
        <div>
          <div className="text-xs text-slate-500 font-mono mb-2">DRAWING TOOLS</div>
          <div className="flex gap-2">
            <Button
              size="sm"
              onClick={onDrawingToggle}
              className={`flex-1 font-mono text-xs ${
                drawingMode 
                  ? 'bg-purple-500/30 text-purple-400 border border-purple-500/50' 
                  : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
              }`}
            >
              <Edit3 className="w-3 h-3 mr-1" />
              {drawingMode ? 'DRAWING' : 'DRAW'}
            </Button>
            <Button
              size="sm"
              onClick={onClearDrawing}
              variant="outline"
              className="border-red-500/30 text-red-400 hover:bg-red-900/20 font-mono text-xs"
            >
              <Trash2 className="w-3 h-3" />
            </Button>
          </div>
          {drawingMode && (
            <div className="mt-2 p-2 bg-purple-950/20 cyber-border rounded text-xs text-purple-400 font-mono">
              Click on map to draw custom regions
            </div>
          )}
        </div>
      </div>
    </Card>
  );
}