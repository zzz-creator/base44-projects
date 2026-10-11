import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, CircleMarker, Popup, GeoJSON } from 'react-leaflet';
import { Card } from '../ui/card';
import { Badge } from '../ui/badge';
import { AlertTriangle, Flame, Droplet } from 'lucide-react';
import 'leaflet/dist/leaflet.css';

export default function InteractiveWorldDashboardMap({ conflictData, autoRefresh = true }) {
  const [mapData, setMapData] = useState({
    conflicts: [],
    threats: [],
    resources: []
  });

  useEffect(() => {
    // Initialize with sample data
    const sampleData = {
      conflicts: [
        { id: 1, name: 'Eastern Europe', lat: 48.3794, lng: 31.1656, intensity: 85, casualties: 15000, type: 'Territorial' },
        { id: 2, name: 'Middle East', lat: 33.3152, lng: 44.3661, intensity: 75, casualties: 12000, type: 'Religious' },
        { id: 3, name: 'East Asia', lat: 25.0330, lng: 121.5654, intensity: 65, casualties: 8000, type: 'Economic' },
        { id: 4, name: 'North Africa', lat: 30.0444, lng: 31.2357, intensity: 55, casualties: 5000, type: 'Civil' }
      ],
      threats: [
        { id: 1, region: 'South China Sea', lat: 12.8797, lng: 121.7740, level: 78, type: 'Territorial Dispute' },
        { id: 2, region: 'Kashmir', lat: 34.0837, lng: 74.7973, level: 82, type: 'Border Tension' },
        { id: 3, region: 'Crimea', lat: 45.3516, lng: 34.4286, level: 70, type: 'Annexation Risk' }
      ],
      resources: [
        { id: 1, name: 'Oil Reserve', lat: 25.2048, lng: 55.2708, type: 'Oil', strategic_value: 95 },
        { id: 2, name: 'Rare Earth', lat: 39.9042, lng: 116.4074, type: 'Minerals', strategic_value: 88 },
        { id: 3, name: 'Water Source', lat: 31.7683, lng: 35.2137, type: 'Water', strategic_value: 92 }
      ]
    };

    setMapData(sampleData);

    if (!autoRefresh) return;

    const interval = setInterval(() => {
      setMapData(prev => ({
        ...prev,
        conflicts: prev.conflicts.map(c => ({
          ...c,
          intensity: Math.max(30, Math.min(100, c.intensity + (Math.random() * 10 - 5)))
        })),
        threats: prev.threats.map(t => ({
          ...t,
          level: Math.max(30, Math.min(100, t.level + (Math.random() * 10 - 5)))
        }))
      }));
    }, 5000);

    return () => clearInterval(interval);
  }, [autoRefresh, conflictData]);

  const getThreatColor = (level) => {
    if (level >= 80) return '#ef4444';
    if (level >= 60) return '#f97316';
    if (level >= 40) return '#eab308';
    return '#22c55e';
  };

  const getIntensitySize = (intensity) => {
    return Math.max(8, (intensity / 100) * 20);
  };

  return (
    <Card className="bg-slate-950/80 backdrop-blur-xl cyber-border overflow-hidden">
      <div className="p-4 border-b border-green-500/30">
        <h3 className="text-xl font-bold text-green-400 glow-text font-mono">
          GLOBAL THREAT MATRIX
        </h3>
        <p className="text-xs text-slate-400 font-mono mt-1">
          Real-time conflict tracking • Strategic resources • Threat assessment
        </p>
      </div>

      <div className="relative h-[500px]">
        <MapContainer
          center={[20, 0]}
          zoom={2}
          style={{ height: '100%', width: '100%', background: '#0a0e27' }}
          className="z-10"
        >
          <TileLayer
            url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
            attribution='&copy; OpenStreetMap'
          />

          {/* Active Conflicts */}
          {mapData.conflicts.map((conflict) => (
            <CircleMarker
              key={`conflict-${conflict.id}`}
              center={[conflict.lat, conflict.lng]}
              radius={getIntensitySize(conflict.intensity)}
              fillColor="#ef4444"
              color="#ffffff"
              weight={2}
              fillOpacity={0.7}
              className="animate-pulse"
            >
              <Popup className="cyber-popup">
                <Card className="bg-slate-900/95 border-red-500/30 p-3 min-w-[250px]">
                  <div className="flex items-center gap-2 mb-2">
                    <Flame className="w-5 h-5 text-red-400" />
                    <h4 className="font-bold text-red-400 font-mono">{conflict.name}</h4>
                  </div>
                  <div className="space-y-2 text-xs font-mono">
                    <div className="flex justify-between">
                      <span className="text-slate-400">Type:</span>
                      <span className="text-yellow-400">{conflict.type}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Intensity:</span>
                      <span className="text-red-400 font-bold">{conflict.intensity.toFixed(0)}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Casualties:</span>
                      <span className="text-orange-400">{conflict.casualties.toLocaleString()}</span>
                    </div>
                    <Badge className="w-full bg-red-500/20 text-red-400 border-red-500/30 mt-2">
                      ACTIVE CONFLICT
                    </Badge>
                  </div>
                </Card>
              </Popup>
            </CircleMarker>
          ))}

          {/* Threat Zones */}
          {mapData.threats.map((threat) => (
            <CircleMarker
              key={`threat-${threat.id}`}
              center={[threat.lat, threat.lng]}
              radius={12}
              fillColor={getThreatColor(threat.level)}
              color="#ffffff"
              weight={2}
              fillOpacity={0.6}
            >
              <Popup className="cyber-popup">
                <Card className="bg-slate-900/95 border-orange-500/30 p-3 min-w-[250px]">
                  <div className="flex items-center gap-2 mb-2">
                    <AlertTriangle className="w-5 h-5 text-orange-400" />
                    <h4 className="font-bold text-orange-400 font-mono">{threat.region}</h4>
                  </div>
                  <div className="space-y-2 text-xs font-mono">
                    <div className="flex justify-between">
                      <span className="text-slate-400">Type:</span>
                      <span className="text-cyan-400">{threat.type}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Threat Level:</span>
                      <span className="text-orange-400 font-bold">{threat.level.toFixed(0)}%</span>
                    </div>
                    <div className="mt-2 h-2 bg-slate-800 rounded-full overflow-hidden">
                      <div
                        className="h-full transition-all duration-500"
                        style={{
                          width: `${threat.level}%`,
                          backgroundColor: getThreatColor(threat.level)
                        }}
                      />
                    </div>
                    <Badge className="w-full bg-orange-500/20 text-orange-400 border-orange-500/30 mt-2">
                      HIGH RISK ZONE
                    </Badge>
                  </div>
                </Card>
              </Popup>
            </CircleMarker>
          ))}

          {/* Strategic Resources */}
          {mapData.resources.map((resource) => (
            <CircleMarker
              key={`resource-${resource.id}`}
              center={[resource.lat, resource.lng]}
              radius={10}
              fillColor="#22c55e"
              color="#ffffff"
              weight={2}
              fillOpacity={0.7}
            >
              <Popup className="cyber-popup">
                <Card className="bg-slate-900/95 border-green-500/30 p-3 min-w-[250px]">
                  <div className="flex items-center gap-2 mb-2">
                    <Droplet className="w-5 h-5 text-green-400" />
                    <h4 className="font-bold text-green-400 font-mono">{resource.name}</h4>
                  </div>
                  <div className="space-y-2 text-xs font-mono">
                    <div className="flex justify-between">
                      <span className="text-slate-400">Type:</span>
                      <span className="text-cyan-400">{resource.type}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Strategic Value:</span>
                      <span className="text-green-400 font-bold">{resource.strategic_value}/100</span>
                    </div>
                    <Badge className="w-full bg-green-500/20 text-green-400 border-green-500/30 mt-2">
                      CRITICAL RESOURCE
                    </Badge>
                  </div>
                </Card>
              </Popup>
            </CircleMarker>
          ))}
        </MapContainer>

        {/* Legend */}
        <div className="absolute bottom-4 right-4 bg-slate-950/90 backdrop-blur-xl cyber-border rounded-lg p-3 z-[1000] font-mono text-xs">
          <div className="font-bold text-green-400 mb-2 glow-text">LEGEND</div>
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-red-500 animate-pulse"></div>
              <span className="text-slate-300">Active Conflict</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-orange-500"></div>
              <span className="text-slate-300">Threat Zone</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-green-500"></div>
              <span className="text-slate-300">Strategic Resource</span>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
}