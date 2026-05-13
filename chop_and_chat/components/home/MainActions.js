import { useState, useCallback, useRef, useContext, useEffect } from 'react';
import { Text, View, StyleSheet, Pressable, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useStripe } from '@stripe/stripe-react-native';
import { wp, hp, fp } from '../../utils/responsive';
import { useTheme } from '../../context/ThemeContext';
import { AuthContext } from '../../context/AuthContext';
import { usePosts } from '../../context/PostsContext';
import { handlePhotoAction } from '../../utils/photoHandling';
import { CloudinaryService } from '../../services/CloudinaryService';
import { api } from '../../services/api';
import { AiReviewService } from '../../services/AiReviewService';
import CreatePostModal from '../posts/CreatePostModal';
import RequestChefReviewModal from '../posts/RequestChefReviewModal';
import ConfirmPostPopup from '../posts/ConfirmPostPopup';
import ConfirmChefReviewPopup from '../posts/ConfirmChefReviewPopup';
import ConfirmAiReviewPopup from '../posts/ConfirmAiReviewPopup';
import AiReviewResultModal from '../posts/AiReviewResultModal';
import ChefReviewPaidWarning from '../posts/ChefReviewPaidWarning';
import FindRecipeModal from './main-actions/FindRecipeModal';
import ImageSourceModal from './main-actions/ImageSourceModal';
import ActionChoiceModal from './main-actions/ActionChoiceModal';

const MODAL = {
    NONE: null,
    FIND_RECIPE: 'findRecipe',
    DESTINATION_CHOICE: 'destinationChoice',
    CHEF_REVIEW_WARNING: 'chefReviewWarning',
    IMAGE_SOURCE: 'imageSource',
    CREATE_POST: 'createPost',
    CONFIRM_POST: 'confirmPost',
    CHEF_REVIEW: 'chefReview',
    // Confirmation step before the actual upload — keeps both create + review-request atomic
    CHEF_REVIEW_CONFIRM: 'chefReviewConfirm',
    CONFIRM_AI_REVIEW: 'confirmAiReview',
    AI_REVIEW_RESULT: 'aiReviewResult',
};

const MODAL_TRANSITION_MS = 200;
// Cloudinary free tier rejects files over 10 MB; 9 MB leaves a safety margin
const MAX_UPLOAD_BYTES = 9 * 1024 * 1024;

export default function MainActions() {
    const { theme } = useTheme();
    const { token } = useContext(AuthContext);
    const { refreshPosts } = usePosts();
    const { initPaymentSheet, presentPaymentSheet } = useStripe();

    const [activeModal, setActiveModal] = useState(MODAL.NONE);
    const [selectedImage, setSelectedImage] = useState(null);
    const [selectedDestination, setSelectedDestination] = useState(null);
    const [pendingPostData, setPendingPostData] = useState(null);
    const [pendingChefReviewData, setPendingChefReviewData] = useState(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [uploadStatus, setUploadStatus] = useState(null);
    const [aiReviewResult, setAiReviewResult] = useState(null);
    // Holds the Cloudinary URL + public_id from the AI upload phase so the "Share"
    // path can reuse the URL without re-uploading, and the "discard" path can delete it.
    const aiUploadedImageUrlRef = useRef(null);
    const aiUploadedPublicIdRef = useRef(null);
    // Holds the Cloudinary URL uploaded during the chef review pre-payment validation step.
    // Reused by handleChefReviewSubmit so the image isn't uploaded twice.
    const chefReviewUploadedUrlRef = useRef(null);

    const transitionRef = useRef(null);
    // Stores the 500ms image→CreatePost transition timer so resetUploadState can cancel it.
    const imageTransitionRef = useRef(null);
    // Guards async upload callbacks from calling setState on an unmounted component.
    const isMountedRef = useRef(true);
    // Holds the file size reported by the OS picker for pre-upload validation.
    // A ref avoids a re-render; null = size unknown (some Android versions omit it).
    const fileSizeRef = useRef(null);
    // Prevents double-launching the OS picker on rapid taps.
    const isPickerActiveRef = useRef(false);

    useEffect(() => { return () => { isMountedRef.current = false; }; }, []);

    const switchModal = useCallback((next) => {
        if (transitionRef.current) clearTimeout(transitionRef.current);
        setActiveModal(MODAL.NONE);
        if (next === MODAL.NONE) return;
        transitionRef.current = setTimeout(() => {
            setActiveModal(next);
            transitionRef.current = null;
        }, MODAL_TRANSITION_MS);
    }, []);

    const resetUploadState = useCallback(() => {
        if (transitionRef.current) clearTimeout(transitionRef.current);
        if (imageTransitionRef.current) {
            clearTimeout(imageTransitionRef.current);
            imageTransitionRef.current = null;
        }
        isPickerActiveRef.current = false;
        fileSizeRef.current = null;
        aiUploadedImageUrlRef.current = null;
        aiUploadedPublicIdRef.current = null;
        chefReviewUploadedUrlRef.current = null;
        setActiveModal(MODAL.NONE);
        setSelectedImage(null);
        setSelectedDestination(null);
        setPendingPostData(null);
        setPendingChefReviewData(null);
        setAiReviewResult(null);
        setIsSubmitting(false);
        setUploadStatus(null);
    }, []);

    // ImageSourceModal stays open while the system picker runs — the picker overlays
    // everything anyway. After photo is returned, close ImageSource and open CreatePost.
    // The 500ms delay lets residual OS touch events from picker dismissal settle before
    // CreatePostModal's overlay mounts (without it the overlay Pressable eats the tap).
    const onImageCaptured = useCallback((uri, fileSize) => {
        if (!uri) return;
        setSelectedImage(uri);
        fileSizeRef.current = fileSize ?? null;
        setActiveModal(MODAL.NONE);
        if (imageTransitionRef.current) clearTimeout(imageTransitionRef.current);
        imageTransitionRef.current = setTimeout(() => {
            imageTransitionRef.current = null;
            setActiveModal(MODAL.CREATE_POST);
        }, 500);
    }, []);

    // Wraps handlePhotoAction with a double-tap guard: without it a second tap while the
    // OS picker is open would launch a second session after the first closes.
    const handlePickerAction = useCallback((mode) => {
        if (isPickerActiveRef.current) return;
        isPickerActiveRef.current = true;
        handlePhotoAction(mode, onImageCaptured).finally(() => {
            isPickerActiveRef.current = false;
        });
    }, [onImageCaptured]);

    const handleCreatePostSubmit = useCallback((postData) => {
        setPendingPostData(postData);
        if (selectedDestination === 'feed') {
            switchModal(MODAL.CONFIRM_POST);
        } else if (selectedDestination === 'chef') {
            switchModal(MODAL.CHEF_REVIEW);
        } else {
            switchModal(MODAL.CONFIRM_AI_REVIEW);
        }
    }, [selectedDestination, switchModal]);

    const handleConfirmAiReview = useCallback(async () => {
        if (!pendingPostData || !selectedImage) return;

        if (fileSizeRef.current && fileSizeRef.current > MAX_UPLOAD_BYTES) {
            Alert.alert('Image Too Large', 'Please choose a photo under 9 MB and try again.');
            return;
        }

        setIsSubmitting(true);
        setUploadStatus('Uploading photo…');

        let uploadResult;
        try {
            uploadResult = await CloudinaryService.uploadImage(selectedImage, 'posts', { returnMeta: true });
            if (!uploadResult?.url) throw new Error('Image upload failed');
        } catch (err) {
            Alert.alert('Upload Failed', err.message || 'Could not upload the image. Please try again.');
            if (isMountedRef.current) { setIsSubmitting(false); setUploadStatus(null); }
            return;
        }

        // Persist URL + publicId — Share reuses URL, Close triggers cleanup by publicId
        aiUploadedImageUrlRef.current = uploadResult.url;
        aiUploadedPublicIdRef.current = uploadResult.publicId;

        setUploadStatus('Analyzing your dish…');

        try {
            const result = await AiReviewService.analyze({
                imageUrl:    uploadResult.url,
                title:       pendingPostData.title,
                description: pendingPostData.description,
                ingredients: pendingPostData.ingredients,
                difficulty:  pendingPostData.difficulty,
                cookTime:    pendingPostData.cookTime,
                token,
            });

            if (isMountedRef.current) {
                setAiReviewResult(result);
                setIsSubmitting(false);
                setUploadStatus(null);
                switchModal(MODAL.AI_REVIEW_RESULT);
            }
        } catch (err) {
            // Gemini failed after image was already uploaded — delete the orphan
            if (aiUploadedPublicIdRef.current) {
                api.delete(`/ai/cleanup?public_id=${encodeURIComponent(aiUploadedPublicIdRef.current)}`, token)
                   .catch(() => {});
                aiUploadedPublicIdRef.current = null;
                aiUploadedImageUrlRef.current = null;
            }
            const title = err.status === 402 ? 'Daily Limit Reached'
                        : err.status === 429 ? 'AI Service Busy'
                        : 'Analysis Failed';
            const message = err.data?.message || err.message || 'Could not analyze your dish. Please try again.';
            Alert.alert(title, message);
            if (isMountedRef.current) { setIsSubmitting(false); setUploadStatus(null); }
        }
    }, [pendingPostData, selectedImage, token, switchModal]);

    // Direct post using the already-uploaded Cloudinary URL — no re-upload, no confirm popup.
    const handleAiReviewShare = useCallback(async () => {
        if (!pendingPostData || !aiUploadedImageUrlRef.current) return;

        setIsSubmitting(true);
        setUploadStatus('Posting to feed…');

        try {
            await api.post('/posts', {
                title:                 pendingPostData.title,
                description:           pendingPostData.description,
                image_url:             aiUploadedImageUrlRef.current,
                cook_time:             pendingPostData.cookTime,
                difficulty:            pendingPostData.difficulty,
                utensils:              pendingPostData.utensils,
                ingredients:           pendingPostData.ingredients,
                instructions:          pendingPostData.instructions,
                chef_review_requested: false,
            }, token);

            if (isMountedRef.current) {
                refreshPosts();
                resetUploadState();
            }
        } catch (err) {
            const title = err.status === 429 ? 'Daily Limit Reached'
                        : String(err.data?.error || '').startsWith('Image rejected') ? 'Image Not Eligible'
                        : 'Post Failed';
            Alert.alert(title, err.message || 'Could not post. Please try again.');
            if (isMountedRef.current) { setIsSubmitting(false); setUploadStatus(null); }
        }
    }, [pendingPostData, token, refreshPosts, resetUploadState]);

    // User closed the result modal without sharing — delete the orphaned Cloudinary image.
    const handleAiReviewClose = useCallback(() => {
        if (aiUploadedPublicIdRef.current) {
            api.delete(
                `/ai/cleanup?public_id=${encodeURIComponent(aiUploadedPublicIdRef.current)}`,
                token
            ).catch(() => {});
        }
        resetUploadState();
    }, [token, resetUploadState]);

    const handleConfirmPost = useCallback(async () => {
        if (!pendingPostData || !selectedImage) return;

        if (fileSizeRef.current && fileSizeRef.current > MAX_UPLOAD_BYTES) {
            Alert.alert('Image Too Large', 'Please choose a photo under 9 MB and try again.');
            return;
        }

        setIsSubmitting(true);
        setUploadStatus('Uploading photo…');
        try {
            const imageUrl = await CloudinaryService.uploadImage(selectedImage, 'posts');
            if (!imageUrl) throw new Error('Image upload failed');

            setUploadStatus('Posting…');
            await api.post('/posts', {
                title: pendingPostData.title,
                description: pendingPostData.description,
                image_url: imageUrl,
                cook_time: pendingPostData.cookTime,
                difficulty: pendingPostData.difficulty,
                utensils: pendingPostData.utensils,
                ingredients: pendingPostData.ingredients,
                instructions: pendingPostData.instructions,
                chef_review_requested: false,
            }, token);

            if (isMountedRef.current) {
                refreshPosts();
                resetUploadState();
            }
        } catch (err) {
            const title = err.status === 429 ? 'Daily Limit Reached'
                        : String(err.data?.error || '').startsWith('Image rejected') ? 'Image Not Eligible'
                        : 'Post Failed';
            Alert.alert(title, err.message || 'Could not post. Please try again.');
            if (isMountedRef.current) { setIsSubmitting(false); setUploadStatus(null); }
        }
    }, [pendingPostData, selectedImage, token, refreshPosts, resetUploadState]);

    const handleCancelConfirm = useCallback(() => {
        switchModal(MODAL.CREATE_POST);
    }, [switchModal]);

    // Called after successful payment. Reuses the already-uploaded + validated Cloudinary URL
    // stored in chefReviewUploadedUrlRef — no second upload, no second Gemini call.
    const handleChefReviewSubmit = useCallback(async ({ feedbackContext, chefFilter }) => {
        if (!pendingPostData || !chefReviewUploadedUrlRef.current) return;

        setIsSubmitting(true);
        setUploadStatus('Submitting…');

        try {
            await api.post('/chef/submit-with-review', {
                title: pendingPostData.title,
                description: pendingPostData.description,
                image_url: chefReviewUploadedUrlRef.current,
                cook_time: pendingPostData.cookTime,
                difficulty: pendingPostData.difficulty,
                utensils: pendingPostData.utensils,
                ingredients: pendingPostData.ingredients,
                instructions: pendingPostData.instructions,
                context: feedbackContext,
                chef_filter: chefFilter || 'All Chefs',
            }, token);

            if (isMountedRef.current) {
                refreshPosts();
                resetUploadState();
            }
        } catch (err) {
            const title = err.status === 429 ? 'Daily Limit Reached' : 'Submission Failed';
            Alert.alert(title, err.message || 'Could not submit for review. Please try again.');
            if (isMountedRef.current) { setIsSubmitting(false); setUploadStatus(null); }
        }
    }, [pendingPostData, token, refreshPosts, resetUploadState]);

    // Stores the chef review fields and advances to the confirmation popup.
    // The actual upload only starts after the user confirms in ConfirmChefReviewPopup.
    const handleChefReviewStage = useCallback((data) => {
        setPendingChefReviewData(data);
        switchModal(MODAL.CHEF_REVIEW_CONFIRM);
    }, [switchModal]);

    const handleChefReviewConfirm = useCallback(async () => {
        if (!pendingChefReviewData || !selectedImage) return;

        if (fileSizeRef.current && fileSizeRef.current > MAX_UPLOAD_BYTES) {
            Alert.alert('Image Too Large', 'Please choose a photo under 9 MB and try again.');
            return;
        }

        setIsSubmitting(true);

        // Phase 1: upload image (skip if already uploaded, e.g. after a canceled payment retry)
        if (!chefReviewUploadedUrlRef.current) {
            setUploadStatus('Uploading photo…');
            try {
                const imageUrl = await CloudinaryService.uploadImage(selectedImage, 'posts');
                if (!imageUrl) throw new Error('Image upload failed');
                chefReviewUploadedUrlRef.current = imageUrl;
            } catch (err) {
                Alert.alert('Upload Failed', err.message || 'Could not upload the image. Please try again.');
                if (isMountedRef.current) { setIsSubmitting(false); setUploadStatus(null); }
                return;
            }

            // Phase 2: validate image is food BEFORE charging — backend deletes Cloudinary image if invalid
            setUploadStatus('Checking image…');
            try {
                await api.post('/chef/validate-image', { image_url: chefReviewUploadedUrlRef.current }, token);
            } catch (err) {
                chefReviewUploadedUrlRef.current = null;
                if (isMountedRef.current) { setIsSubmitting(false); setUploadStatus(null); }
                const title = err.status === 400 ? 'Image Not Eligible'
                            : err.status === 503 ? 'Validation Unavailable'
                            : 'Validation Error';
                const message = err.data?.message || err.message || 'Could not validate image. Please try again.';
                const buttons = err.status === 503
                    ? [{ text: 'OK', onPress: resetUploadState }]
                    : [
                        { text: 'Pick New Image', onPress: () => { setSelectedImage(null); switchModal(MODAL.IMAGE_SOURCE); } },
                        { text: 'Cancel', style: 'cancel', onPress: resetUploadState },
                    ];
                Alert.alert(title, message, buttons);
                return;
            }
        }

        // Phase 3: set up and present payment sheet
        setUploadStatus('Setting up payment…');

        let clientSecret;
        try {
            const result = await api.post('/payments/create-intent', {}, token);
            clientSecret = result.clientSecret;
        } catch (err) {
            Alert.alert('Payment Error', err.message || 'Could not initialize payment. Please try again.');
            if (isMountedRef.current) { setIsSubmitting(false); setUploadStatus(null); }
            return;
        }

        const { error: initError } = await initPaymentSheet({
            merchantDisplayName: 'Chop & Chat',
            paymentIntentClientSecret: clientSecret,
            style: 'alwaysDark',
        });

        if (initError) {
            Alert.alert('Payment Error', initError.message || 'Could not set up payment sheet.');
            if (isMountedRef.current) { setIsSubmitting(false); setUploadStatus(null); }
            return;
        }

        if (isMountedRef.current) { setIsSubmitting(false); setUploadStatus(null); }

        const { error: paymentError } = await presentPaymentSheet();

        if (paymentError) {
            if (paymentError.code !== 'Canceled') {
                Alert.alert('Payment Failed', paymentError.message || 'Your payment could not be processed. Please try again.');
            }
            // Image is already uploaded and validated — keep chefReviewUploadedUrlRef so
            // a retry skips the upload+validate steps and goes straight to payment.
            return;
        }

        handleChefReviewSubmit(pendingChefReviewData);
    }, [pendingChefReviewData, selectedImage, handleChefReviewSubmit, token, initPaymentSheet, presentPaymentSheet, switchModal, resetUploadState]);

    const handleCancelChefReviewConfirm = useCallback(() => {
        // Go back to RequestChefReviewModal — pendingChefReviewData is kept so the modal
        // can restore the form fields the user already filled in.
        switchModal(MODAL.CHEF_REVIEW);
    }, [switchModal]);

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
                onPress={() => setActiveModal(MODAL.DESTINATION_CHOICE)}
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

            <ActionChoiceModal
                visible={activeModal === MODAL.DESTINATION_CHOICE}
                onClose={resetUploadState}
                theme={theme}
                onPostToFeed={() => { setSelectedDestination('feed'); switchModal(MODAL.IMAGE_SOURCE); }}
                onGetAiRating={() => { setSelectedDestination('ai'); switchModal(MODAL.IMAGE_SOURCE); }}
                onGetChefReview={() => { setSelectedDestination('chef'); switchModal(MODAL.CHEF_REVIEW_WARNING); }}
            />

            <ChefReviewPaidWarning
                visible={activeModal === MODAL.CHEF_REVIEW_WARNING}
                onConfirm={() => switchModal(MODAL.IMAGE_SOURCE)}
                onCancel={resetUploadState}
            />

            <ImageSourceModal
                visible={activeModal === MODAL.IMAGE_SOURCE}
                onClose={resetUploadState}
                theme={theme}
                onTakePhoto={() => handlePickerAction('camera')}
                onAccessGallery={() => handlePickerAction('library')}
            />

            <CreatePostModal
                visible={activeModal === MODAL.CREATE_POST}
                imageUri={selectedImage}
                destination={selectedDestination}
                onClose={resetUploadState}
                onBack={() => switchModal(MODAL.IMAGE_SOURCE)}
                onSubmit={handleCreatePostSubmit}
            />

            <ConfirmPostPopup
                visible={activeModal === MODAL.CONFIRM_POST}
                onConfirm={handleConfirmPost}
                onCancel={handleCancelConfirm}
                onClose={resetUploadState}
                loading={isSubmitting}
                statusLabel={uploadStatus}
            />

            <RequestChefReviewModal
                visible={activeModal === MODAL.CHEF_REVIEW}
                postData={pendingPostData}
                onClose={resetUploadState}
                onBack={() => switchModal(MODAL.CREATE_POST)}
                onSubmit={handleChefReviewStage}
                initialFeedbackContext={pendingChefReviewData?.feedbackContext}
                initialChefFilter={pendingChefReviewData?.chefFilter}
                loading={isSubmitting}
            />

            <ConfirmChefReviewPopup
                visible={activeModal === MODAL.CHEF_REVIEW_CONFIRM}
                onConfirm={handleChefReviewConfirm}
                onCancel={handleCancelChefReviewConfirm}
                onClose={resetUploadState}
                loading={isSubmitting}
                chefFilter={pendingChefReviewData?.chefFilter}
                statusLabel={uploadStatus}
            />

            <ConfirmAiReviewPopup
                visible={activeModal === MODAL.CONFIRM_AI_REVIEW}
                onConfirm={handleConfirmAiReview}
                onCancel={() => switchModal(MODAL.CREATE_POST)}
                onClose={resetUploadState}
                loading={isSubmitting}
                statusLabel={uploadStatus}
            />

            <AiReviewResultModal
                visible={activeModal === MODAL.AI_REVIEW_RESULT}
                review={aiReviewResult?.review}
                quota={aiReviewResult?.quota}
                dishImage={selectedImage}
                onClose={handleAiReviewClose}
                onShare={handleAiReviewShare}
                loading={isSubmitting}
                statusLabel={uploadStatus}
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
