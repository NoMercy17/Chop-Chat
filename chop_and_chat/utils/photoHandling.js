import { Alert, Linking } from 'react-native';
import { MediaService, compressImage } from '../services/MediaService';
import * as ImagePicker from 'expo-image-picker';

/**
 * High-level utility for handling photo actions (camera or library).
 * Bridges components with the MediaService.
 *
 * @param {string} mode - Either 'camera' or 'library'
 * @param {function} onCaptured - Callback receiving (uri: string, fileSize: number|null)
 */
export const handlePhotoAction = async (mode, onCaptured) => {
    try {
        let uri = null;
        let fileSize = null;

        if (mode === 'library') {
            // MediaService returns { uri, fileSize } or null
            const result = await MediaService.pickFromGallery();
            if (result) {
                uri = result.uri;
                fileSize = result.fileSize;
            }
        } else if (mode === 'camera') {
            const permissionResult = await ImagePicker.requestCameraPermissionsAsync();

            if (permissionResult.status !== 'granted') {
                // Silent failure leaves the user with no feedback and no path to recovery —
                // show a dialog so they understand what happened and can fix it in Settings.
                Alert.alert(
                    'Camera Access Required',
                    'Please allow camera access in your device settings to take photos.',
                    [
                        { text: 'Not Now', style: 'cancel' },
                        { text: 'Open Settings', onPress: () => Linking.openSettings() },
                    ]
                );
                return null;
            }

            const result = await ImagePicker.launchCameraAsync({
                allowsEditing: true,
                aspect: [1, 1],
                quality: 1,
            });

            if (result && !result.canceled && result.assets && result.assets.length > 0) {
                const raw = result.assets[0];
                uri = await compressImage(raw.uri);
                // fileSize is null post-compression; compressed images are well under 9 MB
                fileSize = null;
            }
        }

        if (uri && onCaptured) {
            onCaptured(uri, fileSize);
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
        const result = await MediaService.pickFromGallery();
        return result?.uri ?? null;
    }
    return null;
};
