import { MediaService } from '../services/MediaService';

/**
 * Utility for handling image uploads.
 * Currently a wrapper around MediaService, but can be expanded for more complex logic.
 */
export const uploadImage = async (mode) => {
    if (mode === 'gallery') {
        return await MediaService.pickFromGallery();
    }
    // 'camera' mode is handled by the CameraScreen component directly in most cases,
    // but we can add camera picking here if needed via ImagePicker.launchCameraAsync
    return null;
};
