import React, { useState, useContext, useCallback, useRef } from "react";
import { View, Text, ScrollView, Pressable, Image, StyleSheet, ActivityIndicator } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { useTheme } from "../context/ThemeContext";
import { useFollow } from "../context/FollowContext";
import { AuthContext } from "../context/AuthContext";
import { api } from "../services/api";
import { wp, hp, fp } from "../utils/responsive";
import DishDetailModal from "../components/posts/DishDetailModal";
import RecipeCard from "../components/posts/RecipeCard";

export default function OtherUserProfileScreen({ navigation, route }) {
  const { theme, isDarkMode } = useTheme();
  const { isFollowingUser, toggleFollow, getFollowersCount, getFollowingCount } = useFollow();
  const { token } = useContext(AuthContext);
  const insets = useSafeAreaInsets();

  const { userId, userName, userAvatar: passedAvatar } = route.params || {};

  const [userPosts, setUserPosts] = useState([]);
  const [postsLoading, setPostsLoading] = useState(false);
  const [followerCount, setFollowerCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);
  // Start with the passed avatar (instant display), then replace with fresh fetch
  const [profilePhoto, setProfilePhoto] = useState(passedAvatar || null);
  const [displayName, setDisplayName] = useState(userName || '');
  const [dishDetailModalVisible, setDishDetailModalVisible] = useState(false);
  const [selectedDish, setSelectedDish] = useState(null);

  const isFollowing = isFollowingUser(userId);
  const followInFlight = useRef(false);

  const loadCounts = useCallback(async () => {
    if (!userId) return;
    const [followers, following] = await Promise.all([
      getFollowersCount(userId),
      getFollowingCount(userId),
    ]);
    setFollowerCount(followers);
    setFollowingCount(following);
  }, [userId, getFollowersCount, getFollowingCount]);

  const loadProfile = useCallback(async () => {
    if (!userId || !token) return;
    try {
      const data = await api.get(`/users/${userId}/profile`, token);
      if (data.user) {
        setProfilePhoto(data.user.profile_photo || null);
        setDisplayName(data.user.name || userName || '');
      }
    } catch (err) {
      console.error('[OtherUserProfileScreen] loadProfile:', err.message);
    }
  }, [userId, token, userName]);

  const loadPosts = useCallback(async () => {
    if (!userId || !token) return;
    setPostsLoading(true);
    try {
      const data = await api.get(`/users/${userId}/posts`, token);
      setUserPosts(data.posts || []);
    } catch (err) {
      console.error('[OtherUserProfileScreen] loadPosts:', err.message);
    } finally {
      setPostsLoading(false);
    }
  }, [userId, token]);

  useFocusEffect(useCallback(() => { loadCounts(); loadPosts(); loadProfile(); }, [loadCounts, loadPosts, loadProfile]));

  const handleFollow = () => {
    if (followInFlight.current) return;
    followInFlight.current = true;
    const nowFollowing = toggleFollow(userId);
    setFollowerCount(prev => nowFollowing ? prev + 1 : Math.max(0, prev - 1));
    // Release after FollowContext's async mutation settles
    setTimeout(() => { followInFlight.current = false; }, 800);
  };

  const userBio = 'Food Enthusiast';

  const getInitials = (name) => {
    if (!name) return 'U';
    const parts = name.split(' ');
    return parts.length >= 2 ? (parts[0][0] + parts[1][0]).toUpperCase() : name.substring(0, 2).toUpperCase();
  };

  return (
    <ScrollView style={[styles.container, { backgroundColor: theme.background, paddingTop: insets.top }]}>
      <View style={[styles.header, { backgroundColor: theme.screenBackground }]}>
        <Pressable style={({ pressed }) => [styles.backButton, !isDarkMode && styles.backButtonLight, pressed && styles.backButtonPressed]} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={fp(24)} color={theme.headerTitleColor} />
        </Pressable>
        
        <View style={styles.profileImageContainer}>
          {profilePhoto ? (
            <Image source={{ uri: profilePhoto }} style={[styles.profileImage, { borderColor: theme.profileImageBorder }]} />
          ) : (
            <View style={[styles.profileImage, styles.avatarPlaceholder, { borderColor: theme.profileImageBorder, backgroundColor: theme.primary }]}>
              <Text style={styles.avatarInitials}>{getInitials(displayName)}</Text>
            </View>
          )}
        </View>

        <Text style={[styles.username, { color: theme.profileTextPrimary }]}>{displayName}</Text>
        <Text style={[styles.bio, { color: theme.profileTextSecondary }]} numberOfLines={2}>{userBio}</Text>

        <Pressable style={({ pressed }) => [styles.followButton, { backgroundColor: isFollowing ? theme.inputBackground : theme.primary }, pressed && styles.followButtonPressed]} onPress={handleFollow}>
          <Text style={[styles.followButtonText, { color: isFollowing ? theme.textPrimary : '#FFFFFF' }]}>{isFollowing ? 'Following' : 'Follow'}</Text>
        </Pressable>
      </View>

      <View style={styles.statsBar}>
        <View style={styles.statHero}>
          <Text style={[styles.statHeroValue, { color: theme.textPrimary }]}>{userPosts.length}</Text>
          <Text style={[styles.statHeroLabel, { color: theme.primary }]}>RECIPES</Text>
        </View>
        <View style={[styles.statDivider, { backgroundColor: theme.border }]} />
        <View style={styles.statSecondaryGroup}>
          <View style={styles.statItem}>
            <Text style={[styles.statValue, { color: theme.textPrimary }]}>{followerCount}</Text>
            <Text style={[styles.statText, { color: theme.textSecondary }]}>Followers</Text>
          </View>
          <View style={[styles.statInnerDivider, { backgroundColor: theme.border }]} />
          <View style={styles.statItem}>
            <Text style={[styles.statValue, { color: theme.textPrimary }]}>{followingCount}</Text>
            <Text style={[styles.statText, { color: theme.textSecondary }]}>Following</Text>
          </View>
        </View>
      </View>

      <View style={styles.recipesSection}>
        <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>Recipes</Text>
        {postsLoading ? (
          <ActivityIndicator color={theme.primary} style={{ marginTop: hp(20) }} />
        ) : userPosts.length === 0 ? (
          <Text style={[styles.emptyText, { color: theme.textTertiary }]}>No recipes yet</Text>
        ) : (
          // Pair items into rows of 2 — avoids FlatList inside ScrollView
          userPosts.reduce((rows, item, idx) => {
            if (idx % 2 === 0) rows.push([]);
            rows[rows.length - 1].push(item);
            return rows;
          }, []).map((row, rowIdx) => (
            <View key={rowIdx} style={styles.gridRow}>
              {row.map(recipe => (
                <View key={recipe.id} style={styles.gridItem}>
                  <RecipeCard
                    recipe={recipe}
                    variant="grid"
                    theme={theme}
                    onPress={() => { setSelectedDish(recipe); setDishDetailModalVisible(true); }}
                  />
                </View>
              ))}
              {row.length === 1 && <View style={styles.gridItem} />}
            </View>
          ))
        )}
      </View>

      <DishDetailModal
        visible={dishDetailModalVisible}
        onClose={() => { setDishDetailModalVisible(false); setSelectedDish(null); }}
        dish={selectedDish}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { alignItems: "center", paddingVertical: hp(24), borderBottomRightRadius: wp(32), borderBottomLeftRadius: wp(32) },
  backButton: { position: 'absolute', top: hp(15), left: wp(15), width: wp(40), height: wp(40), borderRadius: wp(20), backgroundColor: 'rgba(255, 255, 255, 0.15)', justifyContent: 'center', alignItems: 'center', zIndex: 10 },
  backButtonLight: { backgroundColor: 'rgba(0, 0, 0, 0.05)' },
  backButtonPressed: { opacity: 0.7 },
  profileImageContainer: { marginBottom: hp(16) },
  profileImage: { width: wp(100), height: wp(100), borderRadius: wp(50), borderWidth: 3 },
  avatarPlaceholder: { justifyContent: 'center', alignItems: 'center' },
  avatarInitials: { color: '#FFFFFF', fontSize: fp(36), fontWeight: '700' },
  username: { fontSize: fp(24), fontWeight: "700", marginBottom: hp(4) },
  bio: { fontSize: fp(15), textAlign: 'center', paddingHorizontal: wp(40), marginBottom: hp(20) },
  followButton: { paddingHorizontal: wp(32), paddingVertical: hp(10), borderRadius: wp(20) },
  followButtonText: { fontSize: fp(15), fontWeight: "700" },
  followButtonPressed: { opacity: 0.8, transform: [{ scale: 0.98 }] },
  statsBar: { flexDirection: "row", alignItems: "center", marginVertical: hp(18), marginHorizontal: wp(24) },
  statHero: { alignItems: "center", paddingHorizontal: wp(16), paddingVertical: hp(6), minWidth: wp(90) },
  statHeroValue: { fontSize: fp(32), fontWeight: "800", letterSpacing: -0.5 },
  statHeroLabel: { fontSize: fp(10), fontWeight: "700", letterSpacing: 1.5, marginTop: hp(2) },
  statDivider: { width: 1, height: hp(44) },
  statSecondaryGroup: { flex: 1, flexDirection: "row", alignItems: "center" },
  statItem: { flex: 1, alignItems: "center", paddingVertical: hp(6) },
  statValue: { fontSize: fp(20), fontWeight: "700" },
  statText: { fontSize: fp(11), marginTop: hp(2) },
  statInnerDivider: { width: 1, height: hp(28) },
  recipesSection: { paddingHorizontal: wp(20), paddingBottom: hp(40) },
  sectionTitle: { fontSize: fp(20), fontWeight: "700", marginBottom: hp(16) },
  emptyText: { fontSize: fp(14), textAlign: 'center', marginTop: hp(12) },
  gridRow: { flexDirection: 'row', gap: wp(12), marginBottom: wp(12) },
  gridItem: { flex: 1 }
});
