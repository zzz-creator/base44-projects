import * as React from 'react';
const { useState } = React;
import { AlertTriangle, Zap, Activity, TrendingDown } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../components/ui/select";

const FAULT_TYPES = {
  HARD_FAILURE: {
    id: 'HARD_FAILURE',
    name: 'Hard Failure',
    description: 'Complete system failure',
    /** @type {any} */
    icon: Zap,
    color: 'text-red-400'
  },
  INTERMITTENT: {
    id: 'INTERMITTENT',
    name: 'Intermittent Failure',
    description: 'Random failures during operation',
    /** @type {any} */
    icon: Activity,
    color: 'text-orange-400'
  },
  SENSOR_DRIFT: {
    id: 'SENSOR_DRIFT',
    name: 'Sensor Drift',
    description: 'Gradual degradation over time',
    /** @type {any} */
    icon: TrendingDown,
    color: 'text-yellow-400'
  },
  LOGIC_ERROR: {
    id: 'LOGIC_ERROR',
    name: 'Logic Error',
    description: 'Incorrect computation results',
    /** @type {any} */
    icon: AlertTriangle,
    color: 'text-amber-400'
  }
};

export default function FaultInjector({ 
  subsystems, 
  faultConfig, 
  onUpdateFault,
  onClearFaults,
  addLog 
}) {
  const [selectedSubsystem, setSelectedSubsystem] = useState(null);

  const handleAddFault = (subsystemId) => {
    const newFault = {
      type: 'HARD_FAILURE',
      probability: 1.0,
      duration: 0,
      parameters: {}
    };
    onUpdateFault(subsystemId, newFault);
    addLog('info', `Fault configured for ${subsystems.find(s => s.id === subsystemId)?.name}`, true);
  };

  const handleUpdateFault = (subsystemId, updates) => {
    const existing = faultConfig[subsystemId] || {};
    onUpdateFault(subsystemId, { ...existing, ...updates });
  };

  const handleRemoveFault = (subsystemId) => {
    onUpdateFault(subsystemId, null);
    addLog('info', `Fault removed from ${subsystems.find(s => s.id === subsystemId)?.name}`, true);
  };

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2 bg-[#1a1a2e] border-b border-[#2a2a3e] flex-shrink-0">
        <span className="text-xs font-mono uppercase tracking-wider text-gray-400">
          Fault Injection
        </span>
        {Object.keys(faultConfig).length > 0 && (
          <button
            onClick={onClearFaults}
            className="text-xs text-red-400 hover:text-red-300"
          >
            Clear All
          </button>
        )}
      </div>
      
      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto p-3 space-y-3">
          {subsystems.map((subsystem) => {
            const Icon = subsystem.icon;
            const hasFault = faultConfig[subsystem.id];
            const faultType = hasFault ? FAULT_TYPES[hasFault.type] : null;
            
            return (
              <div
                key={subsystem.id}
                className={`p-3 rounded border ${
                  hasFault 
                    ? 'bg-orange-500/10 border-orange-500/30' 
                    : 'bg-[#1a1a2e] border-[#2a2a3e]'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    {/* @ts-ignore */}
                    <Icon className={`w-4 h-4 ${hasFault ? 'text-orange-400' : 'text-gray-500'}`} />
                    <span className="text-xs font-bold text-gray-200">{subsystem.name}</span>
                  </div>
                  
                  {!hasFault ? (
                    <button
                      onClick={() => handleAddFault(subsystem.id)}
                      className="px-2 py-1 bg-orange-600/20 hover:bg-orange-600/30 border border-orange-600/50 text-orange-400 text-xs rounded"
                    >
                      Inject Fault
                    </button>
                  ) : (
                    <button
                      onClick={() => handleRemoveFault(subsystem.id)}
                      className="px-2 py-1 bg-green-600/20 hover:bg-green-600/30 border border-green-600/50 text-green-400 text-xs rounded"
                    >
                      Remove Fault
                    </button>
                  )}
                </div>
                
                {hasFault && (
                  <div className="space-y-2 mt-3 pt-3 border-t border-[#2a2a3e]">
                    {/* Fault Type Selection */}
                    <div>
                      <label className="text-xs text-gray-500 block mb-1">Fault Type</label>
                      {/* @ts-ignore */}
                      <Select
                        value={hasFault.type}
                        onValueChange={(value) => handleUpdateFault(subsystem.id, { type: value })}
                      >
                        {/* @ts-ignore */}
                        <SelectTrigger className="bg-[#0a0a0f] border-[#2a2a3e] text-xs h-8">
                          <SelectValue />
                        </SelectTrigger>
                        {/* @ts-ignore */}
                        <SelectContent>
                          {Object.values(FAULT_TYPES).map((ft) => {
                            const FaultIcon = ft.icon;
                            return (
                              /* @ts-ignore */
                              <SelectItem key={ft.id} value={ft.id}>
                                <div className="flex items-center gap-2">
                                  {/* @ts-ignore */}
                                  <FaultIcon className={`w-3 h-3 ${ft.color}`} />
                                  <span className="text-xs">{ft.name}</span>
                                </div>
                              </SelectItem>
                            );
                          })}
                        </SelectContent>
                      </Select>
                      {faultType && (
                        <p className="text-xs text-gray-500 mt-1">{faultType.description}</p>
                      )}
                    </div>
                    
                    {/* Probability for Intermittent Faults */}
                    {hasFault.type === 'INTERMITTENT' && (
                      <div>
                        <label className="text-xs text-gray-500 block mb-1">
                          Failure Probability: {Math.round(hasFault.probability * 100)}%
                        </label>
                        <input
                          type="range"
                          min="0"
                          max="1"
                          step="0.1"
                          value={hasFault.probability}
                          onChange={(e) => handleUpdateFault(subsystem.id, { 
                            probability: parseFloat(e.target.value) 
                          })}
                          className="w-full"
                        />
                      </div>
                    )}
                    
                    {/* Drift Rate for Sensor Drift */}
                    {hasFault.type === 'SENSOR_DRIFT' && (
                      <div>
                        <label className="text-xs text-gray-500 block mb-1">
                          Drift Rate: {hasFault.parameters?.driftRate || 1}x
                        </label>
                        <input
                          type="range"
                          min="0.5"
                          max="3"
                          step="0.5"
                          value={hasFault.parameters?.driftRate || 1}
                          onChange={(e) => handleUpdateFault(subsystem.id, { 
                            parameters: { driftRate: parseFloat(e.target.value) }
                          })}
                          className="w-full"
                        />
                      </div>
                    )}
                    
                    {/* Error Magnitude for Logic Errors */}
                    {hasFault.type === 'LOGIC_ERROR' && (
                      <div>
                        <label className="text-xs text-gray-500 block mb-1">
                          Error Magnitude: {hasFault.parameters?.errorMagnitude || 5}%
                        </label>
                        <input
                          type="range"
                          min="1"
                          max="50"
                          step="1"
                          value={hasFault.parameters?.errorMagnitude || 5}
                          onChange={(e) => handleUpdateFault(subsystem.id, { 
                            parameters: { errorMagnitude: parseInt(e.target.value) }
                          })}
                          className="w-full"
                        />
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}

          {/* Active Faults Summary */}
          {Object.keys(faultConfig).length > 0 && (
            <div className="bg-orange-500/10 border border-orange-500/30 rounded p-3">
              <div className="flex items-center gap-2 mb-2">
                {/* @ts-ignore */}
                <AlertTriangle className="w-4 h-4 text-orange-400" />
                <span className="text-xs font-bold text-orange-400">
                  {Object.keys(faultConfig).length} Active Fault(s)
                </span>
              </div>
              <div className="space-y-1">
                {Object.entries(faultConfig).map(([subsystemId, fault]) => {
                  const subsystem = subsystems.find(s => s.id === subsystemId);
                  const faultType = FAULT_TYPES[fault.type];
                  return (
                    <div key={subsystemId} className="text-xs text-gray-300">
                      <span className="text-gray-400">{subsystem?.name}:</span>{' '}
                      <span className={faultType.color}>{faultType.name}</span>
                      {fault.type === 'INTERMITTENT' && ` (${Math.round(fault.probability * 100)}%)`}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
    </div>
  );
}