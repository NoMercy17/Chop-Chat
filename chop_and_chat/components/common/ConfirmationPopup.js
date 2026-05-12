import { View, Text, StyleSheet, Modal, Pressable, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { wp, hp, fp } from '../../utils/responsive';
import { useTheme } from '../../context/ThemeContext';

export default function ConfirmationPopup({
    visible,
    onConfirm,
    onCancel,
    onClose,
    loading,
    statusLabel,
    iconName,
    iconColor,
    iconBgColor,
    title,
    subtitle,
    confirmText,
    confirmIcon,
    confirmColor,
    confirmTextColor = '#FFFFFF',
    children
}) {
    const { theme, isDarkMode } = useTheme();

    return (
        <Modal
            visible={visible}
            transparent={true}
            animationType="fade"
            onRequestClose={loading ? () => {} : onCancel}
        >
            <Pressable
                style={[styles.overlay, { backgroundColor: theme.overlayBackgroundDark }]}
                onPress={!loading ? onClose : undefined}
            >
                <Pressable
                    style={[
                        styles.card,
                        {
                            backgroundColor: theme.cardBackground,
                            shadowColor: theme.shadowColor,
                            shadowOpacity: isDarkMode ? 0.4 : 0.14,
                        },
                    ]}
                    onPress={() => {}}
                >
                    <View style={[styles.iconPill, { backgroundColor: iconBgColor }]}>
                        <Ionicons name={iconName} size={fp(28)} color={iconColor} />
                    </View>

                    <Text style={[styles.title, { color: theme.textPrimary }]}>
                        {title}
                    </Text>
                    <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
                        {subtitle}
                    </Text>

                    {children}

                    <View style={[styles.divider, { backgroundColor: theme.border }]} />

                    <Pressable
                        style={({ pressed }) => [
                            styles.confirmButton,
                            { backgroundColor: confirmColor },
                            pressed && { opacity: 0.82, transform: [{ scale: 0.97 }] },
                            loading && { opacity: 0.72 },
                        ]}
                        onPress={onConfirm}
                        disabled={loading}
                    >
                        {loading ? (
                            <View style={styles.loadingRow}>
                                <ActivityIndicator color={confirmTextColor} size="small" />
                                {statusLabel ? (
                                    <Text style={[styles.statusLabel, { color: confirmTextColor }]}>
                                        {statusLabel}
                                    </Text>
                                ) : null}
                            </View>
                        ) : (
                            <View style={styles.confirmInner}>
                                <Ionicons
                                    name={confirmIcon}
                                    size={fp(18)}
                                    color={confirmTextColor}
                                    style={styles.confirmIcon}
                                />
                                <Text style={[styles.confirmText, { color: confirmTextColor }]}>
                                    {confirmText}
                                </Text>
                            </View>
                        )}
                    </Pressable>

                    <Pressable
                        style={({ pressed }) => [
                            styles.cancelButton,
                            pressed && { opacity: 0.5 },
                        ]}
                        onPress={onCancel}
                        disabled={loading}
                    >
                        <Text style={[styles.cancelText, { color: loading ? theme.textTertiary : theme.textSecondary }]}>
                            Go Back
                        </Text>
                    </Pressable>
                </Pressable>
            </Pressable>
        </Modal>
    );
}

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: wp(28),
    },
    card: {
        width: '100%',
        maxWidth: wp(360),
        borderRadius: wp(28),
        paddingHorizontal: wp(28),
        paddingTop: wp(32),
        paddingBottom: wp(24),
        alignItems: 'center',
        shadowOffset: { width: 0, height: hp(8) },
        shadowRadius: wp(24),
        elevation: 16,
    },
    iconPill: {
        width: wp(68),
        height: wp(68),
        borderRadius: wp(34),
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: hp(20),
    },
    title: {
        fontSize: fp(20),
        fontWeight: '700',
        letterSpacing: -0.4,
        textAlign: 'center',
        marginBottom: hp(10),
    },
    subtitle: {
        fontSize: fp(14),
        textAlign: 'center',
        lineHeight: fp(21),
        marginBottom: hp(24),
        paddingHorizontal: wp(4),
    },
    divider: {
        width: '100%',
        height: 1,
        borderRadius: 1,
        marginBottom: hp(20),
        opacity: 0.6,
    },
    confirmButton: {
        width: '100%',
        height: hp(54),
        borderRadius: wp(16),
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: hp(4),
    },
    loadingRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: wp(10),
    },
    statusLabel: {
        fontSize: fp(14),
        fontWeight: '600',
    },
    confirmInner: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    confirmIcon: {
        marginRight: wp(7),
    },
    confirmText: {
        fontSize: fp(16),
        fontWeight: '700',
        letterSpacing: 0.1,
    },
    cancelButton: {
        height: hp(48),
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: wp(20),
    },
    cancelText: {
        fontSize: fp(14),
        fontWeight: '500',
    },
});
