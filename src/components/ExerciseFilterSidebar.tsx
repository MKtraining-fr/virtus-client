import React, { useState, useMemo } from 'react';
import Card from './Card.tsx';
import Input from './Input.tsx';
import { Exercise } from '../types.ts';
import FilterChip from './FilterChip.tsx';
import { useFavorites } from '../hooks/useFavorites';
import { useAuthStore } from '../stores/useAuthStore';
import { StarIcon } from '@heroicons/react/24/outline';
import { StarIcon as StarIconSolid } from '@heroicons/react/24/solid';

interface ExerciseFilterSidebarProps {
  db: Exercise[];
  onDropExercise?: (exercise: Exercise) => void;
}

const ExerciseFilterSidebar: React.FC<ExerciseFilterSidebarProps> = ({ db, onDropExercise }) => {
  const { user } = useAuthStore();
  const { favorites, isFavorite, toggleFavorite, isLoading: favoritesLoading } = useFavorites(user?.id, 'exercise');
  
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedEquipments, setSelectedEquipments] = useState<string[]>([]);
  const [selectedMuscleGroups, setSelectedMuscleGroups] = useState<string[]>([]);
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);
  const [isEquipmentOpen, setIsEquipmentOpen] = useState(true);
  const [isMuscleGroupOpen, setIsMuscleGroupOpen] = useState(true);

  // Log de débogage pour vérifier que les exercices sont bien chargés
  React.useEffect(() => {
    console.log('[ExerciseFilterSidebar] Exercices chargés:', db.length);
    console.log('[ExerciseFilterSidebar] Premiers exercices:', db.slice(0, 3));
  }, [db]);

  const equipmentTypes = useMemo(() => {
    const types = Array.from(new Set(db.map((e) => e.equipment).filter(Boolean)));
    console.log('[ExerciseFilterSidebar] Équipements extraits:', types);
    return types;
  }, [db]) as string[];
  
  const muscleGroups = useMemo(() => {
    const groups = Array.from(new Set(db.flatMap((e) => e.muscleGroups).filter(Boolean)));
    console.log('[ExerciseFilterSidebar] Groupes musculaires extraits:', groups);
    return groups;
  }, [db]) as string[];

  const toggleSelection = (
    item: string,
    setter: React.Dispatch<React.SetStateAction<string[]>>
  ) => {
    setter((prev) => (prev.includes(item) ? prev.filter((i) => i !== item) : [...prev, item]));
  };

  const handleDragStart = (e: React.DragEvent<HTMLDivElement>, exercise: Exercise) => {
    e.dataTransfer.effectAllowed = 'copy';
    e.dataTransfer.setData('application/json', JSON.stringify(exercise));
    // Ajouter un feedback visuel
    if (e.currentTarget) {
      e.currentTarget.style.opacity = '0.5';
    }
  };

  const handleDragEnd = (e: React.DragEvent<HTMLDivElement>) => {
    // Restaurer l'opacité
    if (e.currentTarget) {
      e.currentTarget.style.opacity = '1';
    }
  };

  const handleToggleFavorite = async (e: React.MouseEvent, exerciseId: string) => {
    e.stopPropagation();
    e.preventDefault();
    try {
      await toggleFavorite(exerciseId);
    } catch (err) {
      console.error('[ExerciseFilterSidebar] Erreur lors du toggle favori:', err);
    }
  };

  const filteredResults = useMemo(() => {
    return db.filter((ex) => {
      const matchesSearch = ex.name.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesEquipment =
        selectedEquipments.length === 0 ||
        (ex.equipment && selectedEquipments.includes(ex.equipment));
      const matchesMuscleGroups =
        selectedMuscleGroups.length === 0 ||
        (ex.muscleGroups && selectedMuscleGroups.some((smg) => ex.muscleGroups!.includes(smg)));
      const matchesFavorites = !showFavoritesOnly || isFavorite(ex.id);

      return matchesSearch && matchesEquipment && matchesMuscleGroups && matchesFavorites;
    });
  }, [db, searchTerm, selectedEquipments, selectedMuscleGroups, showFavoritesOnly, isFavorite]);

  // Image par défaut locale ou data URI pour éviter les erreurs réseau
  const DEFAULT_ILLUSTRATION =
    'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 100 100"%3E%3Crect fill="%23f3f4f6" width="100" height="100"/%3E%3Ctext x="50" y="50" font-family="Arial" font-size="14" fill="%239ca3af" text-anchor="middle" dominant-baseline="middle"%3EExercice%3C/text%3E%3C/svg%3E';

  const favoritesCount = useMemo(() => {
    return db.filter((ex) => isFavorite(ex.id)).length;
  }, [db, isFavorite]);

  return (
    <Card className="p-4 h-full flex flex-col min-h-0 text-sm">
      <div className="mb-3 p-3 bg-purple-50 rounded-lg border border-purple-200">
        <h2 className="text-base font-semibold mb-1">Filtres</h2>
      </div>
      <Input
        placeholder="Rechercher un mouvement"
        className="mb-4"
        aria-label="Rechercher un mouvement"
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
      />

      {/* Filtre Favoris */}
      <div className="mb-3 p-3 bg-yellow-50 rounded-lg border border-yellow-200">
        <button
          type="button"
          onClick={() => setShowFavoritesOnly(!showFavoritesOnly)}
          className={`flex items-center gap-2 w-full text-left ${
            showFavoritesOnly ? 'text-yellow-700 font-semibold' : 'text-gray-700'
          }`}
        >
          {showFavoritesOnly ? (
            <StarIconSolid className="w-5 h-5 text-yellow-500" />
          ) : (
            <StarIcon className="w-5 h-5 text-yellow-500" />
          )}
          <span>Favoris uniquement ({favoritesCount})</span>
        </button>
      </div>

      {db.length === 0 && (
        <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
          <p className="text-sm text-yellow-800">
            Aucun exercice chargé. Veuillez vérifier votre connexion à la base de données.
          </p>
        </div>
      )}

      {equipmentTypes.length > 0 && (
        <div className="mb-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
          <div className="flex items-center justify-between mb-1 gap-2">
            <h3 className="text-xs font-semibold uppercase tracking-wide text-gray-700">
              Types d'équipement
            </h3>
            <button
              type="button"
              className="text-[11px] font-medium text-blue-700 hover:text-blue-900"
              aria-expanded={isEquipmentOpen}
              onClick={() => setIsEquipmentOpen((prev) => !prev)}
            >
              {isEquipmentOpen ? 'Masquer' : 'Afficher'}
            </button>
          </div>
          {isEquipmentOpen && (
            <div className="flex flex-wrap gap-2 max-h-28 overflow-y-auto pr-1">
              {equipmentTypes.map((type) => (
                <FilterChip
                  key={type}
                  label={type}
                  selected={selectedEquipments.includes(type)}
                  onClick={() => toggleSelection(type, setSelectedEquipments)}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {muscleGroups.length > 0 && (
        <div className="mb-3 p-3 bg-indigo-50 rounded-lg border border-indigo-200">
          <div className="flex items-center justify-between mb-1 gap-2">
            <h3 className="text-xs font-semibold uppercase tracking-wide text-gray-700">
              Groupes musculaires
            </h3>
            <button
              type="button"
              className="text-[11px] font-medium text-indigo-700 hover:text-indigo-900"
              aria-expanded={isMuscleGroupOpen}
              onClick={() => setIsMuscleGroupOpen((prev) => !prev)}
            >
              {isMuscleGroupOpen ? 'Masquer' : 'Afficher'}
            </button>
          </div>
          {isMuscleGroupOpen && (
            <div className="flex flex-wrap gap-2 max-h-28 overflow-y-auto pr-1">
              {muscleGroups.map((part) => (
                <FilterChip
                  key={part}
                  label={part}
                  selected={selectedMuscleGroups.includes(part)}
                  onClick={() => toggleSelection(part, setSelectedMuscleGroups)}
                />
              ))}
            </div>
          )}
        </div>
      )}

      <hr className="my-4" />

      <div className="p-3 bg-green-50 rounded-lg border border-green-200">
        <h3 className="text-xs font-semibold uppercase tracking-wide mb-1 text-gray-700">
          Résultats ({filteredResults.length})
        </h3>
      </div>
      <div className="space-y-3 overflow-y-auto flex-grow pr-2 mt-2 min-h-0">
        {filteredResults.map((ex) => (
          <div
            key={ex.id}
            className="cursor-grab active:cursor-grabbing group flex items-center gap-3 p-2 rounded-lg hover:bg-gray-100 transition-opacity"
            draggable
            onDragStart={(e) => handleDragStart(e, ex)}
            onDragEnd={(e) => handleDragEnd(e)}
          >
            <img
              src={ex.illustrationUrl || DEFAULT_ILLUSTRATION}
              alt={ex.name}
              className="w-16 h-16 object-contain rounded-md bg-white border border-gray-200 flex-shrink-0"
            />
            <p className="font-semibold text-gray-800 group-hover:text-primary flex-grow">
              {ex.name}
            </p>
            <button
              type="button"
              onClick={(e) => handleToggleFavorite(e, ex.id)}
              className="p-1 rounded-full hover:bg-yellow-100 transition-colors flex-shrink-0"
              aria-label={isFavorite(ex.id) ? 'Retirer des favoris' : 'Ajouter aux favoris'}
              disabled={favoritesLoading}
            >
              {isFavorite(ex.id) ? (
                <StarIconSolid className="w-5 h-5 text-yellow-500" />
              ) : (
                <StarIcon className="w-5 h-5 text-gray-400 group-hover:text-yellow-500" />
              )}
            </button>
          </div>
        ))}
      </div>
    </Card>
  );
};

export default ExerciseFilterSidebar;
