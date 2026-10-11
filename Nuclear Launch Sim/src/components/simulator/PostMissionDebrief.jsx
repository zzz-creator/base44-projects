import React, { useMemo, useState } from 'react';
import { 
  CheckCircle, XCircle, AlertTriangle, Clock, Target, Activity,
  TrendingUp, TrendingDown, Award, FileText, Download, RotateCcw,
  PlayCircle, BarChart3, MessageSquare
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, BarChart, Bar, Cell } from 'recharts';
import MissionPlayback from './MissionPlayback';
import KPIOverlay from './KPIOverlay';
import InstructorAnnotations from './InstructorAnnotations';

const GRADE_THRESHOLDS = {
  A: { min: 90, color: '#22c55e', label: 'Excellent' },
  B: { min: 80, color: '#84cc16', label: 'Good' },
  C: { min: 70, color: '#eab308', label: 'Satisfactory' },
  D: { min: 60, color: '#f97316', label: 'Needs Improvement' },
  F: { min: 0, color: '#ef4444', label: 'Failed' }
};

export default function PostMissionDebrief({
  missionData,
  logs,
  diagnostics,
  scenario,
  onRestart,
  onExportReport,
  onClose
}) {
  const { systemState, completionTime, phases, checklistData } = missionData || {};
  
  // Advanced visualization state
  const [activeTab, setActiveTab] = useState('overview'); // 'overview', 'playback', 'kpi', 'annotations'
  const [currentPlaybackTime, setCurrentPlaybackTime] = useState(0);
  const [annotations, setAnnotations] = useState([]);
  
  const missionStartTime = Date.now() - completionTime;
  const missionEndTime = Date.now();

  const handleAddAnnotation = (annotation) => {
    setAnnotations(prev => [...prev, annotation]);
  };

  const handleUpdateAnnotation = (id, updates) => {
    setAnnotations(prev => prev.map(a => a.id === id ? { ...a, ...updates } : a));
  };

  const handleDeleteAnnotation = (id) => {
    setAnnotations(prev => prev.filter(a => a.id !== id));
  };

  // Calculate metrics
  const metrics = useMemo(() => {
    const errorLogs = logs.filter(l => l.level === 'error');
    const warningLogs = logs.filter(l => l.level === 'warning');
    const adminActions = logs.filter(l => l.isAdmin);
    
    // Calculate time score (faster is better, baseline 5 minutes)
    const baselineTime = 300000; // 5 minutes
    const timeScore = Math.max(0, Math.min(100, 100 - ((completionTime - baselineTime) / baselineTime) * 50));
    
    // Calculate error score
    const errorScore = Math.max(0, 100 - (errorLogs.length * 10) - (warningLogs.length * 5));
    
    // Calculate checklist score
    const checklistScore = checklistData 
      ? (checklistData.items.filter(i => i.checked).length / checklistData.items.length) * 100
      : 100;
    
    // Calculate completion score
    const completionScore = systemState === 'COMPLETE' ? 100 : systemState === 'ABORTED' ? 30 : 0;
    
    // Overall score
    const overallScore = Math.round(
      (timeScore * 0.2) + (errorScore * 0.3) + (checklistScore * 0.2) + (completionScore * 0.3)
    );
    
    // Get grade
    let grade = 'F';
    for (const [g, config] of Object.entries(GRADE_THRESHOLDS)) {
      if (overallScore >= config.min) {
        grade = g;
        break;
      }
    }

    return {
      timeScore: Math.round(timeScore),
      errorScore: Math.round(errorScore),
      checklistScore: Math.round(checklistScore),
      completionScore,
      overallScore,
      grade,
      errorCount: errorLogs.length,
      warningCount: warningLogs.length,
      adminActionCount: adminActions.length,
      totalActions: logs.length
    };
  }, [logs, completionTime, systemState, checklistData]);

  // Build timeline data
  const timelineData = useMemo(() => {
    const phaseNames = ['INIT', 'DIAG', 'AUTH', 'VALIDATE', 'KEY AUTH', 'LAUNCH'];
    const phaseLogs = {};
    
    logs.forEach((log, idx) => {
      const phase = Math.floor(idx / (logs.length / 6));
      if (!phaseLogs[phase]) phaseLogs[phase] = { errors: 0, warnings: 0, total: 0 };
      phaseLogs[phase].total++;
      if (log.level === 'error') phaseLogs[phase].errors++;
      if (log.level === 'warning') phaseLogs[phase].warnings++;
    });

    return phaseNames.map((name, idx) => ({
      name,
      errors: phaseLogs[idx]?.errors || 0,
      warnings: phaseLogs[idx]?.warnings || 0,
      total: phaseLogs[idx]?.total || 0
    }));
  }, [logs]);

  // Score breakdown data
  const scoreBreakdown = [
    { name: 'Time', score: metrics.timeScore, weight: '20%' },
    { name: 'Errors', score: metrics.errorScore, weight: '30%' },
    { name: 'Checklist', score: metrics.checklistScore, weight: '20%' },
    { name: 'Completion', score: metrics.completionScore, weight: '30%' }
  ];

  const formatTime = (ms) => {
    const minutes = Math.floor(ms / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    return `${minutes}:${String(seconds).padStart(2, '0')}`;
  };

  const gradeConfig = GRADE_THRESHOLDS[metrics.grade];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="w-full max-w-4xl bg-[#0d0d14] border border-[#2a2a3e] rounded-xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col"
      >
        {/* Header */}
        <div className={`px-6 py-4 border-b border-[#2a2a3e] ${
          systemState === 'COMPLETE' 
            ? 'bg-gradient-to-r from-green-900/30 to-[#0d0d14]' 
            : 'bg-gradient-to-r from-red-900/30 to-[#0d0d14]'
        }`}>
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-gray-200 tracking-wider">POST-MISSION DEBRIEF</h2>
              <p className="text-xs text-gray-500 mt-1">
                {scenario ? scenario.name : 'Training Exercise'} • {new Date().toLocaleString()}
              </p>
            </div>
            <div className="flex items-center gap-4">
              {systemState === 'COMPLETE' ? (
                <div className="flex items-center gap-2 text-green-400">
                  <CheckCircle className="w-6 h-6" />
                  <span className="font-bold">MISSION COMPLETE</span>
                </div>
              ) : (
                <div className="flex items-center gap-2 text-red-400">
                  <XCircle className="w-6 h-6" />
                  <span className="font-bold">MISSION {systemState}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="px-6 py-2 bg-[#0a0a0f] border-b border-[#2a2a3e] flex gap-1">
          {[
            { id: 'overview', label: 'Overview', icon: BarChart3 },
            { id: 'playback', label: 'Playback', icon: PlayCircle },
            { id: 'kpi', label: 'KPIs', icon: Activity },
            { id: 'annotations', label: 'Annotations', icon: MessageSquare }
          ].map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-t text-xs font-bold tracking-wider transition-colors ${
                  activeTab === tab.id
                    ? 'bg-[#12121a] text-amber-400 border-t border-x border-[#2a2a3e]'
                    : 'text-gray-500 hover:text-gray-300'
                }`}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Playback Tab */}
          <AnimatePresence mode="wait">
            {activeTab === 'playback' && (
              <motion.div
                key="playback"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="space-y-4"
              >
                <MissionPlayback
                  logs={logs}
                  missionStartTime={missionStartTime}
                  missionEndTime={missionEndTime}
                  diagnostics={diagnostics}
                  phases={phases}
                  onTimeChange={setCurrentPlaybackTime}
                  currentPlaybackTime={currentPlaybackTime}
                />
              </motion.div>
            )}

            {/* KPI Tab */}
            {activeTab === 'kpi' && (
              <motion.div
                key="kpi"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="space-y-4"
              >
                <KPIOverlay
                  logs={logs}
                  missionStartTime={missionStartTime}
                  missionEndTime={missionEndTime}
                  currentPlaybackTime={currentPlaybackTime}
                  diagnostics={diagnostics}
                  checklistData={checklistData}
                />
              </motion.div>
            )}

            {/* Annotations Tab */}
            {activeTab === 'annotations' && (
              <motion.div
                key="annotations"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="space-y-4"
              >
                <InstructorAnnotations
                  annotations={annotations}
                  onAddAnnotation={handleAddAnnotation}
                  onUpdateAnnotation={handleUpdateAnnotation}
                  onDeleteAnnotation={handleDeleteAnnotation}
                  currentPlaybackTime={currentPlaybackTime}
                  logs={logs}
                />
              </motion.div>
            )}

            {/* Overview Tab (existing content) */}
            {activeTab === 'overview' && (
              <motion.div
                key="overview"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="space-y-6"
              >
          {/* Grade & Score */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Overall Grade */}
            <div className="bg-[#12121a] border border-[#2a2a3e] rounded-lg p-6 text-center">
              <div 
                className="text-7xl font-bold mb-2"
                style={{ color: gradeConfig.color }}
              >
                {metrics.grade}
              </div>
              <div className="text-sm text-gray-400">{gradeConfig.label}</div>
              <div className="text-3xl font-mono font-bold text-gray-200 mt-2">
                {metrics.overallScore}%
              </div>
            </div>

            {/* Score Breakdown */}
            <div className="bg-[#12121a] border border-[#2a2a3e] rounded-lg p-4">
              <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Score Breakdown</h3>
              <div className="space-y-2">
                {scoreBreakdown.map((item) => (
                  <div key={item.name} className="flex items-center gap-2">
                    <span className="text-xs text-gray-500 w-20">{item.name}</span>
                    <div className="flex-1 h-2 bg-[#1a1a2e] rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-blue-500 rounded-full"
                        style={{ width: `${item.score}%` }}
                      />
                    </div>
                    <span className="text-xs text-gray-400 w-12 text-right">{item.score}%</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Key Metrics */}
            <div className="bg-[#12121a] border border-[#2a2a3e] rounded-lg p-4">
              <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Key Metrics</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-blue-400" />
                    <span className="text-xs text-gray-400">Duration</span>
                  </div>
                  <span className="text-sm font-mono text-gray-200">{formatTime(completionTime)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <XCircle className="w-4 h-4 text-red-400" />
                    <span className="text-xs text-gray-400">Errors</span>
                  </div>
                  <span className="text-sm font-mono text-red-400">{metrics.errorCount}</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-yellow-400" />
                    <span className="text-xs text-gray-400">Warnings</span>
                  </div>
                  <span className="text-sm font-mono text-yellow-400">{metrics.warningCount}</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Activity className="w-4 h-4 text-cyan-400" />
                    <span className="text-xs text-gray-400">Total Actions</span>
                  </div>
                  <span className="text-sm font-mono text-gray-200">{metrics.totalActions}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Timeline Chart */}
          <div className="bg-[#12121a] border border-[#2a2a3e] rounded-lg p-4">
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Phase Activity</h3>
            <div className="h-40">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={timelineData}>
                  <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#6b7280' }} />
                  <YAxis tick={{ fontSize: 10, fill: '#6b7280' }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#1a1a2e',
                      border: '1px solid #2a2a3e',
                      borderRadius: '4px',
                      fontSize: '10px'
                    }}
                  />
                  <Bar dataKey="total" fill="#3b82f6" name="Actions" />
                  <Bar dataKey="errors" fill="#ef4444" name="Errors" />
                  <Bar dataKey="warnings" fill="#eab308" name="Warnings" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Checklist Summary */}
          {checklistData && (
            <div className="bg-[#12121a] border border-[#2a2a3e] rounded-lg p-4">
              <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Checklist Summary</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                {checklistData.items.map((item) => (
                  <div 
                    key={item.id}
                    className={`flex items-center gap-2 px-2 py-1 rounded text-xs ${
                      item.checked 
                        ? 'bg-green-500/10 text-green-400' 
                        : 'bg-red-500/10 text-red-400'
                    }`}
                  >
                    {item.checked ? (
                      <CheckCircle className="w-3 h-3" />
                    ) : (
                      <XCircle className="w-3 h-3" />
                    )}
                    <span className="truncate">{item.label}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Event Log Summary */}
          <div className="bg-[#12121a] border border-[#2a2a3e] rounded-lg p-4">
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Critical Events</h3>
            <div className="space-y-1 max-h-32 overflow-y-auto">
              {logs
                .filter(l => l.level === 'error' || l.level === 'system')
                .slice(-10)
                .map((log, idx) => (
                  <div 
                    key={idx}
                    className={`flex items-center gap-2 text-xs px-2 py-1 rounded ${
                      log.level === 'error' ? 'bg-red-500/10 text-red-400' :
                      'bg-cyan-500/10 text-cyan-400'
                    }`}
                  >
                    <span className="text-gray-600 font-mono">{log.timestamp}</span>
                    <span>{log.message}</span>
                  </div>
                ))}
            </div>
          </div>

          {/* Recommendations */}
          <div className="bg-[#12121a] border border-[#2a2a3e] rounded-lg p-4">
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">
              <Award className="w-4 h-4 inline mr-2 text-amber-400" />
              Recommendations
            </h3>
            <ul className="space-y-2 text-sm text-gray-400">
              {metrics.timeScore < 70 && (
                <li className="flex items-start gap-2">
                  <TrendingUp className="w-4 h-4 text-blue-400 flex-shrink-0 mt-0.5" />
                  <span>Consider practicing phase transitions to improve completion time.</span>
                </li>
              )}
              {metrics.errorScore < 80 && (
                <li className="flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 text-orange-400 flex-shrink-0 mt-0.5" />
                  <span>Review error handling procedures to reduce fault occurrences.</span>
                </li>
              )}
              {metrics.checklistScore < 100 && (
                <li className="flex items-start gap-2">
                  <FileText className="w-4 h-4 text-purple-400 flex-shrink-0 mt-0.5" />
                  <span>Complete all checklist items for thorough mission preparation.</span>
                </li>
              )}
              {metrics.overallScore >= 90 && (
                <li className="flex items-start gap-2">
                  <Award className="w-4 h-4 text-green-400 flex-shrink-0 mt-0.5" />
                  <span>Excellent performance! Consider attempting a higher difficulty scenario.</span>
                </li>
              )}
            </ul>
          </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-[#0a0a0f] border-t border-[#2a2a3e] flex items-center justify-between">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-500 hover:text-gray-300 text-sm transition-colors"
          >
            Close
          </button>
          
          <div className="flex items-center gap-3">
            <button
              onClick={onExportReport}
              className="px-4 py-2 bg-[#1a1a2e] hover:bg-[#252540] border border-[#2a2a3e] text-gray-400 text-sm rounded transition-colors flex items-center gap-2"
            >
              <Download className="w-4 h-4" />
              Export Report
            </button>
            <button
              onClick={onRestart}
              className="px-6 py-2 bg-amber-600 hover:bg-amber-500 text-black font-bold text-sm tracking-wider rounded transition-colors flex items-center gap-2"
            >
              <RotateCcw className="w-4 h-4" />
              New Mission
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}