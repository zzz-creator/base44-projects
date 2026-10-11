import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '../../api/base44Client';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { DollarSign, Loader2 } from 'lucide-react';

const categoryLabels = {
  labor: 'Labor',
  equipment: 'Equipment',
  venue: 'Venue',
  materials: 'Materials',
  transportation: 'Transport',
  catering: 'Catering',
  marketing: 'Marketing',
  insurance: 'Insurance',
  permits: 'Permits',
  contingency: 'Contingency',
  other: 'Other'
};

const COLORS = ['#8b5cf6', '#f59e0b', '#10b981', '#3b82f6', '#ef4444', '#ec4899', '#6366f1', '#14b8a6', '#f97316', '#6b7280', '#94a3b8'];

export default function BudgetChart({ productionId }) {
  const { data: budgets = [], isLoading: budgetsLoading } = useQuery({
    queryKey: ['budgets', productionId],
    queryFn: () => base44.entities.Budget.filter({ production_id: productionId }),
    enabled: !!productionId
  });

  const { data: expenses = [], isLoading: expensesLoading } = useQuery({
    queryKey: ['budgetExpenses', productionId],
    queryFn: () => base44.entities.BudgetExpense.filter({ production_id: productionId }),
    enabled: !!productionId
  });

  const isLoading = budgetsLoading || expensesLoading;

  if (isLoading) {
    return (
      <div className="flex justify-center py-8">
        <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
      </div>
    );
  }

  if (budgets.length === 0) {
    return null;
  }

  // Calculate actual amounts from expenses
  const getActualAmount = (budgetId) => {
    return expenses
      .filter(e => e.budget_id === budgetId && e.status !== 'rejected')
      .reduce((sum, e) => sum + (e.amount || 0), 0);
  };

  // Prepare data for bar chart
  const barChartData = budgets.map((budget) => ({
    name: budget.category === 'other' ? (budget.category_name || 'Other') : categoryLabels[budget.category],
    Allocated: budget.allocated_amount || 0,
    Actual: getActualAmount(budget.id)
  }));

  // Prepare data for pie chart (allocation distribution)
  const pieChartData = budgets.map((budget, index) => ({
    name: budget.category === 'other' ? (budget.category_name || 'Other') : categoryLabels[budget.category],
    value: budget.allocated_amount || 0,
    color: COLORS[index % COLORS.length]
  }));

  const totalAllocated = budgets.reduce((sum, b) => sum + (b.allocated_amount || 0), 0);
  const totalActual = budgets.reduce((sum, b) => sum + getActualAmount(b.id), 0);

  return (
    <div className="space-y-4">
      {/* Budget vs Actual Bar Chart */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <DollarSign className="w-4 h-4" />
            Budget vs Actual by Category
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={barChartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis 
                  dataKey="name" 
                  tick={{ fontSize: 10 }} 
                  interval={0}
                  angle={-45}
                  textAnchor="end"
                  height={60}
                />
                <YAxis tick={{ fontSize: 10 }} tickFormatter={(v) => `$${v >= 1000 ? (v/1000).toFixed(0) + 'k' : v}`} />
                <Tooltip 
                  formatter={(value) => [`$${value.toLocaleString()}`, '']}
                  contentStyle={{ fontSize: 12 }}
                />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Bar dataKey="Allocated" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Actual" fill="#f59e0b" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="flex justify-center gap-6 mt-2 text-xs text-slate-600">
            <span>Total Allocated: <strong>${totalAllocated.toLocaleString()}</strong></span>
            <span>Total Spent: <strong>${totalActual.toLocaleString()}</strong></span>
            <span className={totalAllocated >= totalActual ? 'text-green-600' : 'text-red-600'}>
              {totalAllocated >= totalActual ? 'Under budget by ' : 'Over budget by '}
              <strong>${Math.abs(totalAllocated - totalActual).toLocaleString()}</strong>
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Budget Allocation Pie Chart */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">Budget Allocation</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieChartData}
                  cx="50%"
                  cy="50%"
                  innerRadius={40}
                  outerRadius={70}
                  paddingAngle={2}
                  dataKey="value"
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  labelLine={{ strokeWidth: 1 }}
                >
                  {pieChartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => `$${value.toLocaleString()}`} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}