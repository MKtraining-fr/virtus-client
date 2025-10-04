import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';

import ProtectedRoute from './components/ProtectedRoute';
import AuthPage from './pages/AuthPage';
import AdminLayout from './layouts/AdminLayout';
import CoachLayout from './layouts/CoachLayout';
import ClientLayout from './layouts/ClientLayout';
import LandingPage from './pages/LandingPage';

const App: React.FC = () => {
  const { user } = useAuth();

  // This component decides which layout to show based on the user's role
  // It is always rendered within ProtectedRoute, so 'user' is guaranteed to exist.
  const RoleBasedLayout = () => {
    switch (user!.role) {
      case 'admin':
        return <AdminLayout />;
      case 'coach':
        return <CoachLayout />;
      case 'client':
        return <ClientLayout />;
      default:
        // This case should not be reached if ProtectedRoute and login logic are correct.
        return <Navigate to="/login" />;
    }
  };

  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={!user ? <AuthPage /> : <Navigate to="/app" replace />} />
      <Route
        path="/app/*"
        element={
          <ProtectedRoute>
            <RoleBasedLayout />
          </ProtectedRoute>
        }
      />
       {/* Fallback for any other route */}
      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  );
};

export default App;