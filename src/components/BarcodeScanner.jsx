import { useState, useEffect } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { X, Camera, Keyboard } from 'lucide-react';

const BarcodeScanner = ({ isOpen, onClose, onScan }) => {
  const [isScanning, setIsScanning] = useState(false);
  const [manualInput, setManualInput] = useState('');
  const [showManualInput, setShowManualInput] = useState(false);
  const [error, setError] = useState(null);

  let html5QrCode = null;

  useEffect(() => {
    if (isOpen && !showManualInput) {
      startScanner();
    }

    return () => {
      stopScanner();
    };
  }, [isOpen, showManualInput]);

  const startScanner = async () => {
    try {
      setError(null);
      setIsScanning(true);

      html5QrCode = new Html5Qrcode('barcode-reader');

      const config = {
        fps: 10,
        qrbox: { width: 250, height: 250 },
        aspectRatio: 1.0
      };

      await html5QrCode.start(
        { facingMode: 'environment' }, // Caméra arrière
        config,
        (decodedText) => {
          // Code-barres scanné avec succès
          console.log('✅ Code-barres scanné:', decodedText);
          onScan(decodedText);
          stopScanner();
          onClose();
        },
        (errorMessage) => {
          // Erreur de scan (normale, arrive souvent)
          // On ne fait rien ici pour éviter trop de logs
        }
      );
    } catch (err) {
      console.error('❌ Erreur démarrage scanner:', err);
      setError('Impossible d\'accéder à la caméra. Utilisez la saisie manuelle.');
      setIsScanning(false);
    }
  };

  const stopScanner = async () => {
    try {
      if (html5QrCode && html5QrCode.isScanning) {
        await html5QrCode.stop();
        html5QrCode.clear();
      }
      setIsScanning(false);
    } catch (err) {
      console.error('❌ Erreur arrêt scanner:', err);
    }
  };

  const handleManualSubmit = () => {
    if (manualInput.trim()) {
      onScan(manualInput.trim());
      setManualInput('');
      onClose();
    }
  };

  const handleClose = () => {
    stopScanner();
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
            <Camera className="w-6 h-6 text-indigo-600" />
            Scanner un code-barres
          </h2>
          <button
            onClick={handleClose}
            className="p-2 hover:bg-gray-100 rounded-full transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4">
          {!showManualInput ? (
            <>
              {/* Scanner Zone */}
              <div className="mb-4">
                <div
                  id="barcode-reader"
                  className="w-full rounded-lg overflow-hidden border-2 border-indigo-200"
                  style={{ minHeight: '300px' }}
                ></div>

                {error && (
                  <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
                    {error}
                  </div>
                )}

                {isScanning && !error && (
                  <p className="mt-3 text-sm text-gray-600 text-center">
                    Placez le code-barres devant la caméra
                  </p>
                )}
              </div>

              {/* Manual Input Toggle */}
              <button
                onClick={() => setShowManualInput(true)}
                className="w-full px-4 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition flex items-center justify-center gap-2"
              >
                <Keyboard className="w-5 h-5" />
                Saisir le code-barres manuellement
              </button>
            </>
          ) : (
            <>
              {/* Manual Input Form */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Code-barres
                </label>
                <input
                  type="text"
                  value={manualInput}
                  onChange={(e) => setManualInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleManualSubmit()}
                  placeholder="Ex: 3017620422003"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  autoFocus
                />
                <p className="mt-2 text-xs text-gray-500">
                  Le code-barres se trouve généralement sous le produit
                </p>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => setShowManualInput(false)}
                  className="flex-1 px-4 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition"
                >
                  Retour au scanner
                </button>
                <button
                  onClick={handleManualSubmit}
                  disabled={!manualInput.trim()}
                  className="flex-1 px-4 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Valider
                </button>
              </div>
            </>
          )}
        </div>

        {/* Footer Help */}
        <div className="p-4 bg-gray-50 border-t rounded-b-xl">
          <p className="text-xs text-gray-600">
            💡 <span className="font-semibold">Astuce:</span> Assurez-vous que le code-barres est bien éclairé et net
          </p>
        </div>
      </div>
    </div>
  );
};

export default BarcodeScanner;
