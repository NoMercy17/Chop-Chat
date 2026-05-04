import React, { useState, useEffect, useMemo } from "react";
import { View, Text, ScrollView, Pressable, Image, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from "../context/ThemeContext";
import { useFollow } from "../context/FollowContext";
import { wp, hp, fp } from "../utils/responsive";
import DishDetailModal from "../components/posts/DishDetailModal";
import RecipeCard from "../components/posts/RecipeCard";

export default function OtherUserProfileScreen({ navigation, route }) {
  const { theme, isDarkMode } = useTheme();
  const { isFollowingUser, toggleFollow } = useFollow();
  const insets = useSafeAreaInsets();
  
  const { userId, userName, userAvatar } = route.params || {};
  const fullUserData = useMemo(() => ({ bio: 'Food Enthusiast', isChef: false }), []);
  const userRecipes = useMemo(() => [], []);
  const userFollowers = useMemo(() => [], []);
  const userFollowing = useMemo(() => [], []);

  const [followerAdjustment, setFollowerAdjustment] = useState(0);
  const [dishDetailModalVisible, setDishDetailModalVisible] = useState(false);
  const [selectedDish, setSelectedDish] = useState(null);

  const isFollowing = isFollowingUser(userId);
  const userBio = fullUserData?.bio || (fullUserData?.isChef ? 'Professional Chef' : 'Food Enthusiast');

  const handleFollow = () => {
    const nowFollowing = toggleFollow(userId);
    setFollowerAdjustment(prev => nowFollowing ? prev + 1 : prev - 1);
  };

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
          {userAvatar ? (
            <Image source={{ uri: userAvatar }} style={[styles.profileImage, { borderColor: theme.profileImageBorder }]} />
          ) : (
            <View style={[styles.profileImage, styles.avatarPlaceholder, { borderColor: theme.profileImageBorder, backgroundColor: theme.primary }]}>
              <Text style={styles.avatarInitials}>{getInitials(userName)}</Text>
            </View>
          )}
        </View>
        
        <Text style={[styles.username, { color: theme.profileTextPrimary }]}>{userName}</Text>
        <Text style={[styles.bio, { color: theme.profileTextSecondary }]} numberOfLines={2}>{userBio}</Text>

        <Pressable style={({ pressed }) => [styles.followButton, { backgroundColor: isFollowing ? theme.inputBackground : theme.primary }, pressed && styles.followButtonPressed]} onPress={handleFollow}>
          <Text style={[styles.followButtonText, { color: isFollowing ? theme.textPrimary : '#FFFFFF' }]}>{isFollowing ? 'Following' : 'Follow'}</Text>
        </Pressable>
      </View>

      <View style={[styles.statsBar, { backgroundColor: theme.cardBackground, borderColor: theme.border }]}>
        <View style={styles.statItem}>
          <Text style={[styles.statValue, { color: theme.textPrimary }]}>{userRecipes.length}</Text>
          <Text style={[styles.statText, { color: theme.textSecondary }]}>Recipes</Text>
        </View>
        <View style={[styles.statDivider, { backgroundColor: theme.border }]} />
        <View style={styles.statItem}>
          <Text style={[styles.statValue, { color: theme.textPrimary }]}>{userFollowers.length + followerAdjustment}</Text>
          <Text style={[styles.statText, { color: theme.textSecondary }]}>Followers</Text>
        </View>
        <View style={[styles.statDivider, { backgroundColor: theme.border }]} />
        <View style={styles.statItem}>
          <Text style={[styles.statValue, { color: theme.textPrimary }]}>{userFollowing.length}</Text>
          <Text style={[styles.statText, { color: theme.textSecondary }]}>Following</Text>
        </View>
      </View>

      <View style={styles.recipesSection}>
        <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>Recipes</Text>
        {userRecipes.map((recipe) => (
          <RecipeCard 
            key={recipe.id}
            recipe={recipe}
            variant="compact"
            theme={theme}
            onPress={() => { setSelectedDish(recipe); setDishDetailModalVisible(true); }}
          />
        ))}
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
  statsBar: { flexDirection: "row", justifyContent: "space-around", marginVertical: hp(20), marginHorizontal: wp(20), padding: wp(16), borderRadius: wp(16), borderWidth: 1 },
  statItem: { alignItems: "center", flex: 1 },
  statValue: { fontSize: fp(20), fontWeight: "700" },
  statText: { fontSize: fp(12), marginTop: hp(2) },
  statDivider: { width: 1, height: hp(30) },
  recipesSection: { paddingHorizontal: wp(20), paddingBottom: hp(40) },
  sectionTitle: { fontSize: fp(20), fontWeight: "700", marginBottom: hp(16) }
});
