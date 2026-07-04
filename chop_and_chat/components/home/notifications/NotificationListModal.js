import React from 'react';
import { View, Text, StyleSheet, Modal, ScrollView, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { wp, hp, fp } from '../../../utils/responsive';
import NotificationItem from './NotificationItem';

export default function NotificationListModal({ 
    visible, 
    onClose, 
    notifications, 
    theme, 
    onNotificationPress, 
    onDeleteNotification,
    currentUser 
}) {
    return (
        <Modal visible={visible} transparent={true} animationType='slide' onRequestClose={onClose}>
            <Pressable style={[styles.modalOverlay, { backgroundColor: theme.overlayBackground }]} onPress={onClose}>
                <Pressable style={[styles.modalContainer, { backgroundColor: theme.modalBackground }]} onPress={() => {}}>
                    <View style={[styles.modalHeader, { borderBottomColor: theme.borderLight }]}>
                        <Text style={[styles.modalTitle, { color: theme.textPrimary }]}>Notifications</Text>
                    </View>
                    
                    <ScrollView 
                        style={styles.notificationList}
                        showsVerticalScrollIndicator={false}
                    >
                        {notifications.length > 0 ? notifications.map((notif) => (
                            <NotificationItem
                                key={notif.id}
                                notification={notif}
                                theme={theme}
                                onPress={onNotificationPress}
                                onDelete={onDeleteNotification}
                                currentUser={currentUser}
                            />
                        )) : (
                            <View style={styles.emptyState}>
                                <Ionicons name="notifications-off-outline" size={fp(48)} color={theme.textTertiary} />
                                <Text style={[styles.emptyStateText, { color: theme.textSecondary }]}>No notifications yet</Text>
                            </View>
                        )}
                    </ScrollView>

                    <Pressable 
                        onPress={onClose} 
                        style={({ pressed }) => [
                            styles.closeButton,
                            { backgroundColor: theme.background },
                            pressed && styles.closeButtonPressed
                        ]}
                    >
                        <Text style={[styles.closeButtonText, { color: theme.textMuted }]}>Close</Text>
                    </Pressable>
                </Pressable>
            </Pressable>
        </Modal>
    );
}

const styles = StyleSheet.create({
    modalOverlay: {
        flex: 1,
        justifyContent: 'flex-end',
    },
    modalContainer: {
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
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: wp(24),
        paddingTop: hp(24),
        paddingBottom: hp(16),
        borderBottomWidth: 1,
    },
    modalTitle: {
        fontSize: fp(28),
        fontWeight: '700',
    },
    notificationList: {
        paddingHorizontal: wp(20),
        paddingTop: hp(12),
    },
    emptyState: {
        alignItems: 'center',
        paddingVertical: hp(60),
    },
    emptyStateText: {
        fontSize: fp(16),
        marginTop: hp(12),
    },
    closeButton: {
        margin: wp(20),
        marginTop: hp(12),
        paddingVertical: hp(14),
        borderRadius: wp(12),
        alignItems: 'center',
    },
    closeButtonPressed: {
        opacity: 0.7,
        transform: [{ scale: 0.98 }],
    },
    closeButtonText: {
        fontSize: fp(16),
        fontWeight: '600',
    },
});
