import * as React from 'react';
const { useState, useEffect } = React;
import { Cloud, Sun, Moon, CloudRain, Wind } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../components/ui/select";

const WEATHER_CONDITIONS = [
  { id: 'clear', name: 'Clear', icon: Sun, color: 'text-yellow-400', degradation: 0 },
  { id: 'cloudy', name: 'Cloudy', icon: Cloud, color: 'text-gray-400', degradation: 0.05 },
  { id: 'rain', name: 'Rain', icon: CloudRain, color: 'text-blue-400', degradation: 0.15 },
  { id: 'storm', name: 'Storm', icon: CloudRain, color: 'text-purple-400', degradation: 0.3 },
  { id: 'wind', name: 'High Wind', icon: Wind, color: 'text-cyan-400', degradation: 0.2 }
];

const TIME_PERIODS = [
  { id: 'dawn', name: 'Dawn', hours: '05:00-07:00', modifier: 0.95 },
  { id: 'day', name: 'Day', hours: '07:00-18:00', modifier: 1.0 },
  { id: 'dusk', name: 'Dusk', hours: '18:00-20:00', modifier: 0.95 },
  { id: 'night', name: 'Night', hours: '20:00-05:00', modifier: 0.9 }
];

export default function EnvironmentPanel({ onEnvironmentChange, addLog }) {
  const [weather, setWeather] = useState('clear');
  const [timePeriod, setTimePeriod] = useState('day');
  const [temperature, setTemperature] = useState(22);
  const [autoSync, setAutoSync] = useState(false);

  // Auto-sync time period with real time
  useEffect(() => {
    if (!autoSync) return;
    
    const updateTimePeriod = () => {
      const hour = new Date().getHours();
      if (hour >= 5 && hour < 7) setTimePeriod('dawn');
      else if (hour >= 7 && hour < 18) setTimePeriod('day');
      else if (hour >= 18 && hour < 20) setTimePeriod('dusk');
      else setTimePeriod('night');
    };
    
    updateTimePeriod();
    const interval = setInterval(updateTimePeriod, 60000);
    return () => clearInterval(interval);
  }, [autoSync]);

  useEffect(() => {
    const weatherConfig = WEATHER_CONDITIONS.find(w => w.id === weather);
    const timeConfig = TIME_PERIODS.find(t => t.id === timePeriod);
    
    const environmentFactors = {
      weather: weatherConfig,
      timePeriod: timeConfig,
      temperature,
      overallModifier: (1 - weatherConfig.degradation) * timeConfig.modifier,
      temperatureModifier: temperature < 0 || temperature > 40 ? 0.9 : 1.0
    };
    
    onEnvironmentChange(environmentFactors);
  }, [weather, timePeriod, temperature, onEnvironmentChange]);

  const handleWeatherChange = (value) => {
    setWeather(value);
    const weatherConfig = WEATHER_CONDITIONS.find(w => w.id === value);
    addLog('info', `Weather condition changed to: ${weatherConfig.name}`, true);
  };

  const handleTimeChange = (value) => {
    setTimePeriod(value);
    const timeConfig = TIME_PERIODS.find(t => t.id === value);
    addLog('info', `Time period changed to: ${timeConfig.name}`, true);
  };

  const currentWeather = WEATHER_CONDITIONS.find(w => w.id === weather);
  const WeatherIcon = currentWeather?.icon || Sun;
  const currentTime = TIME_PERIODS.find(t => t.id === timePeriod);

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2 bg-[#1a1a2e] border-b border-[#2a2a3e] flex-shrink-0">
        <span className="text-xs font-mono uppercase tracking-wider text-gray-400">
          Environment
        </span>
        <label className="flex items-center gap-2 text-xs text-gray-500 cursor-pointer">
          <input
            type="checkbox"
            checked={autoSync}
            onChange={(e) => setAutoSync(e.target.checked)}
            className="rounded bg-[#1a1a2e] border-[#2a2a3e]"
          />
          Sync
        </label>
      </div>

      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto p-3 space-y-3">
        {/* Current Conditions Display */}
        <div className="flex items-center justify-between p-3 bg-gradient-to-r from-[#1a1a2e] to-[#12121a] rounded border border-[#2a2a3e]">
          <div className="flex items-center gap-3">
            {/* @ts-ignore */}
            <WeatherIcon className={`w-8 h-8 ${currentWeather?.color}`} />
            <div>
              <p className="text-sm font-bold text-gray-200">{currentWeather?.name}</p>
              <p className="text-xs text-gray-500">{currentTime?.name} ({currentTime?.hours})</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-lg font-mono text-amber-400">{temperature}°C</p>
            <p className="text-xs text-gray-500">
              Efficiency: {Math.round((1 - currentWeather?.degradation) * currentTime?.modifier * 100)}%
            </p>
          </div>
        </div>

        {/* Weather Selection */}
        <div>
          <label className="text-xs text-gray-500 block mb-1">Weather Condition</label>
          {/* @ts-ignore */}
          <Select value={weather} onValueChange={handleWeatherChange}>
            {/* @ts-ignore */}
            <SelectTrigger className="bg-[#0a0a0f] border-[#2a2a3e] text-xs h-8">
              <SelectValue />
            </SelectTrigger>
            {/* @ts-ignore */}
            <SelectContent>
              {WEATHER_CONDITIONS.map((w) => {
                const Icon = w.icon;
                return (
                  /* @ts-ignore */
                  <SelectItem key={w.id} value={w.id}>
                    <div className="flex items-center gap-2">
                      {/* @ts-ignore */}
                      <Icon className={`w-3 h-3 ${w.color}`} />
                      <span>{w.name}</span>
                      <span className="text-gray-500">(-{Math.round(w.degradation * 100)}%)</span>
                    </div>
                  </SelectItem>
                );
              })}
            </SelectContent>
          </Select>
        </div>

        {/* Time Period Selection */}
        <div>
          <label className="text-xs text-gray-500 block mb-1">Time Period</label>
          {/* @ts-ignore */}
          <Select value={timePeriod} onValueChange={handleTimeChange} disabled={autoSync}>
            {/* @ts-ignore */}
            <SelectTrigger className="bg-[#0a0a0f] border-[#2a2a3e] text-xs h-8">
              <SelectValue />
            </SelectTrigger>
            {/* @ts-ignore */}
            <SelectContent>
              {TIME_PERIODS.map((t) => (
                /* @ts-ignore */
                <SelectItem key={t.id} value={t.id}>
                  <div className="flex items-center gap-2">
                    {t.id === 'night' || t.id === 'dusk' ? 
                      /* @ts-ignore */
                      <Moon className="w-3 h-3 text-blue-400" /> : 
                      /* @ts-ignore */
                      <Sun className="w-3 h-3 text-yellow-400" />
                    }
                    <span>{t.name}</span>
                    <span className="text-gray-500">({t.hours})</span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Temperature Control */}
        <div>
          <label className="text-xs text-gray-500 block mb-1">
            Temperature: {temperature}°C
            {(temperature < 0 || temperature > 40) && (
              <span className="text-orange-400 ml-2">⚠ Extreme</span>
            )}
          </label>
          <input
            type="range"
            min="-20"
            max="50"
            value={temperature}
            onChange={(e) => setTemperature(parseInt(e.target.value))}
            className="w-full"
          />
        </div>
      </div>
    </div>
  );
}