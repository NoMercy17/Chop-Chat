import { useState, useEffect, useContext } from 'react';
import {
    View,
    Text,
    Image,
    StyleSheet,
    Modal,
    Pressable,
    TextInput,
    Alert,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    ActivityIndicator
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { wp, hp, fp } from '../../utils/responsive';
import { useTheme } from '../../context/ThemeContext';
import { AuthContext } from '../../context/AuthContext';
import { api } from '../../services/api';

function getDifficultyColor(difficulty, theme) {
    switch (difficulty?.toLowerCase()) {
        case 'easy':   return theme.success;
        case 'medium': return theme.warning;
        case 'hard':   return theme.danger;
        default:       return theme.textTertiary;
    }
}

const UTENSIL_MAP = {
    oven:      { label: 'Oven',      icon: 'tablet-landscape-outline' },
    stove:     { label: 'Stove',     icon: 'flame-outline' },
    mixer:     { label: 'Mixer',     icon: 'sync-outline' },
    blender:   { label: 'Blender',   icon: 'color-wand-outline' },
    microwave: { label: 'Microwave', icon: 'tv-outline' },
    grill:     { label: 'Grill',     icon: 'bonfire-outline' },
    airfryer:  { label: 'Air Fryer', icon: 'leaf-outline' },
    pot:       { label: 'Pot',       icon: 'water-outline' },
    wok:       { label: 'Wok',       icon: 'restaurant-outline' },
};

export default function ChefReviewModal({ visible, onClose, request, onSubmit }) {
    const { theme } = useTheme();
    const { token } = useContext(AuthContext);
    const [reviewText, setReviewText] = useState('');
    const [loading, setLoading] = useState(false);
    const [postFullData, setPostFullData] = useState(null);
    const [postFetchError, setPostFetchError] = useState(false);
    const [recipeExpanded, setRecipeExpanded] = useState(false);

    useEffect(() => {
        if (!visible) {
            setPostFullData(null);
            setPostFetchError(false);
            setRecipeExpanded(false);
            return;
        }
        const postId = request?.data?.postId || request?.post_id;
        if (!postId || !token) return;

        let cancelled = false;
        api.get(`/posts/${postId}`, token)
            .then(data => { if (!cancelled) setPostFullData(data ?? null); })
            .catch(err => {
                console.error('[ChefReviewModal] Failed to fetch post:', err.message);
                if (!cancelled) setPostFetchError(true);
            });
        return () => { cancelled = true; };
    }, [visible, request, token]);

    const handleSubmit = async () => {
        if (!reviewText.trim()) {
            Alert.alert('Review Required', 'Please provide your professional feedback.');
            return;
        }
        setLoading(true);
        try {
            await onSubmit({
                post_id: request.post_id || request.data?.postId,
                request_id: request.id || request.data?.requestId,
                reaction_text: reviewText.trim()
            });
            setReviewText('');
            onClose();
        } catch (error) {
            Alert.alert('Error', error.message || 'Failed to submit review');
        } finally {
            setLoading(false);
        }
    };

    if (!request) return null;

    const requesterName = request.requester_name || request.data?.requesterName || 'User';
    const postTitle = request.post_title || request.data?.postTitle || 'Dish';

    return (
        <Modal
            visible={visible}
            transparent={true}
            animationType="slide"
            onRequestClose={onClose}
        >
            <View style={[styles.overlay, { backgroundColor: theme.overlayBackground }]}>
                <Pressable style={styles.overlayPressable} onPress={onClose} />
                <KeyboardAvoidingView
                    behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                    style={styles.keyboardAvoid}
                >
                    <View style={[styles.modalContainer, { backgroundColor: theme.modalBackground }]}>
                        <View style={[styles.header, { borderBottomColor: theme.border }]}>
                            <Text style={[styles.title, { color: theme.textPrimary }]}>
                                Write Chef Review
                            </Text>
                            <Pressable
                                onPress={onClose}
                                style={({ pressed }) => [styles.closeButton, pressed && { opacity: 0.6 }]}
                            >
                                <Ionicons name="close" size={fp(24)} color={theme.textPrimary} />
                            </Pressable>
                        </View>

                        <ScrollView
                            style={styles.scrollContent}
                            contentContainerStyle={styles.scrollContentContainer}
                            showsVerticalScrollIndicator={false}
                            keyboardShouldPersistTaps="handled"
                        >
                            {/* Who / what is being reviewed */}
                            <View style={[styles.infoCard, { backgroundColor: theme.primaryLightest }]}>
                                <Text style={[styles.infoLabel, { color: theme.primary }]}>
                                    Reviewing for {requesterName}
                                </Text>
                                <Text style={[styles.infoTitle, { color: theme.textPrimary }]}>
                                    {postTitle}
                                </Text>
                                {request.context && (
                                    <View style={[styles.contextBox, { borderTopColor: theme.border }]}>
                                        <Text style={[styles.contextLabel, { color: theme.textSecondary }]}>
                                            User's context:
                                        </Text>
                                        <Text style={[styles.contextText, { color: theme.textPrimary }]}>
                                            {request.context}
                                        </Text>
                                    </View>
                                )}
                            </View>

                            {/* Collapsible full recipe panel — chef can expand while composing */}
                            <Pressable
                                style={[styles.recipePanelToggle, { backgroundColor: theme.cardBackgroundAlt, borderColor: theme.border }]}
                                onPress={() => setRecipeExpanded(prev => !prev)}
                            >
                                <View style={styles.recipePanelToggleLeft}>
                                    <Ionicons name="receipt-outline" size={fp(18)} color={theme.primary} />
                                    <Text style={[styles.recipePanelToggleText, { color: theme.textPrimary }]}>
                                        Full Recipe
                                    </Text>
                                </View>
                                <Ionicons
                                    name={recipeExpanded ? 'chevron-up' : 'chevron-down'}
                                    size={fp(18)}
                                    color={theme.textSecondary}
                                />
                            </Pressable>

                            {recipeExpanded && (
                                <View style={[styles.recipePanel, { backgroundColor: theme.cardBackgroundAlt, borderColor: theme.border }]}>
                                    {postFullData ? (
                                        <>
                                            {postFullData.image && (
                                                <View style={styles.recipePanelImageContainer}>
                                                    <Image
                                                        source={{ uri: postFullData.image }}
                                                        style={styles.recipePanelImage}
                                                        resizeMode="cover"
                                                    />
                                                </View>
                                            )}

                                            <View style={styles.recipePanelMeta}>
                                                {postFullData.difficulty && (
                                                    <View style={[
                                                        styles.difficultyBadge,
                                                        { backgroundColor: getDifficultyColor(postFullData.difficulty, theme) + '22' }
                                                    ]}>
                                                        <Text style={[styles.difficultyText, { color: getDifficultyColor(postFullData.difficulty, theme) }]}>
                                                            {postFullData.difficulty}
                                                        </Text>
                                                    </View>
                                                )}
                                                {postFullData.cookTime && (
                                                    <View style={styles.metaBadge}>
                                                        <Ionicons name="time-outline" size={fp(14)} color={theme.textSecondary} />
                                                        <Text style={[styles.metaText, { color: theme.textSecondary }]}>
                                                            {postFullData.cookTime}
                                                        </Text>
                                                    </View>
                                                )}
                                            </View>

                                            {postFullData.description && (
                                                <>
                                                    <Text style={[styles.panelSectionTitle, { color: theme.textPrimary }]}>
                                                        Description
                                                    </Text>
                                                    <Text style={[styles.panelText, { color: theme.textSecondary }]}>
                                                        {postFullData.description}
                                                    </Text>
                                                </>
                                            )}

                                            {postFullData.utensils?.length > 0 && (
                                                <>
                                                    <Text style={[styles.panelSectionTitle, { color: theme.textPrimary }]}>
                                                        Kitchen Tools
                                                    </Text>
                                                    <View style={styles.utensilRow}>
                                                        {postFullData.utensils.map((id) => {
                                                            const u = UTENSIL_MAP[id];
                                                            if (!u) return null;
                                                            return (
                                                                <View key={id} style={[styles.utensilChip, { backgroundColor: theme.primaryLightest, borderColor: theme.primary }]}>
                                                                    <Ionicons name={u.icon} size={fp(13)} color={theme.primary} />
                                                                    <Text style={[styles.utensilChipText, { color: theme.primary }]}>{u.label}</Text>
                                                                </View>
                                                            );
                                                        })}
                                                    </View>
                                                </>
                                            )}

                                            {postFullData.ingredients?.length > 0 && (
                                                <>
                                                    <Text style={[styles.panelSectionTitle, { color: theme.textPrimary }]}>
                                                        Ingredients
                                                    </Text>
                                                    {postFullData.ingredients.map((ing, i) => (
                                                        <Text key={i} style={[styles.panelText, { color: theme.textSecondary }]}>
                                                            • {ing}
                                                        </Text>
                                                    ))}
                                                </>
                                            )}

                                            {postFullData.instructions && (
                                                <>
                                                    <Text style={[styles.panelSectionTitle, { color: theme.textPrimary }]}>
                                                        Steps
                                                    </Text>
                                                    <Text style={[styles.panelText, { color: theme.textSecondary }]}>
                                                        {postFullData.instructions}
                                                    </Text>
                                                </>
                                            )}
                                        </>
                                    ) : postFetchError ? (
                                        <Text style={[styles.fetchErrorText, { color: theme.textSecondary }]}>
                                            Could not load recipe details
                                        </Text>
                                    ) : (
                                        <ActivityIndicator
                                            size="small"
                                            color={theme.primary}
                                            style={{ marginVertical: hp(16) }}
                                        />
                                    )}
                                </View>
                            )}

                            <Text style={[styles.label, { color: theme.textPrimary }]}>
                                Your Professional Feedback
                            </Text>
                            <TextInput
                                style={[
                                    styles.textInput,
                                    {
                                        backgroundColor: theme.inputBackground,
                                        color: theme.textPrimary,
                                        borderColor: theme.border
                                    }
                                ]}
                                placeholder="Presentation looks great! To improve the flavor, try adding some fresh herbs..."
                                placeholderTextColor={theme.textTertiary}
                                value={reviewText}
                                onChangeText={setReviewText}
                                multiline
                                numberOfLines={6}
                                textAlignVertical="top"
                            />

                            <Pressable
                                style={({ pressed }) => [
                                    styles.submitButton,
                                    { backgroundColor: theme.primary },
                                    (pressed || loading) && { opacity: 0.8 }
                                ]}
                                onPress={handleSubmit}
                                disabled={loading}
                            >
                                {loading ? (
                                    <ActivityIndicator color={theme.textInverse} />
                                ) : (
                                    <>
                                        <Ionicons name="checkmark-circle" size={fp(20)} color={theme.textInverse} />
                                        <Text style={[styles.submitButtonText, { color: theme.textInverse }]}>
                                            Submit Review
                                        </Text>
                                    </>
                                )}
                            </Pressable>
                        </ScrollView>
                    </View>
                </KeyboardAvoidingView>
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        justifyContent: 'flex-end',
    },
    overlayPressable: {
        position: 'absolute',
        top: 0, left: 0, right: 0, bottom: 0,
    },
    keyboardAvoid: {
        maxHeight: '90%',
        width: '100%',
    },
    modalContainer: {
        borderTopLeftRadius: wp(24),
        borderTopRightRadius: wp(24),
        height: '100%',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: hp(16),
        paddingHorizontal: wp(20),
        borderBottomWidth: 1,
    },
    title: {
        fontSize: fp(18),
        fontWeight: '700',
    },
    closeButton: {
        position: 'absolute',
        right: wp(20),
        padding: wp(4),
    },
    scrollContent: {
        flex: 1,
        padding: wp(20),
    },
    scrollContentContainer: {
        paddingBottom: hp(40),
    },
    infoCard: {
        padding: wp(16),
        borderRadius: wp(12),
        marginBottom: hp(16),
    },
    infoLabel: {
        fontSize: fp(12),
        fontWeight: '600',
        marginBottom: hp(4),
    },
    infoTitle: {
        fontSize: fp(18),
        fontWeight: '700',
        marginBottom: hp(4),
    },
    contextBox: {
        marginTop: hp(10),
        paddingTop: hp(10),
        borderTopWidth: 1,
    },
    contextLabel: {
        fontSize: fp(12),
        fontWeight: '500',
        marginBottom: hp(4),
    },
    contextText: {
        fontSize: fp(14),
        fontStyle: 'italic',
    },
    // Collapsible recipe panel
    recipePanelToggle: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: hp(12),
        paddingHorizontal: wp(14),
        borderRadius: wp(12),
        borderWidth: 1,
        marginBottom: hp(4),
    },
    recipePanelToggleLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: wp(8),
    },
    recipePanelToggleText: {
        fontSize: fp(14),
        fontWeight: '600',
    },
    recipePanel: {
        borderRadius: wp(12),
        borderWidth: 1,
        padding: wp(14),
        marginBottom: hp(20),
    },
    recipePanelImageContainer: {
        borderRadius: wp(8),
        overflow: 'hidden',
        marginBottom: hp(12),
    },
    recipePanelImage: {
        width: '100%',
        height: hp(180),
    },
    recipePanelMeta: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: wp(10),
        marginBottom: hp(12),
    },
    difficultyBadge: {
        paddingHorizontal: wp(10),
        paddingVertical: hp(4),
        borderRadius: wp(8),
    },
    difficultyText: {
        fontSize: fp(12),
        fontWeight: '700',
        textTransform: 'capitalize',
    },
    metaBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: wp(4),
    },
    metaText: {
        fontSize: fp(13),
    },
    panelSectionTitle: {
        fontSize: fp(13),
        fontWeight: '700',
        marginBottom: hp(6),
        marginTop: hp(10),
    },
    panelText: {
        fontSize: fp(13),
        lineHeight: hp(20),
        marginBottom: hp(2),
    },
    utensilRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: wp(6),
        marginBottom: hp(4),
    },
    utensilChip: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: wp(5),
        paddingVertical: hp(5),
        paddingHorizontal: wp(10),
        borderRadius: wp(20),
        borderWidth: 1,
    },
    utensilChipText: {
        fontSize: fp(12),
        fontWeight: '500',
    },
    fetchErrorText: {
        fontSize: fp(13),
        textAlign: 'center',
        paddingVertical: hp(16),
    },
    label: {
        fontSize: fp(16),
        fontWeight: '600',
        marginBottom: hp(12),
    },
    textInput: {
        height: hp(150),
        borderRadius: wp(12),
        borderWidth: 1,
        padding: wp(16),
        fontSize: fp(15),
        marginBottom: hp(24),
    },
    submitButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: wp(8),
        height: hp(56),
        borderRadius: wp(28),
    },
    submitButtonText: {
        fontSize: fp(16),
        fontWeight: '700',
    },
});
