import { Text, View, StyleSheet, Pressable } from 'react-native';
import { wp, hp, fp, SPACING } from '../../utils/responsive';

export default function MainActions() {
    return (
        <View style={styles.container}>
            <Pressable 
                style={({ pressed }) => [
                    styles.card,
                    pressed && styles.cardPressed
                ]}
                onPress={() => console.log('Find Recipe pressed')}
            >
                <View style={styles.textContainer}>
                    <Text style={styles.title}>Find a Recipe</Text>
                    <Text style={styles.subtitle}>Turn leftovers into something edible</Text>
                </View>
                <View style={styles.iconContainer}>
                    <Text style={styles.icon}>→</Text>
                </View>
            </Pressable>

            <Pressable 
                style={({ pressed }) => [
                    styles.card,
                    pressed && styles.cardPressed
                ]}
                onPress={() => console.log('Upload Dish pressed')}
            >
                <View style={styles.textContainer}>
                    <Text style={styles.title}>Upload Your Dish</Text>
                    <Text style={styles.subtitle}>Ready to be judged?</Text>
                </View>
                <View style={styles.iconContainer}>
                    <Text style={styles.icon}>+</Text>
                </View>
            </Pressable>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        paddingHorizontal: SPACING.screenPadding,
        paddingTop: SPACING.sectionGap,
        paddingBottom: hp(4),
        gap: SPACING.itemGap,
    },
    card: {
        flexDirection: 'row',
        backgroundColor: '#FFFFFF',
        padding: SPACING.cardPadding,
        borderRadius: SPACING.radiusLarge,
        alignItems: 'center',
        justifyContent: 'space-between',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: hp(2) },
        shadowOpacity: 0.08,
        shadowRadius: wp(12),
        elevation: 3,
    },
    cardPressed: {
        opacity: 0.9,
        transform: [{ scale: 0.98 }],
    },
    textContainer: {
        flex: 1,
        gap: hp(6),
    },
    title: {
        fontSize: fp(18),
        fontWeight: '700',
        color: '#111827',
        letterSpacing: -0.3,
    },
    subtitle: {
        fontSize: fp(14),
        color: '#6B7280',
        fontWeight: '400',
        lineHeight: hp(20),
    },
    iconContainer: {
        width: wp(40),
        height: wp(40),
        borderRadius: wp(10),
        backgroundColor: '#F3F4F6',
        justifyContent: 'center',
        alignItems: 'center',
        marginLeft: wp(16),
    },
    icon: {
        fontSize: fp(20),
        color: '#3B82F6',
        fontWeight: '600',
    },
});