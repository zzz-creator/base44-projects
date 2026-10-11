import React, { useState } from 'react';
import { Zap, Radio, Wifi, Cpu, Database, Power, AlertTriangle, CheckCircle, XCircle, Settings, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const SUBSYSTEM_POSITIONS = {
  reactor: { x: 50, y: 20, connections: ['power'] },
  power: { x: 50, y: 50, connections: ['targeting', 'comms', 'guidance', 'datalink'] },
  targeting: { x: 20, y: 35, connections: [] },
  comms: { x: 80, y: 35, connections: ['datalink'] },
  guidance: { x: 20, y: 65, connections: [] },
  datalink: { x: 80, y: 65, connections: [] }
};

const FAULT_TYPES = [
  { id: 'HARD_FAILURE', name: 'Hard Failure', color: 'red' },
  { id: 'INTERMITTENT', name: 'Intermittent', color: 'orange' },
  { id: 'SENSOR_DRIFT', name: 'Sensor Drift', color: 'yellow' },
  { id: 'LOGIC_ERROR', name: 'Logic Error', color: 'purple' }
];

export default function InteractiveSystemDiagram({ 
  subsystems, 
  diagnostics, 
  faultConfig, 
  environmentFactors,
  onUpdateFault,
  addLog 
}) {
  const [selectedSubsystem, setSelectedSubsystem] = useState(null);
  const [showFaultPanel, setShowFaultPanel] = useState(false);

  const getStatusColor = (subsystemId) => {
    const status = diagnostics[subsystemId];
    const hasFault = !!faultConfig[subsystemId];
    
    if (status === 'FAILED') return '#ef4444';
    if (status === 'DEGRADED') return '#f97316';
    if (status === 'PASS') return '#22c55e';
    if (hasFault) return '#f59e0b';
    return '#6b7280';
  };

  const getStatusGlow = (subsystemId) => {
    const status = diagnostics[subsystemId];
    if (status === 'FAILED') return '0 0 20px #ef4444';
    if (status === 'DEGRADED') return '0 0 15px #f97316';
    if (status === 'PASS') return '0 0 10px #22c55e';
    return 'none';
  };

  const getConnectionOpacity = (fromId, toId) => {
    const fromStatus = diagnostics[fromId];
    const toStatus = diagnostics[toId];
    
    if (fromStatus === 'FAILED' || toStatus === 'FAILED') return 0.2;
    if (fromStatus === 'DEGRADED' || toStatus === 'DEGRADED') return 0.5;
    return 1;
  };

  const getEnvironmentEffect = (subsystemId) => {
    if (!environmentFactors) return null;
    
    const weatherDegradation = environmentFactors.weather?.degradation || 0;
    const timeModifier = environmentFactors.timePeriod?.modifier || 1;
    
    if (subsystemId === 'comms' && weatherDegradation > 0.1) {
      return { type: 'weather', message: `Signal degraded by weather (-${Math.round(weatherDegradation * 100)}%)` };
    }
    if (subsystemId === 'targeting' && timeModifier < 1) {
      return { type: 'time', message: `Reduced visibility (${environmentFactors.timePeriod?.name})` };
    }
    return null;
  };

  const handleSubsystemClick = (subsystem) => {
    setSelectedSubsystem(subsystem);
    setShowFaultPanel(true);
  };

  const handleInjectFault = (faultType, probability = 1.0) => {
    if (!selectedSubsystem) return;
    
    const fault = {
      type: faultType,
      probability: faultType === 'INTERMITTENT' ? probability : 1.0
    };
    
    onUpdateFault(selectedSubsystem.id, fault);
    addLog('warning', `Fault injected on ${selectedSubsystem.name}: ${faultType}`, true);
  };

  const handleClearFault = () => {
    if (!selectedSubsystem) return;
    onUpdateFault(selectedSubsystem.id, null);
    addLog('info', `Fault cleared on ${selectedSubsystem.name}`, true);
  };

  const getSubsystemIcon = (id) => {
    const icons = {
      reactor: Zap,
      targeting: Radio,
      comms: Wifi,
      guidance: Cpu,
      datalink: Database,
      power: Power
    };
    return icons[id] || Cpu;
  };

  const selected = selectedSubsystem ? subsystems.find(s => s.id === selectedSubsystem.id) : null;

  return (
    <div className="relative w-full h-full bg-[#0a0a0f] rounded-lg border border-[#2a2a3e] overflow-hidden">
      {/* SVG Diagram */}
      <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="xMidYMid meet">
        {/* Connection Lines */}
        <defs>
          <linearGradient id="lineGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.5" />
            <stop offset="50%" stopColor="#3b82f6" stopOpacity="1" />
            <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.5" />
          </linearGradient>
          <filter id="glow">
            <feGaussianBlur stdDeviation="1" result="coloredBlur"/>
            <feMerge>
              <feMergeNode in="coloredBlur"/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>
        </defs>

        {/* Draw connections */}
        {Object.entries(SUBSYSTEM_POSITIONS).map(([fromId, fromPos]) => 
          fromPos.connections.map(toId => {
            const toPos = SUBSYSTEM_POSITIONS[toId];
            const opacity = getConnectionOpacity(fromId, toId);
            return (
              <line
                key={`${fromId}-${toId}`}
                x1={fromPos.x}
                y1={fromPos.y}
                x2={toPos.x}
                y2={toPos.y}
                stroke="#3b82f6"
                strokeWidth="0.5"
                strokeOpacity={opacity}
                strokeDasharray={opacity < 1 ? "2,2" : "none"}
              />
            );
          })
        )}

        {/* Draw subsystem nodes */}
        {subsystems.map(sub => {
          const pos = SUBSYSTEM_POSITIONS[sub.id];
          if (!pos) return null;
          
          const Icon = getSubsystemIcon(sub.id);
          const color = getStatusColor(sub.id);
          const envEffect = getEnvironmentEffect(sub.id);
          const hasFault = !!faultConfig[sub.id];
          const isSelected = selectedSubsystem?.id === sub.id;
          
          return (
            <g 
              key={sub.id} 
              transform={`translate(${pos.x}, ${pos.y})`}
              onClick={() => handleSubsystemClick(sub)}
              className="cursor-pointer"
            >
              {/* Outer ring for selection */}
              {isSelected && (
                <circle
                  r="8"
                  fill="none"
                  stroke="#3b82f6"
                  strokeWidth="0.5"
                  strokeDasharray="2,1"
                  className="animate-spin"
                  style={{ animationDuration: '10s' }}
                />
              )}
              
              {/* Environment effect indicator */}
              {envEffect && (
                <circle
                  r="7"
                  fill="none"
                  stroke="#f59e0b"
                  strokeWidth="0.3"
                  strokeDasharray="1,1"
                  opacity="0.7"
                />
              )}
              
              {/* Main node */}
              <circle
                r="5"
                fill="#1a1a2e"
                stroke={color}
                strokeWidth="0.8"
                filter="url(#glow)"
              />
              
              {/* Fault indicator */}
              {hasFault && (
                <circle
                  r="6.5"
                  fill="none"
                  stroke="#f97316"
                  strokeWidth="0.3"
                  strokeDasharray="1,2"
                  className="animate-pulse"
                />
              )}
              
              {/* Status indicator dot */}
              <circle
                cx="3"
                cy="-3"
                r="1.2"
                fill={color}
              />
              
              {/* Label */}
              <text
                y="10"
                textAnchor="middle"
                fill="#9ca3af"
                fontSize="2.5"
                fontFamily="monospace"
              >
                {sub.name.split(' ')[0].toUpperCase()}
              </text>
            </g>
          );
        })}
      </svg>

      {/* Legend */}
      <div className="absolute bottom-2 left-2 flex gap-3 text-xs">
        <div className="flex items-center gap-1">
          <div className="w-2 h-2 rounded-full bg-green-500" />
          <span className="text-gray-500">PASS</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-2 h-2 rounded-full bg-orange-500" />
          <span className="text-gray-500">DEGRADED</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-2 h-2 rounded-full bg-red-500" />
          <span className="text-gray-500">FAILED</span>
        </div>
      </div>

      {/* Environment Status */}
      {environmentFactors && environmentFactors.weather?.degradation > 0 && (
        <div className="absolute top-2 right-2 px-2 py-1 bg-yellow-500/20 border border-yellow-500/30 rounded text-xs text-yellow-400">
          ⚠ {environmentFactors.weather.name} conditions
        </div>
      )}

      {/* Detail Panel */}
      <AnimatePresence>
        {showFaultPanel && selected && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="absolute top-2 right-2 w-56 bg-[#12121a] border border-[#2a2a3e] rounded-lg shadow-xl overflow-hidden"
          >
            <div className="px-3 py-2 bg-[#1a1a2e] border-b border-[#2a2a3e] flex items-center justify-between">
              <span className="text-xs font-bold text-gray-300">{selected.name}</span>
              <button onClick={() => setShowFaultPanel(false)} className="text-gray-500 hover:text-gray-300">
                <X className="w-3 h-3" />
              </button>
            </div>
            
            <div className="p-3 space-y-3">
              {/* Status */}
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-500">Status:</span>
                <span className={`text-xs font-bold ${
                  diagnostics[selected.id] === 'PASS' ? 'text-green-400' :
                  diagnostics[selected.id] === 'DEGRADED' ? 'text-orange-400' :
                  diagnostics[selected.id] === 'FAILED' ? 'text-red-400' :
                  'text-gray-400'
                }`}>
                  {diagnostics[selected.id] || 'PENDING'}
                </span>
              </div>

              {/* Current Fault */}
              {faultConfig[selected.id] && (
                <div className="p-2 bg-orange-500/10 border border-orange-500/30 rounded">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-orange-400">Active Fault:</span>
                    <span className="text-xs text-orange-300">{faultConfig[selected.id].type}</span>
                  </div>
                  {faultConfig[selected.id].probability < 1 && (
                    <div className="text-xs text-gray-500 mt-1">
                      Probability: {Math.round(faultConfig[selected.id].probability * 100)}%
                    </div>
                  )}
                </div>
              )}

              {/* Environment Effect */}
              {getEnvironmentEffect(selected.id) && (
                <div className="p-2 bg-yellow-500/10 border border-yellow-500/30 rounded">
                  <div className="text-xs text-yellow-400">
                    {getEnvironmentEffect(selected.id).message}
                  </div>
                </div>
              )}

              {/* Fault Injection Controls */}
              <div className="space-y-1">
                <span className="text-xs text-gray-500">Inject Fault:</span>
                <div className="grid grid-cols-2 gap-1">
                  {FAULT_TYPES.map(fault => (
                    <button
                      key={fault.id}
                      onClick={() => handleInjectFault(fault.id)}
                      className={`px-2 py-1 text-xs rounded border transition-colors ${
                        faultConfig[selected.id]?.type === fault.id
                          ? 'bg-orange-500/20 border-orange-500/50 text-orange-400'
                          : 'bg-[#1a1a2e] border-[#2a2a3e] text-gray-400 hover:border-[#3a3a4e]'
                      }`}
                    >
                      {fault.name}
                    </button>
                  ))}
                </div>
              </div>

              {/* Clear Fault */}
              {faultConfig[selected.id] && (
                <button
                  onClick={handleClearFault}
                  className="w-full px-2 py-1 bg-green-600/20 hover:bg-green-600/30 border border-green-600/50 text-green-400 text-xs rounded transition-colors"
                >
                  Clear Fault
                </button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}