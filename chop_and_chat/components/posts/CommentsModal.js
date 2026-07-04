import React from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, TextInput, ActivityIndicator, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { wp, hp, fp } from '../../utils/responsive';
import BottomSheetModal from '../common/BottomSheetModal';

/**
 * A reusable comments modal for both Chef Reviews and Community Posts.
 */
export default function CommentsModal({
  visible,
  onClose,
  comments,
  loading,
  newComment,
  onCommentChange,
  onAddComment,
  onAuthorPress,
  errorMessage,
  theme
}) {
  const closeButton = (
    <Pressable onPress={onClose} style={{ paddingVertical: hp(4), paddingLeft: wp(12) }}>
      <Text style={{color: theme.primary, fontWeight:'600', fontSize: fp(15)}}>Close</Text>
    </Pressable>
  );

  return (
    <BottomSheetModal
      visible={visible}
      onClose={onClose}
      title="Comments"
      rightComponent={closeButton}
      keyboardAvoidMaxHeight="60%"
    >
      <ScrollView
        style={styles.commentsScrollView}
        contentContainerStyle={styles.commentsContent}
        showsVerticalScrollIndicator={true}
      >
        {loading ? (
          <View style={styles.emptyContainer}>
            <ActivityIndicator size="small" color={theme.primary} />
          </View>
        ) : comments && comments.length > 0 ? (
          comments.map((comment, index) => (
            <View key={comment.id || index} style={styles.commentItem}>
              <Pressable
                style={({ pressed }) => [styles.commentAvatar, { backgroundColor: theme.primary }, pressed && !!comment.authorId && { opacity: 0.7 }]}
                onPress={() => comment.authorId && onAuthorPress?.(comment)}
              >
                {comment.authorPhoto ? (
                  <Image source={{ uri: comment.authorPhoto }} style={styles.commentAvatarImage} />
                ) : (
                  <Text style={styles.commentAvatarText}>{comment.initials}</Text>
                )}
              </Pressable>
              <View style={styles.commentInfo}>
                <View style={styles.commentHeader}>
                  <Pressable onPress={() => comment.authorId && onAuthorPress?.(comment)}>
                    <Text style={[styles.commentAuthor, { color: theme.textPrimary }]}>{comment.author}</Text>
                  </Pressable>
                  {comment.timestamp && (
                    <Text style={[styles.commentTimestamp, { color: theme.textTertiary }]}>{comment.timestamp}</Text>
                  )}
                </View>
                <Text style={[styles.commentText, { color: theme.textSecondary }]}>{comment.text}</Text>
              </View>
            </View>
          ))
        ) : (
          <View style={styles.emptyContainer}>
            <Ionicons name="chatbubble-outline" size={fp(38)} color={theme.textTertiary} />
            <Text style={[styles.emptyTitle, { color: theme.textSecondary }]}>No comments yet</Text>
            <Text style={[styles.emptySubtitle, { color: theme.textTertiary }]}>Be the first to comment!</Text>
          </View>
        )}
      </ScrollView>

      <View style={[styles.inputContainer, { backgroundColor: theme.cardBackground, borderTopColor: theme.border }]}>
        {errorMessage ? (
          <Text style={[styles.errorText, { color: theme.danger }]}>{errorMessage}</Text>
        ) : null}
        <View style={styles.inputRow}>
          <TextInput
            style={[styles.commentInput, { backgroundColor: theme.inputBackground, color: theme.textPrimary }]}
            placeholder="Write a comment..."
            placeholderTextColor={theme.textTertiary}
            value={newComment}
            onChangeText={onCommentChange}
          />
          <Pressable
            onPress={onAddComment}
            style={[styles.sendButton, { backgroundColor: theme.primary }]}
          >
            <Ionicons name="send" size={fp(16)} color="white" />
          </Pressable>
        </View>
      </View>
    </BottomSheetModal>
  );
}

const styles = StyleSheet.create({
  commentsScrollView: { maxHeight: hp(350), padding: wp(20) },
  commentsContent: { paddingBottom: hp(20) },
  
  commentItem: { marginBottom: hp(15), flexDirection: 'row', gap: wp(10) },
  commentAvatar: { width: wp(30), height: wp(30), borderRadius: wp(15), alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  commentAvatarImage: { width: wp(30), height: wp(30), borderRadius: wp(15) },
  commentAvatarText: { color: '#FFFFFF', fontSize: fp(10), fontWeight: '700' },
  commentInfo: { flex: 1 },
  commentHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  commentAuthor: { fontWeight: '600', fontSize: fp(13) },
  commentTimestamp: { fontSize: fp(11) },
  commentText: { fontSize: fp(13), marginTop: hp(2) },
  
  emptyContainer: { alignItems: 'center', paddingVertical: hp(40) },
  emptyTitle: { fontSize: fp(16), marginTop: hp(12) },
  emptySubtitle: { fontSize: fp(13), marginTop: hp(4) },
  
  inputContainer: { padding: wp(12), paddingBottom: hp(30) },
  errorText: { fontSize: fp(12), marginBottom: hp(6), paddingHorizontal: wp(4) },
  inputRow: { flexDirection: 'row', alignItems: 'center', gap: wp(10) },
  commentInput: { flex: 1, height: hp(40), borderRadius: wp(20), paddingHorizontal: wp(15), fontSize: fp(14) },
  sendButton: { padding: wp(8), borderRadius: wp(20) },
});
