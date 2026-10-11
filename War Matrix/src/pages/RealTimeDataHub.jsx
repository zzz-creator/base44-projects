import React, { useState, useEffect } from 'react';
import { base44 } from '../api/base44Client';
import { useMutation, useQuery } from '@tanstack/react-query';
import { Card } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { 
  RefreshCw, 
  Radio, 
  TrendingUp, 
  TrendingDown, 
  Activity,
  Newspaper,
  MessageSquare,
  DollarSign,
  Satellite,
  BarChart3,
  Clock,
  History
} from 'lucide-react';
import { LineChart, Line, BarChart, Bar, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import MatrixBackground from '../components/war/MatrixBackground';
import HistoricalCrossReference from '../components/intel/HistoricalCrossReference';
import PredictiveEconomicChart from '../components/visualizations/PredictiveEconomicChart';
import RealTimeDataFeed from '../components/data/RealTimeDataFeed';
import ThreatIntelligenceFeed from '../components/intel/ThreatIntelligenceFeed';
import AdvancedAnalysisSection from '../components/analysis/AdvancedAnalysisSection';
import AdvancedTimeSeriesChart from '../components/charts/AdvancedTimeSeriesChart';
import SatelliteIntelligenceMap from '../components/map/SatelliteIntelligenceMap';
import ExternalDataFeedManager from '../components/data/ExternalDataFeedManager';

export default function RealTimeDataHub() {
  const [activeTab, setActiveTab] = useState('overview');
  const [liveData, setLiveData] = useState(null);
  const [historicalData, setHistoricalData] = useState({ daily: [], weekly: [], monthly: [] });
  const [timeRange, setTimeRange] = useState('daily');
  const [lastUpdate, setLastUpdate] = useState(null);
  const [crossRefData, setCrossRefData] = useState(null);
  const [liveFeeds, setLiveFeeds] = useState(null);
  const [subscriptions, setSubscriptions] = useState({ regions: [], types: [], threshold: 'medium' });

  // Get refresh interval from settings
  const settings = JSON.parse(localStorage.getItem('warMatrixSettings') || '{}');
  const refreshInterval = settings.dataRefresh?.news || 30;

  const { data: historicalWars } = useQuery({
    queryKey: ['wars', 'historical'],
    queryFn: () => base44.entities.War.filter({ era: 'past' }),
    initialData: [],
  });

  const fetchDataMutation = useMutation({
    mutationFn: async () => {
      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `You are a real-time intelligence aggregator. Provide comprehensive current global conflict intelligence data.

Generate:

1. LIVE NEWS SUMMARY (Last 24 hours)
   - 8-10 breaking news items related to conflicts
   - Headlines, severity, timestamps, locations
   - Brief summaries

2. SOCIAL MEDIA SENTIMENT
   - Overall sentiment score (-100 to 100)
   - Regional sentiment breakdown
   - Trending topics

3. ECONOMIC INDICATORS (Current + Historical)
   - Oil prices (current + last 30 daily values)
   - Defense stocks index (current + last 12 weekly values)
   - Gold prices (current + last 6 monthly values)
   - Commodities (wheat, copper, etc.) with trends
   - Currency impacts

4. SATELLITE INTELLIGENCE
   - Troop movements detected
   - Military installations activity
   - Border tensions
   - Naval deployments

Provide REAL historical data points for charts (30 days, 12 weeks, 6 months).`,
        response_json_schema: {
          type: "object",
          properties: {
            timestamp: { type: "string" },
            overall_threat_level: { type: "string" },
            active_conflicts_count: { type: "number" },
            news_summary: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  headline: { type: "string" },
                  summary: { type: "string" },
                  severity: { type: "string" },
                  timestamp: { type: "string" },
                  location: { type: "string" },
                  category: { type: "string" }
                }
              }
            },
            sentiment_analysis: {
              type: "object",
              properties: {
                overall_score: { type: "number" },
                sentiment_label: { type: "string" },
                regional_breakdown: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      region: { type: "string" },
                      score: { type: "number" },
                      trend: { type: "string" }
                    }
                  }
                },
                trending_topics: { type: "array", items: { type: "string" } }
              }
            },
            economic_indicators: {
              type: "object",
              properties: {
                oil_price: {
                  type: "object",
                  properties: {
                    current: { type: "number" },
                    change_24h: { type: "number" },
                    trend: { type: "string" },
                    daily_history: {
                      type: "array",
                      items: {
                        type: "object",
                        properties: {
                          date: { type: "string" },
                          price: { type: "number" }
                        }
                      }
                    }
                  }
                },
                defense_stocks: {
                  type: "object",
                  properties: {
                    index: { type: "number" },
                    change_7d: { type: "number" },
                    trend: { type: "string" },
                    weekly_history: {
                      type: "array",
                      items: {
                        type: "object",
                        properties: {
                          week: { type: "string" },
                          index: { type: "number" }
                        }
                      }
                    }
                  }
                },
                gold_price: {
                  type: "object",
                  properties: {
                    current: { type: "number" },
                    change_30d: { type: "number" },
                    trend: { type: "string" },
                    monthly_history: {
                      type: "array",
                      items: {
                        type: "object",
                        properties: {
                          month: { type: "string" },
                          price: { type: "number" }
                        }
                      }
                    }
                  }
                },
                commodities: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      name: { type: "string" },
                      price: { type: "number" },
                      change: { type: "number" },
                      trend: { type: "string" }
                    }
                  }
                },
                currency_impacts: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      pair: { type: "string" },
                      rate: { type: "number" },
                      change: { type: "number" }
                    }
                  }
                }
              }
            },
            satellite_intelligence: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  type: { type: "string" },
                  location: { type: "string" },
                  description: { type: "string" },
                  timestamp: { type: "string" },
                  severity: { type: "string" }
                }
              }
            }
          }
        },
        add_context_from_internet: true
      });

      setLiveData(result);
      setLastUpdate(new Date().toISOString());
      
      // Store historical data for charts
      if (result.economic_indicators) {
        setHistoricalData({
          daily: result.economic_indicators.oil_price?.daily_history || [],
          weekly: result.economic_indicators.defense_stocks?.weekly_history || [],
          monthly: result.economic_indicators.gold_price?.monthly_history || []
        });
      }
      
      return result;
    }
  });

  const generateCrossReferenceMutation = useMutation({
    mutationFn: async () => {
      if (!liveData) return null;

      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `You are a historical intelligence analyst. Cross-reference current threat intelligence with historical conflict data and current news.

CURRENT THREAT INTELLIGENCE:
${JSON.stringify(liveData)}

HISTORICAL CONFLICTS DATABASE:
${historicalWars.slice(0, 20).map(w => `- ${w.name}: ${w.description}`).join('\n')}

Perform deep cross-reference analysis:
1. Identify historical parallels to current threats
2. Note significant deviations from historical patterns
3. Correlate current news with historical precedents
4. Provide contextualized risk assessment
5. Highlight if current patterns suggest higher/lower risk than historical norms

Be specific about which historical conflicts are most relevant and why.`,
        response_json_schema: {
          type: "object",
          properties: {
            contextualized_assessment: { type: "string" },
            historical_parallels: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  historical_event: { type: "string" },
                  similarity_score: { type: "number" },
                  comparison: { type: "string" },
                  key_lesson: { type: "string" }
                }
              }
            },
            deviation_analysis: {
              type: "object",
              properties: {
                observation: { type: "string" },
                historical_pattern: { type: "string" },
                current_deviation: { type: "string" },
                implications: { type: "string" }
              }
            },
            news_correlation: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  headline: { type: "string" },
                  relevance_score: { type: "number" },
                  connection: { type: "string" }
                }
              }
            },
            risk_adjustment: {
              type: "object",
              properties: {
                original_risk: { type: "string" },
                adjusted_risk: { type: "string" },
                adjustment: { type: "number" },
                rationale: { type: "string" }
              }
            }
          }
        },
        add_context_from_internet: true
      });

      setCrossRefData(result);
      return result;
    }
  });

  useEffect(() => {
    fetchDataMutation.mutate();
    
    const interval = setInterval(() => {
      fetchDataMutation.mutate();
    }, 15 * 60 * 1000);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (liveData && historicalWars.length > 0 && !crossRefData) {
      generateCrossReferenceMutation.mutate();
    }
  }, [liveData, historicalWars]);

  const getSentimentColor = (score) => {
    if (score >= 50) return 'text-green-400';
    if (score >= 0) return 'text-yellow-400';
    if (score >= -50) return 'text-orange-400';
    return 'text-red-400';
  };

  const getTrendIcon = (trend) => {
    if (trend === 'up') return <TrendingUp className="w-4 h-4 text-green-400" />;
    if (trend === 'down') return <TrendingDown className="w-4 h-4 text-red-400" />;
    return null; // For 'stable' or other cases
  };

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <Card className="bg-slate-950/95 backdrop-blur-xl cyber-border p-3">
          <p className="text-cyan-400 font-mono text-xs mb-1">{label}</p>
          {payload.map((entry, index) => (
            <p key={index} className="font-mono text-xs" style={{ color: entry.color }}>
              {entry.name}: {typeof entry.value === 'number' ? entry.value.toFixed(2) : entry.value}
            </p>
          ))}
        </Card>
      );
    }
    return null;
  };

  return (
    <div className="relative min-h-screen">
      <MatrixBackground />
      
      <div className="relative z-10 p-8">
        <div className="max-w-[1800px] mx-auto space-y-6">
          {/* Header */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h1 className="text-4xl font-bold text-cyan-400 glow-text font-mono mb-2">
                REAL-TIME DATA HUB
              </h1>
              <p className="text-green-400/70 font-mono text-sm flex items-center gap-2">
                <Radio className="w-4 h-4 animate-pulse" />
                Live intelligence aggregation • 15-minute auto-refresh
              </p>
            </div>
            
            <Button
              onClick={() => fetchDataMutation.mutate()}
              disabled={fetchDataMutation.isPending}
              className="bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white font-mono"
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${fetchDataMutation.isPending ? 'animate-spin' : ''}`} />
              {fetchDataMutation.isPending ? 'SYNCING...' : 'REFRESH DATA'}
            </Button>
          </div>

          {/* Live Data Feed */}
          <RealTimeDataFeed 
            refreshInterval={refreshInterval} 
            onDataUpdate={(data) => {
              setLiveFeeds(data);
              // Update visualizations with live data
              if (data.economic_indicators) {
                setHistoricalData(prev => ({
                  ...prev,
                  daily: [...prev.daily.slice(-29), {
                    date: new Date().toLocaleDateString(),
                    price: data.economic_indicators.oil_wti
                  }]
                }));
              }
            }}
          />

          {/* Status Bar */}
          {liveData && (
            <Card className="bg-slate-950/80 backdrop-blur-xl cyber-border p-4">
              <div className="flex items-center justify-between flex-wrap gap-4">
                <div className="flex items-center gap-6">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
                    <span className="text-green-400 font-bold font-mono text-sm">LIVE</span>
                  </div>
                  <Badge className="bg-red-500/20 text-red-400 border-red-500/30 font-mono">
                    {liveData.active_conflicts_count || 0} Active Conflicts
                  </Badge>
                  <Badge className="bg-orange-500/20 text-orange-400 border-orange-500/30 font-mono">
                    Threat: {liveData.overall_threat_level || 'UNKNOWN'}
                  </Badge>
                </div>
                <div className="text-xs text-slate-400 font-mono flex items-center gap-2">
                  <Clock className="w-3 h-3" />
                  Last update: {lastUpdate ? new Date(lastUpdate).toLocaleString() : 'N/A'}
                </div>
              </div>
            </Card>
          )}

          {/* Loading State */}
          {fetchDataMutation.isPending && !liveData && (
            <Card className="bg-slate-950/80 backdrop-blur-xl cyber-border p-12">
              <div className="flex flex-col items-center justify-center space-y-4">
                <Activity className="w-16 h-16 text-cyan-400 animate-pulse" />
                <div className="text-cyan-400 font-mono text-lg">AGGREGATING INTELLIGENCE...</div>
                <p className="text-slate-400 font-mono text-sm">
                  Fetching real-time data from multiple sources
                </p>
              </div>
            </Card>
          )}

          {/* Satellite Intelligence Map */}
          <SatelliteIntelligenceMap intelligenceData={liveData?.satellite_intelligence || []} />

          {/* External Data Feed Manager */}
          <ExternalDataFeedManager 
            onDataContextualized={(data) => {
              // Integrate contextualized data into the hub
              console.log('Contextualized external data:', data);
            }}
          />

          {/* Advanced Analysis Section */}
          <AdvancedAnalysisSection />

          {/* Tabs */}
          {liveData && (
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-7 bg-slate-950/80 border border-green-500/30">
                <TabsTrigger value="overview" className="data-[state=active]:bg-purple-500/20 data-[state=active]:text-purple-400 font-mono text-xs">
                  <BarChart3 className="w-4 h-4 mr-1" />
                  OVERVIEW
                </TabsTrigger>
                <TabsTrigger value="intel" className="data-[state=active]:bg-cyan-500/20 data-[state=active]:text-cyan-400 font-mono text-xs">
                  <Radio className="w-4 h-4 mr-1" />
                  INTEL FEED
                </TabsTrigger>
                <TabsTrigger value="crossref" className="data-[state=active]:bg-blue-500/20 data-[state=active]:text-blue-400 font-mono text-xs">
                  <History className="w-4 h-4 mr-1" />
                  CROSS-REF
                </TabsTrigger>
                <TabsTrigger value="news" className="data-[state=active]:bg-cyan-500/20 data-[state=active]:text-cyan-400 font-mono text-xs">
                  <Newspaper className="w-4 h-4 mr-1" />
                  NEWS
                </TabsTrigger>
                <TabsTrigger value="sentiment" className="data-[state=active]:bg-green-500/20 data-[state=active]:text-green-400 font-mono text-xs">
                  <MessageSquare className="w-4 h-4 mr-1" />
                  SENTIMENT
                </TabsTrigger>
                <TabsTrigger value="economic" className="data-[state=active]:bg-yellow-500/20 data-[state=active]:text-yellow-400 font-mono text-xs">
                  <DollarSign className="w-4 h-4 mr-1" />
                  ECONOMIC
                </TabsTrigger>
                <TabsTrigger value="satellite" className="data-[state=active]:bg-orange-500/20 data-[state=active]:text-orange-400 font-mono text-xs">
                  <Satellite className="w-4 h-4 mr-1" />
                  SATELLITE
                </TabsTrigger>
              </TabsList>

              {/* Threat Intelligence Feed Tab */}
              <TabsContent value="intel" className="mt-6">
                <ThreatIntelligenceFeed 
                  subscriptions={subscriptions}
                  onSubscriptionChange={setSubscriptions}
                />
              </TabsContent>

              {/* Overview Tab */}
              <TabsContent value="overview" className="mt-6 space-y-6">
                <div className="grid lg:grid-cols-3 gap-6">
                  {/* Oil Prices Chart */}
                  <Card className="bg-slate-950/80 backdrop-blur-xl cyber-border p-6">
                    <h3 className="text-lg font-bold text-yellow-400 font-mono mb-4 flex items-center gap-2">
                      <TrendingUp className="w-5 h-5" />
                      OIL PRICES (30 Days)
                    </h3>
                    <div className="h-[200px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={historicalData.daily}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                          <XAxis 
                            dataKey="date" 
                            stroke="#64748b" 
                            style={{ fontSize: '10px', fontFamily: 'monospace' }}
                            tick={{ fill: '#64748b' }}
                            interval="preserveStartEnd"
                            minTickGap={20}
                          />
                          <YAxis 
                            stroke="#64748b"
                            style={{ fontSize: '10px', fontFamily: 'monospace' }}
                            tick={{ fill: '#64748b' }}
                          />
                          <Tooltip content={<CustomTooltip />} />
                          <Line 
                            type="monotone" 
                            dataKey="price" 
                            stroke="#eab308" 
                            strokeWidth={2}
                            dot={false}
                            name="Price (USD)"
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                    <div className="mt-4 flex items-center justify-between">
                      <span className="text-slate-400 font-mono text-xs">Current</span>
                      <span className="text-yellow-400 font-mono text-lg font-bold">
                        ${liveData.economic_indicators?.oil_price?.current?.toFixed(2)}
                      </span>
                    </div>
                  </Card>

                  {/* Defense Stocks Chart */}
                  <Card className="bg-slate-950/80 backdrop-blur-xl cyber-border p-6">
                    <h3 className="text-lg font-bold text-cyan-400 font-mono mb-4 flex items-center gap-2">
                      <BarChart3 className="w-5 h-5" />
                      DEFENSE STOCKS (12 Weeks)
                    </h3>
                    <div className="h-[200px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={historicalData.weekly}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                          <XAxis 
                            dataKey="week" 
                            stroke="#64748b"
                            style={{ fontSize: '10px', fontFamily: 'monospace' }}
                            tick={{ fill: '#64748b' }}
                            interval="preserveStartEnd"
                            minTickGap={20}
                          />
                          <YAxis 
                            stroke="#64748b"
                            style={{ fontSize: '10px', fontFamily: 'monospace' }}
                            tick={{ fill: '#64748b' }}
                          />
                          <Tooltip content={<CustomTooltip />} />
                          <Bar 
                            dataKey="index" 
                            fill="#06b6d4"
                            name="Index"
                          />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                    <div className="mt-4 flex items-center justify-between">
                      <span className="text-slate-400 font-mono text-xs">Current Index</span>
                      <span className="text-cyan-400 font-mono text-lg font-bold">
                        {liveData.economic_indicators?.defense_stocks?.index?.toFixed(0)}
                      </span>
                    </div>
                  </Card>

                  {/* Gold Prices Chart */}
                  <Card className="bg-slate-950/80 backdrop-blur-xl cyber-border p-6">
                    <h3 className="text-lg font-bold text-orange-400 font-mono mb-4 flex items-center gap-2">
                      <Activity className="w-5 h-5" />
                      GOLD PRICES (6 Months)
                    </h3>
                    <div className="h-[200px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={historicalData.monthly}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                          <XAxis 
                            dataKey="month" 
                            stroke="#64748b"
                            style={{ fontSize: '10px', fontFamily: 'monospace' }}
                            tick={{ fill: '#64748b' }}
                            interval="preserveStartEnd"
                            minTickGap={20}
                          />
                          <YAxis 
                            stroke="#64748b"
                            style={{ fontSize: '10px', fontFamily: 'monospace' }}
                            tick={{ fill: '#64748b' }}
                          />
                          <Tooltip content={<CustomTooltip />} />
                          <Area 
                            type="monotone" 
                            dataKey="price" 
                            stroke="#f97316" 
                            fill="#f97316"
                            fillOpacity={0.3}
                            name="Price (USD/oz)"
                          />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                    <div className="mt-4 flex items-center justify-between">
                      <span className="text-slate-400 font-mono text-xs">Current</span>
                      <span className="text-orange-400 font-mono text-lg font-bold">
                        ${liveData.economic_indicators?.gold_price?.current?.toFixed(0)}
                      </span>
                    </div>
                  </Card>
                </div>

                {/* Quick Stats */}
                <div className="grid md:grid-cols-4 gap-4">
                  <Card className="bg-slate-950/80 backdrop-blur-xl cyber-border p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-slate-400 font-mono text-xs">News Items (24h)</span>
                      <Newspaper className="w-4 h-4 text-cyan-400" />
                    </div>
                    <div className="text-2xl font-bold text-cyan-400 font-mono">
                      {liveData.news_summary?.length || 0}
                    </div>
                  </Card>

                  <Card className="bg-slate-950/80 backdrop-blur-xl cyber-border p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-slate-400 font-mono text-xs">Overall Sentiment</span>
                      <MessageSquare className="w-4 h-4 text-green-400" />
                    </div>
                    <div className={`text-2xl font-bold font-mono ${getSentimentColor(liveData.sentiment_analysis?.overall_score || 0)}`}>
                      {liveData.sentiment_analysis?.sentiment_label || 'N/A'}
                    </div>
                  </Card>

                  <Card className="bg-slate-950/80 backdrop-blur-xl cyber-border p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-slate-400 font-mono text-xs">Satellite Alerts</span>
                      <Satellite className="w-4 h-4 text-orange-400" />
                    </div>
                    <div className="text-2xl font-bold text-orange-400 font-mono">
                      {liveData.satellite_intelligence?.length || 0}
                    </div>
                  </Card>

                  <Card className="bg-slate-950/80 backdrop-blur-xl cyber-border p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-slate-400 font-mono text-xs">Data Sources</span>
                      <Activity className="w-4 h-4 text-purple-400" />
                    </div>
                    <div className="text-2xl font-bold text-purple-400 font-mono">
                      LIVE
                    </div>
                  </Card>
                </div>
              </TabsContent>

              <TabsContent value="crossref" className="mt-6">
                {generateCrossReferenceMutation.isPending ? (
                  <Card className="bg-slate-950/80 backdrop-blur-xl cyber-border p-12">
                    <div className="flex flex-col items-center justify-center space-y-4">
                      <Activity className="w-16 h-16 text-blue-400 animate-pulse" />
                      <div className="text-blue-400 font-mono text-lg">CROSS-REFERENCING DATA...</div>
                      <p className="text-slate-400 font-mono text-sm">
                        Analyzing historical parallels and current news correlation
                      </p>
                    </div>
                  </Card>
                ) : (
                  <div className="space-y-6">
                    <div className="flex justify-end">
                      <Button
                        onClick={() => generateCrossReferenceMutation.mutate()}
                        disabled={generateCrossReferenceMutation.isPending}
                        className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white font-mono"
                      >
                        <RefreshCw className={`w-4 h-4 mr-2 ${generateCrossReferenceMutation.isPending ? 'animate-spin' : ''}`} />
                        REGENERATE ANALYSIS
                      </Button>
                    </div>
                    <HistoricalCrossReference crossRefData={crossRefData} />
                  </div>
                )}
              </TabsContent>

              <TabsContent value="news" className="mt-6">
                <Card className="bg-slate-950/80 backdrop-blur-xl cyber-border p-6">
                  <h3 className="text-xl font-bold text-cyan-400 glow-text font-mono mb-4">
                    LIVE NEWS FEED (Last 24 Hours)
                  </h3>
                  <div className="space-y-3">
                    {liveData.news_summary?.map((news, idx) => (
                      <div key={idx} className="bg-slate-900/50 cyber-border rounded-lg p-4 hover-glow transition-all">
                        <div className="flex items-start justify-between mb-2">
                          <h4 className="text-md font-bold text-green-400 font-mono">{news.headline}</h4>
                          <Badge className={`${news.severity === 'CRITICAL' ? 'bg-red-500/20 text-red-400 border-red-500/30' : 'bg-orange-500/20 text-orange-400 border-orange-500/30'} font-mono text-xs shrink-0 ml-2`}>
                            {news.severity}
                          </Badge>
                        </div>
                        <p className="text-slate-400 font-mono text-sm mb-3">{news.summary}</p>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            <span className="text-xs text-slate-500 font-mono">📍 {news.location}</span>
                            <Badge variant="outline" className="border-purple-500/30 text-purple-400 font-mono text-xs">
                              {news.category}
                            </Badge>
                          </div>
                          <span className="text-xs text-slate-500 font-mono">{news.timestamp}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </Card>
              </TabsContent>

              <TabsContent value="sentiment" className="mt-6">
                <Card className="bg-slate-950/80 backdrop-blur-xl cyber-border p-6">
                  <h3 className="text-xl font-bold text-green-400 glow-text font-mono mb-4">
                    SOCIAL MEDIA SENTIMENT ANALYSIS
                  </h3>
                  <div className="space-y-6">
                    {liveData.sentiment_analysis && (
                      <>
                        <div className="bg-slate-900/50 cyber-border rounded-lg p-6">
                          <div className="flex items-center justify-between mb-4">
                            <h4 className="text-lg font-bold text-cyan-400 font-mono">Overall Sentiment</h4>
                            <div className="text-right">
                              <div className={`text-4xl font-bold font-mono ${getSentimentColor(liveData.sentiment_analysis.overall_score)}`}>
                                {liveData.sentiment_analysis.overall_score > 0 ? '+' : ''}{liveData.sentiment_analysis.overall_score}
                              </div>
                              <div className="text-xs text-slate-400 font-mono">{liveData.sentiment_analysis.sentiment_label}</div>
                            </div>
                          </div>
                          {liveData.sentiment_analysis.trending_topics?.length > 0 && (
                            <div>
                              <div className="text-xs text-slate-500 font-mono mb-2">Trending Topics:</div>
                              <div className="flex flex-wrap gap-2">
                                {liveData.sentiment_analysis.trending_topics.map((topic, i) => (
                                  <Badge key={i} variant="outline" className="border-purple-500/30 text-purple-400 font-mono text-xs">
                                    #{topic}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>

                        {liveData.sentiment_analysis.regional_breakdown?.length > 0 && (
                          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {liveData.sentiment_analysis.regional_breakdown.map((regionalSentiment, idx) => (
                              <div key={idx} className="bg-slate-900/50 cyber-border rounded-lg p-4">
                                <h4 className="text-md font-bold text-yellow-400 font-mono mb-2">{regionalSentiment.region}</h4>
                                <div className="flex items-center justify-between mb-2">
                                  <span className="text-xs text-slate-400 font-mono">Sentiment Score</span>
                                  <span className={`text-2xl font-bold font-mono ${getSentimentColor(regionalSentiment.score)}`}>
                                    {regionalSentiment.score > 0 ? '+' : ''}{regionalSentiment.score}
                                  </span>
                                </div>
                                <Badge className={`${regionalSentiment.trend === 'improving' ? 'bg-green-500/20 text-green-400 border-green-500/30' : regionalSentiment.trend === 'declining' ? 'bg-red-500/20 text-red-400 border-red-500/30' : 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30'} font-mono text-xs`}>
                                  TREND: {regionalSentiment.trend.toUpperCase()}
                                </Badge>
                              </div>
                            ))}
                          </div>
                        )}
                      </>
                    )}
                  </div>
                </Card>
              </TabsContent>

              <TabsContent value="economic" className="mt-6 space-y-6">
                {/* Advanced Time Series Charts with Rolling Averages & Volatility */}
                {liveData.economic_indicators?.oil_price?.daily_history && (
                  <AdvancedTimeSeriesChart
                    data={liveData.economic_indicators.oil_price.daily_history.map(d => ({ time: d.date, price: d.price }))}
                    title="OIL PRICES - ADVANCED ANALYSIS"
                    dataKey="price"
                    color="#eab308"
                  />
                )}

                {liveData.economic_indicators?.gold_price?.monthly_history && (
                  <AdvancedTimeSeriesChart
                    data={liveData.economic_indicators.gold_price.monthly_history.map(d => ({ time: d.month, price: d.price }))}
                    title="GOLD PRICES - ADVANCED ANALYSIS"
                    dataKey="price"
                    color="#f97316"
                  />
                )}

                {/* Predictive Charts */}
                {liveData.economic_indicators?.oil_price && (
                  <PredictiveEconomicChart
                    historicalData={historicalData.daily}
                    indicator="Oil Price"
                    currentValue={liveData.economic_indicators.oil_price.current}
                    newsEvents={liveData.news_summary?.filter(n => n.category === 'Economic')}
                  />
                )}

                {/* Time Range Selector */}
                <Card className="bg-slate-950/80 backdrop-blur-xl cyber-border p-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-bold text-yellow-400 font-mono">ECONOMIC INDICATORS</h3>
                    <Select value={timeRange} onValueChange={setTimeRange}>
                      <SelectTrigger className="w-[150px] bg-slate-900/50 border-yellow-500/30 text-yellow-400 font-mono">
                        <SelectValue placeholder="Select period" />
                      </SelectTrigger>
                      <SelectContent className="bg-slate-900/90 text-yellow-400 font-mono border-yellow-500/30">
                        <SelectItem value="daily">Daily (30d)</SelectItem>
                        <SelectItem value="weekly">Weekly (12w)</SelectItem>
                        <SelectItem value="monthly">Monthly (6m)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </Card>

                {/* Large Interactive Charts */}
                <div className="grid lg:grid-cols-2 gap-6">
                  {/* Oil Price Detailed Chart */}
                  {timeRange === 'daily' && (
                    <Card className="bg-slate-950/80 backdrop-blur-xl cyber-border p-6 lg:col-span-2">
                      <h3 className="text-xl font-bold text-yellow-400 font-mono mb-4">
                        OIL PRICE TRENDS (Daily)
                      </h3>
                      <div className="h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                          <AreaChart data={historicalData.daily}>
                            <defs>
                              <linearGradient id="colorOil" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#eab308" stopOpacity={0.8}/>
                                <stop offset="95%" stopColor="#eab308" stopOpacity={0}/>
                              </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                            <XAxis dataKey="date" stroke="#64748b" style={{ fontSize: '11px', fontFamily: 'monospace' }} interval="preserveStartEnd" minTickGap={20}/>
                            <YAxis stroke="#64748b" style={{ fontSize: '11px', fontFamily: 'monospace' }} />
                            <Tooltip content={<CustomTooltip />} />
                            <Legend wrapperStyle={{ fontFamily: 'monospace', fontSize: '12px' }} />
                            <Area 
                              type="monotone" 
                              dataKey="price" 
                              stroke="#eab308" 
                              fillOpacity={1} 
                              fill="url(#colorOil)"
                              name="Price (USD/barrel)"
                            />
                          </AreaChart>
                        </ResponsiveContainer>
                      </div>
                    </Card>
                  )}

                  {/* Defense Stocks Detailed Chart */}
                  {timeRange === 'weekly' && (
                    <Card className="bg-slate-950/80 backdrop-blur-xl cyber-border p-6 lg:col-span-2">
                      <h3 className="text-xl font-bold text-cyan-400 font-mono mb-4">
                        DEFENSE STOCKS INDEX (Weekly)
                      </h3>
                      <div className="h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                          <LineChart data={historicalData.weekly}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                            <XAxis dataKey="week" stroke="#64748b" style={{ fontSize: '11px', fontFamily: 'monospace' }} interval="preserveStartEnd" minTickGap={20}/>
                            <YAxis stroke="#64748b" style={{ fontSize: '11px', fontFamily: 'monospace' }} />
                            <Tooltip content={<CustomTooltip />} />
                            <Legend wrapperStyle={{ fontFamily: 'monospace', fontSize: '12px' }} />
                            <Line 
                              type="monotone" 
                              dataKey="index" 
                              stroke="#06b6d4" 
                              strokeWidth={3}
                              dot={false}
                              name="Defense Index"
                            />
                          </LineChart>
                        </ResponsiveContainer>
                      </div>
                    </Card>
                  )}

                  {/* Gold Price Detailed Chart */}
                  {timeRange === 'monthly' && (
                    <Card className="bg-slate-950/80 backdrop-blur-xl cyber-border p-6 lg:col-span-2">
                      <h3 className="text-xl font-bold text-orange-400 font-mono mb-4">
                        GOLD PRICES (Monthly)
                      </h3>
                      <div className="h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={historicalData.monthly}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                            <XAxis dataKey="month" stroke="#64748b" style={{ fontSize: '11px', fontFamily: 'monospace' }} interval="preserveStartEnd" minTickGap={20}/>
                            <YAxis stroke="#64748b" style={{ fontSize: '11px', fontFamily: 'monospace' }} />
                            <Tooltip content={<CustomTooltip />} />
                            <Legend wrapperStyle={{ fontFamily: 'monospace', fontSize: '12px' }} />
                            <Bar dataKey="price" fill="#f97316" name="Price (USD/oz)" />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    </Card>
                  )}

                  {/* Current Economic Snapshot */}
                  <Card className="bg-slate-950/80 backdrop-blur-xl cyber-border p-6">
                    <h3 className="text-xl font-bold text-yellow-400 font-mono mb-4">
                      CURRENT ECONOMIC SNAPSHOT
                    </h3>
                    <div className="space-y-4">
                      {/* Oil Price */}
                      <div className="bg-slate-900/50 cyber-border rounded p-4">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-slate-300 font-mono text-sm font-bold">Oil Price</span>
                          {getTrendIcon(liveData.economic_indicators?.oil_price?.trend)}
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-yellow-400 font-mono text-lg">${liveData.economic_indicators?.oil_price?.current?.toFixed(2)}</span>
                          <span className={`font-mono text-sm ${liveData.economic_indicators?.oil_price?.change_24h >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                            {liveData.economic_indicators?.oil_price?.change_24h >= 0 ? '+' : ''}{liveData.economic_indicators?.oil_price?.change_24h?.toFixed(2)}% (24h)
                          </span>
                        </div>
                      </div>
                      {/* Defense Stocks */}
                      <div className="bg-slate-900/50 cyber-border rounded p-4">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-slate-300 font-mono text-sm font-bold">Defense Stocks Index</span>
                          {getTrendIcon(liveData.economic_indicators?.defense_stocks?.trend)}
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-cyan-400 font-mono text-lg">{liveData.economic_indicators?.defense_stocks?.index?.toFixed(0)}</span>
                          <span className={`font-mono text-sm ${liveData.economic_indicators?.defense_stocks?.change_7d >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                            {liveData.economic_indicators?.defense_stocks?.change_7d >= 0 ? '+' : ''}{liveData.economic_indicators?.defense_stocks?.change_7d?.toFixed(2)}% (7d)
                          </span>
                        </div>
                      </div>
                      {/* Gold Price */}
                      <div className="bg-slate-900/50 cyber-border rounded p-4">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-slate-300 font-mono text-sm font-bold">Gold Price</span>
                          {getTrendIcon(liveData.economic_indicators?.gold_price?.trend)}
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-orange-400 font-mono text-lg">${liveData.economic_indicators?.gold_price?.current?.toFixed(0)}</span>
                          <span className={`font-mono text-sm ${liveData.economic_indicators?.gold_price?.change_30d >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                            {liveData.economic_indicators?.gold_price?.change_30d >= 0 ? '+' : ''}{liveData.economic_indicators?.gold_price?.change_30d?.toFixed(2)}% (30d)
                          </span>
                        </div>
                      </div>
                    </div>
                  </Card>

                  {/* Additional commodities display */}
                  <Card className="bg-slate-950/80 backdrop-blur-xl cyber-border p-6">
                    <h3 className="text-xl font-bold text-green-400 font-mono mb-4">
                      OTHER COMMODITIES
                    </h3>
                    <div className="space-y-3">
                      {liveData.economic_indicators?.commodities?.map((commodity, idx) => (
                        <div key={idx} className="bg-slate-900/50 cyber-border rounded p-3">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-slate-300 font-mono text-sm font-bold">{commodity.name}</span>
                            {getTrendIcon(commodity.trend)}
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-green-400 font-mono text-lg">${commodity.price?.toFixed(2)}</span>
                            <span className={`font-mono text-sm ${commodity.change >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                              {commodity.change >= 0 ? '+' : ''}{commodity.change?.toFixed(2)}%
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </Card>

                  {/* Currency Impacts */}
                  <Card className="bg-slate-950/80 backdrop-blur-xl cyber-border p-6 lg:col-span-2">
                    <h3 className="text-xl font-bold text-purple-400 font-mono mb-4">
                      CURRENCY IMPACTS
                    </h3>
                    <div className="grid md:grid-cols-3 gap-3">
                      {liveData.economic_indicators?.currency_impacts?.map((currency, idx) => (
                        <div key={idx} className="bg-slate-900/50 cyber-border rounded p-3">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-slate-300 font-mono text-sm font-bold">{currency.pair}</span>
                            {currency.change >= 0 ? <TrendingUp className="w-4 h-4 text-green-400" /> : <TrendingDown className="w-4 h-4 text-red-400" />}
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-purple-400 font-mono text-lg">{currency.rate?.toFixed(4)}</span>
                            <span className={`font-mono text-sm ${currency.change >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                              {currency.change >= 0 ? '+' : ''}{currency.change?.toFixed(2)}%
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </Card>
                </div>
              </TabsContent>

              <TabsContent value="satellite" className="mt-6">
                <Card className="bg-slate-950/80 backdrop-blur-xl cyber-border p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <Satellite className="w-6 h-6 text-orange-400" />
                    <h3 className="text-xl font-bold text-orange-400 glow-text font-mono">
                      SATELLITE INTELLIGENCE SUMMARY
                    </h3>
                  </div>
                  <div className="space-y-4">
                    {liveData.satellite_intelligence?.map((intel, idx) => (
                      <div key={idx} className="bg-slate-900/50 cyber-border rounded-lg p-4 border-l-4 border-orange-500/50">
                        <div className="flex items-start justify-between mb-2">
                          <h4 className="text-md font-bold text-yellow-400 font-mono">{intel.type} - {intel.location}</h4>
                          <Badge className={`${intel.severity === 'HIGH' ? 'bg-red-500/20 text-red-400 border-red-500/30' : 'bg-orange-500/20 text-orange-400 border-orange-500/30'} font-mono text-xs`}>
                            {intel.severity}
                          </Badge>
                        </div>
                        <p className="text-slate-400 font-mono text-sm mb-2">{intel.description}</p>
                        <div className="text-xs text-slate-500 font-mono">
                          Observed: {intel.timestamp}
                        </div>
                      </div>
                    ))}
                  </div>
                </Card>
              </TabsContent>
            </Tabs>
          )}
        </div>
      </div>
    </div>
  );
}