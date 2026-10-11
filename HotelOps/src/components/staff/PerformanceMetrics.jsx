import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Progress } from '../../components/ui/progress';
import { Badge } from '../../components/ui/badge';
import { TrendingUp, Award, CheckCircle2, Clock } from 'lucide-react';

export default function PerformanceMetrics({ staffMember }) {
  if (!staffMember) return null;

  const performanceLevel = staffMember.performance_score >= 90 ? 'excellent' : 
                          staffMember.performance_score >= 75 ? 'good' : 
                          staffMember.performance_score >= 60 ? 'average' : 'needs_improvement';

  const levelColors = {
    excellent: 'bg-green-100 text-green-800',
    good: 'bg-blue-100 text-blue-800',
    average: 'bg-yellow-100 text-yellow-800',
    needs_improvement: 'bg-red-100 text-red-800'
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="w-5 h-5" />
          My Performance
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <Card>
            <CardContent className="p-4 text-center">
              <CheckCircle2 className="w-8 h-8 mx-auto mb-2 text-blue-600" />
              <p className="text-2xl font-bold">{staffMember.tasks_completed_today}</p>
              <p className="text-sm text-slate-600">Tasks Today</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <Award className="w-8 h-8 mx-auto mb-2 text-purple-600" />
              <p className="text-2xl font-bold">{staffMember.total_tasks_completed}</p>
              <p className="text-sm text-slate-600">Total Completed</p>
            </CardContent>
          </Card>
        </div>

        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">Performance Score</span>
            <Badge className={levelColors[performanceLevel]}>
              {performanceLevel.replace('_', ' ').toUpperCase()}
            </Badge>
          </div>
          <Progress value={staffMember.performance_score} className="h-3" />
          <p className="text-right text-sm text-slate-600 mt-1">
            {staffMember.performance_score}/100
          </p>
        </div>

        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">Guest Satisfaction</span>
            <span className="text-lg font-bold">{staffMember.average_rating.toFixed(1)} ⭐</span>
          </div>
          <Progress value={(staffMember.average_rating / 5) * 100} className="h-3" />
        </div>

        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="p-4">
            <p className="text-sm font-medium mb-2">Daily Goal Progress</p>
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-600">Target: 10 tasks/day</span>
              <span className="text-sm font-bold">
                {Math.min((staffMember.tasks_completed_today / 10) * 100, 100).toFixed(0)}%
              </span>
            </div>
            <Progress 
              value={Math.min((staffMember.tasks_completed_today / 10) * 100, 100)} 
              className="h-2 mt-2" 
            />
          </CardContent>
        </Card>
      </CardContent>
    </Card>
  );
}