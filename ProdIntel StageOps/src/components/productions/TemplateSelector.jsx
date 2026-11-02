import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '../../api/base44Client';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '../../components/ui/dialog';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Card, CardContent } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { Search, Loader2, Copy } from 'lucide-react';

export default function TemplateSelector({ open, onClose, onSelectTemplate }) {
  const [searchTerm, setSearchTerm] = useState('');

  const { data: templates = [], isLoading } = useQuery({
    queryKey: ['productionTemplates'],
    queryFn: () => base44.entities.ProductionTemplate.list('-created_date'),
    enabled: open,
  });

  const filteredTemplates = templates.filter(t =>
    t.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    t.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSelectTemplate = (template) => {
    const parsedTemplate = {
      ...template,
      template_tasks: JSON.parse(template.template_tasks || '[]'),
      template_roles: JSON.parse(template.template_roles || '[]'),
      default_settings: JSON.parse(template.default_settings || '{}'),
    };
    onSelectTemplate(parsedTemplate);
    onClose();
  };

  const categoryLabel = (cat) =>
    cat?.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ') || 'Other';

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[80vh]">
        <DialogHeader>
          <DialogTitle>Select Template</DialogTitle>
          <DialogDescription>
            Choose a template to use as a starting point for your production
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input
              placeholder="Search templates..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>

          {isLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
            </div>
          ) : filteredTemplates.length === 0 ? (
            <div className="text-center py-8">
              <Copy className="w-10 h-10 mx-auto mb-2 text-slate-300" />
              <p className="text-slate-500">
                {searchTerm ? 'No templates match your search' : 'No templates available'}
              </p>
            </div>
          ) : (
            <div className="space-y-2 max-h-[calc(80vh-200px)] overflow-y-auto">
              {filteredTemplates.map((template) => {
                const taskCount = JSON.parse(template.template_tasks || '[]').length;
                const roleCount = JSON.parse(template.template_roles || '[]').length;

                return (
                  <Card key={template.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-slate-900">{template.name}</h3>
                          {template.description && (
                            <p className="text-sm text-slate-600 mt-1 line-clamp-2">
                              {template.description}
                            </p>
                          )}
                          <div className="flex gap-2 mt-2 flex-wrap">
                            <Badge variant="outline" className="text-xs">
                              {categoryLabel(template.category)}
                            </Badge>
                            {taskCount > 0 && (
                              <Badge variant="outline" className="text-xs">
                                {taskCount} tasks
                              </Badge>
                            )}
                            {roleCount > 0 && (
                              <Badge variant="outline" className="text-xs">
                                {roleCount} roles
                              </Badge>
                            )}
                            {template.usage_count > 0 && (
                              <Badge variant="outline" className="text-xs text-green-700">
                                Used {template.usage_count} times
                              </Badge>
                            )}
                          </div>
                        </div>
                        <Button
                          onClick={() => handleSelectTemplate(template)}
                          className="bg-blue-600 hover:bg-blue-700 whitespace-nowrap"
                        >
                          Use Template
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}