import { Text, View, StyleSheet, ScrollView, Pressable } from 'react-native';

export default function FeaturedChef(){

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.sectionTitle}>Featured Chef Review</Text>
                <Text style={styles.sectionSubtitle}>See what the pros think</Text>
            </View>
            
            <ScrollView 
                horizontal 
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.scrollContainer}
            >
                {reviews.map((review) => (
                    <Pressable 
                        key={review.id} 
                        style={({ pressed }) => [
                            styles.reviewCard,
                            pressed && styles.reviewCardPressed
                        ]}
                        onPress={() => console.log('Review pressed:', review.id)}
                    >
                        <View style={styles.cardHeader}>
                            <View style={styles.chefAvatar}>
                                <Text style={styles.chefInitial}>GR</Text>
                            </View>
                            <Text style={styles.reviewTime}>{review.title}</Text>
                        </View>
                        
                        <View style={styles.divider} />
                        
                        <View style={styles.reviewContent}>
                            <Text style={styles.reviewText}>{review.text}</Text>
                            <Text style={styles.reviewChef}>{review.chef}</Text>
                        </View>
                    </Pressable>
                ))}
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        paddingVertical: 24,
    },
    header: {
        paddingHorizontal: 20,
        marginBottom: 16,
    },
    sectionTitle: {
        fontSize: 22,
        fontWeight: '700',
        color: '#FFFFFF',
        marginBottom: 4,
        letterSpacing: -0.5,
    },
    sectionSubtitle: {
        fontSize: 14,
        color: '#BFDBFE',
        fontWeight: '400',
    },
    scrollContainer: {
        paddingHorizontal: 20,
        gap: 16,
    },
    reviewCard: {
        width: 280,
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        overflow: 'hidden',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 12,
        elevation: 3,
    },
    reviewCardPressed: {
        opacity: 0.9,
        transform: [{ scale: 0.98 }],
    },
    cardHeader: {
        backgroundColor: '#F9FAFB',
        padding: 16,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    chefAvatar: {
        width: 56,
        height: 56,
        backgroundColor: '#3B82F6',
        borderRadius: 28,
        justifyContent: 'center',
        alignItems: 'center',
    },
    chefInitial: {
        fontSize: 20,
        fontWeight: '700',
        color: '#FFFFFF',
    },
    reviewTime: {
        fontSize: 12,
        color: '#9CA3AF',
        fontWeight: '600',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
        flex: 1,
    },
    divider: {
        height: 1,
        backgroundColor: '#E5E7EB',
        marginHorizontal: 16,
    },
    reviewContent: {
        padding: 16,
        gap: 6,
        backgroundColor: '#FFFFFF',
    },
    reviewText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#111827',
        lineHeight: 22,
    },
    reviewChef: {
        fontSize: 14,
        color: '#6B7280',
        fontWeight: '400',
        marginTop: 2,
    },
});