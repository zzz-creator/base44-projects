import React, { useState, useEffect } from 'react';
import { base44 } from '../api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { RefreshCw, Download, Zap, Newspaper, Clock, Map, Target, FileText, Radio, Globe, BarChart3, TrendingUp } from 'lucide-react';
import MatrixBackground from '../components/war/MatrixBackground';
import RealTimeThreatMonitor from '../components/threat/RealTimeThreatMonitor';
import InteractiveWarMap from '../components/war/InteractiveWarMap';
import EnhancedThreatMap from '../components/map/EnhancedThreatMap';
import WarStatsPanel from '../components/war/WarStatsPanel';
import NewsFeed from '../components/war/NewsFeed';
import EventTimeline from '../components/war/EventTimeline';
import EscalationPredictor from '../components/war/EscalationPredictor';
import FlashpointsPanel from '../components/war/FlashpointsPanel';
import ThreatBriefing from '../components/war/ThreatBriefing';

export default function CurrentWars() {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [newsData, setNewsData] = useState([]);
  const [eventsData, setEventsData] = useState([]);
  const [escalationPredictions, setEscalationPredictions] = useState([]);
  const [flashpoints, setFlashpoints] = useState([]);
  const [threatBriefing, setThreatBriefing] = useState(null);
  const [isRefreshingNews, setIsRefreshingNews] = useState(false);
  const [activeTab, setActiveTab] = useState('map');
  const [threatIntelData, setThreatIntelData] = useState(null);
  const queryClient = useQueryClient();

  const { data: wars, isLoading } = useQuery({
    queryKey: ['wars', 'current'],
    queryFn: () => base44.entities.War.filter({ era: 'current', status: 'ongoing' }, '-updated_date'),
    initialData: [],
  });

  const updateDataMutation = useMutation({
    mutationFn: async () => {
      setIsRefreshing(true);
      
      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `Generate comprehensive current real-world war and conflict data for 2025. 

CRITICAL: For EACH country involved, you MUST provide exact coordinates:
- Russia-Ukraine War: Include Ukraine (48.3794, 31.1656), Russia (55.7558, 37.6173)
- Israel-Palestine Conflict: Include Israel (31.7683, 35.2137), Palestine/Gaza (31.5, 34.4667)
- Syria Civil War: Include Syria (34.8021, 38.9968)
- Yemen Civil War: Include Yemen (15.5527, 48.5164), Saudi Arabia (23.8859, 45.0792)
- Myanmar Civil Conflict: Include Myanmar (21.9162, 95.9560)
- Sudan Conflict: Include Sudan (15.5007, 32.5599)

For each conflict provide:
1. All participating countries with EXACT latitude/longitude
2. Realistic military data: army sizes (actual numbers), military budgets (in USD billions)
3. Casualties estimates (military and civilian)
4. Economic impact in billions USD
5. Clearly define each country's side: ally, axis, aggressor, or defender

Return 6-10 major ongoing conflicts with complete, realistic data for all countries involved.`,
        response_json_schema: {
          type: "object",
          properties: {
            wars: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  name: { type: "string" },
                  countries_involved: { type: "array", items: { type: "string" } },
                  start_date: { type: "string" },
                  status: { type: "string" },
                  type: { type: "string" },
                  description: { type: "string" },
                  economic_impact: { type: "number" },
                  era: { type: "string" },
                  casualties: {
                    type: "object",
                    properties: {
                      military: { type: "number" },
                      civilian: { type: "number" },
                      total: { type: "number" }
                    }
                  },
                  countries_data: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        country_code: { type: "string" },
                        country_name: { type: "string" },
                        side: { type: "string" },
                        army_size: { type: "number" },
                        military_budget: { type: "number" },
                        casualties: { type: "number" },
                        latitude: { type: "number" },
                        longitude: { type: "number" }
                      },
                      required: ["country_name", "latitude", "longitude"]
                    }
                  }
                },
                required: ["name", "countries_data"]
              }
            }
          }
        },
        add_context_from_internet: true
      });

      // Clear existing current wars
      const existingWars = await base44.entities.War.filter({ era: 'current', status: 'ongoing' });
      for (const war of existingWars) {
        await base44.entities.War.delete(war.id);
      }

      // Insert new wars
      if (result.wars && result.wars.length > 0) {
        for (const war of result.wars) {
          await base44.entities.War.create({
            ...war,
            era: 'current',
            status: 'ongoing'
          });
        }
      }

      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['wars', 'current'] });
      setIsRefreshing(false);
    },
    onError: () => {
      setIsRefreshing(false);
    }
  });

  const generateBriefingMutation = useMutation({
    mutationFn: async ({ type, region, conflictType }) => {
      const filteredWars = wars.filter(w => {
        if (conflictType !== 'all' && w.type?.toLowerCase() !== conflictType?.toLowerCase()) return false;
        return true;
      });

      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `You are a senior intelligence analyst. Generate a comprehensive ${type} threat assessment briefing synthesizing all available data.

BRIEFING TYPE: ${type.toUpperCase()}
REGION FILTER: ${region === 'all' ? 'All Regions' : region}
CONFLICT TYPE FILTER: ${conflictType === 'all' ? 'All Types' : conflictType}

DATA SOURCES:

ACTIVE CONFLICTS (${filteredWars.length}):
${filteredWars.length > 0 ? filteredWars.map(w => `- ${w.name}: ${w.description} | Casualties: ${w.casualties?.total || 'Unknown'}`).join('\n') : 'No active conflicts matching criteria.'}

ESCALATION PREDICTIONS:
${escalationPredictions.length > 0 ? escalationPredictions.map(p => `- ${p.conflict_name}: ${p.escalation_probability}% probability, ${p.forecast_summary}`).join('\n') : 'No escalation predictions available.'}

POTENTIAL FLASHPOINTS:
${flashpoints.length > 0 ? flashpoints.map(f => `- ${f.region_name} (Risk: ${f.risk_score}/100): ${f.analysis}`).join('\n') : 'No potential flashpoints identified.'}

RECENT NEWS:
${newsData.length > 0 ? newsData.slice(0, 10).map(n => `- [${n.severity}] ${n.headline}: ${n.summary}`).join('\n') : 'No recent news available.'}

Generate a briefing that includes:
1. Executive summary (3-4 sentences)
2. Overall threat level (CRITICAL, HIGH, ELEVATED, or MODERATE)
3. Global stability score (0-100, if applicable, otherwise 'N/A')
4. Key developments in the specified timeframe (e.g., last 24-48 hours, last 7 days)
5. Critical conflicts requiring immediate attention with recommendations
6. Emerging threats
7. Regional analysis (if specific region selected or if major regional developments exist)
8. Strategic recommendations

Be concise, actionable, and prioritize the most critical information. Use intelligence briefing format.`,
        response_json_schema: {
          type: "object",
          properties: {
            executive_summary: { type: "string" },
            overall_threat_level: { type: "string" },
            global_stability_score: { type: "number" },
            key_developments: { type: "array", items: { type: "string" } },
            critical_conflicts: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  name: { type: "string" },
                  status: { type: "string" },
                  risk_level: { type: "string" },
                  recommendation: { type: "string" }
                }
              }
            },
            emerging_threats: { type: "array", items: { type: "string" } },
            regional_analysis: { type: "string" },
            recommendations: { type: "array", items: { type: "string" } }
          }
        },
        add_context_from_internet: true
      });

      setThreatBriefing(result);
      return result;
    }
  });

  const fetchEscalationPredictionsMutation = useMutation({
    mutationFn: async () => {
      if (!wars || wars.length === 0) return { predictions: [] };

      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `You are an AI conflict analyst. Analyze the following ongoing wars and provide 7-day escalation forecasts for each:

${wars.map(w => `- ${w.name}: ${w.description}`).join('\n')}

For each conflict, provide:
1. Escalation probability (0-100) for the next 7 days
2. Brief forecast summary
3. Key triggers that could escalate the conflict in the next week
4. Mitigation factors that could prevent escalation
5. Specific predicted events with timeframes

Use current news, geopolitical trends, and historical patterns. Be realistic and data-driven.`,
        response_json_schema: {
          type: "object",
          properties: {
            predictions: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  conflict_name: { type: "string" },
                  escalation_probability: { type: "number" },
                  forecast_summary: { type: "string" },
                  key_triggers: { type: "array", items: { type: "string" } },
                  mitigation_factors: { type: "array", items: { type: "string" } },
                  predicted_events: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        event: { type: "string" },
                        timeframe: { type: "string" },
                        description: { type: "string" }
                      }
                    }
                  }
                }
              }
            }
          }
        },
        add_context_from_internet: true
      });

      setEscalationPredictions(result.predictions || []);
      return result;
    }
  });

  const fetchFlashpointsMutation = useMutation({
    mutationFn: async () => {
      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `You are a geopolitical analyst. Identify potential flashpoints - regions with high risk of NEW conflicts emerging in 2025 based on current tensions and news.

Focus on:
- Territorial disputes heating up
- Resource conflicts
- Ethnic/religious tensions
- Geopolitical rivalries
- Climate-driven conflicts

For each flashpoint provide:
1. Region name and specific location
2. Risk score (0-100)
3. Analysis of why this is a flashpoint
4. Key risk factors
5. Involved parties/nations
6. Potential trigger timeline
7. EXACT coordinates (latitude, longitude)

Examples:
- South China Sea tensions
- Taiwan Strait
- Kashmir
- Western Sahara
- Arctic territory disputes
- Venezuelan border tensions
- Armenia-Azerbaijan tensions

Return 5-8 high-risk flashpoints with complete data.`,
        response_json_schema: {
          type: "object",
          properties: {
            flashpoints: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  region_name: { type: "string" },
                  location: { type: "string" },
                  risk_score: { type: "number" },
                  analysis: { type: "string" },
                  risk_factors: { type: "array", items: { type: "string" } },
                  involved_parties: { type: "array", items: { type: "string" } },
                  trigger_timeline: { type: "string" },
                  coordinates: {
                    type: "object",
                    properties: {
                      latitude: { type: "number" },
                      longitude: { type: "number" }
                    }
                  }
                }
              }
            }
          }
        },
        add_context_from_internet: true
      });

      setFlashpoints(result.flashpoints || []);
      return result;
    }
  });

  const fetchNewsMutation = useMutation({
    mutationFn: async () => {
      setIsRefreshingNews(true);

      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `You are a news aggregator for global conflict intelligence. Fetch and summarize the latest news (last 24-48 hours) about ongoing wars and conflicts worldwide.

Focus on:
- Russia-Ukraine War
- Israel-Palestine Conflict
- Sudan Conflict
- Myanmar Civil War
- Yemen Civil War
- Syria Civil War
- Any other active conflicts

For each news item provide:
- Headline
- Summary (2-3 sentences)
- Detailed description
- Location/region affected
- Timestamp (relative like "2 hours ago")
- Severity (CRITICAL, HIGH, MEDIUM, LOW)
- Category (casualty_report, major_offensive, diplomatic, territory_change, ceasefire, incident)
- Casualty numbers if applicable (military and civilian)
- Which conflict it affects
- Suggested database update if data should be updated

Return 10-15 most important recent news items with the most critical first.`,
        response_json_schema: {
          type: "object",
          properties: {
            news_items: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  headline: { type: "string" },
                  summary: { type: "string" },
                  details: { type: "string" },
                  location: { type: "string" },
                  timestamp: { type: "string" },
                  severity: { type: "string" },
                  category: { type: "string" },
                  casualties: {
                    type: "object",
                    properties: {
                      military: { type: "string" },
                      civilian: { type: "string" }
                    }
                  },
                  affects_conflict: { type: "string" },
                  suggested_update: { type: "boolean" }
                }
              }
            }
          }
        },
        add_context_from_internet: true
      });

      if (result.news_items) {
        setNewsData(result.news_items);
      }

      return result;
    },
    onSettled: () => {
      setIsRefreshingNews(false);
    }
  });

  const fetchEventsMutation = useMutation({
    mutationFn: async () => {
      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `Generate a timeline of major events from ongoing conflicts in the last 7 days. Focus on significant military operations, battles, diplomatic events, and major incidents.

Return 15-20 events in chronological order (most recent first) with:
- Event title
- Description
- Event type (offensive, defensive, escalation, ceasefire, incident)
- Timestamp (relative like "3 hours ago", "yesterday")
- Location
- Casualties if applicable (killed and wounded numbers)

Cover major conflicts: Russia-Ukraine, Israel-Palestine, Sudan, Myanmar, Yemen, Syria.`,
        response_json_schema: {
          type: "object",
          properties: {
            events: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  title: { type: "string" },
                  description: { type: "string" },
                  type: { type: "string" },
                  timestamp: { type: "string" },
                  location: { type: "string" },
                  casualties: {
                    type: "object",
                    properties: {
                      killed: { type: "number" },
                      wounded: { type: "number" }
                    }
                  }
                }
              }
            }
          }
        },
        add_context_from_internet: true
      });

      if (result.events) {
        setEventsData(result.events);
      }

      return result;
    }
  });

  // Auto-refresh wars every 24 hours
  useEffect(() => {
    const interval = setInterval(() => {
      updateDataMutation.mutate();
    }, 24 * 60 * 60 * 1000);

    return () => clearInterval(interval);
  }, []);

  // Auto-refresh news every 30 minutes
  useEffect(() => {
    const interval = setInterval(() => {
      if (activeTab === 'news') {
        fetchNewsMutation.mutate();
      }
    }, 30 * 60 * 1000);

    return () => clearInterval(interval);
  }, [activeTab]);

  // Fetch predictions and flashpoints when wars are loaded
  useEffect(() => {
    if (wars && wars.length > 0) {
      if (escalationPredictions.length === 0) {
        fetchEscalationPredictionsMutation.mutate();
      }
      if (flashpoints.length === 0) {
        fetchFlashpointsMutation.mutate();
      }
    }
  }, [wars]);

  // Fetch news/events when tab is activated
  useEffect(() => {
    if (activeTab === 'news' && newsData.length === 0) {
      fetchNewsMutation.mutate();
    }
    if (activeTab === 'timeline' && eventsData.length === 0) {
      fetchEventsMutation.mutate();
    }
  }, [activeTab]);

  const handleApplyNewsUpdate = async (newsItem) => {
    const affectedWar = wars.find(w => 
      w.name.toLowerCase().includes(newsItem.affects_conflict?.toLowerCase()) ||
      newsItem.affects_conflict?.toLowerCase().includes(w.name.toLowerCase())
    );

    if (affectedWar && newsItem.casualties) {
      const updatedCasualties = {
        military: (affectedWar.casualties?.military || 0) + parseInt(newsItem.casualties.military || '0'),
        civilian: (affectedWar.casualties?.civilian || 0) + parseInt(newsItem.casualties.civilian || '0'),
      };
      updatedCasualties.total = updatedCasualties.military + updatedCasualties.civilian;

      await base44.entities.War.update(affectedWar.id, {
        casualties: updatedCasualties,
        description: `${affectedWar.description}\n\nLatest: ${newsItem.summary}`
      });

      queryClient.invalidateQueries({ queryKey: ['wars', 'current'] });
    }
  };

  const exportData = () => {
    const dataStr = JSON.stringify(wars, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `current-wars-${new Date().toISOString()}.json`;
    link.click();
  };

  return (
    <div className="relative min-h-screen">
      <MatrixBackground />
      
      <div className="relative z-10 p-8">
        <div className="max-w-[1800px] mx-auto space-y-6">
          {/* Header */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h1 className="text-4xl font-bold text-green-400 glow-text font-mono mb-2">
                CURRENT WARS
              </h1>
              <p className="text-cyan-400/70 font-mono text-sm">
                Live monitoring • Predictive analytics • Real-time battlefield intelligence
              </p>
            </div>
            
            <div className="flex gap-3">
              <Button
                onClick={() => updateDataMutation.mutate()}
                disabled={isRefreshing}
                className="bg-green-500/20 hover:bg-green-500/30 text-green-400 border border-green-500/30 font-mono"
              >
                <RefreshCw className={`w-4 h-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
                {isRefreshing ? 'SYNCING...' : 'SYNC DATA'}
              </Button>
              
              {wars.length > 0 && (
                <Button
                  onClick={exportData}
                  variant="outline"
                  className="border-cyan-500/30 text-cyan-400 hover:bg-cyan-500/10 font-mono"
                >
                  <Download className="w-4 h-4 mr-2" />
                  EXPORT
                </Button>
              )}
            </div>
          </div>

          {/* Stats Panel */}
          {wars.length > 0 && <WarStatsPanel wars={wars} />}

          {/* Live Status */}
          <Card className="bg-slate-950/80 backdrop-blur-xl cyber-border p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
                  <span className="text-green-400 font-bold font-mono text-sm">
                    {wars.length > 0 ? 'LIVE FEED ACTIVE' : 'AWAITING DATA'}
                  </span>
                </div>
                <Badge className="bg-cyan-500/20 text-cyan-400 border-cyan-500/30 font-mono">
                  Last updated: {new Date().toLocaleTimeString()}
                </Badge>
              </div>
              <div className="flex items-center gap-2 text-sm font-mono text-slate-400">
                <Zap className="w-4 h-4 text-yellow-400" />
                <span>Auto-refresh: 24h</span>
              </div>
            </div>
          </Card>

          {/* Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-6 bg-slate-950/80 border border-green-500/30">
              <TabsTrigger 
                value="threats" 
                className="data-[state=active]:bg-red-500/20 data-[state=active]:text-red-400 font-mono"
              >
                <Radio className="w-4 h-4 mr-2" />
                LIVE INTEL
              </TabsTrigger>
              <TabsTrigger 
                value="map" 
                className="data-[state=active]:bg-green-500/20 data-[state=active]:text-green-400 font-mono"
              >
                <Globe className="w-4 h-4 mr-2" />
                MAP
              </TabsTrigger>
              <TabsTrigger 
                value="briefing" 
                className="data-[state=active]:bg-purple-500/20 data-[state=active]:text-purple-400 font-mono"
              >
                <FileText className="w-4 h-4 mr-2" />
                BRIEFING
              </TabsTrigger>
              <TabsTrigger 
                value="predictions" 
                className="data-[state=active]:bg-orange-500/20 data-[state=active]:text-orange-400 font-mono"
              >
                <Target className="w-4 h-4 mr-2" />
                ANALYTICS
              </TabsTrigger>
              <TabsTrigger 
                value="news" 
                className="data-[state=active]:bg-cyan-500/20 data-[state=active]:text-cyan-400 font-mono"
              >
                <Newspaper className="w-4 h-4 mr-2" />
                NEWS
              </TabsTrigger>
              <TabsTrigger 
                value="timeline" 
                className="data-[state=active]:bg-purple-500/20 data-[state=active]:text-purple-400 font-mono"
              >
                <Clock className="w-4 h-4 mr-2" />
                TIMELINE
              </TabsTrigger>
            </TabsList>

            {/* Real-Time Threat Intelligence Tab */}
            <TabsContent value="threats" className="mt-6">
              <RealTimeThreatMonitor onDataUpdate={(data) => setThreatIntelData(data)} />
            </TabsContent>

            <TabsContent value="map" className="mt-6">
              <Card className="bg-slate-950/80 backdrop-blur-xl cyber-border overflow-hidden">
                <div className="p-4 border-b border-green-900/30">
                  <h2 className="text-xl font-bold text-green-400 glow-text font-mono">
                    TACTICAL MAP • GLOBAL THEATER
                  </h2>
                  <p className="text-slate-400 text-sm font-mono mt-1">
                    Active conflicts and potential flashpoints • Hover for details
                  </p>
                </div>
                <div className="h-[700px]">
                  {isLoading || isRefreshing ? (
                    <div className="flex items-center justify-center h-full">
                      <div className="space-y-3 text-center">
                        <RefreshCw className="w-12 h-12 text-green-400 animate-spin mx-auto" />
                        <div className="text-green-400 font-mono">LOADING MAP DATA...</div>
                      </div>
                    </div>
                  ) : wars.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full gap-4">
                      <div className="text-cyan-400 font-mono text-lg">NO ACTIVE CONFLICTS DETECTED</div>
                      <p className="text-slate-400 font-mono text-sm max-w-md text-center">
                        Click the button below to fetch current global conflict data using AI-powered analysis
                      </p>
                      <Button
                        onClick={() => updateDataMutation.mutate()}
                        className="bg-green-500/20 hover:bg-green-500/30 text-green-400 border border-green-500/30 font-mono"
                      >
                        <Zap className="w-4 h-4 mr-2" />
                        FETCH CURRENT DATA
                      </Button>
                    </div>
                  ) : (
                    <EnhancedThreatMap 
                      wars={wars} 
                      threatZones={threatIntelData?.high_threat_zones || []}
                      flashpoints={[...flashpoints, ...(threatIntelData?.emerging_flashpoints || [])]}
                      satelliteAnomalies={threatIntelData?.satellite_anomalies || []}
                    />
                  )}
                </div>
              </Card>
            </TabsContent>

            <TabsContent value="briefing" className="mt-6">
              <ThreatBriefing
                briefing={threatBriefing}
                onGenerate={(config) => generateBriefingMutation.mutate(config)}
                isGenerating={generateBriefingMutation.isPending}
                wars={wars}
                flashpoints={flashpoints}
                predictions={escalationPredictions}
                news={newsData}
              />
            </TabsContent>

            <TabsContent value="predictions" className="mt-6">
              <div className="grid lg:grid-cols-2 gap-6">
                <EscalationPredictor predictions={escalationPredictions} />
                <FlashpointsPanel flashpoints={flashpoints} />
              </div>
              <div className="mt-6 flex gap-3">
                <Button
                  onClick={() => fetchEscalationPredictionsMutation.mutate()}
                  disabled={fetchEscalationPredictionsMutation.isPending}
                  className="bg-orange-500/20 hover:bg-orange-500/30 text-orange-400 border border-orange-500/30 font-mono"
                >
                  <RefreshCw className={`w-4 h-4 mr-2 ${fetchEscalationPredictionsMutation.isPending ? 'animate-spin' : ''}`} />
                  REFRESH PREDICTIONS
                </Button>
                <Button
                  onClick={() => fetchFlashpointsMutation.mutate()}
                  disabled={fetchFlashpointsMutation.isPending}
                  className="bg-red-500/20 hover:bg-red-500/30 text-red-400 border border-red-500/30 font-mono"
                >
                  <RefreshCw className={`w-4 h-4 mr-2 ${fetchFlashpointsMutation.isPending ? 'animate-spin' : ''}`} />
                  REFRESH FLASHPOINTS
                </Button>
              </div>
            </TabsContent>

            <TabsContent value="news" className="mt-6">
              <div className="grid lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2">
                  <NewsFeed 
                    news={newsData}
                    onRefresh={() => fetchNewsMutation.mutate()}
                    isRefreshing={isRefreshingNews || fetchNewsMutation.isPending}
                    onApplyUpdate={handleApplyNewsUpdate}
                  />
                </div>
                <div>
                  <Card className="bg-slate-950/80 backdrop-blur-xl cyber-border p-6 sticky top-6">
                    <h3 className="text-lg font-bold text-cyan-400 glow-text font-mono mb-4">
                      NEWS ANALYTICS
                    </h3>
                    <div className="space-y-4">
                      <div className="p-4 bg-slate-900/50 cyber-border rounded-lg">
                        <div className="text-2xl font-bold text-green-400 font-mono mb-1">
                          {newsData.length}
                        </div>
                        <div className="text-xs text-slate-400 font-mono">Total Reports</div>
                      </div>
                      
                      <div className="p-4 bg-slate-900/50 cyber-border rounded-lg">
                        <div className="text-2xl font-bold text-red-400 font-mono mb-1">
                          {newsData.filter(n => n.severity === 'CRITICAL').length}
                        </div>
                        <div className="text-xs text-slate-400 font-mono">Critical Alerts</div>
                      </div>

                      <div className="p-4 bg-slate-900/50 cyber-border rounded-lg">
                        <div className="text-2xl font-bold text-orange-400 font-mono mb-1">
                          {newsData.filter(n => n.category === 'casualty_report').length}
                        </div>
                        <div className="text-xs text-slate-400 font-mono">Casualty Reports</div>
                      </div>

                      <div className="pt-4 border-t border-slate-700/30">
                        <div className="text-xs text-slate-500 font-mono mb-2">AUTO-REFRESH</div>
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                          <span className="text-green-400 font-mono text-sm">Every 30 min</span>
                        </div>
                      </div>
                    </div>
                  </Card>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="timeline" className="mt-6">
              <div className="grid lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2">
                  <EventTimeline events={eventsData} />
                </div>
                <div>
                  <Card className="bg-slate-950/80 backdrop-blur-xl cyber-border p-6 sticky top-6">
                    <h3 className="text-lg font-bold text-purple-400 glow-text font-mono mb-4">
                      TIMELINE STATS
                    </h3>
                    <div className="space-y-4">
                      <div className="p-4 bg-slate-900/50 cyber-border rounded-lg">
                        <div className="text-2xl font-bold text-purple-400 font-mono mb-1">
                          {eventsData.length}
                        </div>
                        <div className="text-xs text-slate-400 font-mono">Total Events</div>
                      </div>
                      
                      <div className="p-4 bg-slate-900/50 cyber-border rounded-lg">
                        <div className="text-2xl font-bold text-red-400 font-mono mb-1">
                          {eventsData.filter(e => e.type === 'offensive').length}
                        </div>
                        <div className="text-xs text-slate-400 font-mono">Offensive Operations</div>
                      </div>

                      <div className="p-4 bg-slate-900/50 cyber-border rounded-lg">
                        <div className="text-2xl font-bold text-orange-400 font-mono mb-1">
                          {eventsData.filter(e => e.type === 'escalation').length}
                        </div>
                        <div className="text-xs text-slate-400 font-mono">Escalations</div>
                      </div>

                      <Button
                        onClick={() => fetchEventsMutation.mutate()}
                        disabled={fetchEventsMutation.isPending}
                        className="w-full bg-purple-500/20 hover:bg-purple-500/30 text-purple-400 border border-purple-500/30 font-mono"
                      >
                        <RefreshCw className={`w-4 h-4 mr-2 ${fetchEventsMutation.isPending ? 'animate-spin' : ''}`} />
                        REFRESH TIMELINE
                      </Button>
                    </div>
                  </Card>
                </div>
              </div>
            </TabsContent>
          </Tabs>

          {/* Conflict List */}
          {wars.length > 0 && (
            <Card className="bg-slate-950/80 backdrop-blur-xl cyber-border p-6">
              <h2 className="text-xl font-bold text-green-400 glow-text font-mono mb-4">
                ACTIVE CONFLICT REGISTRY ({wars.length})
              </h2>
              <div className="space-y-3">
                {wars.map((war, idx) => (
                  <div key={idx} className="bg-slate-900/50 cyber-border rounded-lg p-4 hover-glow transition-all">
                    <div className="flex items-start justify-between mb-2">
                      <h3 className="text-lg font-bold text-cyan-400 font-mono">{war.name}</h3>
                      <Badge className="bg-red-500/20 text-red-400 border-red-500/30 font-mono">
                        ONGOING
                      </Badge>
                    </div>
                    <p className="text-slate-400 text-sm font-mono mb-3">{war.description}</p>
                    
                    {war.casualties && (
                      <div className="mb-3 p-2 bg-slate-950/50 rounded border border-red-900/20">
                        <span className="text-xs text-slate-500 font-mono">Total Casualties: </span>
                        <span className="text-red-400 font-mono text-sm font-bold">
                          {war.casualties.total?.toLocaleString() || 'Unknown'}
                        </span>
                      </div>
                    )}
                    
                    <div className="flex flex-wrap gap-2">
                      {war.countries_involved?.map((country, i) => (
                        <Badge key={i} variant="outline" className="border-green-500/30 text-green-400 font-mono text-xs">
                          {country}
                        </Badge>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}