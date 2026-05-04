import React from 'react';
import { View, Text, StyleSheet, Pressable, Modal, FlatList, Image, TouchableWithoutFeedback } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { wp, hp, fp } from '../../utils/responsive';

export default function UserListModal({ visible, onClose, type, data, navigation, theme }) {
  
  const getInitials = (name) => {
    if (!name) return 'U';
    const parts = name.split(' ');
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  const renderItem = ({ item }) => (
    <Pressable 
      style={({ pressed }) => [styles.followItem, pressed && styles.followItemPressed]}
      onPress={() => {
        onClose();
        navigation.navigate("OtherUserProfile", { userId: item.id });
      }}
    >
      {item.avatar ? (
        <Image source={{ uri: item.avatar }} style={styles.followAvatar} />
      ) : (
        <View style={[styles.followAvatar, styles.followAvatarPlaceholder, { backgroundColor: theme.primary }]}>
          <Text style={styles.followAvatarInitials}>{getInitials(item.name)}</Text>
        </View>
      )}
      <View style={styles.followInfo}>
        <Text style={[styles.followName, { color: theme.textPrimary }]}>{item.name}</Text>
        <Text style={[styles.followUsername, { color: theme.textSecondary }]}>@{item.username || item.name.toLowerCase().replace(' ', '')}</Text>
      </View>
      <Ionicons name="chevron-forward" size={fp(18)} color={theme.textTertiary} />
    </Pressable>
  );

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.modalOverlay}>
          <TouchableWithoutFeedback>
            <View style={[styles.modalContainer, { backgroundColor: theme.modalBackground }]}>
              <View style={[styles.modalHeader, { borderBottomColor: theme.border }]}>
                <Text style={[styles.modalTitle, { color: theme.textPrimary }]}>
                  {type === 'followers' ? 'Followers' : 'Following'}
                </Text>
                <Pressable onPress={onClose}>
                  <Ionicons name="close" size={fp(24)} color={theme.textPrimary} />
                </Pressable>
              </View>
              <FlatList
                data={data}
                renderItem={renderItem}
                keyExtractor={(item) => item.id}
                contentContainerStyle={styles.listContent}
                ListEmptyComponent={
                  <View style={styles.emptyContainer}>
                    <Text style={[styles.emptyText, { color: theme.textSecondary }]}>
                      No {type} yet
                    </Text>
                  </View>
                }
              />
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.5)', justifyContent: 'flex-end' },
  modalContainer: { borderTopLeftRadius: wp(24), borderTopRightRadius: wp(24), height: hp(500), paddingBottom: hp(30) },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: wp(20), borderBottomWidth: 1 },
  modalTitle: { fontSize: fp(20), fontWeight: '700' },
  listContent: { paddingVertical: hp(10) },
  followItem: { flexDirection: 'row', alignItems: 'center', padding: wp(16) },
  followItemPressed: { opacity: 0.7 },
  followAvatar: { width: wp(45), height: wp(45), borderRadius: wp(22.5) },
  followAvatarPlaceholder: { justifyContent: 'center', alignItems: 'center' },
  followAvatarInitials: { color: '#FFFFFF', fontSize: fp(18), fontWeight: '700' },
  followInfo: { flex: 1, marginLeft: wp(12) },
  followName: { fontSize: fp(16), fontWeight: '600' },
  followUsername: { fontSize: fp(14) },
  emptyContainer: { padding: wp(40), alignItems: 'center' },
  emptyText: { fontSize: fp(16) },
});
