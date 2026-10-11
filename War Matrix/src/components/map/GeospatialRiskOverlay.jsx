import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, CircleMarker, Popup, useMap } from 'react-leaflet';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Switch } from '../ui/switch';
import { Label } from '../ui/label';
import { 
  Layers, CloudRain, Droplets, Wheat, Flame, 
  TrendingUp, AlertTriangle, Shield
} from 'lucide-react';

// Risk data generator (in production, this would come from external APIs)
const generateRiskData = () => {
  const regions = [
    { name: 'Middle East', lat: 29.3117, lng: 47.4818, climate: 85, water: 90, food: 70, political: 88 },
    { name: 'Central Africa', lat: 4.3947, lng: 18.5582, climate: 75, water: 80, food: 85, political: 82 },
    { name: 'South Asia', lat: 20.5937, lng: 78.9629, climate: 70, water: 75, food: 65, political: 60 },
    { name: 'Eastern Europe', lat: 48.3794, lng: 31.1656, climate: 45, water: 40, food: 35, political: 85 },
    { name: 'Southeast Asia', lat: 12.8797, lng: 121.7740, climate: 80, water: 55, food: 50, political: 55 },
    { name: 'North Africa', lat: 26.8206, lng: 30.8025, climate: 82, water: 88, food: 72, political: 70 },
    { name: 'Central Asia', lat: 41.3775, lng: 64.5853, climate: 60, water: 78, food: 55, political: 65 },
    { name: 'Horn of Africa', lat: 8.6195, lng: 46.1996, climate: 88, water: 92, food: 90, political: 85 },
    { name: 'Caribbean', lat: 21.4691, lng: -78.6569, climate: 75, water: 45, food: 40, political: 45 },
    { name: 'Amazon Basin', lat: -3.4653, lng: -62.2159, climate: 70, water: 35, food: 45, political: 50 }
  ];
  return regions;
};

function MapLegend({ layers }) {
  return (
    <div className="absolute bottom-4 left-4 z-[1000] bg-slate-950/90 backdrop-blur-sm cyber-border rounded-lg p-3">
      <div className="text-xs font-mono text-slate-400 mb-2">RISK LEVELS</div>
      <div className="space-y-1">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-red-500"></div>
          <span className="text-xs font-mono text-red-400">Critical (80-100)</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-orange-500"></div>
          <span className="text-xs font-mono text-orange-400">High (60-79)</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
          <span className="text-xs font-mono text-yellow-400">Medium (40-59)</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-green-500"></div>
          <span className="text-xs font-mono text-green-400">Low (0-39)</span>
        </div>
      </div>
    </div>
  );
}

export default function GeospatialRiskOverlay() {
  const [riskData, setRiskData] = useState([]);
  const [layers, setLayers] = useState({
    climate: true,
    water: false,
    food: false,
    political: false
  });

  useEffect(() => {
    setRiskData(generateRiskData());
  }, []);

  const getRiskColor = (value) => {
    if (value >= 80) return '#ef4444';
    if (value >= 60) return '#f97316';
    if (value >= 40) return '#eab308';
    return '#22c55e';
  };

  const getActiveRiskValue = (region) => {
    if (layers.climate) return region.climate;
    if (layers.water) return region.water;
    if (layers.food) return region.food;
    if (layers.political) return region.political;
    return 0;
  };

  const getActiveLayerName = () => {
    if (layers.climate) return 'Climate Vulnerability';
    if (layers.water) return 'Water Scarcity';
    if (layers.food) return 'Food Security Risk';
    if (layers.political) return 'Political Instability';
    return 'No Layer Selected';
  };

  const toggleLayer = (layer) => {
    setLayers({
      climate: layer === 'climate',
      water: layer === 'water',
      food: layer === 'food',
      political: layer === 'political'
    });
  };

  return (
    <Card className="bg-slate-950/80 backdrop-blur-xl cyber-border p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-orange-500/20 border border-orange-500/30">
            <Layers className="w-6 h-6 text-orange-400" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-orange-400 glow-text font-mono">
              GEOSPATIAL RISK OVERLAY
            </h3>
            <p className="text-xs text-slate-400 font-mono">Multi-Factor Risk Visualization</p>
          </div>
        </div>
        <Badge className="bg-orange-500/20 text-orange-400 border-orange-500/30 font-mono">
          {getActiveLayerName().toUpperCase()}
        </Badge>
      </div>

      {/* Layer Controls */}
      <div className="flex flex-wrap gap-2 mb-4">
        <Button
          size="sm"
          onClick={() => toggleLayer('climate')}
          className={`font-mono text-xs ${layers.climate ? 'bg-red-500/20 text-red-400 border-red-500/30' : 'bg-slate-800/50 text-slate-400 border-slate-600/30'}`}
        >
          <CloudRain className="w-3 h-3 mr-1" />
          CLIMATE
        </Button>
        <Button
          size="sm"
          onClick={() => toggleLayer('water')}
          className={`font-mono text-xs ${layers.water ? 'bg-blue-500/20 text-blue-400 border-blue-500/30' : 'bg-slate-800/50 text-slate-400 border-slate-600/30'}`}
        >
          <Droplets className="w-3 h-3 mr-1" />
          WATER
        </Button>
        <Button
          size="sm"
          onClick={() => toggleLayer('food')}
          className={`font-mono text-xs ${layers.food ? 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30' : 'bg-slate-800/50 text-slate-400 border-slate-600/30'}`}
        >
          <Wheat className="w-3 h-3 mr-1" />
          FOOD
        </Button>
        <Button
          size="sm"
          onClick={() => toggleLayer('political')}
          className={`font-mono text-xs ${layers.political ? 'bg-purple-500/20 text-purple-400 border-purple-500/30' : 'bg-slate-800/50 text-slate-400 border-slate-600/30'}`}
        >
          <Shield className="w-3 h-3 mr-1" />
          POLITICAL
        </Button>
      </div>

      {/* Map */}
      <div className="relative h-[400px] rounded-lg overflow-hidden cyber-border">
        <MapContainer
          center={[20, 40]}
          zoom={2}
          style={{ height: '100%', width: '100%', background: '#0a0e27' }}
          zoomControl={false}
        >
          <TileLayer
            url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          />

          {riskData.map((region, idx) => {
            const riskValue = getActiveRiskValue(region);
            const color = getRiskColor(riskValue);
            
            return (
              <CircleMarker
                key={idx}
                center={[region.lat, region.lng]}
                radius={Math.max(15, riskValue / 3)}
                pathOptions={{
                  color: color,
                  fillColor: color,
                  fillOpacity: 0.4,
                  weight: 2
                }}
              >
                <Popup className="risk-popup">
                  <div className="bg-slate-950 p-3 rounded-lg min-w-[200px]">
                    <div className="text-green-400 font-mono font-bold mb-2">{region.name}</div>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-slate-400 font-mono text-xs">Climate Risk:</span>
                        <Badge className={`${region.climate >= 70 ? 'bg-red-500/20 text-red-400' : 'bg-green-500/20 text-green-400'} font-mono text-xs`}>
                          {region.climate}%
                        </Badge>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-slate-400 font-mono text-xs">Water Scarcity:</span>
                        <Badge className={`${region.water >= 70 ? 'bg-red-500/20 text-red-400' : 'bg-green-500/20 text-green-400'} font-mono text-xs`}>
                          {region.water}%
                        </Badge>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-slate-400 font-mono text-xs">Food Risk:</span>
                        <Badge className={`${region.food >= 70 ? 'bg-red-500/20 text-red-400' : 'bg-green-500/20 text-green-400'} font-mono text-xs`}>
                          {region.food}%
                        </Badge>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-slate-400 font-mono text-xs">Political Risk:</span>
                        <Badge className={`${region.political >= 70 ? 'bg-red-500/20 text-red-400' : 'bg-green-500/20 text-green-400'} font-mono text-xs`}>
                          {region.political}%
                        </Badge>
                      </div>
                    </div>
                  </div>
                </Popup>
              </CircleMarker>
            );
          })}
        </MapContainer>

        <MapLegend layers={layers} />
      </div>

      {/* Risk Summary */}
      <div className="grid grid-cols-4 gap-3 mt-4">
        {['climate', 'water', 'food', 'political'].map(type => {
          const avgRisk = Math.round(riskData.reduce((acc, r) => acc + r[type], 0) / riskData.length);
          const icons = { climate: CloudRain, water: Droplets, food: Wheat, political: Shield };
          const Icon = icons[type];
          
          return (
            <div key={type} className="bg-slate-900/50 cyber-border rounded-lg p-3 text-center">
              <Icon className="w-5 h-5 mx-auto mb-2 text-slate-400" />
              <div className="text-xs text-slate-400 font-mono uppercase mb-1">{type}</div>
              <div className={`text-lg font-bold font-mono ${avgRisk >= 70 ? 'text-red-400' : avgRisk >= 50 ? 'text-yellow-400' : 'text-green-400'}`}>
                {avgRisk}%
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
}