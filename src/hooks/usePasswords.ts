import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { PasswordEntry, Tag } from '../types';
import { useAuth } from '../context/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { encrypt, decrypt, generateSalt, generateUserKey } from '../utils/encryption';

export const usePasswords = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [passwords, setPasswords] = useState<PasswordEntry[]>([]);
  const [loading, setLoading] = useState(false);

  const loadPasswords = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      // Fetch passwords with their tags
      const { data: passwordsData, error } = await supabase
        .from('passwords')
        .select(`
          *,
          password_tags (
            tag_id,
            tags (*)
          )
        `)
        .eq('user_id', user.id)
        .order('site');

      if (error) throw error;

      // Decrypt passwords and format with tagIds
      const encryptionKey = await ensureUserEncryptionKey();
      const decryptedPasswords = passwordsData.map((p: any) => ({
        id: p.id,
        userId: p.user_id,
        site: p.site,
        username: p.username,
        password: p.salt && p.password ? decrypt(p.password, encryptionKey, p.salt) : p.password || '',
        tagIds: p.password_tags.map((pt: any) => pt.tag_id),
        notes: p.salt && p.notes ? decrypt(p.notes, encryptionKey, p.salt) : p.notes || '',
        salt: p.salt,
        createdAt: new Date(p.created_at),
        updatedAt: new Date(p.updated_at)
      }));

      setPasswords(decryptedPasswords);
    } catch (error: any) {
      console.error('Error loading passwords:', error);
      toast({
        title: "Error",
        description: "Failed to load passwords.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const ensureUserEncryptionKey = async () => {
    if (!user) return '';

    // Check if user already has an encryption key
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('encryption_key')
      .eq('user_id', user.id)
      .single();

    if (error) {
      console.error('Error fetching profile:', error);
      return '';
    }

    if (!profile.encryption_key) {
      // Generate and save new encryption key
      const newKey = generateUserKey();
      await supabase
        .from('profiles')
        .update({ encryption_key: newKey })
        .eq('user_id', user.id);
      
      return newKey;
    }

    return profile.encryption_key;
  };

  const savePassword = async (formData: {
    site: string;
    username: string;
    password: string;
    tagIds: string[];
    notes: string;
  }, editingPassword?: PasswordEntry) => {
    if (!user) return false;

    try {
      const encryptionKey = await ensureUserEncryptionKey();
      const salt = generateSalt();

      const passwordData = {
        user_id: user.id,
        site: formData.site.trim(),
        username: formData.username.trim(),
        password: formData.password.trim() ? encrypt(formData.password, encryptionKey, salt) : '',
        notes: formData.notes.trim() ? encrypt(formData.notes.trim(), encryptionKey, salt) : '',
        salt
      };

      let passwordId: string;

      if (editingPassword) {
        // Update existing password
        const { error } = await supabase
          .from('passwords')
          .update(passwordData)
          .eq('id', editingPassword.id);

        if (error) throw error;
        passwordId = editingPassword.id;

        toast({
          title: "Password Updated",
          description: "Your password has been updated successfully.",
        });
      } else {
        // Create new password
        const { data, error } = await supabase
          .from('passwords')
          .insert([passwordData])
          .select()
          .single();

        if (error) throw error;
        passwordId = data.id;

        toast({
          title: "Password Saved",
          description: "Your password has been securely stored.",
        });
      }

      // Update password tags
      if (passwordId) {
        // Delete existing tags
        await supabase
          .from('password_tags')
          .delete()
          .eq('password_id', passwordId);

        // Insert new tags
        if (formData.tagIds.length > 0) {
          const tagInserts = formData.tagIds.map(tagId => ({
            password_id: passwordId,
            tag_id: tagId
          }));

          await supabase
            .from('password_tags')
            .insert(tagInserts);
        }
      }

      await loadPasswords();
      return true;
    } catch (error: any) {
      console.error('Error saving password:', error);
      toast({
        title: "Error",
        description: "Failed to save password.",
        variant: "destructive"
      });
      return false;
    }
  };

  const deletePassword = async (passwordId: string) => {
    try {
      const { error } = await supabase
        .from('passwords')
        .delete()
        .eq('id', passwordId);

      if (error) throw error;

      await loadPasswords();
      toast({
        title: "Password Deleted",
        description: "The password has been removed.",
      });
    } catch (error: any) {
      console.error('Error deleting password:', error);
      toast({
        title: "Error",
        description: "Failed to delete password.",
        variant: "destructive"
      });
    }
  };

  useEffect(() => {
    if (user) {
      loadPasswords();
    }
  }, [user]);

  return {
    passwords,
    loading,
    loadPasswords,
    savePassword,
    deletePassword
  };
};