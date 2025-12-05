import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getClientProgramDetails } from '../../services/coachClientProgramService';
import ProgramDetailView from '../../components/ProgramDetailView';
import Button from '../../components/Button';
import { WorkoutProgram } from '../../types';

/**
 * Page de détail d'un programme côté coach
 * Affiche le tableau complet des séances et exercices
 */
const ProgramDetail: React.FC = () => {
  const { programId } = useParams<{ programId: string }>();
  const navigate = useNavigate();
  const [program, setProgram] = useState<WorkoutProgram | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProgram = async () => {
      if (!programId) return;
      setLoading(true);
      const data = await getClientProgramDetails(programId);
      setProgram(data);
      setLoading(false);
    };

    fetchProgram();
  }, [programId]);

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto p-4 sm:px-6 lg:px-8">
        <div className="text-center py-10">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          <p className="mt-4 text-gray-600">Chargement du programme...</p>
        </div>
      </div>
    );
  }

  if (!program) {
    return (
      <div className="max-w-7xl mx-auto p-4 sm:px-6 lg:px-8">
        <div className="text-center py-10">
          <p className="text-gray-500 text-lg">Programme introuvable.</p>
          <Button onClick={() => navigate('/coach/programs')} className="mt-4">
            ← Retour à la bibliothèque
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-4 sm:px-6 lg:px-8">
      {/* Bouton retour */}
      <div className="mb-6">
        <Button onClick={() => navigate('/coach/programs')} variant="secondary">
          ← Retour à la bibliothèque
        </Button>
      </div>

      {/* En-tête du programme */}
      <div className="mb-6 bg-white rounded-lg shadow p-6">
        <h1 className="text-3xl font-extrabold text-gray-900">{program.name}</h1>
        {program.objective && (
          <p className="text-gray-600 mt-2 text-lg">{program.objective}</p>
        )}
        <div className="mt-4 flex gap-6 text-sm text-gray-600">
          <div>
            <span className="font-medium">Durée :</span> {program.weekCount} semaine(s)
          </div>
          <div>
            <span className="font-medium">Séances par semaine :</span>{' '}
            {Object.keys(program.sessionsByWeek).length > 0
              ? (program.sessionsByWeek[1] || []).length
              : 0}
          </div>
        </div>
      </div>

      {/* Tableau détaillé du programme */}
      <div className="bg-white rounded-lg shadow">
        <ProgramDetailView program={program} />
      </div>
    </div>
  );
};

export default ProgramDetail;
