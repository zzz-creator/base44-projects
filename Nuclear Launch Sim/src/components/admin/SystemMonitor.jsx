import * as React from 'react';
const { useState, useEffect, useCallback } = React;
import { Activity, Cpu, HardDrive, Wifi, AlertTriangle, TrendingUp, TrendingDown, Minus, Bell, BellOff } from 'lucide-react';
{/* @ts-ignore */}
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';

const METRICS = [
  { id: 'cpu', name: 'CPU Usage', icon: Cpu, unit: '%', warningThreshold: 80, criticalThreshold: 95 },
  { id: 'memory', name: 'Memory', icon: HardDrive, unit: '%', warningThreshold: 75, criticalThreshold: 90 },
  { id: 'network', name: 'Network', icon: Wifi, unit: 'ms', warningThreshold: 100, criticalThreshold: 200 },
  { id: 'throughput', name: 'Throughput', icon: Activity, unit: 'ops/s', warningThreshold: null, criticalThreshold: null }
];

export default function SystemMonitor({ environmentFactors, subsystemStatus, addLog }) {
  const [metrics, setMetrics] = useState({
    cpu: 45,
    memory: 60,
    network: 25,
    throughput: 1250
  });
  const [history, setHistory] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [alertsEnabled, setAlertsEnabled] = useState(true);
  const [selectedMetric, setSelectedMetric] = useState('cpu');

  // Simulate real-time metrics
  useEffect(() => {
    const interval = setInterval(() => {
      const envModifier = environmentFactors?.overallModifier || 1;
      const failedSubsystems = Object.values(subsystemStatus || {}).filter(s => s === 'FAILED').length;
      const degradedSubsystems = Object.values(subsystemStatus || {}).filter(s => s === 'DEGRADED').length;
      
      const baseLoad = 40 + (failedSubsystems * 15) + (degradedSubsystems * 8);
      
      setMetrics(prev => {
        const newMetrics = {
          cpu: Math.min(100, Math.max(5, baseLoad + (Math.random() - 0.5) * 20)),
          memory: Math.min(100, Math.max(20, prev.memory + (Math.random() - 0.5) * 5)),
          network: Math.max(5, 20 / envModifier + (Math.random() * 30)),
          throughput: Math.max(100, 1500 * envModifier - (failedSubsystems * 200) + (Math.random() - 0.5) * 100)
        };
        
        // Check for alerts
        if (alertsEnabled) {
          METRICS.forEach(metric => {
            if (metric.criticalThreshold && newMetrics[metric.id] >= metric.criticalThreshold) {
              const alertMsg = `CRITICAL: ${metric.name} at ${Math.round(newMetrics[metric.id])}${metric.unit}`;
              if (!alerts.find(a => a.message === alertMsg && Date.now() - a.timestamp < 30000)) {
                setAlerts(prev => [...prev.slice(-9), { 
                  id: Date.now(), 
                  message: alertMsg, 
                  level: 'critical',
                  timestamp: Date.now()
                }]);
                addLog('error', alertMsg, true);
              }
            } else if (metric.warningThreshold && newMetrics[metric.id] >= metric.warningThreshold) {
              const alertMsg = `WARNING: ${metric.name} at ${Math.round(newMetrics[metric.id])}${metric.unit}`;
              if (!alerts.find(a => a.message === alertMsg && Date.now() - a.timestamp < 60000)) {
                setAlerts(prev => [...prev.slice(-9), { 
                  id: Date.now(), 
                  message: alertMsg, 
                  level: 'warning',
                  timestamp: Date.now()
                }]);
                addLog('warning', alertMsg, true);
              }
            }
          });
        }
        
        return newMetrics;
      });
      
      // Update history
      setHistory(prev => {
        const timestamp = new Date().toLocaleTimeString();
        const newEntry = { timestamp, ...metrics };
        return [...prev.slice(-29), newEntry];
      });
    }, 2000);
    
    return () => clearInterval(interval);
  }, [environmentFactors, subsystemStatus, alertsEnabled, addLog, alerts, metrics]);

  const getMetricStatus = (metricId, value) => {
    const metric = METRICS.find(m => m.id === metricId);
    if (!metric?.criticalThreshold) return 'normal';
    if (value >= metric.criticalThreshold) return 'critical';
    if (value >= metric.warningThreshold) return 'warning';
    return 'normal';
  };

  const getTrend = (metricId) => {
    if (history.length < 5) return 'stable';
    const recent = history.slice(-5);
    const avg = recent.reduce((sum, h) => sum + (h[metricId] || 0), 0) / 5;
    const current = metrics[metricId];
    if (current > avg * 1.1) return 'up';
    if (current < avg * 0.9) return 'down';
    return 'stable';
  };

  const selectedMetricConfig = METRICS.find(m => m.id === selectedMetric);

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2 bg-[#1a1a2e] border-b border-[#2a2a3e] flex-shrink-0">
        <span className="text-xs font-mono uppercase tracking-wider text-gray-400">
          System Monitor
        </span>
        <button
          onClick={() => setAlertsEnabled(!alertsEnabled)}
          className={`p-1 rounded ${alertsEnabled ? 'text-green-400' : 'text-gray-500'}`}
          title={alertsEnabled ? 'Alerts Enabled' : 'Alerts Disabled'}
        >
          {/* @ts-ignore */}
          {alertsEnabled ? <Bell className="w-4 h-4" /> : <BellOff className="w-4 h-4" />}
        </button>
      </div>

      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto p-3 space-y-3">
        {/* Metrics Grid */}
        <div className="grid grid-cols-2 gap-2">
          {METRICS.map((metric) => {
            const Icon = metric.icon;
            const value = metrics[metric.id];
            const status = getMetricStatus(metric.id, value);
            const trend = getTrend(metric.id);
            const isSelected = selectedMetric === metric.id;
            
            return (
              <button
                key={metric.id}
                onClick={() => setSelectedMetric(metric.id)}
                className={`p-3 rounded border text-left transition-all ${
                  isSelected 
                    ? 'bg-blue-500/10 border-blue-500/50' 
                    : status === 'critical' 
                    ? 'bg-red-500/10 border-red-500/30 animate-pulse' 
                    : status === 'warning' 
                    ? 'bg-orange-500/10 border-orange-500/30' 
                    : 'bg-[#1a1a2e] border-[#2a2a3e] hover:border-[#3a3a4e]'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  {/* @ts-ignore */}
                  <Icon className={`w-4 h-4 ${
                    status === 'critical' ? 'text-red-400' :
                    status === 'warning' ? 'text-orange-400' :
                    'text-gray-400'
                  }`} />
                  <div className="flex items-center gap-1">
                    {/* @ts-ignore */}
                    {trend === 'up' && <TrendingUp className="w-3 h-3 text-red-400" />}
                    {/* @ts-ignore */}
                    {trend === 'down' && <TrendingDown className="w-3 h-3 text-green-400" />}
                    {/* @ts-ignore */}
                    {trend === 'stable' && <Minus className="w-3 h-3 text-gray-500" />}
                  </div>
                </div>
                <p className="text-xs text-gray-500">{metric.name}</p>
                <p className={`text-lg font-mono font-bold ${
                  status === 'critical' ? 'text-red-400' :
                  status === 'warning' ? 'text-orange-400' :
                  'text-green-400'
                }`}>
                  {Math.round(value)}{metric.unit}
                </p>
              </button>
            );
          })}
        </div>

        {/* Chart */}
        {history.length > 2 && (
          <div className="h-32 mt-3">
            <p className="text-xs text-gray-500 mb-2">{selectedMetricConfig?.name} History</p>
            {/* @ts-ignore */}
            <ResponsiveContainer width="100%" height="100%">
              {/* @ts-ignore */}
              <AreaChart data={history}>
                <defs>
                  <linearGradient id="colorMetric" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                {/* @ts-ignore */}
                <XAxis dataKey="timestamp" hide />
                {/* @ts-ignore */}
                <YAxis hide domain={['auto', 'auto']} />
                {/* @ts-ignore */}
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#1a1a2e', 
                    border: '1px solid #2a2a3e',
                    borderRadius: '4px',
                    fontSize: '10px'
                  }} 
                />
                {/* @ts-ignore */}
                <Area 
                  type="monotone" 
                  dataKey={selectedMetric} 
                  stroke="#3b82f6" 
                  fill="url(#colorMetric)" 
                  strokeWidth={2}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Recent Alerts */}
        {alerts.length > 0 && (
          <div className="mt-3 pt-3 border-t border-[#2a2a3e]">
            <p className="text-xs text-gray-500 mb-2 flex items-center gap-1">
              {/* @ts-ignore */}
              <AlertTriangle className="w-3 h-3" />
              Recent Alerts
            </p>
            <div className="space-y-1 max-h-20 overflow-y-auto">
              {alerts.slice(-3).reverse().map((alert) => (
                <div 
                  key={alert.id}
                  className={`text-xs px-2 py-1 rounded ${
                    alert.level === 'critical' 
                      ? 'bg-red-500/10 text-red-400' 
                      : 'bg-orange-500/10 text-orange-400'
                  }`}
                >
                  {alert.message}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}