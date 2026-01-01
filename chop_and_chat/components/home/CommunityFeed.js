import { Text, View, StyleSheet, ScrollView, Pressable } from 'react-native';
import { wp, hp, fp, SPACING } from '../../utils/responsive';

export default function CommunityFeed() {
    const posts = [
        { id: 1, title: "Homemade Pizza Margherita", description: "Just made my first pizza from scratch! The dough came out perfect.", author: "John Doe", likes: 42, comments: 8 },
        { id: 2, title: "Grandma's Secret Pasta Recipe", description: "Finally convinced grandma to share her famous carbonara recipe.", author: "Jane Smith", likes: 127, comments: 23 },
        { id: 3, title: "Vegan Chocolate Cake", description: "Who said vegan desserts can't be delicious? This cake is amazing!", author: "Mike Johnson", likes: 89, comments: 15 },
        { id: 4, title: "Sunday Brunch Special", description: "Eggs benedict with hollandaise sauce - turned out better than expected.", author: "Sarah Lee", likes: 56, comments: 12 },
        { id: 5, title: "Thai Curry Adventure", description: "First time making green curry. The spice level is just right!", author: "Alex Brown", likes: 73, comments: 19 },
    ];

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.sectionTitle}>Community Feed</Text>
                <Text style={styles.sectionSubtitle}>See what others are cooking</Text>
            </View>

            <ScrollView 
                style={styles.scrollContainer}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.scrollContent}
            >
                {posts.map((post) => (
                    <Pressable 
                        key={post.id} 
                        style={({ pressed }) => [
                            styles.postCard,
                            pressed && styles.postCardPressed
                        ]}
                        onPress={() => console.log('Post pressed:', post.id)}
                    >
                        <View style={styles.dishImagePlaceholder}>
                            <Text style={styles.imagePlaceholderText}>IMAGE</Text>
                        </View>

                        <View style={styles.postContent}>
                            <Text style={styles.postTitle}>{post.title}</Text>
                            <Text style={styles.postDescription}>{post.description}</Text>
                            
                            <View style={styles.postMeta}>
                                <Text style={styles.postAuthor}>by {post.author}</Text>
                                <View style={styles.postStats}>
                                    <Text style={styles.statText}>♥ {post.likes}</Text>
                                    <Text style={styles.statText}>💬 {post.comments}</Text>
                                </View>
                            </View>
                        </View>
                    </Pressable>
                ))}
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        paddingTop: SPACING.sectionGap,
    },
    header: {
        paddingHorizontal: SPACING.screenPadding,
        marginBottom: SPACING.itemGap,
    },
    sectionTitle: {
        fontSize: fp(22),
        fontWeight: '700',
        color: '#FFFFFF',
        marginBottom: hp(4),
        letterSpacing: -0.5,
    },
    sectionSubtitle: {
        fontSize: fp(14),
        color: '#BFDBFE',
        fontWeight: '400',
    },
    scrollContainer: {
        flex: 1,
    },
    scrollContent: {
        paddingHorizontal: SPACING.screenPadding,
        paddingBottom: hp(32),
    },
    postCard: {
        backgroundColor: '#FFFFFF',
        borderRadius: SPACING.radiusLarge,
        marginBottom: SPACING.itemGap,
        overflow: 'hidden',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: hp(2) },
        shadowOpacity: 0.08,
        shadowRadius: wp(12),
        elevation: 3,
    },
    postCardPressed: {
        opacity: 0.95,
        transform: [{ scale: 0.99 }],
    },
    dishImagePlaceholder: {
        width: '100%',
        height: hp(180),
        backgroundColor: '#F3F4F6',
        justifyContent: 'center',
        alignItems: 'center',
    },
    imagePlaceholderText: {
        fontSize: fp(14),
        fontWeight: '600',
        color: '#9CA3AF',
        letterSpacing: 2,
    },
    postContent: {
        padding: wp(16),
        gap: hp(8),
    },
    postTitle: {
        fontSize: fp(18),
        fontWeight: '700',
        color: '#111827',
        letterSpacing: -0.3,
    },
    postDescription: {
        fontSize: fp(14),
        color: '#6B7280',
        lineHeight: hp(20),
    },
    postMeta: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: hp(8),
        paddingTop: hp(12),
        borderTopWidth: 1,
        borderTopColor: '#F3F4F6',
    },
    postAuthor: {
        fontSize: fp(13),
        color: '#9CA3AF',
        fontWeight: '500',
    },
    postStats: {
        flexDirection: 'row',
        gap: wp(16),
    },
    statText: {
        fontSize: fp(13),
        color: '#6B7280',
        fontWeight: '600',
    },
});