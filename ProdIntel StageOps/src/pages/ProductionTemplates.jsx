import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '../api/base44Client';
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
  Copy, 
  Search, 
  MoreVertical, 
  Trash2, 
  Loader2,
  CheckCircle2,
  Users,
  ListTodo
} from 'lucide-react';

export default function ProductionTemplates() {
  const [searchTerm, setSearchTerm] = useState('');
  const queryClient = useQueryClient();

  const { data: templates = [], isLoading } = useQuery({
    queryKey: ['productionTemplates'],
    queryFn: () => base44.entities.ProductionTemplate.list('-usage_count'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.ProductionTemplate.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['productionTemplates'] }),
  });

  const filteredTemplates = templates.filter(t =>
    t.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    t.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const categoryLabel = (cat) =>
    cat?.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ') || 'Other';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Production Templates</h1>
          <p className="text-slate-500">Manage reusable production templates</p>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <Input
          placeholder="Search templates..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Templates Grid */}
      {isLoading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-slate-400" />
        </div>
      ) : filteredTemplates.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Copy className="w-12 h-12 text-slate-300 mb-4" />
            <h3 className="text-lg font-medium text-slate-900 mb-1">No templates found</h3>
            <p className="text-slate-500">
              {searchTerm ? 'Try adjusting your search' : 'Create templates from production detail pages'}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredTemplates.map((template) => {
            const taskCount = JSON.parse(template.template_tasks || '[]').length;
            const roleCount = JSON.parse(template.template_roles || '[]').length;

            return (
              <Card key={template.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-5">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                        <Copy className="w-5 h-5 text-blue-600" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-slate-900">{template.name}</h3>
                        <Badge variant="outline" className="mt-1 text-xs">
                          {categoryLabel(template.category)}
                        </Badge>
                      </div>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreVertical className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem 
                          onClick={() => deleteMutation.mutate(template.id)}
                          className="text-red-600"
                        >
                          <Trash2 className="w-4 h-4 mr-2" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>

                  {template.description && (
                    <p className="text-sm text-slate-600 mb-3 line-clamp-2">
                      {template.description}
                    </p>
                  )}

                  <div className="flex items-center gap-3 text-sm text-slate-500 mb-3">
                    <div className="flex items-center gap-1">
                      <ListTodo className="w-4 h-4" />
                      <span>{taskCount} tasks</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Users className="w-4 h-4" />
                      <span>{roleCount} roles</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-3 border-t">
                    <div className="flex items-center gap-2">
                      {template.is_public && (
                        <Badge variant="outline" className="text-xs">
                          Shared
                        </Badge>
                      )}
                      {template.usage_count > 0 && (
                        <Badge variant="outline" className="text-xs text-green-700">
                          <CheckCircle2 className="w-3 h-3 mr-1" />
                          Used {template.usage_count}x
                        </Badge>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}