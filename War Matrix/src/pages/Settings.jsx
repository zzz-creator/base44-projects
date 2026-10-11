import React, { useState, useEffect } from 'react';
import { base44 } from '../api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Slider } from '../components/ui/slider';
import { Switch } from '../components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Settings as SettingsIcon, Volume2, VolumeX, Music, Video, Upload, Loader2, Save, RefreshCw, Palette, Lock, Users, LogIn, Shield } from 'lucide-react';
import { startImpersonation } from '../components/ImpersonationBanner';
import MatrixBackground from '../components/war/MatrixBackground';
import BinaryBackground from '../components/effects/BinaryBackground';
import EquationBackground from '../components/effects/EquationBackground';
import StargateBackground from '../components/effects/StargateBackground';
import ForgottenSoldierBackground from '../components/effects/ForgottenSoldierBackground';
import ThemeSelector from '../components/themes/ThemeSelector';
import { THEMES, useTheme } from '../components/themes/ThemeProvider';
import { toast } from 'sonner';

export default function Settings() {
  const [currentUser, setCurrentUser] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [users, setUsers] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [impersonatingId, setImpersonatingId] = useState(null);
  const queryClient = useQueryClient();
  const { applyTheme } = useTheme();
  const API_BASE = 'http://localhost:3001';

  // User preferences (stored in localStorage)
  const [musicEnabled, setMusicEnabled] = useState(() => {
    const saved = localStorage.getItem('warMatrixSettings');
    return saved ? JSON.parse(saved).musicEnabled !== false : true;
  });
  const [soundEnabled, setSoundEnabled] = useState(() => {
    const saved = localStorage.getItem('warMatrixSettings');
    return saved ? JSON.parse(saved).soundEnabled !== false : true;
  });
  const [musicVolume, setMusicVolume] = useState(() => {
    const saved = localStorage.getItem('warMatrixSettings');
    return saved ? (JSON.parse(saved).musicVolume !== undefined ? JSON.parse(saved).musicVolume : 10) : 10;
  });
  const [soundVolume, setSoundVolume] = useState(() => {
    const saved = localStorage.getItem('warMatrixSettings');
    return saved ? JSON.parse(saved).soundVolume || 70 : 70;
  });
  const [dataRefreshIntervals, setDataRefreshIntervals] = useState(() => {
    const saved = localStorage.getItem('warMatrixSettings');
    return saved ? JSON.parse(saved).dataRefresh || { wars: 30, predictions: 60, realtime: 10 } : { wars: 30, predictions: 60, realtime: 10 };
  });
  const [matrixEffectEnabled, setMatrixEffectEnabled] = useState(() => {
    const saved = localStorage.getItem('warMatrixSettings');
    return saved ? JSON.parse(saved).matrixEffectEnabled !== false : true;
  });
  const [backgroundEffect, setBackgroundEffect] = useState(() => {
    const saved = localStorage.getItem('warMatrixSettings');
    return saved ? JSON.parse(saved).backgroundEffect || 'matrix' : 'matrix';
  });

  const [selectedTheme, setSelectedTheme] = useState(() => {
    const saved = localStorage.getItem('warMatrixTheme');
    return saved || 'matrix_protocol';
  });

  // Admin file uploads
  const [uploadingMusic, setUploadingMusic] = useState(false);
  const [uploadingVideo, setUploadingVideo] = useState(false);
  const [uploadingSoundEffect, setUploadingSoundEffect] = useState('');

  // Get current user
  useEffect(() => {
    const fetchUser = async () => {
      try {
        const user = await base44.auth.me();
        setCurrentUser(user);
        setIsAdmin(user.role === 'admin');
      } catch (error) {
        // User not logged in - app is public
        setCurrentUser(null);
        setIsAdmin(false);
      }
    };
    fetchUser();
  }, []);

  const loadUsers = async () => {
    setLoadingUsers(true);
    try {
      const token = localStorage.getItem('warmatrix_token') || localStorage.getItem('token');
      const res = await fetch(`${API_BASE}/api/auth/users`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) setUsers(await res.json());
    } catch (err) { console.error(err); }
    finally { setLoadingUsers(false); }
  };

  const handleImpersonate = async (user) => {
    setImpersonatingId(user.id);
    try {
      const token = localStorage.getItem('warmatrix_token') || localStorage.getItem('token');
      const res = await fetch(`${API_BASE}/api/auth/impersonate/${user.id}`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) throw new Error('Failed');
      const data = await res.json();
      startImpersonation(data.token, data.user);
    } catch (err) { console.error(err); }
    finally { setImpersonatingId(null); }
  };

  // Fetch app config
  const { data: appConfig } = useQuery({
    queryKey: ['appConfig'],
    queryFn: async () => {
      const configs = await base44.entities.AppConfig.list();
      return configs.length > 0 ? configs[0] : null;
    },
    initialData: null,
  });

  // Handle theme change
  const handleThemeChange = (themeId) => {
    setSelectedTheme(themeId);
    applyTheme(themeId); // Use centralized theme application
    const theme = THEMES[themeId];
    if (theme) {
      setBackgroundEffect(theme.backgroundEffect || 'matrix');
    }
  };

  // Save settings to localStorage
  const saveSettings = () => {
    const settings = {
      musicEnabled,
      soundEnabled,
      musicVolume,
      soundVolume,
      dataRefresh: dataRefreshIntervals,
      matrixEffectEnabled,
      backgroundEffect,
      sound_effects: appConfig?.sound_effects || {}
    };
    localStorage.setItem('warMatrixSettings', JSON.stringify(settings));
    
    // Dispatch custom event for immediate updates without reload
    window.dispatchEvent(new CustomEvent('settingsUpdated', { detail: settings }));
    
    toast.success('Settings saved successfully');
  };

  // Upload background music
  const uploadMusicMutation = useMutation({
    mutationFn: async (file) => {
      setUploadingMusic(true);
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      
      if (appConfig) {
        await base44.entities.AppConfig.update(appConfig.id, {
          background_music_url: file_url
        });
      } else {
        await base44.entities.AppConfig.create({
          config_key: 'main',
          background_music_url: file_url
        });
      }
      
      return file_url;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['appConfig']);
      toast.success('Background music uploaded');
      setUploadingMusic(false);
    },
    onError: () => {
      toast.error('Failed to upload music');
      setUploadingMusic(false);
    }
  });

  // Upload background video
  const uploadVideoMutation = useMutation({
    mutationFn: async (file) => {
      setUploadingVideo(true);
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      
      if (appConfig) {
        await base44.entities.AppConfig.update(appConfig.id, {
          background_video_url: file_url
        });
      } else {
        await base44.entities.AppConfig.create({
          config_key: 'main',
          background_video_url: file_url
        });
      }
      
      return file_url;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['appConfig']);
      toast.success('Background video uploaded');
      setUploadingVideo(false);
    },
    onError: () => {
      toast.error('Failed to upload video');
      setUploadingVideo(false);
    }
  });

  // Upload sound effect
  const uploadSoundEffectMutation = useMutation({
    mutationFn: async ({ file, effectType }) => {
      setUploadingSoundEffect(effectType);
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      
      const currentSoundEffects = appConfig?.sound_effects || {};
      const updatedSoundEffects = { ...currentSoundEffects, [effectType]: file_url };
      
      if (appConfig) {
        await base44.entities.AppConfig.update(appConfig.id, {
          sound_effects: updatedSoundEffects
        });
      } else {
        await base44.entities.AppConfig.create({
          config_key: 'main',
          sound_effects: updatedSoundEffects
        });
      }
      
      return file_url;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['appConfig']);
      toast.success('Sound effect uploaded');
      setUploadingSoundEffect('');
    },
    onError: () => {
      toast.error('Failed to upload sound effect');
      setUploadingSoundEffect('');
    }
  });

  const handleFileUpload = (e, type) => {
    const file = e.target.files[0];
    if (!file) return;

    if (type === 'music') {
      if (!file.type.includes('audio')) {
        toast.error('Please upload an audio file (MP3)');
        return;
      }
      uploadMusicMutation.mutate(file);
    } else if (type === 'video') {
      if (!file.type.includes('video')) {
        toast.error('Please upload a video file (MP4)');
        return;
      }
      uploadVideoMutation.mutate(file);
    }
  };

  const handleSoundEffectUpload = (e, effectType) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.type.includes('audio')) {
      toast.error('Please upload an audio file (MP3)');
      return;
    }
    uploadSoundEffectMutation.mutate({ file, effectType });
  };

  const renderBackgroundEffect = () => {
    if (!matrixEffectEnabled) return null;

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
        return <MatrixBackground />;
    }
  };

  return (
    <div className="relative min-h-screen">
      {renderBackgroundEffect()}
      
      <div className="relative z-10 p-8">
        <div className="max-w-5xl mx-auto space-y-6">
          <div className="text-center mb-8">
            <div className="flex items-center justify-center gap-3 mb-4">
              <SettingsIcon className="w-12 h-12 text-green-400" />
              <h1 className="text-4xl font-bold text-green-400 glow-text font-mono">
                SETTINGS
              </h1>
            </div>
            <p className="text-cyan-400/70 font-mono text-sm">
              Configure Your War Matrix Experience
            </p>
          </div>

          <Tabs defaultValue="audio" className="space-y-6">
            <TabsList className="grid w-full grid-cols-5 bg-slate-950/80 border border-green-500/30">
              <TabsTrigger value="themes">THEMES</TabsTrigger>
              <TabsTrigger value="audio">AUDIO</TabsTrigger>
              <TabsTrigger value="display">DISPLAY</TabsTrigger>
              <TabsTrigger value="data">DATA</TabsTrigger>
              {isAdmin && <TabsTrigger value="developer">DEVELOPER</TabsTrigger>}
              {isAdmin && <TabsTrigger value="users">USERS</TabsTrigger>}
            </TabsList>

            {/* Theme Settings */}
            <TabsContent value="themes" className="space-y-6">
              <Card className="bg-slate-950/80 backdrop-blur-xl cyber-border p-6">
                <ThemeSelector 
                  currentThemeId={selectedTheme}
                  onThemeChange={handleThemeChange}
                />
              </Card>
            </TabsContent>

            {/* Audio Settings */}
            <TabsContent value="audio" className="space-y-6">
              <Card className="bg-slate-950/80 backdrop-blur-xl cyber-border p-6">
                <h2 className="text-2xl font-bold text-green-400 glow-text font-mono mb-6 flex items-center gap-2">
                  <Volume2 className="w-6 h-6" />
                  AUDIO CONTROLS
                </h2>

                <div className="space-y-6">
                  <div className="flex items-center justify-between p-4 bg-slate-900/50 cyber-border rounded">
                    <div className="flex items-center gap-3">
                      <Music className="w-5 h-5 text-cyan-400" />
                      <div>
                        <Label className="text-slate-200 font-mono">Background Music</Label>
                        <p className="text-xs text-slate-400 font-mono">Toggle ambient music</p>
                      </div>
                    </div>
                    <Switch
                      checked={musicEnabled}
                      onCheckedChange={setMusicEnabled}
                    />
                  </div>

                  {musicEnabled && (
                    <div className="pl-8 space-y-2">
                      <Label className="text-slate-300 font-mono text-sm">Music Volume: {musicVolume}%</Label>
                      <Slider
                        value={[musicVolume]}
                        onValueChange={(v) => setMusicVolume(v[0])}
                        max={100}
                        step={5}
                        className="py-4"
                      />
                    </div>
                  )}

                  <div className="flex items-center justify-between p-4 bg-slate-900/50 cyber-border rounded">
                    <div className="flex items-center gap-3">
                      <Volume2 className="w-5 h-5 text-cyan-400" />
                      <div>
                        <Label className="text-slate-200 font-mono">Sound Effects</Label>
                        <p className="text-xs text-slate-400 font-mono">Toggle UI sound effects</p>
                      </div>
                    </div>
                    <Switch
                      checked={soundEnabled}
                      onCheckedChange={setSoundEnabled}
                    />
                  </div>

                  {soundEnabled && (
                    <div className="pl-8 space-y-2">
                      <Label className="text-slate-300 font-mono text-sm">Effects Volume: {soundVolume}%</Label>
                      <Slider
                        value={[soundVolume]}
                        onValueChange={(v) => setSoundVolume(v[0])}
                        max={100}
                        step={5}
                        className="py-4"
                      />
                    </div>
                  )}
                </div>
              </Card>
            </TabsContent>

            {/* Display Settings */}
            <TabsContent value="display" className="space-y-6">
              <Card className="bg-slate-950/80 backdrop-blur-xl cyber-border p-6">
                <h2 className="text-2xl font-bold text-green-400 glow-text font-mono mb-6 flex items-center gap-2">
                  <Palette className="w-6 h-6" />
                  VISUAL SETTINGS
                </h2>

                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-slate-900/50 cyber-border rounded">
                    <div>
                      <Label className="text-slate-200 font-mono">Background Effects</Label>
                      <p className="text-xs text-slate-400 font-mono">Enable/disable background animations</p>
                    </div>
                    <Switch
                      checked={matrixEffectEnabled}
                      onCheckedChange={setMatrixEffectEnabled}
                    />
                  </div>

                  {matrixEffectEnabled && (
                    <div className="p-4 bg-slate-900/50 cyber-border rounded">
                      <Label className="text-slate-200 font-mono mb-3 block">Select Effect Type</Label>
                      <div className="grid grid-cols-2 gap-3">
                        <Button
                          onClick={() => setBackgroundEffect('matrix')}
                          variant={backgroundEffect === 'matrix' ? 'default' : 'outline'}
                          className={`font-mono ${backgroundEffect === 'matrix' ? 'bg-green-500/20 text-green-400 border-green-500/50' : 'border-slate-500/30'}`}
                        >
                          Matrix Code
                        </Button>
                        <Button
                          onClick={() => setBackgroundEffect('binary')}
                          variant={backgroundEffect === 'binary' ? 'default' : 'outline'}
                          className={`font-mono ${backgroundEffect === 'binary' ? 'bg-green-500/20 text-green-400 border-green-500/50' : 'border-slate-500/30'}`}
                        >
                          Binary (0/1)
                        </Button>
                        <Button
                          onClick={() => setBackgroundEffect('equation')}
                          variant={backgroundEffect === 'equation' ? 'default' : 'outline'}
                          className={`font-mono ${backgroundEffect === 'equation' ? 'bg-cyan-500/20 text-cyan-400 border-cyan-500/50' : 'border-slate-500/30'}`}
                        >
                          Equations
                        </Button>
                        <Button
                          onClick={() => setBackgroundEffect('stargate')}
                          variant={backgroundEffect === 'stargate' ? 'default' : 'outline'}
                          className={`font-mono ${backgroundEffect === 'stargate' ? 'bg-cyan-500/20 text-cyan-400 border-cyan-500/50' : 'border-slate-500/30'}`}
                        >
                          Stargate
                        </Button>
                        <Button
                          onClick={() => setBackgroundEffect('soldier')}
                          variant={backgroundEffect === 'soldier' ? 'default' : 'outline'}
                          className={`font-mono col-span-2 ${backgroundEffect === 'soldier' ? 'bg-orange-500/20 text-orange-400 border-orange-500/50' : 'border-slate-500/30'}`}
                        >
                          Forgotten Soldiers
                        </Button>
                      </div>
                    </div>
                  )}

                  {appConfig?.background_video_url && (
                    <div className="p-4 bg-slate-900/50 cyber-border rounded">
                      <Label className="text-slate-200 font-mono mb-2 block">Background Video Preview</Label>
                      <video
                        src={appConfig.background_video_url}
                        className="w-full max-h-48 rounded cyber-border"
                        controls
                      />
                    </div>
                  )}
                </div>
              </Card>
            </TabsContent>

            {/* Data Settings */}
            <TabsContent value="data" className="space-y-6">
              <Card className="bg-slate-950/80 backdrop-blur-xl cyber-border p-6">
                <h2 className="text-2xl font-bold text-green-400 glow-text font-mono mb-6 flex items-center gap-2">
                  <RefreshCw className="w-6 h-6" />
                  DATA REFRESH INTERVALS
                </h2>

                <div className="space-y-6">
                  <div>
                    <Label className="text-slate-300 font-mono">Wars Data: {dataRefreshIntervals.wars} seconds</Label>
                    <Slider
                      value={[dataRefreshIntervals.wars]}
                      onValueChange={(v) => setDataRefreshIntervals({ ...dataRefreshIntervals, wars: v[0] })}
                      min={10}
                      max={300}
                      step={10}
                      className="py-4"
                    />
                  </div>

                  <div>
                    <Label className="text-slate-300 font-mono">Predictions: {dataRefreshIntervals.predictions} seconds</Label>
                    <Slider
                      value={[dataRefreshIntervals.predictions]}
                      onValueChange={(v) => setDataRefreshIntervals({ ...dataRefreshIntervals, predictions: v[0] })}
                      min={30}
                      max={600}
                      step={30}
                      className="py-4"
                    />
                  </div>

                  <div>
                    <Label className="text-slate-300 font-mono">Real-time Feed: {dataRefreshIntervals.realtime} seconds</Label>
                    <Slider
                      value={[dataRefreshIntervals.realtime]}
                      onValueChange={(v) => setDataRefreshIntervals({ ...dataRefreshIntervals, realtime: v[0] })}
                      min={5}
                      max={60}
                      step={5}
                      className="py-4"
                    />
                  </div>
                </div>
              </Card>
            </TabsContent>

            {/* Developer Options (Admin Only) */}
            {isAdmin && (
              <TabsContent value="developer" className="space-y-6">
                <Card className="bg-gradient-to-br from-purple-950/50 to-pink-950/50 backdrop-blur-xl cyber-border p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <Lock className="w-6 h-6 text-purple-400" />
                    <h2 className="text-2xl font-bold text-purple-400 glow-text font-mono">
                      DEVELOPER OPTIONS
                    </h2>
                  </div>
                  <p className="text-slate-400 font-mono text-sm mb-6">Admin-only media management</p>

                  <div className="space-y-6">
                    {/* Background Music Upload */}
                    <div className="p-4 bg-slate-900/50 cyber-border rounded">
                      <Label className="text-cyan-400 font-mono mb-3 block flex items-center gap-2">
                        <Music className="w-4 h-4" />
                        Background Music (MP3)
                      </Label>
                      {appConfig?.background_music_url && (
                        <div className="mb-3">
                          <audio controls src={appConfig.background_music_url} className="w-full mb-2" />
                        </div>
                      )}
                      <Input
                        type="file"
                        accept="audio/mp3,audio/mpeg"
                        onChange={(e) => handleFileUpload(e, 'music')}
                        disabled={uploadingMusic}
                        className="bg-slate-800/50 border-cyan-500/30 text-cyan-400"
                      />
                      {uploadingMusic && (
                        <div className="flex items-center gap-2 mt-2 text-cyan-400 font-mono text-sm">
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Uploading...
                        </div>
                      )}
                    </div>

                    {/* Background Video Upload */}
                    <div className="p-4 bg-slate-900/50 cyber-border rounded">
                      <Label className="text-cyan-400 font-mono mb-3 block flex items-center gap-2">
                        <Video className="w-4 h-4" />
                        Background Video (MP4)
                      </Label>
                      {appConfig?.background_video_url && (
                        <div className="mb-3">
                          <video controls src={appConfig.background_video_url} className="w-full max-h-48 rounded mb-2" />
                        </div>
                      )}
                      <Input
                        type="file"
                        accept="video/mp4"
                        onChange={(e) => handleFileUpload(e, 'video')}
                        disabled={uploadingVideo}
                        className="bg-slate-800/50 border-cyan-500/30 text-cyan-400"
                      />
                      {uploadingVideo && (
                        <div className="flex items-center gap-2 mt-2 text-cyan-400 font-mono text-sm">
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Uploading...
                        </div>
                      )}
                    </div>

                    {/* Sound Effects Upload */}
                    <div className="p-4 bg-slate-900/50 cyber-border rounded">
                      <Label className="text-cyan-400 font-mono mb-3 block flex items-center gap-2">
                        <Volume2 className="w-4 h-4" />
                        Sound Effects (MP3)
                      </Label>
                      <div className="space-y-3">
                        {['button_click', 'alert', 'notification', 'success', 'error'].map((effectType) => (
                          <div key={effectType}>
                            <Label className="text-slate-300 font-mono text-sm mb-2 block capitalize">
                              {effectType.replace('_', ' ')}
                            </Label>
                            {appConfig?.sound_effects?.[effectType] && (
                              <audio controls src={appConfig.sound_effects[effectType]} className="w-full mb-2" />
                            )}
                            <Input
                              type="file"
                              accept="audio/mp3,audio/mpeg"
                              onChange={(e) => handleSoundEffectUpload(e, effectType)}
                              disabled={uploadingSoundEffect === effectType}
                              className="bg-slate-800/50 border-slate-500/30 text-slate-300"
                            />
                            {uploadingSoundEffect === effectType && (
                              <div className="flex items-center gap-2 mt-1 text-cyan-400 font-mono text-xs">
                                <Loader2 className="w-3 h-3 animate-spin" />
                                Uploading...
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </Card>
              </TabsContent>
            )}

            {/* User Management (Admin Only) */}
            {isAdmin && (
              <TabsContent value="users" className="space-y-6">
                <Card className="bg-gradient-to-br from-purple-950/50 to-indigo-950/50 backdrop-blur-xl cyber-border p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <Shield className="w-6 h-6 text-purple-400" />
                      <h2 className="text-2xl font-bold text-purple-400 glow-text font-mono">USER MANAGEMENT</h2>
                    </div>
                    <button
                      onClick={loadUsers}
                      className="text-xs font-mono text-cyan-400 border border-cyan-500/30 px-3 py-1 rounded hover:bg-cyan-500/10"
                    >
                      {loadingUsers ? 'Loading...' : 'Load Users'}
                    </button>
                  </div>
                  <p className="text-slate-400 font-mono text-sm mb-6">Click "Login As" to impersonate any user. A banner will appear — click Exit to return to your admin session.</p>

                  {users.length === 0 && !loadingUsers && (
                    <div className="text-center py-8 text-slate-500 font-mono text-sm">
                      Click "Load Users" to fetch the user list
                    </div>
                  )}
                  {loadingUsers && (
                    <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin text-purple-400" /></div>
                  )}
                  <div className="space-y-2">
                    {users.map(user => (
                      <div key={user.id} className="flex items-center justify-between p-3 bg-slate-900/50 cyber-border rounded">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-purple-900/50 border border-purple-500/30 flex items-center justify-center">
                            <span className="text-sm font-bold text-purple-300">{(user.full_name || user.email || '?').charAt(0).toUpperCase()}</span>
                          </div>
                          <div>
                            <p className="font-mono text-slate-200">{user.full_name || 'No name'}</p>
                            <p className="text-xs text-slate-500 font-mono">{user.email}</p>
                          </div>
                          <span className={`text-xs font-mono px-2 py-0.5 rounded ${
                            user.role === 'admin' ? 'bg-purple-900/50 text-purple-300 border border-purple-500/30' : 'bg-cyan-900/50 text-cyan-300 border border-cyan-500/30'
                          }`}>{user.role}</span>
                        </div>
                        <button
                          onClick={() => handleImpersonate(user)}
                          disabled={impersonatingId === user.id}
                          className="flex items-center gap-1 text-xs font-mono text-green-400 border border-green-500/30 px-3 py-1 rounded hover:bg-green-500/10 disabled:opacity-50"
                        >
                          {impersonatingId === user.id
                            ? <Loader2 className="w-3 h-3 animate-spin" />
                            : <LogIn className="w-3 h-3" />}
                          LOGIN AS
                        </button>
                      </div>
                    ))}
                  </div>
                </Card>
              </TabsContent>
            )}
          </Tabs>

          {/* Save Button */}
          <Card className="bg-slate-950/80 backdrop-blur-xl cyber-border p-6">
            <Button
              onClick={saveSettings}
              className="w-full bg-gradient-to-r from-green-500 to-cyan-500 hover:from-green-600 hover:to-cyan-600 text-white font-mono text-lg py-6"
            >
              <Save className="w-5 h-5 mr-2" />
              SAVE SETTINGS
            </Button>
            <p className="text-center text-slate-400 font-mono text-xs mt-3">
              Settings will be saved locally and applied immediately
            </p>
          </Card>

          {/* Security Notice */}
          <Card className="bg-slate-950/80 backdrop-blur-xl border-green-500/30 p-4">
            <div className="flex items-start gap-3">
              <Lock className="w-5 h-5 text-green-400 mt-1" />
              <div>
                <h3 className="text-green-400 font-mono font-bold mb-1">Security Notice</h3>
                <p className="text-slate-300 font-mono text-xs leading-relaxed">
                  This app is publicly accessible. User-specific settings are stored locally in your browser. 
                  Developer options are restricted to admin users only for uploading media assets.
                </p>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}