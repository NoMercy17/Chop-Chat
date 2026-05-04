import { MediaService } from '../services/MediaService';
import * as ImagePicker from 'expo-image-picker';

/**
 * High-level utility for handling photo actions (camera or library).
 * Bridges components with the MediaService.
 * 
 * @param {string} mode - Either 'camera' or 'library'
 * @param {function} onCaptured - Callback function that receives the image URI
 */
export const handlePhotoAction = async (mode, onCaptured) => {
    try {
        let uri = null;

        if (mode === 'library') {
            uri = await MediaService.pickFromGallery();
        } else if (mode === 'camera') {
            // Request camera permissions
            const permissionResult = await ImagePicker.requestCameraPermissionsAsync();
            
            if (permissionResult.status !== 'granted') {
                console.warn('Camera permission denied');
                return null;
            }

            // Launch camera
            const result = await ImagePicker.launchCameraAsync({
                allowsEditing: true,
                aspect: [1, 1],
                quality: 1,
            });

            if (result && !result.canceled && result.assets && result.assets.length > 0) {
                uri = result.assets[0].uri;
            }
        }

        if (uri && onCaptured) {
            onCaptured(uri);
        }
        
        return uri;
    } catch (error) {
        console.error(`[photoHandling:handlePhotoAction] Error in ${mode}:`, error.message);
        return null;
    }
};

/**
 * Legacy wrapper around MediaService.
 * @deprecated Use handlePhotoAction instead for better consistency.
 */
export const uploadImage = async (mode) => {
    if (mode === 'gallery' || mode === 'library') {
        return await MediaService.pickFromGallery();
    }
    return null;
};
