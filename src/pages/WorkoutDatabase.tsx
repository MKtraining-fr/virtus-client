import React, { useState, useMemo } from 'react';
import { Exercise } from '../types';
import Card from '../components/Card';
import Modal from '../components/Modal';
import Button from '../components/Button';
import Input from '../components/Input';
import Select from '../components/Select';
import { useAuth } from '../context/AuthContext';
import { archiveMultipleExercises } from '../services/exerciseArchiveService';
import { createExercise } from '../services/exerciseService';
import { uploadExerciseImage } from '../services/imageStorageService';

const EQUIPMENT_TYPES = [
  'Non spécifié',
  'Machine à charge libre',
  'Machine à charge guidée',
  'Barre olympique',
  'Haltères',
  'Poulie',
  'Poids du corps',
  'Autre',
];
const MUSCLE_GROUPS = [
  'Pectoraux',
  'Dos',
  'Épaules',
  'Biceps',
  'Triceps',
  'Avant-bras',
  'Quadriceps',
  'Ischio-jambiers',
  'Fessiers',
  'Mollets',
  'Abdominaux',
  'Lombaires',
  'Hanches',
  'Cardio',
];

const XMarkIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
    strokeWidth={1.5}
    stroke="currentColor"
    {...props}
  >
    {' '}
    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />{' '}
  </svg>
);
const TrashIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
    strokeWidth={1.5}
    stroke="currentColor"
    {...props}
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.134-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.067-2.09 1.02-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0"
    />
  </svg>
);
const ArchiveIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
    strokeWidth={1.5}
    stroke="currentColor"
    {...props}
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="m20.25 7.5-.625 10.632a2.25 2.25 0 0 1-2.247 2.118H6.622a2.25 2.25 0 0 1-2.247-2.118L3.75 7.5m8.25 3v6.75m0 0-3-3m3 3 3-3M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125Z"
    />
  </svg>
);
const CheckIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
    strokeWidth={1.5}
    stroke="currentColor"
    {...props}
  >
    <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
  </svg>
);

const initialNewExerciseState: Omit<Exercise, 'id'> = {
  name: '',
  category: 'Musculation',
  type: 'musculation',
  description: '',
  videoUrl: '',
  illustrationUrl: '',
  equipment: 'Non spécifié',
  alternativeIds: [],
  muscleGroups: [],
  secondaryMuscleGroups: [],
  coachId: '',
};

const WorkoutDatabase: React.FC = () => {
  const { user, exercises, setExercises } = useAuth();
  const [selectedExercise, setSelectedExercise] = useState<Exercise | null>(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [filter, setFilter] = useState('All');

  // State for the "add exercise" form
  const [newExercise, setNewExercise] = useState<Omit<Exercise, 'id'>>(initialNewExerciseState);
  const [illustrationPreview, setIllustrationPreview] = useState<string | null>(null);
  const [illustrationFile, setIllustrationFile] = useState<File | null>(null);
  const [isUploadingImage, setIsUploadingImage] = useState(false);

  const [alternativeSearch, setAlternativeSearch] = useState('');
  const [showAlternativeSuggestions, setShowAlternativeSuggestions] = useState(false);

  const [muscleGroupSearch, setMuscleGroupSearch] = useState('');
  const [showMuscleGroupSuggestions, setShowMuscleGroupSuggestions] = useState(false);

  const [secondaryMuscleGroupSearch, setSecondaryMuscleGroupSearch] = useState('');
  const [showSecondaryMuscleGroupSuggestions, setShowSecondaryMuscleGroupSuggestions] =
    useState(false);

  // State for bulk selection and actions
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedExerciseIds, setSelectedExerciseIds] = useState<string[]>([]);

  const handleCardClick = (exercise: Exercise) => {
    setSelectedExercise(exercise);
    setIsViewModalOpen(true);
  };

  const closeViewModal = () => {
    setIsViewModalOpen(false);
    setSelectedExercise(null);
  };

  const openAddModal = () => {
    setNewExercise(initialNewExerciseState);
    setIllustrationPreview(null);
    setAlternativeSearch('');
    setShowAlternativeSuggestions(false);
    setMuscleGroupSearch('');
    setShowMuscleGroupSuggestions(false);
    setIsAddModalOpen(true);
  };

  const closeAddModal = () => {
    setIsAddModalOpen(false);
    setNewExercise(initialNewExerciseState);
    setIllustrationPreview(null);
    setIllustrationFile(null);
  };

  const handleFormChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setNewExercise((prev) => ({ ...prev, [name]: value }));
  };

  // Fonction wrapper pour gérer les Select (signature différente)
  const handleSelectChange = (name: string) => (value: string | string[]) => {
    setNewExercise((prev) => ({ ...prev, [name]: value }));
  };

  const handleIllustrationChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Stocker le fichier pour l'upload ultérieur
      setIllustrationFile(file);
      
      // Créer un aperçu local
      const reader = new FileReader();
      reader.onloadend = () => {
        setIllustrationPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const addAlternative = (id: string) => {
    if (!newExercise.alternativeIds?.includes(id)) {
      setNewExercise((prev) => ({ ...prev, alternativeIds: [...(prev.alternativeIds || []), id] }));
    }
    setAlternativeSearch('');
    setShowAlternativeSuggestions(false);
  };

  const removeAlternative = (id: string) => {
    setNewExercise((prev) => ({
      ...prev,
      alternativeIds: prev.alternativeIds?.filter((altId) => altId !== id),
    }));
  };

  const addMuscleGroup = (group: string) => {
    if (!newExercise.muscleGroups?.includes(group)) {
      setNewExercise((prev) => ({ ...prev, muscleGroups: [...(prev.muscleGroups || []), group] }));
    }
    setMuscleGroupSearch('');
    setShowMuscleGroupSuggestions(false);
  };

  const removeMuscleGroup = (group: string) => {
    setNewExercise((prev) => ({
      ...prev,
      muscleGroups: prev.muscleGroups?.filter((g) => g !== group),
    }));
  };

  const addSecondaryMuscleGroup = (group: string) => {
    if (!newExercise.secondaryMuscleGroups?.includes(group)) {
      setNewExercise((prev) => ({
        ...prev,
        secondaryMuscleGroups: [...(prev.secondaryMuscleGroups || []), group],
      }));
    }
    setSecondaryMuscleGroupSearch('');
    setShowSecondaryMuscleGroupSuggestions(false);
  };

  const removeSecondaryMuscleGroup = (group: string) => {
    setNewExercise((prev) => ({
      ...prev,
      secondaryMuscleGroups: prev.secondaryMuscleGroups?.filter((g) => g !== group),
    }));
  };

  const handleAddExercise = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newExercise.name || newExercise.name.trim() === '') {
      alert("Le titre de l'exercice est obligatoire.");
      return;
    }

    if (!user?.id) {
      alert('Erreur : utilisateur non connecté.');
      return;
    }

    try {
      setIsUploadingImage(true);
      
      // Uploader l'image vers Supabase Storage si un fichier est sélectionné
      let imageUrl = newExercise.illustrationUrl || '';
      if (illustrationFile) {
        const uploadedUrl = await uploadExerciseImage(illustrationFile, newExercise.name);
        if (uploadedUrl) {
          imageUrl = uploadedUrl;
        } else {
          throw new Error('Erreur lors de l\'upload de l\'image');
        }
      }
      
      // Créer l'exercice dans Supabase avec l'URL de l'image
      const exerciseData = {
        ...newExercise,
        illustrationUrl: imageUrl,
      };
      
      const isAdmin = user.role === 'admin';
      const createdExercise = await createExercise(exerciseData, user.id, isAdmin);

      if (!createdExercise) {
        throw new Error('Erreur lors de la création de l\'exercice');
      }

      // Mettre à jour l'état local avec l'exercice créé
      setExercises([...exercises, createdExercise]);
      
      closeAddModal();
      alert('Exercice ajouté avec succès !');
    } catch (error: any) {
      console.error('Erreur lors de l\'ajout de l\'exercice:', error);
      alert(`Erreur : ${error.message || 'Impossible d\'ajouter l\'exercice'}`);
    } finally {
      setIsUploadingImage(false);
    }
  };

  const handleDeleteExercise = (e: React.MouseEvent, exerciseId: string) => {
    e.stopPropagation(); // Prevent modal from opening
    if (
      window.confirm(
        'Êtes-vous sûr de vouloir supprimer cet exercice ? Cette action est irréversible.'
      )
    ) {
      setExercises(exercises.filter((ex) => ex.id !== exerciseId));
    }
  };

  const toggleSelectionMode = () => {
    setSelectionMode(!selectionMode);
    setSelectedExerciseIds([]);
  };

  const toggleExerciseSelection = (exerciseId: string) => {
    setSelectedExerciseIds((prev) =>
      prev.includes(exerciseId) ? prev.filter((id) => id !== exerciseId) : [...prev, exerciseId]
    );
  };

  const selectAllExercises = () => {
    // Admin peut sélectionner tous les exercices, coach seulement les siens
    const selectableExercises = user?.role === 'admin' 
      ? filteredExercises 
      : filteredExercises.filter((ex) => ex.coachId === user?.id);
    setSelectedExerciseIds(selectableExercises.map((ex) => ex.id));
  };

  const deselectAllExercises = () => {
    setSelectedExerciseIds([]);
  };

  const handleBulkArchive = async () => {
    if (selectedExerciseIds.length === 0) return;

    const count = selectedExerciseIds.length;
    if (
      !window.confirm(
        `Êtes-vous sûr de vouloir archiver ${count} exercice(s) ? Ils seront marqués comme archivés et pourront être supprimés définitivement après 3 mois.`
      )
    ) {
      return;
    }

    if (!user?.id) {
      alert('Erreur : utilisateur non connecté.');
      return;
    }

    try {
      const result = await archiveMultipleExercises(selectedExerciseIds, user.id);

      if (result.success) {
        // Mettre à jour la liste locale des exercices
        setExercises(exercises.filter((ex) => !selectedExerciseIds.includes(ex.id)));
        alert(`${result.archivedCount} exercice(s) archivé(s) avec succès.`);
      } else {
        alert(
          `Archivage terminé avec des erreurs :\n${result.errors.join('\n')}\n\n${result.archivedCount} exercice(s) archivé(s) sur ${count}.`
        );
        // Mettre à jour la liste locale pour les exercices archivés avec succès
        setExercises(exercises.filter((ex) => !selectedExerciseIds.includes(ex.id)));
      }

      setSelectedExerciseIds([]);
      setSelectionMode(false);
    } catch (error: unknown) {
      const err = error instanceof Error ? error : new Error('Une erreur inconnue est survenue.');
      console.error('Error archiving exercises:', err);
      alert(`Erreur lors de l'archivage : ${err.message}`);
    }
  };

  const handleBulkDelete = () => {
    if (selectedExerciseIds.length === 0) return;

    const count = selectedExerciseIds.length;
    if (
      window.confirm(
        `Êtes-vous sûr de vouloir supprimer définitivement ${count} exercice(s) ? Cette action est irréversible.`
      )
    ) {
      setExercises(exercises.filter((ex) => !selectedExerciseIds.includes(ex.id)));
      setSelectedExerciseIds([]);
      setSelectionMode(false);
    }
  };

  const availableExercises = useMemo(() => {
    return exercises.filter(
      (ex) => ex.coachId === 'system' || ex.coachId === user?.id || !ex.coachId
    );
  }, [exercises, user]);

  const filteredExercises =
    filter === 'All' ? availableExercises : availableExercises.filter((e) => e.category === filter);

  const filteredAlternativeSuggestions = availableExercises.filter(
    (ex) =>
      ex.name.toLowerCase().includes(alternativeSearch.toLowerCase()) &&
      !newExercise.alternativeIds?.includes(ex.id) &&
      alternativeSearch.length > 0
  );

  const filteredMuscleGroupSuggestions = MUSCLE_GROUPS.filter(
    (g) =>
      g.toLowerCase().includes(muscleGroupSearch.toLowerCase()) &&
      !newExercise.muscleGroups?.includes(g) &&
      muscleGroupSearch.length > 0
  );

  const filteredSecondaryMuscleGroupSuggestions = MUSCLE_GROUPS.filter(
    (g) =>
      g.toLowerCase().includes(secondaryMuscleGroupSearch.toLowerCase()) &&
      !newExercise.secondaryMuscleGroups?.includes(g) &&
      secondaryMuscleGroupSearch.length > 0
  );

  const alternativeExercisesForModal = useMemo(() => {
    if (!selectedExercise?.alternativeIds) return [];
    return selectedExercise.alternativeIds
      .map((id) => exercises.find((ex) => ex.id === id))
      .filter((ex): ex is Exercise => !!ex);
  }, [selectedExercise, exercises]);

  const categories = ['All', 'Musculation', 'Mobilité', 'Échauffement'];

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-800">Base de données d'exercices</h1>
        <div className="flex gap-2">
          <Button variant="secondary" onClick={toggleSelectionMode}>
            {selectionMode ? 'Annuler la sélection' : 'Sélectionner'}
          </Button>
          <Button onClick={openAddModal}>Ajouter un exercice</Button>
        </div>
      </div>

      {/* Bulk Actions Bar */}
      {selectionMode && (
        <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg flex items-center justify-between">
          <div className="flex items-center gap-4">
            <span className="text-sm font-medium text-gray-700">
              {selectedExerciseIds.length} exercice(s) sélectionné(s)
            </span>
            <div className="flex gap-2">
              <button onClick={selectAllExercises} className="text-sm text-primary hover:underline">
                Tout sélectionner
              </button>
              <span className="text-gray-300">|</span>
              <button
                onClick={deselectAllExercises}
                className="text-sm text-primary hover:underline"
              >
                Tout désélectionner
              </button>
            </div>
          </div>
          <div className="flex gap-2">
            <Button
              variant="secondary"
              onClick={handleBulkArchive}
              disabled={selectedExerciseIds.length === 0}
            >
              <ArchiveIcon className="w-5 h-5 mr-2" />
              Archiver
            </Button>
            <Button
              variant="danger"
              onClick={handleBulkDelete}
              disabled={selectedExerciseIds.length === 0}
            >
              <TrashIcon className="w-5 h-5 mr-2" />
              Supprimer
            </Button>
          </div>
        </div>
      )}

      <div className="mb-6 flex space-x-2">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setFilter(cat)}
            className={`px-4 py-2 rounded-full text-sm font-semibold transition-colors ${filter === cat ? 'bg-primary text-white' : 'bg-white text-gray-700 hover:bg-gray-100'}`}
          >
            {cat === 'All' ? 'Tous' : cat}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {filteredExercises.map((exercise) => (
          <Card
            key={exercise.id}
            onClick={() =>
              selectionMode ? toggleExerciseSelection(exercise.id) : handleCardClick(exercise)
            }
            className={`flex flex-col relative group ${
              selectionMode && selectedExerciseIds.includes(exercise.id)
                ? 'ring-2 ring-primary bg-primary/5'
                : ''
            } ${
              selectionMode && user?.role !== 'admin' && user?.id !== exercise.coachId
                ? 'opacity-50 cursor-not-allowed'
                : 'cursor-pointer'
            }`}
          >
            {selectionMode && (user?.role === 'admin' || user?.id === exercise.coachId) && (
              <div
                className="absolute top-2 left-2 z-10"
                onClick={(e) => {
                  e.stopPropagation();
                  toggleExerciseSelection(exercise.id);
                }}
              >
                <div
                  className={`w-6 h-6 rounded border-2 flex items-center justify-center transition-colors ${
                    selectedExerciseIds.includes(exercise.id)
                      ? 'bg-primary border-primary'
                      : 'bg-white border-gray-300'
                  }`}
                >
                  {selectedExerciseIds.includes(exercise.id) && (
                    <CheckIcon className="w-4 h-4 text-white" />
                  )}
                </div>
              </div>
            )}
            {!selectionMode && (user?.role === 'admin' || user?.id === exercise.coachId) && (
              <button
                onClick={(e) => handleDeleteExercise(e, exercise.id)}
                className="absolute top-2 right-2 z-10 p-1.5 bg-white/70 rounded-full text-gray-500 hover:bg-red-500 hover:text-white transition-colors opacity-0 group-hover:opacity-100"
                title="Supprimer l'exercice"
              >
                <TrashIcon className="w-5 h-5" />
              </button>
            )}
            <img
              src={exercise.illustrationUrl}
              alt={exercise.name}
              className="w-full h-40 object-contain bg-gray-100"
            />
            <div className="p-4 flex flex-col flex-grow">
              <h3 className="font-bold text-lg">{exercise.name}</h3>
              <p
                className="text-sm text-gray-600 my-2 flex-grow min-h-[40px]"
                title={exercise.description}
              >
                {exercise.description.length > 80
                  ? `${exercise.description.substring(0, 77)}...`
                  : exercise.description}
              </p>
              <div className="mt-auto border-t border-gray-200 pt-2 text-xs space-y-1 text-gray-500">
                <p>
                  <strong>Équipement:</strong> {exercise.equipment || 'N/A'}
                </p>
                <p>
                  <strong>Groupes Musculaires:</strong> {exercise.muscleGroups?.join(', ') || 'N/A'}
                </p>
                <p>
                  <strong>Alternatives:</strong>{' '}
                  {exercise.alternativeIds && exercise.alternativeIds.length > 0
                    ? exercise.alternativeIds
                        .map((id) => exercises.find((e) => e.id === id)?.name)
                        .filter(Boolean)
                        .join(', ')
                    : 'Aucune'}
                </p>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* View Exercise Modal */}
      {selectedExercise && (
        <Modal isOpen={isViewModalOpen} onClose={closeViewModal} title={selectedExercise.name}>
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
                  <h4 className="font-semibold text-lg mb-2 text-gray-800">
                    Groupes Musculaires Principaux
                  </h4>
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

              {selectedExercise.secondaryMuscleGroups &&
                selectedExercise.secondaryMuscleGroups.length > 0 && (
                  <div>
                    <h4 className="font-semibold text-lg mb-2 text-gray-800">
                      Groupes Musculaires Secondaires
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {selectedExercise.secondaryMuscleGroups.map((group) => (
                        <span
                          key={group}
                          className="bg-blue-100 text-blue-700 text-sm font-medium px-3 py-1 rounded-full"
                        >
                          {group}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

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

      {/* Add Exercise Modal */}
      <Modal isOpen={isAddModalOpen} onClose={closeAddModal} title="Ajouter un nouvel exercice">
        <form onSubmit={handleAddExercise} className="space-y-4">
          <Input
            label="Titre de l'exercice"
            name="name"
            value={newExercise.name}
            onChange={handleFormChange}
            required
          />
          <Input
            label="Lien vidéo YouTube (embed)"
            name="videoUrl"
            value={newExercise.videoUrl}
            onChange={handleFormChange}
            placeholder="https://www.youtube.com/embed/..."
          />

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Illustration</label>
            <input
              type="file"
              accept="image/*"
              onChange={handleIllustrationChange}
              className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-violet-50 file:text-primary hover:file:bg-violet-100"
            />
            {illustrationPreview && (
              <img
                src={illustrationPreview}
                alt="Aperçu"
                className="mt-2 w-32 h-32 object-cover rounded-lg"
              />
            )}
          </div>

          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <textarea
              id="description"
              name="description"
              value={newExercise.description}
              onChange={handleFormChange}
              rows={3}
              className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
            ></textarea>
          </div>

          <Select
            label="Type d'équipement"
            name="equipment"
            value={newExercise.equipment}
            onChange={handleSelectChange('equipment')}
          >
            {EQUIPMENT_TYPES.map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </Select>

          <Select
            label="Type d'exercice"
            name="type"
            value={newExercise.type}
            onChange={handleSelectChange('type')}
          >
            <option value="musculation">Musculation</option>
            <option value="mobilite">Mobilité</option>
            <option value="echauffement">Échauffement</option>
          </Select>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Groupes musculaires principaux
            </label>
            <div className="relative">
              <Input
                placeholder="Rechercher un groupe musculaire..."
                value={muscleGroupSearch}
                onChange={(e) => setMuscleGroupSearch(e.target.value)}
                onFocus={() => setShowMuscleGroupSuggestions(true)}
                onBlur={() => setTimeout(() => setShowMuscleGroupSuggestions(false), 200)}
              />
              {showMuscleGroupSuggestions && filteredMuscleGroupSuggestions.length > 0 && (
                <div className="absolute z-20 w-full bg-white border border-gray-300 rounded-lg mt-1 max-h-40 overflow-y-auto shadow-lg">
                  {filteredMuscleGroupSuggestions.map((group) => (
                    <div
                      key={group}
                      onMouseDown={() => addMuscleGroup(group)}
                      className="p-2 hover:bg-gray-100 cursor-pointer"
                    >
                      {group}
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div className="flex flex-wrap gap-2 mt-2">
              {newExercise.muscleGroups?.map((group) => (
                <span
                  key={group}
                  className="flex items-center bg-primary/10 text-primary text-sm font-medium px-2 py-1 rounded-full"
                >
                  {group}
                  <button
                    type="button"
                    onClick={() => removeMuscleGroup(group)}
                    className="ml-2 text-primary hover:text-red-500"
                  >
                    <XMarkIcon className="w-4 h-4" />
                  </button>
                </span>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Groupes musculaires secondaires
            </label>
            <div className="relative">
              <Input
                placeholder="Rechercher un groupe musculaire secondaire..."
                value={secondaryMuscleGroupSearch}
                onChange={(e) => setSecondaryMuscleGroupSearch(e.target.value)}
                onFocus={() => setShowSecondaryMuscleGroupSuggestions(true)}
                onBlur={() => setTimeout(() => setShowSecondaryMuscleGroupSuggestions(false), 200)}
              />
              {showSecondaryMuscleGroupSuggestions &&
                filteredSecondaryMuscleGroupSuggestions.length > 0 && (
                  <div className="absolute z-20 w-full bg-white border border-gray-300 rounded-lg mt-1 max-h-40 overflow-y-auto shadow-lg">
                    {filteredSecondaryMuscleGroupSuggestions.map((group) => (
                      <div
                        key={group}
                        onMouseDown={() => addSecondaryMuscleGroup(group)}
                        className="p-2 hover:bg-gray-100 cursor-pointer"
                      >
                        {group}
                      </div>
                    ))}
                  </div>
                )}
            </div>
            <div className="flex flex-wrap gap-2 mt-2">
              {newExercise.secondaryMuscleGroups?.map((group) => (
                <span
                  key={group}
                  className="flex items-center bg-blue-100 text-blue-700 text-sm font-medium px-2 py-1 rounded-full"
                >
                  {group}
                  <button
                    type="button"
                    onClick={() => removeSecondaryMuscleGroup(group)}
                    className="ml-2 text-blue-700 hover:text-red-500"
                  >
                    <XMarkIcon className="w-4 h-4" />
                  </button>
                </span>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Mouvements alternatifs
            </label>
            <div className="relative">
              <Input
                placeholder="Rechercher un exercice..."
                value={alternativeSearch}
                onChange={(e) => setAlternativeSearch(e.target.value)}
                onFocus={() => setShowAlternativeSuggestions(true)}
                onBlur={() => setTimeout(() => setShowAlternativeSuggestions(false), 200)}
              />
              {showAlternativeSuggestions && filteredAlternativeSuggestions.length > 0 && (
                <div className="absolute z-20 w-full bg-white border border-gray-300 rounded-lg mt-1 max-h-40 overflow-y-auto shadow-lg">
                  {filteredAlternativeSuggestions.map((ex) => (
                    <div
                      key={ex.id}
                      onMouseDown={() => addAlternative(ex.id)}
                      className="p-2 hover:bg-gray-100 cursor-pointer"
                    >
                      {ex.name}
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div className="flex flex-wrap gap-2 mt-2">
              {newExercise.alternativeIds?.map((id) => {
                const altEx = exercises.find((e) => e.id === id);
                if (!altEx) return null;
                return (
                  <span
                    key={id}
                    className="flex items-center bg-primary/10 text-primary text-sm font-medium px-2 py-1 rounded-full"
                  >
                    {altEx.name}
                    <button
                      type="button"
                      onClick={() => removeAlternative(id)}
                      className="ml-2 text-primary hover:text-red-500"
                    >
                      <XMarkIcon className="w-4 h-4" />
                    </button>
                  </span>
                );
              })}
            </div>
          </div>

          <div className="flex justify-end pt-4 space-x-2">
            <Button type="button" variant="secondary" onClick={closeAddModal}>
              Annuler
            </Button>
            <Button type="submit" disabled={isUploadingImage}>
              {isUploadingImage ? 'Upload en cours...' : "Enregistrer l'exercice"}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default WorkoutDatabase;
