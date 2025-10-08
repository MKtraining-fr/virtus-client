

import React, { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext';
import { Exercise, WorkoutExercise, WorkoutSession, WorkoutProgram, Client } from '../../../types';
import Input from '../../../components/Input';
import Select from '../../../components/Select';
import Modal from '../../../components/Modal';
import InteractiveBodyDiagram from '../../../components/client/InteractiveBodyDiagram';
import ClientAccordion from '../../../components/client/ClientAccordion';
import ToggleSwitch from '../../../components/ToggleSwitch';
import { 
    ArrowLeftIcon, PlusIcon, TrashIcon, DocumentDuplicateIcon, ChevronDownIcon 
} from '../../../constants/icons';


const initialSessions: WorkoutSession[] = [{ id: 1, name: 'Séance 1', exercises: [] }];

const FilterChip: React.FC<{ label: string, selected: boolean, onClick: () => void }> = ({ label, selected, onClick }) => (
    <button
        onClick={onClick}
        className={`px-3 py-1 text-sm rounded-full border transition-all ${selected ? 'bg-primary text-white border-primary' : 'bg-white dark:bg-client-dark text-gray-700 dark:text-client-light border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700'}`}
    >
        {label}
    </button>
);


// Re-implementing the component from scratch for a mobile-first UI
const ClientWorkoutBuilder: React.FC = () => {
    const { user, clients, setClients, exercises: exerciseDB, theme } = useAuth();
    const navigate = useNavigate();

    if (user && user.canUseWorkoutBuilder === false) {
        return (
            <div className="text-center py-10 bg-client-card rounded-lg">
                <h1 className="text-2xl font-bold text-red-500">Accès non autorisé</h1>
                <p className="text-client-light mt-4">Vous n'avez pas la permission d'utiliser le créateur de séance.</p>
                <p className="text-client-subtle text-sm mt-2">Veuillez contacter votre coach pour plus d'informations.</p>
                <button onClick={() => navigate('/app/workout')} className="mt-6 bg-primary text-white font-semibold px-4 py-2 rounded-lg">
                    Retour à l'entraînement
                </button>
            </div>
        );
    }

    // Core state
    const [workoutMode, setWorkoutMode] = useState<'session' | 'program'>('session');
    const [sessions, setSessions] = useState<WorkoutSession[]>(initialSessions);
    const [activeSessionId, setActiveSessionId] = useState(1);
    
    // Program details state
    const [programName, setProgramName] = useState('Nouvelle séance');
    const [objective, setObjective] = useState('');
    const [weekCount, setWeekCount] = useState<number | ''>(4);

    // Modal state
    const [isExerciseModalOpen, setIsExerciseModalOpen] = useState(false);
    const [exerciseToReplace, setExerciseToReplace] = useState<WorkoutExercise | null>(null);

    const activeSession = useMemo(() => sessions.find(s => s.id === activeSessionId), [sessions, activeSessionId]);
    
    const availableExercises = useMemo(() => {
        return exerciseDB.filter(ex => ex.coachId === 'system' || ex.coachId === user?.coachId || !ex.coachId);
    }, [exerciseDB, user]);

    const handleWeekCountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = e.target.value;
        if (val === '') {
            setWeekCount('');
        } else {
            const num = parseInt(val, 10);
            if (!isNaN(num) && num >= 1) {
                setWeekCount(Math.min(num, 52));
            }
        }
    };

    const handleWeekCountBlur = () => {
        if (weekCount === '' || Number(weekCount) < 1) {
            setWeekCount(1);
        }
    };

    const updateExerciseField = (exerciseId: number, field: string, value: any) => {
        setSessions(prevSessions =>
            prevSessions.map(session => {
                if (session.id !== activeSessionId) return session;

                return {
                    ...session,
                    exercises: session.exercises.map(ex => {
                        if (ex.id !== exerciseId) return ex;
                        
                        // Handle direct properties of WorkoutExercise
                        if (['exerciseId', 'name', 'illustrationUrl'].includes(field)) {
                            return { ...ex, [field]: value };
                        }
                        
                        if (field === 'sets') {
                            const parsedValue = parseInt(value, 10);
                            if (value !== '' && (isNaN(parsedValue) || parsedValue < 0)) {
                                return ex; // Ignore invalid input
                            }
                            const newSets = isNaN(parsedValue) ? 0 : parsedValue;

                            const currentSets = ex.details.length;
                            let newDetails = [...ex.details];
                            if (newSets > currentSets) {
                                const lastDetail = newDetails[currentSets - 1] || { reps: '12', load: { value: '', unit: 'kg' }, tempo: '2010', rest: '60s' };
                                for (let i = 0; i < newSets - currentSets; i++) {
                                    newDetails.push(JSON.parse(JSON.stringify(lastDetail)));
                                }
                            } else {
                                newDetails = newDetails.slice(0, newSets);
                            }
                            return { ...ex, sets: value, details: newDetails };
                        }

                        if (field === 'intensification') {
                            const newIntensification = value === 'Aucune' ? [] : [{ id: 1, value: value }];
                            return { ...ex, intensification: newIntensification };
                        }

                        // Simple view: update all details in the array
                        const updatedDetails = ex.details.map(detail => {
                            if (field === 'load.value') return { ...detail, load: { ...detail.load, value: value } };
                            if (field === 'load.unit') return { ...detail, load: { ...detail.load, unit: value } };
                            // This will handle 'reps', 'tempo', 'rest'
                            if (['reps', 'tempo', 'rest'].includes(field)) {
                                return { ...detail, [field]: value };
                            }
                            return detail;
                        });
                        
                        return { ...ex, details: updatedDetails };
                    })
                };
            })
        );
    };

    const addExercise = () => {
        if (!activeSession) return;
        const newId = Math.max(0, ...sessions.flatMap(s => s.exercises.map(e => e.id))) + 1;
        const newExercise: WorkoutExercise = {
            id: newId,
            exerciseId: '',
            name: 'Choisir un exercice',
            illustrationUrl: '',
            sets: '3',
            isDetailed: false,
            details: Array(3).fill(null).map(() => ({ reps: '12', load: { value: '', unit: 'kg' }, tempo: '2010', rest: '60s' })),
            intensification: [],
            alternatives: []
        };
        setSessions(sessions.map(s => s.id === activeSessionId ? { ...s, exercises: [...s.exercises, newExercise] } : s));
    };

    const deleteExercise = (exerciseId: number) => {
         setSessions(prevSessions =>
            prevSessions.map(session => 
                session.id === activeSessionId
                ? { ...session, exercises: session.exercises.filter(ex => ex.id !== exerciseId) }
                : session
            )
        );
    };
    
    const addSession = () => {
        const newId = sessions.length > 0 ? Math.max(0, ...sessions.map(s => s.id)) + 1 : 1;
        const newSession: WorkoutSession = { id: newId, name: `Séance ${sessions.length + 1}`, exercises: [] };
        setSessions([...sessions, newSession]);
        setActiveSessionId(newId);
    };

    const handleExerciseSelection = (selectedEx: Exercise, exerciseToUpdate: WorkoutExercise | null) => {
        if (!exerciseToUpdate) return;
        updateExerciseField(exerciseToUpdate.id, 'exerciseId', selectedEx.id);
        updateExerciseField(exerciseToUpdate.id, 'name', selectedEx.name);
        updateExerciseField(exerciseToUpdate.id, 'illustrationUrl', selectedEx.illustrationUrl);
    };

    const handleSaveClient = () => {
        if (!user) return;

        const hasExercises = sessions.some(session => session.exercises.length > 0 && session.exercises.some(ex => ex.name.trim() !== '' && ex.name.trim() !== 'Choisir un exercice'));
        if (!hasExercises) {
            alert("Veuillez ajouter au moins un exercice avant d'enregistrer.");
            return;
        }

        const programBase = {
            id: `prog-client-${Date.now()}`,
            name: programName.trim() === '' ? 'Nouvelle séance' : programName,
            clientId: user.id,
        };

        let newProgram: WorkoutProgram;

        if (workoutMode === 'program') {
            const numWeeks = Number(weekCount) || 1;
            const sessionsByWeek: Record<number, WorkoutSession[]> = {};
            for (let i = 1; i <= numWeeks; i++) {
                sessionsByWeek[i] = JSON.parse(JSON.stringify(sessions));
            }
            newProgram = {
                ...programBase,
                objective: objective,
                weekCount: numWeeks,
                sessionsByWeek: sessionsByWeek,
            };
        } else {
            newProgram = {
                ...programBase,
                objective: 'Séance unique',
                weekCount: 1,
                sessionsByWeek: { 1: sessions.slice(0, 1) },
            };
        }

        const updatedClients = clients.map(c => {
            if (c.id === user.id) {
                return { ...c, savedPrograms: [...(c.savedPrograms || []), newProgram] };
            }
            return c;
        });
        setClients(updatedClients as Client[]);
        alert(`"${newProgram.name}" a été enregistré dans "Mes Programmes" !`);
        navigate('/app/workout/my-programs');
    };

    return (
      <div className="flex flex-col h-[calc(100vh-128px)] text-gray-800 dark:text-client-light">
          {/* --- Header --- */}
          <header className="flex items-center gap-4 p-4 shrink-0 border-b border-gray-200 dark:border-client-card">
              <button onClick={() => navigate(-1)} className="p-2 bg-white dark:bg-client-card rounded-full text-gray-800 dark:text-client-light hover:bg-gray-100 dark:hover:bg-primary/20">
                  <ArrowLeftIcon className="w-5 h-5" />
              </button>
              <h1 className="text-xl font-bold text-gray-800 dark:text-client-light">Créateur de séance</h1>
          </header>

          {/* --- Config & Main Content --- */}
          <main className="flex-1 overflow-y-auto">
              <div className="p-4 space-y-4">
                  <div className="flex justify-center">
                    <ToggleSwitch label1="Séance" value1="session" label2="Programme" value2="program" value={workoutMode} onChange={(v) => setWorkoutMode(v as 'session' | 'program')} theme={theme} />
                  </div>
                  
                  <ClientAccordion title={workoutMode === 'program' ? "Détails du Programme" : "Détails de la Séance"}>
                      {workoutMode === 'program' ? (
                          <div className="space-y-3">
                              <Input label="Nom du programme" value={programName} onChange={e => setProgramName(e.target.value)} />
                              <Input label="Objectif" value={objective} onChange={e => setObjective(e.target.value)} />
                              <Input label="Nombre de semaines" type="number" min="1" max="52" value={weekCount} onChange={handleWeekCountChange} onBlur={handleWeekCountBlur} />
                          </div>
                      ) : (
                          <Input label="Nom de la séance" value={programName} onChange={e => setProgramName(e.target.value)} />
                      )}
                  </ClientAccordion>

                  {workoutMode === 'program' && (
                        <div className="flex items-center gap-2 pb-2 overflow-x-auto">
                            {sessions.map((session) => (
                                <button
                                    key={session.id}
                                    onClick={() => setActiveSessionId(session.id)}
                                    className={`px-4 py-2 rounded-full text-sm font-medium transition-colors flex-shrink-0 ${activeSessionId === session.id ? 'bg-primary text-white' : 'bg-gray-100 dark:bg-client-card text-gray-600 dark:text-client-subtle hover:text-gray-800 dark:hover:text-client-light'}`}
                                >
                                    {session.name}
                                </button>
                            ))}
                            <button onClick={addSession} className="w-9 h-9 bg-gray-100 dark:bg-client-card rounded-full flex items-center justify-center text-gray-600 dark:text-client-subtle hover:bg-primary hover:text-white transition-colors flex-shrink-0">
                                <PlusIcon className="w-5 h-5" />
                            </button>
                        </div>
                    )}
              </div>

              {/* Exercise List */}
              <div className="px-4 space-y-3 pb-24">
                  {activeSession?.exercises.map((ex, index) => (
                      <ExerciseItem
                          key={ex.id}
                          exercise={ex}
                          index={index}
                          onUpdate={updateExerciseField}
                          onDelete={deleteExercise}
                          onOpenSelector={() => {
                              setExerciseToReplace(ex);
                              setIsExerciseModalOpen(true);
                          }}
                      />
                  ))}
                  <div className="pt-4">
                      <button
                          onClick={addExercise}
                          className="w-full flex items-center justify-center gap-2 px-4 py-4 bg-white dark:bg-client-card border-2 border-dashed border-gray-300 dark:border-client-subtle rounded-lg text-gray-800 dark:text-client-light hover:border-primary hover:text-primary transition-colors"
                      >
                          <PlusIcon className="w-6 h-6" />
                          <span>Ajouter un exercice</span>
                      </button>
                  </div>
              </div>
          </main>
          
          {/* --- Floating & Fixed Elements --- */}
          <footer className="fixed bottom-16 left-0 right-0 p-3 bg-white dark:bg-client-card border-t border-gray-200 dark:border-gray-700 shrink-0 z-20">
              <button onClick={handleSaveClient} className="w-full bg-primary text-white font-bold py-3 rounded-lg hover:bg-violet-700 transition-colors">
                  Enregistrer
              </button>
          </footer>

          <ExerciseSelectionModal
              isOpen={isExerciseModalOpen}
              onClose={() => setIsExerciseModalOpen(false)}
              onSelect={(selectedEx) => {
                  handleExerciseSelection(selectedEx, exerciseToReplace);
                  setIsExerciseModalOpen(false);
              }}
              availableExercises={availableExercises}
          />
      </div>
    );
};

// --- INTERNAL COMPONENTS ---

interface ExerciseItemProps {
    exercise: WorkoutExercise;
    index: number;
    onUpdate: (exerciseId: number, field: string, value: any) => void;
    onDelete: (exerciseId: number) => void;
    onOpenSelector: () => void;
}

const ExerciseItem: React.FC<ExerciseItemProps> = ({ exercise, index, onUpdate, onDelete, onOpenSelector }) => {
    const [isExpanded, setIsExpanded] = useState(false);
    const idPrefix = `ex-${exercise.id}`;

    return (
        <div className="bg-white dark:bg-client-card rounded-lg p-3 space-y-3">
            <div className="flex items-center gap-3">
                <span className="text-2xl font-bold text-primary w-8 text-center">{index + 1}</span>
                <div 
                    className="flex-1 bg-gray-50 dark:bg-client-dark p-3 rounded-lg flex items-center gap-3 cursor-pointer"
                    onClick={onOpenSelector}
                >
                    {exercise.illustrationUrl ? (
                        <img src={exercise.illustrationUrl} alt={exercise.name} className="w-12 h-12 object-contain bg-white rounded-md flex-shrink-0" />
                    ) : (
                         <div className="w-12 h-12 bg-gray-200 dark:bg-gray-700 rounded-md flex-shrink-0"></div>
                    )}
                    <p className="font-semibold">{exercise.name}</p>
                </div>
                <button onClick={() => onDelete(exercise.id)} className="p-2 text-gray-500 dark:text-client-subtle hover:text-red-500">
                    <TrashIcon className="w-5 h-5" />
                </button>
            </div>
            {/* Main Inputs */}
            <div className="grid grid-cols-3 gap-2">
                 <div>
                    <label htmlFor={`${idPrefix}-sets`} className="block text-xs text-gray-500 dark:text-client-subtle mb-1 text-center">Séries</label>
                    <Input id={`${idPrefix}-sets`} type="number" min="0" value={exercise.sets} onChange={e => onUpdate(exercise.id, 'sets', e.target.value)} className="text-center h-[42px]" />
                </div>
                 <div>
                    <label htmlFor={`${idPrefix}-reps`} className="block text-xs text-gray-500 dark:text-client-subtle mb-1 text-center">Rép</label>
                    <Input id={`${idPrefix}-reps`} value={exercise.details[0]?.reps || ''} onChange={e => onUpdate(exercise.id, 'reps', e.target.value)} className="text-center h-[42px]" />
                </div>
                <div>
                    <label htmlFor={`${idPrefix}-load-value`} className="block text-xs text-gray-500 dark:text-client-subtle mb-1 text-center">Charge</label>
                    <div className="flex">
                        <Input id={`${idPrefix}-load-value`} type="number" value={exercise.details[0]?.load.value || ''} onChange={e => onUpdate(exercise.id, 'load.value', e.target.value)} className="text-center rounded-r-none h-[42px]" />
                        <Select value={exercise.details[0]?.load.unit || 'kg'} onChange={e => onUpdate(exercise.id, 'load.unit', e.target.value)} className="rounded-l-none -ml-px !py-0 h-[42px]">
                            <option>kg</option>
                            <option>%</option>
                            <option>RPE</option>
                            <option>km/h</option>
                            <option>W</option>
                            <option>lvl</option>
                        </Select>
                    </div>
                </div>
            </div>
            {/* Expandable Details */}
            <div className="text-center">
                <button onClick={() => setIsExpanded(!isExpanded)} className="text-sm text-primary font-semibold inline-flex items-center gap-1">
                    Détails <ChevronDownIcon className={`w-4 h-4 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                </button>
            </div>
            {isExpanded && (
                <div className="grid grid-cols-2 gap-2 pt-2 border-t border-gray-200 dark:border-client-dark/50">
                    <div>
                        <label htmlFor={`${idPrefix}-tempo`} className="block text-xs text-gray-500 dark:text-client-subtle mb-1 text-center">Tempo</label>
                        <Input id={`${idPrefix}-tempo`} value={exercise.details[0]?.tempo || ''} onChange={e => onUpdate(exercise.id, 'tempo', e.target.value)} className="text-center" />
                    </div>
                    <div>
                        <label htmlFor={`${idPrefix}-rest`} className="block text-xs text-gray-500 dark:text-client-subtle mb-1 text-center">Repos (s)</label>
                        <Input id={`${idPrefix}-rest`} value={exercise.details[0]?.rest || ''} onChange={e => onUpdate(exercise.id, 'rest', e.target.value)} className="text-center" />
                    </div>
                    <div className="col-span-2">
                        <label htmlFor={`${idPrefix}-intensification`} className="block text-xs text-gray-500 dark:text-client-subtle mb-1 text-left">Intensification</label>
                        <Select id={`${idPrefix}-intensification`} value={exercise.intensification?.[0]?.value || 'Aucune'} onChange={e => onUpdate(exercise.id, 'intensification', e.target.value)} className="w-full">
                            <option>Aucune</option><option>Drop Set</option>
                        </Select>
                    </div>
                </div>
            )}
        </div>
    );
};

interface ExerciseSelectionModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSelect: (exercise: Exercise) => void;
    availableExercises: Exercise[];
}

const ExerciseSelectionModal: React.FC<ExerciseSelectionModalProps> = ({ isOpen, onClose, onSelect, availableExercises }) => {
    const { theme } = useAuth();
    const [searchTerm, setSearchTerm] = useState('');
    const [activeFilters, setActiveFilters] = useState<{ equipments: string[], muscleGroups: string[] }>({ equipments: [], muscleGroups: [] });

    const equipmentTypes = useMemo(() => Array.from(new Set(availableExercises.map(e => e.equipment).filter(Boolean))), [availableExercises]) as string[];
    const muscleGroups = useMemo(() => Array.from(new Set(availableExercises.flatMap(e => e.muscleGroups).filter(Boolean))), [availableExercises]) as string[];

    const filteredExercises = useMemo(() => {
        return availableExercises.filter(ex => {
            const matchesSearch = !searchTerm || ex.name.toLowerCase().includes(searchTerm.toLowerCase());
            const matchesEquipment = activeFilters.equipments.length === 0 || (ex.equipment && activeFilters.equipments.includes(ex.equipment));
            const matchesMuscleGroups = activeFilters.muscleGroups.length === 0 || (ex.muscleGroups && activeFilters.muscleGroups.some(smg => ex.muscleGroups!.includes(smg)));
            return matchesSearch && matchesEquipment && matchesMuscleGroups;
        });
    }, [availableExercises, searchTerm, activeFilters]);

    const toggleSelection = useCallback((item: string, type: 'equipments' | 'muscleGroups') => {
        setActiveFilters(prev => ({
            ...prev,
            [type]: prev[type].includes(item) ? prev[type].filter(i => i !== item) : [...prev[type], item],
        }));
    }, []);

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Choisir un exercice" theme={theme}>
            <div className="space-y-4">
                 <Input
                    type="text"
                    placeholder="Rechercher..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
                <ClientAccordion title="Filtres">
                    <div className="space-y-6">
                        <InteractiveBodyDiagram 
                            selectedGroups={activeFilters.muscleGroups}
                            onToggleGroup={(group) => toggleSelection(group, 'muscleGroups')}
                        />
                         {equipmentTypes.length > 0 && (
                            <div>
                                <h3 className="font-semibold mb-3">Équipement</h3>
                                <div className="flex flex-wrap gap-2">
                                    {equipmentTypes.map(type => (
                                        <FilterChip 
                                            key={type}
                                            label={type}
                                            selected={activeFilters.equipments.includes(type)}
                                            onClick={() => toggleSelection(type, 'equipments')}
                                        />
                                    ))}
                                </div>
                            </div>
                        )}
                        {muscleGroups.length > 0 && (
                             <div>
                                <h3 className="font-semibold mb-3">Groupes musculaires</h3>
                                <div className="flex flex-wrap gap-2">
                                    {muscleGroups.map(group => (
                                        <FilterChip 
                                            key={group}
                                            label={group}
                                            selected={activeFilters.muscleGroups.includes(group)}
                                            onClick={() => toggleSelection(group, 'muscleGroups')}
                                        />
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </ClientAccordion>
                <div className="max-h-80 overflow-y-auto space-y-2 pr-2">
                    {filteredExercises.length > 0 ? (
                        filteredExercises.map(ex => (
                            <button key={ex.id} onClick={() => onSelect(ex)} className="w-full flex items-center gap-3 p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-client-dark text-left transition-colors">
                                <img src={ex.illustrationUrl} alt={ex.name} className="w-16 h-16 object-contain rounded-md bg-white flex-shrink-0" />
                                <p className="font-semibold">{ex.name}</p>
                            </button>
                        ))
                    ) : (
                        <p className="text-center text-gray-500 dark:text-client-subtle py-8">Aucun exercice trouvé.</p>
                    )}
                </div>
            </div>
        </Modal>
    );
}

export default ClientWorkoutBuilder;