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
    ScrollView
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { wp, hp, fp } from '../../utils/responsive';
import { useTheme } from '../../context/ThemeContext';

const CHEF_FILTERS = ['Following', 'All Chefs'];

export default function RequestChefReviewModal({ 
    visible, 
    onClose, 
    dish,
    onSubmit 
}) {
    const { theme } = useTheme();
    const [selectedFilter, setSelectedFilter] = useState('Following');
    const [feedbackContext, setFeedbackContext] = useState('');

    const handleSubmit = () => {
        if (!feedbackContext.trim()) {
            Alert.alert(
                'Context Required',
                'Please describe what kind of feedback you\'re looking for.',
                [{ text: 'OK' }]
            );
            return;
        }

        // Submit the review request
        onSubmit?.({
            dishId: dish?.id,
            dishTitle: dish?.title,
            context: feedbackContext.trim(),
            chefFilter: selectedFilter,
            timestamp: new Date().toISOString()
        });

        // Reset and close
        setFeedbackContext('');
        setSelectedFilter('Following');
        onClose();

        Alert.alert(
            'Request Sent! 🎉',
            selectedFilter === 'Following' 
                ? 'Chefs you follow will be notified about your review request.'
                : 'All chefs in the community will be notified about your review request.',
            [{ text: 'OK' }]
        );
    };

    const handleClose = () => {
        setFeedbackContext('');
        setSelectedFilter('Following');
        onClose();
    };

    return (
        <Modal
            visible={visible}
            transparent={true}
            animationType="slide"
            onRequestClose={handleClose}
        >
            <Pressable style={styles.overlay} onPress={handleClose}>
                <KeyboardAvoidingView 
                    behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                    style={{ width: '100%' }}
                >
                    <Pressable 
                        style={[styles.modalContainer, { backgroundColor: theme.modalBackground }]}
                        onPress={(e) => e.stopPropagation()}
                    >
                        {/* Header */}
                        <View style={[styles.header, { borderBottomColor: theme.border }]}>
                            <Text style={[styles.title, { color: theme.textPrimary }]}>
                                Request Chef Review
                            </Text>
                            <Pressable onPress={handleClose} style={styles.closeButton}>
                                <Ionicons name="close" size={fp(24)} color={theme.textSecondary} />
                            </Pressable>
                        </View>

                        <ScrollView 
                            style={styles.content}
                            showsVerticalScrollIndicator={false}
                            keyboardShouldPersistTaps="handled"
                        >
                            {/* Dish Info */}
                            {dish && (
                                <View style={[styles.dishInfo, { backgroundColor: theme.cardBackgroundAlt }]}>
                                    <Ionicons name="restaurant-outline" size={fp(20)} color={theme.primary} />
                                    <Text style={[styles.dishTitle, { color: theme.textPrimary }]} numberOfLines={1}>
                                        {dish.title}
                                    </Text>
                                </View>
                            )}

                            {/* Info Section */}
                            <View style={[styles.infoBox, { backgroundColor: theme.primaryLightest }]}>
                                <Ionicons name="information-circle" size={fp(20)} color={theme.primary} />
                                <Text style={[styles.infoText, { color: theme.textSecondary }]}>
                                    Professional chefs will review your dish and provide feedback based on 
                                    presentation, technique, and flavor potential. Tell them what aspects 
                                    you'd like reviewed!
                                </Text>
                            </View>

                            {/* Feedback Context Input */}
                            <Text style={[styles.label, { color: theme.textPrimary }]}>
                                What feedback are you looking for? <Text style={styles.required}>*</Text>
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
                                placeholder="e.g., How can I improve the plating? Is the sauce consistency right?"
                                placeholderTextColor={theme.textTertiary}
                                value={feedbackContext}
                                onChangeText={setFeedbackContext}
                                multiline
                                numberOfLines={4}
                                textAlignVertical="top"
                            />

                            {/* Chef Selection */}
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
                                            color={selectedFilter === filter ? '#FFFFFF' : theme.textSecondary} 
                                        />
                                        <Text style={[
                                            styles.filterText,
                                            { 
                                                color: selectedFilter === filter 
                                                    ? '#FFFFFF' 
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
                        </ScrollView>

                        {/* Submit Button */}
                        <View style={[styles.footer, { borderTopColor: theme.border }]}>
                            <Pressable
                                style={[styles.submitButton, { backgroundColor: theme.primary }]}
                                onPress={handleSubmit}
                            >
                                <Ionicons name="paper-plane" size={fp(18)} color="#FFFFFF" />
                                <Text style={styles.submitButtonText}>Send Request</Text>
                            </Pressable>
                        </View>
                    </Pressable>
                </KeyboardAvoidingView>
            </Pressable>
        </Modal>
    );
}

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'flex-end',
    },
    modalContainer: {
        borderTopLeftRadius: wp(24),
        borderTopRightRadius: wp(24),
        maxHeight: '85%',
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
    },
    closeButton: {
        padding: wp(4),
    },
    content: {
        padding: wp(20),
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
    required: {
        color: '#EF4444',
    },
    textInput: {
        borderWidth: 1,
        borderRadius: wp(12),
        padding: wp(14),
        fontSize: fp(14),
        minHeight: hp(100),
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
        textAlign: 'center',
    },
    footer: {
        padding: wp(20),
        paddingBottom: hp(30),
        borderTopWidth: 1,
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
        color: '#FFFFFF',
        fontSize: fp(16),
        fontWeight: '700',
    },
});
