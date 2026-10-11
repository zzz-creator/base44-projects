import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '../api/base44Client';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../utils';
import { 
  ClipboardList, 
  Plus, 
  Search, 
  MoreVertical,
  Pencil,
  Trash2,
  Loader2,
  Theater,
  FileText
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
import CueDocForm from '../components/cuedocs/CueDocForm';
import CueDocGenerator from '../components/cuedocs/CueDocGenerator';

const departmentColors = {
  lighting: 'bg-yellow-100 text-yellow-700',
  sound: 'bg-blue-100 text-blue-700',
  staging: 'bg-purple-100 text-purple-700',
  video: 'bg-cyan-100 text-cyan-700',
  fly: 'bg-green-100 text-green-700',
  props: 'bg-orange-100 text-orange-700',
  special_effects: 'bg-red-100 text-red-700',
};

const departmentLabels = {
  lighting: 'Lighting',
  sound: 'Sound',
  staging: 'Staging',
  video: 'Video',
  fly: 'Fly',
  props: 'Props',
  special_effects: 'Special Effects',
};

export default function CueDocs() {
  const [searchTerm, setSearchTerm] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('all');
  const [productionFilter, setProductionFilter] = useState('all');
  const [showForm, setShowForm] = useState(false);
  const [editingCue, setEditingCue] = useState(null);
  const [showGenerator, setShowGenerator] = useState(false);
  const [selectedProduction, setSelectedProduction] = useState(null);

  const queryClient = useQueryClient();

  const { data: cueDocs = [], isLoading } = useQuery({
    queryKey: ['cueDocs'],
    queryFn: () => base44.entities.CueDocumentation.list('cue_number'),
  });

  const { data: productions = [] } = useQuery({
    queryKey: ['productions'],
    queryFn: () => base44.entities.Production.list(),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.CueDocumentation.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['cueDocs'] }),
  });

  const getProductionName = (productionId) => {
    const production = productions.find(p => p.id === productionId);
    return production?.name || 'Unknown';
  };

  const filteredCues = cueDocs.filter(cue => {
    const matchesSearch = 
      cue.cue_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      cue.description?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesDepartment = departmentFilter === 'all' || cue.department === departmentFilter;
    const matchesProduction = productionFilter === 'all' || cue.production_id === productionFilter;
    return matchesSearch && matchesDepartment && matchesProduction;
  });

  // Group by production
  const groupedByProduction = filteredCues.reduce((acc, cue) => {
    const prodId = cue.production_id || 'unassigned';
    if (!acc[prodId]) acc[prodId] = [];
    acc[prodId].push(cue);
    return acc;
  }, {});

  const handleEdit = (cue) => {
    setEditingCue(cue);
    setShowForm(true);
  };

  const handleCloseForm = () => {
    setShowForm(false);
    setEditingCue(null);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Cue Documentation</h1>
          <p className="text-slate-500">Technical cue sheets by production</p>
        </div>
        <Button onClick={() => setShowForm(true)} className="bg-blue-600 hover:bg-blue-700">
          <Plus className="w-4 h-4 mr-2" />
          Add Cue
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input
            placeholder="Search cues..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={productionFilter} onValueChange={setProductionFilter}>
          <SelectTrigger className="w-full sm:w-44">
            <SelectValue placeholder="Production" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Productions</SelectItem>
            {productions.map((prod) => (
              <SelectItem key={prod.id} value={prod.id}>{prod.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={departmentFilter} onValueChange={setDepartmentFilter}>
          <SelectTrigger className="w-full sm:w-40">
            <SelectValue placeholder="Department" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Departments</SelectItem>
            {Object.entries(departmentLabels).map(([value, label]) => (
              <SelectItem key={value} value={value}>{label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Cue List */}
      {isLoading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-slate-400" />
        </div>
      ) : filteredCues.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <ClipboardList className="w-12 h-12 text-slate-300 mb-4" />
            <h3 className="text-lg font-medium text-slate-900 mb-1">No cue documentation</h3>
            <p className="text-slate-500 mb-4">
              {searchTerm || departmentFilter !== 'all' || productionFilter !== 'all'
                ? 'Try adjusting your filters' 
                : 'Add your first cue documentation'}
            </p>
            {!searchTerm && departmentFilter === 'all' && productionFilter === 'all' && (
              <Button onClick={() => setShowForm(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Add Cue
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {Object.entries(groupedByProduction).map(([prodId, cues]) => (
            <div key={prodId}>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Theater className="w-4 h-4 text-slate-400" />
                  <h3 className="font-semibold text-slate-700">
                    {prodId === 'unassigned' ? 'Unassigned' : (
                      <Link 
                        to={createPageUrl(`ProductionDetail?id=${prodId}`)}
                        className="hover:text-blue-600"
                      >
                        {getProductionName(prodId)}
                      </Link>
                    )}
                  </h3>
                  <Badge variant="outline" className="text-xs">{cues.length} cues</Badge>
                </div>
                {prodId !== 'unassigned' && (
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => {
                      const prod = productions.find(p => p.id === prodId);
                      setSelectedProduction(prod);
                      setShowGenerator(true);
                    }}
                  >
                    <FileText className="w-4 h-4 mr-1" />
                    Generate Doc
                  </Button>
                )}
              </div>
              <div className="space-y-2">
                {cues.map((cue) => (
                  <Card key={cue.id} className="hover:shadow-sm transition-shadow">
                    <CardContent className="p-3">
                      <div className="flex items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                          <div className="w-16 text-center">
                            <span className="font-mono font-bold text-lg text-slate-900">
                              {cue.cue_number}
                            </span>
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="text-slate-700">{cue.description}</p>
                            {cue.notes && (
                              <p className="text-xs text-slate-500 mt-1">{cue.notes}</p>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge className={departmentColors[cue.department]}>
                            {departmentLabels[cue.department]}
                          </Badge>
                          <Badge variant="outline" className="text-xs">
                            Rev {cue.revision_number || 1}
                          </Badge>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8">
                                <MoreVertical className="w-4 h-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => handleEdit(cue)}>
                                <Pencil className="w-4 h-4 mr-2" />
                                Edit
                              </DropdownMenuItem>
                              <DropdownMenuItem 
                                onClick={() => deleteMutation.mutate(cue.id)}
                                className="text-red-600"
                              >
                                <Trash2 className="w-4 h-4 mr-2" />
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      <CueDocForm
        open={showForm}
        onClose={handleCloseForm}
        cue={editingCue}
        productions={productions}
      />

      <CueDocGenerator
        open={showGenerator}
        onClose={() => {
          setShowGenerator(false);
          setSelectedProduction(null);
        }}
        production={selectedProduction}
      />
    </div>
  );
}