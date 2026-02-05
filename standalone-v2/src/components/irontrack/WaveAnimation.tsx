import React, { useEffect, useState, useRef } from 'react';

interface WaveAnimationProps {
  tempo: string; // Format: "3-0-1-0" (eccentric-bottom-concentric-top)
  totalReps: number;
  currentRep: number;
  currentPhase: 'eccentric' | 'bottom' | 'concentric' | 'top';
  phaseTimeRemaining: number; // Temps restant dans la phase actuelle (en secondes)
  onComplete: () => void;
}

const WaveAnimation: React.FC<WaveAnimationProps> = ({
  tempo,
  totalReps,
  currentRep,
  currentPhase,
  phaseTimeRemaining,
  onComplete
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [scrollOffset, setScrollOffset] = useState(0);

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

  // Calculer la position Y de la boule en fonction de la phase
  const getBallPosition = (): { x: number; y: number } => {
    const waveWidth = 120; // Largeur d'une vague
    const waveHeight = 200; // Hauteur d'une vague
    const centerY = 150; // Centre vertical
    
    // Position X: basée sur la répétition actuelle
    const baseX = (currentRep - 1) * waveWidth + waveWidth / 2;
    
    let y = centerY;
    let phaseProgress = 0;
    
    switch (currentPhase) {
      case 'top':
        y = centerY - waveHeight / 2; // Position haute
        break;
      case 'eccentric':
        // Descente progressive
        if (tempoPhases.eccentric > 0) {
          phaseProgress = 1 - (phaseTimeRemaining / tempoPhases.eccentric);
        }
        y = centerY - waveHeight / 2 + (waveHeight * phaseProgress);
        break;
      case 'bottom':
        y = centerY + waveHeight / 2; // Position basse
        break;
      case 'concentric':
        // Montée progressive
        if (tempoPhases.concentric > 0) {
          phaseProgress = 1 - (phaseTimeRemaining / tempoPhases.concentric);
        }
        y = centerY + waveHeight / 2 - (waveHeight * phaseProgress);
        break;
    }
    
    return { x: baseX, y };
  };

  const ballPos = getBallPosition();

  // Auto-scroll pour garder la boule visible
  useEffect(() => {
    if (containerRef.current) {
      const containerWidth = containerRef.current.clientWidth;
      const targetScroll = Math.max(0, ballPos.x - containerWidth / 2);
      setScrollOffset(targetScroll);
    }
  }, [ballPos.x]);

  // Générer les points SVG pour la courbe ondulée
  const generateWavePath = (): string => {
    const waveWidth = 120;
    const waveHeight = 200;
    const centerY = 150;
    
    let path = `M 0 ${centerY - waveHeight / 2}`;
    
    for (let i = 0; i < totalReps; i++) {
      const x = i * waveWidth;
      const nextX = (i + 1) * waveWidth;
      
      // Courbe de Bézier pour créer la vague
      const cp1x = x + waveWidth * 0.25;
      const cp1y = centerY - waveHeight / 2;
      const cp2x = x + waveWidth * 0.75;
      const cp2y = centerY + waveHeight / 2;
      const endX = nextX;
      const endY = centerY + waveHeight / 2;
      
      path += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${endX} ${endY}`;
      
      // Remonter pour la prochaine vague
      if (i < totalReps - 1) {
        const cp3x = endX + waveWidth * 0.25;
        const cp3y = centerY + waveHeight / 2;
        const cp4x = endX + waveWidth * 0.75;
        const cp4y = centerY - waveHeight / 2;
        const nextEndX = endX + waveWidth;
        const nextEndY = centerY - waveHeight / 2;
        
        path += ` C ${cp3x} ${cp3y}, ${cp4x} ${cp4y}, ${nextEndX} ${nextEndY}`;
      }
    }
    
    return path;
  };

  // Déterminer le statut de chaque répétition
  const getRepStatus = (repIndex: number): 'completed' | 'current' | 'upcoming' => {
    if (repIndex < currentRep - 1) return 'completed';
    if (repIndex === currentRep - 1) return 'current';
    return 'upcoming';
  };

  return (
    <div className="relative w-full h-full flex flex-col items-center justify-center overflow-hidden">
      {/* Labels */}
      <div className="absolute top-8 left-1/2 -translate-x-1/2 text-violet-400 font-bold text-sm uppercase tracking-wider flex items-center gap-2">
        <span>⬆️</span>
        <span>Concentrique</span>
      </div>
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 text-orange-400 font-bold text-sm uppercase tracking-wider flex items-center gap-2">
        <span>⬇️</span>
        <span>Excentrique</span>
      </div>

      {/* Zone de scroll horizontale */}
      <div 
        ref={containerRef}
        className="relative w-full h-[350px] overflow-hidden"
        style={{ 
          transform: `translateX(-${scrollOffset}px)`,
          transition: 'transform 0.5s ease-out'
        }}
      >
        <svg
          width={totalReps * 120 + 100}
          height="350"
          viewBox={`0 0 ${totalReps * 120 + 100} 350`}
          className="absolute top-0 left-0"
        >
          {/* Courbe ondulée */}
          <path
            d={generateWavePath()}
            fill="none"
            stroke="currentColor"
            strokeWidth="3"
            className="text-zinc-700 dark:text-zinc-600"
          />

          {/* Points de répétitions */}
          {Array.from({ length: totalReps }).map((_, index) => {
            const status = getRepStatus(index);
            const x = index * 120 + 60;
            const yTop = 150 - 100;
            const yBottom = 150 + 100;
            
            return (
              <g key={index}>
                {/* Point haut */}
                <circle
                  cx={x}
                  cy={yTop}
                  r="8"
                  fill={status === 'completed' ? '#8b5cf6' : status === 'current' ? '#a78bfa' : '#52525b'}
                  className="transition-all duration-300"
                />
                {/* Point bas */}
                <circle
                  cx={x}
                  cy={yBottom}
                  r="8"
                  fill={status === 'completed' ? '#8b5cf6' : status === 'current' ? '#a78bfa' : '#52525b'}
                  className="transition-all duration-300"
                />
                {/* Numéro de répétition */}
                <text
                  x={x}
                  y={yBottom + 30}
                  textAnchor="middle"
                  className="text-xs font-bold fill-zinc-400"
                >
                  {index + 1}
                </text>
              </g>
            );
          })}

          {/* Boule animée */}
          <g>
            <circle
              cx={ballPos.x}
              cy={ballPos.y}
              r="24"
              fill="#8b5cf6"
              className="drop-shadow-[0_0_20px_rgba(139,92,246,0.8)]"
            />
            <circle
              cx={ballPos.x}
              cy={ballPos.y}
              r="20"
              fill="#a78bfa"
            />
            {/* Décompte dans la boule */}
            <text
              x={ballPos.x}
              y={ballPos.y + 6}
              textAnchor="middle"
              className="text-xl font-black fill-white"
            >
              {Math.ceil(phaseTimeRemaining)}
            </text>
          </g>
        </svg>
      </div>

      {/* Compteur de répétitions */}
      <div className="absolute bottom-20 left-1/2 -translate-x-1/2 bg-zinc-900/90 backdrop-blur-md border border-zinc-700 rounded-full px-6 py-2">
        <span className="text-lg font-black text-white">
          Répétition: <span className="text-violet-400">{currentRep}</span> / {totalReps}
        </span>
      </div>
    </div>
  );
};

export default WaveAnimation;
