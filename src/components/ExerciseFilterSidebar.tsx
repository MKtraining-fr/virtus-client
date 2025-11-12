import React, { useState, useMemo } from 'react';
import Card from './Card.tsx';
import Input from './Input.tsx';
import { Exercise } from '../types.ts';
import FilterChip from './FilterChip.tsx';

interface ExerciseFilterSidebarProps {
  db: Exercise[];
  onDropExercise?: (exercise: Exercise) => void;
}

const ExerciseFilterSidebar: React.FC<ExerciseFilterSidebarProps> = ({ db }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedEquipments, setSelectedEquipments] = useState<string[]>([]);
  const [selectedMuscleGroups, setSelectedMuscleGroups] = useState<string[]>([]);

  const equipmentTypes = useMemo(
    () => Array.from(new Set(db.map((e) => e.equipment).filter(Boolean))),
    [db]
  ) as string[];
  const muscleGroups = useMemo(
    () => Array.from(new Set(db.flatMap((e) => e.muscleGroups).filter(Boolean))),
    [db]
  ) as string[];

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

  const DEFAULT_ILLUSTRATION =
    'https://img.gymvisual.com/illustrations/1749/male-Bodyweight-Squat.png';

  return (
    <Card className="flex h-full flex-col rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
      <h2 className="mb-4 text-lg font-semibold text-gray-900">Filtres</h2>
      <Input
        placeholder="Rechercher un mouvement"
        className="mb-4 rounded-xl"
        aria-label="Rechercher un mouvement"
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
      />

      {equipmentTypes.length > 0 && (
        <div className="mb-5">
          <h3 className="mb-2 text-sm font-semibold text-gray-700">Types d'équipement</h3>
          <div className="flex flex-wrap gap-2">
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
        <div className="mb-5">
          <h3 className="mb-2 text-sm font-semibold text-gray-700">Groupes musculaires</h3>
          <div className="flex flex-wrap gap-2">
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

      <hr className="my-4 border-gray-200" />

      <h3 className="mb-3 text-sm font-semibold text-gray-700">
        Résultats ({filteredResults.length})
      </h3>
      <div className="flex-grow space-y-3 overflow-y-auto pr-2">
        {filteredResults.map((ex) => (
          <div
            key={ex.id}
            className="group flex cursor-grab items-center gap-3 rounded-xl border border-gray-100 p-3 hover:border-primary/30 hover:bg-primary/5"
            draggable
            onDragStart={(e) => handleDragStart(e, ex)}
          >
            <img
              src={ex.illustrationUrl || DEFAULT_ILLUSTRATION}
              alt={ex.name}
              className="h-16 w-16 flex-shrink-0 rounded-lg border border-gray-200 bg-white object-contain"
            />
            <p className="flex-grow font-medium text-gray-800 transition-colors group-hover:text-primary">
              {ex.name}
            </p>
          </div>
        ))}
      </div>
    </Card>
  );
};

export default ExerciseFilterSidebar;
