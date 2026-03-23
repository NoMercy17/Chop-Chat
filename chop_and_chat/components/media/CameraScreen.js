import { StyleSheet, Text, View, Image, Pressable } from 'react-native';
import { useState, useRef, useEffect } from 'react';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as MediaLibrary from 'expo-media-library';
import { Ionicons } from '@expo/vector-icons';
import { wp, hp, fp, SPACING } from '../../utils/responsive';

export default function CameraScreen({ onPhotoTaken, onClose }) {
    const [facing, setFacing] = useState('back');
    const [flash, setFlash] = useState('off');
    const [permission, requestPermission] = useCameraPermissions();
    const [image, setImage] = useState(null);
    const cameraRef = useRef(null);

    useEffect(() => {
        (async () => {
            await MediaLibrary.requestPermissionsAsync();
        })();
    }, []);

    if (!permission) {
        return <View style={styles.container}><Text>Loading...</Text></View>;
    }

    if (!permission.granted) {
        return (
            <View style={styles.container}>
                <Text style={styles.permissionText}>We need camera permission</Text>
                <Pressable style={styles.permissionButton} onPress={requestPermission}>
                    <Text style={styles.permissionButtonText}>Grant Permission</Text>
                </Pressable>
            </View>
        );
    }

    const takePicture = async () => {
        if (cameraRef.current) {
            try {
                console.log('Taking picture...');
                const photo = await cameraRef.current.takePictureAsync({
                    quality: 0.8,
                });
                console.log('Picture taken:', photo.uri);
                setImage(photo.uri);
            } catch (error) {
                console.error('Error taking picture:', error);
            }
        }
    };

    const handleUsePhoto = () => {
        if (image && onPhotoTaken) {
            onPhotoTaken(image);
        }
    };

    const handleRetake = () => {
        setImage(null);
    };

    const toggleCameraFacing = () => {
        setFacing(current => (current === 'back' ? 'front' : 'back'));
    };

    const toggleFlash = () => {
        setFlash(current => (current === 'off' ? 'on' : 'off'));
    };

    if (image) {
        return (
            <View style={styles.container}>
                <Image source={{ uri: image }} style={styles.preview} />
                <View style={styles.previewControls}>
                    <Pressable 
                        style={styles.controlButton} 
                        onPress={handleRetake}
                    >
                        <Ionicons name="refresh" size={fp(24)} color="#FFF" />
                        <Text style={styles.controlButtonText}>Retake</Text>
                    </Pressable>
                    <Pressable 
                        style={[styles.controlButton, styles.useButton]} 
                        onPress={handleUsePhoto}
                    >
                        <Ionicons name="checkmark" size={fp(24)} color="#FFF" />
                        <Text style={styles.controlButtonText}>Use Photo</Text>
                    </Pressable>
                </View>
                <Pressable style={styles.closeButton} onPress={onClose}>
                    <Ionicons name="close" size={fp(28)} color="#FFF" />
                </Pressable>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <CameraView 
                style={styles.camera} 
                facing={facing}
                enableTorch={flash === 'on'}
                ref={cameraRef}
            />
            
            {/* Top Controls - Absolute Positioning */}
            <View style={styles.topControls}>
                <Pressable 
                    style={styles.iconButton} 
                    onPress={toggleFlash}
                >
                    <Ionicons 
                        name={flash === 'off' ? 'flash-off' : 'flash'} 
                        size={fp(28)} 
                        color={flash === 'off' ? '#FFF' : '#FFD700'} 
                    />
                </Pressable>
                <Pressable 
                    style={styles.iconButton} 
                    onPress={onClose}
                >
                    <Ionicons name="close" size={fp(28)} color="#FFF" />
                </Pressable>
            </View>

            {/* Bottom Controls - Absolute Positioning */}
            <View style={styles.bottomControls}>
                <View style={styles.captureContainer}>
                    <Pressable 
                        style={styles.flipButton} 
                        onPress={toggleCameraFacing}
                    >
                        <Ionicons name="camera-reverse" size={fp(32)} color="#FFF" />
                    </Pressable>
                    
                    <Pressable 
                        style={styles.captureButton} 
                        onPress={takePicture}
                    >
                        <View style={styles.captureButtonInner} />
                    </Pressable>
                    
                    <View style={{ width: wp(50) }} />
                </View>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#000',
    },
    camera: {
        flex: 1,
    },
    topControls: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        flexDirection: 'row',
        justifyContent: 'space-between',
        padding: wp(20),
        paddingTop: hp(50),
        zIndex: 10,
    },
    bottomControls: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        paddingBottom: hp(40),
        zIndex: 10,
    },
    captureContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: wp(40),
    },
    iconButton: {
        width: wp(50),
        height: wp(50),
        borderRadius: wp(25),
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    flipButton: {
        width: wp(50),
        height: wp(50),
        borderRadius: wp(25),
        backgroundColor: 'rgba(255, 255, 255, 0.3)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    captureButton: {
        width: wp(70),
        height: wp(70),
        borderRadius: wp(35),
        backgroundColor: '#FFF',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 4,
        borderColor: 'rgba(255, 255, 255, 0.5)',
    },
    captureButtonInner: {
        width: wp(60),
        height: wp(60),
        borderRadius: wp(30),
        backgroundColor: '#FFF',
    },
    preview: {
        flex: 1,
        resizeMode: 'cover',
    },
    previewControls: {
        position: 'absolute',
        bottom: hp(50),
        left: 0,
        right: 0,
        flexDirection: 'row',
        justifyContent: 'center',
        gap: wp(16),
        paddingHorizontal: wp(24),
    },
    controlButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(255, 255, 255, 0.15)',
        backdropFilter: 'blur(10px)',
        paddingVertical: hp(12),
        paddingHorizontal: wp(18),
        borderRadius: wp(50),
        gap: wp(2),
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.2)',
    },
    useButton: {
        backgroundColor: '#3B82F6',
        borderColor: '#3B82F6',
    },
    controlButtonText: {
        color: '#FFF',
        fontSize: fp(15),
        fontWeight: '600',
    },
    closeButton: {
        position: 'absolute',
        top: hp(50),
        right: wp(20),
        width: wp(50),
        height: wp(50),
        borderRadius: wp(25),
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    permissionText: {
        color: '#FFF',
        fontSize: fp(16),
        textAlign: 'center',
        marginBottom: hp(20),
    },
    permissionButton: {
        backgroundColor: '#3B82F6',
        paddingVertical: hp(12),
        paddingHorizontal: wp(24),
        borderRadius: wp(12),
    },
    permissionButtonText: {
        color: '#FFF',
        fontSize: fp(16),
        fontWeight: '600',
    },
});
