import { env } from '../utils/env';

/**
 * Service for handling uploads to Cloudinary.
 */
export const CloudinaryService = {
  /**
   * Uploads a local image URI to Cloudinary via Unsigned Upload.
   * @param {string} imageUri - The local URI of the image (from Camera or Gallery).
   * @param {string} folder - The target folder in Cloudinary (e.g., 'profile_photos', 'posts').
   * @returns {Promise<string|null>} The secure URL of the uploaded image, or null if failed.
   */
  uploadImage: async (imageUri, folder = 'profile_photos') => {
    try {
      const cloudName = env.CLOUDINARY_CLOUD_NAME;
      const uploadPreset = env.CLOUDINARY_UPLOAD_PRESET;

      if (!imageUri) return null;
      if (!cloudName || !uploadPreset) {
        console.error('❌ CloudinaryService: Missing cloudinary credentials in env.');
        return null;
      }

      const formData = new FormData();
      
      const filename = imageUri.split('/').pop();
      const match = /\.(\w+)$/.exec(filename);
      const type = match ? `image/${match[1]}` : 'image/jpeg';
      
      formData.append('file', {
        uri: imageUri,
        name: filename,
        type: type,
      });
      
      formData.append('upload_preset', uploadPreset);
      formData.append('folder', folder);
      
      const apiUrl = `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`;

      const response = await fetch(apiUrl, {
          method: 'POST',
          body: formData,
      });
      
      const data = await response.json();
      
      if (data.secure_url) {
        return data.secure_url;
      } else if (data.error) {
        console.error('❌ CloudinaryService Error:', data.error.message);
        return null;
      } else {
        return null;
      }
    } catch (error) {
      console.error('❌ CloudinaryService Network/Parse error:', error);
      return null;
    }
  }
};
