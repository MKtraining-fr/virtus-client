import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Html5Qrcode } from 'html5-qrcode';
import { X, Camera, FlipHorizontal, Loader2 } from 'lucide-react';

interface BarcodeScannerProps {
  isOpen: boolean;
  onClose: () => void;
  onScan: (barcode: string) => void;
}

const BarcodeScanner: React.FC<BarcodeScannerProps> = ({ isOpen, onClose, onScan }) => {
  const [isScanning, setIsScanning] = useState(false);
  const [isRequestingPermission, setIsRequestingPermission] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');
  const [container, setContainer] = useState<HTMLElement | null>(null);
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Initialiser le container pour le portail
  useEffect(() => {
    const modalRoot = document.getElementById('modal-root');
    setContainer(modalRoot);
  }, []);

  useEffect(() => {
    if (isOpen && container) {
      // Demander la permission de la caméra d'abord
      requestCameraPermission();
    }

    return () => {
      stopScanner();
    };
  }, [isOpen, container]);

  // Redémarrer le scanner quand on change de caméra
  useEffect(() => {
    if (isOpen && container && !isRequestingPermission && !error) {
      const timer = setTimeout(() => {
        startScanner();
      }, 200);
      return () => clearTimeout(timer);
    }
  }, [facingMode]);

  const requestCameraPermission = async () => {
    setIsRequestingPermission(true);
    setError(null);

    try {
      // Demander explicitement la permission de la caméra
      console.log('Demande de permission caméra...');
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'environment' } 
      });
      
      // Arrêter le stream immédiatement (on veut juste la permission)
      stream.getTracks().forEach(track => track.stop());
      
      console.log('Permission accordée, démarrage du scanner...');
      setIsRequestingPermission(false);
      
      // Petit délai pour s'assurer que le DOM est prêt
      setTimeout(() => {
        startScanner();
      }, 200);
      
    } catch (err: any) {
      console.error('Erreur de permission caméra:', err);
      setIsRequestingPermission(false);
      
      if (err.name === 'NotAllowedError' || err.message?.includes('Permission denied')) {
        setError('Accès à la caméra refusé. Veuillez autoriser l\'accès à la caméra dans les paramètres de votre navigateur, puis réessayez.');
      } else if (err.name === 'NotFoundError') {
        setError('Aucune caméra trouvée sur cet appareil.');
      } else if (err.name === 'NotReadableError') {
        setError('La caméra est utilisée par une autre application. Fermez les autres applications utilisant la caméra et réessayez.');
      } else if (err.name === 'OverconstrainedError') {
        setError('La caméra demandée n\'est pas disponible. Essayez de changer de caméra.');
      } else if (err.name === 'SecurityError') {
        setError('L\'accès à la caméra n\'est pas autorisé sur ce site. Vérifiez que vous utilisez HTTPS.');
      } else {
        setError(`Erreur d'accès à la caméra: ${err.message || err.name || 'Erreur inconnue'}`);
      }
    }
  };

  const startScanner = async () => {
    // Arrêter le scanner existant s'il y en a un
    await stopScanner();

    const scannerContainer = document.getElementById('barcode-scanner-container');
    if (!scannerContainer) {
      console.error('Scanner container not found');
      setError('Erreur: conteneur du scanner non trouvé. Veuillez réessayer.');
      return;
    }

    try {
      setError(null);
      setIsScanning(true);

      console.log('Création du scanner html5-qrcode...');
      
      // Créer une nouvelle instance du scanner
      const scanner = new Html5Qrcode('barcode-scanner-container');
      scannerRef.current = scanner;

      console.log('Démarrage du scanner avec facingMode:', facingMode);

      await scanner.start(
        { facingMode },
        {
          fps: 10,
          qrbox: { width: 250, height: 150 },
          aspectRatio: 1.0,
        },
        (decodedText) => {
          // Code-barres détecté
          console.log('Code-barres scanné:', decodedText);
          onScan(decodedText);
          stopScanner();
          onClose();
        },
        (errorMessage) => {
          // Ignorer les erreurs de scan continues (pas de code-barres trouvé)
        }
      );
      
      console.log('Scanner démarré avec succès');
      
    } catch (err: any) {
      console.error('Erreur lors du démarrage du scanner:', err);
      setIsScanning(false);
      
      if (err.message?.includes('Permission denied') || err.name === 'NotAllowedError') {
        setError('Accès à la caméra refusé. Veuillez autoriser l\'accès à la caméra dans les paramètres de votre navigateur.');
      } else if (err.message?.includes('NotFoundError') || err.name === 'NotFoundError') {
        setError('Aucune caméra trouvée sur cet appareil.');
      } else if (err.message?.includes('already running')) {
        // Le scanner est déjà en cours, ignorer
        console.log('Scanner déjà en cours');
      } else {
        setError(`Erreur du scanner: ${err.message || 'Erreur inconnue'}. Vérifiez que votre appareil dispose d\'une caméra.`);
      }
    }
  };

  const stopScanner = async () => {
    if (scannerRef.current) {
      try {
        const state = scannerRef.current.getState();
        if (state === 2) { // SCANNING
          await scannerRef.current.stop();
        }
        scannerRef.current.clear();
      } catch (err) {
        console.error('Erreur lors de l\'arrêt du scanner:', err);
      }
      scannerRef.current = null;
    }
    setIsScanning(false);
  };

  const toggleCamera = async () => {
    await stopScanner();
    setFacingMode(prev => prev === 'environment' ? 'user' : 'environment');
  };

  const handleClose = async () => {
    await stopScanner();
    onClose();
  };

  const handleRetry = () => {
    setError(null);
    requestCameraPermission();
  };

  // Ne pas rendre si pas ouvert ou pas de container
  if (!isOpen || !container) return null;

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90">
      <div className="relative w-full max-w-md mx-4 bg-gray-900 rounded-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-700">
          <h3 className="text-lg font-semibold text-white flex items-center gap-2">
            <Camera className="w-5 h-5" />
            Scanner un code-barres
          </h3>
          <button
            onClick={handleClose}
            className="p-2 rounded-full hover:bg-gray-700 transition-colors"
          >
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        {/* Scanner Container */}
        <div className="relative">
          <div 
            id="barcode-scanner-container" 
            ref={containerRef}
            className="w-full aspect-square bg-black"
          />
          
          {/* Overlay avec guide de scan */}
          {isScanning && (
            <div className="absolute inset-0 pointer-events-none">
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-64 h-40 border-2 border-green-500 rounded-lg relative">
                  <div className="absolute -top-1 -left-1 w-6 h-6 border-t-4 border-l-4 border-green-500 rounded-tl-lg" />
                  <div className="absolute -top-1 -right-1 w-6 h-6 border-t-4 border-r-4 border-green-500 rounded-tr-lg" />
                  <div className="absolute -bottom-1 -left-1 w-6 h-6 border-b-4 border-l-4 border-green-500 rounded-bl-lg" />
                  <div className="absolute -bottom-1 -right-1 w-6 h-6 border-b-4 border-r-4 border-green-500 rounded-br-lg" />
                  
                  {/* Ligne de scan animée */}
                  <div className="absolute left-2 right-2 h-0.5 bg-green-500 animate-pulse top-1/2 -translate-y-1/2" />
                </div>
              </div>
            </div>
          )}

          {/* Loading state - Demande de permission */}
          {isRequestingPermission && (
            <div className="absolute inset-0 flex items-center justify-center bg-black">
              <div className="text-center text-white p-4">
                <Loader2 className="w-8 h-8 animate-spin mx-auto mb-2" />
                <p className="font-medium">Demande d'accès à la caméra...</p>
                <p className="text-sm text-gray-400 mt-2">Veuillez autoriser l'accès à la caméra dans la popup du navigateur</p>
              </div>
            </div>
          )}

          {/* Loading state - Initialisation du scanner */}
          {!isScanning && !error && !isRequestingPermission && (
            <div className="absolute inset-0 flex items-center justify-center bg-black">
              <div className="text-center text-white">
                <Loader2 className="w-8 h-8 animate-spin mx-auto mb-2" />
                <p>Initialisation de la caméra...</p>
              </div>
            </div>
          )}

          {/* Error state */}
          {error && (
            <div className="absolute inset-0 flex items-center justify-center bg-black p-6">
              <div className="text-center text-white">
                <p className="text-red-400 mb-4 text-sm">{error}</p>
                <button
                  onClick={handleRetry}
                  className="px-4 py-2 bg-green-600 rounded-lg hover:bg-green-700 transition-colors"
                >
                  Réessayer
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer avec contrôles */}
        <div className="p-4 border-t border-gray-700">
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-400">
              Placez le code-barres dans le cadre
            </p>
            <button
              onClick={toggleCamera}
              className="p-2 rounded-full bg-gray-700 hover:bg-gray-600 transition-colors"
              title="Changer de caméra"
            >
              <FlipHorizontal className="w-5 h-5 text-white" />
            </button>
          </div>
        </div>
      </div>
    </div>,
    container
  );
};

export default BarcodeScanner;
