import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '../../api/base44Client';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { Progress } from '../../components/ui/progress';
import { Loader2, DollarSign, TrendingUp, TrendingDown, AlertTriangle } from 'lucide-react';
import ReportExporter from './ReportExporter';

const COLORS = ['#8b5cf6', '#f59e0b', '#10b981', '#3b82f6', '#ef4444', '#ec4899', '#6366f1', '#14b8a6', '#f97316', '#6b7280'];

const categoryLabels = {
  labor: 'Labor',
  equipment: 'Equipment',
  venue: 'Venue',
  materials: 'Materials',
  transportation: 'Transportation',
  catering: 'Catering',
  marketing: 'Marketing',
  insurance: 'Insurance',
  permits: 'Permits',
  contingency: 'Contingency',
  other: 'Other'
};

export default function BudgetAnalysisReport({ productionId, dateRange }) {
  const { data: productions = [] } = useQuery({
    queryKey: ['productions'],
    queryFn: () => base44.entities.Production.list(),
  });

  const { data: allBudgets = [], isLoading: budgetsLoading } = useQuery({
    queryKey: ['allBudgets'],
    queryFn: () => base44.entities.Budget.list(),
  });

  const { data: allExpenses = [], isLoading: expensesLoading } = useQuery({
    queryKey: ['allExpenses'],
    queryFn: () => base44.entities.BudgetExpense.list(),
  });

  const isLoading = budgetsLoading || expensesLoading;

  // Filter by production if selected
  const budgets = productionId && productionId !== 'all'
    ? allBudgets.filter(b => b.production_id === productionId)
    : allBudgets;

  const expenses = productionId && productionId !== 'all'
    ? allExpenses.filter(e => e.production_id === productionId)
    : allExpenses;

  // Calculate actual amounts for each budget
  const getActualAmount = (budgetId) => {
    return expenses
      .filter(e => e.budget_id === budgetId && e.status !== 'rejected')
      .reduce((sum, e) => sum + (e.amount || 0), 0);
  };

  // Calculate totals
  const totalAllocated = budgets.reduce((sum, b) => sum + (b.allocated_amount || 0), 0);
  const totalActual = budgets.reduce((sum, b) => sum + getActualAmount(b.id), 0);
  const variance = totalAllocated - totalActual;
  const variancePercent = totalAllocated > 0 ? ((variance / totalAllocated) * 100).toFixed(1) : 0;

  // Budget vs Actual by category
  const categoryTotals = {};
  budgets.forEach(b => {
    const cat = b.category;
    if (!categoryTotals[cat]) {
      categoryTotals[cat] = { allocated: 0, actual: 0 };
    }
    categoryTotals[cat].allocated += b.allocated_amount || 0;
    categoryTotals[cat].actual += getActualAmount(b.id);
  });

  const categoryChartData = Object.entries(categoryTotals).map(([cat, totals]) => ({
    name: categoryLabels[cat] || cat,
    Allocated: totals.allocated,
    Actual: totals.actual
  }));

  // Budget allocation pie chart
  const allocationData = Object.entries(categoryTotals)
    .filter(([, totals]) => totals.allocated > 0)
    .map(([cat, totals], idx) => ({
      name: categoryLabels[cat] || cat,
      value: totals.allocated,
      color: COLORS[idx % COLORS.length]
    }));

  // Budget by production
  const productionBudgetData = productions
    .map(prod => {
      const prodBudgets = allBudgets.filter(b => b.production_id === prod.id);
      const allocated = prodBudgets.reduce((sum, b) => sum + (b.allocated_amount || 0), 0);
      const actual = prodBudgets.reduce((sum, b) => sum + getActualAmount(b.id), 0);
      return {
        name: prod.name.substring(0, 15),
        Allocated: allocated,
        Actual: actual
      };
    })
    .filter(p => p.Allocated > 0 || p.Actual > 0);

  // Categories over budget
  const overBudgetCategories = Object.entries(categoryTotals)
    .filter(([, totals]) => totals.actual > totals.allocated)
    .map(([cat, totals]) => ({
      category: categoryLabels[cat] || cat,
      allocated: totals.allocated,
      actual: totals.actual,
      over: totals.actual - totals.allocated
    }));

  // CSV columns
  const budgetDetails = budgets.map(b => ({
    ...b,
    actual: getActualAmount(b.id),
    production_name: productions.find(p => p.id === b.production_id)?.name || 'N/A'
  }));

  const csvColumns = [
    { header: 'Production', key: 'production_name' },
    { header: 'Category', accessor: (b) => categoryLabels[b.category] || b.category },
    { header: 'Allocated', key: 'allocated_amount' },
    { header: 'Actual', key: 'actual' },
    { header: 'Variance', accessor: (b) => (b.allocated_amount || 0) - b.actual },
    { header: 'Status', accessor: (b) => b.actual > b.allocated_amount ? 'Over Budget' : 'On Track' },
  ];

  // PDF sections
  const pdfSections = [
    {
      title: 'Budget Summary',
      type: 'summary',
      items: [
        { label: 'Total Allocated', value: `$${totalAllocated.toLocaleString()}` },
        { label: 'Total Spent', value: `$${totalActual.toLocaleString()}` },
        { label: 'Variance', value: `$${Math.abs(variance).toLocaleString()} ${variance >= 0 ? 'under' : 'over'}` },
        { label: 'Variance %', value: `${variancePercent}%` },
        { label: 'Categories Over Budget', value: overBudgetCategories.length },
      ]
    },
    {
      title: 'Budget by Category',
      type: 'summary',
      items: Object.entries(categoryTotals).map(([cat, totals]) => ({
        label: categoryLabels[cat] || cat,
        value: `$${totals.allocated.toLocaleString()} / $${totals.actual.toLocaleString()}`
      }))
    },
    {
      title: 'Budget Details',
      type: 'table',
      columns: csvColumns.map(c => ({ ...c, width: 30 })),
      data: budgetDetails
    }
  ];

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-slate-400" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Export Button */}
      <div className="flex justify-end">
        <ReportExporter
          title="Budget Analysis Report"
          csvData={budgetDetails}
          csvColumns={csvColumns}
          pdfSections={pdfSections}
          filename="budget_analysis"
        />
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-100">
                <DollarSign className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">${(totalAllocated / 1000).toFixed(0)}k</p>
                <p className="text-xs text-slate-500">Total Budget</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-amber-100">
                <DollarSign className="w-5 h-5 text-amber-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">${(totalActual / 1000).toFixed(0)}k</p>
                <p className="text-xs text-slate-500">Total Spent</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className={variance >= 0 ? '' : 'border-red-200 bg-red-50/50'}>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg ${variance >= 0 ? 'bg-green-100' : 'bg-red-100'}`}>
                {variance >= 0 ? (
                  <TrendingDown className="w-5 h-5 text-green-600" />
                ) : (
                  <TrendingUp className="w-5 h-5 text-red-600" />
                )}
              </div>
              <div>
                <p className={`text-2xl font-bold ${variance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  ${(Math.abs(variance) / 1000).toFixed(0)}k
                </p>
                <p className="text-xs text-slate-500">{variance >= 0 ? 'Under Budget' : 'Over Budget'}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-red-100">
                <AlertTriangle className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{overBudgetCategories.length}</p>
                <p className="text-xs text-slate-500">Over Budget</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Budget vs Actual by Category</CardTitle>
          </CardHeader>
          <CardContent>
            {categoryChartData.length === 0 ? (
              <p className="text-center py-8 text-slate-500">No budget data</p>
            ) : (
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={categoryChartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" tick={{ fontSize: 10 }} angle={-45} textAnchor="end" height={60} />
                    <YAxis tickFormatter={(v) => `$${(v/1000).toFixed(0)}k`} />
                    <Tooltip formatter={(value) => `$${value.toLocaleString()}`} />
                    <Legend />
                    <Bar dataKey="Allocated" fill="#3b82f6" />
                    <Bar dataKey="Actual" fill="#f59e0b" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Budget Allocation</CardTitle>
          </CardHeader>
          <CardContent>
            {allocationData.length === 0 ? (
              <p className="text-center py-8 text-slate-500">No allocation data</p>
            ) : (
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={allocationData}
                      cx="50%"
                      cy="50%"
                      innerRadius={40}
                      outerRadius={80}
                      dataKey="value"
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    >
                      {allocationData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => `$${value.toLocaleString()}`} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Production Comparison */}
      {productionBudgetData.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Budget by Production</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={productionBudgetData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis tickFormatter={(v) => `$${(v/1000).toFixed(0)}k`} />
                  <Tooltip formatter={(value) => `$${value.toLocaleString()}`} />
                  <Legend />
                  <Bar dataKey="Allocated" fill="#3b82f6" />
                  <Bar dataKey="Actual" fill="#f59e0b" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Category Breakdown Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Category Breakdown</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {Object.entries(categoryTotals).map(([cat, totals]) => {
              const percent = totals.allocated > 0 
                ? Math.min((totals.actual / totals.allocated) * 100, 100) 
                : 0;
              const isOver = totals.actual > totals.allocated;
              
              return (
                <div key={cat} className="space-y-1">
                  <div className="flex justify-between text-sm">
                    <span className="font-medium">{categoryLabels[cat] || cat}</span>
                    <span className={isOver ? 'text-red-600' : 'text-slate-600'}>
                      ${totals.actual.toLocaleString()} / ${totals.allocated.toLocaleString()}
                      {isOver && <Badge className="ml-2 bg-red-100 text-red-700">Over</Badge>}
                    </span>
                  </div>
                  <Progress value={percent} className={isOver ? '[&>div]:bg-red-500' : ''} />
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}