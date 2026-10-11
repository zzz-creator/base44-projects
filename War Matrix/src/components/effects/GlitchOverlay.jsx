import React, { useState, useEffect } from 'react';

export default function GlitchOverlay({ 
  enabled = true, 
  intensity = 'low' // 'low', 'medium', 'high'
}) {
  const [glitchActive, setGlitchActive] = useState(false);

  useEffect(() => {
    if (!enabled) return;

    const intensityConfig = {
      low: { frequency: 15000, duration: 150 },
      medium: { frequency: 8000, duration: 200 },
      high: { frequency: 4000, duration: 300 }
    };

    const config = intensityConfig[intensity];

    const triggerGlitch = () => {
      setGlitchActive(true);
      setTimeout(() => setGlitchActive(false), config.duration);
    };

    const interval = setInterval(() => {
      if (Math.random() > 0.7) {
        triggerGlitch();
      }
    }, config.frequency);

    return () => clearInterval(interval);
  }, [enabled, intensity]);

  if (!enabled) return null;

  return (
    <>
      <style>{`
        @keyframes glitch-anim {
          0% {
            clip-path: inset(40% 0 61% 0);
            transform: translate(-2px, 2px);
          }
          20% {
            clip-path: inset(92% 0 1% 0);
            transform: translate(2px, -2px);
          }
          40% {
            clip-path: inset(43% 0 1% 0);
            transform: translate(-2px, 2px);
          }
          60% {
            clip-path: inset(25% 0 58% 0);
            transform: translate(2px, -2px);
          }
          80% {
            clip-path: inset(54% 0 7% 0);
            transform: translate(-2px, 2px);
          }
          100% {
            clip-path: inset(58% 0 43% 0);
            transform: translate(2px, -2px);
          }
        }

        @keyframes glitch-color {
          0% {
            filter: hue-rotate(0deg);
          }
          50% {
            filter: hue-rotate(20deg);
          }
          100% {
            filter: hue-rotate(0deg);
          }
        }


        .glitch-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          pointer-events: none;
          z-index: 9999;
        }

        .glitch-active::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: linear-gradient(
            transparent 0%,
            rgba(0, 255, 65, 0.03) 50%,
            transparent 100%
          );
          animation: glitch-anim 0.2s infinite;
        }

        .glitch-active::after {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 245, 255, 0.02);
          animation: glitch-color 0.3s infinite;
        }

        /* scanline effect removed */

        .noise-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          pointer-events: none;
          z-index: 9997;
          opacity: 0.02;
          background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E");
        }

        .vignette {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          pointer-events: none;
          z-index: 9996;
          background: radial-gradient(
            ellipse at center,
            transparent 50%,
            rgba(0, 0, 0, 0.3) 100%
          );
        }
      `}</style>

      {/* Vignette effect */}
      <div className="vignette" />

      {/* Noise texture */}
      <div className="noise-overlay" />

      {/* Scanlines removed */}

      {/* Glitch overlay */}
      <div className={`glitch-overlay ${glitchActive ? 'glitch-active' : ''}`} />
    </>
  );
}

// Individual glitch text component
export function GlitchText({ children, className = '' }) {
  return (
    <span className={`relative inline-block ${className}`}>
      <style>{`
        .glitch-text {
          position: relative;
        }
        .glitch-text::before,
        .glitch-text::after {
          content: attr(data-text);
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          opacity: 0;
        }
        .glitch-text:hover::before {
          animation: glitch-text-1 0.3s infinite;
          color: #00f5ff;
          z-index: -1;
          opacity: 0.8;
        }
        .glitch-text:hover::after {
          animation: glitch-text-2 0.3s infinite;
          color: #bf00ff;
          z-index: -2;
          opacity: 0.8;
        }
        @keyframes glitch-text-1 {
          0%, 100% { transform: translate(0); }
          20% { transform: translate(-2px, 2px); }
          40% { transform: translate(-2px, -2px); }
          60% { transform: translate(2px, 2px); }
          80% { transform: translate(2px, -2px); }
        }
        @keyframes glitch-text-2 {
          0%, 100% { transform: translate(0); }
          20% { transform: translate(2px, -2px); }
          40% { transform: translate(2px, 2px); }
          60% { transform: translate(-2px, -2px); }
          80% { transform: translate(-2px, 2px); }
        }
      `}</style>
      <span className="glitch-text" data-text={children}>
        {children}
      </span>
    </span>
  );
}