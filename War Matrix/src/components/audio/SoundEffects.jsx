import { useEffect, useRef } from 'react';

export default function useSoundEffects() {
  const audioCache = useRef({});
  const settingsRef = useRef(null);

  useEffect(() => {
    const updateSettings = () => {
      const settings = JSON.parse(localStorage.getItem('warMatrixSettings') || '{}');
      settingsRef.current = settings;
    };

    updateSettings();

    const playSoundEffect = (type) => {
      const settings = settingsRef.current;
      if (!settings) return;
      
      const soundEnabled = settings.soundEnabled !== false;
      const soundVolume = settings.soundVolume !== undefined ? settings.soundVolume : 50;

      if (!soundEnabled) return;

      const soundEffects = settings.sound_effects || {};
      const soundUrl = soundEffects[type];

      if (!soundUrl) return;

      try {
        if (!audioCache.current[type]) {
          audioCache.current[type] = new Audio(soundUrl);
        }

        const audio = audioCache.current[type];
        audio.volume = soundVolume / 100;
        audio.currentTime = 0;
        audio.play().catch(() => {});
      } catch (error) {
        // Silently fail if audio can't play
      }
    };

    // Add click listeners to all buttons and interactive elements
    const handleClick = (e) => {
      const target = e.target.closest('button, a, [role="button"], .menu-item');
      if (target) {
        playSoundEffect('button_click');
      }
    };

    document.addEventListener('click', handleClick, true);

    // Listen for settings updates
    const handleSettingsUpdate = () => {
      updateSettings();
    };

    window.addEventListener('settingsUpdated', handleSettingsUpdate);
    window.addEventListener('storage', handleSettingsUpdate);

    return () => {
      document.removeEventListener('click', handleClick, true);
      window.removeEventListener('settingsUpdated', handleSettingsUpdate);
      window.removeEventListener('storage', handleSettingsUpdate);
    };
  }, []);

  return null;
}