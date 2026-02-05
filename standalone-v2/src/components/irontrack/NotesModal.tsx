import React, { useState, useEffect, useRef } from 'react';
import { X } from 'lucide-react';

interface NotesModalProps {
  isOpen: boolean;
  onClose: () => void;
  setNumber: number;
  initialNote?: string;
  onSave: (note: string) => void;
}

/**
 * Modale pour ajouter/éditer une note sur une série
 * La note est liée à la série active
 */
const NotesModal: React.FC<NotesModalProps> = ({
  isOpen,
  onClose,
  setNumber,
  initialNote = '',
  onSave,
}) => {
  const [note, setNote] = useState(initialNote);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Réinitialiser la note quand la modale s'ouvre
  useEffect(() => {
    if (isOpen) {
      setNote(initialNote);
      // Focus automatique sur le textarea
      setTimeout(() => textareaRef.current?.focus(), 100);
    }
  }, [isOpen, initialNote]);

  const handleSave = () => {
    onSave(note.trim());
    onClose();
  };

  const handleCancel = () => {
    setNote(initialNote); // Restaurer la note initiale
    onClose();
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 animate-fadeIn"
        onClick={handleCancel}
      />

      {/* Modal */}
      <div className="fixed inset-x-0 bottom-0 z-50 animate-slideUp">
        <div className="bg-white dark:bg-zinc-950 border-t border-zinc-200 dark:border-zinc-800 rounded-t-3xl shadow-2xl max-h-[70vh] flex flex-col">
          {/* Header */}
          <div className="flex-none border-b border-zinc-200 dark:border-zinc-800/50 px-4 py-3 flex items-center justify-between">
            <div>
              <h2 className="text-base font-black uppercase tracking-tight text-zinc-900 dark:text-white">Note Série {setNumber}</h2>
              <p className="text-xs text-zinc-600 dark:text-zinc-400">Ajouter un commentaire</p>
            </div>
            <button
              onClick={handleCancel}
              className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors active:scale-95"
            >
              <X size={20} className="text-zinc-600 dark:text-zinc-400" />
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-4">
            <textarea
              ref={textareaRef}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Saisir votre commentaire..."
              className="w-full h-40 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl px-4 py-3 text-zinc-900 dark:text-white placeholder-zinc-400 dark:placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent resize-none"
              maxLength={500}
            />
            <div className="flex items-center justify-between mt-2">
              <p className="text-xs text-zinc-600 dark:text-zinc-500">
                {note.length}/500 caractères
              </p>
              {note.trim() && (
                <p className="text-xs text-violet-400 font-semibold">
                  ✓ Note prête à être sauvegardée
                </p>
              )}
            </div>
          </div>

          {/* Footer */}
          <div className="flex-none border-t border-zinc-200 dark:border-zinc-800/50 p-4 flex gap-3">
            <button
              onClick={handleCancel}
              className="flex-1 bg-zinc-100 dark:bg-zinc-900 hover:bg-zinc-200 dark:hover:bg-zinc-800 border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-white font-black py-3 rounded-xl transition-all active:scale-98"
            >
              Annuler
            </button>
            <button
              onClick={handleSave}
              className="flex-1 bg-gradient-to-r from-violet-500 to-purple-500 hover:from-violet-600 hover:to-purple-600 text-white font-black py-3 rounded-xl transition-all active:scale-98 shadow-lg shadow-violet-500/20"
            >
              Enregistrer
            </button>
          </div>
        </div>
      </div>

      {/* Animations */}
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes slideUp {
          from { transform: translateY(100%); }
          to { transform: translateY(0); }
        }
        .animate-fadeIn {
          animation: fadeIn 0.2s ease-out;
        }
        .animate-slideUp {
          animation: slideUp 0.3s ease-out;
        }
      `}</style>
    </>
  );
};

export default NotesModal;
