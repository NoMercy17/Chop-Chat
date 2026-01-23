// Helper to generate avatar initials from name
export const getInitials = (name) => {
    const parts = name.split(' ');
    if (parts.length >= 2) {
        return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
};

// USERS & AUTHORS

export const mockUsers = [
    { id: 'user-1', name: 'John Doe', avatar: 'JD', isChef: false, bio: 'Food Enthusiast' },
    { id: 'user-2', name: 'Jane Smith', avatar: 'JS', isChef: false, bio: 'Food Enthusiast' },
    { id: 'user-3', name: 'Mike Johnson', avatar: 'MJ', isChef: false, bio: 'Food Enthusiast' },
    { id: 'user-4', name: 'Sarah Lee', avatar: 'SL', isChef: false, bio: 'Food Enthusiast' },
];

// CHEFS

export const mockChefs = [
    { id: 'chef-1', name: 'Gordon Ramsay', avatar: 'GR', isChef: true, bio: 'Professional Chef' },
    { id: 'chef-2', name: 'Maria Garcia', avatar: 'MG', isChef: true, bio: 'Professional Chef' },
    { id: 'chef-3', name: 'Antoine Dubois', avatar: 'AD', isChef: true, bio: 'Professional Chef' },
    { id: 'chef-4', name: 'Linda Brown', avatar: 'LB', isChef: true, bio: 'Professional Chef' },
];

// INGREDIENTS

export const mockIngredients = {
    pizza: [
        '2 cups all-purpose flour',
        '1 tablespoon salt',
        '500ml warm water',
        '7g instant yeast',
        '2 tablespoons olive oil',
        'Fresh basil leaves',
        'Mozzarella cheese',
        'Tomato sauce',
    ],
    pasta: [
        '2 cups pasta',
        '3 eggs',
        '200g pancetta',
        '100g parmesan',
        '1 tsp black pepper',
    ],
    curry: [
        '500g chicken breast',
        '400ml coconut milk',
        '3 tbsp green curry paste',
        'Thai basil',
        '100g bamboo shoots',
    ],
    cake: [
        '2 cups flour',
        '1 cup cocoa powder',
        '1 cup sugar',
        '1 cup almond milk',
        '1/2 cup oil',
    ],
};

// INSTRUCTIONS

export const mockInstructions = {
    pizza: `Mix flour and salt in a large bowl.
Create a well in the center and add warm water and yeast.
Gradually incorporate flour into the liquid, stirring until combined.

Knead the dough on a floured surface for 10 minutes until smooth and elastic.
Place dough in a greased bowl, cover with a damp cloth, and let rise for 1-2 hours.

Divide dough and stretch into pizza bases. Add toppings and bake at 220C for 12-15 minutes.`,
    
    pasta: `Cook pasta in salted water until al dente.

While pasta cooks, fry pancetta until crispy.

Whisk eggs with grated parmesan and pepper.

Drain pasta, reserving some water. Mix with pancetta.

Remove from heat, add egg mixture. Toss quickly.

Serve immediately with extra parmesan.`,
    
    curry: `Cut chicken into bite-sized pieces.

Heat oil in a wok, fry curry paste until fragrant.

Add coconut milk and bring to simmer.

Add chicken and cook for 10 minutes.

Add bamboo shoots and Thai basil.

Serve with jasmine rice.`,

    cake: `Mix dry ingredients together.

Combine wet ingredients separately.

Mix together until smooth.

Bake at 180C for 30 minutes.

Let cool before serving.`,
};

// ========================================
// COMMUNITY POSTS (4 total)
// ========================================

export const mockCommunityPosts = [
    { 
        id: 1, 
        title: "Homemade Pizza Margherita", 
        description: "Just made my first pizza from scratch! The dough came out perfect.", 
        author: "John Doe",
        authorId: 'user-1',
        likes: 42, 
        comments: 3,
        saved: false,
        image: 'https://images.unsplash.com/photo-1574071318508-1cdbab80d002?w=800',
        caption: 'Just made my first pizza from scratch!',
        ingredients: mockIngredients.pizza,
        instructions: mockInstructions.pizza,
        utensils: ['oven', 'mixer'],
        cookTime: '90 min',
        difficulty: 'Medium',
    },
    { 
        id: 2, 
        title: "Grandma's Secret Pasta Recipe", 
        description: "Finally convinced grandma to share her famous carbonara recipe.", 
        author: "Jane Smith",
        authorId: 'user-2',
        likes: 67, 
        comments: 2,
        saved: false,
        image: 'https://images.unsplash.com/photo-1612874742237-6526221588e3?w=800',
        caption: 'Finally got the family recipe!',
        ingredients: mockIngredients.pasta,
        instructions: mockInstructions.pasta,
        utensils: ['stove', 'pot'],
        cookTime: '30 min',
        difficulty: 'Easy',
    },
    { 
        id: 3, 
        title: "Vegan Chocolate Cake", 
        description: "Who said vegan desserts can't be delicious? This cake is amazing!", 
        author: "Mike Johnson",
        authorId: 'user-3',
        likes: 35, 
        comments: 1,
        saved: false,
        image: 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=800',
        caption: 'Who said vegan cannot be delicious?',
        ingredients: mockIngredients.cake,
        instructions: mockInstructions.cake,
        utensils: ['oven', 'mixer', 'blender'],
        cookTime: '45 min',
        difficulty: 'Easy',
    },
    { 
        id: 4, 
        title: "Thai Green Curry Adventure", 
        description: "First time making green curry. The spice level is just right!", 
        author: "Sarah Lee",
        authorId: 'user-4',
        likes: 28, 
        comments: 2,
        saved: false,
        image: 'https://images.unsplash.com/photo-1455619452474-d2be8b1e70cd?w=800',
        caption: 'Spicy and delicious!',
        ingredients: mockIngredients.curry,
        instructions: mockInstructions.curry,
        utensils: ['stove', 'wok'],
        cookTime: '45 min',
        difficulty: 'Medium',
    },
];


export const mockComments = {
    1: [
        { id: 1, author: "Maria Garcia", initials: "MG", text: "This looks absolutely delicious! Can you share the dough recipe?", timestamp: "2h ago" },
        { id: 2, author: "Tom Wilson", initials: "TW", text: "Made this last night, my family loved it!", timestamp: "5h ago" },
        { id: 3, author: "Sarah Kim", initials: "SK", text: "The crust looks perfect!", timestamp: "1d ago" },
    ],
    2: [
        { id: 1, author: "Chef Marco", initials: "CM", text: "Traditional carbonara is the best! No cream, right?", timestamp: "1h ago" },
        { id: 2, author: "Lisa Brown", initials: "LB", text: "Your grandma is a treasure!", timestamp: "3h ago" },
    ],
    3: [
        { id: 1, author: "Healthy Eats", initials: "HE", text: "What did you use instead of eggs?", timestamp: "30m ago" },
    ],
    4: [
        { id: 1, author: "John Doe", initials: "JD", text: "Looks amazing! How spicy is it?", timestamp: "1h ago" },
        { id: 2, author: "Thai Food Fan", initials: "TF", text: "Love green curry! Great job!", timestamp: "4h ago" },
    ],
};

// MY RECIPES

export const mockMyRecipes = [];

// MY RECIPES COMMENTS (empty by default)
export const mockMyRecipesComments = {};



export const mockFavoriteRecipes = [];

// FOLLOWED USERS/CHEFS (for filtering)

export const mockFollowedAuthors = ['John Doe', 'Jane Smith'];
export const mockFollowedChefIds = ['chef-1', 'chef-2'];

// ========================================
// CHEF REACTIONS/POSTS (4 total for AllChefReviews)
// ========================================

// Posts that will be referenced in chef reactions (full data matching community posts)
export const chefReactionTargetPosts = {
    post1: { id: 'post-1', title: 'Homemade Pizza Margherita', image: 'https://images.unsplash.com/photo-1574071318508-1cdbab80d002?w=800', caption: 'Just made my first pizza from scratch!' },
    post2: { id: 'post-2', title: "Grandma's Secret Pasta Recipe", image: 'https://images.unsplash.com/photo-1612874742237-6526221588e3?w=800', caption: 'Finally got the family recipe!' },
    post3: { id: 'post-3', title: 'Vegan Chocolate Cake', image: 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=800', caption: 'Who said vegan cannot be delicious?' },
    post4: { id: 'post-4', title: 'Thai Green Curry Adventure', image: 'https://images.unsplash.com/photo-1455619452474-d2be8b1e70cd?w=800', caption: 'Spicy and delicious!' },
};

// Chef reactions comments (matching the counts in feedItems)
export const mockChefReactionComments = {
    'feed-1': [
        { id: 1, author: "John Doe", initials: "JD", text: "Great perspective, Chef!", timestamp: "2h ago" },
        { id: 2, author: "Alice Smith", initials: "AS", text: "I tried this technique and it worked perfectly! Thanks for sharing.", timestamp: "4h ago" },
        { id: 3, author: "Maria Brown", initials: "MB", text: "Would love to see more content like this!", timestamp: "6h ago" },
    ],
    'feed-2': [
        { id: 1, author: "Tom Wilson", initials: "TW", text: "Chef Maria always gives the best tips!", timestamp: "1h ago" },
        { id: 2, author: "Sarah Kim", initials: "SK", text: "I'm going to try this recipe next week.", timestamp: "3h ago" },
    ],
    'feed-3': [
        { id: 1, author: "Mike Johnson", initials: "MJ", text: "Thank you for the kind words, Chef!", timestamp: "30m ago" },
    ],
    'feed-4': [
        { id: 1, author: "Jane Smith", initials: "JS", text: "Appreciate the professional feedback!", timestamp: "45m ago" },
        { id: 2, author: "Cooking Fan", initials: "CF", text: "Chef Linda has great taste!", timestamp: "2h ago" },
    ],
};

export const mockChefFeedItems = [
    {
        id: 'feed-1',
        chef: mockChefs[0],
        contentType: 'reaction',
        likes: 45,
        comments: 3,
        liked: false,
        saved: false,
        reaction: {
            text: "This recipe is perfect for busy weeknights. Simple ingredients, amazing results! The crust technique you used is spot on.",
            targetPostId: chefReactionTargetPosts.post1.id,
            targetPost: chefReactionTargetPosts.post1,
            targetAuthor: mockUsers[0],
        },
        post: null,
        createdAt: '2026-01-11T10:30:00Z',
    },
    {
        id: 'feed-2',
        chef: mockChefs[1],
        contentType: 'reaction',
        likes: 38,
        comments: 2,
        liked: false,
        saved: false,
        reaction: {
            text: "My kids absolutely love this dish. It's become our weekly staple. The seasoning is perfectly balanced!",
            targetPostId: chefReactionTargetPosts.post2.id,
            targetPost: chefReactionTargetPosts.post2,
            targetAuthor: mockUsers[1],
        },
        post: null,
        createdAt: '2026-01-11T09:15:00Z',
    },
    {
        id: 'feed-3',
        chef: mockChefs[2],
        contentType: 'reaction',
        likes: 29,
        comments: 1,
        liked: false,
        saved: false,
        reaction: {
            text: "Impressive work on this vegan dessert! The texture looks perfect and I love the presentation.",
            targetPostId: chefReactionTargetPosts.post3.id,
            targetPost: chefReactionTargetPosts.post3,
            targetAuthor: mockUsers[2],
        },
        post: null,
        createdAt: '2026-01-10T14:20:00Z',
    },
    {
        id: 'feed-4',
        chef: mockChefs[3],
        contentType: 'reaction',
        likes: 22,
        comments: 2,
        liked: false,
        saved: false,
        reaction: {
            text: "The spice balance in this curry is exceptional. You've really captured the authentic Thai flavors here!",
            targetPostId: chefReactionTargetPosts.post4.id,
            targetPost: chefReactionTargetPosts.post4,
            targetAuthor: mockUsers[3],
        },
        post: null,
        createdAt: '2026-01-10T11:45:00Z',
    },
];

// ========================================
// FOLLOWERS/FOLLOWING (for profile)
// ========================================

// Include actual users who have posted so we can see their recipes
export const mockFollowersList = [
    { id: 'user-3', name: 'Mike Johnson', username: '@mikejohnson', avatar: null },
    { id: 'user-4', name: 'Sarah Lee', username: '@sarahlee', avatar: null },
    { id: 'user-extra-1', name: 'Emma Wilson', username: '@emmabakes', avatar: null },
];

export const mockFollowingList = [
    { id: 'user-1', name: 'John Doe', username: '@johndoe', avatar: null },
    { id: 'user-2', name: 'Jane Smith', username: '@janesmith', avatar: null },
];

// ========================================
// HELPER FUNCTIONS
// ========================================

// Get posts by author name
export const getPostsByAuthor = (authorName) => {
    return mockCommunityPosts.filter(post => post.author === authorName);
};

// Get posts by author ID
export const getPostsByAuthorId = (authorId) => {
    return mockCommunityPosts.filter(post => post.authorId === authorId);
};

// Get user by name
export const getUserByName = (name) => {
    return mockUsers.find(user => user.name === name) || null;
};

// Get user by ID (searches both users and chefs)
export const getUserById = (userId) => {
    const user = mockUsers.find(u => u.id === userId);
    if (user) return user;
    const chef = mockChefs.find(c => c.id === userId);
    return chef || null;
};

// Get followers for a specific user (mock - returns subset of list)
export const getFollowersForUser = (userId) => {
    // For demo, return random 2-4 followers
    const count = Math.floor(Math.random() * 3) + 2;
    return mockFollowersList.slice(0, count);
};

// Get following for a specific user (mock - returns subset of list)
export const getFollowingForUser = (userId) => {
    // For demo, return random 1-2 following
    const count = Math.floor(Math.random() * 2) + 1;
    return mockFollowingList.slice(0, count);
};
