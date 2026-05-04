import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';

const DIFFICULTY_OPTIONS = ['Easy', 'Medium', 'Hard'];

export default function DifficultySelector({ selected, onSelect, theme }) {
    const getDifficultyColor = (diff) => {
        switch (diff) {
            case 'Easy': return '#10B981';
            case 'Medium': return '#F59E0B';
            case 'Hard': return '#EF4444';
            default: return theme.textSecondary;
        }
    };

    return (
        <View style={styles.difficultyRow}>
            {DIFFICULTY_OPTIONS.map((diff) => (
                <Pressable
                    key={diff}
                    onPress={() => onSelect(diff)}
                    style={[
                        styles.difficultyChip,
                        { 
                            backgroundColor: selected === diff 
                                ? getDifficultyColor(diff) + '20' 
                                : theme.inputBackground,
                            borderColor: selected === diff 
                                ? getDifficultyColor(diff) 
                                : theme.border,
                        }
                    ]}
                >
                    <Text style={[
                        styles.difficultyChipText,
                        { color: selected === diff ? getDifficultyColor(diff) : theme.textSecondary }
                    ]}>
                        {diff}
                    </Text>
                </Pressable>
            ))}
        </View>
    );
}

const styles = StyleSheet.create({
    difficultyRow: {
        flexDirection: 'row',
        gap: 10,
    },
    difficultyChip: {
        paddingVertical: 10,
        paddingHorizontal: 20,
        borderRadius: 20,
        borderWidth: 1,
    },
    difficultyChipText: {
        fontSize: 14,
        fontWeight: '600',
    },
});
