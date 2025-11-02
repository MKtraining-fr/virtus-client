import React, { useEffect, useState } from 'react';
import {
  getClientCreatedProgramsForCoach,
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
                      program.status === 'active'
                        ? 'bg-green-100 text-green-800'
                        : program.status === 'completed'
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-gray-100 text-gray-800'
                    }`}
                  >
                    {program.status}
                  </span>
                </p>
              </div>
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                Créé par le client
              </span>
            </div>
            {onProgramClick && (
              <div className="mt-4">
                <Button onClick={() => onProgramClick(program)} variant="secondary" className="w-full">
                  Voir les détails
                </Button>
              </div>
            )}
          </Card>
        ))}
      </div>
    </div>
  );
};

export default ClientCreatedProgramsList;
