import { Text, View, StyleSheet, Pressable, Modal, ScrollView } from 'react-native';
import { useState } from 'react';

export default function Header({ navigation }) {
    const [modalVisible, setModalVisible] = useState(false);

    return (
        <View style={styles.container}>
            <Text style={styles.appName}>Cook&Chat</Text>

            <View style={styles.rightButtons}>
                <Pressable 
                    style={({ pressed }) => [
                        styles.button,
                        pressed && styles.buttonPressed
                    ]}
                    onPress={() => setModalVisible(true)}
                >
                    <Text style={styles.buttonText}>🔔</Text>
                </Pressable>

                <Pressable 
                    style={({ pressed }) => [
                        styles.button,
                        pressed && styles.buttonPressed
                    ]}
                    onPress={() => navigation.navigate('Profile')}
                >
                    <Text style={styles.buttonText}>👤</Text>
                </Pressable>
            </View>

            {/* Notifications Modal */}
            <Modal visible={modalVisible} transparent={true} animationType='slide'>
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContainer}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Notifications</Text>
                            <Text style={styles.modalSubtitle}>Stay updated with your activity</Text>
                        </View>
                        
                        <ScrollView 
                            style={styles.notificationList}
                            showsVerticalScrollIndicator={false}
                        >
                            {[
                                { id: 1, title: 'New Recipe Match', subtitle: 'Found 3 recipes for your ingredients', time: '2m ago', unread: true },
                                { id: 2, title: 'Chef Review Posted', subtitle: 'Your dish got reviewed by Chef Gordon', time: '1h ago', unread: true },
                                { id: 3, title: 'Popular Dish Alert', subtitle: 'Your pizza got 50 likes!', time: '3h ago', unread: false },
                                { id: 4, title: 'Trending Recipe', subtitle: 'Check out this week\'s most popular dish', time: '5h ago', unread: false },
                                { id: 5, title: 'Community Highlight', subtitle: 'You were featured in the feed', time: '1d ago', unread: false },
                            ].map((notif) => (
                                <Pressable
                                    key={notif.id}
                                    style={({ pressed }) => [
                                        styles.notificationItem,
                                        notif.unread && styles.notificationUnread,
                                        pressed && styles.notificationPressed
                                    ]}
                                    onPress={() => console.log('Notification pressed:', notif.id)}
                                >
                                    <View style={styles.notificationContent}>
                                        <View style={styles.notificationHeader}>
                                            <Text style={styles.notificationTitle}>{notif.title}</Text>
                                            <Text style={styles.notificationTime}>{notif.time}</Text>
                                        </View>
                                        <Text style={styles.notificationSubtitle}>{notif.subtitle}</Text>
                                    </View>
                                    {notif.unread && <View style={styles.unreadDot} />}
                                </Pressable>
                            ))}
                        </ScrollView>

                        <Pressable 
                            onPress={() => setModalVisible(false)} 
                            style={({ pressed }) => [
                                styles.closeButton,
                                pressed && styles.closeButtonPressed
                            ]}
                        >
                            <Text style={styles.closeButtonText}>Close</Text>
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
        paddingHorizontal: 20,
        paddingVertical: 10,
        backgroundColor: '#F3F4F6',
        borderBottomWidth: 1,
        borderBottomColor: '#E5E7EB',
    },
    appName: {
        fontSize: 24,
        fontWeight: '700',
        color: '#111827',
        letterSpacing: -0.5,
    },
    rightButtons: {
        flexDirection: 'row',
        gap: 12,
    },
    button: {
        width: 44,
        height: 44,
        borderRadius: 12,
        backgroundColor: '#3b83f68a',
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#3B82F6',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 4,
    },
    buttonPressed: {
        opacity: 0.8,
        transform: [{ scale: 0.96 }],
    },
    buttonText: {
        fontSize: 20,
    },

    // Modal Styles
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'flex-end',
    },
    modalContainer: {
        backgroundColor: '#FFFFFF',
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        maxHeight: '85%',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -4 },
        shadowOpacity: 0.1,
        shadowRadius: 12,
        elevation: 8,
    },
    modalHeader: {
        paddingHorizontal: 24,
        paddingTop: 24,
        paddingBottom: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#F3F4F6',
    },
    modalTitle: {
        fontSize: 28,
        fontWeight: '700',
        color: '#111827',
        marginBottom: 4,
    },
    modalSubtitle: {
        fontSize: 14,
        color: '#6B7280',
        fontWeight: '400',
    },

    // Notification List
    notificationList: {
        paddingHorizontal: 24,
        paddingTop: 16,
    },
    notificationItem: {
        flexDirection: 'row',
        backgroundColor: '#F9FAFB',
        padding: 16,
        borderRadius: 16,
        marginBottom: 12,
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
        fontSize: 16,
        fontWeight: '600',
        color: '#111827',
        flex: 1,
    },
    notificationTime: {
        fontSize: 12,
        color: '#9CA3AF',
        fontWeight: '500',
        marginLeft: 8,
    },
    notificationSubtitle: {
        fontSize: 14,
        color: '#6B7280',
        lineHeight: 20,
    },
    unreadDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: '#3b83f6c2',
        marginLeft: 12,
    },

    // Close Button
    closeButton: {
        margin: 24,
        marginTop: 16,
        paddingVertical: 16,
        backgroundColor: '#F3F4F6',
        borderRadius: 12,
        alignItems: 'center',
    },
    closeButtonPressed: {
        opacity: 0.7,
        transform: [{ scale: 0.98 }],
    },
    closeButtonText: {
        color: '#374151',
        fontSize: 16,
        fontWeight: '600',
    },
});