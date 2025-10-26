import React, { Suspense, lazy } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import { useDataStore } from './stores/useDataStore';
import ErrorBoundary from './components/ErrorBoundary';
import ProtectedRoute from './components/ProtectedRoute';
import LoadingSpinner from './components/LoadingSpinner';
import { AuthCallback } from './components/AuthCallback';

// Lazy loading des composants lourds
const AuthPage = lazy(() => import('./pages/AuthPage'));
const SetPassword = lazy(() => import('./pages/SetPassword'));
const AdminLayout = lazy(() => import('./layouts/AdminLayout'));
const CoachLayout = lazy(() => import('./layouts/CoachLayout'));
const ClientLayout = lazy(() => import('./layouts/ClientLayout'));
const LandingPage = lazy(() => import('./pages/LandingPage'));

const App: React.FC = () => {
  const { user, isAuthLoading } = useAuth();
  const { isDataLoading } = useDataStore();

  if (isAuthLoading || isDataLoading) {
    return <LoadingSpinner fullScreen message="Vérification de la session..." />;
  }

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
    <ErrorBoundary>
      <AuthCallback />
      <Suspense fallback={<LoadingSpinner fullScreen message="Chargement..." />}>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={!user ? <AuthPage /> : <Navigate to="/app" replace />} />
          <Route path="/set-password" element={<SetPassword />} />
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
      </Suspense>
    </ErrorBoundary>
  );
};

export default App;
