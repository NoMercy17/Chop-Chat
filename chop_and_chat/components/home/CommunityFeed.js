import { Text, View, StyleSheet, ScrollView, Pressable } from 'react-native';
import { wp, hp, fp, SPACING } from '../../utils/responsive';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

export default function CommunityFeed() {
    const posts = [
        { id: 1, title: "Homemade Pizza Margherita", description: "Just made my first pizza from scratch! The dough came out perfect.", author: "John Doe", likes: 42, comments: 8 },
        { id: 2, title: "Grandma's Secret Pasta Recipe", description: "Finally convinced grandma to share her famous carbonara recipe.", author: "Jane Smith", likes: 127, comments: 23 },
        { id: 3, title: "Vegan Chocolate Cake", description: "Who said vegan desserts can't be delicious? This cake is amazing!", author: "Mike Johnson", likes: 89, comments: 15 },
        { id: 4, title: "Sunday Brunch Special", description: "Eggs benedict with hollandaise sauce - turned out better than expected.", author: "Sarah Lee", likes: 56, comments: 12 },
        { id: 5, title: "Thai Curry Adventure", description: "First time making green curry. The spice level is just right!", author: "Alex Brown", likes: 73, comments: 19 },
        { id: 6, title: "Sourdough Bread Success", description: "After days of feeding the starter, the crust and crumb finally nailed it.", author: "Emily Carter", likes: 94, comments: 21 },
        { id: 7, title: "Street-Style Tacos at Home", description: "Tried recreating authentic al pastor tacos with pineapple and cilantro.", author: "Carlos Rivera", likes: 118, comments: 27 },
        { id: 8, title: "Quick Weeknight Stir Fry", description: "15-minute veggie stir fry with garlic soy sauce. Simple and satisfying.", author: "Lina Wong", likes: 61, comments: 9 },
        { id: 9, title: "Classic French Omelette", description: "Focused on technique today—soft, buttery, and perfectly folded.", author: "Pierre Martin", likes: 85, comments: 14 },
        { id: 10, title: "Homemade Ice Cream Experiment", description: "No-churn vanilla ice cream with a salted caramel swirl.", author: "Olivia Green", likes: 102, comments: 18 },
    ];

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.sectionTitle}>Community Feed</Text>

                <Pressable 
                   style={({ pressed }) => [
                       styles.subtitleButton,
                       pressed && styles.subtitleButtonPressed
                   ]}
                    onPress={() => console.log("See what others are cooking")}>
                    <View style = {styles.subtitleContent}>
                        <Text style={styles.sectionSubtitle}>See what others are cooking</Text>
                        <Ionicons name="arrow-forward" size={fp(14)} color="#BFDBFE" />
                    </View>
                </Pressable>  

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
                
                {/* More Button */}
                <Pressable 
                    style={({ pressed }) => [
                        styles.moreCard,
                        pressed && styles.moreCardPressed
                    ]}
                    onPress={() => console.log('View all chef reviews')}
                >
                    <View style={styles.glassBackground}>
                        <View style={styles.moreCardContent}>
                            <Text style={styles.moreCardText}>More</Text>
                        </View>
                    </View>
                </Pressable>

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
    subtitleButton: {
        alignSelf: 'flex-start',
    },
    subtitleButtonPressed: {
        opacity: 0.7,
    },
    subtitleContent: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: wp(3),
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
    moreCard: {
        alignSelf: 'center',
        width: wp(110),
        marginTop: hp(8),
        marginBottom: hp(16),
        overflow: 'hidden',
    },
    moreCardPressed: {
        opacity: 0.85,
        transform: [{ scale: 0.96 }],
    },
    glassBackground: {
        backgroundColor: 'rgba(255, 255, 255, 0.18)',
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.35)',
        borderRadius: wp(25),
    },
    moreCardContent: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: hp(12),
        paddingHorizontal: wp(24),
    },
    moreCardText: {
        fontSize: fp(14),
        fontWeight: '600',
        color: '#FFFFFF',
        letterSpacing: 0.3,
    },
});