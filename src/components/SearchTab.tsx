
import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { PasswordEntry } from '../types';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Search, Eye, EyeOff, Copy } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const SearchTab = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [passwords, setPasswords] = useState<PasswordEntry[]>([]);
  const [filteredPasswords, setFilteredPasswords] = useState<PasswordEntry[]>([]);
  const [visiblePasswords, setVisiblePasswords] = useState<Set<string>>(new Set());

  useEffect(() => {
    loadPasswords();
  }, [user]);

  useEffect(() => {
    if (!searchTerm.trim()) {
      setFilteredPasswords([]);
      return;
    }

    const filtered = passwords.filter(password =>
      password.site.toLowerCase().includes(searchTerm.toLowerCase()) ||
      password.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
      password.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (password.notes && password.notes.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    setFilteredPasswords(filtered);
  }, [searchTerm, passwords]);

  const loadPasswords = () => {
    if (!user) return;
    const savedPasswords = localStorage.getItem('pm_passwords');
    if (savedPasswords) {
      const allPasswords = JSON.parse(savedPasswords);
      setPasswords(allPasswords.filter((p: PasswordEntry) => p.userId === user.id));
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

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold text-white mb-4">Search Passwords</h2>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
          <Input
            type="text"
            placeholder="Search by site, username, tags, or notes..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-12 bg-slate-800/50 border-slate-700 text-white placeholder-slate-400 text-lg py-6"
          />
        </div>
      </div>

      {searchTerm && (
        <div className="text-slate-300">
          Found {filteredPasswords.length} result{filteredPasswords.length !== 1 ? 's' : ''} for "{searchTerm}"
        </div>
      )}

      <div className="grid gap-4">
        {filteredPasswords.map((password) => (
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

      {searchTerm && filteredPasswords.length === 0 && (
        <div className="text-center py-12">
          <div className="w-16 h-16 bg-slate-700 rounded-full flex items-center justify-center mx-auto mb-4">
            <Search className="w-8 h-8 text-slate-400" />
          </div>
          <h3 className="text-xl font-semibold text-white mb-2">No results found</h3>
          <p className="text-slate-400">Try searching with different keywords.</p>
        </div>
      )}

      {!searchTerm && (
        <div className="text-center py-12">
          <div className="w-16 h-16 bg-slate-700 rounded-full flex items-center justify-center mx-auto mb-4">
            <Search className="w-8 h-8 text-slate-400" />
          </div>
          <h3 className="text-xl font-semibold text-white mb-2">Start searching</h3>
          <p className="text-slate-400">Enter keywords to find your passwords by site, username, tags, or notes.</p>
        </div>
      )}
    </div>
  );
};

export default SearchTab;
