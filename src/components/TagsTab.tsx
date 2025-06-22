
import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Tag as TagType } from '../types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Plus, Trash2, Edit, Tag as TagIcon, Palette } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const TagsTab = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [tags, setTags] = useState<TagType[]>([]);
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

  useEffect(() => {
    loadTags();
  }, [user]);

  const loadTags = () => {
    if (!user) return;
    const savedTags = localStorage.getItem('pm_tags');
    if (savedTags) {
      const allTags = JSON.parse(savedTags);
      const userTags = allTags.filter((t: TagType) => t.userId === user.id);
      // Sort alphabetically, case insensitive
      userTags.sort((a: TagType, b: TagType) => 
        a.name.toLowerCase().localeCompare(b.name.toLowerCase())
      );
      setTags(userTags);
    }
  };

  const resetForm = () => {
    setFormData({ name: '', description: '', color: '#3b82f6' });
    setShowAddForm(false);
    setEditingTag(null);
  };

  const checkTagNameExists = (name: string, excludeId?: string) => {
    return tags.some(tag => 
      tag.name.toLowerCase() === name.toLowerCase() && 
      tag.id !== excludeId
    );
  };

  const saveTag = () => {
    if (!user || !formData.name.trim()) {
      toast({
        title: "Error",
        description: "Tag name is required.",
        variant: "destructive"
      });
      return;
    }

    // Validate tag name length
    if (formData.name.trim().length > 40) {
      toast({
        title: "Error",
        description: "Tag name must be 40 characters or less.",
        variant: "destructive"
      });
      return;
    }

    // Validate description length
    if (formData.description.length > 255) {
      toast({
        title: "Error",
        description: "Tag description must be 255 characters or less.",
        variant: "destructive"
      });
      return;
    }

    // Check for duplicate names
    if (checkTagNameExists(formData.name.trim(), editingTag?.id)) {
      toast({
        title: "Error",
        description: "A tag with this name already exists.",
        variant: "destructive"
      });
      return;
    }

    const savedTags = localStorage.getItem('pm_tags');
    const allTags = savedTags ? JSON.parse(savedTags) : [];

    if (editingTag) {
      // Update existing tag
      const updatedTag: TagType = {
        ...editingTag,
        name: formData.name.trim(),
        description: formData.description.trim(),
        color: formData.color
      };

      const tagIndex = allTags.findIndex((t: TagType) => t.id === editingTag.id);
      if (tagIndex !== -1) {
        allTags[tagIndex] = updatedTag;
      }

      toast({
        title: "Tag Updated",
        description: "Your tag has been updated successfully.",
      });
    } else {
      // Create new tag
      const newTag: TagType = {
        id: Date.now().toString(),
        userId: user.id,
        name: formData.name.trim(),
        description: formData.description.trim(),
        color: formData.color,
        createdAt: new Date()
      };

      allTags.push(newTag);

      toast({
        title: "Tag Created",
        description: "Your new tag has been added.",
      });
    }

    localStorage.setItem('pm_tags', JSON.stringify(allTags));
    loadTags();
    resetForm();
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

  const deleteTag = (tagId: string) => {
    const savedTags = localStorage.getItem('pm_tags');
    if (savedTags) {
      const allTags = JSON.parse(savedTags);
      const filteredTags = allTags.filter((t: TagType) => t.id !== tagId);
      localStorage.setItem('pm_tags', JSON.stringify(filteredTags));
      loadTags();
      
      toast({
        title: "Tag Deleted",
        description: "The tag has been removed.",
      });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold text-white">Manage Tags</h2>
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
              <p className="text-xs text-slate-400 mt-1">
                {formData.name.length}/40 characters
              </p>
            </div>
            <div>
              <Label className="text-slate-300">Description</Label>
              <Input
                value={formData.description}
                onChange={(e) => setFormData({...formData, description: e.target.value})}
                className="bg-slate-700/50 border-slate-600 text-white"
                placeholder="Optional description for this tag"
                maxLength={255}
              />
              <p className="text-xs text-slate-400 mt-1">
                {formData.description.length}/255 characters
              </p>
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
              <div className="mt-2">
                <Input
                  type="color"
                  value={formData.color}
                  onChange={(e) => setFormData({...formData, color: e.target.value})}
                  className="w-16 h-8 bg-slate-700/50 border-slate-600"
                  title="Custom color"
                />
              </div>
            </div>
            <div className="flex space-x-2">
              <Button onClick={saveTag} className="bg-green-600 hover:bg-green-700">
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
                  style={{ backgroundColor: tag.color }}
                  className="text-white font-medium"
                >
                  {tag.name}
                </Badge>
                <div className="flex space-x-1">
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
                <p className="text-sm text-slate-300 mb-2">{tag.description}</p>
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
