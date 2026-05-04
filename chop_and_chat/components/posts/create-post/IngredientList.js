import React from 'react';
import { View, Text, StyleSheet, Pressable, TextInput } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { fp } from '../../../utils/responsive';

export default function IngredientList({ ingredients, onUpdate, onAdd, onRemove, theme }) {
    return (
        <View style={styles.inputGroup}>
            <View style={styles.labelRow}>
                <Text style={[styles.label, { color: theme.textPrimary }]}>
                    Ingredients <Text style={styles.required}>*</Text>
                </Text>
                <Pressable onPress={onAdd} style={styles.addButton}>
                    <Ionicons name="add-circle" size={fp(22)} color={theme.primary} />
                </Pressable>
            </View>
            {ingredients.map((ingredient, index) => (
                <View key={index} style={styles.ingredientRow}>
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
        marginBottom: 20,
    },
    label: {
        fontSize: 14,
        fontWeight: '600',
        marginBottom: 8,
    },
    labelRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    required: {
        color: '#EF4444',
    },
    addButton: {
        padding: 4,
    },
    ingredientRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8,
    },
    ingredientInput: {
        flex: 1,
        borderRadius: 10,
        paddingHorizontal: 14,
        paddingVertical: 10,
        fontSize: 14,
    },
    removeButton: {
        padding: 6,
        marginLeft: 6,
    },
});
