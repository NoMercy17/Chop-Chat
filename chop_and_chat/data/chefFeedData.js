
// Helper to generate avatar initials from name
export const getInitials = (name) => {
    const parts = name.split(' ');
    if (parts.length >= 2) {
        return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
};

// Sample chefs data
export const chefs = {
    gordon: { id: 'chef-1', name: 'Gordon Ramsay', avatar: 'GR' },
    maria: { id: 'chef-2', name: 'Maria Garcia', avatar: 'MG' },
    antoine: { id: 'chef-3', name: 'Antoine Dubois', avatar: 'AD' },
    linda: { id: 'chef-4', name: 'Linda Brown', avatar: 'LB' },
    emma: { id: 'chef-5', name: 'Emma Wilson', avatar: 'EW' },
    marco: { id: 'chef-6', name: 'Marco Chen', avatar: 'MC' },
};

// Sample posts that chefs can react to
export const communityPosts = {
    post1: { id: 'post-1', title: 'Homemade Pizza Margherita', image: null, caption: 'Just made my first pizza from scratch!' },
    post2: { id: 'post-2', title: 'Grandma\'s Secret Pasta Recipe', image: null, caption: 'Finally got the family recipe!' },
    post3: { id: 'post-3', title: 'Vegan Chocolate Cake', image: null, caption: 'Who said vegan can\'t be delicious?' },
    post4: { id: 'post-4', title: 'Sunday Brunch Special', image: null, caption: 'Eggs benedict perfection' },
};

// Sample authors of community posts
export const postAuthors = {
    john: { id: 'user-1', name: 'John Doe', avatar: 'JD' },
    jane: { id: 'user-2', name: 'Jane Smith', avatar: 'JS' },
    mike: { id: 'user-3', name: 'Mike Johnson', avatar: 'MJ' },
    sarah: { id: 'user-4', name: 'Sarah Lee', avatar: 'SL' },
};

// Unified feed items
// Note: likes and comments belong to the FEED ITEM itself, not the underlying post
// A reaction is new content with its own engagement metrics
export const chefFeedItems = [
    // Chef Gordon reacting to someone else's post
    {
        id: 'feed-1',
        chef: chefs.gordon,
        contentType: 'reaction',
        likes: 234,
        comments: 0,
        liked: false,
        saved: false,
        reaction: {
            text: "This recipe is perfect for busy weeknights. Simple ingredients, amazing results! The crust technique you used is spot on.",
            targetPostId: communityPosts.post1.id,
            targetPost: communityPosts.post1,
            targetAuthor: postAuthors.john,
        },
        post: null,
        createdAt: '2026-01-11T10:30:00Z',
    },
    // Chef Maria reacting to someone else's post
    {
        id: 'feed-2',
        chef: chefs.maria,
        contentType: 'reaction',
        likes: 156,
        comments: 0,
        liked: false,
        saved: false,
        reaction: {
            text: "My kids absolutely love this dish. It's become our weekly staple. The seasoning is perfectly balanced!",
            targetPostId: communityPosts.post2.id,
            targetPost: communityPosts.post2,
            targetAuthor: postAuthors.jane,
        },
        post: null,
        createdAt: '2026-01-11T09:15:00Z',
    },
    // Chef Antoine reacting to someone else's post
    {
        id: 'feed-3',
        chef: chefs.antoine,
        contentType: 'reaction',
        likes: 89,
        comments: 0,
        liked: false,
        saved: false,
        reaction: {
            text: "Impressed my dinner guests with this one. Tastes like fine dining! The presentation is restaurant quality.",
            targetPostId: communityPosts.post3.id,
            targetPost: communityPosts.post3,
            targetAuthor: postAuthors.mike,
        },
        post: null,
        createdAt: '2026-01-11T08:00:00Z',
    },
    // Chef Linda reacting to someone else's post
    {
        id: 'feed-4',
        chef: chefs.linda,
        contentType: 'reaction',
        likes: 198,
        comments: 0,
        liked: false,
        saved: false,
        reaction: {
            text: "A nutritious meal that doesn't compromise on flavor. Highly recommend! Great technique on the hollandaise.",
            targetPostId: communityPosts.post4.id,
            targetPost: communityPosts.post4,
            targetAuthor: postAuthors.sarah,
        },
        post: null,
        createdAt: '2026-01-10T18:45:00Z',
    },
    // Chef Emma reacting to someone else's post
    {
        id: 'feed-5',
        chef: chefs.emma,
        contentType: 'reaction',
        likes: 67,
        comments: 0,
        liked: false,
        saved: false,
        reaction: {
            text: "Easy to follow steps, great for those just starting their cooking journey. Love how you explained each step!",
            targetPostId: communityPosts.post1.id,
            targetPost: communityPosts.post1,
            targetAuthor: postAuthors.john,
        },
        post: null,
        createdAt: '2026-01-10T16:30:00Z',
    },
    // Chef Marco reacting to his OWN post (still contentType: "reaction")
    {
        id: 'feed-6',
        chef: chefs.marco,
        contentType: 'reaction',
        likes: 312,
        comments: 0,
        liked: false,
        saved: false,
        reaction: {
            text: "Thanks everyone for the love! Here's a tip: let the dough rest for at least 2 hours for best results.",
            targetPostId: 'post-marco-1',
            targetPost: { id: 'post-marco-1', title: 'Weekend Special Dumplings', image: null, caption: 'My signature dish!' },
            targetAuthor: chefs.marco, // Reacting to own post
        },
        post: null,
        createdAt: '2026-01-10T14:00:00Z',
    },
];

// Sample list of followed chef IDs - in a real app this would come from your backend/context
export const FOLLOWED_CHEF_IDS = ['chef-1', 'chef-2', 'chef-5']; // Gordon, Maria, Emma
