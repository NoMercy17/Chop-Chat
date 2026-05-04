import React from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, Modal, TextInput, KeyboardAvoidingView, Platform, TouchableWithoutFeedback } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { wp, hp, fp } from '../../utils/responsive';

/**
 * A reusable comments modal for both Chef Reviews and Community Posts.
 */
export default function CommentsModal({ 
  visible, 
  onClose, 
  comments, 
  newComment, 
  onCommentChange, 
  onAddComment, 
  theme 
}) {
  return (
    <Modal 
      visible={visible} 
      transparent={true} 
      animationType="slide"
      onRequestClose={onClose}
    >
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.modalOverlay}>
          <KeyboardAvoidingView 
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={{ width: '100%' }}
          >
            <TouchableWithoutFeedback onPress={(e) => e.stopPropagation()}>
              <View style={[styles.modalContainer, { backgroundColor: theme.modalBackground }]}>
                <View style={[styles.modalHeader, { borderBottomColor: theme.border, alignItems: 'center' }]}>
                  <Text style={[styles.modalTitle, { color: theme.textPrimary }]}>Comments</Text>
                  <Pressable 
                    onPress={onClose}
                    style={{ paddingVertical: hp(4), paddingLeft: wp(12) }}
                  >
                    <Text style={{color: theme.primary, fontWeight:'600', fontSize: fp(15)}}>Close</Text>
                  </Pressable>
                </View>
                
                <ScrollView 
                  style={styles.commentsScrollView}
                  contentContainerStyle={styles.commentsContent}
                  showsVerticalScrollIndicator={true}
                >
                  {comments && comments.map((comment, index) => (
                    <View key={comment.id || index} style={styles.commentItem}>
                      <View style={[styles.commentAvatar, { backgroundColor: theme.primary }]}>
                        <Text style={styles.commentAvatarText}>{comment.initials}</Text>
                      </View>
                      <View style={styles.commentInfo}>
                        <View style={styles.commentHeader}>
                          <Text style={[styles.commentAuthor, { color: theme.textPrimary }]}>{comment.author}</Text>
                          {comment.timestamp && (
                            <Text style={[styles.commentTimestamp, { color: theme.textTertiary }]}>{comment.timestamp}</Text>
                          )}
                        </View>
                        <Text style={[styles.commentText, { color: theme.textSecondary }]}>{comment.text}</Text>
                      </View>
                    </View>
                  ))}
                  
                  {(!comments || comments.length === 0) && (
                    <View style={styles.emptyContainer}>
                      <Ionicons name="chatbubble-outline" size={fp(38)} color={theme.textTertiary} />
                      <Text style={[styles.emptyTitle, { color: theme.textSecondary }]}>No comments yet</Text>
                      <Text style={[styles.emptySubtitle, { color: theme.textTertiary }]}>Be the first to comment!</Text>
                    </View>
                  )}
                </ScrollView>

                <View style={[styles.inputContainer, { backgroundColor: theme.cardBackground, borderTopColor: theme.border }]}>
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
            </TouchableWithoutFeedback>
          </KeyboardAvoidingView>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.5)', justifyContent: 'flex-end' },
  modalContainer: { borderTopLeftRadius: wp(24), borderTopRightRadius: wp(24), maxHeight: hp(500) },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', padding: wp(20), borderBottomWidth: 1 },
  modalTitle: { fontSize: fp(20), fontWeight: '700' },
  
  commentsScrollView: { maxHeight: hp(350), padding: wp(20) },
  commentsContent: { paddingBottom: hp(20) },
  
  commentItem: { marginBottom: hp(15), flexDirection: 'row', gap: wp(10) },
  commentAvatar: { width: wp(30), height: wp(30), borderRadius: wp(15), alignItems: 'center', justifyContent: 'center' },
  commentAvatarText: { color: '#FFFFFF', fontSize: fp(10), fontWeight: '700' },
  commentInfo: { flex: 1 },
  commentHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  commentAuthor: { fontWeight: '600', fontSize: fp(13) },
  commentTimestamp: { fontSize: fp(11) },
  commentText: { fontSize: fp(13), marginTop: hp(2) },
  
  emptyContainer: { alignItems: 'center', paddingVertical: hp(40) },
  emptyTitle: { fontSize: fp(16), marginTop: hp(12) },
  emptySubtitle: { fontSize: fp(13), marginTop: hp(4) },
  
  inputContainer: { flexDirection: 'row', alignItems: 'center', padding: wp(12), paddingBottom: hp(30), gap: wp(10) },
  commentInput: { flex: 1, height: hp(40), borderRadius: wp(20), paddingHorizontal: wp(15), fontSize: fp(14) },
  sendButton: { padding: wp(8), borderRadius: wp(20) },
});
