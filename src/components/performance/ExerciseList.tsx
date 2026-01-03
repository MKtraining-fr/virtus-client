import React, { useState, useEffect } from 'react';
import { Search, TrendingUp, Calendar, ChevronRight } from 'lucide-react';
import { supabase } from '../../services/supabase';
import { ExerciseRecord } from '../../types';

interface ExerciseListProps {
  clientId: string;
  onSelectExercise: (exerciseId: string, exerciseName: string) => void;
}

interface ExerciseSummary {
  exercise_id: string;
  exercise_name: string;
  estimated_1rm: number | null;
  last_performance_date: string | null;
  total_records: number;
}

export const ExerciseList: React.FC<ExerciseListProps> = ({ clientId, onSelectExercise }) => {
  const [exercises, setExercises] = useState<ExerciseSummary[]>([]);
  const [filteredExercises, setFilteredExercises] = useState<ExerciseSummary[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadExercises();
  }, [clientId]);

  useEffect(() => {
    if (searchTerm.trim() === '') {
      setFilteredExercises(exercises);
    } else {
      const filtered = exercises.filter(ex =>
        ex.exercise_name.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredExercises(filtered);
    }
  }, [searchTerm, exercises]);

  const loadExercises = async () => {
    setIsLoading(true);
    try {
      // Récupérer tous les records avec les infos d'exercice
      const { data: records, error } = await supabase
        .from('client_exercise_records')
        .select(`
          *,
          exercise:exercises(id, name)
        `)
        .eq('client_id', clientId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Grouper par exercice et calculer les statistiques
      const exerciseMap = new Map<string, ExerciseSummary>();
      
      records?.forEach((record: any) => {
        const exerciseId = record.exercise_id;
        const exerciseName = record.exercise?.name || 'Exercice inconnu';
        
        if (!exerciseMap.has(exerciseId)) {
          exerciseMap.set(exerciseId, {
            exercise_id: exerciseId,
            exercise_name: exerciseName,
            estimated_1rm: record.estimated_1rm,
            last_performance_date: record.created_at,
            total_records: 1
          });
        } else {
          const existing = exerciseMap.get(exerciseId)!;
          existing.total_records++;
          // Garder le 1RM le plus élevé
          if (record.estimated_1rm && (!existing.estimated_1rm || record.estimated_1rm > existing.estimated_1rm)) {
            existing.estimated_1rm = record.estimated_1rm;
          }
          // Garder la date la plus récente
          if (record.created_at > existing.last_performance_date!) {
            existing.last_performance_date = record.created_at;
          }
        }
      });

      const exerciseList = Array.from(exerciseMap.values())
        .sort((a, b) => {
          // Trier par date décroissante
          if (!a.last_performance_date) return 1;
          if (!b.last_performance_date) return -1;
          return new Date(b.last_performance_date).getTime() - new Date(a.last_performance_date).getTime();
        });

      setExercises(exerciseList);
      setFilteredExercises(exerciseList);
    } catch (error) {
      console.error('Error loading exercises:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' });
  };

  return (
    <div className="space-y-4">
      {/* Barre de recherche */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Rechercher un exercice..."
          className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
        />
      </div>

      {/* Liste des exercices */}
      {isLoading ? (
        <div className="text-center py-8 text-gray-500">
          Chargement des exercices...
        </div>
      ) : filteredExercises.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          {searchTerm ? 'Aucun exercice trouvé' : 'Aucun exercice enregistré'}
        </div>
      ) : (
        <div className="space-y-2">
          {filteredExercises.map((exercise) => (
            <button
              key={exercise.exercise_id}
              onClick={() => onSelectExercise(exercise.exercise_id, exercise.exercise_name)}
              className="w-full flex items-center gap-4 p-4 bg-white border border-gray-100 rounded-xl hover:border-primary/30 hover:shadow-md transition-all group"
            >
              <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                <TrendingUp className="h-6 w-6 text-primary" />
              </div>
              
              <div className="flex-1 text-left">
                <div className="font-semibold text-gray-900 group-hover:text-primary transition-colors">
                  {exercise.exercise_name}
                </div>
                <div className="flex items-center gap-4 mt-1 text-sm text-gray-500">
                  <span className="flex items-center gap-1">
                    <TrendingUp className="h-3.5 w-3.5" />
                    1RM: {exercise.estimated_1rm ? `${Math.round(exercise.estimated_1rm)}kg` : 'N/A'}
                  </span>
                  <span className="flex items-center gap-1">
                    <Calendar className="h-3.5 w-3.5" />
                    {formatDate(exercise.last_performance_date)}
                  </span>
                  <span className="text-xs">
                    {exercise.total_records} perf{exercise.total_records > 1 ? 's' : ''}
                  </span>
                </div>
              </div>

              <ChevronRight className="h-5 w-5 text-gray-400 group-hover:text-primary transition-colors" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
