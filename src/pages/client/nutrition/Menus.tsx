import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext';
import { NutritionPlan } from '../../../types';
import Modal from '../../../components/Modal';
import ClientNutritionPlanView from '../../../components/client/ClientNutritionPlanView';
import { ArrowLeftIcon } from '../../../constants/icons';

const NutritionCard: React.FC<{ plan: NutritionPlan; onClick: () => void }> = ({
  plan,
  onClick,
}) => (
  <div
    className="bg-white dark:bg-client-card rounded-lg p-4 cursor-pointer hover:bg-gray-50 dark:hover:bg-primary/20 transition-colors border border-gray-400 dark:border-transparent"
    onClick={onClick}
  >
    <h3 className="font-bold text-lg text-gray-900 dark:text-client-light">{plan.name}</h3>
    <p className="text-sm text-gray-500 dark:text-client-subtle mt-1">{plan.objective}</p>
  </div>
);

const Menus: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [selectedPlan, setSelectedPlan] = useState<NutritionPlan | null>(null);
  const assignedPlans = user?.assignedNutritionPlans || [];

  const openModal = (plan: NutritionPlan) => setSelectedPlan(plan);
  const closeModal = () => setSelectedPlan(null);

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate(-1)}
          className="p-2 bg-white dark:bg-client-card rounded-full text-gray-800 dark:text-client-light hover:bg-gray-100 dark:hover:bg-primary/20 border border-gray-500 dark:border-gray-700"
          aria-label="Retour"
        >
          <ArrowLeftIcon className="w-5 h-5" />
        </button>
        <h2 className="text-xl font-bold text-gray-900 dark:text-client-light">
          Plans assignés par votre coach
        </h2>
      </div>

      {assignedPlans.length > 0 ? (
        assignedPlans.map((plan) => (
          <NutritionCard key={plan.id} plan={plan} onClick={() => openModal(plan)} />
        ))
      ) : (
        <div className="text-center py-10 bg-white dark:bg-client-card rounded-lg border border-gray-400 dark:border-transparent">
          <p className="text-gray-900 dark:text-client-light">Aucun plan alimentaire assigné.</p>
          <p className="text-gray-500 dark:text-client-subtle text-sm mt-1">
            Contactez votre coach pour recevoir votre plan nutritionnel.
          </p>
        </div>
      )}

      {selectedPlan && (
        <Modal
          isOpen={!!selectedPlan}
          onClose={closeModal}
          title="Détail du Plan Alimentaire"
          size="xl"
          theme="dark"
        >
          <ClientNutritionPlanView plan={selectedPlan} />
        </Modal>
      )}
    </div>
  );
};

export default Menus;
