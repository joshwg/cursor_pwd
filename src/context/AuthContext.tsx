
import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, AuthContextType } from '../types';
import { restoreDataFromBackups, startAutoBackup, saveDataWithBackup, getDataWithFallback } from '../utils/dataBackup';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [lastActivity, setLastActivity] = useState<number>(Date.now());

  // Idle timeout - 30 minutes
  const IDLE_TIMEOUT = 30 * 60 * 1000;

  // Track user activity
  useEffect(() => {
    const updateActivity = () => setLastActivity(Date.now());
    
    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart'];
    events.forEach(event => {
      document.addEventListener(event, updateActivity, true);
    });

    return () => {
      events.forEach(event => {
        document.removeEventListener(event, updateActivity, true);
      });
    };
  }, []);

  // Check for idle timeout
  useEffect(() => {
    if (!user) return;

    const checkIdle = () => {
      if (Date.now() - lastActivity > IDLE_TIMEOUT) {
        logout();
      }
    };

    const interval = setInterval(checkIdle, 60000); // Check every minute
    return () => clearInterval(interval);
  }, [user, lastActivity]);

  useEffect(() => {
    // Start auto-backup system
    const stopAutoBackup = startAutoBackup();
    
    // Restore data from backups if needed
    restoreDataFromBackups();
    
    // Initialize with admin user if no users exist
    let existingUsers = getDataWithFallback('pm_users');
    if (!existingUsers) {
      const adminUser: User = {
        id: 'admin-1',
        username: 'super',
        password: 'abcd1234',
        isAdmin: true,
        createdAt: new Date(),
        lastLogin: new Date()
      };
      saveDataWithBackup('pm_users', [adminUser]);
    }

    // Check for existing session
    const currentUser = getDataWithFallback('pm_current_user');
    if (currentUser) {
      try {
        setUser(JSON.parse(currentUser));
      } catch (error) {
        console.warn('Failed to parse current user data:', error);
      }
    }
    
    return stopAutoBackup;
  }, []);

  const login = async (username: string, password: string): Promise<boolean> => {
    try {
      const usersData = getDataWithFallback('pm_users') || '[]';
      const users = JSON.parse(usersData);
      const foundUser = users.find((u: User) => u.username === username && u.password === password);
      
      if (foundUser) {
        foundUser.lastLogin = new Date();
        setUser(foundUser);
        
        saveDataWithBackup('pm_current_user', foundUser);
        
        // Update user in storage
        const updatedUsers = users.map((u: User) => u.id === foundUser.id ? foundUser : u);
        saveDataWithBackup('pm_users', updatedUsers);
        
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('Login function error:', error);
      return false;
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('pm_current_user');
    localStorage.removeItem('pm_current_user_backup');
    sessionStorage.removeItem('pm_current_user_backup');
  };

  const value: AuthContextType = {
    user,
    login,
    logout,
    isAuthenticated: !!user
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
