import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '../api/base44Client';
import {
  FileText,
  BarChart3,
  Users,
  Wrench,
  DollarSign
} from 'lucide-react';
import { Card, CardContent } from '../components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../components/ui/select';
import { Label } from '../components/ui/label';
import { Input } from '../components/ui/input';
import ProductionProgressReport from '../components/reports/ProductionProgressReport';
import CrewUtilizationReport from '../components/reports/CrewUtilizationReport';
import EquipmentUsageReport from '../components/reports/EquipmentUsageReport';
import BudgetAnalysisReport from '../components/reports/BudgetAnalysisReport';

export default function Reports() {
  const [selectedProduction, setSelectedProduction] = useState('all');
  const [dateRange, setDateRange] = useState({ start: '', end: '' });

  const { data: productions = [] } = useQuery({
    queryKey: ['productions'],
    queryFn: () => base44.entities.Production.list('-created_date'),
  });

  const reportTypes = [
    {
      id: 'production',
      title: 'Production Progress',
      description: 'Task completion, incident status, and timeline progress',
      icon: BarChart3,
      color: 'bg-blue-100 text-blue-600'
    },
    {
      id: 'crew',
      title: 'Crew Utilization',
      description: 'Crew assignments, availability, and workload distribution',
      icon: Users,
      color: 'bg-purple-100 text-purple-600'
    },
    {
      id: 'equipment',
      title: 'Equipment Usage',
      description: 'Equipment utilization, maintenance history, and scheduling',
      icon: Wrench,
      color: 'bg-amber-100 text-amber-600'
    },
    {
      id: 'budget',
      title: 'Budget Analysis',
      description: 'Budget vs. actual spend by category and production',
      icon: DollarSign,
      color: 'bg-green-100 text-green-600'
    }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
          <FileText className="w-6 h-6" />
          Reports
        </h1>
        <p className="text-slate-500">Generate and export comprehensive reports</p>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label className="text-xs mb-1 block">Production</Label>
              <Select value={selectedProduction} onValueChange={setSelectedProduction}>
                <SelectTrigger>
                  <SelectValue placeholder="Select production" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Productions</SelectItem>
                  {productions.map(p => (
                    <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs mb-1 block">Start Date</Label>
              <Input
                type="date"
                value={dateRange.start}
                onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
              />
            </div>
            <div>
              <Label className="text-xs mb-1 block">End Date</Label>
              <Input
                type="date"
                value={dateRange.end}
                onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Report Tabs */}
      <Tabs defaultValue="production" className="space-y-6">
        <TabsList className="grid grid-cols-4 w-full">
          {reportTypes.map(report => {
            const Icon = report.icon;
            return (
              <TabsTrigger key={report.id} value={report.id} className="flex items-center gap-2">
                <Icon className="w-4 h-4" />
                <span className="hidden sm:inline">{report.title}</span>
              </TabsTrigger>
            );
          })}
        </TabsList>

        <TabsContent value="production">
          <ProductionProgressReport 
            productionId={selectedProduction} 
            dateRange={dateRange}
          />
        </TabsContent>

        <TabsContent value="crew">
          <CrewUtilizationReport 
            productionId={selectedProduction} 
            dateRange={dateRange}
          />
        </TabsContent>

        <TabsContent value="equipment">
          <EquipmentUsageReport 
            productionId={selectedProduction} 
            dateRange={dateRange}
          />
        </TabsContent>

        <TabsContent value="budget">
          <BudgetAnalysisReport 
            productionId={selectedProduction} 
            dateRange={dateRange}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}