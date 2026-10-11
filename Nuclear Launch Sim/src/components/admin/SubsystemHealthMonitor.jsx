import * as React from 'react';
const { useState, useEffect } = React;
import { Activity, AlertTriangle, CheckCircle, XCircle, TrendingUp, History, Wrench, Edit2 } from 'lucide-react';
{/* @ts-ignore */}
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';

export default function SubsystemHealthMonitor({ subsystems, diagnostics, faultConfig, addLog, onHealthOverride }) {
  const [healthHistory, setHealthHistory] = useState({});
  const [selectedSubsystem, setSelectedSubsystem] = useState(null);
  const [anomalies, setAnomalies] = useState([]);
  const [manualHealth, setManualHealth] = useState({});
  const [editingSubsystem, setEditingSubsystem] = useState(null);

  // Track health over time
  useEffect(() => {
    if (!diagnostics || Object.keys(diagnostics).length === 0) return;

    const timestamp = new Date().toLocaleTimeString();
    
    setHealthHistory(prev => {
      const newHistory = { ...prev };
      
      subsystems.forEach(sub => {
        if (!newHistory[sub.id]) {
          newHistory[sub.id] = [];
        }
        
        const status = diagnostics[sub.id];
        const healthScore = status === 'PASS' ? 100 : status === 'DEGRADED' ? 60 : status === 'FAILED' ? 0 : 50;
        
        newHistory[sub.id] = [...(newHistory[sub.id] || []).slice(-19), {
          timestamp,
          health: healthScore,
          status
        }];
      });
      
      return newHistory;
    });

    // Detect anomalies
    subsystems.forEach(sub => {
      const history = healthHistory[sub.id] || [];
      if (history.length >= 3) {
        const recent = history.slice(-3);
        const declining = recent.every((h, i) => i === 0 || h.health < recent[i-1].health);
        
        if (declining && diagnostics[sub.id] !== 'PASS') {
          const anomalyKey = `${sub.id}-declining`;
          if (!anomalies.find(a => a.key === anomalyKey && Date.now() - a.timestamp < 60000)) {
            setAnomalies(prev => [...prev.slice(-9), {
              key: anomalyKey,
              subsystem: sub.name,
              type: 'Declining Health',
              message: `${sub.name} showing continuous health decline`,
              timestamp: Date.now()
            }]);
            addLog('warning', `Anomaly detected: ${sub.name} health declining`, true);
          }
        }
      }
    });
  }, [diagnostics, subsystems, addLog]);

  const getHealthValue = (subId) => {
    if (manualHealth[subId] !== undefined) return manualHealth[subId];
    const status = diagnostics[subId];
    return status === 'PASS' ? 100 : status === 'DEGRADED' ? 60 : status === 'FAILED' ? 0 : 50;
  };

  const getAverageHealth = (subId) => {
    const history = healthHistory[subId] || [];
    if (history.length === 0) return getHealthValue(subId);
    const sum = history.reduce((acc, h) => acc + h.health, 0);
    return Math.round(sum / history.length);
  };

  const handleHealthChange = (subId, value) => {
    const newValue = Math.max(0, Math.min(100, parseInt(value) || 0));
    setManualHealth(prev => ({ ...prev, [subId]: newValue }));
    addLog('info', `Manual health override: ${subsystems.find(s => s.id === subId)?.name} set to ${newValue}%`, true);
    if (onHealthOverride) onHealthOverride(subId, newValue);
  };

  const getOverallHealth = () => {
    if (!subsystems || subsystems.length === 0) return 0;
    
    let total = 0;
    subsystems.forEach(sub => {
      total += getHealthValue(sub.id);
    });
    
    return Math.round(total / subsystems.length);
  };

  const getHealthColor = (health) => {
    if (health >= 80) return 'text-green-400';
    if (health >= 50) return 'text-yellow-400';
    return 'text-red-400';
  };

  const getHealthBgColor = (health) => {
    if (health >= 80) return 'bg-green-500';
    if (health >= 50) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  const overallHealth = getOverallHealth();
  const selected = selectedSubsystem ? subsystems.find(s => s.id === selectedSubsystem) : null;

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2 bg-[#1a1a2e] border-b border-[#2a2a3e] flex-shrink-0">
        <span className="text-xs font-mono uppercase tracking-wider text-gray-400">
          Subsystem Health
        </span>
        <div className="flex items-center gap-2">
          {/* @ts-ignore */}
          <Activity className={`w-4 h-4 ${getHealthColor(overallHealth)}`} />
          <span className={`text-xs font-bold ${getHealthColor(overallHealth)}`}>
            {overallHealth}%
          </span>
        </div>
      </div>

      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto p-3 space-y-3">
        {/* Overall Health Bar */}
        <div className="h-2 bg-[#1a1a2e] rounded-full overflow-hidden">
          <div 
            className={`h-full transition-all duration-500 ${getHealthBgColor(overallHealth)}`}
            style={{ width: `${overallHealth}%` }}
          />
        </div>

        {/* Subsystem Grid */}
        <div className="grid grid-cols-3 gap-2">
          {subsystems.map((sub) => {
            const Icon = sub.icon;
            const health = getHealthValue(sub.id);
            const avgHealth = getAverageHealth(sub.id);
            const hasFault = !!faultConfig[sub.id];
            const isSelected = selectedSubsystem === sub.id;
            const isEditing = editingSubsystem === sub.id;
            const hasManualOverride = manualHealth[sub.id] !== undefined;
            
            return (
              <div
                key={sub.id}
                className={`p-2 rounded border text-center transition-all ${
                  isSelected 
                    ? 'bg-blue-500/10 border-blue-500/50' 
                    : health === 0
                    ? 'bg-red-500/10 border-red-500/30'
                    : health < 80
                    ? 'bg-orange-500/10 border-orange-500/30'
                    : 'bg-[#1a1a2e] border-[#2a2a3e] hover:border-[#3a3a4e]'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <button onClick={() => setSelectedSubsystem(isSelected ? null : sub.id)}>
                    {/* @ts-ignore */}
                    <Icon className={`w-3 h-3 ${getHealthColor(health)}`} />
                  </button>
                  <div className="flex items-center gap-1">
                    {/* @ts-ignore */}
                    {hasFault && <AlertTriangle className="w-2 h-2 text-orange-400" />}
                    {/* @ts-ignore */}
                    {hasManualOverride && <Edit2 className="w-2 h-2 text-blue-400" />}
                  </div>
                </div>
                <p className="text-xs text-gray-400 truncate">{sub.name.split(' ')[0]}</p>
                
                {isEditing ? (
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={health}
                    onChange={(e) => handleHealthChange(sub.id, e.target.value)}
                    onBlur={() => setEditingSubsystem(null)}
                    onKeyDown={(e) => e.key === 'Enter' && setEditingSubsystem(null)}
                    autoFocus
                    className="w-full text-xs font-bold bg-[#0a0a0f] border border-[#2a2a3e] rounded px-1 py-0.5 text-center"
                  />
                ) : (
                  <button 
                    onClick={() => setEditingSubsystem(sub.id)}
                    className={`text-xs font-bold ${getHealthColor(health)} hover:underline`}
                  >
                    {health}%
                  </button>
                )}
                <p className="text-xs text-gray-500">avg: {avgHealth}%</p>
              </div>
            );
          })}
        </div>

        {/* Selected Subsystem Details */}
        {selected && healthHistory[selected.id]?.length > 1 && (
          <div className="pt-3 border-t border-[#2a2a3e]">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs text-gray-400 flex items-center gap-1">
                <History className="w-3 h-3" />
                {selected.name} History
              </p>
              <p className="text-xs text-gray-500">
                Status: {diagnostics[selected.id] || 'PENDING'}
              </p>
            </div>
            <div className="h-24">
              {/* @ts-ignore */}
              <ResponsiveContainer width="100%" height="100%">
                {/* @ts-ignore */}
                <LineChart data={healthHistory[selected.id]}>
                  {/* @ts-ignore */}
                  <XAxis dataKey="timestamp" hide />
                  {/* @ts-ignore */}
                  <YAxis hide domain={[0, 100]} />
                  {/* @ts-ignore */}
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: '#1a1a2e', 
                      border: '1px solid #2a2a3e',
                      borderRadius: '4px',
                      fontSize: '10px'
                    }}
                    formatter={(value) => [`${value}%`, 'Health']}
                  />
                  {/* @ts-ignore */}
                  <Line 
                    type="monotone" 
                    dataKey="health" 
                    stroke="#3b82f6" 
                    strokeWidth={2}
                    dot={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* Anomalies */}
        {anomalies.length > 0 && (
          <div className="pt-3 border-t border-[#2a2a3e]">
            <p className="text-xs text-gray-500 mb-2 flex items-center gap-1">
              {/* @ts-ignore */}
              <AlertTriangle className="w-3 h-3 text-orange-400" />
              Detected Anomalies
            </p>
            <div className="space-y-1 max-h-16 overflow-y-auto">
              {anomalies.slice(-3).reverse().map((anomaly, idx) => (
                <div key={idx} className="text-xs px-2 py-1 bg-orange-500/10 text-orange-400 rounded">
                  {anomaly.message}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}