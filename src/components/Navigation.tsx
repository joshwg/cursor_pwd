
import React from 'react';
import { useAuth } from '../context/AuthContext';
import { Button } from '@/components/ui/button';
import { Shield, User, LogOut, Key, Tag, Search, Users } from 'lucide-react';

interface NavigationProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

const Navigation: React.FC<NavigationProps> = ({ activeTab, setActiveTab }) => {
  const { user, logout } = useAuth();

  const menuItems = [
    { id: 'passwords', label: 'Passwords', icon: Key },
    { id: 'tags', label: 'Tags', icon: Tag },
    { id: 'search', label: 'Search', icon: Search },
    ...(user?.isAdmin ? [{ id: 'users', label: 'Users', icon: Users }] : []),
  ];

  return (
    <nav className="bg-slate-800/50 border-b border-slate-700 px-6 py-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-8">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
              <Shield className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white">Secure Vault</h1>
              <p className="text-xs text-slate-400">Password Manager</p>
            </div>
          </div>
          
          <div className="flex space-x-1">
            {menuItems.map((item) => {
              const Icon = item.icon;
              return (
                <Button
                  key={item.id}
                  variant={activeTab === item.id ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setActiveTab(item.id)}
                  className={`text-sm ${
                    activeTab === item.id
                      ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white'
                      : 'text-slate-300 hover:text-white hover:bg-slate-700'
                  }`}
                >
                  <Icon className="w-4 h-4 mr-2" />
                  {item.label}
                </Button>
              );
            })}
          </div>
        </div>

        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2 text-slate-300">
            <User className="w-4 h-4" />
            <span className="text-sm">{user?.username}</span>
            {user?.isAdmin && (
              <span className="text-xs px-2 py-1 bg-blue-500/20 text-blue-300 rounded-full">
                Admin
              </span>
            )}
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={logout}
            className="text-slate-300 hover:text-white hover:bg-slate-700"
          >
            <LogOut className="w-4 h-4 mr-2" />
            Logout
          </Button>
        </div>
      </div>
    </nav>
  );
};

export default Navigation;
