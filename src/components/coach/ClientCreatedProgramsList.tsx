import React, { useEffect, useState } from 'react';
import {
  getClientCreatedProgramsForCoach,
  markProgramAsViewedByCoach,
  ClientCreatedProgramView,
} from '../../services/coachProgramViewService';
import Card from '../Card';
import Button from '../Button';

interface ClientCreatedProgramsListProps {
  coachId: string;
  onProgramClick?: (program: ClientCreatedProgramView) => void;
}

const ClientCreatedProgramsList: React.FC<ClientCreatedProgramsListProps> = ({
  coachId,
  onProgramClick,
}) => {
  const [programs, setPrograms] = useState<ClientCreatedProgramView[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPrograms = async () => {
      setLoading(true);
      const data = await getClientCreatedProgramsForCoach(coachId);
      setPrograms(data);
      setLoading(false);
    };

    fetchPrograms();
  }, [coachId]);

  if (loading) {
    return (
      <div className="text-center py-4">Chargement des programmes créés par les clients...</div>
    );
  }

  if (programs.length === 0) {
    return (
      <Card>
        <p className="text-gray-500 text-center py-4">
          Aucun programme créé par vos clients pour le moment.
        </p>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <h3 className="text-xl font-bold text-gray-900">Programmes Créés par Mes Clients</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {programs.map((program) => (
          <Card key={program.id} className="hover:shadow-lg transition-shadow">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h4 className="text-lg font-semibold text-gray-900">{program.name}</h4>
                <p className="text-sm text-gray-600 mt-1">
                  <span className="font-medium">Client :</span> {program.client_name}
                </p>
                <p className="text-sm text-gray-600">
                  <span className="font-medium">Objectif :</span> {program.objective || 'Non défini'}
                </p>
                <p className="text-sm text-gray-600">
                  <span className="font-medium">Durée :</span> {program.week_count} semaine(s)
                </p>
                <p className="text-sm text-gray-600">
                  <span className="font-medium">Statut :</span>{' '}
                  <span
                    className={`px-2 py-1 rounded text-xs ${
                      program.status === 'assigned'
                        ? 'bg-green-100 text-green-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}
                  >
                    {program.status === 'assigned' ? 'Assigné' : 'Brouillon'}
                  </span>
                </p>
              </div>
              <div className="flex flex-col gap-1">
                {program.source_type === 'coach_assigned' && (
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                    🎯 Assigné par coach
                  </span>
                )}
                {program.source_type === 'client_created' && (
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                    ✍️ Créé par client
                  </span>
                )}
                {program.modified_by_client && !program.viewed_by_coach && (
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 animate-pulse">
                    🔔 Modifié (non vu)
                  </span>
                )}
                {program.modified_by_client && program.viewed_by_coach && (
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                    ✅ Modifié (vu)
                  </span>
                )}
              </div>
            </div>
            <div className="mt-4 flex gap-2">
              {onProgramClick && (
                <Button onClick={() => onProgramClick(program)} variant="secondary" className="flex-1">
                  Voir les détails
                </Button>
              )}
              {program.modified_by_client && !program.viewed_by_coach && (
                <Button
                  onClick={async () => {
                    const success = await markProgramAsViewedByCoach(program.id);
                    if (success) {
                      // Rafraîchir la liste
                      const data = await getClientCreatedProgramsForCoach(coachId);
                      setPrograms(data);
                    }
                  }}
                  variant="primary"
                  className="flex-1"
                >
                  👁️ Marquer comme vu
                </Button>
              )}
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default ClientCreatedProgramsList;
