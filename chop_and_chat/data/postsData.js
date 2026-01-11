// All community posts data - single source of truth
export const allPosts = [
    { id: 1, title: "Homemade Pizza Margherita", description: "Just made my first pizza from scratch! The dough came out perfect.", author: "John Doe", likes: 42, comments: 7, saved: false },
    { id: 2, title: "Grandma's Secret Pasta Recipe", description: "Finally convinced grandma to share her famous carbonara recipe.", author: "Jane Smith", likes: 127, comments: 2, saved: false },
    { id: 3, title: "Vegan Chocolate Cake", description: "Who said vegan desserts can't be delicious? This cake is amazing!", author: "Mike Johnson", likes: 89, comments: 1, saved: false },
    { id: 4, title: "Sunday Brunch Special", description: "Eggs benedict with hollandaise sauce - turned out better than expected.", author: "Sarah Lee", likes: 56, comments: 0, saved: false },
    { id: 5, title: "Thai Curry Adventure", description: "First time making green curry. The spice level is just right!", author: "Alex Brown", likes: 73, comments: 0, saved: false },
    { id: 6, title: "Sourdough Bread Success", description: "After days of feeding the starter, the crust and crumb finally nailed it.", author: "Emily Carter", likes: 94, comments: 0, saved: false },
    { id: 7, title: "Street-Style Tacos at Home", description: "Tried recreating authentic al pastor tacos with pineapple and cilantro.", author: "Carlos Rivera", likes: 118, comments: 0, saved: false },
    { id: 8, title: "Quick Weeknight Stir Fry", description: "15-minute veggie stir fry with garlic soy sauce. Simple and satisfying.", author: "Lina Wong", likes: 61, comments: 0, saved: false },
    { id: 9, title: "Classic French Omelette", description: "Focused on technique today—soft, buttery, and perfectly folded.", author: "Pierre Martin", likes: 85, comments: 0, saved: false },
    { id: 10, title: "Homemade Ice Cream Experiment", description: "No-churn vanilla ice cream with a salted caramel swirl.", author: "Olivia Green", likes: 102, comments: 0, saved: false },
    { id: 11, title: "Korean BBQ Night", description: "Marinated bulgogi with all the banchan sides. Family loved it!", author: "Kim Soo", likes: 145, comments: 0, saved: false },
    { id: 12, title: "Fresh Pasta from Scratch", description: "Hand-rolled fettuccine with a simple garlic butter sauce.", author: "Marco Rossi", likes: 88, comments: 0, saved: false },
];

// Comments data - in a real app, this would come from your backend
export const commentsData = {
    1: [
        { id: 1, author: "Maria Garcia", initials: "MG", text: "This looks absolutely delicious! Can you share the dough recipe?", timestamp: "2h ago" },
        { id: 2, author: "Tom Wilson", initials: "TW", text: "Made this last night, my family loved it!", timestamp: "5h ago" },
        { id: 3, author: "Sarah Kim", initials: "SK", text: "The crust looks perfect 👨‍🍳", timestamp: "1d ago" },
        { id: 4, author: "Sarah Kim", initials: "SK", text: "The crust looks perfect 👨‍🍳", timestamp: "1d ago" },
        { id: 5, author: "Sarah Kim", initials: "SK", text: "The crust looks perfect 👨‍🍳", timestamp: "1d ago" },
        { id: 6, author: "Sarah Kim", initials: "SK", text: "The crust looks perfect 👨‍🍳", timestamp: "1d ago" },
        { id: 7, author: "Sarah Kim", initials: "SK", text: "The crust looks perfect 👨‍🍳", timestamp: "1d ago" },
    ],
    2: [
        { id: 1, author: "Chef Marco", initials: "CM", text: "Traditional carbonara is the best! No cream, right?", timestamp: "1h ago" },
        { id: 2, author: "Lisa Brown", initials: "LB", text: "Your grandma is a treasure! 💕", timestamp: "3h ago" },
    ],
    3: [
        { id: 1, author: "Healthy Eats", initials: "HE", text: "What did you use instead of eggs?", timestamp: "30m ago" },
    ],
};
