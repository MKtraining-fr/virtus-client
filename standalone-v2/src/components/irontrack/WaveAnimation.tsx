import React, { useEffect, useState } from 'react';

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
  
  // ViewBox fixe (ne change pas)
  const visibleWaves = 2.5;
  const viewBoxWidth = visibleWaves * waveWidth;
  const viewBoxHeight = waveHeight + 100;
  
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
  
  // Calculer le décalage de scroll pour créer l'effet de défilement
  // La boule reste relativement fixe, c'est la courbe qui se déplace
  const getScrollOffset = () => {
    const repIndex = currentRep - 1;
    let baseOffset = repIndex * waveWidth;
    
    // Ajouter un offset progressif selon la phase pour un défilement fluide
    const totalPhaseTime = tempoPhases.eccentric + tempoPhases.bottom + tempoPhases.concentric + tempoPhases.top;
    const elapsedInRep = totalPhaseTime - (
      (currentPhase === 'top' ? tempoPhases.top : 0) +
      (currentPhase === 'concentric' ? tempoPhases.concentric + phaseTimeRemaining : 0) +
      (currentPhase === 'bottom' ? tempoPhases.bottom + tempoPhases.concentric : 0) +
      (currentPhase === 'eccentric' ? tempoPhases.eccentric + tempoPhases.bottom + tempoPhases.concentric - phaseTimeRemaining : 0)
    );
    
    const progressInRep = totalPhaseTime > 0 ? elapsedInRep / totalPhaseTime : 0;
    baseOffset += progressInRep * waveWidth;
    
    // Centrer la vue sur la répétition en cours (garder la boule au centre-gauche)
    return Math.max(0, baseOffset - waveWidth * 0.5);
  };
  
  const scrollOffset = getScrollOffset();
  
  // Générer le path de la courbe ondulée avec des Bézier cubiques pour plus de fluidité
  const generateWavePath = () => {
    let path = '';
    
    for (let i = 0; i < totalReps; i++) {
      const x = i * waveWidth;
      
      // Point haut (début de la vague)
      const topX = x + waveWidth * 0.15;
      const topY = centerY - amplitude;
      
      // Point bas (milieu de la vague)
      const bottomX = x + waveWidth * 0.5;
      const bottomY = centerY + amplitude;
      
      // Point haut suivant (fin de la vague)
      const nextTopX = x + waveWidth * 0.85;
      const nextTopY = centerY - amplitude;
      
      if (i === 0) {
        path += `M ${topX} ${topY} `;
      }
      
      // Descente (excentrique) - courbe de Bézier CUBIQUE pour plus de fluidité
      const control1X = topX + waveWidth * 0.1;
      const control1Y = topY;
      const control2X = bottomX - waveWidth * 0.1;
      const control2Y = bottomY;
      path += `C ${control1X} ${control1Y} ${control2X} ${control2Y} ${bottomX} ${bottomY} `;
      
      // Montée (concentrique) - courbe de Bézier CUBIQUE
      const control3X = bottomX + waveWidth * 0.1;
      const control3Y = bottomY;
      const control4X = nextTopX - waveWidth * 0.1;
      const control4Y = nextTopY;
      path += `C ${control3X} ${control3Y} ${control4X} ${control4Y} ${nextTopX} ${nextTopY} `;
      
      // Connexion fluide à la vague suivante
      if (i < totalReps - 1) {
        const nextWaveTopX = (i + 1) * waveWidth + waveWidth * 0.15;
        path += `L ${nextWaveTopX} ${nextTopY} `;
      }
    }
    
    return path;
  };
  
  // Calculer la position de la boule (utilise les mêmes courbes cubiques)
  const getBallPosition = () => {
    const repIndex = currentRep - 1;
    const baseX = repIndex * waveWidth;
    
    // Point haut
    const topX = baseX + waveWidth * 0.15;
    const topY = centerY - amplitude;
    
    // Point bas
    const bottomX = baseX + waveWidth * 0.5;
    const bottomY = centerY + amplitude;
    
    // Point haut suivant
    const nextTopX = baseX + waveWidth * 0.85;
    const nextTopY = centerY - amplitude;
    
    // Calculer la position selon la phase
    if (currentPhase === 'top') {
      return { x: topX, y: topY };
    } else if (currentPhase === 'eccentric') {
      // Descente progressive avec Bézier cubique
      const progress = tempoPhases.eccentric > 0 
        ? 1 - (phaseTimeRemaining / tempoPhases.eccentric) 
        : 1;
      const t = progress;
      
      // Points de contrôle pour Bézier cubique
      const control1X = topX + waveWidth * 0.1;
      const control1Y = topY;
      const control2X = bottomX - waveWidth * 0.1;
      const control2Y = bottomY;
      
      // Formule de Bézier cubique
      const x = Math.pow(1 - t, 3) * topX + 
                3 * Math.pow(1 - t, 2) * t * control1X + 
                3 * (1 - t) * Math.pow(t, 2) * control2X + 
                Math.pow(t, 3) * bottomX;
      const y = Math.pow(1 - t, 3) * topY + 
                3 * Math.pow(1 - t, 2) * t * control1Y + 
                3 * (1 - t) * Math.pow(t, 2) * control2Y + 
                Math.pow(t, 3) * bottomY;
      return { x, y };
    } else if (currentPhase === 'bottom') {
      return { x: bottomX, y: bottomY };
    } else if (currentPhase === 'concentric') {
      // Montée progressive avec Bézier cubique
      const progress = tempoPhases.concentric > 0 
        ? 1 - (phaseTimeRemaining / tempoPhases.concentric) 
        : 1;
      const t = progress;
      
      // Points de contrôle pour Bézier cubique
      const control3X = bottomX + waveWidth * 0.1;
      const control3Y = bottomY;
      const control4X = nextTopX - waveWidth * 0.1;
      const control4Y = nextTopY;
      
      // Formule de Bézier cubique
      const x = Math.pow(1 - t, 3) * bottomX + 
                3 * Math.pow(1 - t, 2) * t * control3X + 
                3 * (1 - t) * Math.pow(t, 2) * control4X + 
                Math.pow(t, 3) * nextTopX;
      const y = Math.pow(1 - t, 3) * bottomY + 
                3 * Math.pow(1 - t, 2) * t * control3Y + 
                3 * (1 - t) * Math.pow(t, 2) * control4Y + 
                Math.pow(t, 3) * nextTopY;
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
        viewBox={`${scrollOffset} 0 ${viewBoxWidth} ${viewBoxHeight}`}
        preserveAspectRatio="xMidYMid meet"
        className="overflow-visible"
        style={{ transition: 'viewBox 0.3s ease-out' }}
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
        
        {/* Courbe ondulée avec trait plus épais */}
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
