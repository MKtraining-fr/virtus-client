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
  const waveWidth = 200;
  const waveHeight = 600;
  const topY = 50;
  const bottomY = 550;
  const radius = 40;
  
  // ViewBox
  const visibleWaves = 3;
  const viewBoxWidth = visibleWaves * waveWidth;
  const viewBoxHeight = waveHeight + 100;
  
  // État pour le défilement fluide
  const [smoothScrollOffset, setSmoothScrollOffset] = useState(0);
  const animationFrameRef = useRef<number>();
  
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
  
  // Défilement fluide de gauche à droite avec requestAnimationFrame
  useEffect(() => {
    const animate = () => {
      const repIndex = currentRep - 1;
      const elapsedInRep = getElapsedTimeInRep();
      const progressInRep = totalPhaseTime > 0 ? elapsedInRep / totalPhaseTime : 0;
      
      // Calcul du scroll : défilement de gauche à droite
      // Les nouvelles courbes viennent de la gauche, les anciennes sortent à droite
      const baseOffset = repIndex * waveWidth;
      const currentOffset = baseOffset + progressInRep * waveWidth;
      
      // Inverser pour défilement gauche → droite
      // On veut que la courbe actuelle reste au centre-gauche
      const targetScrollOffset = -(currentOffset - viewBoxWidth * 0.3);
      
      // Interpolation fluide
      setSmoothScrollOffset(prev => {
        const diff = targetScrollOffset - prev;
        return prev + diff * 0.15;
      });
      
      animationFrameRef.current = requestAnimationFrame(animate);
    };
    
    animate();
    
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [currentRep, currentPhase, phaseTimeRemaining, totalPhaseTime, waveWidth, viewBoxWidth]);
  
  // Générer le path avec des courbes en U verticales
  const generateUPath = () => {
    let path = '';
    
    for (let i = 0; i < totalReps; i++) {
      const x = i * waveWidth;
      
      // Points de la courbe en U
      const topLeftX = x + radius;
      const topLeftY = topY;
      
      const bottomLeftX = x + radius;
      const bottomLeftY = bottomY - radius;
      
      const bottomRightX = x + waveWidth - radius;
      const bottomRightY = bottomY - radius;
      
      const topRightX = x + waveWidth - radius;
      const topRightY = topY;
      
      if (i === 0) {
        path += `M ${topLeftX} ${topLeftY} `;
      }
      
      // Descente (ligne verticale gauche)
      path += `L ${bottomLeftX} ${bottomLeftY} `;
      
      // Demi-cercle bas (de gauche à droite)
      // A rx ry x-axis-rotation large-arc-flag sweep-flag x y
      path += `A ${radius} ${radius} 0 0 0 ${bottomRightX} ${bottomRightY} `;
      
      // Montée (ligne verticale droite)
      path += `L ${topRightX} ${topRightY} `;
      
      // Demi-cercle haut (vers la prochaine courbe)
      if (i < totalReps - 1) {
        const nextTopLeftX = (i + 1) * waveWidth + radius;
        path += `A ${radius} ${radius} 0 0 0 ${nextTopLeftX} ${topLeftY} `;
      }
    }
    
    return path;
  };
  
  // Calculer la position de la boule
  const getBallPosition = () => {
    const repIndex = currentRep - 1;
    const x = repIndex * waveWidth;
    
    const topLeftX = x + radius;
    const bottomLeftX = x + radius;
    const bottomRightX = x + waveWidth - radius;
    const topRightX = x + waveWidth - radius;
    
    if (currentPhase === 'top') {
      return { x: topLeftX, y: topY };
    } else if (currentPhase === 'eccentric') {
      // Descente linéaire le long du trait vertical gauche
      const progress = tempoPhases.eccentric > 0 ? 1 - (phaseTimeRemaining / tempoPhases.eccentric) : 1;
      const y = topY + (bottomY - radius - topY) * progress;
      return { x: bottomLeftX, y };
    } else if (currentPhase === 'bottom') {
      // Demi-cercle bas (de gauche à droite)
      const progress = tempoPhases.bottom > 0 ? 1 - (phaseTimeRemaining / tempoPhases.bottom) : 1;
      const angle = Math.PI + Math.PI * progress; // De 180° (π) à 360° (2π)
      const centerX = x + waveWidth / 2;
      const centerY = bottomY - radius;
      const ballX = centerX + radius * Math.cos(angle);
      const ballY = centerY + radius * Math.sin(angle);
      return { x: ballX, y: ballY };
    } else if (currentPhase === 'concentric') {
      // Montée linéaire le long du trait vertical droit
      const progress = tempoPhases.concentric > 0 ? 1 - (phaseTimeRemaining / tempoPhases.concentric) : 1;
      const y = (bottomY - radius) - (bottomY - radius - topY) * progress;
      return { x: topRightX, y };
    }
    
    return { x: topLeftX, y: topY };
  };
  
  const ballPos = getBallPosition();
  
  // Générer les points pour chaque répétition
  const renderRepPoints = () => {
    const points = [];
    
    for (let i = 0; i < totalReps; i++) {
      const x = i * waveWidth;
      const topLeftX = x + radius;
      const topLeftY = topY;
      const bottomCenterX = x + waveWidth / 2;
      const bottomCenterY = bottomY - radius;
      
      const isCompleted = i < currentRep - 1;
      const isCurrent = i === currentRep - 1;
      const color = isCompleted || isCurrent ? '#8B5CF6' : '#52525B';
      
      // Point haut
      points.push(
        <circle
          key={`top-${i}`}
          cx={topLeftX}
          cy={topLeftY}
          r={14}
          fill={color}
          opacity={isCompleted ? 1 : isCurrent ? 0.8 : 0.4}
        />
      );
      
      // Point bas
      points.push(
        <circle
          key={`bottom-${i}`}
          cx={bottomCenterX}
          cy={bottomY - radius}
          r={14}
          fill={color}
          opacity={isCompleted ? 1 : isCurrent ? 0.8 : 0.4}
        />
      );
      
      // Numéro de répétition
      points.push(
        <text
          key={`label-${i}`}
          x={bottomCenterX}
          y={bottomY + 40}
          textAnchor="middle"
          fill={color}
          fontSize="24"
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
      {/* SVG avec les courbes en U */}
      <svg
        width="100%"
        height="700"
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
        
        {/* Courbes en U avec trait épais */}
        <path
          d={generateUPath()}
          fill="none"
          stroke="#3F3F46"
          strokeWidth="12"
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
