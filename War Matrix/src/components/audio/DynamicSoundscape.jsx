import React, { useEffect, useRef, useState } from 'react';
import { Button } from '../ui/button';
import { Slider } from '../ui/slider';
import { Volume2, VolumeX, Music, AlertTriangle } from 'lucide-react';

// Dynamic soundscape manager that adapts to app state
export default function DynamicSoundscape({ 
  alertLevel = 'normal', // 'normal', 'elevated', 'critical'
  currentPage = 'dashboard',
  enabled = true,
  volume = 30
}) {
  const audioContextRef = useRef(null);
  const gainNodeRef = useRef(null);
  const oscillatorsRef = useRef([]);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentMood, setCurrentMood] = useState('ambient');

  // Soundscape configurations for different moods
  const soundscapes = {
    ambient: {
      frequencies: [60, 90, 120, 180],
      waveform: 'sine',
      volume: 0.03,
      description: 'Calm operational hum'
    },
    elevated: {
      frequencies: [80, 160, 240, 320],
      waveform: 'triangle',
      volume: 0.04,
      description: 'Heightened awareness'
    },
    critical: {
      frequencies: [100, 200, 300, 400, 500],
      waveform: 'sawtooth',
      volume: 0.05,
      description: 'Alert state'
    },
    analysis: {
      frequencies: [220, 330, 440, 550],
      waveform: 'sine',
      volume: 0.02,
      description: 'Deep analysis mode'
    },
    simulation: {
      frequencies: [150, 225, 300, 375],
      waveform: 'triangle',
      volume: 0.035,
      description: 'Simulation active'
    }
  };

  // Map pages to soundscapes
  const pageSoundscapes = {
    'Dashboard': 'ambient',
    'CurrentWars': 'elevated',
    'FutureWars': 'analysis',
    'ConflictSimulator': 'simulation',
    'AlertsManagement': 'elevated',
    'StrategyHub': 'analysis',
    'RealTimeDataHub': 'ambient'
  };

  useEffect(() => {
    // Initialize audio context on user interaction
    const initAudio = () => {
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)();
        gainNodeRef.current = audioContextRef.current.createGain();
        gainNodeRef.current.connect(audioContextRef.current.destination);
        gainNodeRef.current.gain.value = 0;
      }
    };

    // Set up click handler to initialize audio
    document.addEventListener('click', initAudio, { once: true });

    return () => {
      document.removeEventListener('click', initAudio);
      stopSoundscape();
    };
  }, []);

  // Update soundscape based on alert level and page
  useEffect(() => {
    let targetMood = pageSoundscapes[currentPage] || 'ambient';
    
    // Override with alert level if critical
    if (alertLevel === 'critical') {
      targetMood = 'critical';
    } else if (alertLevel === 'elevated' && targetMood === 'ambient') {
      targetMood = 'elevated';
    }

    setCurrentMood(targetMood);

    if (isPlaying && enabled) {
      transitionToMood(targetMood);
    }
  }, [alertLevel, currentPage, enabled]);

  // Update volume
  useEffect(() => {
    if (gainNodeRef.current) {
      const targetVolume = enabled ? (volume / 100) * 0.1 : 0;
      gainNodeRef.current.gain.setTargetAtTime(
        targetVolume,
        audioContextRef.current?.currentTime || 0,
        0.5
      );
    }
  }, [volume, enabled]);

  const startSoundscape = () => {
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)();
      gainNodeRef.current = audioContextRef.current.createGain();
      gainNodeRef.current.connect(audioContextRef.current.destination);
    }

    if (audioContextRef.current.state === 'suspended') {
      audioContextRef.current.resume();
    }

    const config = soundscapes[currentMood];
    
    // Clear existing oscillators
    stopOscillators();

    // Create new oscillators
    config.frequencies.forEach((freq, index) => {
      const oscillator = audioContextRef.current.createOscillator();
      const oscGain = audioContextRef.current.createGain();
      
      oscillator.type = config.waveform;
      oscillator.frequency.value = freq;
      
      // Add slight detuning for richness
      oscillator.detune.value = Math.random() * 10 - 5;
      
      oscGain.gain.value = config.volume / config.frequencies.length;
      
      oscillator.connect(oscGain);
      oscGain.connect(gainNodeRef.current);
      
      oscillator.start();
      oscillatorsRef.current.push({ oscillator, gain: oscGain });
    });

    gainNodeRef.current.gain.setTargetAtTime(
      (volume / 100) * 0.1,
      audioContextRef.current.currentTime,
      1
    );

    setIsPlaying(true);
  };

  const stopOscillators = () => {
    oscillatorsRef.current.forEach(({ oscillator }) => {
      try {
        oscillator.stop();
      } catch (e) {
        // Oscillator already stopped
      }
    });
    oscillatorsRef.current = [];
  };

  const stopSoundscape = () => {
    if (gainNodeRef.current && audioContextRef.current) {
      gainNodeRef.current.gain.setTargetAtTime(
        0,
        audioContextRef.current.currentTime,
        0.5
      );
    }
    
    setTimeout(() => {
      stopOscillators();
      setIsPlaying(false);
    }, 500);
  };

  const transitionToMood = (mood) => {
    const config = soundscapes[mood];
    
    // Fade out current
    if (gainNodeRef.current && audioContextRef.current) {
      gainNodeRef.current.gain.setTargetAtTime(
        0,
        audioContextRef.current.currentTime,
        0.3
      );
    }

    // After fade, switch oscillators
    setTimeout(() => {
      stopOscillators();
      
      if (audioContextRef.current && enabled) {
        config.frequencies.forEach((freq) => {
          const oscillator = audioContextRef.current.createOscillator();
          const oscGain = audioContextRef.current.createGain();
          
          oscillator.type = config.waveform;
          oscillator.frequency.value = freq;
          oscillator.detune.value = Math.random() * 10 - 5;
          
          oscGain.gain.value = config.volume / config.frequencies.length;
          
          oscillator.connect(oscGain);
          oscGain.connect(gainNodeRef.current);
          
          oscillator.start();
          oscillatorsRef.current.push({ oscillator, gain: oscGain });
        });

        // Fade in
        gainNodeRef.current.gain.setTargetAtTime(
          (volume / 100) * 0.1,
          audioContextRef.current.currentTime,
          0.5
        );
      }
    }, 400);
  };

  const togglePlayback = () => {
    if (isPlaying) {
      stopSoundscape();
    } else {
      startSoundscape();
    }
  };

  const getMoodColor = () => {
    switch (currentMood) {
      case 'critical': return 'text-red-400';
      case 'elevated': return 'text-orange-400';
      case 'analysis': return 'text-purple-400';
      case 'simulation': return 'text-cyan-400';
      default: return 'text-green-400';
    }
  };

  return (
    <div className="flex items-center gap-3 bg-slate-900/50 rounded-lg p-2 px-4">
      <Button
        size="sm"
        variant="ghost"
        onClick={togglePlayback}
        className={`${isPlaying ? 'text-green-400' : 'text-slate-400'}`}
      >
        {isPlaying ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
      </Button>
      
      <div className="flex items-center gap-2">
        <Music className={`w-3 h-3 ${getMoodColor()}`} />
        <span className={`text-xs font-mono ${getMoodColor()}`}>
          {soundscapes[currentMood]?.description || 'Ambient'}
        </span>
      </div>

      {alertLevel === 'critical' && (
        <AlertTriangle className="w-4 h-4 text-red-400 animate-pulse" />
      )}
    </div>
  );
}