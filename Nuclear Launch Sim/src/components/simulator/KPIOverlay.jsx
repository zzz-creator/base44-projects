import React, { useMemo } from 'react';
import { 
  TrendingUp, TrendingDown, Clock, AlertTriangle, CheckCircle,
  Activity, Zap, Target
} from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';

const KPI_DEFINITIONS = [
  { 
    id: 'responseTime', 
    name: 'Response Time', 
    icon: Clock, 
    unit: 's',
    threshold: { warning: 5, critical: 10 },
    description: 'Time between system prompts and operator actions'
  },
  { 
    id: 'errorRate', 
    name: 'Error Rate', 
    icon: AlertTriangle, 
    unit: '%',
    threshold: { warning: 10, critical: 25 },
    description: 'Percentage of actions resulting in errors'
  },
  { 
    id: 'accuracy', 
    name: 'Accuracy', 
    icon: Target, 
    unit: '%',
    threshold: { warning: 80, critical: 60 },
    inverted: true,
    description: 'Successful actions vs total actions'
  },
  { 
    id: 'efficiency', 
    name: 'Efficiency', 
    icon: Zap, 
    unit: '%',
    threshold: { warning: 70, critical: 50 },
    inverted: true,
    description: 'Optimal path completion percentage'
  }
];

export default function KPIOverlay({ 
  logs, 
  missionStartTime, 
  missionEndTime,
  currentPlaybackTime,
  diagnostics,
  checklistData
}) {
  // Calculate KPIs from logs
  const kpiData = useMemo(() => {
    const totalLogs = logs.length;
    const errorLogs = logs.filter(l => l.level === 'error').length;
    const warningLogs = logs.filter(l => l.level === 'warning').length;
    const successLogs = logs.filter(l => l.level === 'success').length;
    const systemLogs = logs.filter(l => l.level === 'system').length;
    
    const missionDuration = (missionEndTime - missionStartTime) / 1000;
    const avgResponseTime = missionDuration / Math.max(totalLogs, 1);
    
    const errorRate = totalLogs > 0 ? (errorLogs / totalLogs) * 100 : 0;
    const accuracy = totalLogs > 0 ? ((successLogs + systemLogs) / totalLogs) * 100 : 100;
    
    // Calculate efficiency based on checklist completion and error count
    const checklistCompletion = checklistData 
      ? (checklistData.items.filter(i => i.checked).length / checklistData.items.length) * 100 
      : 100;
    const efficiency = Math.max(0, checklistCompletion - (errorLogs * 5));

    return {
      responseTime: { value: avgResponseTime.toFixed(1), trend: avgResponseTime < 5 ? 'up' : 'down' },
      errorRate: { value: errorRate.toFixed(1), trend: errorRate < 10 ? 'up' : 'down' },
      accuracy: { value: accuracy.toFixed(1), trend: accuracy > 80 ? 'up' : 'down' },
      efficiency: { value: efficiency.toFixed(1), trend: efficiency > 70 ? 'up' : 'down' }
    };
  }, [logs, missionStartTime, missionEndTime, checklistData]);

  // Build timeline data for chart
  const timelineData = useMemo(() => {
    const dataPoints = [];
    const chunkSize = Math.max(1, Math.floor(logs.length / 10));
    
    for (let i = 0; i < logs.length; i += chunkSize) {
      const chunk = logs.slice(i, i + chunkSize);
      const errors = chunk.filter(l => l.level === 'error').length;
      const successes = chunk.filter(l => l.level === 'success').length;
      
      dataPoints.push({
        index: i,
        time: `T+${Math.floor((i / logs.length) * ((missionEndTime - missionStartTime) / 1000))}s`,
        errorRate: (errors / chunk.length) * 100,
        accuracy: (successes / chunk.length) * 100,
        activity: chunk.length
      });
    }
    
    return dataPoints;
  }, [logs, missionStartTime, missionEndTime]);

  const getStatusColor = (kpiId, value) => {
    const kpi = KPI_DEFINITIONS.find(k => k.id === kpiId);
    if (!kpi) return 'text-gray-400';
    
    const numValue = parseFloat(value);
    const { warning, critical } = kpi.threshold;
    
    if (kpi.inverted) {
      if (numValue >= warning) return 'text-green-400';
      if (numValue >= critical) return 'text-yellow-400';
      return 'text-red-400';
    } else {
      if (numValue <= warning) return 'text-green-400';
      if (numValue <= critical) return 'text-yellow-400';
      return 'text-red-400';
    }
  };

  return (
    <div className="bg-[#12121a] border border-[#2a2a3e] rounded-lg overflow-hidden">
      {/* Header */}
      <div className="px-4 py-2 bg-[#1a1a2e] border-b border-[#2a2a3e]">
        <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">
          Key Performance Indicators
        </span>
      </div>

      {/* KPI Cards */}
      <div className="p-4 grid grid-cols-2 lg:grid-cols-4 gap-3">
        {KPI_DEFINITIONS.map((kpi) => {
          const Icon = kpi.icon;
          const data = kpiData[kpi.id];
          const statusColor = getStatusColor(kpi.id, data?.value || 0);
          
          return (
            <div
              key={kpi.id}
              className="p-3 bg-[#0a0a0f] border border-[#2a2a3e] rounded-lg"
              title={kpi.description}
            >
              <div className="flex items-center justify-between mb-2">
                <Icon className={`w-4 h-4 ${statusColor}`} />
                {data?.trend === 'up' ? (
                  <TrendingUp className="w-3 h-3 text-green-400" />
                ) : (
                  <TrendingDown className="w-3 h-3 text-red-400" />
                )}
              </div>
              <div className={`text-2xl font-bold ${statusColor}`}>
                {data?.value || '-'}<span className="text-xs text-gray-500">{kpi.unit}</span>
              </div>
              <div className="text-xs text-gray-500 mt-1">{kpi.name}</div>
            </div>
          );
        })}
      </div>

      {/* Performance Timeline Chart */}
      <div className="px-4 pb-4">
        <div className="text-xs text-gray-500 mb-2">Performance Over Time</div>
        <div className="h-32 bg-[#0a0a0f] rounded border border-[#2a2a3e] p-2">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={timelineData}>
              <XAxis 
                dataKey="time" 
                tick={{ fontSize: 10, fill: '#6b7280' }}
                axisLine={{ stroke: '#2a2a3e' }}
              />
              <YAxis 
                tick={{ fontSize: 10, fill: '#6b7280' }}
                axisLine={{ stroke: '#2a2a3e' }}
                domain={[0, 100]}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#1a1a2e',
                  border: '1px solid #2a2a3e',
                  borderRadius: '4px',
                  fontSize: '10px'
                }}
              />
              <ReferenceLine y={80} stroke="#22c55e" strokeDasharray="3 3" />
              <ReferenceLine y={50} stroke="#ef4444" strokeDasharray="3 3" />
              <Line 
                type="monotone" 
                dataKey="accuracy" 
                stroke="#22c55e" 
                strokeWidth={2}
                dot={false}
                name="Accuracy"
              />
              <Line 
                type="monotone" 
                dataKey="errorRate" 
                stroke="#ef4444" 
                strokeWidth={2}
                dot={false}
                name="Error Rate"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Thresholds Legend */}
      <div className="px-4 pb-4 flex flex-wrap gap-4 text-xs">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-green-400 rounded" />
          <span className="text-gray-400">Optimal</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-yellow-400 rounded" />
          <span className="text-gray-400">Warning</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-red-400 rounded" />
          <span className="text-gray-400">Critical</span>
        </div>
      </div>
    </div>
  );
}