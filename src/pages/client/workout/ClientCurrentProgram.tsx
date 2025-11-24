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
  Client,
} from '../../../types';
import Modal from '../../../components/Modal';
import Button from '../../../components/Button';
import SessionRecapModal from '../../../components/client/SessionRecapModal';
import { savePerformanceLog } from '../../../services/performanceLogService';
// import { getClientAssignedPrograms } from '../../../services/clientProgramService'; // Plus nécessaire car chargé via useAuthStore
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

const ClientCurrentProgram: React.FC = () => {
  const { user, setClients, clients, exercises: exerciseDB, addNotification } = useAuth();
  const navigate = useNavigate();
  const optionsButtonRef = useRef<HTMLButtonElement>(null);
  const finishStatusRef = useRef({ wasProgramFinished: false, hasNextProgram: false });

  // Récupération du programme depuis l'état global
  const baseProgram = user?.assignedProgram;
  const isProgramLoading = !user || !baseProgram; // Le programme est chargé avec l'utilisateur

  const currentWeek = useMemo(() => user?.programWeek || 1, [user]);

  const [localProgram, setLocalProgram] = useState<WorkoutProgram | undefined>(baseProgram || undefined);
  const [currentExerciseIndex, setCurrentExerciseIndex] = useState(0);
  const [activeSetIndex, setActiveSetIndex] = useState(0);
  const [logData, setLogData] = useState<Record<string, PerformanceSet[]>>({});
  const [isOptionsPopoverOpen, setIsOptionsPopoverOpen] = useState(false);
  const [isYouTubeModalOpen, setIsYouTubeModalOpen] = useState(false);
  const [isAlternativesModalOpen, setIsAlternativesModalOpen] = useState(false);
  const [isDefinitionVisible, setDefinitionVisible] = useState(false);

  // Modals for session/program completion
  const [isCongratsModalOpen, setIsCongratsModalOpen] = useState(false);
  const [isRecapModalOpen, setIsRecapModalOpen] = useState(false);
  const [recapData, setRecapData] = useState<{
    exerciseLogs: ExerciseLog[];
    sessionName: string;
  } | null>(null);

  const [isCommentModalOpen, setIsCommentModalOpen] = useState(false);
  const [commentTarget, setCommentTarget] = useState<{
    exerciseId: number;
    setIndex: number;
  } | null>(null);
  const [currentComment, setCurrentComment] = useState('');

  // Timer state
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
    if (!user)
      return sessionsForWeek.map((session, index) => ({ ...session, originalIndex: index }));

    const currentSessionProgressIndex = (user.sessionProgress || 1) - 1;

    return sessionsForWeek
      .map((session, index) => ({ ...session, originalIndex: index }))
      .filter((_, index) => index >= currentSessionProgressIndex);
  }, [localProgram, currentWeek, user]);

  useEffect(() => {
    setSelectedSessionIndex(defaultSessionIndex);
    setLocalProgram(baseProgram ? JSON.parse(JSON.stringify(baseProgram)) : undefined);
  }, [defaultSessionIndex, baseProgram]);

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
      localProgram.sessionsByWeek[currentWeek] || localProgram.sessionsByWeek[1]; // Fallback to week 1
    if (!sessionsForWeek || sessionsForWeek.length <= selectedSessionIndex) return null;
    return sessionsForWeek[selectedSessionIndex];
  }, [localProgram, selectedSessionIndex, currentWeek]);

  useEffect(() => {
    if (activeSession) {
      const initialLogData: Record<string, PerformanceSet[]> = {};
      for (const exercise of activeSession.exercises) {
        const totalSets = Math.max(0, parseInt(exercise.sets, 10) || 0);
        initialLogData[exercise.id.toString()] = Array.from(
          { length: totalSets },
          (): PerformanceSet => ({ reps: '', load: '' })
        );
      }
      setLogData(initialLogData);
    } else {
      setLogData({});
    }
  }, [activeSession]);

  const previousPerformancePlaceholders = useMemo(() => {
    if (!user || !user.performanceLog || !activeSession || (user.programWeek || 1) <= 1) {
      return null;
    }

    const lastSessionLog = user.performanceLog
      .slice()
      .filter(
        (log) => log.programName === localProgram?.name && log.sessionName === activeSession.name
      )
      .pop();

    if (!lastSessionLog) {
      return null;
    }

    const placeholderMap = new Map<string, PerformanceSet[]>();
    for (const exLog of lastSessionLog.exerciseLogs) {
      placeholderMap.set(exLog.exerciseName, exLog.loggedSets);
    }
    return placeholderMap;
  }, [user, activeSession, localProgram]);

  const currentExercise = useMemo(() => {
    if (
      !activeSession ||
      !activeSession.exercises ||
      activeSession.exercises.length <= currentExerciseIndex
    )
      return null;
    return activeSession.exercises[currentExerciseIndex];
  }, [activeSession, currentExerciseIndex]);

  const loadUnit = useMemo(() => {
    if (!currentExercise || !currentExercise.details || currentExercise.details.length === 0) {
      return 'Charge';
    }
    const firstUnit = currentExercise.details[0].load.unit;
    const allSameUnit = currentExercise.details.every((d) => d.load.unit === firstUnit);

    if (allSameUnit) {
      return firstUnit ? firstUnit.toUpperCase() : 'Charge';
    }
    return 'Charge';
  }, [currentExercise]);

  const fullExerciseDetails = useMemo(() => {
    if (!currentExercise) return null;
    return exerciseDB.find((ex) => ex.id === currentExercise.exerciseId);
  }, [currentExercise, exerciseDB]);

  const alternativeExercises = useMemo(() => {
    if (!fullExerciseDetails || !fullExerciseDetails.alternativeIds) return [];
    return fullExerciseDetails.alternativeIds
      .map((id) => exerciseDB.find((ex) => ex.id === id))
      .filter((ex): ex is Exercise => !!ex);
  }, [fullExerciseDetails, exerciseDB]);

  // Timer Effect
  useEffect(() => {
    if (isTimerRunning) {
      timerIntervalRef.current = window.setInterval(() => {
        setElapsedTime((prev) => prev + 1);
      }, 1000);
    } else {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
        timerIntervalRef.current = null;
      }
    }
    return () => {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    };
  }, [isTimerRunning]);

  const handleStartTimer = () => {
    setElapsedTime(0);
    setIsTimerRunning(true);
    setIsTimerFullscreen(true);
  };

  const handleCloseTimer = () => {
    setIsTimerFullscreen(false);
    setIsTimerRunning(false);
    setElapsedTime(0);
  };

  const handleResetTimer = () => {
    setElapsedTime(0);
    setIsTimerRunning(false);
  };

  const toggleTimer = () => setIsTimerRunning((prev) => !prev);
  const formatTime = (totalSeconds: number) => {
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  const handleLogChange = (
    exerciseId: number,
    setIndex: number,
    field: 'reps' | 'load',
    value: string
  ) => {
    const exerciseKey = exerciseId.toString();
    setLogData((prev) => {
      const currentExerciseSets = Math.max(0, parseInt(currentExercise?.sets || '0', 10));
      const existingLog =
        prev[exerciseKey] ||
        Array.from({ length: currentExerciseSets }, (): PerformanceSet => ({ reps: '', load: '' }));
      const updatedExerciseLog = [...existingLog];
      const currentSet = updatedExerciseLog[setIndex] || ({ reps: '', load: '' } as PerformanceSet);
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
      const existingLog =
        prev[exerciseKey] ||
        Array.from({ length: currentExerciseSets }, (): PerformanceSet => ({ reps: '', load: '' }));
      const updatedExerciseLog = [...existingLog];

      const currentSet = updatedExerciseLog[setIndex] || ({ reps: '', load: '' } as PerformanceSet);
      updatedExerciseLog[setIndex] = { ...currentSet, comment: currentComment };

      return { ...prev, [exerciseKey]: updatedExerciseLog };
    });

    setIsCommentModalOpen(false);
    setCommentTarget(null);
    setCurrentComment('');
  };

  const handleFinishSession = async () => {
    if (!localProgram || !activeSession || !user) {
      navigate('/app/workout');
      return;
    }

    const hasUnloggedExercises = activeSession.exercises.some((exercise) => {
      const loggedSetsForExercise = logData[exercise.id.toString()] || [];
      return !loggedSetsForExercise.some((set) => set.reps.trim() !== '' || set.load.trim() !== '');
    });

    if (hasUnloggedExercises) {
      if (
        !window.confirm(
          'Certains exercices ne sont pas complétés. Voulez-vous vraiment terminer la séance ? Les données non saisies ne seront pas enregistrées.'
        )
      ) {
        return;
      }
    }

    const exerciseLogsForSession: ExerciseLog[] = activeSession.exercises
      .map((exercise) => {
        const loggedSetsForExercise = logData[exercise.id.toString()] || [];
        const nonEmptySets = loggedSetsForExercise.filter(
          (s) => s.reps.trim() || s.load.trim() || s.comment?.trim()
        );

        if (nonEmptySets.length === 0) {
          return null;
        }

        const newLog: ExerciseLog = {
          exerciseId: exercise.id,
          exerciseName: exercise.name,
          loggedSets: nonEmptySets.map((set) => ({
            ...set,
            restTime: exercise.details?.[0]?.rest,
            viewedByCoach: false,
          })),
        };
        return newLog;
      })
      .filter((log): log is ExerciseLog => log !== null);

    if (exerciseLogsForSession.length > 0 && user.coachId) {
      addNotification({
        userId: user.coachId,
        fromName: `${user.firstName} ${user.lastName}`,
        type: 'session_completed',
        message: `a terminé la séance : ${activeSession.name}.`,
        link: `/app/client/${user.id}`,
      });
    }

    const newLogEntry: PerformanceLog = {
      date: new Date().toLocaleDateString('fr-FR'),
      week: currentWeek,
      programName: localProgram.name,
      sessionName: activeSession.name,
      exerciseLogs: exerciseLogsForSession,
    };

    // Sauvegarder dans Supabase
    const programAssignmentId = (localProgram as any).assignmentId || null;
    const sessionId = activeSession.id;
    
    const savedLogId = await savePerformanceLog(
      user.id,
      programAssignmentId,
      sessionId,
      newLogEntry
    );

    if (!savedLogId) {
      console.error('Échec de la sauvegarde du log de performance');
      // On continue quand même pour ne pas bloquer l'utilisateur
    }

    const updatedClients = clients.map((c) => {
      if (c.id === user.id) {
        const newPerformanceLog = [...(c.performanceLog || []), newLogEntry];

        const currentProgramWeek = c.programWeek || 1;
        const sessionsForCurrentWeek =
          localProgram.sessionsByWeek[currentProgramWeek] || localProgram.sessionsByWeek[1] || [];
        const totalSessionsForCurrentWeek = sessionsForCurrentWeek.length;
        const currentSessionProgress = c.sessionProgress || 1;
        const totalWeeks = c.totalWeeks || localProgram.weekCount;

        const isLastSessionOfProgram =
          currentProgramWeek >= totalWeeks && currentSessionProgress >= totalSessionsForCurrentWeek;

        finishStatusRef.current.wasProgramFinished = isLastSessionOfProgram;

        if (isLastSessionOfProgram) {
          const hasNextProgram = c.assignedPrograms && c.assignedPrograms.length > 1;
          finishStatusRef.current.hasNextProgram = hasNextProgram;

          if (hasNextProgram) {
            const remainingPrograms = c.assignedPrograms.slice(1);
            const nextProgram = remainingPrograms[0];
            return {
              ...c,
              performanceLog: newPerformanceLog,
              assignedPrograms: remainingPrograms,
              programWeek: 1,
              sessionProgress: 1,
              totalWeeks: nextProgram.weekCount,
              totalSessions: nextProgram.sessionsByWeek[1]?.length || 0,
              viewed: false,
            };
          } else {
            // Programme terminé, pas de programme suivant
            return {
              ...c,
              performanceLog: newPerformanceLog,
              programWeek: undefined,
              sessionProgress: undefined,
              totalWeeks: undefined,
              totalSessions: undefined,
              viewed: false,
            };
          }
        } else {
          let nextSessionProgress = currentSessionProgress + 1;
          let nextProgramWeek = currentProgramWeek;
          let nextTotalSessions = totalSessionsForCurrentWeek;

          if (nextSessionProgress > totalSessionsForCurrentWeek) {
            nextProgramWeek++;
            nextSessionProgress = 1;
            const sessionsForNextWeek =
              localProgram.sessionsByWeek[nextProgramWeek] || localProgram.sessionsByWeek[1] || [];
            nextTotalSessions = sessionsForNextWeek.length;
          }
          return {
            ...c,
            performanceLog: newPerformanceLog,
            sessionProgress: nextSessionProgress,
            programWeek: nextProgramWeek,
            totalSessions: nextTotalSessions,
            viewed: false,
          };
        }
      }
      return c;
    });

    setClients(updatedClients);
    setRecapData({ exerciseLogs: exerciseLogsForSession, sessionName: activeSession.name });
    setIsRecapModalOpen(true);
  };

  const handleCloseRecapModal = () => {
    setIsRecapModalOpen(false);
    const { wasProgramFinished, hasNextProgram } = finishStatusRef.current;
    if (wasProgramFinished && !hasNextProgram) {
      setIsCongratsModalOpen(true);
    } else {
      navigate('/app/workout');
    }
  };

  const handleCloseCongratsModal = () => {
    setIsCongratsModalOpen(false);
    navigate('/app/workout');
  };

  const TimerDisplay = () => {
    const restTimeInSeconds = useMemo(() => {
      if (!currentExercise) return Infinity;
      const specificRest = currentExercise.details[activeSetIndex]?.rest;
      const generalRest = currentExercise.details[0]?.rest;
      const restString = specificRest || generalRest || '0s';
      const seconds = parseInt(restString.replace(/\D/g, ''), 10);
      return isNaN(seconds) ? Infinity : seconds;
    }, [currentExercise, activeSetIndex]);

    const timeColorClass =
      elapsedTime > restTimeInSeconds ? 'text-red-500' : 'text-gray-900 dark:text-client-light';

    return (
      <div className="fixed inset-0 bg-black/90 z-50 flex flex-col items-center justify-center p-4">
        <button
          onClick={handleCloseTimer}
          className="absolute top-6 right-6 text-gray-400 dark:text-client-subtle hover:text-white"
          aria-label="Fermer le chronomètre"
        >
          <XMarkIcon className="w-8 h-8" />
        </button>
        <p className="text-xl text-gray-400 dark:text-client-subtle mb-4">
          Objectif: {restTimeInSeconds === Infinity ? '-' : `${restTimeInSeconds}s`}
        </p>
        <div className={`font-mono font-bold text-8xl md:text-9xl ${timeColorClass}`}>
          {formatTime(elapsedTime)}
        </div>
        <div className="mt-12 flex items-center gap-8">
          <Button variant="secondary" onClick={handleResetTimer} className="!font-semibold">
            Réinitialiser
          </Button>
          <button
            onClick={toggleTimer}
            className="w-24 h-24 bg-white text-client-dark rounded-full flex items-center justify-center text-2xl font-bold shadow-lg transform active:scale-95 transition-transform"
            aria-label={isTimerRunning ? 'Mettre en pause' : 'Démarrer'}
          >
            {isTimerRunning ? (
              <PauseIcon className="w-10 h-10" />
            ) : (
              <PlayIcon className="w-10 h-10 ml-1" />
            )}
          </button>
        </div>
      </div>
    );
  };

  // Afficher un indicateur de chargement pendant la récupération du programme
  if (isProgramLoading) {
    return (
      <div className="text-center py-10">
        <p className="text-gray-900 dark:text-client-light text-lg">
          Chargement de votre programme...
        </p>
      </div>
    );
  }

  if (!localProgram || !activeSession) {
    return (
      <div className="text-center py-10">
        <p className="text-gray-900 dark:text-client-light text-lg">
          Aucun programme ou séance active.
        </p>
        <p className="text-gray-500 dark:text-client-subtle mt-1">Contactez votre coach.</p>
        <button
          onClick={() => navigate('/app/workout')}
          className="mt-6 text-primary hover:underline"
        >
          Retour
        </button>
      </div>
    );
  }

  if (!currentExercise) {
    return (
      <div className="text-center py-10">
        <p className="text-gray-900 dark:text-client-light text-lg">
          Cette séance ne contient aucun exercice.
        </p>
      </div>
    );
  }

  const totalSets = Math.max(0, parseInt(currentExercise.sets, 10) || 0);
  const technique = currentExercise?.intensification?.[0]?.value;
  const definition = technique ? INTENSIFICATION_DEFINITIONS[technique] : undefined;

  return (
    <div className="relative pb-20">
      {/* Header with Back button and Session Selector */}
      <div className="flex items-center gap-4 mb-4">
        <button
          onClick={() => navigate(-1)}
          className="p-2 bg-white dark:bg-client-card rounded-full text-gray-800 dark:text-client-light hover:bg-gray-100 dark:hover:bg-primary/20 flex-shrink-0 border border-gray-300 dark:border-gray-700"
          aria-label="Retour"
        >
          <ArrowLeftIcon className="w-5 h-5" />
        </button>
        <div className="relative flex-grow">
          <select
            value={selectedSessionIndex}
            onChange={(e) => {
              const newOriginalIndex = Number(e.target.value);
              setSelectedSessionIndex(newOriginalIndex);
              setCurrentExerciseIndex(0);
            }}
            className="w-full appearance-none bg-white dark:bg-client-card border border-gray-300 dark:border-client-dark text-gray-900 dark:text-client-light text-lg font-semibold py-3 px-4 pr-10 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
            aria-label="Sélectionner une séance"
          >
            {availableSessions.map((session) => (
              <option key={session.id} value={session.originalIndex}>
                {session.name}
              </option>
            ))}
          </select>
          <ChevronDownIcon className="w-5 h-5 text-gray-500 dark:text-client-subtle absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none" />
        </div>
      </div>

      {/* Exercise Details Card */}
      <div className="bg-white dark:bg-client-card rounded-lg p-3 space-y-4 shadow-sm border border-gray-200 dark:border-transparent">
        <div className="flex justify-between items-center gap-2">
          <div className="relative flex-1">
            <select
              value={currentExerciseIndex}
              onChange={(e) => handleSelectExercise(Number(e.target.value))}
              className="w-full appearance-none bg-gray-100 dark:bg-client-dark border-none text-gray-800 dark:text-client-light font-semibold py-2.5 px-4 pr-8 rounded-full focus:outline-none focus:ring-2 focus:ring-primary"
            >
              {activeSession.exercises.map((ex, index) => (
                <option key={ex.id} value={index}>
                  {ex.name}
                </option>
              ))}
            </select>
            <ChevronDownIcon className="w-4 h-4 text-gray-500 dark:text-client-subtle absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>
          <div className="relative">
            <button
              ref={optionsButtonRef}
              onClick={() => setIsOptionsPopoverOpen((prev) => !prev)}
              className="w-10 h-10 bg-gray-100 dark:bg-client-dark rounded-full flex items-center justify-center text-gray-500 dark:text-client-subtle hover:text-primary transition-colors flex-shrink-0"
            >
              <EllipsisVerticalIcon className="w-6 h-6" />
            </button>
            {isOptionsPopoverOpen && (
              <div className="absolute right-0 top-full mt-2 w-48 bg-white dark:bg-client-dark rounded-lg shadow-lg p-2 z-30 border border-gray-200 dark:border-gray-700">
                <button
                  onClick={() => {
                    setIsYouTubeModalOpen(true);
                    setIsOptionsPopoverOpen(false);
                  }}
                  className="w-full flex items-center gap-3 p-2 text-left rounded-md text-gray-800 dark:text-client-light hover:bg-gray-100 dark:hover:bg-primary/20"
                >
                  <PlayCircleIcon className="w-5 h-5" />
                  <span>Voir la vidéo</span>
                </button>
                <button
                  onClick={() => {
                    setIsAlternativesModalOpen(true);
                    setIsOptionsPopoverOpen(false);
                  }}
                  className="w-full flex items-center gap-3 p-2 text-left rounded-md text-gray-800 dark:text-client-light hover:bg-gray-100 dark:hover:bg-primary/20"
                >
                  <ArrowsRightLeftIcon className="w-5 h-5" />
                  <span>Alternatives</span>
                </button>
              </div>
            )}
          </div>
        </div>

        <img
          src={currentExercise.illustrationUrl}
          alt={currentExercise.name}
          className="w-full h-auto object-cover rounded-lg bg-gray-100 dark:bg-gray-700 aspect-video"
        />

        <div className="grid grid-cols-4 divide-x divide-gray-200 dark:divide-client-dark/50 text-center">
          <div>
            <p className="text-sm text-gray-500 dark:text-client-subtle">Séries</p>
            <p className="font-bold text-lg">{currentExercise.sets}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500 dark:text-client-subtle">Rép</p>
            <p className="font-bold text-lg">{getDisplayValue(currentExercise.details, 'reps')}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500 dark:text-client-subtle">Repos</p>
            <p className="font-bold text-lg">
              {getDisplayValue(currentExercise.details, 'rest').replace(/\D/g, '')}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-500 dark:text-client-subtle">Tempo</p>
            <p className="font-bold text-lg">{getDisplayValue(currentExercise.details, 'tempo')}</p>
          </div>
        </div>

        {technique && definition && (
          <div className="relative">
            <button
              onClick={() => setDefinitionVisible(!isDefinitionVisible)}
              className="w-full appearance-none bg-gray-100 dark:bg-client-dark border-none text-gray-500 dark:text-client-subtle font-semibold py-2.5 px-4 rounded-md focus:outline-none focus:ring-2 focus:ring-primary text-left flex justify-between items-center"
            >
              <span>
                Technique d'intensification : <strong>{technique}</strong>
              </span>
              <ChevronDownIcon
                className={`w-4 h-4 text-gray-500 dark:text-client-subtle transition-transform ${isDefinitionVisible ? 'rotate-180' : ''}`}
              />
            </button>
            {isDefinitionVisible && (
              <div className="p-3 mt-1 bg-gray-100 dark:bg-client-dark rounded-md text-sm text-gray-500 dark:text-client-subtle">
                {definition}
              </div>
            )}
          </div>
        )}

        <div className="pt-2">
          <div className="flex text-center font-semibold text-gray-500 dark:text-client-subtle mb-2">
            <div className="w-1/4">Série</div>
            <div className="flex-1 px-1">Répétition</div>
            <div className="flex-1 px-1">{loadUnit}</div>
            <div className="w-10 px-1 shrink-0">Note</div>
          </div>
          <div className="bg-gray-100 dark:bg-client-dark rounded-lg p-4 space-y-2">
            {[...Array(totalSets)].map((_, setIndex) => {
              const isSetSelected = setIndex === activeSetIndex;
              const exerciseKey = currentExercise.id.toString();
              const repValue = logData[exerciseKey]?.[setIndex]?.reps || '';
              const loadValue = logData[exerciseKey]?.[setIndex]?.load || '';

              const placeholders = previousPerformancePlaceholders?.get(currentExercise.name);
              const setPlaceholder = placeholders?.[setIndex];

              const targetReps =
                currentExercise.details[setIndex]?.reps || currentExercise.details[0]?.reps || '0';
              const targetLoad =
                currentExercise.details[setIndex]?.load.value ||
                currentExercise.details[0]?.load.value ||
                '0';

              return (
                <div
                  key={setIndex}
                  className={`flex items-center p-2 rounded-lg transition-colors duration-300 cursor-pointer ${isSetSelected ? 'bg-primary' : ''}`}
                  onClick={() => setActiveSetIndex(setIndex)}
                >
                  <p
                    className={`flex-none w-1/4 text-center font-bold text-lg ${isSetSelected ? 'text-white' : 'text-gray-500 dark:text-client-subtle'}`}
                  >
                    S{setIndex + 1}
                  </p>
                  <div className="flex-1 px-1">
                    <input
                      type="number"
                      placeholder={setPlaceholder?.reps || targetReps}
                      value={repValue}
                      onChange={(e) =>
                        handleLogChange(currentExercise.id, setIndex, 'reps', e.target.value)
                      }
                      onFocus={() => setActiveSetIndex(setIndex)}
                      className={`w-full rounded-md text-center py-2 font-bold text-lg border-2 ${isSetSelected ? 'bg-white/20 border-white/50 text-white placeholder:text-white/70' : 'bg-white dark:bg-client-card border-gray-300 dark:border-transparent text-gray-900 dark:text-client-light placeholder:text-gray-500 dark:placeholder:text-client-subtle'}`}
                      onClick={(e) => e.stopPropagation()}
                    />
                  </div>
                  <div className="flex-1 px-1">
                    <input
                      type="number"
                      placeholder={setPlaceholder?.load || targetLoad}
                      value={loadValue}
                      onChange={(e) =>
                        handleLogChange(currentExercise.id, setIndex, 'load', e.target.value)
                      }
                      onFocus={() => setActiveSetIndex(setIndex)}
                      className={`w-full rounded-md text-center py-2 font-bold text-lg border-2 ${isSetSelected ? 'bg-white/20 border-white/50 text-white placeholder:text-white/70' : 'bg-white dark:bg-client-card border-gray-300 dark:border-transparent text-gray-900 dark:text-client-light placeholder:text-gray-500 dark:placeholder:text-client-subtle'}`}
                      onClick={(e) => e.stopPropagation()}
                    />
                  </div>
                  <div className="flex-none w-10 text-center pl-1 shrink-0">
                    {isSetSelected ? (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleOpenCommentModal(currentExercise.id, setIndex);
                        }}
                        className="p-1 rounded-full text-white/80 hover:bg-white/20"
                        aria-label="Ajouter un commentaire"
                      >
                        <PencilIcon className="w-5 h-5" />
                      </button>
                    ) : (
                      logData[exerciseKey]?.[setIndex]?.comment && (
                        <ChatBubbleLeftIcon
                          className="w-5 h-5 text-gray-500 dark:text-client-subtle mx-auto"
                          title={logData[exerciseKey]?.[setIndex]?.comment}
                        />
                      )
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div className="mt-8">
        <button
          onClick={handleFinishSession}
          className="w-full bg-primary text-white font-bold py-3 rounded-lg hover:bg-violet-700 transition-colors"
        >
          Terminer la séance
        </button>
      </div>

      {/* Timer Area */}
      {isTimerFullscreen ? (
        <TimerDisplay />
      ) : (
        <div className="fixed bottom-20 right-4 z-20">
          <button
            onClick={handleStartTimer}
            className="w-16 h-16 bg-white text-client-dark rounded-full shadow-lg flex items-center justify-center hover:bg-gray-200 transition-transform active:scale-95 border border-gray-300"
            aria-label="Démarrer le chronomètre"
          >
            <ClockIcon className="w-8 h-8" />
          </button>
        </div>
      )}

      {/* Modals */}
      <Modal
        isOpen={isCongratsModalOpen}
        onClose={handleCloseCongratsModal}
        title="Félicitations !"
      >
        <div className="text-center">
          <TrophyIcon className="w-20 h-20 text-yellow-400 mx-auto mb-4" />
          <p className="text-lg text-gray-800">
            Vous avez brillamment terminé votre programme d'entraînement !
          </p>
          <p className="mt-2 text-gray-600">
            Votre coach sera notifié de votre réussite. Continuez comme ça !
          </p>
          <button
            onClick={handleCloseCongratsModal}
            className="mt-6 bg-primary text-white font-bold py-2 px-6 rounded-lg"
          >
            Retour à l'entraînement
          </button>
        </div>
      </Modal>
      {recapData && user && (
        <SessionRecapModal
          isOpen={isRecapModalOpen}
          onClose={handleCloseRecapModal}
          sessionName={recapData.sessionName}
          exerciseLogs={recapData.exerciseLogs}
          clientName={user.firstName}
        />
      )}

      {fullExerciseDetails && (
        <Modal
          isOpen={isYouTubeModalOpen}
          onClose={() => setIsYouTubeModalOpen(false)}
          title={`Vidéo : ${fullExerciseDetails.name}`}
        >
          {fullExerciseDetails.videoUrl ? (
            <iframe
              src={fullExerciseDetails.videoUrl.replace('watch?v=', 'embed/')}
              title={fullExerciseDetails.name}
              frameBorder="0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              className="w-full aspect-video rounded-lg"
            ></iframe>
          ) : (
            <p className="text-center text-gray-500 p-4">
              Aucune vidéo disponible pour cet exercice.
            </p>
          )}
        </Modal>
      )}

      <Modal
        isOpen={isAlternativesModalOpen}
        onClose={() => setIsAlternativesModalOpen(false)}
        title={`Alternatives pour : ${currentExercise.name}`}
      >
        <div className="space-y-2">
          {alternativeExercises.length > 0 ? (
            alternativeExercises.map((alt) => (
              <button
                key={alt.id}
                onClick={() => handleSwapExercise(alt)}
                className="w-full flex items-center gap-3 p-2 rounded-lg hover:bg-gray-100 text-left transition-colors"
              >
                <img
                  src={alt.illustrationUrl}
                  alt={alt.name}
                  className="w-16 h-16 object-contain rounded-md bg-gray-100 flex-shrink-0"
                />
                <div className="flex-grow">
                  <p className="font-semibold text-gray-800">{alt.name}</p>
                  <p className="text-xs text-gray-500">{alt.muscleGroups?.join(', ')}</p>
                </div>
              </button>
            ))
          ) : (
            <p className="text-center text-gray-500 p-4">Aucune alternative suggérée.</p>
          )}
        </div>
      </Modal>

      <Modal
        isOpen={isCommentModalOpen}
        onClose={() => setIsCommentModalOpen(false)}
        title={`Commentaire pour ${currentExercise?.name} - Série ${commentTarget ? commentTarget.setIndex + 1 : ''}`}
      >
        <div className="space-y-4">
          <textarea
            value={currentComment}
            onChange={(e) => setCurrentComment(e.target.value)}
            className="w-full h-32 p-2 bg-white border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
            placeholder="Écrivez vos notes ici..."
            autoFocus
          />
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setIsCommentModalOpen(false)}>
              Annuler
            </Button>
            <Button onClick={handleSaveComment}>Enregistrer</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default ClientCurrentProgram;
