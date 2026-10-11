import React from 'react';
import { Card } from "../../components/ui/card";
import { cn } from "../../lib/utils";

export default function StatsCard({ title, value, subtitle, icon: Icon, variant = "default" }) {
  const variants = {
    default: "bg-slate-50 border-slate-200",
    success: "bg-green-50 border-green-200",
    warning: "bg-yellow-50 border-yellow-200",
    danger: "bg-red-50 border-red-200",
    info: "bg-blue-50 border-blue-200"
  };

  const iconVariants = {
    default: "text-slate-600",
    success: "text-green-600",
    warning: "text-yellow-600",
    danger: "text-red-600",
    info: "text-blue-600"
  };

  return (
    <Card className={cn("p-4 border", variants[variant])}>
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-xs font-medium text-slate-600 uppercase tracking-wide">{title}</p>
          <p className="text-2xl font-bold text-slate-900 mt-1">{value}</p>
          {subtitle && <p className="text-xs text-slate-500 mt-1">{subtitle}</p>}
        </div>
        {Icon && (
          <div className={cn("p-2 rounded-lg bg-white/50", iconVariants[variant])}>
            <Icon className="w-5 h-5" />
          </div>
        )}
      </div>
    </Card>
  );
}