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
  /**
   * @param {string} imageUri
   * @param {string} [folder]
   * @param {object} [options]
   * @param {string} [options.public_id] - When set, overrides `folder` (public_id path includes folder)
   * @param {boolean} [options.overwrite] - Replace an existing asset with the same public_id
   */
  uploadImage: async (imageUri, folder = 'profile_photos', options = {}) => {
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
      if (options.public_id) {
        formData.append('public_id', options.public_id);
        if (options.overwrite) formData.append('overwrite', 'true');
      } else {
        formData.append('folder', folder);
      }
      
      const apiUrl = `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`;

      // Without a timeout, a stalled mobile network leaves isSubmitting=true indefinitely
      // with no way for the user to cancel or retry — 30s covers even very slow connections.
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30_000);

      let response;
      try {
        response = await fetch(apiUrl, {
          method: 'POST',
          body: formData,
          signal: controller.signal,
        });
      } finally {
        clearTimeout(timeoutId);
      }

      const data = await response.json();
      
      if (data.secure_url) {
        // returnMeta: true is used by the AI flow to get the public_id for later cleanup
        return options.returnMeta
          ? { url: data.secure_url, publicId: data.public_id }
          : data.secure_url;
      } else if (data.error) {
        console.error('❌ CloudinaryService Error:', data.error.message);
        return null;
      } else {
        return null;
      }
    } catch (error) {
      if (error.name === 'AbortError') {
        // AbortController fired after 30s — throw so the caller's catch block shows
        // a readable message rather than the generic "Image upload failed" fallback.
        throw new Error('Upload timed out. Please check your connection and try again.');
      }
      console.error('❌ CloudinaryService Network/Parse error:', error);
      return null;
    }
  }
};
