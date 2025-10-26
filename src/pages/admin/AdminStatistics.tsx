import React, { useMemo } from 'react';
import { useAuth } from '../../context/AuthContext.tsx';
import Card from '../../components/Card.tsx';
import BarChart from '../../components/charts/BarChart.tsx';
import StatCard from '../../components/admin/StatCard.tsx';
import {
  UserGroupIcon,
  AcademicCapIcon,
  CurrencyEuroIcon,
  SparklesIcon,
  ShoppingBagIcon,
} from '../../constants/icons.ts';

const AdminStatistics: React.FC = () => {
  const { clients, professionalFormations } = useAuth();

  const stats = useMemo(() => {
    const coachCount = clients.filter((c) => c.role === 'coach').length;
    const clientCount = clients.filter((c) => c.role === 'client').length;
    return {
      totalUsers: clients.length,
      coachCount,
      clientCount,
      proFormationsCount: professionalFormations.length,
    };
  }, [clients, professionalFormations]);

  // Mock data for the chart
  const userEvolutionData = [
    { label: 'Jan', coaches: 2, clients: 10 },
    { label: 'Fév', coaches: 2, clients: 15 },
    { label: 'Mar', coaches: 3, clients: 22 },
    { label: 'Avr', coaches: 3, clients: 28 },
    { label: 'Mai', coaches: 4, clients: 35 },
    { label: 'Juin', coaches: 4, clients: 42 },
  ];

  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-800 mb-8">Statistiques de la Plateforme</h1>

      {/* Section: Statistiques Générales */}
      <h2 className="text-xl font-semibold text-gray-700 mb-4">Statistiques Générales</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
        <StatCard title="Utilisateurs Totaux" value={stats.totalUsers}>
          <UserGroupIcon className="w-8 h-8" />
        </StatCard>
        <StatCard title="Coachs" value={stats.coachCount}>
          <UserGroupIcon className="w-8 h-8" />
        </StatCard>
        <StatCard title="Clients & Prospects" value={stats.clientCount}>
          <UserGroupIcon className="w-8 h-8" />
        </StatCard>
        <StatCard title="Formations Pro Créées" value={stats.proFormationsCount}>
          <AcademicCapIcon className="w-8 h-8" />
        </StatCard>
      </div>

      {/* Section: Monétisation & Boutique */}
      <h2 className="text-xl font-semibold text-gray-700 mb-4">Monétisation & Boutique</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
        <StatCard title="Ventes de formations" value="1,250 €">
          <CurrencyEuroIcon className="w-8 h-8" />
        </StatCard>
        <StatCard title="Tokens générés" value="25,800">
          <SparklesIcon className="w-8 h-8" />
        </StatCard>
        <Card className="p-6 text-center bg-gray-50 border-2 border-dashed">
          <div className="mx-auto w-16 h-16 rounded-full bg-gray-200 text-gray-500 flex items-center justify-center">
            <ShoppingBagIcon className="w-8 h-8" />
          </div>
          <p className="text-xl font-bold text-gray-500 mt-4">N/A</p>
          <p className="text-gray-400 mt-1">Futures stats boutique</p>
        </Card>
      </div>

      {/* Section: Graphiques */}
      <h2 className="text-xl font-semibold text-gray-700 mb-4">Graphiques</h2>
      <Card className="p-6">
        <BarChart
          title="Évolution des utilisateurs (6 derniers mois)"
          data={userEvolutionData}
          keys={['coaches', 'clients']}
          colors={{ coaches: '#6D5DD3', clients: '#A094E8' }}
          labels={{ coaches: 'Coachs', clients: 'Clients' }}
        />
      </Card>
    </div>
  );
};

export default AdminStatistics;
