import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useSearchParams, useLocation } from 'react-router-dom';
import Card from '../components/Card.tsx';
import Input from '../components/Input.tsx';
import Select from '../components/Select.tsx';
import Button from '../components/Button.tsx';
import ToggleSwitch from '../components/ToggleSwitch.tsx';
import ExerciseFilterSidebar from '../components/ExerciseFilterSidebar.tsx';
import ExerciseCard from '../components/ExerciseCard.tsx';
import CollapsibleSection from '../components/CollapsibleSection.tsx';
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
import type { Json } from '../types/database.ts';
import { reconstructWorkoutProgram } from '../utils/workoutMapper.ts';
import { createSession, updateSession, deleteSession } from '../services/sessionService.ts';
import { createSessionExercisesBatch, deleteAllSessionExercises } from '../services/sessionExerciseService.ts';
import { assignProgramToClient } from '../services/programAssignmentService.ts';
import {
  getProgramById,
  getSessionsByProgramId,
  getSessionExercisesBySessionId,
  getExercisesByIds,
  createProgram,
  updateProgram as updateProgramService,
} from '../services/programService.ts';
import { 
  getClientSessionExercises,
  updateClientProgram,
  updateClientSession,
  createClientSession,
  deleteClientSession,
  createClientSessionExercisesBatch,
  deleteAllClientSessionExercises,
} from '../services/clientProgramService.ts';

import ClientHistoryModal from '../components/ClientHistoryModal.tsx';
import { useAuth } from '../context/AuthContext.tsx';
import {
  FolderIcon,
  PlusIcon,
  TrashIcon,
  XMarkIcon,
  DocumentDuplicateIcon,
  EllipsisHorizontalIcon,
  ChevronDoubleRightIcon,
  ChevronUpIcon,
  ListBulletIcon,
  LockClosedIcon,
} from '../constants/icons.ts';

type EditableWorkoutExercise = WorkoutExercise & {
  dbId?: string;
  notes?: string | null;
};

type EditableWorkoutSession = WorkoutSession & {
  dbId?: string;
  weekNumber?: number;
  exercises: EditableWorkoutExercise[];
  templateSessionId?: number;
};

type SessionsByWeekState = Record<number, EditableWorkoutSession[]>;

const FILTER_SIDEBAR_WIDTH = 400;
const FILTER_SIDEBAR_GAP = 24;

const isFormLikeElement = (element: HTMLElement | null): boolean => {
  if (!element) {
    return false;
  }

  const tagName = element.tagName;

  if (tagName === 'INPUT' || tagName === 'TEXTAREA' || tagName === 'SELECT') {
    return true;
  }

  if (element.isContentEditable) {
    return true;
  }

  const role = element.getAttribute('role');
  return role === 'combobox';
};

const DEFAULT_SESSION: EditableWorkoutSession = {
  id: 1,
  name: 'Séance 1',
  exercises: [],
  templateSessionId: 1,
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

  return details.map((detail) => ({
    reps: detail?.reps ?? DEFAULT_DETAIL_TEMPLATE.reps,
    load: {
      value: detail?.load?.value ?? DEFAULT_DETAIL_TEMPLATE.load.value,
      unit: detail?.load?.unit ?? DEFAULT_DETAIL_TEMPLATE.load.unit,
    },
    tempo: detail?.tempo ?? DEFAULT_DETAIL_TEMPLATE.tempo,
    rest: detail?.rest ?? DEFAULT_DETAIL_TEMPLATE.rest,
  }));
};

// Fonction de normalisation pour garantir que les exercices ont toujours des structures valides
const normalizeWorkoutExercise = (exercise: WorkoutExercise): EditableWorkoutExercise => {
  const detailsSource = Array.isArray(exercise.details) ? exercise.details : [];
  const normalizedDetails = detailsSource.length > 0
    ? detailsSource.map(detail => ({
        reps: detail?.reps ?? DEFAULT_DETAIL_TEMPLATE.reps,
        tempo: detail?.tempo ?? DEFAULT_DETAIL_TEMPLATE.tempo,
        rest: detail?.rest ?? DEFAULT_DETAIL_TEMPLATE.rest,
        load: {
          value: detail?.load?.value ?? DEFAULT_DETAIL_TEMPLATE.load.value,
          unit: detail?.load?.unit ?? DEFAULT_DETAIL_TEMPLATE.load.unit,
        },
      }))
    : [createDefaultDetail()];

  // Préserver dbId pour les exercices existants
  const exerciseWithDbId = exercise as EditableWorkoutExercise;
  
  return {
    ...exercise,
    dbId: exerciseWithDbId.dbId, // Préserver l'ID de la base de données
    sets: exercise.sets ?? String(normalizedDetails.length),
    details: normalizedDetails,
    intensification: Array.isArray(exercise.intensification) ? exercise.intensification : [],
    alternatives: Array.isArray(exercise.alternatives) ? exercise.alternatives : [],
  };
};

// Fonction de normalisation pour garantir que les séances ont toujours des exercices valides
const normalizeWorkoutSession = (session: WorkoutSession): EditableWorkoutSession => {
  // Pour les programmes clients, session.id est l'UUID de la base de données
  // On le préserve dans dbId pour permettre les mises à jour
  const sessionWithDbId = session as EditableWorkoutSession;
  const isUUID = typeof session.id === 'string' && session.id.includes('-');
  
  return {
    ...session,
    // Préserver dbId s'il existe, sinon utiliser id s'il s'agit d'un UUID
    dbId: sessionWithDbId.dbId ?? (isUUID ? session.id as unknown as string : undefined),
    templateSessionId: sessionWithDbId.templateSessionId,
    exercises: (session.exercises ?? []).map(normalizeWorkoutExercise),
  } as EditableWorkoutSession;
};

const assignTemplateSessionIds = (state: SessionsByWeekState): SessionsByWeekState => {
  const baseWeek = state[1] || [];
  const updatedWeekOne = baseWeek.map((session) => ({
    ...session,
    templateSessionId: session.templateSessionId ?? session.id,
  }));

  const templateOrder = updatedWeekOne.map((session) => session.templateSessionId!);
  const updatedState: SessionsByWeekState = { ...state, 1: updatedWeekOne };

  Object.entries(state).forEach(([weekKey, sessions]) => {
    const weekNumber = Number(weekKey);
    if (weekNumber === 1) return;
    if (!sessions) {
      updatedState[weekNumber] = [];
      return;
    }

    updatedState[weekNumber] = sessions.map((session, index) => {
      if (session.templateSessionId) {
        return session;
      }
      if (index < templateOrder.length) {
        return { ...session, templateSessionId: templateOrder[index] };
      }
      return session;
    });
  });

  return updatedState;
};

// Fonction de normalisation pour garantir que sessionsByWeek est toujours valide
const normalizeSessionsByWeek = (
  sessionsByWeek: Record<number, WorkoutSession[]> | undefined | null,
): SessionsByWeekState => {
  if (!sessionsByWeek || typeof sessionsByWeek !== 'object') {
    return { 1: [{ ...DEFAULT_SESSION, exercises: [] }] };
  }

  const entries = Object.entries(sessionsByWeek);
  if (entries.length === 0) {
    return { 1: [{ ...DEFAULT_SESSION, exercises: [] }] };
  }

  const normalized: SessionsByWeekState = {};
  entries.forEach(([week, sessions]) => {
    normalized[Number(week)] = (sessions ?? []).map(normalizeWorkoutSession);
  });
  return assignTemplateSessionIds(normalized);
};

const cloneExercise = (
  exercise: EditableWorkoutExercise,
  nextId: number
): EditableWorkoutExercise => ({
  ...exercise,
  id: nextId,
  dbId: undefined,
  details: ensureDetailsArray(exercise.details, exercise.sets).map((detail) => ({
    reps: detail.reps,
    load: { ...detail.load },
    tempo: detail.tempo,
    rest: detail.rest,
  })),
  intensification: Array.isArray(exercise.intensification)
    ? exercise.intensification.map((item) => ({ ...item }))
    : [],
  alternatives: Array.isArray(exercise.alternatives)
    ? exercise.alternatives.map((alternative) => ({ ...alternative }))
    : [],
});

const sanitizeSessionsByWeek = (state: SessionsByWeekState): Record<number, WorkoutSession[]> => {
  const sanitized: Record<number, WorkoutSession[]> = {};
  Object.entries(state).forEach(([weekKey, sessions]) => {
    sanitized[Number(weekKey)] = sessions.map((session) => ({
      id: session.id,
      name: session.name,
      exercises: session.exercises.map((exercise) => ({
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
  return Math.max(...allSessions.map((session) => session.id)) + 1;
};

const getNextExerciseId = (state: SessionsByWeekState): number => {
  const allExercises = Object.values(state).flatMap((sessionArray) =>
    sessionArray.flatMap((session) => session.exercises)
  );
  if (allExercises.length === 0) {
    return 1;
  }
  return Math.max(...allExercises.map((exercise) => exercise.id)) + 1;
};

// Fonction de clonage profond pour les exercices
const deepCloneExercise = (exercise: EditableWorkoutExercise, newId: number): EditableWorkoutExercise => ({
  ...exercise,
  id: newId,
  dbId: undefined,
  sets: exercise.sets,
  // Cloner profondément les détails en garantissant leur structure
  details: ensureDetailsArray(exercise.details, exercise.sets).map((detail) => ({
    reps: detail.reps,
    tempo: detail.tempo,
    rest: detail.rest,
    load: detail.load ? { ...detail.load } : { ...DEFAULT_DETAIL_TEMPLATE.load },
  })),
  // Cloner profondément les intensifications
  intensification: exercise.intensification ? exercise.intensification.map((int) => ({ ...int })) : [],
  // Cloner profondément les alternatives
  alternatives: exercise.alternatives ? exercise.alternatives.map((alt) => ({ ...alt })) : [],
});

// Fonction de clonage profond pour les séances
const deepCloneSession = (session: EditableWorkoutSession, newSessionId: number, startExerciseId: number): EditableWorkoutSession => {
  let currentExerciseId = startExerciseId;
  return {
    ...session,
    id: newSessionId,
    dbId: undefined,
    // Cloner profondément tous les exercices
    exercises: session.exercises.map(ex => {
      const cloned = deepCloneExercise(ex, currentExerciseId);
      currentExerciseId++;
      return cloned;
    }),
    templateSessionId: session.templateSessionId ?? session.id,
  };
};

// buildSessionExercisesPayload supprimée - les exercices sont maintenant enregistrés directement dans session_exercises

const mirrorWeekOneStructure = (state: SessionsByWeekState): SessionsByWeekState => {
  const stateWithTemplates = assignTemplateSessionIds(state);
  const baseWeek = stateWithTemplates[1] || [];
  if (baseWeek.length === 0) {
    return stateWithTemplates;
  }

  const templateOrder = baseWeek.map((session) => session.templateSessionId!);
  const baseTemplateMap = new Map<number, EditableWorkoutSession>();
  baseWeek.forEach((session) => {
    baseTemplateMap.set(session.templateSessionId!, session);
  });

  let nextSessionId = getNextSessionId(stateWithTemplates);
  let nextExerciseId = getNextExerciseId(stateWithTemplates);

  const updatedState: SessionsByWeekState = { ...stateWithTemplates, 1: baseWeek };

  Object.entries(stateWithTemplates).forEach(([weekKey, sessions]) => {
    const weekNumber = Number(weekKey);
    if (weekNumber === 1) return;

    const customSessions = (sessions || []).filter(
      (session) => !session.templateSessionId || !templateOrder.includes(session.templateSessionId)
    );

    const mirroredTemplateSessions: EditableWorkoutSession[] = [];

    templateOrder.forEach((templateId) => {
      const baseSession = baseTemplateMap.get(templateId);
      if (!baseSession) return;

      const clonedSession = deepCloneSession(baseSession, nextSessionId, nextExerciseId);
      clonedSession.templateSessionId = templateId;
      mirroredTemplateSessions.push(clonedSession);
      nextSessionId++;
      nextExerciseId += baseSession.exercises.length;
    });

    updatedState[weekNumber] = [...mirroredTemplateSessions, ...customSessions];
  });

  return updatedState;
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
    // addProgram et updateProgram retirés - utilisation de createProgram et updateProgramService du service
    sessions: storedSessions,
    addNotification,
    reloadAllData,
  } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();

  const [programDraft, setProgramDraft] = useLocalStorage<WorkoutProgram | null>(
    'workout_draft',
    null
  );
  const [lastSavedAt, setLastSavedAt] = useLocalStorage<string | null>('last_saved_at', null);

  const [isLoading, setIsLoading] = useState(true);
  const [hasLoadedInitialData, setHasLoadedInitialData] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [isFilterSidebarVisible, setIsFilterSidebarVisible] = useState(true);
  const [workoutMode, setWorkoutMode] = useState<'session' | 'program'>('session');
  const [dropZoneSearchTerm, setDropZoneSearchTerm] = useState('');
  const [showDropZoneResults, setShowDropZoneResults] = useState(false);

  const [isGeneralInfoVisible, setIsGeneralInfoVisible] = useState(true);
  const [programName, setProgramName] = useState(programDraft?.name || 'Nouveau programme');
  const [objective, setObjective] = useState(programDraft?.objective || '');
  const [weekCount, setWeekCount] = useState<number | ''>(
    programDraft?.weekCount && programDraft.weekCount > 0 ? programDraft.weekCount : 1
  ); // State for Week 1 creation lock
  const [isWeek1LockActive, setIsWeek1LockActive] = useState(false);

  const handleWeekCountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    if (val === '') {
      setWeekCount('');
    } else {
      const num = parseInt(val, 10);
      if (!Number.isNaN(num) && num >= 1) {
        const newWeekCount = Math.min(num, 52);
        const currentWeekCount = typeof weekCount === 'number' ? weekCount : 1;
        
        // Si on augmente le nombre de semaines, dupliquer la semaine 1 sur les nouvelles semaines
        if (newWeekCount > currentWeekCount) {
          console.log(`[handleWeekCountChange] Augmentation de ${currentWeekCount} à ${newWeekCount} semaines - duplication de la semaine 1`);

          setSessionsByWeek((prev) => {
            const prevWithTemplates = assignTemplateSessionIds(prev);
            const ensuredWeeks: SessionsByWeekState = { ...prevWithTemplates };

            // S'assurer que toutes les semaines existent avant la duplication
            for (let week = 1; week <= newWeekCount; week++) {
              ensuredWeeks[week] = ensuredWeeks[week] || [];
            }

            // Utiliser la logique de mirroring pour reproduire intégralement la semaine 1
            const mirroredState = mirrorWeekOneStructure(ensuredWeeks);

            // Ne conserver que les semaines nécessaires
            const trimmedState: SessionsByWeekState = {};
            for (let week = 1; week <= newWeekCount; week++) {
              trimmedState[week] = mirroredState[week] || [];
            }

            return trimmedState;
          });
        }
        
        setWeekCount(newWeekCount);
      }
    }
  };

  const handleWeekCountBlur = () => {
    if (weekCount === '' || Number(weekCount) < 1) {
      setWeekCount(1);
    }
  };

  const handleResetBuilder = () => {
    const shouldReset = window.confirm(
      "Voulez-vous vraiment vider toutes les séances et exercices en cours ?"
    );

    if (!shouldReset) return;

    const resetSession = { ...DEFAULT_SESSION, exercises: [] };

    setWorkoutMode('session');
    setProgramName('Nouveau programme');
    setObjective('');
    setWeekCount(1);
    setSelectedClient('0');
    setIsEditMode(false);
    setEditProgramId(null);
    setLockedUntil(null);
    setIsWeek1LockActive(false);
    setSessionsByWeek(normalizeSessionsByWeek({ 1: [resetSession] }));
    setSelectedWeek(1);
    setActiveSessionId(DEFAULT_SESSION.id);
    setSelectedExerciseIds([]);
    setDropZoneSearchTerm('');
    setShowDropZoneResults(false);
    setActiveSearchBox(null);
    setIsHistoryModalOpen(false);
    setIsHistoryModalMinimized(false);
    setHasUnsavedChanges(false);
    setProgramDraft(null);
    setLastSavedAt(null);
  };

  const clientOptions = useMemo<{ value: string; label: string }[]>(() => {
    // Vérifier que clients est défini avant de filtrer
    if (!clients || !Array.isArray(clients)) {
      return [{ value: '0', label: 'Aucun client' }];
    }

    const myClients = clients.filter(
      (c) =>
        c.role === 'client' &&
        c.status === 'active' &&
        (user?.role === 'admin' || c.coachId === user?.id)
    );
    return [
      { value: '0', label: 'Aucun client' },
      ...(myClients || []).map((c) => ({ value: c.id, label: `${c.firstName} ${c.lastName}` })),
    ];
  }, [clients, user]);

  const [selectedClient, setSelectedClient] = useState('0');
  const [isEditMode, setIsEditMode] = useState(false);
  const [editProgramId, setEditProgramId] = useState<string | null>(null);
  const [isEditingClientProgram, setIsEditingClientProgram] = useState(false);
  const [lockedUntil, setLockedUntil] = useState<{ week: number; sessionIndex: number } | null>(
    null
  );

  const clientData = useMemo(() => {
    if (selectedClient === '0' || !clients || !Array.isArray(clients)) return null;
    return clients.find((c) => c.id === selectedClient);
  }, [selectedClient, clients]);

  const [sessionsByWeek, setSessionsByWeek] = useState<SessionsByWeekState>(() => {
    const initial = programDraft?.sessionsByWeek;
    if (initial && typeof initial === 'object' && Object.keys(initial).length > 0) {
      return normalizeSessionsByWeek(initial);
    }
    // Ensure DEFAULT_SESSION is a fresh copy to prevent shared references
    return normalizeSessionsByWeek({ 1: [{ ...DEFAULT_SESSION, exercises: [] }] });
  });
  const [selectedWeek, setSelectedWeek] = useState<number>(1);
  const [activeSessionId, setActiveSessionId] = useState(DEFAULT_SESSION.id);

  const [draggedOverExerciseId, setDraggedOverExerciseId] = useState<number | null>(null);
  const [activeSearchBox, setActiveSearchBox] = useState<{
    sessionId: number;
    exerciseId: number;
  } | null>(null);
  const [selectedExerciseIds, setSelectedExerciseIds] = useState<number[]>([]);

  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [isHistoryModalMinimized, setIsHistoryModalMinimized] = useState(false);

  const exerciseDragItem = useRef<number | null>(null);
  const exerciseDragOverItem = useRef<number | null>(null);
  const sessionDragItem = useRef<number | null>(null);
  const sessionDragOverItem = useRef<number | null>(null);
  const dropZoneRef = useRef<HTMLDivElement | null>(null);
  const previousModeRef = useRef<'session' | 'program'>(workoutMode);

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
    return sessions.find((s) => s.id === activeSessionId);
  }, [sessions, activeSessionId]);

  // Assurer la conversion automatique vers le mode programme et la duplication des semaines
  useEffect(() => {
    if (!hasLoadedInitialData || workoutMode !== 'program') {
      previousModeRef.current = workoutMode;
      return;
    }

    const totalWeeks = typeof weekCount === 'number' && weekCount > 0 ? weekCount : 1;
    const switchedFromSession = previousModeRef.current === 'session';

    let needsDuplication = switchedFromSession;
    if (!needsDuplication) {
      for (let week = 2; week <= totalWeeks; week++) {
        if (!sessionsByWeek[week] || sessionsByWeek[week].length === 0) {
          needsDuplication = true;
          break;
        }
      }
    }

    if (!needsDuplication) {
      previousModeRef.current = workoutMode;
      return;
    }

    let nextActiveSessionId: number | null = null;
    let didChange = false;

    setSessionsByWeek((prev) => {
      const prevWithTemplates = assignTemplateSessionIds(prev);
      const newSessionsByWeek = { ...prevWithTemplates };

      if (!newSessionsByWeek[1] || newSessionsByWeek[1].length === 0) {
        didChange = true;
        const newSessionId = getNextSessionId(newSessionsByWeek);
        newSessionsByWeek[1] = [{ ...DEFAULT_SESSION, id: newSessionId, exercises: [], templateSessionId: newSessionId }];
      }

      const baseWeekSessions = newSessionsByWeek[1] || [];
      nextActiveSessionId = baseWeekSessions[0]?.id ?? null;

      if (baseWeekSessions.length === 0) {
        return newSessionsByWeek;
      }

      for (let week = 2; week <= totalWeeks; week++) {
        if (!newSessionsByWeek[week] || newSessionsByWeek[week].length === 0) {
          didChange = true;
          let currentSessionId = getNextSessionId(newSessionsByWeek);
          let currentExerciseId = getNextExerciseId(newSessionsByWeek);

          newSessionsByWeek[week] = baseWeekSessions.map((session) => {
            const clonedSession = deepCloneSession(session, currentSessionId, currentExerciseId);
            clonedSession.templateSessionId = session.templateSessionId ?? session.id;
            currentSessionId++;
            currentExerciseId += session.exercises.length;
            return clonedSession;
          });
        }
      }

      return newSessionsByWeek;
    });

    if (switchedFromSession && nextActiveSessionId !== null) {
      setActiveSessionId(nextActiveSessionId);
      setSelectedWeek(1);
    }

    if (didChange) {
      setHasUnsavedChanges(true);
    }

    previousModeRef.current = workoutMode;
  }, [workoutMode, hasLoadedInitialData, weekCount, sessionsByWeek]);

  // Fonction pour vérifier si une semaine/séance est bloquée
  const isWeekLocked = (week: number): boolean => {
    if (!lockedUntil) return false;
    return week < lockedUntil.week || (week === lockedUntil.week && lockedUntil.sessionIndex === -1);
  };

  const isSessionLocked = (week: number, sessionIndex: number): boolean => {
    if (!lockedUntil) return false;
    // Si la semaine est avant la semaine de verrouillage, elle est complètement bloquée
    if (week < lockedUntil.week) return true;
    // Si c'est la semaine de verrouillage, vérifier l'index de la séance
    if (week === lockedUntil.week) {
      return sessionIndex <= lockedUntil.sessionIndex;
    }
    // Les semaines futures ne sont pas bloquées
    return false;
  };

  const isCurrentWeekLocked = isWeekLocked(selectedWeek);
  const currentWeekSessions = sessionsByWeek[selectedWeek] || [];
  const activeSessionIndex = currentWeekSessions.findIndex(s => s.id === activeSessionId);
  const isCurrentSessionLocked = isSessionLocked(selectedWeek, activeSessionIndex);

  // Assurer qu'une séance active existe toujours et sélectionner automatiquement la première séance
  useEffect(() => {
    const currentWeekSessions = sessionsByWeek[selectedWeek] || [];

    // Si aucune séance n'existe pour la semaine actuelle, en créer une
    if (currentWeekSessions.length === 0) {
      console.log('[WorkoutBuilder] Aucune séance trouvée pour la semaine', selectedWeek, '- création automatique');
      const newSessionId = getNextSessionId(sessionsByWeek);
      const newSession: EditableWorkoutSession = {
        id: newSessionId,
        name: 'Séance 1',
        exercises: [],
        templateSessionId: selectedWeek === 1 ? newSessionId : undefined,
      };
      setSessionsByWeek(prev => {
        const prevWithTemplates = assignTemplateSessionIds(prev);
        const updated = {
          ...prevWithTemplates,
          [selectedWeek]: [newSession]
        };
        // Ne pas appliquer le mirroring pour les programmes clients
        if (selectedWeek === 1 && !isEditingClientProgram) {
          return mirrorWeekOneStructure(updated);
        }
        return updated;
      });
      setActiveSessionId(newSessionId);
    } else {
      // Vérifier si la séance active existe dans la semaine actuelle
      const activeExists = currentWeekSessions.some(s => s.id === activeSessionId);
      if (!activeExists) {
        console.log('[WorkoutBuilder] Séance active non trouvée - sélection automatique de la première séance');
        setActiveSessionId(currentWeekSessions[0].id);
      }
    }
  }, [selectedWeek, sessionsByWeek, activeSessionId]);

  const availableExercises = useMemo(() => {
    // Vérifier que exerciseDBFromAuth est défini
    if (!exerciseDBFromAuth || !Array.isArray(exerciseDBFromAuth)) {
      console.warn('[WorkoutBuilder] Aucun exercice disponible depuis exerciseDBFromAuth');
      return [];
    }
    
    console.log('[WorkoutBuilder] Exercices bruts depuis Auth:', exerciseDBFromAuth.length);
    
    let filtered;
    if (mode === 'client') {
      // Client : exercices système (coachId null) + exercices de son coach
      filtered = exerciseDBFromAuth.filter(
        (ex) => !ex.coachId || ex.coachId === user?.coachId
      );
      console.log('[WorkoutBuilder] Mode client - Exercices filtrés:', filtered.length);
    } else {
      // Coach : exercices système (coachId null) + ses propres exercices
      filtered = exerciseDBFromAuth.filter(
        (ex) => !ex.coachId || ex.coachId === user?.id
      );
      console.log('[WorkoutBuilder] Mode coach - Exercices filtrés:', filtered.length);
    }
    
    return filtered;
  }, [exerciseDBFromAuth, user, mode]);

  // Filtrer les exercices pour la recherche dans la drop zone
  const dropZoneFilteredExercises = useMemo(() => {
    if (!dropZoneSearchTerm.trim()) {
      return [];
    }
    return availableExercises.filter((ex) =>
      ex.name.toLowerCase().includes(dropZoneSearchTerm.toLowerCase())
    );
  }, [availableExercises, dropZoneSearchTerm]);

  const handleClientSelectionChange = async (value: string | string[]) => {
    const clientId = Array.isArray(value) ? value[0] : value;
    setSelectedClient(clientId);
    
    // Forcer le chargement des bilans si un client est sélectionné
    if (clientId !== '0') {
      try {
        console.log('[WorkoutBuilder] Forcing load of assessments for client:', clientId);
        await getClientPerformanceLogs(clientId); // Cette fonction charge aussi les données client dans le store
      } catch (error) {
        console.error('[WorkoutBuilder] Error loading client assessments:', error);
      }
    }

    if (clientId === '0') {
      setObjective('');
    } else {
      const client = clients?.find((c) => c.id === clientId);
      if (client) {
        setObjective(client.objective || '');
      }
    }
  };

  useEffect(() => {
    // Éviter de recharger si les données initiales sont déjà chargées
    if (hasLoadedInitialData) return;

    const clientIdFromUrl = searchParams.get('clientId');
    const programIdToEdit = searchParams.get('editProgramId');
    const sessionIdToEdit = searchParams.get('editSessionId');
    const programType = searchParams.get('programType'); // 'client' ou 'template'
    
    // Debug: log des paramètres URL
    console.log('[WorkoutBuilder] URL params:', { clientIdFromUrl, programIdToEdit, sessionIdToEdit, programType });
    
    // Vérifier si programIdToEdit est invalide
    if (programIdToEdit && (programIdToEdit === 'undefined' || programIdToEdit === 'null')) {
      console.error('[WorkoutBuilder] ID de programme invalide détecté:', programIdToEdit);
      addNotification({ message: 'Aucun programme à modifier pour ce client.', type: 'error' });
      navigate('/app');
      setIsLoading(false);
      setHasLoadedInitialData(true);
      return;
    }

    const loadProgramFromSupabase = async (programId: string, isClientProgram: boolean = false) => {
      setIsLoading(true);
      try {
        let program;
        let sessions;
        
        if (isClientProgram) {
          // Charger depuis client_programs (tout en une seule requête optimisée)
          const { getClientProgramById } = await import('../services/clientProgramService');
          const clientProgram = await getClientProgramById(programId);
          
          if (!clientProgram) {
            addNotification({ message: 'Programme client non trouvé.', type: 'error' });
            navigate('/app');
            return;
          }
          
          // Les données sont déjà complètement chargées, on les utilise directement
          console.log('[WorkoutBuilder] Données chargées depuis getClientProgramById:', {
            sessionsByWeek: clientProgram.sessionsByWeek,
            totalSessions: Object.values(clientProgram.sessionsByWeek || {}).flat().length,
            exercisesPerSession: Object.entries(clientProgram.sessionsByWeek || {}).map(([week, sessions]) => ({
              week,
              sessions: (sessions as any[]).map(s => ({ name: s.name, exerciseCount: s.exercises?.length || 0 }))
            }))
          });
          setProgramName(clientProgram.name);
          setObjective(clientProgram.objective);
          setWeekCount(clientProgram.weekCount);
          setSessionsByWeek(normalizeSessionsByWeek(clientProgram.sessionsByWeek));
          setSelectedClient(clientIdFromUrl || '0');
          setEditProgramId(programId);
          setIsEditMode(true);
          setIsEditingClientProgram(true); // Marquer qu'on édite un programme client
          setWorkoutMode('program'); // Positionner sur Programme par défaut
          
          // Positionner sur la semaine en cours
          if (clientProgram.currentWeek) {
            setSelectedWeek(clientProgram.currentWeek);
          }
          
          // Bloquer les séances validées (semaines passées + séances passées de la semaine en cours)
          // lockedUntil.week = dernière semaine complètement bloquée
          // lockedUntil.sessionIndex = dernière séance bloquée dans la semaine suivante (0-indexed)
          if (clientProgram.currentWeek && clientProgram.currentSession) {
            // Si on est à la première séance d'une semaine, bloquer toutes les semaines précédentes
            if (clientProgram.currentSession === 1) {
              setLockedUntil({ 
                week: clientProgram.currentWeek - 1, // Bloquer jusqu'à la semaine précédente
                sessionIndex: -1 // Toutes les séances de cette semaine sont bloquées
              });
            } else {
              // Sinon, bloquer les séances précédentes de la semaine en cours
              setLockedUntil({ 
                week: clientProgram.currentWeek,
                sessionIndex: clientProgram.currentSession - 2 // -2 car 0-indexed et on veut bloquer jusqu'avant la séance en cours
              });
            }
          }
          
          addNotification({ message: 'Programme client chargé.', type: 'info' });
          setIsLoading(false);
          setHasLoadedInitialData(true);
          return; // Sortir ici pour éviter le traitement supplémentaire
        } else {
          // Charger depuis program_templates (comportement existant)
          program = await getProgramById(programId);
          if (!program) {
            addNotification({ message: 'Programme non trouvé dans Supabase.', type: 'error' });
            navigate('/app');
            return;
          }
          sessions = await getSessionsByProgramId(programId);
        }
        
        if (!program) {
          addNotification({ message: 'Programme non trouvé.', type: 'error' });
          navigate('/app');
          return;
        }

        const allSessionExercises: Map<string, SupabaseSessionExercise[]> = new Map();
        const exerciseIds = new Set<string>();

        for (const session of sessions) {
          const exercises = isClientProgram 
            ? await getClientSessionExercises(session.id)
            : await getSessionExercisesBySessionId(session.id);
          allSessionExercises.set(session.id, exercises);
          exercises.forEach((ex) => exerciseIds.add(ex.exercise_id));
        }

        const exerciseDetails = await getExercisesByIds(Array.from(exerciseIds));

        const reconstructedProgram = reconstructWorkoutProgram(
          program,
          sessions,
          allSessionExercises,
          exerciseDetails
        );

        setProgramName(reconstructedProgram.name);
        setObjective(reconstructedProgram.objective);
        setWeekCount(reconstructedProgram.weekCount);
        // Normaliser sessionsByWeek pour garantir des structures valides
        setSessionsByWeek(normalizeSessionsByWeek(reconstructedProgram.sessionsByWeek));
        setSelectedClient(reconstructedProgram.clientId || '0');
        setEditProgramId(programId);
        setIsEditMode(true);

        addNotification({ message: 'Programme chargé depuis Supabase.', type: 'info' });

        if (clientIdFromUrl) {
          setSelectedClient(clientIdFromUrl);
          const client = clients?.find((c) => c.id === clientIdFromUrl);
          if (client) {
            const lockWeek = client.programWeek || 1;
            const lockSessionIndex = (client.sessionProgress || 1) - 1;
            setLockedUntil({ week: lockWeek, sessionIndex: lockSessionIndex });
          }
        }
      } catch (error) {
        console.error('Erreur lors du chargement du programme depuis Supabase:', error);
        addNotification({ message: 'Erreur lors du chargement du programme.', type: 'error' });
        navigate('/app');
      } finally {
        setIsLoading(false);
      }
    };

    const loadSessionFromSupabase = async (sessionId: string) => {
      setIsLoading(true);
      try {
        addNotification({
          message:
            'Chargement de session individuelle non implémenté. Chargez via le programme parent.',
          type: 'warning',
        });
        navigate('/app');
      } catch (error) {
        console.error('Erreur lors du chargement de la session depuis Supabase:', error);
        addNotification({ message: 'Erreur lors du chargement de la session.', type: 'error' });
        navigate('/app');
      } finally {
        setIsLoading(false);
      }
    };

    if (programIdToEdit) {
      loadProgramFromSupabase(programIdToEdit, programType === 'client');
    } else if (sessionIdToEdit) {
      loadSessionFromSupabase(sessionIdToEdit);
    } else {
      setIsEditMode(false);
      if (programDraft) {
        setProgramName(programDraft.name);
        setObjective(programDraft.objective);
        setWeekCount(programDraft.weekCount);
        // Normaliser sessionsByWeek pour garantir des structures valides
        setSessionsByWeek(normalizeSessionsByWeek(programDraft.sessionsByWeek));
        if (clientIdFromUrl && clients.some((c) => c.id === clientIdFromUrl)) {
          setSelectedClient(clientIdFromUrl);
        }
        addNotification({ message: 'Brouillon chargé depuis le stockage local.', type: 'info' });
      } else {
        setProgramName('Nouveau programme');
        setObjective('');
        setWeekCount(1);
        setSessionsByWeek(normalizeSessionsByWeek({ 1: [DEFAULT_SESSION] }));
      }
      setIsLoading(false);
    }
    
    // Marquer les données comme chargées
    setHasLoadedInitialData(true);
  }, [
    searchParams,
    addNotification,
    navigate,
    clients,
    programDraft,
    setProgramDraft,
    setLastSavedAt,
    hasLoadedInitialData,
  ]);

  // Debounce pour éviter les re-renders excessifs pendant la saisie
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (
        !isLoading &&
        programName &&
        objective &&
        weekCount > 0 &&
        Object.keys(sessionsByWeek).length > 0
      ) {
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
    }, 500); // Attendre 500ms après la dernière modification

    return () => clearTimeout(timeoutId);
  }, [
    programName,
    objective,
    weekCount,
    sessionsByWeek,
    user,
    selectedClient,
    editProgramId,
    setProgramDraft,
    isLoading,
  ]);

  useEffect(() => {
    if (!isSaving && hasUnsavedChanges && lastSavedAt) {
      setHasUnsavedChanges(false);
    }
  }, [isSaving, lastSavedAt, hasUnsavedChanges]);

  // Gérer le clic extérieur pour fermer la liste de résultats de la drop zone
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropZoneRef.current && !dropZoneRef.current.contains(event.target as Node)) {
        setShowDropZoneResults(false);
      }
    };

    if (showDropZoneResults) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showDropZoneResults]);

  // Détecter les changements de route pour quitter le créateur
  useEffect(() => {
    // Si l'URL ne contient plus '/musculation/createur', on est sorti du créateur
    if (!location.pathname.includes('/musculation/createur') && !location.pathname.includes('/workout/builder')) {
      // Réinitialiser le composant si nécessaire
      // La navigation est gérée par React Router, pas besoin d'action supplémentaire
      return;
    }
  }, [location.pathname]);

  const onUpdateExercise = useCallback(
    (exerciseId: number, field: string, value: unknown, setIndex?: number) => {
      const performUpdate = (
        sessionsToUpdate: EditableWorkoutSession[]
      ): EditableWorkoutSession[] => {
        return sessionsToUpdate.map((s) => {
          if (s.id !== activeSessionId) return s;
          return {
            ...s,
            exercises: s.exercises.map((ex) => {
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
                const newSets =
                  value === '' || Number.isNaN(parsedValue) || parsedValue < 0 ? 0 : parsedValue;
                const safeDetails = ensureDetailsArray(ex.details);
                const currentSets = safeDetails.length;
                let newDetails = [...safeDetails];
                if (newSets > currentSets) {
                  const lastDetail = safeDetails[currentSets - 1] || createDefaultDetail();
                  for (let i = 0; i < newSets - currentSets; i++) {
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
                  if (field === 'load.value')
                    return { ...detail, load: { ...detail.load, value: value } };
                  if (field === 'load.unit')
                    return { ...detail, load: { ...detail.load, unit: value } };
                  return { ...detail, [field]: value };
                };
                if (setIndex !== undefined) {
                  if (newDetails[setIndex]) {
                    newDetails[setIndex] = updateSingleDetail(newDetails[setIndex]);
                  }
                } else {
                  return newDetails.map(updateSingleDetail);
                }
                return newDetails;
              };

              const safeDetails = ensureDetailsArray(ex.details, ex.sets);
              return { ...ex, details: updateDetails(safeDetails) };
            }),
          };
        });
      };
      setSessionsByWeek((prev) => {
        const prevWithTemplates = assignTemplateSessionIds(prev);
        const updated = {
          ...prevWithTemplates,
          [selectedWeek]: performUpdate(prevWithTemplates[selectedWeek] || []),
        };
        // Ne pas appliquer le mirroring pour les programmes clients (chaque semaine est indépendante)
        if (selectedWeek === 1 && !isEditingClientProgram) {
          return mirrorWeekOneStructure(updated);
        }
        return updated;
      });
      setHasUnsavedChanges(true);
    },
    [activeSessionId, selectedWeek, isEditingClientProgram]
  );

  const addExercise = () => {
    console.log('addExercise appelé', { activeSession, activeSessionId, selectedWeek });
    if (!activeSession) {
      console.error('Impossible d\'ajouter un exercice : activeSession est undefined');
      return;
    }
    const newId = getNextExerciseId(sessionsByWeek);
    const newExercise: EditableWorkoutExercise = {
      id: newId,
      exerciseId: '',
      name: '',
      illustrationUrl: '',
      sets: '3',
      isDetailed: false,
      details: [
        { reps: '12', load: { value: '', unit: 'kg' }, tempo: '2010', rest: '60s' },
        { reps: '12', load: { value: '', unit: 'kg' }, tempo: '2010', rest: '60s' },
        { reps: '12', load: { value: '', unit: 'kg' }, tempo: '2010', rest: '60s' },
      ],
      intensification: [],
      alternatives: [],
    };
    setSessionsByWeek((prev) => {
      const prevWithTemplates = assignTemplateSessionIds(prev);
      const updated = {
        ...prevWithTemplates,
        [selectedWeek]: prevWithTemplates[selectedWeek].map((s) =>
          s.id === activeSessionId ? { ...s, exercises: [...s.exercises, newExercise] } : s
        ),
      };
      // Ne pas appliquer le mirroring pour les programmes clients
      const mirrored = (selectedWeek === 1 && !isEditingClientProgram) ? mirrorWeekOneStructure(updated) : updated;
      console.log('sessionsByWeek mis à jour', mirrored);
      return mirrored;
    });
    setHasUnsavedChanges(true);
    console.log('Exercice ajouté avec succès', newExercise);
  };

  const handleDeleteExercise = (exerciseId: number) => {
    setSessionsByWeek((prev) => {
      const prevWithTemplates = assignTemplateSessionIds(prev);
      const updated = {
        ...prevWithTemplates,
        [selectedWeek]: prevWithTemplates[selectedWeek].map((s) => {
          if (s.id !== activeSessionId) return s;
          return { ...s, exercises: s.exercises.filter((ex) => ex.id !== exerciseId) };
        }),
      };
      // Ne pas appliquer le mirroring pour les programmes clients
      if (selectedWeek === 1 && !isEditingClientProgram) {
        return mirrorWeekOneStructure(updated);
      }
      return updated;
    });
    setHasUnsavedChanges(true);
  };

  const handleDropExercise = (newExercise: Exercise) => {
    const newId = getNextExerciseId(sessionsByWeek);
    const defaultSets = 3;
    const newDetails = Array.from({ length: defaultSets }, () => createDefaultDetail());
    
    const exerciseToAdd: EditableWorkoutExercise = {
      id: newId,
      exerciseId: newExercise.id,
      name: newExercise.name,
      illustrationUrl: newExercise.illustrationUrl || '',
      sets: String(defaultSets),
      isDetailed: false,
      details: newDetails,
      intensification: [],
      alternatives: [],
    };
    
    setSessionsByWeek((prev) => {
      const prevWithTemplates = assignTemplateSessionIds(prev);
      const newSessionsByWeek = { ...prevWithTemplates };
      const currentWeekSessions = newSessionsByWeek[selectedWeek] || [];

      // Si aucune séance n'existe pour cette semaine, créer automatiquement "Séance 1"
      if (currentWeekSessions.length === 0) {
        const newSessionId = getNextSessionId(newSessionsByWeek);
        const newSession: EditableWorkoutSession = {
          id: newSessionId,
          name: 'Séance 1',
          exercises: [exerciseToAdd],
        };
        newSessionsByWeek[selectedWeek] = [newSession];
        // Définir cette nouvelle séance comme active
        setActiveSessionId(newSessionId);
      } else {
        // Ajouter l'exercice à la séance active
        newSessionsByWeek[selectedWeek] = currentWeekSessions.map((s) =>
          s.id === activeSessionId ? { ...s, exercises: [...s.exercises, exerciseToAdd] } : s
        );
      }
      
      // Ne pas appliquer le mirroring pour les programmes clients
      if (selectedWeek === 1 && !isEditingClientProgram) {
        return mirrorWeekOneStructure(newSessionsByWeek);
      }

      return newSessionsByWeek;
    });

    setHasUnsavedChanges(true);
  };

  const [isDragInteractionLocked, setIsDragInteractionLocked] = useState(false);

  const handleDragStart = useCallback((e: React.DragEvent, exerciseId: number) => {
    if (isDragInteractionLocked) {
      e.preventDefault();
      return;
    }
    exerciseDragItem.current = exerciseId;
  }, [isDragInteractionLocked]);

  const handleDragEnter = useCallback((e: React.DragEvent, exerciseId: number) => {
    if (isDragInteractionLocked) {
      return;
    }
    exerciseDragOverItem.current = exerciseId;
  }, [isDragInteractionLocked]);

  const handleDrop = useCallback(() => {
    const draggedExerciseId = exerciseDragItem.current;
    const droppedOnExerciseId = exerciseDragOverItem.current;

    if (draggedExerciseId === null || droppedOnExerciseId === null) return;

    setSessionsByWeek((prev) => {
      const prevWithTemplates = assignTemplateSessionIds(prev);
      const newSessionsByWeek = { ...prevWithTemplates };
      const currentSessions = newSessionsByWeek[selectedWeek];

      if (!currentSessions) return prev;

      const newSessions = currentSessions.map((s) => {
        if (s.id !== activeSessionId) return s;

        let exercises = [...s.exercises];
        const draggedIndex = exercises.findIndex((ex) => ex.id === draggedExerciseId);
        const droppedIndex = exercises.findIndex((ex) => ex.id === droppedOnExerciseId);

        if (draggedIndex === -1 || droppedIndex === -1) return s;

        const [reorderedItem] = exercises.splice(draggedIndex, 1);
        exercises.splice(droppedIndex, 0, reorderedItem);

        return { ...s, exercises };
      });

      const updated = { ...newSessionsByWeek, [selectedWeek]: newSessions };
      // Ne pas appliquer le mirroring pour les programmes clients
      if (selectedWeek === 1 && !isEditingClientProgram) {
        return mirrorWeekOneStructure(updated);
      }
      return updated;
    });
    setHasUnsavedChanges(true);
    exerciseDragItem.current = null;
    exerciseDragOverItem.current = null;
  }, [activeSessionId, selectedWeek, isEditingClientProgram]);

  const toggleExerciseSelection = useCallback((exerciseId: number) => {
    setSelectedExerciseIds((prev) => {
      if (prev.includes(exerciseId)) {
        return prev.filter((id) => id !== exerciseId);
      } else {
        return [...prev, exerciseId];
      }
    });
  }, []);

  const handleAddWeek = () => {
    setSessionsByWeek((prev) => ({
      ...prev,
      [Object.keys(prev).length + 1]: [DEFAULT_SESSION],
    }));
    setHasUnsavedChanges(true);
  };

  const handleDeleteWeek = (week: number) => {
    setSessionsByWeek((prev) => {
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
    setSessionsByWeek((prev) => {
      const prevWithTemplates = assignTemplateSessionIds(prev);
      const newSessionsByWeek = { ...prevWithTemplates };
      const currentWeekSessions = newSessionsByWeek[selectedWeek] || [];
      const newSessionId = getNextSessionId(newSessionsByWeek);
      const newSession: EditableWorkoutSession = {
        id: newSessionId,
        name: `Séance ${currentWeekSessions.length + 1}`,
        exercises: [],
        templateSessionId: selectedWeek === 1 ? newSessionId : undefined,
      };
      const updatedWeekSessions = [...currentWeekSessions, newSession];
      newSessionsByWeek[selectedWeek] = updatedWeekSessions;
      // Ne pas appliquer le mirroring pour les programmes clients
      if (selectedWeek === 1 && !isEditingClientProgram) {
        return mirrorWeekOneStructure(newSessionsByWeek);
      }
      return newSessionsByWeek;
    });
    setHasUnsavedChanges(true);
  };

  const handleDeleteSession = (sessionId: number) => {
    setSessionsByWeek((prev) => {
      const prevWithTemplates = assignTemplateSessionIds(prev);
      const newSessionsByWeek = { ...prevWithTemplates };
      newSessionsByWeek[selectedWeek] = (newSessionsByWeek[selectedWeek] || []).filter(
        (s) => s.id !== sessionId
      );
      // Ne pas appliquer le mirroring pour les programmes clients
      if (selectedWeek === 1 && !isEditingClientProgram) {
        return mirrorWeekOneStructure(newSessionsByWeek);
      }
      return newSessionsByWeek;
    });
    setHasUnsavedChanges(true);
    if (activeSessionId === sessionId) {
      setActiveSessionId(sessionsByWeek[selectedWeek]?.[0]?.id || DEFAULT_SESSION.id);
    }
  };

  const handleDuplicateSession = () => {
    if (!activeSession) return;

    setSessionsByWeek((prev) => {
      const prevWithTemplates = assignTemplateSessionIds(prev);
      const newSessionsByWeek = { ...prevWithTemplates };
      const currentWeekSessions = newSessionsByWeek[selectedWeek] || [];
      const newSessionId = getNextSessionId(newSessionsByWeek);
      let nextExerciseId = getNextExerciseId(newSessionsByWeek);

      const duplicatedSession: EditableWorkoutSession = {
        ...activeSession,
        id: newSessionId,
        name: `${activeSession.name} (copie)`,
        exercises: activeSession.exercises.map((ex) => {
          const clonedExercise = cloneExercise(ex, nextExerciseId);
          nextExerciseId += 1;
          return clonedExercise;
        }),
        templateSessionId: selectedWeek === 1 ? newSessionId : undefined,
        dbId: undefined,
      };

      newSessionsByWeek[selectedWeek] = [...currentWeekSessions, duplicatedSession];
      // Ne pas appliquer le mirroring pour les programmes clients
      if (selectedWeek === 1 && !isEditingClientProgram) {
        return mirrorWeekOneStructure(newSessionsByWeek);
      }
      return newSessionsByWeek;
    });
    setHasUnsavedChanges(true);
  };

  const onSave = async () => {
    setIsSaving(true);
    console.log('[onSave] Début de la sauvegarde du programme');
    
    try {
      // Étape 1 : Validation de l'utilisateur
      if (!user?.id) {
        throw new Error('Utilisateur non authentifié.');
      }
      console.log('[onSave] Utilisateur authentifié:', user.id);

      // Étape 2 : Validation des données du programme
      const week1Sessions = sessionsByWeek[1] || [];
      const sessionsPerWeek = week1Sessions.length;
      
      console.log('[onSave] Données du programme:', {
        programName,
        objective,
        weekCount,
        sessionsPerWeek,
        totalWeeks: Object.keys(sessionsByWeek).length,
        sessionsByWeek: Object.keys(sessionsByWeek).map(week => ({
          week,
          sessionCount: sessionsByWeek[parseInt(week)].length
        }))
      });

      // Validation : vérifier qu'il y a au moins une séance
      if (sessionsPerWeek === 0) {
        throw new Error('Impossible de sauvegarder un programme sans séance. Veuillez ajouter au moins une séance.');
      }

      const programData = {
        name: programName,
        objective: objective,
        week_count: typeof weekCount === 'number' ? weekCount : 1,
        sessions_per_week: sessionsPerWeek > 0 ? sessionsPerWeek : undefined,
        coach_id: user.id,
      };

      // Étape 3 : Sauvegarde du programme
      console.log('[onSave] Sauvegarde du programme...', programData, 'Type:', isEditingClientProgram ? 'client' : 'template');
      
      let savedProgram;
      if (isEditingClientProgram) {
        // Sauvegarder dans client_programs
        if (!editProgramId) {
          throw new Error('Impossible de créer un nouveau programme client depuis le créateur.');
        }
        savedProgram = await updateClientProgram(editProgramId, {
          name: programData.name,
          objective: programData.objective,
          week_count: programData.week_count,
        });
      } else {
        // Sauvegarder dans program_templates (comportement existant)
        savedProgram = editProgramId
          ? await updateProgramService(editProgramId, programData)
          : await createProgram(programData);
      }
      
      if (!savedProgram) {
        throw new Error('La sauvegarde du programme a échoué. Vérifiez les permissions et la connexion à la base de données.');
      }
      console.log('[onSave] Programme sauvegardé avec succès:', savedProgram.id);

      // Étape 4 : Préparation des sessions
      console.log('[onSave] Préparation des sessions...');
      const currentProgramSessions: Array<{ session: WorkoutSession; weekNumber: number; sessionOrder: number }> = [];
      Object.entries(sessionsByWeek).forEach(([week, sessions]) => {
        sessions.forEach((session, index) => {
          currentProgramSessions.push({ 
            session, 
            weekNumber: parseInt(week),
            sessionOrder: index + 1 // L'ordre de la séance dans la semaine (1, 2, 3...)
          });
        });
      });
      console.log('[onSave] Nombre total de sessions à sauvegarder:', currentProgramSessions.length);

      // Étape 5 : Suppression des sessions obsolètes
      const existingSessionIds = (storedSessions || [])
        .filter((s) => isEditingClientProgram ? s.client_program_id === savedProgram.id : s.program_template_id === savedProgram.id)
        .map((s) => s.id);
      const sessionsToDelete = existingSessionIds.filter(
        (id) => !currentProgramSessions.some((s) => s.session.dbId === id)
      );
      
      if (sessionsToDelete.length > 0) {
        console.log('[onSave] Suppression de', sessionsToDelete.length, 'sessions obsolètes');
        if (isEditingClientProgram) {
          await Promise.all(sessionsToDelete.map((id) => deleteClientSession(id)));
        } else {
          await Promise.all(sessionsToDelete.map((id) => deleteSession(id)));
        }
      }

      // Étape 6 : Sauvegarde des sessions et exercices (SÉQUENTIELLEMENT pour éviter les doublons)
      console.log('[onSave] Sauvegarde des sessions...');
      const savedSessions: any[] = [];
      
      for (let sessionIndex = 0; sessionIndex < currentProgramSessions.length; sessionIndex++) {
        const { session, weekNumber, sessionOrder } = currentProgramSessions[sessionIndex];
        try {
          console.log(`[onSave] Sauvegarde session ${sessionIndex + 1}/${currentProgramSessions.length}: ${session.name} (Semaine ${weekNumber}, Ordre ${sessionOrder})`);
          console.log(`[onSave] Session dbId: ${(session as any).dbId}, id: ${session.id}`);
          
          // Étape 6a : Sauvegarder la session (SANS les exercices)
          let savedSession;
          if (isEditingClientProgram) {
            // Sauvegarder dans client_sessions
            const clientIdFromUrl = searchParams.get('clientId');
            if (!clientIdFromUrl) {
              throw new Error('client_id manquant pour la création de séance client');
            }
            
            const sessionData = {
              client_program_id: savedProgram.id,
              client_id: clientIdFromUrl,
              name: session.name,
              week_number: weekNumber,
              session_order: sessionOrder,
            };
            savedSession = (session as any).dbId
              ? await updateClientSession((session as any).dbId, sessionData)
              : await createClientSession(sessionData);
          } else {
            // Sauvegarder dans session_templates (comportement existant)
            const sessionData = {
              program_template_id: savedProgram.id,
              name: session.name,
              week_number: weekNumber,
              session_order: sessionOrder,
            };
            savedSession = (session as any).dbId
              ? await updateSession((session as any).dbId, sessionData)
              : await createSession(sessionData);
          }

          if (!savedSession) {
            throw new Error(`La sauvegarde de la session ${session.name} (semaine ${weekNumber}) a échoué.`);
          }
          console.log(`[onSave] Session ${session.name} sauvegardée avec succès:`, savedSession.id);

          // Étape 6b : Supprimer les anciens exercices
          if (isEditingClientProgram) {
            console.log(`[onSave] Suppression des exercices pour session ID: ${savedSession.id}`);
            const deleteResult = await deleteAllClientSessionExercises(savedSession.id);
            console.log(`[onSave] Suppression exercices pour ${session.name}: ${deleteResult ? 'OK' : 'ERREUR'}`);
            // Attendre un court délai pour s'assurer que la suppression est propagée
            await new Promise(resolve => setTimeout(resolve, 100));
          } else {
            await deleteAllSessionExercises(savedSession.id);
          }

          // Étape 6c : Sauvegarder les exercices
          const currentSessionExercises = session.exercises;
          console.log(`[onSave] Session ${session.name} (Semaine ${weekNumber}) - ${currentSessionExercises.length} exercices à insérer`);
          
          if (currentSessionExercises.length > 0) {
            const exercisesToInsert = currentSessionExercises
              .filter(ex => ex.exerciseId)
              .map((exercise, index) => {
                const normalized = normalizeWorkoutExercise(exercise);
                const details = ensureDetailsArray(normalized.details, String(normalized.sets));
                const mainDetail = details[0] || createDefaultDetail();
                const parsedSets = parseInt(String(normalized.sets), 10);
                const sets = Number.isNaN(parsedSets) ? details.length : parsedSets;

                const baseExercise = {
                  exercise_id: normalized.exerciseId,
                  exercise_order: index + 1,
                  sets: sets,
                  reps: mainDetail.reps || '',
                  load: mainDetail.load?.value
                    ? `${mainDetail.load.value} ${mainDetail.load.unit || 'kg'}`
                    : '',
                  tempo: mainDetail.tempo || '',
                  rest_time: mainDetail.rest || '',
                  intensification: JSON.stringify(normalized.intensification || []),
                  notes: normalized.notes || '',
                  details: JSON.stringify(details),
                };

                if (isEditingClientProgram) {
                  const clientIdFromUrl = searchParams.get('clientId');
                  if (!clientIdFromUrl) {
                    throw new Error('client_id manquant pour la création d\'exercice client');
                  }
                  return {
                    ...baseExercise,
                    client_session_id: savedSession.id,
                    client_id: clientIdFromUrl,
                  };
                } else {
                  return {
                    ...baseExercise,
                    session_template_id: savedSession.id,
                    coach_id: user.id,
                  };
                }
              });

            if (exercisesToInsert.length > 0) {
              if (isEditingClientProgram) {
                await createClientSessionExercisesBatch(exercisesToInsert);
              } else {
                await createSessionExercisesBatch(exercisesToInsert);
              }
              console.log(`[onSave] ${exercisesToInsert.length} exercices enregistrés dans ${session.name}`);
            }
          }

          savedSessions.push(savedSession);
        } catch (sessionError: any) {
          console.error(`[onSave] Erreur lors de la sauvegarde de la session ${session.name}:`, sessionError);
          throw new Error(`Échec de la sauvegarde de la session "${session.name}" (semaine ${weekNumber}): ${sessionError.message}`);
        }
      }
      
      console.log('[onSave] Toutes les sessions et exercices ont été sauvegardés avec succès');

      // Étape 7 : Mise à jour de l'état local
      setEditProgramId(savedProgram.id);
      setIsEditMode(true);
      setLastSavedAt(new Date().toISOString());
      setHasUnsavedChanges(false);
      console.log('[onSave] État local mis à jour');

      addNotification({ message: 'Programme sauvegardé avec succès !', type: 'success' });

      // Rafraîchir les données pour que le template apparaisse immédiatement dans la bibliothèque
      console.log('[onSave] Rechargement des données...');
      await reloadAllData();
      console.log('[onSave] Données rechargées avec succès');

      // Si on édite un programme client, rediriger vers le dashboard pour voir les changements
      if (isEditingClientProgram) {
        console.log('[onSave] Redirection vers le dashboard après sauvegarde du programme client');
        // Afficher une notification de succès spécifique pour les programmes clients
        addNotification({ 
          message: 'Programme client modifié avec succès ! Redirection vers le tableau de bord...', 
          type: 'success' 
        });
        // Attendre un peu pour que l'utilisateur voie la notification
        await new Promise(resolve => setTimeout(resolve, 1500));
        navigate('/app', { replace: true });
        return;
      }

      // Étape 8 : Assignement automatique si un client est sélectionné
      if (selectedClient !== '0' && savedProgram.id) {
        console.log('[onSave] Assignement du programme au client:', selectedClient);
        const templateId = savedProgram.id;
        const clientId = selectedClient;
        const coachId = user.id;
        const startDate = new Date().toISOString().split('T')[0];

        try {
          // L'assignement est fait à partir du template (le programme que l'on vient de créer)
          const assignmentResult = await assignProgramToClient(templateId, clientId, coachId, startDate);

          if (assignmentResult?.success) {
            console.log('[onSave] Programme assigné avec succès au client');
            addNotification({
              message: `Programme sauvegardé et assigné automatiquement au client ${clientData?.firstName} !`,
              type: 'success',
            });
            await reloadAllData();
          } else {
            console.warn('[onSave] Échec de l\'assignement du programme au client', assignmentResult?.error);
            addNotification({
              message: `Programme sauvegardé, mais l'assignement automatique au client ${clientData?.firstName} a échoué.`,
              type: 'warning',
            });
          }
        } catch (assignmentError) {
          console.error('[onSave] Erreur lors de l\'assignement du programme:', assignmentError);
          addNotification({
            message: `Programme sauvegardé, mais l'assignement automatique au client ${clientData?.firstName} a échoué.`,
            type: 'warning',
          });
        }
      }

      console.log('[onSave] Sauvegarde terminée avec succès');

    } catch (error) {
      console.error('[onSave] ERREUR CRITIQUE lors de la sauvegarde:', error);
      
      // Message d'erreur détaillé pour l'utilisateur
      const errorMessage = error instanceof Error 
        ? `Erreur lors de la sauvegarde : ${error.message}` 
        : 'Erreur inconnue lors de la sauvegarde du programme.';
      
      addNotification({ 
        message: errorMessage, 
        type: 'error' 
      });
    } finally {
      setIsSaving(false);
      console.log('[onSave] Fin de la tentative de sauvegarde');
    }
  };

  const handleDragSessionStart = useCallback((e: React.DragEvent, sessionId: number) => {
    if (isDragInteractionLocked) {
      e.preventDefault();
      return;
    }
    sessionDragItem.current = sessionId;
  }, [isDragInteractionLocked]);

  const handleDragSessionEnter = useCallback((e: React.DragEvent, sessionId: number) => {
    if (isDragInteractionLocked) {
      return;
    }
    sessionDragOverItem.current = sessionId;
  }, [isDragInteractionLocked]);

  const handleFocusCapture = useCallback((event: React.FocusEvent<HTMLElement>) => {
    const target = event.target as HTMLElement | null;
    if (isFormLikeElement(target)) {
      setIsDragInteractionLocked(true);
    }
  }, []);

  const handleBlurCapture = useCallback((event: React.FocusEvent<HTMLElement>) => {
    const target = event.target as HTMLElement | null;
    if (!isFormLikeElement(target)) {
      return;
    }

    const relatedTarget = event.relatedTarget as HTMLElement | null;
    if (!isFormLikeElement(relatedTarget)) {
      setIsDragInteractionLocked(false);
    }
  }, []);

  const handleDropSession = useCallback(() => {
    const draggedSessionId = sessionDragItem.current;
    const droppedOnSessionId = sessionDragOverItem.current;

    if (draggedSessionId === null || droppedOnSessionId === null) return;

    setSessionsByWeek((prev) => {
      const prevWithTemplates = assignTemplateSessionIds(prev);
      const newSessionsByWeek = { ...prevWithTemplates };
      const currentWeekSessions = newSessionsByWeek[selectedWeek];

      if (!currentWeekSessions) return prev;

      let sessions = [...currentWeekSessions];
      const draggedIndex = sessions.findIndex((s) => s.id === draggedSessionId);
      const droppedIndex = sessions.findIndex((s) => s.id === droppedOnSessionId);

      if (draggedIndex === -1 || droppedIndex === -1) return prev;

      const [reorderedItem] = sessions.splice(draggedIndex, 1);
      sessions.splice(droppedIndex, 0, reorderedItem);

      newSessionsByWeek[selectedWeek] = sessions;
      // Ne pas appliquer le mirroring pour les programmes clients
      if (selectedWeek === 1 && !isEditingClientProgram) {
        return mirrorWeekOneStructure(newSessionsByWeek);
      }
      return newSessionsByWeek;
    });
    setHasUnsavedChanges(true);
    sessionDragItem.current = null;
    sessionDragOverItem.current = null;
  }, [selectedWeek, isEditingClientProgram]);

  return (
    <div
      className="flex min-h-screen bg-gray-100 relative"
      onFocusCapture={handleFocusCapture}
      onBlurCapture={handleBlurCapture}
    >
      <div
        className="flex-1 flex flex-col p-6 pb-24 transition-all duration-300"
        style={{ paddingRight: isFilterSidebarVisible ? `${FILTER_SIDEBAR_WIDTH + FILTER_SIDEBAR_GAP}px` : '0' }}
      >
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-2xl font-bold text-gray-800">Créateur d'entrainement</h1>
          <div className="flex items-center gap-4">
            <Button variant="danger" size="sm" onClick={handleResetBuilder}>
              Vider
            </Button>
            {hasUnsavedChanges && (
              <span className="text-sm text-yellow-600">Modifications non sauvegardées</span>
            )}
          </div>
        </div>
        <CollapsibleSection
          title="Informations et notes"
          isOpen={isGeneralInfoVisible}
          onToggle={(open) => setIsGeneralInfoVisible(open)}
        >
          <div className="grid grid-cols-2 gap-6">
            {/* Colonne gauche : Informations Générales */}
            <div>
              <h3 className="font-semibold mb-4">Informations Générales</h3>
              <div className="space-y-4">
                <Input
                  label="Nom de la séance/programme"
                  value={programName}
                  onChange={(e) => setProgramName(e.target.value)}
                />
                <Input
                  label="Objectif"
                  value={objective}
                  onChange={(e) => setObjective(e.target.value)}
                />
                <Input
                  label="Nombre de semaines"
                  type="number"
                  value={weekCount}
                  onChange={handleWeekCountChange}
                  onBlur={handleWeekCountBlur}
                />
                <Select
                  label="Nom du client"
                  options={clientOptions}
                  value={selectedClient}
                  onChange={handleClientSelectionChange}
                />
                {selectedClient !== '0' && clientData && (
                  <div className="mt-4 p-4 bg-primary/5 border border-primary/20 rounded-xl">
                    {console.log('[WorkoutBuilder] clientData:', clientData)}
                    <h4 className="text-xs font-bold text-primary uppercase tracking-wider mb-2">Objectifs du Bilan</h4>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="flex flex-col">
                        <span className="text-[10px] text-gray-500 uppercase font-semibold">Fréquence</span>
                        <span className="text-sm font-bold text-gray-800">
                          {(() => {
                            const bilans = (clientData.assigned_bilans || clientData.bilans || []) as any[];
                            const completedBilans = Array.isArray(bilans) ? bilans.filter(b => b.status === 'completed') : [];
                            const lastBilan = completedBilans.length > 0 ? completedBilans[completedBilans.length - 1] : null;
                            const answers = lastBilan?.data?.answers || lastBilan?.answers || lastBilan;
                            
                            // Recherche récursive simple si non trouvé
                            let freq = answers?.seances_par_semaine || answers?.SEANCES_PAR_SEMAINE;
                            if (!freq && clientData.bilans_initial) {
                              freq = clientData.bilans_initial.seances_par_semaine || clientData.bilans_initial.SEANCES_PAR_SEMAINE;
                            }
                            
                            return freq || 'Non défini';
                          })()} séances / sem
                        </span>
                      </div>
                      <div className="flex flex-col">
                        <span className="text-[10px] text-gray-500 uppercase font-semibold">Durée</span>
                        <span className="text-sm font-bold text-gray-800">
                          {(() => {
                            const bilans = (clientData.assigned_bilans || clientData.bilans || []) as any[];
                            const completedBilans = Array.isArray(bilans) ? bilans.filter(b => b.status === 'completed') : [];
                            const lastBilan = completedBilans.length > 0 ? completedBilans[completedBilans.length - 1] : null;
                            const answers = lastBilan?.data?.answers || lastBilan?.answers || lastBilan;
                            
                            // Recherche récursive simple si non trouvé
                            let duree = answers?.duree_seances || answers?.DUREE_SEANCES;
                            if (!duree && clientData.bilans_initial) {
                              duree = clientData.bilans_initial.duree_seances || clientData.bilans_initial.DUREE_SEANCES;
                            }
                            
                            return duree || 'Non définie';
                          })()} min / séance
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
            
            {/* Colonne droite : Notes et Informations Médicales */}
            <div>
              <div className="mb-4">
                <h3 className="font-semibold mb-2">Dernière note du coach</h3>
                {selectedClient !== '0' && clientData ? (
                  <div className="w-full p-2 border rounded-lg bg-gray-50 min-h-[76px]">
                    {(() => {
                      const latestNote = getLatestNote(clientData.notes);
                      return latestNote.full ? (
                        <p className="text-sm text-gray-700 whitespace-pre-wrap">{latestNote.full}</p>
                      ) : (
                        <p className="text-sm text-gray-500 italic">Aucune note enregistrée pour ce client.</p>
                      );
                    })()}
                  </div>
                ) : (
                  <div className="w-full p-2 border rounded-lg bg-gray-100 min-h-[76px]">
                    <p className="text-sm text-gray-500 italic">Sélectionnez un client pour voir les notes.</p>
                  </div>
                )}
              </div>
              
              <div>
                <h3 className="font-semibold mb-2">Informations Médicales</h3>
                {selectedClient !== '0' && clientData ? (
                  <div className="space-y-2 text-sm">
                    <div>
                      <span className="font-medium">ANTÉCÉDENTS:</span>
                      <p className="ml-4 text-gray-600">
                        {(clientData.medicalInfo as { history?: string })?.history || 'RAS'}
                      </p>
                    </div>
                    <div>
                      <span className="font-medium">ALLERGIES:</span>
                      <p className="ml-4 text-gray-600">
                        {(clientData.medicalInfo as { allergies?: string })?.allergies || 'Aucune connue'}
                      </p>
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-gray-500">Sélectionnez un client pour voir les informations médicales.</p>
                )}
                <Button
                  onClick={() => setIsHistoryModalOpen(true)}
                  className="mt-4"
                  disabled={selectedClient === '0'}
                >
                  Historique du client
                </Button>
              </div>
            </div>
          </div>
        </CollapsibleSection>
        
        {/* Toggle Séance / Programme */}
        <div className="mt-6 flex-1 flex flex-col">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold">
              {workoutMode === 'session' ? 'Séance unique' : 'Programme'}
            </h2>
            <div className="flex items-center gap-4">
              {workoutMode === 'program' && (
                <Select
                  label=""
                  options={Array.from({ length: typeof weekCount === 'number' ? weekCount : 1 }, (_, i) => ({
                    value: String(i + 1),
                    label: `Semaine ${i + 1}`,
                  }))}
                  value={String(selectedWeek)}
                  onChange={(value) => {
                    const weekValue = Array.isArray(value) ? value[0] : value;
                    if (weekValue) {
                      setSelectedWeek(Number(weekValue));
                    }
                  }}
                />
              )}
              <ToggleSwitch
                label1="Séance"
                value1="session"
                label2="Programme"
                value2="program"
                value={workoutMode}
                onChange={(val) => setWorkoutMode(val as 'session' | 'program')}
              />
            </div>
          </div>
          {workoutMode === 'program' && (
            <div className="mb-4">
              <div className="flex items-center gap-2 border-b pb-2 overflow-x-auto">
                {(sessions || []).map((session, sessionIdx) => {
                  const sessionLocked = isSessionLocked(selectedWeek, sessionIdx);
                  return (
                  <div
                    key={session.id}
                    className="relative group flex-shrink-0"
                    draggable={!sessionLocked}
                    onDragStart={(e) => !sessionLocked && handleDragSessionStart(e, session.id)}
                    onDragEnter={(e) => !sessionLocked && handleDragSessionEnter(e, session.id)}
                    onDragEnd={!sessionLocked ? handleDropSession : undefined}
                    onDragOver={(e) => e.preventDefault()}
                  >
                    <button
                      onClick={() => setActiveSessionId(session.id)}
                      className={`px-4 py-2 rounded-md text-sm font-medium transition-colors flex items-center gap-2 ${
                        activeSessionId === session.id
                          ? 'bg-primary/10 text-primary'
                          : 'hover:bg-gray-100'
                      } ${
                        sessionLocked ? 'opacity-60 cursor-not-allowed' : ''
                      }`}
                      disabled={sessionLocked}
                    >
                      {sessionLocked && <LockClosedIcon className="w-4 h-4" />}
                      {session.name}
                    </button>
                    {(sessions || []).length > 1 && !sessionLocked && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteSession(session.id);
                        }}
                        className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-gray-400 rounded-full flex items-center justify-center text-white hover:bg-red-500 opacity-0 group-hover:opacity-100"
                        title="Supprimer la séance"
                      >
                        <XMarkIcon className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                  );
                })}
                <button
                  onClick={handleDuplicateSession}
                  title="Copier la séance active"
                  className="ml-4 w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center hover:bg-primary hover:text-white flex-shrink-0"
                  disabled={isCurrentSessionLocked}
                >
                  <DocumentDuplicateIcon className="w-5 h-5" />
                </button>
                <button
                  onClick={handleAddSession}
                  className="ml-2 w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center hover:bg-primary hover:text-white flex-shrink-0"
                  title="Ajouter une séance"
                  disabled={isCurrentWeekLocked}
                >
                  <PlusIcon className="w-5 h-5" />
                </button>
              </div>
            </div>
          )}
          <div className="flex-1 flex mt-4">
            <div className="w-full">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold">{activeSession?.name}</h2>
                {isCurrentSessionLocked && (
                  <div className="flex items-center gap-2 text-orange-600 bg-orange-50 px-3 py-1 rounded-md">
                    <LockClosedIcon className="w-4 h-4" />
                    <span className="text-sm font-medium">Séance validée - Lecture seule</span>
                  </div>
                )}
              </div>
              {activeSession?.exercises?.map((ex, index) => (
                <ExerciseCard
                  key={ex.id}
                  exercise={ex}
                  exerciseNumber={index + 1}
                  availableExercises={availableExercises}
                  isSelected={selectedExerciseIds.includes(ex.id)}
                  isDragInteractionLocked={isDragInteractionLocked || isCurrentSessionLocked}
                  draggedOverExerciseId={draggedOverExerciseId}
                  exerciseDragItem={exerciseDragItem}
                  onToggleSelection={isCurrentSessionLocked ? () => {} : toggleExerciseSelection}
                  onUpdateExercise={isCurrentSessionLocked ? () => {} : onUpdateExercise}
                  onDeleteExercise={isCurrentSessionLocked ? () => {} : handleDeleteExercise}
                  onDragStart={isCurrentSessionLocked ? () => {} : handleDragStart}
                  onDragEnd={isCurrentSessionLocked ? () => {} : handleDrop}
                  onDragEnter={isCurrentSessionLocked ? () => {} : handleDragEnter}
                  onDragOver={(e) => e.preventDefault()}
                  onOpenHistory={() => setIsHistoryModalOpen(true)}
 />
              ))}
              
              {/* Zone de drag and drop avec recherche intégrée */}
              {!isCurrentSessionLocked &&
                <div className="relative mt-4" ref={dropZoneRef}>
                  <div 
                    className="text-center text-gray-500 py-8 px-4 border-2 border-dashed rounded-lg bg-white hover:border-primary hover:bg-primary-light transition-colors relative z-10"
                    onDragOver={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      e.currentTarget.classList.add('border-primary', 'bg-primary-light');
                    }}
                    onDragEnter={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      e.currentTarget.classList.add('border-primary', 'bg-primary-light');
                    }}
                    onDragLeave={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      // Ne pas retirer les classes si on entre dans un enfant
                      if (!e.currentTarget.contains(e.relatedTarget as Node)) {
                        e.currentTarget.classList.remove('border-primary', 'bg-primary-light');
                      }
                    }}
                    onDrop={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      e.currentTarget.classList.remove('border-primary', 'bg-primary-light');
                      try {
                        const exerciseData = e.dataTransfer.getData('application/json');
                        if (exerciseData) {
                          const exercise = JSON.parse(exerciseData);
                          handleDropExercise(exercise);
                        }
                      } catch (error) {
                        console.error('Erreur lors du drop:', error);
                      }
                    }}
                  >
                    <p className="text-sm mb-3">Glissez-déposez un exercice ici ou recherchez</p>
                    <div className="flex justify-center">
                      <Input
                        type="text"
                        placeholder="🔍 Rechercher un exercice"
                        className="w-full max-w-md bg-white"
                        value={dropZoneSearchTerm}
                        onChange={(e) => {
                          setDropZoneSearchTerm(e.target.value);
                          setShowDropZoneResults(e.target.value.trim().length > 0);
                        }}
                        onFocus={() => {
                          if (dropZoneSearchTerm.trim().length > 0) {
                            setShowDropZoneResults(true);
                          }
                        }}
                        onClick={(e) => e.stopPropagation()}
                      />
                    </div>
                  </div>
                  
                  {/* Liste des résultats de recherche */}
                  {showDropZoneResults && dropZoneFilteredExercises.length > 0 && (
                    <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-64 overflow-y-auto z-20">
                      {dropZoneFilteredExercises.map((ex) => (
                        <div
                          key={ex.id}
                          className="flex items-center gap-3 p-3 hover:bg-gray-100 cursor-pointer transition-colors border-b border-gray-100 last:border-b-0"
                          onClick={() => {
                            handleDropExercise(ex);
                            setDropZoneSearchTerm('');
                            setShowDropZoneResults(false);
                          }}
                        >
                          <img
                            src={ex.illustrationUrl || 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 100 100"%3E%3Crect fill="%23f3f4f6" width="100" height="100"/%3E%3Ctext x="50" y="50" font-family="Arial" font-size="14" fill="%239ca3af" text-anchor="middle" dominant-baseline="middle"%3EExercice%3C/text%3E%3C/svg%3E'}
                            alt={ex.name}
                            className="w-12 h-12 object-cover rounded-md bg-gray-100 flex-shrink-0"
                          />
                          <p className="font-medium text-gray-800">
                            {ex.name}
                            {ex.equipment && (
                              <span className="text-gray-500 font-normal"> ({ex.equipment})</span>
                            )}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                  
                  {/* Message si aucun résultat */}
                  {showDropZoneResults && dropZoneFilteredExercises.length === 0 && (
                    <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-300 rounded-lg shadow-lg p-4 z-20">
                      <p className="text-sm text-gray-500 text-center">Aucun exercice trouvé</p>
                    </div>
                  )}
                </div>
              }
              <div className="mt-6 flex justify-end gap-3">
                <Button variant="danger" onClick={handleResetBuilder} size="lg" className="shadow-lg">
                  Vider
                </Button>
                <Button
                  onClick={onSave}
                  disabled={isSaving || !user}
                  size="lg"
                  className="shadow-lg"
                >
                  {isSaving ? 'Sauvegarde...' : 'Valider'}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div
        className={`fixed top-[88px] right-6 h-[calc(100vh-112px)] transition-all duration-300 ease-in-out z-30 overflow-hidden ${
          isFilterSidebarVisible ? 'pointer-events-auto' : 'pointer-events-none'
        }`}
        style={{ width: isFilterSidebarVisible ? `${FILTER_SIDEBAR_WIDTH}px` : '0px' }}
      >
        <div
          className={`transition-opacity duration-300 h-full ${
            isFilterSidebarVisible ? 'opacity-100' : 'opacity-0'
          }`}
        >
          <div className="h-full overflow-y-auto pr-2">
            <ExerciseFilterSidebar db={availableExercises} onDropExercise={handleDropExercise} />
          </div>
        </div>
      </div>
      <button
        onClick={() => setIsFilterSidebarVisible(!isFilterSidebarVisible)}
        className="fixed top-1/2 -translate-y-1/2 bg-white p-2 rounded-l-full shadow-lg border border-r-0 transition-all duration-300 z-40"
        style={{
          right: isFilterSidebarVisible
            ? `${FILTER_SIDEBAR_WIDTH + FILTER_SIDEBAR_GAP}px`
            : `${FILTER_SIDEBAR_GAP}px`,
        }}
      >
        <ChevronDoubleRightIcon
          className={`w-5 h-5 text-gray-600 transition-transform ${isFilterSidebarVisible ? 'rotate-180' : ''}`}
        />
      </button>
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
