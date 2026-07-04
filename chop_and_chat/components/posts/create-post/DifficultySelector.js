import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { wp, hp, fp } from '../../../utils/responsive';

const DIFFICULTY_OPTIONS = ['Easy', 'Medium', 'Hard'];

export default function DifficultySelector({ selected, onSelect, theme }) {
    const getDifficultyColor = (diff) => {
        switch (diff) {
            case 'Easy': return theme.success;
            case 'Medium': return theme.warning;
            case 'Hard': return theme.danger;
            default: return theme.textSecondary;
        }
    };

    const getDifficultyBackground = (diff) => {
        switch (diff) {
            case 'Easy': return theme.successLight;
            case 'Medium': return theme.warningLight;
            case 'Hard': return theme.dangerLight;
            default: return theme.inputBackground;
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
                                ? getDifficultyBackground(diff)
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
        gap: wp(10),
    },
    difficultyChip: {
        paddingVertical: hp(10),
        paddingHorizontal: wp(20),
        borderRadius: wp(20),
        borderWidth: 1,
    },
    difficultyChipText: {
        fontSize: fp(14),
        fontWeight: '600',
    },
});
