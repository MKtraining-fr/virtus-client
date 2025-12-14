import React, { useState, useMemo, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext';
import {
  PerformanceLog,
  PerformanceSet,
  WorkoutProgram,
  WorkoutExercise,
  Exercise,
  ExerciseLog,
} from '../../../types';
import Modal from '../../../components/Modal';
import SessionStatsModal from '../../../components/client/SessionStatsModal';
import Button from '../../../components/Button';
import { savePerformanceLog } from '../../../services/performanceLogService';
import { updateClientProgress, markSessionAsCompleted } from '../../../services/clientProgramService';
import { createClientSession, createClientSessionExercise, getClientProgramIdFromAssignment, findExistingClientSession, updateSessionStatus } from '../../../services/clientSessionService';
import { useSessionCompletion } from '../../../hooks/useSessionCompletion';
import {
  ArrowLeftIcon,
  ClockIcon,
  PencilIcon,
  ChevronDownIcon,
  EllipsisVerticalIcon,
  PlayCircleIcon,
  ArrowsRightLeftIcon,
  ChatBubbleLeftIcon,
  XMarkIcon,
  PlayIcon,
  PauseIcon,
  TrophyIcon,
} from '../../../constants/icons';

const INTENSIFICATION_DEFINITIONS: Record<string, string> = {
  'Drop Set':
    "Technique consistant à effectuer une série jusqu'à l'échec, puis à réduire immédiatement le poids et à continuer avec plus de répétitions jusqu'à l'échec à nouveau.",
};

const getDisplayValue = (details: WorkoutExercise['details'], key: 'reps' | 'tempo' | 'rest') => {
  if (!details || details.length === 0) return 'N/A';
  const firstValue = details[0][key];
  const allSame = details.every((d) => d[key] === firstValue);
  if (allSame) return firstValue;
  return details.map((d) => d[key]).join(' / ');
};

let mountCount = 0;

const ClientCurrentProgram: React.FC = () => {
  useEffect(() => {
    mountCount++;
    console.log('[DEBUG] 🚀 Version chargée: v8.0 (SessionStatsModal complet)');
    
    return () => {
      console.log('[DEBUG] 💀 Composant démonté');
    };
  }, []);

  const { user, setClients, clients, exercises: exerciseDB, addNotification } = useAuth();
  const navigate = useNavigate();
  const optionsButtonRef = useRef<HTMLButtonElement>(null);

  const baseProgram = user?.assignedProgram;
  const isProgramLoading = !user || !baseProgram;

  const currentWeek = useMemo(() => user?.programWeek || 1, [user]);

  // Hook pour la complétion atomique de séance
  const clientProgramId = useMemo(() => (baseProgram as any)?.id || null, [baseProgram]);
  const { completeSession, isCompleting } = useSessionCompletion(clientProgramId);

  const [localProgram, setLocalProgram] = useState<WorkoutProgram | undefined>(baseProgram || undefined);
  const [currentExerciseIndex, setCurrentExerciseIndex] = useState(0);
  const [activeSetIndex, setActiveSetIndex] = useState(0);
  const [logData, setLogData] = useState<Record<string, PerformanceSet[]>>({});
  const [isOptionsPopoverOpen, setIsOptionsPopoverOpen] = useState(false);
  const [isYouTubeModalOpen, setIsYouTubeModalOpen] = useState(false);
  const [isAlternativesModalOpen, setIsAlternativesModalOpen] = useState(false);
  const [isDefinitionVisible, setDefinitionVisible] = useState(false);

  // Modals
  const [isCongratsModalOpen, setIsCongratsModalOpen] = useState(false);
  const [recapData, setRecapData] = useState<{
    exerciseLogs: ExerciseLog[];
    sessionName: string;
    sessionId: string;
    performanceLogId?: string;
    activeSession: {
      name: string;
      exercises: Array<{
        id: number;
        exerciseId: number;
        name: string;
        sets: string;
        details?: Array<{
          load: { value: string; unit: string };
          reps: string;
          rest: string;
          tempo: string;
        }>;
      }>;
    };
    wasProgramFinished?: boolean;
    hasNextProgram?: boolean;
  } | null>(() => {
    // 🔑 Charger recapData depuis sessionStorage au montage
    const stored = sessionStorage.getItem('pendingRecapData');
    if (stored) {
      console.log('[DEBUG] recapData chargé depuis sessionStorage');
      sessionStorage.removeItem('pendingRecapData');
      return JSON.parse(stored);
    }
    return null;
  });

  // 🐞 DEBUG: Tracer les changements de recapData
  useEffect(() => {
    console.log('[DEBUG] recapData a changé:', recapData);
    if (recapData) {
      console.log('[DEBUG] recapData existe - la modale devrait s\'afficher');
      console.log('[DEBUG] recapData.sessionName:', recapData.sessionName);
    } else {
      console.log('[DEBUG] recapData est null - la modale ne devrait PAS s\'afficher');
    }
  }, [recapData]);

  const [isCommentModalOpen, setIsCommentModalOpen] = useState(false);
  const [commentTarget, setCommentTarget] = useState<{
    exerciseId: number;
    setIndex: number;
  } | null>(null);
  const [currentComment, setCurrentComment] = useState('');

  // Timer
  const [isTimerFullscreen, setIsTimerFullscreen] = useState(false);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [elapsedTime, setElapsedTime] = useState(0);
  const timerIntervalRef = useRef<number | null>(null);

  const defaultSessionIndex = useMemo(() => {
    if (!user?.sessionProgress || !baseProgram) return 0;
    const progress = user.sessionProgress;
    const sessionsForCurrentWeek =
      baseProgram.sessionsByWeek[currentWeek] || baseProgram.sessionsByWeek[1];
    if (progress > 0 && progress <= sessionsForCurrentWeek.length) {
      return progress - 1;
    }
    return 0;
  }, [user?.sessionProgress, baseProgram, currentWeek]);

  const [selectedSessionIndex, setSelectedSessionIndex] = useState(defaultSessionIndex);

  const availableSessions = useMemo(() => {
    if (!localProgram) return [];
    const sessionsForWeek =
      localProgram.sessionsByWeek[currentWeek] || localProgram.sessionsByWeek[1] || [];

    if (!user) return sessionsForWeek.map((session, index) => ({ ...session, originalIndex: index }));

    const currentSessionProgressIndex = (user.sessionProgress || 1) - 1;
    return sessionsForWeek
      .map((session, index) => ({ ...session, originalIndex: index }))
      .filter((_, index) => index >= currentSessionProgressIndex);
  }, [localProgram, currentWeek, user]);

  useEffect(() => {
    // Si une modale est ouverte ou si on a des données de récap, ON NE TOUCHE À RIEN
    if (isCongratsModalOpen || recapData) return;

    setSelectedSessionIndex(defaultSessionIndex);
    setLocalProgram(baseProgram ? JSON.parse(JSON.stringify(baseProgram)) : undefined);
  }, [defaultSessionIndex, baseProgram, isCongratsModalOpen, recapData]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (optionsButtonRef.current && !optionsButtonRef.current.contains(event.target as Node)) {
        setIsOptionsPopoverOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const activeSession = useMemo(() => {
    if (!localProgram || !localProgram.sessionsByWeek) return null;
    const sessionsForWeek =
      localProgram.sessionsByWeek[currentWeek] || localProgram.sessionsByWeek[1];
    if (!sessionsForWeek || sessionsForWeek.length <= selectedSessionIndex) return null;
    return sessionsForWeek[selectedSessionIndex];
  }, [localProgram, selectedSessionIndex, currentWeek]);

  useEffect(() => {
    // Ne pas reset les logs si on a des données de récap (fin de séance)
    if (activeSession && !recapData) {
      const initialLogData: Record<string, PerformanceSet[]> = {};
      for (const exercise of activeSession.exercises) {
        const totalSets = Math.max(0, parseInt(exercise.sets, 10) || 0);
        initialLogData[exercise.id.toString()] = Array.from(
          { length: totalSets },
          (): PerformanceSet => ({ reps: '', load: '' })
        );
      }
      setLogData(initialLogData);
    } else if (!activeSession && !recapData) {
      setLogData({});
    }
  }, [activeSession, recapData]);

  const getProgressionColor = (currentValue: string, previousValue: string | undefined): string => {
    if (!previousValue || !currentValue || currentValue === '' || previousValue === '') {
      return 'text-gray-900 dark:text-client-light';
    }
    const current = parseFloat(currentValue);
    const previous = parseFloat(previousValue);
    if (isNaN(current) || isNaN(previous)) return 'text-gray-900 dark:text-client-light';
    if (current > previous) return 'text-green-600 dark:text-green-400';
    if (current < previous) return 'text-red-600 dark:text-red-400';
    return 'text-gray-900 dark:text-client-light';
  };

  const previousPerformancePlaceholders = useMemo(() => {
    if (!user || !user.performanceLog || !activeSession || (currentWeek) <= 1) {
      return null;
    }
    const prevWeek = currentWeek - 1;
    const previousWeekSessionLog = user.performanceLog
      .slice()
      .filter(
        (log) => 
          log.programName === localProgram?.name && 
          log.sessionName === activeSession.name &&
          log.week === prevWeek
      )
      .pop();

    if (!previousWeekSessionLog) return null;

    const placeholderMap = new Map<string, PerformanceSet[]>();
    for (const exLog of previousWeekSessionLog.exerciseLogs) {
      placeholderMap.set(exLog.exerciseName, exLog.loggedSets);
    }
    return placeholderMap;
  }, [user, activeSession, localProgram, currentWeek]);

  const currentExercise = useMemo(() => {
    if (!activeSession?.exercises || activeSession.exercises.length <= currentExerciseIndex) return null;
    return activeSession.exercises[currentExerciseIndex];
  }, [activeSession, currentExerciseIndex]);

  const loadUnit = useMemo(() => {
    if (!currentExercise?.details?.length) return 'Charge';
    const firstUnit = currentExercise.details[0]?.load?.unit || 'kg';
    return currentExercise.details.every((d) => d.load.unit === firstUnit) 
      ? (firstUnit ? firstUnit.toUpperCase() : 'Charge') 
      : 'Charge';
  }, [currentExercise]);

  const fullExerciseDetails = useMemo(() => {
    if (!currentExercise) return null;
    return exerciseDB.find((ex) => ex.id === currentExercise.exerciseId);
  }, [currentExercise, exerciseDB]);

  const alternativeExercises = useMemo(() => {
    if (!fullExerciseDetails?.alternativeIds) return [];
    return fullExerciseDetails.alternativeIds
      .map((id) => exerciseDB.find((ex) => ex.id === id))
      .filter((ex): ex is Exercise => !!ex);
  }, [fullExerciseDetails, exerciseDB]);

  // Timer
  useEffect(() => {
    if (isTimerRunning) {
      timerIntervalRef.current = window.setInterval(() => setElapsedTime((prev) => prev + 1), 1000);
    } else {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
        timerIntervalRef.current = null;
      }
    }
    return () => { if (timerIntervalRef.current) clearInterval(timerIntervalRef.current); };
  }, [isTimerRunning]);

  const handleStartTimer = () => { setElapsedTime(0); setIsTimerRunning(true); setIsTimerFullscreen(true); };
  const handleCloseTimer = () => { setIsTimerFullscreen(false); setIsTimerRunning(false); setElapsedTime(0); };
  const handleResetTimer = () => { setElapsedTime(0); setIsTimerRunning(false); };
  const toggleTimer = () => setIsTimerRunning((prev) => !prev);
  const formatTime = (totalSeconds: number) => {
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  const handleLogChange = (exerciseId: number, setIndex: number, field: 'reps' | 'load', value: string) => {
    const exerciseKey = exerciseId.toString();
    setLogData((prev) => {
      const currentExerciseSets = Math.max(0, parseInt(currentExercise?.sets || '0', 10));
      const existingLog = prev[exerciseKey] || Array.from({ length: currentExerciseSets }, () => ({ reps: '', load: '' }));
      const updatedExerciseLog = [...existingLog];
      const currentSet = updatedExerciseLog[setIndex] || { reps: '', load: '' };
      updatedExerciseLog[setIndex] = { ...currentSet, [field]: value };
      return { ...prev, [exerciseKey]: updatedExerciseLog };
    });
  };

  const handleSelectExercise = (index: number) => {
    setCurrentExerciseIndex(index);
    setActiveSetIndex(0);
    setDefinitionVisible(false);
  };

  const handleSwapExercise = (alternative: Exercise) => {
    if (!localProgram || !activeSession || !currentExercise) return;
    const newWorkoutExercise: WorkoutExercise = {
      ...currentExercise,
      exerciseId: alternative.id,
      name: alternative.name,
      illustrationUrl: alternative.illustrationUrl,
    };
    const updatedExercises = activeSession.exercises.map((ex) =>
      ex.id === currentExercise.id ? newWorkoutExercise : ex
    );
    const updatedSession = { ...activeSession, exercises: updatedExercises };
    const updatedSessionsByWeek = {
      ...localProgram.sessionsByWeek,
      [currentWeek]: localProgram.sessionsByWeek[currentWeek].map((s) =>
        s.id === activeSession.id ? updatedSession : s
      ),
    };
    setLocalProgram({ ...localProgram, sessionsByWeek: updatedSessionsByWeek });
    setIsAlternativesModalOpen(false);
  };

  const handleOpenCommentModal = (exerciseId: number, setIndex: number) => {
    const exerciseKey = exerciseId.toString();
    const existingComment = logData[exerciseKey]?.[setIndex]?.comment || '';
    setCurrentComment(existingComment);
    setCommentTarget({ exerciseId, setIndex });
    setIsCommentModalOpen(true);
  };

  const handleSaveComment = () => {
    if (!commentTarget || !currentExercise) return;
    const { exerciseId, setIndex } = commentTarget;
    const exerciseKey = exerciseId.toString();
    setLogData((prev) => {
      const currentExerciseSets = Math.max(0, parseInt(currentExercise.sets, 10) || 0);
      const existingLog = prev[exerciseKey] || Array.from({ length: currentExerciseSets }, () => ({ reps: '', load: '' }));
      const updatedExerciseLog = [...existingLog];
      const currentSet = updatedExerciseLog[setIndex] || { reps: '', load: '' };
      updatedExerciseLog[setIndex] = { ...currentSet, comment: currentComment };
      return { ...prev, [exerciseKey]: updatedExerciseLog };
    });
    setIsCommentModalOpen(false);
    setCommentTarget(null);
    setCurrentComment('');
  };

  const handleFinishSession = async () => {
    console.log('[DEBUG] Début handleFinishSession (version atomique)');

    if (!localProgram || !activeSession || !user) {
      console.error('[DEBUG] Données manquantes', { hasProgram: !!localProgram, hasSession: !!activeSession, hasUser: !!user });
      navigate('/app/workout');
      return;
    }

    // Vérifier si des exercices ne sont pas complétés
    const hasUnloggedExercises = activeSession.exercises.some((exercise) => {
      const loggedSetsForExercise = logData[exercise.id.toString()] || [];
      return !loggedSetsForExercise.some((set) => set.reps.trim() !== '' || set.load.trim() !== '');
    });

    if (hasUnloggedExercises) {
      if (!window.confirm('Certains exercices ne sont pas complétés. Voulez-vous vraiment terminer la séance ?')) {
        console.log('[DEBUG] Annulation utilisateur');
        return;
      }
    }

    // Préparer les exerciseLogs pour la modale (format ancien)
    const exerciseLogsForSession: ExerciseLog[] = activeSession.exercises
      .map((exercise) => {
        const loggedSetsForExercise = logData[exercise.id.toString()] || [];
        const nonEmptySets = loggedSetsForExercise.filter(
          (s) => s.reps.trim() || s.load.trim() || s.comment?.trim()
        );
        if (nonEmptySets.length === 0) return null;
        return {
          exerciseId: exercise.exerciseId,
          exerciseName: exercise.name,
          loggedSets: nonEmptySets.map((set) => ({
            ...set,
            restTime: exercise.details?.[0]?.rest,
            viewedByCoach: false,
          })),
        };
      })
      .filter((log): log is ExerciseLog => log !== null);

    // Envoyer une notification au coach
    if (exerciseLogsForSession.length > 0 && user.coachId) {
      addNotification({
        userId: user.coachId,
        fromName: `${user.firstName} ${user.lastName}`,
        type: 'session_completed',
        message: `a terminé la séance : ${activeSession.name}.`,
        link: `/app/client/${user.id}`,
      });
    }

    const programAssignmentId = (localProgram as any).assignmentId || null;
    
    console.log('[DEBUG] Récupération du client_program_id');
    const clientProgramIdValue = await getClientProgramIdFromAssignment(programAssignmentId);
    
    if (!clientProgramIdValue) {
      console.error('[DEBUG] Échec récupération client_program_id');
      addNotification({ message: 'Erreur lors de la récupération du programme.', type: 'error' });
      return;
    }
    
    console.log('[DEBUG] Recherche de la client_session existante');
    
    // ✅ FIX: Calculer le session_order réel basé sur selectedSessionIndex
    const actualSessionOrder = selectedSessionIndex + 1;
    
    const existingSession = await findExistingClientSession(
      clientProgramIdValue,
      currentWeek,
      actualSessionOrder
    );
    
    let clientSessionId: string | null = null;
    
    if (existingSession) {
      console.log('[DEBUG] Séance existante trouvée:', existingSession.id);
      clientSessionId = existingSession.id;
    } else {
      console.log('[DEBUG] Aucune séance existante, création avec session_order:', actualSessionOrder);
      
      // Créer une nouvelle séance si elle n'existe pas
      clientSessionId = await createClientSession({
        client_program_id: clientProgramIdValue,
        client_id: user.id,
        name: activeSession.name,
        week_number: currentWeek,
        session_order: actualSessionOrder,
        status: 'pending'
      });
      
      if (!clientSessionId) {
        console.error('[DEBUG] Échec création client_session');
        addNotification({ message: 'Erreur lors de la création de la séance.', type: 'error' });
        return;
      }
      
      // Créer les exercices de la séance
      for (const exercise of activeSession.exercises) {
        await createClientSessionExercise({
          client_session_id: clientSessionId,
          exercise_id: exercise.exerciseId.toString(),
          client_id: user.id,
          exercise_order: exercise.id,
          sets: parseInt(exercise.sets) || undefined,
          reps: exercise.details?.[0]?.reps || undefined,
          load: exercise.details?.[0]?.load?.value || undefined,
          tempo: exercise.details?.[0]?.tempo || undefined,
          rest_time: exercise.details?.[0]?.rest || undefined,
          details: exercise.details || undefined
        });
      }
    }

    console.log('[DEBUG] Appel de la fonction RPC atomique');
    
    // ✅ NOUVELLE APPROCHE: Appel de la fonction RPC atomique
    const result = await completeSession(activeSession, clientSessionId, logData);
    
    if (!result.success) {
      console.error('[DEBUG] Échec complétion atomique:', result.error);
      addNotification({ 
        message: result.error || 'Erreur lors de la complétion de la séance.', 
        type: 'error' 
      });
      return;
    }

    console.log('[DEBUG] Séance complétée avec succès:', result.performanceLogId);

    // Préparation progression
    let nextSessionProgress = (user.sessionProgress || 1) + 1;
    let nextProgramWeek = user.programWeek || 1;
    
    // ✅ FIX: Utiliser la semaine ACTUELLE pour vérifier le nombre de séances
    const sessionsForCurrentWeek = localProgram.sessionsByWeek[user.programWeek || 1] || localProgram.sessionsByWeek[1] || [];
    if (nextSessionProgress > sessionsForCurrentWeek.length) {
      nextProgramWeek++;
      nextSessionProgress = 1;
    }

    const totalWeeks = localProgram.weekCount;
    const wasProgramFinished = nextProgramWeek > totalWeeks;
    const hasNextProgram = (user.assignedPrograms?.length || 0) > 1;

    // Mettre à jour la progression dans program_assignments
    if (!wasProgramFinished) {
      await updateClientProgress(
        programAssignmentId,
        nextProgramWeek,
        nextSessionProgress
      );
    }

    // Optimistic update du state local
    const newLogEntry: PerformanceLog = {
      date: new Date().toLocaleDateString('fr-FR'),
      week: currentWeek,
      programName: localProgram.name,
      sessionName: activeSession.name,
      exerciseLogs: exerciseLogsForSession,
    };

    const updatedClients = clients.map((c) => {
      if (c.id === user.id) {
        const newPerformanceLog = [...(c.performanceLog || []), newLogEntry];
        
        if (wasProgramFinished) {
          return { ...c, performanceLog: newPerformanceLog };
        }
        return {
          ...c,
          performanceLog: newPerformanceLog,
          sessionProgress: nextSessionProgress,
          programWeek: nextProgramWeek,
        };
      }
      return c;
    });

    setClients(updatedClients);

    console.log('[DEBUG] Ouverture de la modale');
    
    // Sauvegarder dans sessionStorage pour persistance
    const recapDataToSave = {
      exerciseLogs: exerciseLogsForSession,
      sessionName: activeSession.name,
      sessionId: activeSession.id,
      performanceLogId: result.clientSessionId, // Utiliser clientSessionId pour compatibilité
      activeSession: { name: activeSession.name, exercises: activeSession.exercises },
      wasProgramFinished,
      hasNextProgram,
    };
    
    sessionStorage.setItem('pendingRecapData', JSON.stringify(recapDataToSave));
    setRecapData(recapDataToSave);
  };

  const handleCloseRecapModal = () => {
    console.log('[DEBUG] Fermeture modale');
    
    // 🧹 Nettoyer sessionStorage
    sessionStorage.removeItem('pendingRecapData');
    
    if (recapData?.wasProgramFinished && !recapData?.hasNextProgram) {
      setIsCongratsModalOpen(true);
    } else {
      // ✅ FIX: Recharger la page pour mettre à jour la progression
      window.location.href = '/app/workout';
    }
    
    setRecapData(null);
  };

  const handleCloseCongratsModal = () => {
    setIsCongratsModalOpen(false);
    navigate('/app/workout');
  };

  if (isProgramLoading) return <div className="text-center py-10">Chargement...</div>;
  if (!localProgram || !activeSession) return <div className="text-center py-10">Aucun programme. <button onClick={() => navigate('/app/workout')}>Retour</button></div>;
  if (!currentExercise) return <div className="text-center py-10">Séance vide.</div>;

  const totalSets = Math.max(0, parseInt(currentExercise.sets, 10) || 0);
  const technique = currentExercise?.intensification?.[0]?.value;
  const definition = technique ? INTENSIFICATION_DEFINITIONS[technique] : undefined;

  return (
    <div className="relative pb-20">
      {/* Header */}
      <div className="flex items-center gap-4 mb-4">
        <button onClick={() => navigate(-1)} className="p-2 bg-white dark:bg-client-card rounded-full text-gray-800 dark:text-client-light hover:bg-gray-100 border border-gray-300 dark:border-gray-700">
          <ArrowLeftIcon className="w-5 h-5" />
        </button>
        <div className="relative flex-grow">
          <select
            value={selectedSessionIndex}
            onChange={(e) => { setSelectedSessionIndex(Number(e.target.value)); setCurrentExerciseIndex(0); }}
            className="w-full appearance-none bg-white dark:bg-client-card border border-gray-300 dark:border-client-dark text-gray-900 dark:text-client-light text-lg font-semibold py-3 px-4 pr-10 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
          >
            {availableSessions.map((session) => (
              <option key={session.id} value={session.originalIndex}>{session.name}</option>
            ))}
          </select>
          <ChevronDownIcon className="w-5 h-5 text-gray-500 dark:text-client-subtle absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none" />
        </div>
      </div>

      {/* Exercise Card */}
      <div className="bg-white dark:bg-client-card rounded-lg p-3 space-y-4 shadow-sm border border-gray-200 dark:border-transparent">
        <div className="flex justify-between items-center gap-2">
          <div className="relative flex-1">
            <select
              value={currentExerciseIndex}
              onChange={(e) => handleSelectExercise(Number(e.target.value))}
              className="w-full appearance-none bg-gray-100 dark:bg-client-dark border-none text-gray-800 dark:text-client-light font-semibold py-2.5 px-4 pr-8 rounded-full focus:outline-none focus:ring-2 focus:ring-primary"
            >
              {activeSession.exercises.map((ex, index) => (
                <option key={ex.id} value={index}>{ex.name}</option>
              ))}
            </select>
            <ChevronDownIcon className="w-4 h-4 text-gray-500 dark:text-client-subtle absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>
          <div className="relative">
            <button
              ref={optionsButtonRef}
              onClick={() => setIsOptionsPopoverOpen((prev) => !prev)}
              className="w-10 h-10 bg-gray-100 dark:bg-client-dark rounded-full flex items-center justify-center text-gray-500 hover:text-primary transition-colors flex-shrink-0"
            >
              <EllipsisVerticalIcon className="w-6 h-6" />
            </button>
            {isOptionsPopoverOpen && (
              <div className="absolute right-0 top-full mt-2 w-48 bg-white dark:bg-client-dark rounded-lg shadow-lg p-2 z-30 border border-gray-200">
                <button onClick={() => { setIsYouTubeModalOpen(true); setIsOptionsPopoverOpen(false); }} className="w-full flex items-center gap-3 p-2 text-left rounded-md hover:bg-gray-100">
                  <PlayCircleIcon className="w-5 h-5" /><span>Voir la vidéo</span>
                </button>
                <button onClick={() => { setIsAlternativesModalOpen(true); setIsOptionsPopoverOpen(false); }} className="w-full flex items-center gap-3 p-2 text-left rounded-md hover:bg-gray-100">
                  <ArrowsRightLeftIcon className="w-5 h-5" /><span>Alternatives</span>
                </button>
              </div>
            )}
          </div>
        </div>

        <img src={currentExercise.illustrationUrl} alt={currentExercise.name} className="w-full h-auto object-cover rounded-lg bg-gray-100 dark:bg-gray-700 aspect-video" />

        <div className="grid grid-cols-4 divide-x divide-gray-200 dark:divide-client-dark/50 text-center">
          <div><p className="text-sm text-gray-500">Séries</p><p className="font-bold text-lg">{currentExercise.sets}</p></div>
          <div><p className="text-sm text-gray-500">Rép</p><p className="font-bold text-lg">{getDisplayValue(currentExercise.details, 'reps')}</p></div>
          <div><p className="text-sm text-gray-500">Repos</p><p className="font-bold text-lg">{getDisplayValue(currentExercise.details, 'rest').replace(/\D/g, '')}</p></div>
          <div><p className="text-sm text-gray-500">Tempo</p><p className="font-bold text-lg">{getDisplayValue(currentExercise.details, 'tempo')}</p></div>
        </div>

        {technique && definition && (
          <div className="relative">
            <button onClick={() => setDefinitionVisible(!isDefinitionVisible)} className="w-full bg-gray-100 dark:bg-client-dark text-gray-500 font-semibold py-2.5 px-4 rounded-md text-left flex justify-between items-center">
              <span>Technique : <strong>{technique}</strong></span>
              <ChevronDownIcon className={`w-4 h-4 transition-transform ${isDefinitionVisible ? 'rotate-180' : ''}`} />
            </button>
            {isDefinitionVisible && <div className="p-3 mt-1 bg-gray-100 rounded-md text-sm text-gray-500">{definition}</div>}
          </div>
        )}

        <div className="pt-2">
          <div className="flex text-center font-semibold text-gray-500 mb-2">
            <div className="w-1/4">Série</div><div className="flex-1 px-1">Répétition</div><div className="flex-1 px-1">{loadUnit}</div><div className="w-10 px-1">Note</div>
          </div>
          <div className="bg-gray-100 dark:bg-client-dark rounded-lg p-4 space-y-2">
            {[...Array(totalSets)].map((_, setIndex) => {
              const isSetSelected = setIndex === activeSetIndex;
              const exerciseKey = currentExercise.id.toString();
              const repValue = logData[exerciseKey]?.[setIndex]?.reps || '';
              const loadValue = logData[exerciseKey]?.[setIndex]?.load || '';
              const placeholders = previousPerformancePlaceholders?.get(currentExercise.name);
              const setPlaceholder = placeholders?.[setIndex];
              const targetReps = currentExercise.details?.[setIndex]?.reps || currentExercise.details?.[0]?.reps || '0';
              const targetLoad = currentExercise.details?.[setIndex]?.load?.value || currentExercise.details?.[0]?.load?.value || '0';

              return (
                <div key={setIndex} className={`flex items-center p-2 rounded-lg cursor-pointer ${isSetSelected ? 'bg-primary' : ''}`} onClick={() => setActiveSetIndex(setIndex)}>
                  <p className={`flex-none w-1/4 text-center font-bold text-lg ${isSetSelected ? 'text-white' : 'text-gray-500'}`}>S{setIndex + 1}</p>
                  <div className="flex-1 px-1">
                    <input type="number" placeholder={targetReps !== '0' ? targetReps : (setPlaceholder?.reps || '0')} value={repValue} onChange={(e) => handleLogChange(currentExercise.id, setIndex, 'reps', e.target.value)} onFocus={() => setActiveSetIndex(setIndex)} className={`w-full rounded-md text-center py-2 font-bold text-lg border-2 ${isSetSelected ? 'bg-white/20 border-white/50 text-white placeholder:text-white/70' : `bg-white ${getProgressionColor(repValue, setPlaceholder?.reps)}`}`} onClick={(e) => e.stopPropagation()} />
                  </div>
                  <div className="flex-1 px-1">
                    <input type="number" placeholder={targetLoad !== '0' ? targetLoad : (setPlaceholder?.load || '0')} value={loadValue} onChange={(e) => handleLogChange(currentExercise.id, setIndex, 'load', e.target.value)} onFocus={() => setActiveSetIndex(setIndex)} className={`w-full rounded-md text-center py-2 font-bold text-lg border-2 ${isSetSelected ? 'bg-white/20 border-white/50 text-white placeholder:text-white/70' : `bg-white ${getProgressionColor(loadValue, setPlaceholder?.load)}`}`} onClick={(e) => e.stopPropagation()} />
                  </div>
                  <div className="flex-none w-10 text-center pl-1">
                    {isSetSelected ? (
                      <button onClick={(e) => { e.stopPropagation(); handleOpenCommentModal(currentExercise.id, setIndex); }} className="p-1 rounded-full text-white/80 hover:bg-white/20"><PencilIcon className="w-5 h-5" /></button>
                    ) : (
                      logData[exerciseKey]?.[setIndex]?.comment && <ChatBubbleLeftIcon className="w-5 h-5 text-gray-500 mx-auto" />
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div className="mt-8">
        <button onClick={handleFinishSession} className="w-full bg-primary text-white font-bold py-3 rounded-lg hover:bg-violet-700 transition-colors">Terminer la séance</button>
      </div>

      {isTimerFullscreen ? (
        <div className="fixed inset-0 bg-black/90 z-50 flex flex-col items-center justify-center p-4">
          <button onClick={handleCloseTimer} className="absolute top-6 right-6 text-gray-400 hover:text-white"><XMarkIcon className="w-8 h-8" /></button>
          <div className={`font-mono font-bold text-8xl md:text-9xl text-white`}>{formatTime(elapsedTime)}</div>
          <div className="mt-12 flex items-center gap-8">
            <Button variant="secondary" onClick={handleResetTimer}>Réinitialiser</Button>
            <button onClick={toggleTimer} className="w-24 h-24 bg-white text-client-dark rounded-full flex items-center justify-center"><PlayIcon className="w-10 h-10 ml-1" /></button>
          </div>
        </div>
      ) : (
        <div className="fixed bottom-20 right-4 z-20">
          <button onClick={handleStartTimer} className="w-16 h-16 bg-white text-client-dark rounded-full shadow-lg flex items-center justify-center"><ClockIcon className="w-8 h-8" /></button>
        </div>
      )}

      <Modal isOpen={isCongratsModalOpen} onClose={handleCloseCongratsModal} title="Félicitations !">
        <div className="text-center">
          <TrophyIcon className="w-20 h-20 text-yellow-400 mx-auto mb-4" />
          <p className="text-lg text-gray-800">Vous avez brillamment terminé votre programme !</p>
          <button onClick={handleCloseCongratsModal} className="mt-6 bg-primary text-white font-bold py-2 px-6 rounded-lg">Retour</button>
        </div>
      </Modal>

      {recapData && (
        <SessionStatsModal
          isOpen={true}
          onClose={handleCloseRecapModal}
          exerciseLogs={recapData.exerciseLogs}
          sessionName={recapData.sessionName}
          performanceLogId={recapData.performanceLogId}
          activeSession={recapData.activeSession}
        />
      )}

      {fullExerciseDetails && (
        <Modal isOpen={isYouTubeModalOpen} onClose={() => setIsYouTubeModalOpen(false)} title={`Vidéo : ${fullExerciseDetails.name}`}>
          {fullExerciseDetails.videoUrl ? <iframe src={fullExerciseDetails.videoUrl.replace('watch?v=', 'embed/')} title={fullExerciseDetails.name} className="w-full aspect-video rounded-lg" allowFullScreen></iframe> : <p className="text-center p-4">Pas de vidéo.</p>}
        </Modal>
      )}

      <Modal isOpen={isAlternativesModalOpen} onClose={() => setIsAlternativesModalOpen(false)} title={`Alternatives : ${currentExercise.name}`}>
        <div className="space-y-2">
          {alternativeExercises.length > 0 ? alternativeExercises.map(alt => (
            <button key={alt.id} onClick={() => handleSwapExercise(alt)} className="w-full flex items-center gap-3 p-2 rounded-lg hover:bg-gray-100 text-left">
              <img src={alt.illustrationUrl} alt={alt.name} className="w-16 h-16 object-contain bg-gray-100" />
              <div><p className="font-semibold">{alt.name}</p></div>
            </button>
          )) : <p className="text-center p-4">Aucune alternative.</p>}
        </div>
      </Modal>

      <Modal isOpen={isCommentModalOpen} onClose={() => setIsCommentModalOpen(false)} title="Note">
        <div className="space-y-4">
          <textarea value={currentComment} onChange={(e) => setCurrentComment(e.target.value)} className="w-full h-32 p-2 border rounded-lg" placeholder="Notes..." autoFocus />
          <div className="flex justify-end gap-2"><Button variant="secondary" onClick={() => setIsCommentModalOpen(false)}>Annuler</Button><Button onClick={handleSaveComment}>Enregistrer</Button></div>
        </div>
      </Modal>
    </div>
  );
};

export default ClientCurrentProgram;
