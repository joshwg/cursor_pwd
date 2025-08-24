import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { User } from '../types';
import { useAuth } from '../context/AuthContext';
import { useToast } from '@/hooks/use-toast';

export const useProfiles = () => {
  const { user: currentUser } = useAuth();
  const { toast } = useToast();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);

  const loadUsers = async () => {
    if (!currentUser?.isAdmin) return;
    
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select(`
          *,
          user_id
        `)
        .order('username');

      if (error) throw error;

      const formattedUsers = data.map((profile: any) => ({
        id: profile.user_id,
        username: profile.username || 'User',
        password: '', // Not stored in profile
        isAdmin: profile.is_admin || false,
        createdAt: new Date(profile.created_at),
        lastLogin: new Date() // We don't track this in Supabase auth
      }));

      setUsers(formattedUsers);
    } catch (error: any) {
      console.error('Error loading users:', error);
      toast({
        title: "Error",
        description: "Failed to load users.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const deleteUser = async (userId: string) => {
    if (!currentUser?.isAdmin) return false;

    try {
      // Note: This will delete the auth user, which will cascade to the profile
      // In a real app, you'd need admin privileges to delete users
      // For now, we'll just delete the profile (which won't work due to foreign key)
      const { error } = await supabase.auth.admin.deleteUser(userId);

      if (error) throw error;

      await loadUsers();
      toast({
        title: "User Deleted",
        description: "The user has been removed.",
      });
      return true;
    } catch (error: any) {
      console.error('Error deleting user:', error);
      toast({
        title: "Error",
        description: "Failed to delete user. This requires admin privileges.",
        variant: "destructive"
      });
      return false;
    }
  };

  const toggleUserAdmin = async (userId: string) => {
    if (!currentUser?.isAdmin || userId === currentUser.id) return false;

    try {
      const user = users.find(u => u.id === userId);
      if (!user) return false;

      const { error } = await supabase
        .from('profiles')
        .update({ is_admin: !user.isAdmin })
        .eq('user_id', userId);

      if (error) throw error;

      await loadUsers();
      toast({
        title: "User Updated",
        description: `User admin status has been ${user.isAdmin ? 'removed' : 'granted'}.`,
      });
      return true;
    } catch (error: any) {
      console.error('Error updating user:', error);
      toast({
        title: "Error",
        description: "Failed to update user.",
        variant: "destructive"
      });
      return false;
    }
  };

  useEffect(() => {
    if (currentUser?.isAdmin) {
      loadUsers();
    }
  }, [currentUser]);

  return {
    users,
    loading,
    loadUsers,
    deleteUser,
    toggleUserAdmin
  };
};