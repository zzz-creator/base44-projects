import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '../api/base44Client';
import { 
  FileText, 
  Plus, 
  Search, 
  MoreVertical,
  Pencil,
  Trash2,
  Loader2,
  Calendar,
  AlertTriangle
} from 'lucide-react';
import { Card, CardContent } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Badge } from '../components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '../components/ui/dropdown-menu';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../components/ui/select';
import { format, differenceInDays } from 'date-fns';
import ProcedureForm from '../components/procedures/ProcedureForm';

const categoryColors = {
  safety: 'bg-red-100 text-red-700',
  technical: 'bg-purple-100 text-purple-700',
  operational: 'bg-blue-100 text-blue-700',
  emergency: 'bg-orange-100 text-orange-700',
  maintenance: 'bg-amber-100 text-amber-700',
  setup: 'bg-green-100 text-green-700',
  teardown: 'bg-teal-100 text-teal-700',
};

const categoryLabels = {
  safety: 'Safety',
  technical: 'Technical',
  operational: 'Operational',
  emergency: 'Emergency',
  maintenance: 'Maintenance',
  setup: 'Setup',
  teardown: 'Teardown',
};

export default function Procedures() {
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [showForm, setShowForm] = useState(false);
  const [editingProcedure, setEditingProcedure] = useState(null);

  const queryClient = useQueryClient();

  const { data: procedures = [], isLoading } = useQuery({
    queryKey: ['procedures'],
    queryFn: () => base44.entities.ProcedureLibrary.list('-updated_date'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.ProcedureLibrary.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['procedures'] }),
  });

  const filteredProcedures = procedures.filter(proc => {
    const matchesSearch = 
      proc.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      proc.description?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = categoryFilter === 'all' || proc.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  const isOverdueForReview = (lastReviewedDate) => {
    if (!lastReviewedDate) return true;
    return differenceInDays(new Date(), new Date(lastReviewedDate)) > 365;
  };

  const handleEdit = (procedure) => {
    setEditingProcedure(procedure);
    setShowForm(true);
  };

  const handleCloseForm = () => {
    setShowForm(false);
    setEditingProcedure(null);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Procedure Library</h1>
          <p className="text-slate-500">Standard operating procedures</p>
        </div>
        <Button onClick={() => setShowForm(true)} className="bg-blue-600 hover:bg-blue-700">
          <Plus className="w-4 h-4 mr-2" />
          Add Procedure
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input
            placeholder="Search procedures..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger className="w-full sm:w-40">
            <SelectValue placeholder="Category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            {Object.entries(categoryLabels).map(([value, label]) => (
              <SelectItem key={value} value={value}>{label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Procedures List */}
      {isLoading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-slate-400" />
        </div>
      ) : filteredProcedures.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <FileText className="w-12 h-12 text-slate-300 mb-4" />
            <h3 className="text-lg font-medium text-slate-900 mb-1">No procedures found</h3>
            <p className="text-slate-500 mb-4">
              {searchTerm || categoryFilter !== 'all'
                ? 'Try adjusting your filters' 
                : 'Create your first procedure'}
            </p>
            {!searchTerm && categoryFilter === 'all' && (
              <Button onClick={() => setShowForm(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Add Procedure
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {filteredProcedures.map((procedure) => (
            <Card key={procedure.id} className="hover:shadow-sm transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3 flex-1">
                    <div className={`p-2 rounded-lg ${
                      procedure.category === 'safety' ? 'bg-red-100' :
                      procedure.category === 'emergency' ? 'bg-orange-100' : 'bg-blue-100'
                    }`}>
                      <FileText className={`w-5 h-5 ${
                        procedure.category === 'safety' ? 'text-red-600' :
                        procedure.category === 'emergency' ? 'text-orange-600' : 'text-blue-600'
                      }`} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-semibold text-slate-900">{procedure.title}</h3>
                        <Badge className={categoryColors[procedure.category]}>
                          {categoryLabels[procedure.category]}
                        </Badge>
                        {isOverdueForReview(procedure.last_reviewed_date) && (
                          <Badge variant="outline" className="text-amber-600 border-amber-300">
                            <AlertTriangle className="w-3 h-3 mr-1" />
                            Needs Review
                          </Badge>
                        )}
                      </div>
                      {procedure.description && (
                        <p className="text-sm text-slate-600 mt-1 line-clamp-2">{procedure.description}</p>
                      )}
                      <div className="flex items-center gap-4 mt-2 text-xs text-slate-500">
                        <span>Version {procedure.version || 1}</span>
                        {procedure.last_reviewed_date && (
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            Reviewed: {format(new Date(procedure.last_reviewed_date), 'MMM d, yyyy')}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <MoreVertical className="w-4 h-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => handleEdit(procedure)}>
                        <Pencil className="w-4 h-4 mr-2" />
                        Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        onClick={() => deleteMutation.mutate(procedure.id)}
                        className="text-red-600"
                      >
                        <Trash2 className="w-4 h-4 mr-2" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <ProcedureForm
        open={showForm}
        onClose={handleCloseForm}
        procedure={editingProcedure}
      />
    </div>
  );
}