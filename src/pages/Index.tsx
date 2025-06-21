
import React from 'react';
import { useAuth, AuthProvider } from '../context/AuthContext';
import LoginForm from '../components/LoginForm';
import Dashboard from '../components/Dashboard';

const AppContent = () => {
  const { isAuthenticated } = useAuth();

  return isAuthenticated ? <Dashboard /> : <LoginForm />;
};

const Index = () => {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
};

export default Index;
