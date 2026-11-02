import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '../api/base44Client';
import { 
  BookOpen, 
  Plus, 
  Search,
  MoreVertical,
  Pencil,
  Trash2,
  Loader2,
  FileText,
  Calendar
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
import { format } from 'date-fns';
import KnowledgeForm from '../components/knowledge/KnowledgeForm';

const categoryColors = {
  procedure: 'bg-blue-100 text-blue-700',
  technical: 'bg-purple-100 text-purple-700',
  safety: 'bg-red-100 text-red-700',
  reference: 'bg-green-100 text-green-700',
  lesson_learned: 'bg-amber-100 text-amber-700',
  other: 'bg-slate-100 text-slate-700',
};

const categoryLabels = {
  procedure: 'Procedure',
  technical: 'Technical',
  safety: 'Safety',
  reference: 'Reference',
  lesson_learned: 'Lesson Learned',
  other: 'Other',
};

export default function Knowledge() {
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [showForm, setShowForm] = useState(false);
  const [editingRecord, setEditingRecord] = useState(null);

  const queryClient = useQueryClient();

  const { data: records = [], isLoading } = useQuery({
    queryKey: ['knowledgeRecords'],
    queryFn: () => base44.entities.KnowledgeRecord.list('-updated_date'),
  });

  const { data: productions = [] } = useQuery({
    queryKey: ['productions'],
    queryFn: () => base44.entities.Production.list(),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.KnowledgeRecord.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['knowledgeRecords'] }),
  });

  const getProductionName = (productionId) => {
    const production = productions.find(p => p.id === productionId);
    return production?.name || '';
  };

  const filteredRecords = records.filter(record => {
    const matchesSearch = 
      record.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      record.content?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      record.tags?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = categoryFilter === 'all' || record.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  const handleEdit = (record) => {
    setEditingRecord(record);
    setShowForm(true);
  };

  const handleCloseForm = () => {
    setShowForm(false);
    setEditingRecord(null);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Knowledge Base</h1>
          <p className="text-slate-500">Documentation and reference materials</p>
        </div>
        <Button onClick={() => setShowForm(true)} className="bg-blue-600 hover:bg-blue-700">
          <Plus className="w-4 h-4 mr-2" />
          Add Record
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input
            placeholder="Search knowledge base..."
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

      {/* Records Grid */}
      {isLoading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-slate-400" />
        </div>
      ) : filteredRecords.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <BookOpen className="w-12 h-12 text-slate-300 mb-4" />
            <h3 className="text-lg font-medium text-slate-900 mb-1">No records found</h3>
            <p className="text-slate-500 mb-4">
              {searchTerm || categoryFilter !== 'all'
                ? 'Try adjusting your search' 
                : 'Start building your knowledge base'}
            </p>
            {!searchTerm && categoryFilter === 'all' && (
              <Button onClick={() => setShowForm(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Add Record
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredRecords.map((record) => (
            <Card key={record.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-5">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-lg bg-emerald-100 flex items-center justify-center flex-shrink-0">
                      <FileText className="w-5 h-5 text-emerald-600" />
                    </div>
                    <div className="min-w-0">
                      <h3 className="font-semibold text-slate-900 line-clamp-1">{record.title}</h3>
                      <Badge className={`${categoryColors[record.category]} text-xs mt-1`}>
                        {categoryLabels[record.category]}
                      </Badge>
                    </div>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8 flex-shrink-0">
                        <MoreVertical className="w-4 h-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => handleEdit(record)}>
                        <Pencil className="w-4 h-4 mr-2" />
                        Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        onClick={() => deleteMutation.mutate(record.id)}
                        className="text-red-600"
                      >
                        <Trash2 className="w-4 h-4 mr-2" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>

                {record.content && (
                  <p className="text-sm text-slate-600 line-clamp-2 mb-3">{record.content}</p>
                )}

                <div className="flex items-center justify-between text-xs text-slate-500">
                  {record.production_id ? (
                    <span>{getProductionName(record.production_id)}</span>
                  ) : (
                    <span>General</span>
                  )}
                  {record.updated_date && (
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {format(new Date(record.updated_date), 'MMM d')}
                    </span>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <KnowledgeForm
        open={showForm}
        onClose={handleCloseForm}
        record={editingRecord}
        productions={productions}
      />
    </div>
  );
}