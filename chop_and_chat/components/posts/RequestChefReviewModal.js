import { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    Pressable,
    TextInput,
    Alert,
    ScrollView,
    ActivityIndicator
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { wp, hp, fp } from '../../utils/responsive';
import { useTheme } from '../../context/ThemeContext';
import BottomSheetModal from '../common/BottomSheetModal';

const CHEF_FILTERS = ['Following', 'All Chefs'];

export default function RequestChefReviewModal({
    visible,
    onClose,
    onBack,
    postData,
    onSubmit,
    initialFeedbackContext,
    initialChefFilter,
    loading,
}) {
    const { theme } = useTheme();
    const [selectedFilter, setSelectedFilter] = useState('Following');
    const [feedbackContext, setFeedbackContext] = useState('');

    useEffect(() => {
        if (visible) {
            setFeedbackContext(initialFeedbackContext ?? '');
            setSelectedFilter(initialChefFilter ?? 'Following');
        }
    }, [visible, initialFeedbackContext, initialChefFilter]);

    const handleSubmit = () => {
        if (!feedbackContext.trim()) {
            Alert.alert(
                'Context Required',
                'Please add some context for the chef.',
                [{ text: 'OK' }]
            );
            return;
        }
        onSubmit?.({
            feedbackContext: feedbackContext.trim(),
            chefFilter: selectedFilter,
        });
    };

    const handleClose = () => {
        if (loading) return;
        setFeedbackContext('');
        setSelectedFilter('Following');
        onClose();
    };

    const handleBackPress = () => {
        if (loading) return;
        setFeedbackContext('');
        setSelectedFilter('Following');
        onBack?.();
    };

    return (
        <BottomSheetModal
            visible={visible}
            onClose={handleClose}
            title="Chef Review"
            subtitle="Step 2 of 2"
            leftIcon="arrow-back"
            onLeftPress={handleBackPress}
            keyboardAvoidMaxHeight="85%"
        >
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
        </BottomSheetModal>
    );
}

const styles = StyleSheet.create({
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
