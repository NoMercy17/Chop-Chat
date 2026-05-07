import React from 'react';
import { View, Text, StyleSheet, Pressable, Modal, FlatList, Image, TouchableWithoutFeedback } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { wp, hp, fp } from '../../utils/responsive';

function getInitials(name) {
  if (!name) return 'U';
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  return name.substring(0, 2).toUpperCase();
}

export default function UserListModal({ visible, onClose, type, data, navigation, theme, onRemoveFollower, onUnfollow }) {

  const renderItem = ({ item }) => (
    <View style={[styles.row, { backgroundColor: theme.cardBackground, borderColor: theme.borderLight }]}>
      <Pressable
        style={({ pressed }) => [styles.userArea, pressed && { opacity: 0.7 }]}
        onPress={() => {
          onClose();
          navigation.navigate('OtherUserProfile', { userId: item.id, userName: item.name });
        }}
      >
        {item.avatar || item.profile_photo ? (
          <Image source={{ uri: item.avatar || item.profile_photo }} style={styles.avatar} />
        ) : (
          <View style={[styles.avatar, styles.avatarPlaceholder, { backgroundColor: theme.primary }]}>
            <Text style={[styles.avatarInitials, { color: '#FFFFFF' }]}>{getInitials(item.name)}</Text>
          </View>
        )}

        <View style={styles.userInfo}>
          <View style={styles.nameRow}>
            <Text style={[styles.name, { color: theme.textPrimary }]} numberOfLines={1}>{item.name}</Text>
            {item.role === 'chef' && (
              <View style={[styles.chefBadge, { backgroundColor: theme.primaryLighter }]}>
                <Text style={[styles.chefBadgeText, { color: theme.primary }]}>Chef</Text>
              </View>
            )}
          </View>
          <Text style={[styles.username, { color: theme.textSecondary }]} numberOfLines={1}>
            @{item.username || item.name?.toLowerCase().replace(/\s+/g, '') || '—'}
          </Text>
        </View>
      </Pressable>

      {type === 'followers' && onRemoveFollower && (
        <Pressable
          style={({ pressed }) => [
            styles.actionButton,
            styles.removeButton,
            { borderColor: theme.danger, backgroundColor: pressed ? theme.dangerLight : 'transparent' }
          ]}
          onPress={() => onRemoveFollower(item.id)}
        >
          <Text style={[styles.actionButtonText, { color: theme.danger }]}>Remove</Text>
        </Pressable>
      )}

      {type === 'following' && onUnfollow && (
        <Pressable
          style={({ pressed }) => [
            styles.actionButton,
            styles.unfollowButton,
            { borderColor: theme.border, backgroundColor: pressed ? theme.inputBackground : 'transparent' }
          ]}
          onPress={() => onUnfollow(item.id)}
        >
          <Text style={[styles.actionButtonText, { color: theme.textSecondary }]}>Unfollow</Text>
        </Pressable>
      )}
    </View>
  );

  const emptyLabel = type === 'followers' ? 'No followers yet' : 'Not following anyone yet';
  const emptyIcon = type === 'followers' ? 'people-outline' : 'person-add-outline';

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.overlay}>
          <TouchableWithoutFeedback>
            <View style={[styles.sheet, { backgroundColor: theme.modalBackground }]}>
              <View style={[styles.handle, { backgroundColor: theme.border }]} />

              <View style={[styles.header, { borderBottomColor: theme.border }]}>
                <Text style={[styles.title, { color: theme.textPrimary }]}>
                  {type === 'followers' ? 'Followers' : 'Following'}
                </Text>
                <Pressable
                  style={({ pressed }) => [styles.closeButton, { backgroundColor: theme.inputBackground }, pressed && { opacity: 0.6 }]}
                  onPress={onClose}
                >
                  <Ionicons name="close" size={fp(18)} color={theme.textSecondary} />
                </Pressable>
              </View>

              <FlatList
                data={data}
                renderItem={renderItem}
                keyExtractor={(item) => String(item.id)}
                contentContainerStyle={[styles.list, !data?.length && styles.listEmpty]}
                showsVerticalScrollIndicator={false}
                ListEmptyComponent={
                  <View style={styles.emptyState}>
                    <View style={[styles.emptyIconWrap, { backgroundColor: theme.inputBackground }]}>
                      <Ionicons name={emptyIcon} size={fp(32)} color={theme.textTertiary} />
                    </View>
                    <Text style={[styles.emptyTitle, { color: theme.textPrimary }]}>{emptyLabel}</Text>
                    <Text style={[styles.emptySubtitle, { color: theme.textSecondary }]}>
                      {type === 'followers'
                        ? 'When someone follows you, they\'ll appear here.'
                        : 'Accounts you follow will appear here.'}
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
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'flex-end' },
  sheet: { borderTopLeftRadius: wp(24), borderTopRightRadius: wp(24), maxHeight: hp(580), paddingBottom: hp(24) },
  handle: { width: wp(40), height: hp(4), borderRadius: wp(2), alignSelf: 'center', marginTop: hp(10), marginBottom: hp(6) },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: wp(20), paddingVertical: hp(14), borderBottomWidth: 1 },
  title: { fontSize: fp(18), fontWeight: '700' },
  closeButton: { width: wp(32), height: wp(32), borderRadius: wp(16), justifyContent: 'center', alignItems: 'center' },
  list: { paddingHorizontal: wp(16), paddingTop: hp(8) },
  listEmpty: { flex: 1 },
  row: { flexDirection: 'row', alignItems: 'center', borderRadius: wp(14), marginBottom: hp(10), borderWidth: 1, overflow: 'hidden' },
  userArea: { flex: 1, flexDirection: 'row', alignItems: 'center', padding: wp(12), gap: wp(12) },
  avatar: { width: wp(46), height: wp(46), borderRadius: wp(23) },
  avatarPlaceholder: { justifyContent: 'center', alignItems: 'center' },
  avatarInitials: { fontSize: fp(16), fontWeight: '700' },
  userInfo: { flex: 1, gap: hp(2) },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: wp(6), flexShrink: 1 },
  name: { fontSize: fp(15), fontWeight: '600', flexShrink: 1 },
  username: { fontSize: fp(13) },
  chefBadge: { paddingHorizontal: wp(6), paddingVertical: hp(2), borderRadius: wp(6) },
  chefBadgeText: { fontSize: fp(11), fontWeight: '700' },
  actionButton: { paddingHorizontal: wp(12), paddingVertical: hp(7), borderRadius: wp(8), borderWidth: 1, marginRight: wp(12) },
  removeButton: {},
  unfollowButton: {},
  actionButtonText: { fontSize: fp(13), fontWeight: '600' },
  emptyState: { alignItems: 'center', justifyContent: 'center', paddingTop: hp(60), paddingHorizontal: wp(40) },
  emptyIconWrap: { width: wp(72), height: wp(72), borderRadius: wp(36), justifyContent: 'center', alignItems: 'center', marginBottom: hp(16) },
  emptyTitle: { fontSize: fp(17), fontWeight: '700', marginBottom: hp(6) },
  emptySubtitle: { fontSize: fp(14), textAlign: 'center', lineHeight: fp(20) },
});
