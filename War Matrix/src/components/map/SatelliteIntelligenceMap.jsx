import React, { useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Circle } from 'react-leaflet';
import { Card } from '../ui/card';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Satellite, AlertTriangle, Shield, Zap } from 'lucide-react';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix Leaflet default icon issue
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

export default function SatelliteIntelligenceMap({ intelligenceData = [] }) {
  const [selectedPoint, setSelectedPoint] = useState(null);

  const defaultIntelData = [
    {
      id: 1,
      lat: 34.0522,
      lng: -118.2437,
      type: 'military_buildup',
      severity: 'high',
      title: 'Military Asset Concentration',
      description: 'Satellite imagery shows increased military vehicle deployment',
      confidence: 87,
      timestamp: '2025-11-20 14:32 UTC',
      details: {
        assets: ['12 armored vehicles', '4 artillery units', '3 air defense systems'],
        change: '+45% from last week'
      }
    },
    {
      id: 2,
      lat: 31.2304,
      lng: 121.4737,
      type: 'naval_activity',
      severity: 'critical',
      title: 'Naval Fleet Movement',
      description: 'Major naval vessels detected moving towards contested waters',
      confidence: 92,
      timestamp: '2025-11-21 08:15 UTC',
      details: {
        assets: ['2 aircraft carriers', '8 destroyers', '4 submarines (estimated)'],
        trajectory: 'Heading 127° SE'
      }
    },
    {
      id: 3,
      lat: 48.8566,
      lng: 2.3522,
      type: 'infrastructure',
      severity: 'medium',
      title: 'Infrastructure Damage Assessment',
      description: 'Post-conflict damage visible in urban infrastructure',
      confidence: 78,
      timestamp: '2025-11-19 22:47 UTC',
      details: {
        affected: ['3 bridges', '2 power stations', 'Multiple residential blocks'],
        extent: 'Moderate to severe'
      }
    },
    {
      id: 4,
      lat: 25.2048,
      lng: 55.2708,
      type: 'refugee_movement',
      severity: 'high',
      title: 'Mass Population Displacement',
      description: 'Large-scale population movement detected via thermal imaging',
      confidence: 85,
      timestamp: '2025-11-22 16:09 UTC',
      details: {
        estimated: '~50,000 individuals',
        direction: 'Northward migration pattern'
      }
    },
    {
      id: 5,
      lat: 35.6762,
      lng: 139.6503,
      type: 'cyber_facility',
      severity: 'critical',
      title: 'Cyber Operations Center Activity',
      description: 'Unusual electromagnetic signatures from suspected cyber warfare facility',
      confidence: 73,
      timestamp: '2025-11-23 03:21 UTC',
      details: {
        signals: ['Increased RF activity', 'Power consumption spike +120%'],
        assessment: 'Possible offensive cyber operations preparation'
      }
    }
  ];

  const data = intelligenceData.length > 0 ? intelligenceData : defaultIntelData;

  const getSeverityColor = (severity) => {
    switch (severity) {
      case 'critical': return '#ef4444';
      case 'high': return '#f97316';
      case 'medium': return '#eab308';
      case 'low': return '#22c55e';
      default: return '#06b6d4';
    }
  };

  const getTypeIcon = (type) => {
    switch (type) {
      case 'military_buildup': return Shield;
      case 'naval_activity': return Zap;
      case 'infrastructure': return AlertTriangle;
      case 'refugee_movement': return AlertTriangle;
      case 'cyber_facility': return Satellite;
      default: return Satellite;
    }
  };

  return (
    <Card className="bg-slate-950/80 backdrop-blur-xl cyber-border overflow-hidden">
      <div className="p-4 border-b border-cyan-500/30 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Satellite className="w-6 h-6 text-cyan-400 animate-pulse" />
          <div>
            <h3 className="text-xl font-bold text-cyan-400 glow-text font-mono">
              SATELLITE INTELLIGENCE MAP
            </h3>
            <p className="text-xs text-slate-400 font-mono mt-1">
              Real-time geospatial analysis • {data.length} active points of interest
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

          {data.map((point) => {
            const Icon = getTypeIcon(point.type);
            return (
              <React.Fragment key={point.id}>
                <Circle
                  center={[point.lat, point.lng]}
                  radius={50000}
                  pathOptions={{
                    fillColor: getSeverityColor(point.severity),
                    fillOpacity: 0.3,
                    color: getSeverityColor(point.severity),
                    weight: 2,
                    opacity: 0.6
                  }}
                />
                <Marker 
                  position={[point.lat, point.lng]}
                  eventHandlers={{
                    click: () => setSelectedPoint(point)
                  }}
                >
                  <Popup className="cyber-popup" minWidth={300}>
                    <Card className="bg-slate-900/95 border-cyan-500/30 p-4">
                      <div className="flex items-start gap-3 mb-3">
                        <div className={`p-2 rounded-lg`} style={{ backgroundColor: `${getSeverityColor(point.severity)}30` }}>
                          <Icon className="w-5 h-5" style={{ color: getSeverityColor(point.severity) }} />
                        </div>
                        <div className="flex-1">
                          <h4 className="font-bold text-cyan-400 font-mono text-sm mb-1">
                            {point.title}
                          </h4>
                          <Badge 
                            className="text-xs font-mono"
                            style={{ 
                              backgroundColor: `${getSeverityColor(point.severity)}30`,
                              color: getSeverityColor(point.severity),
                              borderColor: `${getSeverityColor(point.severity)}50`
                            }}
                          >
                            {point.severity.toUpperCase()}
                          </Badge>
                        </div>
                      </div>

                      <p className="text-slate-300 font-mono text-xs mb-3 leading-relaxed">
                        {point.description}
                      </p>

                      <div className="space-y-2 mb-3">
                        <div className="flex justify-between text-xs font-mono">
                          <span className="text-slate-500">Confidence:</span>
                          <span className="text-green-400 font-bold">{point.confidence}%</span>
                        </div>
                        <div className="flex justify-between text-xs font-mono">
                          <span className="text-slate-500">Timestamp:</span>
                          <span className="text-cyan-400">{point.timestamp}</span>
                        </div>
                        <div className="flex justify-between text-xs font-mono">
                          <span className="text-slate-500">Coordinates:</span>
                          <span className="text-purple-400">{point.lat.toFixed(4)}°, {point.lng.toFixed(4)}°</span>
                        </div>
                      </div>

                      {point.details && (
                        <div className="pt-3 border-t border-cyan-500/30">
                          <h5 className="text-xs font-bold text-yellow-400 font-mono mb-2">INTELLIGENCE DETAILS</h5>
                          {Object.entries(point.details).map(([key, value]) => (
                            <div key={key} className="mb-2">
                              <div className="text-xs text-slate-500 font-mono capitalize mb-1">
                                {key.replace('_', ' ')}:
                              </div>
                              {Array.isArray(value) ? (
                                <ul className="space-y-1">
                                  {value.map((item, idx) => (
                                    <li key={idx} className="text-xs text-slate-300 font-mono ml-2">
                                      • {item}
                                    </li>
                                  ))}
                                </ul>
                              ) : (
                                <div className="text-xs text-slate-300 font-mono">{value}</div>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </Card>
                  </Popup>
                </Marker>
              </React.Fragment>
            );
          })}
        </MapContainer>

        {/* Legend */}
        <div className="absolute bottom-4 right-4 bg-slate-950/90 backdrop-blur-xl cyber-border rounded-lg p-3 z-[1000] font-mono text-xs max-w-[200px]">
          <div className="font-bold text-cyan-400 mb-2 glow-text">SEVERITY LEVELS</div>
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded" style={{ backgroundColor: '#ef4444' }}></div>
              <span className="text-slate-300">Critical</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded" style={{ backgroundColor: '#f97316' }}></div>
              <span className="text-slate-300">High</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded" style={{ backgroundColor: '#eab308' }}></div>
              <span className="text-slate-300">Medium</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded" style={{ backgroundColor: '#22c55e' }}></div>
              <span className="text-slate-300">Low</span>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
}