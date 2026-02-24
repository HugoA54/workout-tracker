import { useState, useRef, useContext } from 'react';
import { Camera, Upload, X, Loader } from 'lucide-react';
import { uploadMealPhoto, validateImage } from '../utils/photoUpload';
import { WorkoutContext } from '../context/WorkoutContext';

const PhotoUpload = ({ currentPhotoUrl, onUploadComplete }) => {
  const { currentUser } = useContext(WorkoutContext);
  const [preview, setPreview] = useState(currentPhotoUrl || null);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState(null);
  const fileInputRef = useRef(null);

  const handleFileSelect = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validation
    const validation = validateImage(file);
    if (!validation.valid) {
      setError(validation.error);
      return;
    }

    setError(null);

    // Créer un preview local
    const reader = new FileReader();
    reader.onload = (e) => {
      setPreview(e.target.result);
    };
    reader.readAsDataURL(file);

    // Upload vers Supabase
    try {
      setIsUploading(true);
      const url = await uploadMealPhoto(currentUser.id, file);
      onUploadComplete(url);
      console.log('✅ Photo uploadée:', url);
    } catch (err) {
      console.error('❌ Erreur upload:', err);
      setError('Erreur lors de l\'upload. Réessayez.');
      setPreview(currentPhotoUrl || null);
    } finally {
      setIsUploading(false);
    }
  };

  const handleRemove = () => {
    setPreview(null);
    setError(null);
    onUploadComplete(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="w-full">
      <label className="block text-sm font-medium text-gray-700 mb-2">
        Photo du repas
      </label>

      {/* Preview ou upload zone */}
      {preview ? (
        <div className="relative">
          <div className="rounded-lg overflow-hidden border-2 border-gray-200">
            <img
              src={preview}
              alt="Preview"
              className="w-full h-64 object-cover"
            />
          </div>

          {/* Overlay avec actions */}
          <div className="absolute top-2 right-2 flex gap-2">
            <button
              type="button"
              onClick={handleClick}
              disabled={isUploading}
              className="p-2 bg-white bg-opacity-90 rounded-full shadow-md hover:bg-opacity-100 transition disabled:opacity-50"
            >
              <Camera className="w-5 h-5 text-gray-700" />
            </button>
            <button
              type="button"
              onClick={handleRemove}
              disabled={isUploading}
              className="p-2 bg-white bg-opacity-90 rounded-full shadow-md hover:bg-opacity-100 transition disabled:opacity-50"
            >
              <X className="w-5 h-5 text-red-600" />
            </button>
          </div>

          {/* Loading overlay */}
          {isUploading && (
            <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center rounded-lg">
              <div className="bg-white rounded-lg p-4 flex flex-col items-center gap-2">
                <Loader className="w-8 h-8 text-indigo-600 animate-spin" />
                <p className="text-sm text-gray-700">Upload en cours...</p>
              </div>
            </div>
          )}
        </div>
      ) : (
        <button
          type="button"
          onClick={handleClick}
          disabled={isUploading}
          className="w-full h-64 border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center gap-3 hover:border-indigo-400 hover:bg-indigo-50 transition disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <div className="p-4 bg-indigo-100 rounded-full">
            <Upload className="w-8 h-8 text-indigo-600" />
          </div>
          <div className="text-center">
            <p className="text-sm font-medium text-gray-700">
              Cliquez pour ajouter une photo
            </p>
            <p className="text-xs text-gray-500 mt-1">
              JPG, PNG ou WebP (max 10MB)
            </p>
          </div>
        </button>
      )}

      {/* Input file caché */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/jpg,image/png,image/webp"
        onChange={handleFileSelect}
        className="hidden"
      />

      {/* Message d'erreur */}
      {error && (
        <div className="mt-2 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Info */}
      <p className="mt-2 text-xs text-gray-500">
        💡 La photo sera automatiquement compressée pour un chargement rapide
      </p>
    </div>
  );
};

export default PhotoUpload;
