import React from 'react';
import { cn } from '../../lib/utils';

export default function HolographicCard({ 
  children, 
  className,
  glowColor = 'cyan',
  intensity = 'medium',
  animated = true,
  variant = 'default'
}) {
  const glowColors = {
    cyan: {
      border: 'border-cyan-500/30',
      glow: 'shadow-cyan-500/20',
      bg: 'from-cyan-500/5 to-transparent',
      accent: 'bg-cyan-500'
    },
    green: {
      border: 'border-green-500/30',
      glow: 'shadow-green-500/20',
      bg: 'from-green-500/5 to-transparent',
      accent: 'bg-green-500'
    },
    purple: {
      border: 'border-purple-500/30',
      glow: 'shadow-purple-500/20',
      bg: 'from-purple-500/5 to-transparent',
      accent: 'bg-purple-500'
    },
    red: {
      border: 'border-red-500/30',
      glow: 'shadow-red-500/20',
      bg: 'from-red-500/5 to-transparent',
      accent: 'bg-red-500'
    },
    orange: {
      border: 'border-orange-500/30',
      glow: 'shadow-orange-500/20',
      bg: 'from-orange-500/5 to-transparent',
      accent: 'bg-orange-500'
    }
  };

  const intensities = {
    low: 'shadow-lg',
    medium: 'shadow-xl',
    high: 'shadow-2xl'
  };

  const colors = glowColors[glowColor] || glowColors.cyan;

  return (
    <div 
      className={cn(
        // Base styles
        'relative rounded-xl overflow-hidden',
        'bg-slate-950/80 backdrop-blur-xl',
        'border',
        colors.border,
        intensities[intensity],
        colors.glow,
        // Animation
        animated && 'transition-all duration-500 hover:scale-[1.01]',
        className
      )}
    >
      {/* Holographic gradient overlay */}
      <div 
        className={cn(
          'absolute inset-0 bg-gradient-to-br opacity-50 pointer-events-none',
          colors.bg
        )}
      />

      {/* Scan line effect */}
      {animated && (
        <div 
          className="absolute inset-0 pointer-events-none overflow-hidden"
          style={{
            background: `repeating-linear-gradient(
              0deg,
              transparent,
              transparent 2px,
              rgba(255,255,255,0.03) 2px,
              rgba(255,255,255,0.03) 4px
            )`
          }}
        />
      )}

      {/* Corner accents */}
      <div className={cn('absolute top-0 left-0 w-6 h-6 border-l-2 border-t-2 rounded-tl-xl', colors.border)} />
      <div className={cn('absolute top-0 right-0 w-6 h-6 border-r-2 border-t-2 rounded-tr-xl', colors.border)} />
      <div className={cn('absolute bottom-0 left-0 w-6 h-6 border-l-2 border-b-2 rounded-bl-xl', colors.border)} />
      <div className={cn('absolute bottom-0 right-0 w-6 h-6 border-r-2 border-b-2 rounded-br-xl', colors.border)} />

      {/* Corner dots */}
      <div className={cn('absolute top-2 left-2 w-1.5 h-1.5 rounded-full', colors.accent, animated && 'animate-pulse')} />
      <div className={cn('absolute top-2 right-2 w-1.5 h-1.5 rounded-full', colors.accent, animated && 'animate-pulse')} />
      <div className={cn('absolute bottom-2 left-2 w-1.5 h-1.5 rounded-full', colors.accent, animated && 'animate-pulse')} />
      <div className={cn('absolute bottom-2 right-2 w-1.5 h-1.5 rounded-full', colors.accent, animated && 'animate-pulse')} />

      {/* Animated border glow */}
      {animated && (
        <div 
          className="absolute inset-0 rounded-xl pointer-events-none"
          style={{
            background: `linear-gradient(90deg, transparent, ${glowColor === 'cyan' ? 'rgba(6, 182, 212, 0.1)' : glowColor === 'green' ? 'rgba(34, 197, 94, 0.1)' : glowColor === 'purple' ? 'rgba(168, 85, 247, 0.1)' : glowColor === 'red' ? 'rgba(239, 68, 68, 0.1)' : 'rgba(249, 115, 22, 0.1)'}, transparent)`,
            animation: 'holographic-sweep 3s ease-in-out infinite'
          }}
        />
      )}

      {/* Content */}
      <div className="relative z-10">
        {children}
      </div>

      <style>{`
        @keyframes holographic-sweep {
          0%, 100% {
            transform: translateX(-100%);
            opacity: 0;
          }
          50% {
            transform: translateX(100%);
            opacity: 1;
          }
        }
      `}</style>
    </div>
  );
}

// Holographic Button variant
export function HolographicButton({ 
  children, 
  className,
  glowColor = 'cyan',
  onClick,
  disabled
}) {
  const glowColors = {
    cyan: 'border-cyan-500/50 text-cyan-400 hover:bg-cyan-500/20 hover:shadow-cyan-500/30',
    green: 'border-green-500/50 text-green-400 hover:bg-green-500/20 hover:shadow-green-500/30',
    purple: 'border-purple-500/50 text-purple-400 hover:bg-purple-500/20 hover:shadow-purple-500/30',
    red: 'border-red-500/50 text-red-400 hover:bg-red-500/20 hover:shadow-red-500/30',
    orange: 'border-orange-500/50 text-orange-400 hover:bg-orange-500/20 hover:shadow-orange-500/30'
  };

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={cn(
        'relative px-6 py-3 rounded-lg',
        'bg-slate-950/50 backdrop-blur-sm',
        'border-2',
        'font-mono font-bold',
        'transition-all duration-300',
        'hover:shadow-lg hover:scale-105',
        'disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100',
        glowColors[glowColor],
        className
      )}
    >
      {/* Glow effect */}
      <div className="absolute inset-0 rounded-lg bg-gradient-to-r from-transparent via-white/5 to-transparent opacity-0 hover:opacity-100 transition-opacity" />
      
      <span className="relative z-10">{children}</span>
    </button>
  );
}

// Holographic Panel for data display
export function HolographicPanel({ 
  title, 
  children, 
  className,
  glowColor = 'cyan',
  icon: Icon
}) {
  const titleColors = {
    cyan: 'text-cyan-400',
    green: 'text-green-400',
    purple: 'text-purple-400',
    red: 'text-red-400',
    orange: 'text-orange-400'
  };

  return (
    <HolographicCard glowColor={glowColor} className={cn('p-6', className)}>
      {title && (
        <div className="flex items-center gap-3 mb-4">
          {Icon && (
            <div className={cn('p-2 rounded-lg bg-slate-900/50 border', `border-${glowColor}-500/30`)}>
              <Icon className={cn('w-5 h-5', titleColors[glowColor])} />
            </div>
          )}
          <h3 className={cn('text-lg font-bold font-mono glow-text', titleColors[glowColor])}>
            {title}
          </h3>
        </div>
      )}
      {children}
    </HolographicCard>
  );
}