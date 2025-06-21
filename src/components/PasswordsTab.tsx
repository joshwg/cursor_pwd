
import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { PasswordEntry } from '../types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Plus, Eye, EyeOff, Copy, Edit, Trash2, Key } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const PasswordsTab = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [passwords, setPasswords] = useState<PasswordEntry[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [visiblePasswords, setVisiblePasswords] = useState<Set<string>>(new Set());
  const [formData, setFormData] = useState({
    site: '',
    username: '',
    password: '',
    tags: '',
    notes: ''
  });

  useEffect(() => {
    loadPasswords();
  }, [user]);

  const loadPasswords = () => {
    if (!user) return;
    const savedPasswords = localStorage.getItem('pm_passwords');
    if (savedPasswords) {
      const allPasswords = JSON.parse(savedPasswords);
      setPasswords(allPasswords.filter((p: PasswordEntry) => p.userId === user.id));
    }
  };

  const savePassword = () => {
    if (!user) return;
    
    const newPassword: PasswordEntry = {
      id: Date.now().toString(),
      userId: user.id,
      site: formData.site,
      username: formData.username,
      password: formData.password,
      tags: formData.tags.split(',').map(t => t.trim()).filter(t => t),
      notes: formData.notes,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const savedPasswords = localStorage.getItem('pm_passwords');
    const allPasswords = savedPasswords ? JSON.parse(savedPasswords) : [];
    allPasswords.push(newPassword);
    localStorage.setItem('pm_passwords', JSON.stringify(allPasswords));
    
    loadPasswords();
    setShowAddForm(false);
    setFormData({ site: '', username: '', password: '', tags: '', notes: '' });
    
    toast({
      title: "Password Saved",
      description: "Your password has been securely stored.",
    });
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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold text-white">Your Passwords</h2>
        <Button
          onClick={() => setShowAddForm(true)}
          className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Password
        </Button>
      </div>

      {showAddForm && (
        <Card className="bg-slate-800/50 border-slate-700">
          <CardHeader>
            <CardTitle className="text-white">Add New Password</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-slate-300">Website/Service</Label>
                <Input
                  value={formData.site}
                  onChange={(e) => setFormData({...formData, site: e.target.value})}
                  className="bg-slate-700/50 border-slate-600 text-white"
                  placeholder="e.g., gmail.com"
                />
              </div>
              <div>
                <Label className="text-slate-300">Username</Label>
                <Input
                  value={formData.username}
                  onChange={(e) => setFormData({...formData, username: e.target.value})}
                  className="bg-slate-700/50 border-slate-600 text-white"
                  placeholder="your.email@domain.com"
                />
              </div>
            </div>
            <div>
              <Label className="text-slate-300">Password</Label>
              <Input
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({...formData, password: e.target.value})}
                className="bg-slate-700/50 border-slate-600 text-white"
                placeholder="Your secure password"
              />
            </div>
            <div>
              <Label className="text-slate-300">Tags</Label>
              <Input
                value={formData.tags}
                onChange={(e) => setFormData({...formData, tags: e.target.value})}
                className="bg-slate-700/50 border-slate-600 text-white"
                placeholder="work, personal, social (comma separated)"
              />
            </div>
            <div>
              <Label className="text-slate-300">Notes</Label>
              <Textarea
                value={formData.notes}
                onChange={(e) => setFormData({...formData, notes: e.target.value})}
                className="bg-slate-700/50 border-slate-600 text-white"
                placeholder="Additional notes..."
              />
            </div>
            <div className="flex space-x-2">
              <Button onClick={savePassword} className="bg-green-600 hover:bg-green-700">
                Save Password
              </Button>
              <Button variant="outline" onClick={() => setShowAddForm(false)}>
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4">
        {passwords.map((password) => (
          <Card key={password.id} className="bg-slate-800/50 border-slate-700">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-xl font-semibold text-white">{password.site}</h3>
                  <p className="text-slate-400">{password.username}</p>
                </div>
                <div className="flex items-center space-x-2">
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
                </div>
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <span className="text-slate-400">Password:</span>
                  <span className="text-white font-mono">
                    {visiblePasswords.has(password.id) ? password.password : '••••••••••••'}
                  </span>
                </div>
                
                {password.tags.length > 0 && (
                  <div className="flex items-center space-x-2">
                    <span className="text-slate-400">Tags:</span>
                    <div className="flex space-x-1">
                      {password.tags.map((tag, index) => (
                        <Badge key={index} variant="secondary" className="bg-blue-500/20 text-blue-300">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
                
                {password.notes && (
                  <div>
                    <span className="text-slate-400">Notes:</span>
                    <p className="text-slate-300 text-sm mt-1">{password.notes}</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {passwords.length === 0 && (
        <div className="text-center py-12">
          <div className="w-16 h-16 bg-slate-700 rounded-full flex items-center justify-center mx-auto mb-4">
            <Key className="w-8 h-8 text-slate-400" />
          </div>
          <h3 className="text-xl font-semibold text-white mb-2">No passwords yet</h3>
          <p className="text-slate-400">Start by adding your first password to the vault.</p>
        </div>
      )}
    </div>
  );
};

export default PasswordsTab;
