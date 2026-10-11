import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";

export default function KPIPanel({ title, value, subtitle, icon: Icon, trend, bgColor = "bg-slate-700" }) {
  const getTrendIcon = () => {
    if (!trend) return <Minus className="w-4 h-4 text-slate-400" />;
    if (trend > 0) return <TrendingUp className="w-4 h-4 text-green-400" />;
    return <TrendingDown className="w-4 h-4 text-red-400" />;
  };

  const getTrendColor = () => {
    if (!trend) return "text-slate-400";
    return trend > 0 ? "text-green-400" : "text-red-400";
  };

  return (
    <Card className="bg-slate-800 border-slate-700 hover:border-slate-600 transition-all">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium text-slate-400">{title}</CardTitle>
          <div className={`p-2 rounded-lg ${bgColor} bg-opacity-20`}>
            {Icon && <Icon className={`w-5 h-5 ${bgColor.replace('bg-', 'text-')}`} />}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex items-baseline justify-between">
          <div>
            <div className="text-3xl font-bold text-white">{value}</div>
            {subtitle && <p className="text-xs text-slate-400 mt-1">{subtitle}</p>}
          </div>
          {trend !== undefined && (
            <div className={`flex items-center gap-1 ${getTrendColor()}`}>
              {getTrendIcon()}
              <span className="text-sm font-medium">{Math.abs(trend)}%</span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}