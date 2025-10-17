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
            ...myClients.map(c => ({ id: c.id, name: `${c.firstName} ${c.lastName}` }))
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

    // Edit mode initialization
    useEffect(() => {
        setIsLoading(true);
        const clientIdFromUrl = searchParams.get('clientId');
        const programIdToEdit = searchParams.get('editProgramId');

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
                    exercises.forEach(ex => {
                        if (ex.exercise_id) exerciseIds.add(ex.exercise_id);
                    });
                }

                const exerciseDetails = await getExercisesByIds(Array.from(exerciseIds));
                const exerciseNamesMap = new Map<string, { name: string; illustrationUrl: string }>();
                exerciseDetails.forEach(ex => exerciseNamesMap.set(ex.id, { name: ex.name, illustrationUrl: ex.illustration_url || '' }));

                const workoutProgram = reconstructWorkoutProgram(program, sessions, allSessionExercises, exerciseNamesMap);

                setProgramName(workoutProgram.name);
                setObjective(workoutProgram.objective);
                setWeekCount(workoutProgram.weekCount);
                setSessionsByWeek(workoutProgram.sessionsByWeek);
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

        setIsLoading(true);
        const clientIdFromUrl = searchParams.get(\'clientId\');
        const programIdToEdit = searchParams.get(\'editProgramId\');

        if (programIdToEdit) {
            loadProgramFromSupabase(programIdToEdit);
        } else {

                 setIsEditMode(false);
                 setSessionsByWeek(programDraft?.sessionsByWeek || { 1: JSON.parse(JSON.stringify(initialSessions)) });
                 setProgramName(programDraft?.name || "Nouveau programme");
                 setObjective(programDraft?.objective || "");
                 setWeekCount((programDraft?.weekCount && programDraft.weekCount > 0) ? programDraft.weekCount : 1);
            }
        } else {
            setIsEditMode(false);
            if (clientIdFromUrl && clientOptions.some(c => c.id === clientIdFromUrl)) {
                 const client = clients.find(c => c.id === clientIdFromUrl);
                setSelectedClient(clientIdFromUrl);
                if (client) {
                    setObjective(client.objective || '');
                }
            }
            setSessionsByWeek(programDraft?.sessionsByWeek || { 1: JSON.parse(JSON.stringify(initialSessions)) });
            setProgramName(programDraft?.name || "Nouveau programme");
            setObjective(programDraft?.objective || "");
            setWeekCount((programDraft?.weekCount && programDraft.weekCount > 0) ? programDraft.weekCount : 1);
        }
        setIsLoading(false);
    }, [searchParams, clients, clientOptions, programDraft, lastSavedAt]);


    // Sync sessionsByWeek with weekCount
    useEffect(() => {
        if (isLoading) return;

        if (workoutMode === 'program') {
            const numWeeks = Number(weekCount) || 1;
            setSessionsByWeek(prev => {
                const newSessionsByWeek: Record<number, WorkoutSession[]> = {};
                const templateSessions = prev[1] || JSON.parse(JSON.stringify(initialSessions));

                for (let i = 1; i <= numWeeks; i++) {
                    newSessionsByWeek[i] = prev[i] || JSON.parse(JSON.stringify(templateSessions));
                }
                 const finalSessionsByWeek: Record<number, WorkoutSession[]> = {};
                    for (let i=1; i<=numWeeks; i++) {
                        finalSessionsByWeek[i] = newSessionsByWeek[i];
                    }
                return finalSessionsByWeek;
            });
            if (selectedWeek > numWeeks) {
                setSelectedWeek(numWeeks > 0 ? numWeeks : 1);
            }
        } else {
            setSessionsByWeek({ 1: sessionsByWeek[1] || JSON.parse(JSON.stringify(initialSessions)) });
            setSelectedWeek(1);
        }
    }, [weekCount, workoutMode, isLoading]);

    // Auto-save to localStorage and track unsaved changes
    useEffect(() => {
        if (isLoading) return;

        const currentProgramState: WorkoutProgram = {
            id: editProgramId || "new-program",
            name: programName,
            objective: objective,
            weekCount: Number(weekCount),
            sessionsByWeek: sessionsByWeek,
        };

        if (JSON.stringify(programDraft) !== JSON.stringify(currentProgramState)) {
            setProgramDraft(currentProgramState);
            setHasUnsavedChanges(true);
        } else {
            setHasUnsavedChanges(false);
        }
    }, [programName, objective, weekCount, sessionsByWeek, editProgramId, isLoading, programDraft, setProgramDraft]);
    
    useEffect(() => {
        if (!sessions.some(s => s.id === activeSessionId) && sessions.length > 0) {
            setActiveSessionId(sessions[0].id);
        }
        setSelectedExerciseIds([]);
    }, [sessions, activeSessionId]);

    // --- STATE UPDATE LOGIC ---
    
    // Abstracted state updater for CONTENT changes (respects week 1 as template)
    // This function will now also trigger the auto-save effect via state updates

    const handleSaveProgram = async () => {
        if (!user?.id) {
            addNotification({ message: "Vous devez être connecté pour sauvegarder un programme.", type: "error" });
            return;
        }
        if (!programName.trim()) {
            addNotification({ message: "Le nom du programme ne peut pas être vide.", type: "error" });
            return;
        }

        setIsSaving(true);
        try {
            const programToSave: WorkoutProgram = {
                id: editProgramId || "",
                name: programName,
                objective: objective,
                weekCount: Number(weekCount),
                sessionsByWeek: sessionsByWeek,
            };

            let savedProgramId = editProgramId;
            if (editProgramId) {
                // Update existing program
                await updateProgram(editProgramId, programToSave, user.id);
                addNotification({ message: "Programme mis à jour avec succès !", type: "success" });
            } else {
                // Create new program
                const newProgram = await createProgram(programToSave, user.id);
                savedProgramId = newProgram.id;
                setEditProgramId(newProgram.id);
                addNotification({ message: "Programme créé avec succès !", type: "success" });
                navigate(`/workout-builder?editProgramId=${newProgram.id}`);
            }

            // Handle sessions and exercises (simplified for now, full logic will be more complex)
            // This part needs to be refined to handle diffing and proper CRUD for sessions/exercises
            // For now, let's assume we re-create/update all sessions and exercises associated with the program

            // Clear existing sessions/exercises for this program in Supabase if updating
            // This is a simplistic approach and should be optimized later for performance
            if (savedProgramId) {
                const existingSessions = await getSessionsByProgramId(savedProgramId);
                for (const session of existingSessions) {
                    await deleteSession(session.id);
                }
            }

            for (const weekNum in sessionsByWeek) {
                for (const workoutSession of sessionsByWeek[weekNum]) {
                    if (!savedProgramId) continue; // Should not happen if program creation was successful

                    const newSession = await createSession(workoutSession, savedProgramId, Number(weekNum), user.id);

                    for (const workoutExercise of workoutSession.exercises) {
                        if (!newSession.id) continue;
                        await createSessionExercise(workoutExercise, newSession.id);
                    }
                }
            }

            setLastSavedAt(new Date().toISOString());
            setHasUnsavedChanges(false);
            setProgramDraft(null); // Clear draft after successful save

        } catch (error) {
            console.error("Erreur lors de la sauvegarde du programme:", error);
            addNotification({ message: "Erreur lors de la sauvegarde du programme.", type: "error" });
        } finally {
            setIsSaving(false);
        }
    };

    const updateContentState = useCallback((updateFn: (sessions: WorkoutSession[]) => WorkoutSession[]) => {
        if (selectedWeek === 1 && workoutMode === 'program') {
            setSessionsByWeek(prev => {
                const originalWeek1Sessions = prev[1] || [];
                const updatedWeek1Sessions = updateFn(originalWeek1Sessions);
                
                const newSessionsByWeek = { ...prev, 1: updatedWeek1Sessions };
                
                Object.keys(newSessionsByWeek).forEach(weekStr => {
                    const weekNum = Number(weekStr);
                    if (weekNum > 1) {
                        // Using JSON.stringify for pragmatic deep comparison to check if a week was customized
                        if (JSON.stringify(prev[weekNum]) === JSON.stringify(originalWeek1Sessions)) {
                           newSessionsByWeek[weekNum] = JSON.parse(JSON.stringify(updatedWeek1Sessions));
                        }
                    }
                });
                return newSessionsByWeek;
            });
        } else {
            // Just update the selected week, marking it as unique/customized.
            setSessionsByWeek(prev => ({
                ...prev,
                [selectedWeek]: updateFn(prev[selectedWeek] || []),
            }));
        }
    }, [selectedWeek, workoutMode]);

    // Updater for STRUCTURAL changes (applies to all weeks)
    const updateAllWeeksState = (updateFn: (sessions: WorkoutSession[]) => WorkoutSession[]) => {
        setSessionsByWeek(prev => {
            const newSessionsByWeek = { ...prev };
            Object.keys(newSessionsByWeek).forEach(week => {
                newSessionsByWeek[Number(week)] = updateFn(newSessionsByWeek[Number(week)]);
            });
            return newSessionsByWeek;
        });
    };

    const onUpdateExercise = useCallback((exerciseId: number, field: string, value: any, setIndex?: number) => {
        const performUpdate = (sessionsToUpdate: WorkoutSession[]): WorkoutSession[] => {
            return sessionsToUpdate.map(s => {
                if (s.id !== activeSessionId) return s;
                return {
                    ...s,
                    exercises: s.exercises.map(ex => {
                        if (ex.id !== exerciseId) return ex;
                        
                        // Handle top-level properties (FIXES BUG 2)
                        if (['name', 'exerciseId', 'illustrationUrl'].includes(field)) {
                            const newEx = { ...ex, [field]: value };
                            // If name is updated from dropdown, other fields are updated subsequently.
                            // If typed manually, we should clear the linked exercise ID.
                            if (field === 'name') {
                                newEx.exerciseId = '';
                            }
                            return newEx;
                        }
                        
                        if (field === 'sets') {
                            const parsedValue = parseInt(value, 10);
                            const newSets = (value === '' || isNaN(parsedValue) || parsedValue < 0) ? 0 : parsedValue;
    
                            const currentSets = ex.details.length;
                            let newDetails = [...ex.details];
                            if (newSets > currentSets) {
                                const lastDetail = ex.details[currentSets - 1] || { reps: '12', load: { value: '', unit: 'kg' }, tempo: '2010', rest: '60s' };
                                for(let i=0; i < newSets - currentSets; i++) {
                                    newDetails.push(JSON.parse(JSON.stringify(lastDetail)));
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
                            const newDetails = [...details];
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
    
                        return {...ex, details: updateDetails(ex.details)};
                    })
                }
            });
        };
        updateContentState(performUpdate);
    }, [activeSessionId, updateContentState]);
    
    // CONTENT CHANGE
    const addExercise = () => {
        if (!activeSession) return;
        const newId = Math.max(0, ...Object.values(sessionsByWeek).flat().flatMap(s => s.exercises).map(e => e.id)) + 1;
        const newExercise: WorkoutExercise = {
            id: newId, exerciseId: '', name: '', illustrationUrl: '', sets: '3', isDetailed: false,
            details: Array.from({ length: 3 }, () => ({ reps: '12', load: { value: '', unit: 'kg' }, tempo: '2010', rest: '60s' })),
            intensification: [], alternatives: []
        };
        updateContentState(currentSessions =>
            currentSessions.map(s => s.id === activeSessionId ? {...s, exercises: [...s.exercises, newExercise]} : s)
        );
    };

    // STRUCTURAL CHANGE
    const addSession = () => {
        const allSessionIds = Object.values(sessionsByWeek).flat().map(s => s.id);
        const newId = allSessionIds.length > 0 ? Math.max(...allSessionIds) + 1 : 1;
        
        updateAllWeeksState(currentSessions => {
            const sessionCount = currentSessions.length;
            const newSession: WorkoutSession = { id: newId, name: `Séance ${sessionCount + 1}`, exercises: [] };
            return [...currentSessions, newSession];
        });
        setActiveSessionId(newId);
    };

    // STRUCTURAL CHANGE
    const duplicateSession = () => {
        if (workoutMode !== 'program' || !activeSession) return;

        const allSessionIds = Object.values(sessionsByWeek).flat().map(s => s.id);
        const newSessionId = allSessionIds.length > 0 ? Math.max(...allSessionIds) + 1 : 1;
        let exerciseIdCounter = Math.max(0, ...Object.values(sessionsByWeek).flat().flatMap(s => s.exercises.map(e => e.id))) + 1;

        const newSessionTemplate: WorkoutSession = {
            ...JSON.parse(JSON.stringify(activeSession)),
            id: newSessionId,
            name: `Copie`,
            exercises: activeSession.exercises.map((ex) => ({
                ...ex,
                id: exerciseIdCounter++,
            }))
        };
        
        updateAllWeeksState(currentSessions => {
            const activeSessionIndex = currentSessions.findIndex(s => s.id === activeSession.id);
            if (activeSessionIndex === -1) return currentSessions;
            const newSessionsList = [...currentSessions];
            newSessionsList.splice(activeSessionIndex + 1, 0, newSessionTemplate);
            return newSessionsList.map((session, index) => ({ ...session, name: `Séance ${index + 1}` }));
        });
        setActiveSessionId(newSessionId);
    };

    const handleDeleteOrClearSession = () => {
        if (!activeSession) return;
        if (workoutMode === 'session') {
            if (window.confirm("Vider la séance de ses exercices ?")) {
                setSessionsByWeek({ 1: [{ ...sessions[0], exercises: [] }] });
            }
            return;
        }

        if (sessions.length > 1) { // Delete session - STRUCTURAL
            if (window.confirm(`Supprimer la séance "${activeSession.name}" de toutes les semaines ?`)) {
                let newActiveSessionId = -1;
                updateAllWeeksState((currentSessions) => {
                    const sessionIndexToDelete = currentSessions.findIndex(s => s.id === activeSessionId);
                    const updatedSessions = currentSessions.filter(s => s.id !== activeSessionId);
                    if (newActiveSessionId === -1) {
                         const newActiveIndex = sessionIndexToDelete >= updatedSessions.length ? updatedSessions.length - 1 : sessionIndexToDelete;
                         newActiveSessionId = updatedSessions[newActiveIndex]?.id || (updatedSessions[0]?.id ?? -1);
                    }
                    return updatedSessions.map((s, index) => ({ ...s, name: `Séance ${index + 1}` }));
                });
                if (newActiveSessionId !== -1) setActiveSessionId(newActiveSessionId);
            }
        } else { // Clear session - CONTENT (LOCAL)
            if (window.confirm(`Vider les exercices de cette séance pour la Semaine ${selectedWeek} ?`)) {
                updateContentState(currentSessions =>
                    currentSessions.map(s => s.id === activeSessionId ? { ...s, exercises: [] } : s)
                );
            }
        }
    };
    
    const handleSelectExercise = (id: number) => {
        setSelectedExerciseIds(prev =>
            prev.includes(id) ? prev.filter(exId => exId !== id) : [...prev, id]
        );
    };

    const handleDeleteSelectedExercises = () => {
        if (selectedExerciseIds.length === 0 || !activeSession) return;
        if (window.confirm(`Supprimer ${selectedExerciseIds.length} exercice(s) de la séance pour la Semaine ${selectedWeek} ?`)) {
             updateContentState(currentSessions =>
                currentSessions.map(s => s.id === activeSessionId 
                    ? { ...s, exercises: s.exercises.filter(ex => !selectedExerciseIds.includes(ex.id)) }
                    : s
                )
             );
            setSelectedExerciseIds([]);
        }
    };

    const handleExerciseDragEnd = () => {
        if (!activeSession || exerciseDragItem.current === null || exerciseDragOverItem.current === null || exerciseDragItem.current === exerciseDragOverItem.current) return;
        
        updateContentState(currentSessions => {
            return currentSessions.map(s => {
                if (s.id === activeSessionId) {
                    const newExercises = [...s.exercises];
                    const draggedItemContent = newExercises.splice(exerciseDragItem.current!, 1)[0];
                    newExercises.splice(exerciseDragOverItem.current!, 0, draggedItemContent);
                    return {...s, exercises: newExercises};
                }
                return s;
            })
        });

        exerciseDragItem.current = null;
        exerciseDragOverItem.current = null;
    };
    
    const handleDragOver = (e: React.DragEvent<HTMLDivElement>, exerciseId: number) => {
        e.preventDefault();
        setDraggedOverExerciseId(exerciseId);
    };
    
    const handleDrop = (e: React.DragEvent<HTMLDivElement>, exercise: WorkoutExercise) => {
        e.preventDefault();
        setDraggedOverExerciseId(null);
        try {
            const data = JSON.parse(e.dataTransfer.getData('application/json')) as Exercise;
            if (data && data.id && data.name && data.illustrationUrl) {
                onUpdateExercise(exercise.id, 'exerciseId', data.id);
                onUpdateExercise(exercise.id, 'name', data.name);
                onUpdateExercise(exercise.id, 'illustrationUrl', data.illustrationUrl);
            }
        } catch(err) {
            console.error("Failed to parse dropped data", err);
        }
    };
    
    const handleSessionDragEnd = () => {
        if (sessionDragItem.current !== null && sessionDragOverItem.current !== null && sessionDragItem.current !== sessionDragOverItem.current) {
            updateAllWeeksState(currentSessions => {
                const newSessions = [...currentSessions];
                const draggedItemContent = newSessions.splice(sessionDragItem.current!, 1)[0];
                newSessions.splice(sessionDragOverItem.current!, 0, draggedItemContent);
                return newSessions.map((session, index) => ({...session, name: `Séance ${index + 1}`}));
            });
        }
        sessionDragItem.current = null;
        sessionDragOverItem.current = null;
    };

    const handleSave = () => {
        if (mode === 'coach') {
            handleSaveCoach();
        } else {
            handleSaveClient();
        }
    };

    const handleSaveCoach = async () => {
        if (!user) return;
        
        if (isEditMode && editProgramId) {
            // --- EDIT LOGIC ---
            try {
                const updatedProgram = await updateProgram(editProgramId, {
                    name: programName,
                    objective: objective,
                    weekCount: Number(weekCount) || 1,
                    sessionsByWeek: sessionsByWeek,
                });

                const updatedClients = clients.map(c => {
                    if (c.id === selectedClient) {
                        const programIndex = c.assignedPrograms?.findIndex(p => p.id === editProgramId);
                        if (programIndex !== undefined && programIndex !== -1) {
                            const newAssignedPrograms = [...(c.assignedPrograms || [])];
                            newAssignedPrograms[programIndex] = updatedProgram;
                            
                            // Also update total sessions for the current week if it has changed
                            const newTotalSessions = updatedProgram.sessionsByWeek[c.programWeek || 1]?.length || 0;

                            return { ...c, assignedPrograms: newAssignedPrograms, totalSessions: newTotalSessions };
                        }
                    }
                    return c;
                });
                setClients(updatedClients);
                alert(`Programme "${programName}" mis à jour avec succès !`);
                navigate(`/app/client/${selectedClient}`);
            } catch (error) {
                console.error('Erreur lors de la mise à jour du programme:', error);
                alert('Erreur lors de la mise à jour du programme. Veuillez réessayer.');
                return;
            }

        } else {
            // --- ADD NEW LOGIC ---
            if (workoutMode === 'program') {
                try {
                    const newProgram = await addProgram({
                        name: programName,
                        objective: objective,
                        weekCount: Number(weekCount) || 1,
                        sessionsByWeek: sessionsByWeek,
                    });

                    if (selectedClient && selectedClient !== '0') {
                        const updatedClients = clients.map(c => {
                            if (c.id === selectedClient) {
                                const updatedPrograms = [newProgram, ...(c.assignedPrograms || [])];
                                const progressUpdates = {
                                    programWeek: 1,
                                    sessionProgress: 1,
                                    totalWeeks: newProgram.weekCount,
                                    totalSessions: newProgram.sessionsByWeek[1]?.length || 0,
                                    viewed: false,
                                };
                                return { ...c, assignedPrograms: updatedPrograms, ...progressUpdates };
                            }
                            return c;
                        });
                        setClients(updatedClients);
                        addNotification({
                            userId: selectedClient,
                            fromName: `${user.firstName} ${user.lastName}`,
                            type: 'assignment',
                            message: `vous a assigné un nouveau programme : ${newProgram.name}.`,
                            link: '/app/workout'
                        });
                    }
                    alert(`Programme "${programName}" enregistré et assigné !`);
                } catch (error) {
                    console.error('Erreur lors de la création du programme:', error);
                    alert('Erreur lors de la création du programme. Veuillez réessayer.');
                    return;
                }

            } else {
                const sessionToSave = activeSession;
                if (sessionToSave) {
                    const newSession: WorkoutSession = { ...sessionToSave, id: Date.now() };
                    setAllSessions([...allSessions, newSession]);
                    alert(`Séance "${programName}" enregistrée dans la bibliothèque !`);
                }
            }
            navigate('/app/musculation/bibliotheque');
        }
    };
    
    const handleSaveClient = () => {
        // Logic for client saving their own program
        console.log("Client saving program...");
        navigate('/app/workout/my-programs');
    };

    const isLocked = useCallback((week: number, sessionIndex: number) => {
        if (!isEditMode || !lockedUntil) return false;
        if (week < lockedUntil.week) return true;
        if (week === lockedUntil.week && sessionIndex < lockedUntil.sessionIndex) return true;
        return false;
    }, [isEditMode, lockedUntil]);

    if(isLoading) {
      return (
        <div className="flex items-center justify-center h-full">
            <p className="text-gray-500">Chargement du programme...</p>
        </div>
      );
    }


    return (
        <div className="flex gap-6 relative">
            {/* Main content */}
            <main className="w-full transition-all duration-300 flex flex-col gap-6" style={{ marginRight: isFilterSidebarVisible ? '424px' : '0' }}>
                <h1 className="text-3xl font-bold text-gray-800">{isEditMode ? 'Modifier le programme' : "Créateur d'entraînement"}</h1>

                {/* General Info Section */}
                 <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
                    <button onClick={() => setIsGeneralInfoVisible(!isGeneralInfoVisible)} className="w-full flex justify-between items-center font-bold text-lg text-gray-800">
                        <span>Informations et notes</span>
                        <ChevronUpIcon className={`w-6 h-6 transition-transform ${isGeneralInfoVisible ? '' : 'rotate-180'}`} />
                    </button>
                    {isGeneralInfoVisible && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4 pt-4 border-t">
                            <Card className="p-4 flex flex-col gap-4 !shadow-none border">
                                <h2 className="font-bold text-lg">Informations Générales</h2>
                                <Input label="Nom de la séance/programme" value={programName} onChange={e => setProgramName(e.target.value)} />
                                 <Input label="Objectif" value={objective} onChange={e => setObjective(e.target.value)} />
                                {workoutMode === 'program' && (
                                   <Input label="Nombre de semaines" type="number" value={weekCount} onChange={handleWeekCountChange} onBlur={handleWeekCountBlur} min="1" max="52" />
                                )}
                                {mode === 'coach' && (
                                    <Select label="Nom du client" value={selectedClient} onChange={handleClientSelectionChange} disabled={isEditMode}>
                                        {clientOptions.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                    </Select>
                                )}
                            </Card>
                            <div className="space-y-4">
                                <Card className="p-4 !shadow-none border">
                                    <div className="flex items-center mb-2">
                                        <FolderIcon className="w-6 h-6 text-primary mr-2" />
                                        <h3 className="font-semibold">Dernière note du coach</h3>
                                    </div>
                                    {clientData && clientData.notes ? (
                                        <div className="text-sm text-gray-700 bg-gray-50 p-2 rounded-md max-h-24 overflow-y-auto whitespace-pre-wrap">
                                            {getLatestNote(clientData.notes).full}
                                        </div>
                                    ) : (
                                        <p className="text-sm text-gray-500 italic">
                                            {selectedClient !== '0' ? 'Aucune note pour ce client.' : 'Sélectionnez un client pour voir les notes.'}
                                        </p>
                                    )}
                                </Card>
                                <Card className="p-4 !shadow-none border">
                                    <div className="flex items-center mb-2">
                                        <FolderIcon className="w-6 h-6 text-primary mr-2" />
                                        <h3 className="font-semibold">Informations Médicales</h3>
                                    </div>
                                    {clientData ? (
                                        <div className="text-sm text-gray-700 space-y-2">
                                            <div>
                                                <h4 className="font-semibold text-xs text-gray-500 uppercase">Antécédents:</h4>
                                                <p className="whitespace-pre-wrap bg-gray-50 p-2 rounded-md">{clientData.medicalInfo?.history || 'Non renseigné'}</p>
                                            </div>
                                             <div>
                                                <h4 className="font-semibold text-xs text-gray-500 uppercase">Allergies:</h4>
                                                <p className="whitespace-pre-wrap bg-gray-50 p-2 rounded-md">{clientData.medicalInfo?.allergies || 'Non renseigné'}</p>
                                            </div>
                                        </div>
                                    ) : (
                                        <p className="text-sm text-gray-500 italic">
                                            Sélectionnez un client pour voir les informations médicales.
                                        </p>
                                    )}
                                </Card>
                                {selectedClient !== '0' && (
                                    <div className="mt-2">
                                        <Button 
                                            variant="secondary"
                                            onClick={() => {
                                                setIsHistoryModalOpen(true);
                                                setIsHistoryModalMinimized(false);
                                            }}
                                        >
                                            Historique du client
                                        </Button>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>


                {/* Main creator */}
                <Card className="p-6">
                    <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
                        <ToggleSwitch
                            label1="Séance"
                            value1="session"
                            label2="Programme"
                            value2="program"
                            value={workoutMode}
                            onChange={(v) => setWorkoutMode(v as 'session' | 'program')}
                        />
                        <div className="flex items-center gap-4">
                            {hasUnsavedChanges && (
                                <span className="text-sm text-yellow-600 flex items-center animate-pulse">
                                    <span className="relative flex h-2 w-2 mr-1">
                                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-yellow-400 opacity-75"></span>
                                        <span className="relative inline-flex rounded-full h-2 w-2 bg-yellow-500"></span>
                                    </span>
                                    Modifications non sauvegardées
                                </span>
                            )}
                            <Button onClick={handleSaveProgram} disabled={isSaving || !hasUnsavedChanges}>
                                {isSaving ? 'Sauvegarde...' : 'Sauvegarder le programme'}
                            </Button>
                        </div>
                        {workoutMode === 'program' && (
                                <div className="flex items-center gap-2">
                                    <Select label="Semaine" id="week-selector" value={selectedWeek} onChange={e => setSelectedWeek(Number(e.target.value))}>
                                        {[...Array(Number(weekCount) || 1)].map((_, i) => (
                                            <option key={i + 1} value={i + 1}>Semaine {i + 1}</option>
                                        ))}
                                    </Select>
                                </div>
                                {lastSavedAt && (
                                    <span className="text-xs text-gray-500">Dernière sauvegarde: {new Date(lastSavedAt).toLocaleTimeString()}</span>
                                )}
                        )}
                    </div>
                    
                    <div className="relative">
                        {isWeek1LockActive && (
                            <div className="absolute inset-0 bg-white/90 z-20 flex flex-col items-center justify-center text-center p-4 rounded-lg border-2 border-dashed border-red-300 -mx-6 -mb-6 mt-4">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                </svg>
                                <h3 className="text-xl font-bold text-red-600 mt-3">Commencez par la Semaine 1</h3>
                                <p className="mt-2 text-gray-700 max-w-md">
                                    Pour garantir la cohérence du programme, veuillez d'abord créer la structure de base de votre entraînement sur la <strong>Semaine 1</strong>.
                                </p>
                                <p className="mt-1 text-gray-600 text-sm">
                                    Les modifications apportées serviront de modèle pour les semaines suivantes.
                                </p>
                                <Button onClick={() => setSelectedWeek(1)} className="mt-4">
                                    Retourner à la Semaine 1
                                </Button>
                            </div>
                        )}

                        <div className={isWeek1LockActive ? 'blur-sm pointer-events-none' : ''}>
                            {workoutMode === 'program' && (
                                <div className="flex items-center gap-1 mt-4 border-b border-gray-200 pb-2 overflow-x-auto">
                                    {sessions.map((session, index) => {
                                        const locked = isLocked(selectedWeek, index);
                                        return (
                                        <button
                                            key={session.id}
                                            draggable={!locked}
                                            onDragStart={(e) => { if (!locked) sessionDragItem.current = index; }}
                                            onDragEnter={(e) => { if (!locked) sessionDragOverItem.current = index; }}
                                            onDragEnd={handleSessionDragEnd}
                                            onDragOver={(e) => e.preventDefault()}
                                            onClick={() => setActiveSessionId(session.id)}
                                            className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors flex-shrink-0 flex items-center gap-2 ${activeSessionId === session.id ? 'bg-primary/10 text-primary' : 'text-gray-600 hover:bg-gray-100'} ${locked ? 'cursor-not-allowed opacity-70' : 'cursor-grab'}`}
                                        >
                                            {locked && <LockClosedIcon className="w-4 h-4 text-gray-400" />}
                                            {session.name}
                                        </button>
                                    )})}
                                    <button onClick={addSession} className="ml-2 w-7 h-7 bg-gray-200 rounded-full flex items-center justify-center text-gray-600 hover:bg-primary hover:text-white transition-colors flex-shrink-0">
                                        <PlusIcon className="w-4 h-4" />
                                    </button>
                                </div>
                            )}
                            
                            <div className="mt-6 p-4 bg-gray-50 rounded-lg flex justify-between items-center">
                                <div className="font-semibold">Temps global de la séance : <span className="text-primary">0:00</span></div>
                                <div className="flex items-center gap-3 text-gray-500">
                                   {selectedExerciseIds.length > 0 && (
                                        <Button variant="danger" size="sm" onClick={handleDeleteSelectedExercises}>
                                            Supprimer ({selectedExerciseIds.length})
                                        </Button>
                                   )}
                                   <button 
                                        onClick={duplicateSession}
                                        disabled={workoutMode !== 'program' || isLocked(selectedWeek, sessions.findIndex(s => s.id === activeSessionId))}
                                        className="hover:text-primary disabled:text-gray-300 disabled:cursor-not-allowed"
                                        title={workoutMode === 'program' ? "Dupliquer la séance" : "La duplication est disponible en mode Programme"}
                                   >
                                       <DocumentDuplicateIcon className="w-5 h-5" />
                                   </button>
                                   <button 
                                        onClick={handleDeleteOrClearSession}
                                        disabled={isLocked(selectedWeek, sessions.findIndex(s => s.id === activeSessionId))}
                                        className="hover:text-red-500 disabled:text-gray-300 disabled:cursor-not-allowed"
                                        title="Supprimer ou vider la séance"
                                   >
                                       <TrashIcon className="w-5 h-5" />
                                   </button>
                                </div>
                            </div>

                            <div className="mt-4 space-y-4">
                                {(activeSession?.exercises ?? []).map((ex, index) => {
                                    const sessionIndex = sessions.findIndex(s => s.id === activeSessionId);
                                    const locked = isLocked(selectedWeek, sessionIndex);
                                    const idPrefix = `ex-${ex.id}`;
                                    return (
                                <div 
                                    key={ex.id} 
                                    className={`p-4 bg-white rounded-lg border border-gray-200 ${locked ? 'bg-gray-100 opacity-70' : 'cursor-grab'}`}
                                    draggable={!locked}
                                    onDragStart={(e) => { if (!locked) exerciseDragItem.current = index; }}
                                    onDragEnter={(e) => { if (!locked) exerciseDragOverItem.current = index; }}
                                    onDragEnd={handleExerciseDragEnd}
                                    onDragOver={(e) => e.preventDefault()}
                                >
                                     <div className="flex items-center mb-4">
                                        <input
                                            type="checkbox"
                                            className="h-5 w-5 text-primary rounded border-gray-300 focus:ring-primary mr-3"
                                            checked={selectedExerciseIds.includes(ex.id)}
                                            onChange={() => handleSelectExercise(ex.id)}
                                            onClick={(e) => e.stopPropagation()}
                                            disabled={locked}
                                        />
                                        <span className="font-semibold text-gray-800">Exercice {index + 1}</span>
                                    </div>
                                    <div 
                                        onDragOver={(e) => {if (!locked) handleDragOver(e, ex.id)}}
                                        onDragLeave={() => {if (!locked) setDraggedOverExerciseId(null)}}
                                        onDrop={(e) => {if (!locked) handleDrop(e, ex)}}
                                        className={`p-4 rounded-lg border-2 ${draggedOverExerciseId === ex.id && !locked ? 'border-primary bg-primary/5' : 'border-dashed border-gray-300'} transition-colors`}
                                    >
                                       {ex.name && ex.illustrationUrl && ex.name !== '' ? (
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-4">
                                                    <img src={ex.illustrationUrl} alt={ex.name} className="w-20 h-20 object-contain rounded-md bg-gray-100 p-1"/>
                                                    <p className="font-bold text-lg">{ex.name}</p>
                                                </div>
                                                <Button variant="secondary" size="sm" onClick={() => {
                                                    onUpdateExercise(ex.id, 'name', '');
                                                    onUpdateExercise(ex.id, 'illustrationUrl', '');
                                                }} disabled={locked}>Changer</Button>
                                            </div>
                                        ) : (
                                             <div className="relative">
                                                <Input 
                                                    value={ex.name} 
                                                    onChange={e => onUpdateExercise(ex.id, 'name', e.target.value)}
                                                    onFocus={() => setActiveSearchBox({sessionId: activeSessionId, exerciseId: ex.id})}
                                                    onBlur={() => setTimeout(() => setActiveSearchBox(null), 200)}
                                                    placeholder="Écrire ou déposer un exercice"
                                                    disabled={locked}
                                                />
                                                {activeSearchBox?.exerciseId === ex.id && ex.name && !locked && (
                                                    <div className="absolute z-10 w-full bg-white border border-gray-300 rounded-lg mt-1 max-h-48 overflow-y-auto shadow-lg">
                                                        {availableExercises
                                                            .filter(dbEx => dbEx.name.toLowerCase().includes(ex.name.toLowerCase()))
                                                            .map(result => (
                                                                <div 
                                                                    key={result.id} 
                                                                    className="p-2 hover:bg-primary/10 cursor-pointer"
                                                                    onMouseDown={() => {
                                                                        onUpdateExercise(ex.id, 'exerciseId', result.id);
                                                                        onUpdateExercise(ex.id, 'name', result.name);
                                                                        onUpdateExercise(ex.id, 'illustrationUrl', result.illustrationUrl);
                                                                        setActiveSearchBox(null);
                                                                    }}
                                                                >
                                                                    {result.name}
                                                                </div>
                                                            ))
                                                        }
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                     <div className={`mt-4 grid grid-cols-2 md:grid-cols-5 gap-4 ${ex.isDetailed ? 'hidden' : ''}`}>
                                        <div>
                                            <label htmlFor={`${idPrefix}-sets`} className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-2">
                                                <span>Séries</span>
                                                <button type="button" onClick={() => onUpdateExercise(ex.id, 'isDetailed', !ex.isDetailed)} className="p-1 hover:bg-gray-100 rounded-full" disabled={locked} title="Vue détaillée des séries">
                                                    <ListBulletIcon className="w-4 h-4" />
                                                </button>
                                            </label>
                                            <input
                                                id={`${idPrefix}-sets`}
                                                type="number"
                                                min="0"
                                                value={ex.sets}
                                                onChange={e => onUpdateExercise(ex.id, 'sets', e.target.value)}
                                                disabled={locked}
                                                className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary text-gray-900 placeholder:text-gray-500"
                                            />
                                        </div>
                                        <Input label="Répétitions" value={ex.details[0]?.reps || ''} onChange={e => onUpdateExercise(ex.id, 'reps', e.target.value)} disabled={locked} />
                                        <div className="col-span-2 md:col-span-1">
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Charge</label>
                                            <div className="flex">
                                                <Input type="number" className="rounded-r-none" value={ex.details[0]?.load.value || ''} onChange={e => onUpdateExercise(ex.id, 'load.value', e.target.value)} disabled={locked} />
                                                <Select className="rounded-l-none -ml-px" value={ex.details[0]?.load.unit || 'kg'} onChange={e => onUpdateExercise(ex.id, 'load.unit', e.target.value)} disabled={locked}>
                                                    <option>kg</option><option>%</option><option>RPE</option><option>km/h</option><option>W</option><option>lvl</option>
                                                </Select>
                                            </div>
                                        </div>
                                        <Input label="Tempo" value={ex.details[0]?.tempo || ''} onChange={e => onUpdateExercise(ex.id, 'tempo', e.target.value)} disabled={locked} />
                                        <Input label="Repos" value={ex.details[0]?.rest || ''} onChange={e => onUpdateExercise(ex.id, 'rest', e.target.value)} disabled={locked} />
                                    </div>
                                    
                                     {ex.isDetailed && (
                                        <div className="mt-4 space-y-2">
                                            <div className="grid grid-cols-5 gap-2 text-center text-xs font-semibold text-gray-600 px-2 items-center">
                                                <span className="flex items-center justify-center gap-1">
                                                    Série
                                                    <button type="button" onClick={() => onUpdateExercise(ex.id, 'isDetailed', !ex.isDetailed)} className="p-1 hover:bg-gray-100 rounded-full" disabled={locked} title="Vue simplifiée des séries">
                                                        <ListBulletIcon className="w-4 h-4" />
                                                    </button>
                                                </span>
                                                <span>Reps</span>
                                                <span className="col-span-2">Charge</span>
                                                <span>Repos</span>
                                            </div>
                                            {ex.details.map((detail, setIndex) => (
                                                 <div key={setIndex} className="grid grid-cols-5 gap-2 items-center bg-gray-50 p-2 rounded-lg">
                                                    <span className="font-bold text-center">#{setIndex + 1}</span>
                                                    <Input value={detail.reps} onChange={e => onUpdateExercise(ex.id, 'reps', e.target.value, setIndex)} className="text-center" disabled={locked} />
                                                    <div className="col-span-2 flex">
                                                        <Input type="number" className="rounded-r-none text-center" value={detail.load.value} onChange={e => onUpdateExercise(ex.id, 'load.value', e.target.value, setIndex)} disabled={locked} />
                                                        <Select className="rounded-l-none -ml-px" value={detail.load.unit} onChange={e => onUpdateExercise(ex.id, 'load.unit', e.target.value, setIndex)} disabled={locked}>
                                                            <option>kg</option><option>%</option><option>RPE</option><option>km/h</option><option>W</option><option>lvl</option>
                                                        </Select>
                                                    </div>
                                                    <Input value={detail.rest} onChange={e => onUpdateExercise(ex.id, 'rest', e.target.value, setIndex)} className="text-center" disabled={locked} />
                                                </div>
                                            ))}
                                        </div>
                                    )}

                                     <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <label className="font-semibold text-gray-700 mb-2">
                                                Intensification
                                            </label>
                                            <Select value={ex.intensification?.[0]?.value || 'Aucune'} onChange={(e) => onUpdateExercise(ex.id, 'intensification', e.target.value)} disabled={locked}>
                                                <option>Aucune</option><option>Drop Set</option>
                                            </Select>
                                        </div>
                                        <div>
                                            <label className="font-semibold text-gray-700">Alternative</label>
                                             <div className="grid grid-cols-2 gap-2 mt-2">
                                                {ex.alternatives.map(alt => (
                                                    <Card key={alt.id} className="relative">
                                                        <img src={alt.illustrationUrl} alt={alt.name} className="rounded-t-lg"/>
                                                        <p className="p-1 text-xs font-semibold">{alt.name}</p>
                                                        <button onClick={() => {}} className="absolute -top-1 -right-1 bg-gray-600 text-white rounded-full p-0.5 hover:bg-red-500" disabled={locked}><XMarkIcon className="w-3 h-3"/></button>
                                                    </Card>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                )})}
                            </div>

                            <div className="text-center mt-6">
                                <button onClick={addExercise} className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center hover:bg-primary hover:text-white transition-colors" disabled={isLocked(selectedWeek, sessions.findIndex(s => s.id === activeSessionId))}>
                                    <PlusIcon className="w-6 h-6"/>
                                </button>
                            </div>
                        </div>
                    </div>
                </Card>

                <div className="flex justify-end gap-4 mt-auto pt-6">
                    <Button variant="primary" onClick={handleSave}>Valider</Button>
                </div>
            </main>

            {/* Right Sidebar */}
             <div className={`fixed top-[88px] right-6 h-[calc(100vh-112px)] transition-all duration-300 ease-in-out ${isFilterSidebarVisible ? 'w-[400px]' : 'w-0'}`}>
                <div className={`transition-opacity duration-300 ${isFilterSidebarVisible ? 'opacity-100' : 'opacity-0'}`}>
                     <ExerciseFilterSidebar db={availableExercises} />
                </div>
             </div>
             <button onClick={() => setIsFilterSidebarVisible(!isFilterSidebarVisible)} className="fixed top-1/2 -translate-y-1/2 bg-white p-2 rounded-l-full shadow-lg border border-r-0 transition-all duration-300 ease-in-out" style={{ right: isFilterSidebarVisible ? '424px' : '24px'}}>
                <ChevronDoubleRightIcon className={`w-5 h-5 text-gray-600 transition-transform ${isFilterSidebarVisible ? 'rotate-180' : ''}`} />
             </button>

            {selectedClient !== '0' && (
                <ClientHistoryModal 
                    clientId={selectedClient}
                    isOpen={isHistoryModalOpen}
                    isMinimized={isHistoryModalMinimized}
                    onClose={() => setIsHistoryModalOpen(false)}
                    onMinimize={() => setIsHistoryModalMinimized(true)}
                    onRestore={() => setIsHistoryModalMinimized(false)}
                />
            )}
        </div>
    );
};

export default WorkoutBuilder;