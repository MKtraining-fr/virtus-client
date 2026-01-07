import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import Accordion from '../components/Accordion';
import Input from '../components/Input';
import Select from '../components/Select';
import Button from '../components/Button';
import Card from '../components/Card';
import { useAuth } from '../context/AuthContext';
import { Client, BilanField, BilanTemplate, BilanResult, ExerciseRecord } from '../types';
import { PerformanceEntry } from '../components/performance/PerformanceEntry';
import { TrendingUp, Trash2, HeartPulse } from 'lucide-react';
import BodyMapModal from '../components/coach/BodyMapModal';
import { InjuryData } from '../types';
import { createMultipleInjuries, CreateInjuryData } from '../services/injuryService';
import { getMuscleById } from '../data/muscleConfig';

const DynamicField: React.FC<{
  field: BilanField;
  value: unknown;
  onChange: (value: unknown) => void;
}> = ({ field, value, onChange }) => {
  const commonProps = {
    id: field.id,
    label: field.label,
    name: field.id,
    value: value || '',
    placeholder: field.placeholder || '',
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
      onChange(e.target.value),
  };

  const renderLabel = (labelText: string) => (
    <span>
      {labelText}
      {field.required && <span className="text-red-600 ml-1">*</span>}
    </span>
  );

  switch (field.type) {
    case 'textarea':
      return (
        <div>
          <label htmlFor={commonProps.id} className="block text-sm font-medium text-gray-700 mb-1">
            {renderLabel(commonProps.label)}
          </label>
          <textarea
            {...commonProps}
            rows={4}
            className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
          />
        </div>
      );
    case 'select':
      return (
        <Select
          id={field.id}
          label={field.label}
          name={field.id}
          value={(value as string) || ''}
          onChange={(val) => onChange(val)}
        >
          <option value="">-- Sélectionnez --</option>
          {field.options?.map((opt) => (
            <option key={opt} value={opt}>
              {opt}
            </option>
          ))}
        </Select>
      );
    case 'checkbox':
      return (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">{renderLabel(field.label)}</label>
          <div className="space-y-2">
            {field.options?.map((opt) => {
              const isChecked = Array.isArray(value) && value.includes(opt);
              const handleCheckboxChange = () => {
                const currentValue = value || [];
                const newValue = isChecked
                  ? currentValue.filter((item: string) => item !== opt)
                  : [...currentValue, opt];
                onChange(newValue);
              };
              return (
                <label key={opt} className="flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isChecked}
                    onChange={handleCheckboxChange}
                    className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                  />
                  <span className="ml-2 text-gray-700">{opt}</span>
                </label>
              );
            })}
          </div>
        </div>
      );
    case 'radio_yes_no':
      return (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">{renderLabel(field.label)}</label>
          <div className="flex items-center gap-x-4">
            <label className="flex items-center cursor-pointer">
              <input
                type="radio"
                name={field.id}
                value="Oui"
                checked={value === 'Oui'}
                onChange={(e) => onChange(e.target.value)}
                className="h-4 w-4 border-gray-300 text-primary focus:ring-primary"
              />
              <span className="ml-2 text-gray-700">Oui</span>
            </label>
            <label className="flex items-center cursor-pointer">
              <input
                type="radio"
                name={field.id}
                value="Non"
                checked={value === 'Non'}
                onChange={(e) => onChange(e.target.value)}
                className="h-4 w-4 border-gray-300 text-primary focus:ring-primary"
              />
              <span className="ml-2 text-gray-700">Non</span>
            </label>
          </div>
        </div>
      );
    case 'scale':
      return (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">{renderLabel(field.label)}</label>
          <div className="flex items-center flex-wrap gap-x-2 gap-y-2">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => (
              <label
                key={num}
                className="flex flex-col items-center cursor-pointer p-2 rounded-md hover:bg-gray-100 w-12"
              >
                <span className="text-sm font-medium text-gray-600 mb-1">{num}</span>
                <input
                  type="radio"
                  name={field.id}
                  value={num.toString()}
                  checked={value === num.toString()}
                  onChange={(e) => onChange(e.target.value)}
                  className="h-5 w-5 border-gray-300 text-primary focus:ring-primary"
                />
              </label>
            ))}
          </div>
        </div>
      );
    case 'number':
      return <Input {...commonProps} type="number" />;
    case 'date':
      return <Input {...commonProps} type="date" />;
    case 'text':
    default:
      return <Input {...commonProps} type="text" />;
  }
};

const NewBilan: React.FC = () => {
  const { user, addUser, bilanTemplates } = useAuth();
  const navigate = useNavigate();

  // Filtrer les templates: inclure les templates système (coachId null ou 'system') et ceux du coach
  const coachTemplates = useMemo(
    () => bilanTemplates.filter((t) => !t.coachId || t.coachId === 'system' || t.coachId === user?.id),
    [bilanTemplates, user]
  );

  const [selectedTemplateId, setSelectedTemplateId] = useState(coachTemplates[0]?.id || '');

  // Initialiser avec un email généré automatiquement pour les nouveaux prospects
  const [answers, setAnswers] = useState<Record<string, unknown>>({
    email: `prospect-${Date.now()}@test.com`,
  });

  const selectedTemplate = useMemo(
    () => coachTemplates.find((t) => t.id === selectedTemplateId),
    [coachTemplates, selectedTemplateId]
  );

  // Vérifier si c'est un template système (coachId null ou 'system')
  const isInitialBilanSelected = !selectedTemplate?.coachId || selectedTemplate?.coachId === 'system';
  const [performances, setPerformances] = useState<Partial<ExerciseRecord>[]>([]);

  // État pour les blessures et douleurs chroniques
  const [injuries, setInjuries] = useState<InjuryData[]>([]);
  const [isBodyMapModalOpen, setIsBodyMapModalOpen] = useState(false);

  const handleAnswerChange = (fieldId: string, value: unknown) => {
    setAnswers((prev) => ({ ...prev, [fieldId]: value }));
  };

  // Helper function to get value from answers with fallback for different field ID formats
  // Priorise les IDs français car c'est le format utilisé dans le template Supabase
  const getAnswerValue = (englishId: string, frenchId: string): unknown => {
    return answers[frenchId] || answers[englishId] || '';
  };

  const handleSubmit = async (status: 'active' | 'prospect') => {
    // Récupérer les valeurs avec support des deux formats d'IDs (anglais et français)
    const firstName = getAnswerValue('firstName', 'prenom') as string;
    const lastName = getAnswerValue('lastName', 'nom') as string;
    const email = answers.email as string;
    const phone = getAnswerValue('phone', 'telephone') as string;
    const dob = getAnswerValue('dob', 'date_naissance') as string;
    const sex = getAnswerValue('sex', 'sexe') as string;
    const height = getAnswerValue('height', 'taille') as string;
    const weight = getAnswerValue('weight', 'poids') as string;
    const activityLevel = getAnswerValue('energyExpenditureLevel', 'activite_physique') as string;

    // Vérifier les champs obligatoires
    const missingFields: string[] = [];
    if (!firstName) missingFields.push('Prénom');
    if (!lastName) missingFields.push('Nom');
    if (!email) missingFields.push('Email');
    if (!dob) missingFields.push('Date de Naissance');
    if (!sex) missingFields.push('Sexe');
    if (!height) missingFields.push('Taille');
    if (!weight) missingFields.push('Poids');

    if (missingFields.length > 0) {
      alert(`Les champs suivants sont obligatoires :\n\n${missingFields.join('\n')}\n\nVeuillez les remplir avant de valider.`);
      return;
    }

    // Mapper les niveaux d'activité physique vers energyExpenditureLevel
    const activityLevelMap: Record<string, Client['energyExpenditureLevel']> = {
      Sédentaire: 'sedentary',
      'Légèrement actif': 'lightly_active',
      'Modérément actif': 'moderately_active',
      Actif: 'moderately_active',
      'Très actif': 'very_active',
      'Extrêmement actif': 'extremely_active',
    };

    // Combiner les allergies et aversions pour le champ foodAversions
    const allergiesList = Array.isArray(answers.allergies) ? answers.allergies : [];
    const allergiesAutre = (answers.allergies_autre || '') as string;
    const aversions = (answers.aversions || answers.fld_aversions || '') as string;

    let combinedAllergiesAndAversions = '';
    if (allergiesList.length > 0) {
      combinedAllergiesAndAversions += 'Allergies: ' + allergiesList.join(', ');
      if (allergiesAutre) {
        combinedAllergiesAndAversions += ', ' + allergiesAutre;
      }
    }
    if (aversions) {
      if (combinedAllergiesAndAversions) combinedAllergiesAndAversions += '\n';
      combinedAllergiesAndAversions += 'Aversions: ' + aversions;
    }

    // Préparer les données du profil client avec le bon mapping
    const dataToSubmit: Partial<Client> = {
      // Informations générales
      firstName: firstName,
      lastName: lastName,
      dob: dob,
      age: dob
        ? Math.floor(
            (new Date().getTime() - new Date(dob).getTime()) /
              (1000 * 60 * 60 * 24 * 365.25)
          )
        : 0,
      sex: sex as Client['sex'],
      email: email,
      phone: phone,
      height: height ? Number(height) : undefined,
      weight: weight ? Number(weight) : undefined,
      energyExpenditureLevel: activityLevelMap[activityLevel] || 'moderately_active',

      // Objectif
      objective: (answers.objectif_principal || answers.fld_objectif || '') as string,

      // Vie quotidienne
      lifestyle: {
        profession: (answers.profession || answers.fld_profession || '') as string,
      },

      // Notes et médical
      medicalInfo: {
        history: (answers.antecedents_medicaux || '') as string,
        allergies:
          allergiesList.length > 0
            ? allergiesList.join(', ') + (allergiesAutre ? ', ' + allergiesAutre : '')
            : (answers.fld_allergies || '') as string,
        injuries: injuries, // Blessures et douleurs chroniques
      },
      notes: (answers.notes_coach || '') as string,

      // Nutrition
      nutrition: {
        measurements: {},
        weightHistory: [],
        calorieHistory: [],
        macros: { protein: 0, carbs: 0, fat: 0 },
        foodAversions: combinedAllergiesAndAversions,
        generalHabits: (answers.habitudes || answers.fld_habits || '') as string,
        historyLog: [],
        // Nouveaux champs nutrition
        dietType: (answers.regime_alimentaire || '') as string,
        mealsPerDay: (answers.nombre_repas || '') as string,
        hydration: answers.hydratation ? Number(answers.hydratation) : undefined,
        juiceSoda: answers.jus_soda ? Number(answers.jus_soda) : undefined,
        teaCoffee: answers.the_cafe ? Number(answers.the_cafe) : undefined,
        alcohol: answers.alcool ? Number(answers.alcool) : undefined,
        digestiveIssues: (answers.troubles_digestifs || '') as string,
      },

      // Enregistrer le bilan complet
      bilans: [
        {
          id: `bilan-${Date.now()}`,
          templateId: selectedTemplateId,
          templateName: selectedTemplate?.name || 'Bilan Initial',
          status: 'completed',
          assignedAt: new Date().toISOString(),
          completedAt: new Date().toISOString(),
          answers: answers,
        },
      ],
    };

    // Préparer les données de la section Training (Objectif et Conditions d'Entraînement)
    const trainingInfo = {
      experience: (answers.experience_sportive || '') as string,
      trainingSince: (answers.pratique_musculation_depuis || '') as string,
      sessionsPerWeek: answers.seances_par_semaine ? Number(answers.seances_par_semaine) : undefined,
      sessionDuration: answers.duree_seances ? Number(answers.duree_seances) : undefined,
      trainingType: (answers.entrainement_type || '') as string,
      issues: (answers.problematique || '') as string,
    };

    // Vérifier si au moins un champ de training est rempli
    const hasTrainingInfo = trainingInfo.experience || trainingInfo.trainingSince || 
      trainingInfo.sessionsPerWeek || trainingInfo.sessionDuration || 
      trainingInfo.trainingType || trainingInfo.issues;

    try {
      const newClient = await addUser({ 
        ...dataToSubmit, 
        role: 'client', 
        status, 
        coachId: user?.id,
        // Ajouter les infos d'entraînement si présentes
        ...(hasTrainingInfo ? { trainingInfo } : {}),
      } as any);
      
      // Enregistrer les performances si présentes
      if (newClient && performances.length > 0) {
        const { supabase } = await import('../services/supabase');
        await supabase.from('client_exercise_records').insert(
          performances.map(p => ({
            ...p,
            client_id: newClient.id,
            source: 'initial_assessment'
          }))
        );
      }

      // Enregistrer les blessures dans la table client_injuries
      if (newClient && injuries.length > 0) {
        const injuriesToCreate: CreateInjuryData[] = injuries.map(injury => {
          const muscle = getMuscleById(injury.bodyPart);
          return {
            client_id: newClient.id,
            body_part: injury.bodyPart,
            body_part_name_fr: muscle?.nameFr || injury.bodyPart,
            muscle_group: muscle?.group,
            type: injury.type,
            description: injury.description,
            notes: injury.notes,
            severity: injury.severity,
            status: injury.status,
            since: injury.since,
            created_by: user?.id || '',
            created_by_role: 'coach' as const,
          };
        });
        await createMultipleInjuries(injuriesToCreate);
      }

      alert(status === 'active' ? 'Client validé avec succès !' : 'Prospect archivé avec succès !');
      navigate(status === 'active' ? '/app/clients' : '/app/bilan/archive');
    } catch (error: unknown) {
      const err = error instanceof Error ? error : new Error('Une erreur inconnue est survenue.');
      alert(`Erreur : ${err.message}`);
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold text-gray-800 mb-6">Nouveau Bilan</h1>

      <Card className="p-8">
        <div>
          <Select
            label="Modèle de questionnaire"
            value={selectedTemplateId}
            onChange={(e) => setSelectedTemplateId(e.target.value)}
            className="mb-6"
          >
            {coachTemplates.map((template) => (
              <option key={template.id} value={template.id}>
                {template.name}
              </option>
            ))}
          </Select>

          {selectedTemplate?.sections.map((section) => {
            // Conditional rendering based on user request
            if (section.isCivility && !isInitialBilanSelected) {
              return null;
            }
            return (
              <Accordion key={section.id} title={section.title} isOpenDefault={section.isCivility === true || section.title === 'Informations générales'}>
                <div
                  className={`grid grid-cols-1 ${section.isCivility ? 'md:grid-cols-2' : ''} gap-4`}
                >
                  {section.fields.map((field) => {
                    // Gérer les champs conditionnels
                    if (field.conditionalOn && field.conditionalValue) {
                      const parentValue = answers[field.conditionalOn];
                      const shouldShow = Array.isArray(parentValue)
                        ? parentValue.includes(field.conditionalValue)
                        : parentValue === field.conditionalValue;

                      if (!shouldShow) {
                        return null;
                      }
                    }

                    return (
                      <DynamicField
                        key={field.id}
                        field={field}
                        value={answers[field.id]}
                        onChange={(value) => handleAnswerChange(field.id, value)}
                      />
                    );
                  })}
                </div>

                {/* Ajouter la section Blessures et douleurs chroniques dans la section Antécédents et Notes Coach */}
                {(section.id === 'medical' || section.title === 'Antécédents et Notes Coach' || section.title === 'Notes et Médical') && (
                  <div className="mt-8 pt-8 border-t border-gray-100">
                    <h4 className="text-md font-bold text-gray-800 mb-4 flex items-center gap-2">
                      <HeartPulse className="h-5 w-5 text-red-500" />
                      Blessures et Douleurs Chroniques
                    </h4>
                    <p className="text-sm text-gray-500 mb-4">
                      Cliquez sur le bouton ci-dessous pour ouvrir la carte corporelle interactive et enregistrer les blessures ou douleurs chroniques du client.
                    </p>
                    
                    {/* Affichage des blessures enregistrées */}
                    {injuries.length > 0 && (
                      <div className="mb-4 space-y-2">
                        <p className="text-sm font-medium text-gray-700">
                          {injuries.length} blessure(s) enregistrée(s) :
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {injuries.map((injury) => (
                            <span
                              key={injury.id}
                              className={`inline-flex items-center px-3 py-1 rounded-full text-sm ${
                                injury.severity === 'severe'
                                  ? 'bg-red-100 text-red-800'
                                  : injury.severity === 'moderate'
                                  ? 'bg-orange-100 text-orange-800'
                                  : 'bg-yellow-100 text-yellow-800'
                              }`}
                            >
                              <span
                                className={`w-2 h-2 rounded-full mr-2 ${
                                  injury.severity === 'severe'
                                    ? 'bg-red-500'
                                    : injury.severity === 'moderate'
                                    ? 'bg-orange-500'
                                    : 'bg-yellow-500'
                                }`}
                              />
                              {injury.bodyPart} - {injury.description}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    <Button
                      variant="secondary"
                      onClick={() => setIsBodyMapModalOpen(true)}
                      className="flex items-center gap-2"
                    >
                      <HeartPulse className="h-4 w-4" />
                      {injuries.length > 0 ? 'Modifier les blessures' : 'Ajouter des blessures'}
                    </Button>
                  </div>
                )}

                {/* Ajouter la saisie des performances dans la section Objectif et Conditions d'Entraînement */}
                {section.title === "Objectif et Conditions d'Entraînement" && (
                  <div className="mt-8 pt-8 border-t border-gray-100">
                    <h4 className="text-md font-bold text-gray-800 mb-4 flex items-center gap-2">
                      <TrendingUp className="h-5 w-5 text-primary" />
                      Performances de référence (Optionnel)
                    </h4>
                    <p className="text-sm text-gray-500 mb-6">
                      Saisissez les meilleures performances actuelles du client pour établir son profil nerveux et ses projections.
                    </p>
                    
                    <div className="space-y-4">
                      {performances.map((perf, index) => (
                        <div key={index} className="flex items-center gap-4 p-3 bg-gray-50 rounded-xl border border-gray-100">
                          <div className="flex-1 font-medium text-gray-900">
                            Performance #{index + 1}
                          </div>
                          <div className="text-sm text-gray-600">
                            {perf.weight}kg × {perf.reps} reps (RIR {perf.rir})
                          </div>
                          <button 
                            onClick={() => setPerformances(prev => prev.filter((_, i) => i !== index))}
                            className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      ))}
                      
                      <div className="bg-white border border-gray-200 rounded-xl p-4">
                        <PerformanceEntry 
                          clientId="temp" 
                          onPerformanceAdded={() => {}} 
                          isManualMode={true}
                          onManualAdd={(perf) => setPerformances(prev => [...prev, perf])}
                        />
                      </div>
                    </div>
                  </div>
                )}
              </Accordion>
            );
          })}
        </div>

        <div className="flex justify-end mt-8 space-x-2">
          <Button variant="secondary" onClick={() => handleSubmit('prospect')}>
            Archiver
          </Button>
          <Button onClick={() => handleSubmit('active')}>Valider le Bilan</Button>
        </div>
      </Card>

      {/* Modale de carte corporelle pour les blessures */}
      <BodyMapModal
        isOpen={isBodyMapModalOpen}
        onClose={() => setIsBodyMapModalOpen(false)}
        injuries={injuries}
        onSave={setInjuries}
        theme="light"
      />
    </div>
  );
};

export default NewBilan;
