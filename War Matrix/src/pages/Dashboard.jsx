import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../utils';
import { base44 } from '../api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Globe, History, TrendingUp, ChevronRight, Brain, Zap, Radio, Edit3, Save, LogIn, Bell, Settings, Target, Swords, BarChart3 } from 'lucide-react';
import MatrixBackground from '../components/war/MatrixBackground';
import LiveDashboardMetrics from '../components/visualizations/LiveDashboardMetrics';
import InteractiveWorldDashboardMap from '../components/map/InteractiveWorldDashboardMap';
import ThreatHeatmap from '../components/visualizations/ThreatHeatmap';
import RecentAlertsWidget from '../components/alerts/RecentAlertsWidget';
import AlertNotificationSystem from '../components/alerts/AlertNotificationSystem';
import DraggableWidgets from '../components/dashboard/DraggableWidgets';
import DashboardAlertSettings from '../components/dashboard/DashboardAlertSettings';
import HistoricalTrendChart from '../components/visualizations/HistoricalTrendChart';
import ThreatAssessmentEngine from '../components/ai/ThreatAssessmentEngine';
import AdvancedWarGaming from '../components/scenario/AdvancedWarGaming';
import CustomizableVisualization from '../components/dashboard/CustomizableVisualization';
import GlitchOverlay from '../components/effects/GlitchOverlay';
import DynamicSoundscape from '../components/audio/DynamicSoundscape';
import { toast } from 'sonner';

export default function Dashboard() {
  const queryClient = useQueryClient();
  const [editMode, setEditMode] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [widgetOrder, setWidgetOrder] = useState(['metrics', 'map', 'alerts', 'heatmap', 'trends']);
  const [showAlertSettings, setShowAlertSettings] = useState(false);
  const [showThreatEngine, setShowThreatEngine] = useState(false);
  const [showWarGaming, setShowWarGaming] = useState(false);
  const [showCustomViz, setShowCustomViz] = useState(false);
  const [alertLevel, setAlertLevel] = useState('normal');

  const { data: user } = useQuery({
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

  const { data: userProfile } = useQuery({
    queryKey: ['userProfile', user?.email],
    queryFn: async () => {
      const profiles = await base44.entities.UserProfile.filter({ created_by: user.email });
      if (profiles.length > 0) {
        // Initialize widget order from profile
        if (profiles[0].dashboard_layout?.widget_order) {
          setWidgetOrder(profiles[0].dashboard_layout.widget_order);
        }
        return profiles[0];
      }
      return null;
    },
    enabled: !!user,
  });

  const updateProfileMutation = useMutation({
    mutationFn: async (profileData) => {
      if (userProfile?.id) {
        return base44.entities.UserProfile.update(userProfile.id, profileData);
      } else {
        return base44.entities.UserProfile.create(profileData);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['userProfile'] });
      toast.success('Dashboard layout saved');
    },
  });

  // Sample data for live metrics
  const liveMetricsData = {
    activeConflicts: 12,
    threatLevel: 67,
    economicImpact: 234.5,
    casualties: 15000,
    timeSeriesData: Array.from({ length: 10 }, (_, i) => ({
      time: `${i}:00`,
      value: Math.random() * 100,
      conflicts: Math.floor(Math.random() * 20) + 5,
      threat: Math.random() * 100
    }))
  };

  const availableWidgets = [
    {
      id: 'metrics',
      name: 'Live Metrics',
      component: (
        <LiveDashboardMetrics 
          data={liveMetricsData}
          autoRefresh={true}
          refreshInterval={3000}
        />
      )
    },
    {
      id: 'map',
      name: 'Interactive Map',
      component: (
        <InteractiveWorldDashboardMap 
          conflictData={liveMetricsData}
          autoRefresh={true}
        />
      )
    },
    {
      id: 'alerts',
      name: 'Recent Alerts',
      component: <RecentAlertsWidget limit={5} />
    },
    {
      id: 'heatmap',
      name: 'Threat Heatmap',
      component: <ThreatHeatmap />
    },
    {
      id: 'trends',
      name: 'Historical Trends',
      component: <HistoricalTrendChart title="THREAT & CONFLICT TRENDS" />
    }
  ];

  const handleSaveAlertThresholds = async (thresholds) => {
    if (!isAuthenticated) {
      toast.error('Please sign in to save alert thresholds');
      return;
    }
    
    const updatedProfile = {
      ...userProfile,
      dashboard_alert_thresholds: thresholds
    };
    updateProfileMutation.mutate(updatedProfile);
    setShowAlertSettings(false);
  };

  const enabledWidgets = userProfile?.dashboard_layout?.enabled_widgets || ['metrics', 'map', 'alerts', 'heatmap'];

  const handleReorder = (newOrder) => {
    // Update local state immediately for responsive UI
    setWidgetOrder(newOrder);
    
    // Save to database if authenticated
    if (isAuthenticated) {
      const updatedProfile = {
        ...userProfile,
        dashboard_layout: {
          ...userProfile?.dashboard_layout,
          enabled_widgets: enabledWidgets,
          widget_order: newOrder
        }
      };
      updateProfileMutation.mutate(updatedProfile);
    }
  };

  const modules = [
    {
      title: 'Current Wars',
      description: 'Live monitoring of active global conflicts with real-time data streams',
      icon: Globe,
      color: 'from-green-500 to-emerald-600',
      link: createPageUrl('CurrentWars'),
      status: 'LIVE',
      statusColor: 'text-green-400'
    },
    {
      title: 'Past Wars',
      description: 'Historical conflict database spanning centuries of human warfare',
      icon: History,
      color: 'from-blue-500 to-cyan-600',
      link: createPageUrl('PastWars'),
      status: 'ARCHIVED',
      statusColor: 'text-blue-400'
    },
    {
      title: 'Future Wars',
      description: 'Near-term conflict predictions based on current geopolitical trends',
      icon: TrendingUp,
      color: 'from-purple-500 to-pink-600',
      link: createPageUrl('FutureWars'),
      status: 'FORECAST',
      statusColor: 'text-purple-400'
    },
    {
      title: 'Strategy Hub',
      description: 'AI Strategic Advisor with proactive threat detection and global analysis',
      icon: Brain,
      color: 'from-purple-500 to-pink-600',
      link: createPageUrl('StrategyHub'),
      status: 'AI ACTIVE',
      statusColor: 'text-purple-400'
    },
    {
      title: 'Real-time Data Hub',
      description: 'Live economic indicators, news aggregation, and sentiment analysis',
      icon: Radio,
      color: 'from-cyan-500 to-blue-600',
      link: createPageUrl('RealTimeDataHub'),
      status: 'STREAMING',
      statusColor: 'text-cyan-400'
    },
    {
      title: 'Conflict Simulator',
      description: 'Advanced scenario modeling with branching simulations and counter-strategies',
      icon: Zap,
      color: 'from-yellow-500 to-orange-600',
      link: createPageUrl('ConflictSimulator'),
      status: 'READY',
      statusColor: 'text-yellow-400'
    }
  ];

  return (
    <div className="relative min-h-screen">
      <AlertNotificationSystem />
      <MatrixBackground />
      <GlitchOverlay enabled={true} intensity="low" scanlines={true} />
      
      <div className="relative z-10 p-8">
        <div className="max-w-7xl mx-auto">
          {/* Hero Section */}
          <div className="mb-12 text-center">
            <h1 className="text-5xl md:text-7xl font-bold text-green-400 glow-text mb-4 font-mono tracking-wider">
              WAR MATRIX
            </h1>
            <p className="text-xl text-cyan-400/80 font-mono mb-2">
              Global Conflict Intelligence System
            </p>
            <div className="flex items-center justify-center gap-4 text-sm font-mono flex-wrap">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                <span className="text-slate-400">SYSTEM ONLINE</span>
              </div>
              <div className="text-slate-600">|</div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-sky-400 rounded-full animate-pulse"></div>
                <span className="text-slate-400">AI ACTIVE</span>
              </div>
              <div className="text-slate-600">|</div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-purple-400 rounded-full animate-pulse"></div>
                <span className="text-slate-400">DATA SYNCED</span>
              </div>
              <div className="text-slate-600">|</div>
              <DynamicSoundscape alertLevel={alertLevel} currentPage="Dashboard" />
            </div>
          </div>

          {/* Widget Customization Toggle */}
          <div className="flex flex-wrap justify-end gap-3 mb-4">
            {!isAuthenticated && (
              <Button
                onClick={() => base44.auth.redirectToLogin()}
                variant="outline"
                className="font-mono border-purple-500/30 text-purple-400 hover:bg-purple-500/10"
              >
                <LogIn className="w-4 h-4 mr-2" />
                SIGN IN
              </Button>
            )}
            <Button
              onClick={() => setShowThreatEngine(!showThreatEngine)}
              className="font-mono bg-gradient-to-r from-red-600 to-red-500 hover:from-red-700 hover:to-red-600 text-white"
            >
              <Target className="w-4 h-4 mr-2" />
              THREAT SCAN
            </Button>
            <Button
              onClick={() => setShowWarGaming(!showWarGaming)}
              className="font-mono bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white"
            >
              <Swords className="w-4 h-4 mr-2" />
              WAR-GAME
            </Button>
            <Button
              onClick={() => setShowCustomViz(!showCustomViz)}
              className="font-mono bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white"
            >
              <BarChart3 className="w-4 h-4 mr-2" />
              CUSTOM CHARTS
            </Button>
            <Button
              onClick={() => setShowAlertSettings(!showAlertSettings)}
              className="font-mono bg-gradient-to-r from-red-500 to-orange-500 hover:from-red-600 hover:to-orange-600 text-white"
            >
              <Bell className="w-4 h-4 mr-2" />
              ALERT THRESHOLDS
            </Button>
            <Button
              onClick={() => setEditMode(!editMode)}
              className={`font-mono ${
                editMode 
                  ? 'bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700' 
                  : 'bg-gradient-to-r from-sky-500 to-blue-500 hover:from-sky-600 hover:to-blue-600'
              } text-white`}
            >
              {editMode ? (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  DONE EDITING
                </>
              ) : (
                <>
                  <Edit3 className="w-4 h-4 mr-2" />
                  CUSTOMIZE LAYOUT
                </>
              )}
            </Button>
          </div>

          {/* Alert Threshold Settings */}
          <DashboardAlertSettings
            userProfile={userProfile}
            onSave={handleSaveAlertThresholds}
            onClose={() => setShowAlertSettings(false)}
            isOpen={showAlertSettings}
          />

          {/* Threat Assessment Engine */}
          {showThreatEngine && (
            <div className="mb-8">
              <ThreatAssessmentEngine 
                onThreatDetected={(threats) => {
                  if (threats?.some(t => t.threat_level >= 80)) {
                    setAlertLevel('critical');
                  } else if (threats?.some(t => t.threat_level >= 60)) {
                    setAlertLevel('elevated');
                  }
                }}
              />
            </div>
          )}

          {/* Advanced War-Gaming */}
          {showWarGaming && (
            <div className="mb-8">
              <AdvancedWarGaming />
            </div>
          )}

          {/* Custom Visualizations */}
          {showCustomViz && (
            <div className="mb-8">
              <CustomizableVisualization 
                onSaveChart={(charts) => toast.success('Chart configuration saved')}
              />
            </div>
          )}

          {/* Dashboard Widgets */}
          <div className="mb-12">
            <DraggableWidgets
              widgets={availableWidgets}
              widgetOrder={widgetOrder}
              enabledWidgets={enabledWidgets}
              onReorder={handleReorder}
              editMode={editMode}
            />
          </div>

          {/* Mission Brief */}
          <Card className="bg-slate-950/80 backdrop-blur-xl border border-sky-900/40 p-8 mb-12">
            <h2 className="text-2xl font-bold text-green-400 glow-text mb-4 font-mono">
              MISSION BRIEFING
            </h2>
            <p className="text-slate-300 leading-relaxed font-mono text-sm">
              Welcome to the War Matrix, the most advanced conflict intelligence platform ever created. 
              This system integrates real-time battlefield data, historical war archives, and AI-powered 
              predictive models to provide unparalleled insight into global conflicts across all timelines. 
              From current theaters of war to speculative interstellar conflicts millions of years in the future, 
              every dimension of warfare is analyzed, tracked, and forecasted.
            </p>
          </Card>

          {/* Module Grid */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
            {modules.map((module, idx) => (
              <Link key={idx} to={module.link} className="group">
                <Card className="bg-slate-950/80 backdrop-blur-xl border border-sky-900/40 hover:border-sky-500/50 hover:shadow-lg hover:shadow-sky-500/20 transition-all duration-300 h-full p-6 cursor-pointer">
                  <div className="flex flex-col h-full">
                    <div className="flex items-start justify-between mb-4">
                      <div className={`p-4 rounded-xl bg-gradient-to-br ${module.color} shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                        <module.icon className="w-8 h-8 text-white" />
                      </div>
                      <span className={`text-xs font-bold font-mono ${module.statusColor} px-3 py-1 rounded-full bg-slate-900/50 border border-slate-700/50`}>
                        {module.status}
                      </span>
                    </div>
                    
                    <h3 className="text-xl font-bold text-green-400 glow-text mb-2 font-mono group-hover:text-cyan-400 transition-colors">
                      {module.title}
                    </h3>
                    
                    <p className="text-slate-400 text-sm font-mono flex-1 mb-4">
                      {module.description}
                    </p>
                    
                    <Button 
                      variant="outline" 
                      className="w-full border-sky-500/30 text-sky-400 hover:bg-sky-500/10 hover:border-sky-400 font-mono group-hover:shadow-lg group-hover:shadow-sky-500/30 transition-all"
                    >
                      ACCESS MODULE
                      <ChevronRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                    </Button>
                  </div>
                </Card>
              </Link>
            ))}
          </div>

          {/* Additional Tools Section */}
          <div className="mt-12">
            <h2 className="text-2xl font-bold text-cyan-400 glow-text font-mono mb-6 text-center">
              ADVANCED ANALYSIS TOOLS
            </h2>
            <div className="grid md:grid-cols-3 gap-6 mb-12">
              <Link to={createPageUrl('StrategyHub')} className="group">
                <Card className="bg-slate-950/80 backdrop-blur-xl border border-sky-900/40 hover:border-sky-500/50 hover:shadow-lg hover:shadow-sky-500/20 transition-all duration-300 h-full p-6 cursor-pointer">
                  <div className="flex flex-col h-full">
                    <div className="flex items-start justify-between mb-4">
                      <div className="p-4 rounded-xl bg-gradient-to-br from-purple-500 to-pink-600 shadow-lg group-hover:scale-110 transition-transform duration-300">
                        <Brain className="w-8 h-8 text-white" />
                      </div>
                      <Badge className="text-xs font-bold font-mono text-purple-400 px-3 py-1 rounded-full bg-slate-900/50 border border-purple-500/30">
                        AI ACTIVE
                      </Badge>
                    </div>
                    <h3 className="text-xl font-bold text-green-400 glow-text mb-2 font-mono group-hover:text-cyan-400 transition-colors">
                      Strategy Hub
                    </h3>
                    <p className="text-slate-400 text-sm font-mono flex-1 mb-4">
                      AI Strategic Advisor with proactive threat detection and global analysis
                    </p>
                    <Button 
                      variant="outline" 
                      className="w-full border-sky-500/30 text-sky-400 hover:bg-sky-500/10 hover:border-sky-400 font-mono group-hover:shadow-lg group-hover:shadow-sky-500/30 transition-all"
                    >
                      ACCESS MODULE
                      <ChevronRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                    </Button>
                  </div>
                </Card>
              </Link>

              <Link to={createPageUrl('RealTimeDataHub')} className="group">
                <Card className="bg-slate-950/80 backdrop-blur-xl border border-sky-900/40 hover:border-sky-500/50 hover:shadow-lg hover:shadow-sky-500/20 transition-all duration-300 h-full p-6 cursor-pointer">
                  <div className="flex flex-col h-full">
                    <div className="flex items-start justify-between mb-4">
                      <div className="p-4 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 shadow-lg group-hover:scale-110 transition-transform duration-300">
                        <Radio className="w-8 h-8 text-white" />
                      </div>
                      <Badge className="text-xs font-bold font-mono text-cyan-400 px-3 py-1 rounded-full bg-slate-900/50 border border-cyan-500/30">
                        STREAMING
                      </Badge>
                    </div>
                    <h3 className="text-xl font-bold text-green-400 glow-text mb-2 font-mono group-hover:text-cyan-400 transition-colors">
                      Real-time Data Hub
                    </h3>
                    <p className="text-slate-400 text-sm font-mono flex-1 mb-4">
                      Live economic indicators, news aggregation, and sentiment analysis
                    </p>
                    <Button 
                      variant="outline" 
                      className="w-full border-sky-500/30 text-sky-400 hover:bg-sky-500/10 hover:border-sky-400 font-mono group-hover:shadow-lg group-hover:shadow-sky-500/30 transition-all"
                    >
                      ACCESS MODULE
                      <ChevronRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                    </Button>
                  </div>
                </Card>
              </Link>

              <Link to={createPageUrl('ConflictSimulator')} className="group">
                <Card className="bg-slate-950/80 backdrop-blur-xl border border-sky-900/40 hover:border-sky-500/50 hover:shadow-lg hover:shadow-sky-500/20 transition-all duration-300 h-full p-6 cursor-pointer">
                  <div className="flex flex-col h-full">
                    <div className="flex items-start justify-between mb-4">
                      <div className="p-4 rounded-xl bg-gradient-to-br from-yellow-500 to-orange-600 shadow-lg group-hover:scale-110 transition-transform duration-300">
                        <Zap className="w-8 h-8 text-white" />
                      </div>
                      <Badge className="text-xs font-bold font-mono text-yellow-400 px-3 py-1 rounded-full bg-slate-900/50 border border-yellow-500/30">
                        READY
                      </Badge>
                    </div>
                    <h3 className="text-xl font-bold text-green-400 glow-text mb-2 font-mono group-hover:text-cyan-400 transition-colors">
                      Conflict Simulator
                    </h3>
                    <p className="text-slate-400 text-sm font-mono flex-1 mb-4">
                      Advanced scenario modeling with branching simulations and counter-strategies
                    </p>
                    <Button 
                      variant="outline" 
                      className="w-full border-sky-500/30 text-sky-400 hover:bg-sky-500/10 hover:border-sky-400 font-mono group-hover:shadow-lg group-hover:shadow-sky-500/30 transition-all"
                    >
                      ACCESS MODULE
                      <ChevronRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                    </Button>
                  </div>
                </Card>
              </Link>
            </div>
          </div>

          {/* System Info */}
          <div className="mt-12 grid md:grid-cols-3 gap-6">
            <Card className="bg-slate-950/80 backdrop-blur-xl border border-sky-900/40 p-6">
              <h3 className="text-lg font-bold text-sky-400 mb-2 font-mono">DATA SOURCES</h3>
              <p className="text-slate-400 text-sm font-mono">
                Aggregating intelligence from 1,247 global sources including military feeds, 
                satellite imagery, and AI-powered predictive models.
              </p>
            </Card>
            
            <Card className="bg-slate-950/80 backdrop-blur-xl border border-sky-900/40 p-6">
              <h3 className="text-lg font-bold text-purple-400 mb-2 font-mono">AI ENGINE</h3>
              <p className="text-slate-400 text-sm font-mono">
                Advanced neural networks analyze patterns, simulate scenarios, and forecast 
                conflicts with unprecedented accuracy.
              </p>
            </Card>
            
            <Card className="bg-slate-950/80 backdrop-blur-xl border border-sky-900/40 p-6">
              <h3 className="text-lg font-bold text-yellow-400 mb-2 font-mono">COVERAGE</h3>
              <p className="text-slate-400 text-sm font-mono">
                Timeline spanning from 3000 BCE to 1,000,000+ years into the future, 
                covering terrestrial and theoretical galactic conflicts.
              </p>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}