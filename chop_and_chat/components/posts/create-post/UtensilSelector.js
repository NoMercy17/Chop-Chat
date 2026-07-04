import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { wp, hp, fp } from '../../../utils/responsive';

const UTENSIL_OPTIONS = [
    { id: 'oven', label: 'Oven', icon: 'tablet-landscape-outline' },
    { id: 'stove', label: 'Stove', icon: 'flame-outline' },
    { id: 'mixer', label: 'Mixer', icon: 'sync-outline' },
    { id: 'blender', label: 'Blender', icon: 'color-wand-outline' },
    { id: 'microwave', label: 'Microwave', icon: 'tv-outline' },
    { id: 'grill', label: 'Grill', icon: 'bonfire-outline' },
    { id: 'airfryer', label: 'Air Fryer', icon: 'leaf-outline' },
    { id: 'pot', label: 'Pot', icon: 'water-outline' },
    { id: 'wok', label: 'Wok', icon: 'restaurant-outline' },
];

export default function UtensilSelector({ selected, onToggle, theme }) {
    return (
        <View style={styles.utensilsGrid}>
            {UTENSIL_OPTIONS.map((utensil) => {
                const isSelected = selected.includes(utensil.id);
                return (
                    <Pressable
                        key={utensil.id}
                        onPress={() => onToggle(utensil.id)}
                        style={[
                            styles.utensilChip,
                            { 
                                backgroundColor: isSelected ? theme.primaryLightest : theme.inputBackground,
                                borderColor: isSelected ? theme.primary : theme.border,
                            }
                        ]}
                    >
                        <Ionicons 
                            name={utensil.icon} 
                            size={fp(16)} 
                            color={isSelected ? theme.primary : theme.textSecondary} 
                        />
                        <Text style={[
                            styles.utensilChipText,
                            { color: isSelected ? theme.primary : theme.textSecondary }
                        ]}>
                            {utensil.label}
                        </Text>
                    </Pressable>
                );
            })}
        </View>
    );
}

const styles = StyleSheet.create({
    utensilsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: wp(8),
    },
    utensilChip: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: wp(6),
        paddingVertical: hp(8),
        paddingHorizontal: wp(12),
        borderRadius: wp(20),
        borderWidth: 1,
    },
    utensilChipText: {
        fontSize: fp(13),
        fontWeight: '500',
    },
});
