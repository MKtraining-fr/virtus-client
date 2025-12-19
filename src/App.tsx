import React, { Suspense, lazy, useEffect, useRef } from 'react';
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import { useDataStore } from './stores/useDataStore';
import ErrorBoundary from './components/ErrorBoundary';
import ProtectedRoute from './components/ProtectedRoute';
import LoadingSpinner from './components/LoadingSpinner';
import { AuthCallback } from './components/AuthCallback';
import FirstLoginPasswordModal from './components/FirstLoginPasswordModal';
import { useFirstLogin } from './hooks/useFirstLogin';

// Lazy loading des composants lourds
const AuthPage = lazy(() => import('./pages/AuthPage'));
const SetPassword = lazy(() => import('./pages/SetPassword'));
const AdminLayout = lazy(() => import('./layouts/AdminLayout'));
const CoachLayout = lazy(() => import('./layouts/CoachLayout'));
const ClientLayout = lazy(() => import('./layouts/ClientLayout'));
const LandingPage = lazy(() => import('./pages/LandingPage'));

const App: React.FC = () => {
  const { user, isAuthLoading, currentViewRole } = useAuth();
  const { isDataLoading } = useDataStore();
  const navigate = useNavigate();
  const lastViewRoleRef = useRef(currentViewRole);
  
  // Hook pour détecter la première connexion
  const { isFirstLogin, isLoading: isFirstLoginLoading, userEmail } = useFirstLogin(user?.id);
  const [showPasswordModal, setShowPasswordModal] = React.useState(false);

  // Afficher la modal si c'est la première connexion
  React.useEffect(() => {
    if (!isFirstLoginLoading && isFirstLogin && user) {
      setShowPasswordModal(true);
    }
  }, [isFirstLogin, isFirstLoginLoading, user]);

  const handlePasswordChanged = () => {
    setShowPasswordModal(false);
    // Optionnel: afficher une notification de succès
  };

  const shouldDisplayLoading = isAuthLoading || (user && isDataLoading);

  useEffect(() => {
    if (!user) {
      lastViewRoleRef.current = currentViewRole;
      return;
    }

    if (user.role !== 'admin') {
      lastViewRoleRef.current = user.role;
      return;
    }

    if (lastViewRoleRef.current === currentViewRole) {
      return;
    }

    const targetPath = currentViewRole === 'client' ? '/app/workout' : '/app';
    navigate(targetPath, { replace: true });
    lastViewRoleRef.current = currentViewRole;
  }, [currentViewRole, navigate, user]);

  if (shouldDisplayLoading) {
    return <LoadingSpinner fullScreen message="Vérification de la session..." />;
  }

  // This component decides which layout to show based on the user's role
  // It is always rendered within ProtectedRoute, so 'user' is guaranteed to exist.
  const RoleBasedLayout = () => {
    const effectiveRole = user!.role === 'admin' ? currentViewRole : user!.role;

    switch (effectiveRole) {
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
      
      {/* Modal de changement de mot de passe à la première connexion */}
      <FirstLoginPasswordModal
        isOpen={showPasswordModal}
        onClose={() => setShowPasswordModal(false)}
        onPasswordChanged={handlePasswordChanged}
        userEmail={userEmail}
      />
      
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
