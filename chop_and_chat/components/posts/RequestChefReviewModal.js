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
    Image,
    Animated
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { wp, hp, fp, SPACING } from '../../utils/responsive';
import { useTheme } from '../../context/ThemeContext';

const CHEF_FILTERS = ['Following', 'All Chefs'];

export default function RequestChefReviewModal({ 
    visible, 
    onClose, 
    onBack,
    dish,
    imageUri,
    onSubmit 
}) {
    const { theme } = useTheme();
    const [selectedFilter, setSelectedFilter] = useState('Following');
    const [feedbackContext, setFeedbackContext] = useState('');
    const [imageExpanded, setImageExpanded] = useState(false);
    const [rotateAnim] = useState(new Animated.Value(0));

    const toggleImageExpanded = () => {
        const toValue = imageExpanded ? 0 : 1;
        
        Animated.timing(rotateAnim, {
            toValue,
            duration: 300,
            useNativeDriver: true,
        }).start();
        
        setImageExpanded(!imageExpanded);
    };

    const arrowRotation = rotateAnim.interpolate({
        inputRange: [0, 1],
        outputRange: ['0deg', '180deg'],
    });

    const handleSubmit = () => {
        if (!feedbackContext.trim()) {
            Alert.alert(
                'Context Required',
                'Please specify some of the ingredients and/or preparation steps.',
                [{ text: 'OK' }]
            );
            return;
        }

        onSubmit?.({
            dishId: dish?.id,
            dishTitle: dish?.title,
            context: feedbackContext.trim(),
            chefFilter: selectedFilter,
            timestamp: new Date().toISOString()
        });

        setFeedbackContext('');
        setSelectedFilter('Following');
        setImageExpanded(false);
        rotateAnim.setValue(0);
        onClose();

        Alert.alert(
            'Request Sent!!',
            selectedFilter === 'Following' 
                ? 'Chefs you follow will be notified about your review request.'
                : 'All chefs in the community will be notified about your review request.',
            [{ text: 'OK' }]
        );
    };

    const handleClose = () => {
        setFeedbackContext('');
        setSelectedFilter('Following');
        setImageExpanded(false);
        rotateAnim.setValue(0);
        onClose();
    };

    const handleBackPress = () => {
        console.log('Back pressed in RequestChefReviewModal, calling onBack');
        setFeedbackContext('');
        setSelectedFilter('Following');
        setImageExpanded(false);
        rotateAnim.setValue(0);
        onBack?.();
    };

    return (
        <Modal
            visible={visible}
            transparent={true}
            animationType="slide"
            onRequestClose={handleClose}
        >
            <View style={styles.overlay}>
                <Pressable 
                    style={styles.overlayPressable} 
                    onPress={handleClose}
                />
                <KeyboardAvoidingView 
                    behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                    style={styles.keyboardAvoid}
                >
                    <View style={[styles.modalContainer, { backgroundColor: theme.modalBackground }]}>
                        {/* Header */}
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
                            {/* Dish Info - Pressable */}
                            {dish && (
                                <>
                                    <Pressable 
                                        style={[styles.dishInfo, { backgroundColor: theme.cardBackgroundAlt }]}
                                        onPress={toggleImageExpanded}
                                    >
                                        <Ionicons name="restaurant-outline" size={fp(20)} color={theme.primary} />
                                        <Text style={[styles.dishTitle, { color: theme.textPrimary }]} numberOfLines={1}>
                                            {dish.title}
                                        </Text>
                                        <Animated.View style={{ transform: [{ rotate: arrowRotation }] }}>
                                            <Ionicons name="chevron-down" size={fp(20)} color={theme.textSecondary} />
                                        </Animated.View>
                                    </Pressable>

                                    {/* Expandable Image */}
                                    {imageExpanded && imageUri && (
                                        <View style={styles.imageContainer}>
                                            <Image 
                                                source={{ uri: imageUri }} 
                                                style={styles.dishImage}
                                                resizeMode="cover"
                                            />
                                        </View>
                                    )}
                                </>
                            )}

                            {/* Info Section */}
                            <View style={[styles.infoBox, { backgroundColor: theme.primaryLightest }]}>
                                <Ionicons name="information-circle" size={fp(20)} color={theme.primary} />
                                <Text style={[styles.infoText, { color: theme.textSecondary }]}>
                                    Professional chefs will review your dish and provide feedback based on 
                                    presentation, technique, and flavor potential. Tell them what they need to know!
                                </Text>
                            </View>

                            {/* Feedback Context Input */}
                            <Text style={[styles.label, { color: theme.textPrimary }]}>
                                Specify the ingredients and/or preparation steps. <Text style={styles.required}>*</Text>
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
                                placeholder="e.g., Chicken breast, garlic, olive oil. Seasoned and pan-seared for 5 minutes each side, then baked at 180°C for 15 minutes."
                                placeholderTextColor={theme.textTertiary}
                                value={feedbackContext}
                                onChangeText={setFeedbackContext}
                                multiline
                                numberOfLines={6}
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

                            {/* Submit Button inside ScrollView */}
                            <Pressable
                                style={[styles.submitButton, { backgroundColor: '#2563EB' }]}
                                onPress={handleSubmit}
                            >
                                <Ionicons name="paper-plane" size={fp(18)} color="#FFFFFF" />
                                <Text style={styles.submitButtonText}>Send Request</Text>
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
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
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
    imageContainer: {
        width: '100%',
        marginBottom: hp(16),
        borderRadius: wp(12),
        overflow: 'hidden',
    },
    dishImage: {
        width: '100%',
        height: hp(140),
        backgroundColor: '#F3F4F6',
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
        color: '#FFFFFF',
        fontSize: fp(16),
        fontWeight: '700',
    },
});