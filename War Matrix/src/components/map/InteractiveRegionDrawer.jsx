import React, { useState, useRef } from 'react';
import { base44 } from '../../api/base44Client';
import { useMutation } from '@tanstack/react-query';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Badge } from '../ui/badge';
import { 
  Map, Loader2, Pencil, Trash2, Target, Zap, 
  Save, Square, Circle, Triangle
} from 'lucide-react';
import { toast } from 'sonner';
import { MapContainer, TileLayer, Polygon, useMapEvents, Marker, Popup } from 'react-leaflet';

// Draw handler component
function DrawHandler({ isDrawing, onPointAdd }) {
  useMapEvents({
    click: (e) => {
      if (isDrawing) {
        onPointAdd([e.latlng.lat, e.latlng.lng]);
      }
    }
  });
  return null;
}

export default function InteractiveRegionDrawer({ onRegionAnalyzed }) {
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentPoints, setCurrentPoints] = useState([]);
  const [savedRegions, setSavedRegions] = useState(() => {
    const saved = localStorage.getItem('warMatrixCustomRegions');
    return saved ? JSON.parse(saved) : [];
  });
  const [regionName, setRegionName] = useState('');
  const [selectedRegion, setSelectedRegion] = useState(null);
  const [analysisResult, setAnalysisResult] = useState(null);

  const addPoint = (point) => {
    setCurrentPoints([...currentPoints, point]);
  };

  const finishDrawing = () => {
    if (currentPoints.length < 3) {
      toast.error('Need at least 3 points to create a region');
      return;
    }
    setIsDrawing(false);
  };

  const saveRegion = () => {
    if (!regionName.trim() || currentPoints.length < 3) {
      toast.error('Please provide a name and at least 3 points');
      return;
    }

    const region = {
      id: Date.now().toString(),
      name: regionName,
      points: currentPoints,
      createdAt: new Date().toISOString(),
      color: `hsl(${Math.random() * 360}, 70%, 50%)`
    };

    const updated = [...savedRegions, region];
    setSavedRegions(updated);
    localStorage.setItem('warMatrixCustomRegions', JSON.stringify(updated));

    setCurrentPoints([]);
    setRegionName('');
    toast.success('Region saved');
  };

  const deleteRegion = (regionId) => {
    const updated = savedRegions.filter(r => r.id !== regionId);
    setSavedRegions(updated);
    localStorage.setItem('warMatrixCustomRegions', JSON.stringify(updated));
    if (selectedRegion?.id === regionId) {
      setSelectedRegion(null);
    }
    toast.success('Region deleted');
  };

  const analyzeRegionMutation = useMutation({
    mutationFn: async (region) => {
      const centerLat = region.points.reduce((sum, p) => sum + p[0], 0) / region.points.length;
      const centerLng = region.points.reduce((sum, p) => sum + p[1], 0) / region.points.length;

      const response = await base44.integrations.Core.InvokeLLM({
        prompt: `You are a geopolitical analyst. Analyze the following custom region for potential threats and conflict scenarios.

REGION: ${region.name}
CENTER COORDINATES: ${centerLat.toFixed(4)}, ${centerLng.toFixed(4)}
BOUNDARY POINTS: ${region.points.map(p => `[${p[0].toFixed(4)}, ${p[1].toFixed(4)}]`).join(', ')}

Based on these coordinates, identify:
1. The likely geographic area this encompasses
2. Countries/territories within or near this region
3. Current threat assessment for this area
4. Historical conflicts in this region
5. Economic and resource factors
6. Potential flashpoints
7. Recommended monitoring priorities

Provide a comprehensive threat analysis for this custom-defined region.`,
        response_json_schema: {
          type: 'object',
          properties: {
            identified_location: { type: 'string' },
            countries_involved: { type: 'array', items: { type: 'string' } },
            threat_level: { type: 'number' },
            threat_assessment: { type: 'string' },
            historical_conflicts: { type: 'array', items: { type: 'string' } },
            current_tensions: { type: 'array', items: { type: 'string' } },
            economic_factors: { type: 'array', items: { type: 'string' } },
            resource_considerations: { type: 'array', items: { type: 'string' } },
            flashpoints: { type: 'array', items: { type: 'object', properties: { name: { type: 'string' }, risk_level: { type: 'string' }, description: { type: 'string' } } } },
            monitoring_priorities: { type: 'array', items: { type: 'string' } },
            scenario_recommendations: { type: 'array', items: { type: 'string' } }
          }
        },
        add_context_from_internet: true
      });

      return response;
    },
    onSuccess: (data) => {
      setAnalysisResult(data);
      if (onRegionAnalyzed) {
        onRegionAnalyzed(data);
      }
      toast.success('Region analysis complete');
    }
  });

  return (
    <Card className="bg-slate-950/80 backdrop-blur-xl border border-sky-900/40 p-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 rounded-lg bg-cyan-500/20 border border-cyan-500/30">
          <Map className="w-6 h-6 text-cyan-400" />
        </div>
        <div>
          <h3 className="text-xl font-bold text-cyan-400 glow-text font-mono">
            INTERACTIVE REGION DRAWER
          </h3>
          <p className="text-xs text-slate-400 font-mono">Draw custom regions for AI threat analysis</p>
        </div>
      </div>

      <div className="space-y-4">
        {/* Drawing Controls */}
        <div className="flex items-center gap-2">
          <Button
            onClick={() => {
              setIsDrawing(!isDrawing);
              if (!isDrawing) setCurrentPoints([]);
            }}
            className={`font-mono text-xs ${
              isDrawing 
                ? 'bg-red-500/20 text-red-400 border-red-500/30' 
                : 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30'
            } border`}
          >
            <Pencil className="w-4 h-4 mr-2" />
            {isDrawing ? 'CANCEL DRAWING' : 'START DRAWING'}
          </Button>
          
          {isDrawing && currentPoints.length >= 3 && (
            <Button
              onClick={finishDrawing}
              className="bg-green-500/20 text-green-400 border border-green-500/30 font-mono text-xs"
            >
              FINISH ({currentPoints.length} points)
            </Button>
          )}

          {!isDrawing && currentPoints.length >= 3 && (
            <>
              <Input
                value={regionName}
                onChange={(e) => setRegionName(e.target.value)}
                placeholder="Region name..."
                className="bg-slate-900/50 border-cyan-500/30 text-slate-200 font-mono w-48"
              />
              <Button
                onClick={saveRegion}
                className="bg-green-500/20 text-green-400 border border-green-500/30 font-mono text-xs"
              >
                <Save className="w-4 h-4 mr-2" />
                SAVE
              </Button>
            </>
          )}
        </div>

        {isDrawing && (
          <div className="bg-cyan-500/10 border border-cyan-500/30 rounded-lg p-3">
            <p className="text-cyan-400 font-mono text-xs">
              Click on the map to add points. Need at least 3 points to create a region.
              Points added: {currentPoints.length}
            </p>
          </div>
        )}

        {/* Map */}
        <div className="h-[400px] rounded-lg overflow-hidden border border-sky-800/30">
          <MapContainer
            center={[20, 0]}
            zoom={2}
            style={{ height: '100%', width: '100%' }}
            className="z-0"
          >
            <TileLayer
              url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            />
            
            <DrawHandler isDrawing={isDrawing} onPointAdd={addPoint} />
            
            {/* Current drawing */}
            {currentPoints.length >= 3 && (
              <Polygon
                positions={currentPoints}
                pathOptions={{ color: '#06b6d4', fillColor: '#06b6d4', fillOpacity: 0.3 }}
              />
            )}

            {/* Saved regions */}
            {savedRegions.map((region) => (
              <Polygon
                key={region.id}
                positions={region.points}
                pathOptions={{ 
                  color: selectedRegion?.id === region.id ? '#22c55e' : region.color, 
                  fillColor: region.color, 
                  fillOpacity: 0.3 
                }}
                eventHandlers={{
                  click: () => setSelectedRegion(region)
                }}
              >
                <Popup>
                  <div className="font-mono">
                    <div className="font-bold">{region.name}</div>
                    <div className="text-xs">{region.points.length} points</div>
                  </div>
                </Popup>
              </Polygon>
            ))}
          </MapContainer>
        </div>

        {/* Saved Regions List */}
        {savedRegions.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-cyan-400 font-mono font-bold text-sm">SAVED REGIONS</h4>
            {savedRegions.map((region) => (
              <div
                key={region.id}
                className={`bg-slate-900/50 border rounded-lg p-3 cursor-pointer ${
                  selectedRegion?.id === region.id ? 'border-green-500/50' : 'border-sky-800/30'
                }`}
                onClick={() => setSelectedRegion(region)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div 
                      className="w-4 h-4 rounded" 
                      style={{ backgroundColor: region.color }}
                    />
                    <span className="text-green-400 font-mono font-bold text-sm">{region.name}</span>
                    <Badge className="bg-slate-700/50 text-slate-400 font-mono text-[10px]">
                      {region.points.length} points
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        analyzeRegionMutation.mutate(region);
                      }}
                      disabled={analyzeRegionMutation.isPending}
                      className="bg-purple-500/20 text-purple-400 border border-purple-500/30 font-mono text-xs"
                    >
                      {analyzeRegionMutation.isPending ? (
                        <Loader2 className="w-3 h-3 animate-spin" />
                      ) : (
                        <>
                          <Target className="w-3 h-3 mr-1" />
                          ANALYZE
                        </>
                      )}
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteRegion(region.id);
                      }}
                      className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
                    >
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Analysis Results */}
        {analysisResult && (
          <Card className="bg-purple-500/10 border border-purple-500/30 p-4 space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-purple-400 font-mono font-bold">REGION ANALYSIS</h4>
              <Badge className={`font-mono ${
                analysisResult.threat_level >= 70 ? 'bg-red-500/20 text-red-400' :
                analysisResult.threat_level >= 40 ? 'bg-orange-500/20 text-orange-400' :
                'bg-green-500/20 text-green-400'
              }`}>
                Threat: {analysisResult.threat_level}/100
              </Badge>
            </div>

            <div className="bg-slate-800/50 rounded p-3">
              <div className="text-xs text-slate-500 font-mono mb-1">IDENTIFIED LOCATION</div>
              <div className="text-cyan-400 font-mono text-sm">{analysisResult.identified_location}</div>
            </div>

            <div className="bg-slate-800/50 rounded p-3">
              <div className="text-xs text-slate-500 font-mono mb-1">THREAT ASSESSMENT</div>
              <p className="text-slate-300 font-mono text-xs">{analysisResult.threat_assessment}</p>
            </div>

            {analysisResult.flashpoints?.length > 0 && (
              <div>
                <div className="text-xs text-red-400 font-mono mb-2">FLASHPOINTS</div>
                <div className="space-y-2">
                  {analysisResult.flashpoints.map((fp, i) => (
                    <div key={i} className="bg-red-500/10 border border-red-500/20 rounded p-2">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-red-400 font-mono text-xs font-bold">{fp.name}</span>
                        <Badge className="bg-red-500/20 text-red-400 font-mono text-[10px]">
                          {fp.risk_level}
                        </Badge>
                      </div>
                      <p className="text-slate-400 font-mono text-[10px]">{fp.description}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {analysisResult.monitoring_priorities?.length > 0 && (
              <div>
                <div className="text-xs text-cyan-400 font-mono mb-2">MONITORING PRIORITIES</div>
                <ul className="space-y-1">
                  {analysisResult.monitoring_priorities.map((priority, i) => (
                    <li key={i} className="text-slate-300 font-mono text-xs flex items-start gap-2">
                      <Target className="w-3 h-3 mt-0.5 text-cyan-400 flex-shrink-0" />
                      {priority}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </Card>
        )}
      </div>
    </Card>
  );
}