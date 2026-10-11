import * as React from 'react';

const STATES = {
  OFFLINE: 'OFFLINE',
  INITIALIZING: 'INITIALIZING',
  READY: 'READY',
  HOLD: 'HOLD',
  DEGRADED: 'DEGRADED',
  FAILED: 'FAILED',
  AUTHORIZED: 'AUTHORIZED',
  COUNTDOWN: 'COUNTDOWN',
  ABORTED: 'ABORTED',
  COMPLETE: 'COMPLETE'
};

const StatusIndicator = ({ status, size = 'md' }) => {
  const sizeClasses = {
    sm: 'w-2 h-2',
    md: 'w-3 h-3',
    lg: 'w-4 h-4'
  };
  
  const colorClasses = {
    [STATES.OFFLINE]: 'bg-gray-600',
    [STATES.INITIALIZING]: 'bg-amber-500 animate-pulse',
    [STATES.READY]: 'bg-green-500',
    [STATES.HOLD]: 'bg-yellow-500 animate-pulse',
    [STATES.DEGRADED]: 'bg-orange-500',
    [STATES.FAILED]: 'bg-red-500',
    [STATES.AUTHORIZED]: 'bg-green-400 animate-pulse',
    [STATES.COUNTDOWN]: 'bg-red-500 animate-pulse',
    [STATES.ABORTED]: 'bg-red-600',
    [STATES.COMPLETE]: 'bg-blue-500'
  };
  
  return (
    <div className={`${sizeClasses[size]} ${colorClasses[status] || 'bg-gray-600'} rounded-full shadow-lg`} 
         style={{ boxShadow: `0 0 8px ${status === STATES.READY ? '#22c55e' : status === STATES.FAILED ? '#ef4444' : status === STATES.AUTHORIZED ? '#4ade80' : 'transparent'}` }} 
    />
  );
};

export const Panel = ({ title, children, status = null, className = '' }) => (
  <div className={`bg-[#12121a] border border-[#2a2a3e] rounded-lg overflow-hidden ${className}`}>
    <div className="flex items-center justify-between px-4 py-2 bg-[#1a1a2e] border-b border-[#2a2a3e]">
      <span className="text-xs font-mono uppercase tracking-wider text-gray-400">{title}</span>
      {status && <StatusIndicator status={status} size="sm" />}
    </div>
    <div className="p-4">
      {children}
    </div>
  </div>
);