import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, ChevronRight, Flame, Palette } from 'lucide-react';
import { useIntensityTechnique } from '../contexts/IntensityTechniqueContext';
import { INTENSITY_TECHNIQUES_CATALOG } from '../types/intensity-techniques';

/**
 * Menu principal des réglages IronTrack
 * Point d'entrée vers les différentes sections de configuration
 */

interface SettingsSection {
  id: string;
  icon: string;
  title: string;
  description: string;
  badge?: 'DEV' | 'NEW';
  route: string;
  currentValue?: string;
}

const IronTrackSettings: React.FC = () => {
  const navigate = useNavigate();
  const { currentTechnique } = useIntensityTechnique();

  const devSections: SettingsSection[] = [
    {
      id: 'intensity-techniques',
      icon: '🔥',
      title: 'Techniques d\'intensification',
      description: 'DROP_SET, REST_PAUSE, SUPERSET...',
      badge: 'DEV',
      route: '/settings/intensity-techniques',
      currentValue: INTENSITY_TECHNIQUES_CATALOG[currentTechnique].label,
    },
  ];

  const generalSections: SettingsSection[] = [
    {
      id: 'appearance',
      icon: '🎨',
      title: 'Apparence',
      description: 'Thème clair ou sombre',
      route: '/settings/appearance',
    },
  ];

  const renderSection = (section: SettingsSection) => (
    <button
      key={section.id}
      onClick={() => navigate(section.route)}
      className="w-full bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-900 hover:border-zinc-300 dark:hover:border-zinc-700 rounded-xl p-4 transition-all active:scale-98"
    >
      <div className="flex items-center gap-3">
        <div className="text-2xl flex-shrink-0">{section.icon}</div>
        <div className="flex-1 min-w-0 text-left">
          <div className="flex items-center gap-2 mb-0.5">
            <span className="font-black text-base">{section.title}</span>
            {section.badge && (
              <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded uppercase ${
                section.badge === 'DEV' 
                  ? 'bg-orange-500/20 text-orange-400' 
                  : 'bg-green-500/20 text-green-400'
              }`}>
                {section.badge}
              </span>
            )}
          </div>
          <p className="text-xs text-zinc-600 dark:text-zinc-400">{section.description}</p>
          {section.currentValue && (
            <p className="text-xs text-violet-400 mt-1 font-semibold">
              Actuel : {section.currentValue}
            </p>
          )}
        </div>
        <ChevronRight size={20} className="text-zinc-400 dark:text-zinc-600 flex-shrink-0" />
      </div>
    </button>
  );

  return (
    <div className="min-h-screen bg-white dark:bg-zinc-950 text-zinc-900 dark:text-white flex flex-col">
      {/* Header */}
      <header className="flex-none bg-zinc-100 dark:bg-zinc-900/50 backdrop-blur-xl border-b border-zinc-200 dark:border-zinc-800/50 px-4 py-3 flex items-center gap-3">
        <button
          onClick={() => navigate('/irontrack')}
          className="p-2 hover:bg-zinc-200 dark:hover:bg-zinc-800 rounded-lg transition-colors active:scale-95"
        >
          <ChevronLeft size={24} />
        </button>
        <div>
          <h1 className="text-lg font-black uppercase tracking-tight">Réglages IronTrack</h1>
          <p className="text-xs text-zinc-600 dark:text-zinc-400">Configuration et personnalisation</p>
        </div>
      </header>

      {/* Content */}
      <main className="flex-1 overflow-y-auto p-4 space-y-6">
        {/* Section DEV */}
        {devSections.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-3 px-1">
              <h2 className="text-sm font-black uppercase tracking-wider text-zinc-600 dark:text-zinc-400">
                🧪 Développement
              </h2>
              <span className="text-xs text-zinc-500 dark:text-zinc-500">(Temporaire)</span>
            </div>
            <div className="space-y-2">
              {devSections.map(renderSection)}
            </div>
          </div>
        )}

        {/* Section Paramètres Généraux */}
        {generalSections.length > 0 && (
          <div>
            <h2 className="text-sm font-black uppercase tracking-wider text-zinc-600 dark:text-zinc-400 mb-3 px-1">
              ⚙️ Paramètres
            </h2>
            <div className="space-y-2">
              {generalSections.map(renderSection)}
            </div>
          </div>
        )}

        {/* Info */}
        <div className="bg-zinc-100 dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 rounded-xl p-4">
          <div className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
            <p className="mb-2">
              <span className="font-semibold text-zinc-700 dark:text-zinc-300">🧪 Sections DEV :</span> Ces options sont temporaires et serviront à tester les interfaces. Elles seront supprimées une fois le backend connecté.
            </p>
            <p>
              <span className="font-semibold text-zinc-700 dark:text-zinc-300">🔄 Backend :</span> Les personnalisations seront gérées automatiquement par le coach ou via une interface dédiée.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
};

export default IronTrackSettings;
