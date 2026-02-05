import React, { useEffect, useState, useRef } from 'react';

interface WaveAnimationProps {
  tempo: string;
  totalReps: number;
  currentRep: number;
  currentPhase: 'eccentric' | 'bottom' | 'concentric' | 'top';
  phaseTimeRemaining: number;
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
  // Dimensions
  const waveWidth = 280;
  const waveHeight = 300;
  const amplitude = waveHeight / 2;
  const centerY = waveHeight / 2;
  
  // ViewBox fixe
  const visibleWaves = 2.5;
  const viewBoxWidth = visibleWaves * waveWidth;
  const viewBoxHeight = waveHeight + 100;
  
  // État pour le défilement fluide
  const [smoothScrollOffset, setSmoothScrollOffset] = useState(0);
  const animationFrameRef = useRef<number>();
  const startTimeRef = useRef<number>(Date.now());
  
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
  const totalPhaseTime = tempoPhases.eccentric + tempoPhases.bottom + tempoPhases.concentric + tempoPhases.top;
  
  // Calculer le temps écoulé dans la répétition actuelle
  const getElapsedTimeInRep = () => {
    let elapsed = 0;
    
    if (currentPhase === 'eccentric') {
      elapsed = tempoPhases.eccentric - phaseTimeRemaining;
    } else if (currentPhase === 'bottom') {
      elapsed = tempoPhases.eccentric + (tempoPhases.bottom - phaseTimeRemaining);
    } else if (currentPhase === 'concentric') {
      elapsed = tempoPhases.eccentric + tempoPhases.bottom + (tempoPhases.concentric - phaseTimeRemaining);
    } else if (currentPhase === 'top') {
      elapsed = tempoPhases.eccentric + tempoPhases.bottom + tempoPhases.concentric + (tempoPhases.top - phaseTimeRemaining);
    }
    
    return elapsed;
  };
  
  // Défilement fluide avec requestAnimationFrame
  useEffect(() => {
    const animate = () => {
      const repIndex = currentRep - 1;
      const elapsedInRep = getElapsedTimeInRep();
      const progressInRep = totalPhaseTime > 0 ? elapsedInRep / totalPhaseTime : 0;
      
      // Calcul du scroll continu
      const baseOffset = repIndex * waveWidth;
      const currentOffset = baseOffset + progressInRep * waveWidth;
      const targetScrollOffset = Math.max(0, currentOffset - waveWidth * 0.5);
      
      // Interpolation fluide vers la cible
      setSmoothScrollOffset(prev => {
        const diff = targetScrollOffset - prev;
        return prev + diff * 0.15; // Interpolation douce
      });
      
      animationFrameRef.current = requestAnimationFrame(animate);
    };
    
    animate();
    
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [currentRep, currentPhase, phaseTimeRemaining, totalPhaseTime, waveWidth]);
  
  // Générer le path avec des courbes sinusoïdales ultra-fluides
  const generateWavePath = () => {
    let path = '';
    const segments = 60; // Nombre de points pour une courbe ultra-fluide
    
    for (let i = 0; i < totalReps; i++) {
      const x = i * waveWidth;
      
      // Point haut (début)
      const topX = x + waveWidth * 0.15;
      const topY = centerY - amplitude;
      
      // Point bas (milieu)
      const bottomX = x + waveWidth * 0.5;
      const bottomY = centerY + amplitude;
      
      // Point haut (fin)
      const nextTopX = x + waveWidth * 0.85;
      const nextTopY = centerY - amplitude;
      
      if (i === 0) {
        path += `M ${topX} ${topY} `;
      }
      
      // Descente (excentrique) - Courbe sinusoïdale pure
      const descenteWidth = bottomX - topX;
      for (let j = 1; j <= segments / 2; j++) {
        const t = j / (segments / 2);
        const px = topX + descenteWidth * t;
        const py = topY + (bottomY - topY) * Math.sin(t * Math.PI / 2); // Sinusoïde douce
        path += `L ${px} ${py} `;
      }
      
      // Point bas (pause instantanée si tempo bottom = 0)
      if (tempoPhases.bottom === 0) {
        // Changement de direction instantané (sommet aigu)
        path += `L ${bottomX} ${bottomY} `;
      } else {
        // Petit plateau si pause > 0
        const plateauWidth = waveWidth * 0.05;
        path += `L ${bottomX - plateauWidth} ${bottomY} L ${bottomX + plateauWidth} ${bottomY} `;
      }
      
      // Montée (concentrique) - Courbe sinusoïdale pure
      const monteeWidth = nextTopX - bottomX;
      for (let j = 1; j <= segments / 2; j++) {
        const t = j / (segments / 2);
        const px = bottomX + monteeWidth * t;
        const py = bottomY + (nextTopY - bottomY) * Math.sin(t * Math.PI / 2); // Sinusoïde douce
        path += `L ${px} ${py} `;
      }
      
      // Point haut (pause instantanée si tempo top = 0)
      if (tempoPhases.top === 0) {
        // Changement de direction instantané (sommet aigu)
        if (i < totalReps - 1) {
          const nextWaveTopX = (i + 1) * waveWidth + waveWidth * 0.15;
          path += `L ${nextTopX} ${nextTopY} L ${nextWaveTopX} ${nextTopY} `;
        }
      } else {
        // Petit plateau si pause > 0
        const plateauWidth = waveWidth * 0.05;
        path += `L ${nextTopX - plateauWidth} ${nextTopY} L ${nextTopX + plateauWidth} ${nextTopY} `;
        if (i < totalReps - 1) {
          const nextWaveTopX = (i + 1) * waveWidth + waveWidth * 0.15;
          path += `L ${nextWaveTopX} ${nextTopY} `;
        }
      }
    }
    
    return path;
  };
  
  // Calculer la position de la boule (même logique sinusoïdale)
  const getBallPosition = () => {
    const repIndex = currentRep - 1;
    const baseX = repIndex * waveWidth;
    
    const topX = baseX + waveWidth * 0.15;
    const topY = centerY - amplitude;
    const bottomX = baseX + waveWidth * 0.5;
    const bottomY = centerY + amplitude;
    const nextTopX = baseX + waveWidth * 0.85;
    const nextTopY = centerY - amplitude;
    
    if (currentPhase === 'top') {
      return { x: topX, y: topY };
    } else if (currentPhase === 'eccentric') {
      const progress = tempoPhases.eccentric > 0 ? 1 - (phaseTimeRemaining / tempoPhases.eccentric) : 1;
      const descenteWidth = bottomX - topX;
      const x = topX + descenteWidth * progress;
      const y = topY + (bottomY - topY) * Math.sin(progress * Math.PI / 2);
      return { x, y };
    } else if (currentPhase === 'bottom') {
      return { x: bottomX, y: bottomY };
    } else if (currentPhase === 'concentric') {
      const progress = tempoPhases.concentric > 0 ? 1 - (phaseTimeRemaining / tempoPhases.concentric) : 1;
      const monteeWidth = nextTopX - bottomX;
      const x = bottomX + monteeWidth * progress;
      const y = bottomY + (nextTopY - bottomY) * Math.sin(progress * Math.PI / 2);
      return { x, y };
    }
    
    return { x: topX, y: topY };
  };
  
  const ballPos = getBallPosition();
  
  // Générer les points pour chaque répétition
  const renderRepPoints = () => {
    const points = [];
    
    for (let i = 0; i < totalReps; i++) {
      const x = i * waveWidth;
      const topX = x + waveWidth * 0.15;
      const topY = centerY - amplitude;
      const bottomX = x + waveWidth * 0.5;
      const bottomY = centerY + amplitude;
      
      const isCompleted = i < currentRep - 1;
      const isCurrent = i === currentRep - 1;
      const color = isCompleted || isCurrent ? '#8B5CF6' : '#52525B';
      
      // Point haut
      points.push(
        <circle
          key={`top-${i}`}
          cx={topX}
          cy={topY}
          r={12}
          fill={color}
          opacity={isCompleted ? 1 : isCurrent ? 0.8 : 0.4}
        />
      );
      
      // Point bas
      points.push(
        <circle
          key={`bottom-${i}`}
          cx={bottomX}
          cy={bottomY}
          r={12}
          fill={color}
          opacity={isCompleted ? 1 : isCurrent ? 0.8 : 0.4}
        />
      );
      
      // Numéro de répétition
      points.push(
        <text
          key={`label-${i}`}
          x={bottomX}
          y={bottomY + 50}
          textAnchor="middle"
          fill={color}
          fontSize="20"
          fontWeight="bold"
          opacity={isCompleted || isCurrent ? 1 : 0.5}
        >
          {i + 1}
        </text>
      );
    }
    
    return points;
  };
  
  return (
    <div className="w-full h-full flex flex-col items-center justify-center">
      {/* SVG avec la courbe */}
      <svg
        width="100%"
        height="400"
        viewBox={`${smoothScrollOffset} 0 ${viewBoxWidth} ${viewBoxHeight}`}
        preserveAspectRatio="xMidYMid meet"
        className="overflow-visible"
      >
        {/* Définition du filtre glow */}
        <defs>
          <filter id="glow" x="-100%" y="-100%" width="300%" height="300%">
            <feGaussianBlur stdDeviation="25" result="coloredBlur"/>
            <feMerge>
              <feMergeNode in="coloredBlur"/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>
        </defs>
        
        {/* Courbe ondulée avec trait épais */}
        <path
          d={generateWavePath()}
          fill="none"
          stroke="#3F3F46"
          strokeWidth="10"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        
        {/* Points de répétitions */}
        {renderRepPoints()}
        
        {/* Boule animée avec glow intense */}
        <circle
          cx={ballPos.x}
          cy={ballPos.y}
          r="60"
          fill="#8B5CF6"
          filter="url(#glow)"
          opacity="0.9"
        />
        
        {/* Décompte dans la boule */}
        <text
          x={ballPos.x}
          y={ballPos.y + 10}
          textAnchor="middle"
          fill="white"
          fontSize="48"
          fontWeight="black"
        >
          {Math.ceil(phaseTimeRemaining)}
        </text>
      </svg>
      
      {/* Compteur de progression */}
      <div className="mt-8 bg-zinc-900/80 px-6 py-3 rounded-full border border-zinc-700">
        <span className="text-zinc-400 font-bold">Répétition: </span>
        <span className="text-violet-400 font-black text-xl">{currentRep}</span>
        <span className="text-zinc-400 font-bold"> / {totalReps}</span>
      </div>
      
      {/* Labels de phase */}
      <div className="mt-6 flex flex-col items-center gap-2">
        {currentPhase === 'concentric' || currentPhase === 'top' ? (
          <div className="flex items-center gap-2 text-green-400 font-bold text-lg uppercase tracking-wider">
            <span>⬆️</span>
            <span>CONCENTRIQUE</span>
          </div>
        ) : (
          <div className="flex items-center gap-2 text-orange-400 font-bold text-lg uppercase tracking-wider">
            <span>⬇️</span>
            <span>EXCENTRIQUE</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default WaveAnimation;
