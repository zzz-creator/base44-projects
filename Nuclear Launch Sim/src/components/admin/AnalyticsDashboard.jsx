import * as React from 'react';
const { useState, useEffect, useMemo } = React;
import { dataProvider as base44 } from '../../components/data/DataProvider';
import { 
  BarChart3, TrendingUp, TrendingDown, Target, AlertTriangle,
  Clock, CheckCircle, Filter, RefreshCw, Calendar, Award
} from 'lucide-react';
// @ts-ignore
import { BarChart, Bar, PieChart as RechartsPie, Pie, Cell,
  XAxis, YAxis, Tooltip, ResponsiveContainer, Area, AreaChart
} from 'recharts';
// import { motion } from 'framer-motion';

const COLORS = ['#22c55e', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4'];

const DIFFICULTY_COLORS = {
  easy: '#22c55e',
  medium: '#f59e0b', 
  hard: '#f97316',
  extreme: '#ef4444'
};

export default function AnalyticsDashboard({ onClose = () => {}, addLog }) {
  const [performances, setPerformances] = useState([]);
  const [scenarios, setScenarios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('all'); // 'week', 'month', 'all'
  const [difficultyFilter, setDifficultyFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [perfData, scenarioData] = await Promise.all([
        base44.entities.MissionPerformance.list('-created_date', 500),
        base44.entities.MissionScenario.list('-created_date', 100)
      ]);
      setPerformances(perfData);
      setScenarios(scenarioData);
    } catch (err) {
      console.error('Failed to load analytics:', err);
    } finally {
      setLoading(false);
    }
  };

  // Filter data based on selections
  const filteredPerformances = useMemo(() => {
    let filtered = [...performances];
    
    // Time filter
    if (timeRange !== 'all') {
      const now = new Date();
      const cutoff = new Date();
      if (timeRange === 'week') cutoff.setDate(now.getDate() - 7);
      else if (timeRange === 'month') cutoff.setMonth(now.getMonth() - 1);
      filtered = filtered.filter(p => new Date(p.created_date) >= cutoff);
    }
    
    // Difficulty filter
    if (difficultyFilter !== 'all') {
      filtered = filtered.filter(p => p.difficulty === difficultyFilter);
    }
    
    // Category filter
    if (categoryFilter !== 'all') {
      filtered = filtered.filter(p => p.category === categoryFilter);
    }
    
    return filtered;
  }, [performances, timeRange, difficultyFilter, categoryFilter]);

  // Calculate metrics
  const metrics = useMemo(() => {
    if (filteredPerformances.length === 0) {
      return {
        totalMissions: 0,
        completionRate: 0,
        avgScore: 0,
        avgTime: 0,
        totalErrors: 0,
        trend: 0
      };
    }

    const completed = filteredPerformances.filter(p => p.completionStatus === 'completed').length;
    const totalScores = filteredPerformances.reduce((sum, p) => sum + (p.score || 0), 0);
    const totalTime = filteredPerformances.reduce((sum, p) => sum + (p.completionTime || 0), 0);
    const totalErrors = filteredPerformances.reduce((sum, p) => sum + (p.errorCount || 0), 0);

    // Calculate trend (compare recent half to older half)
    const midpoint = Math.floor(filteredPerformances.length / 2);
    const recentHalf = filteredPerformances.slice(0, midpoint);
    const olderHalf = filteredPerformances.slice(midpoint);
    
    const recentAvg = recentHalf.length > 0 
      ? recentHalf.reduce((sum, p) => sum + (p.score || 0), 0) / recentHalf.length 
      : 0;
    const olderAvg = olderHalf.length > 0 
      ? olderHalf.reduce((sum, p) => sum + (p.score || 0), 0) / olderHalf.length 
      : 0;
    
    const trend = olderAvg > 0 ? ((recentAvg - olderAvg) / olderAvg) * 100 : 0;

    return {
      totalMissions: filteredPerformances.length,
      completionRate: Math.round((completed / filteredPerformances.length) * 100),
      avgScore: Math.round(totalScores / filteredPerformances.length),
      avgTime: Math.round(totalTime / filteredPerformances.length / 1000),
      totalErrors,
      trend: Math.round(trend)
    };
  }, [filteredPerformances]);

  // Completion status distribution
  const statusDistribution = useMemo(() => {
    const counts = { completed: 0, aborted: 0, failed: 0, timeout: 0 };
    filteredPerformances.forEach(p => {
      if (counts[p.completionStatus] !== undefined) {
        counts[p.completionStatus]++;
      }
    });
    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  }, [filteredPerformances]);

  // Difficulty distribution
  const difficultyDistribution = useMemo(() => {
    const counts = { easy: 0, medium: 0, hard: 0, extreme: 0 };
    filteredPerformances.forEach(p => {
      if (counts[p.difficulty] !== undefined) {
        counts[p.difficulty]++;
      }
    });
    return Object.entries(counts).map(([name, value]) => ({ 
      name, 
      value,
      fill: DIFFICULTY_COLORS[name]
    }));
  }, [filteredPerformances]);

  // Performance over time
  const performanceOverTime = useMemo(() => {
    const grouped = {};
    filteredPerformances.forEach(p => {
      const date = new Date(p.created_date).toLocaleDateString();
      if (!grouped[date]) {
        grouped[date] = { date, scores: [], count: 0 };
      }
      grouped[date].scores.push(p.score || 0);
      grouped[date].count++;
    });
    
    return Object.values(grouped)
      .map(g => ({
        date: g.date,
        avgScore: Math.round(g.scores.reduce((a, b) => a + b, 0) / g.scores.length),
        missions: g.count
      }))
      .slice(-14); // Last 14 days
  }, [filteredPerformances]);

  // Common failure points
  const failurePoints = useMemo(() => {
    const points = {};
    filteredPerformances.forEach(p => {
      (p.failurePoints || []).forEach(fp => {
        points[fp] = (points[fp] || 0) + 1;
      });
    });
    return Object.entries(points)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 8);
  }, [filteredPerformances]);

  // Score by difficulty
  const scoreByDifficulty = useMemo(() => {
    const grouped = { easy: [], medium: [], hard: [], extreme: [] };
    filteredPerformances.forEach(p => {
      if (grouped[p.difficulty]) {
        grouped[p.difficulty].push(p.score || 0);
      }
    });
    return Object.entries(grouped).map(([difficulty, scores]) => ({
      difficulty,
      avgScore: scores.length > 0 ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0,
      count: scores.length
    }));
  }, [filteredPerformances]);

  // Top scenarios
  const topScenarios = useMemo(() => {
    const grouped = {};
    filteredPerformances.forEach(p => {
      const name = p.scenarioName || 'Unknown';
      if (!grouped[name]) {
        grouped[name] = { name, plays: 0, totalScore: 0, completed: 0 };
      }
      grouped[name].plays++;
      grouped[name].totalScore += p.score || 0;
      if (p.completionStatus === 'completed') grouped[name].completed++;
    });
    
    return Object.values(grouped)
      .map(g => ({
        ...g,
        avgScore: Math.round(g.totalScore / g.plays),
        completionRate: Math.round((g.completed / g.plays) * 100)
      }))
      .sort((a, b) => b.plays - a.plays)
      .slice(0, 5);
  }, [filteredPerformances]);

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        {/* @ts-ignore */}
        <RefreshCw className="w-6 h-6 text-blue-400 animate-spin" />
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-[#0a0a0f]">
      {/* Header */}
      <div className="px-4 py-3 bg-[#1a1a2e] border-b border-[#2a2a3e] flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-3">
          {/* @ts-ignore */}
          <BarChart3 className="w-5 h-5 text-blue-400" />
          <h2 className="text-sm font-bold text-gray-200">Mission Analytics</h2>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={loadData}
            className="p-1.5 hover:bg-[#252540] rounded text-gray-400"
            title="Refresh"
          >
            {/* @ts-ignore */}
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="px-4 py-2 bg-[#12121a] border-b border-[#2a2a3e] flex flex-wrap items-center gap-3 flex-shrink-0">
        <div className="flex items-center gap-1">
          {/* @ts-ignore */}
          <Calendar className="w-3 h-3 text-gray-500" />
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
            className="bg-[#1a1a2e] border border-[#2a2a3e] rounded px-2 py-1 text-xs text-gray-300"
          >
            <option value="all">All Time</option>
            <option value="month">Last Month</option>
            <option value="week">Last Week</option>
          </select>
        </div>
        
        <div className="flex items-center gap-1">
          {/* @ts-ignore */}
          <Filter className="w-3 h-3 text-gray-500" />
          <select
            value={difficultyFilter}
            onChange={(e) => setDifficultyFilter(e.target.value)}
            className="bg-[#1a1a2e] border border-[#2a2a3e] rounded px-2 py-1 text-xs text-gray-300"
          >
            <option value="all">All Difficulties</option>
            <option value="easy">Easy</option>
            <option value="medium">Medium</option>
            <option value="hard">Hard</option>
            <option value="extreme">Extreme</option>
          </select>
        </div>
        
        <div className="flex items-center gap-1">
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="bg-[#1a1a2e] border border-[#2a2a3e] rounded px-2 py-1 text-xs text-gray-300"
          >
            <option value="all">All Categories</option>
            <option value="training">Training</option>
            <option value="assessment">Assessment</option>
            <option value="emergency">Emergency</option>
            <option value="custom">Custom</option>
          </select>
        </div>

        <span className="text-xs text-gray-500 ml-auto">
          {filteredPerformances.length} missions
        </span>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Key Metrics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <MetricCard
            icon={Target}
            label="Total Missions"
            value={metrics.totalMissions}
            color="blue"
          />
          <MetricCard
            icon={CheckCircle}
            label="Completion Rate"
            value={`${metrics.completionRate}%`}
            color="green"
          />
          <MetricCard
            icon={Award}
            label="Avg Score"
            value={metrics.avgScore}
            trend={metrics.trend}
            color="amber"
          />
          <MetricCard
            icon={Clock}
            label="Avg Time"
            value={`${Math.floor(metrics.avgTime / 60)}:${String(metrics.avgTime % 60).padStart(2, '0')}`}
            color="purple"
          />
        </div>

        {/* Charts Row 1 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Performance Over Time */}
          <div className="bg-[#12121a] border border-[#2a2a3e] rounded-lg p-4">
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">
              Performance Trend
            </h3>
            <div className="h-48">
              {/* @ts-ignore */}
              <ResponsiveContainer width="100%" height="100%">
                {/* @ts-ignore */}
                <AreaChart data={performanceOverTime}>
                  <defs>
                    <linearGradient id="scoreGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#6b7280' }} />
                  <YAxis tick={{ fontSize: 10, fill: '#6b7280' }} domain={[0, 100]} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#1a1a2e',
                      border: '1px solid #2a2a3e',
                      borderRadius: '4px',
                      fontSize: '11px'
                    }}
                  />
                  {/* @ts-ignore */}
                  <Area
                    type="monotone"
                    dataKey="avgScore"
                    stroke="#3b82f6"
                    fill="url(#scoreGradient)"
                    strokeWidth={2}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Completion Status */}
          <div className="bg-[#12121a] border border-[#2a2a3e] rounded-lg p-4">
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">
              Mission Outcomes
            </h3>
            <div className="h-48 flex items-center">
              {/* @ts-ignore */}
              <ResponsiveContainer width="100%" height="100%">
                {/* @ts-ignore */}
                <RechartsPie>
                  {/* @ts-ignore */}
                  <Pie
                    data={statusDistribution}
                    cx="50%"
                    cy="50%"
                    innerRadius={40}
                    outerRadius={70}
                    dataKey="value"
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    labelLine={false}
                  >
                    {statusDistribution.map((entry, index) => (
                      /* @ts-ignore */
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#1a1a2e',
                      border: '1px solid #2a2a3e',
                      borderRadius: '4px',
                      fontSize: '11px'
                    }}
                  />
                </RechartsPie>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Charts Row 2 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Score by Difficulty */}
          <div className="bg-[#12121a] border border-[#2a2a3e] rounded-lg p-4">
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">
              Score by Difficulty
            </h3>
            <div className="h-40">
              {/* @ts-ignore */}
              <ResponsiveContainer width="100%" height="100%">
                {/* @ts-ignore */}
                <BarChart data={scoreByDifficulty}>
                  <XAxis dataKey="difficulty" tick={{ fontSize: 10, fill: '#6b7280' }} />
                  <YAxis tick={{ fontSize: 10, fill: '#6b7280' }} domain={[0, 100]} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#1a1a2e',
                      border: '1px solid #2a2a3e',
                      borderRadius: '4px',
                      fontSize: '11px'
                    }}
                  />
                  {/* @ts-ignore */}
                  <Bar dataKey="avgScore" radius={[4, 4, 0, 0]}>
                    {scoreByDifficulty.map((entry, index) => (
                      /* @ts-ignore */
                      <Cell key={`cell-${index}`} fill={DIFFICULTY_COLORS[entry.difficulty]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Common Failure Points */}
          <div className="bg-[#12121a] border border-[#2a2a3e] rounded-lg p-4">
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">
              {/* @ts-ignore */}
              <AlertTriangle className="w-3 h-3 inline mr-1 text-red-400" />
              Common Failure Points
            </h3>
            <div className="space-y-2">
              {failurePoints.length === 0 ? (
                <p className="text-xs text-gray-500 text-center py-4">No failure data</p>
              ) : (
                failurePoints.map((fp, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <span className="text-xs text-gray-400 w-24 truncate">{fp.name}</span>
                    <div className="flex-1 h-2 bg-[#1a1a2e] rounded-full overflow-hidden">
                      <div
                        className="h-full bg-red-500 rounded-full"
                        style={{ width: `${(fp.count / failurePoints[0].count) * 100}%` }}
                      />
                    </div>
                    <span className="text-xs text-gray-500 w-8 text-right">{fp.count}</span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Top Scenarios */}
        <div className="bg-[#12121a] border border-[#2a2a3e] rounded-lg p-4">
          <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">
            Top Scenarios
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="text-gray-500 border-b border-[#2a2a3e]">
                  <th className="text-left py-2 font-medium">Scenario</th>
                  <th className="text-center py-2 font-medium">Plays</th>
                  <th className="text-center py-2 font-medium">Avg Score</th>
                  <th className="text-center py-2 font-medium">Completion</th>
                </tr>
              </thead>
              <tbody>
                {topScenarios.map((scenario, idx) => (
                  <tr key={idx} className="border-b border-[#2a2a3e]/50">
                    <td className="py-2 text-gray-300">{scenario.name}</td>
                    <td className="py-2 text-center text-gray-400">{scenario.plays}</td>
                    <td className="py-2 text-center">
                      <span className={`${
                        scenario.avgScore >= 80 ? 'text-green-400' :
                        scenario.avgScore >= 60 ? 'text-amber-400' :
                        'text-red-400'
                      }`}>
                        {scenario.avgScore}%
                      </span>
                    </td>
                    <td className="py-2 text-center">
                      <span className={`${
                        scenario.completionRate >= 80 ? 'text-green-400' :
                        scenario.completionRate >= 50 ? 'text-amber-400' :
                        'text-red-400'
                      }`}>
                        {scenario.completionRate}%
                      </span>
                    </td>
                  </tr>
                ))}
                {topScenarios.length === 0 && (
                  <tr>
                    <td colSpan={4} className="py-4 text-center text-gray-500">
                      No scenario data available
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

function MetricCard({ icon: Icon, label, value, trend = 0, color }) {
  const colorClasses = {
    blue: 'text-blue-400 bg-blue-500/10',
    green: 'text-green-400 bg-green-500/10',
    amber: 'text-amber-400 bg-amber-500/10',
    purple: 'text-purple-400 bg-purple-500/10',
    red: 'text-red-400 bg-red-500/10'
  };

  return (
    <div className="bg-[#12121a] border border-[#2a2a3e] rounded-lg p-3">
      <div className="flex items-center justify-between mb-2">
        <div className={`p-1.5 rounded ${colorClasses[color]}`}>
          {/* @ts-ignore */}
          <Icon className="w-4 h-4" />
        </div>
        {trend !== undefined && trend !== 0 && (
          <div className={`flex items-center gap-0.5 text-xs ${
            trend > 0 ? 'text-green-400' : 'text-red-400'
          }`}>
            {/* @ts-ignore */}
            {trend > 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
            {Math.abs(trend)}%
          </div>
        )}
      </div>
      <div className="text-xl font-bold text-gray-200">{value}</div>
      <div className="text-xs text-gray-500">{label}</div>
    </div>
  );
}