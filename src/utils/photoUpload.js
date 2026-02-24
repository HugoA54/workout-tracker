// Utilitaire pour uploader et compresser les photos de repas vers Supabase Storage

import { supabase } from '../supabaseClient';

/**
 * Upload une photo de repas vers Supabase Storage avec compression
 * @param {string} userId - ID de l'utilisateur
 * @param {File} file - Fichier image à uploader
 * @returns {Promise<string>} - URL publique de la photo uploadée
 */
export const uploadMealPhoto = async (userId, file) => {
  try {
    // Validation du fichier
    if (!file) {
      throw new Error('Aucun fichier fourni');
    }

    // Vérifier que c'est bien une image
    if (!file.type.startsWith('image/')) {
      throw new Error('Le fichier doit être une image');
    }

    // Taille maximale: 10MB
    const maxSize = 10 * 1024 * 1024;
    if (file.size > maxSize) {
      throw new Error('L\'image est trop grande (max 10MB)');
    }

    console.log('📸 Compression de l\'image...');

    // Compresser l'image avant upload
    const compressed = await compressImage(file, 800, 800, 0.8);

    // Générer un nom de fichier unique
    const timestamp = Date.now();
    const sanitizedName = file.name.replace(/[^a-zA-Z0-9.]/g, '_');
    const filename = `${userId}/${timestamp}-${sanitizedName}`;

    console.log('☁️ Upload vers Supabase Storage:', filename);

    // Upload vers Supabase Storage
    const { data, error } = await supabase.storage
      .from('meal-photos')
      .upload(filename, compressed, {
        contentType: 'image/jpeg',
        upsert: false
      });

    if (error) {
      console.error('❌ Erreur upload:', error);
      throw error;
    }

    // Récupérer l'URL publique
    const { data: urlData } = supabase.storage
      .from('meal-photos')
      .getPublicUrl(filename);

    console.log('✅ Photo uploadée:', urlData.publicUrl);

    return urlData.publicUrl;
  } catch (error) {
    console.error('❌ Erreur uploadMealPhoto:', error);
    throw error;
  }
};

/**
 * Supprimer une photo de repas du Storage
 * @param {string} photoUrl - URL complète de la photo
 * @returns {Promise<boolean>} - true si supprimé avec succès
 */
export const deleteMealPhoto = async (photoUrl) => {
  try {
    if (!photoUrl) return false;

    // Extraire le chemin du fichier de l'URL
    // URL format: https://.../storage/v1/object/public/meal-photos/{path}
    const urlParts = photoUrl.split('/meal-photos/');
    if (urlParts.length < 2) {
      console.warn('⚠️ URL invalide:', photoUrl);
      return false;
    }

    const filePath = urlParts[1];

    console.log('🗑️ Suppression de la photo:', filePath);

    const { error } = await supabase.storage
      .from('meal-photos')
      .remove([filePath]);

    if (error) {
      console.error('❌ Erreur suppression:', error);
      return false;
    }

    console.log('✅ Photo supprimée');
    return true;
  } catch (error) {
    console.error('❌ Erreur deleteMealPhoto:', error);
    return false;
  }
};

/**
 * Compresser une image avec Canvas API
 * @param {File} file - Fichier image original
 * @param {number} maxWidth - Largeur maximale
 * @param {number} maxHeight - Hauteur maximale
 * @param {number} quality - Qualité JPEG (0-1)
 * @returns {Promise<Blob>} - Image compressée
 */
const compressImage = async (file, maxWidth = 800, maxHeight = 800, quality = 0.8) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      const img = new Image();

      img.onload = () => {
        // Calculer les nouvelles dimensions en préservant le ratio
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > maxWidth) {
            height = (height * maxWidth) / width;
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width = (width * maxHeight) / height;
            height = maxHeight;
          }
        }

        // Créer un canvas pour redimensionner
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');

        // Dessiner l'image redimensionnée
        ctx.drawImage(img, 0, 0, width, height);

        // Convertir en Blob JPEG avec compression
        canvas.toBlob(
          (blob) => {
            if (blob) {
              console.log(`📊 Taille originale: ${(file.size / 1024).toFixed(2)}KB, Compressée: ${(blob.size / 1024).toFixed(2)}KB`);
              resolve(blob);
            } else {
              reject(new Error('Erreur de compression'));
            }
          },
          'image/jpeg',
          quality
        );
      };

      img.onerror = () => {
        reject(new Error('Erreur de chargement de l\'image'));
      };

      img.src = e.target.result;
    };

    reader.onerror = () => {
      reject(new Error('Erreur de lecture du fichier'));
    };

    reader.readAsDataURL(file);
  });
};

/**
 * Valider qu'une image est dans les limites acceptables
 * @param {File} file - Fichier à valider
 * @returns {{valid: boolean, error: string|null}}
 */
export const validateImage = (file) => {
  if (!file) {
    return { valid: false, error: 'Aucun fichier fourni' };
  }

  if (!file.type.startsWith('image/')) {
    return { valid: false, error: 'Le fichier doit être une image' };
  }

  // Types acceptés
  const acceptedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
  if (!acceptedTypes.includes(file.type)) {
    return { valid: false, error: 'Format non supporté (utilisez JPG, PNG ou WebP)' };
  }

  // Taille maximale: 10MB
  const maxSize = 10 * 1024 * 1024;
  if (file.size > maxSize) {
    return { valid: false, error: 'Image trop grande (max 10MB)' };
  }

  return { valid: true, error: null };
};
