import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, Check } from 'lucide-react';
import { useIntensityTechnique } from '../contexts/IntensityTechniqueContext';
import { INTENSITY_TECHNIQUES_CATALOG, type IntensityTechnique } from '../types/intensity-techniques';

/**
 * Page de réglages IronTrack
 * Permet de sélectionner la technique d'intensification active
 */

const IronTrackSettings: React.FC = () => {
  const navigate = useNavigate();
  const { currentTechnique, setTechnique } = useIntensityTechnique();

  const handleSelectTechnique = (technique: IntensityTechnique) => {
    setTechnique(technique);
    // Retour automatique après sélection
    setTimeout(() => navigate(-1), 300);
  };

  // Grouper par objectif
  const techniquesByGoal = Object.values(INTENSITY_TECHNIQUES_CATALOG).reduce((acc, tech) => {
    if (!acc[tech.goal]) {
      acc[tech.goal] = [];
    }
    acc[tech.goal].push(tech);
    return acc;
  }, {} as Record<string, typeof INTENSITY_TECHNIQUES_CATALOG[IntensityTechnique][]>);

  const goalLabels = {
    STRENGTH: 'Force',
    HYPERTROPHY: 'Hypertrophie',
    ENDURANCE: 'Endurance',
    POWER: 'Puissance',
  };

  const goalColors = {
    STRENGTH: 'from-red-500/20 to-orange-500/20 border-red-500/30',
    HYPERTROPHY: 'from-violet-500/20 to-purple-500/20 border-violet-500/30',
    ENDURANCE: 'from-blue-500/20 to-cyan-500/20 border-blue-500/30',
    POWER: 'from-yellow-500/20 to-orange-500/20 border-yellow-500/30',
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-white flex flex-col">
      {/* Header */}
      <header className="flex-none bg-zinc-900/50 backdrop-blur-xl border-b border-zinc-800/50 px-4 py-3 flex items-center gap-3">
        <button
          onClick={() => navigate(-1)}
          className="p-2 hover:bg-zinc-800 rounded-lg transition-colors active:scale-95"
        >
          <ChevronLeft size={24} />
        </button>
        <div>
          <h1 className="text-lg font-black uppercase tracking-tight">Réglages IronTrack</h1>
          <p className="text-xs text-zinc-400">Technique d'intensification</p>
        </div>
      </header>

      {/* Content */}
      <main className="flex-1 overflow-y-auto p-4 space-y-6">
        {/* Technique actuelle */}
        <div className="bg-gradient-to-br from-violet-500/10 to-purple-500/10 border border-violet-500/20 rounded-xl p-4">
          <div className="flex items-center gap-3 mb-2">
            <div className="text-3xl">{INTENSITY_TECHNIQUES_CATALOG[currentTechnique].icon}</div>
            <div>
              <div className="text-xs text-violet-400 uppercase tracking-wider font-semibold">Technique active</div>
              <div className="text-lg font-black">{INTENSITY_TECHNIQUES_CATALOG[currentTechnique].label}</div>
            </div>
          </div>
          <p className="text-sm text-zinc-300">{INTENSITY_TECHNIQUES_CATALOG[currentTechnique].description}</p>
        </div>

        {/* Techniques par objectif */}
        {Object.entries(techniquesByGoal).map(([goal, techniques]) => (
          <div key={goal}>
            <h2 className="text-sm font-black uppercase tracking-wider text-zinc-400 mb-3 px-1">
              {goalLabels[goal as keyof typeof goalLabels]}
            </h2>
            <div className="space-y-2">
              {techniques.map((tech) => {
                const isActive = tech.type === currentTechnique;
                return (
                  <button
                    key={tech.type}
                    onClick={() => handleSelectTechnique(tech.type)}
                    className={`w-full text-left p-4 rounded-xl border transition-all active:scale-98 ${
                      isActive
                        ? `bg-gradient-to-br ${goalColors[goal as keyof typeof goalColors]} shadow-lg`
                        : 'bg-zinc-900/50 border-zinc-800 hover:bg-zinc-900 hover:border-zinc-700'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className="text-2xl flex-shrink-0">{tech.icon}</div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-black text-base">{tech.label}</span>
                          {isActive && (
                            <div className="bg-violet-500 rounded-full p-0.5">
                              <Check size={12} strokeWidth={3} />
                            </div>
                          )}
                        </div>
                        <p className="text-xs text-zinc-400 leading-relaxed">{tech.description}</p>
                        <div className="flex items-center gap-2 mt-2">
                          {/* Difficulté */}
                          <div className="flex items-center gap-1">
                            {Array.from({ length: 5 }).map((_, i) => (
                              <div
                                key={i}
                                className={`w-1.5 h-1.5 rounded-full ${
                                  i < tech.difficulty ? 'bg-orange-400' : 'bg-zinc-700'
                                }`}
                              />
                            ))}
                          </div>
                          <span className="text-xs text-zinc-500">•</span>
                          <span className="text-xs text-zinc-500 capitalize">
                            {tech.goal.toLowerCase()}
                          </span>
                        </div>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        ))}

        {/* Info */}
        <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-4">
          <div className="text-xs text-zinc-400 leading-relaxed">
            <p className="mb-2">
              <span className="font-semibold text-zinc-300">💡 Astuce :</span> La technique sélectionnée s'applique à tous les exercices de votre séance. Vous pouvez la changer à tout moment.
            </p>
            <p>
              <span className="font-semibold text-zinc-300">🔄 Synchronisation :</span> Quand le backend sera connecté, vos préférences seront automatiquement sauvegardées.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
};

export default IronTrackSettings;
