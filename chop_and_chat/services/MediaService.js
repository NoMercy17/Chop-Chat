import { Alert, Linking } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as MediaLibrary from 'expo-media-library';
import * as ImageManipulator from 'expo-image-manipulator';

const MAX_DIMENSION = 1200;

/**
 * Compresses an image URI to max 1200px width, JPEG at 0.75 quality.
 * Falls back to the original URI if manipulation fails.
 */
export async function compressImage(uri) {
  try {
    const result = await ImageManipulator.manipulateAsync(
      uri,
      [{ resize: { width: MAX_DIMENSION } }],
      { compress: 0.75, format: ImageManipulator.SaveFormat.JPEG }
    );
    return result.uri;
  } catch {
    return uri;
  }
}

export const MediaService = {
    pickFromGallery: async () => {
        try {
            const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
            if (permissionResult.status !== 'granted' && permissionResult.status !== 'limited') {
                Alert.alert(
                    'Photo Access Required',
                    'Please allow photo library access in your device settings to choose photos.',
                    [
                        { text: 'Not Now', style: 'cancel' },
                        { text: 'Open Settings', onPress: () => Linking.openSettings() },
                    ]
                );
                return null;
            }

            const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ['images'],
                allowsEditing: true,
                aspect: [1, 1],
                quality: 1,
            });

            if (result && !result.canceled && result.assets && result.assets.length > 0) {
                const asset = result.assets[0];
                const compressedUri = await compressImage(asset.uri);
                // fileSize is set to null post-compression; compressed images are well under 9 MB
                return { uri: compressedUri, fileSize: null };
            }

            return null;
        } catch (error) {
            console.error('MediaService - Error picking image:', error);
            return null;
        }
    },

    requestMediaPermissions: async () => {
        const { status } = await MediaLibrary.requestPermissionsAsync();
        return status === 'granted';
    }
};
