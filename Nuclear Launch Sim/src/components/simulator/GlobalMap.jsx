
import * as React from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, Circle } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { Target, Navigation } from 'lucide-react';

// Fix for default Leaflet icon issues in React
// @ts-ignore
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Custom Icons
const targetIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

const launchIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

export default function GlobalMap({ targetCoords, launchCoords, currentPhase }) {
  const [map, setMap] = React.useState(null);

  // Default to somewhere in the Atlantic if no coords
  /** @type {[number, number]} */
  const center = [30, -40]; 
  
  // Calculate trajectory path (Great Circle approximation) if both points exist
  const getTrajectory = () => {
    if (!launchCoords || !targetCoords) return [];
    
    // Simple linear interpolation for now (could be upgraded to true geodesic)
    return [
      [launchCoords.lat, launchCoords.lon],
      [targetCoords.lat, targetCoords.lon]
    ];
  };

  const trajectory = React.useMemo(() => getTrajectory(), [launchCoords, targetCoords]);

  React.useEffect(() => {
    if (map && targetCoords && launchCoords) {
      const bounds = L.latLngBounds([
        [launchCoords.lat, launchCoords.lon],
        [targetCoords.lat, targetCoords.lon]
      ]);
      map.fitBounds(bounds, { padding: [50, 50] });
    }
  }, [map, targetCoords, launchCoords]);

  // Map theme: Dark matter style using CartoDB Dark Matter tiles
  return (
    <div className="h-full w-full rounded-lg overflow-hidden border border-[#2a2a3e] relative bg-[#0a0a0f]" style={{ zIndex: 1 }}>
      <div className="absolute top-2 left-2 z-[1000] bg-black/80 backdrop-blur border border-white/10 px-2 py-1 rounded text-[10px] sm:text-xs font-mono text-cyan-400">
        <div className="flex items-center gap-2">
            <Navigation className="w-3 h-3" />
            <span>TRAJECTORY PLOT</span>
        </div>
      </div>
      
      <MapContainer 
        // @ts-ignore
        center={center} 
        zoom={2} 
        style={{ height: '100%', width: '100%', background: '#0a0a0f' }}
        zoomControl={false}
        ref={setMap}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
          subdomains='abcd'
          maxZoom={19}
        />
        
        {launchCoords && (
            // @ts-ignore
            <Marker position={[launchCoords.lat, launchCoords.lon]} icon={launchIcon}>
                <Popup className="font-mono text-xs">
                    <strong>LAUNCH SITE</strong><br/>
                    {launchCoords.lat.toFixed(4)}, {launchCoords.lon.toFixed(4)}
                </Popup>
            </Marker>
        )}

        {targetCoords && (
            // @ts-ignore
            <Marker position={[targetCoords.lat, targetCoords.lon]} icon={targetIcon}>
                 <Popup className="font-mono text-xs">
                    <strong>TARGET</strong><br/>
                    {targetCoords.lat.toFixed(4)}, {targetCoords.lon.toFixed(4)}
                </Popup>
            </Marker>
        )}
        
        {/* Trajectory Line */}
        {trajectory.length > 0 && (
            <Polyline 
                positions={trajectory} 
                pathOptions={{ 
                    color: currentPhase >= 4 ? '#ef4444' : '#0ea5e9', // Red if authorized, Blue otherwise
                    weight: 2, 
                    dashArray: currentPhase >= 5 ? null : '5, 10', // Solid if launched
                    opacity: 0.7 
                }} 
            />
        )}
        
        {/* Impact Radius */}
        {targetCoords && (
             <Circle 
                center={[targetCoords.lat, targetCoords.lon]}
                pathOptions={{ 
                    color: '#ef4444', 
                    fillColor: '#ef4444', 
                    fillOpacity: 0.2,
                    weight: 1 
                }}
                radius={500000} // 500km blast radius visualization
             />
        )}

      </MapContainer>
    </div>
  );
}
