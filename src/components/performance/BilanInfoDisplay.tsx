import React, { useState, useEffect } from 'react';
import { FileText, User, Target, Heart, AlertCircle, ChevronDown, ChevronUp } from 'lucide-react';
import { supabase } from '../../services/supabase';

interface BilanInfoDisplayProps {
  clientId: string;
}

interface BilanData {
  id: string;
  status: string;
  completed_at: string | null;
  data: {
    answers: Record<string, string | string[]>;
    template_name: string;
    template_snapshot: Array<{
      id: string;
      title: string;
      fields: Array<{
        id: string;
        type: string;
        label: string;
        options?: string[];
      }>;
    }>;
  };
}

export const BilanInfoDisplay: React.FC<BilanInfoDisplayProps> = ({ clientId }) => {
  const [bilanData, setBilanData] = useState<BilanData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isExpanded, setIsExpanded] = useState(false);

  useEffect(() => {
    fetchLatestBilan();
  }, [clientId]);

  const fetchLatestBilan = async () => {
    setIsLoading(true);
    try {
      // Récupérer le dernier bilan complété ou le plus récent
      const { data, error } = await supabase
        .from('bilan_assignments')
        .select('id, status, completed_at, data')
        .eq('client_id', clientId)
        .order('assigned_at', { ascending: false })
        .limit(1)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Error fetching bilan:', error);
      }
      
      setBilanData(data);
    } catch (error) {
      console.error('Error fetching bilan:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const formatAnswer = (answer: string | string[] | undefined): string => {
    if (!answer) return 'Non renseigné';
    if (Array.isArray(answer)) {
      return answer.length > 0 ? answer.join(', ') : 'Aucun';
    }
    return answer || 'Non renseigné';
  };

  const getFieldLabel = (fieldId: string): string => {
    const labelMap: Record<string, string> = {
      'objectif_principal': 'Objectif principal',
      'delai': 'Délai souhaité',
      'activite_physique': 'Niveau d\'activité',
      'profession': 'Profession',
      'allergies': 'Allergies alimentaires',
      'aversions': 'Aversions alimentaires',
      'habitudes': 'Habitudes alimentaires',
      'antecedents_medicaux': 'Antécédents médicaux',
      'notes_coach': 'Notes du coach'
    };
    return labelMap[fieldId] || fieldId;
  };

  const getFieldIcon = (fieldId: string) => {
    if (fieldId.includes('objectif') || fieldId.includes('delai')) {
      return <Target className="h-4 w-4 text-primary" />;
    }
    if (fieldId.includes('medical') || fieldId.includes('allergies')) {
      return <Heart className="h-4 w-4 text-red-500" />;
    }
    return <FileText className="h-4 w-4 text-gray-400" />;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-32">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!bilanData) {
    return (
      <div className="bg-gray-50 border border-dashed border-gray-200 rounded-xl p-6 text-center">
        <FileText className="h-8 w-8 text-gray-300 mx-auto mb-2" />
        <p className="text-sm text-gray-500">Aucun bilan initial disponible</p>
        <p className="text-xs text-gray-400 mt-1">Assignez un bilan au client pour voir ses informations ici.</p>
      </div>
    );
  }

  const answers = bilanData.data?.answers || {};
  const hasAnswers = Object.keys(answers).length > 0;

  // Champs importants à afficher en priorité
  const priorityFields = ['objectif_principal', 'delai', 'activite_physique', 'antecedents_medicaux', 'allergies'];
  const otherFields = Object.keys(answers).filter(key => !priorityFields.includes(key) && !key.includes('prenom') && !key.includes('nom') && !key.includes('email') && !key.includes('telephone') && !key.includes('taille') && !key.includes('poids') && !key.includes('date_naissance') && !key.includes('sexe'));

  return (
    <div className="space-y-4">
      {/* En-tête */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-lg bg-blue-50 flex items-center justify-center">
            <FileText className="h-4 w-4 text-blue-600" />
          </div>
          <div>
            <h4 className="font-medium text-gray-900">Informations du Bilan</h4>
            <p className="text-xs text-gray-500">
              {bilanData.status === 'completed' 
                ? `Complété le ${new Date(bilanData.completed_at || '').toLocaleDateString('fr-FR')}`
                : 'En attente de complétion'}
            </p>
          </div>
        </div>
        {bilanData.status !== 'completed' && (
          <span className="px-2 py-1 bg-yellow-100 text-yellow-700 text-xs font-medium rounded-full">
            En attente
          </span>
        )}
      </div>

      {!hasAnswers ? (
        <div className="bg-yellow-50 border border-yellow-100 rounded-xl p-4 flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-yellow-500 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-yellow-800">Bilan non complété</p>
            <p className="text-xs text-yellow-600 mt-1">
              Le client n'a pas encore rempli son bilan initial. Les informations apparaîtront ici une fois le bilan complété.
            </p>
          </div>
        </div>
      ) : (
        <>
          {/* Champs prioritaires */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {priorityFields.map(fieldId => {
              const value = answers[fieldId];
              if (!value) return null;
              
              return (
                <div key={fieldId} className="bg-gray-50 rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-2">
                    {getFieldIcon(fieldId)}
                    <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {getFieldLabel(fieldId)}
                    </span>
                  </div>
                  <p className="text-sm text-gray-900 whitespace-pre-wrap">
                    {formatAnswer(value)}
                  </p>
                </div>
              );
            })}
          </div>

          {/* Autres champs (accordéon) */}
          {otherFields.length > 0 && (
            <div className="border-t border-gray-100 pt-4">
              <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 transition-colors"
              >
                {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                {isExpanded ? 'Masquer les détails' : `Voir plus de détails (${otherFields.length})`}
              </button>
              
              {isExpanded && (
                <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                  {otherFields.map(fieldId => {
                    const value = answers[fieldId];
                    if (!value) return null;
                    
                    return (
                      <div key={fieldId} className="bg-gray-50 rounded-xl p-4">
                        <div className="flex items-center gap-2 mb-2">
                          {getFieldIcon(fieldId)}
                          <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                            {getFieldLabel(fieldId)}
                          </span>
                        </div>
                        <p className="text-sm text-gray-900 whitespace-pre-wrap">
                          {formatAnswer(value)}
                        </p>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default BilanInfoDisplay;
