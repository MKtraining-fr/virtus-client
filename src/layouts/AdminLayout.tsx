import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import AdminSidebar from '../components/admin/AdminSidebar.tsx';
import Header from '../components/Header.tsx';
import AdminDashboard from '../pages/admin/AdminDashboard.tsx';
import UserManagement from '../pages/admin/UserManagement.tsx';
import DataImport from '../pages/admin/DataImport.tsx';
import ViewBanner from '../components/ViewBanner.tsx';
import ViewSwitcherModal from '../components/ViewSwitcherModal.tsx';
import { useAuth } from '../context/AuthContext';
import { useLocation } from 'react-router-dom';
import ProFormationManagement from '../pages/admin/ProFormationManagement.tsx';
import AdminStatistics from '../pages/admin/AdminStatistics.tsx';
import ShopManagement from '../pages/admin/ShopManagement.tsx';
import ClientFormationManagement from '../pages/admin/ClientFormationManagement.tsx';
import WorkoutDatabase from '../pages/WorkoutDatabase.tsx';

const AdminLayout: React.FC = () => {
  const { currentViewRole } = useAuth();
  const location = useLocation();
  const isAdminView = currentViewRole === 'admin';

  // Si l'utilisateur est en mode Coach ou Client, on le redirige vers le layout approprié
  if (currentViewRole !== 'admin') {
    const targetPath = currentViewRole === 'client' ? '/app/workout' : '/app';
    return <Navigate to={targetPath} state={{ from: location }} replace />;
  }
  return (
    <div className="flex h-screen bg-light-bg font-sans text-dark-text">
      <AdminSidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <ViewBanner />
        <Header />
        <ViewSwitcherModal isOpen={!isAdminView} onClose={() => {}} />
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-light-bg p-6 md:p-8">
          <Routes>
            <Route path="/" element={<AdminDashboard />} />
            <Route path="users" element={<UserManagement />} />
            <Route path="stats" element={<AdminStatistics />} />
            <Route path="pro-formations" element={<ProFormationManagement />} />
            <Route path="client-formations" element={<ClientFormationManagement />} />
            <Route path="shop" element={<ShopManagement />} />
            <Route path="exercises" element={<WorkoutDatabase />} />
            <Route path="import" element={<DataImport />} />
            <Route path="*" element={<Navigate to="/app" replace />} />
          </Routes>
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
