import React, { useContext } from "react";
import { View, Text, ScrollView, Pressable, Image, StyleSheet, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { AuthContext } from "../context/AuthContext";

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
                    onPress={() => navigation.navigate("Home")}
                >
                    <View style={styles.menuItemLeft}>
                        <View style={styles.iconContainer}>
                            <Ionicons name="list-outline" size={22} color="#3B82F6" />
                        </View>
                        <Text style={styles.menuText}>My Recipes</Text>
                    </View>
                    <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
                </Pressable>

        <TouchableOpacity style={styles.menuItem} onPress={() => navigation.navigate("Home")}>
          <Ionicons name="heart-outline" style={styles.icon} />
          <Text style={styles.menuText}>Favorite Recipes</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.menuItem} onPress={() => navigation.navigate("Settings")}>
          <Ionicons name="settings-outline" style={styles.icon} />
          <Text style={styles.menuText}>Settings</Text>
        </TouchableOpacity>
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
        paddingTop: 40,
        paddingBottom: 32,
        borderBottomRightRadius: 24,
        borderBottomLeftRadius: 24,
    },
    profileImageContainer: {
        width: 88,
        height: 88,
        borderRadius: 44,
        backgroundColor: "#FFFFFF",
        padding: 4,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 12,
        elevation: 6,
    },
    profileImage: {
        width: 80,
        height: 80,
        borderRadius: 40,
    },
    username: {
        fontSize: 28,
        fontWeight: "700",
        color: "#FFFFFF",
        marginTop: 16,
        letterSpacing: -0.5,
    },
    bio: {
        color: "#DBEAFE",
        fontSize: 15,
        fontWeight: "400",
        marginTop: 4,
    },
    statsContainer: {
        flexDirection: "row",
        justifyContent: "space-between",
        paddingHorizontal: 20,
        marginTop: -24,
        gap: 16,
    },
    statCard: {
        flex: 1,
        backgroundColor: "#FFFFFF",
        padding: 24,
        borderRadius: 16,
        alignItems: "center",
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 12,
        elevation: 3,
    },
    statNumber: {
        fontSize: 32,
        fontWeight: "700",
        color: "#111827",
        letterSpacing: -1,
    },
    statLabel: {
        fontSize: 13,
        marginTop: 6,
        color: "#6B7280",
        fontWeight: "500",
        textAlign: "center",
    },
    menuContainer: {
        marginTop: 32,
        marginHorizontal: 20,
        backgroundColor: "#FFFFFF",
        borderRadius: 16,
        overflow: "hidden",
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 12,
        elevation: 3,
    },
    menuItem: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        paddingVertical: 16,
        paddingHorizontal: 16,
        borderBottomWidth: 1,
        borderBottomColor: "#F3F4F6",
    },
    menuItemPressed: {
        backgroundColor: "#F9FAFB",
    },
    menuItemLeft: {
        flexDirection: "row",
        alignItems: "center",
        gap: 16,
    },
    iconContainer: {
        width: 40,
        height: 40,
        borderRadius: 10,
        backgroundColor: "#F3F4F6",
        justifyContent: "center",
        alignItems: "center",
    },
    menuText: {
        fontSize: 16,
        color: "#111827",
        fontWeight: "600",
    },
    logoutButton: {
        marginTop: 32,
        marginHorizontal: 20,
        marginBottom: 40,
        paddingVertical: 16,
        backgroundColor: "#FEF2F2",
        borderRadius: 12,
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
        fontSize: 16,
        fontWeight: "700",
    },
});
