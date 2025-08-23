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
import { Plus, Eye, EyeOff, Copy, Edit, Trash2, Search, Download, Upload, Key, ChevronDown, ChevronUp } from 'lucide-react';
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
import { saveDataWithBackup } from '../utils/dataBackup';

const PasswordsTab = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [passwords, setPasswords] = useState<PasswordEntry[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [filteredPasswords, setFilteredPasswords] = useState<PasswordEntry[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingPassword, setEditingPassword] = useState<PasswordEntry | null>(null);
  const [visiblePasswords, setVisiblePasswords] = useState<Set<string>>(new Set());
  const [hiddenNotes, setHiddenNotes] = useState<Set<string>>(new Set());
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
  }, [passwords, searchTerm, tags, selectedTagIds]);

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
    let filtered = passwords;

    // Apply combined filtering logic
    if (selectedTagIds.length > 0 || searchTerm.trim()) {
      filtered = filtered.filter(password => {
        const tagIds = password.tagIds || [];
        
        // Check if password has ALL selected tags
        const hasAllTags = selectedTagIds.length === 0 || 
          selectedTagIds.every(selectedTagId => tagIds.includes(selectedTagId));
        
        // If only tags are selected (no search term), just check tags
        if (selectedTagIds.length > 0 && !searchTerm.trim()) {
          return hasAllTags;
        }
        
        // If search term exists, check site OR username match
        if (searchTerm.trim()) {
          const matchesSite = password.site.toLowerCase().includes(searchTerm.toLowerCase());
          const matchesUsername = password.username.toLowerCase().includes(searchTerm.toLowerCase());
          const matchesNotes = password.notes?.toLowerCase().includes(searchTerm.toLowerCase());
          
          // Check if any assigned tags match
          const passwordTags = tags.filter(tag => tagIds.includes(tag.id));
          const matchesTags = passwordTags.some(tag => 
            tag.name.toLowerCase().includes(searchTerm.toLowerCase())
          );
          
          const matchesSearchTerm = matchesSite || matchesUsername || matchesNotes || matchesTags;
          
          // If tags are also selected, require both conditions
          if (selectedTagIds.length > 0) {
            return matchesSearchTerm && hasAllTags;
          }
          
          // If no tags selected, just match search term
          return matchesSearchTerm;
        }
        
        return true;
      });
    }

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
      const tagIds = p.tagIds || []; // Ensure tagIds is an array
      const passwordTags = tags.filter(tag => tagIds.includes(tag.id)).map(tag => tag.name);
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

  const importData = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const csv = e.target?.result as string;
        const lines = csv.split('\n');
        const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
        
        const importedPasswords: any[] = [];
        
        for (let i = 1; i < lines.length; i++) {
          const line = lines[i].trim();
          if (!line) continue;
          
          const values = line.split(',').map(v => v.trim().replace(/"/g, ''));
          const passwordData: any = {};
          
          headers.forEach((header, index) => {
            passwordData[header] = values[index] || '';
          });
          
          if (passwordData.site && passwordData.username && passwordData.password) {
            const encryptionKey = ensureUserEncryptionKey();
            const salt = generateSalt();
            
            // Find or create tags
            const tagNames = passwordData.tags ? passwordData.tags.split(';').filter((t: string) => t.trim()) : [];
            const tagIds: string[] = [];
            
            tagNames.forEach((tagName: string) => {
              let existingTag = tags.find(t => t.name.toLowerCase() === tagName.trim().toLowerCase());
              if (!existingTag) {
                // Create new tag
                const newTag: Tag = {
                  id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
                  userId: user!.id,
                  name: tagName.trim(),
                  description: '',
                  color: `hsl(${Math.floor(Math.random() * 360)}, 70%, 50%)`,
                  createdAt: new Date()
                };
                tags.push(newTag);
                existingTag = newTag;
              }
              tagIds.push(existingTag.id);
            });
            
            const newPassword: PasswordEntry = {
              id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
              userId: user!.id,
              site: passwordData.site,
              username: passwordData.username,
              password: encrypt(passwordData.password, encryptionKey, salt),
              tagIds,
              notes: passwordData.notes ? encrypt(passwordData.notes, encryptionKey, salt) : '',
              salt,
              createdAt: new Date(),
              updatedAt: new Date()
            };
            
            importedPasswords.push(newPassword);
          }
        }
        
        if (importedPasswords.length > 0) {
          const savedPasswords = localStorage.getItem('pm_passwords');
          const allPasswords = savedPasswords ? JSON.parse(savedPasswords) : [];
          allPasswords.push(...importedPasswords);
          saveDataWithBackup('pm_passwords', allPasswords);
          
          // Update tags in storage
          const savedTags = localStorage.getItem('pm_tags');
          const allTags = savedTags ? JSON.parse(savedTags) : [];
          const updatedTags = [...allTags];
          tags.forEach(tag => {
            if (!allTags.find((t: Tag) => t.id === tag.id)) {
              updatedTags.push(tag);
            }
          });
          saveDataWithBackup('pm_tags', updatedTags);
          
          loadPasswords();
          loadTags();
          
          toast({
            title: "Import Complete",
            description: `Successfully imported ${importedPasswords.length} passwords.`,
          });
        } else {
          toast({
            title: "Import Failed",
            description: "No valid password entries found in the CSV file.",
            variant: "destructive"
          });
        }
        
      } catch (error) {
        console.error('Import error:', error);
        toast({
          title: "Import Failed",
          description: "Failed to parse CSV file. Please check the format.",
          variant: "destructive"
        });
      }
    };
    
    reader.readAsText(file);
    // Reset file input
    event.target.value = '';
  };

  const getPasswordTags = (tagIds: string[]) => {
    const safeTagIds = tagIds || []; // Ensure tagIds is an array
    return tags.filter(tag => safeTagIds.includes(tag.id));
  };

  const handleTagDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const tagId = e.dataTransfer.getData('text/plain');
    if (tagId && !selectedTagIds.includes(tagId)) {
      setSelectedTagIds([...selectedTagIds, tagId]);
    }
  };

  const handleTagDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const removeSelectedTag = (tagId: string) => {
    setSelectedTagIds(selectedTagIds.filter(id => id !== tagId));
  };

  const clearAllTags = () => {
    setSelectedTagIds([]);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <h2 className="text-3xl font-bold text-white">Your Passwords</h2>
        <div className="flex space-x-2">
          <input
            type="file"
            accept=".csv"
            onChange={importData}
            className="hidden"
            id="import-file"
          />
          <Button
            variant="outline"
            onClick={() => document.getElementById('import-file')?.click()}
            className="bg-slate-800/50 border-slate-600 text-white hover:bg-slate-700/50"
          >
            <Upload className="w-4 h-4 mr-2" />
            Import CSV
          </Button>
          <Button
            variant="outline"
            onClick={exportData}
            className="bg-slate-800/50 border-slate-600 text-white hover:bg-slate-700/50"
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

      {/* Search with Drag & Drop Tags */}
      <div className="flex gap-4 h-80">
        {/* Available Tags - Left 40% */}
        <div className="w-2/5">
          <h3 className="text-lg font-semibold text-white mb-3">Available Tags</h3>
          <div className="bg-slate-800/30 border-2 border-dashed border-slate-600 rounded-lg p-4 h-full overflow-y-auto">
            <div className="flex flex-wrap gap-2">
              {tags.map(tag => (
                <Badge
                  key={tag.id}
                  draggable
                  onDragStart={(e) => e.dataTransfer.setData('text/plain', tag.id)}
                  className="cursor-grab active:cursor-grabbing select-none tag-wrap"
                  style={{ 
                    backgroundColor: tag.color,
                    color: getContrastColor(tag.color)
                  }}
                >
                  {tag.name}
                </Badge>
              ))}
              {tags.length === 0 && (
                <p className="text-slate-400 text-sm">No tags available</p>
              )}
            </div>
          </div>
        </div>

        {/* Search Area - Right 60% */}
        <div className="w-3/5">
          <h3 className="text-lg font-semibold text-white mb-3">Search & Filter</h3>
          <div className="space-y-3 h-full flex flex-col">
            {/* Text Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
              <Input
                type="text"
                placeholder="Search by site, username, or notes..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-12 bg-slate-800/50 border-slate-700 text-white placeholder-slate-400"
              />
            </div>

            {/* Tag Drop Zone */}
            <div
              className="bg-slate-800/30 border-2 border-dashed border-slate-600 rounded-lg p-3 flex-1 transition-colors hover:border-slate-500"
              onDrop={handleTagDrop}
              onDragOver={handleTagDragOver}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-slate-400">Drop tags here to filter</span>
                {selectedTagIds.length > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={clearAllTags}
                    className="text-slate-400 hover:text-white h-6 px-2"
                  >
                    Clear all
                  </Button>
                )}
              </div>
              <div className="flex flex-wrap gap-2">
                {selectedTagIds.map(tagId => {
                  const tag = tags.find(t => t.id === tagId);
                  if (!tag) return null;
                  return (
                    <Badge
                      key={tagId}
                      className="select-none tag-wrap"
                      style={{ 
                        backgroundColor: tag.color,
                        color: getContrastColor(tag.color)
                      }}
                    >
                      {tag.name}
                      <button
                        onClick={() => removeSelectedTag(tagId)}
                        className="ml-2 hover:bg-black/20 rounded-full w-4 h-4 flex items-center justify-center text-xs"
                      >
                        ×
                      </button>
                    </Badge>
                  );
                })}
                {selectedTagIds.length === 0 && (
                  <p className="text-slate-500 text-sm">No tags selected</p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Spacer */}
      <div className="h-10"></div>

      {(searchTerm || selectedTagIds.length > 0) && (
        <div className="text-slate-300">
          Found {filteredPasswords.length} result{filteredPasswords.length !== 1 ? 's' : ''} 
          {searchTerm && ` for "${searchTerm}"`}
          {selectedTagIds.length > 0 && ` with ${selectedTagIds.length} tag${selectedTagIds.length !== 1 ? 's' : ''}`}
          {" (limited to 100)"}
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
      <div className="grid gap-4 mt-20">
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
                    <span className="text-white font-mono break-all flex-1">
                      {visiblePasswords.has(password.id) ? password.password : '••••••••••••'}
                    </span>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => togglePasswordVisibility(password.id)}
                      className="text-slate-300 hover:text-white flex-shrink-0"
                    >
                      {visiblePasswords.has(password.id) ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => copyToClipboard(password.password, 'Password')}
                      className="text-slate-300 hover:text-white flex-shrink-0"
                    >
                      <Copy className="w-4 h-4" />
                    </Button>
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
                      <div className="flex items-center space-x-2">
                        <span className="text-slate-400">Notes:</span>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => {
                            const newHiddenNotes = new Set(hiddenNotes);
                            if (hiddenNotes.has(password.id)) {
                              newHiddenNotes.delete(password.id);
                            } else {
                              newHiddenNotes.add(password.id);
                            }
                            setHiddenNotes(newHiddenNotes);
                          }}
                          className="text-slate-400 hover:text-white p-0 h-auto"
                        >
                          {hiddenNotes.has(password.id) ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
                        </Button>
                      </div>
                      {!hiddenNotes.has(password.id) && (
                        <p className="text-slate-300 text-sm mt-1 whitespace-pre-wrap break-words">{password.notes}</p>
                      )}
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
