import React from 'react';
import { View, Text, StyleSheet, Pressable, TextInput } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { wp, hp, fp } from '../../../utils/responsive';

export default function IngredientList({ ingredients, onUpdate, onAdd, onRemove, theme }) {
    return (
        <View style={styles.inputGroup}>
            <View style={styles.labelRow}>
                <Text style={[styles.label, { color: theme.textPrimary }]}>
                    Ingredients <Text style={{ color: theme.danger }}>*</Text>
                </Text>
                <Pressable onPress={onAdd} style={styles.addButton}>
                    <Ionicons name="add-circle" size={fp(22)} color={theme.primary} />
                </Pressable>
            </View>
            {ingredients.map((ingredient, index) => (
                <View key={`ing-${index}`} style={styles.ingredientRow}>
                    <TextInput
                        style={[styles.ingredientInput, { backgroundColor: theme.inputBackground, color: theme.textPrimary }]}
                        placeholder={`Ingredient ${index + 1}`}
                        placeholderTextColor={theme.textTertiary}
                        value={ingredient}
                        onChangeText={(text) => onUpdate(index, text)}
                    />
                    {ingredients.length > 1 && (
                        <Pressable onPress={() => onRemove(index)} style={styles.removeButton}>
                            <Ionicons name="close-circle" size={fp(20)} color={theme.danger} />
                        </Pressable>
                    )}
                </View>
            ))}
        </View>
    );
}

const styles = StyleSheet.create({
    inputGroup: {
        marginBottom: hp(20),
    },
    label: {
        fontSize: fp(14),
        fontWeight: '600',
        marginBottom: hp(8),
    },
    labelRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: hp(8),
    },
    addButton: {
        padding: hp(4),
    },
    ingredientRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: hp(8),
    },
    ingredientInput: {
        flex: 1,
        borderRadius: wp(10),
        paddingHorizontal: wp(14),
        paddingVertical: hp(10),
        fontSize: fp(14),
    },
    removeButton: {
        padding: hp(6),
        marginLeft: wp(6),
    },
});
