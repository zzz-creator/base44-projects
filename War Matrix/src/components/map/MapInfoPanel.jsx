import React from 'react';
import { Card } from '../ui/card';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { X, AlertTriangle, Satellite, Zap, Globe, Users, Skull, DollarSign } from 'lucide-react';

export default function MapInfoPanel({ selectedItem, onClose }) {
  if (!selectedItem) return null;

  const renderContent = () => {
    switch (selectedItem.type) {
      case 'threat':
        return (
          <>
            <div className="flex items-center gap-2 mb-3">
              <AlertTriangle className="w-6 h-6 text-red-400" />
              <h3 className="text-xl font-bold text-red-400 font-mono">THREAT ZONE</h3>
            </div>

            <h4 className="text-lg font-bold text-yellow-400 font-mono mb-3">
              {selectedItem.data.name}
            </h4>

            <div className="mb-4 p-4 bg-red-950/30 cyber-border rounded">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-slate-400 font-mono">Threat Level</span>
                <Badge className="bg-red-500/20 text-red-400 border-red-500/30 font-mono">
                  {selectedItem.data.threat_level}
                </Badge>
              </div>
              <div className="text-3xl font-bold text-red-400 font-mono">
                {selectedItem.data.risk_score}/100
              </div>
            </div>

            <p className="text-slate-300 text-sm font-mono mb-4 leading-relaxed">
              {selectedItem.data.description}
            </p>

            {selectedItem.data.factors && selectedItem.data.factors.length > 0 && (
              <div className="mb-4">
                <div className="text-xs text-slate-500 font-mono mb-2">Contributing Factors:</div>
                <div className="flex flex-wrap gap-2">
                  {selectedItem.data.factors.map((factor, i) => (
                    <Badge key={i} variant="outline" className="border-orange-500/30 text-orange-400 font-mono text-xs">
                      {factor}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {selectedItem.data.active_units && (
              <div className="p-3 bg-slate-900/50 cyber-border rounded">
                <div className="text-xs text-slate-500 font-mono mb-1">Active Military Units</div>
                <div className="text-2xl font-bold text-cyan-400 font-mono">
                  {selectedItem.data.active_units.toLocaleString()}
                </div>
              </div>
            )}
          </>
        );

      case 'anomaly':
        return (
          <>
            <div className="flex items-center gap-2 mb-3">
              <Satellite className="w-6 h-6 text-orange-400" />
              <h3 className="text-xl font-bold text-orange-400 font-mono">SATELLITE ANOMALY</h3>
            </div>

            <h4 className="text-lg font-bold text-yellow-400 font-mono mb-2">
              {selectedItem.data.location}
            </h4>

            <Badge className="mb-4 bg-orange-500/20 text-orange-400 border-orange-500/30 font-mono">
              {selectedItem.data.anomaly_type}
            </Badge>

            <p className="text-slate-300 text-sm font-mono mb-4 leading-relaxed">
              {selectedItem.data.analysis}
            </p>

            <div className="flex items-center justify-between p-3 bg-slate-900/50 cyber-border rounded font-mono text-sm">
              <span className="text-slate-500">{selectedItem.data.timestamp}</span>
              <Badge className="bg-red-500/20 text-red-400 border-red-500/30">
                {selectedItem.data.severity}
              </Badge>
            </div>
          </>
        );

      case 'flashpoint':
        return (
          <>
            <div className="flex items-center gap-2 mb-3">
              <Zap className="w-6 h-6 text-yellow-400" />
              <h3 className="text-xl font-bold text-yellow-400 font-mono">FLASHPOINT</h3>
            </div>

            <h4 className="text-lg font-bold text-cyan-400 font-mono mb-3">
              {selectedItem.data.region_name}
            </h4>

            <div className="mb-4 p-4 bg-yellow-950/30 cyber-border rounded">
              <div className="text-sm text-slate-400 font-mono mb-1">Risk Score</div>
              <div className="text-3xl font-bold text-yellow-400 font-mono">
                {selectedItem.data.risk_score || selectedItem.data.escalation_probability}/100
              </div>
            </div>

            <p className="text-slate-300 text-sm font-mono mb-4 leading-relaxed">
              {selectedItem.data.analysis || selectedItem.data.location}
            </p>

            {selectedItem.data.involved_parties && selectedItem.data.involved_parties.length > 0 && (
              <div>
                <div className="text-xs text-slate-500 font-mono mb-2">Involved Parties:</div>
                <div className="flex flex-wrap gap-2">
                  {selectedItem.data.involved_parties.map((party, i) => (
                    <Badge key={i} variant="outline" className="border-yellow-500/30 text-yellow-400 font-mono text-xs">
                      {party}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </>
        );

      case 'country':
        return (
          <>
            <div className="flex items-center gap-2 mb-3">
              <Globe className="w-6 h-6 text-green-400" />
              <h3 className="text-xl font-bold text-green-400 font-mono">COUNTRY DATA</h3>
            </div>

            <h4 className="text-2xl font-bold text-cyan-400 font-mono mb-2">
              {selectedItem.data.country_name}
            </h4>

            <Badge className="mb-4 bg-cyan-500/20 text-cyan-400 border-cyan-500/30 font-mono">
              {selectedItem.data.side?.toUpperCase()}
            </Badge>

            <div className="grid grid-cols-2 gap-3 mb-4">
              <div className="p-3 bg-slate-900/50 cyber-border rounded">
                <div className="flex items-center gap-2 mb-1">
                  <Users className="w-4 h-4 text-green-400" />
                  <span className="text-xs text-slate-400 font-mono">Army Size</span>
                </div>
                <div className="text-lg font-bold text-green-400 font-mono">
                  {selectedItem.data.army_size?.toLocaleString() || 'N/A'}
                </div>
              </div>

              <div className="p-3 bg-slate-900/50 cyber-border rounded">
                <div className="flex items-center gap-2 mb-1">
                  <Skull className="w-4 h-4 text-red-400" />
                  <span className="text-xs text-slate-400 font-mono">Casualties</span>
                </div>
                <div className="text-lg font-bold text-red-400 font-mono">
                  {selectedItem.data.casualties?.toLocaleString() || '0'}
                </div>
              </div>

              <div className="p-3 bg-slate-900/50 cyber-border rounded col-span-2">
                <div className="flex items-center gap-2 mb-1">
                  <DollarSign className="w-4 h-4 text-yellow-400" />
                  <span className="text-xs text-slate-400 font-mono">Military Budget</span>
                </div>
                <div className="text-lg font-bold text-yellow-400 font-mono">
                  ${(selectedItem.data.military_budget / 1e9).toFixed(1)}B
                </div>
              </div>
            </div>

            {selectedItem.data.coordinates && (
              <div className="p-3 bg-slate-950/50 cyber-border rounded text-xs font-mono text-slate-400">
                <div>Lat: {selectedItem.data.coordinates.latitude?.toFixed(4)}</div>
                <div>Lng: {selectedItem.data.coordinates.longitude?.toFixed(4)}</div>
              </div>
            )}
          </>
        );

      default:
        return null;
    }
  };

  return (
    <Card className="bg-slate-950/95 backdrop-blur-xl cyber-border p-6 min-w-[350px] max-w-[400px] max-h-[80vh] overflow-y-auto">
      <div className="flex items-start justify-between mb-4">
        <div className="text-xs text-slate-500 font-mono uppercase">Selected Item</div>
        <Button
          size="icon"
          variant="ghost"
          onClick={onClose}
          className="h-6 w-6 text-slate-400 hover:text-red-400"
        >
          <X className="w-4 h-4" />
        </Button>
      </div>

      {renderContent()}
    </Card>
  );
}