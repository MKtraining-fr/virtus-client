import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ChevronLeft, 
  PlayCircle, 
  Dumbbell, 
  History,
  Check,
  Settings,
  Camera,
  Timer,
  NotebookPen,
  Zap
} from 'lucide-react';
import SetWheel from '../components/irontrack/SetWheel';
import RestTimer from '../components/irontrack/RestTimer';
import NumberPicker from '../components/irontrack/NumberPicker';
import type { Exercise, ExerciseSet } from '../components/irontrack/irontrack-types';

// Responsive cylinder area height
const cylinderAreaStyle = `
  .cylinder-area {
    height: calc(100vh - 480px);
    min-height: 250px;
  }
  
  @media (min-width: 768px) {
    .cylinder-area {
      height: calc(100vh - 350px);
      min-height: 400px;
    }
  }
`;

// Mock exercise data
const MOCK_EXERCISE: Exercise = {
  name: "Développé Couché",
  videoUrl: "https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=800&h=600&fit=crop",
  protocol: {
    targetSets: 5,
    targetReps: "8-12 reps",
    tempo: "3-0-1-0",
    restSeconds: 90
  },
  sets: [
    { id: 1, setNumber: 1, type: 'WORKING' as any, weight: 80, reps: 12, previousBest: "80kg × 10", completed: false },
    { id: 2, setNumber: 2, type: 'WORKING' as any, weight: 82.5, reps: 10, previousBest: "80kg × 10", completed: false },
    { id: 3, setNumber: 3, type: 'WORKING' as any, weight: 82.5, reps: 10, previousBest: "80kg × 10", completed: false },
    { id: 4, setNumber: 4, type: 'WORKING' as any, weight: 80, reps: 12, previousBest: "77.5kg × 11", completed: false },
    { id: 5, setNumber: 5, type: 'WORKING' as any, weight: 77.5, reps: 12, previousBest: "75kg × 12", completed: false },
  ]
};

const IronTrack: React.FC = () => {
  const navigate = useNavigate();
  const [exercise, setExercise] = useState<Exercise>(MOCK_EXERCISE);
  const [currentSetIndex, setCurrentSetIndex] = useState<number>(2); 
  
  const [weightInput, setWeightInput] = useState<number>(MOCK_EXERCISE.sets[2].weight);
  const [repsInput, setRepsInput] = useState<number>(MOCK_EXERCISE.sets[2].reps || 10);
  
  const [isResting, setIsResting] = useState(false);
  const [restSeconds, setRestSeconds] = useState(0);
  const [showIntensityModal, setShowIntensityModal] = useState(false);
  const [showWeightModal, setShowWeightModal] = useState(false);
  const [showRepsModal, setShowRepsModal] = useState(false);

  useEffect(() => {
    const set = exercise.sets[currentSetIndex];
    if (set) {
      setWeightInput(set.weight);
      setRepsInput(set.reps || 0);
    }
  }, [currentSetIndex]);

  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    if (isResting && restSeconds > 0) {
      interval = setInterval(() => {
        setRestSeconds((prev) => {
          if (prev <= 1) {
            setIsResting(false);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isResting, restSeconds]);

  const handleAdjustWeight = (amount: number) => {
    setWeightInput(prev => {
        const val = Math.max(0, prev + amount);
        updateCurrentSetData(val, repsInput);
        return val;
    });
  };

  const handleAdjustReps = (amount: number) => {
    setRepsInput(prev => {
        const val = Math.max(0, prev + amount);
        updateCurrentSetData(weightInput, val);
        return val;
    });
  };

  const updateCurrentSetData = (w: number, r: number) => {
    const updatedSets = [...exercise.sets];
    updatedSets[currentSetIndex] = {
      ...updatedSets[currentSetIndex],
      weight: w,
      reps: r,
    };
    setExercise({ ...exercise, sets: updatedSets });
  }

  const handleAction = (type: 'timer' | 'video' | 'notes') => {
      console.log(`Action triggered for set ${currentSetIndex + 1}: ${type}`);
      if (type === 'timer') {
          setIsResting(true);
          setRestSeconds(exercise.protocol.restSeconds);
      }
  };

  const finishSet = () => {
    const updatedSets = [...exercise.sets];
    updatedSets[currentSetIndex] = {
      ...updatedSets[currentSetIndex],
      weight: weightInput,
      reps: repsInput,
      completed: true,
    };
    
    setExercise({ ...exercise, sets: updatedSets });
    setRestSeconds(exercise.protocol.restSeconds);
    setIsResting(true);

    if (currentSetIndex < exercise.sets.length - 1) {
      setTimeout(() => {
        setCurrentSetIndex(prev => prev + 1);
      }, 400);
    }
  };

  return (
    <>
      <style>{cylinderAreaStyle}</style>
      <div className="h-screen w-full bg-zinc-950 flex flex-col relative overflow-y-auto">
      
      {/* Header */}
      <header className="flex-none pt-2 px-4 pb-1 flex items-center justify-between z-40 bg-zinc-950/80 backdrop-blur-md sticky top-0">
        <button 
          onClick={() => navigate('/training')}
          className="p-2 -ml-2 text-zinc-500 hover:text-white transition-colors"
        >
          <ChevronLeft size={28} />
        </button>
        <div className="flex flex-col items-center">
          <h1 className="text-base font-black text-white uppercase tracking-tighter italic leading-none">{exercise.name}</h1>
          <span className="text-[9px] text-violet-400 font-black tracking-widest uppercase mt-0.5">SÉANCE EN COURS</span>
        </div>
        <button className="p-2 -mr-2 text-zinc-500 hover:text-white transition-colors">
          <Settings size={22} />
        </button>
      </header>

      {/* Top Section: Video & Actions */}
      <div className="flex-none flex flex-col z-30 relative px-4 pt-1 space-y-1.5">
        
        {/* Large Video Card */}
        <div className="relative w-full aspect-[16/8] rounded-xl overflow-hidden bg-zinc-900 border border-white/5 shadow-xl group">
            <img src={exercise.videoUrl} className="w-full h-full object-cover opacity-50 group-hover:opacity-40 transition-opacity" />
            <div className="absolute inset-0 flex items-center justify-center">
                <PlayCircle size={48} className="text-violet-400/60 group-hover:text-violet-400 transition-colors cursor-pointer" />
            </div>
            
            {/* Badges Overlay */}
            <div className="absolute bottom-3 left-3 flex items-center gap-2">
                 <span className="bg-black/60 px-3 py-1.5 rounded-lg backdrop-blur-md border border-white/10 flex items-center gap-2 text-[10px] font-black font-mono text-zinc-300 uppercase tracking-widest">
                    <Dumbbell size={12} className="text-violet-400" /> {exercise.protocol.targetReps}
                 </span>
            </div>
            <div className="absolute bottom-3 right-3 flex items-center gap-2">
                 <span className="bg-black/60 px-3 py-1.5 rounded-lg backdrop-blur-md border border-white/10 flex items-center gap-2 text-[10px] font-black font-mono text-zinc-300 uppercase tracking-widest">
                    <History size={12} className="text-violet-400" /> {exercise.protocol.tempo}
                 </span>
            </div>
        </div>

        {/* Action Bar (Linked to Active Set) */}
        <div className="grid grid-cols-4 gap-1.5">
             <button 
                onClick={() => handleAction('timer')}
                className="flex flex-col items-center justify-center gap-0.5 bg-zinc-900 hover:bg-zinc-800 p-1 rounded-lg border border-zinc-800 transition-all active:scale-95 group"
             >
                <Timer size={16} className="text-zinc-500 group-hover:text-violet-400 transition-colors" />
                <span className="text-[8px] font-bold text-zinc-500 uppercase tracking-wider">Chrono</span>
             </button>
             <button 
                onClick={() => handleAction('video')}
                className="flex flex-col items-center justify-center gap-0.5 bg-zinc-900 hover:bg-zinc-800 p-1 rounded-lg border border-zinc-800 transition-all active:scale-95 group"
             >
                <Camera size={16} className="text-zinc-500 group-hover:text-violet-400 transition-colors" />
                <span className="text-[8px] font-bold text-zinc-500 uppercase tracking-wider">Rec</span>
             </button>
             <button 
                onClick={() => handleAction('notes')}
                className="flex flex-col items-center justify-center gap-0.5 bg-zinc-900 hover:bg-zinc-800 p-1 rounded-lg border border-zinc-800 transition-all active:scale-95 group"
             >
                <NotebookPen size={16} className="text-zinc-500 group-hover:text-violet-400 transition-colors" />
                <span className="text-[8px] font-bold text-zinc-500 uppercase tracking-wider">Notes</span>
             </button>
             <button 
                onClick={() => setShowIntensityModal(true)}
                className="flex flex-col items-center justify-center gap-0.5 bg-zinc-900/80 hover:bg-orange-500/10 p-1 rounded-lg border border-orange-500/30 transition-all active:scale-95 group"
             >
                <Zap size={16} className="text-orange-400 group-hover:text-orange-300 transition-colors" />
                <span className="text-[8px] font-black text-orange-400 uppercase tracking-wider group-hover:text-orange-300 transition-colors leading-none">Drop Set</span>
             </button>
        </div>

      </div>

      {/* Cylinder Area (Responsive height with calc) */}
      <div className="cylinder-area relative -mt-1 z-10 overflow-hidden">
          <SetWheel 
              sets={exercise.sets}
              selectedIndex={currentSetIndex}
              onSelect={setCurrentSetIndex}
              onWeightClick={() => setShowWeightModal(true)}
              onRepsClick={() => setShowRepsModal(true)}
            />
      </div>

      {/* Control Station */}
      <footer className="flex-none bg-zinc-950/90 backdrop-blur-xl border-t border-zinc-800/50 pt-3 pb-4 px-4 z-50 shadow-[0_-20px_50px_rgba(0,0,0,0.8)] rounded-t-[20px]">
        <button 
          onClick={finishSet}
          className="w-full h-12 bg-violet-600 hover:bg-violet-700 text-white font-black text-base rounded-xl flex items-center justify-center gap-2 shadow-[0_10px_40px_rgba(109,93,211,0.25)] transition-all active:translate-y-1 active:shadow-none uppercase tracking-tighter italic"
        >
          <div className="bg-black/10 p-1 rounded-lg">
             <Check size={20} strokeWidth={4} />
          </div>
          LOG SET {currentSetIndex + 1}
        </button>
      </footer>

      <RestTimer 
        secondsRemaining={restSeconds} 
        onSkip={() => { setIsResting(false); setRestSeconds(0); }}
        onAdd={() => setRestSeconds(prev => prev + 30)}
      />

      {/* Modal Poids */}
      {showWeightModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm" style={{ margin: 0 }}>
          <div className="bg-zinc-900 border border-violet-600/30 rounded-3xl p-6 max-w-sm w-[85%] shadow-2xl animate-scale-in">
            <h3 className="text-lg font-black text-white uppercase tracking-wide text-center mb-4">Poids (KG)</h3>
            
            <NumberPicker
              value={weightInput}
              onChange={(val) => {
                setWeightInput(val);
                updateCurrentSetData(val, repsInput);
              }}
              min={0}
              max={200}
              step={2.5}
              label=""
            />
            
            <button
              onClick={() => setShowWeightModal(false)}
              className="w-full mt-6 py-3 px-6 bg-violet-600 hover:bg-violet-700 text-white font-black text-sm uppercase tracking-wider rounded-xl transition-colors active:scale-95 shadow-lg"
            >
              Valider
            </button>
          </div>
        </div>
      )}

      {/* Modal Reps */}
      {showRepsModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm" style={{ margin: 0 }}>
          <div className="bg-zinc-900 border border-violet-600/30 rounded-3xl p-6 max-w-sm w-[85%] shadow-2xl animate-scale-in">
            <h3 className="text-lg font-black text-white uppercase tracking-wide text-center mb-4">Répétitions</h3>
            
            <NumberPicker
              value={repsInput}
              onChange={(val) => {
                setRepsInput(val);
                updateCurrentSetData(weightInput, val);
              }}
              min={1}
              max={50}
              step={1}
              label=""
            />
            
            <button
              onClick={() => setShowRepsModal(false)}
              className="w-full mt-6 py-3 px-6 bg-violet-600 hover:bg-violet-700 text-white font-black text-sm uppercase tracking-wider rounded-xl transition-colors active:scale-95 shadow-lg"
            >
              Valider
            </button>
          </div>
        </div>
      )}

      {/* Modal Technique d'Intensification */}
      {showIntensityModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm" style={{ margin: 0 }}>
          <div className="bg-zinc-900 border border-orange-500/30 rounded-3xl p-6 max-w-md w-[90%] shadow-2xl animate-scale-in">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 rounded-xl bg-orange-500/10 border border-orange-500/20">
                <Zap size={24} className="text-orange-400" />
              </div>
              <h3 className="text-xl font-black text-white uppercase tracking-wide">Drop Set</h3>
            </div>
            
            <p className="text-sm text-zinc-300 leading-relaxed mb-4">
              Réduisez la charge de 20% après l'échec et continuez immédiatement jusqu'à l'échec musculaire.
            </p>
            
            <div className="bg-zinc-800/50 rounded-xl p-3 mb-5 border border-zinc-700/50">
              <span className="text-xs font-bold text-zinc-500 uppercase tracking-wider block mb-1">Application</span>
              <span className="text-sm font-black text-orange-400">Séries 4, 5</span>
            </div>
            
            <button
              onClick={() => setShowIntensityModal(false)}
              className="w-full py-3 px-6 bg-orange-500 hover:bg-orange-600 text-white font-black text-sm uppercase tracking-wider rounded-xl transition-colors active:scale-95 shadow-lg"
            >
              Compris ! 💪
            </button>
          </div>
        </div>
      )}

      <style>{`
        @keyframes scale-in {
          from {
            transform: scale(0.9);
            opacity: 0;
          }
          to {
            transform: scale(1);
            opacity: 1;
          }
        }
        .animate-scale-in {
          animation: scale-in 0.25s cubic-bezier(0.16, 1, 0.3, 1);
        }
      `}</style>

    </div>
    </>
  );
};

export default IronTrack;
