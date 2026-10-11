import React, { useState } from 'react';
import { MapContainer, TileLayer, Circle, Popup, Polyline, LayersControl, GeoJSON } from 'react-leaflet';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Switch } from '../ui/switch';
import { Label } from '../ui/label';
import { Slider } from '../ui/slider';
import { AlertTriangle, Shield, TrendingDown, TrendingUp, Radio, Satellite, Users } from 'lucide-react';
import 'leaflet/dist/leaflet.css';

export default function DynamicGeopoliticalMap({ 
  conflictZones = [], 
  troopMovements = [], 
  stabilityData = [],
  allianceData = [],
  timelineData = null 
}) {
  const [activeLayer, setActiveLayer] = useState({
    conflicts: true,
    troops: true,
    stability: true,
    alliances: true
  });
  const [timeIndex, setTimeIndex] = useState(0);
  const [heatmapIntensity, setHeatmapIntensity] = useState(50);

  const getStabilityColor = (score) => {
    if (score >= 80) return '#22c55e';
    if (score >= 60) return '#eab308';
    if (score >= 40) return '#f97316';
    return '#ef4444';
  };

  const getThreatColor = (level) => {
    const colors = {
      'CRITICAL': '#ef4444',
      'HIGH': '#f97316',
      'MEDIUM': '#eab308',
      'LOW': '#22c55e'
    };
    return colors[level] || '#94a3b8';
  };

  const currentData = timelineData?.length > 0 ? timelineData[timeIndex] : null;

  return (
    <div className="relative w-full h-full rounded-xl overflow-hidden cyber-border">
      {/* Layer Controls */}
      <div className="absolute top-4 left-4 z-[1000] space-y-2">
        <Card className="bg-slate-950/95 backdrop-blur-xl cyber-border p-4">
          <h3 className="text-sm font-bold text-cyan-400 font-mono mb-3">MAP LAYERS</h3>
          <div className="space-y-2">
            <div className="flex items-center justify-between gap-3">
              <Label className="text-xs text-slate-300 font-mono">Conflict Zones</Label>
              <Switch
                checked={activeLayer.conflicts}
                onCheckedChange={(checked) => setActiveLayer({ ...activeLayer, conflicts: checked })}
                className="data-[state=checked]:bg-red-500"
              />
            </div>
            <div className="flex items-center justify-between gap-3">
              <Label className="text-xs text-slate-300 font-mono">Troop Movements</Label>
              <Switch
                checked={activeLayer.troops}
                onCheckedChange={(checked) => setActiveLayer({ ...activeLayer, troops: checked })}
                className="data-[state=checked]:bg-orange-500"
              />
            </div>
            <div className="flex items-center justify-between gap-3">
              <Label className="text-xs text-slate-300 font-mono">Stability Zones</Label>
              <Switch
                checked={activeLayer.stability}
                onCheckedChange={(checked) => setActiveLayer({ ...activeLayer, stability: checked })}
                className="data-[state=checked]:bg-green-500"
              />
            </div>
            <div className="flex items-center justify-between gap-3">
              <Label className="text-xs text-slate-300 font-mono">Alliance Lines</Label>
              <Switch
                checked={activeLayer.alliances}
                onCheckedChange={(checked) => setActiveLayer({ ...activeLayer, alliances: checked })}
                className="data-[state=checked]:bg-cyan-500"
              />
            </div>
          </div>
        </Card>

        {/* Heatmap Intensity */}
        <Card className="bg-slate-950/95 backdrop-blur-xl cyber-border p-4">
          <h3 className="text-sm font-bold text-purple-400 font-mono mb-3">INTENSITY</h3>
          <Slider
            value={[heatmapIntensity]}
            onValueChange={(value) => setHeatmapIntensity(value[0])}
            min={0}
            max={100}
            step={10}
            className="w-full"
          />
          <div className="text-xs text-slate-400 font-mono mt-2 text-center">
            {heatmapIntensity}%
          </div>
        </Card>
      </div>

      {/* Timeline Controls */}
      {timelineData && timelineData.length > 1 && (
        <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 z-[1000] w-[500px]">
          <Card className="bg-slate-950/95 backdrop-blur-xl cyber-border p-4">
            <div className="flex items-center gap-3 mb-3">
              <Radio className="w-4 h-4 text-green-400 animate-pulse" />
              <h3 className="text-sm font-bold text-green-400 font-mono">TIME SLIDER</h3>
              <Badge className="bg-cyan-500/20 text-cyan-400 border-cyan-500/30 font-mono text-xs ml-auto">
                {currentData?.date || `T+${timeIndex}`}
              </Badge>
            </div>
            <Slider
              value={[timeIndex]}
              onValueChange={(value) => setTimeIndex(value[0])}
              min={0}
              max={timelineData.length - 1}
              step={1}
              className="w-full"
            />
            <div className="flex justify-between text-xs font-mono text-slate-500 mt-2">
              <span>{timelineData[0]?.date || 'Start'}</span>
              <span>{timelineData[timelineData.length - 1]?.date || 'End'}</span>
            </div>
          </Card>
        </div>
      )}

      {/* Legend */}
      <div className="absolute bottom-4 right-4 z-[1000]">
        <Card className="bg-slate-950/95 backdrop-blur-xl cyber-border p-4">
          <h3 className="text-xs font-bold text-green-400 font-mono mb-3 glow-text">LEGEND</h3>
          <div className="space-y-2 text-xs font-mono">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-red-500"></div>
              <span className="text-slate-300">Active Conflict</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-orange-500 animate-pulse"></div>
              <span className="text-slate-300">Troop Movement</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-green-500"></div>
              <span className="text-slate-300">Stable Region</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-1 h-3 bg-cyan-500"></div>
              <span className="text-slate-300">Alliance Link</span>
            </div>
          </div>
        </Card>
      </div>

      {/* Map */}
      <MapContainer
        center={[20, 0]}
        zoom={2}
        style={{ height: '100%', width: '100%', background: '#0a0e27' }}
        className="z-10"
      >
        <TileLayer
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        />

        {/* Conflict Zones */}
        {activeLayer.conflicts && conflictZones.map((zone, idx) => (
          zone.coordinates && (
            <Circle
              key={`conflict-${idx}`}
              center={[zone.coordinates.latitude, zone.coordinates.longitude]}
              radius={zone.radius || 100000}
              pathOptions={{
                fillColor: getThreatColor(zone.threat_level),
                fillOpacity: (heatmapIntensity / 100) * 0.4,
                color: getThreatColor(zone.threat_level),
                weight: 2
              }}
            >
              <Popup className="cyber-popup">
                <Card className="bg-slate-900/95 border-red-500/30 p-3 min-w-[250px]">
                  <div className="flex items-center gap-2 mb-2">
                    <AlertTriangle className="w-4 h-4 text-red-400" />
                    <h4 className="text-sm font-bold text-red-400 font-mono">{zone.name}</h4>
                  </div>
                  <Badge className={`mb-2 ${zone.threat_level === 'CRITICAL' ? 'bg-red-500/20 text-red-400 border-red-500/30' : 'bg-orange-500/20 text-orange-400 border-orange-500/30'} font-mono text-xs`}>
                    {zone.threat_level} THREAT
                  </Badge>
                  <p className="text-slate-400 font-mono text-xs mb-2">{zone.description}</p>
                  {zone.active_units && (
                    <div className="flex items-center gap-2 text-xs font-mono">
                      <Users className="w-3 h-3 text-cyan-400" />
                      <span className="text-cyan-400">{zone.active_units.toLocaleString()} troops</span>
                    </div>
                  )}
                </Card>
              </Popup>
            </Circle>
          )
        ))}

        {/* Troop Movements */}
        {activeLayer.troops && troopMovements.map((movement, idx) => (
          movement.path && movement.path.length >= 2 && (
            <React.Fragment key={`troop-${idx}`}>
              <Polyline
                positions={movement.path.map(p => [p.latitude, p.longitude])}
                pathOptions={{
                  color: '#f97316',
                  weight: 3,
                  opacity: 0.8,
                  dashArray: '10, 10'
                }}
                className="animate-pulse"
              >
                <Popup className="cyber-popup">
                  <Card className="bg-slate-900/95 border-orange-500/30 p-3">
                    <div className="flex items-center gap-2 mb-2">
                      <Satellite className="w-4 h-4 text-orange-400" />
                      <h4 className="text-sm font-bold text-orange-400 font-mono">
                        TROOP MOVEMENT
                      </h4>
                    </div>
                    <div className="space-y-1 text-xs font-mono">
                      <div><span className="text-slate-500">Unit:</span> <span className="text-slate-300">{movement.unit}</span></div>
                      <div><span className="text-slate-500">Size:</span> <span className="text-cyan-400">{movement.size.toLocaleString()}</span></div>
                      <div><span className="text-slate-500">Direction:</span> <span className="text-slate-300">{movement.direction}</span></div>
                      <div><span className="text-slate-500">Speed:</span> <span className="text-green-400">{movement.speed}</span></div>
                    </div>
                  </Card>
                </Popup>
              </Polyline>
              {/* End marker */}
              <Circle
                center={[movement.path[movement.path.length - 1].latitude, movement.path[movement.path.length - 1].longitude]}
                radius={30000}
                pathOptions={{
                  fillColor: '#f97316',
                  fillOpacity: 0.8,
                  color: '#ffffff',
                  weight: 2
                }}
                className="animate-pulse"
              />
            </React.Fragment>
          )
        ))}

        {/* Stability Zones */}
        {activeLayer.stability && stabilityData.map((region, idx) => (
          region.coordinates && (
            <Circle
              key={`stability-${idx}`}
              center={[region.coordinates.latitude, region.coordinates.longitude]}
              radius={region.radius || 150000}
              pathOptions={{
                fillColor: getStabilityColor(region.stability_score),
                fillOpacity: (heatmapIntensity / 100) * 0.3,
                color: getStabilityColor(region.stability_score),
                weight: 2,
                dashArray: '5, 5'
              }}
            >
              <Popup className="cyber-popup">
                <Card className="bg-slate-900/95 border-green-500/30 p-3">
                  <div className="flex items-center gap-2 mb-2">
                    <Shield className="w-4 h-4 text-green-400" />
                    <h4 className="text-sm font-bold text-green-400 font-mono">{region.name}</h4>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-slate-500 font-mono">Stability:</span>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold font-mono" style={{ color: getStabilityColor(region.stability_score) }}>
                          {region.stability_score}/100
                        </span>
                        {region.trend === 'improving' ? (
                          <TrendingUp className="w-3 h-3 text-green-400" />
                        ) : (
                          <TrendingDown className="w-3 h-3 text-red-400" />
                        )}
                      </div>
                    </div>
                    <p className="text-slate-400 font-mono text-xs">{region.analysis}</p>
                  </div>
                </Card>
              </Popup>
            </Circle>
          )
        ))}

        {/* Alliance Lines */}
        {activeLayer.alliances && allianceData.map((alliance, idx) => (
          alliance.countries && alliance.countries.length >= 2 && (
            <Polyline
              key={`alliance-${idx}`}
              positions={alliance.countries.map(c => [c.latitude, c.longitude])}
              pathOptions={{
                color: '#06b6d4',
                weight: 2,
                opacity: 0.6,
                dashArray: '5, 10'
              }}
            >
              <Popup className="cyber-popup">
                <Card className="bg-slate-900/95 border-cyan-500/30 p-3">
                  <div className="flex items-center gap-2 mb-2">
                    <Shield className="w-4 h-4 text-cyan-400" />
                    <h4 className="text-sm font-bold text-cyan-400 font-mono">{alliance.name}</h4>
                  </div>
                  <div className="text-xs font-mono">
                    <div className="mb-2">
                      <span className="text-slate-500">Type:</span> <span className="text-slate-300">{alliance.type}</span>
                    </div>
                    <div className="mb-2">
                      <span className="text-slate-500">Members:</span>
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {alliance.countries.map((country, i) => (
                        <Badge key={i} variant="outline" className="border-cyan-500/30 text-cyan-400 text-xs">
                          {country.name}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </Card>
              </Popup>
            </Polyline>
          )
        ))}
      </MapContainer>
    </div>
  );
}