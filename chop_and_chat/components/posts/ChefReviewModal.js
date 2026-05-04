import React, { useState } from 'react';
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
import { wp, hp, fp, SPACING } from '../../utils/responsive';
import { useTheme } from '../../context/ThemeContext';

export default function ChefReviewModal({ 
    visible, 
    onClose, 
    request,
    onSubmit 
}) {
    const { theme } = useTheme();
    const [reviewText, setReviewText] = useState('');
    const [loading, setLoading] = useState(false);

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
            <View style={styles.overlay}>
                <Pressable style={styles.overlayPressable} onPress={onClose} />
                <KeyboardAvoidingView 
                    behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                    style={styles.keyboardAvoid}
                >
                    <View style={[styles.modalContainer, { backgroundColor: theme.modalBackground }]}>
                        {/* Header */}
                        <View style={[styles.header, { borderBottomColor: theme.border }]}>
                            <Text style={[styles.title, { color: theme.textPrimary }]}>
                                Write Chef Review
                            </Text>
                            <Pressable onPress={onClose} style={styles.closeButton}>
                                <Ionicons name="close" size={fp(24)} color={theme.textPrimary} />
                            </Pressable>
                        </View>

                        <ScrollView 
                            style={styles.scrollContent}
                            contentContainerStyle={styles.scrollContentContainer}
                            showsVerticalScrollIndicator={false}
                        >
                            <View style={[styles.infoCard, { backgroundColor: theme.primaryLightest }]}>
                                <Text style={[styles.infoLabel, { color: theme.primary }]}>Reviewing for {requesterName}</Text>
                                <Text style={[styles.infoTitle, { color: theme.textPrimary }]}>{postTitle}</Text>
                                {request.context && (
                                    <View style={styles.contextBox}>
                                        <Text style={[styles.contextLabel, { color: theme.textSecondary }]}>User's Context:</Text>
                                        <Text style={[styles.contextText, { color: theme.textPrimary }]}>{request.context}</Text>
                                    </View>
                                )}
                            </View>

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
                                    <ActivityIndicator color="#FFF" />
                                ) : (
                                    <>
                                        <Ionicons name="checkmark-circle" size={fp(20)} color="#FFF" />
                                        <Text style={styles.submitButtonText}>Submit Review</Text>
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
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'flex-end',
    },
    overlayPressable: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
    },
    keyboardAvoid: {
        width: '100%',
    },
    modalContainer: {
        width: '100%',
        borderTopLeftRadius: wp(24),
        borderTopRightRadius: wp(24),
        maxHeight: hp(750),
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
    },
    scrollContent: {
        padding: wp(20),
    },
    scrollContentContainer: {
        paddingBottom: hp(40),
    },
    infoCard: {
        padding: wp(16),
        borderRadius: wp(12),
        marginBottom: hp(24),
    },
    infoLabel: {
        fontSize: fp(12),
        fontWeight: '600',
        marginBottom: hp(4),
    },
    infoTitle: {
        fontSize: fp(18),
        fontWeight: '700',
        marginBottom: hp(12),
    },
    contextBox: {
        marginTop: hp(8),
        paddingTop: hp(8),
        borderTopWidth: 1,
        borderTopColor: 'rgba(0,0,0,0.05)',
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
        color: '#FFFFFF',
        fontSize: fp(16),
        fontWeight: '700',
    },
});
