import React from 'react';
import { motion } from 'framer-motion';
import type { PerformanceSet } from '../../../types';

interface SetCardProps {
  setIndex: number;
  totalSets: number;
  isActive: boolean;
  distance: number;
  performanceData?: PerformanceSet;
  onSetClick?: (setIndex: number) => void;
  children?: React.ReactNode;
}

const SetCard: React.FC<SetCardProps> = ({
  setIndex,
  totalSets,
  isActive,
  distance,
  performanceData,
  onSetClick,
  children,
}) => {
  // Calcul des styles selon la distance par rapport à la série active
  const opacity = isActive ? 1 : Math.max(0.3, 1 - distance * 0.25);
  const scale = isActive ? 1 : Math.max(0.6, 1 - distance * 0.15);
  const zIndex = isActive ? 50 : 50 - distance;

  // Calcul de la position verticale (effet cylindre)
  const yOffset = (setIndex - (totalSets - 1) / 2) * 120;

  // Déterminer si la série est complétée
  const isCompleted = performanceData?.reps && performanceData?.load;
  const isPR = performanceData?.isPR || false;

  return (
    <motion.div
      className={`absolute w-[90%] max-w-md cursor-pointer`}
      style={{
        zIndex,
        opacity,
        scale,
        y: yOffset,
      }}
      initial={false}
      animate={{
        opacity,
        scale,
        y: yOffset,
      }}
      transition={{
        type: 'spring',
        stiffness: 300,
        damping: 30,
      }}
      onClick={() => onSetClick?.(setIndex)}
    >
      <div
        className={`
          relative rounded-2xl p-4 backdrop-blur-sm
          ${isActive 
            ? 'bg-bg-card border-2 border-brand-primary shadow-2xl shadow-brand-primary/20' 
            : 'bg-bg-card/80 border border-gray-700'
          }
          ${isCompleted && !isActive ? 'border-accent-green/50' : ''}
          transition-all duration-300
        `}
        style={{
          transform: `perspective(1000px) rotateX(${distance * 5}deg)`,
        }}
      >
        {/* Badge NEW PR */}
        {isPR && (
          <div className="absolute -top-2 -right-2 bg-gradient-to-r from-accent-gold to-yellow-500 text-white text-xs font-bold px-3 py-1 rounded-full shadow-lg animate-pulse-slow">
            🏆 NEW PR
          </div>
        )}

        {/* Contenu de la card */}
        {children ? (
          children
        ) : (
          <div className="text-center">
            <div className="text-text-secondary text-sm mb-2">
              Série {setIndex + 1}/{totalSets}
            </div>
            {isCompleted ? (
              <div className="flex items-center justify-center gap-2">
                <span className="text-accent-green text-2xl">✓</span>
                <span className="text-text-primary font-semibold">
                  {performanceData?.load}kg × {performanceData?.reps}
                </span>
              </div>
            ) : (
              <div className="text-text-tertiary text-sm">
                {isActive ? 'Série en cours' : 'À venir'}
              </div>
            )}
          </div>
        )}

        {/* Indicateur de progression */}
        {isCompleted && !isActive && (
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-accent-green/20 rounded-b-2xl overflow-hidden">
            <div className="h-full bg-accent-green w-full" />
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default SetCard;
