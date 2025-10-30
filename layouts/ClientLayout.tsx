import React, { useMemo, useEffect } from 'react';
import { Routes, Route, useLocation, Navigate } from 'react-router-dom';
import ImpersonationBanner from '../components/ImpersonationBanner.tsx';
import ClientHeader from '../components/client/ClientHeader.tsx';
import ClientBottomNav from '../components/client/ClientBottomNav.tsx';

// Main pages
import ClientWorkout from '../pages/client/ClientWorkout.tsx';
import ClientLibrary from '../pages/client/ClientLibrary.tsx';
import ClientProfile from '../pages/client/ClientProfile.tsx';
import ClientNutrition from '../pages/client/ClientNutrition.tsx';
import ClientMessaging from '../pages/client/ClientMessaging.tsx';
import ClientShop from '../pages/client/ClientShop.tsx';

// Library sub-pages
import MusculationLibrary from '../pages/client/library/MusculationLibrary.tsx';
import MobiliteLibrary from '../pages/client/library/MobiliteLibrary.tsx';
import EchauffementLibrary from '../pages/client/library/EchauffementLibrary.tsx';
import GlossaireLibrary from '../pages/client/library/GlossaireLibrary.tsx';
import FormationLibrary from '../pages/client/library/FormationLibrary.tsx';

// Workout sub-pages
import ClientCurrentProgram from '../pages/client/workout/ClientCurrentProgram.tsx';
import ClientWorkoutBuilder from '../pages/client/workout/ClientWorkoutBuilder.tsx';
import ClientMyPrograms from '../pages/client/workout/ClientMyPrograms.tsx';

import { CLIENT_NAV_ITEMS } from '../constants/clientConstants.tsx';

const pathTitleMap: Record<string, string> = {
    '/library/musculation': 'Musculation',
    '/library/mobilite': 'Mobilité',
    '/library/echauffement': 'Échauffement',
    '/library/glossaire': 'Glossaire',
    '/library/formation': 'Formation',
    '/workout/current-program': 'Programme en cours',
    '/workout/builder': 'Créateur de séance',
    '/workout/my-programs': 'Mes Programmes',
};

const ClientLayout: React.FC = () => {
    const location = useLocation();

    // Temporarily disabled camera permission request for testing
    /*
    useEffect(() => {
        const requestCameraPermission = async () => {
            if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
                try {
                    const stream = await navigator.mediaDevices.getUserMedia({ video: true });
                    // Permission granted, we can stop the stream immediately
                    stream.getTracks().forEach(track => track.stop());
                } catch (err) {
                    console.warn("Camera permission was denied or an error occurred:", err);
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
        
        const currentNav = CLIENT_NAV_ITEMS.find(item => pathSuffix.startsWith(item.path.split('/app')[1]));
        return currentNav?.name || 'Entraînement';
    }, [location.pathname]);

    return (
        <div className="flex flex-col min-h-screen bg-client-dark text-client-light font-sans">
            <ImpersonationBanner />
            <ClientHeader title={currentPageTitle} />
            
            <main className="flex-1 overflow-y-auto pb-20 px-4 pt-4">
              <Routes>
                  <Route path="/" element={<Navigate to="workout" replace />} />
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
                  <Route path="nutrition" element={<ClientNutrition />} />
                  <Route path="messaging" element={<ClientMessaging />} />
                  <Route path="shop" element={<ClientShop />} />
                  <Route path="*" element={<Navigate to="workout" replace />} />
              </Routes>
            </main>

            <ClientBottomNav />
        </div>
    );
};

export default ClientLayout;