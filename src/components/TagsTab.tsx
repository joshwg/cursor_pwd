import React, { useState } from 'react';
import { Tag as TagType } from '../types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Plus, Trash2, Edit, Tag as TagIcon, Download } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { getContrastColor, ensureHexColor } from '../utils/colorUtils';
import { exportToCsv } from '../utils/dataUtils';
import { useTags } from '../hooks/useTags';

const TagsTab = () => {
  const { toast } = useToast();
  const { tags, loading, saveTag, deleteTag, checkTagNameExists } = useTags();
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingTag, setEditingTag] = useState<TagType | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    color: '#3b82f6'
  });

  const colors = [
    '#3b82f6', '#ef4444', '#10b981', '#f59e0b', 
    '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16',
    '#f97316', '#14b8a6', '#a855f7', '#dc2626'
  ];

  const resetForm = () => {
    setFormData({ name: '', description: '', color: '#3b82f6' });
    setShowAddForm(false);
    setEditingTag(null);
  };

  const handleSave = async () => {
    if (!formData.name.trim()) {
      toast({
        title: "Error",
        description: "Tag name is required.",
        variant: "destructive"
      });
      return;
    }

    if (checkTagNameExists(formData.name.trim(), editingTag?.id)) {
      toast({
        title: "Error",
        description: "A tag with this name already exists.",
        variant: "destructive"
      });
      return;
    }

    const success = await saveTag(formData, editingTag || undefined);
    if (success) {
      resetForm();
    }
  };

  const startEditTag = (tag: TagType) => {
    setEditingTag(tag);
    setFormData({
      name: tag.name,
      description: tag.description,
      color: tag.color
    });
    setShowAddForm(true);
  };

  const exportTags = () => {
    if (tags.length === 0) {
      toast({
        title: "No Tags to Export",
        description: "You don't have any tags to export.",
        variant: "destructive"
      });
      return;
    }

    const exportData = tags.map(tag => ({
      name: tag.name,
      description: tag.description,
      color: ensureHexColor(tag.color),
      createdAt: new Date(tag.createdAt).toISOString()
    }));

    const filename = `tags_export_${new Date().toISOString().split('T')[0]}.csv`;
    exportToCsv(exportData, filename);

    toast({
      title: "Export Complete",
      description: `Successfully exported ${tags.length} tags to ${filename}`,
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-white">Loading tags...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold text-white">Manage Tags</h2>
        <div className="flex items-center space-x-2">
          <Button
            onClick={exportTags}
            variant="outline"
            className="bg-slate-700/50 border-slate-600 text-slate-300 hover:bg-slate-600/50"
          >
            <Download className="w-4 h-4 mr-2" />
            Export Tags
          </Button>
          <Button
            onClick={() => {
              resetForm();
              setShowAddForm(true);
            }}
            className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Tag
          </Button>
        </div>
      </div>

      {showAddForm && (
        <Card className="bg-slate-800/50 border-slate-700">
          <CardHeader>
            <CardTitle className="text-white">
              {editingTag ? 'Edit Tag' : 'Create New Tag'}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label className="text-slate-300">Tag Name *</Label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                className="bg-slate-700/50 border-slate-600 text-white"
                placeholder="e.g., work, personal, banking"
                maxLength={40}
              />
            </div>
            <div>
              <Label className="text-slate-300">Description</Label>
              <Textarea
                value={formData.description}
                onChange={(e) => setFormData({...formData, description: e.target.value})}
                className="bg-slate-700/50 border-slate-600 text-white"
                placeholder="Optional description for this tag"
                maxLength={255}
                rows={3}
              />
            </div>
            <div>
              <Label className="text-slate-300">Color</Label>
              <div className="flex flex-wrap gap-2 mt-2">
                {colors.map((color) => (
                  <button
                    key={color}
                    className={`w-8 h-8 rounded-full border-2 transition-all hover:scale-110 ${
                      formData.color === color ? 'border-white shadow-lg' : 'border-slate-600'
                    }`}
                    style={{ backgroundColor: color }}
                    onClick={() => setFormData({...formData, color})}
                    title={color}
                  />
                ))}
              </div>
            </div>
            <div className="flex space-x-2">
              <Button onClick={handleSave} className="bg-green-600 hover:bg-green-700">
                {editingTag ? 'Update Tag' : 'Create Tag'}
              </Button>
              <Button variant="outline" onClick={resetForm}>
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {tags.map((tag) => (
          <Card key={tag.id} className="bg-slate-800/50 border-slate-700">
            <CardContent className="p-4">
              <div className="flex items-start justify-between mb-2">
                <Badge
                  style={{ 
                    backgroundColor: tag.color,
                    color: getContrastColor(tag.color)
                  }}
                  className="font-medium break-all-force flex-1 mr-2 min-h-6 py-1 px-2 leading-tight max-w-full"
                >
                  {tag.name}
                </Badge>
                <div className="flex space-x-1 flex-shrink-0">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => startEditTag(tag)}
                    className="text-blue-400 hover:text-blue-300 hover:bg-blue-500/10"
                  >
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => deleteTag(tag.id)}
                    className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
              {tag.description && (
                <p className="text-sm text-slate-300 mb-2 whitespace-pre-wrap">{tag.description}</p>
              )}
              <p className="text-xs text-slate-400">
                Created {new Date(tag.createdAt).toLocaleDateString()}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {tags.length === 0 && (
        <div className="text-center py-12">
          <div className="w-16 h-16 bg-slate-700 rounded-full flex items-center justify-center mx-auto mb-4">
            <TagIcon className="w-8 h-8 text-slate-400" />
          </div>
          <h3 className="text-xl font-semibold text-white mb-2">No tags yet</h3>
          <p className="text-slate-400">Create tags to organize your passwords.</p>
        </div>
      )}
    </div>
  );
};

export default TagsTab;