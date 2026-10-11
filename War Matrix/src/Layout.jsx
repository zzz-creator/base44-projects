import React, { useState, useEffect, useRef } from "react";
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix Leaflet default icon issue
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});
import { Link, useLocation } from "react-router-dom";
import { createPageUrl } from "./utils";
import { Globe, History, TrendingUp, AlertTriangle, Orbit, Target, Activity, Zap, Brain, Bell, Radio, Settings, User } from "lucide-react";
import { base44 } from "./api/base44Client";
import { useQuery } from "@tanstack/react-query";
import BinaryBackground from "./components/effects/BinaryBackground";
import EquationBackground from "./components/effects/EquationBackground";
import StargateBackground from "./components/effects/StargateBackground";
import ForgottenSoldierBackground from "./components/effects/ForgottenSoldierBackground";
import MatrixBg from "./components/war/MatrixBackground";
import useSoundEffects from "./components/audio/SoundEffects";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarProvider,
  SidebarTrigger,
} from "./components/ui/sidebar";
import { Button } from "./components/ui/button";
import { Dialog, DialogContent } from "./components/ui/dialog";
import AlertCenter from "./components/alerts/AlertCenter";
import ThemeProvider from "./components/themes/ThemeProvider";
import GlitchOverlay from "./components/effects/GlitchOverlay";
import ImpersonationBanner from "./components/ImpersonationBanner";

const navigationItems = [
  {
    title: "War Command",
    url: createPageUrl("Dashboard"),
    icon: Activity,
  },
  {
    title: "Strategy Hub",
    url: createPageUrl("StrategyHub"),
    icon: Brain,
  },
  {
    title: "Real-time Data Hub",
    url: createPageUrl("RealTimeDataHub"),
    icon: Radio,
  },
  {
    title: "Current Wars",
    url: createPageUrl("CurrentWars"),
    icon: Globe,
  },
  {
    title: "Past Wars",
    url: createPageUrl("PastWars"),
    icon: History,
  },
  {
    title: "Future Wars",
    url: createPageUrl("FutureWars"),
    icon: TrendingUp,
  },
  {
    title: "Conflict Simulator",
    url: createPageUrl("ConflictSimulator"),
    icon: Zap,
  },
  {
    title: "Alerts",
    url: createPageUrl("AlertsManagement"),
    icon: Bell,
  },
  {
    title: "Help & Info",
    url: createPageUrl("Help"),
    icon: Settings,
  },
  {
    title: "User Profile",
    url: createPageUrl("UserProfile"),
    icon: User,
  },
  {
    title: "Settings",
    url: createPageUrl("Settings"),
    icon: Settings,
  },
];

export default function Layout({ children, currentPageName }) {
  const location = useLocation();
  const [showAlerts, setShowAlerts] = useState(false);
  const [alertCount] = useState(3); // Simulated alert count
  const audioRef = useRef(null);
  
  // Initialize sound effects
  useSoundEffects();

  // Fetch app config for background music
  const { data: appConfig } = useQuery({
    queryKey: ['appConfig'],
    queryFn: async () => {
      const configs = await base44.entities.AppConfig.list();
      return configs.length > 0 ? configs[0] : null;
    },
    initialData: null,
  });

  // Get user settings from localStorage
  const [musicSettings, setMusicSettings] = useState(() => {
    const saved = localStorage.getItem('warMatrixSettings');
    if (saved) {
      const settings = JSON.parse(saved);
      return {
        enabled: settings.musicEnabled !== false,
        volume: settings.musicVolume !== undefined ? settings.musicVolume : 10
      };
    }
    return { enabled: true, volume: 10 };
  });

  // Control audio playback
  useEffect(() => {
    if (audioRef.current && appConfig?.background_music_url) {
      if (musicSettings.enabled) {
        audioRef.current.volume = musicSettings.volume / 100;
        audioRef.current.play().catch(() => {
          // Auto-play might be blocked by browser
        });
      } else {
        audioRef.current.pause();
      }
    }
  }, [musicSettings.enabled, musicSettings.volume, appConfig?.background_music_url]);

  // Get background effect setting
  const [backgroundEffect, setBackgroundEffect] = useState(() => {
    const saved = localStorage.getItem('warMatrixSettings');
    if (saved) {
      const settings = JSON.parse(saved);
      return settings.backgroundEffect || 'matrix';
    }
    return 'matrix';
  });

  const [effectsEnabled, setEffectsEnabled] = useState(() => {
    const saved = localStorage.getItem('warMatrixSettings');
    if (saved) {
      const settings = JSON.parse(saved);
      return settings.matrixEffectEnabled !== false;
    }
    return true;
  });

  // Listen for settings changes including custom events
  useEffect(() => {
    const handleStorageChange = () => {
      const saved = localStorage.getItem('warMatrixSettings');
      if (saved) {
        const settings = JSON.parse(saved);
        setMusicSettings({
          enabled: settings.musicEnabled !== false,
          volume: settings.musicVolume !== undefined ? settings.musicVolume : 10
        });
        setBackgroundEffect(settings.backgroundEffect || 'matrix');
        setEffectsEnabled(settings.matrixEffectEnabled !== false);
      }
    };

    // Listen to custom event for immediate updates
    const handleSettingsUpdate = (e) => {
      if (e.detail) {
        setBackgroundEffect(e.detail.backgroundEffect || 'matrix');
        setEffectsEnabled(e.detail.matrixEffectEnabled !== false);
        setMusicSettings({
          enabled: e.detail.musicEnabled !== false,
          volume: e.detail.musicVolume !== undefined ? e.detail.musicVolume : 10
        });
      }
    };

    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('settingsUpdated', handleSettingsUpdate);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('settingsUpdated', handleSettingsUpdate);
    };
  }, []);

  // Render appropriate background effect
  const renderBackgroundEffect = () => {
    if (!effectsEnabled) return null;
    
    switch (backgroundEffect) {
      case 'binary':
        return <BinaryBackground />;
      case 'equation':
        return <EquationBackground />;
      case 'stargate':
        return <StargateBackground />;
      case 'soldier':
        return <ForgottenSoldierBackground />;
      case 'matrix':
      default:
        return <MatrixBg />;
    }
  };

  return (
    <ThemeProvider>
    <SidebarProvider>
      <ImpersonationBanner />
      {renderBackgroundEffect()}
      <style>{`
        :root {
          --matrix-green: #00ff41;
          --matrix-dark: #0d0208;
          --cyber-cyan: #00f5ff;
          --neon-purple: #bf00ff;
        }
        
        body {
          background: #0a0e27;
        }
        
        .matrix-bg {
          background: linear-gradient(135deg, #0a0e27 0%, #1a1f3a 100%);
          position: relative;
        }
        
        .matrix-bg::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background-image: 
            linear-gradient(rgba(0, 255, 65, 0.03) 1px, transparent 1px),
            linear-gradient(90deg, rgba(0, 255, 65, 0.03) 1px, transparent 1px);
          background-size: 50px 50px;
          pointer-events: none;
        }
        
        .glow-text {
          text-shadow: 0 0 10px var(--matrix-green), 0 0 20px var(--matrix-green);
        }
        
        .cyber-border {
          border: 1px solid rgba(0, 255, 65, 0.3);
          box-shadow: 0 0 15px rgba(0, 255, 65, 0.1);
        }
        
        .hover-glow:hover {
          box-shadow: 0 0 20px rgba(0, 255, 65, 0.3);
          border-color: var(--matrix-green);
        }
        
        @keyframes pulse-sky {
          0%, 100% {
            box-shadow: 0 0 10px rgba(56, 189, 248, 0.3);
            background-color: rgba(56, 189, 248, 0.1);
          }
          50% {
            box-shadow: 0 0 20px rgba(56, 189, 248, 0.5);
            background-color: rgba(56, 189, 248, 0.15);
          }
        }

        .menu-hover-pulse:hover {
          animation: pulse-sky 1.5s ease-in-out infinite;
        }
      `}</style>
      <div className="min-h-screen flex w-full matrix-bg">
        <Sidebar className="border-r border-sky-900/40 bg-gradient-to-b from-slate-950 via-sky-950/30 to-slate-950 backdrop-blur-xl">
          <SidebarHeader className="border-b border-sky-800/40 p-4 bg-sky-950/20">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-sky-500 to-cyan-500 rounded-lg flex items-center justify-center shadow-lg shadow-sky-500/50">
                  <Globe className="w-6 h-6 text-slate-950" />
                </div>
                <div>
                  <h2 className="font-bold text-sky-400 text-lg glow-text tracking-wider">WAR MATRIX</h2>
                  <p className="text-xs text-black font-mono font-semibold">Global Conflict Intelligence</p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setShowAlerts(true)}
                className="relative hover:bg-cyan-500/10"
              >
                <Bell className="w-5 h-5 text-cyan-400" />
                {alertCount > 0 && (
                  <div className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full flex items-center justify-center">
                    <span className="text-[10px] font-bold text-white">{alertCount}</span>
                  </div>
                )}
              </Button>
            </div>
          </SidebarHeader>
          
          <SidebarContent className="p-2">
            <SidebarGroup>
              <SidebarGroupLabel className="text-xs font-bold text-black uppercase tracking-widest px-3 py-3 font-mono bg-gradient-to-r from-red-900/60 to-red-800/40 rounded-lg mx-2 mb-2 border border-red-700/30">
                    Tactical Operations
                  </SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {navigationItems.map((item) => {
                    const itemPath = item.url.split('?')[0];
                    const isActive = location.pathname === itemPath || 
                                   (itemPath.includes('Dashboard') && location.pathname === '/') ||
                                   (location.pathname !== '/' && itemPath !== '/' && location.pathname.startsWith(itemPath));
                    
                    return (
                      <SidebarMenuItem key={item.title}>
                        <SidebarMenuButton 
                          asChild 
                          className={`hover:bg-sky-500/15 hover:text-sky-300 transition-all duration-300 rounded-lg mb-1 font-mono menu-hover-pulse ${
                                isActive ? 'bg-sky-500/25 text-sky-300 border border-sky-500/40' : 'text-slate-400'
                              }`}
                        >
                          <Link to={item.url} className="flex items-center gap-3 px-3 py-2.5 menu-item">
                            <item.icon className="w-4 h-4" />
                            <span className="font-medium text-sm">{item.title}</span>
                          </Link>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    );
                  })}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>

            <SidebarGroup className="mt-6">
              <SidebarGroupLabel className="text-xs font-bold text-black uppercase tracking-widest px-3 py-2 font-mono bg-gradient-to-r from-blue-900/60 to-blue-800/40 rounded-lg mx-2 mb-2 border border-blue-700/30">
                    System Status
                  </SidebarGroupLabel>
              <SidebarGroupContent>
                <div className="px-3 py-3 space-y-3 bg-sky-950/30 rounded-lg mx-2">
                  <div className="flex items-center justify-between text-sm font-mono">
                    <span className="text-slate-400">Active Conflicts</span>
                    <span className="text-green-400 font-bold glow-text">LIVE</span>
                  </div>
                  <div className="flex items-center justify-between text-sm font-mono">
                    <span className="text-slate-400">Data Stream</span>
                    <span className="text-sky-400 font-bold">SYNCED</span>
                  </div>
                  <div className="flex items-center justify-between text-sm font-mono">
                    <span className="text-slate-400">AI Analysis</span>
                    <span className="text-purple-400 font-bold">ACTIVE</span>
                  </div>
                </div>
              </SidebarGroupContent>
            </SidebarGroup>
          </SidebarContent>
        </Sidebar>

        <main className="flex-1 flex flex-col overflow-hidden bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
          <header className="bg-slate-950/80 backdrop-blur-xl border-b border-green-900/30 px-6 py-4 md:hidden">
            <div className="flex items-center gap-4 justify-between">
              <div className="flex items-center gap-4">
                <SidebarTrigger className="hover:bg-green-500/10 p-2 rounded-lg transition-colors duration-200" />
                <h1 className="text-xl font-bold text-green-400 font-mono glow-text">WAR MATRIX</h1>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setShowAlerts(true)}
                className="relative hover:bg-cyan-500/10"
              >
                <Bell className="w-5 h-5 text-cyan-400" />
                {alertCount > 0 && (
                  <div className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full flex items-center justify-center">
                    <span className="text-[10px] font-bold text-white">{alertCount}</span>
                  </div>
                )}
              </Button>
            </div>
          </header>

          <div className="flex-1 overflow-auto relative">
            <GlitchOverlay enabled={true} intensity="low" scanlines={true} />
            {children}
          </div>
        </main>
      </div>

      {/* Alert Center Dialog */}
      <Dialog open={showAlerts} onOpenChange={setShowAlerts}>
        <DialogContent className="p-0 bg-transparent border-none max-w-2xl">
          <AlertCenter onClose={() => setShowAlerts(false)} />
        </DialogContent>
      </Dialog>

      {/* Background Music Audio Element */}
      {appConfig?.background_music_url && (
        <audio
          ref={audioRef}
          src={appConfig.background_music_url}
          loop
          preload="auto"
        />
      )}
    </SidebarProvider>
    </ThemeProvider>
  );
}