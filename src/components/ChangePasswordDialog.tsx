import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Eye, EyeOff, Lock } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface ChangePasswordDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const ChangePasswordDialog: React.FC<ChangePasswordDialogProps> = ({ open, onOpenChange }) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false
  });
  const [isLoading, setIsLoading] = useState(false);

  const resetForm = () => {
    setFormData({
      currentPassword: '',
      newPassword: '',
      confirmPassword: ''
    });
    setShowPasswords({
      current: false,
      new: false,
      confirm: false
    });
  };

  const togglePasswordVisibility = (field: 'current' | 'new' | 'confirm') => {
    setShowPasswords(prev => ({
      ...prev,
      [field]: !prev[field]
    }));
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setIsLoading(true);

    try {
      // Validate current password
      if (!formData.currentPassword) {
        toast({
          title: "Error",
          description: "Current password is required.",
          variant: "destructive"
        });
        return;
      }

      // Validate new password
      if (!formData.newPassword || formData.newPassword.length < 6) {
        toast({
          title: "Error",
          description: "New password must be at least 6 characters long.",
          variant: "destructive"
        });
        return;
      }

      // Validate password confirmation
      if (formData.newPassword !== formData.confirmPassword) {
        toast({
          title: "Error",
          description: "New passwords do not match.",
          variant: "destructive"
        });
        return;
      }

      // Check current password
      const users = JSON.parse(localStorage.getItem('pm_users') || '[]');
      const currentUser = users.find((u: any) => u.id === user.id);
      
      if (!currentUser || currentUser.password !== formData.currentPassword) {
        toast({
          title: "Error",
          description: "Current password is incorrect.",
          variant: "destructive"
        });
        return;
      }

      // Update password
      currentUser.password = formData.newPassword;
      const updatedUsers = users.map((u: any) => u.id === user.id ? currentUser : u);
      localStorage.setItem('pm_users', JSON.stringify(updatedUsers));

      // Update current user session
      localStorage.setItem('pm_current_user', JSON.stringify(currentUser));

      toast({
        title: "Password Changed",
        description: "Your password has been updated successfully.",
      });

      resetForm();
      onOpenChange(false);
    } catch (error) {
      toast({
        title: "Error",
        description: "An error occurred while changing your password.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-slate-800 border-slate-700 max-w-md">
        <DialogHeader>
          <DialogTitle className="text-white flex items-center">
            <Lock className="w-5 h-5 mr-2" />
            Change Password
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleChangePassword} className="space-y-4">
          <div>
            <Label className="text-slate-300">Current Password *</Label>
            <div className="relative">
              <Input
                type={showPasswords.current ? "text" : "password"}
                value={formData.currentPassword}
                onChange={(e) => setFormData({...formData, currentPassword: e.target.value})}
                className="bg-slate-700/50 border-slate-600 text-white pr-10"
                placeholder="Enter current password"
                required
              />
              <Button
                type="button"
                size="sm"
                variant="ghost"
                className="absolute right-2 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-white"
                onClick={() => togglePasswordVisibility('current')}
              >
                {showPasswords.current ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </Button>
            </div>
          </div>
          
          <div>
            <Label className="text-slate-300">New Password *</Label>
            <div className="relative">
              <Input
                type={showPasswords.new ? "text" : "password"}
                value={formData.newPassword}
                onChange={(e) => setFormData({...formData, newPassword: e.target.value})}
                className="bg-slate-700/50 border-slate-600 text-white pr-10"
                placeholder="Enter new password (min 6 characters)"
                minLength={6}
                required
              />
              <Button
                type="button"
                size="sm"
                variant="ghost"
                className="absolute right-2 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-white"
                onClick={() => togglePasswordVisibility('new')}
              >
                {showPasswords.new ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </Button>
            </div>
          </div>
          
          <div>
            <Label className="text-slate-300">Confirm New Password *</Label>
            <div className="relative">
              <Input
                type={showPasswords.confirm ? "text" : "password"}
                value={formData.confirmPassword}
                onChange={(e) => setFormData({...formData, confirmPassword: e.target.value})}
                className="bg-slate-700/50 border-slate-600 text-white pr-10"
                placeholder="Confirm new password"
                required
              />
              <Button
                type="button"
                size="sm"
                variant="ghost"
                className="absolute right-2 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-white"
                onClick={() => togglePasswordVisibility('confirm')}
              >
                {showPasswords.confirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </Button>
            </div>
          </div>
          
          <div className="flex space-x-2 pt-2">
            <Button 
              type="submit" 
              className="bg-green-600 hover:bg-green-700"
              disabled={isLoading}
            >
              {isLoading ? 'Changing...' : 'Change Password'}
            </Button>
            <Button 
              type="button"
              variant="outline" 
              onClick={() => {
                resetForm();
                onOpenChange(false);
              }}
            >
              Cancel
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default ChangePasswordDialog;