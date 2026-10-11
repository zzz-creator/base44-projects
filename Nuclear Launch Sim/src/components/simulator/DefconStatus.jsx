import * as React from 'react';

const DEFCON_LEVELS = {
  5: { color: 'text-blue-500', bg: 'bg-blue-500/20', border: 'border-blue-500/50', label: 'FADE OUT', desc: 'Lowest state of readiness' },
  4: { color: 'text-green-500', bg: 'bg-green-500/20', border: 'border-green-500/50', label: 'DOUBLE TAKE', desc: 'Increased intelligence gathering' },
  3: { color: 'text-yellow-500', bg: 'bg-yellow-500/20', border: 'border-yellow-500/50', label: 'ROUND HOUSE', desc: 'Air Force ready to mobilize' },
  2: { color: 'text-orange-500', bg: 'bg-orange-500/20', border: 'border-orange-500/50', label: 'FAST PACE', desc: 'Armed Forces ready to deploy' },
  1: { color: 'text-red-600', bg: 'bg-red-600/20', border: 'border-red-600/50', label: 'PISTOL ARMED', desc: 'Maximum readiness. War is imminent' }
};

export default function DefconStatus({ level }) {
  const info = DEFCON_LEVELS[level] || DEFCON_LEVELS[5];
  
  return (
    <div className={`flex flex-col items-center justify-center p-4 border-2 rounded-lg ${info.border} ${info.bg} transition-all duration-500`}>
      <div className="text-xs font-mono tracking-widest text-gray-400 mb-1">DEFENSE READINESS CONDITION</div>
      <div className={`text-5xl font-black tracking-tighter ${info.color} mb-2`}>
        {level}
      </div>
      <div className={`text-xl font-bold tracking-widest uppercase ${info.color}`}>
        {info.label}
      </div>
      <div className="text-xs text-center text-gray-400 mt-2 max-w-[200px]">
        {info.desc}
      </div>
    </div>
  );
}
