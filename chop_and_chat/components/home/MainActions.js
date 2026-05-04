import { useState, useCallback, useRef } from 'react';
import { Text, View, StyleSheet, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { wp, hp, fp } from '../../utils/responsive';
import { useTheme } from '../../context/ThemeContext';
import { handlePhotoAction } from '../../utils/photoHandling';
import CreatePostModal from '../posts/CreatePostModal';
import RequestChefReviewModal from '../posts/RequestChefReviewModal';
import FindRecipeModal from './main-actions/FindRecipeModal';
import ImageSourceModal from './main-actions/ImageSourceModal';
import ActionChoiceModal from './main-actions/ActionChoiceModal';

const MODAL = {
    NONE: null,
    FIND_RECIPE: 'findRecipe',
    IMAGE_SOURCE: 'imageSource',
    ACTION_CHOICE: 'actionChoice',
    CREATE_POST: 'createPost',
    CHEF_REVIEW: 'chefReview',
};

// Buffer for one modal to fade out before the next mounts. Long enough to avoid
// tap-through (finger still pressed during swap) and slow Android dismiss.
const MODAL_TRANSITION_MS = 450;

export default function MainActions() {
    const { theme } = useTheme();

    const [activeModal, setActiveModal] = useState(MODAL.NONE);
    const [selectedImage, setSelectedImage] = useState(null);
    const transitionRef = useRef(null);

    const switchModal = useCallback((next) => {
        if (transitionRef.current) clearTimeout(transitionRef.current);
        setActiveModal(MODAL.NONE);
        if (next === MODAL.NONE) return;
        transitionRef.current = setTimeout(() => {
            setActiveModal(next);
            transitionRef.current = null;
        }, MODAL_TRANSITION_MS);
    }, []);

    const onImageCaptured = useCallback((uri) => {
        if (!uri) return;
        setSelectedImage(uri);
        switchModal(MODAL.ACTION_CHOICE);
    }, [switchModal]);

    const handleGetAiRating = useCallback(() => {
        switchModal(MODAL.NONE);
        console.log('Navigate to AI Rating with image:', selectedImage);
    }, [selectedImage, switchModal]);

    const handleCreatePostSubmit = useCallback((postData) => {
        console.log('Post submitted:', postData);
        setActiveModal(MODAL.NONE);
        setSelectedImage(null);
    }, []);

    const handleChefReviewSubmit = useCallback((requestData) => {
        console.log('Chef Review requested:', requestData);
        setActiveModal(MODAL.NONE);
        setSelectedImage(null);
    }, []);

    return (
        <View style={styles.container}>
            <Pressable
                style={({ pressed }) => [
                    styles.actionBox,
                    { backgroundColor: theme.primary },
                    pressed && styles.actionBoxPressed,
                ]}
                onPress={() => setActiveModal(MODAL.FIND_RECIPE)}
            >
                <View style={[styles.iconContainer, { backgroundColor: 'rgba(255,255,255,0.2)' }]}>
                    <Ionicons name="search" size={fp(24)} color="#FFFFFF" />
                </View>
                <Text style={styles.actionTitle}>Find Recipe</Text>
                <Text style={styles.actionSubtitle}>Based on your tools</Text>
            </Pressable>

            <Pressable
                style={({ pressed }) => [
                    styles.actionBox,
                    { backgroundColor: theme.success },
                    pressed && styles.actionBoxPressed,
                ]}
                onPress={() => setActiveModal(MODAL.IMAGE_SOURCE)}
            >
                <View style={[styles.iconContainer, { backgroundColor: 'rgba(255,255,255,0.2)' }]}>
                    <Ionicons name="camera" size={fp(24)} color="#FFFFFF" />
                </View>
                <Text style={styles.actionTitle}>Upload Dish</Text>
                <Text style={styles.actionSubtitle}>Get rated by AI/Chefs</Text>
            </Pressable>

            <FindRecipeModal
                visible={activeModal === MODAL.FIND_RECIPE}
                onClose={() => setActiveModal(MODAL.NONE)}
                theme={theme}
            />

            <ImageSourceModal
                visible={activeModal === MODAL.IMAGE_SOURCE}
                onClose={() => setActiveModal(MODAL.NONE)}
                theme={theme}
                onTakePhoto={() => handlePhotoAction('camera', onImageCaptured)}
                onAccessGallery={() => handlePhotoAction('library', onImageCaptured)}
            />

            <ActionChoiceModal
                visible={activeModal === MODAL.ACTION_CHOICE}
                onClose={() => {
                    setActiveModal(MODAL.NONE);
                    setSelectedImage(null);
                }}
                theme={theme}
                onPostToFeed={() => switchModal(MODAL.CREATE_POST)}
                onGetAiRating={handleGetAiRating}
                onGetChefReview={() => switchModal(MODAL.CHEF_REVIEW)}
            />

            <CreatePostModal
                visible={activeModal === MODAL.CREATE_POST}
                imageUri={selectedImage}
                onClose={() => {
                    setActiveModal(MODAL.NONE);
                    setSelectedImage(null);
                }}
                onBack={() => switchModal(MODAL.ACTION_CHOICE)}
                onSubmit={handleCreatePostSubmit}
            />

            <RequestChefReviewModal
                visible={activeModal === MODAL.CHEF_REVIEW}
                imageUri={selectedImage}
                onClose={() => {
                    setActiveModal(MODAL.NONE);
                    setSelectedImage(null);
                }}
                onBack={() => switchModal(MODAL.ACTION_CHOICE)}
                onSubmit={handleChefReviewSubmit}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        paddingHorizontal: wp(20),
        paddingVertical: hp(20),
        gap: wp(16),
    },
    actionBox: {
        flex: 1,
        padding: wp(20),
        borderRadius: wp(24),
        shadowColor: '#000',
        shadowOffset: { width: 0, height: hp(4) },
        shadowOpacity: 0.1,
        shadowRadius: wp(10),
        elevation: 4,
    },
    actionBoxPressed: {
        opacity: 0.9,
        transform: [{ scale: 0.98 }],
    },
    iconContainer: {
        width: wp(48),
        height: wp(48),
        borderRadius: wp(16),
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: hp(16),
    },
    actionTitle: {
        color: '#FFFFFF',
        fontSize: fp(18),
        fontWeight: '700',
        marginBottom: hp(4),
    },
    actionSubtitle: {
        color: 'rgba(255,255,255,0.8)',
        fontSize: fp(13),
    },
});
