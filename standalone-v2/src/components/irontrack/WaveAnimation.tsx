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
  // Dimensions - BEAUCOUP PLUS GRANDES pour correspondre au mockup
  const waveWidth = 280; // Largeur d'une vague (x2.3 par rapport à avant)
  const waveHeight = 300; // Hauteur d'une vague (x2)
  const amplitude = waveHeight / 2;
  const centerY = waveHeight / 2;
  
  // ViewBox pour n'afficher que 2.5 vagues à la fois
  const visibleWaves = 2.5;
  const viewBoxWidth = visibleWaves * waveWidth;
  const viewBoxHeight = waveHeight + 100; // Marge pour les labels
  
  // Scroll offset basé sur la répétition actuelle (centrer la répétition en cours)
  const scrollOffset = Math.max(0, (currentRep - 1.5) * waveWidth);
  
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
  
  // Générer le path de la courbe ondulée
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
      
      // Descente (excentrique) - courbe de Bézier
      path += `Q ${topX + waveWidth * 0.15} ${centerY - amplitude * 0.3} ${bottomX} ${bottomY} `;
      
      // Montée (concentrique) - courbe de Bézier
      path += `Q ${bottomX + waveWidth * 0.15} ${centerY - amplitude * 0.3} ${nextTopX} ${nextTopY} `;
      
      // Connexion à la vague suivante
      if (i < totalReps - 1) {
        const nextWaveTopX = (i + 1) * waveWidth + waveWidth * 0.15;
        path += `L ${nextWaveTopX} ${nextTopY} `;
      }
    }
    
    return path;
  };
  
  // Calculer la position de la boule
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
      // Descente progressive
      const progress = tempoPhases.eccentric > 0 
        ? 1 - (phaseTimeRemaining / tempoPhases.eccentric) 
        : 1;
      const t = progress;
      // Courbe de Bézier quadratique
      const controlX = topX + waveWidth * 0.15;
      const controlY = centerY - amplitude * 0.3;
      const x = (1 - t) * (1 - t) * topX + 2 * (1 - t) * t * controlX + t * t * bottomX;
      const y = (1 - t) * (1 - t) * topY + 2 * (1 - t) * t * controlY + t * t * bottomY;
      return { x, y };
    } else if (currentPhase === 'bottom') {
      return { x: bottomX, y: bottomY };
    } else if (currentPhase === 'concentric') {
      // Montée progressive
      const progress = tempoPhases.concentric > 0 
        ? 1 - (phaseTimeRemaining / tempoPhases.concentric) 
        : 1;
      const t = progress;
      // Courbe de Bézier quadratique
      const controlX = bottomX + waveWidth * 0.15;
      const controlY = centerY - amplitude * 0.3;
      const x = (1 - t) * (1 - t) * bottomX + 2 * (1 - t) * t * controlX + t * t * nextTopX;
      const y = (1 - t) * (1 - t) * bottomY + 2 * (1 - t) * t * controlY + t * t * nextTopY;
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
        style={{ transition: 'all 0.5s ease-out' }}
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
        
        {/* Courbe ondulée */}
        <path
          d={generateWavePath()}
          fill="none"
          stroke="#3F3F46"
          strokeWidth="5"
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
