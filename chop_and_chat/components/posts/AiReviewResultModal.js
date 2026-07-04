import { useState, useEffect, useRef } from 'react';
import {
    View, Text, StyleSheet, Modal, ScrollView, Pressable,
    Image, Animated, Easing, ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { wp, hp, fp } from '../../utils/responsive';
import { useTheme } from '../../context/ThemeContext';

function getOverallColor(score, theme) {
    if (score >= 8) return theme.success;
    if (score >= 5) return theme.warning;
    return theme.danger;
}

function getOverallBgColor(score, theme) {
    if (score >= 8) return theme.successLight;
    if (score >= 5) return theme.warningLight;
    return theme.dangerLight;
}

export default function AiReviewResultModal({ visible, review, quota, dishImage, onClose, onShare, loading, statusLabel }) {
    const { theme, isDarkMode } = useTheme();
    const insets = useSafeAreaInsets();

    const [displayScore, setDisplayScore] = useState('0.0');
    const scoreAnim = useRef(new Animated.Value(0)).current;
    const listenerId = useRef(null);

    useEffect(() => {
        if (!visible || !review) {
            setDisplayScore('0.0');
            scoreAnim.setValue(0);
            return;
        }

        scoreAnim.setValue(0);
        setDisplayScore('0.0');

        listenerId.current = scoreAnim.addListener(({ value }) => {
            setDisplayScore((Math.round(value * 10) / 10).toFixed(1));
        });

        Animated.timing(scoreAnim, {
            toValue: review.overall_score,
            duration: 1100,
            delay: 200,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: false,
        }).start();

        return () => {
            if (listenerId.current) {
                scoreAnim.removeListener(listenerId.current);
                listenerId.current = null;
            }
        };
    }, [visible, review]);

    if (!review) return null;

    const overallColor = getOverallColor(review.overall_score, theme);
    const overallBgColor = getOverallBgColor(review.overall_score, theme);
    const quotaRemaining = quota ? quota.limit - quota.used : null;

    const isPostable = review.isFood && !['fruit', 'vegetable', 'non_food'].includes(review.foodCategory);

    return (
        <Modal
            visible={visible}
            transparent={false}
            animationType="slide"
            onRequestClose={loading ? () => {} : onClose}
            statusBarTranslucent
        >
            <View style={[styles.container, { backgroundColor: theme.background, paddingTop: insets.top }]}>
                {/* Header */}
                <View style={[styles.header, { borderBottomColor: theme.border, backgroundColor: theme.modalBackground }]}>
                    <Pressable
                        onPress={onClose}
                        style={({ pressed }) => [styles.headerBtn, pressed && { opacity: 0.5 }]}
                    >
                        <Ionicons name="close" size={fp(24)} color={theme.textPrimary} />
                    </Pressable>

                    <View style={styles.headerCenter}>
                        <Text style={[styles.headerTitle, { color: theme.textPrimary }]}>AI Review</Text>
                    </View>

                    {quotaRemaining !== null ? (
                        <View style={[styles.quotaBadge, { backgroundColor: theme.aiRatingButtonBg }]}>
                            <Text style={[styles.quotaBadgeText, { color: theme.warning }]}>
                                {quotaRemaining} left today
                            </Text>
                        </View>
                    ) : (
                        <View style={styles.headerBtn} />
                    )}
                </View>

                <ScrollView
                    style={styles.scroll}
                    contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + hp(100) }]}
                    showsVerticalScrollIndicator={false}
                >
                    {/* Dish image */}
                    {dishImage ? (
                        <View style={styles.imageWrapper}>
                            <Image source={{ uri: dishImage }} style={styles.dishImage} resizeMode="cover" />
                            <View style={[styles.imageOverlay, { backgroundColor: theme.overlayBackgroundDark }]} />

                            {/* Overall score on top of image */}
                            <View style={[styles.scoreBadge, { backgroundColor: overallBgColor }]}>
                                <Text style={[styles.scoreNumber, { color: overallColor }]}>{displayScore}</Text>
                                <Text style={[styles.scoreDenominator, { color: overallColor }]}>/10</Text>
                            </View>
                        </View>
                    ) : null}

                    {/* Summary */}
                    <View style={[styles.summaryCard, { backgroundColor: theme.cardBackground, borderColor: theme.border }]}>
                        <Text style={[styles.summaryText, { color: theme.textPrimary }]}>{review.summary}</Text>
                    </View>

                    {/* Strengths */}
                    {review.strengths?.length > 0 && (
                        <View style={[styles.listCard, { backgroundColor: theme.cardBackground, borderColor: theme.border }]}>
                            <Text style={[styles.listTitle, { color: theme.textPrimary }]}>What works well</Text>
                            {review.strengths.map((s, i) => (
                                <View key={i} style={styles.listRow}>
                                    <Ionicons name="checkmark-circle" size={fp(16)} color={theme.success} style={styles.listIcon} />
                                    <Text style={[styles.listText, { color: theme.textPrimary }]}>{s}</Text>
                                </View>
                            ))}
                        </View>
                    )}

                    {/* Improvements */}
                    {review.improvements?.length > 0 && (
                        <View style={[styles.listCard, { backgroundColor: theme.cardBackground, borderColor: theme.border }]}>
                            <Text style={[styles.listTitle, { color: theme.textPrimary }]}>Room to improve</Text>
                            {review.improvements.map((s, i) => (
                                <View key={i} style={styles.listRow}>
                                    <Ionicons name="arrow-up-circle-outline" size={fp(16)} color={theme.warning} style={styles.listIcon} />
                                    <Text style={[styles.listText, { color: theme.textPrimary }]}>{s}</Text>
                                </View>
                            ))}
                        </View>
                    )}

                    {/* Chef tip */}
                    {review.chef_tip ? (
                        <View style={[styles.tipCard, { backgroundColor: theme.aiRatingButtonBg, borderColor: theme.warning }]}>
                            <View style={styles.tipHeader}>
                                <Ionicons name="bulb-outline" size={fp(18)} color={theme.warning} style={styles.tipIcon} />
                                <Text style={[styles.tipLabel, { color: theme.warning }]}>Pro Tip</Text>
                            </View>
                            <Text style={[styles.tipText, { color: theme.textPrimary }]}>{review.chef_tip}</Text>
                        </View>
                    ) : null}
                </ScrollView>

                {/* Sticky footer */}
                <View style={[
                    styles.footer,
                    {
                        backgroundColor: theme.modalBackground,
                        borderTopColor: theme.border,
                        paddingBottom: insets.bottom + hp(12),
                    },
                ]}>
                    {isPostable ? (
                        <Pressable
                            style={({ pressed }) => [
                                styles.shareButton,
                                { backgroundColor: theme.primary },
                                pressed && !loading && { opacity: 0.82, transform: [{ scale: 0.98 }] },
                                loading && { opacity: 0.72 },
                            ]}
                            onPress={onShare}
                            disabled={loading}
                        >
                            {loading ? (
                                <View style={styles.loadingRow}>
                                    <ActivityIndicator color={theme.textInverse} size="small" />
                                    {statusLabel ? (
                                        <Text style={[styles.shareText, { color: theme.textInverse }]}>{statusLabel}</Text>
                                    ) : null}
                                </View>
                            ) : (
                                <>
                                    <Ionicons name="share-social-outline" size={fp(18)} color={theme.textInverse} style={styles.shareIcon} />
                                    <Text style={[styles.shareText, { color: theme.textInverse }]}>Share to Feed</Text>
                                </>
                            )}
                        </Pressable>
                    ) : (
                        <View style={[styles.shareButton, { backgroundColor: theme.cardBackgroundAlt, borderWidth: 1, borderColor: theme.border }]}>
                             <Ionicons name="ban-outline" size={fp(18)} color={theme.textTertiary} style={styles.shareIcon} />
                             <Text style={[styles.shareText, { color: theme.textTertiary, fontSize: fp(14) }]}>Not eligible for community feed</Text>
                        </View>
                    )}

                    <Pressable
                        style={({ pressed }) => [styles.closeButton, pressed && { opacity: 0.5 }]}
                        onPress={!loading ? onClose : undefined}
                        disabled={loading}
                    >
                        <Text style={[styles.closeText, { color: loading ? theme.textTertiary : theme.textSecondary }]}>Close</Text>
                    </Pressable>
                </View>
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: wp(16),
        paddingVertical: hp(14),
        borderBottomWidth: 1,
    },
    headerBtn: {
        width: wp(44),
        height: wp(44),
        justifyContent: 'center',
        alignItems: 'center',
    },
    headerCenter: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
        justifyContent: 'center',
    },
    headerIcon: {
        marginRight: wp(6),
    },
    headerTitle: {
        fontSize: fp(18),
        fontWeight: '700',
    },
    quotaBadge: {
        paddingHorizontal: wp(10),
        paddingVertical: hp(4),
        borderRadius: wp(20),
    },
    quotaBadgeText: {
        fontSize: fp(11),
        fontWeight: '600',
    },
    scroll: {
        flex: 1,
    },
    scrollContent: {
        paddingHorizontal: wp(16),
        paddingTop: hp(16),
    },
    imageWrapper: {
        borderRadius: wp(20),
        overflow: 'hidden',
        marginBottom: hp(16),
        height: hp(200),
    },
    dishImage: {
        width: '100%',
        height: '100%',
    },
    imageOverlay: {
        ...StyleSheet.absoluteFillObject,
        opacity: 0.25,
    },
    scoreBadge: {
        position: 'absolute',
        bottom: hp(16),
        right: wp(16),
        flexDirection: 'row',
        alignItems: 'flex-end',
        paddingHorizontal: wp(14),
        paddingVertical: hp(8),
        borderRadius: wp(16),
    },
    scoreNumber: {
        fontSize: fp(36),
        fontWeight: '800',
        lineHeight: fp(40),
        letterSpacing: -1,
    },
    scoreDenominator: {
        fontSize: fp(16),
        fontWeight: '600',
        marginBottom: hp(4),
        marginLeft: wp(2),
    },
    summaryCard: {
        borderRadius: wp(16),
        borderWidth: 1,
        padding: wp(16),
        marginBottom: hp(16),
    },
    summaryText: {
        fontSize: fp(14),
        lineHeight: fp(22),
    },
    lowConfidenceRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: hp(12),
        padding: wp(10),
        borderRadius: wp(10),
    },
    warnIcon: {
        marginRight: wp(6),
    },
    lowConfidenceText: {
        fontSize: fp(12),
        flex: 1,
    },
    sectionLabel: {
        fontSize: fp(11),
        fontWeight: '700',
        letterSpacing: 1,
        marginBottom: hp(10),
        marginTop: hp(4),
    },
    listCard: {
        borderRadius: wp(16),
        borderWidth: 1,
        padding: wp(16),
        marginBottom: hp(10),
    },
    listTitle: {
        fontSize: fp(14),
        fontWeight: '700',
        marginBottom: hp(12),
    },
    listRow: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        marginBottom: hp(8),
    },
    listIcon: {
        marginRight: wp(10),
        marginTop: hp(1),
    },
    listText: {
        fontSize: fp(14),
        lineHeight: fp(20),
        flex: 1,
    },
    tipCard: {
        borderRadius: wp(16),
        borderWidth: 1.5,
        padding: wp(16),
        marginBottom: hp(10),
    },
    tipHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: hp(8),
    },
    tipIcon: {
        marginRight: wp(6),
    },
    tipLabel: {
        fontSize: fp(13),
        fontWeight: '700',
        letterSpacing: 0.3,
    },
    tipText: {
        fontSize: fp(14),
        lineHeight: fp(21),
    },
    footer: {
        paddingHorizontal: wp(16),
        paddingTop: hp(12),
        borderTopWidth: 1,
    },
    loadingRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: wp(8),
    },
    shareButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        height: hp(54),
        borderRadius: wp(16),
        marginBottom: hp(4),
    },
    shareIcon: {
        marginRight: wp(8),
    },
    shareText: {
        fontSize: fp(16),
        fontWeight: '700',
    },
    closeButton: {
        height: hp(44),
        justifyContent: 'center',
        alignItems: 'center',
    },
    closeText: {
        fontSize: fp(14),
        fontWeight: '500',
    },
});
