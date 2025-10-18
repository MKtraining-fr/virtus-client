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
import { Program, Session, SessionExercise } from '../services/programService';
import {
    FolderIcon, EllipsisHorizontalIcon, PlusIcon, DocumentDuplicateIcon, TrashIcon, XMarkIcon,
    ChevronDoubleRightIcon, ChevronUpIcon, ListBulletIcon, LockClosedIcon
} from '../constants/icons.ts';


const initialSessions: WorkoutSession[] = [{ id: 1, name: 'Séance 1', exercises: [] }];

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
    const { user, clients, exercises: exerciseDBFromAuth, setClients, addNotification } = useAuth();
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
        console.log('sessionsByWeek:', sessionsByWeek);
        console.log('selectedWeek:', selectedWeek);
        return sessionsByWeek[selectedWeek] || [];
    }, [sessionsByWeek, selectedWeek]);
    const allSessions = useMemo(() => {
        console.log('sessionsByWeek for allSessions:', sessionsByWeek);
        // Ensure sessionsByWeek is an object before calling Object.values
        if (!sessionsByWeek || typeof sessionsByWeek !== 'object') {
            return [];
        }
        return Object.values(sessionsByWeek).flat();
    }, [sessionsByWeek]);
    const activeSession = useMemo(() => {
        console.log('sessions for activeSession:', sessions);
        console.log('activeSessionId:', activeSessionId);
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
                    allSessionExercises.set(session.id, exercises || []); // Ensure exercises is an array
                    exercises.forEach(ex => {
                        if (ex.exercise_id) exerciseIds.add(ex.exercise_id);
                    });
                }

                const exerciseDetails = exerciseIds.size > 0 ? await getExercisesByIds(Array.from(exerciseIds)) : [];
                const exerciseNamesMap = new Map<string, { name: string; illustrationUrl: string }>();
                exerciseDetails.forEach(ex => exerciseNamesMap.set(ex.id, { name: ex.name, illustrationUrl: ex.illustration_url || '' }));

                console.log('Reconstructing workout program with sessions:', sessions);
                const workoutProgram = reconstructWorkoutProgram(program, sessions || [], allSessionExercises, exerciseNamesMap);

                setProgramName(workoutProgram.name || program.name);
                setObjective(workoutProgram.objective || program.objective || "");
                setWeekCount(workoutProgram.weekCount || program.week_count);
                setSessionsByWeek(workoutProgram.sessionsByWeek || {});
                setEditProgramId(programId);
                setIsEditMode(true);
                setProgramDraft(workoutProgram); // Save to draft on load
                setLastSavedAt(new Date().toISOString());

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
                // Logic to load a single session and convert it into a single-week program
                // This part needs to be implemented based on how individual sessions are stored/retrieved
                // For now, let's assume we can get the session and its exercises directly
                // This might involve fetching the session itself and then its exercises

                // Placeholder for session loading logic
                // Example: const sessionData = await getSessionById(sessionId);
                // Then reconstruct a WorkoutProgram for a single session

                addNotification({ message: "Chargement de session individuelle non implémenté. Chargez via le programme parent.", type: "warning" });
                navigate("/programmes"); // Redirect for now as direct session loading is complex

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
            // No program or session ID in URL, load from draft or initial state
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
            // This means a save operation just completed, so changes are now saved
            setHasUnsavedChanges(false);
        }
    }, [isSaving, lastSavedAt, hasUnsavedChanges]);

    const handleAddWeek = () => {
        setSessionsByWeek(prev => ({
            ...prev,
            [Object.keys(prev).length + 1]: JSON.parse(JSON.stringify(initialSessions))
        }));
        setHasUnsavedChanges(true);
    };

    const handleRemoveWeek = (weekNumber: number) => {
        if (Object.keys(sessionsByWeek).length <= 1) {
            addNotification({ message: "Impossible de supprimer la dernière semaine.", type: "error" });
            return;
        }
        setSessionsByWeek(prev => {
            const newSessionsByWeek = { ...prev };
            delete newSessionsByWeek[weekNumber];
            // Re-index weeks if necessary, or just leave as is if keys are not strictly sequential
            return newSessionsByWeek;
        });
        setSelectedWeek(prev => (prev === weekNumber ? 1 : prev)); // Go to week 1 if current week is deleted
        setHasUnsavedChanges(true);
    };

    const handleAddSession = (weekNumber: number) => {
        setSessionsByWeek(prev => {
            const newSessions = prev[weekNumber] ? [...prev[weekNumber]] : [];
            const newSessionId = newSessions.length > 0 ? Math.max(...newSessions.map(s => s.id)) + 1 : 1;
            newSessions.push({ id: newSessionId, name: `Séance ${newSessionId}`, exercises: [] });
            return {
                ...prev,
                [weekNumber]: newSessions
            };
        });
        setHasUnsavedChanges(true);
    };

    const handleRemoveSession = (weekNumber: number, sessionId: number) => {
        if (sessionsByWeek[weekNumber]?.length <= 1) {
            addNotification({ message: "Impossible de supprimer la dernière séance de la semaine.", type: "error" });
            return;
        }
        setSessionsByWeek(prev => {
            const newSessionsByWeek = { ...prev };
            newSessionsByWeek[weekNumber] = newSessionsByWeek[weekNumber].filter(s => s.id !== sessionId);
            return newSessionsByWeek;
        });
        if (activeSessionId === sessionId) {
            setActiveSessionId(sessionsByWeek[weekNumber][0]?.id || 1); // Set active to first session of the week
        }
        setHasUnsavedChanges(true);
    };

    const handleUpdateSessionName = (weekNumber: number, sessionId: number, newName: string) => {
        setSessionsByWeek(prev => {
            const newSessionsByWeek = { ...prev };
            newSessionsByWeek[weekNumber] = newSessionsByWeek[weekNumber].map(s => 
                s.id === sessionId ? { ...s, name: newName } : s
            );
            return newSessionsByWeek;
        });
        setHasUnsavedChanges(true);
    };

    const handleAddExercise = (sessionId: number, exercise: Exercise) => {
        setSessionsByWeek(prev => {
            const newSessionsByWeek = { ...prev };
            newSessionsByWeek[selectedWeek] = newSessionsByWeek[selectedWeek].map(s => 
                s.id === sessionId
                    ? { 
                        ...s, 
                        exercises: [...s.exercises, { 
                            id: s.exercises.length > 0 ? Math.max(...s.exercises.map(ex => ex.id)) + 1 : 1, 
                            exerciseId: exercise.id, 
                            name: exercise.name,
                            illustrationUrl: exercise.illustrationUrl,
                            sets: 3, 
                            reps: 10, 
                            rpe: 7, 
                            tempo: '2-0-X-0', 
                            rest: 60, 
                            notes: '' 
                        }]
                    }
                    : s
            );
            return newSessionsByWeek;
        });
        setHasUnsavedChanges(true);
    };

    const handleUpdateExercise = (sessionId: number, exerciseId: number, updatedFields: Partial<WorkoutExercise>) => {
        setSessionsByWeek(prev => {
            const newSessionsByWeek = { ...prev };
            newSessionsByWeek[selectedWeek] = newSessionsByWeek[selectedWeek].map(s => 
                s.id === sessionId
                    ? { 
                        ...s, 
                        exercises: s.exercises.map(ex => 
                            ex.id === exerciseId ? { ...ex, ...updatedFields } : ex
                        )
                    }
                    : s
            );
            return newSessionsByWeek;
        });
        setHasUnsavedChanges(true);
    };

    const handleRemoveExercise = (sessionId: number, exerciseId: number) => {
        setSessionsByWeek(prev => {
            const newSessionsByWeek = { ...prev };
            newSessionsByWeek[selectedWeek] = newSessionsByWeek[selectedWeek].map(s => 
                s.id === sessionId
                    ? { ...s, exercises: s.exercises.filter(ex => ex.id !== exerciseId) }
                    : s
            );
            return newSessionsByWeek;
        });
        setHasUnsavedChanges(true);
    };

    const handleDuplicateExercise = (sessionId: number, exerciseToDuplicate: WorkoutExercise) => {
        setSessionsByWeek(prev => {
            const newSessionsByWeek = { ...prev };
            newSessionsByWeek[selectedWeek] = newSessionsByWeek[selectedWeek].map(s => {
                if (s.id === sessionId) {
                    const newExercises = [...s.exercises];
                    const newExerciseId = newExercises.length > 0 ? Math.max(...newExercises.map(ex => ex.id)) + 1 : 1;
                    newExercises.splice(s.exercises.indexOf(exerciseToDuplicate) + 1, 0, { ...exerciseToDuplicate, id: newExerciseId });
                    return { ...s, exercises: newExercises };
                }
                return s;
            });
            return newSessionsByWeek;
        });
        setHasUnsavedChanges(true);
    };

    const handleMoveExercise = (sessionId: number, fromIndex: number, toIndex: number) => {
        setSessionsByWeek(prev => {
            const newSessionsByWeek = { ...prev };
            newSessionsByWeek[selectedWeek] = newSessionsByWeek[selectedWeek].map(s => {
                if (s.id === sessionId) {
                    const newExercises = [...s.exercises];
                    const [movedExercise] = newExercises.splice(fromIndex, 1);
                    newExercises.splice(toIndex, 0, movedExercise);
                    return { ...s, exercises: newExercises };
                }
                return s;
            });
            return newSessionsByWeek;
        });
        setHasUnsavedChanges(true);
    };

    const handleDragStart = useCallback((e: React.DragEvent, position: number) => {
        exerciseDragItem.current = position;
    }, []);

    const handleDragEnter = useCallback((e: React.DragEvent, position: number) => {
        exerciseDragOverItem.current = position;
    }, []);

    const handleDrop = useCallback((sessionId: number) => {
        if (exerciseDragItem.current !== null && exerciseDragOverItem.current !== null) {
            handleMoveExercise(sessionId, exerciseDragItem.current, exerciseDragOverItem.current);
            exerciseDragItem.current = null;
            exerciseDragOverItem.current = null;
        }
    }, [handleMoveExercise]);

    const handleSessionDragStart = useCallback((e: React.DragEvent, sessionId: number) => {
        sessionDragItem.current = sessionId;
    }, []);

    const handleSessionDragEnter = useCallback((e: React.DragEvent, sessionId: number) => {
        sessionDragOverItem.current = sessionId;
    }, []);

    const handleSessionDrop = useCallback(() => {
        if (sessionDragItem.current !== null && sessionDragOverItem.current !== null) {
            setSessionsByWeek(prev => {
                const newSessions = [...prev[selectedWeek]];
                const fromIndex = newSessions.findIndex(s => s.id === sessionDragItem.current);
                const toIndex = newSessions.findIndex(s => s.id === sessionDragOverItem.current);

                if (fromIndex !== -1 && toIndex !== -1) {
                    const [movedSession] = newSessions.splice(fromIndex, 1);
                    newSessions.splice(toIndex, 0, movedSession);
                }
                return { ...prev, [selectedWeek]: newSessions };
            });
            setHasUnsavedChanges(true);
            sessionDragItem.current = null;
            sessionDragOverItem.current = null;
        }
    }, [selectedWeek]);

    const onSave = async () => {
        if (!user?.id) {
            addNotification({ message: "Vous devez être connecté pour sauvegarder un programme.", type: "error" });
            return;
        }

        setIsSaving(true);
        try {
            const programToSave: WorkoutProgram = {
                id: editProgramId || `program-${Date.now()}`,
                name: programName,
                objective: objective,
                weekCount: typeof weekCount === 'number' ? weekCount : 1,
                sessionsByWeek: sessionsByWeek,
                coachId: user.id,
                clientId: selectedClient === '0' ? null : selectedClient,
            };

            if (isEditMode && editProgramId) {
                // Update existing program
                await updateProgram(editProgramId, programToSave);
                addNotification({ message: "Programme mis à jour avec succès !", type: "success" });
            } else {
                // Create new program
                const newProgramId = await createProgram(programToSave);
                setEditProgramId(newProgramId); // Set the new ID for future updates
                setIsEditMode(true);
                addNotification({ message: "Programme créé avec succès !", type: "success" });
            }
            setProgramDraft(null); // Clear draft after successful save
            setLastSavedAt(new Date().toISOString());
            setHasUnsavedChanges(false);
        } catch (error) {
            console.error("Erreur lors de la sauvegarde du programme:", error);
            addNotification({ message: "Erreur lors de la sauvegarde du programme.", type: "error" });
        } finally {
            setIsSaving(false);
        }
    };

    if (isLoading) {
        return (
            <div className="flex justify-center items-center h-screen">
                <p className="text-gray-600 text-lg">Chargement du programme...</p>
            </div>
        );
    }

    return (
        <div className="flex h-full bg-gray-100">
            {/* Sidebar */}
            <div className={`bg-white shadow-lg p-6 flex flex-col transition-all duration-300 ease-in-out ${isFilterSidebarVisible ? 'w-80' : 'w-20'} overflow-hidden`}>
                <button 
                    onClick={() => setIsFilterSidebarVisible(!isFilterSidebarVisible)}
                    className="p-2 rounded-full hover:bg-gray-200 self-end mb-4"
                    title={isFilterSidebarVisible ? "Masquer la barre latérale" : "Afficher la barre latérale"}
                >
                    <ChevronDoubleRightIcon className={`h-5 w-5 text-gray-600 ${isFilterSidebarVisible ? '' : 'rotate-180'}`} />
                </button>
                {isFilterSidebarVisible ? (
                    <ExerciseFilterSidebar
                        availableExercises={availableExercises}
                        onAddExercise={(exercise) => activeSession && handleAddExercise(activeSession.id, exercise)}
                        selectedExerciseIds={selectedExerciseIds}
                        setSelectedExerciseIds={setSelectedExerciseIds}
                        draggedOverExerciseId={draggedOverExerciseId}
                        setDraggedOverExerciseId={setDraggedOverExerciseId}
                        activeSearchBox={activeSearchBox}
                        setActiveSearchBox={setActiveSearchBox}
                    />
                ) : (
                    <div className="flex flex-col items-center justify-center h-full">
                        <ListBulletIcon className="h-8 w-8 text-gray-400 mb-2" />
                        <p className="text-sm text-gray-500 text-center">Filtres</p>
                    </div>
                )}
            </div>

            {/* Main Content */}
            <div className="flex-1 flex flex-col p-8 overflow-auto">
                <div className="flex justify-between items-center mb-6">
                    <h1 className="text-3xl font-bold text-gray-800">{programName}</h1>
                    <div className="flex items-center space-x-4">
                        {hasUnsavedChanges && (
                            <span className="text-sm text-yellow-600 flex items-center">
                                <span className="relative flex h-2 w-2 mr-2">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-yellow-400 opacity-75"></span>
                                    <span className="relative inline-flex rounded-full h-2 w-2 bg-yellow-500"></span>
                                </span>
                                Modifications non sauvegardées
                            </span>
                        )}
                        <Button onClick={onSave} disabled={isSaving || !hasUnsavedChanges}>
                            {isSaving ? 'Sauvegarde...' : 'Sauvegarder le programme'}
                        </Button>
                    </div>
                </div>

                {/* General Info */}
                <div className="bg-white rounded-lg shadow p-6 mb-6">
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="text-xl font-semibold text-gray-800">Informations générales</h2>
                        <button onClick={() => setIsGeneralInfoVisible(!isGeneralInfoVisible)} className="text-primary hover:text-primary-dark">
                            {isGeneralInfoVisible ? 'Masquer' : 'Afficher'}
                        </button>
                    </div>
                    {isGeneralInfoVisible && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <Input
                                label="Nom du programme"
                                value={programName}
                                onChange={(e) => { setProgramName(e.target.value); setHasUnsavedChanges(true); }}
                                placeholder="Ex: Programme Prise de Masse"
                            />
                            <Input
                                label="Objectif"
                                value={objective}
                                onChange={(e) => { setObjective(e.target.value); setHasUnsavedChanges(true); }}
                                placeholder="Ex: Développer la masse musculaire"
                            />
                             <Input
                                label="Nombre de semaines"
                                type="number"
                                value={weekCount}
                                onChange={handleWeekCountChange}
                                onBlur={handleWeekCountBlur}
                                min="1"
                                max="52"
                            />
                             {user?.role === 'coach' && ( // Only show client selector for coaches
                                <Select
                                    label="Assigner à un client"
                                    value={selectedClient}
                                    onChange={handleClientSelectionChange}
                                    options={clientOptions.map(c => ({ value: c.id, label: c.name }))}
                                />
                            )}
                        </div>
                    )}
                </div>

                {/* Week Navigation */}
                <div className="flex space-x-2 mb-6 overflow-x-auto pb-2">
                    {Object.keys(sessionsByWeek).map(weekNum => (
                        <Button
                            key={weekNum}
                            variant={selectedWeek === parseInt(weekNum) ? 'primary' : 'secondary'}
                            onClick={() => setSelectedWeek(parseInt(weekNum))}
                            className="flex-shrink-0"
                        >
                            Semaine {weekNum}
                        </Button>
                    ))}
                    <Button onClick={handleAddWeek} variant="secondary" className="flex-shrink-0">
                        <PlusIcon className="h-4 w-4 mr-2" /> Ajouter Semaine
                    </Button>
                    {Object.keys(sessionsByWeek).length > 1 && (
                        <Button onClick={() => handleRemoveWeek(selectedWeek)} variant="danger" className="flex-shrink-0">
                            <TrashIcon className="h-4 w-4 mr-2" /> Supprimer Semaine {selectedWeek}
                        </Button>
                    )}
                </div>

                {/* Sessions for selected week */}
                <div className="flex-1 bg-white rounded-lg shadow p-6">
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="text-xl font-semibold text-gray-800">Semaine {selectedWeek}</h2>
                        <div className="flex space-x-2">
                            <Button onClick={() => handleAddSession(selectedWeek)} variant="secondary">
                                <PlusIcon className="h-4 w-4 mr-2" /> Ajouter Séance
                            </Button>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {sessions.length === 0 ? (
                            <p className="text-gray-500">Aucune séance pour cette semaine. Ajoutez-en une !</p>
                        ) : (
                            sessions.map((session, index) => (
                                <Card 
                                    key={session.id} 
                                    className={`relative flex flex-col ${activeSessionId === session.id ? 'border-primary-dark border-2' : ''}`}
                                    draggable={true}
                                    onDragStart={(e) => handleSessionDragStart(e, session.id)}
                                    onDragEnter={(e) => handleSessionDragEnter(e, session.id)}
                                    onDragEnd={handleSessionDrop}
                                    onDragOver={(e) => e.preventDefault()}
                                >
                                    {lockedUntil && lockedUntil.week === selectedWeek && lockedUntil.sessionIndex >= index && (
                                        <div className="absolute inset-0 bg-gray-200 bg-opacity-75 flex items-center justify-center z-10 rounded-lg">
                                            <LockClosedIcon className="h-8 w-8 text-gray-600" />
                                            <span className="ml-2 text-gray-700 font-medium">Verrouillé</span>
                                        </div>
                                    )}
                                    <div className="p-4 border-b border-gray-200 flex justify-between items-center">
                                        <Input
                                            type="text"
                                            value={session.name}
                                            onChange={(e) => handleUpdateSessionName(selectedWeek, session.id, e.target.value)}
                                            className="text-lg font-semibold border-none focus:ring-0 p-0"
                                            disabled={lockedUntil && lockedUntil.week === selectedWeek && lockedUntil.sessionIndex >= index}
                                        />
                                        <div className="flex space-x-2">
                                            <Button 
                                                variant="secondary" 
                                                size="sm" 
                                                onClick={() => setActiveSessionId(session.id)}
                                                disabled={lockedUntil && lockedUntil.week === selectedWeek && lockedUntil.sessionIndex >= index}
                                            >
                                                <ChevronDoubleRightIcon className="h-4 w-4" />
                                            </Button>
                                            <Button 
                                                variant="danger" 
                                                size="sm" 
                                                onClick={() => handleRemoveSession(selectedWeek, session.id)}
                                                disabled={lockedUntil && lockedUntil.week === selectedWeek && lockedUntil.sessionIndex >= index}
                                            >
                                                <TrashIcon className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </div>
                                    <div className="p-4 flex-grow">
                                        {session.exercises.length === 0 ? (
                                            <p className="text-gray-500 text-sm">Glissez-déposez des exercices ici ou utilisez le panneau latéral.</p>
                                        ) : (
                                            <ul className="space-y-3">
                                                {session.exercises.map((exercise, exIndex) => (
                                                    <li
                                                        key={exercise.id}
                                                        className={`bg-gray-50 p-3 rounded-md border border-gray-200 flex items-center justify-between ${exerciseDragItem.current === exIndex ? 'opacity-50' : ''}`}
                                                        draggable={!(lockedUntil && lockedUntil.week === selectedWeek && lockedUntil.sessionIndex >= index)}
                                                        onDragStart={(e) => handleDragStart(e, exIndex)}
                                                        onDragEnter={(e) => handleDragEnter(e, exIndex)}
                                                        onDragEnd={() => handleDrop(session.id)}
                                                        onDragOver={(e) => e.preventDefault()}
                                                    >
                                                        <div className="flex-grow">
                                                            <p className="font-medium text-gray-800">{exercise.name}</p>
                                                            <p className="text-sm text-gray-600">{exercise.sets} séries de {exercise.reps} reps</p>
                                                        </div>
                                                        <div className="flex space-x-1">
                                                            <Button variant="ghost" size="sm" onClick={() => handleDuplicateExercise(session.id, exercise)}><DocumentDuplicateIcon className="h-4 w-4" /></Button>
                                                            <Button variant="ghost" size="sm" onClick={() => handleRemoveExercise(session.id, exercise.id)}><TrashIcon className="h-4 w-4" /></Button>
                                                            <Button variant="ghost" size="sm" onClick={() => { setActiveSearchBox({ sessionId: session.id, exerciseId: exercise.id }); setSelectedExerciseIds([exercise.exerciseId]); }}>
                                                                <EllipsisHorizontalIcon className="h-4 w-4" />
                                                            </Button>
                                                        </div>
                                                    </li>
                                                ))}
                                            </ul>
                                        )}
                                    </div>
                                </Card>
                            ))
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default WorkoutBuilder;

// Hook to fetch and process programs/sessions from Supabase
const useSupabaseWorkoutData = (coachId: string | undefined, addNotification: any) => {
    const [programs, setPrograms] = useState<WorkoutProgram[]>([]);
    const [sessions, setSessions] = useState<WorkoutSession[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchProgramsAndSessions = async () => {
            if (!coachId) {
                setIsLoading(false);
                return;
            }
            setIsLoading(true);
            try {
                const supabasePrograms = await getProgramsByCoachId(coachId);
                const allWorkoutPrograms: WorkoutProgram[] = [];
                const allWorkoutSessions: WorkoutSession[] = [];

                for (const program of supabasePrograms) {
                    const supabaseSessions = await getSessionsByProgramId(program.id);
                    const allSessionExercises: Map<string, SupabaseSessionExercise[]> = new Map();
                    const exerciseIds = new Set<string>();

                    for (const session of supabaseSessions) {
                        const exercises = await getSessionExercisesBySessionId(session.id);
                        allSessionExercises.set(session.id, exercises);
                        exercises.forEach(ex => {
                            if (ex.exercise_id) exerciseIds.add(ex.exercise_id);
                        });
                    }

                    const exerciseDetails = exerciseIds.size > 0 ? await getExercisesByIds(Array.from(exerciseIds)) : [];
                    const exerciseNamesMap = new Map<string, { name: string; illustrationUrl: string }>();
                    exerciseDetails.forEach(ex => exerciseNamesMap.set(ex.id, { name: ex.name, illustrationUrl: ex.illustration_url || '' }));

                    const workoutProgram = reconstructWorkoutProgram(program, supabaseSessions, allSessionExercises, exerciseNamesMap);
                    allWorkoutPrograms.push(workoutProgram);

                    Object.values(workoutProgram.sessionsByWeek).forEach(weekSessions => {
                        allWorkoutSessions.push(...weekSessions);
                    });
                }
                setPrograms(allWorkoutPrograms);
                setSessions(allWorkoutSessions);
            } catch (error) {
                console.error("Erreur lors du chargement des programmes/sessions depuis Supabase:", error);
                addNotification({ message: "Erreur lors du chargement des programmes et sessions.", type: "error" });
            } finally {
                setIsLoading(false);
            }
        };

        fetchProgramsAndSessions();
    }, [coachId, addNotification]);

    return { programs, sessions, isLoading };
};
