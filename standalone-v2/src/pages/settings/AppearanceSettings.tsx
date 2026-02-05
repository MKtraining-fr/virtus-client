import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, Sun, Moon, Check } from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';

/**
 * Page de réglages d'apparence (thème clair/sombre)
 */
const AppearanceSettings: React.FC = () => {
  const navigate = useNavigate();
  const { theme, setTheme } = useTheme();

  return (
    <div className="min-h-screen bg-white dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100">
      {/* Header */}
      <div className="border-b border-zinc-200 dark:border-zinc-800 px-4 py-3 flex items-center gap-3">
        <button
          onClick={() => navigate('/irontrack/settings')}
          className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors active:scale-95"
        >
          <ChevronLeft size={24} className="text-zinc-900 dark:text-zinc-100" />
        </button>
        <div>
          <h1 className="text-lg font-black uppercase tracking-tight">Apparence</h1>
          <p className="text-xs text-zinc-600 dark:text-zinc-400">Choisir le thème de l'application</p>
        </div>
      </div>

      {/* Content */}
      <div className="p-4 space-y-3">
        {/* Mode Clair */}
        <button
          onClick={() => setTheme('light')}
          className={`w-full p-4 rounded-xl border transition-all active:scale-98 ${
            theme === 'light'
              ? 'bg-violet-500/10 border-violet-500/30 ring-2 ring-violet-500/20'
              : 'bg-zinc-50 dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-800'
          }`}
        >
          <div className="flex items-center gap-3">
            <div className={`p-3 rounded-full ${
              theme === 'light' ? 'bg-violet-500/20' : 'bg-yellow-500/20'
            }`}>
              <Sun size={24} className={theme === 'light' ? 'text-violet-400' : 'text-yellow-400'} />
            </div>
            <div className="flex-1 text-left">
              <div className="font-black text-base">☀️ Mode clair</div>
              <div className="text-xs text-zinc-600 dark:text-zinc-400">Interface lumineuse et contrastée</div>
            </div>
            {theme === 'light' && (
              <div className="p-2 rounded-full bg-violet-500/20">
                <Check size={20} className="text-violet-400" />
              </div>
            )}
          </div>
        </button>

        {/* Mode Sombre */}
        <button
          onClick={() => setTheme('dark')}
          className={`w-full p-4 rounded-xl border transition-all active:scale-98 ${
            theme === 'dark'
              ? 'bg-violet-500/10 border-violet-500/30 ring-2 ring-violet-500/20'
              : 'bg-zinc-50 dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-800'
          }`}
        >
          <div className="flex items-center gap-3">
            <div className={`p-3 rounded-full ${
              theme === 'dark' ? 'bg-violet-500/20' : 'bg-indigo-500/20'
            }`}>
              <Moon size={24} className={theme === 'dark' ? 'text-violet-400' : 'text-indigo-400'} />
            </div>
            <div className="flex-1 text-left">
              <div className="font-black text-base">🌙 Mode sombre</div>
              <div className="text-xs text-zinc-600 dark:text-zinc-400">Interface sombre et reposante</div>
            </div>
            {theme === 'dark' && (
              <div className="p-2 rounded-full bg-violet-500/20">
                <Check size={20} className="text-violet-400" />
              </div>
            )}
          </div>
        </button>

        {/* Info */}
        <div className="bg-zinc-100 dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 rounded-xl p-3 mt-6">
          <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
            💡 Le thème choisi sera appliqué à toute l'application et sauvegardé automatiquement.
          </p>
        </div>
      </div>
    </div>
  );
};

export default AppearanceSettings;
