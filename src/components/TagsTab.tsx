import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Tag as TagType } from '../types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Plus, Trash2, Edit, Tag as TagIcon } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const TagsTab = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [tags, setTags] = useState<TagType[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    color: '#3b82f6'
  });

  const colors = [
    '#3b82f6', '#ef4444', '#10b981', '#f59e0b', 
    '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16'
  ];

  useEffect(() => {
    loadTags();
  }, [user]);

  const loadTags = () => {
    if (!user) return;
    const savedTags = localStorage.getItem('pm_tags');
    if (savedTags) {
      const allTags = JSON.parse(savedTags);
      setTags(allTags.filter((t: TagType) => t.userId === user.id));
    }
  };

  const saveTag = () => {
    if (!user || !formData.name.trim()) return;

    const newTag: TagType = {
      id: Date.now().toString(),
      userId: user.id,
      name: formData.name.trim(),
      color: formData.color,
      createdAt: new Date()
    };

    const savedTags = localStorage.getItem('pm_tags');
    const allTags = savedTags ? JSON.parse(savedTags) : [];
    allTags.push(newTag);
    localStorage.setItem('pm_tags', JSON.stringify(allTags));
    
    loadTags();
    setShowAddForm(false);
    setFormData({ name: '', color: '#3b82f6' });
    
    toast({
      title: "Tag Created",
      description: "Your new tag has been added.",
    });
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
          onClick={() => setShowAddForm(true)}
          className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Tag
        </Button>
      </div>

      {showAddForm && (
        <Card className="bg-slate-800/50 border-slate-700">
          <CardHeader>
            <CardTitle className="text-white">Create New Tag</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label className="text-slate-300">Tag Name</Label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                className="bg-slate-700/50 border-slate-600 text-white"
                placeholder="e.g., work, personal, banking"
              />
            </div>
            <div>
              <Label className="text-slate-300">Color</Label>
              <div className="flex space-x-2 mt-2">
                {colors.map((color) => (
                  <button
                    key={color}
                    className={`w-8 h-8 rounded-full border-2 ${
                      formData.color === color ? 'border-white' : 'border-slate-600'
                    }`}
                    style={{ backgroundColor: color }}
                    onClick={() => setFormData({...formData, color})}
                  />
                ))}
              </div>
            </div>
            <div className="flex space-x-2">
              <Button onClick={saveTag} className="bg-green-600 hover:bg-green-700">
                Create Tag
              </Button>
              <Button variant="outline" onClick={() => setShowAddForm(false)}>
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
              <div className="flex items-center justify-between">
                <Badge
                  style={{ backgroundColor: tag.color }}
                  className="text-white"
                >
                  {tag.name}
                </Badge>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => deleteTag(tag.id)}
                  className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
              <p className="text-xs text-slate-400 mt-2">
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
