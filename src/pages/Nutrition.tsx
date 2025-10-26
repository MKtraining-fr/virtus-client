import React, { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.tsx';
import { NutritionPlan, NutritionDay, Meal, MealItem, FoodItem } from '../types.ts';
import Card from '../components/Card.tsx';
import Input from '../components/Input.tsx';
import Select from '../components/Select.tsx';
import Button from '../components/Button.tsx';
import FoodFilterSidebar from '../components/FoodFilterSidebar.tsx';
import CircularProgress from '../components/CircularProgress.tsx';
import Accordion from '../components/Accordion.tsx';
import ToggleSwitch from '../components/ToggleSwitch.tsx';

const ChevronDoubleRightIcon = (props: React.SVGProps<SVGSVGElement>) => ( <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}> <path strokeLinecap="round" strokeLinejoin="round" d="m5.25 4.5 7.5 7.5-7.5 7.5m6-15 7.5 7.5-7.5 7.5" /> </svg> );
const TrashIcon = (props: React.SVGProps<SVGSVGElement>) => ( <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}> <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.134-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.067-2.09 1.02-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" /> </svg> );
const PlusIcon = (props: React.SVGProps<SVGSVGElement>) => ( <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}> <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" /> </svg> );
const XMarkIcon = (props: React.SVGProps<SVGSVGElement>) => ( <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" /></svg>);
const DocumentDuplicateIcon = (props: React.SVGProps<SVGSVGElement>) => ( <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}> <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 17.25v3.375c0 .621-.504 1.125-1.125 1.125h-9.75a1.125 1.125 0 0 1-1.125-1.125V7.875c0-.621.504-1.125 1.125-1.125H6.75a9.06 9.06 0 0 1 1.5 .124m7.5 10.376h3.375c.621 0 1.125-.504 1.125-1.125V11.25c0-4.46-3.243-8.161-7.5-8.876a9.06 9.06 0 0 0-1.5-.124H9.375c-.621 0-1.125.504-1.125 1.125v3.5m7.5 10.375v-3.375c0-.621-.504-1.125-1.125-1.125H12.75" /> </svg> );

const MEAL_STRUCTURE: { id: string; name: string }[] = [ { id: 'breakfast', name: 'Petit-déjeuner' }, { id: 'snack1', name: 'Collation 1' }, { id: 'lunch', name: 'Déjeuner' }, { id: 'snack2', name: 'Collation 2' }, { id: 'dinner', name: 'Dîner' }, { id: 'snack3', name: 'Collation 3' }, ];
const initialDay: NutritionDay = { id: 1, name: "Jour 1", meals: [] };
const InfoItem: React.FC<{ label: string; value?: string | number; unit: string; colorClass?: string; }> = ({ label, value, unit, colorClass = 'text-primary' }) => ( <div> <p className="text-sm text-gray-500">{label}</p> <p className={`font-bold text-xl ${colorClass}`}>{value} <span className="text-base font-normal">{unit}</span></p> </div> );

const deepCopyNutritionDays = (days: NutritionDay[]): NutritionDay[] => {
    return days.map(day => ({
        ...day,
        meals: day.meals.map(meal => ({
            ...meal,
            items: meal.items.map(item => ({
                ...item,
                food: { ...item.food }
            }))
        }))
    }));
};

const Nutrition: React.FC = () => {
    const { user, clients, nutritionPlans, setNutritionPlans, addNutritionPlan, updateNutritionPlan, setClients, foodItems, recipes, setRecipes, meals } = useAuth();
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    
    const [creationMode, setCreationMode] = useState<'plan' | 'recipe'>('plan');
    const [isEditMode, setIsEditMode] = useState(false);
    const [editPlanId, setEditPlanId] = useState<string | null>(null);
    const [editRecipeId, setEditRecipeId] = useState<string | null>(null);

    const [isFilterSidebarVisible, setIsFilterSidebarVisible] = useState(true);
    const [draggedOverMealId, setDraggedOverMealId] = useState<string | null>(null);
    const [macroDisplayUnit, setMacroDisplayUnit] = useState<'g' | '%'>('g');
    const [openAccordion, setOpenAccordion] = useState<string | null>(null);
    const [isAddMealMenuOpen, setIsAddMealMenuOpen] = useState(false);
    const addMealMenuRef = useRef<HTMLDivElement>(null);
    const [isWeek1LockActive, setIsWeek1LockActive] = useState(false);

    // Plan state
    const [dayDisplayMode, setDayDisplayMode] = useState<'single' | 'multi'>('single');
    const [selectedDayIndex, setSelectedDayIndex] = useState(0);
    const [selectedWeek, setSelectedWeek] = useState(1);
    const [plan, setPlan] = useState<NutritionPlan>({
        id: `plan-${Date.now()}`, name: 'Nouveau plan', objective: 'Perte de poids',
        weekCount: 1, daysByWeek: { 1: deepCopyNutritionDays([initialDay]) },
        coachId: user?.id,
    });
    const [selectedClientId, setSelectedClientId] = useState('0');

    // Recipe state
    const [recipe, setRecipe] = useState<Meal>({ id: `recipe-${Date.now()}`, name: 'Nouvelle recette', items: [], steps: [''] });
    const [draggedOverRecipe, setDraggedOverRecipe] = useState(false);


     useEffect(() => {
        const planIdToEdit = searchParams.get('editPlanId');
        const recipeIdToEdit = searchParams.get('editRecipeId');

        if (planIdToEdit) {
            const planToEdit = nutritionPlans.find(p => p.id === planIdToEdit);
            if (planToEdit) {
                setPlan(JSON.parse(JSON.stringify(planToEdit)));
                setSelectedClientId(planToEdit.clientId || '0');
                setIsEditMode(true);
                setEditPlanId(planIdToEdit);
                setCreationMode('plan');
            } else {
                alert("Plan alimentaire non trouvé.");
                navigate('/app/nutrition/bibliotheque');
            }
        } else if (recipeIdToEdit) {
            const recipeToEdit = recipes.find(r => r.id === recipeIdToEdit);
            if (recipeToEdit) {
                setRecipe(JSON.parse(JSON.stringify(recipeToEdit)));
                setIsEditMode(true);
                setEditRecipeId(recipeIdToEdit);
                setCreationMode('recipe');
            } else {
                alert("Recette non trouvée.");
                navigate('/app/nutrition/bibliotheque');
            }
        }
    }, [searchParams, nutritionPlans, recipes, navigate]);

    const isWeek1Empty = useMemo(() => {
        const week1Days = plan.daysByWeek[1];
        if (!week1Days || week1Days.length === 0) return true;
        return !week1Days.some(day => day.meals.some(meal => meal.items.length > 0));
    }, [plan.daysByWeek]);

    useEffect(() => {
        setIsWeek1LockActive(!isEditMode && creationMode === 'plan' && selectedWeek !== 1 && isWeek1Empty);
    }, [isEditMode, creationMode, selectedWeek, isWeek1Empty]);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => { if (addMealMenuRef.current && !addMealMenuRef.current.contains(event.target as Node)) { setIsAddMealMenuOpen(false); } };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    useEffect(() => {
        if (creationMode !== 'plan') return;
        setPlan(prevPlan => {
            const newWeekCount = prevPlan.weekCount;
            const newDaysByWeek = { ...prevPlan.daysByWeek };
            const templateDays = prevPlan.daysByWeek[1] || deepCopyNutritionDays([initialDay]);
    
            for (let i = 1; i <= newWeekCount; i++) {
                if (!newDaysByWeek[i]) newDaysByWeek[i] = deepCopyNutritionDays(templateDays);
            }
            for (const weekNum of Object.keys(newDaysByWeek).map(Number)) {
                if (weekNum > newWeekCount) delete newDaysByWeek[weekNum];
            }
            return { ...prevPlan, daysByWeek: newDaysByWeek };
        });
    
        if (selectedWeek > plan.weekCount) {
            setSelectedWeek(plan.weekCount > 0 ? plan.weekCount : 1);
        }
    }, [plan.weekCount, creationMode]);

    useEffect(() => {
        if (creationMode !== 'plan' || plan.daysByWeek[selectedWeek]) return;
        setPlan(prevPlan => {
            const newDaysByWeek = { ...prevPlan.daysByWeek };
            const templateDays = prevPlan.daysByWeek[1] || deepCopyNutritionDays([initialDay]);
            newDaysByWeek[selectedWeek] = deepCopyNutritionDays(templateDays);
            return { ...prevPlan, daysByWeek: newDaysByWeek };
        });
    }, [selectedWeek, plan.daysByWeek, creationMode]);

    const handleWeekCountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = e.target.value;
        const num = parseInt(val, 10);
        if (val === '') { setPlan(p => ({ ...p, weekCount: 1 })); return; }
        if (!isNaN(num) && num >= 1) { setPlan(p => ({ ...p, weekCount: Math.min(num, 52) })); }
    };
    
    const clientOptions = useMemo(() => {
        const myClients = clients.filter(c => c.role === 'client' && c.status === 'active' && (user?.role === 'admin' || c.coachId === user?.id));
        return [{ id: '0', name: 'Aucun client' }, ...myClients.map(c => ({ id: c.id, name: `${c.firstName} ${c.lastName}` }))];
    }, [clients, user]);

    const foodAndRecipeDb = useMemo(() => {
        const mealsForSidebar = meals.map(m => ({ ...m, type: 'Repas' as const }));
        const recipesForSidebar = recipes.map(r => ({ ...r, type: 'Recette' as const }));
        return [...mealsForSidebar, ...recipesForSidebar, ...foodItems];
    }, [foodItems, meals, recipes]);


    const selectedClient = useMemo(() => {
        if (selectedClientId === '0') return null;
        return clients.find(c => c.id === selectedClientId);
    }, [selectedClientId, clients]);

    const clientNutritionData = useMemo(() => {
        if (!selectedClient) return null;
        const { macros } = selectedClient.nutrition;
        if (!macros || (macros.protein === 0 && macros.carbs === 0 && macros.fat === 0)) return null;
        const calorieObjective = (macros.protein * 4) + (macros.carbs * 4) + (macros.fat * 9);
        return { calorieObjective: Math.round(calorieObjective), macros };
    }, [selectedClient]);

    const activeDaysInWeek = plan.daysByWeek[selectedWeek] || [];
    const activeDay = activeDaysInWeek[selectedDayIndex];
    
    const calculateTotals = (items: MealItem[]) => {
        const dailyTotals = items.reduce((acc, item) => {
            const ratio = item.quantity / 100;
            acc.calories += item.food.calories * ratio;
            acc.protein += item.food.protein * ratio;
            acc.carbs += item.food.carbs * ratio;
            acc.fat += item.food.fat * ratio;
            return acc;
        }, { calories: 0, protein: 0, carbs: 0, fat: 0 });

        const proteinKcal = dailyTotals.protein * 4;
        const carbsKcal = dailyTotals.carbs * 4;
        const fatKcal = dailyTotals.fat * 9;
        const totalCalculatedKcal = proteinKcal + carbsKcal + fatKcal;

        const pPercent = totalCalculatedKcal > 0 ? Math.round((proteinKcal / totalCalculatedKcal) * 100) : 0;
        const cPercent = totalCalculatedKcal > 0 ? Math.round((carbsKcal / totalCalculatedKcal) * 100) : 0;
        const fPercent = totalCalculatedKcal > 0 ? Math.round((fatKcal / totalCalculatedKcal) * 100) : 0;
        
        return { totals: dailyTotals, proteinPercent: pPercent, carbsPercent: cPercent, fatPercent: fPercent };
    }

    const planDayTotals = useMemo(() => {
        if (!activeDay) return { totals: { calories: 0, protein: 0, carbs: 0, fat: 0 }, proteinPercent: 0, carbsPercent: 0, fatPercent: 0 };
        const allItems = activeDay.meals.flatMap(m => m.items);
        return calculateTotals(allItems);
    }, [activeDay]);

    const recipeTotals = useMemo(() => calculateTotals(recipe.items), [recipe.items]);

    const calorieGoal = clientNutritionData?.calorieObjective || 2000;
    
    // Handlers
    const handleClientChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const clientId = e.target.value;
        setSelectedClientId(clientId);
        setPlan(p => ({ ...p, clientId: clientId === '0' ? undefined : clientId }));
    };
    
    const updateContentState = useCallback((updateFn: (days: NutritionDay[]) => NutritionDay[]) => {
        setPlan(prevPlan => {
            const newPlan = { ...prevPlan, daysByWeek: { ...prevPlan.daysByWeek } };
            if (selectedWeek === 1) {
                const originalWeek1Days = prevPlan.daysByWeek[1] || [];
                const updatedWeek1Days = updateFn(originalWeek1Days);
                for (const weekNumStr of Object.keys(newPlan.daysByWeek)) {
                    const weekNum = Number(weekNumStr);
                    if (weekNum === 1 || JSON.stringify(prevPlan.daysByWeek[weekNum]) === JSON.stringify(originalWeek1Days)) {
                        newPlan.daysByWeek[weekNum] = deepCopyNutritionDays(updatedWeek1Days);
                    }
                }
            } else {
                newPlan.daysByWeek[selectedWeek] = updateFn(newPlan.daysByWeek[selectedWeek] || []);
            }
            return newPlan;
        });
    }, [selectedWeek]);

    const updateAllWeeksInPlan = useCallback((updateFn: (days: NutritionDay[]) => NutritionDay[]) => {
        setPlan(prevPlan => {
            const newDaysByWeek = { ...prevPlan.daysByWeek };
            for (const weekNumStr of Object.keys(newDaysByWeek)) {
                newDaysByWeek[Number(weekNumStr)] = updateFn(newDaysByWeek[Number(weekNumStr)] || []);
            }
            return { ...prevPlan, daysByWeek: newDaysByWeek };
        });
    }, []);

    const handleDrop = (e: React.DragEvent<HTMLElement>, mealId?: string) => {
        e.preventDefault();
        setDraggedOverMealId(null);
        setDraggedOverRecipe(false);
        try {
            const transferData = JSON.parse(e.dataTransfer.getData('text/plain'));
            const { type, data } = transferData;
            
            const newItems: MealItem[] = (type === 'food')
                ? [{ id: `item-${Date.now()}`, food: data as FoodItem, quantity: 100, unit: 'g' }]
                : (data as Meal).items.map((item, index) => ({
                    ...item,
                    id: `item-${Date.now()}-${index}`,
                }));

            if (creationMode === 'recipe') {
                setRecipe(prev => ({ ...prev, items: [...prev.items, ...newItems] }));
            } else if (mealId && activeDay) {
                updateContentState(days => days.map(day => day.id === activeDay.id ? { ...day, meals: day.meals.map(meal => meal.id === mealId ? { ...meal, items: [...meal.items, ...newItems] } : meal) } : day));
            }
        } catch (err) { console.error("Failed to parse dropped food data", err); }
    };

    const handleItemUpdate = (itemId: string, field: 'quantity' | 'unit', value: string, mealId?: string) => {
        if (creationMode === 'recipe') {
            setRecipe(prev => ({ ...prev, items: prev.items.map(item => item.id === itemId ? { ...item, [field]: field === 'quantity' ? (parseInt(value, 10) || 0) : value } : item) }));
        } else if (mealId && activeDay) {
            updateContentState(days => days.map(day => day.id === activeDay.id ? { ...day, meals: day.meals.map(meal => meal.id === mealId ? { ...meal, items: meal.items.map(item => item.id === itemId ? { ...item, [field]: field === 'quantity' ? (parseInt(value, 10) || 0) : value } : item) } : meal) } : day));
        }
    };

    const handleItemDelete = (itemId: string, mealId?: string) => {
        if (creationMode === 'recipe') {
            setRecipe(prev => ({ ...prev, items: prev.items.filter(item => item.id !== itemId) }));
        } else if (mealId && activeDay) {
            updateContentState(days => days.map(day => day.id === activeDay.id ? { ...day, meals: day.meals.map(meal => meal.id === mealId ? { ...meal, items: meal.items.filter(item => item.id !== itemId) } : meal) } : day));
        }
    };
    
    // Handlers for recipe steps
    const handleStepChange = (index: number, value: string) => {
        setRecipe(prev => {
            const newSteps = [...(prev.steps || [])];
            newSteps[index] = value;
            return { ...prev, steps: newSteps };
        });
    };

    const addStep = () => {
        setRecipe(prev => ({
            ...prev,
            steps: [...(prev.steps || []), '']
        }));
    };

    const removeStep = (index: number) => {
        setRecipe(prev => ({
            ...prev,
            steps: (prev.steps || []).filter((_, i) => i !== index)
        }));
    };

    // ... plan-specific handlers (add day, copy day, etc.)
    const handleMealDelete = (mealId: string) => { if (window.confirm("Supprimer cette section repas ?")) { updateContentState(days => days.map(day => day.id === activeDay.id ? { ...day, meals: day.meals.filter(meal => meal.id !== mealId) } : day)); } };
    const availableMealsToAdd = useMemo(() => activeDay ? MEAL_STRUCTURE.filter(mt => !activeDay.meals.some(m => m.id === mt.id)) : [], [activeDay]);
    const handleAddMeal = (mealTemplate: { id: string; name: string }) => { updateContentState(days => days.map(day => day.id === activeDay.id ? { ...day, meals: [...day.meals, { ...mealTemplate, items: [] }] } : day)); setIsAddMealMenuOpen(false); };
    const handleAddDay = () => { const newId = Math.max(0, ...Object.values(plan.daysByWeek).flat().map((d: NutritionDay) => d.id)) + 1; updateAllWeeksInPlan(days => [...days, { id: newId, name: `Jour ${days.length + 1}`, meals: [] }]); setSelectedDayIndex(activeDaysInWeek.length); };
    const handleCopyDayToNext = () => { if (dayDisplayMode !== 'multi' || !activeDay) return; const nextDayIndex = selectedDayIndex + 1; setPlan(prevPlan => { const newPlan = { ...prevPlan, daysByWeek: { ...prevPlan.daysByWeek } }; const dayToCopySource = newPlan.daysByWeek[selectedWeek]?.[selectedDayIndex]; if (!dayToCopySource) return prevPlan; const copiedMeals: Meal[] = dayToCopySource.meals.map(meal => ({ ...meal, items: meal.items.map(item => ({ ...item, food: { ...item.food } })) })); const isCreatingNewDay = nextDayIndex >= (newPlan.daysByWeek[selectedWeek]?.length || 0); let newDayId = isCreatingNewDay ? Math.max(0, ...Object.values(newPlan.daysByWeek).flat().map((d: NutritionDay) => d.id)) + 1 : null; for (const weekNumStr of Object.keys(newPlan.daysByWeek)) { const weekNum = Number(weekNumStr); const currentWeekDays = newPlan.daysByWeek[weekNum] || []; const newDaysForWeek = [...currentWeekDays]; if (isCreatingNewDay) { newDaysForWeek.push({ id: newDayId!, name: `Jour ${newDaysForWeek.length + 1}`, meals: copiedMeals }); } else { newDaysForWeek[nextDayIndex] = { ...newDaysForWeek[nextDayIndex], meals: copiedMeals }; } newPlan.daysByWeek[weekNum] = newDaysForWeek; } setSelectedDayIndex(nextDayIndex); return newPlan; }); };
    const handleRemoveDay = (indexToRemove: number) => { if (activeDaysInWeek.length <= 1) { alert("Vous ne pouvez pas supprimer le dernier jour."); return; } if (window.confirm(`Supprimer le ${activeDaysInWeek[indexToRemove].name} de toutes les semaines ?`)) { updateAllWeeksInPlan(days => days.filter((_, index) => index !== indexToRemove).map((day, index) => ({ ...day, name: `Jour ${index + 1}` }))); setSelectedDayIndex(prev => Math.min(prev, activeDaysInWeek.length - 2)); } };


    const handleSave = async () => {
        if (creationMode === 'recipe') {
            if (!recipe.name.trim()) return alert("Le nom de la recette est requis.");
            
            if (isEditMode && editRecipeId) {
                const updatedRecipe = { ...recipe, coachId: user?.id };
                setRecipes(recipes.map(r => r.id === editRecipeId ? updatedRecipe : r));
                alert('Recette mise à jour !');
            } else {
                const finalRecipe = { ...recipe, id: `recipe-${Date.now()}`, coachId: user?.id };
                setRecipes([...recipes, finalRecipe]);
                alert('Recette enregistrée !');
            }
            navigate('/app/nutrition/bibliotheque');
        } else { // Plan creation/editing
            const finalPlanData = { 
                ...plan, 
                clientId: selectedClientId === '0' ? undefined : selectedClientId 
            };
            
            try {
                if (isEditMode && editPlanId) {
                    // Update plan in Supabase
                    const updatedPlan = await updateNutritionPlan(editPlanId, finalPlanData);
                    
                    // Update client assignments
                    const updatedClients = clients.map(client => {
                        const newAssignedPlans = [...(client.assignedNutritionPlans || [])];
                        const planIndex = newAssignedPlans.findIndex(p => p.id === editPlanId);
                        
                        const wasAssigned = planIndex !== -1;
                        const shouldBeAssigned = client.id === updatedPlan.clientId;

                        if (wasAssigned && !shouldBeAssigned) {
                            newAssignedPlans.splice(planIndex, 1);
                        } else if (!wasAssigned && shouldBeAssigned) {
                            newAssignedPlans.push(updatedPlan);
                        } else if (wasAssigned && shouldBeAssigned) {
                            newAssignedPlans[planIndex] = updatedPlan;
                        }

                        return { ...client, assignedNutritionPlans: newAssignedPlans };
                    });
                    setClients(updatedClients);
                    
                    let alertMessage = `Plan "${updatedPlan.name}" mis à jour.`;
                    if (updatedPlan.clientId) {
                        const client = clients.find(c => c.id === updatedPlan.clientId);
                        alertMessage += ` Il est maintenant assigné à ${client?.firstName} ${client?.lastName}.`;
                    }
                    alert(alertMessage);
                } else { // Add new plan
                    const newPlan = await addNutritionPlan({
                        name: finalPlanData.name,
                        objective: finalPlanData.objective,
                        weekCount: finalPlanData.weekCount,
                        daysByWeek: finalPlanData.daysByWeek,
                        clientId: finalPlanData.clientId,
                        notes: finalPlanData.notes,
                    });

                    if (newPlan.clientId) {
                        const client = clients.find(c => c.id === newPlan.clientId);
                        setClients(clients.map(c => 
                            c.id === newPlan.clientId 
                                ? { ...c, assignedNutritionPlans: [...(c.assignedNutritionPlans || []), newPlan] } 
                                : c
                        ));
                        alert(`Plan "${newPlan.name}" enregistré et assigné à ${client?.firstName} ${client?.lastName}.`);
                    } else {
                        alert(`Plan "${newPlan.name}" enregistré dans la bibliothèque.`);
                    }
                }
                navigate('/app/nutrition/bibliotheque');
            } catch (error) {
                console.error('Erreur lors de la sauvegarde du plan nutritionnel:', error);
                alert('Erreur lors de la sauvegarde du plan. Veuillez réessayer.');
            }
        }
    };
    
    // UI Components
    const renderMacros = (totalsData: { calories: number; protein: number; carbs: number; fat: number }) => (
        <Card className="p-4 bg-gray-50 border mb-6"> 
            <div className="flex justify-between items-center mb-4">
                <h2 className="font-bold text-lg">MACRO-NUTRIMENTS</h2>
                <button onClick={() => setMacroDisplayUnit(prev => prev === 'g' ? '%' : 'g')} className="text-xs font-semibold bg-gray-200 text-gray-700 px-3 py-1 rounded-full hover:bg-gray-300">Afficher en {macroDisplayUnit === 'g' ? '%' : 'g'}</button>
            </div>
            <div className={`flex items-center flex-wrap ${isFilterSidebarVisible ? 'justify-start gap-x-12 gap-y-4' : 'justify-around'}`}>
                <CircularProgress size={120} strokeWidth={10} percentage={(totalsData.totals.calories / calorieGoal) * 100} color="#7A68FA" surplusColor="#5a4fbf"><span className="text-2xl font-bold">{Math.round(totalsData.totals.calories)}</span><span className="text-sm text-gray-600">kcal</span></CircularProgress>
                <div className="flex gap-4">
                    <CircularProgress size={80} strokeWidth={8} percentage={(totalsData.totals.protein / (clientNutritionData?.macros.protein || 150)) * 100} color="#ef4444" surplusColor="#b91c1c"><span className="font-bold">{macroDisplayUnit === 'g' ? `${Math.round(totalsData.totals.protein)}g` : `${totalsData.proteinPercent}%`}</span><span className="text-xs text-gray-500">Protéines</span></CircularProgress>
                    <CircularProgress size={80} strokeWidth={8} percentage={(totalsData.totals.carbs / (clientNutritionData?.macros.carbs || 200)) * 100} color="#10b981" surplusColor="#065f46"><span className="font-bold">{macroDisplayUnit === 'g' ? `${Math.round(totalsData.totals.carbs)}g` : `${totalsData.carbsPercent}%`}</span><span className="text-xs text-gray-500">Glucides</span></CircularProgress>
                    <CircularProgress size={80} strokeWidth={8} percentage={(totalsData.totals.fat / (clientNutritionData?.macros.fat || 60)) * 100} color="#facc15" surplusColor="#ca8a04"><span className="font-bold">{macroDisplayUnit === 'g' ? `${Math.round(totalsData.totals.fat)}g` : `${totalsData.fatPercent}%`}</span><span className="text-xs text-gray-500">Lipides</span></CircularProgress>
                </div>
            </div>
        </Card>
    );

    const renderItems = (items: MealItem[], mealId?: string) => (
        <div className="space-y-2">
            {items.map(item => {
                const ratio = item.quantity / 100;
                return (
                    <div key={item.id} className="flex items-center gap-3 p-2 bg-white rounded-md border">
                        <span className="font-semibold flex-1 truncate">{item.food.name}</span>
                        <div className="flex items-center flex-shrink-0">
                            <Input type="number" value={item.quantity || ''} onChange={e => handleItemUpdate(item.id, 'quantity', e.target.value, mealId)} className="w-20 text-center rounded-r-none" />
                            <select value={item.unit} onChange={e => handleItemUpdate(item.id, 'unit', e.target.value, mealId)} className="bg-gray-100 border border-l-0 border-gray-300 rounded-r-lg px-2 h-[42px] text-sm focus:outline-none focus:ring-1 focus:ring-primary"><option value="g">g</option><option value="ml">ml</option></select>
                        </div>
                        <div className="flex items-center gap-3 text-xs text-center flex-shrink-0 w-48 justify-center"><span className="font-semibold text-red-500">P: {Math.round(item.food.protein * ratio)}g</span><span className="font-semibold text-green-600">G: {Math.round(item.food.carbs * ratio)}g</span><span className="font-semibold text-yellow-500">L: {Math.round(item.food.fat * ratio)}g</span></div>
                        <div className="font-semibold text-gray-800 w-24 text-right">{Math.round(item.food.calories * ratio)} kcal</div>
                        <button onClick={() => handleItemDelete(item.id, mealId)} className="text-gray-400 hover:text-red-500 p-1"><TrashIcon className="w-5 h-5" /></button>
                    </div>
                );
            })}
        </div>
    );
    
    if (!activeDay && creationMode === 'plan') {
        return (
            <div className="flex justify-center items-center h-96">
                <p className="text-gray-500">Chargement du plan...</p>
            </div>
        );
    }

    const handleDragOverAccordion = (mealId: string) => { setDraggedOverMealId(mealId); if (openAccordion !== mealId) setOpenAccordion(mealId); };

    return (
        <div className="flex gap-6 relative">
            <main className="w-full transition-all duration-300 flex flex-col gap-6" style={{ marginRight: isFilterSidebarVisible ? '424px' : '0' }}>
                <h1 className="text-3xl font-bold text-gray-800 mb-2">Créateur de Repas</h1>
                 <div className="flex justify-center">
                     <ToggleSwitch label1="Plan Alimentaire" value1="plan" label2="Recette" value2="recipe" value={creationMode} onChange={(v) => setCreationMode(v as 'plan' | 'recipe')} />
                </div>
                
                {creationMode === 'plan' && activeDay && (
                <Card className="p-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
                        <Input label="Nom du plan" value={plan.name} onChange={e => setPlan(p => ({ ...p, name: e.target.value }))} />
                        <Input label="Objectif" value={plan.objective} onChange={e => setPlan(p => ({ ...p, objective: e.target.value }))} />
                        <Select label="Assigner au client" value={selectedClientId} onChange={handleClientChange}>
                            {clientOptions.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                        </Select>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                        <Input label="Nombre de semaines" type="number" value={plan.weekCount} onChange={handleWeekCountChange} min="1" max="52" />
                        {plan.weekCount > 1 && (<Select label="Semaine" value={selectedWeek} onChange={e => setSelectedWeek(Number(e.target.value))}>{[...Array(plan.weekCount)].map((_, i) => ( <option key={i + 1} value={i + 1}>Semaine {i + 1}</option> ))}</Select>)}
                    </div>
                    
                    {creationMode === 'plan' && selectedClient && (
                        <Card className="p-4 bg-gray-50 border mb-6">
                            <h2 className="text-center font-bold text-lg mb-4 text-gray-800">Objectifs & Préférences de {selectedClient.firstName}</h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
                                <div>
                                    <h3 className="font-semibold text-gray-700 mb-2 border-b pb-1">Objectifs Nutritionnels</h3>
                                    {clientNutritionData ? (
                                        <div className="grid grid-cols-2 gap-4 pt-2">
                                            <InfoItem label="Calories" value={clientNutritionData.calorieObjective} unit="kcal" />
                                            <InfoItem label="Protéines" value={clientNutritionData.macros.protein} unit="g" colorClass="text-red-500" />
                                            <InfoItem label="Glucides" value={clientNutritionData.macros.carbs} unit="g" colorClass="text-green-600" />
                                            <InfoItem label="Lipides" value={clientNutritionData.macros.fat} unit="g" colorClass="text-yellow-500" />
                                        </div>
                                    ) : (
                                        <p className="text-sm text-gray-500 italic pt-2">Aucun objectif macro n'a été défini pour ce client.</p>
                                    )}
                                </div>
                                <div>
                                    <h3 className="font-semibold text-gray-700 mb-2 border-b pb-1">Préférences Alimentaires</h3>
                                    <div className="space-y-2 text-sm pt-2">
                                        <div>
                                            <h4 className="font-medium text-gray-600">Allergies:</h4>
                                            <p className="text-gray-800 whitespace-pre-wrap pl-2">{selectedClient.medicalInfo?.allergies || 'Non renseigné'}</p>
                                        </div>
                                        <div>
                                            <h4 className="font-medium text-gray-600">Aversions:</h4>
                                            <p className="text-gray-800 whitespace-pre-wrap pl-2">{selectedClient.nutrition?.foodAversions || 'Non renseigné'}</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </Card>
                    )}
                    
                    <div className={isWeek1LockActive ? 'blur-sm pointer-events-none' : ''}>
                        <div className="flex justify-between items-center mb-4"><h2 className="text-xl font-bold">Plan de la semaine {selectedWeek}</h2><ToggleSwitch label1="Jour unique" value1="single" label2="Multi-jour" value2="multi" value={dayDisplayMode} onChange={(val) => setDayDisplayMode(val as 'single'|'multi')} /></div>
                        {dayDisplayMode === 'multi' && (<div className="flex items-center gap-2 mb-4 border-b pb-2 overflow-x-auto">{activeDaysInWeek.map((day, index) => (<div key={day.id} className="relative group flex-shrink-0"><button onClick={() => setSelectedDayIndex(index)} className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${selectedDayIndex === index ? 'bg-primary/10 text-primary' : 'hover:bg-gray-100'}`}>{day.name}</button>{activeDaysInWeek.length > 1 && (<button onClick={(e) => { e.stopPropagation(); handleRemoveDay(index); }} className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-gray-400 rounded-full flex items-center justify-center text-white hover:bg-red-500 opacity-0 group-hover:opacity-100"><XMarkIcon className="w-3 h-3" /></button>)}</div>))}{<button onClick={handleCopyDayToNext} title={`Copier le ${activeDay.name}`} className="ml-4 w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center hover:bg-primary hover:text-white flex-shrink-0"><DocumentDuplicateIcon className="w-5 h-5" /></button>}<button onClick={handleAddDay} className="ml-2 w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center hover:bg-primary hover:text-white flex-shrink-0"><PlusIcon className="w-5 h-5" /></button></div>)}
                        {renderMacros(planDayTotals)}
                        <div className="space-y-2">
                            {activeDay.meals.map(meal => {
                                const mealMacros = meal.items.reduce((acc, item) => {
                                    const ratio = item.quantity / 100;
                                    acc.calories += item.food.calories * ratio;
                                    acc.protein += item.food.protein * ratio;
                                    acc.carbs += item.food.carbs * ratio;
                                    acc.fat += item.food.fat * ratio;
                                    return acc;
                                }, { calories: 0, protein: 0, carbs: 0, fat: 0 });

                                const mealCalories = Math.round(mealMacros.calories);
                                const mealProtein = Math.round(mealMacros.protein);
                                const mealCarbs = Math.round(mealMacros.carbs);
                                const mealFat = Math.round(mealMacros.fat);
                                
                                return (
                                <Accordion 
                                    key={meal.id} 
                                    title={
                                        <div className="flex justify-between items-center w-full">
                                            <div className="flex items-center gap-3 flex-wrap">
                                                <span>{meal.name}</span>
                                                {mealCalories > 0 && <span className="text-sm font-normal text-gray-500">({mealCalories} kcal | P:{mealProtein}g G:{mealCarbs}g L:{mealFat}g)</span>}
                                            </div>
                                            <button onClick={(e) => { e.stopPropagation(); handleMealDelete(meal.id); }} className="p-1 rounded-full text-gray-400 hover:bg-red-100 hover:text-red-600"><TrashIcon className="w-5 h-5" /></button>
                                        </div>
                                    } 
                                    isOpen={openAccordion === meal.id} 
                                    onToggle={() => setOpenAccordion(prev => prev === meal.id ? null : meal.id)} 
                                    onButtonDragOver={() => handleDragOverAccordion(meal.id)} 
                                    onButtonDrop={(e) => handleDrop(e, meal.id)}>
                                    <div onDragOver={(e) => { e.preventDefault(); setDraggedOverMealId(meal.id); }} onDragLeave={() => setDraggedOverMealId(null)} onDrop={(e) => handleDrop(e, meal.id)} className={`p-4 rounded-lg border-2 ${draggedOverMealId === meal.id ? 'border-primary bg-primary/5' : 'border-dashed border-gray-300'} transition-colors`}>
                                        {meal.items.length === 0 && <p className="text-center text-gray-500">Glissez et déposez un aliment ici.</p>}
                                        {renderItems(meal.items, meal.id)}
                                    </div>
                                </Accordion>
                            )})}
                        </div>
                        <div className="relative mt-4 text-center" ref={addMealMenuRef}><Button variant="secondary" onClick={() => setIsAddMealMenuOpen(p => !p)} disabled={availableMealsToAdd.length === 0}><PlusIcon className="w-5 h-5 mr-2 inline-block"/>Ajouter une section repas</Button>{isAddMealMenuOpen && ( <div className="absolute bottom-full mb-2 w-56 bg-white rounded-md shadow-lg py-1 z-10 ring-1 ring-black ring-opacity-5 left-1/2 -translate-x-1/2">{availableMealsToAdd.map(mealTemplate => ( <button key={mealTemplate.id} onClick={() => handleAddMeal(mealTemplate)} className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">{mealTemplate.name}</button> ))}</div> )}</div>
                    </div>
                </Card>
                )}
                {creationMode === 'recipe' && (
                <Card className="p-6 space-y-4">
                    <Input label="Nom de la recette" value={recipe.name} onChange={e => setRecipe(r => ({...r, name: e.target.value}))} />
                    {renderMacros(recipeTotals)}
                    <Accordion title="Ingrédients" isOpenDefault={true}>
                        <div onDragOver={(e) => {e.preventDefault(); setDraggedOverRecipe(true);}} onDragLeave={() => setDraggedOverRecipe(false)} onDrop={(e) => handleDrop(e)} className={`p-4 rounded-lg border-2 ${draggedOverRecipe ? 'border-primary bg-primary/5' : 'border-dashed border-gray-300'}`}>
                            {recipe.items.length === 0 && <p className="text-center text-gray-500">Glissez un aliment ici.</p>}
                            {renderItems(recipe.items)}
                        </div>
                    </Accordion>
                    <Accordion title="Étapes de préparation" isOpenDefault={true}>
                        <div className="space-y-3">
                            {(recipe.steps || []).map((step, index) => (
                                <div key={index} className="flex items-center gap-2">
                                    <span className="font-bold text-gray-500">{index + 1}.</span>
                                    <Input
                                        value={step}
                                        onChange={(e) => handleStepChange(index, e.target.value)}
                                        placeholder={`Étape ${index + 1}`}
                                        className="flex-grow"
                                    />
                                    {(recipe.steps || []).length > 1 && (
                                        <Button variant="secondary" size="sm" onClick={() => removeStep(index)} className="!p-2">
                                            <TrashIcon className="w-4 h-4" />
                                        </Button>
                                    )}
                                </div>
                            ))}
                            <Button variant="secondary" size="sm" onClick={addStep} className="mt-2">
                                <PlusIcon className="w-4 h-4 mr-1" />
                                Ajouter une étape
                            </Button>
                        </div>
                    </Accordion>
                </Card>
                )}
                <div className="flex justify-end gap-4 mt-auto pt-6">
                    <Button variant="secondary" onClick={() => navigate('/app/nutrition/bibliotheque')}>Annuler</Button>
                    <Button variant="primary" onClick={handleSave}>{isEditMode ? 'Mettre à jour' : 'Enregistrer'}</Button>
                </div>
            </main>
             <div className={`fixed top-[88px] right-6 h-[calc(100vh-112px)] transition-all duration-300 ease-in-out ${isFilterSidebarVisible ? 'w-[400px]' : 'w-0'}`}>
                <div className={`transition-opacity duration-300 ${isFilterSidebarVisible ? 'opacity-100' : 'opacity-0'}`}><FoodFilterSidebar db={foodAndRecipeDb} /></div>
             </div>
             <button onClick={() => setIsFilterSidebarVisible(!isFilterSidebarVisible)} className="fixed top-1/2 -translate-y-1/2 bg-white p-2 rounded-l-full shadow-lg border border-r-0 transition-all duration-300" style={{ right: isFilterSidebarVisible ? '424px' : '24px'}}>
                <ChevronDoubleRightIcon className={`w-5 h-5 text-gray-600 transition-transform ${isFilterSidebarVisible ? 'rotate-180' : ''}`} />
             </button>
        </div>
    );
};

export default Nutrition;
