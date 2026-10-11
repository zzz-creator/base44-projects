import React, { useState } from 'react';
import { base44 } from '../api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import { Dialog, DialogContent } from '../components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Search, Calendar, FileText, Loader2, Database, AlertTriangle, RefreshCw } from 'lucide-react';
import MatrixBackground from '../components/war/MatrixBackground';
import InteractiveWarMap from '../components/war/InteractiveWarMap';
import WarDebriefing from '../components/war/WarDebriefing';
import ComparativeWarAnalysis from '../components/analysis/ComparativeWarAnalysis';

export default function PastWars() {
  const [searchTerm, setSearchTerm] = useState('');
  const [searchType, setSearchType] = useState('war');
  const [selectedWar, setSelectedWar] = useState(null);
  const [showDebriefing, setShowDebriefing] = useState(false);
  const [selectedCentury, setSelectedCentury] = useState('all');
  const [selectedWars, setSelectedWars] = useState([]);
  const [showComparison, setShowComparison] = useState(false);
  const queryClient = useQueryClient();

  const { data: wars, isLoading } = useQuery({
    queryKey: ['wars', 'past'],
    queryFn: () => base44.entities.War.filter({ era: 'past' }, '-start_date'),
    initialData: [],
  });

  // Auto-load comprehensive historical wars database on first visit
  React.useEffect(() => {
    if (wars.length === 0 && !generateHistoricalDataMutation.isPending) {
      // Automatically load comprehensive historical wars database
      generateComprehensiveHistoricalDataMutation.mutate();
    }
  }, []);

  const generateComprehensiveHistoricalDataMutation = useMutation({
    mutationFn: async () => {
      const comprehensivePrompt = `You are a comprehensive military historian AI. Generate detailed data for 100+ major historical conflicts from antiquity to 2024.

COVERAGE REQUIREMENTS:
- Ancient Wars (10+): Persian Wars, Peloponnesian War, Punic Wars, Alexander's Conquests, Roman Civil Wars
- Medieval Wars (15+): Crusades, Hundred Years War, Wars of the Roses, Mongol Conquests, Byzantine-Ottoman wars
- Early Modern (20+): Thirty Years War, English Civil War, Spanish Succession, Seven Years War, American Revolution, French Revolutionary Wars
- 19th Century (20+): Napoleonic Wars, Wars of Independence (Latin America), American Civil War, Crimean War, Franco-Prussian War, Colonial Wars
- 20th Century (30+): WWI, WWII, Russian Civil War, Spanish Civil War, Korean War, Vietnam War, Arab-Israeli Wars, Indo-Pakistani Wars, Iran-Iraq War, Gulf Wars, Yugoslav Wars, Rwandan Genocide
- Recent Conflicts (10+): Afghanistan War, Iraq War, Syrian Civil War, Libyan Civil War, Yemen Civil War, Ukrainian conflicts

FOR EACH WAR PROVIDE:
1. Complete name, start/end dates, comprehensive description (200+ chars)
2. ALL major participating countries with EXACT coordinates (capital cities)
3. Each country's role: "aggressor", "defender", "ally", or "axis"
4. Detailed casualty data:
   - Military deaths (realistic historical estimates)
   - Civilian deaths (including genocide/atrocities)
   - Total casualties
5. Economic impact in billions USD (inflation-adjusted to 2024 values)
6. Military data for EACH country:
   - Army size at peak
   - Military budget (adjusted to 2024 USD billions)
   - Casualties per country
7. War type: territorial, civil, religious, economic, colonial, world_war
8. Geopolitical outcome and consequences

ACCURACY REQUIREMENTS:
- Use real historical data
- Coordinates must be actual capital cities
- Casualty figures based on historical consensus
- Economic impacts adjusted for inflation
- Include lesser-known but significant conflicts

Return 100-120 wars with complete data.`;

      const result = await base44.integrations.Core.InvokeLLM({
        prompt: comprehensivePrompt,
        response_json_schema: {
          type: "object",
          properties: {
            wars: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  name: { type: "string" },
                  start_date: { type: "string" },
                  end_date: { type: "string" },
                  description: { type: "string" },
                  type: { type: "string" },
                  status: { type: "string" },
                  era: { type: "string" },
                  economic_impact: { type: "number" },
                  outcome: { type: "string" },
                  consequences: { type: "string" },
                  casualties: {
                    type: "object",
                    properties: {
                      military: { type: "number" },
                      civilian: { type: "number" },
                      total: { type: "number" }
                    }
                  },
                  countries_involved: { type: "array", items: { type: "string" } },
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
                      required: ["country_name", "latitude", "longitude", "side"]
                    }
                  }
                },
                required: ["name", "start_date", "description", "countries_data", "economic_impact", "casualties"]
              }
            }
          }
        },
        add_context_from_internet: true
      });

      // Insert wars into database in batches
      if (result.wars && result.wars.length > 0) {
        const batchSize = 10;
        for (let i = 0; i < result.wars.length; i += batchSize) {
          const batch = result.wars.slice(i, i + batchSize);
          await Promise.all(
            batch.map(war => 
              base44.entities.War.create({
                ...war,
                era: 'past',
                status: 'ended'
              })
            )
          );
        }
      }

      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['wars', 'past'] });
    }
  });

  const generateHistoricalDataMutation = useMutation({
    mutationFn: async ({ type, query }) => {
      const prompt = type === 'country' 
        ? `You are a military historian. Search historical records and provide comprehensive data about ALL major wars involving ${query} throughout history.

For EACH war, provide:
1. Complete war details (name, dates, description)
2. ALL countries involved with EXACT coordinates (latitude, longitude)
3. Each country's role: "aggressor", "defender", "ally", or "axis"
4. Realistic casualty figures (military, civilian, total)
5. Economic impact in billions USD (adjusted for inflation to 2024 values)
6. Military strengths and budgets for EACH country

Focus on major conflicts: World Wars, regional wars, colonial wars, civil wars with international involvement.

Return 10-20 major historical conflicts involving ${query}.`
        : `You are a military historian. Search for detailed historical information about: "${query}"

Provide comprehensive data including:
1. Full war name, dates, and description
2. ALL participating countries with exact coordinates
3. Clear identification of aggressors vs defenders
4. Detailed casualty data (military and civilian)
5. Economic impact in billions USD (2024 values)
6. Military data for each country involved
7. Outcome and consequences

Be specific and historically accurate.`;

      const result = await base44.integrations.Core.InvokeLLM({
        prompt,
        response_json_schema: {
          type: "object",
          properties: {
            wars: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  name: { type: "string" },
                  start_date: { type: "string" },
                  end_date: { type: "string" },
                  description: { type: "string" },
                  type: { type: "string" },
                  status: { type: "string" },
                  era: { type: "string" },
                  economic_impact: { type: "number" },
                  casualties: {
                    type: "object",
                    properties: {
                      military: { type: "number" },
                      civilian: { type: "number" },
                      total: { type: "number" }
                    }
                  },
                  countries_involved: { type: "array", items: { type: "string" } },
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
                      required: ["country_name", "latitude", "longitude", "side"]
                    }
                  }
                },
                required: ["name", "start_date", "description", "countries_data", "economic_impact"]
              }
            }
          }
        },
        add_context_from_internet: true
      });

      // Insert wars into database
      if (result.wars && result.wars.length > 0) {
        for (const war of result.wars) {
          await base44.entities.War.create({
            ...war,
            era: 'past',
            status: 'ended'
          });
        }
      }

      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['wars', 'past'] });
    }
  });

  const handleSearch = () => {
    if (searchTerm.trim()) {
      generateHistoricalDataMutation.mutate({ 
        type: searchType, 
        query: searchTerm 
      });
    }
  };

  const generateCenturyDataMutation = useMutation({
    mutationFn: async (century) => {
      const centuryRanges = {
        'ancient-3000bc': { start: -3000, end: -2000, label: '30th-21st Century BC', period: 'Ancient Mesopotamia, Early Egypt' },
        'ancient-2000bc': { start: -2000, end: -1000, label: '20th-11th Century BC', period: 'Bronze Age, Egyptian Empire' },
        'ancient-1000bc': { start: -1000, end: -1, label: '10th-1st Century BC', period: 'Iron Age, Classical Antiquity' },
        '1-5': { start: 1, end: 500, label: '1st-5th Century AD', period: 'Roman Empire, Fall of Rome' },
        '6-10': { start: 501, end: 1000, label: '6th-10th Century', period: 'Early Middle Ages, Viking Age' },
        '11-15': { start: 1001, end: 1500, label: '11th-15th Century', period: 'High/Late Middle Ages, Crusades' },
        '16': { start: 1501, end: 1600, label: '16th Century', period: 'Early Modern, Spanish Empire' },
        '17': { start: 1601, end: 1700, label: '17th Century', period: 'Age of Enlightenment begins' },
        '18': { start: 1701, end: 1800, label: '18th Century', period: 'Age of Revolutions' },
        '19': { start: 1801, end: 1900, label: '19th Century', period: 'Industrial Age, Colonialism' },
        '20': { start: 1901, end: 2000, label: '20th Century', period: 'World Wars, Cold War' },
        '21': { start: 2001, end: 2024, label: '21st Century', period: 'Modern Era' }
      };

      const range = centuryRanges[century];
      if (!range) return { wars: [] };

      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `You are a military historian specializing in ${range.label} (${range.period}).

Generate comprehensive data for ALL major wars and conflicts from ${range.start} to ${range.end}.

Include:
- Wars between empires/kingdoms/states
- Civil wars and rebellions
- Colonial conflicts
- Religious wars
- Territorial disputes

For EACH war provide:
1. Complete name, precise dates, detailed description (200+ chars)
2. ALL participating nations/empires/kingdoms with EXACT coordinates of capitals/major cities
3. Each entity's role: aggressor, defender, ally, axis
4. Realistic casualty estimates:
   - Military deaths
   - Civilian deaths (including massacres, sieges)
   - Total casualties
5. Economic impact (in billions 2024 USD, inflation-adjusted)
6. Military data per nation:
   - Army size at peak
   - Military expenditure
   - Casualties
7. War type: territorial, civil, religious, economic, colonial, dynastic
8. Outcome and consequences

Be historically accurate. Include lesser-known but significant conflicts.
Return 15-30 major wars from this period with complete data.`,
        response_json_schema: {
          type: "object",
          properties: {
            wars: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  name: { type: "string" },
                  start_date: { type: "string" },
                  end_date: { type: "string" },
                  description: { type: "string" },
                  type: { type: "string" },
                  status: { type: "string" },
                  era: { type: "string" },
                  economic_impact: { type: "number" },
                  outcome: { type: "string" },
                  consequences: { type: "string" },
                  casualties: {
                    type: "object",
                    properties: {
                      military: { type: "number" },
                      civilian: { type: "number" },
                      total: { type: "number" }
                    }
                  },
                  countries_involved: { type: "array", items: { type: "string" } },
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
                      required: ["country_name", "latitude", "longitude", "side"]
                    }
                  }
                },
                required: ["name", "start_date", "description", "countries_data", "casualties"]
              }
            }
          }
        },
        add_context_from_internet: true
      });

      // Insert wars
      if (result.wars && result.wars.length > 0) {
        for (const war of result.wars) {
          await base44.entities.War.create({
            ...war,
            era: 'past',
            status: 'ended'
          });
        }
      }

      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['wars', 'past'] });
    }
  });

  const filteredWars = wars.filter(war => {
    // Century filter
    if (selectedCentury !== 'all') {
      const startYear = war.start_date ? parseInt(war.start_date.match(/-?\d+/)?.[0] || '0') : 0;
      const ranges = {
        'ancient-3000bc': [-3000, -2000],
        'ancient-2000bc': [-2000, -1000],
        'ancient-1000bc': [-1000, -1],
        '1-5': [1, 500],
        '6-10': [501, 1000],
        '11-15': [1001, 1500],
        '16': [1501, 1600],
        '17': [1601, 1700],
        '18': [1701, 1800],
        '19': [1801, 1900],
        '20': [1901, 2000],
        '21': [2001, 2024]
      };
      const range = ranges[selectedCentury];
      if (range && (startYear < range[0] || startYear > range[1])) {
        return false;
      }
    }

    // Search filter
    const searchLower = searchTerm.toLowerCase();
    if (searchType === 'war') {
      return war.name?.toLowerCase().includes(searchLower) ||
             war.description?.toLowerCase().includes(searchLower);
    } else {
      return war.countries_involved?.some(c => c.toLowerCase().includes(searchLower)) ||
             war.countries_data?.some(c => c.country_name?.toLowerCase().includes(searchLower));
    }
  });

  const openDebriefing = (war) => {
    setSelectedWar(war);
    setShowDebriefing(true);
  };

  const getAggressors = (war) => {
    return war.countries_data?.filter(c => c.side === 'aggressor') || [];
  };

  const getDefenders = (war) => {
    return war.countries_data?.filter(c => c.side === 'defender') || [];
  };

  return (
    <div className="relative min-h-screen">
      <MatrixBackground />
      
      <div className="relative z-10 p-8">
        <div className="max-w-7xl mx-auto space-y-6">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-orange-400 glow-text font-mono mb-2">
              HISTORICAL WARS DATABASE
            </h1>
            <p className="text-cyan-400/70 font-mono text-sm">
              Comprehensive Archive of Historical Conflicts • 5000+ Years of Military History
            </p>
            {selectedWars.length > 0 && (
              <div className="mt-3">
                <Badge className="bg-purple-500/20 text-purple-400 border-purple-500/30 font-mono">
                  {selectedWars.length} wars selected for comparison
                </Badge>
              </div>
            )}
          </div>

          {wars.length > 0 && (
            <div className="flex items-center justify-end gap-3">
              <Button
                onClick={() => generateComprehensiveHistoricalDataMutation.mutate()}
                disabled={generateComprehensiveHistoricalDataMutation.isPending}
                className="bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-400 border border-cyan-500/30 font-mono"
              >
                <RefreshCw className={`w-4 h-4 mr-2 ${generateComprehensiveHistoricalDataMutation.isPending ? 'animate-spin' : ''}`} />
                RELOAD DATABASE
              </Button>
              {selectedWars.length >= 2 && (
                <Button
                  onClick={() => setShowComparison(!showComparison)}
                  className="bg-purple-500/20 hover:bg-purple-500/30 text-purple-400 border border-purple-500/30 font-mono"
                >
                  {showComparison ? 'HIDE' : 'COMPARE'} ({selectedWars.length})
                </Button>
              )}
              {selectedWars.length > 0 && (
                <Button
                  onClick={() => setSelectedWars([])}
                  variant="outline"
                  className="border-red-500/30 text-red-400 hover:bg-red-900/20 font-mono"
                >
                  CLEAR SELECTION
                </Button>
              )}
            </div>
          )}

          {/* Enhanced Search with Century Selector */}
          <Card className="bg-slate-950/80 backdrop-blur-xl cyber-border p-4">
            <div className="flex gap-3 mb-3">
              <Select value={selectedCentury} onValueChange={setSelectedCentury}>
                <SelectTrigger className="w-[200px] bg-slate-900/50 border-purple-500/30 text-purple-400 font-mono">
                  <SelectValue placeholder="Select Century" />
                </SelectTrigger>
                <SelectContent className="max-h-[400px]">
                  <SelectItem value="all">All Centuries</SelectItem>
                  <SelectItem value="ancient-3000bc">30th-21st Century BC</SelectItem>
                  <SelectItem value="ancient-2000bc">20th-11th Century BC</SelectItem>
                  <SelectItem value="ancient-1000bc">10th-1st Century BC</SelectItem>
                  <SelectItem value="1-5">1st-5th Century AD</SelectItem>
                  <SelectItem value="6-10">6th-10th Century</SelectItem>
                  <SelectItem value="11-15">11th-15th Century</SelectItem>
                  <SelectItem value="16">16th Century</SelectItem>
                  <SelectItem value="17">17th Century</SelectItem>
                  <SelectItem value="18">18th Century</SelectItem>
                  <SelectItem value="19">19th Century</SelectItem>
                  <SelectItem value="20">20th Century</SelectItem>
                  <SelectItem value="21">21st Century</SelectItem>
                </SelectContent>
              </Select>

              {selectedCentury !== 'all' && wars.filter(w => {
                const startYear = w.start_date ? parseInt(w.start_date.match(/-?\d+/)?.[0] || '0') : 0;
                const ranges = {
                  'ancient-3000bc': [-3000, -2000],
                  'ancient-2000bc': [-2000, -1000],
                  'ancient-1000bc': [-1000, -1],
                  '1-5': [1, 500],
                  '6-10': [501, 1000],
                  '11-15': [1001, 1500],
                  '16': [1501, 1600],
                  '17': [1601, 1700],
                  '18': [1701, 1800],
                  '19': [1801, 1900],
                  '20': [1901, 2000],
                  '21': [2001, 2024]
                };
                const range = ranges[selectedCentury];
                return range && startYear >= range[0] && startYear <= range[1];
              }).length === 0 && (
                <Button
                  onClick={() => generateCenturyDataMutation.mutate(selectedCentury)}
                  disabled={generateCenturyDataMutation.isPending}
                  className="bg-purple-500/20 hover:bg-purple-500/30 text-purple-400 border border-purple-500/30 font-mono"
                >
                  {generateCenturyDataMutation.isPending ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      LOADING...
                    </>
                  ) : (
                    <>
                      <Database className="w-4 h-4 mr-2" />
                      LOAD CENTURY
                    </>
                  )}
                </Button>
              )}
            </div>

            <div className="flex gap-3">
              <Select value={searchType} onValueChange={setSearchType}>
                <SelectTrigger className="w-[180px] bg-slate-900/50 border-cyan-500/30 text-cyan-400 font-mono">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="war">Search by War</SelectItem>
                  <SelectItem value="country">Search by Country</SelectItem>
                </SelectContent>
              </Select>
              
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input
                  type="text"
                  placeholder={searchType === 'war' ? "Search wars (e.g., World War II)..." : "Search by country (e.g., France)..."}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                  className="pl-10 bg-slate-900/50 border-green-500/30 text-green-400 placeholder:text-slate-500 font-mono"
                />
              </div>
              
              <Button
                onClick={handleSearch}
                disabled={!searchTerm.trim() || generateHistoricalDataMutation.isPending}
                className="bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white font-mono px-6"
              >
                {generateHistoricalDataMutation.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    SEARCHING...
                  </>
                ) : (
                  <>
                    <Database className="w-4 h-4 mr-2" />
                    SEARCH HISTORY
                  </>
                )}
              </Button>
            </div>
            
            {generateComprehensiveHistoricalDataMutation.isPending && (
              <div className="mt-4 p-3 bg-blue-950/20 cyber-border rounded-lg">
                <div className="flex items-start gap-2">
                  <Loader2 className="w-4 h-4 text-blue-400 mt-0.5 animate-spin" />
                  <div>
                    <p className="text-blue-400 font-mono text-sm font-bold mb-1">
                      Loading comprehensive historical database...
                    </p>
                    <p className="text-slate-400 font-mono text-xs">
                      Fetching 100+ major historical conflicts with detailed data. This may take a moment.
                    </p>
                  </div>
                </div>
              </div>
            )}
            {wars.length === 0 && !generateComprehensiveHistoricalDataMutation.isPending && (
              <div className="mt-4 p-3 bg-yellow-950/20 cyber-border rounded-lg">
                <div className="flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 text-yellow-400 mt-0.5" />
                  <div>
                    <p className="text-yellow-400 font-mono text-sm font-bold mb-1">
                      No historical data loaded
                    </p>
                    <p className="text-slate-400 font-mono text-xs">
                      Search for a specific war or country to load historical conflict data from our AI-powered archive
                    </p>
                  </div>
                </div>
              </div>
            )}
          </Card>

          {/* Results Summary */}
          {filteredWars.length > 0 && (
            <Card className="bg-slate-950/80 backdrop-blur-xl cyber-border p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 bg-blue-400 rounded-full animate-pulse"></div>
                  <span className="text-blue-400 font-bold font-mono text-sm">
                    {filteredWars.length} {filteredWars.length === 1 ? 'CONFLICT' : 'CONFLICTS'} FOUND
                  </span>
                </div>
                <Badge className="bg-cyan-500/20 text-cyan-400 border-cyan-500/30 font-mono">
                  Database: {wars.length} total records
                </Badge>
              </div>
            </Card>
          )}

          {/* Map */}
          {filteredWars.length > 0 && (
            <Card className="bg-slate-950/80 backdrop-blur-xl cyber-border overflow-hidden">
              <div className="p-4 border-b border-blue-900/30">
                <h2 className="text-xl font-bold text-blue-400 glow-text font-mono">
                  HISTORICAL THEATER MAP
                </h2>
                <p className="text-slate-400 text-sm font-mono mt-1">
                  {filteredWars.length} conflicts mapped • Click markers for details
                </p>
              </div>
              <div className="h-[500px]">
                {isLoading || generateHistoricalDataMutation.isPending || generateComprehensiveHistoricalDataMutation.isPending ? (
                  <div className="flex items-center justify-center h-full">
                    <div className="text-center space-y-3">
                      <Loader2 className="w-12 h-12 text-blue-400 animate-spin mx-auto" />
                      <div className="text-blue-400 font-mono">
                        {generateComprehensiveHistoricalDataMutation.isPending 
                          ? 'BUILDING HISTORICAL DATABASE...' 
                          : 'LOADING ARCHIVE...'}
                      </div>
                      {generateComprehensiveHistoricalDataMutation.isPending && (
                        <div className="text-slate-400 font-mono text-xs">
                          Fetching 100+ conflicts • This may take 30-60 seconds
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <InteractiveWarMap wars={filteredWars} showConnections={false} />
                )}
              </div>
            </Card>
          )}

          {/* Timeline */}
          {filteredWars.length > 0 && (
            <Card className="bg-slate-950/80 backdrop-blur-xl cyber-border p-6">
              <h2 className="text-xl font-bold text-blue-400 glow-text font-mono mb-4">
                CONFLICT TIMELINE
              </h2>
              <div className="space-y-4">
                {filteredWars.map((war, idx) => {
                  const aggressors = getAggressors(war);
                  const defenders = getDefenders(war);
                  
                  return (
                    <div 
                      key={idx} 
                      className={`bg-slate-900/50 cyber-border rounded-lg p-4 transition-all ${
                        selectedWars.find(w => w.id === war.id) 
                          ? 'ring-2 ring-purple-500/50 bg-purple-900/20' 
                          : 'hover-glow'
                      }`}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center gap-3 flex-1">
                          <input
                            type="checkbox"
                            checked={!!selectedWars.find(w => w.id === war.id)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedWars([...selectedWars, war]);
                              } else {
                                setSelectedWars(selectedWars.filter(w => w.id !== war.id));
                              }
                            }}
                            className="w-4 h-4 rounded border-purple-500/30 bg-slate-900 text-purple-500 focus:ring-purple-500"
                          />
                          <h3 className="text-lg font-bold text-cyan-400 font-mono">{war.name}</h3>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30 font-mono">
                            ENDED
                          </Badge>
                          <Button
                            size="sm"
                            onClick={() => openDebriefing(war)}
                            className="bg-purple-500/20 hover:bg-purple-500/30 text-purple-400 border border-purple-500/30 font-mono"
                          >
                            <FileText className="w-4 h-4 mr-2" />
                            DEBRIEFING
                          </Button>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-4 text-sm font-mono text-slate-400 mb-3">
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4" />
                          <span>{war.start_date} - {war.end_date || 'Unknown'}</span>
                        </div>
                        {war.type && (
                          <Badge variant="outline" className="border-purple-500/30 text-purple-400 text-xs">
                            {war.type}
                          </Badge>
                        )}
                      </div>

                      <p className="text-slate-400 text-sm font-mono mb-3">{war.description}</p>
                      
                      {/* Aggressors vs Defenders */}
                      {(aggressors.length > 0 || defenders.length > 0) && (
                        <div className="grid md:grid-cols-2 gap-4 mb-3 p-3 bg-slate-950/50 cyber-border rounded">
                          <div>
                            <h4 className="text-xs font-bold text-red-400 font-mono mb-2 flex items-center gap-2">
                              <AlertTriangle className="w-3 h-3" />
                              AGGRESSORS
                            </h4>
                            <div className="flex flex-wrap gap-1">
                              {aggressors.map((country, i) => (
                                <Badge key={i} className="bg-red-500/20 text-red-400 border-red-500/30 font-mono text-xs">
                                  {country.country_name}
                                </Badge>
                              ))}
                              {aggressors.length === 0 && (
                                <span className="text-slate-500 text-xs font-mono">Not specified</span>
                              )}
                            </div>
                          </div>
                          
                          <div>
                            <h4 className="text-xs font-bold text-green-400 font-mono mb-2 flex items-center gap-2">
                              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                              </svg>
                              DEFENDERS
                            </h4>
                            <div className="flex flex-wrap gap-1">
                              {defenders.map((country, i) => (
                                <Badge key={i} className="bg-green-500/20 text-green-400 border-green-500/30 font-mono text-xs">
                                  {country.country_name}
                                </Badge>
                              ))}
                              {defenders.length === 0 && (
                                <span className="text-slate-500 text-xs font-mono">Not specified</span>
                              )}
                            </div>
                          </div>
                        </div>
                      )}
                      
                      {/* All Participants */}
                      {war.countries_involved && war.countries_involved.length > 0 && (
                        <div className="mb-3">
                          <h4 className="text-xs font-bold text-cyan-400 font-mono mb-2">ALL PARTICIPANTS</h4>
                          <div className="flex flex-wrap gap-2">
                            {war.countries_involved.map((country, i) => (
                              <Badge key={i} variant="outline" className="border-cyan-500/30 text-cyan-400 font-mono text-xs">
                                {country}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}
                      
                      {/* Stats Grid */}
                      <div className="grid md:grid-cols-2 gap-3 text-sm font-mono">
                        {war.casualties && (
                          <div className="p-2 bg-red-950/20 cyber-border rounded">
                            <span className="text-red-400 font-bold">Total Casualties: </span>
                            <span className="text-slate-300">{war.casualties.total?.toLocaleString() || 'Unknown'}</span>
                          </div>
                        )}
                        
                        <div className="p-2 bg-orange-950/20 cyber-border rounded">
                          <span className="text-orange-400 font-bold">Economic Impact: </span>
                          {war.economic_impact && war.economic_impact > 0 ? (
                            <span className="text-slate-300">${war.economic_impact.toLocaleString()}B USD</span>
                          ) : (
                            <span className="text-slate-500 text-xs italic">Data unavailable or not estimated</span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </Card>
          )}
        </div>
      </div>

      {/* War Debriefing Dialog */}
      <Dialog open={showDebriefing} onOpenChange={setShowDebriefing}>
        <DialogContent className="p-0 bg-transparent border-none max-w-6xl">
          {selectedWar && (
            <WarDebriefing 
              war={selectedWar} 
              onClose={() => setShowDebriefing(false)} 
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Comparative Analysis */}
      {showComparison && selectedWars.length >= 2 && (
        <ComparativeWarAnalysis selectedWars={selectedWars} />
      )}
    </div>
  );
}