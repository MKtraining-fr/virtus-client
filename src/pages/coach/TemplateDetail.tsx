import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getTemplateDetails } from '../../services/coachClientProgramService';
import ProgramDetailView from '../../components/ProgramDetailView';
import Button from '../../components/Button';
import { WorkoutProgram } from '../../types';

/**
 * Page de détail d'un template de programme côté coach
 * Affiche le tableau complet des séances et exercices du template
 */
const TemplateDetail: React.FC = () => {
  const { templateId } = useParams<{ templateId: string }>();
  const navigate = useNavigate();
  const [template, setTemplate] = useState<WorkoutProgram | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTemplate = async () => {
      if (!templateId) return;
      setLoading(true);
      const data = await getTemplateDetails(templateId);
      setTemplate(data);
      setLoading(false);
    };

    fetchTemplate();
  }, [templateId]);

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto p-4 sm:px-6 lg:px-8">
        <div className="text-center py-10">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          <p className="mt-4 text-gray-600">Chargement du template...</p>
        </div>
      </div>
    );
  }

  if (!template) {
    return (
      <div className="max-w-7xl mx-auto p-4 sm:px-6 lg:px-8">
        <div className="text-center py-10">
          <p className="text-gray-500 text-lg">Template introuvable.</p>
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

      {/* En-tête du template */}
      <div className="mb-6 bg-white rounded-lg shadow p-6">
        <div className="flex items-center gap-3 mb-2">
          <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-indigo-100 text-indigo-800">
            📚 Template
          </span>
        </div>
        <h1 className="text-3xl font-extrabold text-gray-900">{template.name}</h1>
        {template.objective && (
          <p className="text-gray-600 mt-2 text-lg">{template.objective}</p>
        )}
        <div className="mt-4 flex gap-6 text-sm text-gray-600">
          <div>
            <span className="font-medium">Durée :</span> {template.weekCount} semaine{template.weekCount > 1 ? 's' : ''}
          </div>
          <div>
            <span className="font-medium">Séances par semaine :</span>{' '}
            {Object.keys(template.sessionsByWeek).length > 0
              ? (template.sessionsByWeek[1] || []).length
              : 0}
          </div>
        </div>
        <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
          <p className="text-sm text-blue-800">
            💡 <strong>Template réutilisable :</strong> Ce programme peut être assigné à plusieurs clients. 
            Chaque assignation créera une copie indépendante que le client pourra suivre et modifier.
          </p>
        </div>
      </div>

      {/* Tableau détaillé du template */}
      <div className="bg-white rounded-lg shadow">
        <ProgramDetailView program={template} />
      </div>
    </div>
  );
};

export default TemplateDetail;
