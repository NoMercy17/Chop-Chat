import React from 'react';
import { View, Text, StyleSheet, Modal, Pressable } from 'react-native';
import { wp, hp, fp } from '../../../utils/responsive';

export default function ActionChoiceModal({ 
    visible, 
    onClose, 
    theme, 
    onPostToFeed, 
    onGetAiRating, 
    onGetChefReview 
}) {
    return (
        <Modal 
            visible={visible} 
            transparent={true} 
            animationType="fade"
            onRequestClose={onClose}
        >
            <Pressable 
                style={[styles.overlay, { backgroundColor: theme.overlayBackgroundDark }]}
                onPress={onClose}
            >
                <Pressable style={[styles.card, { backgroundColor: theme.cardBackground }]}>
                    <View style={styles.header}>
                        <Text style={[styles.title, { color: theme.textPrimary }]}>What's next?</Text>
                        <Text style={[styles.subtitle, { color: theme.textSecondary }]}>Choose an action for your dish</Text>
                    </View>

                    <View style={styles.buttonsContainer}>
                        <Pressable
                            style={({ pressed }) => [
                                styles.actionButton,
                                { backgroundColor: theme.primaryLightest },
                                pressed && styles.actionButtonPressed
                            ]}
                            onPress={onPostToFeed}
                        >
                            <View style={styles.textContainer}>
                                <Text style={[styles.buttonTitle, { color: theme.textPrimary }]}>Post to Feed</Text>
                                <Text style={[styles.buttonSubtitle, { color: theme.textSecondary }]}>Share with the community</Text>
                            </View>
                            <Text style={[styles.arrow, { color: theme.primary }]}>→</Text>
                        </Pressable>

                        <Pressable
                            style={({ pressed }) => [
                                styles.actionButton,
                                { backgroundColor: theme.warningLight }, 
                                pressed && styles.actionButtonPressed
                            ]}
                            onPress={onGetAiRating}
                        >
                            <View style={styles.textContainer}>
                                <Text style={[styles.buttonTitle, { color: theme.textPrimary }]}>Get AI Rating</Text>
                                <Text style={[styles.buttonSubtitle, { color: theme.textSecondary }]}>Let AI judge your creation</Text>
                            </View>
                            <Text style={[styles.arrow, { color: theme.warning }]}>→</Text>
                        </Pressable>

                        <Pressable
                            style={({ pressed }) => [
                                styles.actionButton,
                                { backgroundColor: theme.chefReviewButtonBg },
                                pressed && styles.actionButtonPressed
                            ]}
                            onPress={onGetChefReview}
                        >
                            <View style={styles.textContainer}>
                                <View style={styles.chefTitleRow}>
                                    <Text style={[styles.buttonTitle, { color: theme.textPrimary }]}>Get Chef Review</Text>
                                                    <View style={[styles.paidBadge, { backgroundColor: theme.paid }]}>
                                        <Text style={[styles.paidBadgeText, { color: theme.textInverse }]}>PAID</Text>
                                    </View>
                                </View>
                                <Text style={[styles.buttonSubtitle, { color: theme.textSecondary }]}>Get feedback from real chefs · $0.50</Text>
                            </View>
                            <Text style={[styles.arrow, { color: theme.textTertiary }]}>→</Text>
                        </Pressable>
                    </View>

                    <Pressable
                        style={({ pressed }) => [
                            styles.cancelButton,
                            { backgroundColor: theme.dangerLighter },
                            pressed && styles.cancelButtonPressed
                        ]}
                        onPress={onClose}
                    >
                        <Text style={[styles.cancelButtonText, { color: theme.dangerMuted }]}>Cancel</Text>
                    </Pressable>
                </Pressable>
            </Pressable>
        </Modal>
    );
}

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.6)',
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: wp(24),
    },
    card: {
        borderRadius: wp(24),
        width: '100%',
        maxWidth: wp(340),
        paddingVertical: hp(24),
        paddingHorizontal: wp(20),
        shadowColor: '#000',
        shadowOffset: { width: 0, height: hp(8) },
        shadowOpacity: 0.15,
        shadowRadius: wp(24),
        elevation: 12,
    },
    header: {
        alignItems: 'center',
        marginBottom: hp(24),
    },
    title: {
        fontSize: fp(20),
        fontWeight: '700',
        marginBottom: hp(4),
    },
    subtitle: {
        fontSize: fp(14),
    },
    buttonsContainer: {
        gap: hp(8),
        marginBottom: hp(16),
    },
    actionButton: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: hp(16),
        paddingHorizontal: wp(16),
        borderRadius: wp(12),
    },
    actionButtonPressed: {
        opacity: 0.8,
        transform: [{ scale: 0.98 }],
    },
    textContainer: {
        flex: 1,
    },
    buttonTitle: {
        fontSize: fp(16),
        fontWeight: '600',
    },
    buttonSubtitle: {
        fontSize: fp(13),
        marginTop: hp(2),
    },
    arrow: {
        fontSize: fp(20),
    },
    cancelButton: {
        alignItems: 'center',
        paddingVertical: hp(14),
        borderRadius: wp(12),
    },
    cancelButtonPressed: {
        opacity: 0.7,
        transform: [{ scale: 0.98 }],
    },
    cancelButtonText: {
        fontSize: fp(16),
        fontWeight: "700",
    },
    chefTitleRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: wp(8),
    },
    paidBadge: {
        borderRadius: wp(6),
        paddingHorizontal: wp(6),
        paddingVertical: hp(2),
    },
    paidBadgeText: {
        fontSize: fp(10),
        fontWeight: '800',
        letterSpacing: 0.8,
    },
});
