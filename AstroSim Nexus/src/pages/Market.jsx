import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '../api/base44Client';
import { getPolicyModifiers } from '../components/marketEngine';
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import { Badge } from "../components/ui/badge";
import { TrendingUp, TrendingDown, Minus, DollarSign, BarChart3 } from 'lucide-react';
import { toast } from 'sonner';

export default function Market() {
  const queryClient = useQueryClient();
  const [selectedColony, setSelectedColony] = useState(null);

  const { data: marketData = [] } = useQuery({
    queryKey: ['marketData'],
    queryFn: () => base44.entities.MarketData.list()
  });

  const { data: resources = [] } = useQuery({
    queryKey: ['resources'],
    queryFn: () => base44.entities.Resource.list()
  });

  const { data: colonies = [] } = useQuery({
    queryKey: ['colonies'],
    queryFn: () => base44.entities.Colony.list()
  });

  const { data: policies = [] } = useQuery({
    queryKey: ['policies'],
    queryFn: () => base44.entities.EconomicPolicy.list()
  });

  const { data: factions = [] } = useQuery({
    queryKey: ['factions'],
    queryFn: () => base44.entities.Faction.list()
  });

  const createPolicyMutation = useMutation({
    mutationFn: async ({ factionId, policyType }) => {
      const modifiers = getPolicyModifiers(policyType);
      return base44.entities.EconomicPolicy.create({
        faction_id: factionId,
        policy_type: policyType,
        ...modifiers
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['policies']);
      toast.success('📊 Economic policy established!');
    }
  });

  const updatePolicyMutation = useMutation({
    mutationFn: ({ policyId, data }) => base44.entities.EconomicPolicy.update(policyId, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['policies']);
      toast.success('📊 Policy updated!');
    }
  });

  const getTrendIcon = (trend) => {
    if (trend === 'Rising') return <TrendingUp className="w-4 h-4 text-green-400" />;
    if (trend === 'Falling') return <TrendingDown className="w-4 h-4 text-red-400" />;
    return <Minus className="w-4 h-4 text-slate-400" />;
  };

  const getResourceName = (resourceId) => {
    const resource = resources.find(r => r.id === resourceId);
    return resource ? resource.name : 'Unknown';
  };

  const getColonyName = (colonyId) => {
    const colony = colonies.find(c => c.id === colonyId);
    return colony ? colony.name : 'Unknown';
  };

  const getFactionName = (factionId) => {
    const faction = factions.find(f => f.id === factionId);
    return faction ? faction.name : 'Unknown';
  };

  const colonyMarketData = selectedColony 
    ? marketData.filter(md => md.colony_id === selectedColony)
    : [];

  const policyTypes = ['Free Market', 'State Controlled', 'Militarized', 'Mercantile', 'Isolationist'];

  return (
    <div className="min-h-screen bg-slate-900 p-6">
      <div className="max-w-[1800px] mx-auto space-y-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-white">📊 Market Economy</h1>
            <p className="text-slate-400 mt-1">Supply, demand, and economic policy management</p>
          </div>
        </div>

        {/* Economic Policies */}
        <Card className="bg-slate-800 border-slate-700">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <DollarSign className="w-5 h-5" />
              Faction Economic Policies
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {factions.map(faction => {
                const policy = policies.find(p => p.faction_id === faction.id);
                
                return (
                  <div key={faction.id} className="p-4 bg-slate-700 rounded border border-slate-600">
                    <div className="font-bold text-white mb-2">{faction.name}</div>
                    {policy ? (
                      <div className="space-y-2">
                        <Badge className="bg-blue-600">{policy.policy_type}</Badge>
                        <div className="text-xs text-slate-300 space-y-1">
                          <div>Import Tariff: {policy.import_tariff}%</div>
                          <div>Export Tax: {policy.export_tax}%</div>
                          <div>Efficiency: {(policy.production_efficiency_modifier * 100).toFixed(0)}%</div>
                          <div>Inflation: {policy.inflation_rate.toFixed(1)}%</div>
                        </div>
                        <Select 
                          value={policy.policy_type} 
                          onValueChange={(value) => {
                            const modifiers = getPolicyModifiers(value);
                            updatePolicyMutation.mutate({
                              policyId: policy.id,
                              data: { policy_type: value, ...modifiers }
                            });
                          }}
                        >
                          <SelectTrigger className="bg-slate-600 border-slate-500 text-white text-xs">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {policyTypes.map(pt => (
                              <SelectItem key={pt} value={pt}>{pt}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <div className="text-slate-400 text-xs">No policy set</div>
                        <Select onValueChange={(value) => createPolicyMutation.mutate({ factionId: faction.id, policyType: value })}>
                          <SelectTrigger className="bg-slate-600 border-slate-500 text-white text-xs">
                            <SelectValue placeholder="Set policy" />
                          </SelectTrigger>
                          <SelectContent>
                            {policyTypes.map(pt => (
                              <SelectItem key={pt} value={pt}>{pt}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Colony Market Data */}
        <Card className="bg-slate-800 border-slate-700">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <BarChart3 className="w-5 h-5" />
              Market Prices by Colony
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="mb-4">
              <Select value={selectedColony} onValueChange={setSelectedColony}>
                <SelectTrigger className="bg-slate-700 border-slate-600 text-white">
                  <SelectValue placeholder="Select colony" />
                </SelectTrigger>
                <SelectContent>
                  {colonies.length > 0 ? (
                    colonies.map(c => (
                      <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                    ))
                  ) : (
                    <div className="p-2 text-sm text-slate-400">No colonies available</div>
                  )}
                </SelectContent>
              </Select>
            </div>

            {selectedColony && colonyMarketData.length > 0 ? (
              <div className="space-y-2">
                <div className="grid grid-cols-6 gap-2 text-xs text-slate-400 font-bold border-b border-slate-600 pb-2">
                  <div>Resource</div>
                  <div>Supply</div>
                  <div>Demand</div>
                  <div>Price</div>
                  <div>Trend</div>
                  <div>Scarcity</div>
                </div>
                {colonyMarketData.map(md => (
                  <div key={md.id} className="grid grid-cols-6 gap-2 text-sm text-white items-center">
                    <div>{getResourceName(md.resource_id)}</div>
                    <div className={md.local_supply < md.local_demand ? 'text-red-400' : 'text-green-400'}>
                      {Math.floor(md.local_supply)}
                    </div>
                    <div>{Math.floor(md.local_demand)}</div>
                    <div className="font-bold">{Math.floor(md.current_price)} CR</div>
                    <div className="flex items-center gap-1">
                      {getTrendIcon(md.price_trend)}
                      <span className="text-xs">{md.price_trend}</span>
                    </div>
                    <div className={md.scarcity_multiplier > 1.5 ? 'text-red-400' : 'text-white'}>
                      {md.scarcity_multiplier.toFixed(2)}x
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-slate-400 text-center py-8">
                {selectedColony ? 'No market data available' : 'Select a colony to view market data'}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Global Market Overview */}
        <Card className="bg-slate-800 border-slate-700">
          <CardHeader>
            <CardTitle className="text-white">Global Market Overview</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {resources.map(resource => {
                const resourceMarkets = marketData.filter(md => md.resource_id === resource.id);
                const avgPrice = resourceMarkets.length > 0
                  ? resourceMarkets.reduce((sum, md) => sum + md.current_price, 0) / resourceMarkets.length
                  : resource.base_value;
                const totalSupply = resourceMarkets.reduce((sum, md) => sum + md.local_supply, 0);
                const totalDemand = resourceMarkets.reduce((sum, md) => sum + md.local_demand, 0);
                
                return (
                  <div key={resource.id} className="p-3 bg-slate-700 rounded">
                    <div className="font-bold text-white mb-1">{resource.name}</div>
                    <div className="text-xs text-slate-300 space-y-1">
                      <div>Avg Price: {Math.floor(avgPrice)} CR</div>
                      <div>Supply: {Math.floor(totalSupply)}</div>
                      <div>Demand: {Math.floor(totalDemand)}</div>
                      <div className={totalSupply < totalDemand ? 'text-red-400' : 'text-green-400'}>
                        {totalSupply < totalDemand ? 'Shortage' : 'Surplus'}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}