import React, { useContext, useState, useEffect, useCallback } from "react";
import { View, Text, ScrollView, Pressable, StyleSheet, Modal, ActivityIndicator, Alert } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { AuthContext } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import { useFollow } from "../context/FollowContext";
import { wp, hp, fp } from "../utils/responsive";
import CameraScreen from "../components/media/CameraScreen";
import { CloudinaryService } from "../services/CloudinaryService";
import { api } from "../services/api";

// Refactored Components
import SettingsModal from "../components/profile/SettingsModal";
import UserListModal from "../components/profile/UserListModal";
import ProfileHeader from "../components/profile/ProfileHeader";
import ProfileStats from "../components/profile/ProfileStats";

export default function ProfileScreen({ navigation }) {
  const { user, token, signOut } = useContext(AuthContext);
  const { isDarkMode, toggleTheme, theme } = useTheme();
  const { myFollowingCount, getFollowersCount, refreshMyFollows } = useFollow();
  const insets = useSafeAreaInsets();

  // State
  const [settingsVisible, setSettingsVisible] = useState(false);
  const [userListVisible, setUserListVisible] = useState(false);
  const [userListType, setUserListType] = useState('followers');
  const [userListData, setUserListData] = useState([]);
  const [imageSourceModalVisible, setImageSourceModalVisible] = useState(false);
  const [cameraModalVisible, setCameraModalVisible] = useState(false);
  const [followersCount, setFollowersCount] = useState(0);

  const [profileData, setProfileData] = useState({
    name: user?.name || "User",
    profile_photo: user?.profile_photo || null,
    bio: user?.bio || "Cool Chef"
  });
  const [isUploading, setIsUploading] = useState(false);

  // Load profile data
  const loadUserProfile = useCallback(async () => {
    if (!token) return;
    try {
      const data = await api.get('/users/me', token);
      if (data.user) {
        setProfileData({
          name: data.user.name || "User",
          profile_photo: data.user.profile_photo || null,
          bio: data.user.bio || "Cool Chef"
        });
      }
    } catch (error) {
      console.error('❌ Failed to load profile:', error);
      if (error.status === 401 || error.status === 403) {
        signOut();
      }
    }
  }, [token, signOut]);

  const openUserList = useCallback(async (type) => {
    setUserListType(type);
    setUserListData([]);
    setUserListVisible(true);
    try {
      const endpoint = type === 'followers'
        ? `/users/${user.id}/followers`
        : `/users/${user.id}/following`;
      const data = await api.get(endpoint, token);
      const list = type === 'followers' ? (data.followers || []) : (data.following || []);
      setUserListData(list);
    } catch (error) {
      console.error('[ProfileScreen] fetchUserList:', error.message);
    }
  }, [user?.id, token]);

  // Pull the real follower count for the signed-in user; new accounts come back as 0.
  const loadFollowerStats = useCallback(async () => {
    if (!user?.id) return;
    const count = await getFollowersCount(user.id);
    setFollowersCount(count);
    refreshMyFollows();
  }, [user?.id, getFollowersCount, refreshMyFollows]);

  useEffect(() => { loadUserProfile(); loadFollowerStats(); }, [loadUserProfile, loadFollowerStats]);
  useFocusEffect(useCallback(() => { loadUserProfile(); loadFollowerStats(); }, [loadUserProfile, loadFollowerStats]));

  // Photo Handlers
  const handleAccessGallery = async () => {
    setImageSourceModalVisible(false);
    try {
      setIsUploading(true);
      const photoUrl = await CloudinaryService.uploadImage(await CloudinaryService.pickImage(), 'profile_photos');
      if (photoUrl) await updateProfilePhotoOnBackend(photoUrl);
    } catch (error) {
      Alert.alert("Error", "Failed to upload image");
    } finally {
      setIsUploading(false);
    }
  };

  const handlePhotoTaken = async (uri) => {
    setCameraModalVisible(false);
    try {
      setIsUploading(true);
      const photoUrl = await CloudinaryService.uploadImage(uri, 'profile_photos');
      if (photoUrl) await updateProfilePhotoOnBackend(photoUrl);
    } catch (error) {
      Alert.alert("Error", "Failed to upload photo");
    } finally {
      setIsUploading(false);
    }
  };

  const updateProfilePhotoOnBackend = async (photoUrl) => {
    try {
      const data = await api.patch('/users/profile-photo', { photo_url: photoUrl }, token);
      setProfileData(prev => ({ ...prev, profile_photo: data.user.profile_photo }));
    } catch (error) {
      Alert.alert("Error", "Failed to update profile photo");
    }
  };

  return (
    <ScrollView style={[styles.container, { backgroundColor: theme.background, paddingTop: insets.top }]}>
      <ProfileHeader 
        name={profileData.name}
        profilePhoto={profileData.profile_photo}
        bio={profileData.bio}
        isUploading={isUploading}
        theme={theme}
        onBack={() => navigation.goBack()}
        onEditImage={() => setImageSourceModalVisible(true)}
      />

      <ProfileStats
        recipeCount={0}
        followersCount={followersCount}
        followingCount={myFollowingCount}
        theme={theme}
        onRecipesPress={() => navigation.navigate("MyRecipes")}
        onFollowersPress={() => openUserList('followers')}
        onFollowingPress={() => openUserList('following')}
      />

      <View style={[styles.menuContainer, { backgroundColor: theme.cardBackground }]}>
        {[
          { icon: "list-outline", label: "My Recipes", target: "MyRecipes" },
          { icon: "heart-outline", label: "Favorite Recipes", target: "FavoriteRecipes" },
          { icon: "settings-outline", label: "Settings", action: () => setSettingsVisible(true) }
        ].map((item, idx) => (
          <Pressable 
            key={idx} 
            style={[styles.menuItem, { borderBottomColor: idx === 2 ? 'transparent' : theme.border }]} 
            onPress={item.action || (() => navigation.navigate(item.target))}
          >
            <View style={styles.menuItemLeft}>
              <Ionicons name={item.icon} size={fp(22)} color={theme.primary} />
              <Text style={[styles.menuText, { color: theme.textPrimary }]}>{item.label}</Text>
            </View>
            <Ionicons name="chevron-forward" size={fp(20)} color={theme.textTertiary} />
          </Pressable>
        ))}
      </View>

      <SettingsModal
        visible={settingsVisible}
        onClose={() => setSettingsVisible(false)}
        theme={theme}
        isDarkMode={isDarkMode}
        toggleTheme={toggleTheme}
        onSignOut={signOut}
      />

      <UserListModal
        visible={userListVisible}
        onClose={() => setUserListVisible(false)}
        type={userListType}
        data={userListData}
        navigation={navigation}
        theme={theme}
        onRemoveFollower={async (userId) => {
          setUserListData(prev => prev.filter(u => u.id !== userId));
          setFollowersCount(prev => Math.max(0, prev - 1));
          try {
            await api.delete(`/users/${userId}/follower`, token);
          } catch (error) {
            console.error('[ProfileScreen] removeFollower:', error.message);
            openUserList('followers');
            setFollowersCount(prev => prev + 1);
          }
        }}
        onUnfollow={async (userId) => {
          setUserListData(prev => prev.filter(u => u.id !== userId));
          try {
            await api.delete(`/users/${userId}/follow`, token);
            refreshMyFollows();
          } catch (error) {
            console.error('[ProfileScreen] unfollow:', error.message);
            openUserList('following');
          }
        }}
      />

      <Modal visible={imageSourceModalVisible} transparent animationType="slide" onRequestClose={() => setImageSourceModalVisible(false)}>
        <Pressable style={styles.compactModalOverlay} onPress={() => setImageSourceModalVisible(false)}>
          <View style={[styles.compactModalContainer, { backgroundColor: theme.modalBackground }]}>
            <Pressable style={styles.compactOption} onPress={() => { setImageSourceModalVisible(false); setCameraModalVisible(true); }}>
              <Ionicons name="camera-outline" size={fp(24)} color={theme.success} />
              <Text style={[styles.compactOptionText, { color: theme.textPrimary }]}>Take Photo</Text>
            </Pressable>
            <Pressable style={styles.compactOption} onPress={handleAccessGallery}>
              <Ionicons name="images-outline" size={fp(24)} color={theme.primary} />
              <Text style={[styles.compactOptionText, { color: theme.textPrimary }]}>Gallery</Text>
            </Pressable>
          </View>
        </Pressable>
      </Modal>

      <Modal visible={cameraModalVisible} animationType="slide" onRequestClose={() => setCameraModalVisible(false)}>
        <CameraScreen onPhotoTaken={handlePhotoTaken} onClose={() => setCameraModalVisible(false)} />
      </Modal>

      <Pressable style={[styles.logoutButton, { backgroundColor: theme.dangerLighter }]} onPress={signOut}>
        <Text style={[styles.logoutText, { color: theme.danger }]}>Log out</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  menuContainer: { marginHorizontal: wp(20), borderRadius: wp(12), overflow: 'hidden', elevation: 2 },
  menuItem: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: wp(16), borderBottomWidth: 1 },
  menuItemLeft: { flexDirection: 'row', alignItems: 'center', gap: wp(12) },
  menuText: { fontSize: fp(16), fontWeight: '600' },
  compactModalOverlay: { flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.4)', justifyContent: 'flex-end' },
  compactModalContainer: { padding: wp(20), borderTopLeftRadius: wp(20), borderTopRightRadius: wp(20) },
  compactOption: { flexDirection: 'row', alignItems: 'center', gap: wp(16), paddingVertical: hp(16) },
  compactOptionText: { fontSize: fp(16), fontWeight: '600' },
  logoutButton: { margin: wp(20), padding: wp(16), borderRadius: wp(12), alignItems: 'center', marginBottom: hp(40) },
  logoutText: { fontWeight: '700' },
});
