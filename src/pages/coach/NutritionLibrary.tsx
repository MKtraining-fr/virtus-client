import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.tsx';
import { NutritionPlan, Meal, MealItem } from '../../types.ts';
import Card from '../../components/Card.tsx';
import Button from '../../components/Button.tsx';
import Modal from '../../components/Modal.tsx';
import Input from '../../components/Input.tsx';

const NutritionLibrary: React.FC = () => {
  const { user, clients, setClients, nutritionPlans, recipes, setRecipes } = useAuth();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState('plan-alimentaire');

  // Modal State for Assigning Plans
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [planToAssign, setPlanToAssign] = useState<NutritionPlan | null>(null);
  const [selectedClientsForAssign, setSelectedClientsForAssign] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState('');

  // Modal State for Viewing Recipes
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [selectedRecipe, setSelectedRecipe] = useState<Meal | null>(null);

  const myPlans = useMemo(() => {
    return nutritionPlans.filter((p) => p.coachId === user?.id);
  }, [nutritionPlans, user]);

  const myRecipes = useMemo(() => {
    return recipes.filter((r) => r.coachId === user?.id);
  }, [recipes, user]);

  const myClients = useMemo(() => {
    return clients.filter(
      (c) => c.role === 'client' && c.status === 'active' && c.coachId === user?.id
    );
  }, [clients, user]);

  const filteredClientsForModal = useMemo(() => {
    if (!searchTerm) return myClients;
    const lowercasedFilter = searchTerm.toLowerCase();
    return myClients.filter(
      (c) =>
        c.firstName.toLowerCase().includes(lowercasedFilter) ||
        c.lastName.toLowerCase().includes(lowercasedFilter)
    );
  }, [myClients, searchTerm]);

  const handleOpenAssignModal = (plan: NutritionPlan) => {
    setPlanToAssign(plan);
    setIsAssignModalOpen(true);
    setSelectedClientsForAssign([]);
    setSearchTerm('');
  };

  const handleViewRecipe = (recipe: Meal) => {
    setSelectedRecipe(recipe);
    setIsViewModalOpen(true);
  };

  const closeViewModal = () => {
    setIsViewModalOpen(false);
    setSelectedRecipe(null);
  };

  const handleToggleClientSelection = (clientId: string) => {
    setSelectedClientsForAssign((prev) =>
      prev.includes(clientId) ? prev.filter((id) => id !== clientId) : [...prev, clientId]
    );
  };

  const handleAssign = () => {
    if (!planToAssign || selectedClientsForAssign.length === 0) return;

    const updatedClients = clients.map((client) => {
      if (selectedClientsForAssign.includes(client.id)) {
        // Prepend the new plan to make it the current one
        const updatedPlans = [planToAssign, ...(client.assignedNutritionPlans || [])];
        return { ...client, assignedNutritionPlans: updatedPlans };
      }
      return client;
    });

    setClients(updatedClients);
    alert(`Plan "${planToAssign.name}" assigné à ${selectedClientsForAssign.length} client(s).`);
    setIsAssignModalOpen(false);
  };

  const calculateMacros = (items: MealItem[]) => {
    return items.reduce(
      (acc, item) => {
        if (!item.food) return acc;
        const ratio = item.quantity / 100;
        acc.calories += (item.food.calories || 0) * ratio;
        acc.protein += (item.food.protein || 0) * ratio;
        acc.carbs += (item.food.carbs || 0) * ratio;
        acc.fat += (item.food.fat || 0) * ratio;
        return acc;
      },
      { calories: 0, protein: 0, carbs: 0, fat: 0 }
    );
  };

  const handleDeleteRecipe = (recipeId: string) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer cette recette ?')) {
      setRecipes(recipes.filter((r) => r.id !== recipeId));
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-800">Bibliothèque de Nutrition</h1>
        <Button onClick={() => navigate('/app/nutrition/createur')}>Nouveau plan / recette</Button>
      </div>

      <div className="mb-6">
        <div className="border-b border-gray-400">
          <nav className="-mb-px flex space-x-8" aria-label="Tabs">
            <button
              onClick={() => setActiveTab('plan-alimentaire')}
              className={`${activeTab === 'plan-alimentaire' ? 'border-primary text-primary' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-500'} whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
            >
              Plan Alimentaire
            </button>
            <button
              onClick={() => setActiveTab('recette')}
              className={`${activeTab === 'recette' ? 'border-primary text-primary' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-500'} whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
            >
              Recette
            </button>
          </nav>
        </div>
      </div>

      {activeTab === 'plan-alimentaire' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {myPlans.length > 0 ? (
            myPlans.map((plan) => (
              <Card key={plan.id} className="flex flex-col">
                <div className="p-6 flex-grow">
                  <h3 className="text-lg font-semibold text-gray-900">{plan.name}</h3>
                  <p className="text-sm text-gray-500 mt-1">
                    {plan.weekCount} semaine(s) · {plan.daysByWeek[1]?.length || 0} jours/semaine
                  </p>
                </div>
                <div className="bg-gray-50 p-4 flex justify-end space-x-2">
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => navigate(`/app/nutrition/createur?editPlanId=${plan.id}`)}
                  >
                    Modifier
                  </Button>
                  <Button size="sm" onClick={() => handleOpenAssignModal(plan)}>
                    Assigner
                  </Button>
                </div>
              </Card>
            ))
          ) : (
            <p className="text-gray-500 col-span-full text-center py-10">
              Aucun plan alimentaire enregistré pour le moment.
            </p>
          )}
        </div>
      )}

      {activeTab === 'recette' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {myRecipes.length > 0 ? (
            myRecipes.map((recipe) => {
              const macros = calculateMacros(recipe.items);
              return (
                <Card key={recipe.id} className="flex flex-col">
                  <div
                    className="p-6 flex-grow cursor-pointer"
                    onClick={() => handleViewRecipe(recipe)}
                  >
                    <h3 className="text-lg font-semibold text-gray-900">{recipe.name}</h3>
                    <p className="text-sm text-gray-500 mt-1">
                      {Math.round(macros.calories)} kcal | P:{Math.round(macros.protein)}g G:
                      {Math.round(macros.carbs)}g L:{Math.round(macros.fat)}g
                    </p>
                  </div>
                  <div className="bg-gray-50 p-4 flex justify-end space-x-2">
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/app/nutrition/createur?editRecipeId=${recipe.id}`);
                      }}
                    >
                      Modifier
                    </Button>
                    <Button
                      variant="danger"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteRecipe(recipe.id);
                      }}
                    >
                      Supprimer
                    </Button>
                  </div>
                </Card>
              );
            })
          ) : (
            <p className="text-gray-500 col-span-full text-center py-10">
              Aucune recette enregistrée pour le moment.
            </p>
          )}
        </div>
      )}

      {isAssignModalOpen && planToAssign && (
        <Modal
          isOpen={isAssignModalOpen}
          onClose={() => setIsAssignModalOpen(false)}
          title={`Assigner "${planToAssign.name}"`}
        >
          <div className="space-y-4">
            <Input
              type="text"
              placeholder="Rechercher un client..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <div className="max-h-60 overflow-y-auto border border-gray-400 rounded-lg">
              {filteredClientsForModal.length > 0 ? (
                filteredClientsForModal.map((client) => (
                  <label
                    key={client.id}
                    className="flex items-center p-3 hover:bg-gray-50 cursor-pointer border-b last:border-b-0"
                  >
                    <input
                      type="checkbox"
                      className="h-4 w-4 rounded text-primary focus:ring-primary"
                      checked={selectedClientsForAssign.includes(client.id)}
                      onChange={() => handleToggleClientSelection(client.id)}
                    />
                    <span className="ml-3 text-sm font-medium">
                      {client.firstName} {client.lastName}
                    </span>
                  </label>
                ))
              ) : (
                <p className="text-center text-gray-500 p-4">Aucun client trouvé.</p>
              )}
            </div>
            <div className="flex justify-end space-x-2 pt-4">
              <Button variant="secondary" onClick={() => setIsAssignModalOpen(false)}>
                Annuler
              </Button>
              <Button onClick={handleAssign} disabled={selectedClientsForAssign.length === 0}>
                Assigner
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {isViewModalOpen && selectedRecipe && (
        <Modal isOpen={isViewModalOpen} onClose={closeViewModal} title={selectedRecipe.name}>
          <div className="space-y-4">
            <div>
              <h4 className="font-semibold text-lg mb-2 text-primary">Ingrédients</h4>
              <ul className="list-disc list-inside space-y-1">
                {selectedRecipe.items.map((item) => (
                  <li key={item.id}>
                    {item.food.name} - {item.quantity}
                    {item.unit}
                  </li>
                ))}
              </ul>
            </div>

            {selectedRecipe.steps &&
              selectedRecipe.steps.length > 0 &&
              selectedRecipe.steps.some((s) => s && s.trim() !== '') && (
                <div>
                  <h4 className="font-semibold text-lg mb-2 text-primary">Préparation</h4>
                  <ol className="list-decimal list-inside space-y-2">
                    {selectedRecipe.steps.map(
                      (step, index) => step && step.trim() !== '' && <li key={index}>{step}</li>
                    )}
                  </ol>
                </div>
              )}

            <div>
              <h4 className="font-semibold text-lg mb-2 text-primary">Macros Totales</h4>
              <div className="p-3 bg-gray-100 rounded-lg text-center">
                <p className="text-sm text-gray-600">
                  <span className="font-bold">
                    {Math.round(calculateMacros(selectedRecipe.items).calories)} kcal
                  </span>{' '}
                  | P:{' '}
                  <span className="font-medium">
                    {Math.round(calculateMacros(selectedRecipe.items).protein)}g
                  </span>{' '}
                  | G:{' '}
                  <span className="font-medium">
                    {Math.round(calculateMacros(selectedRecipe.items).carbs)}g
                  </span>{' '}
                  | L:{' '}
                  <span className="font-medium">
                    {Math.round(calculateMacros(selectedRecipe.items).fat)}g
                  </span>
                </p>
              </div>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default NutritionLibrary;
