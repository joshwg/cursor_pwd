import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { PasswordEntry, Tag } from '../types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Plus, Eye, EyeOff, Copy, Edit, Trash2, Key, Search, Import, Download } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import TagDropzone from './TagDropzone';
import { getContrastColor } from '../utils/colorUtils';
import { 
  checkPasswordExists, 
  sortPasswordsAlphabetically, 
  sortAlphabetically, 
  limitResults,
  exportToCsv 
} from '../utils/dataUtils';
import { encrypt, decrypt, generateSalt, generateUserKey } from '../utils/encryption';

const PasswordsTab = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [passwords, setPasswords] = useState<PasswordEntry[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [filteredPasswords, setFilteredPasswords] = useState<PasswordEntry[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingPassword, setEditingPassword] = useState<PasswordEntry | null>(null);
  const [visiblePasswords, setVisiblePasswords] = useState<Set<string>>(new Set());
  const [showFormPassword, setShowFormPassword] = useState(false);
  const [formData, setFormData] = useState({
    site: '',
    username: '',
    password: '',
    tagIds: [] as string[],
    notes: ''
  });

  useEffect(() => {
    loadPasswords();
    loadTags();
  }, [user]);

  useEffect(() => {
    filterPasswords();
  }, [passwords, searchTerm, tags]);

  const ensureUserEncryptionKey = () => {
    if (!user) return '';
    
    const users = JSON.parse(localStorage.getItem('pm_users') || '[]');
    const currentUser = users.find((u: any) => u.id === user.id);
    
    if (!currentUser.encryptionKey) {
      currentUser.encryptionKey = generateUserKey();
      const updatedUsers = users.map((u: any) => u.id === user.id ? currentUser : u);
      localStorage.setItem('pm_users', JSON.stringify(updatedUsers));
    }
    
    return currentUser.encryptionKey;
  };

  const loadPasswords = () => {
    if (!user) return;
    const savedPasswords = localStorage.getItem('pm_passwords');
    if (savedPasswords) {
      const allPasswords = JSON.parse(savedPasswords);
      const userPasswords = allPasswords.filter((p: PasswordEntry) => p.userId === user.id);
      
      // Decrypt passwords and notes
      const encryptionKey = ensureUserEncryptionKey();
      const decryptedPasswords = userPasswords.map((p: PasswordEntry) => ({
        ...p,
        password: p.salt ? decrypt(p.password, encryptionKey, p.salt) : p.password,
        notes: p.notes && p.salt ? decrypt(p.notes, encryptionKey, p.salt) : p.notes
      }));
      
      setPasswords(sortPasswordsAlphabetically(decryptedPasswords));
    }
  };

  const loadTags = () => {
    if (!user) return;
    const savedTags = localStorage.getItem('pm_tags');
    if (savedTags) {
      const allTags = JSON.parse(savedTags);
      const userTags = allTags.filter((t: Tag) => t.userId === user.id);
      setTags(sortAlphabetically(userTags));
    }
  };

  const filterPasswords = () => {
    if (!searchTerm.trim()) {
      setFilteredPasswords(limitResults(passwords));
      return;
    }

    const filtered = passwords.filter(password => {
      const matchesSite = password.site.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesUsername = password.username.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesNotes = password.notes?.toLowerCase().includes(searchTerm.toLowerCase());
      
      // Check if any assigned tags match
      const passwordTags = tags.filter(tag => password.tagIds.includes(tag.id));
      const matchesTags = passwordTags.some(tag => 
        tag.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
      
      return matchesSite || matchesUsername || matchesNotes || matchesTags;
    });

    setFilteredPasswords(limitResults(filtered));
  };

  const resetForm = () => {
    setFormData({ site: '', username: '', password: '', tagIds: [], notes: '' });
    setShowAddForm(false);
    setEditingPassword(null);
    setShowFormPassword(false);
  };

  const savePassword = () => {
    if (!user) return;
    
    if (!formData.site.trim() || !formData.username.trim() || !formData.password.trim()) {
      toast({
        title: "Error",
        description: "Site, username, and password are required.",
        variant: "destructive"
      });
      return;
    }

    // Check for duplicates
    if (checkPasswordExists(passwords, formData.site.trim(), formData.username.trim(), user.id, editingPassword?.id)) {
      toast({
        title: "Error",
        description: "A password for this site and username already exists.",
        variant: "destructive"
      });
      return;
    }

    const encryptionKey = ensureUserEncryptionKey();
    const salt = generateSalt();
    
    const savedPasswords = localStorage.getItem('pm_passwords');
    const allPasswords = savedPasswords ? JSON.parse(savedPasswords) : [];

    if (editingPassword) {
      // Update existing password
      const updatedPassword: PasswordEntry = {
        ...editingPassword,
        site: formData.site.trim(),
        username: formData.username.trim(),
        password: encrypt(formData.password, encryptionKey, salt),
        tagIds: formData.tagIds,
        notes: formData.notes.trim() ? encrypt(formData.notes.trim(), encryptionKey, salt) : '',
        salt,
        updatedAt: new Date()
      };

      const passwordIndex = allPasswords.findIndex((p: PasswordEntry) => p.id === editingPassword.id);
      if (passwordIndex !== -1) {
        allPasswords[passwordIndex] = updatedPassword;
      }

      toast({
        title: "Password Updated",
        description: "Your password has been updated successfully.",
      });
    } else {
      // Create new password
      const newPassword: PasswordEntry = {
        id: Date.now().toString(),
        userId: user.id,
        site: formData.site.trim(),
        username: formData.username.trim(),
        password: encrypt(formData.password, encryptionKey, salt),
        tagIds: formData.tagIds,
        notes: formData.notes.trim() ? encrypt(formData.notes.trim(), encryptionKey, salt) : '',
        salt,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      allPasswords.push(newPassword);

      toast({
        title: "Password Saved",
        description: "Your password has been securely stored.",
      });
    }

    localStorage.setItem('pm_passwords', JSON.stringify(allPasswords));
    loadPasswords();
    resetForm();
  };

  const startEditPassword = (password: PasswordEntry) => {
    setEditingPassword(password);
    setFormData({
      site: password.site,
      username: password.username,
      password: password.password,
      tagIds: password.tagIds,
      notes: password.notes || ''
    });
    setShowAddForm(true);
  };

  const deletePassword = (passwordId: string) => {
    const savedPasswords = localStorage.getItem('pm_passwords');
    if (savedPasswords) {
      const allPasswords = JSON.parse(savedPasswords);
      const filteredPasswords = allPasswords.filter((p: PasswordEntry) => p.id !== passwordId);
      localStorage.setItem('pm_passwords', JSON.stringify(filteredPasswords));
      loadPasswords();
      
      toast({
        title: "Password Deleted",
        description: "The password has been removed.",
      });
    }
  };

  const togglePasswordVisibility = (id: string) => {
    const newVisible = new Set(visiblePasswords);
    if (newVisible.has(id)) {
      newVisible.delete(id);
    } else {
      newVisible.add(id);
    }
    setVisiblePasswords(newVisible);
  };

  const copyToClipboard = (text: string, type: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied",
      description: `${type} copied to clipboard.`,
    });
  };

  const exportData = () => {
    const exportPasswords = passwords.map(p => {
      const passwordTags = tags.filter(tag => p.tagIds.includes(tag.id)).map(tag => tag.name);
      return {
        site: p.site,
        username: p.username,
        password: p.password,
        tags: passwordTags.join(';'),
        notes: p.notes || '',
        createdAt: p.createdAt,
        updatedAt: p.updatedAt
      };
    });
    
    exportToCsv(exportPasswords, 'passwords.csv');
    
    toast({
      title: "Export Complete",
      description: "Passwords exported to CSV file.",
    });
  };

  const getPasswordTags = (tagIds: string[]) => {
    return tags.filter(tag => tagIds.includes(tag.id));
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <h2 className="text-3xl font-bold text-white">Your Passwords</h2>
        <div className="flex space-x-2">
          <Button
            variant="outline"
            onClick={exportData}
            className="border-slate-600 text-slate-300 hover:bg-slate-700"
          >
            <Download className="w-4 h-4 mr-2" />
            Export CSV
          </Button>
          <Button
            onClick={() => {
              resetForm();
              setShowAddForm(true);
            }}
            className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Password
          </Button>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
        <Input
          type="text"
          placeholder="Search by site, username, tags, or notes..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-12 bg-slate-800/50 border-slate-700 text-white placeholder-slate-400"
        />
      </div>

      {searchTerm && (
        <div className="text-slate-300">
          Found {filteredPasswords.length} result{filteredPasswords.length !== 1 ? 's' : ''} for "{searchTerm}" (limited to 100)
        </div>
      )}

      {/* Add/Edit Form Dialog */}
      <Dialog open={showAddForm} onOpenChange={setShowAddForm}>
        <DialogContent className="bg-slate-800 border-slate-700 max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-white">
              {editingPassword ? 'Edit Password' : 'Add New Password'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-slate-300">Website/Service *</Label>
                <Input
                  value={formData.site}
                  onChange={(e) => setFormData({...formData, site: e.target.value})}
                  className="bg-slate-700/50 border-slate-600 text-white"
                  placeholder="e.g., gmail.com"
                />
              </div>
              <div>
                <Label className="text-slate-300">Username *</Label>
                <Input
                  value={formData.username}
                  onChange={(e) => setFormData({...formData, username: e.target.value})}
                  className="bg-slate-700/50 border-slate-600 text-white"
                  placeholder="your.email@domain.com"
                />
              </div>
            </div>
            <div>
              <Label className="text-slate-300">Password *</Label>
              <div className="relative">
                <Input
                  type={showFormPassword ? "text" : "password"}
                  value={formData.password}
                  onChange={(e) => setFormData({...formData, password: e.target.value})}
                  className="bg-slate-700/50 border-slate-600 text-white pr-10"
                  placeholder="Your secure password"
                />
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-white"
                  onClick={() => setShowFormPassword(!showFormPassword)}
                >
                  {showFormPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </Button>
              </div>
            </div>
            <div>
              <Label className="text-slate-300">Tags</Label>
              <TagDropzone
                availableTags={tags}
                selectedTagIds={formData.tagIds}
                onTagsChange={(tagIds) => setFormData({...formData, tagIds})}
              />
            </div>
            <div>
              <Label className="text-slate-300">Notes</Label>
              <Textarea
                value={formData.notes}
                onChange={(e) => setFormData({...formData, notes: e.target.value})}
                className="bg-slate-700/50 border-slate-600 text-white"
                placeholder="Additional notes..."
                rows={3}
              />
            </div>
            <div className="flex space-x-2">
              <Button onClick={savePassword} className="bg-green-600 hover:bg-green-700">
                {editingPassword ? 'Update Password' : 'Save Password'}
              </Button>
              <Button variant="outline" onClick={resetForm}>
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Password Cards */}
      <div className="grid gap-4">
        {filteredPasswords.map((password) => {
          const passwordTags = getPasswordTags(password.tagIds);
          return (
            <Card key={password.id} className="bg-slate-800/50 border-slate-700">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex-1 min-w-0">
                    <h3 className="text-xl font-semibold text-white break-words">{password.site}</h3>
                    <p className="text-slate-400 break-words">{password.username}</p>
                  </div>
                  <div className="flex items-center space-x-2 flex-shrink-0">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => togglePasswordVisibility(password.id)}
                      className="text-slate-300 hover:text-white"
                    >
                      {visiblePasswords.has(password.id) ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => copyToClipboard(password.password, 'Password')}
                      className="text-slate-300 hover:text-white"
                    >
                      <Copy className="w-4 h-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => startEditPassword(password)}
                      className="text-blue-400 hover:text-blue-300"
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => deletePassword(password.id)}
                      className="text-red-400 hover:text-red-300"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <span className="text-slate-400">Password:</span>
                    <span className="text-white font-mono break-all">
                      {visiblePasswords.has(password.id) ? password.password : '••••••••••••'}
                    </span>
                  </div>
                  
                  {passwordTags.length > 0 && (
                    <div className="flex items-start space-x-2">
                      <span className="text-slate-400 flex-shrink-0">Tags:</span>
                      <div className="flex flex-wrap gap-1">
                        {passwordTags.map((tag) => (
                          <Badge
                            key={tag.id}
                            style={{ 
                              backgroundColor: tag.color,
                              color: getContrastColor(tag.color)
                            }}
                            className="font-medium whitespace-normal break-words"
                          >
                            {tag.name}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {password.notes && (
                    <div>
                      <span className="text-slate-400">Notes:</span>
                      <p className="text-slate-300 text-sm mt-1 whitespace-pre-wrap break-words">{password.notes}</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {filteredPasswords.length === 0 && !searchTerm && (
        <div className="text-center py-12">
          <div className="w-16 h-16 bg-slate-700 rounded-full flex items-center justify-center mx-auto mb-4">
            <Key className="w-8 h-8 text-slate-400" />
          </div>
          <h3 className="text-xl font-semibold text-white mb-2">No passwords yet</h3>
          <p className="text-slate-400">Start by adding your first password to the vault.</p>
        </div>
      )}

      {filteredPasswords.length === 0 && searchTerm && (
        <div className="text-center py-12">
          <div className="w-16 h-16 bg-slate-700 rounded-full flex items-center justify-center mx-auto mb-4">
            <Search className="w-8 h-8 text-slate-400" />
          </div>
          <h3 className="text-xl font-semibold text-white mb-2">No results found</h3>
          <p className="text-slate-400">Try searching with different keywords.</p>
        </div>
      )}
    </div>
  );
};

export default PasswordsTab;
