
import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { User } from '../types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Plus, User as UserIcon, Shield, Trash2, Key } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import ChangePasswordDialog from './ChangePasswordDialog';

const UsersTab = () => {
  const { user: currentUser } = useAuth();
  const { toast } = useToast();
  const [users, setUsers] = useState<User[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [showPasswordDialog, setShowPasswordDialog] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    isAdmin: false
  });

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = () => {
    const savedUsers = localStorage.getItem('pm_users');
    if (savedUsers) {
      setUsers(JSON.parse(savedUsers));
    }
  };

  const saveUser = () => {
    if (!formData.username.trim() || !formData.password.trim()) {
      toast({
        title: "Error",
        description: "Username and password are required.",
        variant: "destructive"
      });
      return;
    }

    const newUser: User = {
      id: Date.now().toString(),
      username: formData.username.trim(),
      password: formData.password,
      isAdmin: formData.isAdmin,
      createdAt: new Date()
    };

    const savedUsers = localStorage.getItem('pm_users');
    const allUsers = savedUsers ? JSON.parse(savedUsers) : [];
    
    // Check if username already exists
    if (allUsers.some((u: User) => u.username === newUser.username)) {
      toast({
        title: "Error",
        description: "Username already exists.",
        variant: "destructive"
      });
      return;
    }

    allUsers.push(newUser);
    localStorage.setItem('pm_users', JSON.stringify(allUsers));
    
    loadUsers();
    setShowAddForm(false);
    setFormData({ username: '', password: '', isAdmin: false });
    
    toast({
      title: "User Created",
      description: `User ${newUser.username} has been created.`,
    });
  };

  const deleteUser = (userId: string) => {
    if (userId === currentUser?.id) {
      toast({
        title: "Error",
        description: "You cannot delete your own account.",
        variant: "destructive"
      });
      return;
    }

    const savedUsers = localStorage.getItem('pm_users');
    if (savedUsers) {
      const allUsers = JSON.parse(savedUsers);
      const filteredUsers = allUsers.filter((u: User) => u.id !== userId);
      localStorage.setItem('pm_users', JSON.stringify(filteredUsers));
      loadUsers();
      
      toast({
        title: "User Deleted",
        description: "The user has been removed.",
      });
    }
  };

  const openPasswordReset = (userId: string) => {
    setSelectedUserId(userId);
    setShowPasswordDialog(true);
  };

  if (!currentUser?.isAdmin) {
    return (
      <div className="text-center py-12">
        <div className="w-16 h-16 bg-slate-700 rounded-full flex items-center justify-center mx-auto mb-4">
          <Shield className="w-8 h-8 text-slate-400" />
        </div>
        <h3 className="text-xl font-semibold text-white mb-2">Access Denied</h3>
        <p className="text-slate-400">Only administrators can manage users.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold text-white">Manage Users</h2>
        <Button
          onClick={() => setShowAddForm(true)}
          className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add User
        </Button>
      </div>

      {showAddForm && (
        <Card className="bg-slate-800/50 border-slate-700">
          <CardHeader>
            <CardTitle className="text-white">Create New User</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label className="text-slate-300">Username</Label>
              <Input
                value={formData.username}
                onChange={(e) => setFormData({...formData, username: e.target.value})}
                className="bg-slate-700/50 border-slate-600 text-white"
                placeholder="Enter username"
              />
            </div>
            <div>
              <Label className="text-slate-300">Password</Label>
              <Input
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({...formData, password: e.target.value})}
                className="bg-slate-700/50 border-slate-600 text-white"
                placeholder="Enter password"
              />
            </div>
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="isAdmin"
                checked={formData.isAdmin}
                onChange={(e) => setFormData({...formData, isAdmin: e.target.checked})}
                className="rounded"
              />
              <Label htmlFor="isAdmin" className="text-slate-300">Administrator privileges</Label>
            </div>
            <div className="flex space-x-2">
              <Button onClick={saveUser} className="bg-green-600 hover:bg-green-700">
                Create User
              </Button>
              <Button variant="outline" onClick={() => setShowAddForm(false)}>
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4">
        {users.map((user) => (
          <Card key={user.id} className="bg-slate-800/50 border-slate-700">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                    <UserIcon className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-white">{user.username}</h3>
                    <div className="flex items-center space-x-2 mt-1">
                      {user.isAdmin && (
                        <Badge className="bg-blue-500/20 text-blue-300">
                          <Shield className="w-3 h-3 mr-1" />
                          Admin
                        </Badge>
                      )}
                      <span className="text-sm text-slate-400">
                        Created {new Date(user.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </div>
                
                <div className="flex space-x-2">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => openPasswordReset(user.id)}
                    className="text-blue-400 hover:text-blue-300 hover:bg-blue-500/10"
                  >
                    <Key className="w-4 h-4" />
                  </Button>
                  {user.id !== currentUser.id && (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => deleteUser(user.id)}
                      className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              </div>
              
              {user.lastLogin && (
                <div className="mt-4 text-sm text-slate-400">
                  Last login: {new Date(user.lastLogin).toLocaleString()}
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      <ChangePasswordDialog
        open={showPasswordDialog}
        onOpenChange={(open) => {
          setShowPasswordDialog(open);
          if (!open) setSelectedUserId(null);
        }}
        targetUserId={selectedUserId || undefined}
      />
    </div>
  );
};

export default UsersTab;
