import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../../components/ui/card";
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { TrendingUp, Calendar, Users } from 'lucide-react';
import { Badge } from '../../components/ui/badge';

export default function OccupancyForecast({ forecastData, currentOccupancy }) {
  const occupancyRate = currentOccupancy ? 
    ((currentOccupancy.occupied / currentOccupancy.total) * 100).toFixed(1) : 0;

  const trend = forecastData && forecastData.length > 1 ? 
    (forecastData[forecastData.length - 1].value > forecastData[0].value ? 'up' : 'down') : 'stable';

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="w-5 h-5" />
              Occupancy Forecast
            </CardTitle>
            <CardDescription>AI-powered 7-day prediction</CardDescription>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold">{occupancyRate}%</div>
            <div className="text-xs text-slate-500">Current Occupancy</div>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {forecastData && forecastData.length > 0 ? (
          <div className="space-y-4">
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={forecastData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line 
                  type="monotone" 
                  dataKey="value" 
                  stroke="#3b82f6" 
                  strokeWidth={2}
                  name="Predicted Occupancy %"
                />
                <Line 
                  type="monotone" 
                  dataKey="confidence_lower" 
                  stroke="#94a3b8" 
                  strokeDasharray="5 5"
                  name="Lower Bound"
                />
                <Line 
                  type="monotone" 
                  dataKey="confidence_upper" 
                  stroke="#94a3b8" 
                  strokeDasharray="5 5"
                  name="Upper Bound"
                />
              </LineChart>
            </ResponsiveContainer>
            
            <div className="flex items-center gap-4 text-sm">
              <Badge variant={trend === 'up' ? 'default' : trend === 'down' ? 'destructive' : 'secondary'}>
                <TrendingUp className="w-3 h-3 mr-1" />
                {trend === 'up' ? 'Increasing' : trend === 'down' ? 'Decreasing' : 'Stable'}
              </Badge>
              <span className="text-slate-600">
                Peak: {Math.max(...forecastData.map(d => d.value))}% on {
                  forecastData.find(d => d.value === Math.max(...forecastData.map(d => d.value)))?.date
                }
              </span>
            </div>
          </div>
        ) : (
          <div className="text-center py-8 text-slate-500">
            <Users className="w-12 h-12 mx-auto mb-2 opacity-50" />
            <p>No forecast data available</p>
            <p className="text-xs">Historical data is being collected</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}