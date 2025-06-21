
import React, { useState } from 'react';
import Navigation from './Navigation';
import PasswordsTab from './PasswordsTab';
import TagsTab from './TagsTab';
import SearchTab from './SearchTab';
import UsersTab from './UsersTab';

const Dashboard = () => {
  const [activeTab, setActiveTab] = useState('passwords');

  const renderActiveTab = () => {
    switch (activeTab) {
      case 'passwords':
        return <PasswordsTab />;
      case 'tags':
        return <TagsTab />;
      case 'search':
        return <SearchTab />;
      case 'users':
        return <UsersTab />;
      default:
        return <PasswordsTab />;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900">
      <Navigation activeTab={activeTab} setActiveTab={setActiveTab} />
      <main className="p-6">
        {renderActiveTab()}
      </main>
    </div>
  );
};

export default Dashboard;
