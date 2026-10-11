import React, { useState, useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '../../api/base44Client';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '../../components/ui/dialog';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Textarea } from '../../components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../components/ui/select';
import { Loader2 } from 'lucide-react';

const initialFormState = {
  title: '',
  category: '',
  content: '',
  production_id: '',
  tags: '',
};

export default function KnowledgeForm({ open, onClose, record, productions = [] }) {
  const [formData, setFormData] = useState(initialFormState);
  const queryClient = useQueryClient();

  useEffect(() => {
    if (record) {
      setFormData({
        title: record.title || '',
        category: record.category || '',
        content: record.content || '',
        production_id: record.production_id || '',
        tags: record.tags || '',
      });
    } else {
      setFormData(initialFormState);
    }
  }, [record, open]);

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.KnowledgeRecord.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['knowledgeRecords'] });
      onClose();
    },
  });

  const updateMutation = useMutation({
    mutationFn: (data) => base44.entities.KnowledgeRecord.update(record.id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['knowledgeRecords'] });
      onClose();
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    const data = { ...formData };
    if (!data.production_id) delete data.production_id;
    
    if (record) {
      updateMutation.mutate(data);
    } else {
      createMutation.mutate(data);
    }
  };

  const isLoading = createMutation.isPending || updateMutation.isPending;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {record ? 'Edit Knowledge Record' : 'Add Knowledge Record'}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="title">Title *</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="Record title"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="category">Category *</Label>
              <Select
                value={formData.category}
                onValueChange={(value) => setFormData({ ...formData, category: value })}
                required
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="procedure">Procedure</SelectItem>
                  <SelectItem value="technical">Technical</SelectItem>
                  <SelectItem value="safety">Safety</SelectItem>
                  <SelectItem value="reference">Reference</SelectItem>
                  <SelectItem value="lesson_learned">Lesson Learned</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="production_id">Production</Label>
              <Select
                value={formData.production_id}
                onValueChange={(value) => setFormData({ ...formData, production_id: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="General" />
                </SelectTrigger>
                <SelectContent>
                  {productions.map((prod) => (
                    <SelectItem key={prod.id} value={prod.id}>
                      {prod.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label htmlFor="content">Content</Label>
            <Textarea
              id="content"
              value={formData.content}
              onChange={(e) => setFormData({ ...formData, content: e.target.value })}
              placeholder="Knowledge content..."
              rows={5}
            />
          </div>

          <div>
            <Label htmlFor="tags">Tags</Label>
            <Input
              id="tags"
              value={formData.tags}
              onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
              placeholder="Comma-separated tags"
            />
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {record ? 'Update' : 'Add'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}