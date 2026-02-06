import React, { useState, useRef } from 'react';
import { Camera, Upload, Video, X } from 'lucide-react';
import { Modal, Button, Badge } from '../ui';

interface VideoModalProps {
  isOpen: boolean;
  onClose: () => void;
  setNumber: number;
  onVideoSelected: (videoFile: File) => void;
}

const VideoModal: React.FC<VideoModalProps> = ({
  isOpen,
  onClose,
  setNumber,
  onVideoSelected,
}) => {
  const [selectedVideo, setSelectedVideo] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type.startsWith('video/')) {
      setSelectedVideo(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const handleSave = () => {
    if (selectedVideo) {
      onVideoSelected(selectedVideo);
      onClose();
      // Cleanup
      setSelectedVideo(null);
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
        setPreviewUrl(null);
      }
    }
  };

  const handleRemoveVideo = () => {
    setSelectedVideo(null);
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
      setPreviewUrl(null);
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleClose = () => {
    handleRemoveVideo();
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={`Vidéo - Série ${setNumber}`}
      size="lg"
      footer={
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleClose} fullWidth>
            Annuler
          </Button>
          <Button 
            variant="primary" 
            onClick={handleSave} 
            disabled={!selectedVideo}
            fullWidth
          >
            Enregistrer
          </Button>
        </div>
      }
    >
      <div className="space-y-4">
        <div className="flex items-center gap-2 text-text-secondary dark:text-text-secondary text-sm">
          <Video size={16} />
          <p>Filmez votre série pour analyser votre technique</p>
        </div>

        {/* Zone de sélection de fichier */}
        {!selectedVideo ? (
          <div
            onClick={() => fileInputRef.current?.click()}
            className="border-2 border-dashed border-border dark:border-border rounded-lg p-8 text-center cursor-pointer hover:border-brand-500 hover:bg-bg-hover dark:hover:bg-bg-hover transition-colors"
          >
            <div className="flex flex-col items-center gap-3">
              <div className="p-4 rounded-full bg-brand-500/10">
                <Camera size={32} className="text-brand-500" />
              </div>
              <div>
                <p className="text-text-primary dark:text-text-primary font-medium mb-1">
                  Sélectionner une vidéo
                </p>
                <p className="text-text-tertiary dark:text-text-tertiary text-sm">
                  MP4, MOV, AVI jusqu'à 100MB
                </p>
              </div>
              <Badge variant="info" icon={<Upload size={14} />}>
                Cliquez pour parcourir
              </Badge>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            {/* Aperçu vidéo */}
            <div className="relative rounded-lg overflow-hidden bg-black">
              <video
                src={previewUrl || undefined}
                controls
                className="w-full max-h-64"
              />
              <button
                onClick={handleRemoveVideo}
                className="absolute top-2 right-2 p-2 rounded-full bg-black/60 hover:bg-black/80 transition-colors"
              >
                <X size={20} className="text-white" />
              </button>
            </div>

            {/* Infos fichier */}
            <div className="flex items-center justify-between p-3 bg-bg-secondary dark:bg-bg-secondary rounded-lg">
              <div className="flex items-center gap-2">
                <Video size={16} className="text-brand-500" />
                <div>
                  <p className="text-text-primary dark:text-text-primary text-sm font-medium">
                    {selectedVideo.name}
                  </p>
                  <p className="text-text-tertiary dark:text-text-tertiary text-xs">
                    {(selectedVideo.size / (1024 * 1024)).toFixed(2)} MB
                  </p>
                </div>
              </div>
              <Badge variant="success">Prêt</Badge>
            </div>
          </div>
        )}

        <input
          ref={fileInputRef}
          type="file"
          accept="video/*"
          onChange={handleFileSelect}
          className="hidden"
        />

        {/* Conseils */}
        <div className="bg-blue-600/10 border border-blue-600/30 rounded-lg p-3">
          <p className="text-blue-400 text-xs font-medium mb-1">💡 Conseil</p>
          <p className="text-text-tertiary dark:text-text-tertiary text-xs">
            Filmez-vous de profil pour mieux analyser votre technique et votre amplitude de mouvement
          </p>
        </div>
      </div>
    </Modal>
  );
};

export default VideoModal;
