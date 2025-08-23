
import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, AuthContextType } from '../types';

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
    // Initialize with admin user if no users exist
    const existingUsers = localStorage.getItem('pm_users');
    if (!existingUsers) {
      const adminUser: User = {
        id: 'admin-1',
        username: 'super',
        password: 'abcd1234',
        isAdmin: true,
        createdAt: new Date(),
        lastLogin: new Date()
      };
      localStorage.setItem('pm_users', JSON.stringify([adminUser]));
    }

    // Check for existing session
    const currentUser = localStorage.getItem('pm_current_user');
    if (currentUser) {
      setUser(JSON.parse(currentUser));
    }
  }, []);

  const login = async (username: string, password: string): Promise<boolean> => {
    const users = JSON.parse(localStorage.getItem('pm_users') || '[]');
    const foundUser = users.find((u: User) => u.username === username && u.password === password);
    
    if (foundUser) {
      foundUser.lastLogin = new Date();
      setUser(foundUser);
      localStorage.setItem('pm_current_user', JSON.stringify(foundUser));
      
      // Update user in storage
      const updatedUsers = users.map((u: User) => u.id === foundUser.id ? foundUser : u);
      localStorage.setItem('pm_users', JSON.stringify(updatedUsers));
      
      return true;
    }
    return false;
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('pm_current_user');
  };

  const value: AuthContextType = {
    user,
    login,
    logout,
    isAuthenticated: !!user
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
