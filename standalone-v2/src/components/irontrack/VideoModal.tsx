import React, { useState, useRef } from 'react';
import { X, Video, Upload, Check } from 'lucide-react';

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
  const [isRecording, setIsRecording] = useState(false);
  const [recordedVideo, setRecordedVideo] = useState<Blob | null>(null);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const handleStartRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'user' }, 
        audio: true 
      });
      streamRef.current = stream;

      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;

      const chunks: Blob[] = [];
      mediaRecorder.ondataavailable = (e) => chunks.push(e.data);
      mediaRecorder.onstop = () => {
        const blob = new Blob(chunks, { type: 'video/webm' });
        setRecordedVideo(blob);
        
        // Arrêter la caméra
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (error) {
      console.error('Erreur accès caméra:', error);
      alert('Impossible d\'accéder à la caméra. Vérifiez les permissions.');
    }
  };

  const handleStopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
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
    setIsRecording(false);
    setRecordedVideo(null);
    setUploadedFile(null);
    onClose();
  };

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
              <p className="text-xs text-zinc-400">Enregistrer ou télécharger</p>
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
            {/* Option 1 : Enregistrer */}
            {!recordedVideo && !uploadedFile && (
              <>
                <button
                  onClick={isRecording ? handleStopRecording : handleStartRecording}
                  className={`w-full p-4 rounded-xl border transition-all active:scale-98 ${
                    isRecording
                      ? 'bg-red-500/10 border-red-500/30 hover:bg-red-500/20'
                      : 'bg-zinc-900 border-zinc-800 hover:bg-zinc-800'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`p-3 rounded-full ${
                      isRecording ? 'bg-red-500/20' : 'bg-violet-500/20'
                    }`}>
                      <Video size={24} className={isRecording ? 'text-red-400' : 'text-violet-400'} />
                    </div>
                    <div className="flex-1 text-left">
                      <div className="font-black text-base">
                        {isRecording ? '⏹ Arrêter l\'enregistrement' : '🎥 Enregistrer maintenant'}
                      </div>
                      <div className="text-xs text-zinc-400">
                        {isRecording ? 'Cliquez pour arrêter' : 'Capturer une vidéo en direct'}
                      </div>
                    </div>
                  </div>
                  {isRecording && (
                    <div className="mt-3 flex items-center justify-center gap-2">
                      <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse" />
                      <span className="text-sm text-red-400 font-semibold">Enregistrement en cours...</span>
                    </div>
                  )}
                </button>

                {/* Option 2 : Upload */}
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full p-4 rounded-xl border bg-zinc-900 border-zinc-800 hover:bg-zinc-800 transition-all active:scale-98"
                  disabled={isRecording}
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
            <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-3">
              <p className="text-xs text-zinc-400 leading-relaxed">
                💡 La vidéo sera liée à la série {setNumber}. Vous pourrez la revoir plus tard dans l'historique.
              </p>
            </div>
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

          {!recordedVideo && !uploadedFile && (
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
