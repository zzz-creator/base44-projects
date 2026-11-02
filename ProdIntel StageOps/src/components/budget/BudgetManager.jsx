import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '../../api/base44Client';
import BudgetAIAssistant from '../../components/ai/BudgetAIAssistant';
import {
  DollarSign,
  Plus,
  Pencil,
  Trash2,
  Loader2,
  AlertTriangle
} from 'lucide-react';
import { Card, CardContent } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Badge } from '../../components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '../../components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../components/ui/select';
import { Progress } from '../../components/ui/progress';

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

const categoryColors = {
  labor: '#8b5cf6',
  equipment: '#f59e0b',
  venue: '#10b981',
  materials: '#3b82f6',
  transportation: '#ef4444',
  catering: '#ec4899',
  marketing: '#6366f1',
  insurance: '#14b8a6',
  permits: '#f97316',
  contingency: '#6b7280',
  other: '#94a3b8'
};

export default function BudgetManager({ productionId }) {
  const [showForm, setShowForm] = useState(false);
  const [editingBudget, setEditingBudget] = useState(null);
  const [formData, setFormData] = useState({
    category: '',
    category_name: '',
    allocated_amount: '',
    notes: ''
  });

  const queryClient = useQueryClient();

  const { data: budgets = [], isLoading } = useQuery({
    queryKey: ['budgets', productionId],
    queryFn: () => base44.entities.Budget.filter({ production_id: productionId }),
    enabled: !!productionId
  });

  const { data: expenses = [] } = useQuery({
    queryKey: ['budgetExpenses', productionId],
    queryFn: () => base44.entities.BudgetExpense.filter({ production_id: productionId }),
    enabled: !!productionId
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.Budget.create({ ...data, production_id: productionId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['budgets', productionId] });
      handleCloseForm();
    }
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Budget.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['budgets', productionId] });
      handleCloseForm();
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.Budget.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['budgets', productionId] })
  });

  const handleCloseForm = () => {
    setShowForm(false);
    setEditingBudget(null);
    setFormData({ category: '', category_name: '', allocated_amount: '', notes: '' });
  };

  const handleEdit = (budget) => {
    setEditingBudget(budget);
    setFormData({
      category: budget.category,
      category_name: budget.category_name || '',
      allocated_amount: budget.allocated_amount?.toString() || '',
      notes: budget.notes || ''
    });
    setShowForm(true);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const data = {
      ...formData,
      allocated_amount: parseFloat(formData.allocated_amount) || 0
    };
    
    if (editingBudget) {
      updateMutation.mutate({ id: editingBudget.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  // Calculate actual amounts from expenses
  const getActualAmount = (budgetId) => {
    return expenses
      .filter(e => e.budget_id === budgetId && e.status !== 'rejected')
      .reduce((sum, e) => sum + (e.amount || 0), 0);
  };

  // Calculate totals
  const totalAllocated = budgets.reduce((sum, b) => sum + (b.allocated_amount || 0), 0);
  const totalActual = budgets.reduce((sum, b) => sum + getActualAmount(b.id), 0);
  const variance = totalAllocated - totalActual;

  const { data: production } = useQuery({
    queryKey: ['production', productionId],
    queryFn: () => base44.entities.Production.filter({ id: productionId }),
    select: (data) => data[0],
    enabled: !!productionId
  });

  return (
    <div className="space-y-4">
      {/* AI Budget Assistant */}
      {production && <BudgetAIAssistant production={production} />}

      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-slate-900 flex items-center gap-2">
          <DollarSign className="w-5 h-5" />
          Budget Categories
        </h3>
        <Button size="sm" onClick={() => setShowForm(true)}>
          <Plus className="w-4 h-4 mr-1" />
          Add Category
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-3 gap-3">
        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="p-3">
            <p className="text-xs text-blue-600 font-medium">Total Budget</p>
            <p className="text-lg font-bold text-blue-900">${totalAllocated.toLocaleString()}</p>
          </CardContent>
        </Card>
        <Card className="bg-amber-50 border-amber-200">
          <CardContent className="p-3">
            <p className="text-xs text-amber-600 font-medium">Spent</p>
            <p className="text-lg font-bold text-amber-900">${totalActual.toLocaleString()}</p>
          </CardContent>
        </Card>
        <Card className={variance >= 0 ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}>
          <CardContent className="p-3">
            <p className={`text-xs font-medium ${variance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              Remaining
            </p>
            <p className={`text-lg font-bold ${variance >= 0 ? 'text-green-900' : 'text-red-900'}`}>
              ${Math.abs(variance).toLocaleString()}
              {variance < 0 && ' over'}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Budget List */}
      {isLoading ? (
        <div className="flex justify-center py-8">
          <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
        </div>
      ) : budgets.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-8">
            <DollarSign className="w-10 h-10 text-slate-300 mb-2" />
            <p className="text-slate-500">No budget categories defined</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {budgets.map((budget) => {
            const actual = getActualAmount(budget.id);
            const percentage = budget.allocated_amount > 0 
              ? Math.min((actual / budget.allocated_amount) * 100, 100)
              : 0;
            const isOverBudget = actual > budget.allocated_amount;

            return (
              <Card key={budget.id} className="hover:shadow-sm transition-shadow">
                <CardContent className="p-3">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div 
                        className="w-3 h-3 rounded-full" 
                        style={{ backgroundColor: categoryColors[budget.category] }}
                      />
                      <span className="font-medium text-slate-900">
                        {budget.category === 'other' ? budget.category_name : categoryLabels[budget.category]}
                      </span>
                      {isOverBudget && (
                        <Badge className="bg-red-100 text-red-700 gap-1">
                          <AlertTriangle className="w-3 h-3" />
                          Over Budget
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-1">
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleEdit(budget)}>
                        <Pencil className="w-3 h-3" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-7 w-7 text-red-500 hover:text-red-700"
                        onClick={() => deleteMutation.mutate(budget.id)}
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                  <div className="flex items-center justify-between text-sm mb-1">
                    <span className="text-slate-600">
                      ${actual.toLocaleString()} / ${budget.allocated_amount?.toLocaleString()}
                    </span>
                    <span className={isOverBudget ? 'text-red-600' : 'text-slate-500'}>
                      {percentage.toFixed(0)}%
                    </span>
                  </div>
                  <Progress 
                    value={percentage} 
                    className={`h-2 ${isOverBudget ? '[&>div]:bg-red-500' : ''}`}
                  />
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Add/Edit Form Dialog */}
      <Dialog open={showForm} onOpenChange={handleCloseForm}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingBudget ? 'Edit Budget Category' : 'Add Budget Category'}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label>Category</Label>
              <Select value={formData.category} onValueChange={(v) => setFormData({ ...formData, category: v })}>
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(categoryLabels).map(([value, label]) => (
                    <SelectItem key={value} value={value}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {formData.category === 'other' && (
              <div>
                <Label>Custom Category Name</Label>
                <Input
                  value={formData.category_name}
                  onChange={(e) => setFormData({ ...formData, category_name: e.target.value })}
                  placeholder="Enter category name"
                />
              </div>
            )}

            <div>
              <Label>Allocated Amount ($)</Label>
              <Input
                type="number"
                value={formData.allocated_amount}
                onChange={(e) => setFormData({ ...formData, allocated_amount: e.target.value })}
                placeholder="0.00"
                min="0"
                step="0.01"
              />
            </div>

            <div>
              <Label>Notes</Label>
              <Input
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="Optional notes"
              />
            </div>

            <div className="flex justify-end gap-3 pt-4">
              <Button type="button" variant="outline" onClick={handleCloseForm}>
                Cancel
              </Button>
              <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>
                {(createMutation.isPending || updateMutation.isPending) && (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                )}
                {editingBudget ? 'Update' : 'Create'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}