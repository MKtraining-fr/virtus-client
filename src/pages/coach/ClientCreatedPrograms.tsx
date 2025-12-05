import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import ClientCreatedProgramsList from '../../components/coach/ClientCreatedProgramsList';
import { ClientCreatedProgramView } from '../../services/coachProgramViewService';

const ClientCreatedPrograms: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  if (!user || user.role !== 'coach') {
    return <div>Accès refusé</div>;
  }

  const handleProgramClick = (program: ClientCreatedProgramView) => {
    navigate(`/coach/programs/${program.id}`);
  };

  return (
    <div className="max-w-7xl mx-auto p-4 sm:px-6 lg:px-8">
      <div className="mb-6">
        <h1 className="text-3xl font-extrabold text-gray-900">
          Bibliothèque d'Entraînement
        </h1>
        <p className="text-gray-600 mt-2">
          Consultez et gérez les programmes d'entraînement de vos clients.
        </p>
      </div>
      <ClientCreatedProgramsList coachId={user.id} onProgramClick={handleProgramClick} />
    </div>
  );
};

export default ClientCreatedPrograms;
