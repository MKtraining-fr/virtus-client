import React, { useState, useRef, useEffect } from 'react';
import { X, Video, Upload, Check, Play, Square } from 'lucide-react';

interface VideoModalProps {
  isOpen: boolean;
  onClose: () => void;
  setNumber: number;
  onVideoSelected: (videoFile: File) => void;
}

/**
 * Modale pour enregistrer ou uploader une vidéo pour une série
 * La vidéo est liée à la série active
 */
const VideoModal: React.FC<VideoModalProps> = ({
  isOpen,
  onClose,
  setNumber,
  onVideoSelected,
}) => {
  const [cameraReady, setCameraReady] = useState(false); // Caméra activée mais pas encore en enregistrement
  const [isRecording, setIsRecording] = useState(false);
  const [recordedVideo, setRecordedVideo] = useState<Blob | null>(null);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const videoPreviewRef = useRef<HTMLVideoElement>(null);

  // Activer la caméra pour prévisualisation
  const handleActivateCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'user' }, 
        audio: true 
      });
      streamRef.current = stream;

      // Afficher le flux dans la vidéo de prévisualisation
      if (videoPreviewRef.current) {
        videoPreviewRef.current.srcObject = stream;
      }

      setCameraReady(true);
    } catch (error) {
      console.error('Erreur accès caméra:', error);
      alert('Impossible d\'accéder à la caméra. Vérifiez les permissions.');
    }
  };

  // Démarrer l'enregistrement
  const handleStartRecording = () => {
    if (!streamRef.current) return;

    const mediaRecorder = new MediaRecorder(streamRef.current);
    mediaRecorderRef.current = mediaRecorder;

    const chunks: Blob[] = [];
    mediaRecorder.ondataavailable = (e) => chunks.push(e.data);
    mediaRecorder.onstop = () => {
      const blob = new Blob(chunks, { type: 'video/webm' });
      setRecordedVideo(blob);
      
      // Arrêter la caméra
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
      setCameraReady(false);
    };

    mediaRecorder.start();
    setIsRecording(true);
  };

  // Arrêter l'enregistrement
  const handleStopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  // Annuler la prévisualisation caméra
  const handleCancelCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
    }
    setCameraReady(false);
    setIsRecording(false);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type.startsWith('video/')) {
      setUploadedFile(file);
    } else {
      alert('Veuillez sélectionner un fichier vidéo valide.');
    }
  };

  const handleConfirm = () => {
    if (recordedVideo) {
      const file = new File([recordedVideo], `set-${setNumber}-${Date.now()}.webm`, { type: 'video/webm' });
      onVideoSelected(file);
    } else if (uploadedFile) {
      onVideoSelected(uploadedFile);
    }
    handleClose();
  };

  const handleClose = () => {
    // Nettoyer les ressources
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
    }
    setCameraReady(false);
    setIsRecording(false);
    setRecordedVideo(null);
    setUploadedFile(null);
    onClose();
  };

  // Nettoyer la caméra quand la modale se ferme
  useEffect(() => {
    if (!isOpen) {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
      setCameraReady(false);
      setIsRecording(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 animate-fadeIn"
        onClick={handleClose}
      />

      {/* Modal */}
      <div className="fixed inset-x-0 bottom-0 z-50 animate-slideUp">
        <div className="bg-zinc-950 border-t border-zinc-800 rounded-t-3xl shadow-2xl max-h-[70vh] flex flex-col">
          {/* Header */}
          <div className="flex-none border-b border-zinc-800/50 px-4 py-3 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-black uppercase tracking-tight">Vidéo - Série {setNumber}</h2>
              <p className="text-xs text-zinc-400">
                {cameraReady 
                  ? (isRecording ? 'Enregistrement en cours' : 'Prévisualisation caméra')
                  : 'Enregistrer ou télécharger'
                }
              </p>
            </div>
            <button
              onClick={handleClose}
              className="p-2 hover:bg-zinc-800 rounded-lg transition-colors active:scale-95"
            >
              <X size={20} className="text-zinc-400" />
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {/* Étape 1 : Choix initial */}
            {!cameraReady && !recordedVideo && !uploadedFile && (
              <>
                <button
                  onClick={handleActivateCamera}
                  className="w-full p-4 rounded-xl border bg-zinc-900 border-zinc-800 hover:bg-zinc-800 transition-all active:scale-98"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-3 rounded-full bg-violet-500/20">
                      <Video size={24} className="text-violet-400" />
                    </div>
                    <div className="flex-1 text-left">
                      <div className="font-black text-base">🎥 Enregistrer maintenant</div>
                      <div className="text-xs text-zinc-400">Capturer une vidéo en direct</div>
                    </div>
                  </div>
                </button>

                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full p-4 rounded-xl border bg-zinc-900 border-zinc-800 hover:bg-zinc-800 transition-all active:scale-98"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-3 rounded-full bg-blue-500/20">
                      <Upload size={24} className="text-blue-400" />
                    </div>
                    <div className="flex-1 text-left">
                      <div className="font-black text-base">📁 Télécharger une vidéo</div>
                      <div className="text-xs text-zinc-400">Choisir depuis vos fichiers</div>
                    </div>
                  </div>
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="video/*"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </>
            )}

            {/* Étape 2 : Prévisualisation caméra + Contrôles d'enregistrement */}
            {cameraReady && !recordedVideo && (
              <>
                {/* Prévisualisation vidéo */}
                <div className="relative rounded-xl overflow-hidden bg-black aspect-video">
                  <video
                    ref={videoPreviewRef}
                    autoPlay
                    playsInline
                    muted
                    className="w-full h-full object-cover"
                  />
                  {isRecording && (
                    <div className="absolute top-4 left-4 flex items-center gap-2 bg-red-500/90 backdrop-blur-md rounded-full px-3 py-1.5">
                      <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
                      <span className="text-xs font-black text-white uppercase">REC</span>
                    </div>
                  )}
                </div>

                {/* Contrôles */}
                <div className="flex gap-3">
                  {!isRecording ? (
                    <>
                      <button
                        onClick={handleCancelCamera}
                        className="flex-1 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-white font-black py-3 rounded-xl transition-all active:scale-98"
                      >
                        Annuler
                      </button>
                      <button
                        onClick={handleStartRecording}
                        className="flex-1 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white font-black py-3 rounded-xl transition-all active:scale-98 shadow-lg shadow-red-500/20 flex items-center justify-center gap-2"
                      >
                        <Play size={20} fill="white" />
                        Démarrer
                      </button>
                    </>
                  ) : (
                    <button
                      onClick={handleStopRecording}
                      className="w-full bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white font-black py-3 rounded-xl transition-all active:scale-98 shadow-lg shadow-red-500/20 flex items-center justify-center gap-2"
                    >
                      <Square size={20} fill="white" />
                      Arrêter l'enregistrement
                    </button>
                  )}
                </div>
              </>
            )}

            {/* Confirmation vidéo enregistrée */}
            {recordedVideo && (
              <div className="bg-gradient-to-br from-green-500/10 to-emerald-500/10 border border-green-500/30 rounded-xl p-4">
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-2 rounded-full bg-green-500/20">
                    <Check size={20} className="text-green-400" />
                  </div>
                  <div>
                    <div className="font-black text-sm">Vidéo enregistrée</div>
                    <div className="text-xs text-zinc-400">Prête à être sauvegardée</div>
                  </div>
                </div>
              </div>
            )}

            {/* Confirmation vidéo uploadée */}
            {uploadedFile && (
              <div className="bg-gradient-to-br from-blue-500/10 to-cyan-500/10 border border-blue-500/30 rounded-xl p-4">
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-2 rounded-full bg-blue-500/20">
                    <Check size={20} className="text-blue-400" />
                  </div>
                  <div>
                    <div className="font-black text-sm">Vidéo sélectionnée</div>
                    <div className="text-xs text-zinc-400">{uploadedFile.name}</div>
                  </div>
                </div>
              </div>
            )}

            {/* Info */}
            {!cameraReady && (
              <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-3">
                <p className="text-xs text-zinc-400 leading-relaxed">
                  💡 La vidéo sera liée à la série {setNumber}. Vous pourrez la revoir plus tard dans l'historique.
                </p>
              </div>
            )}
          </div>

          {/* Footer */}
          {(recordedVideo || uploadedFile) && (
            <div className="flex-none border-t border-zinc-800/50 p-4 flex gap-3">
              <button
                onClick={handleClose}
                className="flex-1 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-white font-black py-3 rounded-xl transition-all active:scale-98"
              >
                Annuler
              </button>
              <button
                onClick={handleConfirm}
                className="flex-1 bg-gradient-to-r from-violet-500 to-purple-500 hover:from-violet-600 hover:to-purple-600 text-white font-black py-3 rounded-xl transition-all active:scale-98 shadow-lg shadow-violet-500/20"
              >
                Confirmer
              </button>
            </div>
          )}

          {!recordedVideo && !uploadedFile && !cameraReady && (
            <div className="flex-none border-t border-zinc-800/50 p-4">
              <button
                onClick={handleClose}
                className="w-full bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-white font-black py-3 rounded-xl transition-all active:scale-98"
              >
                Annuler
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Animations */}
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes slideUp {
          from { transform: translateY(100%); }
          to { transform: translateY(0); }
        }
        .animate-fadeIn {
          animation: fadeIn 0.2s ease-out;
        }
        .animate-slideUp {
          animation: slideUp 0.3s ease-out;
        }
      `}</style>
    </>
  );
};

export default VideoModal;
