import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { wp, hp, fp } from '../../utils/responsive';
import { useTheme } from '../../context/ThemeContext';
import ConfirmationPopup from '../common/ConfirmationPopup';

export default function ChefReviewPaidWarning({ visible, onConfirm, onCancel }) {
    const { theme } = useTheme();

    return (
        <ConfirmationPopup
            visible={visible}
            onConfirm={onConfirm}
            onCancel={onCancel}
            onClose={onCancel}
            loading={false}
            iconName="restaurant-outline"
            iconColor={theme.primary}
            iconBgColor={theme.cardBackgroundAlt}
            title="Expert Chef Review"
            subtitle="A professional chef will personally review your dish and provide detailed feedback on presentation, technique, and flavor."
            confirmText="Pay $0.50 & Submit"
            confirmIcon="card-outline"
            confirmColor={theme.primary}
        >
            <View style={[styles.infoBox, { backgroundColor: theme.cardBackgroundAlt, borderColor: theme.border }]}>
                <View style={styles.featureRow}>
                    <Ionicons name="checkmark-circle" size={fp(16)} color={theme.primary} />
                    <Text style={[styles.featureText, { color: theme.textSecondary }]}>Sent to real verified chefs</Text>
                </View>
                <View style={styles.featureRow}>
                    <Ionicons name="checkmark-circle" size={fp(16)} color={theme.primary} />
                    <Text style={[styles.featureText, { color: theme.textSecondary }]}>Personalized written feedback</Text>
                </View>
                <View style={styles.featureRow}>
                    <Ionicons name="shield-checkmark" size={fp(16)} color={theme.primary} />
                    <Text style={[styles.featureText, { color: theme.textSecondary }]}>Secure payment via Stripe</Text>
                </View>
            </View>
        </ConfirmationPopup>
    );
}

const styles = StyleSheet.create({
    infoBox: {
        width: '100%',
        borderRadius: wp(12),
        borderWidth: 1,
        padding: wp(16),
        marginBottom: hp(20),
        gap: hp(10),
    },
    featureRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: wp(10),
    },
    featureText: {
        flex: 1,
        fontSize: fp(14),
        fontWeight: '500',
    },
});
