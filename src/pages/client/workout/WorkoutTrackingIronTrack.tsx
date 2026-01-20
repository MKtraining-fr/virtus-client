import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  ChevronLeft, 
  PlayCircle, 
  Dumbbell, 
  Plus, 
  Minus,
  History,
  Check,
  Settings,
  Camera,
  Timer,
  NotebookPen
} from 'lucide-react';
import SetWheel from '../../../components/client/irontrack/SetWheel';
import RestTimer from '../../../components/client/irontrack/RestTimer';
import { useWorkoutStore } from '../../../stores/workoutStore';
import type { Exercise, ExerciseSet, SetType } from '../../../components/client/irontrack/irontrack-types';
import type { WorkoutExercise, PerformanceSet } from '../../../types';

const WorkoutTrackingIronTrack: React.FC = () => {
  const navigate = useNavigate();
  
  // Workout store
  const {
    sessionName,
    exercises,
    currentExerciseIndex,
    currentSetIndex,
    performanceData,
    isRestTimerActive,
    restTimeLeft,
    goToSet,
    updateSetData,
    completeSet,
    startRestTimer,
    stopRestTimer,
    addRestTime,
    toggleOptionsMenu,
    startVideoRecording,
  } = useWorkoutStore();

  const currentExercise = exercises[currentExerciseIndex];
  
  // Local state for weight and reps input
  const [weightInput, setWeightInput] = useState<string>('0');
  const [repsInput, setRepsInput] = useState<string>('0');

  // Convert Virtus WorkoutExercise to IronTrack Exercise format
  const exercise: Exercise | null = useMemo(() => {
    if (!currentExercise) return null;

    const totalSets = typeof currentExercise.sets === 'number' 
      ? currentExercise.sets 
      : parseInt(currentExercise.sets as string, 10) || 0;

    const exercisePerformanceData = performanceData[currentExercise.exerciseId] || [];

    // Create sets array
    const sets: ExerciseSet[] = Array.from({ length: totalSets }, (_, i) => {
      const perfData = exercisePerformanceData[i] || {};
      
      return {
        id: i + 1,
        setNumber: i + 1,
        type: 'WORKING' as any,
        weight: parseFloat(perfData.load || currentExercise.load || '0'),
        reps: parseInt(perfData.reps || currentExercise.reps || '0', 10),
        completed: perfData.completed || false,
        previousBest: undefined, // TODO: Get from previous session data
      };
    });

    return {
      name: currentExercise.name,
      videoUrl: currentExercise.illustrationUrl,
      protocol: {
        targetSets: totalSets,
        targetReps: currentExercise.reps || '8-12',
        tempo: currentExercise.tempo || '3-0-1-0',
        restSeconds: parseInt(currentExercise.restTime || '90', 10),
      },
      sets,
    };
  }, [currentExercise, performanceData]);

  // Update local inputs when set changes
  useEffect(() => {
    if (exercise && exercise.sets[currentSetIndex]) {
      const currentSet = exercise.sets[currentSetIndex];
      setWeightInput(currentSet.weight.toString());
      setRepsInput(currentSet.reps.toString());
    }
  }, [currentSetIndex, exercise]);

  // Sync local input changes to store
  const handleWeightChange = (newWeight: number) => {
    if (!currentExercise) return;
    setWeightInput(newWeight.toString());
    updateSetData(currentExercise.exerciseId, currentSetIndex, {
      load: newWeight.toString(),
    });
  };

  const handleRepsChange = (newReps: number) => {
    if (!currentExercise) return;
    setRepsInput(newReps.toString());
    updateSetData(currentExercise.exerciseId, currentSetIndex, {
      reps: newReps.toString(),
    });
  };

  const handleAdjustWeight = (amount: number) => {
    const current = parseFloat(weightInput) || 0;
    const newValue = Math.max(0, current + amount);
    handleWeightChange(newValue);
  };

  const handleAdjustReps = (amount: number) => {
    const current = parseInt(repsInput, 10) || 0;
    const newValue = Math.max(0, current + amount);
    handleRepsChange(newValue);
  };

  const handleAction = (type: 'timer' | 'video' | 'notes') => {
    if (!currentExercise) return;
    
    switch (type) {
      case 'timer':
        const restTime = parseInt(currentExercise.restTime || '90', 10);
        startRestTimer(restTime);
        break;
      case 'video':
        startVideoRecording();
        break;
      case 'notes':
        // TODO: Open notes modal
        console.log('Open notes modal');
        break;
    }
  };

  const finishSet = () => {
    if (!currentExercise) return;

    // Mark set as completed
    completeSet(currentExercise.exerciseId, currentSetIndex);

    // Start rest timer
    const restTime = parseInt(currentExercise.restTime || '90', 10);
    startRestTimer(restTime);

    // Move to next set after a short delay
    const totalSets = typeof currentExercise.sets === 'number' 
      ? currentExercise.sets 
      : parseInt(currentExercise.sets as string, 10) || 0;
    
    if (currentSetIndex < totalSets - 1) {
      setTimeout(() => {
        goToSet(currentSetIndex + 1);
      }, 400);
    }
  };

  // Loading state
  if (!exercise) {
    return (
      <div className="h-full w-full bg-background flex items-center justify-center">
        <div className="text-white text-lg">Chargement...</div>
      </div>
    );
  }

  return (
    <div className="h-full w-full bg-background flex flex-col relative overflow-hidden">
      
      {/* Header */}
      <header className="flex-none pt-4 px-6 pb-2 flex items-center justify-between z-40 bg-background/80 backdrop-blur-md sticky top-0">
        <button 
          onClick={() => navigate('/app/workout')}
          className="p-2 -ml-2 text-zinc-500 hover:text-white transition-colors"
        >
          <ChevronLeft size={28} />
        </button>
        <div className="flex flex-col items-center">
          <h1 className="text-lg font-black text-white uppercase tracking-tighter italic leading-none">{exercise.name}</h1>
          <span className="text-[10px] text-brand-primary font-black tracking-widest uppercase mt-1">{sessionName}</span>
        </div>
        <button 
          onClick={toggleOptionsMenu}
          className="p-2 -mr-2 text-zinc-500 hover:text-white transition-colors"
        >
          <Settings size={22} />
        </button>
      </header>

      {/* Top Section: Video & Actions */}
      <div className="flex-none flex flex-col z-30 relative px-6 pt-2 space-y-4">
        
        {/* Large Video Card */}
        <div className="relative w-full aspect-video rounded-2xl overflow-hidden bg-zinc-900 border border-white/5 shadow-2xl group">
            {exercise.videoUrl ? (
              <img src={exercise.videoUrl} className="w-full h-full object-cover opacity-50 group-hover:opacity-40 transition-opacity" alt="Exercise" />
            ) : (
              <div className="w-full h-full bg-zinc-900 flex items-center justify-center">
                <Dumbbell size={48} className="text-zinc-700" />
              </div>
            )}
            <div className="absolute inset-0 flex items-center justify-center">
                <PlayCircle size={48} className="text-brand-primary/60 group-hover:text-brand-primary transition-colors cursor-pointer" />
            </div>
            
            {/* Badges Overlay */}
            <div className="absolute bottom-3 left-3 flex items-center gap-2">
                 <span className="bg-black/60 px-3 py-1.5 rounded-lg backdrop-blur-md border border-white/10 flex items-center gap-2 text-[10px] font-black font-mono text-zinc-300 uppercase tracking-widest">
                    <Dumbbell size={12} className="text-brand-primary" /> {exercise.protocol.targetReps}
                 </span>
            </div>
            <div className="absolute bottom-3 right-3 flex items-center gap-2">
                 <span className="bg-black/60 px-3 py-1.5 rounded-lg backdrop-blur-md border border-white/10 flex items-center gap-2 text-[10px] font-black font-mono text-zinc-300 uppercase tracking-widest">
                    <History size={12} className="text-brand-primary" /> {exercise.protocol.tempo}
                 </span>
            </div>
        </div>

        {/* Action Bar (Linked to Active Set) */}
        <div className="grid grid-cols-3 gap-3">
             <button 
                onClick={() => handleAction('timer')}
                className="flex flex-col items-center justify-center gap-1 bg-zinc-900 hover:bg-zinc-800 p-2 rounded-xl border border-zinc-800 transition-all active:scale-95 group"
             >
                <Timer size={20} className="text-zinc-500 group-hover:text-brand-primary transition-colors" />
                <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-wider">Chrono</span>
             </button>
             <button 
                onClick={() => handleAction('video')}
                className="flex flex-col items-center justify-center gap-1 bg-zinc-900 hover:bg-zinc-800 p-2 rounded-xl border border-zinc-800 transition-all active:scale-95 group"
             >
                <Camera size={20} className="text-zinc-500 group-hover:text-brand-primary transition-colors" />
                <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-wider">Rec</span>
             </button>
             <button 
                onClick={() => handleAction('notes')}
                className="flex flex-col items-center justify-center gap-1 bg-zinc-900 hover:bg-zinc-800 p-2 rounded-xl border border-zinc-800 transition-all active:scale-95 group"
             >
                <NotebookPen size={20} className="text-zinc-500 group-hover:text-brand-primary transition-colors" />
                <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-wider">Notes</span>
             </button>
        </div>
      </div>

      {/* Cylinder Area (Takes remaining space) */}
      <div className="flex-1 min-h-0 relative -mt-4 z-10">
          <SetWheel 
              sets={exercise.sets}
              selectedIndex={currentSetIndex}
              onSelect={goToSet}
            />
      </div>

      {/* Control Station */}
      <footer className="flex-none bg-zinc-950/90 backdrop-blur-xl border-t border-zinc-800/50 pt-4 pb-8 px-6 z-50 shadow-[0_-20px_50px_rgba(0,0,0,0.8)] rounded-t-[32px]">
        
        <div className="flex gap-4 mb-4">
          {/* Weight */}
          <div className="flex-1 bg-zinc-900/80 rounded-2xl p-1 flex items-center justify-between border border-white/5 shadow-inner">
            <button 
              onClick={() => handleAdjustWeight(-2.5)}
              className="w-10 h-12 rounded-xl bg-zinc-800 text-zinc-400 active:scale-90 transition-transform flex items-center justify-center"
            >
              <Minus size={20} />
            </button>
            <div className="flex flex-col items-center">
              <span className="text-2xl font-black font-mono text-white tracking-tighter">{weightInput}</span>
              <span className="text-[8px] text-zinc-600 uppercase font-black tracking-widest">KG</span>
            </div>
            <button 
              onClick={() => handleAdjustWeight(2.5)}
              className="w-10 h-12 rounded-xl bg-zinc-800 text-zinc-400 active:scale-90 transition-transform flex items-center justify-center"
            >
              <Plus size={20} />
            </button>
          </div>

          {/* Reps */}
          <div className="flex-1 bg-zinc-900/80 rounded-2xl p-1 flex items-center justify-between border border-white/5 shadow-inner">
            <button 
               onClick={() => handleAdjustReps(-1)}
               className="w-10 h-12 rounded-xl bg-zinc-800 text-zinc-400 active:scale-90 transition-transform flex items-center justify-center"
            >
              <Minus size={20} />
            </button>
            <div className="flex flex-col items-center">
              <span className="text-2xl font-black font-mono text-white tracking-tighter">{repsInput}</span>
              <span className="text-[8px] text-zinc-600 uppercase font-black tracking-widest">REPS</span>
            </div>
            <button 
               onClick={() => handleAdjustReps(1)}
               className="w-10 h-12 rounded-xl bg-zinc-800 text-zinc-400 active:scale-90 transition-transform flex items-center justify-center"
            >
              <Plus size={20} />
            </button>
          </div>
        </div>

        <button 
          onClick={finishSet}
          className="w-full h-16 bg-brand-primary hover:bg-brand-secondary text-white font-black text-lg rounded-2xl flex items-center justify-center gap-3 shadow-[0_10px_40px_rgba(123,109,242,0.25)] transition-all active:translate-y-1 active:shadow-none uppercase tracking-tighter italic"
        >
          <div className="bg-black/10 p-1.5 rounded-lg">
             <Check size={24} strokeWidth={4} />
          </div>
          LOG SET {currentSetIndex + 1}
        </button>

      </footer>

      <RestTimer 
        secondsRemaining={restTimeLeft} 
        onSkip={stopRestTimer}
        onAdd={() => addRestTime(30)}
      />

    </div>
  );
};

export default WorkoutTrackingIronTrack;
