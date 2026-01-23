import React, { useState, useEffect, useMemo } from "react";
import { View, Text, ScrollView, Pressable, Image, StyleSheet, FlatList } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from "../context/ThemeContext";
import { useFollow } from "../context/FollowContext";
import { wp, hp, fp, SPACING } from "../utils/responsive";
import { getPostsByAuthor, getFollowersForUser, getFollowingForUser, getUserById } from "../data/mockData";
import DishDetailModal from "../components/posts/DishDetailModal";

// This screen displays another user's profile (not the current logged-in user)
export default function OtherUserProfileScreen({ navigation, route }) {
  const { theme, isDarkMode } = useTheme();
  const { isFollowingUser, toggleFollow } = useFollow();
  const insets = useSafeAreaInsets();
  
  // Get user data from navigation params
  const { userId, userName, userAvatar, username } = route.params || {};
  
  // Get the full user data to access isChef and bio
  const fullUserData = useMemo(() => getUserById(userId), [userId]);
  
  // Get actual recipes by this user
  const userRecipes = useMemo(() => {
    return getPostsByAuthor(userName);
  }, [userName]);

  // Get actual followers/following counts
  const userFollowers = useMemo(() => getFollowersForUser(userId), [userId]);
  const userFollowing = useMemo(() => getFollowingForUser(userId), [userId]);

  // Determine bio based on user type
  const userBio = fullUserData?.bio || (fullUserData?.isChef ? 'Professional Chef' : 'Food Enthusiast');

  // User data with real counts
  const [userData, setUserData] = useState({
    id: userId || 'user-1',
    name: userName || 'User',
    avatar: userAvatar || null,
    bio: userBio,
    isChef: fullUserData?.isChef || false,
    recipeCount: userRecipes.length,
    followerCount: userFollowers.length,
    followingCount: userFollowing.length,
  });

  // Check if already following this user using context
  const isFollowing = isFollowingUser(userId);
  
  // Dish detail modal state
  const [dishDetailModalVisible, setDishDetailModalVisible] = useState(false);
  const [selectedDish, setSelectedDish] = useState(null);

  // Track follower count adjustment based on follow status
  const [followerAdjustment, setFollowerAdjustment] = useState(0);

  // Update counts when data changes
  useEffect(() => {
    setUserData(prev => ({
      ...prev,
      bio: userBio,
      isChef: fullUserData?.isChef || false,
      recipeCount: userRecipes.length,
      followerCount: userFollowers.length + followerAdjustment,
      followingCount: userFollowing.length,
    }));
  }, [userRecipes, userFollowers, userFollowing, userBio, fullUserData, followerAdjustment]);

  const handleFollow = () => {
    const nowFollowing = toggleFollow(userId);
    // Adjust follower count based on follow action
    setFollowerAdjustment(prev => nowFollowing ? prev + 1 : prev - 1);
  };

  const handleRecipePress = (recipe) => {
    setSelectedDish(recipe);
    setDishDetailModalVisible(true);
  };

  // Get initials from name
  const getInitials = (name) => {
    if (!name) return 'U';
    const parts = name.split(' ');
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  // Render recipe card
  const renderRecipeCard = (recipe) => (
    <Pressable
      key={recipe.id}
      style={({ pressed }) => [
        styles.recipeCard,
        { backgroundColor: theme.inputBackground },
        pressed && styles.recipeCardPressed
      ]}
      onPress={() => handleRecipePress(recipe)}
    >
      {recipe.image ? (
        <Image source={{ uri: recipe.image }} style={styles.recipeImage} />
      ) : (
        <View style={[styles.recipeImagePlaceholder, { backgroundColor: theme.cardBackgroundAlt }]}>
          <Ionicons name="restaurant" size={fp(24)} color={theme.textTertiary} />
        </View>
      )}
      <View style={styles.recipeInfo}>
        <Text style={[styles.recipeTitle, { color: theme.textPrimary }]} numberOfLines={1}>
          {recipe.title}
        </Text>
        <Text style={[styles.recipeDescription, { color: theme.textSecondary }]} numberOfLines={2}>
          {recipe.description}
        </Text>
        <View style={styles.recipeMeta}>
          <View style={styles.metaItem}>
            <Ionicons name="time-outline" size={fp(12)} color={theme.textTertiary} />
            <Text style={[styles.metaText, { color: theme.textTertiary }]}>{recipe.cookTime}</Text>
          </View>
          <View style={styles.metaItem}>
            <Ionicons name="heart-outline" size={fp(12)} color={theme.textTertiary} />
            <Text style={[styles.metaText, { color: theme.textTertiary }]}>{recipe.likes}</Text>
          </View>
        </View>
      </View>
      <Ionicons name="chevron-forward" size={fp(20)} color={theme.textTertiary} />
    </Pressable>
  );

  return (
    <ScrollView style={[styles.container, { backgroundColor: theme.background, paddingTop: insets.top }]}>
      
      {/* Profile Header */}
      <View style={[styles.header, { backgroundColor: theme.screenBackground }]}>
        {/* Back Button */}
        <Pressable 
          style={({ pressed }) => [
            styles.backButton,
            !isDarkMode && styles.backButtonLight,
            pressed && styles.backButtonPressed
          ]}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={fp(24)} color={theme.headerTitleColor} />
        </Pressable>
        
        <View style={styles.profileImageContainer}>
          {userData.avatar ? (
            <Image 
              source={{ uri: userData.avatar }}
              style={[styles.profileImage, { borderColor: theme.profileImageBorder }]}
            />
          ) : (
            <View style={[styles.profileImage, styles.avatarPlaceholder, { borderColor: theme.profileImageBorder, backgroundColor: theme.primary }]}>
              <Text style={styles.avatarInitials}>{getInitials(userData.name)}</Text>
            </View>
          )}
        </View>
        
        <Text style={[styles.username, { color: theme.profileTextPrimary }]}>{userData.name}</Text>
        <Text style={[styles.bio, { color: theme.profileTextSecondary }]} numberOfLines={2} ellipsizeMode="tail">
          {userData.bio}
        </Text>

        {/* Follow Button */}
        <Pressable 
          style={({ pressed }) => [
            styles.followButton,
            { backgroundColor: isFollowing ? theme.inputBackground : theme.primary },
            pressed && styles.followButtonPressed
          ]}
          onPress={handleFollow}
        >
          <Text style={[
            styles.followButtonText,
            { color: isFollowing ? theme.textPrimary : '#FFFFFF' }
          ]}>
            {isFollowing ? 'Following' : 'Follow'}
          </Text>
        </Pressable>
      </View>

      {/* Stats Bar - followers/following NOT clickable */}
      <View style={[styles.statsBar, { backgroundColor: theme.cardBackground, borderColor: theme.border }]}>
        <View style={styles.statItem}>
          <Text style={[styles.statValue, { color: theme.textPrimary }]}>{userData.recipeCount}</Text>
          <Text style={[styles.statText, { color: theme.textSecondary }]}>Recipes</Text>
        </View>

        <View style={[styles.statDivider, { backgroundColor: theme.border }]} />

        <View style={styles.statItem}>
          <Text style={[styles.statValue, { color: theme.textPrimary }]}>{userData.followerCount}</Text>
          <Text style={[styles.statText, { color: theme.textSecondary }]}>Followers</Text>
        </View>

        <View style={[styles.statDivider, { backgroundColor: theme.border }]} />

        <View style={styles.statItem}>
          <Text style={[styles.statValue, { color: theme.textPrimary }]}>{userData.followingCount}</Text>
          <Text style={[styles.statText, { color: theme.textSecondary }]}>Following</Text>
        </View>
      </View>

      {/* User's Recipes Section */}
      <View style={[styles.recipesSection, { backgroundColor: theme.cardBackground }]}>
        <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>Recipes</Text>
        
        {userRecipes.length > 0 ? (
          <View style={styles.recipesList}>
            {userRecipes.map(recipe => renderRecipeCard(recipe))}
          </View>
        ) : (
          <View style={styles.emptyRecipes}>
            <Ionicons name="restaurant-outline" size={fp(32)} color={theme.textTertiary} />
            <Text style={[styles.emptyText, { color: theme.textSecondary }]}>
              No recipes yet
            </Text>
          </View>
        )}
      </View>

      {/* Dish Detail Modal */}
      <DishDetailModal 
        visible={dishDetailModalVisible}
        onClose={() => setDishDetailModalVisible(false)}
        dish={selectedDish}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    alignItems: 'center',
    paddingTop: hp(16),
    paddingBottom: hp(24),
    paddingHorizontal: SPACING.screenPadding,
  },
  backButton: {
    position: 'absolute',
    top: hp(16),
    left: wp(16),
    width: wp(40),
    height: wp(40),
    borderRadius: wp(20),
    backgroundColor: 'rgba(0, 0, 0, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  backButtonLight: {
    backgroundColor: 'rgba(0, 0, 0, 0.08)',
  },
  backButtonPressed: {
    opacity: 0.7,
  },
  profileImageContainer: {
    marginTop: hp(40),
  },
  profileImage: {
    width: wp(100),
    height: wp(100),
    borderRadius: wp(50),
    borderWidth: 3,
  },
  avatarPlaceholder: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarInitials: {
    color: '#FFFFFF',
    fontSize: fp(32),
    fontWeight: '700',
  },
  username: {
    fontSize: fp(24),
    fontWeight: '700',
    marginTop: hp(16),
  },
  bio: {
    fontSize: fp(14),
    marginTop: hp(8),
    textAlign: 'center',
    paddingHorizontal: wp(40),
  },
  followButton: {
    marginTop: hp(16),
    paddingVertical: hp(10),
    paddingHorizontal: wp(40),
    borderRadius: wp(20),
  },
  followButtonPressed: {
    opacity: 0.8,
    transform: [{ scale: 0.98 }],
  },
  followButtonText: {
    fontSize: fp(14),
    fontWeight: '600',
  },
  statsBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    marginHorizontal: SPACING.screenPadding,
    marginTop: hp(16),
    paddingVertical: hp(16),
    borderRadius: wp(16),
    borderWidth: 1,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontSize: fp(20),
    fontWeight: '700',
  },
  statText: {
    fontSize: fp(12),
    marginTop: hp(2),
  },
  statDivider: {
    width: 1,
    height: hp(30),
  },
  recipesSection: {
    margin: SPACING.screenPadding,
    padding: wp(16),
    borderRadius: wp(16),
  },
  sectionTitle: {
    fontSize: fp(18),
    fontWeight: '700',
    marginBottom: hp(16),
  },
  recipesList: {
    gap: hp(12),
  },
  recipeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: wp(12),
    borderRadius: wp(12),
  },
  recipeCardPressed: {
    opacity: 0.7,
    transform: [{ scale: 0.98 }],
  },
  recipeImage: {
    width: wp(60),
    height: wp(60),
    borderRadius: wp(8),
  },
  recipeImagePlaceholder: {
    width: wp(60),
    height: wp(60),
    borderRadius: wp(8),
    justifyContent: 'center',
    alignItems: 'center',
  },
  recipeInfo: {
    flex: 1,
    marginLeft: wp(12),
  },
  recipeTitle: {
    fontSize: fp(15),
    fontWeight: '600',
  },
  recipeDescription: {
    fontSize: fp(12),
    marginTop: hp(2),
    lineHeight: fp(16),
  },
  recipeMeta: {
    flexDirection: 'row',
    marginTop: hp(6),
    gap: wp(12),
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: wp(4),
  },
  metaText: {
    fontSize: fp(11),
  },
  emptyRecipes: {
    alignItems: 'center',
    paddingVertical: hp(32),
  },
  emptyText: {
    fontSize: fp(14),
    marginTop: hp(8),
  },
});
