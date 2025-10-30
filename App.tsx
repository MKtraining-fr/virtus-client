import React, { useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './src/context/AuthContext';

import ProtectedRoute from './components/ProtectedRoute.tsx';
import AuthPage from './pages/AuthPage.tsx';
import AdminLayout from './layouts/AdminLayout.tsx';
import CoachLayout from './layouts/CoachLayout.tsx';
import ClientLayout from './layouts/ClientLayout.tsx';
import LandingPage from './pages/LandingPage.tsx';

const App: React.FC = () => {
  const { user, isAuthLoading, isDataLoading, currentViewRole } = useAuth();



  // This component decides which layout to show based on the user's role
  // It is always rendered within ProtectedRoute, so 'user' is guaranteed to exist.
  const RoleBasedLayout = () => {
    if (!user) {
      return <Navigate to="/login" replace />;
    }

    const effectiveRole = user.role === 'admin' ? currentViewRole : user.role;

    switch (effectiveRole) {
      case 'admin':
        return <AdminLayout />;
      case 'coach':
        return <CoachLayout />;
      case 'client':
        return <ClientLayout />;
      default:
        // This case should not be reached if ProtectedRoute and login logic are correct.
        return <Navigate to="/login" replace />;
    }
  };

  if (isAuthLoading || isDataLoading) {
    // Afficher un écran de chargement pendant l'initialisation
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-xl font-semibold">Chargement de l'application...</p>
      </div>
    );
  }

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