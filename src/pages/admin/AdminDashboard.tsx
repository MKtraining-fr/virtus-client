import React from 'react';
import { Link } from 'react-router-dom';
import Card from '../../components/Card.tsx';
import { useAuth } from '../../context/AuthContext.tsx';
import { UserGroupIcon, ArrowDownTrayIcon, ChartBarIcon } from '../../constants/icons.ts';

const AdminDashboard: React.FC = () => {
  const { clients } = useAuth();
  const coachCount = clients.filter((c) => c.role === 'coach').length;
  const clientCount = clients.filter((c) => c.role === 'client').length;

  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-800 mb-6">Tableau de bord Administrateur</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Link to="/app/users" className="h-full">
          <Card className="p-6 text-center hover:shadow-primary/20 h-full">
            <UserGroupIcon className="w-12 h-12 mx-auto text-primary" />
            <h2 className="mt-4 text-xl font-semibold">Gestion des utilisateurs</h2>
            <p className="mt-2 text-sm text-gray-500">
              {coachCount} coach(s) et {clientCount} client(s) enregistrés.
            </p>
          </Card>
        </Link>
        <Link to="/app/import" className="h-full">
          <Card className="p-6 text-center hover:shadow-primary/20 h-full">
            <ArrowDownTrayIcon className="w-12 h-12 mx-auto text-primary" />
            <h2 className="mt-4 text-xl font-semibold">Import de données</h2>
            <p className="mt-2 text-sm text-gray-500">
              Importer des exercices ou d'autres données via des fichiers CSV.
            </p>
          </Card>
        </Link>
        <Link to="/app/stats" className="h-full">
          <Card className="p-6 text-center hover:shadow-primary/20 h-full">
            <ChartBarIcon className="w-12 h-12 mx-auto text-primary" />
            <h2 className="mt-4 text-xl font-semibold">Statistiques</h2>
            <p className="mt-2 text-sm text-gray-500">
              Visualisez les données clés et les métriques d'utilisation de la plateforme.
            </p>
          </Card>
        </Link>
      </div>
    </div>
  );
};

export default AdminDashboard;
