import React, { useContext } from "react";
import { View, Text, ScrollView, Pressable, Image, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { AuthContext } from "../context/AuthContext";
import { wp, hp, fp, SPACING } from "../utils/responsive";

export default function ProfileScreen({ navigation }) {
  const auth = useContext(AuthContext);
  return (
    <ScrollView style={styles.container}>
      
      {/* Profile Header */}
      <View style={styles.header}>
        <Image 
          source={require("../assets/favicon.png")}
          style={styles.profileImage}
        />
        <Text style={styles.username}>Antonio</Text>
        <Text style={styles.bio}>Food enthusiast</Text>
      </View>

      {/* Stats Cards */}
      <View style={styles.statsContainer}>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>20</Text>
          <Text style={styles.statLabel}>Recipes searched</Text>
        </View>

        <View style={styles.statCard}>
          <Text style={styles.statNumber}>50</Text>
          <Text style={styles.statLabel}>Uploaded photos</Text>
        </View>
      </View>

      {/* Menu */}
      <View style={styles.menuContainer}>
        <Pressable 
          style={({ pressed }) => [
            styles.menuItem,
            pressed && styles.menuItemPressed
          ]}
          onPress={() => navigation.navigate("MyRecipes")}
        >
          <View style={styles.menuItemLeft}>
            <View style={styles.iconContainer}>
              <Ionicons name="list-outline" size={fp(22)} color="#3B82F6" />
            </View>
            <Text style={styles.menuText}>My Recipes</Text>
          </View>
          <Ionicons name="chevron-forward" size={fp(20)} color="#9CA3AF" />
        </Pressable>

        <Pressable 
          style={({ pressed }) => [
            styles.menuItem,
            pressed && styles.menuItemPressed
          ]}
          onPress={() => navigation.navigate("FavoriteRecipes")}
        >
          <View style={styles.menuItemLeft}>
            <View style={styles.iconContainer}>
              <Ionicons name="heart-outline" size={fp(22)} color="#3B82F6" />
            </View>
            <Text style={styles.menuText}>Favorite Recipes</Text>
          </View>
          <Ionicons name="chevron-forward" size={fp(20)} color="#9CA3AF" />
        </Pressable>

        <Pressable 
          style={({ pressed }) => [
            styles.menuItem,
            pressed && styles.menuItemPressed
          ]}
          onPress={() => navigation.navigate("Settings")}
        >
          <View style={styles.menuItemLeft}>
            <View style={styles.iconContainer}>
              <Ionicons name="settings-outline" size={fp(22)} color="#3B82F6" />
            </View>
            <Text style={styles.menuText}>Settings</Text>
          </View>
          <Ionicons name="chevron-forward" size={fp(20)} color="#9CA3AF" />
        </Pressable>
      </View>

      {/* Logout */}
      <Pressable 
        style={({ pressed }) => [
          styles.logoutButton,
          pressed && styles.logoutButtonPressed
        ]}
        onPress={() => auth.signOut()}
      >
        <Text style={styles.logoutText}>Log out</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F9FAFB",
  },
  header: {
    alignItems: "center",
    backgroundColor: "#3b83f68a",
    paddingTop: hp(40),
    paddingBottom: hp(32),
    borderBottomRightRadius: SPACING.radiusLarge,
    borderBottomLeftRadius: SPACING.radiusLarge,
  },
  profileImage: {
    width: wp(80),
    height: wp(80),
    borderRadius: wp(40),
  },
  username: {
    fontSize: fp(28),
    fontWeight: "700",
    color: "#FFFFFF",
    marginTop: hp(16),
    letterSpacing: -0.5,
  },
  bio: {
    color: "#DBEAFE",
    fontSize: fp(15),
    fontWeight: "400",
    marginTop: hp(4),
  },
  statsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: SPACING.screenPadding,
    marginTop: hp(-24),
    gap: SPACING.itemGap,
  },
  statCard: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    padding: wp(24),
    borderRadius: SPACING.radiusLarge,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: hp(2) },
    shadowOpacity: 0.08,
    shadowRadius: wp(12),
    elevation: 3,
  },
  statNumber: {
    fontSize: fp(32),
    fontWeight: "700",
    color: "#111827",
    letterSpacing: -1,
  },
  statLabel: {
    fontSize: fp(13),
    marginTop: hp(6),
    color: "#6B7280",
    fontWeight: "500",
    textAlign: "center",
  },
  menuContainer: {
    marginTop: SPACING.sectionGap,
    marginHorizontal: SPACING.screenPadding,
    backgroundColor: "#FFFFFF",
    borderRadius: SPACING.radiusLarge,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: hp(2) },
    shadowOpacity: 0.08,
    shadowRadius: wp(12),
    elevation: 3,
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: hp(16),
    paddingHorizontal: SPACING.cardPadding,
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },
  menuItemPressed: {
    backgroundColor: "#F9FAFB",
  },
  menuItemLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: wp(16),
  },
  iconContainer: {
    width: wp(40),
    height: wp(40),
    borderRadius: SPACING.radiusSmall,
    backgroundColor: "#F3F4F6",
    justifyContent: "center",
    alignItems: "center",
  },
  menuText: {
    fontSize: fp(16),
    color: "#111827",
    fontWeight: "600",
  },
  logoutButton: {
    marginTop: SPACING.sectionGap,
    marginHorizontal: SPACING.screenPadding,
    marginBottom: hp(40),
    paddingVertical: hp(16),
    backgroundColor: "#FEF2F2",
    borderRadius: SPACING.radiusMedium,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#FEE2E2",
  },
  logoutButtonPressed: {
    opacity: 0.8,
    transform: [{ scale: 0.98 }],
  },
  logoutText: {
    color: "#DC2626",
    fontSize: fp(16),
    fontWeight: "700",
  },
});
