import React, { useState, useEffect } from 'react';
import { NotebookPen } from 'lucide-react';
import { Modal, Button, Input } from '../ui';

interface NotesModalProps {
  isOpen: boolean;
  onClose: () => void;
  setNumber: number;
  initialNote?: string;
  onSave: (note: string) => void;
}

const NotesModal: React.FC<NotesModalProps> = ({
  isOpen,
  onClose,
  setNumber,
  initialNote = '',
  onSave,
}) => {
  const [note, setNote] = useState(initialNote);

  useEffect(() => {
    setNote(initialNote);
  }, [initialNote, isOpen]);

  const handleSave = () => {
    onSave(note);
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Notes - Série ${setNumber}`}
      size="md"
      footer={
        <div className="flex gap-2">
          <Button variant="outline" onClick={onClose} fullWidth>
            Annuler
          </Button>
          <Button variant="primary" onClick={handleSave} fullWidth>
            Enregistrer
          </Button>
        </div>
      }
    >
      <div className="space-y-4">
        <div className="flex items-center gap-2 text-text-secondary dark:text-text-secondary text-sm">
          <NotebookPen size={16} />
          <p>Ajoutez des notes sur cette série (ressenti, difficulté, observations...)</p>
        </div>

        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Ex: Série difficile, fatigue musculaire importante..."
          className="w-full h-32 px-4 py-3 bg-bg-secondary dark:bg-bg-secondary border border-border dark:border-border rounded-lg text-text-primary dark:text-text-primary placeholder-text-tertiary dark:placeholder-text-tertiary focus:outline-none focus:ring-2 focus:ring-brand-500 resize-none"
          autoFocus
        />

        <div className="text-xs text-text-tertiary dark:text-text-tertiary">
          {note.length} caractères
        </div>
      </div>
    </Modal>
  );
};

export default NotesModal;
