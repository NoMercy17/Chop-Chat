import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { fp, hp, wp } from '../../utils/responsive';
import { useTheme } from '../../context/ThemeContext';
import ConfirmationPopup from '../common/ConfirmationPopup';

export default function ConfirmAiReviewPopup({ visible, onConfirm, onCancel, onClose, loading, statusLabel }) {
    const { theme } = useTheme();

    return (
        <ConfirmationPopup
            visible={visible}
            onConfirm={onConfirm}
            onCancel={onCancel}
            onClose={onClose}
            loading={loading}
            statusLabel={statusLabel}
            iconName="flash"
            iconColor={theme.warning}now 
            iconBgColor={theme.warningLight}
            title="Analyze with AI?"
            subtitle="Your dish photo and recipe details will be analyzed by AI. You'll receive a detailed score and feedback within seconds."
            confirmText="Analyze Now"
            confirmIcon="flash-outline"
            confirmColor={theme.warning}
        >
            <View style={[styles.quotaNote, { backgroundColor: theme.aiRatingButtonBg }]}>
                <Ionicons name="information-circle-outline" size={fp(15)} color={theme.warning} style={styles.quotaIcon} />
                <Text style={[styles.quotaText, { color: theme.warning }]}>
                    Uses 1 of your 3 daily AI reviews
                </Text>
            </View>
        </ConfirmationPopup>
    );
}

const styles = StyleSheet.create({
    quotaNote: {
        flexDirection: 'row',
        alignItems: 'center',
        alignSelf: 'stretch',
        paddingVertical: hp(10),
        paddingHorizontal: wp(14),
        borderRadius: wp(12),
        marginBottom: hp(20),
        marginTop: -hp(10), // Adjust for the subtitle margin
    },
    quotaIcon: {
        marginRight: wp(6),
    },
    quotaText: {
        fontSize: fp(13),
        fontWeight: '500',
    },
});
