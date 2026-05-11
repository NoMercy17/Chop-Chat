export function navigateToProfile(navigation, targetUserId, userName, currentUserId) {
  if (targetUserId === currentUserId) {
    navigation.navigate('Profile');
  } else {
    navigation.navigate('OtherUserProfile', { userId: targetUserId, userName });
  }
}
