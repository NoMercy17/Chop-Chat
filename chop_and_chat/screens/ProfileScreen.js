import React, { useContext, useState, useEffect, useCallback } from "react";
import { View, Text, ScrollView, Pressable, StyleSheet, Modal, ActivityIndicator, Alert, RefreshControl, Linking } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { AuthContext } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import { useFollow } from "../context/FollowContext";
import { wp, hp, fp } from "../utils/responsive";
import CameraScreen from "../components/media/CameraScreen";
import { CloudinaryService } from "../services/CloudinaryService";
import { MediaService, compressImage } from "../services/MediaService";
import { api } from "../services/api";
import { usePosts } from "../context/PostsContext";
import { useChefFeed } from "../context/ChefFeedContext";

// Refactored Components
import SettingsModal from "../components/profile/SettingsModal";
import UserListModal from "../components/profile/UserListModal";
import ProfileHeader from "../components/profile/ProfileHeader";
import ProfileStats from "../components/profile/ProfileStats";
import ChefEarningsCard from "../components/profile/ChefEarningsCard";
import ChefWithdrawSheet from "../components/profile/ChefWithdrawSheet";

export default function ProfileScreen({ navigation }) {
  const { user, token, signOut } = useContext(AuthContext);
  const { isDarkMode, toggleTheme, theme } = useTheme();
  const { myFollowingCount, getFollowersCount, refreshMyFollows } = useFollow();
  const { updateAuthorPhoto } = usePosts();
  const { updateChefPhoto } = useChefFeed();
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
    bio: user?.bio || "Cool Chef",
    postCount: 0,
  });
  const [isUploading, setIsUploading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [balance, setBalance] = useState(0);
  const [balanceLoading, setBalanceLoading] = useState(false);
  const [withdrawSheetVisible, setWithdrawSheetVisible] = useState(false);
  const [stripeOnboarded, setStripeOnboarded] = useState(null); // null = not yet fetched
  const [onboardLoading, setOnboardLoading] = useState(false);

  // Load profile data
  const loadUserProfile = useCallback(async () => {
    if (!token) return;
    try {
      const data = await api.get('/users/me', token);
      if (data.user) {
        setProfileData({
          name: data.user.name || "User",
          profile_photo: data.user.profile_photo || null,
          bio: data.user.bio || "Cool Chef",
          postCount: data.user.postCount ?? 0,
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

  const loadBalance = useCallback(async () => {
    if (!user?.isChef || !token) return;
    setBalanceLoading(true);
    try {
      const data = await api.get('/chef/balance', token);
      setBalance(data.balance);
    } catch (error) {
      console.error('[ProfileScreen] loadBalance:', error.message);
    } finally {
      setBalanceLoading(false);
    }
  }, [user?.isChef, token]);

  const loadOnboardStatus = useCallback(async () => {
    if (!user?.isChef || !token) return;
    try {
      const data = await api.get('/chef/stripe/onboard-status', token);
      setStripeOnboarded(data.onboarded);
    } catch (error) {
      console.error('[ProfileScreen] loadOnboardStatus:', error.message);
    }
  }, [user?.isChef, token]);

  const handleSetupPayouts = useCallback(async () => {
    setOnboardLoading(true);
    try {
      const data = await api.get('/chef/stripe/onboard-link', token);
      await Linking.openURL(data.url);
    } catch (error) {
      Alert.alert('Setup Error', 'Could not open payout setup. Please try again.');
    } finally {
      setOnboardLoading(false);
    }
  }, [token]);

  const handleWithdraw = useCallback(async (amount) => {
    const prevBalance = balance;
    setBalance(prev => Math.max(0, parseFloat((prev - amount).toFixed(2))));
    try {
      const data = await api.post('/chef/withdraw', { amount }, token);
      setBalance(data.new_balance);
      return { success: true };
    } catch (error) {
      setBalance(prevBalance);
      return { success: false, message: error.data?.message || error.message };
    }
  }, [balance, token]);

  // Pull the real follower count for the signed-in user; new accounts come back as 0.
  const loadFollowerStats = useCallback(async () => {
    if (!user?.id) return;
    const count = await getFollowersCount(user.id);
    setFollowersCount(count);
    refreshMyFollows();
  }, [user?.id, getFollowersCount, refreshMyFollows]);

  const onRefresh = useCallback(async () => {
    setIsRefreshing(true);
    await Promise.all([loadUserProfile(), loadFollowerStats(), loadBalance(), loadOnboardStatus()]);
    setIsRefreshing(false);
  }, [loadUserProfile, loadFollowerStats, loadBalance, loadOnboardStatus]);

  useEffect(() => { loadUserProfile(); loadFollowerStats(); loadBalance(); loadOnboardStatus(); }, [loadUserProfile, loadFollowerStats, loadBalance, loadOnboardStatus]);
  useFocusEffect(useCallback(() => { loadUserProfile(); loadFollowerStats(); loadBalance(); loadOnboardStatus(); }, [loadUserProfile, loadFollowerStats, loadBalance, loadOnboardStatus]));

  // Photo Handlers
  const handleAccessGallery = async () => {
    // Keep the source modal open — the system gallery overlays everything.
    // Close it only after the picker returns (same pattern as MainActions).
    try {
      const picked = await MediaService.pickFromGallery();
      setImageSourceModalVisible(false);
      if (!picked?.uri) return;
      setIsUploading(true);
      const photoUrl = await CloudinaryService.uploadImage(picked.uri, 'profile_photos');
      if (photoUrl) {
        await updateProfilePhotoOnBackend(photoUrl);
      } else {
        Alert.alert("Error", "Failed to upload image. Please try again.");
      }
    } catch (error) {
      setImageSourceModalVisible(false);
      Alert.alert("Error", "Failed to upload image");
    } finally {
      setIsUploading(false);
    }
  };

  const handlePhotoTaken = async (uri) => {
    setCameraModalVisible(false);
    try {
      setIsUploading(true);
      const compressedUri = await compressImage(uri);
      const photoUrl = await CloudinaryService.uploadImage(compressedUri, 'profile_photos');
      if (photoUrl) {
        await updateProfilePhotoOnBackend(photoUrl);
      } else {
        Alert.alert("Error", "Failed to upload photo. Please try again.");
      }
    } catch (error) {
      Alert.alert("Error", "Failed to upload photo");
    } finally {
      setIsUploading(false);
    }
  };

  const updateProfilePhotoOnBackend = async (photoUrl) => {
    try {
      const data = await api.patch('/users/profile-photo', { photo_url: photoUrl }, token);
      const newPhoto = data.user.profile_photo;
      setProfileData(prev => ({ ...prev, profile_photo: newPhoto }));
      // Patch in-memory feed data so posts and chef cards reflect the new photo immediately
      updateAuthorPhoto(user.id, newPhoto);
      updateChefPhoto(user.id, newPhoto);
    } catch (error) {
      Alert.alert("Error", "Failed to update profile photo");
    }
  };

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: theme.background, paddingTop: insets.top }]}
      refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} tintColor={theme.primary} colors={[theme.primary]} />}
    >
      <ProfileHeader
        name={profileData.name}
        profilePhoto={profileData.profile_photo}
        bio={profileData.bio}
        isUploading={isUploading}
        theme={theme}
        isDarkMode={isDarkMode}
        onBack={() => navigation.goBack()}
        onEditImage={() => setImageSourceModalVisible(true)}
      />

      <ProfileStats
        recipeCount={profileData.postCount}
        followersCount={followersCount}
        followingCount={myFollowingCount}
        theme={theme}
        onRecipesPress={() => navigation.navigate("MyRecipes")}
        onFollowersPress={() => openUserList('followers')}
        onFollowingPress={() => openUserList('following')}
      />

      {user?.isChef && (
        <ChefEarningsCard
          balance={balance}
          loading={balanceLoading}
          onWithdraw={() => setWithdrawSheetVisible(true)}
          onSetupPayouts={handleSetupPayouts}
          stripeOnboarded={stripeOnboarded}
          onboardLoading={onboardLoading}
          theme={theme}
        />
      )}

      {/* Primary navigation tiles — content areas get visual weight, settings stays quiet */}
      <View style={styles.navRow}>
        <Pressable
          style={({ pressed }) => [styles.navTile, { backgroundColor: theme.cardBackground }, pressed && styles.navTilePressed]}
          onPress={() => navigation.navigate("MyRecipes")}
        >
          <View style={[styles.navIconWrap, { backgroundColor: theme.primaryLighter }]}>
            <Ionicons name="restaurant-outline" size={fp(24)} color={theme.primary} />
          </View>
          <Text style={[styles.navTileLabel, { color: theme.textPrimary }]}>My Recipes</Text>
          <Text style={[styles.navTileMeta, { color: theme.textTertiary }]}>Your dishes</Text>
        </Pressable>

        <Pressable
          style={({ pressed }) => [styles.navTile, { backgroundColor: theme.cardBackground }, pressed && styles.navTilePressed]}
          onPress={() => navigation.navigate("FavoriteRecipes")}
        >
          <View style={[styles.navIconWrap, { backgroundColor: theme.dangerLighter }]}>
            <Ionicons name="bookmark-outline" size={fp(24)} color={theme.danger} />
          </View>
          <Text style={[styles.navTileLabel, { color: theme.textPrimary }]}>Saved</Text>
          <Text style={[styles.navTileMeta, { color: theme.textTertiary }]}>Bookmarked</Text>
        </Pressable>
      </View>

      <Pressable
        style={({ pressed }) => [styles.settingsRow, { backgroundColor: theme.cardBackground }, pressed && { opacity: 0.8, transform: [{ scale: 0.99 }] }]}
        onPress={() => setSettingsVisible(true)}
      >
        <View style={[styles.settingsIconWrap, { backgroundColor: theme.borderLight }]}>
          <Ionicons name="settings-outline" size={fp(20)} color={theme.textSecondary} />
        </View>
        <Text style={[styles.settingsRowLabel, { color: theme.textPrimary }]}>Settings</Text>
        <Ionicons name="chevron-forward" size={fp(18)} color={theme.textTertiary} />
      </Pressable>

      <SettingsModal
        visible={settingsVisible}
        onClose={() => setSettingsVisible(false)}
        theme={theme}
        isDarkMode={isDarkMode}
        toggleTheme={toggleTheme}
        onSignOut={signOut}
      />

      {user?.isChef && (
        <ChefWithdrawSheet
          visible={withdrawSheetVisible}
          balance={balance}
          onClose={() => setWithdrawSheetVisible(false)}
          onWithdraw={handleWithdraw}
          theme={theme}
        />
      )}

      <UserListModal
        visible={userListVisible}
        onClose={() => setUserListVisible(false)}
        type={userListType}
        data={userListData}
        navigation={navigation}
        theme={theme}
        currentUserId={user?.id}
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
            <Pressable style={({ pressed }) => [styles.compactOption, pressed && { opacity: 0.7 }]} onPress={() => { setImageSourceModalVisible(false); setCameraModalVisible(true); }}>
              <Ionicons name="camera-outline" size={fp(24)} color={theme.success} />
              <Text style={[styles.compactOptionText, { color: theme.textPrimary }]}>Take Photo</Text>
            </Pressable>
            <Pressable style={({ pressed }) => [styles.compactOption, pressed && { opacity: 0.7 }]} onPress={handleAccessGallery}>
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
  navRow: { flexDirection: 'row', marginHorizontal: wp(20), gap: wp(12), marginBottom: hp(12) },
  navTile: { flex: 1, padding: wp(18), borderRadius: wp(18), gap: hp(4), elevation: 2 },
  navTilePressed: { opacity: 0.82, transform: [{ scale: 0.96 }] },
  navIconWrap: { width: wp(48), height: wp(48), borderRadius: wp(14), justifyContent: 'center', alignItems: 'center', marginBottom: hp(4) },
  navTileLabel: { fontSize: fp(14), fontWeight: '700' },
  navTileMeta: { fontSize: fp(12) },
  settingsRow: { marginHorizontal: wp(20), flexDirection: 'row', alignItems: 'center', padding: wp(14), borderRadius: wp(14), gap: wp(12), elevation: 1 },
  settingsIconWrap: { width: wp(36), height: wp(36), borderRadius: wp(10), justifyContent: 'center', alignItems: 'center' },
  settingsRowLabel: { flex: 1, fontSize: fp(15), fontWeight: '600' },
  compactModalOverlay: { flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.4)', justifyContent: 'flex-end' },
  compactModalContainer: { padding: wp(20), borderTopLeftRadius: wp(20), borderTopRightRadius: wp(20) },
  compactOption: { flexDirection: 'row', alignItems: 'center', gap: wp(16), paddingVertical: hp(16) },
  compactOptionText: { fontSize: fp(16), fontWeight: '600' },
  logoutButton: { margin: wp(20), marginTop: hp(20), padding: wp(16), borderRadius: wp(12), alignItems: 'center', marginBottom: hp(40) },
  logoutText: { fontWeight: '700', fontSize: fp(16) },
});
