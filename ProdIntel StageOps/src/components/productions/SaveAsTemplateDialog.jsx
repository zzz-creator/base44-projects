import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '../../api/base44Client';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Textarea } from '../../components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
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
import { Checkbox } from '../../components/ui/checkbox';
import { Loader2 } from 'lucide-react';

const categories = [
  'theater',
  'concert',
  'corporate_event',
  'conference',
  'workshop',
  'other'
];

export default function SaveAsTemplateDialog({ 
  open, 
  onClose, 
  production, 
  tasks = [],
  crewRoles = [] 
}) {
  const [formData, setFormData] = useState({
    name: `${production?.name} Template`,
    description: '',
    category: 'theater',
    is_public: false,
  });
  const [error, setError] = useState('');

  const queryClient = useQueryClient();

  const createTemplateMutation = useMutation({
    mutationFn: async (templateData) => {
      // Prepare task templates
      const templateTasks = tasks.map(t => ({
        task_name: t.task_name,
        description: t.description,
        priority: t.priority,
        category: t.category,
        estimated_hours: t.estimated_hours,
      }));

      // Prepare role templates
      const templateRoles = crewRoles.map(r => ({
        role: r.role,
        estimated_count: 1,
      }));

      return base44.entities.ProductionTemplate.create({
        ...templateData,
        template_tasks: JSON.stringify(templateTasks),
        template_roles: JSON.stringify(templateRoles),
        default_settings: JSON.stringify({
          status: production?.status || 'planning',
        }),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['productionTemplates'] });
      handleClose();
    },
    onError: (err) => {
      setError(err.message || 'Failed to save template');
    },
  });

  const handleClose = () => {
    setFormData({
      name: `${production?.name} Template`,
      description: '',
      category: 'theater',
      is_public: false,
    });
    setError('');
    onClose();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      setError('Template name is required');
      return;
    }
    createTemplateMutation.mutate(formData);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Save as Template</DialogTitle>
          <DialogDescription>
            Create a reusable template from this production setup
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-sm font-medium text-slate-700 block mb-1">
              Template Name
            </label>
            <Input
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g., Standard Theater Production"
            />
          </div>

          <div>
            <label className="text-sm font-medium text-slate-700 block mb-1">
              Description
            </label>
            <Textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Describe when this template is useful..."
              className="h-24"
            />
          </div>

          <div>
            <label className="text-sm font-medium text-slate-700 block mb-1">
              Category
            </label>
            <Select
              value={formData.category}
              onValueChange={(value) => setFormData({ ...formData, category: value })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {categories.map((cat) => (
                  <SelectItem key={cat} value={cat}>
                    {cat.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center gap-2 p-3 bg-slate-50 rounded-lg">
            <Checkbox
              id="is_public"
              checked={formData.is_public}
              onCheckedChange={(checked) => setFormData({ ...formData, is_public: checked })}
            />
            <label htmlFor="is_public" className="text-sm text-slate-700 cursor-pointer">
              Share with team
            </label>
          </div>

          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
              {error}
            </div>
          )}

          <div className="flex gap-3 justify-end">
            <Button variant="outline" onClick={handleClose} type="button">
              Cancel
            </Button>
            <Button
              className="bg-blue-600 hover:bg-blue-700"
              disabled={createTemplateMutation.isPending}
            >
              {createTemplateMutation.isPending && (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              )}
              Save Template
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}