import React, { useState, useEffect, useRef } from 'react';
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
import SetList from '../components/irontrack/SetList';
import RestTimer from '../components/irontrack/RestTimer';
import NumberPicker from '../components/irontrack/NumberPicker';
import NotesModal from '../components/irontrack/NotesModal';
import VideoModal from '../components/irontrack/VideoModal';
import { Exercise, ExerciseSet, DropSet } from '../components/irontrack/irontrack-types';

import { useIntensityTechnique } from '../contexts/IntensityTechniqueContext';

// Type pour les items de la liste
type ListItem = 
  | { type: 'set'; setIndex: number; set: ExerciseSet }
  | { type: 'drop'; setIndex: number; dropIndex: number; drop: DropSet };

// Fonction pour construire la liste aplatie d'items
const buildFlatItems = (sets: ExerciseSet[], showDrops: boolean): ListItem[] => {
  const items: ListItem[] = [];
  
  sets.forEach((set, setIndex) => {
    items.push({ type: 'set', setIndex, set });
    
    if (showDrops && set.drops && set.drops.length > 0) {
      set.drops.forEach((drop, dropIndex) => {
        items.push({ type: 'drop', setIndex, dropIndex, drop });
      });
    }
  });
  
  return items;
};

// Hauteur de la zone de liste (responsive)
const listAreaStyle = `
  .list-area {
    height: calc(100vh - 480px);
    min-height: 250px;
  }
  
  @media (min-width: 768px) {
    .list-area {
      height: calc(100vh - 350px);
      min-height: 400px;
    }
  }
`;

// Mock exercise data
const MOCK_EXERCISE_STANDARD: Exercise = {
  name: "Développé Couché",
  videoUrl: "https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=800&h=600&fit=crop",
  protocol: {
    targetSets: 5,
    targetReps: "8-12 reps",
    tempo: "3-0-1-0",
    restSeconds: 90
  },
  sets: [
    { id: 1, setNumber: 1, type: 'WORKING' as any, weight: 80, reps: 12, completed: false },
    { id: 2, setNumber: 2, type: 'WORKING' as any, weight: 82.5, reps: 10, previousBest: "80kg × 10", completed: false },
    { id: 3, setNumber: 3, type: 'WORKING' as any, weight: 82.5, reps: 10, previousBest: "80kg × 10", completed: false },
    { id: 4, setNumber: 4, type: 'WORKING' as any, weight: 80, reps: 12, completed: false },
    { id: 5, setNumber: 5, type: 'WORKING' as any, weight: 77.5, reps: 12, previousBest: "75kg × 12", completed: false },
  ]
};

const MOCK_EXERCISE_DROPSET: Exercise = {
  name: "Développé Couché",
  videoUrl: "https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=800&h=600&fit=crop",
  protocol: {
    targetSets: 5,
    targetReps: "8-12 reps",
    tempo: "3-0-1-0",
    restSeconds: 90
  },
  sets: [
    { id: 1, setNumber: 1, type: 'WORKING' as any, weight: 80, reps: 12, completed: false },
    { 
      id: 2, 
      setNumber: 2, 
      type: 'WORKING' as any, 
      weight: 82.5, 
      reps: 10, 
      previousBest: "80kg × 10", 
      completed: false,
      drops: [
        { weight: 62.5, reps: 8, completed: false },
        { weight: 42.5, reps: 'échec', completed: false }
      ]
    },
    { id: 3, setNumber: 3, type: 'WORKING' as any, weight: 82.5, reps: 10, previousBest: "80kg × 10", completed: false },
    { 
      id: 4, 
      setNumber: 4, 
      type: 'WORKING' as any, 
      weight: 80, 
      reps: 12, 
      completed: false,
      drops: [
        { weight: 60, reps: 10, completed: false }
      ]
    },
    { id: 5, setNumber: 5, type: 'WORKING' as any, weight: 77.5, reps: 12, previousBest: "75kg × 12", completed: false },
  ]
};

const IronTrack: React.FC = () => {
  const navigate = useNavigate();
  const { currentTechnique } = useIntensityTechnique();
  
  // Initialiser exercise avec les bonnes données dès le premier render
  const [exercise, setExercise] = useState<Exercise>(() => {
    const savedTechnique = localStorage.getItem('virtus-intensity-technique');
    return savedTechnique === 'DROP_SET' ? MOCK_EXERCISE_DROPSET : MOCK_EXERCISE_STANDARD;
  });
  
  const [currentSetIndex, setCurrentSetIndex] = useState<number>(2);
  const [currentItemIndex, setCurrentItemIndex] = useState<number>(2); // Index dans flatItems
  const scrollToIndexRef = useRef<((index: number) => void) | null>(null);
  
  // Charger les données appropriées selon la technique
  useEffect(() => {
    if (currentTechnique === 'DROP_SET') {
      setExercise(MOCK_EXERCISE_DROPSET);
    } else {
      setExercise(MOCK_EXERCISE_STANDARD);
    }
  }, [currentTechnique]); 
  
  const [weightInput, setWeightInput] = useState<number>(MOCK_EXERCISE_STANDARD.sets[2].weight);
  const [repsInput, setRepsInput] = useState<number>(MOCK_EXERCISE_STANDARD.sets[2].reps || 10);
  
  // États pour l'édition des drops
  const [editingDrop, setEditingDrop] = useState<{ setIndex: number; dropIndex: number } | null>(null);
  const [dropWeightInput, setDropWeightInput] = useState<number>(0);
  const [dropRepsInput, setDropRepsInput] = useState<number | 'échec'>(0);
  const [showDropWeightModal, setShowDropWeightModal] = useState(false);
  const [showDropRepsModal, setShowDropRepsModal] = useState(false);
  
  const [isResting, setIsResting] = useState(false);
  const [restSeconds, setRestSeconds] = useState(0);
  const [showIntensityModal, setShowIntensityModal] = useState(false);
  const [showWeightModal, setShowWeightModal] = useState(false);
  const [showRepsModal, setShowRepsModal] = useState(false);
  const [isLocked, setIsLocked] = useState(false);
  const [isPredataModified, setIsPredataModified] = useState(false);
  const [isValidating, setIsValidating] = useState(false);
  
  // États pour les modales Notes et Vidéo
  const [showNotesModal, setShowNotesModal] = useState(false);
  const [showVideoModal, setShowVideoModal] = useState(false);
  const [setNotes, setSetNotes] = useState<Record<number, string>>({});
  const [setVideos, setSetVideos] = useState<Record<number, File>>({});

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
            
            // Play sound when rest ends
            const audio = new Audio('/beep.mp3');
            audio.play().catch(() => {});
            
            // Vibrate when rest ends
            if ('vibrate' in navigator) {
              navigator.vibrate([200, 100, 200]);
            }
            
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
    const currentSet = updatedSets[currentSetIndex];
    
    // Récupérer les valeurs originales depuis le bon dataset
    const originalData = currentTechnique === 'DROP_SET' ? MOCK_EXERCISE_DROPSET : MOCK_EXERCISE_STANDARD;
    const originalWeight = originalData.sets[currentSetIndex].weight;
    const originalReps = originalData.sets[currentSetIndex].reps;
    
    updatedSets[currentSetIndex] = {
      ...currentSet,
      weight: w,
      reps: r,
    };
    setExercise({ ...exercise, sets: updatedSets });
    
    // Marquer comme modifié si différent des valeurs originales
    setIsPredataModified(w !== originalWeight || r !== originalReps);
  }

  const handleAction = (type: 'timer' | 'video' | 'notes') => {
      console.log(`Action triggered for set ${currentSetIndex + 1}: ${type}`);
      if (type === 'timer') {
          setIsResting(true);
          setRestSeconds(exercise.protocol.restSeconds);
      } else if (type === 'video') {
          setShowVideoModal(true);
      } else if (type === 'notes') {
          setShowNotesModal(true);
      }
  };

  // Handlers pour les modales
  const handleSaveNote = (note: string) => {
    setSetNotes(prev => ({
      ...prev,
      [currentSetIndex]: note
    }));
    console.log(`Note saved for set ${currentSetIndex + 1}:`, note);
  };

  const handleVideoSelected = (videoFile: File) => {
    setSetVideos(prev => ({
      ...prev,
      [currentSetIndex]: videoFile
    }));
    console.log(`Video selected for set ${currentSetIndex + 1}:`, videoFile.name);
  };

  // Handlers pour l'édition des drops
  const handleDropWeightClick = (setIndex: number, dropIndex: number) => {
    if (isLocked) return;
    const drop = exercise.sets[setIndex].drops?.[dropIndex];
    if (drop) {
      setEditingDrop({ setIndex, dropIndex });
      setDropWeightInput(drop.weight);
      setShowDropWeightModal(true);
    }
  };

  const handleDropRepsClick = (setIndex: number, dropIndex: number) => {
    if (isLocked) return;
    const drop = exercise.sets[setIndex].drops?.[dropIndex];
    if (drop) {
      setEditingDrop({ setIndex, dropIndex });
      setDropRepsInput(drop.reps);
      setShowDropRepsModal(true);
    }
  };

  const handleAdjustDropWeight = (amount: number) => {
    setDropWeightInput(prev => Math.max(0, prev + amount));
  };

  const handleAdjustDropReps = (amount: number) => {
    if (dropRepsInput === 'échec') {
      setDropRepsInput(amount > 0 ? 1 : 'échec');
    } else {
      setDropRepsInput(prev => {
        const newVal = (prev as number) + amount;
        return newVal < 0 ? 'échec' : newVal;
      });
    }
  };

  const handleValidateDropWeight = () => {
    if (!editingDrop) return;
    const updatedSets = [...exercise.sets];
    const drops = updatedSets[editingDrop.setIndex].drops;
    if (drops && drops[editingDrop.dropIndex]) {
      drops[editingDrop.dropIndex] = {
        ...drops[editingDrop.dropIndex],
        weight: dropWeightInput
      };
      setExercise({ ...exercise, sets: updatedSets });
    }
    setShowDropWeightModal(false);
    setEditingDrop(null);
  };

  const handleValidateDropReps = () => {
    if (!editingDrop) return;
    const updatedSets = [...exercise.sets];
    const drops = updatedSets[editingDrop.setIndex].drops;
    if (drops && drops[editingDrop.dropIndex]) {
      drops[editingDrop.dropIndex] = {
        ...drops[editingDrop.dropIndex],
        reps: dropRepsInput
      };
      setExercise({ ...exercise, sets: updatedSets });
    }
    setShowDropRepsModal(false);
    setEditingDrop(null);
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
    
    // Trigger validation animation (flash vert)
    setIsValidating(true);
    setTimeout(() => setIsValidating(false), 600);
    
    // Vibrate on validation
    if ('vibrate' in navigator) {
      navigator.vibrate(50);
    }
    
    setRestSeconds(exercise.protocol.restSeconds);
    setIsResting(true);
    setIsPredataModified(false);
    setIsLocked(false);

    if (currentSetIndex < exercise.sets.length - 1) {
      setTimeout(() => {
        const nextSetIndex = currentSetIndex + 1;
        setCurrentSetIndex(nextSetIndex);
        
        // Calculer le nouvel itemIndex et scroller
        const flatItems = buildFlatItems(exercise.sets, currentTechnique === 'DROP_SET');
        const nextItemIndex = flatItems.findIndex(item => 
          item.type === 'set' && item.setIndex === nextSetIndex
        );
        
        if (nextItemIndex !== -1) {
          setCurrentItemIndex(nextItemIndex);
          
          // Scroller vers la série suivante
          if (scrollToIndexRef.current) {
            setTimeout(() => {
              scrollToIndexRef.current!(nextItemIndex);
            }, 100);
          }
        }
      }, 400);
    }
  };

  return (
    <>
      <style>{listAreaStyle}</style>
      <div className="h-screen w-full bg-white dark:bg-zinc-950 flex flex-col relative overflow-y-auto">
      
      {/* Header */}
      <header className="flex-none pt-2 px-4 pb-1 flex items-center justify-between z-40 bg-zinc-100/80 dark:bg-zinc-950/80 backdrop-blur-md sticky top-0">
        <button 
          onClick={() => navigate('/training')}
          className="p-2 -ml-2 text-zinc-400 dark:text-zinc-500 hover:text-zinc-900 dark:hover:text-white transition-colors"
        >
          <ChevronLeft size={28} />
        </button>
        <div className="flex flex-col items-center">
          <h1 className="text-base font-black text-zinc-900 dark:text-white uppercase tracking-tighter italic leading-none">{exercise.name}</h1>
          <span className="text-[9px] text-violet-400 font-black tracking-widest uppercase mt-0.5">SÉANCE EN COURS</span>
        </div>
        <button 
          onClick={() => navigate('/irontrack/settings')}
          className="p-2 -mr-2 text-zinc-400 dark:text-zinc-500 hover:text-zinc-900 dark:hover:text-white transition-colors active:scale-95"
        >
          <Settings size={22} />
        </button>
      </header>

      {/* Top Section: Video & Actions */}
      <div className="flex-none flex flex-col z-30 relative px-4 pt-1 space-y-1.5">
        
        {/* Large Video Card */}
        <div className="relative w-full aspect-[16/8] rounded-xl overflow-hidden bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-white/5 shadow-xl group">
            <img src={exercise.videoUrl} className="w-full h-full object-cover opacity-50 group-hover:opacity-40 transition-opacity" />
            <div className="absolute inset-0 flex items-center justify-center">
                <PlayCircle size={48} className="text-violet-400/60 group-hover:text-violet-400 transition-colors cursor-pointer" />
            </div>
            
            {/* Badges Overlay */}
            <div className="absolute bottom-3 left-3 flex items-center gap-2">
                 <span className="bg-zinc-800/60 dark:bg-black/60 px-3 py-1.5 rounded-lg backdrop-blur-md border border-zinc-300 dark:border-white/10 flex items-center gap-2 text-[10px] font-black font-mono text-zinc-700 dark:text-zinc-300 uppercase tracking-widest">
                    <Dumbbell size={12} className="text-violet-400" /> {exercise.protocol.targetReps}
                 </span>
            </div>
            <div className="absolute bottom-3 right-3 flex items-center gap-2">
                 <span className="bg-zinc-800/60 dark:bg-black/60 px-3 py-1.5 rounded-lg backdrop-blur-md border border-zinc-300 dark:border-white/10 flex items-center gap-2 text-[10px] font-black font-mono text-zinc-700 dark:text-zinc-300 uppercase tracking-widest">
                    <History size={12} className="text-violet-400" /> {exercise.protocol.tempo}
                 </span>
            </div>
        </div>

        {/* Action Bar (Linked to Active Set) */}
        <div className={`grid ${currentTechnique === 'DROP_SET' ? 'grid-cols-4' : 'grid-cols-3'} gap-1.5`}>
             <button 
                onClick={() => handleAction('timer')}
                className="flex flex-col items-center justify-center gap-0.5 bg-zinc-100 dark:bg-zinc-900 hover:bg-zinc-200 dark:hover:bg-zinc-800 p-1 rounded-lg border border-zinc-200 dark:border-zinc-800 transition-all active:scale-95 group"
             >
                <Timer size={16} className="text-zinc-500 group-hover:text-violet-400 transition-colors" />
                <span className="text-[8px] font-bold text-zinc-600 dark:text-zinc-500 uppercase tracking-wider">Chrono</span>
             </button>
             <button 
                onClick={() => handleAction('video')}
                className="flex flex-col items-center justify-center gap-0.5 bg-zinc-100 dark:bg-zinc-900 hover:bg-zinc-200 dark:hover:bg-zinc-800 p-1 rounded-lg border border-zinc-200 dark:border-zinc-800 transition-all active:scale-95 group relative"
             >
                <Camera size={16} className="text-zinc-500 group-hover:text-violet-400 transition-colors" />
                <span className="text-[8px] font-bold text-zinc-600 dark:text-zinc-500 uppercase tracking-wider">Rec</span>
                {setVideos[currentSetIndex] && (
                  <div className="absolute -top-1 -right-1 w-2 h-2 bg-violet-500 rounded-full" />
                )}
             </button>
             <button 
                onClick={() => handleAction('notes')}
                className="flex flex-col items-center justify-center gap-0.5 bg-zinc-100 dark:bg-zinc-900 hover:bg-zinc-200 dark:hover:bg-zinc-800 p-1 rounded-lg border border-zinc-200 dark:border-zinc-800 transition-all active:scale-95 group relative"
             >
                <NotebookPen size={16} className="text-zinc-500 group-hover:text-violet-400 transition-colors" />
                <span className="text-[8px] font-bold text-zinc-600 dark:text-zinc-500 uppercase tracking-wider">Notes</span>
                {setNotes[currentSetIndex] && (
                  <div className="absolute -top-1 -right-1 w-2 h-2 bg-violet-500 rounded-full" />
                )}
             </button>
             {currentTechnique === 'DROP_SET' && (
               <button 
                  onClick={() => setShowIntensityModal(true)}
                  className="flex flex-col items-center justify-center gap-0.5 bg-orange-100 dark:bg-zinc-900/80 hover:bg-orange-200 dark:hover:bg-orange-500/10 p-1 rounded-lg border border-orange-300 dark:border-orange-500/30 transition-all active:scale-95 group"
               >
                  <Zap size={16} className="text-orange-400 group-hover:text-orange-300 transition-colors" />
                  <span className="text-[8px] font-black text-orange-400 uppercase tracking-wider group-hover:text-orange-300 transition-colors leading-none">Drop Set</span>
               </button>
             )}
        </div>

      </div>

      {/* Liste des séries (Responsive height) */}
      <div className="list-area relative -mt-1 z-10 overflow-hidden">
          {/* Lock badge overlay */}
          {isLocked && (
             <div className="absolute top-4 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 bg-zinc-100/90 dark:bg-zinc-900/90 backdrop-blur-md border border-zinc-300 dark:border-zinc-700/50 rounded-full px-4 py-2 shadow-lg">
              <svg className="w-4 h-4 text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
              <span className="text-xs font-black text-orange-400 uppercase tracking-wider">Série verrouillée</span>
              <button
                onClick={() => setIsLocked(false)}
                className="ml-2 p-1 rounded-full bg-zinc-200 dark:bg-zinc-800 hover:bg-zinc-300 dark:hover:bg-zinc-700 transition-colors active:scale-95"
                aria-label="Déverrouiller"
              >
                <svg className="w-3.5 h-3.5 text-zinc-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 11V7a4 4 0 118 0m-4 8v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2z" />
                </svg>
              </button>
            </div>
          )}
          <SetList 
              sets={exercise.sets}
              selectedIndex={currentItemIndex}
              onSelect={(itemIndex) => {
                // Mettre à jour l'item sélectionné
                setCurrentItemIndex(itemIndex);
                
                // Mettre à jour currentSetIndex pour la logique métier
                const flatItems = buildFlatItems(exercise.sets, currentTechnique === 'DROP_SET');
                const item = flatItems[itemIndex];
                if (item) {
                  setCurrentSetIndex(item.setIndex);
                }
              }}
              onWeightClick={() => !isLocked && setShowWeightModal(true)}
              onRepsClick={() => !isLocked && setShowRepsModal(true)}
              onDropWeightClick={handleDropWeightClick}
              onDropRepsClick={handleDropRepsClick}
              isLocked={isLocked}
              onLockToggle={() => setIsLocked(!isLocked)}
              isPredataModified={isPredataModified}
              showDrops={currentTechnique === 'DROP_SET'}
              scrollToIndex={(fn) => { scrollToIndexRef.current = fn; }}
            />
      </div>

      {/* Control Station */}
      <footer className="flex-none bg-zinc-100/90 dark:bg-zinc-950/90 backdrop-blur-xl border-t border-zinc-200 dark:border-zinc-800/50 pt-3 pb-4 px-4 z-50 shadow-[0_-20px_50px_rgba(0,0,0,0.2)] dark:shadow-[0_-20px_50px_rgba(0,0,0,0.8)] rounded-t-[20px]">
        <button 
          onClick={finishSet}
          className={`w-full h-12 text-white dark:text-white font-black text-base rounded-xl flex items-center justify-center gap-2 transition-all uppercase tracking-tighter italic ${
            isValidating 
              ? 'bg-green-500 scale-105 shadow-[0_10px_60px_rgba(34,197,94,0.5)]' 
              : 'bg-violet-600 hover:bg-violet-700 shadow-[0_10px_40px_rgba(109,93,211,0.25)] active:translate-y-1 active:shadow-none'
          }`}
        >
          <div className="bg-black/10 p-1 rounded-lg">
             <Check size={20} strokeWidth={4} />
          </div>
          <span>LOG SET {currentSetIndex + 1}</span>
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
          <div className="bg-zinc-900 border border-violet-600/30 rounded-3xl p-6 max-w-sm w-[85%] shadow-2xl animate-scale-in relative">
            {/* Bouton fermeture */}
            <button
              onClick={() => setShowWeightModal(false)}
              className="absolute top-4 right-4 p-2 rounded-full hover:bg-zinc-800 transition-colors active:scale-95"
              aria-label="Fermer"
            >
              <svg className="w-5 h-5 text-zinc-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            
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
          <div className="bg-zinc-900 border border-violet-600/30 rounded-3xl p-6 max-w-sm w-[85%] shadow-2xl animate-scale-in relative">
            {/* Bouton fermeture */}
            <button
              onClick={() => setShowRepsModal(false)}
              className="absolute top-4 right-4 p-2 rounded-full hover:bg-zinc-800 transition-colors active:scale-95"
              aria-label="Fermer"
            >
              <svg className="w-5 h-5 text-zinc-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            
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

      {/* Modal Poids Drop */}
      {showDropWeightModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm" style={{ margin: 0 }}>
          <div className="bg-zinc-900 border border-orange-600/30 rounded-3xl p-6 max-w-sm w-[85%] shadow-2xl animate-scale-in">
            <h3 className="text-lg font-black text-white uppercase tracking-wide text-center mb-4">Poids Drop (KG)</h3>
            
            <NumberPicker
              value={dropWeightInput}
              onChange={setDropWeightInput}
              min={0}
              max={200}
              step={2.5}
              label=""
            />
            
            <button
              onClick={handleValidateDropWeight}
              className="w-full mt-6 py-3 px-6 bg-orange-600 hover:bg-orange-700 text-white font-black text-sm uppercase tracking-wider rounded-xl transition-colors active:scale-95 shadow-lg"
            >
              Valider
            </button>
          </div>
        </div>
      )}

      {/* Modal Reps Drop */}
      {showDropRepsModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm" style={{ margin: 0 }}>
          <div className="bg-zinc-900 border border-orange-600/30 rounded-3xl p-6 max-w-sm w-[85%] shadow-2xl animate-scale-in">
            <h3 className="text-lg font-black text-white uppercase tracking-wide text-center mb-4">Répétitions Drop</h3>
            
            {dropRepsInput === 'échec' ? (
              <div className="text-center py-8">
                <div className="text-6xl font-black text-orange-400 mb-2">∞</div>
                <div className="text-sm text-zinc-400 uppercase tracking-wider">Jusqu'à l'échec</div>
              </div>
            ) : (
              <NumberPicker
                value={dropRepsInput as number}
                onChange={setDropRepsInput}
                min={1}
                max={50}
                step={1}
                label=""
              />
            )}
            
            <div className="flex gap-2 mt-6">
              <button
                onClick={() => setDropRepsInput('échec')}
                className={`flex-1 py-3 px-4 font-black text-sm uppercase tracking-wider rounded-xl transition-colors active:scale-95 ${
                  dropRepsInput === 'échec'
                    ? 'bg-orange-600 text-white'
                    : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'
                }`}
              >
                Échec ∞
              </button>
              <button
                onClick={handleValidateDropReps}
                className="flex-1 py-3 px-6 bg-orange-600 hover:bg-orange-700 text-white font-black text-sm uppercase tracking-wider rounded-xl transition-colors active:scale-95 shadow-lg"
              >
                Valider
              </button>
            </div>
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

    {/* Modales */}
    <NotesModal
      isOpen={showNotesModal}
      onClose={() => setShowNotesModal(false)}
      setNumber={currentSetIndex + 1}
      initialNote={setNotes[currentSetIndex] || ''}
      onSave={handleSaveNote}
    />

    <VideoModal
      isOpen={showVideoModal}
      onClose={() => setShowVideoModal(false)}
      setNumber={currentSetIndex + 1}
      onVideoSelected={handleVideoSelected}
    />
    </>
  );
};

export default IronTrack;
