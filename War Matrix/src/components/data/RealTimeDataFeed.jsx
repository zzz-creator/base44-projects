import React, { useState, useEffect } from 'react';
import { base44 } from '../../api/base44Client';
import { useMutation } from '@tanstack/react-query';
import { Card } from '../ui/card';
import { Badge } from '../ui/badge';
import { Radio, TrendingUp, DollarSign, Cloud, RefreshCw } from 'lucide-react';

export default function RealTimeDataFeed({ onDataUpdate, refreshInterval = 30 }) {
  const [lastUpdate, setLastUpdate] = useState(null);
  const [feedData, setFeedData] = useState(null);

  const fetchLiveDataMutation = useMutation({
    mutationFn: async () => {
      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `You are a real-time data aggregator. Fetch the latest data (last 1-2 hours) for:

1. GEOPOLITICAL EVENTS
   - Breaking news from conflict zones
   - Diplomatic developments
   - Military movements
   - Political statements/decisions
   
2. ECONOMIC INDICATORS (Real-time or latest available)
   - Oil prices (WTI Crude, Brent)
   - Gold prices
   - Major stock indices (S&P 500, FTSE, Nikkei)
   - Currency exchange rates (USD/EUR, USD/CNY, USD/RUB)
   - Defense stocks performance
   - Commodity prices (wheat, copper, lithium)
   
3. CLIMATE DATA
   - Extreme weather events in last 24h
   - Climate-related disasters
   - Resource scarcity alerts (water, food)
   - Temperature anomalies

Provide real, current data with timestamps. Be specific and accurate.`,
        response_json_schema: {
          type: "object",
          properties: {
            timestamp: { type: "string" },
            geopolitical_events: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  headline: { type: "string" },
                  location: { type: "string" },
                  timestamp: { type: "string" },
                  severity: { type: "string" },
                  impact_score: { type: "number" }
                }
              }
            },
            economic_indicators: {
              type: "object",
              properties: {
                oil_wti: { type: "number" },
                oil_brent: { type: "number" },
                gold: { type: "number" },
                sp500: { type: "number" },
                usd_eur: { type: "number" },
                defense_stocks_index: { type: "number" },
                commodities: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      name: { type: "string" },
                      price: { type: "number" },
                      change_24h: { type: "number" }
                    }
                  }
                }
              }
            },
            climate_events: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  event_type: { type: "string" },
                  location: { type: "string" },
                  severity: { type: "string" },
                  impact: { type: "string" }
                }
              }
            }
          }
        },
        add_context_from_internet: true
      });

      setFeedData(result);
      setLastUpdate(new Date().toISOString());
      
      if (onDataUpdate) {
        onDataUpdate(result);
      }

      return result;
    }
  });

  useEffect(() => {
    // Initial fetch
    fetchLiveDataMutation.mutate();

    // Set up interval based on settings
    if (refreshInterval > 0) {
      const interval = setInterval(() => {
        fetchLiveDataMutation.mutate();
      }, refreshInterval * 60 * 1000);

      return () => clearInterval(interval);
    }
  }, [refreshInterval]);

  return (
    <Card className="bg-slate-950/80 backdrop-blur-xl cyber-border p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Radio className="w-4 h-4 text-green-400 animate-pulse" />
          <span className="text-green-400 font-bold font-mono text-xs">LIVE DATA FEED</span>
        </div>
        <div className="flex items-center gap-2">
          {fetchLiveDataMutation.isPending && (
            <RefreshCw className="w-3 h-3 text-cyan-400 animate-spin" />
          )}
          <Badge className="bg-cyan-500/20 text-cyan-400 border-cyan-500/30 font-mono text-xs">
            {refreshInterval > 0 ? `${refreshInterval}min` : 'Manual'}
          </Badge>
        </div>
      </div>

      {feedData && (
        <div className="space-y-3">
          <div className="grid grid-cols-3 gap-2 text-xs font-mono">
            <div className="p-2 bg-slate-900/50 rounded">
              <div className="flex items-center gap-1 mb-1">
                <TrendingUp className="w-3 h-3 text-purple-400" />
                <span className="text-slate-400">Events</span>
              </div>
              <div className="text-purple-400 font-bold">
                {feedData.geopolitical_events?.length || 0}
              </div>
            </div>

            <div className="p-2 bg-slate-900/50 rounded">
              <div className="flex items-center gap-1 mb-1">
                <DollarSign className="w-3 h-3 text-yellow-400" />
                <span className="text-slate-400">Oil</span>
              </div>
              <div className="text-yellow-400 font-bold">
                ${feedData.economic_indicators?.oil_wti?.toFixed(0) || '--'}
              </div>
            </div>

            <div className="p-2 bg-slate-900/50 rounded">
              <div className="flex items-center gap-1 mb-1">
                <Cloud className="w-3 h-3 text-blue-400" />
                <span className="text-slate-400">Climate</span>
              </div>
              <div className="text-blue-400 font-bold">
                {feedData.climate_events?.length || 0}
              </div>
            </div>
          </div>

          {lastUpdate && (
            <div className="text-xs text-slate-500 font-mono text-center">
              Last update: {new Date(lastUpdate).toLocaleTimeString()}
            </div>
          )}
        </div>
      )}
    </Card>
  );
}