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
    const [sessionsByWeek, setSessionsByWeek] = useState<Record<number, WorkoutSession[]>>(programDraft?.sessionsByWeek || { 1: JSON.parse(JSON.stringify(initialSessions)) });
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
    const sessions = useMemo(() => sessionsByWeek[selectedWeek] || [], [sessionsByWeek, selectedWeek]);
    const activeSession = useMemo(() => sessions.find(s => s.id === activeSessionId), [sessions, activeSessionId]);

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

                const supabaseSessions = await getSessionsByProgramId(programId);
                const allSessionExercises: Map<string, SupabaseSessionExercise[]> = new Map();
                const exerciseIds = new Set<string>();

                for (const session of supabaseSessions || []) {
                    const exercises = await getSessionExercisesBySessionId(session.id);
                    allSessionExercises.set(session.id, exercises || []);
                    (exercises || []).forEach(ex => {
                        if (ex.exercise_id) exerciseIds.add(ex.exercise_id);
                    });
                }

                const exerciseDetails = exerciseIds.size > 0 ? await getExercisesByIds(Array.from(exerciseIds)) : [];
                const exerciseNamesMap = new Map<string, { name: string; illustrationUrl: string }>();
                (exerciseDetails || []).forEach(ex => exerciseNamesMap.set(ex.id, { name: ex.name, illustrationUrl: ex.illustration_url || '' }));

                const workoutProgram = reconstructWorkoutProgram(program, supabaseSessions || [], allSessionExercises, exerciseNamesMap);

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
                // This logic needs to be fully implemented
                addNotification({ message: "Le chargement de session unique n'est pas encore implémenté.", type: "info" });
                setIsLoading(false);
            } catch (error) {
                console.error("Erreur lors du chargement de la session:", error);
                addNotification({ message: "Erreur lors du chargement de la session.", type: "error" });
                setIsLoading(false);
            }
        };

        if (programIdToEdit) {
            loadProgramFromSupabase(programIdToEdit);
        } else if (sessionIdToEdit) {
            loadSessionFromSupabase(sessionIdToEdit);
        } else if (programDraft) {
            setProgramName(programDraft.name || 'Nouveau programme');
            setObjective(programDraft.objective || '');
            setWeekCount(programDraft.weekCount || 1);
            setSessionsByWeek(programDraft.sessionsByWeek || { 1: JSON.parse(JSON.stringify(initialSessions)) });
            setIsLoading(false);
        } else {
            setIsLoading(false);
        }
    }, [searchParams, user, clients, addNotification, navigate, setProgramDraft]);

    // Auto-save to local storage
    useEffect(() => {
        const currentProgram: WorkoutProgram = {
            name: programName,
            objective: objective,
            weekCount: Number(weekCount) || 1,
            sessionsByWeek: sessionsByWeek,
        };
        setProgramDraft(currentProgram);
        setHasUnsavedChanges(true);
    }, [programName, objective, weekCount, sessionsByWeek, setProgramDraft]);

    const onSave = async () => {
        if (!user) {
            addNotification({ message: "Vous devez être connecté pour sauvegarder un programme.", type: "error" });
            return;
        }

        setIsSaving(true);
        setHasUnsavedChanges(false);

        try {
            const programInput: ProgramInput = {
                name: programName,
                objective: objective,
                week_count: Number(weekCount) || 1,
            };

            let savedProgram: SupabaseProgram | null = null;
            if (isEditMode && editProgramId) {
                savedProgram = await updateProgram(editProgramId, programInput);
            } else {
                savedProgram = await createProgram(programInput);
                if (savedProgram) {
                    setEditProgramId(savedProgram.id);
                    setIsEditMode(true);
                }
            }

            if (!savedProgram) {
                throw new Error("La sauvegarde du programme a échoué.");
            }

            const allCurrentSessions = Object.values(sessionsByWeek).flat();
            const allSupabaseSessions = await getSessionsByProgramId(savedProgram.id);

            // Sync sessions
            for (const week in sessionsByWeek) {
                for (const session of sessionsByWeek[week] || []) {
                    const sessionInput: SessionInput = {
                        program_id: savedProgram.id,
                        name: session.name,
                        week_number: parseInt(week, 10),
                        session_order: sessionsByWeek[week].indexOf(session),
                    };

                    let savedSession: SupabaseSession | null = null;
                    if (typeof session.id === 'string' && session.id.includes('-')) {
                        savedSession = await updateSession(session.id, sessionInput);
                    } else {
                        savedSession = await createSession(sessionInput);
                    }

                    if (!savedSession) continue;

                    // Sync exercises
                    const allSupabaseExercises = await getSessionExercisesBySessionId(savedSession.id);
                    for (const exercise of session.exercises || []) {
                        const exerciseInput: SessionExerciseInput = {
                            session_id: savedSession.id,
                            exercise_id: String(exercise.id), // Ensure exercise_id is a string
                            order: (session.exercises || []).indexOf(exercise),
                            sets: exercise.sets,
                            reps: exercise.reps,
                            rpe: exercise.rpe,
                            tempo: exercise.tempo,
                            rest: exercise.rest,
                            notes: exercise.notes,
                        };

                        if (typeof exercise.supaId === 'string' && exercise.supaId.includes('-')) {
                            await updateSessionExercise(exercise.supaId, exerciseInput);
                        } else {
                            await createSessionExercise(exerciseInput);
                        }
                    }

                    // Delete exercises not in the current session
                    for (const supaEx of allSupabaseExercises) {
                        if (!(session.exercises || []).some(ex => ex.supaId === supaEx.id)) {
                            await deleteSessionExercise(supaEx.id);
                        }
                    }
                }
            }

            // Delete sessions not in the current program
            for (const supaSession of allSupabaseSessions) {
                if (!allCurrentSessions.some(s => s.id === supaSession.id)) {
                    await deleteSession(supaSession.id);
                }
            }

            setLastSavedAt(new Date().toISOString());
            addNotification({ message: "Programme sauvegardé avec succès !", type: "success" });

        } catch (error) {
            console.error("Erreur lors de la sauvegarde du programme:", error);
            addNotification({ message: "Erreur lors de la sauvegarde du programme.", type: "error" });
            setHasUnsavedChanges(true);
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="flex h-screen bg-gray-100">
            <div className={`transition-all duration-300 ${isFilterSidebarVisible ? 'w-1/4' : 'w-0'} overflow-hidden`}>
                <ExerciseFilterSidebar />
            </div>

            <div className="flex-1 flex flex-col overflow-hidden">
                <div className="bg-white shadow-md p-4 flex justify-between items-center z-10">
                    <div className="flex items-center space-x-4">
                        <Button onClick={() => setIsFilterSidebarVisible(!isFilterSidebarVisible)} variant="ghost" size="icon">
                            <ChevronDoubleRightIcon className={`h-6 w-6 transition-transform duration-300 ${isFilterSidebarVisible ? 'rotate-180' : ''}`} />
                        </Button>
                        <h1 className="text-2xl font-bold">Créateur de Programme</h1>
                    </div>
                    <div className="flex items-center space-x-4">
                        {hasUnsavedChanges && <span className="text-sm text-gray-500 italic">Modifications non sauvegardées</span>}
                        <Button onClick={onSave} disabled={isSaving}>
                            {isSaving ? 'Sauvegarde...' : 'Sauvegarder le programme'}
                        </Button>
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto p-6">
                    {/* General Program Info */}
                    <Card className="mb-6">
                        <div className="p-4">
                            <div className="flex justify-between items-center cursor-pointer" onClick={() => setIsGeneralInfoVisible(!isGeneralInfoVisible)}>
                                <h2 className="text-lg font-semibold">Informations Générales</h2>
                                <ChevronUpIcon className={`h-5 w-5 transition-transform duration-200 ${isGeneralInfoVisible ? '' : 'rotate-180'}`} />
                            </div>
                            {isGeneralInfoVisible && (
                                <div className="mt-4 space-y-4">
                                    <Input label="Nom du programme" value={programName} onChange={(e) => setProgramName(e.target.value)} />
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <Select label="Client" value={selectedClient} onChange={handleClientSelectionChange} options={clientOptions} />
                                        <Input label="Objectif" value={objective} onChange={(e) => setObjective(e.target.value)} />
                                    </div>
                                    <div className="flex items-center space-x-2">
                                        <Input type="number" label="Nombre de semaines" value={weekCount} onChange={handleWeekCountChange} onBlur={handleWeekCountBlur} min={1} max={52} />
                                        <ToggleSwitch label="Mode Programme" checked={workoutMode === 'program'} onChange={() => setWorkoutMode(workoutMode === 'program' ? 'session' : 'program')} />
                                    </div>
                                </div>
                            )}
                        </div>
                    </Card>

                    {/* Weekly Tabs */}
                    {workoutMode === 'program' && (
                        <div className="mb-4 flex space-x-2 overflow-x-auto">
                            {[...Array(Number(weekCount) || 1)].map((_, i) => (
                                <Button 
                                    key={i + 1} 
                                    onClick={() => setSelectedWeek(i + 1)} 
                                    variant={selectedWeek === i + 1 ? 'solid' : 'outline'}
                                    disabled={isWeek1LockActive && i + 1 !== 1}
                                >
                                    Semaine {i + 1}
                                    {isWeek1LockActive && i + 1 !== 1 && <LockClosedIcon className="h-4 w-4 ml-2" />}
                                </Button>
                            ))}
                        </div>
                    )}

                    {/* Sessions Section */}
                    <div className="flex space-x-4">
                        {(sessions || []).map((session, sessionIndex) => (
                            <Card key={session.id} className="w-1/3 flex-shrink-0">
                                <div className="p-4">
                                    <div className="flex justify-between items-center mb-4">
                                        <Input value={session.name} onChange={(e) => { /* Update session name */ }} className="text-lg font-bold" />
                                        <div className="flex items-center space-x-2">
                                            <Button variant="ghost" size="icon"><DocumentDuplicateIcon className="h-5 w-5" /></Button>
                                            <Button variant="ghost" size="icon"><TrashIcon className="h-5 w-5" /></Button>
                                        </div>
                                    </div>

                                    {/* Exercises List */}
                                    <div className="space-y-2">
                                        {(session.exercises || []).map((exercise, exerciseIndex) => (
                                            <div key={exercise.id} className="p-2 border rounded-md">
                                                <div className="flex justify-between items-center">
                                                    <span className="font-semibold">{exercise.name}</span>
                                                    <Button variant="ghost" size="icon"><XMarkIcon className="h-4 w-4" /></Button>
                                                </div>
                                                <div className="grid grid-cols-3 gap-2 mt-2 text-sm">
                                                    <Input label="Sets" type="number" value={exercise.sets} onChange={(e) => { /* Update sets */ }} />
                                                    <Input label="Reps" type="number" value={exercise.reps} onChange={(e) => { /* Update reps */ }} />
                                                    <Input label="RPE" type="number" value={exercise.rpe || ''} onChange={(e) => { /* Update RPE */ }} />
                                                    <Input label="Tempo" value={exercise.tempo || ''} onChange={(e) => { /* Update tempo */ }} />
                                                    <Input label="Repos (s)" type="number" value={exercise.rest || ''} onChange={(e) => { /* Update rest */ }} />
                                                </div>
                                                <Input label="Notes" value={exercise.notes || ''} onChange={(e) => { /* Update notes */ }} className="mt-2" />
                                            </div>
                                        ))}
                                    </div>

                                    <Button variant="outline" className="w-full mt-4">Ajouter un exercice</Button>
                                </div>
                            </Card>
                        ))}
                        <Button variant="outline" className="self-start"><PlusIcon className="h-5 w-5 mr-2" /> Ajouter une séance</Button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default WorkoutBuilder;
