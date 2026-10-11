import React from 'react';
import { Card } from '../ui/card';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Check, Palette } from 'lucide-react';
import { THEMES } from './ThemeProvider';

export default function ThemeSelector({ currentThemeId, onThemeChange }) {
  const themes = Object.values(THEMES).filter(t => t && t.colors);

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-4">
        <Palette className="w-5 h-5 text-purple-400" />
        <h3 className="text-lg font-bold font-mono" style={{ color: 'var(--theme-primary)' }}>
          SELECT COMBAT THEME
        </h3>
      </div>
      
      <div className="grid md:grid-cols-2 gap-4">
        {themes.map((theme) => {
          if (!theme?.colors) return null;
          const isSelected = currentThemeId === theme.id;
          
          return (
            <Card
              key={theme.id}
              onClick={() => onThemeChange(theme.id)}
              className={`p-4 cursor-pointer transition-all duration-300 ${
                isSelected 
                  ? 'ring-2 ring-offset-2 ring-offset-slate-950' 
                  : 'hover:scale-[1.02]'
              }`}
              style={{
                background: theme.colors.surface,
                borderColor: isSelected ? theme.colors.primary : theme.colors.textMuted + '30',
                ringColor: theme.colors.primary
              }}
            >
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h4 className="font-bold font-mono text-md" style={{ color: theme.colors.primary }}>
                    {theme.name}
                  </h4>
                  <p className="text-xs font-mono mt-1" style={{ color: theme.colors.textMuted }}>
                    {theme.description}
                  </p>
                </div>
                {isSelected && (
                  <div 
                    className="w-6 h-6 rounded-full flex items-center justify-center"
                    style={{ background: theme.colors.primary }}
                  >
                    <Check className="w-4 h-4" style={{ color: theme.colors.background }} />
                  </div>
                )}
              </div>
              
              {/* Color palette preview */}
              <div className="flex gap-1 mb-3">
                <div 
                  className="w-6 h-6 rounded" 
                  style={{ background: theme.colors.primary }}
                  title="Primary"
                />
                <div 
                  className="w-6 h-6 rounded" 
                  style={{ background: theme.colors.secondary }}
                  title="Secondary"
                />
                <div 
                  className="w-6 h-6 rounded" 
                  style={{ background: theme.colors.accent }}
                  title="Accent"
                />
                <div 
                  className="w-6 h-6 rounded" 
                  style={{ background: theme.colors.danger }}
                  title="Danger"
                />
                <div 
                  className="w-6 h-6 rounded" 
                  style={{ background: theme.colors.warning }}
                  title="Warning"
                />
                <div 
                  className="w-6 h-6 rounded" 
                  style={{ background: theme.colors.success }}
                  title="Success"
                />
              </div>
              
              <div className="flex items-center gap-2">
                <Badge 
                  className="text-xs font-mono"
                  style={{ 
                    background: theme.colors.primary + '20',
                    color: theme.colors.primary,
                    borderColor: theme.colors.primary + '50'
                  }}
                >
                  {theme.backgroundEffect.toUpperCase()}
                </Badge>
                <Badge 
                  variant="outline"
                  className="text-xs font-mono"
                  style={{ 
                    borderColor: theme.colors.textMuted + '50',
                    color: theme.colors.textMuted
                  }}
                >
                  {theme.fonts.heading}
                </Badge>
                {theme.glowEffect && (
                  <Badge 
                    variant="outline"
                    className="text-xs font-mono"
                    style={{ 
                      borderColor: theme.colors.accent + '50',
                      color: theme.colors.accent
                    }}
                  >
                    GLOW
                  </Badge>
                )}
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}