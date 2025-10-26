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
  BilanResult,
  NutritionDay,
} from '../types';
import Accordion from '../components/Accordion';
import Card from '../components/Card';
import Modal from '../components/Modal';
import { useAuth } from '../context/AuthContext';
import BilanAssignmentModal from '../components/coach/BilanAssignmentModal';
import ProgramDetailView from '../components/ProgramDetailView';
import ProgramPerformanceDetail from '../components/ProgramPerformanceDetail';
import Input from '../components/Input';
import Button from '../components/Button';
import SimpleLineChart from '../components/charts/SimpleLineChart';
import MeasurementsLineChart from '../components/charts/MeasurementsLineChart';

/* ------------------------- ICONS ------------------------- */
const EnvelopeIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 0 1-2.25 2.25h-15a2.25 2.25 0 0 1-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25m19.5 0v.243a2.25 2.25 0 0 1-1.07 1.916l-7.5 4.615a2.25 2.25 0 0 1-2.36 0L3.32 8.91a2.25 2.25 0 0 1-1.07-1.916V6.75" />
  </svg>
);
const PlusIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" {...props}>
    <path fillRule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clipRule="evenodd" />
  </svg>
);
const MinusIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" {...props}>
    <path fillRule="evenodd" d="M5 10a1 1 0 011-1h8a1 1 0 110 2H6a1 1 0 01-1-1z" clipRule="evenodd" />
  </svg>
);
const DocumentIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
  </svg>
);
const TrashIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.134-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.067-2.09 1.02-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
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
    // Log client prioritaire si présent
    if (client.nutrition?.foodJournal && dateKey in client.nutrition.foodJournal) {
      return { journalDayMeals: client.nutrition.foodJournal[dateKey] ?? [], isFromPlan: false };
    }
    // Fall-back : plan assigné (semaine 1)
    const assignedPlan = client.assignedNutritionPlans?.[0];
    if (assignedPlan) {
      const planDaysForWeek1 = assignedPlan.daysByWeek['1'] ?? [];
      if (planDaysForWeek1.length > 0) {
        const dayOfWeekIndex = (selectedDate.getDay() + 6) % 7; // Lundi=0
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
    const macros = client.nutrition?.macros;
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
  const { calories: goalCalories, protein: goalProtein, carbs: goalCarbs, fat: goalFat } = macroGoals;

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <Button type="button" variant="secondary" size="sm" onClick={() => changeDay(-1)}>
          Précédent
        </Button>
        <span className="font-semibold text-lg text-center">
          {selectedDate.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}
        </span>
        <Button type="button" variant="secondary" size="sm" onClick={() => changeDay(1)}>
          Suivant
        </Button>
      </div>

      {isFromPlan && journalDayMeals.length > 0 && (
        <div className="p-2 bg-blue-50 border border-blue-200 rounded-md text-center text-sm text-blue-800 mb-4">
          Ceci est le <strong>plan assigné</strong>. Le client n'a pas encore rempli son journal pour ce jour.
        </div>
      )}

      <Card className="p-4 bg-gray-50 border mb-4">
        <h4 className="font-bold text-center mb-2">Total du Jour</h4>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
          <InfoItem label="Calories" value={`${Math.round(calories)} / ${Math.round(goalCalories)} kcal`} />
          <InfoItem label="Protéines" value={`${Math.round(protein)} / ${Math.round(goalProtein)} g`} />
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
                  <span className="text-sm font-medium text-gray-600">{Math.round(mealMacros.calories)} kcal</span>
                </div>
                {meal.items.length > 0 ? (
                  <ul className="space-y-1">
                    {meal.items.map((item) => (
                      <li key={item.id} className="flex justify-between items-center text-sm p-2 bg-gray-50 rounded">
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

/* ------------------------- NUTRITION PLAN (Coach) ------------------------- */
const CoachNutritionPlanView: React.FC<{ plan: NutritionPlan }> = ({ plan }) => {
  const [selectedWeek, setSelectedWeek] = useState(1);
  const weekKey = String(selectedWeek) as keyof typeof plan.daysByWeek;
  const weekDays: NutritionDay[] = plan.daysByWeek[weekKey] ?? [];

  const mealNames = useMemo(() => {
    const names = new Set<string>();
    Object.values(plan.daysByWeek)
      .flat()
      .forEach((day: NutritionDay) => {
        day.meals.forEach((meal) => names.add(meal.name));
      });

    const standardOrder: Record<string, number> = {
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

    return Array.from(names).sort((a, b) => (standardOrder[a] ?? 99) - (standardOrder[b] ?? 99));
  }, [plan.daysByWeek]);

  const calculateMacros = (items: MealItem[]) => {
    return items.reduce(
      (acc, item) => {
        if (!item.food) return acc;
        const ratio = (item.quantity ?? 0) / 100;
        acc.calories += (item.food.calories ?? 0) * ratio;
        acc.protein += (item.food.protein ?? 0) * ratio;
        acc.carbs += (item.food.carbs ?? 0) * ratio;
        acc.fat += (item.food.fat ?? 0) * ratio;
        return acc;
      },
      { calories: 0, protein: 0, carbs: 0, fat: 0 }
    );
  };

  return (
    <div className="mb-6 border border-gray-200 rounded-lg p-4 bg-white last:mb-0">
      <h3 className="text-xl font-bold text-gray-800">{plan.name}</h3>
      <p className="text-sm text-gray-600 mb-4 italic">{plan.objective}</p>

      {plan.weekCount > 1 && (
        <div className="mb-4 border-b border-gray-200">
          <nav className="-mb-px flex space-x-4 overflow-x-auto" aria-label="Weeks">
            {Array.from({ length: plan.weekCount }).map((_, i) => (
              <button
                key={i + 1}
                type="button"
                onClick={() => setSelectedWeek(i + 1)}
                className={`${
                  selectedWeek === i + 1 ? 'border-primary text-primary' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                } whitespace-nowrap py-3 px-1 border-b-2 font-medium text-sm`}
              >
                Semaine {i + 1}
              </button>
            ))}
          </nav>
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="p-2 text-left font-semibold text-gray-600 sticky left-0 bg-gray-50 z-10">Jour</th>
              {mealNames.map((name) => (
                <th key={name} className="p-2 text-left font-semibold text-gray-600 min-w-[220px]">
                  {name}
                </th>
              ))}
              <th className="p-2 text-left font-semibold text-gray-600 min-w-[150px]">Totaux Journaliers</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {weekDays.map((day) => {
              const dailyTotals = calculateMacros(
                day.meals.flatMap((m) => m.items)
              );

              return (
                <tr key={day.id}>
                  <td className="p-2 font-bold align-top sticky left-0 bg-white">{day.name}</td>
                  {mealNames.map((mealName) => {
                    const meal = day.meals.find((m) => m.name === mealName);
                    const mealMacros = meal ? calculateMacros(meal.items) : { calories: 0, protein: 0, carbs: 0, fat: 0 };

                    return (
                      <td key={mealName} className="p-2 align-top border-l">
                        {meal && meal.items.length > 0 ? (
                          <div className="space-y-1">
                            {meal.items.map((item) => (
                              <div key={item.id} className="flex justify-between text-gray-800">
                                <span className="pr-2">{item.food?.name ?? 'Aliment'}</span>
                                <span className="font-medium text-gray-900 whitespace-nowrap">
                                  {item.quantity}
                                  {item.unit}
                                </span>
                              </div>
                            ))}
                            <div className="pt-2 mt-2 border-t border-gray-100 text-xs text-gray-500 font-semibold space-y-0.5">
                              <div>{Math.round(mealMacros.calories)} kcal</div>
                              <div className="flex justify-between flex-wrap gap-x-2">
                                <span className="text-red-500">P: {Math.round(mealMacros.protein)}g</span>
                                <span className="text-green-600">G: {Math.round(mealMacros.carbs)}g</span>
                                <span className="text-yellow-500">L: {Math.round(mealMacros.fat)}g</span>
                              </div>
                            </div>
                          </div>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </td>
                    );
                  })}
                  <td className="p-2 align-top font-bold border-l">
                    <div>{Math.round(dailyTotals.calories)} kcal</div>
                    <div className="font-normal text-xs space-y-0.5 mt-1">
                      <div className="text-red-600">P: {Math.round(dailyTotals.protein)}g</div>
                      <div className="text-green-700">G: {Math.round(dailyTotals.carbs)}g</div>
                      <div className="text-yellow-600">L: {Math.round(dailyTotals.fat)}g</div>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {weekDays.length === 0 && <p className="text-center text-gray-500 py-4">Aucun jour défini pour cette semaine.</p>}
      </div>
    </div>
  );
};

/* ------------------------- MAIN ------------------------- */
const ClientProfile: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { user, clients, programs, updateUser, bilanTemplates, clientFormations, bilanAssignments } = useAuth();
  const navigate = useNavigate();
  const client = clients.find((p) => p.id === id);

  const [isProgramModalOpen, setIsProgramModalOpen] = useState(false);
  const [selectedProgram, setSelectedProgram] = useState<WorkoutProgram | null>(null);

  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [showBilanAssignmentModal, setShowBilanAssignmentModal] = useState(false);
  const [selectedHistoricalProgram, setSelectedHistoricalProgram] = useState<{ program: WorkoutProgram; logs: PerformanceLog[] } | null>(null);

  const [editableMacros, setEditableMacros] = useState(client?.nutrition?.macros ?? { protein: 0, carbs: 0, fat: 0 });
  const [initialMacros, setInitialMacros] = useState(client?.nutrition?.macros ?? { protein: 0, carbs: 0, fat: 0 });
  const [tdee, setTdee] = useState<number | null>(null);

  const [editableData, setEditableData] = useState({
    notes: client?.notes ?? '',
    medicalInfo: {
      history: client?.medicalInfo?.history ?? '',
      allergies: client?.medicalInfo?.allergies ?? '',
    },
  });
  const [newNote, setNewNote] = useState('');

  const measurementLabels: Partial<Record<keyof Measurement, string>> = {
    neck: 'Cou',
    chest: 'Poitrine',
    l_bicep: 'Biceps G.',
    r_bicep: 'Biceps D.',
    waist: 'Taille',
    hips: 'Hanches',
    l_thigh: 'Cuisse G.',
    r_thigh: 'Cuisse D.',
  };
  const [selectedMeasurements, setSelectedMeasurements] = useState<Array<keyof Measurement>>(['chest']);
  const [selectedNutritionPlan, setSelectedNutritionPlan] = useState<NutritionPlan | null>(null);
  const [selectedBilan, setSelectedBilan] = useState<BilanResult | null>(null);

  const [editableAccess, setEditableAccess] = useState({
    canUseWorkoutBuilder: client?.canUseWorkoutBuilder ?? true,
    grantedFormationIds: client?.grantedFormationIds ?? [],
    shopAccess: {
      adminShop: client?.shopAccess?.adminShop ?? true,
      coachShop: client?.shopAccess?.coachShop ?? true,
    },
  });

  const coachFormations = useMemo(() => {
    if (!user) return [];
    return clientFormations.filter((f) => f.coachId === user.id);
  }, [clientFormations, user]);

  const bilanTemplateForModal = useMemo(() => {
    if (!selectedBilan) return null;
    return bilanTemplates.find((t) => t.id === selectedBilan.templateId) ?? null;
  }, [selectedBilan, bilanTemplates]);

  useEffect(() => {
    if (client) {
      setEditableData({
        notes: client.notes ?? '',
        medicalInfo: { history: client.medicalInfo?.history ?? '', allergies: client.medicalInfo?.allergies ?? '' },
      });
      setEditableAccess({
        canUseWorkoutBuilder: client.canUseWorkoutBuilder ?? true,
        grantedFormationIds: client.grantedFormationIds ?? [],
        shopAccess: {
          adminShop: client.shopAccess?.adminShop ?? true,
          coachShop: client.shopAccess?.coachShop ?? true,
        },
      });
    }
  }, [client]);

  const handleMedicalChange = (field: 'history' | 'allergies', value: string) => {
    setEditableData((prev) => ({ ...prev, medicalInfo: { ...prev.medicalInfo, [field]: value } }));
  };

  const hasInfoChanges = useMemo(() => {
    if (!client) return false;
    return (
      newNote.trim() !== '' ||
      editableData.notes !== (client.notes ?? '') ||
      editableData.medicalInfo.history !== (client.medicalInfo?.history ?? '') ||
      editableData.medicalInfo.allergies !== (client.medicalInfo?.allergies ?? '')
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
      await updateUser(client.id!, {
        notes: finalNotes,
        medicalInfo: { ...client.medicalInfo, ...editableData.medicalInfo },
      });
      setNewNote('');
      if (typeof window !== 'undefined') {
        // eslint-disable-next-line no-alert
        alert('Modifications enregistrées !');
      }
    } catch (error) {
      console.error('Erreur lors de la sauvegarde des informations client:', error);
      if (typeof window !== 'undefined') {
        // eslint-disable-next-line no-alert
        alert('Erreur lors de la sauvegarde des informations.');
      }
    }
  };

  const handleFormationAccessToggle = (formationId: string) => {
    setEditableAccess((prev) => {
      const currentIds = prev.grantedFormationIds ?? [];
      const newIds = currentIds.includes(formationId) ? currentIds.filter((id) => id !== formationId) : [...currentIds, formationId];
      return { ...prev, grantedFormationIds: newIds };
    });
  };

  const handleSaveAccess = async () => {
    if (!client) return;
    try {
      await updateUser(client.id!, { ...editableAccess });
      if (typeof window !== 'undefined') {
        // eslint-disable-next-line no-alert
        alert('Permissions mises à jour.');
      }
    } catch (error) {
      console.error("Erreur lors de la sauvegarde des permissions d'accès:", error);
      if (typeof window !== 'undefined') {
        // eslint-disable-next-line no-alert
        alert("Erreur lors de la sauvegarde des permissions d'accès.");
      }
    }
  };

  const parsedNotes = useMemo(() => {
    if (!editableData.notes) return [];
    return editableData.notes
      .split(/(?=---.*?---)/)
      .map((note) => note.trim())
      .filter(Boolean)
      .map((note, index) => {
        const match = note.match(/--- (.*?) ---\n(.*)/s);
        return match ? { id: index, date: match[1], content: match[2].trim() } : { id: index, date: 'Note', content: note };
      });
  }, [editableData.notes]);

  const activityMultipliers: Record<string, number> = {
    Sédentaire: 1.2,
    'Légèrement actif': 1.375,
    Actif: 1.55,
    'Très actif': 1.725,
  };

  const baseMetabolicData = useMemo(() => {
    if (!client || !client.weight || !client.height || !client.age || !client.sex || !client.energyExpenditureLevel) return null;

    const bmr =
      client.sex === 'Homme'
        ? 88.362 + 13.397 * client.weight + 4.799 * client.height - 5.677 * client.age
        : 447.593 + 9.247 * client.weight + 3.098 * client.height - 4.33 * client.age;

    const mult = activityMultipliers[client.energyExpenditureLevel] ?? 1.2;
    const baseTdee = bmr * mult;
    return { bmr: Math.round(bmr), baseTdee: Math.round(baseTdee) };
  }, [client]);

  useEffect(() => {
    if (client && baseMetabolicData) {
      setTdee(baseMetabolicData.baseTdee);

      const macros = client.nutrition?.macros ?? { protein: 0, carbs: 0, fat: 0 };
      const { protein, carbs, fat } = macros;
      const areMacrosSet = protein > 0 || carbs > 0 || fat > 0;

      if (areMacrosSet) {
        setEditableMacros(macros);
        setInitialMacros(macros);
      } else {
        const targetTdee = baseMetabolicData.baseTdee;
        const pG = Math.round((targetTdee * 0.3) / 4); // 30% P
        const fG = Math.round((targetTdee * 0.3) / 9); // 30% L
        const cG = Math.round((targetTdee * 0.4) / 4); // 40% G
        const defaultMacros = { protein: pG, carbs: cG, fat: fG };
        setEditableMacros(defaultMacros);
        setInitialMacros(defaultMacros);
      }
    }
  }, [client, baseMetabolicData]);

  const editableCalculatedData = useMemo(() => {
    if (tdee === null || !client) return null;
    const { protein, carbs, fat } = editableMacros;
    const pKcal = protein * 4;
    const cKcal = carbs * 4;
    const fKcal = fat * 9;
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

  const handleMacroChange = (macro: 'protein' | 'carbs' | 'fat', value: string) => {
    const numValue = parseInt(value, 10);
    if (value === '' || numValue >= 0) {
      setEditableMacros((prev) => ({ ...prev, [macro]: value === '' ? 0 : numValue }));
    }
  };

  const handleMacroAdjustment = (macro: 'protein' | 'carbs' | 'fat', amount: number) => {
    setEditableMacros((prev) => ({ ...prev, [macro]: Math.max(0, (prev[macro] ?? 0) + amount) }));
  };

  const handleSaveMacros = async () => {
    if (!client || !editableMacros || !editableCalculatedData) return;
    const newLogEntry: NutritionLogEntry = {
      date: new Date().toLocaleDateString('fr-FR'),
      weight: client.weight ?? null,
      calories: editableCalculatedData.objectifCalorique,
      macros: { ...editableMacros },
    };
    
    // Mise à jour de l'objet client pour l'envoi à Supabase
    const updatedNutrition = {
      ...client.nutrition,
      macros: editableMacros,
      historyLog: [newLogEntry, ...(client.nutrition?.historyLog ?? [])],
    };

    try {
      await updateUser(client.id!, { nutrition: updatedNutrition });
      setInitialMacros(editableMacros);
      if (typeof window !== 'undefined') {
        // eslint-disable-next-line no-alert
        alert('Macros mises à jour avec succès ! Un log a été créé.');
      }
    } catch (error) {
      console.error('Erreur lors de la sauvegarde des macros:', error);
      if (typeof window !== 'undefined') {
        // eslint-disable-next-line no-alert
        alert('Erreur lors de la sauvegarde des macros.');
      }
    }
  };

  const handleDeleteFile = async (fileId: string) => {
    if (!client) return;

    let proceed = true;
    if (typeof window !== 'undefined') {
      // eslint-disable-next-line no-restricted-globals,no-alert
      proceed = confirm('Êtes-vous sûr de vouloir supprimer ce fichier ?');
    }
    if (!proceed) return;
    
    const updatedSharedFiles = (client.sharedFiles ?? []).filter((f) => f.id !== fileId);

    try {
      await updateUser(client.id!, { sharedFiles: updatedSharedFiles });
      if (typeof window !== 'undefined') {
        // eslint-disable-next-line no-alert
        alert('Fichier supprimé avec succès.');
      }
    } catch (error) {
      console.error('Erreur lors de la suppression du fichier:', error);
      if (typeof window !== 'undefined') {
        // eslint-disable-next-line no-alert
        alert('Erreur lors de la suppression du fichier.');
      }
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const macroLabels = { protein: 'Protéines', carbs: 'Glucides', fat: 'Lipides' };

  const gradientStyle = {
    background: `conic-gradient(#ef4444 0% ${editableCalculatedData?.pieChartPercentages.protein ?? 0}%, #10b981 ${
      editableCalculatedData?.pieChartPercentages.protein ?? 0
    }% ${
      (editableCalculatedData?.pieChartPercentages.protein ?? 0) + (editableCalculatedData?.pieChartPercentages.carbs ?? 0)
    }%, #facc15 ${
      (editableCalculatedData?.pieChartPercentages.protein ?? 0) + (editableCalculatedData?.pieChartPercentages.carbs ?? 0)
    }% 100%)`,
  };

  const parseFrDate = (d: string) => {
    // attend "dd/mm/yyyy"
    const [dd, mm, yyyy] = d.split('/');
    const day = Number(dd);
    const month = Number(mm) - 1;
    const year = Number(yyyy);
    return new Date(year, month, day);
  };

  const historicalPrograms = useMemo(() => {
    if (!client?.performanceLog || !programs) return [];
    const logsByProgramName = client.performanceLog.reduce((acc, log) => {
      (acc[log.programName] ??= []).push(log);
      return acc;
    }, {} as Record<string, PerformanceLog[]>);

    return Object.entries(logsByProgramName)
      .map(([programName, logs]) => {
        const program = programs.find((p) => p.name === programName);
        return program ? { program, logs } : null;
      })
      .filter((p): p is { program: WorkoutProgram; logs: PerformanceLog[] } => p !== null)
      .sort((a, b) => {
        const da = parseFrDate(a.logs.at(-1)!.date).getTime();
        const db = parseFrDate(b.logs.at(-1)!.date).getTime();
        return db - da;
      });
  }, [client?.performanceLog, programs]);

  const availableMeasurementsForSelect = useMemo(() => {
    if (!client?.nutrition?.historyLog) return [];
    const available = new Set<keyof Measurement>();
    client.nutrition.historyLog.forEach((log) => {
      if (log.measurements) {
        (Object.keys(log.measurements) as Array<keyof Measurement>).forEach((key) => {
          if (log.measurements && log.measurements[key] != null) {
            available.add(key);
          }
        });
      }
    });
    return Array.from(available);
  }, [client]);

  const measurementHistoryForChart = useMemo(() => {
    if (!client?.nutrition?.historyLog) return [];
    return [...client.nutrition.historyLog]
      .filter((log) => log.measurements)
      .reverse()
      .map((log) => ({
        date: log.date,
        ...log.measurements,
      }));
  }, [client]);

  const measurementHistoryTable = useMemo(() => {
    if (!client?.nutrition?.historyLog) return { data: [] as NutritionLogEntry[], headers: [] as Array<keyof Measurement> };

    const headers = new Set<keyof Measurement>();
    const validLogs = client.nutrition.historyLog.filter(
      (log) => log.weight != null || (log.measurements && Object.keys(log.measurements).length > 0)
    );

    validLogs.forEach((log) => {
      if (log.measurements) {
        (Object.keys(log.measurements) as (keyof Measurement)[]).forEach((key) => {
          if (log.measurements && log.measurements[key] != null) headers.add(key);
        });
      }
    });

    const sortedHeaders = Array.from(headers).sort();
    const data = validLogs.map((log) => ({
      date: log.date,
      weight: log.weight,
      ...(log.measurements ?? {}),
    }));

    return { data, headers: sortedHeaders };
  }, [client]);

  const photoFiles = useMemo(() => {
    if (!client?.sharedFiles) return [];
    return client.sharedFiles.filter((file) => file.fileType.startsWith('image/'));
  }, [client?.sharedFiles]);

  const documentFiles = useMemo(() => {
    if (!client?.sharedFiles) return [];
    return client.sharedFiles.filter((file) => !file.fileType.startsWith('image/'));
  }, [client?.sharedFiles]);

  const handleToggleMeasurement = (key: keyof Measurement) => {
    setSelectedMeasurements((prev) => (prev.includes(key) ? prev.filter((m) => m !== key) : [...prev, key]));
  };

  if (!id || !client) return <Navigate to="/app/clients" replace />;

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

  const macrosHaveChanged = JSON.stringify(editableMacros) !== JSON.stringify(initialMacros);

  return (
    <div>
      {/* Header */}
      <div className="flex flex-wrap justify-between items-center gap-4 mb-6">
        <div className="flex items-center space-x-4">
          <img src={client.avatar || `https://i.pravatar.cc/80?u=${client.id}`} alt={`${client.firstName} ${client.lastName}`} className="w-20 h-20 rounded-full" />
          <div>
            <h1 className="text-3xl font-bold text-gray-800">
              {client.firstName} {client.lastName}
            </h1>
            <p className="text-gray-500">{client.objective}</p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <Button type="button" variant="secondary" onClick={() => navigate(`/app/messagerie?clientId=${client.id}`)}>
            <EnvelopeIcon className="w-5 h-5 mr-2" /> Messagerie
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* --- LEFT COLUMN --- */}
        <main className="lg:col-span-2 space-y-6">
          <Accordion title="Informations générales">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <InfoItem label="Âge" value={client.age} />
              <InfoItem label="Sexe" value={client.sex} />
              <InfoItem label="Taille" value={client.height ? `${client.height} cm` : 'N/A'} />
              <InfoItem label="Poids" value={client.weight ? `${client.weight} kg` : 'N/A'} />
              <InfoItem label="Dépense énergétique" value={client.energyExpenditureLevel} />
              <InfoItem label="Date d'inscription" value={client.registrationDate} />
              <InfoItem label="Email" value={client.email} />
              <InfoItem label="Téléphone" value={client.phone} />
              <InfoItem label="Adresse" value={client.address} />
            </div>
          </Accordion>

          <Accordion title="Mes bilans">
            {client.bilans && client.bilans.length > 0 ? (
              <div className="space-y-3">
                {[...client.bilans]
                  .sort((a, b) => new Date(b.assignedAt).getTime() - new Date(a.assignedAt).getTime())
                  .map((bilan) => (
                    <div key={bilan.id} className="flex flex-wrap justify-between items-center p-3 bg-gray-50 rounded-lg border">
                      <div>
                        <p className="font-semibold text-gray-800">{bilan.templateName}</p>
                        <p className="text-sm text-gray-500">
                          Assigné le: {new Date(bilan.assignedAt).toLocaleDateString('fr-FR')} - Statut:
                          <span className={`font-medium ${bilan.status === 'completed' ? 'text-green-600' : 'text-yellow-600'}`}>
                            {bilan.status === 'completed' ? ' Complété' : ' En attente'}
                          </span>
                        </p>
                      </div>
                      <div className="mt-2 sm:mt-0">
                        <Button type="button" size="sm" variant="secondary" onClick={() => setSelectedBilan(bilan)} disabled={!bilan.answers}>
                          Consulter
                        </Button>
                      </div>
                    </div>
                  ))}
              </div>
            ) : (
              <p className="text-gray-500 text-center py-4">Aucun bilan assigné.</p>
            )}
          </Accordion>

          <Accordion title="Notes et Médical">
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
                        <p className="font-semibold text-gray-600 border-b pb-1 mb-1">{note.date}</p>
                        <p className="whitespace-pre-wrap text-gray-800">{note.content}</p>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-gray-500 text-center py-4">Aucune note pour ce client.</p>
                  )}
                </div>
              </div>
              <div>
                <h3 className="font-semibold text-lg mb-2">Informations Médicales</h3>
                <div className="space-y-4">
                  <div>
                    <label htmlFor="medicalHistory" className="block text-sm font-medium text-gray-700 mb-1">
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
                  <div>
                    <label htmlFor="medicalAllergies" className="block text-sm font-medium text-gray-700 mb-1">
                      Allergies
                    </label>
                    <textarea
                      id="medicalAllergies"
                      value={editableData.medicalInfo.allergies}
                      onChange={(e) => handleMedicalChange('allergies', e.target.value)}
                      className="w-full p-2 bg-white border border-gray-300 rounded-lg shadow-sm"
                      rows={3}
                    />
                  </div>
                </div>
              </div>
            </div>
            <div className="mt-6 flex justify-end">
              <Button type="button" onClick={handleSaveInfoChanges} disabled={!hasInfoChanges}>
                Enregistrer les modifications
              </Button>
            </div>
          </Accordion>

          <Accordion title="Entraînements assignés">
            <div className="space-y-3">
              {client.assignedPrograms && client.assignedPrograms.length > 0 ? (
                client.assignedPrograms.map((program) => (
                  <Card key={program.id} className="p-4 flex justify-between items-center !shadow-none border">
                    <div>
                      <p className="font-semibold text-gray-800">{program.name}</p>
                      <p className="text-sm text-gray-500">{program.sessionsByWeek['1']?.length ?? 0} séances · {program.weekCount} semaines</p>
                    </div>
                    <Button type="button" size="sm" variant="secondary" onClick={() => openProgramModal(program)}>
                      Consulter
                    </Button>
                  </Card>
                ))
              ) : (
                <p className="text-gray-500 text-center py-4">Aucun programme assigné.</p>
              )}
            </div>
          </Accordion>

          <Accordion title="Historique des performances">
            <div className="space-y-3">
              {historicalPrograms.length > 0 ? (
                historicalPrograms.map(({ program, logs }) => (
                  <Card key={program.id} className="p-4 flex justify-between items-center !shadow-none border">
                    <div>
                      <p className="font-semibold text-gray-800">{program.name}</p>
                      <p className="text-sm text-gray-500">{logs.length} séance(s) enregistrée(s)</p>
                    </div>
                    <Button type="button" size="sm" variant="secondary" onClick={() => openHistoryModal({ program, logs })}>
                      Consulter l'historique
                    </Button>
                  </Card>
                ))
              ) : (
                <p className="text-gray-500 text-center py-4">Aucun historique d'entraînement.</p>
              )}
            </div>
          </Accordion>

          <Accordion title="Suivi Nutritionnel">
            <Accordion title="Plan Alimentaire">
              {client.assignedNutritionPlans && client.assignedNutritionPlans.length > 0 ? (
                client.assignedNutritionPlans.map((plan) => (
                  <Card key={plan.id} className="p-4 flex justify-between items-center !shadow-none border mb-2">
                    <div>
                      <p className="font-semibold text-gray-800">{plan.name}</p>
                      <p className="text-sm text-gray-500">{plan.objective}</p>
                    </div>
                    <Button type="button" size="sm" variant="secondary" onClick={() => setSelectedNutritionPlan(plan)}>
                      Consulter
                    </Button>
                  </Card>
                ))
              ) : (
                <p className="text-gray-500 text-center py-4">Aucun plan alimentaire assigné.</p>
              )}
            </Accordion>

            <Accordion title="Aversions et allergies">
              <div className="space-y-4">
                <div>
                  <h4 className="font-semibold text-gray-800">Allergies</h4>
                  <p className="text-sm text-gray-600 mt-1 whitespace-pre-wrap">{client.medicalInfo?.allergies || 'Aucune renseignée.'}</p>
                </div>
                <div>
                  <h4 className="font-semibold text-gray-800">Aversions alimentaires</h4>
                  <p className="text-sm text-gray-600 mt-1 whitespace-pre-wrap">{client.nutrition?.foodAversions || 'Aucune renseignée.'}</p>
                </div>
              </div>
            </Accordion>

            <Accordion title="Historique des macros">
              {client.nutrition?.historyLog && client.nutrition.historyLog.length > 0 ? (
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
                      {client.nutrition.historyLog.map((log) => {
                        const pKcal = log.macros.protein * 4;
                        const cKcal = log.macros.carbs * 4;
                        const fKcal = log.macros.fat * 9;

                        const pct = (k: number) => (log.calories > 0 ? Math.round((k / log.calories) * 100) : 0);

                        return (
                          <tr key={`${log.date}-${pKcal}-${cKcal}-${fKcal}`}>
                            <td className="p-2 text-gray-900">{log.date}</td>
                            <td className="p-2 text-gray-900">{log.weight != null ? `${log.weight} kg` : '-'}</td>
                            <td className="p-2 text-gray-900">{log.calories} kcal</td>
                            <td className="p-2">
                              <div className="flex flex-col gap-1 text-xs">
                                <div className="flex justify-between items-center">
                                  <span className="font-semibold text-red-600">P: {log.macros.protein}g ({pKcal} kcal)</span>
                                  <span className="bg-red-100 text-red-800 font-medium px-2 py-0.5 rounded-full">{pct(pKcal)}%</span>
                                </div>
                                <div className="flex justify-between items-center">
                                  <span className="font-semibold text-green-600">G: {log.macros.carbs}g ({cKcal} kcal)</span>
                                  <span className="bg-green-100 text-green-800 font-medium px-2 py-0.5 rounded-full">{pct(cKcal)}%</span>
                                </div>
                                <div className="flex justify-between items-center">
                                  <span className="font-semibold text-yellow-500">L: {log.macros.fat}g ({fKcal} kcal)</span>
                                  <span className="bg-yellow-100 text-yellow-800 font-medium px-2 py-0.5 rounded-full">{pct(fKcal)}%</span>
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
                <p className="text-gray-500 text-center py-4">Aucun historique nutritionnel enregistré.</p>
              )}
            </Accordion>

            <Accordion title="Journal alimentaire">
              <CoachFoodJournalView client={client} />
            </Accordion>
          </Accordion>

          <Accordion title="Suivi Mensurations & Photos">
            <h4 className="font-semibold text-lg mb-4">Graphique d'évolution</h4>
            <MeasurementsLineChart data={measurementHistoryForChart} selectedMeasurements={selectedMeasurements} />
            <div className="mt-4 flex flex-wrap justify-center gap-2">
              {availableMeasurementsForSelect.map((key) => (
                <label key={String(key)} className="flex items-center space-x-2 cursor-pointer text-sm">
                  <input
                    type="checkbox"
                    checked={selectedMeasurements.includes(key)}
                    onChange={() => handleToggleMeasurement(key)}
                    className="rounded text-primary focus:ring-primary"
                  />
                  <span>{measurementLabels[key] ?? String(key)}</span>
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
                          <th key={String(key)} className="p-2 font-semibold">
                            {measurementLabels[key] ?? String(key)}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {measurementHistoryTable.data.map((row) => (
                        <tr key={row.date} className="bg-white hover:bg-gray-50">
                          <td className="p-2 sticky left-0 bg-white">{row.date}</td>
                          <td className="p-2">{row.weight != null ? Number(row.weight).toFixed(1) : '-'}</td>
                          {measurementHistoryTable.headers.map((key) => (
                            <td key={String(key)} className="p-2">
                              {row[key as keyof typeof row] != null ? (row[key as keyof typeof row] as string | number) : '-'}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-gray-500 text-center py-4">Aucun historique de mensurations.</p>
              )}
            </div>

            <div className="pt-6 mt-6 border-t border-gray-200">
              <h4 className="font-semibold text-lg mb-2">Photos de suivi</h4>
              {photoFiles.length > 0 ? (
                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-4">
                  {photoFiles.map((file) => (
                    <div key={file.id} className="relative group aspect-square">
                      <img src={file.fileContent} alt={file.fileName} className="w-full h-full object-cover rounded-lg" />
                      <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex flex-col justify-end p-2 text-white">
                        <button
                          type="button"
                          onClick={() => handleDeleteFile(file.id)}
                          className="absolute top-1 right-1 p-1 bg-red-500 rounded-full hover:bg-red-600"
                          aria-label="Supprimer la photo"
                        >
                          <TrashIcon className="w-4 h-4" />
                        </button>
                        <p className="text-xs font-semibold break-words">{file.fileName}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-center py-4 bg-gray-50 rounded-md">Aucune photo partagée.</p>
              )}
            </div>
          </Accordion>

          <Accordion title="Documents">
            <div className="space-y-2">
              {documentFiles.length > 0 ? (
                documentFiles.map((file) => (
                  <div key={file.id} className="p-3 border rounded-lg flex items-center justify-between gap-2 hover:bg-gray-50">
                    <div className="flex items-center gap-3 overflow-hidden">
                      <DocumentIcon className="w-6 h-6 text-primary flex-shrink-0" />
                      <div>
                        <p className="font-medium text-sm truncate">{file.fileName}</p>
                        <p className="text-xs text-gray-500">
                          {new Date(file.uploadedAt).toLocaleDateString('fr-FR')} &middot; {formatFileSize(file.size)}
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleDeleteFile(file.id)}
                      className="p-2 text-gray-500 hover:text-red-500"
                      aria-label="Supprimer le fichier"
                    >
                      <TrashIcon className="w-5 h-5" />
                    </button>
                  </div>
                ))
              ) : (
                <p className="text-gray-500 text-center py-4 bg-gray-50 rounded-md">Aucun document partagé.</p>
              )}
            </div>
          </Accordion>

          <Accordion title="Accès & Permissions">
            <div className="space-y-6">
              <div>
                <h4 className="text-md font-semibold text-gray-800 mb-3 border-b pb-2">Accès & Permissions</h4>
                <div className="space-y-4">
                  <SimpleToggle
                    label="Accès au Workout Builder"
                    enabled={editableAccess.canUseWorkoutBuilder}
                    onChange={(enabled) => setEditableAccess((prev) => ({ ...prev, canUseWorkoutBuilder: enabled }))}
                  />
                  <SimpleToggle
                    label="Accès à la boutique générale"
                    enabled={editableAccess.shopAccess.adminShop}
                    onChange={(enabled) => setEditableAccess((prev) => ({ ...prev, shopAccess: { ...prev.shopAccess, adminShop: enabled } }))}
                  />
                  <SimpleToggle
                    label="Accès à la boutique du coach"
                    enabled={editableAccess.shopAccess.coachShop}
                    onChange={(enabled) => setEditableAccess((prev) => ({ ...prev, shopAccess: { ...prev.shopAccess, coachShop: enabled } }))}
                  />
                </div>
              </div>
              <div>
                <h4 className="text-md font-semibold text-gray-800 mb-3 border-b pb-2">Formations</h4>
                <div className="space-y-4">
                  {coachFormations.length > 0 ? (
                    coachFormations.map((formation) => (
                      <SimpleToggle
                        key={formation.id}
                        label={formation.title}
                        enabled={(editableAccess.grantedFormationIds ?? []).includes(formation.id)}
                        onChange={() => handleFormationAccessToggle(formation.id)}
                      />
                    ))
                  ) : (
                    <p className="text-sm text-gray-500 text-center">
                      Vous n'avez créé aucune formation. <Link to="/app/formations" className="text-primary underline">En créer une</Link>.
                    </p>
                  )}
                </div>
              </div>
            </div>
            <div className="mt-6 flex justify-end gap-2">
              <Button type="button" onClick={handleSaveAccess}>Enregistrer les accès</Button>
            </div>
          </Accordion>
        </main>

        {/* --- RIGHT COLUMN --- */}
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
                <h3 className="font-bold text-lg">Objectif calorique</h3>
                {editableCalculatedData.surplusDeficit !== 0 && (
                  <span
                    className={`font-bold text-sm px-2 py-0.5 rounded-md ${
                      editableCalculatedData.surplusDeficit > 0 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                    }`}
                  >
                    {editableCalculatedData.surplusDeficit > 0 ? '+' : ''}
                    {editableCalculatedData.surplusDeficit} kcal ({editableCalculatedData.surplusDeficitPercent.toFixed(1)}%)
                  </span>
                )}
              </div>

              <div className="flex flex-col sm:flex-row justify-start items-center gap-4 sm:gap-6">
                <div className="relative w-32 h-32 flex-shrink-0">
                  <div className="w-full h-full rounded-full" style={gradientStyle} role="img" aria-label="Répartition des macronutriments"></div>
                  <div className="absolute inset-2 bg-white rounded-full flex items-center justify-center flex-col text-center">
                    <span className="text-xs text-gray-500">Objectif</span>
                    <span className="font-bold text-lg leading-tight">{editableCalculatedData.objectifCalorique}</span>
                    <span className="text-sm text-gray-600">kcal</span>
                  </div>
                </div>

                <div className="space-y-3 text-sm w-full max-w-sm">
                  {(['protein', 'carbs', 'fat'] as const).map((macro) => {
                    const delta = (editableMacros[macro] ?? 0) - (initialMacros[macro] ?? 0);
                    return (
                      <div key={macro} className="grid grid-cols-12 items-center gap-2">
                        <div className="col-span-4 flex items-center gap-2">
                          <span
                            className={`w-3 h-3 rounded-full ${
                              macro === 'protein' ? 'bg-[#ef4444]' : macro === 'carbs' ? 'bg-[#10b981]' : 'bg-[#facc15]'
                            } flex-shrink-0`}
                          ></span>
                          <label className="font-semibold text-gray-800">{macroLabels[macro]}</label>
                        </div>
                        <div className="col-span-2 text-left">
                          {Math.abs(delta) > 0 && (
                            <span className={`font-bold text-sm ${delta > 0 ? 'text-green-500' : 'text-red-500'}`}>
                              {`${delta > 0 ? '+' : ''}${delta.toFixed(0)}g`}
                            </span>
                          )}
                        </div>
                        <div className="col-span-6 flex items-center justify-end">
                          <button type="button" onClick={() => handleMacroAdjustment(macro, -1)} className="p-1 rounded-l-md bg-gray-200 hover:bg-gray-300 h-9">
                            <MinusIcon className="w-4 h-4" />
                          </button>
                          <div className="relative w-20">
                            <Input
                              type="number"
                              value={editableMacros[macro]}
                              onChange={(e) => handleMacroChange(macro, e.target.value)}
                              className="w-full text-center !p-1 h-9 !rounded-none"
                            />
                            <span className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none text-xs">g</span>
                          </div>
                          <button type="button" onClick={() => handleMacroAdjustment(macro, 1)} className="p-1 rounded-r-md bg-gray-200 hover:bg-gray-300 h-9">
                            <PlusIcon className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="mt-4 flex justify-end">
                <Button type="button" onClick={handleSaveMacros} disabled={!macrosHaveChanged}>
                  {macrosHaveChanged ? 'Valider' : 'Macros à jour'}
                </Button>
              </div>
              
              <div className="mt-6 flex justify-end">
                <Button type="button" onClick={() => setShowBilanAssignmentModal(true)} variant="secondary">
                  Assigner un Bilan
                </Button>
              </div>
            </Card>
          )}

          <Card className="p-4">
            <h3 className="font-bold text-lg mb-2">Suivi du Poids</h3>
            <SimpleLineChart data={client.nutrition?.weightHistory ?? []} color="#7A68FA" unit="kg" />
          </Card>
          
          <Card className="p-4">
            <h3 className="font-bold text-lg mb-2">Bilans Assignés</h3>
            <div className="space-y-2">
                {bilanAssignments.filter(a => a.clientId === client.id).map(assignment => (
                    <div key={assignment.id} className="p-2 border rounded-lg">
                        <p className="font-semibold">{assignment.templateName}</p>
                        <p className={`text-sm ${assignment.status === 'pending' ? 'text-yellow-600' : 'text-green-600'}`}>
                            Statut: {assignment.status === 'pending' ? 'En attente' : 'Complété'}
                        </p>
                        {assignment.recurrence && <p className="text-xs text-gray-500">Récurrence: {assignment.recurrence}</p>}
                        <p className="text-xs text-gray-500">Assigné le: {new Date(assignment.assignedAt).toLocaleDateString()}</p>
                        {assignment.completedAt && <p className="text-xs text-gray-500">Complété le: {new Date(assignment.completedAt).toLocaleDateString()}</p>}
                    </div>
                ))}
                {bilanAssignments.filter(a => a.clientId === client.id).length === 0 && (
                    <p className="text-sm text-gray-500">Aucun bilan assigné pour le moment.</p>
                )}
            </div>
          </Card>
        </aside>
      </div>

      {selectedProgram && (
        <Modal isOpen={isProgramModalOpen} onClose={closeProgramModal} title={`Détail du programme: ${selectedProgram.name}`} size="xl">
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
          <ProgramPerformanceDetail program={selectedHistoricalProgram.program} performanceLogs={selectedHistoricalProgram.logs} />
        </Modal>
      )}
      {selectedNutritionPlan && (
        <Modal isOpen={!!selectedNutritionPlan} onClose={() => setSelectedNutritionPlan(null)} title={`Plan alimentaire: ${selectedNutritionPlan.name}`} size="xl">
          <CoachNutritionPlanView plan={selectedNutritionPlan} />
        </Modal>
      )}

      {client && (
        <BilanAssignmentModal 
          isOpen={showBilanAssignmentModal} 
          onClose={() => setShowBilanAssignmentModal(false)} 
          client={client} 
        />
      )}
    </div>
  );
	      {selectedBilan && bilanTemplateForModal && (
	        <Modal isOpen={!!selectedBilan} onClose={() => setSelectedBilan(null)} title={selectedBilan.templateName} size="xl">
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
	    </div>
	  );
	};
	
	export default ClientProfile;