import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../../components/ui/card";
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { DollarSign, TrendingUp, TrendingDown, Activity, Check, X } from 'lucide-react';
import { format } from 'date-fns';

export default function DynamicPricing({ recommendations, onAccept, onReject }) {
  const getDemandColor = (demand) => {
    switch (demand) {
      case 'very_high': return 'bg-red-100 text-red-800';
      case 'high': return 'bg-orange-100 text-orange-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-blue-100 text-blue-800';
      case 'very_low': return 'bg-slate-100 text-slate-800';
      default: return 'bg-slate-100 text-slate-800';
    }
  };

  const pendingRecommendations = recommendations?.filter(r => r.status === 'pending') || [];

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="w-5 h-5" />
              Dynamic Pricing Recommendations
            </CardTitle>
            <CardDescription>AI-powered demand-based pricing</CardDescription>
          </div>
          <Badge variant="outline">{pendingRecommendations.length} Pending</Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {pendingRecommendations.length > 0 ? (
          pendingRecommendations.map((rec) => {
            const isIncrease = rec.price_change_percentage > 0;
            
            return (
              <div key={rec.id} className="border rounded-lg p-4 space-y-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h4 className="font-semibold">
                        {rec.resource_type.toUpperCase()} Pricing Update
                      </h4>
                      <Badge className={getDemandColor(rec.demand_forecast)}>
                        <Activity className="w-3 h-3 mr-1" />
                        {rec.demand_forecast.replace('_', ' ')} demand
                      </Badge>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4 text-sm mb-3">
                      <div>
                        <div className="text-slate-500">Current Price</div>
                        <div className="text-lg font-medium">${rec.current_price}</div>
                      </div>
                      <div>
                        <div className="text-slate-500">Recommended Price</div>
                        <div className="text-lg font-medium flex items-center gap-2">
                          ${rec.recommended_price}
                          <Badge variant={isIncrease ? 'default' : 'secondary'}>
                            {isIncrease ? <TrendingUp className="w-3 h-3 mr-1" /> : <TrendingDown className="w-3 h-3 mr-1" />}
                            {isIncrease ? '+' : ''}{rec.price_change_percentage.toFixed(1)}%
                          </Badge>
                        </div>
                      </div>
                    </div>

                    <div className="text-sm space-y-1 text-slate-600">
                      <p><strong>Reasoning:</strong> {rec.reasoning}</p>
                      <p><strong>Effective Date:</strong> {format(new Date(rec.effective_date), 'PPP')}</p>
                      <p><strong>AI Confidence:</strong> {rec.confidence_score}%</p>
                    </div>
                  </div>
                  
                  <div className="flex flex-col gap-2 ml-4">
                    <Button 
                      size="sm"
                      onClick={() => onAccept && onAccept(rec.id)}
                      className="bg-green-600 hover:bg-green-700"
                    >
                      <Check className="w-3 h-3 mr-1" />
                      Accept
                    </Button>
                    <Button 
                      size="sm"
                      variant="outline"
                      onClick={() => onReject && onReject(rec.id)}
                    >
                      <X className="w-3 h-3 mr-1" />
                      Reject
                    </Button>
                  </div>
                </div>
              </div>
            );
          })
        ) : (
          <div className="text-center py-8 text-slate-500">
            <DollarSign className="w-12 h-12 mx-auto mb-2 opacity-50" />
            <p className="font-medium">No pricing recommendations</p>
            <p className="text-xs">Current prices are optimal</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}