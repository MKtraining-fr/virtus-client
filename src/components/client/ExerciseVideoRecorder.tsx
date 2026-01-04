import React, { useState, useRef } from 'react';
import Button from '../Button';
import { uploadExerciseVideo } from '../../services/exerciseVideoService';
import { VIDEO_CONFIG } from '../../constants/videoConfig';

interface ExerciseVideoRecorderProps {
  clientId: string;
  coachId: string;
  performanceId: string;
  exerciseName: string;
  setIndex: number;
  onUploadSuccess: (videoUrl: string, videoId: string) => void;
  onUploadError: (error: string) => void;
  onCancel: () => void;
}

const ExerciseVideoRecorder: React.FC<ExerciseVideoRecorderProps> = ({
  clientId,
  coachId,
  performanceId,
  exerciseName,
  setIndex,
  onUploadSuccess,
  onUploadError,
  onCancel
}) => {
  const [isRecording, setIsRecording] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [videoBlob, setVideoBlob] = useState<Blob | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const videoRef = useRef<HTMLVideoElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  const startRecording = async () => {
    try {
      setError(null);
      let stream: MediaStream | null = null;
      
      // Essayer d'abord avec la caméra arrière
      try {
        stream = await navigator.mediaDevices.getUserMedia({ 
          video: { 
            width: { ideal: 1920 },
            height: { ideal: 1080 },
            facingMode: { ideal: 'environment' }
          }, 
          audio: false 
        });
      } catch (err) {
        console.log('Caméra arrière non disponible, utilisation de la caméra avant');
        // Fallback vers la caméra avant ou n'importe quelle caméra disponible
        stream = await navigator.mediaDevices.getUserMedia({ 
          video: { 
            width: { ideal: 1920 },
            height: { ideal: 1080 }
          }, 
          audio: false 
        });
      }
      
      if (!stream) {
        throw new Error('Impossible d\'obtenir le flux vidéo');
      }

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }

      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'video/webm;codecs=vp8'
      });

      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'video/webm' });
        setVideoBlob(blob);
        setPreviewUrl(URL.createObjectURL(blob));

        // Arrêter le stream
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (error) {
      console.error('Erreur démarrage enregistrement:', error);
      setError('Impossible d\'accéder à la caméra. Vérifiez les permissions.');
      onUploadError('Impossible d\'accéder à la caméra');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setError(null);
      
      // Validation
      if (file.size > VIDEO_CONFIG.MAX_SIZE_MB * 1024 * 1024) {
        const errorMsg = `La vidéo dépasse ${VIDEO_CONFIG.MAX_SIZE_MB} MB`;
        setError(errorMsg);
        onUploadError(errorMsg);
        return;
      }

      if (!VIDEO_CONFIG.ACCEPTED_MIME_TYPES.includes(file.type)) {
        const errorMsg = 'Format non accepté. Utilisez MP4, MOV ou WEBM.';
        setError(errorMsg);
        onUploadError(errorMsg);
        return;
      }

      setVideoBlob(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const handleUpload = async () => {
    if (!videoBlob) return;

    setIsUploading(true);
    setUploadProgress(0);
    setError(null);

    const file = new File([videoBlob], `${exerciseName}_${Date.now()}.webm`, {
      type: videoBlob.type
    });

    const result = await uploadExerciseVideo(
      clientId,
      coachId,
      performanceId,
      exerciseName,
      setIndex,
      file,
      (progress) => setUploadProgress(progress)
    );

    setIsUploading(false);

    if (result) {
      onUploadSuccess(result.videoUrl, result.videoId);
      // Réinitialiser
      setVideoBlob(null);
      setPreviewUrl(null);
    } else {
      const errorMsg = 'Erreur lors de l\'upload de la vidéo';
      setError(errorMsg);
      onUploadError(errorMsg);
    }
  };

  const handleCancelPreview = () => {
    setVideoBlob(null);
    setPreviewUrl(null);
    setUploadProgress(0);
    setError(null);
  };

  return (
    <div className="bg-white dark:bg-client-card rounded-lg shadow-lg p-6 max-w-2xl mx-auto">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-client-light">
          📹 Enregistrer une vidéo - {exerciseName}
        </h3>
        <button
          onClick={onCancel}
          className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
        >
          ✕
        </button>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
          {error}
        </div>
      )}

      {!previewUrl && !isUploading && (
        <div className="space-y-4">
          {/* Prévisualisation caméra - toujours visible pour debug */}
          <div className="relative">
            <video
              ref={videoRef}
              className="w-full rounded-lg bg-black min-h-[300px]"
              autoPlay
              muted
              playsInline
            />
            {isRecording && (
              <div className="absolute top-2 right-2 bg-red-500 text-white px-3 py-1 rounded-full text-sm font-semibold animate-pulse flex items-center gap-2">
                <span className="w-2 h-2 bg-white rounded-full"></span>
                REC
              </div>
            )}
          </div>

          {/* Boutons d'action */}
          <div className="flex gap-2 flex-wrap">
            {!isRecording ? (
              <>
                <Button onClick={startRecording} variant="primary">
                  📹 Filmer
                </Button>
                <label className="cursor-pointer">
                  <input
                    type="file"
                    accept="video/*"
                    onChange={handleFileSelect}
                    className="hidden"
                  />
                  <Button variant="secondary" as="span">
                    📂 Choisir un fichier
                  </Button>
                </label>
                <Button onClick={onCancel} variant="secondary">
                  Annuler
                </Button>
              </>
            ) : (
              <Button onClick={stopRecording} variant="danger">
                ⏹️ Arrêter l'enregistrement
              </Button>
            )}
          </div>

          <div className="text-xs text-gray-500 dark:text-gray-400 space-y-1">
            <p>• Taille maximale : {VIDEO_CONFIG.MAX_SIZE_MB} MB</p>
            <p>• Formats acceptés : MP4, MOV, WEBM</p>
            <p>• Durée recommandée : moins de 3 minutes</p>
          </div>
        </div>
      )}

      {/* Prévisualisation et upload */}
      {previewUrl && !isUploading && (
        <div className="space-y-4">
          <video
            src={previewUrl}
            controls
            className="w-full rounded-lg bg-black"
          />
          <div className="flex gap-2">
            <Button onClick={handleUpload} variant="primary" className="flex-1">
              ⬆️ Envoyer au coach
            </Button>
            <Button onClick={handleCancelPreview} variant="secondary">
              🔄 Refaire
            </Button>
          </div>
        </div>
      )}

      {/* Barre de progression */}
      {isUploading && (
        <div className="space-y-3">
          <div className="w-full bg-gray-200 rounded-full h-4 overflow-hidden">
            <div
              className="bg-primary h-4 rounded-full transition-all duration-300 flex items-center justify-center text-xs text-white font-semibold"
              style={{ width: `${uploadProgress}%` }}
            >
              {uploadProgress > 10 && `${uploadProgress}%`}
            </div>
          </div>
          <p className="text-center text-sm text-gray-600 dark:text-gray-400">
            Upload en cours... {uploadProgress}%
          </p>
          <div className="flex justify-center">
            <svg
              className="animate-spin h-8 w-8 text-primary"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              ></circle>
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              ></path>
            </svg>
          </div>
        </div>
      )}
    </div>
  );
};

export default ExerciseVideoRecorder;
