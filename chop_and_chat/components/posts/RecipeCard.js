import React from 'react';
import { View, Text, StyleSheet, Pressable, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { wp, hp, fp } from '../../utils/responsive';

/**
 * A reusable recipe card component used in Favorites, My Recipes, and Other User Profile.
 * Supports different "variants":
 * - 'detailed': Full card with difficulty badge (Favorites)
 * - 'compact': Smaller card (Profile/My Recipes)
 */
export default function RecipeCard({ 
  recipe, 
  onPress, 
  variant = 'detailed', 
  theme, 
  rightActionIcon, 
  onRightAction 
}) {
  
  const getDifficultyColor = (difficulty) => {
    switch (difficulty?.toLowerCase()) {
      case 'easy': return '#10B981';
      case 'medium': return '#F59E0B';
      case 'hard': return '#EF4444';
      default: return '#6B7280';
    }
  };

  const isDetailed = variant === 'detailed';

  return (
    <Pressable
      style={({ pressed }) => [
        styles.card,
        { backgroundColor: theme.cardBackground || theme.inputBackground },
        pressed && styles.cardPressed,
        !isDetailed && styles.compactCard
      ]}
      onPress={onPress}
    >
      {/* Image Section */}
      <View style={isDetailed ? styles.imageContainer : styles.compactImageContainer}>
        {recipe.image ? (
          <Image source={{ uri: recipe.image }} style={styles.image} />
        ) : (
          <View style={[styles.placeholder, { backgroundColor: theme.inputBackground }]}>
            <Ionicons name="restaurant-outline" size={isDetailed ? fp(28) : fp(24)} color="#9CA3AF" />
          </View>
        )}
      </View>

      {/* Info Section */}
      <View style={[styles.info, !isDetailed && styles.compactInfo]}>
        <View style={styles.titleRow}>
          <Text style={[styles.title, { color: theme.textPrimary }]} numberOfLines={1}>{recipe.title}</Text>
        </View>
        
        {isDetailed && <Text style={[styles.author, { color: theme.textSecondary }]}>by {recipe.author}</Text>}
        
        {!isDetailed && (
          <Text style={[styles.description, { color: theme.textSecondary }]} numberOfLines={2}>
            {recipe.description}
          </Text>
        )}
        
        <View style={styles.meta}>
          <View style={styles.metaItem}>
            <Ionicons name="time-outline" size={fp(14)} color={theme.textSecondary} />
            <Text style={[styles.metaText, { color: theme.textSecondary }]}>{recipe.cookTime}{isDetailed ? 'min' : ''}</Text>
          </View>
          
          <View style={styles.metaItem}>
            <Ionicons name={isDetailed ? "star" : "heart-outline"} size={fp(14)} color={isDetailed ? "#FBBF24" : theme.textSecondary} />
            <Text style={[styles.metaText, { color: theme.textSecondary }]}>{isDetailed ? recipe.rating : recipe.likes}</Text>
          </View>

          {isDetailed && recipe.difficulty && (
            <View style={[styles.difficultyBadge, { backgroundColor: getDifficultyColor(recipe.difficulty) + '20' }]}>
              <Text style={[styles.difficultyText, { color: getDifficultyColor(recipe.difficulty) }]}>
                {recipe.difficulty}
              </Text>
            </View>
          )}
        </View>
      </View>

      {/* Optional Right Action (e.g. Heart, Bookmark, Delete) */}
      {rightActionIcon && (
        <Pressable 
          style={[styles.actionButton, { backgroundColor: theme.postContentBackground }]}
          onPress={(e) => {
            e.stopPropagation();
            if (onRightAction) onRightAction(recipe.id);
          }}
        >
          <Ionicons name={rightActionIcon} size={fp(24)} color={rightActionIcon === 'bookmark' ? "#EF4444" : theme.textSecondary} />
        </Pressable>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: { borderRadius: wp(16), marginBottom: hp(16), overflow: 'hidden', flexDirection: 'row', alignItems: 'center' },
  cardPressed: { opacity: 0.9 },
  compactCard: { padding: wp(12), gap: wp(12) },
  
  imageContainer: { width: wp(100), height: wp(100) },
  compactImageContainer: { width: wp(70), height: wp(70), borderRadius: wp(12), overflow: 'hidden' },
  image: { width: '100%', height: '100%', resizeMode: 'cover' },
  placeholder: { width: '100%', height: '100%', justifyContent: 'center', alignItems: 'center' },
  
  info: { flex: 1, padding: wp(12) },
  compactInfo: { padding: 0 },
  titleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  title: { fontSize: fp(16), fontWeight: '700' },
  author: { fontSize: fp(13), marginVertical: hp(2) },
  description: { fontSize: fp(13), marginVertical: hp(4) },
  
  meta: { flexDirection: 'row', alignItems: 'center', marginTop: hp(6), gap: wp(12) },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: wp(4) },
  metaText: { fontSize: fp(12) },
  
  difficultyBadge: { paddingHorizontal: wp(8), paddingVertical: hp(2), borderRadius: wp(8), marginLeft: wp(4) },
  difficultyText: { fontSize: fp(10), fontWeight: '700', textTransform: 'uppercase' },
  
  actionButton: { padding: wp(8), borderRadius: wp(20), position: 'absolute', top: hp(10), right: wp(10) }
});
