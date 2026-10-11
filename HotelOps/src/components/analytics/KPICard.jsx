import React from 'react';
import { Card, CardContent } from "../../components/ui/card";
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { cn } from '../../lib/utils';

export default function KPICard({ title, value, subtitle, trend, trendValue, icon: Icon, variant = 'default' }) {
  const variantStyles = {
    default: 'border-slate-200 bg-white',
    success: 'border-green-200 bg-green-50',
    warning: 'border-yellow-200 bg-yellow-50',
    danger: 'border-red-200 bg-red-50',
    info: 'border-blue-200 bg-blue-50'
  };

  const getTrendIcon = () => {
    if (trend === 'up') return <TrendingUp className="w-4 h-4 text-green-600" />;
    if (trend === 'down') return <TrendingDown className="w-4 h-4 text-red-600" />;
    return <Minus className="w-4 h-4 text-slate-400" />;
  };

  const getTrendColor = () => {
    if (trend === 'up') return 'text-green-600';
    if (trend === 'down') return 'text-red-600';
    return 'text-slate-600';
  };

  return (
    <Card className={cn("border-2", variantStyles[variant])}>
      <CardContent className="p-5">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="text-sm font-medium text-slate-600 mb-1">{title}</div>
            <div className="text-2xl font-bold mb-1">{value}</div>
            {subtitle && <div className="text-xs text-slate-500">{subtitle}</div>}
            {trendValue && (
              <div className={cn("flex items-center gap-1 text-xs mt-2", getTrendColor())}>
                {getTrendIcon()}
                <span>{trendValue}</span>
              </div>
            )}
          </div>
          {Icon && (
            <div className="p-3 rounded-lg bg-slate-100">
              <Icon className="w-6 h-6 text-slate-600" />
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}