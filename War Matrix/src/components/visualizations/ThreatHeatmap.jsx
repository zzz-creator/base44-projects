import React, { useState } from 'react';
import { MapContainer, TileLayer, Rectangle, Popup } from 'react-leaflet';
import { Card } from '../ui/card';
import { Badge } from '../ui/badge';
import { AlertTriangle } from 'lucide-react';
import 'leaflet/dist/leaflet.css';

export default function ThreatHeatmap({ threatData = [] }) {
  const [heatmapZones] = useState([
    { id: 1, name: 'South China Sea', bounds: [[8, 110], [22, 125]], threat: 85, type: 'Territorial' },
    { id: 2, name: 'Eastern Europe', bounds: [[45, 25], [52, 40]], threat: 75, type: 'Military' },
    { id: 3, name: 'Middle East', bounds: [[25, 35], [38, 50]], threat: 70, type: 'Religious' },
    { id: 4, name: 'Korean Peninsula', bounds: [[36, 125], [40, 130]], threat: 80, type: 'Nuclear' },
    { id: 5, name: 'Kashmir', bounds: [[32, 73], [37, 78]], threat: 68, type: 'Border' },
    { id: 6, name: 'Arctic Circle', bounds: [[70, -50], [80, 60]], threat: 55, type: 'Resource' },
    { id: 7, name: 'Sahel Region', bounds: [[10, -10], [20, 15]], threat: 60, type: 'Insurgency' }
  ]);

  const getThreatColor = (threat) => {
    if (threat >= 80) return 'rgba(239, 68, 68, 0.5)';
    if (threat >= 60) return 'rgba(249, 115, 22, 0.5)';
    if (threat >= 40) return 'rgba(234, 179, 8, 0.5)';
    return 'rgba(34, 197, 94, 0.4)';
  };

  const getThreatBadge = (threat) => {
    if (threat >= 80) return 'bg-red-500/20 text-red-400 border-red-500/30';
    if (threat >= 60) return 'bg-orange-500/20 text-orange-400 border-orange-500/30';
    if (threat >= 40) return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
    return 'bg-green-500/20 text-green-400 border-green-500/30';
  };

  return (
    <Card className="bg-slate-950/80 backdrop-blur-xl cyber-border overflow-hidden">
      <div className="p-4 border-b border-red-500/30">
        <div className="flex items-center gap-3">
          <AlertTriangle className="w-6 h-6 text-red-400 animate-pulse" />
          <div>
            <h3 className="text-xl font-bold text-red-400 glow-text font-mono">
              THREAT ASSESSMENT HEATMAP
            </h3>
            <p className="text-xs text-slate-400 font-mono mt-1">
              Global escalation zones and flashpoint predictions
            </p>
          </div>
        </div>
      </div>

      <div className="relative h-[600px]">
        <MapContainer
          center={[30, 20]}
          zoom={2}
          style={{ height: '100%', width: '100%', background: '#0a0e27' }}
          className="z-10"
        >
          <TileLayer
            url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
            attribution='&copy; OpenStreetMap'
          />

          {heatmapZones.map((zone) => (
            <Rectangle
              key={zone.id}
              bounds={zone.bounds}
              pathOptions={{
                fillColor: getThreatColor(zone.threat),
                fillOpacity: 0.6,
                color: getThreatColor(zone.threat).replace('0.5', '0.8'),
                weight: 2
              }}
            >
              <Popup className="cyber-popup">
                <Card className="bg-slate-900/95 border-red-500/30 p-3 min-w-[250px]">
                  <div className="flex items-center gap-2 mb-2">
                    <AlertTriangle className="w-5 h-5 text-red-400" />
                    <h4 className="font-bold text-red-400 font-mono">{zone.name}</h4>
                  </div>
                  <div className="space-y-2 text-xs font-mono">
                    <div className="flex justify-between">
                      <span className="text-slate-400">Conflict Type:</span>
                      <span className="text-yellow-400">{zone.type}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Threat Level:</span>
                      <span className="text-red-400 font-bold">{zone.threat}%</span>
                    </div>
                    <div className="mt-2 h-2 bg-slate-800 rounded-full overflow-hidden">
                      <div
                        className="h-full transition-all duration-500"
                        style={{
                          width: `${zone.threat}%`,
                          backgroundColor: getThreatColor(zone.threat).replace(/[^,]+(?=\))/, '1')
                        }}
                      />
                    </div>
                    <Badge className={`w-full mt-2 ${getThreatBadge(zone.threat)}`}>
                      {zone.threat >= 80 ? 'CRITICAL' : zone.threat >= 60 ? 'HIGH RISK' : zone.threat >= 40 ? 'ELEVATED' : 'MODERATE'}
                    </Badge>
                  </div>
                </Card>
              </Popup>
            </Rectangle>
          ))}
        </MapContainer>

        {/* Legend */}
        <div className="absolute bottom-4 right-4 bg-slate-950/90 backdrop-blur-xl cyber-border rounded-lg p-3 z-[1000] font-mono text-xs">
          <div className="font-bold text-red-400 mb-2 glow-text">THREAT LEVELS</div>
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded" style={{ backgroundColor: 'rgba(239, 68, 68, 0.7)' }}></div>
              <span className="text-slate-300">Critical (80-100%)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded" style={{ backgroundColor: 'rgba(249, 115, 22, 0.7)' }}></div>
              <span className="text-slate-300">High (60-79%)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded" style={{ backgroundColor: 'rgba(234, 179, 8, 0.7)' }}></div>
              <span className="text-slate-300">Elevated (40-59%)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded" style={{ backgroundColor: 'rgba(34, 197, 94, 0.7)' }}></div>
              <span className="text-slate-300">Moderate (&lt;40%)</span>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
}