'''
import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import Card from '../components/Card.tsx';
import Input from '../components/Input.tsx';
import Select from '../components/Select.tsx';
import Button from '../components/Button.tsx';
import ToggleSwitch from '../components/ToggleSwitch.tsx';
import ExerciseFilterSidebar from '../components/ExerciseFilterSidebar.tsx';
import { Exercise, WorkoutExercise, WorkoutSession, WorkoutProgram, Client, Program as SupabaseProgram, Session as SupabaseSession, SessionExercise as SupabaseSessionExercise } from '../types.ts';
import { useLocalStorage } from '../hooks/useLocalStorage.ts';
import { mapWorkoutProgramToProgram, mapWorkoutSessionToSession, mapWorkoutExerciseToSessionExercise, reconstructWorkoutProgram } from '../utils/workoutMapper.ts';
import { getProgramById, getSessionsByProgramId, getSessionExercisesBySessionId, createProgram, updateProgram, createSession, updateSession, deleteSession, createSessionExercise, updateSessionExercise, deleteSessionExercise, getExercisesByIds } from '../services/programService.ts';
import ClientHistoryModal from '../components/ClientHistoryModal.tsx';
import { useAuth } from '../context/AuthContext.tsx';
import {
    FolderIcon, EllipsisHorizontalIcon, PlusIcon, DocumentDuplicateIcon, TrashIcon, XMarkIcon,
    ChevronDoubleRightIcon, ChevronUpIcon, ListBulletIcon, LockClosedIcon
} from '../constants/icons.ts';


const initialSessions: WorkoutSession[] = [{ id: 1, name: 'Séance 1', exercises: [] }];

const DEFAULT_DETAIL_TEMPLATE: WorkoutExercise['details'][number] = {
    reps: '12',
    load: { value: '', unit: 'kg' },
    tempo: '2010',
    rest: '60s',
};

const createDefaultDetail = (): WorkoutExercise['details'][number] => ({
    reps: DEFAULT_DETAIL_TEMPLATE.reps,
    load: { ...DEFAULT_DETAIL_TEMPLATE.load },
    tempo: DEFAULT_DETAIL_TEMPLATE.tempo,
    rest: DEFAULT_DETAIL_TEMPLATE.rest,
});

const ensureDetailsArray = (
    details: WorkoutExercise['details'] | undefined,
    setsValue?: string
): WorkoutExercise['details'] => {
    if (!Array.isArray(details) || details.length === 0) {
        const parsedSets = parseInt(setsValue ?? '', 10);
        if (!isNaN(parsedSets) && parsedSets <= 0) {
            return [];
        }
        return [createDefaultDetail()];
    }

    return details.map(detail => ({
        reps: detail?.reps ?? DEFAULT_DETAIL_TEMPLATE.reps,
        load: {
            value: detail?.load?.value ?? DEFAULT_DETAIL_TEMPLATE.load.value,
            unit: detail?.load?.unit ?? DEFAULT_DETAIL_TEMPLATE.load.unit,
        },
        tempo: detail?.tempo ?? DEFAULT_DETAIL_TEMPLATE.tempo,
        rest: detail?.rest ?? DEFAULT_DETAIL_TEMPLATE.rest,
    }));
};

const getLatestNote = (notes?: string): { display: string; full: string | null } => {
    if (!notes || !notes.trim()) {
        return { display: '-', full: null };
    }
    const firstNoteEntry = notes.split(/\n\n(?=---)/)[0];
    const match = firstNoteEntry.match(/--- .*? ---\n(.*)/s);
    let text = match && match[1] ? match[1].trim() : firstNoteEntry.trim();
    const display = text.split('\n')[0];
    return { display, full: text };
};


interface WorkoutBuilderProps {
  mode?: 'coach' | 'client';
}

const WorkoutBuilder: React.FC<WorkoutBuilderProps> = ({ mode = 'coach' }) => {
    const { user, clients, exercises: exerciseDBFromAuth, programs, setPrograms, sessions: allSessions, setSessions: setAllSessions, setClients, addNotification } = useAuth();
    const [programDraft, setProgramDraft] = useLocalStorage<WorkoutProgram | null>('workout_draft', null);
    const [lastSavedAt, setLastSavedAt] = useLocalStorage<string | null>('last_saved_at', null);
    const [isSaving, setIsSaving] = useState(false);
    const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();

    // Loading & Edit mode state
    const [isLoading, setIsLoading] = useState(true);
    const [isEditMode, setIsEditMode] = useState(false);
    const [editProgramId, setEditProgramId] = useState<string | null>(null);
    const [lockedUntil, setLockedUntil] = useState<{ week: number; sessionIndex: number } | null>(null);

    const [workoutMode, setWorkoutMode] = useState<'session' | 'program'>('session');
    const [isFilterSidebarVisible, setIsFilterSidebarVisible] = useState(true);
    
    const [isGeneralInfoVisible, setIsGeneralInfoVisible] = useState(false);
    const [programName, setProgramName] = useState(programDraft?.name || 'Nouveau programme');
    const [objective, setObjective] = useState(programDraft?.objective || '');
    const [weekCount, setWeekCount] = useState<number | ''>((programDraft?.weekCount && programDraft.weekCount > 0) ? programDraft.weekCount : 1); // State for Week 1 creation lock
    const [isWeek1LockActive, setIsWeek1LockActive] = useState(false);

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
    
    const clientOptions = useMemo(() => {
        const myClients = clients.filter(c => 
            c.role === 'client' && 
            c.status === 'active' &&
            (user?.role === 'admin' || c.coachId === user?.id)
        );
        return [
            { id: '0', name: 'Aucun client' }, 
            ...(myClients || []).map(c => ({ id: c.id, name: `${c.firstName} ${c.lastName}` }))
        ];
    }, [clients, user]);

    const [selectedClient, setSelectedClient] = useState('0');

    const clientData = useMemo(() => {
        if (selectedClient === '0') return null;
        return clients.find(c => c.id === selectedClient);
    }, [selectedClient, clients]);
    
    // Core state for weekly customization
    const [sessionsByWeek, setSessionsByWeek] = useState<Record<number, WorkoutSession[]>>(() => {
        const initial = programDraft?.sessionsByWeek;
        if (initial && typeof initial === 'object' && Object.keys(initial).length > 0) {
            return initial;
        }
        return { 1: JSON.parse(JSON.stringify(initialSessions)) };
    });
    const [selectedWeek, setSelectedWeek] = useState<number>(1);
    const [activeSessionId, setActiveSessionId] = useState(1);
    
    const [draggedOverExerciseId, setDraggedOverExerciseId] = useState<number | null>(null);
    const [activeSearchBox, setActiveSearchBox] = useState<{ sessionId: number; exerciseId: number } | null>(null);
    const [selectedExerciseIds, setSelectedExerciseIds] = useState<number[]>([]);

    const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
    const [isHistoryModalMinimized, setIsHistoryModalMinimized] = useState(false);


    const exerciseDragItem = useRef<number | null>(null);
    const exerciseDragOverItem = useRef<number | null>(null);
    const sessionDragItem = useRef<number | null>(null);
    const sessionDragOverItem = useRef<number | null>(null);

    // Derived state for the currently active UI
    const sessions = useMemo(() => {
        return sessionsByWeek[selectedWeek] || [];
    }, [sessionsByWeek, selectedWeek]);

    const allSessions = useMemo(() => {
        if (!sessionsByWeek || typeof sessionsByWeek !== 'object') {
            return [];
        }
        return Object.values(sessionsByWeek).flat();
    }, [sessionsByWeek]);

    const activeSession = useMemo(() => {
        return sessions.find(s => s.id === activeSessionId);
    }, [sessions, activeSessionId]);

    const availableExercises = useMemo(() => {
        if (mode === 'client') {
            return exerciseDBFromAuth.filter(ex => ex.coachId === 'system' || ex.coachId === user?.coachId);
        }
        return exerciseDBFromAuth.filter(ex => ex.coachId === 'system' || ex.coachId === user?.id || !ex.coachId);
    }, [exerciseDBFromAuth, user, mode]);
    
     const handleClientSelectionChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const clientId = e.target.value;
        setSelectedClient(clientId);
        
        if (clientId === '0') {
            setObjective('');
        } else {
            const client = clients.find(c => c.id === clientId);
            if (client) {
                setObjective(client.objective || '');
            }
        }
    };

    // Lock creation to Week 1 for new programs
    useEffect(() => {
        if (!isEditMode && workoutMode === 'program' && selectedWeek !== 1) {
            setIsWeek1LockActive(true);
        } else {
            setIsWeek1LockActive(false);
        }
    }, [isEditMode, workoutMode, selectedWeek]);

    // Edit mode initialization and draft loading
    useEffect(() => {
        const clientIdFromUrl = searchParams.get('clientId');
        const programIdToEdit = searchParams.get('editProgramId');
        const sessionIdToEdit = searchParams.get('editSessionId');

        const loadProgramFromSupabase = async (programId: string) => {
            setIsLoading(true);
            try {
                const program = await getProgramById(programId);
                if (!program) {
                    addNotification({ message: "Programme non trouvé dans Supabase.", type: "error" });
                    navigate("/programmes");
                    return;
                }

                const sessions = await getSessionsByProgramId(programId);
                const allSessionExercises: Map<string, SupabaseSessionExercise[]> = new Map();
                const exerciseIds = new Set<string>();

                for (const session of sessions) {
                    const exercises = await getSessionExercisesBySessionId(session.id);
                    allSessionExercises.set(session.id, exercises);
                    exercises.forEach(ex => exerciseIds.add(ex.exercise_id));
                }

                const exerciseDetails = await getExercisesByIds(Array.from(exerciseIds));

                const reconstructedProgram = reconstructWorkoutProgram(program, sessions, allSessionExercises, exerciseDetails);

                setProgramName(reconstructedProgram.name);
                setObjective(reconstructedProgram.objective);
                setWeekCount(reconstructedProgram.weekCount);
                setSessionsByWeek(reconstructedProgram.sessionsByWeek);
                setSelectedClient(reconstructedProgram.clientId || '0');
                setEditProgramId(programId);
                setIsEditMode(true);

                addNotification({ message: "Programme chargé depuis Supabase.", type: "info" });

                if (clientIdFromUrl) {
                    setSelectedClient(clientIdFromUrl);
                    const client = clients.find(c => c.id === clientIdFromUrl);
                    if (client) {
                        const lockWeek = client.programWeek || 1;
                        const lockSessionIndex = (client.sessionProgress || 1) - 1;
                        setLockedUntil({ week: lockWeek, sessionIndex: lockSessionIndex });
                    }
                }
            } catch (error) {
                console.error("Erreur lors du chargement du programme depuis Supabase:", error);
                addNotification({ message: "Erreur lors du chargement du programme.", type: "error" });
                navigate("/programmes");
            } finally {
                setIsLoading(false);
            }
        };

        const loadSessionFromSupabase = async (sessionId: string) => {
            setIsLoading(true);
            try {
                addNotification({ message: "Chargement de session individuelle non implémenté. Chargez via le programme parent.", type: "warning" });
                navigate("/programmes");

            } catch (error) {
                console.error("Erreur lors du chargement de la session depuis Supabase:", error);
                addNotification({ message: "Erreur lors du chargement de la session.", type: "error" });
                navigate("/programmes");
            } finally {
                setIsLoading(false);
            }
        };

        if (programIdToEdit) {
            loadProgramFromSupabase(programIdToEdit);
        } else if (sessionIdToEdit) {
            loadSessionFromSupabase(sessionIdToEdit);
        } else {
            setIsEditMode(false);
            if (programDraft) {
                setProgramName(programDraft.name);
                setObjective(programDraft.objective);
                setWeekCount(programDraft.weekCount);
                setSessionsByWeek(programDraft.sessionsByWeek);
                if (clientIdFromUrl && clients.some(c => c.id === clientIdFromUrl)) {
                    setSelectedClient(clientIdFromUrl);
                }
                addNotification({ message: "Brouillon chargé depuis le stockage local.", type: "info" });
            } else {
                setProgramName('Nouveau programme');
                setObjective('');
                setWeekCount(1);
                setSessionsByWeek({ 1: JSON.parse(JSON.stringify(initialSessions)) });
            }
            setIsLoading(false);
        }
    }, [searchParams, addNotification, navigate, clients, programDraft, setProgramDraft, setLastSavedAt]);

    // Effect for auto-saving draft to localStorage
    useEffect(() => {
        if (!isLoading && programName && objective && weekCount > 0 && Object.keys(sessionsByWeek).length > 0) {
            const currentProgram: WorkoutProgram = {
                id: editProgramId || `draft-${Date.now()}`,
                name: programName,
                objective: objective,
                weekCount: typeof weekCount === 'number' ? weekCount : 1,
                sessionsByWeek: sessionsByWeek,
                coachId: user?.id || 'unknown',
                clientId: selectedClient === '0' ? null : selectedClient,
            };
            setProgramDraft(currentProgram);
            setHasUnsavedChanges(true);
        }
    }, [programName, objective, weekCount, sessionsByWeek, user, selectedClient, editProgramId, setProgramDraft, isLoading]);

    // Effect to reset hasUnsavedChanges when saving is complete or draft is loaded
    useEffect(() => {
        if (!isSaving && hasUnsavedChanges && lastSavedAt) {
            setHasUnsavedChanges(false);
        }
    }, [isSaving, lastSavedAt, hasUnsavedChanges]);

    const onUpdateExercise = useCallback((exerciseId: number, field: string, value: any, setIndex?: number) => {
        const performUpdate = (sessionsToUpdate: WorkoutSession[]): WorkoutSession[] => {
            return sessionsToUpdate.map(s => {
                if (s.id !== activeSessionId) return s;
                return {
                    ...s,
                    exercises: s.exercises.map(ex => {
                        if (ex.id !== exerciseId) return ex;
                        
                        if (['name', 'exerciseId', 'illustrationUrl'].includes(field)) {
                            const newEx = { ...ex, [field]: value };
                            if (field === 'name') {
                                newEx.exerciseId = '';
                            }
                            return newEx;
                        }
                        
                        if (field === 'sets') {
                            const parsedValue = parseInt(value, 10);
                            const newSets = (value === '' || isNaN(parsedValue) || parsedValue < 0) ? 0 : parsedValue;
                            const safeDetails = ensureDetailsArray(ex.details);
                            const currentSets = safeDetails.length;
                            let newDetails = [...safeDetails];
                            if (newSets > currentSets) {
                                const lastDetail = safeDetails[currentSets - 1] || createDefaultDetail();
                                for(let i=0; i < newSets - currentSets; i++) {
                                    newDetails.push({ ...lastDetail, load: { ...lastDetail.load } });
                                }
                            } else {
                                newDetails = newDetails.slice(0, newSets);
                            }
                            return { ...ex, sets: value, details: newDetails };
                        }
    
                        if (field === 'isDetailed') {
                            return { ...ex, isDetailed: value };
                        }

                        if (field === 'intensification') {
                            return { ...ex, intensification: value === 'Aucune' ? [] : [{ id: 1, value }] };
                        }
                        
                        const updateDetails = (details: WorkoutExercise['details']) => {
                            const newDetails = details.length > 0 ? [...details] : [createDefaultDetail()];
                            const updateSingleDetail = (detail: WorkoutExercise['details'][0]) => {
                                 if (field === 'load.value') return { ...detail, load: { ...detail.load, value: value } };
                                 if (field === 'load.unit') return { ...detail, load: { ...detail.load, unit: value } };
                                 return { ...detail, [field]: value };
                            }
                            if (setIndex !== undefined) {
                                if (newDetails[setIndex]) {
                                    newDetails[setIndex] = updateSingleDetail(newDetails[setIndex]);
                                }
                            } else {
                               return newDetails.map(updateSingleDetail);
                            }
                            return newDetails;
                        }
   
                        const safeDetails = ensureDetailsArray(ex.details, ex.sets);
                        return {...ex, details: updateDetails(safeDetails)};
                    })
                }
            });
        };
        updateContentState(performUpdate);
    }, [activeSessionId, updateContentState]);

    const addExercise = () => {
        if (!activeSession) return;
        const newId = Math.max(0, ...Object.values(sessionsByWeek).flat().flatMap(s => s.exercises).map(e => e.id)) + 1;
        const newExercise: WorkoutExercise = {
            id: newId, exerciseId: '', name: '', illustrationUrl: '', sets: '3', isDetailed: false,
            details: Array.from({ length: 3 }, () => createDefaultDetail()),
            intensification: [], alternatives: []
        };
        updateContentState(currentSessions =>
            currentSessions.map(s => s.id === activeSessionId ? {...s, exercises: [...s.exercises, newExercise]} : s)
        );
    };

    const handleDeleteExercise = (exerciseId: number) => {
        updateContentState(currentSessions =>
            currentSessions.map(s => {
                if (s.id !== activeSessionId) return s;
                return { ...s, exercises: s.exercises.filter(ex => ex.id !== exerciseId) };
            })
        );
    };

    const handleDropExercise = (newExercise: Exercise) => {
        const newId = Math.max(0, ...Object.values(sessionsByWeek).flat().flatMap(s => s.exercises).map(e => e.id)) + 1;
        const exerciseToAdd: WorkoutExercise = {
            id: newId,
            exerciseId: newExercise.id,
            name: newExercise.name,
            illustrationUrl: newExercise.illustrationUrl || '',
            sets: '3',
            isDetailed: false,
            details: [],
            intensification: [],
            alternatives: [],
        };
        updateContentState(currentSessions =>
            currentSessions.map(s => s.id === activeSessionId ? { ...s, exercises: [...s.exercises, exerciseToAdd] } : s)
        );
    };

    const updateContentState = (updater: (sessions: WorkoutSession[]) => WorkoutSession[]) => {
        setSessionsByWeek(prev => ({
            ...prev,
            [selectedWeek]: updater(prev[selectedWeek] || [])
        }));
        setHasUnsavedChanges(true);
    };

    const updateAllWeeksState = (updater: (sessions: WorkoutSession[]) => WorkoutSession[]) => {
        setSessionsByWeek(prev => {
            const newSessionsByWeek = { ...prev };
            Object.keys(newSessionsByWeek).forEach(week => {
                newSessionsByWeek[Number(week)] = updater(newSessionsByWeek[Number(week)]);
            });
            return newSessionsByWeek;
        });
        setHasUnsavedChanges(true);
    };

    const onSave = async () => {
        setIsSaving(true);
        try {
            const programData = mapWorkoutProgramToProgram(programName, objective, weekCount, user.id, selectedClient);
            const savedProgram = editProgramId ? await updateProgram(editProgramId, programData) : await createProgram(programData);

            if (!savedProgram) {
                throw new Error('La sauvegarde du programme a échoué.');
            }

            const sessionPromises = allSessions.map(session => {
                const sessionData = mapWorkoutSessionToSession(session, savedProgram.id);
                return session.dbId ? updateSession(session.dbId, sessionData) : createSession(sessionData);
            });

            const savedSessions = await Promise.all(sessionPromises);

            const exercisePromises = allSessions.flatMap(session => {
                const savedSession = savedSessions.find(s => s.order === session.order && s.program_id === savedProgram.id);
                if (!savedSession) return [];

                return session.exercises.map(exercise => {
                    const exerciseData = mapWorkoutExerciseToSessionExercise(exercise, savedSession.id);
                    return exercise.dbId ? updateSessionExercise(exercise.dbId, exerciseData) : createSessionExercise(exerciseData);
                });
            });

            await Promise.all(exercisePromises);

            setEditProgramId(savedProgram.id);
            setIsEditMode(true);
            setLastSavedAt(new Date().toISOString());
            setHasUnsavedChanges(false);
            addNotification({ message: 'Programme sauvegardé avec succès !', type: 'success' });

        } catch (error) {
            console.error("Erreur lors de la sauvegarde du programme :", error);
            addNotification({ message: 'Erreur lors de la sauvegarde du programme.', type: 'error' });
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="flex h-full bg-gray-100">
            <div className={`transition-all duration-300 ${isFilterSidebarVisible ? 'w-1/4' : 'w-0'} overflow-hidden`}>
                <ExerciseFilterSidebar onDropExercise={handleDropExercise} />
            </div>
            <div className="flex-1 flex flex-col p-6">
                <div className="flex justify-between items-center mb-4">
                    <h1 className="text-2xl font-bold text-gray-800">{programName}</h1>
                    <div className="flex items-center space-x-4">
                        {hasUnsavedChanges && <span className="text-sm text-yellow-600">Modifications non sauvegardées</span>}
                        <Button onClick={onSave} disabled={isSaving}>
                            {isSaving ? 'Sauvegarde...' : 'Sauvegarder le programme'}
                        </Button>
                    </div>
                </div>
                <Card>
                    <div className="p-4">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <Input label="Nom du programme" value={programName} onChange={(e) => setProgramName(e.target.value)} />
                            <Input label="Objectif" value={objective} onChange={(e) => setObjective(e.target.value)} />
                            <Select label="Client" options={clientOptions} value={selectedClient} onChange={handleClientSelectionChange} />
                        </div>
                        <div className="mt-4">
                            <Input label="Nombre de semaines" type="number" value={weekCount} onChange={handleWeekCountChange} onBlur={handleWeekCountBlur} />
                        </div>
                    </div>
                </Card>
                <div className="mt-6 flex-1 flex flex-col">
                    <div className="flex border-b border-gray-200">
                        {Object.keys(sessionsByWeek).map(week => (
                            <button key={week} onClick={() => setSelectedWeek(Number(week))} className={`px-4 py-2 text-sm font-medium ${selectedWeek === Number(week) ? 'border-b-2 border-primary text-primary' : 'text-gray-500 hover:text-gray-700'}`}>
                                Semaine {week}
                            </button>
                        ))}
                    </div>
                    <div className="flex-1 flex mt-4">
                        <div className="w-1/4 pr-4 border-r border-gray-200">
                            <h2 className="text-lg font-semibold mb-4">Séances</h2>
                            {sessions.map(session => (
                                <div key={session.id} onClick={() => setActiveSessionId(session.id)} className={`p-3 rounded-lg cursor-pointer ${activeSessionId === session.id ? 'bg-primary-light text-primary-dark' : 'hover:bg-gray-200'}`}>
                                    {session.name}
                                </div>
                            ))}
                            <Button onClick={addExercise} className="mt-4 w-full">Ajouter une séance</Button>
                        </div>
                        <div className="w-3/4 pl-4">
                            <h2 className="text-lg font-semibold mb-4">{activeSession?.name}</h2>
                            {activeSession?.exercises.map(ex => (
                                <div key={ex.id} className="mb-4 p-4 border rounded-lg bg-white">
                                    <div className="flex justify-between items-center">
                                        <h3 className="font-semibold">{ex.name}</h3>
                                        <Button variant="danger" size="sm" onClick={() => handleDeleteExercise(ex.id)}>Supprimer</Button>
                                    </div>
                                    <div className="mt-2 grid grid-cols-5 gap-4">
                                        <Input label="Séries" value={ex.sets} onChange={e => onUpdateExercise(ex.id, 'sets', e.target.value)} />
                                        <Input label="Reps" value={(ex.details[0] as any)?.reps || ''} onChange={e => onUpdateExercise(ex.id, 'reps', e.target.value)} />
                                        <Input label="Charge" value={(ex.details[0] as any)?.load?.value || ''} onChange={e => onUpdateExercise(ex.id, 'load.value', e.target.value)} />
                                        <Input label="Tempo" value={(ex.details[0] as any)?.tempo || ''} onChange={e => onUpdateExercise(ex.id, 'tempo', e.target.value)} />
                                        <Input label="Repos" value={(ex.details[0] as any)?.rest || ''} onChange={e => onUpdateExercise(ex.id, 'rest', e.target.value)} />
                                    </div>
                                </div>
                            ))}
                            <Button onClick={addExercise} className="mt-4">Ajouter un exercice</Button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default WorkoutBuilder;

'''
