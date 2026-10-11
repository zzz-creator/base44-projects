import React, { createContext, useContext, useState, useEffect } from 'react';

// War and conflict related themes
export const THEMES = {
  matrix_protocol: {
    id: 'matrix_protocol',
    name: 'Matrix Protocol',
    description: 'Classic cyber warfare theme with green matrix code',
    backgroundEffect: 'matrix',
    colors: {
      primary: '#00ff41',
      secondary: '#00f5ff',
      accent: '#bf00ff',
      background: '#0a0e27',
      surface: '#0d1117',
      text: '#e2e8f0',
      textMuted: '#64748b',
      danger: '#ef4444',
      warning: '#f59e0b',
      success: '#22c55e'
    },
    fonts: {
      heading: 'monospace',
      body: 'monospace'
    },
    borderRadius: '0.5rem',
    glowEffect: true
  },
  desert_storm: {
    id: 'desert_storm',
    name: 'Desert Storm',
    description: 'Tactical desert warfare operations theme',
    backgroundEffect: 'soldier',
    colors: {
      primary: '#d4a574',
      secondary: '#c2956e',
      accent: '#8b5a2b',
      background: '#1a1510',
      surface: '#2d261e',
      text: '#f5e6d3',
      textMuted: '#a89080',
      danger: '#dc2626',
      warning: '#ea580c',
      success: '#65a30d'
    },
    fonts: {
      heading: 'sans-serif',
      body: 'sans-serif'
    },
    borderRadius: '0.25rem',
    glowEffect: false
  },
  arctic_front: {
    id: 'arctic_front',
    name: 'Arctic Front',
    description: 'Cold war frozen operations theme',
    backgroundEffect: 'binary',
    colors: {
      primary: '#60a5fa',
      secondary: '#38bdf8',
      accent: '#a78bfa',
      background: '#0c1929',
      surface: '#132743',
      text: '#e0f2fe',
      textMuted: '#7dd3fc',
      danger: '#f43f5e',
      warning: '#fbbf24',
      success: '#4ade80'
    },
    fonts: {
      heading: 'monospace',
      body: 'sans-serif'
    },
    borderRadius: '0.75rem',
    glowEffect: true
  },
  stargate_command: {
    id: 'stargate_command',
    name: 'Stargate Command',
    description: 'Intergalactic warfare operations center',
    backgroundEffect: 'stargate',
    colors: {
      primary: '#818cf8',
      secondary: '#c084fc',
      accent: '#f472b6',
      background: '#0f0a1e',
      surface: '#1e1535',
      text: '#e9d5ff',
      textMuted: '#a78bfa',
      danger: '#fb7185',
      warning: '#fcd34d',
      success: '#86efac'
    },
    fonts: {
      heading: 'monospace',
      body: 'monospace'
    },
    borderRadius: '1rem',
    glowEffect: true
  },
  nuclear_winter: {
    id: 'nuclear_winter',
    name: 'Nuclear Winter',
    description: 'Post-apocalyptic warfare survival theme',
    backgroundEffect: 'equation',
    colors: {
      primary: '#a3a3a3',
      secondary: '#737373',
      accent: '#fbbf24',
      background: '#171717',
      surface: '#262626',
      text: '#d4d4d4',
      textMuted: '#737373',
      danger: '#dc2626',
      warning: '#f97316',
      success: '#84cc16'
    },
    fonts: {
      heading: 'sans-serif',
      body: 'monospace'
    },
    borderRadius: '0.125rem',
    glowEffect: false
  },
  blood_meridian: {
    id: 'blood_meridian',
    name: 'Blood Meridian',
    description: 'Intense combat operations theme',
    backgroundEffect: 'soldier',
    colors: {
      primary: '#ef4444',
      secondary: '#dc2626',
      accent: '#f97316',
      background: '#1c0a0a',
      surface: '#2d1515',
      text: '#fecaca',
      textMuted: '#f87171',
      danger: '#fef08a',
      warning: '#fdba74',
      success: '#86efac'
    },
    fonts: {
      heading: 'monospace',
      body: 'sans-serif'
    },
    borderRadius: '0.25rem',
    glowEffect: true
  },
  cyber_warfare: {
    id: 'cyber_warfare',
    name: 'Cyber Warfare',
    description: 'Digital battlefield operations theme',
    backgroundEffect: 'binary',
    colors: {
      primary: '#06b6d4',
      secondary: '#0ea5e9',
      accent: '#8b5cf6',
      background: '#020617',
      surface: '#0f172a',
      text: '#e2e8f0',
      textMuted: '#64748b',
      danger: '#f43f5e',
      warning: '#eab308',
      success: '#10b981'
    },
    fonts: {
      heading: 'monospace',
      body: 'monospace'
    },
    borderRadius: '0.5rem',
    glowEffect: true
  },
  jungle_warfare: {
    id: 'jungle_warfare',
    name: 'Jungle Warfare',
    description: 'Guerrilla operations in dense terrain',
    backgroundEffect: 'matrix',
    colors: {
      primary: '#22c55e',
      secondary: '#16a34a',
      accent: '#84cc16',
      background: '#052e16',
      surface: '#14532d',
      text: '#dcfce7',
      textMuted: '#86efac',
      danger: '#ef4444',
      warning: '#f59e0b',
      success: '#4ade80'
    },
    fonts: {
      heading: 'sans-serif',
      body: 'monospace'
    },
    borderRadius: '0.375rem',
    glowEffect: true
  }
};

const ThemeContext = createContext();

export default function ThemeProvider({ children }) {
  const [currentTheme, setCurrentTheme] = useState(() => {
    try {
      const saved = localStorage.getItem('warMatrixTheme');
      if (saved && THEMES[saved]) {
        return THEMES[saved];
      }
    } catch (e) {
      // Ignore localStorage errors
    }
    return THEMES.matrix_protocol;
  });

  const applyTheme = (themeId) => {
    const theme = THEMES[themeId];
    if (theme) {
      setCurrentTheme(theme);
      localStorage.setItem('warMatrixTheme', themeId);
      
      // Update localStorage settings with background effect
      const settings = JSON.parse(localStorage.getItem('warMatrixSettings') || '{}');
      settings.backgroundEffect = theme.backgroundEffect;
      localStorage.setItem('warMatrixSettings', JSON.stringify(settings));
      
      // Dispatch event for immediate updates
      window.dispatchEvent(new CustomEvent('themeUpdated', { detail: theme }));
      window.dispatchEvent(new CustomEvent('settingsUpdated', { detail: settings }));
    }
  };

  useEffect(() => {
    // Apply CSS variables when theme changes
    if (!currentTheme?.colors) return;
    
    const root = document.documentElement;
    root.style.setProperty('--theme-primary', currentTheme.colors.primary);
    root.style.setProperty('--theme-secondary', currentTheme.colors.secondary);
    root.style.setProperty('--theme-accent', currentTheme.colors.accent);
    root.style.setProperty('--theme-background', currentTheme.colors.background);
    root.style.setProperty('--theme-surface', currentTheme.colors.surface);
    root.style.setProperty('--theme-text', currentTheme.colors.text);
    root.style.setProperty('--theme-text-muted', currentTheme.colors.textMuted);
    root.style.setProperty('--theme-danger', currentTheme.colors.danger);
    root.style.setProperty('--theme-warning', currentTheme.colors.warning);
    root.style.setProperty('--theme-success', currentTheme.colors.success);
    root.style.setProperty('--theme-border-radius', currentTheme.borderRadius);
    root.style.setProperty('--theme-font-heading', currentTheme.fonts?.heading || 'monospace');
    root.style.setProperty('--theme-font-body', currentTheme.fonts?.body || 'monospace');
  }, [currentTheme]);

  return (
    <ThemeContext.Provider value={{ currentTheme, applyTheme, themes: THEMES }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}