import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import Card from '../components/Card.tsx';
import Input from '../components/Input.tsx';
import Select from '../components/Select.tsx';
import Button from '../components/Button.tsx';
import ToggleSwitch from '../components/ToggleSwitch.tsx';
import ExerciseFilterSidebar from '../components/ExerciseFilterSidebar.tsx';
import {
    Exercise,
    WorkoutExercise,
    WorkoutProgram,
    WorkoutSession,
    Client,
    Program as SupabaseProgram,
    Session as SupabaseSession,
    SessionExercise as SupabaseSessionExercise,
} from '../types.ts';
import { useLocalStorage } from '../hooks/useLocalStorage.ts';
import { reconstructWorkoutProgram } from '../utils/workoutMapper.ts';
import {
    createProgram,
    updateProgram,
    getProgramById,
    getSessionsByProgramId,
    getSessionExercisesBySessionId,
    deleteSession,
    createSession,
    createSessionExercise,
    getExercisesByIds,
    updateSession,
    updateSessionExercise,
    deleteSessionExercise,
} from '../services/programService.ts';
import ClientHistoryModal from '../components/ClientHistoryModal.tsx';
import { useAuth } from '../context/AuthContext.tsx';
import { FolderIcon, PlusIcon, TrashIcon, XMarkIcon, DocumentDuplicateIcon, EllipsisHorizontalIcon, ChevronDoubleRightIcon, ChevronUpIcon, ListBulletIcon, LockClosedIcon } from '../constants/icons.ts';

type EditableWorkoutExercise = WorkoutExercise & {
    dbId?: string;
    notes?: string | null;
};

type EditableWorkoutSession = WorkoutSession & {
    dbId?: string;
    weekNumber?: number;
    exercises: EditableWorkoutExercise[];
};

type SessionsByWeekState = Record<number, EditableWorkoutSession[]>;

const DEFAULT_SESSION: EditableWorkoutSession = {
    id: 1,
    name: 'Séance 1',
    exercises: [],
};

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
        if (!Number.isNaN(parsedSets) && parsedSets <= 0) {
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

const cloneExercise = (
    exercise: EditableWorkoutExercise,
    nextId: number
): EditableWorkoutExercise => ({
    ...exercise,
    id: nextId,
    dbId: undefined,
    details: ensureDetailsArray(exercise.details, exercise.sets).map(detail => ({
        reps: detail.reps,
        load: { ...detail.load },
        tempo: detail.tempo,
        rest: detail.rest,
    })),
    intensification: Array.isArray(exercise.intensification)
        ? exercise.intensification.map(item => ({ ...item }))
        : [],
    alternatives: Array.isArray(exercise.alternatives)
        ? exercise.alternatives.map(alternative => ({ ...alternative }))
        : [],
});

const sanitizeSessionsByWeek = (state: SessionsByWeekState): Record<number, WorkoutSession[]> => {
    const sanitized: Record<number, WorkoutSession[]> = {};
    Object.entries(state).forEach(([weekKey, sessions]) => {
        sanitized[Number(weekKey)] = sessions.map(session => ({
            id: session.id,
            name: session.name,
            exercises: session.exercises.map(exercise => ({
                id: exercise.id,
                exerciseId: exercise.exerciseId,
                name: exercise.name,
                illustrationUrl: exercise.illustrationUrl,
                sets: exercise.sets,
                isDetailed: exercise.isDetailed,
                details: ensureDetailsArray(exercise.details, exercise.sets),
                intensification: exercise.intensification ?? [],
                alternatives: exercise.alternatives ?? [],
            })),
        }));
    });
    return sanitized;
};

const getLatestNote = (notes?: string | null): { display: string; full: string | null } => {
    if (!notes || !notes.trim()) {
        return { display: '-', full: null };
    }
    const firstNoteEntry = notes.split(/\n\n(?=---)/)[0];
    const match = firstNoteEntry.match(/--- .*? ---\n(.*)/s);
    const text = match && match[1] ? match[1].trim() : firstNoteEntry.trim();
    const display = text.split('\n')[0];
    return { display, full: text };
};

const getNextSessionId = (state: SessionsByWeekState): number => {
    const allSessions = Object.values(state).flat();
    if (allSessions.length === 0) {
        return 1;
    }
    return Math.max(...allSessions.map(session => session.id)) + 1;
};

const getNextExerciseId = (state: SessionsByWeekState): number => {
    const allExercises = Object.values(state).flatMap(sessionArray =>
        sessionArray.flatMap(session => session.exercises)
    );
    if (allExercises.length === 0) {
        return 1;
    }
    return Math.max(...allExercises.map(exercise => exercise.id)) + 1;
};

interface WorkoutBuilderProps {
  mode?: 'coach' | 'client';
}

const WorkoutBuilder: React.FC<WorkoutBuilderProps> = ({ mode = 'coach' }) => {
    const {
        user,
        clients,
        exercises: exerciseDBFromAuth,
        programs,
        setPrograms,
        sessions: storedSessions,
        setSessions: setStoredSessions,
        addNotification,
    } = useAuth();
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();

    const [programDraft, setProgramDraft] = useLocalStorage<WorkoutProgram | null>('workout_draft', null);
    const [lastSavedAt, setLastSavedAt] = useLocalStorage<string | null>('last_saved_at', null);

    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
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
            if (!Number.isNaN(num) && num >= 1) {
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
    const [isEditMode, setIsEditMode] = useState(false);
    const [editProgramId, setEditProgramId] = useState<string | null>(null);
    const [lockedUntil, setLockedUntil] = useState<{ week: number; sessionIndex: number } | null>(null);

    const clientData = useMemo(() => {
        if (selectedClient === '0') return null;
        return clients.find(c => c.id === selectedClient);
    }, [selectedClient, clients]);
    
    const [sessionsByWeek, setSessionsByWeek] = useState<SessionsByWeekState>(() => {
        const initial = programDraft?.sessionsByWeek;
        if (initial && typeof initial === 'object' && Object.keys(initial).length > 0) {
            return initial as SessionsByWeekState;
        }
        return { 1: [DEFAULT_SESSION] };
    });
    const [selectedWeek, setSelectedWeek] = useState<number>(1);
    const [activeSessionId, setActiveSessionId] = useState(DEFAULT_SESSION.id);
    
    const [draggedOverExerciseId, setDraggedOverExerciseId] = useState<number | null>(null);
    const [activeSearchBox, setActiveSearchBox] = useState<{ sessionId: number; exerciseId: number } | null>(null);
    const [selectedExerciseIds, setSelectedExerciseIds] = useState<number[]>([]);

    const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
    const [isHistoryModalMinimized, setIsHistoryModalMinimized] = useState(false);


    const exerciseDragItem = useRef<number | null>(null);
    const exerciseDragOverItem = useRef<number | null>(null);
    const sessionDragItem = useRef<number | null>(null);
    const sessionDragOverItem = useRef<number | null>(null);

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
                setSessionsByWeek(reconstructedProgram.sessionsByWeek as SessionsByWeekState);
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
                setSessionsByWeek(programDraft.sessionsByWeek as SessionsByWeekState);
                if (clientIdFromUrl && clients.some(c => c.id === clientIdFromUrl)) {
                    setSelectedClient(clientIdFromUrl);
                }
                addNotification({ message: "Brouillon chargé depuis le stockage local.", type: "info" });
            } else {
                setProgramName('Nouveau programme');
                setObjective('');
                setWeekCount(1);
                setSessionsByWeek({ 1: [DEFAULT_SESSION] });
            }
            setIsLoading(false);
        }
    }, [searchParams, addNotification, navigate, clients, programDraft, setProgramDraft, setLastSavedAt]);

    useEffect(() => {
        if (!isLoading && programName && objective && weekCount > 0 && Object.keys(sessionsByWeek).length > 0) {
            const currentProgram: WorkoutProgram = {
                id: editProgramId || `draft-${Date.now()}`,
                name: programName,
                objective: objective,
                weekCount: typeof weekCount === 'number' ? weekCount : 1,
                sessionsByWeek: sanitizeSessionsByWeek(sessionsByWeek),
                coachId: user?.id || 'unknown',
                clientId: selectedClient === '0' ? null : selectedClient,
            };
            setProgramDraft(currentProgram);
            setHasUnsavedChanges(true);
        }
    }, [programName, objective, weekCount, sessionsByWeek, user, selectedClient, editProgramId, setProgramDraft, isLoading]);

    useEffect(() => {
        if (!isSaving && hasUnsavedChanges && lastSavedAt) {
            setHasUnsavedChanges(false);
        }
    }, [isSaving, lastSavedAt, hasUnsavedChanges]);

    const onUpdateExercise = useCallback((exerciseId: number, field: string, value: any, setIndex?: number) => {
        const performUpdate = (sessionsToUpdate: EditableWorkoutSession[]): EditableWorkoutSession[] => {
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
                            const newSets = (value === '' || Number.isNaN(parsedValue) || parsedValue < 0) ? 0 : parsedValue;
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
        setSessionsByWeek(prev => ({
            ...prev,
            [selectedWeek]: performUpdate(prev[selectedWeek] || [])
        }));
        setHasUnsavedChanges(true);
    }, [activeSessionId, selectedWeek]);

    const addExercise = () => {
        if (!activeSession) return;
        const newId = getNextExerciseId(sessionsByWeek);
        const newExercise: EditableWorkoutExercise = {
            id: newId, exerciseId: '', name: '', illustrationUrl: '', sets: '3', isDetailed: false,
            details: [],
            intensification: [], alternatives: []
        };
        setSessionsByWeek(prev => ({
            ...prev,
            [selectedWeek]: prev[selectedWeek].map(s => s.id === activeSessionId ? {...s, exercises: [...s.exercises, newExercise]} : s)
        }));
        setHasUnsavedChanges(true);
    };

    const handleDeleteExercise = (exerciseId: number) => {
        setSessionsByWeek(prev => ({
            ...prev,
            [selectedWeek]: prev[selectedWeek].map(s => {
                if (s.id !== activeSessionId) return s;
                return { ...s, exercises: s.exercises.filter(ex => ex.id !== exerciseId) };
            })
        }));
        setHasUnsavedChanges(true);
    };

    const handleDropExercise = (newExercise: Exercise) => {
        const newId = getNextExerciseId(sessionsByWeek);
        const exerciseToAdd: EditableWorkoutExercise = {
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
        setSessionsByWeek(prev => ({
            ...prev,
            [selectedWeek]: prev[selectedWeek].map(s => s.id === activeSessionId ? { ...s, exercises: [...s.exercises, exerciseToAdd] } : s)
        }));
        setHasUnsavedChanges(true);
    };

    const handleDragStart = useCallback((e: React.DragEvent, exerciseId: number) => {
        exerciseDragItem.current = exerciseId;
    }, []);

    const handleDragEnter = useCallback((e: React.DragEvent, exerciseId: number) => {
        exerciseDragOverItem.current = exerciseId;
    }, []);

    const handleDrop = useCallback(() => {
        const draggedExerciseId = exerciseDragItem.current;
        const droppedOnExerciseId = exerciseDragOverItem.current;

        if (draggedExerciseId === null || droppedOnExerciseId === null) return;

        setSessionsByWeek(prev => {
            const newSessionsByWeek = { ...prev };
            const currentSessions = newSessionsByWeek[selectedWeek];

            if (!currentSessions) return prev;

            const newSessions = currentSessions.map(s => {
                if (s.id !== activeSessionId) return s;

                let exercises = [...s.exercises];
                const draggedIndex = exercises.findIndex(ex => ex.id === draggedExerciseId);
                const droppedIndex = exercises.findIndex(ex => ex.id === droppedOnExerciseId);

                if (draggedIndex === -1 || droppedIndex === -1) return s;

                const [reorderedItem] = exercises.splice(draggedIndex, 1);
                exercises.splice(droppedIndex, 0, reorderedItem);

                return { ...s, exercises };
            });

            return { ...newSessionsByWeek, [selectedWeek]: newSessions };
        });
        setHasUnsavedChanges(true);
        exerciseDragItem.current = null;
        exerciseDragOverItem.current = null;
    }, [activeSessionId, selectedWeek]);

    const handleAddWeek = () => {
        setSessionsByWeek(prev => ({
            ...prev,
            [Object.keys(prev).length + 1]: [DEFAULT_SESSION]
        }));
        setHasUnsavedChanges(true);
    };

    const handleDeleteWeek = (week: number) => {
        setSessionsByWeek(prev => {
            const newSessionsByWeek = { ...prev };
            delete newSessionsByWeek[week];
            return newSessionsByWeek;
        });
        setHasUnsavedChanges(true);
        if (selectedWeek === week) {
            setSelectedWeek(1);
        }
    };

    const handleAddSession = () => {
        setSessionsByWeek(prev => {
            const newSessionsByWeek = { ...prev };
            const currentWeekSessions = newSessionsByWeek[selectedWeek] || [];
            const newSessionId = getNextSessionId(newSessionsByWeek);
            const newSession: EditableWorkoutSession = {
                id: newSessionId,
                name: `Séance ${currentWeekSessions.length + 1}`,
                exercises: [],
            };
            newSessionsByWeek[selectedWeek] = [...currentWeekSessions, newSession];
            return newSessionsByWeek;
        });
        setHasUnsavedChanges(true);
    };

    const handleDeleteSession = (sessionId: number) => {
        setSessionsByWeek(prev => {
            const newSessionsByWeek = { ...prev };
            newSessionsByWeek[selectedWeek] = (newSessionsByWeek[selectedWeek] || []).filter(s => s.id !== sessionId);
            return newSessionsByWeek;
        });
        setHasUnsavedChanges(true);
        if (activeSessionId === sessionId) {
            setActiveSessionId((sessionsByWeek[selectedWeek]?.[0]?.id) || DEFAULT_SESSION.id);
        }
    };

    const handleDuplicateSession = () => {
        if (!activeSession) return;

        setSessionsByWeek(prev => {
            const newSessionsByWeek = { ...prev };
            const currentWeekSessions = newSessionsByWeek[selectedWeek] || [];
            const newSessionId = getNextSessionId(newSessionsByWeek);
            const duplicatedSession: EditableWorkoutSession = {
                ...activeSession,
                id: newSessionId,
                name: `${activeSession.name} (copie)`,
                exercises: activeSession.exercises.map(ex => cloneExercise(ex, getNextExerciseId(newSessionsByWeek))),
            };
            newSessionsByWeek[selectedWeek] = [...currentWeekSessions, duplicatedSession];
            return newSessionsByWeek;
        });
        setHasUnsavedChanges(true);
    };

    const onSave = async () => {
        setIsSaving(true);
        try {
            if (!user?.id) {
                throw new Error("Utilisateur non authentifié.");
            }

            const programData: SupabaseProgram = {
                id: editProgramId || undefined,
                name: programName,
                objective: objective,
                week_count: typeof weekCount === 'number' ? weekCount : 1,
                coach_id: user.id,
                client_id: selectedClient === '0' ? null : selectedClient,
                created_at: editProgramId ? undefined : new Date().toISOString(),
            };

            const savedProgram = editProgramId ? await updateProgram(editProgramId, programData) : await createProgram(programData);

            if (!savedProgram) {
                throw new Error('La sauvegarde du programme a échoué.');
            }

            const currentProgramSessions = Object.values(sessionsByWeek).flat();
            const existingSessionIds = storedSessions.filter(s => s.program_id === savedProgram.id).map(s => s.id);
            const sessionsToDelete = existingSessionIds.filter(id => !currentProgramSessions.some(s => s.dbId === id));

            await Promise.all(sessionsToDelete.map(id => deleteSession(id)));

            const sessionPromises = currentProgramSessions.map(async session => {
                const sessionData: SupabaseSession = {
                    id: session.dbId || undefined,
                    program_id: savedProgram.id,
                    name: session.name,
                    order: session.id, // Using frontend ID as order for now
                };
                const savedSession = session.dbId ? await updateSession(session.dbId, sessionData) : await createSession(sessionData);

                if (!savedSession) {
                    throw new Error(`La sauvegarde de la session ${session.name} a échoué.`);
                }

                const currentSessionExercises = session.exercises;
                const existingExerciseIds = storedSessions.find(s => s.id === savedSession.id)?.exercises.map(ex => ex.id) || []; // Assuming storedSessions has exercises
                const exercisesToDelete = existingExerciseIds.filter(id => !currentSessionExercises.some(ex => ex.dbId === id));

                await Promise.all(exercisesToDelete.map(id => deleteSessionExercise(id)));

                const exercisePromises = currentSessionExercises.map(async exercise => {
                    const exerciseData: SupabaseSessionExercise = {
                        id: exercise.dbId || undefined,
                        session_id: savedSession.id,
                        exercise_id: exercise.exerciseId,
                        name: exercise.name,
                        illustration_url: exercise.illustrationUrl,
                        sets: exercise.sets,
                        is_detailed: exercise.isDetailed,
                        details: JSON.stringify(ensureDetailsArray(exercise.details, exercise.sets)),
                        intensification: JSON.stringify(exercise.intensification ?? []),
                        alternatives: JSON.stringify(exercise.alternatives ?? []),
                        order: exercise.id, // Using frontend ID as order for now
                    };
                    return exercise.dbId ? await updateSessionExercise(exercise.dbId, exerciseData) : await createSessionExercise(exerciseData);
                });
                return Promise.all(exercisePromises);
            });

            await Promise.all(sessionPromises);

            setEditProgramId(savedProgram.id);
            setIsEditMode(true);
            setLastSavedAt(new Date().toISOString());
            setHasUnsavedChanges(false);
            addNotification({ message: 'Programme sauvegardé avec succès !', type: 'success' });

            // Refresh auth context data
            // This might need a dedicated function in AuthContext to refetch programs and sessions
            setPrograms(prev => {
                const updatedPrograms = prev.filter(p => p.id !== savedProgram.id);
                return [...updatedPrograms, savedProgram];
            });
            // This part is tricky as sessions need to be re-fetched for the entire program
            // For simplicity, we might need to refetch all sessions for the user or specific program
            // For now, let's assume setStoredSessions will handle this if it's connected to a refetch mechanism
            // setStoredSessions(await fetchAllSessionsForUser(user.id)); // Placeholder

        } catch (error) {
            console.error("Erreur lors de la sauvegarde du programme :", error);
            addNotification({ message: 'Erreur lors de la sauvegarde du programme.', type: 'error' });
        } finally {
            setIsSaving(false);
        }
    };

    const handleDragSessionStart = useCallback((e: React.DragEvent, sessionId: number) => {
        sessionDragItem.current = sessionId;
    }, []);

    const handleDragSessionEnter = useCallback((e: React.DragEvent, sessionId: number) => {
        sessionDragOverItem.current = sessionId;
    }, []);

    const handleDropSession = useCallback(() => {
        const draggedSessionId = sessionDragItem.current;
        const droppedOnSessionId = sessionDragOverItem.current;

        if (draggedSessionId === null || droppedOnSessionId === null) return;

        setSessionsByWeek(prev => {
            const newSessionsByWeek = { ...prev };
            const currentWeekSessions = newSessionsByWeek[selectedWeek];

            if (!currentWeekSessions) return prev;

            let sessions = [...currentWeekSessions];
            const draggedIndex = sessions.findIndex(s => s.id === draggedSessionId);
            const droppedIndex = sessions.findIndex(s => s.id === droppedOnSessionId);

            if (draggedIndex === -1 || droppedIndex === -1) return prev;

            const [reorderedItem] = sessions.splice(draggedIndex, 1);
            sessions.splice(droppedIndex, 0, reorderedItem);

            return { ...newSessionsByWeek, [selectedWeek]: sessions };
        });
        setHasUnsavedChanges(true);
        sessionDragItem.current = null;
        sessionDragOverItem.current = null;
    }, [selectedWeek]);

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
                        <Button onClick={onSave} disabled={isSaving || !user}>
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
                        <Button onClick={handleAddWeek} className="ml-auto">Ajouter une semaine</Button>
                    </div>
                    <div className="flex-1 flex mt-4">
                        <div className="w-1/4 pr-4 border-r border-gray-200">
                            <h2 className="text-lg font-semibold mb-4">Séances</h2>
                            {(sessions || []).map(session => (
                                <div
                                    key={session.id}
                                    draggable
                                    onDragStart={(e) => handleDragSessionStart(e, session.id)}
                                    onDragEnter={(e) => handleDragSessionEnter(e, session.id)}
                                    onDragEnd={handleDropSession}
                                    onDragOver={(e) => e.preventDefault()}
                                    onClick={() => setActiveSessionId(session.id)}
                                    className={`relative p-3 rounded-lg cursor-pointer ${activeSessionId === session.id ? 'bg-primary-light text-primary-dark' : 'hover:bg-gray-200'} ${sessionDragItem.current === session.id ? 'opacity-50' : ''}`}
                                >
                                    {session.name}
                                    <button
                                        className="absolute top-1 right-1 p-1 text-gray-500 hover:text-gray-700"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleDeleteSession(session.id);
                                        }}
                                    >
                                        <XMarkIcon className="w-4 h-4" />
                                    </button>
                                    <button
                                        className="absolute top-1 right-7 p-1 text-gray-500 hover:text-gray-700"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleDuplicateSession();
                                        }}
                                    >
                                        <DocumentDuplicateIcon className="w-4 h-4" />
                                    </button>
                                </div>
                            ))}
                            <Button onClick={handleAddSession} className="mt-4 w-full">Ajouter une séance</Button>
                        </div>
                        <div className="w-3/4 pl-4">
                            <h2 className="text-lg font-semibold mb-4">{activeSession?.name}</h2>
                            {activeSession && activeSession.exercises.length === 0 && (
                                <div className="text-center text-gray-500 py-10 border rounded-lg bg-white">
                                    Glissez-déposez des exercices ici ou utilisez le bouton "Ajouter un exercice".
                                </div>
                            )}
                            {activeSession?.exercises.map(ex => (
                                <div
                                    key={ex.id}
                                    draggable
                                    onDragStart={(e) => handleDragStart(e, ex.id)}
                                    onDragEnter={(e) => handleDragEnter(e, ex.id)}
                                    onDragEnd={handleDrop}
                                    onDragOver={(e) => e.preventDefault()}
                                    className={`mb-4 p-4 border rounded-lg bg-white ${draggedOverExerciseId === ex.id ? 'border-primary-dark' : ''} ${exerciseDragItem.current === ex.id ? 'opacity-50' : ''}`}
                                >
                                    <div className="flex justify-between items-center">
                                        <h3 className="font-semibold flex items-center gap-2">
                                            {ex.name}
                                            {ex.illustrationUrl && (
                                                <img src={ex.illustrationUrl} alt={ex.name} className="w-6 h-6 rounded-full" />
                                            )}
                                            {ex.exerciseId && (
                                                <button
                                                    type="button"
                                                    onClick={() => setIsHistoryModalOpen(true)}
                                                    className="p-1 hover:bg-gray-100 rounded-full"
                                                    title="Voir l'historique du client"
                                                >
                                                    <FolderIcon className="w-4 h-4" />
                                                </button>
                                            )}
                                        </h3>
                                        <div className="flex items-center gap-2">
                                            <button type="button" onClick={() => onUpdateExercise(ex.id, 'isDetailed', !ex.isDetailed)} className="p-1 hover:bg-gray-100 rounded-full" disabled={false} title="Basculer la vue détaillée">
                                                <EllipsisHorizontalIcon className="w-4 h-4" />
                                            </button>
                                            <button type="button" onClick={() => handleDeleteExercise(ex.id)} className="p-1 hover:bg-red-100 rounded-full" disabled={false} title="Supprimer l'exercice">
                                                <TrashIcon className="w-4 h-4 text-red-600" />
                                            </button>
                                        </div>
                                    </div>
                                    {ex.isDetailed ? (
                                        <div className="mt-4">
                                            <div className="grid grid-cols-5 gap-2 text-sm font-medium text-gray-600 mb-2">
                                                <span>Séries</span>
                                                <span>Répétitions</span>
                                                <span>Charge</span>
                                                <span>Tempo</span>
                                                <span>Repos</span>
                                            </div>
                                            {(ex.details ?? []).map((detail, detailIndex) => (
                                                <div key={detailIndex} className="grid grid-cols-5 gap-2 mb-2">
                                                    <Input
                                                        type="number"
                                                        value={detailIndex + 1}
                                                        readOnly
                                                        className="bg-gray-100"
                                                    />
                                                    <Input
                                                        type="text"
                                                        value={detail.reps}
                                                        onChange={e => onUpdateExercise(ex.id, 'reps', e.target.value, detailIndex)}
                                                    />
                                                    <Input
                                                        type="text"
                                                        value={detail.load.value}
                                                        onChange={e => onUpdateExercise(ex.id, 'load.value', e.target.value, detailIndex)}
                                                        placeholder="Charge"
                                                    />
                                                    <Input
                                                        type="text"
                                                        value={detail.tempo}
                                                        onChange={e => onUpdateExercise(ex.id, 'tempo', e.target.value, detailIndex)}
                                                        placeholder="Tempo"
                                                    />
                                                    <Input
                                                        type="text"
                                                        value={detail.rest}
                                                        onChange={e => onUpdateExercise(ex.id, 'rest', e.target.value, detailIndex)}
                                                        placeholder="Repos"
                                                    />
                                                </div>
                                            ))}
                                            <Button onClick={() => onUpdateExercise(ex.id, 'sets', parseInt(ex.sets, 10) + 1)} className="mt-2">Ajouter une série</Button>
                                        </div>
                                    ) : (
                                        <div className="mt-4 grid grid-cols-2 md:grid-cols-5 gap-4">
                                            <div>
                                                <label htmlFor={`exercise-${ex.id}-sets`} className="block text-sm font-medium text-gray-700 mb-1">Séries</label>
                                                <Input
                                                    id={`exercise-${ex.id}-sets`}
                                                    type="number"
                                                    min="0"
                                                    value={ex.sets}
                                                    onChange={e => onUpdateExercise(ex.id, 'sets', e.target.value)}
                                                />
                                            </div>
                                            <div>
                                                <label htmlFor={`exercise-${ex.id}-reps`} className="block text-sm font-medium text-gray-700 mb-1">Répétitions</label>
                                                <Input
                                                    id={`exercise-${ex.id}-reps`}
                                                    type="text"
                                                    value={(ex.details?.[0]?.reps) || ''}
                                                    onChange={e => onUpdateExercise(ex.id, 'reps', e.target.value, 0)}
                                                />
                                            </div>
                                            <div>
                                                <label htmlFor={`exercise-${ex.id}-load`} className="block text-sm font-medium text-gray-700 mb-1">Charge</label>
                                                <Input
                                                    id={`exercise-${ex.id}-load`}
                                                    type="text"
                                                    value={(ex.details?.[0]?.load?.value) || ''}
                                                    onChange={e => onUpdateExercise(ex.id, 'load.value', e.target.value, 0)}
                                                />
                                            </div>
                                            <div>
                                                <label htmlFor={`exercise-${ex.id}-tempo`} className="block text-sm font-medium text-gray-700 mb-1">Tempo</label>
                                                <Input
                                                    id={`exercise-${ex.id}-tempo`}
                                                    type="text"
                                                    value={(ex.details?.[0]?.tempo) || ''}
                                                    onChange={e => onUpdateExercise(ex.id, 'tempo', e.target.value, 0)}
                                                />
                                            </div>
                                            <div>
                                                <label htmlFor={`exercise-${ex.id}-rest`} className="block text-sm font-medium text-gray-700 mb-1">Repos</label>
                                                <Input
                                                    id={`exercise-${ex.id}-rest`}
                                                    type="text"
                                                    value={(ex.details?.[0]?.rest) || ''}
                                                    onChange={e => onUpdateExercise(ex.id, 'rest', e.target.value, 0)}
                                                />
                                            </div>
                                        </div>
                                    )}
                                    <div className="mt-4">
                                        <label htmlFor={`exercise-${ex.id}-notes`} className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                                        <textarea
                                            id={`exercise-${ex.id}-notes`}
                                            value={ex.notes || ''}
                                            onChange={e => onUpdateExercise(ex.id, 'notes', e.target.value)}
                                            rows={1}
                                            className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary text-gray-900 placeholder:text-gray-500"
                                        />
                                    </div>
                                    <div className="mt-4 grid grid-cols-2 gap-4">
                                        <div>
                                            <label htmlFor={`exercise-${ex.id}-alternatives`} className="block text-sm font-medium text-gray-700 mb-1">Alternatives</label>
                                            <Select
                                                id={`exercise-${ex.id}-alternatives`}
                                                options={availableExercises.map(e => ({ value: e.id, label: e.name }))}
                                                value={(ex.alternatives ?? []).map(a => a.id)}
                                                onChange={values => {
                                                    const selectedAlts = availableExercises.filter(ae => values.includes(ae.id));
                                                    onUpdateExercise(ex.id, 'alternatives', selectedAlts.map(sa => ({ id: sa.id, name: sa.name })));
                                                }}
                                                isMulti
                                            />
                                        </div>
                                        <div>
                                            <label htmlFor={`exercise-${ex.id}-intensification`} className="block text-sm font-medium text-gray-700 mb-1">Intensification</label>
                                            <Select
                                                id={`exercise-${ex.id}-intensification`}
                                                options={[
                                                    { value: 'Aucune', label: 'Aucune' },
                                                    { value: 'Dégressif', label: 'Dégressif' },
                                                    { value: 'Superset', label: 'Superset' },
                                                    { value: 'Dropset', label: 'Dropset' },
                                                    { value: 'Rest-Pause', label: 'Rest-Pause' },
                                                    { value: 'Myo-reps', label: 'Myo-reps' },
                                                    { value: 'Cluster', label: 'Cluster' },
                                                    { value: 'Partielles', label: 'Partielles' },
                                                    { value: 'Tempo', label: 'Tempo' },
                                                    { value: 'Isometric', label: 'Isometric' },
                                                ]}
                                                value={ex.intensification.length > 0 ? ex.intensification[0].value : 'Aucune'}
                                                onChange={value => onUpdateExercise(ex.id, 'intensification', value)}
                                            />
                                        </div>
                                    </div>
                                </div>
                            ))}
                            <Button onClick={addExercise} className="mt-4">Ajouter un exercice</Button>
                        </div>
                    </div>
                </div>
            </div>
            {isHistoryModalOpen && clientData && (
                <ClientHistoryModal
                    client={clientData}
                    isOpen={isHistoryModalOpen}
                    onClose={() => setIsHistoryModalOpen(false)}
                    isMinimized={isHistoryModalMinimized}
                    onMinimizeToggle={() => setIsHistoryModalMinimized(!isHistoryModalMinimized)}
                />
            )}
        </div>
    );
};

export default WorkoutBuilder;

