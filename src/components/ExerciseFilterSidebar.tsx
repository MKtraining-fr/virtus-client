import React, { useState, useMemo } from 'react';
import Card from './Card.tsx';
import Input from './Input.tsx';
import { Exercise } from '../types.ts';
import FilterChip from './FilterChip.tsx';

interface ExerciseFilterSidebarProps {
  db: Exercise[];
  onDropExercise?: (exercise: Exercise) => void;
}

const ExerciseFilterSidebar: React.FC<ExerciseFilterSidebarProps> = ({ db, onDropExercise }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedEquipments, setSelectedEquipments] = useState<string[]>([]);
  const [selectedMuscleGroups, setSelectedMuscleGroups] = useState<string[]>([]);

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
    e.dataTransfer.setData('application/json', JSON.stringify(exercise));
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

      return matchesSearch && matchesEquipment && matchesMuscleGroups;
    });
  }, [db, searchTerm, selectedEquipments, selectedMuscleGroups]);

  // Image par défaut locale ou data URI pour éviter les erreurs réseau
  const DEFAULT_ILLUSTRATION =
    'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 100 100"%3E%3Crect fill="%23f3f4f6" width="100" height="100"/%3E%3Ctext x="50" y="50" font-family="Arial" font-size="14" fill="%239ca3af" text-anchor="middle" dominant-baseline="middle"%3EExercice%3C/text%3E%3C/svg%3E';

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

      {db.length === 0 && (
        <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
          <p className="text-sm text-yellow-800">
            Aucun exercice chargé. Veuillez vérifier votre connexion à la base de données.
          </p>
        </div>
      )}

      {equipmentTypes.length > 0 && (
        <div className="mb-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
          <h3 className="text-xs font-semibold uppercase tracking-wide mb-1 text-gray-700">
            Types d'équipement
          </h3>
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
        </div>
      )}

      {muscleGroups.length > 0 && (
        <div className="mb-3 p-3 bg-indigo-50 rounded-lg border border-indigo-200">
          <h3 className="text-xs font-semibold uppercase tracking-wide mb-1 text-gray-700">
            Groupes musculaires
          </h3>
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
            className="cursor-grab group flex items-center gap-3 p-2 rounded-lg hover:bg-gray-100"
            draggable
            onDragStart={(e) => handleDragStart(e, ex)}
          >
            <img
              src={ex.illustrationUrl || DEFAULT_ILLUSTRATION}
              alt={ex.name}
              className="w-16 h-16 object-contain rounded-md bg-white border border-gray-200 flex-shrink-0"
            />
            <p className="font-semibold text-gray-800 group-hover:text-primary flex-grow">
              {ex.name}
            </p>
          </div>
        ))}
      </div>
    </Card>
  );
};

export default ExerciseFilterSidebar;
