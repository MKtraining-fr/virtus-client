import React, { useState } from 'react';
import { Plus, Trash2, Calculator, Info } from 'lucide-react';
import { Exercise, ExerciseRecord } from '../../types';
import { ExerciseSelector } from './ExerciseSelector';
import { supabase } from '../../services/supabase';

interface PerformanceEntryProps {
  clientId: string;
  onPerformanceAdded?: () => void;
  isManualMode?: boolean;
  onManualAdd?: (performance: Partial<ExerciseRecord>) => void;
}

export const PerformanceEntry: React.FC<PerformanceEntryProps> = ({
  clientId,
  onPerformanceAdded,
  isManualMode = false,
  onManualAdd
}) => {
  const [selectedExercise, setSelectedExercise] = useState<Exercise | null>(null);
  const [weight, setWeight] = useState<string>('');
  const [reps, setReps] = useState<string>('');
  const [sets, setSets] = useState<string>('1');
  const [rir, setRir] = useState<string>('0');
  const [notes, setNotes] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedExercise || !weight || !reps) return;

    if (isManualMode && onManualAdd) {
      onManualAdd({
        exerciseId: selectedExercise.id,
        weight: parseFloat(weight),
        reps: parseInt(reps),
        sets: parseInt(sets),
        rir: parseInt(rir),
        notes: notes
      });
      
      // Reset form
      setSelectedExercise(null);
      setWeight('');
      setReps('');
      setSets('1');
      setRir('0');
      setNotes('');
      return;
    }

    setIsSubmitting(true);
    try {
      const { error } = await supabase
        .from('client_exercise_records')
        .insert({
          client_id: clientId,
          exercise_id: selectedExercise.id,
          weight: parseFloat(weight),
          reps: parseInt(reps),
          sets: parseInt(sets),
          rir: parseInt(rir),
          notes: notes,
          source: 'manual'
        });

      if (error) throw error;

      // Reset form
      setSelectedExercise(null);
      setWeight('');
      setReps('');
      setSets('1');
      setRir('0');
      setNotes('');
      
      if (onPerformanceAdded) onPerformanceAdded();
    } catch (error) {
      console.error('Error adding performance:', error);
      alert('Erreur lors de l\'ajout de la performance');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm">
      <div className="flex items-center gap-3 mb-6">
        <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
          <Calculator className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Ajouter une performance</h3>
          <p className="text-sm text-gray-500">Enregistrez un nouveau record personnel</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Exercice
          </label>
          <ExerciseSelector 
            onSelect={setSelectedExercise}
            placeholder="Rechercher un exercice (ex: Squat, Développé couché...)"
          />
          {selectedExercise && (
            <div className="mt-2 flex items-center gap-2 px-3 py-1.5 bg-primary/5 border border-primary/10 rounded-lg text-sm text-primary font-medium">
              <Plus className="h-3 w-3" />
              {selectedExercise.name}
              <button 
                type="button"
                onClick={() => setSelectedExercise(null)}
                className="ml-auto p-0.5 hover:bg-primary/10 rounded-full"
              >
                <Trash2 className="h-3 w-3" />
              </button>
            </div>
          )}
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Poids (kg)
            </label>
            <input
              type="number"
              step="0.5"
              value={weight}
              onChange={(e) => setWeight(e.target.value)}
              placeholder="0"
              className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Répétitions
            </label>
            <input
              type="number"
              value={reps}
              onChange={(e) => setReps(e.target.value)}
              placeholder="0"
              className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Séries
            </label>
            <input
              type="number"
              value={sets}
              onChange={(e) => setSets(e.target.value)}
              placeholder="1"
              className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-1.5">
              RIR
              <div className="group relative">
                <Info className="h-3.5 w-3.5 text-gray-400 cursor-help" />
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 p-2 bg-gray-900 text-white text-[10px] rounded-lg opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-10">
                  Reps In Reserve : nombre de répétitions que vous auriez pu faire en plus. 0 = échec total.
                </div>
              </div>
            </label>
            <select
              value={rir}
              onChange={(e) => setRir(e.target.value)}
              className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all appearance-none"
            >
              {[0, 1, 2, 3, 4, 5].map(val => (
                <option key={val} value={val}>{val}</option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Notes (optionnel)
          </label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Conditions, forme du jour, etc."
            className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all h-20 resize-none"
          />
        </div>

        <button
          type="submit"
          disabled={isSubmitting || !selectedExercise || !weight || !reps}
          className="w-full py-3 bg-primary text-white font-semibold rounded-xl hover:bg-primary-dark disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-primary/20 flex items-center justify-center gap-2"
        >
          {isSubmitting ? 'Enregistrement...' : (
            <>
              <Plus className="h-5 w-5" />
              Enregistrer la performance
            </>
          )}
        </button>
      </form>
    </div>
  );
};
