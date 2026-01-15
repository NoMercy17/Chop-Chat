import { useState } from 'react';
import { Text, View, StyleSheet, Pressable, Modal } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { wp, hp, fp, SPACING } from '../../utils/responsive';
import { useTheme } from '../../context/ThemeContext';
import CameraScreen, { uploadImage } from '../../utils/photoHandling';

export default function MainActions() {
    const { theme } = useTheme();
    const [sourceModalVisible, setSourceModalVisible] = useState(false);
    const [cameraModalVisible, setCameraModalVisible] = useState(false);
    const [nextStepModalVisible, setNextStepModalVisible] = useState(false);
    const [selectedImageUri, setSelectedImageUri] = useState(null);
    const [modalKey, setModalKey] = useState(0); // Add key for forcing remount

    const handleUploadDish = () => {
        setSourceModalVisible(true);
    };

    const handleTakePhoto = () => {
        console.log('Take photo button pressed');
        setSourceModalVisible(false);
        setTimeout(() => {
            setCameraModalVisible(true);
        }, 300);
    };

    const handlePhotoTaken = (uri) => {
        console.log('Photo captured:', uri);
        setSelectedImageUri(uri);
        setCameraModalVisible(false);
        setTimeout(() => {
            setModalKey(prev => prev + 1); // Force remount
            setNextStepModalVisible(true);
        }, 300);
    };

    const handleAccessGallery = async () => {
        console.log('Access gallery pressed');
        
        const uri = await uploadImage('gallery');
        console.log('Returned URI:', uri);
        
        setSourceModalVisible(false);
        
        if (uri) {
            setSelectedImageUri(uri);
            console.log('Image selected, opening next step modal');
            // Increase delay and force remount
            setTimeout(() => {
                console.log('Setting nextStepModalVisible to true');
                setModalKey(prev => prev + 1); // Force remount
                setNextStepModalVisible(true);
            }, 500);
        }
    };

    const handleGetAiRating = () => {
        console.log('Get AI Rating for:', selectedImageUri);
        setNextStepModalVisible(false);
        setSelectedImageUri(null);
        // TODO: Navigate to AI rating screen/flow
    };

    const handlePostToFeed = () => {
        console.log('Post to Feed:', selectedImageUri);
        setNextStepModalVisible(false);
        setSelectedImageUri(null);
        // TODO: Navigate to post creation screen/flow
    };

    const handleGetChefReview = () => {
        console.log('Get Chef Review for:', selectedImageUri);
        setNextStepModalVisible(false);
        setSelectedImageUri(null);
        // TODO: Navigate to chef review screen/flow
    };

    const handleCancelAction = () => {
        setNextStepModalVisible(false);
        setSelectedImageUri(null);
    };

    return (
        <View style={styles.container}>
            <Pressable 
                style={({ pressed }) => [
                    styles.card,
                    { backgroundColor: theme.cardBackgroundLight, shadowColor: theme.shadowColor },
                    pressed && styles.cardPressed
                ]}
                onPress={() => console.log('Find Recipe pressed')}
            >
                <View style={styles.textContainer}>
                    <Text style={[styles.title, { color: theme.textPrimary }]}>Find a Recipe</Text>
                    <Text style={[styles.subtitle, { color: theme.textSecondary }]}>Turn leftovers into something edible</Text>
                </View>
                <View style={[styles.iconContainer, { backgroundColor: theme.cardBackgroundAlt }]}>
                    <Ionicons name="arrow-forward" size={fp(20)} color={theme.primary} />
                </View>
            </Pressable>

            <Pressable 
                style={({ pressed }) => [
                    styles.card,
                    { backgroundColor: theme.cardBackgroundLight, shadowColor: theme.shadowColor },
                    pressed && styles.cardPressed
                ]}
                onPress={handleUploadDish}
            >
                <View style={styles.textContainer}>
                    <Text style={[styles.title, { color: theme.textPrimary }]}>Upload Your Dish</Text>
                    <Text style={[styles.subtitle, { color: theme.textSecondary }]}>Ready to be judged?</Text>
                </View>
                <View style={[styles.iconContainer, { backgroundColor: theme.cardBackgroundAlt }]}>
                    <Ionicons name="add" size={fp(20)} color={theme.primary} />
                </View>
            </Pressable>

            {/* Step 1: Image Source Modal */}
            <Modal 
                visible={sourceModalVisible} 
                transparent={true} 
                animationType="fade"
                onRequestClose={() => setSourceModalVisible(false)}
            >
                <Pressable 
                    style={[styles.actionModalOverlay, { backgroundColor: theme.overlayBackgroundDark }]}
                    onPress={() => setSourceModalVisible(false)}
                >
                    <Pressable style={[styles.actionModalCard, { backgroundColor: theme.cardBackground }]}>
                        <View style={styles.actionModalHeader}>
                            <Text style={styles.actionModalTitle}>Upload Your Dish</Text>
                            <Text style={styles.actionModalSubtitle}>Choose how to add your photo</Text>
                        </View>

                        <View style={styles.actionButtonsContainer}>
                            <Pressable
                                style={({ pressed }) => [
                                    styles.actionButton,
                                    styles.takePhotoButton,
                                    pressed && styles.actionButtonPressed
                                ]}
                                onPress={handleTakePhoto}
                            >
                                <View style={styles.actionTextContainer}>
                                    <Text style={styles.actionButtonTitle}>Take Photo</Text>
                                    <Text style={styles.actionButtonSubtitle}>Capture with your camera</Text>
                                </View>
                                <Text style={styles.actionArrow}>→</Text>
                            </Pressable>

                            <Pressable
                                style={({ pressed }) => [
                                    styles.actionButton,
                                    styles.galleryButton,
                                    pressed && styles.actionButtonPressed
                                ]}
                                onPress={handleAccessGallery}
                            >
                                <View style={styles.actionTextContainer}>
                                    <Text style={styles.actionButtonTitle}>Access Gallery</Text>
                                    <Text style={styles.actionButtonSubtitle}>Choose from your photos</Text>
                                </View>
                                <Text style={styles.actionArrow}>→</Text>
                            </Pressable>
                        </View>

                        <Pressable
                            style={({ pressed }) => [
                                styles.cancelButton,
                                pressed && styles.cancelButtonPressed
                            ]}
                            onPress={() => setSourceModalVisible(false)}
                        >
                            <Text style={styles.cancelButtonText}>Cancel</Text>
                        </Pressable>
                    </Pressable>
                </Pressable>
            </Modal>

            {/* Camera Modal */}
            <Modal 
                visible={cameraModalVisible} 
                animationType="slide"
                onRequestClose={() => setCameraModalVisible(false)}
            >
                <CameraScreen 
                    onPhotoTaken={handlePhotoTaken}
                    onClose={() => setCameraModalVisible(false)}
                />
            </Modal>

            {/* Step 2: Action Choice Modal */}
            <Modal 
                key={`next-step-${modalKey}`} // Add key to force remount
                visible={nextStepModalVisible} 
                transparent={true} 
                animationType="fade"
                onRequestClose={() => setNextStepModalVisible(false)}
            >
                <Pressable 
                    style={styles.actionModalOverlay}
                    onPress={() => setNextStepModalVisible(false)}
                >
                    <Pressable style={styles.actionModalCard}>
                        <View style={styles.actionModalHeader}>
                            <Text style={styles.actionModalTitle}>What's next?</Text>
                            <Text style={styles.actionModalSubtitle}>Choose an action for your dish</Text>
                        </View>

                        <View style={styles.actionButtonsContainer}>
                            <Pressable
                                style={({ pressed }) => [
                                    styles.actionButton,
                                    styles.postFeedButton,
                                    pressed && styles.actionButtonPressed
                                ]}
                                onPress={handlePostToFeed}
                            >
                                <View style={styles.actionTextContainer}>
                                    <Text style={styles.actionButtonTitle}>Post to Feed</Text>
                                    <Text style={styles.actionButtonSubtitle}>Share with the community</Text>
                                </View>
                                <Text style={styles.actionArrow}>→</Text>
                            </Pressable>

                            <Pressable
                                style={({ pressed }) => [
                                    styles.actionButton,
                                    styles.aiRatingButton,
                                    pressed && styles.actionButtonPressed
                                ]}
                                onPress={handleGetAiRating}
                            >
                                <View style={styles.actionTextContainer}>
                                    <Text style={styles.actionButtonTitle}>Get AI Rating</Text>
                                    <Text style={styles.actionButtonSubtitle}>Let AI judge your creation</Text>
                                </View>
                                <Text style={styles.actionArrow}>→</Text>
                            </Pressable>

                            <Pressable
                                style={({ pressed }) => [
                                    styles.actionButton,
                                    styles.chefReviewButton,
                                    pressed && styles.actionButtonPressed
                                ]}
                                onPress={handleGetChefReview}
                            >
                                <View style={styles.actionTextContainer}>
                                    <Text style={styles.actionButtonTitle}>Get Chef Review</Text>
                                    <Text style={styles.actionButtonSubtitle}>Get feedback from real chefs</Text>
                                </View>
                                <Text style={styles.actionArrow}>→</Text>
                            </Pressable>
                        </View>

                        <Pressable
                            style={({ pressed }) => [
                                styles.cancelButton,
                                pressed && styles.cancelButtonPressed
                            ]}
                            onPress={handleCancelAction}
                        >
                            <Text style={styles.cancelButtonText}>Cancel</Text>
                        </Pressable>
                    </Pressable>
                </Pressable>
            </Modal>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        paddingHorizontal: SPACING.screenPadding,
        paddingTop: SPACING.sectionGap,
        paddingBottom: hp(4),
        gap: SPACING.itemGap,
    },
    card: {
        flexDirection: 'row',
        backgroundColor: '#FFFFFF',
        padding: SPACING.cardPadding,
        borderRadius: SPACING.radiusLarge,
        alignItems: 'center',
        justifyContent: 'space-between',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: hp(2) },
        shadowOpacity: 0.08,
        shadowRadius: wp(12),
        elevation: 3,
    },
    cardPressed: {
        opacity: 0.9,
        transform: [{ scale: 0.98 }],
    },
    textContainer: {
        flex: 1,
        gap: hp(6),
    },
    title: {
        fontSize: fp(18),
        fontWeight: '700',
        color: '#111827',
        letterSpacing: -0.3,
    },
    subtitle: {
        fontSize: fp(14),
        color: '#6B7280',
        fontWeight: '400',
        lineHeight: hp(20),
    },
    iconContainer: {
        width: wp(40),
        height: wp(40),
        borderRadius: wp(10),
        backgroundColor: '#F3F4F6',
        justifyContent: 'center',
        alignItems: 'center',
        marginLeft: wp(16),
    },
    icon: {
        fontSize: fp(20),
        color: '#3B82F6',
        fontWeight: '600',
    },
    actionModalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.6)',
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: wp(24),
    },
    actionModalCard: {
        backgroundColor: '#FFFFFF',
        borderRadius: wp(24),
        width: '100%',
        maxWidth: wp(340),
        paddingVertical: hp(24),
        paddingHorizontal: wp(20),
        shadowColor: '#000',
        shadowOffset: { width: 0, height: hp(8) },
        shadowOpacity: 0.15,
        shadowRadius: wp(24),
        elevation: 12,
    },
    actionModalHeader: {
        alignItems: 'center',
        marginBottom: hp(24),
    },
    actionModalTitle: {
        fontSize: fp(20),
        fontWeight: '700',
        color: '#111827',
        marginBottom: hp(4),
    },
    actionModalSubtitle: {
        fontSize: fp(14),
        color: '#6B7280',
    },
    actionButtonsContainer: {
        gap: hp(8),
        marginBottom: hp(16),
    },
    actionButton: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: hp(16),
        paddingHorizontal: wp(16),
        borderRadius: wp(12),
        backgroundColor: '#F9FAFB',
    },
    takePhotoButton: {
        backgroundColor: '#F0FDF4',
    },
    galleryButton: {
        backgroundColor: '#EEF2FF',
    },
    postFeedButton: {
        backgroundColor: '#EFF6FF',
    },
    aiRatingButton: {
        backgroundColor: '#FFFBEB',
    },
    chefReviewButton: {
        backgroundColor: '#f7e9faff',
    },
    actionButtonPressed: {
        backgroundColor: '#F3F4F6',
        transform: [{ scale: 0.98 }],
    },
    actionTextContainer: {
        flex: 1,
    },
    actionButtonTitle: {
        fontSize: fp(16),
        fontWeight: '600',
        color: '#111827',
    },
    actionButtonSubtitle: {
        fontSize: fp(13),
        color: '#6B7280',
        marginTop: hp(2),
    },
    actionArrow: {
        fontSize: fp(20),
        color: '#D1D5DB',
    },
    cancelButton: {
        alignItems: 'center',
        paddingVertical: hp(14),
        borderRadius: wp(12),
        backgroundColor: '#FEF2F2',
    },
    cancelButtonPressed: {
        opacity: 0.7,
        transform: [{ scale: 0.98 }],
    },
    cancelButtonText: {
        color: "#dc2626c5",
        fontSize: fp(16),
        fontWeight: "700",
    },
});