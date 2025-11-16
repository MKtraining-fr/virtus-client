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

/* ------------------------- MAIN COMPONENT ------------------------- */
const ClientProfile: React.FC = () => {
  const { id: clientId } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, clients, programs, bilanTemplates } = useAuth();
  const [showBilanAssignmentModal, setShowBilanAssignmentModal] = useState(false);
  const [selectedProgram, setSelectedProgram] = useState<WorkoutProgram | null>(null);
  const [selectedNutritionPlan, setSelectedNutritionPlan] = useState<NutritionPlan | null>(null);
  const [selectedBilan, setSelectedBilan] = useState<BilanResult | null>(null);

  const client = useMemo(() => clients.find((c) => c.id === clientId), [clients, clientId]);

  const bilanTemplateForModal = useMemo(() => {
    if (!selectedBilan) return null;
    return bilanTemplates.find((t) => t.id === selectedBilan.templateId);
  }, [selectedBilan, bilanTemplates]);

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  if (!client) {
    return <div className="text-center py-8">Client non trouvé.</div>;
  }

  const isCoach = user.role === 'coach';

  const programHistory = client.programHistory || [];
  const measurementHistory = client.measurements || [];
  const nutritionLogs = client.nutrition?.foodJournal
    ? Object.values(client.nutrition.foodJournal).flat()
    : [];
  const bilans = client.bilans || [];

  return (
    <div className="max-w-7xl mx-auto p-4 sm:px-6 lg:px-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-extrabold text-gray-900">
          {client.firstName} {client.lastName}
        </h1>
        {isCoach && (
          <Button onClick={() => setShowBilanAssignmentModal(true)} variant="primary">
            Assigner un Bilan
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <Card className="lg:col-span-1">
          <h3 className="text-xl font-semibold mb-4">Informations Client</h3>
          <div className="space-y-3">
            <InfoItem label="Email" value={client.email} />
            <InfoItem label="Rôle" value={client.role} />
            <InfoItem label="Date de naissance" value={client.birthDate} />
            <InfoItem label="Objectif" value={client.goal} />
          </div>
        </Card>

        <Card className="lg:col-span-2">
          <h3 className="text-xl font-semibold mb-4">Statistiques de Performance</h3>
          <div className="h-64">
            <SimpleLineChart
              data={programHistory.map((p) => ({
                date: p.startDate,
                value: p.performanceScore || 0,
              }))}
            />
          </div>
        </Card>
      </div>

      {/* Mesures */}
      <Accordion title="Historique des Mesures" defaultOpen={false}>
        {measurementHistory.length > 0 ? (
          <div className="h-96">
            <MeasurementsLineChart data={measurementHistory} />
          </div>
        ) : (
          <p className="text-gray-500">Aucune mesure enregistrée.</p>
        )}
      </Accordion>

      {/* Programmes */}
      <Accordion title="Programmes Assignés" defaultOpen={true}>
        {programHistory.length > 0 ? (
          <div className="space-y-4">
            {programHistory.map((program) => (
              <Card key={program.id} className="p-4 flex justify-between items-center">
                <div>
                  <h4 className="font-semibold text-lg">{program.name}</h4>
                  <p className="text-sm text-gray-500">
                    Du {program.startDate} au {program.endDate}
                  </p>
                </div>
                <Button onClick={() => setSelectedProgram(program)} variant="secondary" size="sm">
                  Voir Détails
                </Button>
              </Card>
            ))}
          </div>
        ) : (
          <p className="text-gray-500">Aucun programme assigné.</p>
        )}
      </Accordion>

      {/* Bilans */}
      <Accordion title="Historique des Bilans" defaultOpen={true}>
        {bilans.length > 0 ? (
          <div className="space-y-4">
            {bilans.map((bilan) => (
              <Card key={bilan.id} className="p-4 flex justify-between items-center">
                <div>
                  <h4 className="font-semibold text-lg">{bilan.templateName}</h4>
                  <p className="text-sm text-gray-500">Complété le {bilan.completionDate}</p>
                </div>
                <Button onClick={() => setSelectedBilan(bilan)} variant="secondary" size="sm">
                  Voir Bilan
                </Button>
              </Card>
            ))}
          </div>
        ) : (
          <p className="text-gray-500">Aucun bilan complété.</p>
        )}
      </Accordion>

      {/* Nutrition */}
      <Accordion title="Journal Alimentaire" defaultOpen={false}>
        <CoachFoodJournalView client={client} />
      </Accordion>

      {/* Modals */}
      {selectedProgram && (
        <Modal
          isOpen={!!selectedProgram}
          onClose={() => setSelectedProgram(null)}
          title={selectedProgram.name}
          size="xl"
        >
          <ProgramDetailView program={selectedProgram} />
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
              // Exclure la section civilité pour le bilan système par défaut
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
