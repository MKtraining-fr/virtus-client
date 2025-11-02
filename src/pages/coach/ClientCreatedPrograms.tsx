import React from 'react';
import { useAuth } from '../../context/AuthContext';
import ClientCreatedProgramsList from '../../components/coach/ClientCreatedProgramsList';

const ClientCreatedPrograms: React.FC = () => {
  const { user } = useAuth();

  if (!user || user.role !== 'coach') {
    return <div>Accès refusé</div>;
  }

  return (
    <div className="max-w-7xl mx-auto p-4 sm:px-6 lg:px-8">
      <div className="mb-6">
        <h1 className="text-3xl font-extrabold text-gray-900">
          Programmes Créés par Mes Clients
        </h1>
        <p className="text-gray-600 mt-2">
          Consultez et gérez les programmes d'entraînement créés par vos clients.
        </p>
      </div>
      <ClientCreatedProgramsList coachId={user.id} />
    </div>
  );
};

export default ClientCreatedPrograms;
