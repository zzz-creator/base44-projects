import React, { useState, useEffect } from 'react';
import { db } from '../components/dataClient';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import { Button } from '../components/ui/button';
import { RefreshCw, Sparkles } from 'lucide-react';
import { toast } from 'sonner';
import OccupancyForecast from '../components/analytics/OccupancyForecast';
import MaintenanceAlerts from '../components/analytics/MaintenanceAlerts';
import DynamicPricing from '../components/analytics/DynamicPricing';
import AdvancedReports from '../components/analytics/AdvancedReports';

export default function Analytics() {
  const queryClient = useQueryClient();
  const [isGenerating, setIsGenerating] = useState(false);

  const { data: rooms = [] } = useQuery({
    queryKey: ['rooms'],
    queryFn: () => db.entities.Room.list()
  });

  const { data: elevators = [] } = useQuery({
    queryKey: ['elevators'],
    queryFn: () => db.entities.Elevator.list()
  });

  const { data: parkingSpots = [] } = useQuery({
    queryKey: ['parking-spots'],
    queryFn: () => db.entities.ParkingSpot.list()
  });

  const { data: maintenanceAlerts = [] } = useQuery({
    queryKey: ['maintenance-alerts'],
    queryFn: () => db.entities.MaintenanceAlert.list()
  });

  const { data: pricingRecommendations = [] } = useQuery({
    queryKey: ['pricing-recommendations'],
    queryFn: () => db.entities.PricingRecommendation.list()
  });

  const { data: analyticsData = [] } = useQuery({
    queryKey: ['analytics-data'],
    queryFn: () => db.entities.AnalyticsData.list()
  });

  const generatePredictions = async () => {
    setIsGenerating(true);
    try {
      // Generate occupancy forecast
      const occupancyPrompt = `Based on current hotel data: ${rooms.filter(r => r.status === 'occupied').length}/${rooms.length} rooms occupied.
Generate a 7-day occupancy forecast with daily predictions including confidence intervals.
Return JSON with format: [{date: "Mon", value: 75, confidence_lower: 70, confidence_upper: 80}, ...]`;

      const forecastResult = await db.integrations.Core.InvokeLLM({
        prompt: occupancyPrompt,
        response_json_schema: {
          type: "object",
          properties: {
            forecast: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  date: { type: "string" },
                  value: { type: "number" },
                  confidence_lower: { type: "number" },
                  confidence_upper: { type: "number" }
                }
              }
            }
          }
        }
      });

      // Generate maintenance alerts for elevators
      const maintenancePrompt = `Analyze elevator usage data: ${elevators.map(e => 
        `${e.elevator_name}: status=${e.status}, load=${e.current_load}/${e.capacity}`
      ).join('; ')}
      
Generate 2-3 predictive maintenance alerts with severity, predicted failure dates, and recommendations.`;

      const maintenanceResult = await db.integrations.Core.InvokeLLM({
        prompt: maintenancePrompt,
        response_json_schema: {
          type: "object",
          properties: {
            alerts: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  asset_type: { type: "string" },
                  severity: { type: "string" },
                  issue_description: { type: "string" },
                  recommended_action: { type: "string" },
                  confidence_score: { type: "number" },
                  days_until_failure: { type: "number" }
                }
              }
            }
          }
        }
      });

      // Create maintenance alerts
      if (maintenanceResult.alerts) {
        for (const alert of maintenanceResult.alerts) {
          const elevator = elevators[0];
          if (elevator) {
            const failureDate = new Date();
            failureDate.setDate(failureDate.getDate() + (alert.days_until_failure || 30));
            
            await db.entities.MaintenanceAlert.create({
              asset_type: 'elevator',
              asset_id: elevator.id,
              alert_type: 'predictive',
              severity: alert.severity || 'medium',
              predicted_failure_date: failureDate.toISOString(),
              confidence_score: alert.confidence_score || 85,
              issue_description: alert.issue_description,
              recommended_action: alert.recommended_action,
              status: 'pending'
            });
          }
        }
      }

      // Generate pricing recommendations
      const pricingPrompt = `Current room rates: ${rooms.slice(0, 3).map(r => 
        `${r.room_type}: $${r.rate_per_night}/night`
      ).join('; ')}
      
Current occupancy: ${((rooms.filter(r => r.status === 'occupied').length / rooms.length) * 100).toFixed(0)}%
      
Generate 2-3 dynamic pricing recommendations based on demand forecast.`;

      const pricingResult = await db.integrations.Core.InvokeLLM({
        prompt: pricingPrompt,
        response_json_schema: {
          type: "object",
          properties: {
            recommendations: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  room_type: { type: "string" },
                  current_price: { type: "number" },
                  recommended_price: { type: "number" },
                  demand_forecast: { type: "string" },
                  reasoning: { type: "string" },
                  confidence_score: { type: "number" }
                }
              }
            }
          }
        }
      });

      // Create pricing recommendations
      if (pricingResult.recommendations) {
        for (const rec of pricingResult.recommendations) {
          const room = rooms.find(r => r.room_type === rec.room_type);
          if (room) {
            const change = ((rec.recommended_price - rec.current_price) / rec.current_price) * 100;
            const effectiveDate = new Date();
            effectiveDate.setDate(effectiveDate.getDate() + 1);
            
            await db.entities.PricingRecommendation.create({
              resource_type: 'room',
              resource_id: room.id,
              current_price: rec.current_price,
              recommended_price: rec.recommended_price,
              price_change_percentage: change,
              demand_forecast: rec.demand_forecast || 'medium',
              confidence_score: rec.confidence_score || 80,
              effective_date: effectiveDate.toISOString(),
              reasoning: rec.reasoning,
              status: 'pending'
            });
          }
        }
      }

      queryClient.invalidateQueries({ queryKey: ['maintenance-alerts'] });
      queryClient.invalidateQueries({ queryKey: ['pricing-recommendations'] });
      
      toast.success('AI predictions generated successfully!');
    } catch (error) {
      toast.error('Failed to generate predictions');
      console.error(error);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleAcknowledge = async (alertId) => {
    await db.entities.MaintenanceAlert.update(alertId, { status: 'acknowledged' });
    queryClient.invalidateQueries({ queryKey: ['maintenance-alerts'] });
    toast.success('Alert acknowledged');
  };

  const handleSchedule = async (alertId) => {
    await db.entities.MaintenanceAlert.update(alertId, { status: 'scheduled' });
    queryClient.invalidateQueries({ queryKey: ['maintenance-alerts'] });
    toast.success('Maintenance scheduled');
  };

  const handleAcceptPrice = async (recId) => {
    const rec = pricingRecommendations.find(r => r.id === recId);
    if (rec) {
      await db.entities.Room.update(rec.resource_id, { rate_per_night: rec.recommended_price });
      await db.entities.PricingRecommendation.update(recId, { status: 'accepted' });
      queryClient.invalidateQueries({ queryKey: ['rooms'] });
      queryClient.invalidateQueries({ queryKey: ['pricing-recommendations'] });
      toast.success('Pricing updated successfully');
    }
  };

  const handleRejectPrice = async (recId) => {
    await db.entities.PricingRecommendation.update(recId, { status: 'rejected' });
    queryClient.invalidateQueries({ queryKey: ['pricing-recommendations'] });
    toast.info('Pricing recommendation rejected');
  };

  // Mock forecast data (in real app, this would come from AnalyticsData entity)
  const forecastData = [
    { date: 'Mon', value: 72, confidence_lower: 68, confidence_upper: 76 },
    { date: 'Tue', value: 75, confidence_lower: 71, confidence_upper: 79 },
    { date: 'Wed', value: 78, confidence_lower: 74, confidence_upper: 82 },
    { date: 'Thu', value: 82, confidence_lower: 78, confidence_upper: 86 },
    { date: 'Fri', value: 88, confidence_lower: 84, confidence_upper: 92 },
    { date: 'Sat', value: 95, confidence_lower: 91, confidence_upper: 99 },
    { date: 'Sun', value: 90, confidence_lower: 86, confidence_upper: 94 }
  ];

  const currentOccupancy = {
    occupied: rooms.filter(r => r.status === 'occupied').length,
    total: rooms.length
  };

  return (
    <div className="min-h-screen bg-slate-100">
      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white p-6">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <Sparkles className="w-8 h-8" />
              AI-Powered Analytics
            </h1>
            <p className="text-indigo-100 mt-1">Predictive insights and intelligent recommendations</p>
          </div>
          <Button 
            onClick={generatePredictions} 
            disabled={isGenerating}
            className="bg-white text-indigo-600 hover:bg-indigo-50"
          >
            {isGenerating ? (
              <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Sparkles className="w-4 h-4 mr-2" />
            )}
            {isGenerating ? 'Generating...' : 'Generate AI Predictions'}
          </Button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-6 space-y-6">
        <Tabs defaultValue="predictions" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="predictions">AI Predictions</TabsTrigger>
            <TabsTrigger value="reports">Advanced Reports</TabsTrigger>
          </TabsList>

          <TabsContent value="predictions" className="space-y-6">
            <OccupancyForecast 
              forecastData={forecastData}
              currentOccupancy={currentOccupancy}
            />
            
            <MaintenanceAlerts 
              alerts={maintenanceAlerts}
              onAcknowledge={handleAcknowledge}
              onSchedule={handleSchedule}
            />
            
            <DynamicPricing 
              recommendations={pricingRecommendations}
              onAccept={handleAcceptPrice}
              onReject={handleRejectPrice}
            />
          </TabsContent>

          <TabsContent value="reports" className="space-y-6">
            <AdvancedReports analyticsData={analyticsData} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}