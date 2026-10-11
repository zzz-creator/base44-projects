import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { base44 } from '../api/base44Client';
import { calculateKPIs } from '../components/turnEngine';
import { createPageUrl } from '../utils';
import KPIPanel from '../components/dashboard/KPIPanel';
import EventStream from '../components/dashboard/EventStream';
import TurnController from '../components/dashboard/TurnController';
import { Coins, Ship, Globe, TrendingUp, AlertTriangle, Package } from 'lucide-react';

export default function Dashboard() {
  const [kpis, setKpis] = useState(null);

  const { data: events = [], refetch: refetchEvents } = useQuery({
    queryKey: ['events'],
    queryFn: () => base44.entities.EventLog.list('-created_date', 50),
    refetchInterval: 3000
  });

  const loadKPIs = async () => {
    const data = await calculateKPIs();
    setKpis(data);
  };

  useEffect(() => {
    loadKPIs();
    const interval = setInterval(loadKPIs, 5000);
    return () => clearInterval(interval);
  }, []);

  const handleTurnComplete = () => {
    loadKPIs();
    refetchEvents();
  };

  if (!kpis) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="text-white text-xl">Loading Command Console...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900 p-6">
      <div className="max-w-[1800px] mx-auto space-y-6">
        {/* Header */}
        <div className="border-b border-slate-700 pb-4">
          <h1 className="text-4xl font-bold text-white bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
            🎮 Space Logistics Command Console
          </h1>
          <p className="text-slate-400 mt-2">Enterprise Colony Management & Strategic Operations</p>
        </div>

        {/* Turn Controller */}
        <TurnController onTurnComplete={handleTurnComplete} />

        {/* KPI Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          <KPIPanel
            title="Total Credits"
            value={kpis.totalCredits.toLocaleString()}
            subtitle="All Factions"
            icon={Coins}
            bgColor="bg-yellow-500"
          />
          <KPIPanel
            title="Fleet Utilization"
            value={`${kpis.fleetUtilization}%`}
            subtitle={`${kpis.totalShips} ships`}
            icon={Ship}
            bgColor="bg-blue-500"
          />
          <KPIPanel
            title="Colony Sustainability"
            value={`${kpis.colonySustainability}%`}
            subtitle={`${kpis.totalColonies} colonies`}
            icon={Globe}
            bgColor="bg-green-500"
          />
          <KPIPanel
            title="Logistics Efficiency"
            value={`${kpis.logisticsEfficiency}%`}
            subtitle={`${kpis.activeRoutes} active routes`}
            icon={TrendingUp}
            bgColor="bg-purple-500"
          />
          <KPIPanel
            title="Active Threats"
            value={kpis.activeThreats}
            subtitle={`Avg severity: ${kpis.avgThreatLevel}`}
            icon={AlertTriangle}
            bgColor="bg-red-500"
          />
          <KPIPanel
            title="Total Resources"
            value={kpis.totalResources.toLocaleString()}
            subtitle="System-wide inventory"
            icon={Package}
            bgColor="bg-cyan-500"
          />
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <EventStream events={events} maxHeight="600px" />
          </div>
          <div className="space-y-6">
          {/* Quick Actions */}
          <div className="bg-slate-800 border border-slate-700 rounded-lg p-6">
            <h3 className="text-white font-bold mb-4">⚡ Quick Actions</h3>
            <div className="space-y-2">
              <Link to={createPageUrl('Colonies')} className="block w-full text-left px-4 py-2 bg-slate-700 hover:bg-blue-600 rounded text-white text-sm transition-colors">
                🌍 Manage Colonies
              </Link>
              <Link to={createPageUrl('Fleet')} className="block w-full text-left px-4 py-2 bg-slate-700 hover:bg-blue-600 rounded text-white text-sm transition-colors">
                🚀 Fleet Overview
              </Link>
              <Link to={createPageUrl('TradeRoutes')} className="block w-full text-left px-4 py-2 bg-slate-700 hover:bg-blue-600 rounded text-white text-sm transition-colors">
                📦 Trade Routes
              </Link>
              <Link to={createPageUrl('Threats')} className="block w-full text-left px-4 py-2 bg-slate-700 hover:bg-blue-600 rounded text-white text-sm transition-colors">
                ⚠️ Threat Analysis
              </Link>
            </div>
          </div>
          </div>
        </div>
      </div>
    </div>
  );
}