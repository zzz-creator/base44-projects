import React, { useState, useEffect, useRef } from 'react';
import { 
  Play, Pause, SkipBack, SkipForward, Rewind, FastForward,
  Eye, Monitor, Cpu, User, Settings, ChevronLeft, ChevronRight
} from 'lucide-react';
import { motion } from 'framer-motion';

const PERSPECTIVES = [
  { id: 'operator', name: 'Operator View', icon: User, description: 'Actions taken by the operator' },
  { id: 'system', name: 'System View', icon: Cpu, description: 'System state changes and responses' },
  { id: 'admin', name: 'Admin View', icon: Settings, description: 'Administrative interventions' },
  { id: 'combined', name: 'Combined View', icon: Eye, description: 'All events unified' }
];

export default function MissionPlayback({ 
  logs, 
  missionStartTime, 
  missionEndTime,
  diagnostics,
  phases,
  onTimeChange,
  currentPlaybackTime
}) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [perspective, setPerspective] = useState('combined');
  const [currentIndex, setCurrentIndex] = useState(0);
  const playbackRef = useRef(null);
  const timelineRef = useRef(null);

  const missionDuration = missionEndTime - missionStartTime;

  // Filter logs by perspective
  const filteredLogs = logs.filter(log => {
    if (perspective === 'combined') return true;
    if (perspective === 'operator') return !log.isAdmin && log.level !== 'system';
    if (perspective === 'system') return log.level === 'system' || log.level === 'info';
    if (perspective === 'admin') return log.isAdmin;
    return true;
  });

  // Calculate log timestamps relative to mission start
  const logsWithRelativeTime = filteredLogs.map((log, idx) => {
    const logTime = idx / filteredLogs.length * missionDuration;
    return { ...log, relativeTime: logTime, index: idx };
  });

  // Playback control
  useEffect(() => {
    if (isPlaying && logsWithRelativeTime.length > 0 && currentIndex < logsWithRelativeTime.length - 1) {
      const nextLog = logsWithRelativeTime[currentIndex + 1];
      const currentLogItem = logsWithRelativeTime[currentIndex];
      const timeDiff = (nextLog?.relativeTime || 0) - (currentLogItem?.relativeTime || 0);
      const delay = timeDiff > 0 ? timeDiff / playbackSpeed : 200;
      
      playbackRef.current = setTimeout(() => {
        setCurrentIndex(prev => prev + 1);
        onTimeChange?.(nextLog?.relativeTime || 0);
      }, Math.max(delay, 100)); // Minimum 100ms between events
    } else if (logsWithRelativeTime.length > 0 && currentIndex >= logsWithRelativeTime.length - 1) {
      setIsPlaying(false);
    }

    return () => {
      if (playbackRef.current) clearTimeout(playbackRef.current);
    };
  }, [isPlaying, currentIndex, playbackSpeed, logsWithRelativeTime.length, onTimeChange]);

  const handlePlayPause = () => {
    setIsPlaying(!isPlaying);
  };

  const handleSeek = (index) => {
    if (logsWithRelativeTime.length === 0) return;
    const safeIndex = Math.max(0, Math.min(index, logsWithRelativeTime.length - 1));
    setCurrentIndex(safeIndex);
    onTimeChange?.(logsWithRelativeTime[safeIndex]?.relativeTime || 0);
  };

  const handleSkipBack = () => {
    const newIndex = Math.max(0, currentIndex - 5);
    handleSeek(newIndex);
  };

  const handleSkipForward = () => {
    const newIndex = Math.min(logsWithRelativeTime.length - 1, currentIndex + 5);
    handleSeek(newIndex);
  };

  const handleRestart = () => {
    setCurrentIndex(0);
    setIsPlaying(false);
    onTimeChange?.(0);
  };

  const formatTime = (ms) => {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes}:${String(secs).padStart(2, '0')}`;
  };

  const currentLog = logsWithRelativeTime[currentIndex];
  const progress = logsWithRelativeTime.length > 1 ? (currentIndex / (logsWithRelativeTime.length - 1)) * 100 : 0;

  // Handle empty logs
  if (!logs || logs.length === 0) {
    return (
      <div className="bg-[#12121a] border border-[#2a2a3e] rounded-lg p-8 text-center">
        <p className="text-gray-500 text-sm">No mission events to playback.</p>
        <p className="text-gray-600 text-xs mt-2">Complete a mission to review the playback.</p>
      </div>
    );
  }

  return (
    <div className="bg-[#12121a] border border-[#2a2a3e] rounded-lg overflow-hidden">
      {/* Perspective Selector */}
      <div className="px-4 py-2 bg-[#1a1a2e] border-b border-[#2a2a3e] flex items-center justify-between">
        <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Mission Playback</span>
        <div className="flex items-center gap-1">
          {PERSPECTIVES.map((p) => {
            const Icon = p.icon;
            return (
              <button
                key={p.id}
                onClick={() => setPerspective(p.id)}
                title={p.description}
                className={`p-1.5 rounded transition-colors ${
                  perspective === p.id
                    ? 'bg-blue-500/20 text-blue-400'
                    : 'text-gray-500 hover:text-gray-300'
                }`}
              >
                <Icon className="w-4 h-4" />
              </button>
            );
          })}
        </div>
      </div>

      {/* Current Event Display */}
      <div className="p-4 border-b border-[#2a2a3e]">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs text-gray-500">
            Event {currentIndex + 1} of {logsWithRelativeTime.length}
          </span>
          <span className="text-xs text-gray-500 font-mono">
            {formatTime(currentLog?.relativeTime || 0)} / {formatTime(missionDuration)}
          </span>
        </div>
        
        {currentLog && (
          <motion.div
            key={currentIndex}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className={`p-3 rounded border ${
              currentLog.level === 'error' ? 'bg-red-500/10 border-red-500/30' :
              currentLog.level === 'warning' ? 'bg-yellow-500/10 border-yellow-500/30' :
              currentLog.level === 'success' ? 'bg-green-500/10 border-green-500/30' :
              currentLog.level === 'system' ? 'bg-cyan-500/10 border-cyan-500/30' :
              'bg-[#1a1a2e] border-[#2a2a3e]'
            }`}
          >
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs text-gray-500 font-mono">{currentLog.timestamp}</span>
              <span className={`text-xs font-bold uppercase ${
                currentLog.level === 'error' ? 'text-red-400' :
                currentLog.level === 'warning' ? 'text-yellow-400' :
                currentLog.level === 'success' ? 'text-green-400' :
                currentLog.level === 'system' ? 'text-cyan-400' :
                'text-gray-400'
              }`}>
                [{currentLog.level}]
              </span>
              {currentLog.isAdmin && (
                <span className="text-xs font-bold text-orange-400">[ADMIN]</span>
              )}
            </div>
            <p className="text-sm text-gray-200">{currentLog.message}</p>
          </motion.div>
        )}
      </div>

      {/* Timeline */}
      <div className="px-4 py-3 border-b border-[#2a2a3e]">
        <div 
          ref={timelineRef}
          className="relative h-8 bg-[#0a0a0f] rounded cursor-pointer"
          onClick={(e) => {
            const rect = e.currentTarget.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const percentage = x / rect.width;
            const newIndex = Math.floor(percentage * logsWithRelativeTime.length);
            handleSeek(Math.max(0, Math.min(logsWithRelativeTime.length - 1, newIndex)));
          }}
        >
          {/* Progress bar */}
          <div 
            className="absolute top-0 left-0 h-full bg-blue-500/30 rounded-l transition-all"
            style={{ width: `${progress}%` }}
          />
          
          {/* Event markers */}
          {logsWithRelativeTime.map((log, idx) => (
            <div
              key={idx}
              className={`absolute top-1 bottom-1 w-0.5 transition-colors ${
                idx === currentIndex ? 'bg-blue-400' :
                log.level === 'error' ? 'bg-red-400/50' :
                log.level === 'warning' ? 'bg-yellow-400/50' :
                log.level === 'system' ? 'bg-cyan-400/50' :
                'bg-gray-600/50'
              }`}
              style={{ left: `${(idx / logsWithRelativeTime.length) * 100}%` }}
            />
          ))}
          
          {/* Playhead */}
          <div 
            className="absolute top-0 h-full w-1 bg-blue-400 rounded transition-all"
            style={{ left: `${progress}%`, transform: 'translateX(-50%)' }}
          />
        </div>
      </div>

      {/* Controls */}
      <div className="px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <button
            onClick={handleRestart}
            className="p-2 text-gray-400 hover:text-white transition-colors"
            title="Restart"
          >
            <Rewind className="w-4 h-4" />
          </button>
          <button
            onClick={handleSkipBack}
            className="p-2 text-gray-400 hover:text-white transition-colors"
            title="Skip back 5 events"
          >
            <SkipBack className="w-4 h-4" />
          </button>
          <button
            onClick={handlePlayPause}
            className="p-3 bg-blue-600 hover:bg-blue-500 text-white rounded-full transition-colors"
          >
            {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
          </button>
          <button
            onClick={handleSkipForward}
            className="p-2 text-gray-400 hover:text-white transition-colors"
            title="Skip forward 5 events"
          >
            <SkipForward className="w-4 h-4" />
          </button>
          <button
            onClick={() => handleSeek(logsWithRelativeTime.length - 1)}
            className="p-2 text-gray-400 hover:text-white transition-colors"
            title="Go to end"
          >
            <FastForward className="w-4 h-4" />
          </button>
        </div>

        {/* Speed Control */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-500">Speed:</span>
          {[0.5, 1, 2, 4].map((speed) => (
            <button
              key={speed}
              onClick={() => setPlaybackSpeed(speed)}
              className={`px-2 py-1 text-xs rounded transition-colors ${
                playbackSpeed === speed
                  ? 'bg-blue-500/20 text-blue-400'
                  : 'text-gray-500 hover:text-gray-300'
              }`}
            >
              {speed}x
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}