import React, { useState } from 'react';
import { MapContainer, TileLayer, GeoJSON, Popup } from 'react-leaflet';
import { Card } from '../ui/card';
import { Badge } from '../ui/badge';
import { AlertTriangle, TrendingUp, Users } from 'lucide-react';
import 'leaflet/dist/leaflet.css';

export default function ChoroplethConflictMap({ conflictData }) {
  const [selectedRegion, setSelectedRegion] = useState(null);

  // Simplified world regions GeoJSON (in production, load from actual GeoJSON file)
  const worldRegions = {
    type: "FeatureCollection",
    features: [
      {
        type: "Feature",
        properties: { name: "Middle East", id: "middle_east" },
        geometry: {
          type: "Polygon",
          coordinates: [[[25, 15], [60, 15], [60, 40], [25, 40], [25, 15]]]
        }
      },
      {
        type: "Feature",
        properties: { name: "East Asia", id: "east_asia" },
        geometry: {
          type: "Polygon",
          coordinates: [[[100, 10], [150, 10], [150, 50], [100, 50], [100, 10]]]
        }
      },
      {
        type: "Feature",
        properties: { name: "Europe", id: "europe" },
        geometry: {
          type: "Polygon",
          coordinates: [[[-10, 35], [40, 35], [40, 70], [-10, 70], [-10, 35]]]
        }
      },
      {
        type: "Feature",
        properties: { name: "Sub-Saharan Africa", id: "africa" },
        geometry: {
          type: "Polygon",
          coordinates: [[[-20, -35], [50, -35], [50, 15], [-20, 15], [-20, -35]]]
        }
      },
      {
        type: "Feature",
        properties: { name: "South Asia", id: "south_asia" },
        geometry: {
          type: "Polygon",
          coordinates: [[[60, 5], [95, 5], [95, 35], [60, 35], [60, 5]]]
        }
      },
      {
        type: "Feature",
        properties: { name: "Latin America", id: "latin_america" },
        geometry: {
          type: "Polygon",
          coordinates: [[[-110, -55], [-35, -55], [-35, 30], [-110, 30], [-110, -55]]]
        }
      }
    ]
  };

  const getRegionData = (regionId) => {
    if (!conflictData) return { probability: 0, intensity: 0, conflicts: 0 };
    
    const regionConflicts = conflictData.filter(c => 
      c.affected_regions?.some(r => r.toLowerCase().includes(regionId.replace('_', ' ')))
    );

    const avgProbability = regionConflicts.length > 0
      ? regionConflicts.reduce((sum, c) => sum + (c.probability || 0), 0) / regionConflicts.length
      : 0;

    const maxIntensity = regionConflicts.length > 0
      ? Math.max(...regionConflicts.map(c => c.climate_impact_score || 0))
      : 0;

    return {
      probability: avgProbability,
      intensity: maxIntensity,
      conflicts: regionConflicts.length,
      details: regionConflicts
    };
  };

  const getColor = (probability) => {
    if (probability >= 70) return '#ff0040';
    if (probability >= 50) return '#ff6b00';
    if (probability >= 30) return '#ffaa00';
    if (probability >= 10) return '#00d4ff';
    return '#00ff41';
  };

  const style = (feature) => {
    const data = getRegionData(feature.properties.id);
    return {
      fillColor: getColor(data.probability),
      weight: 2,
      opacity: 1,
      color: '#00ff41',
      fillOpacity: 0.6
    };
  };

  const onEachFeature = (feature, layer) => {
    layer.on({
      mouseover: (e) => {
        const layer = e.target;
        layer.setStyle({
          weight: 3,
          color: '#fff',
          fillOpacity: 0.8
        });
        setSelectedRegion(feature.properties.id);
      },
      mouseout: (e) => {
        const layer = e.target;
        layer.setStyle(style(feature));
        setSelectedRegion(null);
      }
    });
  };

  return (
    <Card className="bg-slate-950/80 backdrop-blur-xl cyber-border p-6">
      <h3 className="text-xl font-bold text-purple-400 glow-text font-mono mb-4 flex items-center gap-2">
        <TrendingUp className="w-6 h-6" />
        GLOBAL CONFLICT PROBABILITY MAP
      </h3>
      
      <div className="h-[500px] rounded-lg overflow-hidden cyber-border mb-4">
        <MapContainer
          center={[20, 0]}
          zoom={2}
          style={{ height: '100%', width: '100%', background: '#0a0e27' }}
        >
          <TileLayer
            url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
          />
          <GeoJSON
            data={worldRegions}
            style={style}
            onEachFeature={onEachFeature}
          />
        </MapContainer>
      </div>

      {selectedRegion && (
        <Card className="bg-slate-900/50 cyber-border p-4">
          <div className="space-y-2">
            <h4 className="text-lg font-bold text-cyan-400 font-mono">
              {worldRegions.features.find(f => f.properties.id === selectedRegion)?.properties.name}
            </h4>
            {(() => {
              const data = getRegionData(selectedRegion);
              return (
                <div className="grid grid-cols-3 gap-3">
                  <div className="p-2 bg-purple-950/30 rounded">
                    <div className="text-xs text-slate-400 font-mono">Avg Probability</div>
                    <div className="text-xl font-bold text-purple-400 font-mono">
                      {data.probability.toFixed(0)}%
                    </div>
                  </div>
                  <div className="p-2 bg-red-950/30 rounded">
                    <div className="text-xs text-slate-400 font-mono">Max Intensity</div>
                    <div className="text-xl font-bold text-red-400 font-mono">
                      {data.intensity.toFixed(0)}
                    </div>
                  </div>
                  <div className="p-2 bg-orange-950/30 rounded">
                    <div className="text-xs text-slate-400 font-mono">Conflicts</div>
                    <div className="text-xl font-bold text-orange-400 font-mono">
                      {data.conflicts}
                    </div>
                  </div>
                </div>
              );
            })()}
          </div>
        </Card>
      )}

      <div className="mt-4 p-3 bg-slate-900/50 cyber-border rounded">
        <div className="text-xs font-bold text-slate-400 font-mono mb-2">LEGEND</div>
        <div className="grid grid-cols-5 gap-2">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded" style={{ background: '#ff0040' }}></div>
            <span className="text-xs text-slate-300 font-mono">70%+</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded" style={{ background: '#ff6b00' }}></div>
            <span className="text-xs text-slate-300 font-mono">50-69%</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded" style={{ background: '#ffaa00' }}></div>
            <span className="text-xs text-slate-300 font-mono">30-49%</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded" style={{ background: '#00d4ff' }}></div>
            <span className="text-xs text-slate-300 font-mono">10-29%</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded" style={{ background: '#00ff41' }}></div>
            <span className="text-xs text-slate-300 font-mono">&lt;10%</span>
          </div>
        </div>
      </div>
    </Card>
  );
}