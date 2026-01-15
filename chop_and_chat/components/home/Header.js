import { Text, View, StyleSheet, Pressable, Modal, ScrollView } from 'react-native';
import { useState } from 'react';
import { wp, hp, fp, SPACING } from '../../utils/responsive';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';

const notifications = [
    { id: 1, title: 'New Recipe Match', subtitle: 'Found 3 recipes for your ingredients', time: '2m ago', unread: true },
    { id: 2, title: 'Chef Review Posted', subtitle: 'Your dish got reviewed by Chef Gordon', time: '1h ago', unread: true },
    { id: 3, title: 'Popular Dish Alert', subtitle: 'Your pizza got 50 likes!', time: '3h ago', unread: false },
    { id: 4, title: 'Trending Recipe', subtitle: 'Check out this week\'s most popular dish', time: '5h ago', unread: false },
    { id: 5, title: 'Community Highlight', subtitle: 'You were featured in the feed', time: '1d ago', unread: true },
];

export default function Header({ navigation }) {
    const [modalVisible, setModalVisible] = useState(false);
    const { theme } = useTheme();

    return (
        <View style={[styles.container, { backgroundColor: theme.primary }]}>
            <Text style={[styles.appName, { color: theme.textInverse }]}>Cook&Chat</Text>

            <View style={styles.rightButtons}>
                <Pressable 
                    style={({ pressed }) => [
                        styles.button,
                        pressed && styles.buttonPressed
                    ]}
                    onPress={() => setModalVisible(true)}
                >
                    <Ionicons name="notifications" size={fp(22)} color={theme.textInverse} />
                </Pressable>

                <Pressable 
                    style={({ pressed }) => [
                        styles.button,
                        pressed && styles.buttonPressed
                    ]}
                    onPress={() => navigation.navigate('Profile')}
                >
                    <Ionicons name="person" size={fp(22)} color={theme.textInverse} />
                </Pressable>
            </View>

            {/* Notifications Modal */}
            <Modal visible={modalVisible} transparent={true} animationType='slide'>
                <View style={[styles.modalOverlay, { backgroundColor: theme.overlayBackground }]}>
                    <View style={[styles.modalContainer, { backgroundColor: theme.modalBackground }]}>
                        <View style={[styles.modalHeader, { borderBottomColor: theme.borderLight }]}>
                            <Text style={[styles.modalTitle, { color: theme.textPrimary }]}>Notifications</Text>
                        </View>
                        
                        <ScrollView 
                            style={styles.notificationList}
                            showsVerticalScrollIndicator={false}
                        >
                            {notifications.map((notif) => (
                                <Pressable
                                    key={notif.id}
                                    style={({ pressed }) => [
                                        styles.notificationItem,
                                        { backgroundColor: theme.cardBackgroundAlt, borderColor: theme.borderLight },
                                        notif.unread && [styles.notificationUnread, { backgroundColor: theme.primaryLightest, borderColor: theme.primaryLighter }],
                                        pressed && styles.notificationPressed
                                    ]}
                                    onPress={() => console.log('Notification pressed:', notif.id)}
                                >
                                    <View style={styles.notificationContent}>
                                        <View style={styles.notificationHeader}>
                                            <Text style={[styles.notificationTitle, { color: theme.textPrimary }]}>{notif.title}</Text>
                                            <Text style={[styles.notificationTime, { color: theme.textTertiary }]}>{notif.time}</Text>
                                        </View>
                                        <Text style={[styles.notificationSubtitle, { color: theme.textSecondary }]}>{notif.subtitle}</Text>
                                    </View>
                                    {notif.unread && <View style={[styles.unreadDot, { backgroundColor: theme.primary }]} />}
                                </Pressable>
                            ))}
                        </ScrollView>

                        <Pressable 
                            onPress={() => setModalVisible(false)} 
                            style={({ pressed }) => [
                                styles.closeButton,
                                { backgroundColor: theme.background },
                                pressed && styles.closeButtonPressed
                            ]}
                        >
                            <Text style={[styles.closeButtonText, { color: theme.textMuted }]}>Close</Text>
                        </Pressable>
                    </View>
                </View>
            </Modal>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: SPACING.screenPadding,
        paddingVertical: hp(8),
    },
    appName: {
        fontSize: fp(24),
        fontWeight: '700',
        color: '#111827',
        letterSpacing: -0.5,
    },
    rightButtons: {
        flexDirection: 'row',
        gap: wp(12),
    },
    button: {
        width: wp(36),
        height: wp(36),
        borderRadius: wp(10),
        backgroundColor: '#3b83f68a',
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#3B82F6',
        shadowOffset: { width: 0, height: hp(4) },
        shadowOpacity: 0.2,
        shadowRadius: wp(8),
        elevation: 4,
    },
    buttonPressed: {
        opacity: 0.8,
        transform: [{ scale: 0.96 }],
    },
    buttonText: {
        fontSize: fp(20),
    },

    // Modal Styles
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'flex-end',
    },
    modalContainer: {
        backgroundColor: '#FFFFFF',
        borderTopLeftRadius: wp(24),
        borderTopRightRadius: wp(24),
        maxHeight: '85%',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: hp(-4) },
        shadowOpacity: 0.1,
        shadowRadius: wp(12),
        elevation: 8,
    },
    modalHeader: {
        paddingHorizontal: wp(24),
        paddingTop: hp(24),
        paddingBottom: hp(16),
        borderBottomWidth: 1,
        borderBottomColor: '#F3F4F6',
    },
    modalTitle: {
        fontSize: fp(28),
        fontWeight: '700',
        color: '#111827',
    },

    // Notification List
    notificationList: {
        paddingHorizontal: wp(25),
        paddingTop: hp(12),
    },
    notificationItem: {
        flexDirection: 'row',
        backgroundColor: '#F9FAFB',
        padding: wp(16),
        borderRadius: wp(16),
        marginBottom: hp(12),
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#F3F4F6',
    },
    notificationUnread: {
        backgroundColor: '#EFF6FF',
        borderColor: '#DBEAFE',
    },
    notificationPressed: {
        opacity: 0.7,
        transform: [{ scale: 0.98 }],
    },
    notificationContent: {
        flex: 1,
    },
    notificationHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 6,
    },
    notificationTitle: {
        fontSize: fp(16),
        fontWeight: '600',
        color: '#111827',
        flex: 1,
    },
    notificationTime: {
        fontSize: fp(12),
        color: '#9CA3AF',
        fontWeight: '500',
        marginLeft: wp(8),
    },
    notificationSubtitle: {
        fontSize: fp(14),
        color: '#6B7280',
        lineHeight: hp(20),
    },
    unreadDot: {
        width: wp(8),
        height: wp(8),
        borderRadius: wp(4),
        backgroundColor: '#3b83f6c2',
        marginLeft: wp(12),
    },

    // Close Button
    closeButton: {
        margin: wp(24),
        marginTop: hp(16),
        paddingVertical: hp(16),
        backgroundColor: '#F3F4F6',
        borderRadius: wp(12),
        alignItems: 'center',
    },
    closeButtonPressed: {
        opacity: 0.7,
        transform: [{ scale: 0.98 }],
    },
    closeButtonText: {
        color: '#374151',
        fontSize: fp(16),
        fontWeight: '600',
    },
});