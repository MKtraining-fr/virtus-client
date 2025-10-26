import React, { useState, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Exercise } from '../../../types';
import Input from '../../../components/Input';
import Button from '../../../components/Button';
import ClientAccordion from '../../../components/client/ClientAccordion';
import InteractiveBodyDiagram from '../../../components/client/InteractiveBodyDiagram';
import Modal from '../../../components/Modal';
import { useAuth } from '../../../context/AuthContext';
import Card from '../../../components/Card';
import { ArrowLeftIcon } from '../../../constants/icons';
import FilterChip from '../../../components/FilterChip';

interface ExerciseListPageProps {
  title: string;
  exercises: Exercise[];
  children?: React.ReactNode;
}

const ExerciseListPage: React.FC<ExerciseListPageProps> = ({ title, exercises, children }) => {
  const navigate = useNavigate();
  const { exercises: allExercises } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [activeFilters, setActiveFilters] = useState<{
    equipments: string[];
    muscleGroups: string[];
  }>({ equipments: [], muscleGroups: [] });

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedExercise, setSelectedExercise] = useState<Exercise | null>(null);

  const equipmentTypes = useMemo(
    () => Array.from(new Set(exercises.map((e) => e.equipment).filter(Boolean))),
    [exercises]
  ) as string[];
  const muscleGroups = useMemo(
    () => Array.from(new Set(exercises.flatMap((e) => e.muscleGroups).filter(Boolean))),
    [exercises]
  ) as string[];

  const filteredExercises = useMemo(() => {
    return exercises.filter((ex) => {
      const matchesSearch = !searchTerm || ex.name.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesEquipment =
        activeFilters.equipments.length === 0 ||
        (ex.equipment && activeFilters.equipments.includes(ex.equipment));
      const matchesMuscleGroups =
        activeFilters.muscleGroups.length === 0 ||
        (ex.muscleGroups &&
          activeFilters.muscleGroups.some((smg) => ex.muscleGroups!.includes(smg)));
      return matchesSearch && matchesEquipment && matchesMuscleGroups;
    });
  }, [exercises, searchTerm, activeFilters]);

  const toggleSelection = useCallback((item: string, type: 'equipments' | 'muscleGroups') => {
    setActiveFilters((prev) => ({
      ...prev,
      [type]: prev[type].includes(item)
        ? prev[type].filter((i) => i !== item)
        : [...prev[type], item],
    }));
  }, []);

  const handleResetFilters = useCallback(() => {
    setActiveFilters({ equipments: [], muscleGroups: [] });
  }, []);

  const handleCardClick = (exercise: Exercise) => {
    setSelectedExercise(exercise);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
  };

  const alternativeExercisesForModal = useMemo(() => {
    if (!selectedExercise?.alternativeIds) return [];
    return selectedExercise.alternativeIds
      .map((id) => allExercises.find((ex) => ex.id === id))
      .filter((ex): ex is Exercise => !!ex);
  }, [selectedExercise, allExercises]);

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate(-1)}
          className="p-2 bg-white dark:bg-client-card rounded-full text-gray-800 dark:text-client-light hover:bg-gray-100 dark:hover:bg-primary/20 border border-gray-300 dark:border-gray-700"
        >
          <ArrowLeftIcon className="w-5 h-5" />
        </button>
        <h1 className="text-xl font-bold text-gray-900 dark:text-client-light">{title}</h1>
      </div>

      <Input
        type="text"
        placeholder="Rechercher un exercice..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
      />

      <ClientAccordion title="Filtres">
        <div className="space-y-6">
          <InteractiveBodyDiagram
            selectedGroups={activeFilters.muscleGroups}
            onToggleGroup={(group) => toggleSelection(group, 'muscleGroups')}
          />

          {equipmentTypes.length > 0 && (
            <div>
              <h3 className="font-semibold mb-3 text-gray-900 dark:text-client-light">
                Équipement
              </h3>
              <div className="flex flex-wrap gap-2">
                {equipmentTypes.map((type) => (
                  <FilterChip
                    key={type}
                    label={type}
                    selected={activeFilters.equipments.includes(type)}
                    onClick={() => toggleSelection(type, 'equipments')}
                  />
                ))}
              </div>
            </div>
          )}

          {muscleGroups.length > 0 && (
            <div>
              <h3 className="font-semibold mb-3 text-gray-900 dark:text-client-light">
                Groupes musculaires
              </h3>
              <div className="flex flex-wrap gap-2">
                {muscleGroups.map((group) => (
                  <FilterChip
                    key={group}
                    label={group}
                    selected={activeFilters.muscleGroups.includes(group)}
                    onClick={() => toggleSelection(group, 'muscleGroups')}
                  />
                ))}
              </div>
            </div>
          )}

          <div className="flex justify-end pt-4">
            <Button variant="secondary" onClick={handleResetFilters}>
              Réinitialiser
            </Button>
          </div>
        </div>
      </ClientAccordion>

      <div className="space-y-3">
        {filteredExercises.map((exercise) => (
          <div
            key={exercise.id}
            className="bg-white dark:bg-client-card rounded-lg p-3 flex items-center gap-4 cursor-pointer hover:bg-gray-50 dark:hover:bg-primary/20 transition-colors border border-gray-200 dark:border-transparent"
            onClick={() => handleCardClick(exercise)}
          >
            <img
              src={exercise.illustrationUrl}
              alt={exercise.name}
              className="w-16 h-16 object-contain rounded-md bg-white flex-shrink-0"
            />
            <div className="flex-grow">
              <p className="font-semibold text-gray-900 dark:text-client-light">{exercise.name}</p>
              <p className="text-xs text-gray-500 dark:text-client-subtle">
                {exercise.muscleGroups?.join(', ')}
              </p>
            </div>
          </div>
        ))}
        {filteredExercises.length === 0 && (
          <p className="text-center text-gray-500 dark:text-client-subtle py-8">
            Aucun exercice ne correspond à votre recherche.
          </p>
        )}
      </div>

      {selectedExercise && (
        <Modal isOpen={isModalOpen} onClose={closeModal} title={selectedExercise.name}>
          <div className="space-y-6">
            {selectedExercise.videoUrl ? (
              <div className="aspect-w-16 aspect-h-9">
                <iframe
                  src={selectedExercise.videoUrl}
                  title={selectedExercise.name}
                  frameBorder="0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  className="w-full h-full rounded-lg"
                ></iframe>
              </div>
            ) : (
              <img
                src={selectedExercise.illustrationUrl}
                alt={selectedExercise.name}
                className="w-full h-auto object-contain rounded-lg bg-gray-100"
              />
            )}

            <div className="space-y-4">
              <div>
                <h4 className="font-semibold text-lg mb-1 text-gray-800">Description</h4>
                <p className="text-gray-600">
                  {selectedExercise.description || 'Aucune description.'}
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h4 className="font-semibold text-lg mb-2 text-gray-800">Équipement</h4>
                  <p className="text-gray-600">{selectedExercise.equipment}</p>
                </div>
                <div>
                  <h4 className="font-semibold text-lg mb-2 text-gray-800">Groupes Musculaires</h4>
                  {selectedExercise.muscleGroups && selectedExercise.muscleGroups.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {selectedExercise.muscleGroups.map((group) => (
                        <span
                          key={group}
                          className="bg-primary/10 text-primary text-sm font-medium px-3 py-1 rounded-full"
                        >
                          {group}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-500">Non spécifié.</p>
                  )}
                </div>
              </div>

              <div>
                <h4 className="font-semibold text-lg mb-2 text-gray-800">Mouvements Alternatifs</h4>
                {alternativeExercisesForModal.length > 0 ? (
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {alternativeExercisesForModal.map((alt) => (
                      <Card
                        key={alt.id}
                        className="!shadow-none border hover:border-primary transition-colors cursor-pointer"
                        onClick={() => handleCardClick(alt)}
                      >
                        <img
                          src={alt.illustrationUrl}
                          alt={alt.name}
                          className="w-full h-24 object-contain bg-gray-50 rounded-t-lg"
                        />
                        <p className="p-2 text-sm font-semibold text-center text-gray-800">
                          {alt.name}
                        </p>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500">Aucun mouvement alternatif suggéré.</p>
                )}
              </div>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default ExerciseListPage;
