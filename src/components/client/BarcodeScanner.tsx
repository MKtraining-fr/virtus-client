import React, { useEffect, useRef, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { X, Camera, FlipHorizontal, Loader2 } from 'lucide-react';

interface BarcodeScannerProps {
  isOpen: boolean;
  onClose: () => void;
  onScan: (barcode: string) => void;
}

const BarcodeScanner: React.FC<BarcodeScannerProps> = ({ isOpen, onClose, onScan }) => {
  const [isScanning, setIsScanning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen && !isScanning) {
      startScanner();
    }

    return () => {
      stopScanner();
    };
  }, [isOpen, facingMode]);

  const startScanner = async () => {
    if (!containerRef.current) return;

    try {
      setError(null);
      setIsScanning(true);

      // Créer une nouvelle instance du scanner
      const scanner = new Html5Qrcode('barcode-scanner-container');
      scannerRef.current = scanner;

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
          // console.log('Scan en cours...', errorMessage);
        }
      );
    } catch (err: any) {
      console.error('Erreur lors du démarrage du scanner:', err);
      setIsScanning(false);
      
      if (err.message?.includes('Permission denied') || err.name === 'NotAllowedError') {
        setError('Accès à la caméra refusé. Veuillez autoriser l\'accès à la caméra dans les paramètres de votre navigateur.');
      } else if (err.message?.includes('NotFoundError') || err.name === 'NotFoundError') {
        setError('Aucune caméra trouvée sur cet appareil.');
      } else {
        setError('Impossible de démarrer le scanner. Vérifiez que votre appareil dispose d\'une caméra.');
      }
    }
  };

  const stopScanner = async () => {
    if (scannerRef.current) {
      try {
        await scannerRef.current.stop();
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

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80">
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

          {/* Loading state */}
          {!isScanning && !error && (
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
                <p className="text-red-400 mb-4">{error}</p>
                <button
                  onClick={startScanner}
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
    </div>
  );
};

export default BarcodeScanner;
