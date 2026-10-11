import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, CircleMarker, Circle, Popup, Polyline, Marker } from 'react-leaflet';
import { Card } from '../ui/card';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { 
  AlertTriangle, 
  Radio, 
  TrendingUp, 
  Satellite,
  Activity,
  Zap,
  Shield
} from 'lucide-react';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix for default marker icons
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

export default function EnhancedThreatMap({ 
  wars = [], 
  threatZones = [],
  flashpoints = [],
  satelliteAnomalies = []
}) {
  const [pulseAnimation, setPulseAnimation] = useState({});

  useEffect(() => {
    // Animate threat zones
    const interval = setInterval(() => {
      setPulseAnimation(prev => ({ ...prev, tick: Date.now() }));
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const getThreatColor = (level) => {
    switch(level) {
      case 'CRITICAL': return '#ef4444';
      case 'HIGH': return '#f97316';
      case 'MEDIUM': return '#eab308';
      case 'LOW': return '#22c55e';
      default: return '#94a3b8';
    }
  };

  const getRiskColor = (score) => {
    if (score >= 80) return '#ef4444';
    if (score >= 60) return '#f97316';
    if (score >= 40) return '#eab308';
    return '#22c55e';
  };

  // All war countries
  const warCountries = wars.flatMap(war => war.countries_data || []);

  return (
    <div className="relative w-full h-full rounded-xl overflow-hidden cyber-border">
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

        {/* High-Threat Zones with Pulsing Effect */}
        {threatZones.map((zone, idx) => (
          zone.coordinates && (
            <Circle
              key={`threat-${idx}`}
              center={[zone.coordinates.latitude, zone.coordinates.longitude]}
              radius={zone.radius || 100000}
              pathOptions={{
                fillColor: getThreatColor(zone.threat_level),
                fillOpacity: 0.3 + (Math.sin(Date.now() / 500) * 0.1),
                color: getThreatColor(zone.threat_level),
                weight: 3,
                className: 'animate-pulse'
              }}
            >
              <Popup className="cyber-popup">
                <Card className="bg-slate-900/95 border-red-500/30 p-4 min-w-[300px]">
                  <div className="flex items-center gap-2 mb-3">
                    <AlertTriangle className="w-5 h-5 text-red-400" />
                    <h3 className="text-lg font-bold text-red-400 font-mono">
                      HIGH THREAT ZONE
                    </h3>
                  </div>
                  
                  <h4 className="text-md font-bold text-yellow-400 font-mono mb-2">
                    {zone.name}
                  </h4>

                  <div className="mb-3 p-3 bg-red-950/30 cyber-border rounded">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs text-slate-400 font-mono">Threat Level</span>
                      <Badge className="bg-red-500/20 text-red-400 border-red-500/30 font-mono text-xs">
                        {zone.threat_level}
                      </Badge>
                    </div>
                    <div className="text-2xl font-bold text-red-400 font-mono">
                      {zone.risk_score}/100
                    </div>
                  </div>

                  <p className="text-slate-300 text-xs font-mono mb-3 leading-relaxed">
                    {zone.description}
                  </p>

                  {zone.factors && zone.factors.length > 0 && (
                    <div className="mb-3">
                      <div className="text-xs text-slate-500 font-mono mb-1">Contributing Factors:</div>
                      <div className="flex flex-wrap gap-1">
                        {zone.factors.map((factor, i) => (
                          <Badge key={i} variant="outline" className="border-orange-500/30 text-orange-400 font-mono text-xs">
                            {factor}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {zone.active_units && (
                    <div className="pt-2 border-t border-red-500/20">
                      <div className="flex items-center gap-2 text-xs font-mono">
                        <Activity className="w-3 h-3 text-cyan-400" />
                        <span className="text-slate-400">Active Units:</span>
                        <span className="text-cyan-400 font-bold">{zone.active_units.toLocaleString()}</span>
                      </div>
                    </div>
                  )}
                </Card>
              </Popup>
            </Circle>
          )
        ))}

        {/* Satellite Anomalies */}
        {satelliteAnomalies.map((anomaly, idx) => (
          anomaly.coordinates && (
            <CircleMarker
              key={`satellite-${idx}`}
              center={[anomaly.coordinates.latitude, anomaly.coordinates.longitude]}
              radius={10}
              fillColor="#f97316"
              color="#ffffff"
              weight={2}
              fillOpacity={0.9}
              className="animate-pulse"
            >
              <Popup className="cyber-popup">
                <Card className="bg-slate-900/95 border-orange-500/30 p-4 min-w-[280px]">
                  <div className="flex items-center gap-2 mb-3">
                    <Satellite className="w-5 h-5 text-orange-400" />
                    <h3 className="text-md font-bold text-orange-400 font-mono">
                      SATELLITE ANOMALY
                    </h3>
                  </div>

                  <h4 className="text-sm font-bold text-yellow-400 font-mono mb-2">
                    {anomaly.location}
                  </h4>

                  <Badge className="mb-3 bg-orange-500/20 text-orange-400 border-orange-500/30 font-mono text-xs">
                    {anomaly.anomaly_type}
                  </Badge>

                  <p className="text-slate-300 text-xs font-mono mb-3 leading-relaxed">
                    {anomaly.analysis}
                  </p>

                  <div className="flex items-center justify-between text-xs font-mono">
                    <span className="text-slate-500">{anomaly.timestamp}</span>
                    <Badge className="bg-red-500/20 text-red-400 border-red-500/30">
                      {anomaly.severity}
                    </Badge>
                  </div>
                </Card>
              </Popup>
            </CircleMarker>
          )
        ))}

        {/* Emerging Flashpoints */}
        {flashpoints.map((flashpoint, idx) => (
          flashpoint.coordinates && (
            <Circle
              key={`flashpoint-${idx}`}
              center={[flashpoint.coordinates.latitude, flashpoint.coordinates.longitude]}
              radius={150000}
              pathOptions={{
                fillColor: getRiskColor(flashpoint.risk_score || flashpoint.escalation_probability),
                fillOpacity: 0.25,
                color: '#eab308',
                weight: 2,
                dashArray: '10, 10',
                className: 'animate-pulse'
              }}
            >
              <Popup className="cyber-popup">
                <Card className="bg-slate-900/95 border-yellow-500/30 p-4 min-w-[280px]">
                  <div className="flex items-center gap-2 mb-3">
                    <Zap className="w-5 h-5 text-yellow-400" />
                    <h3 className="text-md font-bold text-yellow-400 font-mono">
                      FLASHPOINT
                    </h3>
                  </div>

                  <h4 className="text-sm font-bold text-cyan-400 font-mono mb-2">
                    {flashpoint.region_name}
                  </h4>

                  <div className="mb-3 p-2 bg-yellow-950/30 cyber-border rounded">
                    <div className="text-xs text-slate-400 font-mono mb-1">Risk Score</div>
                    <div className="text-xl font-bold text-yellow-400 font-mono">
                      {flashpoint.risk_score || flashpoint.escalation_probability}/100
                    </div>
                  </div>

                  <p className="text-slate-300 text-xs font-mono mb-3 leading-relaxed">
                    {flashpoint.analysis || flashpoint.location}
                  </p>

                  {flashpoint.involved_parties && flashpoint.involved_parties.length > 0 && (
                    <div className="pt-2 border-t border-yellow-500/20">
                      <div className="text-xs text-slate-500 font-mono mb-1">Involved Parties:</div>
                      <div className="flex flex-wrap gap-1">
                        {flashpoint.involved_parties.map((party, i) => (
                          <Badge key={i} variant="outline" className="border-yellow-500/30 text-yellow-400 font-mono text-xs">
                            {party}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </Card>
              </Popup>
            </Circle>
          )
        ))}

        {/* War Countries */}
        {warCountries.map((country, idx) => (
          country.latitude && country.longitude && (
            <CircleMarker
              key={`country-${idx}`}
              center={[country.latitude, country.longitude]}
              radius={8}
              fillColor={country.side === 'aggressor' ? '#ff0040' : country.side === 'defender' ? '#00d4ff' : '#00ff41'}
              color="#ffffff"
              weight={2}
              fillOpacity={0.8}
            >
              <Popup className="cyber-popup">
                <Card className="bg-slate-900/95 border-green-500/30 p-3 min-w-[250px]">
                  <h3 className="text-md font-bold text-green-400 font-mono mb-2">
                    {country.country_name}
                  </h3>
                  <Badge className="mb-2 bg-cyan-500/20 text-cyan-400 border-cyan-500/30 font-mono text-xs">
                    {country.side?.toUpperCase()}
                  </Badge>
                  {country.army_size && (
                    <div className="text-xs font-mono text-slate-400">
                      <div>Army: {country.army_size.toLocaleString()}</div>
                      <div>Casualties: {country.casualties?.toLocaleString() || '0'}</div>
                    </div>
                  )}
                </Card>
              </Popup>
            </CircleMarker>
          )
        ))}
      </MapContainer>

      {/* Enhanced Legend */}
      <div className="absolute bottom-4 right-4 z-[1000]">
        <Card className="bg-slate-950/95 backdrop-blur-xl cyber-border p-4">
          <div className="font-bold text-green-400 mb-3 glow-text text-xs font-mono">THREAT MAP LEGEND</div>
          <div className="space-y-2 text-xs font-mono">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded-full border-2 border-red-400 bg-red-400/30"></div>
              <span className="text-slate-300">High Threat Zone</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-orange-500 animate-pulse"></div>
              <span className="text-slate-300">Satellite Anomaly</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded-full border-2 border-dashed border-yellow-400 bg-yellow-400/20"></div>
              <span className="text-slate-300">Flashpoint</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-red-500"></div>
              <span className="text-slate-300">Aggressor Nation</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-cyan-400"></div>
              <span className="text-slate-300">Defender Nation</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-green-400"></div>
              <span className="text-slate-300">Allied Nation</span>
            </div>
          </div>
        </Card>
      </div>

      {/* Live Indicator */}
      <div className="absolute top-4 left-4 z-[1000]">
        <Card className="bg-slate-950/95 backdrop-blur-xl cyber-border p-3">
          <div className="flex items-center gap-2">
            <Radio className="w-4 h-4 text-green-400 animate-pulse" />
            <span className="text-green-400 font-mono text-xs font-bold">LIVE INTEL</span>
          </div>
        </Card>
      </div>
    </div>
  );
}