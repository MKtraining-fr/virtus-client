import React from 'react';
import ExerciseVideoRecorder from './ExerciseVideoRecorder';

interface ExerciseVideoModalProps {
  isOpen: boolean;
  clientId: string;
  coachId: string;
  performanceId: string;
  exerciseName: string;
  setIndex: number;
  onClose: () => void;
  onSuccess: (videoUrl: string, videoId: string) => void;
}

const ExerciseVideoModal: React.FC<ExerciseVideoModalProps> = ({
  isOpen,
  clientId,
  coachId,
  performanceId,
  exerciseName,
  setIndex,
  onClose,
  onSuccess
}) => {
  if (!isOpen) return null;

  const handleSuccess = (videoUrl: string, videoId: string) => {
    onSuccess(videoUrl, videoId);
    onClose();
  };

  const handleError = (error: string) => {
    console.error('Erreur upload vidéo:', error);
    // L'erreur est déjà affichée dans le composant ExerciseVideoRecorder
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="w-full max-w-3xl max-h-[90vh] overflow-y-auto">
        <ExerciseVideoRecorder
          clientId={clientId}
          coachId={coachId}
          performanceId={performanceId}
          exerciseName={exerciseName}
          setIndex={setIndex}
          onUploadSuccess={handleSuccess}
          onUploadError={handleError}
          onCancel={onClose}
        />
      </div>
    </div>
  );
};

export default ExerciseVideoModal;
