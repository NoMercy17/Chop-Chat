export function navigateToProfile(navigation, targetUserId, userName, currentUserId, userAvatar) {
  if (targetUserId === currentUserId) {
    navigation.navigate('Profile');
  } else {
    navigation.navigate('OtherUserProfile', { userId: targetUserId, userName, userAvatar: userAvatar || null });
  }
}
