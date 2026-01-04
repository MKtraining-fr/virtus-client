import React, { useState, useMemo, useEffect } from 'react';
import { useParams, Navigate, useNavigate, Link } from 'react-router-dom';
import {
  Client,
  WorkoutProgram,
  PerformanceLog,
  NutritionLogEntry,
  Measurement,
  NutritionPlan,
  MealItem,
  Meal,
  BilanResult,
  NutritionDay,
  SharedFile,
  FoodItem,
} from '../types';
import Accordion from '../components/Accordion';
import Card from '../components/Card';
import Modal from '../components/Modal';
import { useAuth } from '../context/AuthContext';
import BilanAssignmentModal from '../components/coach/BilanAssignmentModal';
import ProgramDetailView from '../components/ProgramDetailView';
import ProgramPerformanceDetail from '../components/ProgramPerformanceDetail';
import {
  getClientAssignedProgramsForCoach,
  getClientProgramDetails,
  getClientCompletedSessions,
} from '../services/coachClientProgramService';
import Input from '../components/Input';
import Button from '../components/Button';
import { getUserAvatarUrl } from '../utils/avatarUtils';
import SimpleLineChart from '../components/charts/SimpleLineChart';
import MeasurementsLineChart from '../components/charts/MeasurementsLineChart';
import ClientBilanHistory from '../components/ClientBilanHistory';
import CoachClientDocuments from '../components/coach/CoachClientDocuments';
import { PerformanceSection } from '../components/performance/PerformanceSection';
import { supabase } from '../services/supabase';
import BodyMapModal from '../components/coach/BodyMapModal';
import { InjuryData } from '../types';
import { 
  getClientInjuries, 
  createMultipleInjuries, 
  deleteInjury,
  ClientInjury,
  CreateInjuryData,
  INJURY_TYPE_LABELS,
  INJURY_SEVERITY_LABELS,
  INJURY_STATUS_LABELS,
  INJURY_SEVERITY_COLORS
} from '../services/injuryService';
import { getMuscleById } from '../data/muscleConfig';
import { HeartPulse } from 'lucide-react';

/* ------------------------- ICONS ------------------------- */
const EnvelopeIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
    strokeWidth={1.5}
    stroke="currentColor"
    {...props}
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M21.75 6.75v10.5a2.25 2.25 0 0 1-2.25 2.25h-15a2.25 2.25 0 0 1-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25m19.5 0v.243a2.25 2.25 0 0 1-1.07 1.916l-7.5 4.615a2.25 2.25 0 0 1-2.36 0L3.32 8.91a2.25 2.25 0 0 1-1.07-1.916V6.75"
    />
  </svg>
);
const PlusIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" {...props}>
    <path
      fillRule="evenodd"
      d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z"
      clipRule="evenodd"
    />
  </svg>
);
const MinusIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" {...props}>
    <path
      fillRule="evenodd"
      d="M5 10a1 1 0 011-1h8a1 1 0 110 2H6a1 1 0 01-1-1z"
      clipRule="evenodd"
    />
  </svg>
);
const DocumentIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
    strokeWidth={1.5}
    stroke="currentColor"
    {...props}
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z"
    />
  </svg>
);
const TrashIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
    strokeWidth={1.5}
    stroke="currentColor"
    {...props}
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.134-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.067-2.09 1.02-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0"
    />
  </svg>
);

/* ------------------------- SUB COMPONENTS ------------------------- */
const SimpleToggle: React.FC<{
  label: string;
  enabled: boolean;
  onChange: (enabled: boolean) => void;
}> = ({ label, enabled, onChange }) => (
  <div className="flex items-center justify-between py-2">
    <span className="font-medium text-gray-700">{label}</span>
    <button
      type="button"
      className={`${enabled ? 'bg-primary' : 'bg-gray-200'} relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2`}
      role="switch"
      aria-checked={enabled}
      onClick={() => onChange(!enabled)}
    >
      <span
        aria-hidden="true"
        className={`${enabled ? 'translate-x-5' : 'translate-x-0'} pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out`}
      />
    </button>
  </div>
);

const InfoItem: React.FC<{ label: string; value?: string | number }> = ({ label, value }) => (
  <div>
    <p className="text-sm text-gray-500">{label}</p>
    <p className="font-semibold text-gray-800">{value ?? 'N/A'}</p>
  </div>
);

const InfoRowModal: React.FC<{ label: string; value?: string | number }> = ({ label, value }) => (
  <div className="flex justify-between items-center py-2 border-b border-gray-200">
    <span className="text-gray-600">{label}</span>
    <span className="font-semibold text-gray-900 text-right">{value ?? 'N/A'}</span>
  </div>
);

/* ------------------------- FOOD JOURNAL (Coach) ------------------------- */
const CoachFoodJournalView: React.FC<{ client: Client }> = ({ client }) => {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const dateKey = useMemo(() => selectedDate.toISOString().split('T')[0], [selectedDate]);

  const { journalDayMeals, isFromPlan } = useMemo(() => {
    const nutritionData = client.nutrition as any;
    if (nutritionData?.foodJournal && dateKey in nutritionData.foodJournal) {
      return { journalDayMeals: nutritionData.foodJournal[dateKey] ?? [], isFromPlan: false };
    }
    const assignedPlans = client.assignedNutritionPlans as unknown as NutritionPlan[] | undefined;
    const assignedPlan = assignedPlans?.[0];
    if (assignedPlan) {
      const planDaysForWeek1 = assignedPlan.daysByWeek?.['1'] ?? [];
      if (planDaysForWeek1.length > 0) {
        const dayOfWeekIndex = (selectedDate.getDay() + 6) % 7;
        const planDayToShow = planDaysForWeek1[dayOfWeekIndex % planDaysForWeek1.length];
        return { journalDayMeals: planDayToShow?.meals ?? [], isFromPlan: true };
      }
    }
    return { journalDayMeals: [], isFromPlan: false };
  }, [client, selectedDate, dateKey]);

  const dailyTotals = useMemo(() => {
    return journalDayMeals.reduce(
      (acc, meal) => {
        meal.items.forEach((item) => {
          if (!item.food) return;
          const ratio = (item.quantity ?? 0) / 100;
          acc.calories += (item.food.calories ?? 0) * ratio;
          acc.protein += (item.food.protein ?? 0) * ratio;
          acc.carbs += (item.food.carbs ?? 0) * ratio;
          acc.fat += (item.food.fat ?? 0) * ratio;
        });
        return acc;
      },
      { calories: 0, protein: 0, carbs: 0, fat: 0 }
    );
  }, [journalDayMeals]);

  const macroGoals = useMemo(() => {
    const nutritionData = client.nutrition as any;
    const macros = nutritionData?.macros;
    if (!macros || (macros.protein === 0 && macros.carbs === 0 && macros.fat === 0)) {
      return { protein: 150, carbs: 200, fat: 60, calories: 1940 };
    }
    const { protein, carbs, fat } = macros;
    return { protein, carbs, fat, calories: protein * 4 + carbs * 4 + fat * 9 };
  }, [client]);

  const changeDay = (amount: number) => {
    setSelectedDate((prevDate) => {
      const newDate = new Date(prevDate);
      newDate.setDate(newDate.getDate() + amount);
      return newDate;
    });
  };

  const { calories, protein, carbs, fat } = dailyTotals;
  const {
    calories: goalCalories,
    protein: goalProtein,
    carbs: goalCarbs,
    fat: goalFat,
  } = macroGoals;

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <Button type="button" variant="secondary" size="sm" onClick={() => changeDay(-1)}>
          Précédent
        </Button>
        <span className="font-semibold text-lg text-center">
          {selectedDate.toLocaleDateString('fr-FR', {
            weekday: 'long',
            day: 'numeric',
            month: 'long',
          })}
        </span>
        <Button type="button" variant="secondary" size="sm" onClick={() => changeDay(1)}>
          Suivant
        </Button>
      </div>

      {isFromPlan && journalDayMeals.length > 0 && (
        <div className="p-2 bg-blue-50 border border-blue-200 rounded-md text-center text-sm text-blue-800 mb-4">
          Ceci est le <strong>plan assigné</strong>. Le client n'a pas encore rempli son journal
          pour ce jour.
        </div>
      )}

      <Card className="p-4 bg-gray-50 border mb-4">
        <h4 className="font-bold text-center mb-2">Total du Jour</h4>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
          <InfoItem
            label="Calories"
            value={`${Math.round(calories)} / ${Math.round(goalCalories)} kcal`}
          />
          <InfoItem
            label="Protéines"
            value={`${Math.round(protein)} / ${Math.round(goalProtein)} g`}
          />
          <InfoItem label="Glucides" value={`${Math.round(carbs)} / ${Math.round(goalCarbs)} g`} />
          <InfoItem label="Lipides" value={`${Math.round(fat)} / ${Math.round(goalFat)} g`} />
        </div>
      </Card>

      <div className="space-y-4">
        {journalDayMeals.length > 0 ? (
          journalDayMeals.map((meal) => {
            const mealMacros = meal.items.reduce(
              (acc, item) => {
                const ratio = (item.quantity ?? 0) / 100;
                acc.calories += (item.food?.calories ?? 0) * ratio;
                return acc;
              },
              { calories: 0 }
            );

            return (
              <div key={meal.id} className="p-4 border rounded-lg bg-white">
                <div className="flex justify-between items-center mb-2">
                  <h4 className="font-semibold text-lg text-gray-800">{meal.name}</h4>
                  <span className="text-sm font-medium text-gray-600">
                    {Math.round(mealMacros.calories)} kcal
                  </span>
                </div>
                {meal.items.length > 0 ? (
                  <ul className="space-y-1">
                    {meal.items.map((item) => (
                      <li
                        key={item.id}
                        className="flex justify-between items-center text-sm p-2 bg-gray-50 rounded"
                      >
                        <span>{item.food?.name ?? 'Aliment'}</span>
                        <span className="font-mono text-gray-700">
                          {item.quantity}
                          {item.unit}
                        </span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-gray-500">Aucun aliment dans ce repas.</p>
                )}
              </div>
            );
          })
        ) : (
          <div className="text-center py-6 bg-gray-50 rounded-lg">
            <p className="text-gray-500">Aucune donnée de repas pour ce jour.</p>
          </div>
        )}
      </div>
    </div>
  );
};

/* ------------------------- NUTRITION PLAN VIEW (Coach) ------------------------- */
const CoachNutritionPlanView: React.FC<{ plan: NutritionPlan }> = ({ plan }) => {
  const [selectedWeek, setSelectedWeek] = useState(1);
  const weekDays = plan.daysByWeek?.[selectedWeek] || [];

  const mealNames = useMemo(() => {
    const names = new Set<string>();
    if (plan.daysByWeek) {
      Object.values(plan.daysByWeek)
        .flat()
        .forEach((day: NutritionDay) => {
          day.meals?.forEach((meal) => names.add(meal.name));
        });
    }

    const standardOrder: { [key: string]: number } = {
      'Petit-déjeuner': 1,
      'Collation 1': 2,
      'Collation du matin': 2,
      Déjeuner: 3,
      'Collation 2': 4,
      "Collation de l'après-midi": 4,
      Collation: 4,
      Dîner: 5,
      'Collation 3': 6,
      'Collation du soir': 6,
    };

    return Array.from(names).sort((a, b) => (standardOrder[a] || 99) - (standardOrder[b] || 99));
  }, [plan.daysByWeek]);

  const calculateMacros = (items: MealItem[]) => {
    return items.reduce(
      (acc, item) => {
        if (!item.food) return acc;
        const ratio = (item.quantity ?? 0) / 100;
        acc.calories += (item.food.calories || 0) * ratio;
        acc.protein += (item.food.protein || 0) * ratio;
        acc.carbs += (item.food.carbs || 0) * ratio;
        acc.fat += (item.food.fat || 0) * ratio;
        return acc;
      },
      { calories: 0, protein: 0, carbs: 0, fat: 0 }
    );
  };

  return (
    <div className="mb-6 border border-gray-200 rounded-lg p-4 bg-white last:mb-0">
      <h3 className="text-xl font-bold text-gray-800">{plan.name}</h3>
      <p className="text-sm text-gray-600 mb-4 italic">{plan.objective}</p>

      {plan.daysByWeek && Object.keys(plan.daysByWeek).length > 1 && (
        <div className="mb-4">
          <label className="text-sm font-medium text-gray-700 mr-2">Semaine :</label>
          <select
            value={selectedWeek}
            onChange={(e) => setSelectedWeek(Number(e.target.value))}
            className="border rounded px-2 py-1"
          >
            {Object.keys(plan.daysByWeek).map((week) => (
              <option key={week} value={week}>
                Semaine {week}
              </option>
            ))}
          </select>
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr className="bg-gray-100">
              <th className="p-2 text-left border">Repas</th>
              {weekDays.map((day, idx) => (
                <th key={idx} className="p-2 text-center border">
                  {day.dayName || `Jour ${idx + 1}`}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {mealNames.map((mealName) => (
              <tr key={mealName}>
                <td className="p-2 border font-medium">{mealName}</td>
                {weekDays.map((day, dayIdx) => {
                  const meal = day.meals?.find((m) => m.name === mealName);
                  return (
                    <td key={dayIdx} className="p-2 border text-xs">
                      {meal && meal.items.length > 0 ? (
                        <ul className="space-y-1">
                          {meal.items.map((item, itemIdx) => (
                            <li key={itemIdx}>
                              {item.food?.name || 'Aliment'} ({item.quantity}
                              {item.unit})
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

/* ------------------------- MAIN COMPONENT ------------------------- */
const ClientProfile: React.FC = () => {
  const { id: clientId } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, clients, programs, bilanTemplates, setClients } = useAuth();

  // Modal states
  const [showBilanAssignmentModal, setShowBilanAssignmentModal] = useState(false);
  const [selectedProgram, setSelectedProgram] = useState<WorkoutProgram | null>(null);
  const [selectedNutritionPlan, setSelectedNutritionPlan] = useState<NutritionPlan | null>(null);
  const [selectedBilan, setSelectedBilan] = useState<BilanResult | null>(null);
  const [isProgramModalOpen, setIsProgramModalOpen] = useState(false);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [selectedHistoricalProgram, setSelectedHistoricalProgram] = useState<{
    program: WorkoutProgram;
    logs: PerformanceLog[];
  } | null>(null);

  // Data states
  const [assignedPrograms, setAssignedPrograms] = useState<any[]>([]);
  const [isLoadingPrograms, setIsLoadingPrograms] = useState(true);
  const [bilanRefreshTrigger, setBilanRefreshTrigger] = useState(0);

  // Editable states for notes and medical info
  const [newNote, setNewNote] = useState('');
  const [editableData, setEditableData] = useState({
    notes: '',
    medicalInfo: {
      history: '',
      allergies: '',
    },
  });

  // États pour les blessures
  const [injuries, setInjuries] = useState<ClientInjury[]>([]);
  const [isBodyMapModalOpen, setIsBodyMapModalOpen] = useState(false);
  const [isLoadingInjuries, setIsLoadingInjuries] = useState(false);

  // Editable states for macros
  const [editableMacros, setEditableMacros] = useState({ protein: 0, carbs: 0, fat: 0 });
  const [initialMacros, setInitialMacros] = useState({ protein: 0, carbs: 0, fat: 0 });
  // Macros d'origine basés sur le TDEE - ne changent jamais après initialisation
  const [originMacros, setOriginMacros] = useState({ protein: 0, carbs: 0, fat: 0 });
  const [tdee, setTdee] = useState<number | null>(null);
  const [macroDisplayMode, setMacroDisplayMode] = useState<'grams' | 'percent'>('grams');

  // Editable states for access & permissions
  const [editableAccess, setEditableAccess] = useState({
    canUseWorkoutBuilder: true,
    grantedFormationIds: [] as string[],
    shopAccess: {
      adminShop: true,
      coachShop: true,
    },
  });

  // Measurement selection for chart
  const measurementLabels: Record<keyof Measurement, string> = {
    neck: 'Cou',
    chest: 'Poitrine',
    l_bicep: 'Biceps G.',
    r_bicep: 'Biceps D.',
    waist: 'Taille',
    hips: 'Hanches',
    l_thigh: 'Cuisse G.',
    r_thigh: 'Cuisse D.',
  };
  const [selectedMeasurements, setSelectedMeasurements] = useState<Array<keyof Measurement>>([
    'chest',
  ]);

  const client = useMemo(() => clients.find((c) => c.id === clientId), [clients, clientId]);

  const bilanTemplateForModal = useMemo(() => {
    if (!selectedBilan) return null;
    return bilanTemplates.find((t) => t.id === selectedBilan.templateId);
  }, [selectedBilan, bilanTemplates]);

  // Initialize editable data when client changes
  useEffect(() => {
    if (client) {
      const medicalInfo =
        typeof client.medicalInfo === 'object' && client.medicalInfo
          ? (client.medicalInfo as { history?: string; allergies?: string })
          : { history: '', allergies: '' };

      setEditableData({
        notes: client.notes || '',
        medicalInfo: {
          history: medicalInfo.history || '',
          allergies: medicalInfo.allergies || '',
        },
      });

      // Initialize access permissions
      const clientAccess = (client as any).access || {};
      setEditableAccess({
        canUseWorkoutBuilder: clientAccess.canUseWorkoutBuilder ?? true,
        grantedFormationIds: clientAccess.grantedFormationIds || [],
        shopAccess: {
          adminShop: clientAccess.shopAccess?.adminShop ?? true,
          coachShop: clientAccess.shopAccess?.coachShop ?? true,
        },
      });

      // Charger les blessures du client
      const loadInjuries = async () => {
        setIsLoadingInjuries(true);
        try {
          const clientInjuries = await getClientInjuries(client.id);
          setInjuries(clientInjuries);
        } catch (error) {
          console.error('Erreur lors du chargement des blessures:', error);
        } finally {
          setIsLoadingInjuries(false);
        }
      };
      loadInjuries();
    }
  }, [client]);

  // Calculate metabolic data
  const activityMultipliers: Record<string, number> = {
    sedentary: 1.2,
    lightly_active: 1.375,
    moderately_active: 1.55,
    very_active: 1.725,
    extremely_active: 1.9,
    Sédentaire: 1.2,
    'Légèrement actif': 1.375,
    Actif: 1.55,
    'Très actif': 1.725,
  };

  const baseMetabolicData = useMemo(() => {
    if (
      !client ||
      !client.weight ||
      !client.height ||
      !client.age ||
      !client.sex ||
      !client.energyExpenditureLevel
    )
      return null;

    const isMale = client.sex === 'Homme' || client.sex === 'male';
    const bmr = isMale
      ? 88.362 + 13.397 * client.weight + 4.799 * client.height - 5.677 * client.age
      : 447.593 + 9.247 * client.weight + 3.098 * client.height - 4.33 * client.age;

    const multiplier = activityMultipliers[client.energyExpenditureLevel] || 1.55;
    const baseTdee = bmr * multiplier;

    return { bmr: Math.round(bmr), baseTdee: Math.round(baseTdee) };
  }, [client]);

  // Initialize macros based on client data or calculate defaults
  useEffect(() => {
    if (client && baseMetabolicData) {
      setTdee(baseMetabolicData.baseTdee);

      // Calculer les macros d'origine basés sur le TDEE (répartition standard 30/40/30)
      const targetTdee = baseMetabolicData.baseTdee;
      
      // Calculer protéines et glucides normalement
      const originP = Math.round((targetTdee * 0.3) / 4);
      const originC = Math.round((targetTdee * 0.4) / 4);
      
      // Ajuster les lipides pour compenser l'erreur d'arrondi et garantir que le total = TDEE
      // Cela évite l'affichage de "+1 kcal" ou "-1 kcal" dû aux arrondis successifs
      const caloriesFromProteinAndCarbs = (originP * 4) + (originC * 4);
      const remainingCalories = targetTdee - caloriesFromProteinAndCarbs;
      const originF = Math.round(remainingCalories / 9);
      
      const tdeeMacros = { protein: originP, carbs: originC, fat: originF };
      
      // Définir les macros d'origine une seule fois (basés sur le TDEE)
      setOriginMacros(tdeeMacros);

      const nutritionData = client.nutrition as any;
      const clientMacros = nutritionData?.macros || { protein: 0, carbs: 0, fat: 0 };
      const { protein, carbs, fat } = clientMacros;
      const areMacrosSet = protein > 0 || carbs > 0 || fat > 0;

      if (areMacrosSet) {
        setEditableMacros(clientMacros);
        setInitialMacros(clientMacros);
      } else {
        setEditableMacros(tdeeMacros);
        setInitialMacros(tdeeMacros);
      }
    }
  }, [client, baseMetabolicData]);

  // Calculated data for macros display
  const editableCalculatedData = useMemo(() => {
    if (tdee === null || !client) return null;
    const { protein, carbs, fat } = editableMacros;
    const pKcal = protein * 4,
      cKcal = carbs * 4,
      fKcal = fat * 9;
    const oCal = pKcal + cKcal + fKcal;
    return {
      objectifCalorique: oCal,
      surplusDeficit: Math.round(oCal - tdee),
      surplusDeficitPercent: tdee > 0 ? ((oCal - tdee) / tdee) * 100 : 0,
      pieChartPercentages: {
        protein: oCal > 0 ? (pKcal / oCal) * 100 : 0,
        carbs: oCal > 0 ? (cKcal / oCal) * 100 : 0,
        fat: oCal > 0 ? (fKcal / oCal) * 100 : 0,
      },
      macros: {
        protein: { g: protein, kcal: pKcal },
        carbs: { g: carbs, kcal: cKcal },
        fat: { g: fat, kcal: fKcal },
      },
    };
  }, [tdee, editableMacros, client]);

  const macroLabels = { protein: 'Protéines', carbs: 'Glucides', fat: 'Lipides' };
  const gradientStyle = {
    background: `conic-gradient(#ef4444 0% ${editableCalculatedData?.pieChartPercentages.protein || 0}%, #10b981 ${editableCalculatedData?.pieChartPercentages.protein || 0}% ${(editableCalculatedData?.pieChartPercentages.protein || 0) + (editableCalculatedData?.pieChartPercentages.carbs || 0)}%, #facc15 ${(editableCalculatedData?.pieChartPercentages.protein || 0) + (editableCalculatedData?.pieChartPercentages.carbs || 0)}% 100%)`,
  };

  // Handlers
  const handleBilanAssignmentSuccess = () => {
    setBilanRefreshTrigger((prev) => prev + 1);
  };

  const handleMedicalChange = (field: 'history' | 'allergies', value: string) => {
    setEditableData((prev) => ({
      ...prev,
      medicalInfo: { ...prev.medicalInfo, [field]: value },
    }));
  };

  const hasInfoChanges = useMemo(() => {
    if (!client) return false;
    const clientMedicalInfo =
      typeof client.medicalInfo === 'object' && client.medicalInfo
        ? (client.medicalInfo as { history?: string; allergies?: string })
        : { history: '', allergies: '' };

    return (
      newNote.trim() !== '' ||
      editableData.notes !== (client.notes || '') ||
      editableData.medicalInfo.history !== (clientMedicalInfo.history || '') ||
      editableData.medicalInfo.allergies !== (clientMedicalInfo.allergies || '')
    );
  }, [editableData, client, newNote]);

  const handleSaveInfoChanges = async () => {
    if (!client) return;

    let finalNotes = editableData.notes;
    if (newNote.trim()) {
      const date = new Date().toLocaleDateString('fr-FR');
      const formattedNote = `--- ${date} ---\n${newNote.trim()}`;
      finalNotes = `${formattedNote}\n\n${editableData.notes}`.trim();
    }

    try {
      // @ts-ignore - Type mismatch with Supabase generated types
      const { error } = await supabase
        .from('clients')
        .update({
          notes: finalNotes,
          medical_info: editableData.medicalInfo,
          updated_at: new Date().toISOString(),
        })
        .eq('id', client.id);

      if (error) throw error;

      // Update local state
      if (setClients) {
        const updatedClients = clients.map((c) =>
          c.id === client.id
            ? { ...c, notes: finalNotes, medicalInfo: editableData.medicalInfo }
            : c
        );
        setClients(updatedClients as Client[]);
      }

      setNewNote('');
      setEditableData((prev) => ({ ...prev, notes: finalNotes }));
      alert('Modifications enregistrées !');
    } catch (error) {
      console.error('Erreur lors de la sauvegarde:', error);
      alert('Erreur lors de la sauvegarde des modifications.');
    }
  };

  const parsedNotes = useMemo(() => {
    if (!editableData.notes) return [];
    return editableData.notes
      .split(/(?=---.*?---)/)
      .map((note) => note.trim())
      .filter((note) => note)
      .map((note, index) => {
        const match = note.match(/--- (.*?) ---\n(.*)/s);
        return match
          ? { id: index, date: match[1], content: match[2].trim() }
          : { id: index, date: 'Note', content: note };
      });
  }, [editableData.notes]);

  const handleMacroChange = (macro: 'protein' | 'carbs' | 'fat', value: string) => {
    const numValue = parseInt(value, 10);
    if (value === '' || numValue >= 0) {
      setEditableMacros((prev) => ({ ...prev, [macro]: value === '' ? 0 : numValue }));
    }
  };

  const handleMacroAdjustment = (macro: 'protein' | 'carbs' | 'fat', amount: number) => {
    setEditableMacros((prev) => ({ ...prev, [macro]: Math.max(0, (prev[macro] || 0) + amount) }));
  };

  const handleSaveMacros = async () => {
    if (!client || !editableMacros || !editableCalculatedData) return;

    const newLogEntry: NutritionLogEntry = {
      date: new Date().toLocaleDateString('fr-FR'),
      weight: client.weight ?? null,
      calories: editableCalculatedData.objectifCalorique,
      macros: { ...editableMacros },
    };

    const currentNutrition = (client.nutrition as any) || {};
    const updatedNutrition = {
      ...currentNutrition,
      macros: editableMacros,
      historyLog: [newLogEntry, ...(currentNutrition.historyLog || [])],
    };

    try {
      // @ts-ignore - Type mismatch with Supabase generated types
      const { error } = await supabase
        .from('clients')
        .update({
          nutrition: updatedNutrition,
          updated_at: new Date().toISOString(),
        })
        .eq('id', client.id);

      if (error) throw error;

      if (setClients) {
        const updatedClients = clients.map((c) =>
          c.id === client.id ? { ...c, nutrition: updatedNutrition } : c
        );
        setClients(updatedClients as Client[]);
      }

      setInitialMacros(editableMacros);
      alert('Macros mises à jour avec succès ! Un log a été créé.');
    } catch (error) {
      console.error('Erreur lors de la sauvegarde des macros:', error);
      alert('Erreur lors de la sauvegarde des macros.');
    }
  };

  const macrosHaveChanged =
    JSON.stringify(editableMacros) !== JSON.stringify(initialMacros);

  const handleSaveAccess = async () => {
    if (!client) return;

    try {
      // @ts-ignore - Type mismatch with Supabase generated types
      const { error } = await supabase
        .from('clients')
        .update({
          lifestyle: {
            ...(typeof client.lifestyle === 'object' ? client.lifestyle : {}),
            access: editableAccess,
          },
          updated_at: new Date().toISOString(),
        })
        .eq('id', client.id);

      if (error) throw error;

      alert('Permissions mises à jour.');
    } catch (error) {
      console.error('Erreur lors de la sauvegarde des accès:', error);
      alert('Erreur lors de la sauvegarde des permissions.');
    }
  };

  const handleFormationAccessToggle = (formationId: string) => {
    setEditableAccess((prev) => {
      const currentIds = prev.grantedFormationIds || [];
      const newIds = currentIds.includes(formationId)
        ? currentIds.filter((id) => id !== formationId)
        : [...currentIds, formationId];
      return { ...prev, grantedFormationIds: newIds };
    });
  };

  // Measurement history data
  const availableMeasurementsForSelect = useMemo(() => {
    const nutritionData = client?.nutrition as any;
    if (!nutritionData?.historyLog) return [];
    const available = new Set<keyof Measurement>();
    nutritionData.historyLog.forEach((log: any) => {
      if (log.measurements) {
        (Object.keys(log.measurements) as Array<keyof Measurement>).forEach((key) => {
          if (log.measurements![key] !== undefined && log.measurements![key] !== null) {
            available.add(key);
          }
        });
      }
    });
    return Array.from(available);
  }, [client]);

  const measurementHistoryForChart = useMemo(() => {
    const nutritionData = client?.nutrition as any;
    if (!nutritionData?.historyLog) return [];
    return [...nutritionData.historyLog]
      .filter((log: any) => log.measurements)
      .reverse()
      .map((log: any) => ({
        date: log.date,
        ...log.measurements,
      }));
  }, [client]);

  const measurementHistoryTable = useMemo(() => {
    const nutritionData = client?.nutrition as any;
    if (!nutritionData?.historyLog) return { data: [], headers: [] };
    const headers = new Set<keyof Measurement>();
    const validLogs = nutritionData.historyLog.filter(
      (log: any) => log.weight || (log.measurements && Object.keys(log.measurements).length > 0)
    );

    validLogs.forEach((log: any) => {
      if (log.measurements) {
        (Object.keys(log.measurements) as (keyof Measurement)[]).forEach((key) => {
          if (log.measurements?.[key]) headers.add(key);
        });
      }
    });

    const sortedHeaders = Array.from(headers).sort();

    const data = validLogs.map((log: any) => ({
      date: log.date,
      weight: log.weight,
      ...log.measurements,
    }));

    return { data, headers: sortedHeaders };
  }, [client]);

  const handleToggleMeasurement = (key: keyof Measurement) => {
    setSelectedMeasurements((prev) =>
      prev.includes(key) ? prev.filter((m) => m !== key) : [...prev, key]
    );
  };

  // Shared files
  const sharedFiles = useMemo(() => {
    return (client as any)?.sharedFiles || [];
  }, [client]);

  const photoFiles = useMemo(() => {
    return sharedFiles.filter((file: SharedFile) => file.fileType?.startsWith('image/'));
  }, [sharedFiles]);

  const documentFiles = useMemo(() => {
    return sharedFiles.filter((file: SharedFile) => !file.fileType?.startsWith('image/'));
  }, [sharedFiles]);

  const handleDeleteFile = async (fileId: string) => {
    if (!client || !window.confirm('Êtes-vous sûr de vouloir supprimer ce fichier ?')) return;

    try {
      const updatedFiles = sharedFiles.filter((f: SharedFile) => f.id !== fileId);
      // @ts-ignore - Type mismatch with Supabase generated types
      const { error } = await supabase
        .from('clients')
        .update({
          lifestyle: {
            ...(typeof client.lifestyle === 'object' ? client.lifestyle : {}),
            sharedFiles: updatedFiles,
          },
        })
        .eq('id', client.id);

      if (error) throw error;

      if (setClients) {
        const updatedClients = clients.map((c) =>
          c.id === client.id ? { ...c, sharedFiles: updatedFiles } : c
        );
        setClients(updatedClients as Client[]);
      }
    } catch (error) {
      console.error('Erreur lors de la suppression du fichier:', error);
      alert('Erreur lors de la suppression du fichier.');
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // Historical programs with performance logs
  const historicalPrograms = useMemo(() => {
    const clientPerformanceLogs = client?.performanceLogs as unknown as PerformanceLog[] | undefined;
    if (!clientPerformanceLogs || !programs) return [];
    const performanceLogs = Array.isArray(clientPerformanceLogs) ? clientPerformanceLogs : [];

    const logsByProgramName = performanceLogs.reduce(
      (acc, log: PerformanceLog) => {
        if (!acc[log.programName]) acc[log.programName] = [];
        acc[log.programName].push(log);
        return acc;
      },
      {} as Record<string, PerformanceLog[]>
    );

    return Object.entries(logsByProgramName)
      .map(([programName, logs]) => {
        const program = programs.find((p) => p.name === programName);
        return program ? { program, logs } : null;
      })
      .filter((p): p is { program: WorkoutProgram; logs: PerformanceLog[] } => p !== null);
  }, [client?.performanceLogs, programs]);

  // Coach formations
  const coachFormations = useMemo(() => {
    // This would come from context or be fetched
    return [];
  }, [user]);

  // Load assigned programs
  useEffect(() => {
    const loadAssignedPrograms = async () => {
      if (!clientId) return;
      setIsLoadingPrograms(true);
      try {
        const programs = await getClientAssignedProgramsForCoach(clientId);
        setAssignedPrograms(programs);
      } catch (error) {
        console.error('Erreur lors du chargement des programmes assignés:', error);
      } finally {
        setIsLoadingPrograms(false);
      }
    };
    loadAssignedPrograms();
  }, [clientId]);

  // Modal handlers
  const openProgramModal = (program: WorkoutProgram) => {
    setSelectedProgram(program);
    setIsProgramModalOpen(true);
  };
  const closeProgramModal = () => {
    setSelectedProgram(null);
    setIsProgramModalOpen(false);
  };
  const openHistoryModal = (data: { program: WorkoutProgram; logs: PerformanceLog[] }) => {
    setSelectedHistoricalProgram(data);
    setIsHistoryModalOpen(true);
  };
  const closeHistoryModal = () => {
    setSelectedHistoricalProgram(null);
    setIsHistoryModalOpen(false);
  };

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  if (!client) {
    return <div className="text-center py-8">Client non trouvé.</div>;
  }

  const isCoach = user.role === 'coach' || user.role === 'admin';

  return (
    <div>
      {/* Header */}
      <div className="flex flex-wrap justify-between items-center gap-4 mb-6">
        <div className="flex items-center space-x-4">
          <img
            src={getUserAvatarUrl(client as any, 80)}
            alt={`${client.firstName} ${client.lastName}`}
            className="w-20 h-20 rounded-full"
          />
          <div>
            <h1 className="text-3xl font-bold text-gray-800">
              {client.firstName} {client.lastName}
            </h1>
            <p className="text-gray-500">{client.objective}</p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <Button
            variant="secondary"
            onClick={() => navigate(`/app/messagerie?clientId=${client.id}`)}
          >
            <EnvelopeIcon className="w-5 h-5 mr-2" /> Messagerie
          </Button>
          {isCoach && (
            <>
              <Button onClick={() => setShowBilanAssignmentModal(true)} variant="primary">
                Assigner un Bilan
              </Button>
              {client.status === 'active' ? (
                <Button
                  variant="secondary"
                  onClick={async () => {
                    if (window.confirm(`Êtes-vous sûr de vouloir archiver ce client ?`)) {
                      try {
                        const { updateUser, addNotification } = useDataStore.getState();
                        await updateUser(client.id, { status: 'archived', archived_at: new Date().toISOString() });
                        await addNotification({
                          userId: client.id,
                          title: 'Compte archivé',
                          message: 'Votre compte a été archivé par votre coach. Vous perdrez l\'accès à votre interface dans 7 jours. Vous pouvez choisir de passer en statut indépendant ou de supprimer définitivement votre profil.',
                          type: 'warning',
                          fromName: 'Virtus'
                        });
                        alert('Client archivé avec succès.');
                        navigate('/app/clients');
                      } catch (error) {
                        console.error('Erreur lors de l\'archivage:', error);
                        alert('Une erreur est survenue lors de l\'archivage.');
                      }
                    }
                  }}
                >
                  Archiver
                </Button>
              ) : (
                <Button
                  variant="secondary"
                  onClick={async () => {
                    if (window.confirm(`Êtes-vous sûr de vouloir réintégrer ce client ?`)) {
                      try {
                        const { updateUser } = useDataStore.getState();
                        await updateUser(client.id, { status: 'active', archived_at: null });
                        alert('Client réintégré avec succès.');
                        navigate('/app/clients');
                      } catch (error) {
                        console.error('Erreur lors de la réintégration:', error);
                        alert('Une erreur est survenue lors de la réintégration.');
                      }
                    }
                  }}
                >
                  Réintégrer
                </Button>
              )}
              <Button
                variant="danger"
                onClick={async () => {
                  if (window.confirm(`Êtes-vous sûr de vouloir supprimer définitivement ce client ? Cette action est irréversible.`)) {
                    try {
                      const { deleteUser } = useAuthStore.getState();
                      await deleteUser(client.id);
                      alert('Client supprimé avec succès.');
                      navigate('/app/clients');
                    } catch (error) {
                      console.error('Erreur lors de la suppression:', error);
                      alert('Erreur lors de la suppression du client.');
                    }
                  }
                }}
              >
                Supprimer
              </Button>
            </>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* --- LEFT COLUMN --- */}
        <main className="lg:col-span-2 space-y-6">
          <Accordion title="Informations générales" isOpenDefault={true}>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <InfoItem label="Âge" value={client.age ? `${client.age} ans` : undefined} />
              <InfoItem
                label="Sexe"
                value={
                  client.sex === 'male'
                    ? 'Homme'
                    : client.sex === 'female'
                      ? 'Femme'
                      : client.sex
                }
              />
              <InfoItem
                label="Taille"
                value={client.height ? `${client.height} cm` : undefined}
              />
              <InfoItem label="Poids" value={client.weight ? `${client.weight} kg` : undefined} />
              <InfoItem
                label="Dépense énergétique"
                value={
                  {
                    sedentary: 'Sédentaire',
                    lightly_active: 'Légèrement actif',
                    moderately_active: 'Modérément actif',
                    very_active: 'Très actif',
                    extremely_active: 'Extrêmement actif',
                  }[client.energyExpenditureLevel || ''] || client.energyExpenditureLevel
                }
              />
              <InfoItem
                label="Date d'inscription"
                value={
                  client.createdAt
                    ? new Date(client.createdAt).toLocaleDateString('fr-FR')
                    : undefined
                }
              />
              <InfoItem label="Email" value={client.email} />
              <InfoItem label="Téléphone" value={client.phone} />
              <InfoItem label="Adresse" value={client.address} />
            </div>
          </Accordion>

          <Accordion title="Objectif et Conditions d'Entraînement" isOpenDefault={false}>
            <PerformanceSection clientId={client.id} isCoach={true} />
          </Accordion>

          <Accordion title="Mes bilans" isOpenDefault={false}>
            <ClientBilanHistory
              clientId={client.id}
              coachId={user.id}
              clientStatus={client.status}
              refreshTrigger={bilanRefreshTrigger}
            />
          </Accordion>

          <Accordion title="Notes et Médical" isOpenDefault={false}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="font-semibold text-lg mb-2">Notes du coach</h3>
                <div className="mb-4">
                  <textarea
                    value={newNote}
                    onChange={(e) => setNewNote(e.target.value)}
                    placeholder="Ajouter une nouvelle note..."
                    className="w-full p-2 bg-white border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
                    rows={3}
                  />
                </div>
                <div className="space-y-3 max-h-60 overflow-y-auto pr-2 border rounded-lg p-2 bg-gray-50">
                  {parsedNotes.length > 0 ? (
                    parsedNotes.map((note) => (
                      <div key={note.id} className="bg-white p-3 rounded-md text-sm border">
                        <p className="font-semibold text-gray-600 border-b pb-1 mb-1">
                          {note.date}
                        </p>
                        <p className="whitespace-pre-wrap text-gray-800">{note.content}</p>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-gray-500 text-center py-4">
                      Aucune note pour ce client.
                    </p>
                  )}
                </div>
              </div>
              <div>
                <h3 className="font-semibold text-lg mb-2">Informations Médicales</h3>
                <div className="space-y-4">
                  <div>
                    <label
                      htmlFor="medicalHistory"
                      className="block text-sm font-medium text-gray-700 mb-1"
                    >
                      Antécédents
                    </label>
                    <textarea
                      id="medicalHistory"
                      value={editableData.medicalInfo.history}
                      onChange={(e) => handleMedicalChange('history', e.target.value)}
                      className="w-full p-2 bg-white border border-gray-300 rounded-lg shadow-sm"
                      rows={5}
                    />
                  </div>

                </div>
              </div>
            </div>

            {/* Section Blessures et Douleurs Chroniques */}
            <div className="mt-8 pt-6 border-t border-gray-200">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-lg flex items-center gap-2">
                  <HeartPulse className="h-5 w-5 text-red-500" />
                  Blessures et Douleurs Chroniques
                </h3>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => setIsBodyMapModalOpen(true)}
                  className="flex items-center gap-2"
                >
                  <HeartPulse className="h-4 w-4" />
                  {injuries.length > 0 ? 'Modifier' : 'Ajouter'}
                </Button>
              </div>

              {isLoadingInjuries ? (
                <p className="text-gray-500 text-center py-4">Chargement des blessures...</p>
              ) : injuries.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {injuries.map((injury) => (
                    <div
                      key={injury.id}
                      className="p-3 rounded-lg border bg-white shadow-sm"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span
                              className="w-3 h-3 rounded-full flex-shrink-0"
                              style={{ backgroundColor: INJURY_SEVERITY_COLORS[injury.severity] }}
                            />
                            <span className="font-medium text-sm text-gray-800">
                              {injury.body_part_name_fr || getMuscleById(injury.body_part)?.nameFr || injury.body_part}
                            </span>
                          </div>
                          <span className="text-xs px-2 py-0.5 rounded bg-gray-100 text-gray-600 inline-block mb-2">
                            {INJURY_TYPE_LABELS[injury.type]}
                          </span>
                          <p className="text-sm text-gray-600 line-clamp-2">
                            {injury.description}
                          </p>
                          <div className="text-xs text-gray-500 mt-2">
                            {INJURY_SEVERITY_LABELS[injury.severity]} • {INJURY_STATUS_LABELS[injury.status]}
                            {injury.since && (
                              <span className="block mt-1">
                                Depuis {new Date(injury.since).toLocaleDateString('fr-FR')}
                              </span>
                            )}
                          </div>
                        </div>
                        <button
                          onClick={async () => {
                            if (confirm('Supprimer cette blessure ?')) {
                              await deleteInjury(injury.id);
                              setInjuries(injuries.filter(i => i.id !== injury.id));
                            }
                          }}
                          className="p-1 text-red-500 hover:text-red-700 flex-shrink-0"
                          title="Supprimer"
                        >
                          <TrashIcon className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-500 text-center py-4 bg-gray-50 rounded-lg">
                  Aucune blessure enregistrée pour ce client.
                </p>
              )}
            </div>

            <div className="mt-6 flex justify-end">
              <Button onClick={handleSaveInfoChanges} disabled={!hasInfoChanges}>
                Enregistrer les modifications
              </Button>
            </div>
          </Accordion>

          <Accordion title="Entraînements assignés" isOpenDefault={false}>
            <div className="space-y-3">
              {isLoadingPrograms ? (
                <p className="text-gray-500 text-center py-4">Chargement des programmes...</p>
              ) : assignedPrograms.length > 0 ? (
                assignedPrograms.map((program) => (
                  <Card
                    key={program.id}
                    className="p-4 flex justify-between items-center !shadow-none border"
                  >
                    <div>
                      <p className="font-semibold text-gray-800">{program.name}</p>
                      <p className="text-sm text-gray-500">
                        {program.weekCount} semaines · Semaine {program.currentWeek}/
                        {program.weekCount}
                      </p>
                    </div>
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={async () => {
                        const details = await getClientProgramDetails(program.clientProgramId);
                        if (details) {
                          openProgramModal(details as WorkoutProgram);
                        }
                      }}
                    >
                      Consulter
                    </Button>
                  </Card>
                ))
              ) : (
                <p className="text-gray-500 text-center py-4">Aucun programme assigné.</p>
              )}
            </div>
          </Accordion>

          <Accordion title="Historique des performances" isOpenDefault={false}>
            <div className="space-y-3">
              {historicalPrograms.length > 0 ? (
                historicalPrograms.map(({ program, logs }) => (
                  <Card
                    key={program.id}
                    className="p-4 flex justify-between items-center !shadow-none border"
                  >
                    <div>
                      <p className="font-semibold text-gray-800">{program.name}</p>
                      <p className="text-sm text-gray-500">
                        {logs.length} séance(s) enregistrée(s)
                      </p>
                    </div>
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => openHistoryModal({ program, logs })}
                    >
                      Consulter l'historique
                    </Button>
                  </Card>
                ))
              ) : (
                <p className="text-gray-500 text-center py-4">
                  Aucun historique d'entraînement.
                </p>
              )}
            </div>
          </Accordion>

          <Accordion title="Suivi Nutritionnel" isOpenDefault={false}>
            <Accordion title="Plan Alimentaire" isOpenDefault={false}>
              {(() => {
                const plans = client.assignedNutritionPlans as unknown as NutritionPlan[] | undefined;
                return plans && plans.length > 0 ? (
                plans.map((plan: NutritionPlan) => (
                  <Card
                    key={plan.id}
                    className="p-4 flex justify-between items-center !shadow-none border mb-2"
                  >
                    <div>
                      <p className="font-semibold text-gray-800">{plan.name}</p>
                      <p className="text-sm text-gray-500">{plan.objective}</p>
                    </div>
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => setSelectedNutritionPlan(plan)}
                    >
                      Consulter
                    </Button>
                  </Card>
                ))
              ) : (
                <p className="text-gray-500 text-center py-4">Aucun plan alimentaire assigné.</p>
              );
              })()}
            </Accordion>
            <Accordion title="Aversions et allergies" isOpenDefault={false}>
              <div className="space-y-4">
                <div>
                  <h4 className="font-semibold text-gray-800">Allergies</h4>
                  <p className="text-sm text-gray-600 mt-1 whitespace-pre-wrap">
                    {editableData.medicalInfo.allergies || 'Aucune renseignée.'}
                  </p>
                </div>
                <div>
                  <h4 className="font-semibold text-gray-800">Aversions alimentaires</h4>
                  <p className="text-sm text-gray-600 mt-1 whitespace-pre-wrap">
                    {(client.nutrition as any)?.foodAversions || 'Aucune renseignée.'}
                  </p>
                </div>
              </div>
            </Accordion>
            <Accordion title="Historique des macros" isOpenDefault={false}>
              {(() => {
                const nutritionData = client.nutrition as any;
                return nutritionData?.historyLog && nutritionData.historyLog.length > 0 ? (
                <div className="space-y-3 max-h-80 overflow-y-auto pr-2">
                  <table className="w-full text-sm text-left">
                    <thead className="text-xs text-gray-500 uppercase bg-gray-50 sticky top-0">
                      <tr>
                        <th className="p-2 font-semibold">Date</th>
                        <th className="p-2 font-semibold">Poids</th>
                        <th className="p-2 font-semibold">Calories</th>
                        <th className="p-2 font-semibold">Macros (P/G/L)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {nutritionData.historyLog.map((log: NutritionLogEntry, index: number) => {
                        const pKcal = (log.macros?.protein || 0) * 4;
                        const cKcal = (log.macros?.carbs || 0) * 4;
                        const fKcal = (log.macros?.fat || 0) * 9;

                        return (
                          <tr key={index}>
                            <td className="p-2 text-gray-900">{log.date}</td>
                            <td className="p-2 text-gray-900">
                              {log.weight !== null ? `${log.weight} kg` : '-'}
                            </td>
                            <td className="p-2 text-gray-900">{log.calories} kcal</td>
                            <td className="p-2">
                              <div className="flex flex-col gap-1 text-xs">
                                <div className="flex justify-between items-center">
                                  <span className="font-semibold text-red-600">
                                    P: {log.macros?.protein || 0}g ({pKcal} kcal)
                                  </span>
                                  <span className="bg-red-100 text-red-800 font-medium px-2 py-0.5 rounded-full">
                                    {log.calories > 0
                                      ? ((pKcal / log.calories) * 100).toFixed(0)
                                      : 0}
                                    %
                                  </span>
                                </div>
                                <div className="flex justify-between items-center">
                                  <span className="font-semibold text-green-600">
                                    G: {log.macros?.carbs || 0}g ({cKcal} kcal)
                                  </span>
                                  <span className="bg-green-100 text-green-800 font-medium px-2 py-0.5 rounded-full">
                                    {log.calories > 0
                                      ? ((cKcal / log.calories) * 100).toFixed(0)
                                      : 0}
                                    %
                                  </span>
                                </div>
                                <div className="flex justify-between items-center">
                                  <span className="font-semibold text-yellow-500">
                                    L: {log.macros?.fat || 0}g ({fKcal} kcal)
                                  </span>
                                  <span className="bg-yellow-100 text-yellow-800 font-medium px-2 py-0.5 rounded-full">
                                    {log.calories > 0
                                      ? ((fKcal / log.calories) * 100).toFixed(0)
                                      : 0}
                                    %
                                  </span>
                                </div>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-gray-500 text-center py-4">
                  Aucun historique nutritionnel enregistré.
                </p>
              );
              })()}
            </Accordion>
            <Accordion title="Journal alimentaire" isOpenDefault={false}>
              <CoachFoodJournalView client={client} />
            </Accordion>
          </Accordion>

          <Accordion title="Suivi Mensurations & Photos" isOpenDefault={false}>
            <h4 className="font-semibold text-lg mb-4">Graphique d'évolution</h4>
            <MeasurementsLineChart
              data={measurementHistoryForChart}
              selectedMeasurements={selectedMeasurements}
            />
            <div className="mt-4 flex flex-wrap justify-center gap-2">
              {availableMeasurementsForSelect.map((key) => (
                <label
                  key={String(key)}
                  className="flex items-center space-x-2 cursor-pointer text-sm"
                >
                  <input
                    type="checkbox"
                    checked={selectedMeasurements.includes(key)}
                    onChange={() => handleToggleMeasurement(key)}
                    className="rounded text-primary focus:ring-primary"
                  />
                  <span>{measurementLabels[key]}</span>
                </label>
              ))}
            </div>
            <div className="pt-6 mt-6 border-t border-gray-200">
              <h4 className="font-semibold text-lg mb-4">Historique des données</h4>
              {measurementHistoryTable.data.length > 0 ? (
                <div className="overflow-x-auto border border-gray-200 rounded-lg max-h-60">
                  <table className="w-full text-sm text-left">
                    <thead className="text-xs text-gray-500 uppercase bg-gray-50 sticky top-0">
                      <tr>
                        <th className="p-2 font-semibold sticky left-0 bg-gray-50 z-10">Date</th>
                        <th className="p-2 font-semibold">Poids (kg)</th>
                        {measurementHistoryTable.headers.map((key) => (
                          <th key={key} className="p-2 font-semibold">
                            {measurementLabels[key]}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {measurementHistoryTable.data.map((row: any, index: number) => (
                        <tr key={index} className="bg-white hover:bg-gray-50">
                          <td className="p-2 sticky left-0 bg-white">{row.date}</td>
                          <td className="p-2">{row.weight ? row.weight.toFixed(1) : '-'}</td>
                          {measurementHistoryTable.headers.map((key) => (
                            <td key={key} className="p-2">
                              {row[key as keyof typeof row] || '-'}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-gray-500 text-center py-4">
                  Aucun historique de mensurations.
                </p>
              )}
            </div>
            <div className="pt-6 mt-6 border-t border-gray-200">
              <h4 className="font-semibold text-lg mb-2">Photos de suivi</h4>
              {photoFiles.length > 0 ? (
                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-4">
                  {photoFiles.map((file: SharedFile) => (
                    <div key={file.id} className="relative group aspect-square">
                      <img
                        src={file.fileContent || file.url}
                        alt={file.fileName || file.name}
                        className="w-full h-full object-cover rounded-lg"
                      />
                      <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex flex-col justify-end p-2 text-white">
                        <button
                          onClick={() => handleDeleteFile(file.id)}
                          className="absolute top-1 right-1 p-1 bg-red-500 rounded-full hover:bg-red-600"
                        >
                          <TrashIcon className="w-4 h-4" />
                        </button>
                        <p className="text-xs font-semibold break-words">{file.fileName || file.name}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-center py-4 bg-gray-50 rounded-md">
                  Aucune photo partagée.
                </p>
              )}
            </div>
          </Accordion>

          <Accordion title="Documents" isOpenDefault={false}>
            <CoachClientDocuments 
              clientId={client.id} 
              clientName={`${client.firstName} ${client.lastName}`} 
            />
          </Accordion>

          <Accordion title="Accès & Permissions" isOpenDefault={false}>
            <div className="space-y-6">
              <div>
                <h4 className="text-md font-semibold text-gray-800 mb-3 border-b pb-2">
                  Accès & Permissions
                </h4>
                <div className="space-y-4">
                  <SimpleToggle
                    label="Accès au Workout Builder"
                    enabled={editableAccess.canUseWorkoutBuilder}
                    onChange={(enabled) =>
                      setEditableAccess((prev) => ({ ...prev, canUseWorkoutBuilder: enabled }))
                    }
                  />
                  <SimpleToggle
                    label="Accès à la boutique générale"
                    enabled={editableAccess.shopAccess.adminShop}
                    onChange={(enabled) =>
                      setEditableAccess((prev) => ({
                        ...prev,
                        shopAccess: { ...prev.shopAccess, adminShop: enabled },
                      }))
                    }
                  />
                  <SimpleToggle
                    label="Accès à la boutique du coach"
                    enabled={editableAccess.shopAccess.coachShop}
                    onChange={(enabled) =>
                      setEditableAccess((prev) => ({
                        ...prev,
                        shopAccess: { ...prev.shopAccess, coachShop: enabled },
                      }))
                    }
                  />
                </div>
              </div>
              <div>
                <h4 className="text-md font-semibold text-gray-800 mb-3 border-b pb-2">
                  Formations
                </h4>
                <div className="space-y-4">
                  {coachFormations.length > 0 ? (
                    coachFormations.map((formation: any) => (
                      <SimpleToggle
                        key={formation.id}
                        label={formation.title}
                        enabled={(editableAccess.grantedFormationIds || []).includes(formation.id)}
                        onChange={() => handleFormationAccessToggle(formation.id)}
                      />
                    ))
                  ) : (
                    <p className="text-sm text-gray-500 text-center">
                      Vous n'avez créé aucune formation.{' '}
                      <Link to="/app/formations" className="text-primary underline">
                        En créer une
                      </Link>
                      .
                    </p>
                  )}
                </div>
              </div>
            </div>
            <div className="mt-6 flex justify-end gap-2">
              <Button onClick={handleSaveAccess}>Enregistrer les accès</Button>
            </div>
          </Accordion>
        </main>

        {/* --- RIGHT COLUMN (SIDEBAR) --- */}
        <aside className="lg:col-span-1 space-y-6 lg:sticky lg:top-8 self-start">
          {baseMetabolicData && (
            <Card className="p-4">
              <h3 className="font-bold text-lg mb-4 text-center">Données Métaboliques</h3>
              <div className="grid grid-cols-2 lg:grid-cols-2 gap-4 text-center">
                <InfoItem label="Métabolisme (BMR)" value={`${baseMetabolicData.bmr} kcal`} />
                <InfoItem label="Maintien (TDEE)" value={`${tdee} kcal`} />
              </div>
            </Card>
          )}

          {editableCalculatedData && (
            <Card className="p-4">
              <div className="flex flex-wrap justify-between items-center gap-2 mb-4">
                <div className="flex items-center gap-3">
                  <h3 className="font-bold text-lg">Objectif calorique</h3>
                  {/* Toggle Grammes / Pourcentages */}
                  <div className="flex items-center bg-gray-100 rounded-lg p-0.5">
                    <button
                      onClick={() => setMacroDisplayMode('grams')}
                      className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
                        macroDisplayMode === 'grams'
                          ? 'bg-white text-gray-900 shadow-sm'
                          : 'text-gray-500 hover:text-gray-700'
                      }`}
                    >
                      g
                    </button>
                    <button
                      onClick={() => setMacroDisplayMode('percent')}
                      className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
                        macroDisplayMode === 'percent'
                          ? 'bg-white text-gray-900 shadow-sm'
                          : 'text-gray-500 hover:text-gray-700'
                      }`}
                    >
                      %
                    </button>
                  </div>
                </div>
                {editableCalculatedData.surplusDeficit !== 0 && 
                 Math.abs(editableCalculatedData.surplusDeficit) >= 5 && (
                  <span
                    className={`font-bold text-sm px-2 py-0.5 rounded-md ${editableCalculatedData.surplusDeficit > 0 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}
                  >
                    {editableCalculatedData.surplusDeficit > 0 ? '+' : ''}
                    {editableCalculatedData.surplusDeficit} kcal (
                    {editableCalculatedData.surplusDeficitPercent.toFixed(1)}%)
                  </span>
                )}
              </div>
              <div className="flex flex-col sm:flex-row justify-start items-center gap-4 sm:gap-6">
                <div className="relative w-32 h-32 flex-shrink-0">
                  <div
                    className="w-full h-full rounded-full"
                    style={gradientStyle}
                    role="img"
                    aria-label="Répartition des macronutriments"
                  ></div>
                  <div className="absolute inset-2 bg-white rounded-full flex items-center justify-center flex-col text-center">
                    <span className="text-xs text-gray-500">Objectif</span>
                    <span className="font-bold text-lg leading-tight">
                      {editableCalculatedData.objectifCalorique}
                    </span>
                    <span className="text-sm text-gray-600">kcal</span>
                  </div>
                </div>
                <div className="space-y-3 text-sm w-full max-w-sm">
                  {(['protein', 'carbs', 'fat'] as const).map((macro) => {
                    // Delta par rapport aux macros d'origine (TDEE) - persiste même après sauvegarde
                    const delta = editableMacros[macro] - (originMacros[macro] || 0);
                    const totalCalories = editableCalculatedData.objectifCalorique;
                    const macroCalories = macro === 'fat' 
                      ? editableMacros[macro] * 9 
                      : editableMacros[macro] * 4;
                    const macroPercent = totalCalories > 0 
                      ? Math.round((macroCalories / totalCalories) * 100) 
                      : 0;
                    
                    // Calcul du pourcentage d'origine (TDEE) pour le delta en mode %
                    const originMacroCalories = macro === 'fat'
                      ? (originMacros[macro] || 0) * 9
                      : (originMacros[macro] || 0) * 4;
                    // Calculer les calories totales d'origine pour le pourcentage
                    const originTotalCalories = (originMacros.protein * 4) + (originMacros.carbs * 4) + (originMacros.fat * 9);
                    const originMacroPercent = originTotalCalories > 0
                      ? Math.round((originMacroCalories / originTotalCalories) * 100)
                      : 0;
                    const deltaPercent = macroPercent - originMacroPercent;
                    
                    return (
                      <div key={macro} className="grid grid-cols-12 items-center gap-2">
                        <div className="col-span-4 flex items-center gap-2">
                          <span
                            className={`w-3 h-3 rounded-full ${macro === 'protein' ? 'bg-[#ef4444]' : macro === 'carbs' ? 'bg-[#10b981]' : 'bg-[#facc15]'} flex-shrink-0`}
                          ></span>
                          <label className="font-semibold text-gray-800">
                            {macroLabels[macro]}
                          </label>
                        </div>
                        <div className="col-span-2 text-left">
                          {macroDisplayMode === 'grams' ? (
                            Math.abs(delta) > 0 && (
                              <span
                                className={`font-bold text-sm ${delta > 0 ? 'text-green-500' : 'text-red-500'}`}
                              >{`${delta > 0 ? '+' : ''}${delta.toFixed(0)}g`}</span>
                            )
                          ) : (
                            Math.abs(deltaPercent) > 0 && (
                              <span
                                className={`font-bold text-sm ${deltaPercent > 0 ? 'text-green-500' : 'text-red-500'}`}
                              >{`${deltaPercent > 0 ? '+' : ''}${deltaPercent}%`}</span>
                            )
                          )}
                        </div>
                        <div className="col-span-6 flex items-center justify-end">
                          <button
                            onClick={() => handleMacroAdjustment(macro, macroDisplayMode === 'percent' ? -1 : -1)}
                            className="p-1 rounded-l-md bg-gray-200 hover:bg-gray-300 h-9"
                          >
                            <MinusIcon className="w-4 h-4" />
                          </button>
                          <div className="relative w-20">
                            <Input
                              type="number"
                              value={macroDisplayMode === 'grams' ? editableMacros[macro] : macroPercent}
                              onChange={(e) => {
                                if (macroDisplayMode === 'grams') {
                                  handleMacroChange(macro, e.target.value);
                                } else {
                                  // Convertir le pourcentage en grammes
                                  const newPercent = parseFloat(e.target.value) || 0;
                                  const caloriesForMacro = (newPercent / 100) * totalCalories;
                                  const gramsForMacro = macro === 'fat' 
                                    ? Math.round(caloriesForMacro / 9) 
                                    : Math.round(caloriesForMacro / 4);
                                  handleMacroChange(macro, gramsForMacro.toString());
                                }
                              }}
                              className="w-full text-center !p-1 h-9 !rounded-none"
                            />
                            <span className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none text-xs">
                              {macroDisplayMode === 'grams' ? 'g' : '%'}
                            </span>
                          </div>
                          <button
                            onClick={() => handleMacroAdjustment(macro, macroDisplayMode === 'percent' ? 1 : 1)}
                            className="p-1 rounded-r-md bg-gray-200 hover:bg-gray-300 h-9"
                          >
                            <PlusIcon className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
              <div className="mt-4 flex justify-end">
                <Button onClick={handleSaveMacros} disabled={!macrosHaveChanged}>
                  {macrosHaveChanged ? 'Macros à jour' : 'Macros à jour'}
                </Button>
              </div>
            </Card>
          )}

          <Card className="p-4">
            <h3 className="font-bold text-lg mb-2">Suivi du Poids</h3>
            <SimpleLineChart
              data={(client.nutrition as any)?.weightHistory || []}
              color="#7A68FA"
              unit="kg"
            />
          </Card>
        </aside>
      </div>

      {/* Modals */}
      {selectedProgram && (
        <Modal
          isOpen={isProgramModalOpen}
          onClose={closeProgramModal}
          title={`Détail du programme: ${selectedProgram.name}`}
          size="xl"
        >
          <ProgramDetailView program={selectedProgram} />
        </Modal>
      )}

      {selectedHistoricalProgram && (
        <Modal
          isOpen={isHistoryModalOpen}
          onClose={closeHistoryModal}
          title={`Historique pour : ${selectedHistoricalProgram.program.name}`}
          size="xl"
        >
          <ProgramPerformanceDetail
            program={selectedHistoricalProgram.program}
            performanceLogs={selectedHistoricalProgram.logs}
          />
        </Modal>
      )}

      {selectedNutritionPlan && (
        <Modal
          isOpen={!!selectedNutritionPlan}
          onClose={() => setSelectedNutritionPlan(null)}
          title={`Plan alimentaire: ${selectedNutritionPlan.name}`}
          size="xl"
        >
          <CoachNutritionPlanView plan={selectedNutritionPlan} />
        </Modal>
      )}

      {client && (
        <BilanAssignmentModal
          isOpen={showBilanAssignmentModal}
          onClose={() => setShowBilanAssignmentModal(false)}
          client={client}
          onAssignmentSuccess={handleBilanAssignmentSuccess}
        />
      )}

      {selectedBilan && bilanTemplateForModal && (
        <Modal
          isOpen={!!selectedBilan}
          onClose={() => setSelectedBilan(null)}
          title={selectedBilan.templateName}
          size="xl"
        >
          <div className="space-y-6">
            {bilanTemplateForModal.sections.map((section) => {
              if (section.isCivility && selectedBilan.templateId === 'system-default') return null;

              const answeredFields = section.fields.filter((field) => {
                const answer = selectedBilan?.answers?.[field.id];
                return (
                  answer !== undefined &&
                  answer !== null &&
                  answer !== '' &&
                  (!Array.isArray(answer) || (Array.isArray(answer) && answer.length > 0))
                );
              });

              if (answeredFields.length === 0) return null;

              return (
                <div key={section.id}>
                  <h4 className="font-semibold text-lg text-gray-800 mb-2 pt-4 border-t border-gray-200 first:pt-0 first:border-t-0">
                    {section.title}
                  </h4>
                  <div className="space-y-1">
                    {answeredFields.map((field) => {
                      const answer = selectedBilan!.answers![field.id];
                      return (
                        <InfoRowModal
                          key={field.id}
                          label={field.label}
                          value={Array.isArray(answer) ? answer.join(', ') : String(answer)}
                        />
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </Modal>
      )}

      {/* Modale de carte corporelle pour les blessures */}
      {client && (
        <BodyMapModal
          isOpen={isBodyMapModalOpen}
          onClose={() => setIsBodyMapModalOpen(false)}
          injuries={injuries.map(inj => ({
            id: inj.id,
            bodyPart: inj.body_part as any,
            type: inj.type,
            description: inj.description,
            severity: inj.severity,
            status: inj.status,
            since: inj.since,
            notes: inj.notes,
            createdAt: inj.created_at,
            updatedAt: inj.updated_at,
          }))}
          onSave={async (newInjuries) => {
            // Convertir et sauvegarder les blessures
            const injuriesToCreate: CreateInjuryData[] = newInjuries
              .filter(inj => !injuries.find(existing => existing.id === inj.id))
              .map(injury => {
                const muscle = getMuscleById(injury.bodyPart);
                return {
                  client_id: client.id,
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

            // Supprimer les blessures retirées
            const injuriesToDelete = injuries.filter(
              existing => !newInjuries.find(inj => inj.id === existing.id)
            );
            for (const injury of injuriesToDelete) {
              await deleteInjury(injury.id);
            }

            // Créer les nouvelles blessures
            if (injuriesToCreate.length > 0) {
              await createMultipleInjuries(injuriesToCreate);
            }

            // Recharger les blessures
            const updatedInjuries = await getClientInjuries(client.id);
            setInjuries(updatedInjuries);
          }}
          theme="light"
        />
      )}
    </div>
  );
};

export default ClientProfile;
