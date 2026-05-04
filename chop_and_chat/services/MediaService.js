import * as ImagePicker from 'expo-image-picker';
import * as MediaLibrary from 'expo-media-library';

/**
 * Service for handling local media (Gallery and Camera permissions).
 * Note: Camera UI is still handled by components, but this service handles the logic and permissions.
 */
export const MediaService = {
    /**
     * Requests permissions and opens the device image gallery.
     * @returns {Promise<string|null>} The URI of the selected image, or null if cancelled/failed.
     */
    pickFromGallery: async () => {
        try {
            const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
            if (permissionResult.status !== 'granted' && permissionResult.status !== 'limited') {
                console.warn('Gallery permission denied:', permissionResult.status);
                return null;
            }
            
            const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ['images'],
                allowsEditing: true,
                aspect: [1, 1],
                quality: 1,
            });

            if (result && !result.canceled && result.assets && result.assets.length > 0) {
                return result.assets[0].uri;
            }
            
            return null;
        } catch (error) {
            console.error('MediaService - Error picking image:', error);
            return null;
        }
    },

    /**
     * Requests basic permissions needed before using the camera.
     * Use expo-camera hooks inside the actual Camera component for real-time permission state.
     */
    requestMediaPermissions: async () => {
        const { status } = await MediaLibrary.requestPermissionsAsync();
        return status === 'granted';
    }
};
