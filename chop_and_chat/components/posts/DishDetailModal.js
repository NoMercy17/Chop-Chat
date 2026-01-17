import { useState } from 'react';
import { View, Text, StyleSheet, Modal, ScrollView, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { wp, hp, fp, SPACING } from '../../utils/responsive';
import { useTheme } from '../../context/ThemeContext';

export default function DishDetailModal({ visible, onClose, dish }) {
    const { theme } = useTheme();

    if (!dish) return null;

    // Mock ingredients data
    const mockIngredients = dish.ingredients || [
        '2 cups all-purpose flour',
        '1 tablespoon salt',
        '500ml warm water',
        '7g instant yeast',
        '2 tablespoons olive oil',
        'Fresh basil leaves',
        'Mozzarella cheese',
        'Tomato sauce',
    ];

    const mockInstructions = dish.instructions || 
        `Mix flour and salt in a large bowl.
Create a well in the center and add warm water and yeast.
Gradually incorporate flour into the liquid, stirring until combined.

Knead the dough on a floured surface for 10 minutes until smooth and elastic.
Place dough in a greased bowl, cover with a damp cloth, and let rise for 1-2 hours.

Divide dough and stretch into pizza bases. Add toppings and bake at 220°C for 12-15 minutes.`;

    const kitchenUtensils = dish.utensils || ['oven', 'grill', 'stove'];
    const cookTime = dish.cookTime || '15 min';

    const difficulty = dish.difficulty || 'Medium';
    const difficultyColor = 
        difficulty === 'Easy' ? '#10B981' :
        difficulty === 'Medium' ? '#F59E0B' :
        '#EF4444';

    return (
        <Modal
            visible={visible}
            animationType="slide"
            presentationStyle="pageSheet"
            onRequestClose={onClose}
        >
            <View style={[styles.container, { backgroundColor: theme.screenBackground }]}>
                {/* Header with close button */}
                <View style={styles.headerBar}>
                    <Pressable
                        onPress={onClose}
                        style={({ pressed }) => [
                            styles.closeButton,
                            pressed && styles.closeButtonPressed
                        ]}
                    >
                        <Ionicons name="close" size={fp(24)} color={theme.textPrimary} />
                    </Pressable>
                </View>

                <ScrollView
                    style={styles.scrollContainer}
                    contentContainerStyle={styles.scrollContent}
                    showsVerticalScrollIndicator={false}
                >
                    {/* IMAGE */}
                    <View style={[styles.dishImage, { backgroundColor: theme.imageBackground }]}>
                        <Text style={[styles.imagePlaceholderText, { color: theme.textTertiary }]}>
                            DISH IMAGE
                        </Text>
                    </View>

                    {/* Content Wrapper */}
                    <View style={[styles.contentWrapper, { backgroundColor: theme.screenBackground }]}>
                        {/* TITLE */}
                        <Text style={[styles.title, { color: theme.textPrimary }]}>
                            {dish.title}
                        </Text>

                        {/* SHORT DESCRIPTION */}
                        {/* Uses theme.textSecondary */}
                        <Text style={[styles.description, { color: theme.textSecondary }]}>
                            {dish.description}
                        </Text>

                        {/* DIVIDER */}
                        {/* UPDATED: Uses theme.textSecondary with opacity to match text color but act as a line */}
                        <View
                            style={[styles.divider, { backgroundColor: theme.textSecondary, opacity: 0.2 }]}
                        />

                        {/* KITCHEN UTENSILS & COOK TIME */}
                        <View style={styles.utilitiesSection}>
                            {/* Kitchen Utensils */}
                            <View style={styles.utensilsGroup}>
                                {/* UPDATED: Uses theme.textSecondary */}
                                <Text style={[styles.utilitiesLabel, { color: theme.textSecondary }]}>
                                    Tools
                                </Text>
                                <View style={styles.utensilsList}>
                                    {kitchenUtensils.map((utensil, index) => (
                                        <View key={index} style={styles.utensilItem}>
                                            <View
                                                style={[
                                                    styles.utensilBullet,
                                                    { backgroundColor: theme.primary },
                                                ]}
                                            />
                                            <Text
                                                style={[
                                                    styles.utensilText,
                                                    { color: theme.textPrimary },
                                                ]}
                                            >
                                                {utensil.charAt(0).toUpperCase() + utensil.slice(1)}
                                            </Text>
                                        </View>
                                    ))}
                                </View>
                            </View>

                            {/* Cook Time */}
                            <View style={styles.cookTimeGroup}>
                                {/* UPDATED: Uses theme.textSecondary */}
                                <Text style={[styles.utilitiesLabel, { color: theme.textSecondary }]}>
                                    Cook Time
                                </Text>
                                <View style={styles.cookTimeRow}>
                                    <Ionicons name="time-outline" size={fp(16)} color={theme.textPrimary} />
                                    <Text style={[styles.cookTimeValue, { color: theme.textPrimary }]}>
                                        {cookTime}
                                    </Text>
                                </View>
                            </View>
                        </View>

                        {/* DIFFICULTY BADGE */}
                        <View style={styles.difficultyContainer}>
                            <View
                                style={[
                                    styles.difficultyBadge,
                                    { backgroundColor: difficultyColor + '20' },
                                ]}
                            >
                                <Text
                                    style={[
                                        styles.difficultyText,
                                        { color: difficultyColor },
                                    ]}
                                >
                                    {difficulty}
                                </Text>
                            </View>
                        </View>

                        {/* DIVIDER */}
                        {/* UPDATED: Uses theme.textSecondary with opacity */}
                        <View
                            style={[styles.divider, { backgroundColor: theme.textSecondary, opacity: 0.2 }]}
                        />

                        {/* INGREDIENTS */}
                        <View style={styles.ingredientsSection}>
                            <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>
                                Ingredients
                            </Text>
                            <View style={styles.ingredientsList}>
                                {mockIngredients.map((ingredient, index) => (
                                    <View key={index} style={styles.ingredientItem}>
                                        <View
                                            style={[
                                                styles.ingredientBullet,
                                                { backgroundColor: theme.primary },
                                            ]}
                                        />
                                        <Text
                                            style={[
                                                styles.ingredientText,
                                                { color: theme.textPrimary },
                                            ]}
                                        >
                                            {ingredient}
                                        </Text>
                                    </View>
                                ))}
                            </View>
                        </View>

                        {/* INSTRUCTIONS */}
                        {mockInstructions && (
                            <>
                                <View
                                    style={[styles.divider, { backgroundColor: theme.textSecondary, opacity: 0.2 }]}
                                />
                                <View style={styles.instructionsSection}>
                                    <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>
                                        Instructions
                                    </Text>
                                    <Text style={[styles.instructionsText, { color: theme.textPrimary }]}>
                                        {mockInstructions}
                                    </Text>
                                </View>
                            </>
                        )}

                        <View style={{ height: hp(20) }} />
                    </View>
                </ScrollView>
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    headerBar: {
        flexDirection: 'row',
        justifyContent: 'flex-start',
        alignItems: 'center',
        paddingHorizontal: SPACING.screenPadding,
        paddingVertical: hp(12),
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(0, 0, 0, 0.05)',
    },
    closeButton: {
        padding: wp(8),
        borderRadius: wp(8),
    },
    closeButtonPressed: {
        backgroundColor: 'rgba(0, 0, 0, 0.05)',
    },
    scrollContainer: {
        flex: 1,
    },
    scrollContent: {
        paddingBottom: hp(40),
    },
    dishImage: {
        width: '100%',
        height: hp(250),
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#E5E7EB',
    },
    imagePlaceholderText: {
        fontSize: fp(18),
        fontWeight: '600',
        opacity: 0.6,
    },
    contentWrapper: {
        paddingHorizontal: SPACING.screenPadding,
        paddingTop: hp(20),
    },
    title: {
        fontSize: fp(24),
        fontWeight: '800',
        marginBottom: hp(8),
        letterSpacing: -0.3,
    },
    description: {
        fontSize: fp(14),
        lineHeight: fp(20),
        marginBottom: hp(16),
        fontWeight: '400',
    },
    divider: {
        height: 1,
        marginVertical: hp(16),
    },
    utilitiesSection: {
        marginBottom: hp(16),
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: wp(24),
    },
    utensilsGroup: {
        flex: 1,
    },
    cookTimeGroup: {
        marginBottom: hp(0),
    },
    cookTimeRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: wp(4),
    },
    utilitiesLabel: {
        fontSize: fp(12),
        fontWeight: '500',
        marginBottom: hp(8),
    },
    utensilsList: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: wp(12),
    },
    utensilItem: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    utensilBullet: {
        width: wp(6),
        height: wp(6),
        borderRadius: wp(3),
        marginRight: wp(8),
    },
    utensilText: {
        fontSize: fp(13),
        fontWeight: '400',
    },
    cookTimeValue: {
        fontSize: fp(16),
        fontWeight: '600',
    },
    difficultyContainer: {
        marginBottom: hp(16),
    },
    difficultyBadge: {
        paddingHorizontal: wp(8),
        paddingVertical: hp(2),
        borderRadius: wp(6),
        alignSelf: 'flex-start',
    },
    difficultyText: {
        fontSize: fp(11),
        fontWeight: '600',
        textTransform: 'capitalize',
    },
    ingredientsSection: {
        marginBottom: hp(20),
    },
    sectionTitle: {
        fontSize: fp(18),
        fontWeight: '700',
        marginBottom: hp(12),
    },
    ingredientsList: {
        gap: hp(8),
    },
    ingredientItem: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    ingredientBullet: {
        width: wp(6),
        height: wp(6),
        borderRadius: wp(3),
        marginRight: wp(12),
    },
    ingredientText: {
        fontSize: fp(14),
        lineHeight: fp(20),
        flex: 1,
    },
    instructionsSection: {
        marginBottom: hp(20),
    },
    instructionsText: {
        fontSize: fp(14),
        lineHeight: fp(22),
        fontWeight: '400',
        marginTop: hp(8),
    },
});