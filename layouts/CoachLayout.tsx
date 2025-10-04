import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import CoachSidebar from '../components/coach/CoachSidebar.tsx';
import Header from '../components/Header.tsx';
import Dashboard from '../pages/Dashboard.tsx';
import Clients from '../pages/Clients.tsx';
import NewBilan from '../pages/NewBilan.tsx';
import BilanArchive from '../pages/BilanArchive.tsx';
import WorkoutBuilder from '../pages/WorkoutBuilder.tsx';
import WorkoutLibrary from '../pages/WorkoutLibrary.tsx';
import WorkoutDatabase from '../pages/WorkoutDatabase.tsx';
import Nutrition from '../pages/Nutrition.tsx';
import Messaging from '../pages/Messaging.tsx';
import ComingSoon from '../pages/ComingSoon.tsx';
import ClientProfile from '../pages/ClientProfile.tsx';
import ImpersonationBanner from '../components/ImpersonationBanner.tsx';
import CoachFormations from '../pages/coach/CoachFormations.tsx';
import ProFormationDetail from '../pages/coach/ProFormationDetail.tsx';
import NutritionLibrary from '../pages/coach/NutritionLibrary.tsx';
import NutritionDatabase from '../pages/coach/NutritionDatabase.tsx';

const CoachLayout: React.FC = () => {
  return (
    <div className="flex h-screen bg-light-bg font-sans text-dark-text">
      <CoachSidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <ImpersonationBanner />
        <Header />
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-light-bg p-6 md:p-8">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="clients" element={<Clients />} />
            <Route path="client/:id" element={<ClientProfile />} />
            <Route path="bilan/nouveau" element={<NewBilan />} />
            <Route path="bilan/archive" element={<BilanArchive />} />
            <Route path="musculation/createur" element={<WorkoutBuilder />} />
            <Route path="musculation/bibliotheque" element={<WorkoutLibrary />} />
            <Route path="musculation/database" element={<WorkoutDatabase />} />
            <Route path="nutrition/createur" element={<Nutrition />} />
            <Route path="nutrition/bibliotheque" element={<NutritionLibrary />} />
             <Route path="nutrition/ciqual" element={<NutritionDatabase />} />
            <Route path="formations" element={<CoachFormations />} />
            <Route path="formations/pro/:id" element={<ProFormationDetail />} />
            <Route path="messagerie" element={<Messaging />} />
            <Route path="parametres" element={<ComingSoon title="Paramètres" />} />
            <Route path="*" element={<Navigate to="/app" replace />} />
          </Routes>
        </main>
      </div>
    </div>
  );
};

export default CoachLayout;