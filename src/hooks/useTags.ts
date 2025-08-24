import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Tag } from '../types';
import { useAuth } from '../context/AuthContext';
import { useToast } from '@/hooks/use-toast';

export const useTags = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [tags, setTags] = useState<Tag[]>([]);
  const [loading, setLoading] = useState(false);

  const loadTags = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('tags')
        .select('*')
        .eq('user_id', user.id)
        .order('name');

      if (error) throw error;

      const formattedTags = data.map((tag: any) => ({
        id: tag.id,
        userId: tag.user_id,
        name: tag.name,
        description: tag.description || '',
        color: tag.color,
        createdAt: new Date(tag.created_at)
      }));

      setTags(formattedTags);
    } catch (error: any) {
      console.error('Error loading tags:', error);
      toast({
        title: "Error",
        description: "Failed to load tags.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const saveTag = async (formData: {
    name: string;
    description: string;
    color: string;
  }, editingTag?: Tag) => {
    if (!user) return false;

    try {
      const tagData = {
        user_id: user.id,
        name: formData.name.trim(),
        description: formData.description.trim(),
        color: formData.color
      };

      if (editingTag) {
        // Update existing tag
        const { error } = await supabase
          .from('tags')
          .update(tagData)
          .eq('id', editingTag.id);

        if (error) throw error;

        toast({
          title: "Tag Updated",
          description: "Your tag has been updated successfully.",
        });
      } else {
        // Create new tag
        const { error } = await supabase
          .from('tags')
          .insert([tagData]);

        if (error) throw error;

        toast({
          title: "Tag Created",
          description: "Your new tag has been added.",
        });
      }

      await loadTags();
      return true;
    } catch (error: any) {
      console.error('Error saving tag:', error);
      toast({
        title: "Error",
        description: "Failed to save tag.",
        variant: "destructive"
      });
      return false;
    }
  };

  const deleteTag = async (tagId: string) => {
    try {
      const { error } = await supabase
        .from('tags')
        .delete()
        .eq('id', tagId);

      if (error) throw error;

      await loadTags();
      toast({
        title: "Tag Deleted",
        description: "The tag has been removed.",
      });
    } catch (error: any) {
      console.error('Error deleting tag:', error);
      toast({
        title: "Error",
        description: "Failed to delete tag.",
        variant: "destructive"
      });
    }
  };

  const checkTagNameExists = (name: string, excludeId?: string) => {
    return tags.some(tag => 
      tag.name.toLowerCase() === name.toLowerCase() && 
      tag.id !== excludeId
    );
  };

  useEffect(() => {
    if (user) {
      loadTags();
    }
  }, [user]);

  return {
    tags,
    loading,
    loadTags,
    saveTag,
    deleteTag,
    checkTagNameExists
  };
};