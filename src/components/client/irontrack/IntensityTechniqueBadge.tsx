import React, { useState } from 'react';
import { Zap, Info } from 'lucide-react';
import type { IntensityConfig } from '../../../types/intensityConfig';

interface IntensityTechniqueBadgeProps {
  techniqueName: string;
  config?: Record<string, any> | null;
  appliesTo?: string | null;
  description?: string;
}

/**
 * Badge compact pour afficher les techniques d'intensification
 * Placé entre la vidéo et les boutons d'action
 */
const IntensityTechniqueBadge: React.FC<IntensityTechniqueBadgeProps> = ({
  techniqueName,
  config,
  appliesTo,
  description,
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Format the appliesTo text
  const getAppliesText = () => {
    if (!appliesTo || !config) return '';
    
    const applyTo = (config as any).applyTo;
    const specificSets = (config as any).specificSets;

    if (applyTo === 'all') return 'Toutes les séries';
    if (applyTo === 'last') return 'Dernière série';
    if (applyTo === 'specific' && specificSets) {
      return `Séries ${specificSets.join(', ')}`;
    }
    return '';
  };

  // Get technique description
  const getDescription = () => {
    if (description) return description;

    // Default descriptions based on technique name
    const descriptions: Record<string, string> = {
      'Drop Set': 'Réduisez immédiatement la charge après l\'échec et continuez jusqu\'à l\'échec musculaire.',
      'Rest-Pause': 'Effectuez une série jusqu\'à l\'échec, reposez-vous 10-15 secondes, puis continuez pour quelques répétitions supplémentaires.',
      'Myo-Reps': 'Série d\'activation suivie de mini-séries courtes avec repos minimal pour maximiser la tension métabolique.',
      'Cluster Set': 'Divisez votre série en plusieurs clusters avec de courtes pauses pour maintenir l\'intensité.',
      'Tempo Contrôlé': 'Contrôlez la vitesse d\'exécution pour augmenter le temps sous tension et l\'intensité.',
    };

    return descriptions[techniqueName] || 'Technique d\'intensification avancée pour maximiser vos gains.';
  };

  return (
    <>
      {/* Badge compact */}
      <div className="bg-gradient-to-r from-orange-500/10 to-amber-500/10 border border-orange-500/30 rounded-xl p-2 flex items-center justify-between backdrop-blur-sm">
        <div className="flex items-center gap-2">
          <div className="bg-orange-500/20 p-1.5 rounded-lg">
            <Zap size={16} className="text-orange-400" />
          </div>
          <div>
            <p className="text-xs font-black text-orange-400 uppercase tracking-wider leading-none">
              {techniqueName}
            </p>
            {getAppliesText() && (
              <p className="text-[10px] text-zinc-400 mt-0.5 font-medium">
                {getAppliesText()}
              </p>
            )}
          </div>
        </div>
        
        <button
          onClick={() => setIsModalOpen(true)}
          className="p-2 rounded-lg bg-zinc-800/50 hover:bg-zinc-700 transition-colors active:scale-95"
        >
          <Info size={16} className="text-zinc-400" />
        </button>
      </div>

      {/* Modal de description */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" />
          
          {/* Modal content */}
          <div className="relative w-full max-w-lg max-h-[80vh] bg-zinc-900 rounded-2xl p-6 animate-slide-up border border-orange-500/30 shadow-[0_10px_50px_rgba(251,146,60,0.3)] overflow-y-auto">
            {/* Header */}
            <div className="flex items-center gap-3 mb-4">
              <div className="bg-orange-500/20 p-2.5 rounded-xl">
                <Zap size={24} className="text-orange-400" />
              </div>
              <h3 className="text-xl font-black text-white uppercase tracking-tight">
                {techniqueName}
              </h3>
            </div>

            {/* Description */}
            <div className="space-y-4 max-h-[50vh] overflow-y-auto">
              <p className="text-zinc-300 leading-relaxed text-sm">
                {getDescription()}
              </p>

              {getAppliesText() && (
                <div className="bg-zinc-800/50 rounded-lg p-3 border border-zinc-700">
                  <p className="text-xs text-zinc-500 uppercase font-bold tracking-wider mb-1">
                    Application
                  </p>
                  <p className="text-sm text-zinc-300 font-semibold">
                    {getAppliesText()}
                  </p>
                </div>
              )}
            </div>

            {/* Button */}
            <button
              onClick={() => setIsModalOpen(false)}
              className="w-full mt-6 bg-orange-500 hover:bg-orange-600 text-white font-black py-3 rounded-xl transition-colors active:scale-95 uppercase tracking-tight"
            >
              Compris ! 💪
            </button>
          </div>
        </div>
      )}

      <style>{`
        @keyframes slide-up {
          from {
            transform: scale(0.9) translateY(20px);
            opacity: 0;
          }
          to {
            transform: scale(1) translateY(0);
            opacity: 1;
          }
        }
        .animate-slide-up {
          animation: slide-up 0.25s cubic-bezier(0.16, 1, 0.3, 1);
        }
      `}</style>
    </>
  );
};

export default IntensityTechniqueBadge;
