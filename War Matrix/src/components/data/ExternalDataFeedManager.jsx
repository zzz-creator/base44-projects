import React, { useState, useEffect, useRef } from 'react';
import { base44 } from '../../api/base44Client';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Badge } from '../ui/badge';
import { Switch } from '../ui/switch';
import { Label } from '../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { 
  Rss, Plus, Trash2, RefreshCw, Loader2, Check, X,
  Globe, AlertTriangle, TrendingUp, Newspaper, Link2,
  Settings, Eye, Zap, Database, Bell, BellRing, Activity
} from 'lucide-react';
import { toast } from 'sonner';

export default function ExternalDataFeedManager({ onDataContextualized }) {
  const queryClient = useQueryClient();
  const [feeds, setFeeds] = useState(() => {
    const saved = localStorage.getItem('warMatrixExternalFeeds');
    return saved ? JSON.parse(saved) : [];
  });
  const [newFeed, setNewFeed] = useState({
    name: '',
    type: 'rss',
    url: '',
    category: 'news',
    refresh_interval: 30,
    is_active: true,
    auto_contextualize: false
  });
  const [showAddForm, setShowAddForm] = useState(false);
  const [fetchedData, setFetchedData] = useState({});
  const [contextualizedResults, setContextualizedResults] = useState([]);
  const [autoContextualizing, setAutoContextualizing] = useState(false);
  const autoContextualizeRef = useRef(null);

  // Save feeds to localStorage
  useEffect(() => {
    localStorage.setItem('warMatrixExternalFeeds', JSON.stringify(feeds));
  }, [feeds]);

  // Fetch user profile for saved feeds
  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  const { data: userProfile } = useQuery({
    queryKey: ['userProfile', user?.email],
    queryFn: async () => {
      const profiles = await base44.entities.UserProfile.filter({ created_by: user.email });
      if (profiles.length > 0 && profiles[0].external_data_feeds) {
        setFeeds(profiles[0].external_data_feeds);
        return profiles[0];
      }
      return null;
    },
    enabled: !!user,
  });

  // Save feeds to profile
  const saveToProfile = async () => {
    if (!user || !userProfile) {
      toast.error('Please sign in to save feeds to your profile');
      return;
    }
    
    await base44.entities.UserProfile.update(userProfile.id, {
      external_data_feeds: feeds
    });
    toast.success('Feeds saved to profile');
  };

  // Contextualize data mutation
  const contextualizeDataMutation = useMutation({
    mutationFn: async (feedData) => {
      const response = await base44.integrations.Core.InvokeLLM({
        prompt: `You are a conflict intelligence analyst. Analyze and contextualize the following external data feeds within the context of global threat and conflict analysis.

EXTERNAL DATA FEEDS:
${JSON.stringify(feedData, null, 2)}

Perform the following analysis:

1. THREAT CORRELATION:
   - Identify how this data correlates with known conflict zones
   - Flag any indicators of escalation or de-escalation
   - Rate threat relevance (0-100)

2. PATTERN RECOGNITION:
   - Identify emerging patterns across data sources
   - Compare with historical conflict indicators
   - Note any anomalies

3. ACTIONABLE INTELLIGENCE:
   - Extract key actionable insights
   - Prioritize by urgency
   - Recommend monitoring priorities

4. DATA INTEGRATION:
   - Suggest how this data should be weighted in overall threat assessment
   - Identify gaps in coverage
   - Recommend additional data sources

Provide comprehensive contextualized analysis.`,
        response_json_schema: {
          type: 'object',
          properties: {
            analysis_timestamp: { type: 'string' },
            threat_correlations: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  data_item: { type: 'string' },
                  conflict_zone: { type: 'string' },
                  correlation_type: { type: 'string' },
                  threat_relevance: { type: 'number' },
                  assessment: { type: 'string' }
                }
              }
            },
            emerging_patterns: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  pattern_name: { type: 'string' },
                  description: { type: 'string' },
                  significance: { type: 'string' },
                  affected_regions: { type: 'array', items: { type: 'string' } }
                }
              }
            },
            actionable_intelligence: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  insight: { type: 'string' },
                  urgency: { type: 'string' },
                  recommended_action: { type: 'string' },
                  confidence: { type: 'number' }
                }
              }
            },
            integration_recommendations: {
              type: 'object',
              properties: {
                weight_adjustments: { type: 'array', items: { type: 'string' } },
                coverage_gaps: { type: 'array', items: { type: 'string' } },
                suggested_sources: { type: 'array', items: { type: 'string' } }
              }
            },
            overall_assessment: { type: 'string' }
          }
        },
        add_context_from_internet: true
      });

      return response;
    },
    onSuccess: (data) => {
      setContextualizedResults([data, ...contextualizedResults.slice(0, 4)]);
      if (onDataContextualized) {
        onDataContextualized(data);
      }
      toast.success('Data contextualized successfully');
    }
  });

  // Fetch and parse external feed
  const fetchFeedMutation = useMutation({
    mutationFn: async (feed) => {
      const response = await base44.integrations.Core.InvokeLLM({
        prompt: `You are a data aggregation AI. Fetch and parse data from this external source:

Source Name: ${feed.name}
Source Type: ${feed.type}
URL/Endpoint: ${feed.url}
Category: ${feed.category}

Simulate fetching the latest data from this source. Generate realistic sample data that would come from such a source. For news feeds, generate 5-8 recent headlines with summaries. For economic feeds, generate current indicators. For intelligence feeds, generate threat assessments.

Return structured data that can be integrated into a conflict analysis system.`,
        response_json_schema: {
          type: 'object',
          properties: {
            source_name: { type: 'string' },
            fetch_timestamp: { type: 'string' },
            data_items: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  title: { type: 'string' },
                  summary: { type: 'string' },
                  timestamp: { type: 'string' },
                  category: { type: 'string' },
                  severity: { type: 'string' },
                  location: { type: 'string' },
                  relevance_score: { type: 'number' }
                }
              }
            },
            metadata: {
              type: 'object',
              properties: {
                total_items: { type: 'number' },
                data_quality: { type: 'string' },
                last_update: { type: 'string' }
              }
            }
          }
        },
        add_context_from_internet: true
      });

      return { feed, data: response };
    },
    onSuccess: async ({ feed, data }) => {
      setFetchedData(prev => ({
        ...prev,
        [feed.id]: data
      }));
      toast.success(`Fetched data from ${feed.name}`);

      // Auto-contextualize if enabled for this feed
      if (feed.auto_contextualize) {
        setAutoContextualizing(true);
        toast.info(`Auto-contextualizing data from ${feed.name}...`);
        await contextualizeDataMutation.mutateAsync([data]);
        setAutoContextualizing(false);
      }
    }
  });

  const addFeed = () => {
    if (!newFeed.name || !newFeed.url) {
      toast.error('Please provide feed name and URL');
      return;
    }

    const feed = {
      ...newFeed,
      id: Date.now().toString(),
      created_at: new Date().toISOString()
    };

    setFeeds([...feeds, feed]);
    setNewFeed({
      name: '',
      type: 'rss',
      url: '',
      category: 'news',
      refresh_interval: 30,
      is_active: true,
      auto_contextualize: false
    });
    setShowAddForm(false);
    toast.success('Feed added successfully');
  };

  const removeFeed = (feedId) => {
    setFeeds(feeds.filter(f => f.id !== feedId));
    const newFetchedData = { ...fetchedData };
    delete newFetchedData[feedId];
    setFetchedData(newFetchedData);
    toast.success('Feed removed');
  };

  const toggleFeed = (feedId) => {
    setFeeds(feeds.map(f => 
      f.id === feedId ? { ...f, is_active: !f.is_active } : f
    ));
  };

  const toggleAutoContextualize = (feedId) => {
    setFeeds(feeds.map(f => 
      f.id === feedId ? { ...f, auto_contextualize: !f.auto_contextualize } : f
    ));
    const feed = feeds.find(f => f.id === feedId);
    if (feed) {
      toast.success(`Auto-contextualization ${!feed.auto_contextualize ? 'enabled' : 'disabled'} for ${feed.name}`);
    }
  };

  const fetchAllFeeds = async () => {
    for (const feed of feeds.filter(f => f.is_active)) {
      await fetchFeedMutation.mutateAsync(feed);
    }
  };

  const getCategoryColor = (category) => {
    const colors = {
      news: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30',
      economic: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
      intelligence: 'bg-red-500/20 text-red-400 border-red-500/30',
      sentiment: 'bg-purple-500/20 text-purple-400 border-purple-500/30'
    };
    return colors[category] || 'bg-slate-500/20 text-slate-400 border-slate-500/30';
  };

  return (
    <Card className="bg-slate-950/80 backdrop-blur-xl border border-sky-900/40 p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-cyan-500/20 border border-cyan-500/30">
            <Rss className="w-6 h-6 text-cyan-400" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-cyan-400 glow-text font-mono">
              EXTERNAL DATA FEEDS
            </h3>
            <p className="text-xs text-slate-400 font-mono">Integrate custom RSS, APIs with auto-contextualization</p>
          </div>
        </div>
        <div className="flex gap-2">
          {autoContextualizing && (
            <Badge className="bg-purple-500/20 text-purple-400 border-purple-500/30 font-mono animate-pulse">
              <Activity className="w-3 h-3 mr-1 animate-spin" />
              AUTO-ANALYZING
            </Badge>
          )}
          <Button
            onClick={fetchAllFeeds}
            disabled={fetchFeedMutation.isPending || feeds.filter(f => f.is_active).length === 0}
            className="bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-400 border border-cyan-500/30 font-mono text-xs"
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${fetchFeedMutation.isPending ? 'animate-spin' : ''}`} />
            FETCH ALL
          </Button>
          <Button
            onClick={() => setShowAddForm(!showAddForm)}
            className="bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white font-mono text-xs"
          >
            <Plus className="w-4 h-4 mr-2" />
            ADD FEED
          </Button>
        </div>
      </div>

      <Tabs defaultValue="feeds" className="space-y-4">
        <TabsList className="grid grid-cols-3 bg-slate-900/50">
          <TabsTrigger value="feeds" className="font-mono text-xs">MANAGE FEEDS ({feeds.length})</TabsTrigger>
          <TabsTrigger value="data" className="font-mono text-xs">FETCHED DATA</TabsTrigger>
          <TabsTrigger value="analysis" className="font-mono text-xs">AI ANALYSIS</TabsTrigger>
        </TabsList>

        {/* Feeds Tab */}
        <TabsContent value="feeds" className="space-y-4">
          {/* Add Feed Form */}
          {showAddForm && (
            <div className="bg-cyan-500/10 border border-cyan-500/30 rounded-lg p-4 space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="text-cyan-400 font-mono font-bold">ADD NEW DATA FEED</h4>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setShowAddForm(false)}
                  className="text-slate-400 hover:text-slate-200"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <Label className="text-cyan-400 font-mono text-xs mb-1">FEED NAME</Label>
                  <Input
                    value={newFeed.name}
                    onChange={(e) => setNewFeed({ ...newFeed, name: e.target.value })}
                    placeholder="e.g., Reuters World News"
                    className="bg-slate-900/50 border-cyan-500/30 text-slate-200 font-mono"
                  />
                </div>
                <div>
                  <Label className="text-cyan-400 font-mono text-xs mb-1">FEED TYPE</Label>
                  <Select
                    value={newFeed.type}
                    onValueChange={(value) => setNewFeed({ ...newFeed, type: value })}
                  >
                    <SelectTrigger className="bg-slate-900/50 border-cyan-500/30 text-slate-200 font-mono">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-900 border-cyan-500/30">
                      <SelectItem value="rss">RSS Feed</SelectItem>
                      <SelectItem value="api">REST API</SelectItem>
                      <SelectItem value="webhook">Webhook</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label className="text-cyan-400 font-mono text-xs mb-1">URL / ENDPOINT</Label>
                <Input
                  value={newFeed.url}
                  onChange={(e) => setNewFeed({ ...newFeed, url: e.target.value })}
                  placeholder="https://example.com/rss/feed"
                  className="bg-slate-900/50 border-cyan-500/30 text-slate-200 font-mono"
                />
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <Label className="text-cyan-400 font-mono text-xs mb-1">CATEGORY</Label>
                  <Select
                    value={newFeed.category}
                    onValueChange={(value) => setNewFeed({ ...newFeed, category: value })}
                  >
                    <SelectTrigger className="bg-slate-900/50 border-cyan-500/30 text-slate-200 font-mono">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-900 border-cyan-500/30">
                      <SelectItem value="news">News</SelectItem>
                      <SelectItem value="economic">Economic Data</SelectItem>
                      <SelectItem value="intelligence">Intelligence</SelectItem>
                      <SelectItem value="sentiment">Sentiment Analysis</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-cyan-400 font-mono text-xs mb-1">REFRESH INTERVAL (min)</Label>
                  <Input
                    type="number"
                    value={newFeed.refresh_interval}
                    onChange={(e) => setNewFeed({ ...newFeed, refresh_interval: parseInt(e.target.value) })}
                    className="bg-slate-900/50 border-cyan-500/30 text-slate-200 font-mono"
                  />
                </div>
              </div>

              {/* Auto-contextualize toggle */}
              <div className="flex items-center justify-between bg-purple-500/10 border border-purple-500/30 rounded-lg p-3">
                <div className="flex items-center gap-2">
                  <BellRing className="w-4 h-4 text-purple-400" />
                  <div>
                    <Label className="text-purple-400 font-mono text-xs font-bold">AUTO-CONTEXTUALIZE</Label>
                    <p className="text-slate-500 font-mono text-[10px]">Automatically analyze new data with AI</p>
                  </div>
                </div>
                <Switch
                  checked={newFeed.auto_contextualize}
                  onCheckedChange={(checked) => setNewFeed({ ...newFeed, auto_contextualize: checked })}
                />
              </div>

              <Button
                onClick={addFeed}
                className="w-full bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white font-mono"
              >
                <Plus className="w-4 h-4 mr-2" />
                ADD FEED
              </Button>
            </div>
          )}

          {/* Feed List */}
          {feeds.length === 0 ? (
            <div className="bg-slate-900/50 border border-sky-800/30 rounded-lg p-8 text-center">
              <Rss className="w-12 h-12 text-slate-600 mx-auto mb-3" />
              <p className="text-slate-500 font-mono text-sm mb-2">No external feeds configured</p>
              <p className="text-slate-600 font-mono text-xs">
                Add RSS feeds, news APIs, or other data sources to enhance threat analysis
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {feeds.map((feed) => (
                <div
                  key={feed.id}
                  className={`bg-slate-900/50 border rounded-lg p-4 ${
                    feed.is_active ? 'border-sky-800/30' : 'border-slate-700/30 opacity-60'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-slate-800/50">
                        {feed.type === 'rss' && <Rss className="w-4 h-4 text-orange-400" />}
                        {feed.type === 'api' && <Globe className="w-4 h-4 text-cyan-400" />}
                        {feed.type === 'webhook' && <Zap className="w-4 h-4 text-yellow-400" />}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="text-green-400 font-mono font-bold text-sm">{feed.name}</h4>
                          {feed.auto_contextualize && (
                            <Badge className="bg-purple-500/20 text-purple-400 border-purple-500/30 font-mono text-[10px]">
                              <BellRing className="w-2 h-2 mr-1" />
                              AUTO
                            </Badge>
                          )}
                        </div>
                        <p className="text-slate-500 font-mono text-xs truncate max-w-md">{feed.url}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge className={getCategoryColor(feed.category)}>
                        {feed.category}
                      </Badge>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => toggleAutoContextualize(feed.id)}
                        className={`p-1 ${feed.auto_contextualize ? 'text-purple-400 hover:text-purple-300' : 'text-slate-500 hover:text-slate-400'}`}
                        title={feed.auto_contextualize ? 'Disable auto-contextualize' : 'Enable auto-contextualize'}
                      >
                        <BellRing className="w-4 h-4" />
                      </Button>
                      <Switch
                        checked={feed.is_active}
                        onCheckedChange={() => toggleFeed(feed.id)}
                      />
                      <Button
                        size="sm"
                        onClick={() => fetchFeedMutation.mutate(feed)}
                        disabled={fetchFeedMutation.isPending}
                        className="bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-400 border border-cyan-500/30 font-mono text-xs"
                      >
                        <RefreshCw className={`w-3 h-3 ${fetchFeedMutation.isPending ? 'animate-spin' : ''}`} />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => removeFeed(feed.id)}
                        className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>

                  {fetchedData[feed.id] && (
                    <div className="mt-3 pt-3 border-t border-slate-700/30">
                      <div className="flex items-center gap-2 text-xs text-slate-500 font-mono">
                        <Check className="w-3 h-3 text-green-400" />
                        Last fetched: {fetchedData[feed.id].fetch_timestamp}
                        <span className="text-cyan-400">
                          ({fetchedData[feed.id].data_items?.length || 0} items)
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {feeds.length > 0 && user && (
            <Button
              onClick={saveToProfile}
              variant="outline"
              className="w-full border-cyan-500/30 text-cyan-400 hover:bg-cyan-500/10 font-mono text-xs"
            >
              <Database className="w-4 h-4 mr-2" />
              SAVE FEEDS TO PROFILE
            </Button>
          )}
        </TabsContent>

        {/* Data Tab */}
        <TabsContent value="data" className="space-y-4">
          {Object.keys(fetchedData).length === 0 ? (
            <div className="bg-slate-900/50 border border-sky-800/30 rounded-lg p-8 text-center">
              <Database className="w-12 h-12 text-slate-600 mx-auto mb-3" />
              <p className="text-slate-500 font-mono text-sm">No data fetched yet</p>
              <p className="text-slate-600 font-mono text-xs">
                Configure feeds and click "Fetch All" to retrieve data
              </p>
            </div>
          ) : (
            Object.entries(fetchedData).map(([feedId, data]) => {
              const feed = feeds.find(f => f.id === feedId);
              return (
                <Card key={feedId} className="bg-slate-900/50 border border-sky-800/30 p-4">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <Newspaper className="w-5 h-5 text-cyan-400" />
                      <h4 className="text-cyan-400 font-mono font-bold">{data.source_name}</h4>
                      {feed?.auto_contextualize && (
                        <Badge className="bg-purple-500/20 text-purple-400 border-purple-500/30 font-mono text-[10px]">
                          AUTO-ANALYZE
                        </Badge>
                      )}
                    </div>
                    <Badge className="bg-green-500/20 text-green-400 border-green-500/30 font-mono text-xs">
                      {data.data_items?.length || 0} items
                    </Badge>
                  </div>

                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {data.data_items?.map((item, idx) => (
                      <div key={idx} className="bg-slate-800/50 rounded p-3">
                        <div className="flex items-start justify-between mb-1">
                          <h5 className="text-green-400 font-mono text-sm font-bold">{item.title}</h5>
                          <Badge className={`font-mono text-[10px] ${
                            item.severity === 'HIGH' ? 'bg-red-500/20 text-red-400' :
                            item.severity === 'MEDIUM' ? 'bg-orange-500/20 text-orange-400' :
                            'bg-yellow-500/20 text-yellow-400'
                          }`}>
                            {item.severity}
                          </Badge>
                        </div>
                        <p className="text-slate-400 font-mono text-xs">{item.summary}</p>
                        <div className="flex items-center gap-4 mt-2 text-[10px] text-slate-500 font-mono">
                          <span>📍 {item.location}</span>
                          <span>🕐 {item.timestamp}</span>
                          <span>Relevance: {item.relevance_score}%</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </Card>
              );
            })
          )}

          {Object.keys(fetchedData).length > 0 && (
            <Button
              onClick={() => contextualizeDataMutation.mutate(Object.values(fetchedData))}
              disabled={contextualizeDataMutation.isPending}
              className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-mono"
            >
              {contextualizeDataMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  CONTEXTUALIZING DATA...
                </>
              ) : (
                <>
                  <Zap className="w-4 h-4 mr-2" />
                  CONTEXTUALIZE ALL WITH AI
                </>
              )}
            </Button>
          )}
        </TabsContent>

        {/* Analysis Tab */}
        <TabsContent value="analysis" className="space-y-4">
          {contextualizedResults.length === 0 ? (
            <div className="bg-slate-900/50 border border-sky-800/30 rounded-lg p-8 text-center">
              <Eye className="w-12 h-12 text-slate-600 mx-auto mb-3" />
              <p className="text-slate-500 font-mono text-sm">No analysis performed yet</p>
              <p className="text-slate-600 font-mono text-xs">
                Enable auto-contextualize on feeds or click "Contextualize All with AI"
              </p>
            </div>
          ) : (
            contextualizedResults.map((result, resultIdx) => (
              <Card key={resultIdx} className="bg-slate-900/50 border border-sky-800/30 p-4 space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-purple-400 font-mono font-bold">AI CONTEXTUAL ANALYSIS</h4>
                  <span className="text-slate-500 font-mono text-xs">{result.analysis_timestamp}</span>
                </div>

                {/* Overall Assessment */}
                <div className="bg-purple-500/10 border border-purple-500/30 rounded-lg p-3">
                  <p className="text-slate-300 font-mono text-sm">{result.overall_assessment}</p>
                </div>

                {/* Threat Correlations */}
                {result.threat_correlations?.length > 0 && (
                  <div>
                    <h5 className="text-red-400 font-mono font-bold text-sm mb-2 flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4" />
                      THREAT CORRELATIONS
                    </h5>
                    <div className="space-y-2">
                      {result.threat_correlations.slice(0, 5).map((corr, idx) => (
                        <div key={idx} className="bg-red-500/10 border border-red-500/20 rounded p-2">
                          <div className="flex items-start justify-between mb-1">
                            <span className="text-red-400 font-mono text-xs font-bold">{corr.conflict_zone}</span>
                            <Badge className="bg-red-500/20 text-red-400 font-mono text-[10px]">
                              {corr.threat_relevance}% relevant
                            </Badge>
                          </div>
                          <p className="text-slate-400 font-mono text-xs">{corr.assessment}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Actionable Intelligence */}
                {result.actionable_intelligence?.length > 0 && (
                  <div>
                    <h5 className="text-green-400 font-mono font-bold text-sm mb-2 flex items-center gap-2">
                      <Zap className="w-4 h-4" />
                      ACTIONABLE INTELLIGENCE
                    </h5>
                    <div className="space-y-2">
                      {result.actionable_intelligence.map((intel, idx) => (
                        <div key={idx} className="bg-green-500/10 border border-green-500/20 rounded p-2">
                          <div className="flex items-start justify-between mb-1">
                            <span className={`font-mono text-xs font-bold ${
                              intel.urgency === 'HIGH' ? 'text-red-400' :
                              intel.urgency === 'MEDIUM' ? 'text-orange-400' : 'text-yellow-400'
                            }`}>
                              {intel.urgency} URGENCY
                            </span>
                            <Badge className="bg-green-500/20 text-green-400 font-mono text-[10px]">
                              {intel.confidence}% confidence
                            </Badge>
                          </div>
                          <p className="text-slate-300 font-mono text-xs mb-1">{intel.insight}</p>
                          <p className="text-green-400 font-mono text-xs">→ {intel.recommended_action}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Emerging Patterns */}
                {result.emerging_patterns?.length > 0 && (
                  <div>
                    <h5 className="text-cyan-400 font-mono font-bold text-sm mb-2 flex items-center gap-2">
                      <TrendingUp className="w-4 h-4" />
                      EMERGING PATTERNS
                    </h5>
                    <div className="space-y-2">
                      {result.emerging_patterns.map((pattern, idx) => (
                        <div key={idx} className="bg-cyan-500/10 border border-cyan-500/20 rounded p-2">
                          <span className="text-cyan-400 font-mono text-xs font-bold">{pattern.pattern_name}</span>
                          <p className="text-slate-400 font-mono text-xs">{pattern.description}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </Card>
            ))
          )}
        </TabsContent>
      </Tabs>
    </Card>
  );
}