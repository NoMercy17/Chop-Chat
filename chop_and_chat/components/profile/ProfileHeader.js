import React from 'react';
import { View, Text, StyleSheet, Pressable, Image, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { wp, hp, fp } from '../../utils/responsive';

export default function ProfileHeader({ name, profilePhoto, bio, isUploading, theme, isDarkMode, onBack, onEditImage }) {
  
  const getInitials = (name) => {
    if (!name) return 'U';
    const parts = name.split(' ');
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  return (
    <View style={[styles.header, { backgroundColor: theme.screenBackground }]}>
      <Pressable style={({ pressed }) => [styles.backButton, !isDarkMode && styles.backButtonLight, pressed && styles.backButtonPressed]} onPress={onBack}>
        <Ionicons name="arrow-back" size={fp(24)} color={theme.headerTitleColor} />
      </Pressable>
      
      <View style={styles.profileImageContainer}>
        {isUploading && (
          <View style={styles.uploadingOverlay}>
            <ActivityIndicator size="large" color="#FFFFFF" />
          </View>
        )}
        {profilePhoto ? (
          <Image source={{ uri: profilePhoto }} style={[styles.profileImage, { borderColor: isDarkMode ? theme.profileImageBorder : theme.primaryLighter }]} />
        ) : (
          <View style={[styles.profileImage, styles.avatarPlaceholder, { backgroundColor: theme.primary, borderColor: isDarkMode ? theme.profileImageBorder : theme.primaryLighter }]}>
            <Text style={[styles.avatarInitials, { color: theme.textInverse }]}>{getInitials(name)}</Text>
          </View>
        )}
        <Pressable style={({ pressed }) => [styles.editImageBadge, { backgroundColor: isDarkMode ? theme.backgroundTertiary : theme.primaryLightest, borderColor: theme.screenBackground }, pressed && { transform: [{ scale: 0.90 }] }]} onPress={onEditImage} disabled={isUploading}>
          <Ionicons name="add" size={fp(18)} color={theme.primary} />
        </Pressable>
      </View>
      <Text style={[styles.username, { color: theme.profileTextPrimary }]}>{name}</Text>
      <Text style={[styles.bio, { color: theme.profileTextSecondary }]}>{bio}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  header: { alignItems: "center", paddingVertical: hp(20), borderBottomRightRadius: wp(32), borderBottomLeftRadius: wp(32) },
  backButton: { position: 'absolute', top: hp(15), left: wp(15), width: wp(40), height: wp(40), borderRadius: wp(20), backgroundColor: 'rgba(255, 255, 255, 0.15)', justifyContent: 'center', alignItems: 'center', zIndex: 10 },
  backButtonLight: { backgroundColor: 'rgba(0, 0, 0, 0.05)' },
  backButtonPressed: { opacity: 0.7, transform: [{ scale: 0.94 }] },
  profileImageContainer: { position: "relative" },
  uploadingOverlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0, 0, 0, 0.5)', borderRadius: wp(45), justifyContent: 'center', alignItems: 'center', zIndex: 10 },
  profileImage: { width: wp(90), height: wp(90), borderRadius: wp(45), borderWidth: 3 },
  avatarPlaceholder: { justifyContent: 'center', alignItems: 'center' },
  avatarInitials: { fontSize: fp(32), fontWeight: '700' },
  editImageBadge: { position: "absolute", bottom: -wp(2), right: -wp(2), width: wp(34), height: wp(34), borderRadius: wp(17), justifyContent: "center", alignItems: "center", borderWidth: 2 },
  username: { fontSize: fp(24), fontWeight: "700", letterSpacing: -0.5, marginTop: hp(10) },
  bio: { fontSize: fp(14), marginBottom: hp(14) },
});
