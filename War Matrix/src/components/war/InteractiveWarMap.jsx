import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, CircleMarker, Popup, SVGOverlay } from 'react-leaflet';
import { Card } from '../ui/card';
import { Badge } from '../ui/badge';
import { Users, Skull, DollarSign, Shield, AlertTriangle } from 'lucide-react';
import 'leaflet/dist/leaflet.css';

export default function InteractiveWarMap({ wars, flashpoints, showConnections = true }) {
  const [hoveredCountry, setHoveredCountry] = useState(null);
  const [connections, setConnections] = useState([]);

  useEffect(() => {
    if (hoveredCountry && showConnections) {
      const war = wars.find(w => 
        w.countries_data?.some(c => c.country_code === hoveredCountry.country_code)
      );
      
      if (war) {
        const country = war.countries_data.find(c => c.country_code === hoveredCountry.country_code);
        const enemies = war.countries_data.filter(c => 
          c.side !== country.side && c.latitude && c.longitude
        );
        setConnections(enemies);
      }
    } else {
      setConnections([]);
    }
  }, [hoveredCountry, wars, showConnections]);

  const getColorBySide = (side) => {
    switch(side) {
      case 'ally': return '#00ff41';
      case 'axis': return '#ff0040';
      case 'aggressor': return '#ff6b00';
      case 'defender': return '#00d4ff';
      default: return '#ffaa00';
    }
  };

  const allCountries = wars.flatMap(war => war.countries_data || []);

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
        
        {/* Connection Lines */}
        {hoveredCountry && connections.length > 0 && (
          <SVGOverlay bounds={[[-90, -180], [90, 180]]}>
            <g>
              {connections.map((enemy, idx) => (
                <line
                  key={idx}
                  x1={((hoveredCountry.longitude + 180) / 360) * 100 + '%'}
                  y1={((90 - hoveredCountry.latitude) / 180) * 100 + '%'}
                  x2={((enemy.longitude + 180) / 360) * 100 + '%'}
                  y2={((90 - enemy.latitude) / 180) * 100 + '%'}
                  stroke="#00ff41"
                  strokeWidth="2"
                  strokeDasharray="5,5"
                  opacity="0.6"
                  className="animate-pulse"
                />
              ))}
            </g>
          </SVGOverlay>
        )}

        {/* Country Markers for Wars */}
        {allCountries.map((country, idx) => (
          country.latitude && country.longitude && (
            <CircleMarker
              key={`war-${idx}`}
              center={[country.latitude, country.longitude]}
              radius={8}
              fillColor={getColorBySide(country.side)}
              color="#ffffff"
              weight={2}
              fillOpacity={0.8}
              eventHandlers={{
                mouseover: () => setHoveredCountry(country),
                mouseout: () => setHoveredCountry(null),
              }}
            >
              <Popup className="cyber-popup">
                <Card className="bg-slate-900/95 border-green-500/30 p-4 min-w-[280px]">
                  <div className="space-y-3">
                    <div>
                      <h3 className="text-lg font-bold text-green-400 glow-text font-mono">
                        {country.country_name}
                      </h3>
                      <Badge className="mt-1 bg-cyan-500/20 text-cyan-400 border-cyan-500/30">
                        {country.side?.toUpperCase()}
                      </Badge>
                    </div>

                    <div className="grid grid-cols-2 gap-3 text-sm font-mono">
                      <div className="flex items-center gap-2">
                        <Users className="w-4 h-4 text-green-400" />
                        <div>
                          <div className="text-slate-400 text-xs">Army Size</div>
                          <div className="text-green-400 font-bold">
                            {country.army_size?.toLocaleString() || 'N/A'}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <Skull className="w-4 h-4 text-red-400" />
                        <div>
                          <div className="text-slate-400 text-xs">Casualties</div>
                          <div className="text-red-400 font-bold">
                            {country.casualties?.toLocaleString() || '0'}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <DollarSign className="w-4 h-4 text-yellow-400" />
                        <div>
                          <div className="text-slate-400 text-xs">Budget</div>
                          <div className="text-yellow-400 font-bold">
                            ${(country.military_budget / 1e9).toFixed(1)}B
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <Shield className="w-4 h-4 text-blue-400" />
                        <div>
                          <div className="text-slate-400 text-xs">Status</div>
                          <div className="text-blue-400 font-bold">Active</div>
                        </div>
                      </div>
                    </div>

                    {connections.length > 0 && (
                      <div className="pt-2 border-t border-green-500/20">
                        <div className="text-xs text-slate-400 mb-1">At war with:</div>
                        <div className="flex flex-wrap gap-1">
                          {connections.map((enemy, i) => (
                            <Badge key={i} variant="outline" className="text-xs border-red-500/30 text-red-400">
                              {enemy.country_name}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </Card>
              </Popup>
            </CircleMarker>
          )
        ))}

        {/* Flashpoint Markers */}
        {flashpoints && flashpoints.map((flashpoint, idx) => (
          flashpoint.coordinates && (
            <CircleMarker
              key={`flashpoint-${idx}`}
              center={[flashpoint.coordinates.latitude, flashpoint.coordinates.longitude]}
              radius={12}
              fillColor="#ff0040"
              color="#ff6b00"
              weight={3}
              fillOpacity={0.6}
              className="animate-pulse"
            >
              <Popup className="cyber-popup">
                <Card className="bg-slate-900/95 border-red-500/30 p-4 min-w-[300px]">
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="w-5 h-5 text-red-400" />
                      <h3 className="text-lg font-bold text-red-400 glow-text font-mono">
                        FLASHPOINT
                      </h3>
                    </div>

                    <div>
                      <h4 className="text-md font-bold text-yellow-400 font-mono mb-1">
                        {flashpoint.region_name}
                      </h4>
                      <p className="text-slate-400 text-xs font-mono">{flashpoint.location}</p>
                    </div>

                    <div className="p-2 bg-red-950/30 cyber-border rounded">
                      <div className="text-xs text-slate-400 mb-1">Risk Score</div>
                      <div className="text-2xl font-bold text-red-400 font-mono">
                        {flashpoint.risk_score}/100
                      </div>
                    </div>

                    <p className="text-slate-300 text-xs font-mono leading-relaxed">
                      {flashpoint.analysis}
                    </p>

                    {flashpoint.involved_parties && flashpoint.involved_parties.length > 0 && (
                      <div className="pt-2 border-t border-red-500/20">
                        <div className="text-xs text-slate-400 mb-1">Involved Parties:</div>
                        <div className="flex flex-wrap gap-1">
                          {flashpoint.involved_parties.map((party, i) => (
                            <Badge key={i} variant="outline" className="text-xs border-orange-500/30 text-orange-400">
                              {party}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </Card>
              </Popup>
            </CircleMarker>
          )
        ))}
      </MapContainer>

      {/* Legend */}
      <div className="absolute bottom-4 right-4 bg-slate-950/90 backdrop-blur-xl cyber-border rounded-lg p-4 z-[1000] font-mono text-xs">
        <div className="font-bold text-green-400 mb-2 glow-text">LEGEND</div>
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full" style={{ background: '#00ff41' }}></div>
            <span className="text-slate-300">Allied Forces</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full" style={{ background: '#ff0040' }}></div>
            <span className="text-slate-300">Opposing Forces</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full" style={{ background: '#ff6b00' }}></div>
            <span className="text-slate-300">Aggressors</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full" style={{ background: '#00d4ff' }}></div>
            <span className="text-slate-300">Defenders</span>
          </div>
          <div className="pt-1.5 mt-1.5 border-t border-slate-700/30">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded-full animate-pulse" style={{ background: '#ff0040', border: '2px solid #ff6b00' }}></div>
              <span className="text-slate-300">Flashpoint Zone</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}