import React, { useMemo, useEffect } from 'react';
import { Routes, Route, useLocation, Navigate } from 'react-router-dom';
import ViewBanner from '../components/ViewBanner.tsx';
import ClientHeader from '../components/client/ClientHeader';
import ClientBottomNav from '../components/client/ClientBottomNav';
import { useAuth } from '../context/AuthContext';

// Main pages
import ClientWorkout from '../pages/client/ClientWorkout';
import ClientLibrary from '../pages/client/ClientLibrary';
import ClientProfile from '../pages/client/ClientProfile';
import ClientMessaging from '../pages/client/ClientMessaging';
import ClientShop from '../pages/client/ClientShop';
import NutritionRouter from '../pages/client/NutritionRouter';

// Library sub-pages
import MusculationLibrary from '../pages/client/library/MusculationLibrary';
import MobiliteLibrary from '../pages/client/library/MobiliteLibrary';
import EchauffementLibrary from '../pages/client/library/EchauffementLibrary';
import GlossaireLibrary from '../pages/client/library/GlossaireLibrary';
import FormationLibrary from '../pages/client/library/FormationLibrary';

// Workout sub-pages
import ClientCurrentProgram from '../pages/client/workout/ClientCurrentProgram';
import ClientWorkoutBuilder from '../pages/client/workout/ClientWorkoutBuilder';
import ClientMyPrograms from '../pages/client/workout/ClientMyPrograms';

import { CLIENT_NAV_ITEMS } from '../constants/navigation';

const pathTitleMap: Record<string, string> = {
  '/library/musculation': 'Musculation',
  '/library/mobilite': 'Mobilité',
  '/library/echauffement': 'Échauffement',
  '/library/glossaire': 'Glossaire',
  '/library/formation': 'Formation',
  '/workout/current-program': 'Programme en cours',
  '/workout/builder': 'Créateur de séance',
  '/workout/my-programs': 'Mes Programmes',
  '/nutrition/journal': 'Journal',
  '/nutrition/menus': 'Menus & Plans',
  '/nutrition/recettes': 'Recettes',
  '/nutrition/aliments': 'Aliments',
};

const ClientLayout: React.FC = () => {
  const location = useLocation();
  const { user, theme, currentViewRole } = useAuth();

  // Redirection de l'administrateur si la vue n'est pas Client
  if (user?.role === 'admin' && currentViewRole === 'admin') {
    return <Navigate to="/app" replace />;
  }

  // Si l'utilisateur n'est pas un admin, on vérifie que c'est bien un client
  if (user?.role !== 'client' && currentViewRole !== 'client') {
    return <Navigate to="/login" replace />;
  }

  useEffect(() => {
    const root = window.document.documentElement;
    root.classList.remove('light', 'dark');
    root.classList.add(theme);
  }, [theme]);

  // Temporarily disabled camera permission request for testing
  /*
  useEffect(() => {
    const requestCameraPermission = async () => {
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        try {
          const stream = await navigator.mediaDevices.getUserMedia({ video: true });
          // Permission granted, we can stop the stream immediately
          stream.getTracks().forEach((track) => track.stop());
        } catch (err) {
          console.warn('Camera permission was denied or an error occurred:', err);
        }
      }
    };

    requestCameraPermission();
  }, []);
  */

  const currentPageTitle = useMemo(() => {
    const pathSuffix = location.pathname.split('/app')[1] || '/';

    // Check for specific sub-paths first
    for (const path in pathTitleMap) {
      if (pathSuffix.startsWith(path)) {
        return pathTitleMap[path];
      }
    }

    if (pathSuffix.startsWith('/shop')) {
      return 'Boutique';
    }

    const currentNav = CLIENT_NAV_ITEMS.find((item) =>
      pathSuffix.startsWith(item.path.split('/app')[1])
    );
    return currentNav?.name || 'Entraînement';
  }, [location.pathname]);

  const canAccessShop =
    (user?.shopAccess?.adminShop ?? true) || (user?.shopAccess?.coachShop ?? true);

  return (
    <div className="flex flex-col min-h-screen bg-gray-100 dark:bg-client-dark font-sans dark:text-client-light">
      <ViewBanner />
      <ClientHeader title={currentPageTitle} />

      <main className="flex-1 overflow-y-auto pb-20 px-4 pt-4">
        <Routes>
          <Route path="/" element={<Navigate to="/app/workout" replace />} />
          <Route path="library" element={<ClientLibrary />} />
          <Route path="library/musculation" element={<MusculationLibrary />} />
          <Route path="library/mobilite" element={<MobiliteLibrary />} />
          <Route path="library/echauffement" element={<EchauffementLibrary />} />
          <Route path="library/glossaire" element={<GlossaireLibrary />} />
          <Route path="library/formation" element={<FormationLibrary />} />
          <Route path="workout" element={<ClientWorkout />} />
          <Route path="workout/current-program" element={<ClientCurrentProgram />} />
          <Route path="workout/builder" element={<ClientWorkoutBuilder />} />
          <Route path="workout/my-programs" element={<ClientMyPrograms />} />
          <Route path="profile" element={<ClientProfile />} />
          <Route path="nutrition/*" element={<NutritionRouter />} />
          <Route path="messaging" element={<ClientMessaging />} />
          <Route
            path="shop"
            element={canAccessShop ? <ClientShop /> : <Navigate to="/app/workout" replace />}
          />
          <Route path="*" element={<Navigate to="/app/workout" replace />} />
        </Routes>
      </main>

      <ClientBottomNav />
    </div>
  );
};

export default ClientLayout;
