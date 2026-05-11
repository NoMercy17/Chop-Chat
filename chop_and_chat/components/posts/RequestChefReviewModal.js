import { useState, useEffect } from 'react';
import {
    View,
    Text,
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

const CHEF_FILTERS = ['Following', 'All Chefs'];

export default function RequestChefReviewModal({
    visible,
    onClose,
    onBack,
    postData,
    onSubmit,
    // Initial form values — restored when the user comes back from ConfirmChefReviewPopup.
    // Both are null/undefined on a fresh start, which resets the form to defaults.
    initialFeedbackContext,
    initialChefFilter,
    loading,
}) {
    const { theme } = useTheme();
    const [selectedFilter, setSelectedFilter] = useState('Following');
    const [feedbackContext, setFeedbackContext] = useState('');

    // Reset form to initial values each time the modal becomes visible.
    // When going back from ConfirmChefReviewPopup, initialFeedbackContext/Filter still hold
    // the staged data (MainActions hasn't cleared them), so the user's input is restored.
    // When starting fresh, both are undefined/null, so the form resets to defaults.
    useEffect(() => {
        if (visible) {
            setFeedbackContext(initialFeedbackContext ?? '');
            setSelectedFilter(initialChefFilter ?? 'Following');
        }
    }, [visible]); // eslint-disable-line react-hooks/exhaustive-deps

    const handleSubmit = () => {
        if (!feedbackContext.trim()) {
            Alert.alert(
                'Context Required',
                'Please add some context for the chef.',
                [{ text: 'OK' }]
            );
            return;
        }
        // Stage the data — the actual upload is triggered from ConfirmChefReviewPopup.
        onSubmit?.({
            feedbackContext: feedbackContext.trim(),
            chefFilter: selectedFilter,
        });
    };

    const handleClose = () => {
        // Block dismissal while the upload is in progress — dismissing mid-upload would
        // leave MainActions stuck in isSubmitting=true with no way to recover.
        if (loading) return;
        setFeedbackContext('');
        setSelectedFilter('Following');
        onClose();
    };

    const handleBackPress = () => {
        // Same guard as handleClose — navigating back mid-upload has the same stuck-state risk.
        if (loading) return;
        setFeedbackContext('');
        setSelectedFilter('Following');
        onBack?.();
        // TODO: implement left/right slide transition between this modal and CreatePostModal.
        // The current architecture uses independent React Native <Modal> components with a
        // 200ms NONE gap via switchModal() — horizontal slide would require either combining
        // both steps into a single Modal container with Animated translate, or migrating to
        // a React Navigation stack for the create-post flow.
    };

    return (
        <Modal
            visible={visible}
            transparent={true}
            animationType="slide"
            onRequestClose={handleClose}
        >
            <View style={[styles.overlay, { backgroundColor: theme.overlayBackground }]}>
                <Pressable
                    style={styles.overlayPressable}
                    onPress={handleClose}
                />
                <KeyboardAvoidingView
                    behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                    style={styles.keyboardAvoid}
                >
                    <View style={[styles.modalContainer, { backgroundColor: theme.modalBackground }]}>
                        <View style={[styles.header, { borderBottomColor: theme.border }]}>
                            <Pressable onPress={handleBackPress} style={({ pressed }) => [styles.backButton, pressed && { opacity: 0.6 }]}>
                                <Ionicons name="arrow-back" size={fp(24)} color={theme.textPrimary} />
                            </Pressable>
                            <Text style={[styles.title, { color: theme.textPrimary }]}>
                                Request Chef Review
                            </Text>
                            <View style={styles.placeholder} />
                        </View>

                        <ScrollView
                            style={styles.scrollContent}
                            contentContainerStyle={styles.scrollContentContainer}
                            showsVerticalScrollIndicator={false}
                            keyboardShouldPersistTaps="handled"
                        >
                            {postData?.title && (
                                <View style={[styles.dishInfo, { backgroundColor: theme.cardBackgroundAlt }]}>
                                    <Ionicons name="restaurant-outline" size={fp(20)} color={theme.primary} />
                                    <Text style={[styles.dishTitle, { color: theme.textPrimary }]} numberOfLines={1}>
                                        {postData.title}
                                    </Text>
                                </View>
                            )}

                            <View style={[styles.infoBox, { backgroundColor: theme.primaryLightest }]}>
                                <Ionicons name="information-circle" size={fp(20)} color={theme.primary} />
                                <Text style={[styles.infoText, { color: theme.textSecondary }]}>
                                    Professional chefs will review your dish and provide feedback based on
                                    presentation, technique, and flavor potential. Tell them what they need to know!
                                </Text>
                            </View>

                            <Text style={[styles.label, { color: theme.textPrimary }]}>
                                Want to add anything else? <Text style={{ color: theme.danger }}>*</Text>
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
                                placeholder="Anything else the chef should know about your technique or preparation?"
                                placeholderTextColor={theme.textTertiary}
                                value={feedbackContext}
                                onChangeText={setFeedbackContext}
                                multiline
                                numberOfLines={6}
                                textAlignVertical="top"
                            />

                            <Text style={[styles.label, { color: theme.textPrimary, marginTop: hp(20) }]}>
                                Who can review?
                            </Text>
                            <View style={styles.filterContainer}>
                                {CHEF_FILTERS.map((filter) => (
                                    <Pressable
                                        key={filter}
                                        style={[
                                            styles.filterOption,
                                            {
                                                backgroundColor: selectedFilter === filter
                                                    ? theme.primary
                                                    : theme.cardBackgroundAlt,
                                                borderColor: selectedFilter === filter
                                                    ? theme.primary
                                                    : theme.border
                                            }
                                        ]}
                                        onPress={() => setSelectedFilter(filter)}
                                    >
                                        <Ionicons
                                            name={filter === 'Following' ? 'people' : 'globe-outline'}
                                            size={fp(16)}
                                            color={selectedFilter === filter ? theme.textInverse : theme.textSecondary}
                                        />
                                        <Text style={[
                                            styles.filterText,
                                            {
                                                color: selectedFilter === filter
                                                    ? theme.textInverse
                                                    : theme.textPrimary
                                            }
                                        ]}>
                                            {filter}
                                        </Text>
                                    </Pressable>
                                ))}
                            </View>

                            <Text style={[styles.filterHint, { color: theme.textTertiary }]}>
                                {selectedFilter === 'Following'
                                    ? 'Only chefs you follow will see this request'
                                    : 'All verified chefs can see and claim this request'
                                }
                            </Text>

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
                                        <Ionicons name="paper-plane-outline" size={fp(18)} color={theme.textInverse} />
                                        <Text style={[styles.submitButtonText, { color: theme.textInverse }]}>Post</Text>
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
        flex: 1,
    },
    keyboardAvoid: {
        maxHeight: '85%',
    },
    modalContainer: {
        borderTopLeftRadius: wp(24),
        borderTopRightRadius: wp(24),
        height: '100%',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: wp(20),
        paddingTop: hp(20),
        paddingBottom: hp(16),
        borderBottomWidth: 1,
    },
    title: {
        fontSize: fp(18),
        fontWeight: '700',
        flex: 1,
        textAlign: 'center',
    },
    backButton: {
        padding: wp(4),
        width: wp(32),
    },
    placeholder: {
        width: wp(32),
    },
    scrollContent: {
        flex: 1,
    },
    scrollContentContainer: {
        padding: wp(20),
        paddingBottom: hp(40),
    },
    dishInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: wp(10),
        padding: wp(12),
        borderRadius: wp(12),
        marginBottom: hp(16),
    },
    dishTitle: {
        fontSize: fp(15),
        fontWeight: '600',
        flex: 1,
    },
    infoBox: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: wp(10),
        padding: wp(14),
        borderRadius: wp(12),
        marginBottom: hp(20),
    },
    infoText: {
        flex: 1,
        fontSize: fp(13),
        lineHeight: fp(19),
    },
    label: {
        fontSize: fp(14),
        fontWeight: '600',
        marginBottom: hp(8),
    },
    textInput: {
        borderWidth: 1,
        borderRadius: wp(12),
        padding: wp(14),
        fontSize: fp(14),
        minHeight: hp(120),
    },
    filterContainer: {
        flexDirection: 'row',
        gap: wp(12),
    },
    filterOption: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: wp(8),
        paddingVertical: hp(14),
        borderRadius: wp(12),
        borderWidth: 1,
    },
    filterText: {
        fontSize: fp(14),
        fontWeight: '600',
    },
    filterHint: {
        fontSize: fp(12),
        marginTop: hp(10),
        marginBottom: hp(24),
        textAlign: 'center',
    },
    submitButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: wp(8),
        paddingVertical: hp(16),
        borderRadius: wp(12),
    },
    submitButtonText: {
        fontSize: fp(16),
        fontWeight: '700',
    },
});
