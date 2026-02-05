import React, { useState, useEffect, useRef } from 'react';
import { X, Volume2, VolumeX } from 'lucide-react';
import WaveAnimation from './WaveAnimation';

interface MetronomeModalProps {
  tempo: string; // Format: "3-0-1-0"
  targetReps: string; // Format: "8-12 reps" ou "10 reps"
  exerciseName: string;
  onClose: () => void;
}

const MetronomeModal: React.FC<MetronomeModalProps> = ({
  tempo,
  targetReps,
  exerciseName,
  onClose
}) => {
  const [countdown, setCountdown] = useState<number>(5);
  const [customCountdown, setCustomCountdown] = useState<string>('');
  const [repsCount, setRepsCount] = useState<number>(10);
  const [customReps, setCustomReps] = useState<string>('');
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const [isStarted, setIsStarted] = useState<boolean>(false);
  const [currentPhase, setCurrentPhase] = useState<'countdown' | 'running' | 'finished'>('countdown');
  const [countdownRemaining, setCountdownRemaining] = useState<number>(0);
  const [currentRep, setCurrentRep] = useState<number>(1);
  const [repPhase, setRepPhase] = useState<'eccentric' | 'bottom' | 'concentric' | 'top'>('top');
  const [phaseTimeRemaining, setPhaseTimeRemaining] = useState<number>(0);
  const audioContextRef = useRef<AudioContext | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Parser le targetReps pour déterminer si c'est un nombre fixe ou une gamme
  const parseTargetReps = (reps: string): { isRange: boolean; min?: number; max?: number; fixed?: number } => {
    const match = reps.match(/(\d+)(?:-(\d+))?/);
    if (!match) return { isRange: false, fixed: 10 };
    
    if (match[2]) {
      // C'est une gamme (ex: "8-12")
      return { isRange: true, min: parseInt(match[1]), max: parseInt(match[2]) };
    } else {
      // C'est un nombre fixe (ex: "10")
      return { isRange: false, fixed: parseInt(match[1]) };
    }
  };

  const repsInfo = parseTargetReps(targetReps);

  // Initialiser repsCount avec la valeur appropriée
  useEffect(() => {
    if (!repsInfo.isRange && repsInfo.fixed) {
      setRepsCount(repsInfo.fixed);
    } else if (repsInfo.isRange && repsInfo.min && repsInfo.max) {
      // Prendre le milieu de la gamme
      setRepsCount(Math.floor((repsInfo.min + repsInfo.max) / 2));
    }
  }, [targetReps]);

  // Parser le tempo
  const parseTempo = (tempoStr: string): { eccentric: number; bottom: number; concentric: number; top: number } => {
    const parts = tempoStr.split('-').map(Number);
    return {
      eccentric: parts[0] || 0,
      bottom: parts[1] || 0,
      concentric: parts[2] || 0,
      top: parts[3] || 0
    };
  };

  const tempoPhases = parseTempo(tempo);

  // Fonction pour jouer un bip
  const playBeep = (frequency: number = 800, duration: number = 100) => {
    if (!soundEnabled) return;
    
    try {
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      }
      
      const ctx = audioContextRef.current;
      const oscillator = ctx.createOscillator();
      const gainNode = ctx.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(ctx.destination);
      
      oscillator.frequency.value = frequency;
      oscillator.type = 'sine';
      
      gainNode.gain.setValueAtTime(0.3, ctx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + duration / 1000);
      
      oscillator.start(ctx.currentTime);
      oscillator.stop(ctx.currentTime + duration / 1000);
    } catch (error) {
      console.error('Error playing beep:', error);
    }
  };

  const handleStart = () => {
    setIsStarted(true);
    setCurrentPhase('countdown');
    setCountdownRemaining(countdown);
  };

  const handleComplete = () => {
    setCurrentPhase('finished');
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
    // Fermer automatiquement après 1 seconde
    setTimeout(() => {
      onClose();
    }, 1000);
  };

  // Logique du compte à rebours et de l'animation
  useEffect(() => {
    if (!isStarted) return;

    if (currentPhase === 'countdown') {
      if (countdownRemaining > 0) {
        playBeep(600, 100);
        const timer = setTimeout(() => {
          setCountdownRemaining(prev => prev - 1);
        }, 1000);
        return () => clearTimeout(timer);
      } else {
        // Démarrer l'animation
        setCurrentPhase('running');
        setCurrentRep(1);
        setRepPhase('top');
        setPhaseTimeRemaining(tempoPhases.top);
        playBeep(1000, 200);
      }
    } else if (currentPhase === 'running') {
      // Timer pour décompter le temps de phase
      intervalRef.current = setInterval(() => {
        setPhaseTimeRemaining(prev => {
          if (prev <= 0.1) {
            // Passer à la phase suivante
            playBeep(800, 80);
            
            if (repPhase === 'top') {
              setRepPhase('eccentric');
              return tempoPhases.eccentric;
            } else if (repPhase === 'eccentric') {
              setRepPhase('bottom');
              return tempoPhases.bottom;
            } else if (repPhase === 'bottom') {
              setRepPhase('concentric');
              return tempoPhases.concentric;
            } else if (repPhase === 'concentric') {
              // Fin de la répétition
              if (currentRep >= repsCount) {
                // Fin de toutes les répétitions
                handleComplete();
                return 0;
              } else {
                // Répétition suivante
                setCurrentRep(prev => prev + 1);
                setRepPhase('top');
                return tempoPhases.top;
              }
            }
            return 0;
          }
          return prev - 0.1;
        });
      }, 100);

      return () => {
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
        }
      };
    }
  }, [isStarted, currentPhase, countdownRemaining, repPhase, currentRep, repsCount, tempoPhases, soundEnabled]);

  // Cleanup
  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
    };
  }, []);

  const handleCountdownSelect = (value: number) => {
    setCountdown(value);
    setCustomCountdown('');
  };

  const handleCustomCountdownChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setCustomCountdown(value);
    const num = parseInt(value);
    if (!isNaN(num) && num > 0) {
      setCountdown(num);
    }
  };

  const handleRepsSelect = (value: number) => {
    setRepsCount(value);
    setCustomReps('');
  };

  const handleCustomRepsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setCustomReps(value);
    const num = parseInt(value);
    if (!isNaN(num) && num > 0) {
      setRepsCount(num);
    }
  };

  if (isStarted) {
    return (
      <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/95 backdrop-blur-sm">
        <div className="relative w-full h-full max-w-4xl mx-auto flex flex-col items-center justify-center p-6">
          {/* Header */}
          <div className="absolute top-6 left-6 right-6 flex items-center justify-between z-10">
            <div>
              <h2 className="text-2xl font-black text-white uppercase tracking-tight">{exerciseName}</h2>
              <p className="text-sm text-violet-400 font-mono font-bold mt-1">Tempo: {tempo}</p>
            </div>
            <button
              onClick={onClose}
              className="p-3 rounded-full bg-zinc-900/80 hover:bg-zinc-800 border border-zinc-700 transition-colors active:scale-95"
              aria-label="Fermer"
            >
              <X size={24} className="text-zinc-400" />
            </button>
          </div>

          {/* Compte à rebours */}
          {currentPhase === 'countdown' && (
            <div className="flex flex-col items-center justify-center gap-6">
              <div className="text-8xl font-black text-violet-400 animate-pulse">
                {countdownRemaining}
              </div>
              <div className="text-xl text-zinc-400 font-bold uppercase tracking-wider">
                Préparez-vous...
              </div>
            </div>
          )}

          {/* Animation de la courbe */}
          {currentPhase === 'running' && (
            <WaveAnimation
              tempo={tempo}
              totalReps={repsCount}
              currentRep={currentRep}
              currentPhase={repPhase}
              phaseTimeRemaining={phaseTimeRemaining}
              onComplete={handleComplete}
            />
          )}

          {/* Message de fin */}
          {currentPhase === 'finished' && (
            <div className="flex flex-col items-center justify-center gap-6">
              <div className="text-6xl">🎉</div>
              <div className="text-3xl font-black text-green-400 uppercase tracking-tight">
                Série terminée !
              </div>
              <div className="text-lg text-zinc-400">
                {repsCount} répétitions complétées
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/90 backdrop-blur-sm p-4">
      <div className="bg-zinc-900 border border-violet-600/30 rounded-3xl p-6 max-w-md w-full shadow-2xl animate-scale-in relative">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-black text-white uppercase tracking-tight">Métronome</h2>
            <p className="text-sm text-zinc-400 font-medium mt-0.5">{exerciseName}</p>
            <p className="text-xs text-violet-400 font-mono font-bold mt-1">Tempo: {tempo}</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-zinc-800 transition-colors active:scale-95"
            aria-label="Fermer"
          >
            <X size={24} className="text-zinc-400" />
          </button>
        </div>

        {/* Compte à rebours */}
        <div className="mb-6">
          <label className="block text-sm font-bold text-zinc-300 mb-3 flex items-center gap-2">
            ⏱️ Compte à rebours avant départ
          </label>
          <div className="flex items-center gap-2 mb-2">
            {[5, 15, 30].map((value) => (
              <button
                key={value}
                onClick={() => handleCountdownSelect(value)}
                className={`flex-1 py-3 rounded-xl font-bold text-sm transition-all active:scale-95 ${
                  countdown === value && !customCountdown
                    ? 'bg-violet-600 text-white border-2 border-violet-400'
                    : 'bg-zinc-800 text-zinc-300 border border-zinc-700 hover:bg-zinc-700'
                }`}
              >
                {value}s
              </button>
            ))}
            <div className="relative flex-1">
              <input
                type="number"
                value={customCountdown}
                onChange={handleCustomCountdownChange}
                placeholder="?"
                className={`w-full py-3 rounded-xl font-bold text-sm text-center transition-all ${
                  customCountdown
                    ? 'bg-violet-600 text-white border-2 border-violet-400'
                    : 'bg-zinc-800 text-zinc-300 border border-zinc-700 hover:bg-zinc-700'
                } focus:outline-none focus:ring-2 focus:ring-violet-500`}
                min="1"
              />
            </div>
          </div>
          {customCountdown && (
            <p className="text-xs text-zinc-500 mt-1">Personnalisé: {customCountdown}s</p>
          )}
        </div>

        {/* Nombre de répétitions */}
        <div className="mb-6">
          <label className="block text-sm font-bold text-zinc-300 mb-3 flex items-center gap-2">
            🔢 Nombre de répétitions
          </label>
          {repsInfo.isRange ? (
            <>
              <p className="text-xs text-zinc-500 mb-2">Gamme recommandée: {repsInfo.min}-{repsInfo.max}</p>
              <div className="flex items-center gap-2 mb-2">
                {[repsInfo.min, Math.floor((repsInfo.min! + repsInfo.max!) / 2), repsInfo.max].map((value) => (
                  <button
                    key={value}
                    onClick={() => handleRepsSelect(value!)}
                    className={`flex-1 py-3 rounded-xl font-bold text-sm transition-all active:scale-95 ${
                      repsCount === value && !customReps
                        ? 'bg-violet-600 text-white border-2 border-violet-400'
                        : 'bg-zinc-800 text-zinc-300 border border-zinc-700 hover:bg-zinc-700'
                    }`}
                  >
                    {value}
                  </button>
                ))}
                <div className="relative flex-1">
                  <input
                    type="number"
                    value={customReps}
                    onChange={handleCustomRepsChange}
                    placeholder="?"
                    className={`w-full py-3 rounded-xl font-bold text-sm text-center transition-all ${
                      customReps
                        ? 'bg-violet-600 text-white border-2 border-violet-400'
                        : 'bg-zinc-800 text-zinc-300 border border-zinc-700 hover:bg-zinc-700'
                    } focus:outline-none focus:ring-2 focus:ring-violet-500`}
                    min="1"
                  />
                </div>
              </div>
            </>
          ) : (
            <div className="py-3 px-4 rounded-xl bg-zinc-800 border border-zinc-700 text-center">
              <span className="text-2xl font-black text-violet-400">{repsInfo.fixed}</span>
              <span className="text-sm text-zinc-400 ml-2">répétitions</span>
            </div>
          )}
          {customReps && (
            <p className="text-xs text-zinc-500 mt-1">Personnalisé: {customReps} reps</p>
          )}
        </div>

        {/* Son */}
        <div className="mb-6">
          <label className="block text-sm font-bold text-zinc-300 mb-3 flex items-center gap-2">
            🔊 Son du métronome
          </label>
          <button
            onClick={() => setSoundEnabled(!soundEnabled)}
            className={`w-full py-3 rounded-xl font-bold text-sm transition-all active:scale-95 flex items-center justify-center gap-3 ${
              soundEnabled
                ? 'bg-violet-600 text-white border-2 border-violet-400'
                : 'bg-zinc-800 text-zinc-300 border border-zinc-700'
            }`}
          >
            {soundEnabled ? <Volume2 size={20} /> : <VolumeX size={20} />}
            <span>{soundEnabled ? 'Activé' : 'Désactivé'}</span>
          </button>
        </div>

        {/* Bouton démarrer */}
        <button
          onClick={handleStart}
          className="w-full py-4 bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 text-white font-black text-lg rounded-xl transition-all active:scale-95 shadow-lg shadow-violet-500/50 uppercase tracking-tight"
        >
          Démarrer le métronome
        </button>

        {/* Bouton annuler */}
        <button
          onClick={onClose}
          className="w-full mt-3 py-3 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-bold text-sm rounded-xl transition-all active:scale-95"
        >
          Annuler
        </button>
      </div>
    </div>
  );
};

export default MetronomeModal;
