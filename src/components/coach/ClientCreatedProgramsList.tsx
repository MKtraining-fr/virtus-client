import React, { useEffect, useState } from 'react';
import {
  getAllCoachPrograms,
  markProgramAsViewedByCoach,
  ClientCreatedProgramView,
  CoachProgramTemplate,
} from '../../services/coachProgramViewService';
import Card from '../Card';
import Button from '../Button';

interface ClientCreatedProgramsListProps {
  coachId: string;
  onProgramClick?: (program: ClientCreatedProgramView | CoachProgramTemplate) => void;
  onTemplateClick?: (template: CoachProgramTemplate) => void;
}

const ClientCreatedProgramsList: React.FC<ClientCreatedProgramsListProps> = ({
  coachId,
  onProgramClick,
  onTemplateClick,
}) => {
  const [templates, setTemplates] = useState<CoachProgramTemplate[]>([]);
  const [assignedPrograms, setAssignedPrograms] = useState<ClientCreatedProgramView[]>([]);
  const [clientCreatedPrograms, setClientCreatedPrograms] = useState<ClientCreatedProgramView[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAllPrograms = async () => {
    setLoading(true);
    const data = await getAllCoachPrograms(coachId);
    setTemplates(data.templates);
    setAssignedPrograms(data.assignedPrograms);
    setClientCreatedPrograms(data.clientCreatedPrograms);
    setLoading(false);
  };

  useEffect(() => {
    fetchAllPrograms();
  }, [coachId]);

  if (loading) {
    return (
      <div className="text-center py-10">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        <p className="mt-4 text-gray-600">Chargement de la bibliothèque d'entraînement...</p>
      </div>
    );
  }

  const hasNoContent = templates.length === 0 && assignedPrograms.length === 0 && clientCreatedPrograms.length === 0;

  if (hasNoContent) {
    return (
      <Card>
        <p className="text-gray-500 text-center py-8">
          Aucun programme dans votre bibliothèque pour le moment.
        </p>
        <p className="text-gray-400 text-center text-sm">
          Créez votre premier programme via le Workout Builder pour le voir apparaître ici.
        </p>
      </Card>
    );
  }

  return (
    <div className="space-y-8">
      {/* Section 1 : Templates créés par le coach */}
      {templates.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <h3 className="text-xl font-bold text-gray-900">Mes Templates</h3>
            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800">
              📚 {templates.length} template{templates.length > 1 ? 's' : ''}
            </span>
          </div>
          <p className="text-sm text-gray-600">
            Templates de programmes réutilisables que vous pouvez assigner à vos clients.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {templates.map((template) => (
              <Card key={template.id} className="hover:shadow-lg transition-shadow">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800">
                        📚 Template
                      </span>
                    </div>
                    <h4 className="text-lg font-semibold text-gray-900">{template.name}</h4>
                    <p className="text-sm text-gray-600 mt-1">
                      <span className="font-medium">Objectif :</span> {template.objective || 'Non défini'}
                    </p>
                    <p className="text-sm text-gray-600">
                      <span className="font-medium">Durée :</span> {template.week_count} semaine{template.week_count > 1 ? 's' : ''}
                    </p>
                    {template.sessions_per_week && (
                      <p className="text-sm text-gray-600">
                        <span className="font-medium">Séances/semaine :</span> {template.sessions_per_week}
                      </p>
                    )}
                  </div>
                </div>
                <div className="mt-4 flex gap-2">
                  {onTemplateClick && (
                    <Button onClick={() => onTemplateClick(template)} variant="secondary" className="flex-1">
                      Voir les détails
                    </Button>
                  )}
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Section 2 : Programmes assignés aux clients */}
      {assignedPrograms.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <h3 className="text-xl font-bold text-gray-900">Programmes Assignés</h3>
            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
              🎯 {assignedPrograms.length} assigné{assignedPrograms.length > 1 ? 's' : ''}
            </span>
          </div>
          <p className="text-sm text-gray-600">
            Programmes que vous avez assignés à vos clients. Vous pouvez suivre leur progression.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {assignedPrograms.map((program) => (
              <Card key={program.id} className="hover:shadow-lg transition-shadow">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        🎯 Assigné
                      </span>
                    </div>
                    <h4 className="text-lg font-semibold text-gray-900">{program.name}</h4>
                    <p className="text-sm text-gray-600 mt-1">
                      <span className="font-medium">Client :</span> {program.client_name}
                    </p>
                    <p className="text-sm text-gray-600">
                      <span className="font-medium">Objectif :</span> {program.objective || 'Non défini'}
                    </p>
                    <p className="text-sm text-gray-600">
                      <span className="font-medium">Durée :</span> {program.week_count} semaine{program.week_count > 1 ? 's' : ''}
                    </p>
                  </div>
                  <div className="flex flex-col gap-1">
                    {program.modified_by_client && !program.viewed_by_coach && (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 animate-pulse">
                        🔔 Modifié
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
                          await fetchAllPrograms();
                        }
                      }}
                      variant="primary"
                      className="flex-1"
                    >
                      👁️ Marquer vu
                    </Button>
                  )}
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Section 3 : Programmes créés par les clients */}
      {clientCreatedPrograms.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <h3 className="text-xl font-bold text-gray-900">Programmes Créés par Mes Clients</h3>
            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
              ✍️ {clientCreatedPrograms.length} créé{clientCreatedPrograms.length > 1 ? 's' : ''}
            </span>
          </div>
          <p className="text-sm text-gray-600">
            Programmes créés par vos clients de manière autonome. Vous pouvez les consulter et les modifier.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {clientCreatedPrograms.map((program) => (
              <Card key={program.id} className="hover:shadow-lg transition-shadow">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                        ✍️ Créé par client
                      </span>
                    </div>
                    <h4 className="text-lg font-semibold text-gray-900">{program.name}</h4>
                    <p className="text-sm text-gray-600 mt-1">
                      <span className="font-medium">Client :</span> {program.client_name}
                    </p>
                    <p className="text-sm text-gray-600">
                      <span className="font-medium">Objectif :</span> {program.objective || 'Non défini'}
                    </p>
                    <p className="text-sm text-gray-600">
                      <span className="font-medium">Durée :</span> {program.week_count} semaine{program.week_count > 1 ? 's' : ''}
                    </p>
                  </div>
                  <div className="flex flex-col gap-1">
                    {program.modified_by_client && !program.viewed_by_coach && (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 animate-pulse">
                        🔔 Nouveau
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
                          await fetchAllPrograms();
                        }
                      }}
                      variant="primary"
                      className="flex-1"
                    >
                      👁️ Marquer vu
                    </Button>
                  )}
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default ClientCreatedProgramsList;
