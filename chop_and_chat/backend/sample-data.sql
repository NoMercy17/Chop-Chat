-- SAMPLE DATA FOR LOCAL DEVELOPMENT
-- Run AFTER init.sql to populate test data:
--   docker exec -it licenta_postgres psql -U licenta_user -d licenta_db < chop_and_chat/backend/sample-data.sql
--
-- 4 seeded accounts: 2 users (John Doe, Jane Smith), 2 chefs (Gordon Ramsay, Maria Garcia)
-- All accounts share password: "password"
-- (Well-known $2b$10 test vector — for local dev only, never copy to prod.)
--
-- Post content mirrors mockData.js so demo + live DB look identical.
-- Like counts are backed by actual post_likes rows — no inflated numbers.
-- Comment counts match the number of seeded comment rows.
-- Idempotent: every INSERT is guarded so re-running is safe.

-- ============================================================================
-- USERS  (2 regular + 2 chefs)
-- ============================================================================
INSERT INTO users (email, password, name, role, bio) VALUES
  ('john@test.com',   '$2b$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'John Doe',      'user', 'Food Enthusiast'),
  ('jane@test.com',   '$2b$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'Jane Smith',    'user', 'Food Enthusiast'),
  ('gordon@test.com', '$2b$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'Gordon Ramsay', 'chef', 'Professional Chef'),
  ('maria@test.com',  '$2b$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'Maria Garcia',  'chef', 'Professional Chef')
ON CONFLICT (email) DO NOTHING;

-- ============================================================================
-- POSTS  (Pizza and Pasta match mockCommunityPosts; Vegan Cake is the
--          chef-reaction target that mirrors chefReactionTargetPosts.post3)
-- ============================================================================
-- Pizza Margherita — John Doe (mirrors mockCommunityPosts[0])
INSERT INTO posts (user_id, title, description, image_url, ingredients, instructions, utensils, cook_time, difficulty)
SELECT u.id,
  'Homemade Pizza Margherita',
  'Just made my first pizza from scratch! The dough came out perfect.',
  'https://images.unsplash.com/photo-1574071318508-1cdbab80d002?w=800',
  '["2 cups all-purpose flour","1 tablespoon salt","500ml warm water","7g instant yeast","2 tablespoons olive oil","Fresh basil leaves","Mozzarella cheese","Tomato sauce"]'::jsonb,
  'Mix flour and salt in a large bowl.
Create a well in the center and add warm water and yeast.
Gradually incorporate flour into the liquid, stirring until combined.

Knead the dough on a floured surface for 10 minutes until smooth and elastic.
Place dough in a greased bowl, cover with a damp cloth, and let rise for 1-2 hours.

Divide dough and stretch into pizza bases. Add toppings and bake at 220C for 12-15 minutes.',
  '["oven","mixer"]'::jsonb,
  '90 min',
  'Medium'
FROM users u WHERE u.email = 'john@test.com'
  AND NOT EXISTS (SELECT 1 FROM posts p WHERE p.user_id = u.id AND p.title = 'Homemade Pizza Margherita');

-- Grandma's Pasta — Jane Smith (mirrors mockCommunityPosts[1])
INSERT INTO posts (user_id, title, description, image_url, ingredients, instructions, utensils, cook_time, difficulty)
SELECT u.id,
  'Grandma''s Secret Pasta Recipe',
  'Finally convinced grandma to share her famous carbonara recipe.',
  'https://images.unsplash.com/photo-1612874742237-6526221588e3?w=800',
  '["2 cups pasta","3 eggs","200g pancetta","100g parmesan","1 tsp black pepper"]'::jsonb,
  'Cook pasta in salted water until al dente.

While pasta cooks, fry pancetta until crispy.

Whisk eggs with grated parmesan and pepper.

Drain pasta, reserving some water. Mix with pancetta.

Remove from heat, add egg mixture. Toss quickly.

Serve immediately with extra parmesan.',
  '["stove","pot"]'::jsonb,
  '30 min',
  'Easy'
FROM users u WHERE u.email = 'jane@test.com'
  AND NOT EXISTS (SELECT 1 FROM posts p WHERE p.user_id = u.id AND p.title = 'Grandma''s Secret Pasta Recipe');

-- Vegan Chocolate Cake — John Doe (chef-reaction target, mirrors chefReactionTargetPosts.post3)
INSERT INTO posts (user_id, title, description, image_url, ingredients, instructions, utensils, cook_time, difficulty)
SELECT u.id,
  'Vegan Chocolate Cake',
  'Who said vegan can''t be delicious? This cake is moist, rich and completely plant-based.',
  'https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=800',
  '["2 cups flour","1 cup cocoa powder","1 cup sugar","1 cup almond milk","1/2 cup oil"]'::jsonb,
  'Mix dry ingredients together.

Combine wet ingredients separately.

Mix together until smooth.

Bake at 180C for 30 minutes.

Let cool before serving.',
  '["oven","mixing bowl"]'::jsonb,
  '45 min',
  'Easy'
FROM users u WHERE u.email = 'john@test.com'
  AND NOT EXISTS (SELECT 1 FROM posts p WHERE p.user_id = u.id AND p.title = 'Vegan Chocolate Cake');

-- ============================================================================
-- CHEF REACTIONS  (mirror mockChefFeedItems reaction text)
-- ============================================================================
-- Gordon Ramsay reviews Pizza (mirrors mockChefFeedItems[0])
INSERT INTO chef_reactions (chef_id, post_id, reaction_text)
SELECT c.id, p.id,
  'This recipe is perfect for busy weeknights. Simple ingredients, amazing results! The crust technique you used is spot on.'
FROM users c JOIN posts p ON p.title = 'Homemade Pizza Margherita'
WHERE c.email = 'gordon@test.com'
  AND NOT EXISTS (SELECT 1 FROM chef_reactions cr WHERE cr.chef_id = c.id AND cr.post_id = p.id);

-- Maria Garcia reviews Vegan Cake (mirrors mockChefFeedItems[1] / feed-3)
INSERT INTO chef_reactions (chef_id, post_id, reaction_text)
SELECT c.id, p.id,
  'Impressive work on this vegan dessert! The texture looks perfect and I love the presentation.'
FROM users c JOIN posts p ON p.title = 'Vegan Chocolate Cake'
WHERE c.email = 'maria@test.com'
  AND NOT EXISTS (SELECT 1 FROM chef_reactions cr WHERE cr.chef_id = c.id AND cr.post_id = p.id);

-- ============================================================================
-- COMMENTS  (counts must exactly match the like_count shown in the feed)
-- mockComments[1]: 1 comment on Pizza
-- mockComments[2]: 2 comments on Pasta
-- mockChefReactionComments['feed-1']: 2 comments on Gordon's review
-- mockChefReactionComments['feed-3']: 1 comment on Maria's review
-- ============================================================================

-- Pizza post — 1 comment by Maria (mirrors mockComments[1])
INSERT INTO comments (post_id, user_id, comment_text)
SELECT p.id, u.id, 'This looks absolutely delicious! Can you share the dough recipe?'
FROM posts p, users u
WHERE p.title = 'Homemade Pizza Margherita' AND u.email = 'maria@test.com'
  AND NOT EXISTS (
    SELECT 1 FROM comments c WHERE c.post_id = p.id AND c.user_id = u.id
      AND c.comment_text = 'This looks absolutely delicious! Can you share the dough recipe?'
  );

-- Pasta post — comment 1 by Gordon (mirrors mockComments[2] "Chef Marco")
INSERT INTO comments (post_id, user_id, comment_text)
SELECT p.id, u.id, 'Traditional carbonara is the best! No cream, right?'
FROM posts p, users u
WHERE p.title = 'Grandma''s Secret Pasta Recipe' AND u.email = 'gordon@test.com'
  AND NOT EXISTS (
    SELECT 1 FROM comments c WHERE c.post_id = p.id AND c.user_id = u.id
      AND c.comment_text = 'Traditional carbonara is the best! No cream, right?'
  );

-- Pasta post — comment 2 by John (mirrors mockComments[2] "Lisa Brown")
INSERT INTO comments (post_id, user_id, comment_text)
SELECT p.id, u.id, 'Your grandma is a treasure!'
FROM posts p, users u
WHERE p.title = 'Grandma''s Secret Pasta Recipe' AND u.email = 'john@test.com'
  AND NOT EXISTS (
    SELECT 1 FROM comments c WHERE c.post_id = p.id AND c.user_id = u.id
      AND c.comment_text = 'Your grandma is a treasure!'
  );

-- Gordon's review of Pizza — comment 1 by John (mirrors mockChefReactionComments['feed-1'][0])
INSERT INTO comments (chef_reaction_id, user_id, comment_text)
SELECT cr.id, u.id, 'Great perspective, Chef!'
FROM chef_reactions cr
JOIN posts p ON cr.post_id = p.id
JOIN users chef ON chef.id = cr.chef_id AND chef.email = 'gordon@test.com',
  users u
WHERE p.title = 'Homemade Pizza Margherita' AND u.email = 'john@test.com'
  AND NOT EXISTS (
    SELECT 1 FROM comments c WHERE c.chef_reaction_id = cr.id AND c.user_id = u.id
      AND c.comment_text = 'Great perspective, Chef!'
  );

-- Gordon's review of Pizza — comment 2 by Jane (mirrors mockChefReactionComments['feed-1'][1])
INSERT INTO comments (chef_reaction_id, user_id, comment_text)
SELECT cr.id, u.id, 'I tried this technique and it worked perfectly! Thanks for sharing.'
FROM chef_reactions cr
JOIN posts p ON cr.post_id = p.id
JOIN users chef ON chef.id = cr.chef_id AND chef.email = 'gordon@test.com',
  users u
WHERE p.title = 'Homemade Pizza Margherita' AND u.email = 'jane@test.com'
  AND NOT EXISTS (
    SELECT 1 FROM comments c WHERE c.chef_reaction_id = cr.id AND c.user_id = u.id
      AND c.comment_text = 'I tried this technique and it worked perfectly! Thanks for sharing.'
  );

-- Maria's review of Vegan Cake — comment 1 by Jane (mirrors mockChefReactionComments['feed-3'][0])
INSERT INTO comments (chef_reaction_id, user_id, comment_text)
SELECT cr.id, u.id, 'Thank you for the kind words, Chef!'
FROM chef_reactions cr
JOIN posts p ON cr.post_id = p.id
JOIN users chef ON chef.id = cr.chef_id AND chef.email = 'maria@test.com',
  users u
WHERE p.title = 'Vegan Chocolate Cake' AND u.email = 'jane@test.com'
  AND NOT EXISTS (
    SELECT 1 FROM comments c WHERE c.chef_reaction_id = cr.id AND c.user_id = u.id
      AND c.comment_text = 'Thank you for the kind words, Chef!'
  );

-- ============================================================================
-- LIKES  (honest counts — each row is a real account liking the content)
-- Pizza post: 3 likes (Jane, Gordon, Maria)
-- Pasta post: 3 likes (John, Gordon, Maria)
-- Gordon's review: 3 likes (John, Jane, Maria)
-- Maria's review:  2 likes (John, Jane)
-- ============================================================================

-- Pizza post likes
INSERT INTO post_likes (user_id, post_id)
SELECT u.id, p.id FROM users u, posts p
WHERE u.email = 'jane@test.com' AND p.title = 'Homemade Pizza Margherita'
ON CONFLICT (post_id, user_id) DO NOTHING;

INSERT INTO post_likes (user_id, post_id)
SELECT u.id, p.id FROM users u, posts p
WHERE u.email = 'gordon@test.com' AND p.title = 'Homemade Pizza Margherita'
ON CONFLICT (post_id, user_id) DO NOTHING;

INSERT INTO post_likes (user_id, post_id)
SELECT u.id, p.id FROM users u, posts p
WHERE u.email = 'maria@test.com' AND p.title = 'Homemade Pizza Margherita'
ON CONFLICT (post_id, user_id) DO NOTHING;

-- Pasta post likes
INSERT INTO post_likes (user_id, post_id)
SELECT u.id, p.id FROM users u, posts p
WHERE u.email = 'john@test.com' AND p.title = 'Grandma''s Secret Pasta Recipe'
ON CONFLICT (post_id, user_id) DO NOTHING;

INSERT INTO post_likes (user_id, post_id)
SELECT u.id, p.id FROM users u, posts p
WHERE u.email = 'gordon@test.com' AND p.title = 'Grandma''s Secret Pasta Recipe'
ON CONFLICT (post_id, user_id) DO NOTHING;

INSERT INTO post_likes (user_id, post_id)
SELECT u.id, p.id FROM users u, posts p
WHERE u.email = 'maria@test.com' AND p.title = 'Grandma''s Secret Pasta Recipe'
ON CONFLICT (post_id, user_id) DO NOTHING;

-- Gordon's review likes (chef_reaction_id)
INSERT INTO post_likes (user_id, chef_reaction_id)
SELECT u.id, cr.id
FROM users u, chef_reactions cr
JOIN posts p ON cr.post_id = p.id
JOIN users chef ON chef.id = cr.chef_id AND chef.email = 'gordon@test.com'
WHERE u.email = 'john@test.com' AND p.title = 'Homemade Pizza Margherita'
ON CONFLICT (chef_reaction_id, user_id) DO NOTHING;

INSERT INTO post_likes (user_id, chef_reaction_id)
SELECT u.id, cr.id
FROM users u, chef_reactions cr
JOIN posts p ON cr.post_id = p.id
JOIN users chef ON chef.id = cr.chef_id AND chef.email = 'gordon@test.com'
WHERE u.email = 'jane@test.com' AND p.title = 'Homemade Pizza Margherita'
ON CONFLICT (chef_reaction_id, user_id) DO NOTHING;

INSERT INTO post_likes (user_id, chef_reaction_id)
SELECT u.id, cr.id
FROM users u, chef_reactions cr
JOIN posts p ON cr.post_id = p.id
JOIN users chef ON chef.id = cr.chef_id AND chef.email = 'gordon@test.com'
WHERE u.email = 'maria@test.com' AND p.title = 'Homemade Pizza Margherita'
ON CONFLICT (chef_reaction_id, user_id) DO NOTHING;

-- Maria's review likes (chef_reaction_id)
INSERT INTO post_likes (user_id, chef_reaction_id)
SELECT u.id, cr.id
FROM users u, chef_reactions cr
JOIN posts p ON cr.post_id = p.id
JOIN users chef ON chef.id = cr.chef_id AND chef.email = 'maria@test.com'
WHERE u.email = 'john@test.com' AND p.title = 'Vegan Chocolate Cake'
ON CONFLICT (chef_reaction_id, user_id) DO NOTHING;

INSERT INTO post_likes (user_id, chef_reaction_id)
SELECT u.id, cr.id
FROM users u, chef_reactions cr
JOIN posts p ON cr.post_id = p.id
JOIN users chef ON chef.id = cr.chef_id AND chef.email = 'maria@test.com'
WHERE u.email = 'jane@test.com' AND p.title = 'Vegan Chocolate Cake'
ON CONFLICT (chef_reaction_id, user_id) DO NOTHING;

-- ============================================================================
-- FOLLOWS  (so follow/unfollow is testable between all 4 accounts)
-- ============================================================================
INSERT INTO follows (follower_id, following_id)
SELECT f.id, t.id FROM users f, users t
WHERE f.email = 'john@test.com' AND t.email = 'gordon@test.com'
ON CONFLICT (follower_id, following_id) DO NOTHING;

INSERT INTO follows (follower_id, following_id)
SELECT f.id, t.id FROM users f, users t
WHERE f.email = 'jane@test.com' AND t.email = 'maria@test.com'
ON CONFLICT (follower_id, following_id) DO NOTHING;

INSERT INTO follows (follower_id, following_id)
SELECT f.id, t.id FROM users f, users t
WHERE f.email = 'gordon@test.com' AND t.email = 'john@test.com'
ON CONFLICT (follower_id, following_id) DO NOTHING;

INSERT INTO follows (follower_id, following_id)
SELECT f.id, t.id FROM users f, users t
WHERE f.email = 'maria@test.com' AND t.email = 'jane@test.com'
ON CONFLICT (follower_id, following_id) DO NOTHING;

-- ============================================================================
-- CHEF REVIEW REQUEST  (Jane requests all chefs review her Pasta)
-- Mirrors the runtime behavior of POST /chef/review-request so chefs
-- receive a visible notification in the Notifications tab.
-- ============================================================================
INSERT INTO chef_review_requests (requester_id, post_id, context, chef_filter, status)
SELECT u.id, p.id, 'Does the technique feel authentic? Any tips on the egg ratio?', 'All Chefs', 'pending'
FROM users u JOIN posts p ON p.user_id = u.id AND p.title = 'Grandma''s Secret Pasta Recipe'
WHERE u.email = 'jane@test.com'
  AND NOT EXISTS (
    SELECT 1 FROM chef_review_requests crr
    WHERE crr.requester_id = u.id AND crr.post_id = p.id AND crr.status = 'pending'
  );

-- Fan out the review request notification to every chef (mirrors routes/chef.js)
INSERT INTO notifications (user_id, type, title, subtitle, data)
SELECT
  c.id,
  'chef_review_request',
  'Review Request',
  'Jane Smith wants your feedback on their Grandma''s Secret Pasta Recipe',
  jsonb_build_object(
    'requestId',     crr.id,
    'postId',        crr.post_id,
    'requesterName', 'Jane Smith',
    'postTitle',     'Grandma''s Secret Pasta Recipe'
  )
FROM users c
JOIN chef_review_requests crr
  ON crr.post_id = (
       SELECT p.id FROM posts p JOIN users u ON p.user_id = u.id
       WHERE u.email = 'jane@test.com' AND p.title = 'Grandma''s Secret Pasta Recipe'
     )
 AND crr.status = 'pending'
WHERE c.role = 'chef'
  AND NOT EXISTS (
    SELECT 1 FROM notifications n
    WHERE n.user_id = c.id
      AND n.type = 'chef_review_request'
      AND (n.data->>'requestId')::int = crr.id
  );

-- ============================================================================
-- NOTIFICATION EXAMPLES  (one per type, for both account roles)
-- Type strings match NOTIFICATION_TYPES in context/NotificationsContext.js.
-- chef_review_request is already seeded above by the fanout block.
-- ============================================================================

-- new_follower → John and Gordon (Jane "follows" them in this demo)
INSERT INTO notifications (user_id, type, title, subtitle, data, is_read)
SELECT u.id, 'new_follower', 'New Follower',
       'Jane Smith started following you',
       jsonb_build_object(
         'followerId',   (SELECT id FROM users WHERE email = 'jane@test.com'),
         'followerName', 'Jane Smith'
       ),
       false
FROM users u
WHERE u.email IN ('john@test.com', 'gordon@test.com')
  AND NOT EXISTS (
    SELECT 1 FROM notifications n WHERE n.user_id = u.id AND n.type = 'new_follower'
  );

-- post_likes → notify each post author
INSERT INTO notifications (user_id, type, title, subtitle, data, is_read)
SELECT p.user_id, 'post_likes', 'Post Liked',
       'Gordon Ramsay liked your ' || p.title,
       jsonb_build_object(
         'postId',    p.id,
         'postTitle', p.title,
         'likerId',   (SELECT id FROM users WHERE email = 'gordon@test.com'),
         'likerName', 'Gordon Ramsay'
       ),
       false
FROM posts p
WHERE p.title IN ('Homemade Pizza Margherita', 'Grandma''s Secret Pasta Recipe')
  AND NOT EXISTS (
    SELECT 1 FROM notifications n WHERE n.user_id = p.user_id AND n.type = 'post_likes'
  );

-- chef_review_received → notify John (his posts were reviewed by both chefs)
INSERT INTO notifications (user_id, type, title, subtitle, data, is_read)
SELECT p.user_id, 'chef_review_received', 'Chef Review',
       chef.name || ' reviewed your ' || p.title,
       jsonb_build_object(
         'postId',         p.id,
         'postTitle',      p.title,
         'chefReactionId', cr.id,
         'chefId',         chef.id,
         'chefName',       chef.name
       ),
       false
FROM chef_reactions cr
JOIN posts p    ON p.id    = cr.post_id
JOIN users chef ON chef.id = cr.chef_id
WHERE NOT EXISTS (
  SELECT 1 FROM notifications n
  WHERE n.user_id = p.user_id
    AND n.type = 'chef_review_received'
    AND (n.data->>'chefReactionId')::int = cr.id
);

-- comment_on_post → notify post authors about seeded comments
INSERT INTO notifications (user_id, type, title, subtitle, data, is_read)
SELECT p.user_id, 'comment_on_post', 'New Comment',
       commenter.name || ' commented on your ' || p.title,
       jsonb_build_object(
         'postId',        p.id,
         'postTitle',     p.title,
         'commentId',     c.id,
         'commenterId',   commenter.id,
         'commenterName', commenter.name,
         'commentText',   c.comment_text
       ),
       false
FROM comments c
JOIN posts p         ON p.id         = c.post_id
JOIN users commenter ON commenter.id = c.user_id
WHERE c.post_id IS NOT NULL
  AND p.user_id <> c.user_id
  AND NOT EXISTS (
    SELECT 1 FROM notifications n
    WHERE n.user_id = p.user_id
      AND n.type = 'comment_on_post'
      AND (n.data->>'commentId')::int = c.id
  );

-- ============================================================================
-- VERIFICATION QUERIES (uncomment to inspect after seeding)
-- ============================================================================
-- SELECT email, role, name FROM users ORDER BY id;
-- SELECT p.title, u.email as author,
--        (SELECT COUNT(*) FROM post_likes pl WHERE pl.post_id = p.id) as likes,
--        (SELECT COUNT(*) FROM comments c WHERE c.post_id = p.id) as comments
--   FROM posts p JOIN users u ON u.id = p.user_id WHERE p.is_global = false ORDER BY p.id;
-- SELECT cr.id, chef.name as chef, p.title as post,
--        (SELECT COUNT(*) FROM post_likes pl WHERE pl.chef_reaction_id = cr.id) as likes,
--        (SELECT COUNT(*) FROM comments c WHERE c.chef_reaction_id = cr.id) as comments
--   FROM chef_reactions cr JOIN users chef ON chef.id = cr.chef_id JOIN posts p ON p.id = cr.post_id;
