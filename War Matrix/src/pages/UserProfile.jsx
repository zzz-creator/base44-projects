import React, { useState, useEffect } from 'react';
import { base44 } from '../api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Badge } from '../components/ui/badge';
import { Switch } from '../components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { User, Save, Plus, Trash2, Link as LinkIcon, Settings, Layout, Bell, FileText, Database, LogIn } from 'lucide-react';
import MatrixBackground from '../components/war/MatrixBackground';
import { toast } from 'sonner';

export default function UserProfile() {
  const queryClient = useQueryClient();
  const [profile, setProfile] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  const { data: user, isLoading: userLoading } = useQuery({
    queryKey: ['currentUser'],
    queryFn: async () => {
      const authenticated = await base44.auth.isAuthenticated();
      setIsAuthenticated(authenticated);
      if (authenticated) {
        return base44.auth.me();
      }
      return null;
    },
  });

  const { data: userProfile, isLoading } = useQuery({
    queryKey: ['userProfile', user?.email],
    queryFn: async () => {
      const profiles = await base44.entities.UserProfile.filter({ created_by: user.email });
      return profiles.length > 0 ? profiles[0] : null;
    },
    enabled: !!user,
  });

  useEffect(() => {
    if (userProfile) {
      setProfile(userProfile);
    } else if (user) {
      // Initialize default profile
      setProfile({
        default_regions: [],
        preferred_visualization_types: {
          economic_data: 'line',
          threat_level: 'heatmap',
          conflicts: 'map'
        },
        saved_analysis_templates: [],
        external_data_feeds: [],
        alert_preferences: {
          email_frequency: 'immediate',
          priority_regions: [],
          threat_threshold: 70,
          quiet_hours: {
            enabled: false,
            start: '22:00',
            end: '08:00'
          }
        },
        dashboard_layout: {
          enabled_widgets: ['metrics', 'map', 'alerts', 'heatmap'],
          widget_positions: []
        }
      });
    }
  }, [userProfile, user]);

  const saveProfileMutation = useMutation({
    mutationFn: async (profileData) => {
      if (userProfile?.id) {
        return base44.entities.UserProfile.update(userProfile.id, profileData);
      } else {
        return base44.entities.UserProfile.create(profileData);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['userProfile'] });
      toast.success('Profile saved successfully');
    },
  });

  const regions = ['Middle East', 'East Asia', 'Europe', 'Sub-Saharan Africa', 'South Asia', 'Latin America', 'North America', 'Central Asia'];

  const toggleRegion = (region) => {
    const regions = profile.default_regions.includes(region)
      ? profile.default_regions.filter(r => r !== region)
      : [...profile.default_regions, region];
    setProfile({ ...profile, default_regions: regions });
  };

  const addExternalFeed = () => {
    const newFeed = {
      id: Date.now().toString(),
      name: '',
      type: 'rss',
      url: '',
      category: 'news',
      refresh_interval: 30,
      is_active: true,
      mapping: {
        field_mappings: {},
        target_indicator: ''
      }
    };
    setProfile({
      ...profile,
      external_data_feeds: [...(profile.external_data_feeds || []), newFeed]
    });
  };

  const updateExternalFeed = (index, field, value) => {
    const feeds = [...profile.external_data_feeds];
    feeds[index] = { ...feeds[index], [field]: value };
    setProfile({ ...profile, external_data_feeds: feeds });
  };

  const removeExternalFeed = (index) => {
    const feeds = profile.external_data_feeds.filter((_, i) => i !== index);
    setProfile({ ...profile, external_data_feeds: feeds });
  };

  const addAnalysisTemplate = () => {
    const newTemplate = {
      id: Date.now().toString(),
      name: '',
      description: '',
      template_data: {},
      created_at: new Date().toISOString()
    };
    setProfile({
      ...profile,
      saved_analysis_templates: [...(profile.saved_analysis_templates || []), newTemplate]
    });
  };

  const updateAnalysisTemplate = (index, field, value) => {
    const templates = [...profile.saved_analysis_templates];
    templates[index] = { ...templates[index], [field]: value };
    setProfile({ ...profile, saved_analysis_templates: templates });
  };

  const removeAnalysisTemplate = (index) => {
    const templates = profile.saved_analysis_templates.filter((_, i) => i !== index);
    setProfile({ ...profile, saved_analysis_templates: templates });
  };

  if (userLoading) {
    return (
      <div className="relative min-h-screen">
        <MatrixBackground />
        <div className="relative z-10 p-8">
          <Card className="max-w-4xl mx-auto bg-slate-950/80 backdrop-blur-xl cyber-border p-8 text-center">
            <p className="text-slate-400 font-mono">Loading...</p>
          </Card>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="relative min-h-screen">
        <MatrixBackground />
        <div className="relative z-10 p-8">
          <Card className="max-w-lg mx-auto bg-slate-950/80 backdrop-blur-xl cyber-border p-12 text-center">
            <User className="w-20 h-20 text-cyan-400/50 mx-auto mb-6" />
            <h2 className="text-2xl font-bold text-cyan-400 glow-text font-mono mb-4">
              SIGN IN REQUIRED
            </h2>
            <p className="text-slate-400 font-mono text-sm mb-6">
              Sign in to access your profile, customize your dashboard, and manage your preferences.
            </p>
            <Button
              onClick={() => base44.auth.redirectToLogin()}
              className="bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white font-mono"
            >
              <LogIn className="w-5 h-5 mr-2" />
              SIGN IN
            </Button>
          </Card>
        </div>
      </div>
    );
  }

  if (isLoading || !profile) {
    return (
      <div className="relative min-h-screen">
        <MatrixBackground />
        <div className="relative z-10 p-8">
          <Card className="max-w-4xl mx-auto bg-slate-950/80 backdrop-blur-xl cyber-border p-8 text-center">
            <p className="text-slate-400 font-mono">Loading profile...</p>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen">
      <MatrixBackground />
      
      <div className="relative z-10 p-8">
        <div className="max-w-6xl mx-auto space-y-6">
          <div className="flex items-center justify-between mb-8">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <User className="w-10 h-10 text-cyan-400" />
                <h1 className="text-4xl font-bold text-cyan-400 glow-text font-mono">
                  USER PROFILE
                </h1>
              </div>
              <p className="text-slate-400 font-mono text-sm">
                {user?.email}
              </p>
            </div>
            <Button
              onClick={() => saveProfileMutation.mutate(profile)}
              className="bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white font-mono"
              disabled={saveProfileMutation.isPending}
            >
              <Save className="w-5 h-5 mr-2" />
              SAVE PROFILE
            </Button>
          </div>

          <Tabs defaultValue="dashboard" className="space-y-6">
            <TabsList className="grid w-full grid-cols-5 bg-slate-950/80 border border-cyan-500/30">
              <TabsTrigger value="dashboard" className="data-[state=active]:bg-cyan-500/20 data-[state=active]:text-cyan-400 font-mono">
                <Layout className="w-4 h-4 mr-2" />
                DASHBOARD
              </TabsTrigger>
              <TabsTrigger value="regions" className="data-[state=active]:bg-green-500/20 data-[state=active]:text-green-400 font-mono">
                <Settings className="w-4 h-4 mr-2" />
                REGIONS
              </TabsTrigger>
              <TabsTrigger value="alerts" className="data-[state=active]:bg-orange-500/20 data-[state=active]:text-orange-400 font-mono">
                <Bell className="w-4 h-4 mr-2" />
                ALERTS
              </TabsTrigger>
              <TabsTrigger value="templates" className="data-[state=active]:bg-purple-500/20 data-[state=active]:text-purple-400 font-mono">
                <FileText className="w-4 h-4 mr-2" />
                TEMPLATES
              </TabsTrigger>
              <TabsTrigger value="feeds" className="data-[state=active]:bg-pink-500/20 data-[state=active]:text-pink-400 font-mono">
                <Database className="w-4 h-4 mr-2" />
                DATA FEEDS
              </TabsTrigger>
            </TabsList>

            <TabsContent value="dashboard">
              <Card className="bg-slate-950/80 backdrop-blur-xl cyber-border p-6">
                <h2 className="text-2xl font-bold text-cyan-400 glow-text font-mono mb-6">
                  DASHBOARD CUSTOMIZATION
                </h2>
                
                <div className="space-y-6">
                  <div>
                    <Label className="text-slate-300 font-mono mb-3 block">Enabled Dashboard Widgets</Label>
                    <div className="grid grid-cols-2 gap-3 mb-6">
                      {[
                        { id: 'metrics', name: 'Live Metrics' },
                        { id: 'map', name: 'Interactive Map' },
                        { id: 'alerts', name: 'Recent Alerts' },
                        { id: 'heatmap', name: 'Threat Heatmap' }
                      ].map(widget => (
                        <div key={widget.id} className="flex items-center gap-2 p-3 bg-slate-900/50 cyber-border rounded">
                          <Switch
                            checked={profile.dashboard_layout?.enabled_widgets?.includes(widget.id)}
                            onCheckedChange={(checked) => {
                              const current = profile.dashboard_layout?.enabled_widgets || [];
                              const updated = checked
                                ? [...current, widget.id]
                                : current.filter(id => id !== widget.id);
                              setProfile({
                                ...profile,
                                dashboard_layout: {
                                  ...profile.dashboard_layout,
                                  enabled_widgets: updated
                                }
                              });
                            }}
                          />
                          <Label className="text-slate-300 font-mono text-sm">{widget.name}</Label>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <Label className="text-slate-300 font-mono mb-3 block">Preferred Visualization Types</Label>
                    
                    <div className="space-y-4">
                      <div>
                        <Label className="text-slate-400 font-mono text-sm mb-2 block">Economic Data</Label>
                        <Select
                          value={profile.preferred_visualization_types?.economic_data || 'line'}
                          onValueChange={(value) => setProfile({
                            ...profile,
                            preferred_visualization_types: {
                              ...profile.preferred_visualization_types,
                              economic_data: value
                            }
                          })}
                        >
                          <SelectTrigger className="bg-slate-900/50 border-cyan-500/30 text-cyan-400 font-mono">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="line">Line Chart</SelectItem>
                            <SelectItem value="bar">Bar Chart</SelectItem>
                            <SelectItem value="area">Area Chart</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <Label className="text-slate-400 font-mono text-sm mb-2 block">Threat Level Display</Label>
                        <Select
                          value={profile.preferred_visualization_types?.threat_level || 'heatmap'}
                          onValueChange={(value) => setProfile({
                            ...profile,
                            preferred_visualization_types: {
                              ...profile.preferred_visualization_types,
                              threat_level: value
                            }
                          })}
                        >
                          <SelectTrigger className="bg-slate-900/50 border-cyan-500/30 text-cyan-400 font-mono">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="heatmap">Heat Map</SelectItem>
                            <SelectItem value="gauge">Gauge</SelectItem>
                            <SelectItem value="chart">Chart</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <Label className="text-slate-400 font-mono text-sm mb-2 block">Conflicts Display</Label>
                        <Select
                          value={profile.preferred_visualization_types?.conflicts || 'map'}
                          onValueChange={(value) => setProfile({
                            ...profile,
                            preferred_visualization_types: {
                              ...profile.preferred_visualization_types,
                              conflicts: value
                            }
                          })}
                        >
                          <SelectTrigger className="bg-slate-900/50 border-cyan-500/30 text-cyan-400 font-mono">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="map">Interactive Map</SelectItem>
                            <SelectItem value="list">List View</SelectItem>
                            <SelectItem value="timeline">Timeline</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>
                </div>
              </Card>
            </TabsContent>

            <TabsContent value="regions">
              <Card className="bg-slate-950/80 backdrop-blur-xl cyber-border p-6">
                <h2 className="text-2xl font-bold text-green-400 glow-text font-mono mb-6">
                  DEFAULT REGIONS OF INTEREST
                </h2>
                
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {regions.map(region => (
                    <Button
                      key={region}
                      type="button"
                      variant={profile.default_regions?.includes(region) ? 'default' : 'outline'}
                      className={`font-mono text-xs ${
                        profile.default_regions?.includes(region)
                          ? 'bg-green-500 hover:bg-green-600'
                          : 'border-green-500/30 text-green-400 hover:bg-green-500/10'
                      }`}
                      onClick={() => toggleRegion(region)}
                    >
                      {region}
                    </Button>
                  ))}
                </div>
              </Card>
            </TabsContent>

            <TabsContent value="alerts">
              <Card className="bg-slate-950/80 backdrop-blur-xl cyber-border p-6">
                <h2 className="text-2xl font-bold text-orange-400 glow-text font-mono mb-6">
                  ALERT PREFERENCES
                </h2>
                
                <div className="space-y-6">
                  <div>
                    <Label className="text-slate-300 font-mono mb-2 block">Email Frequency</Label>
                    <Select
                      value={profile.alert_preferences?.email_frequency || 'immediate'}
                      onValueChange={(value) => setProfile({
                        ...profile,
                        alert_preferences: {
                          ...profile.alert_preferences,
                          email_frequency: value
                        }
                      })}
                    >
                      <SelectTrigger className="bg-slate-900/50 border-orange-500/30 text-orange-400 font-mono">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="immediate">Immediate</SelectItem>
                        <SelectItem value="daily">Daily Digest</SelectItem>
                        <SelectItem value="weekly">Weekly Summary</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label className="text-slate-300 font-mono mb-2 block">
                      Threat Threshold: {profile.alert_preferences?.threat_threshold || 70}%
                    </Label>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={profile.alert_preferences?.threat_threshold || 70}
                      onChange={(e) => setProfile({
                        ...profile,
                        alert_preferences: {
                          ...profile.alert_preferences,
                          threat_threshold: parseInt(e.target.value)
                        }
                      })}
                      className="w-full"
                    />
                  </div>

                  <div className="p-4 bg-slate-900/50 cyber-border rounded">
                    <div className="flex items-center justify-between mb-4">
                      <Label className="text-slate-300 font-mono">Quiet Hours</Label>
                      <Switch
                        checked={profile.alert_preferences?.quiet_hours?.enabled || false}
                        onCheckedChange={(checked) => setProfile({
                          ...profile,
                          alert_preferences: {
                            ...profile.alert_preferences,
                            quiet_hours: {
                              ...profile.alert_preferences?.quiet_hours,
                              enabled: checked
                            }
                          }
                        })}
                      />
                    </div>
                    
                    {profile.alert_preferences?.quiet_hours?.enabled && (
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label className="text-slate-400 font-mono text-sm mb-2 block">Start Time</Label>
                          <Input
                            type="time"
                            value={profile.alert_preferences?.quiet_hours?.start || '22:00'}
                            onChange={(e) => setProfile({
                              ...profile,
                              alert_preferences: {
                                ...profile.alert_preferences,
                                quiet_hours: {
                                  ...profile.alert_preferences?.quiet_hours,
                                  start: e.target.value
                                }
                              }
                            })}
                            className="bg-slate-900/50 border-orange-500/30 text-orange-400 font-mono"
                          />
                        </div>
                        <div>
                          <Label className="text-slate-400 font-mono text-sm mb-2 block">End Time</Label>
                          <Input
                            type="time"
                            value={profile.alert_preferences?.quiet_hours?.end || '08:00'}
                            onChange={(e) => setProfile({
                              ...profile,
                              alert_preferences: {
                                ...profile.alert_preferences,
                                quiet_hours: {
                                  ...profile.alert_preferences?.quiet_hours,
                                  end: e.target.value
                                }
                              }
                            })}
                            className="bg-slate-900/50 border-orange-500/30 text-orange-400 font-mono"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </Card>
            </TabsContent>

            <TabsContent value="templates">
              <Card className="bg-slate-950/80 backdrop-blur-xl cyber-border p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold text-purple-400 glow-text font-mono">
                    SAVED ANALYSIS TEMPLATES
                  </h2>
                  <Button
                    onClick={addAnalysisTemplate}
                    className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-mono"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    ADD TEMPLATE
                  </Button>
                </div>

                {profile.saved_analysis_templates?.length === 0 ? (
                  <div className="text-center py-8">
                    <FileText className="w-16 h-16 text-slate-600 mx-auto mb-4" />
                    <p className="text-slate-400 font-mono">No templates saved yet</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {profile.saved_analysis_templates?.map((template, idx) => (
                      <div key={template.id} className="bg-slate-900/50 cyber-border rounded p-4">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex-1 space-y-2">
                            <Input
                              value={template.name}
                              onChange={(e) => updateAnalysisTemplate(idx, 'name', e.target.value)}
                              placeholder="Template Name"
                              className="bg-slate-800/50 border-purple-500/30 text-purple-400 font-mono"
                            />
                            <Input
                              value={template.description}
                              onChange={(e) => updateAnalysisTemplate(idx, 'description', e.target.value)}
                              placeholder="Description"
                              className="bg-slate-800/50 border-purple-500/30 text-purple-400 font-mono"
                            />
                          </div>
                          <Button
                            onClick={() => removeAnalysisTemplate(idx)}
                            variant="ghost"
                            size="icon"
                            className="hover:bg-red-500/10 ml-2"
                          >
                            <Trash2 className="w-4 h-4 text-red-400" />
                          </Button>
                        </div>
                        <Badge className="bg-purple-500/20 text-purple-400 border-purple-500/30 font-mono text-xs">
                          Created: {new Date(template.created_at).toLocaleDateString()}
                        </Badge>
                      </div>
                    ))}
                  </div>
                )}
              </Card>
            </TabsContent>

            <TabsContent value="feeds">
              <Card className="bg-slate-950/80 backdrop-blur-xl cyber-border p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold text-pink-400 glow-text font-mono">
                    EXTERNAL DATA FEEDS
                  </h2>
                  <Button
                    onClick={addExternalFeed}
                    className="bg-gradient-to-r from-pink-500 to-red-500 hover:from-pink-600 hover:to-red-600 text-white font-mono"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    ADD DATA FEED
                  </Button>
                </div>

                {profile.external_data_feeds?.length === 0 ? (
                  <div className="text-center py-8">
                    <Database className="w-16 h-16 text-slate-600 mx-auto mb-4" />
                    <p className="text-slate-400 font-mono mb-2">No external feeds configured</p>
                    <p className="text-slate-500 font-mono text-sm">
                      Add custom RSS feeds, APIs, or webhooks to enrich your intelligence data
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {profile.external_data_feeds?.map((feed, idx) => (
                      <div key={feed.id} className="bg-gradient-to-br from-pink-950/30 to-red-950/30 cyber-border rounded p-4">
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex items-center gap-2">
                            <LinkIcon className="w-5 h-5 text-pink-400" />
                            <Input
                              value={feed.name}
                              onChange={(e) => updateExternalFeed(idx, 'name', e.target.value)}
                              placeholder="Feed Name"
                              className="bg-slate-800/50 border-pink-500/30 text-pink-400 font-mono"
                            />
                          </div>
                          <div className="flex items-center gap-2">
                            <Switch
                              checked={feed.is_active}
                              onCheckedChange={(checked) => updateExternalFeed(idx, 'is_active', checked)}
                            />
                            <Button
                              onClick={() => removeExternalFeed(idx)}
                              variant="ghost"
                              size="icon"
                              className="hover:bg-red-500/10"
                            >
                              <Trash2 className="w-4 h-4 text-red-400" />
                            </Button>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3 mb-3">
                          <div>
                            <Label className="text-slate-400 font-mono text-xs mb-1 block">Type</Label>
                            <Select
                              value={feed.type}
                              onValueChange={(value) => updateExternalFeed(idx, 'type', value)}
                            >
                              <SelectTrigger className="bg-slate-800/50 border-pink-500/30 text-pink-400 font-mono text-xs">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="rss">RSS Feed</SelectItem>
                                <SelectItem value="api">REST API</SelectItem>
                                <SelectItem value="webhook">Webhook</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div>
                            <Label className="text-slate-400 font-mono text-xs mb-1 block">Category</Label>
                            <Select
                              value={feed.category}
                              onValueChange={(value) => updateExternalFeed(idx, 'category', value)}
                            >
                              <SelectTrigger className="bg-slate-800/50 border-pink-500/30 text-pink-400 font-mono text-xs">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="news">News</SelectItem>
                                <SelectItem value="economic">Economic</SelectItem>
                                <SelectItem value="intelligence">Intelligence</SelectItem>
                                <SelectItem value="sentiment">Sentiment</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>

                        <div className="mb-3">
                          <Label className="text-slate-400 font-mono text-xs mb-1 block">URL</Label>
                          <Input
                            value={feed.url}
                            onChange={(e) => updateExternalFeed(idx, 'url', e.target.value)}
                            placeholder="https://example.com/feed"
                            className="bg-slate-800/50 border-pink-500/30 text-pink-400 font-mono text-xs"
                          />
                        </div>

                        <div>
                          <Label className="text-slate-400 font-mono text-xs mb-1 block">
                            Refresh Interval: {feed.refresh_interval} minutes
                          </Label>
                          <input
                            type="range"
                            min="5"
                            max="120"
                            step="5"
                            value={feed.refresh_interval}
                            onChange={(e) => updateExternalFeed(idx, 'refresh_interval', parseInt(e.target.value))}
                            className="w-full"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}