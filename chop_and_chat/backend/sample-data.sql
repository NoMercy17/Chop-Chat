-- SAMPLE DATA FOR LOCAL DEVELOPMENT
-- Run AFTER init.sql to populate test data:
--   psql -h localhost -p 5432 -U licenta_user -d licenta_db < chop_and_chat/backend/sample-data.sql
--
-- All seeded users share the bcrypt hash below, which corresponds to password: "password"
-- (Well-known $2b$10 test vector — for local dev only, never copy to prod.)
--
-- Idempotent: every INSERT uses ON CONFLICT DO NOTHING and email-keyed lookups,
-- so re-running will not create duplicates and is safe after schema changes.

-- ============================================================================
-- USERS  (3 regular + 2 chefs)
-- ============================================================================
-- Bios are derived from role at signup and are immutable: regular users get
-- "Food Enthusiast", chefs get "Professional Chef". No personal bios are seeded.
INSERT INTO users (email, password, name, role, bio) VALUES
  ('user@test.com',   '$2b$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'Test User',    'user', 'Food Enthusiast'),
  ('john@test.com',   '$2b$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'John Doe',     'user', 'Food Enthusiast'),
  ('jane@test.com',   '$2b$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'Jane Smith',   'user', 'Food Enthusiast'),
  ('chef@test.com',   '$2b$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'Gordon Test',  'chef', 'Professional Chef'),
  ('maria@test.com',  '$2b$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'Maria Garcia', 'chef', 'Professional Chef')
ON CONFLICT (email) DO NOTHING;

-- ============================================================================
-- POSTS  (1-2 per regular user)
-- Email-keyed subqueries so IDs work regardless of insertion order.
-- ============================================================================
INSERT INTO posts (user_id, title, description, image_url, ingredients, instructions, utensils, cook_time, difficulty)
SELECT u.id,
  'Classic Margherita Pizza',
  'Authentic Italian pizza with fresh basil and homemade dough.',
  'https://images.unsplash.com/photo-1574071318508-1cdbab80d002?w=800',
  '["500g pizza flour","325ml water","10g salt","7g yeast","mozzarella","tomato sauce","fresh basil"]'::jsonb,
  'Mix flour, water, salt, yeast. Knead 10 min. Rise 2h. Shape, sauce, cheese. Bake 250C for 12 min.',
  '["oven","mixing bowl","pizza stone"]'::jsonb,
  '3 hours (incl. rising)',
  'Medium'
FROM users u WHERE u.email = 'user@test.com'
  AND NOT EXISTS (SELECT 1 FROM posts p WHERE p.user_id = u.id AND p.title = 'Classic Margherita Pizza');

INSERT INTO posts (user_id, title, description, image_url, ingredients, instructions, utensils, cook_time, difficulty)
SELECT u.id,
  'Weeknight Sourdough',
  'Easy fridge-rise sourdough loaf — minimal kneading.',
  'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=800',
  '["400g bread flour","100g sourdough starter","8g salt","280ml water"]'::jsonb,
  'Mix, autolyse 1h. Stretch and fold every 30 min for 2h. Cold proof overnight. Bake 230C in dutch oven.',
  '["dutch oven","banneton","scale"]'::jsonb,
  '24 hours (mostly waiting)',
  'Medium'
FROM users u WHERE u.email = 'john@test.com'
  AND NOT EXISTS (SELECT 1 FROM posts p WHERE p.user_id = u.id AND p.title = 'Weeknight Sourdough');

INSERT INTO posts (user_id, title, description, image_url, ingredients, instructions, utensils, cook_time, difficulty)
SELECT u.id,
  'Carbonara — Grandma''s Way',
  'Pure egg, pancetta, pecorino. No cream, ever.',
  'https://images.unsplash.com/photo-1612874742237-6526221588e3?w=800',
  '["200g spaghetti","100g pancetta","2 egg yolks","1 whole egg","60g pecorino","black pepper"]'::jsonb,
  'Crisp pancetta. Cook pasta. Whisk eggs+pecorino+pepper. Off heat: combine, loosen with pasta water.',
  '["pan","pot","whisk"]'::jsonb,
  '20 min',
  'Easy'
FROM users u WHERE u.email = 'jane@test.com'
  AND NOT EXISTS (SELECT 1 FROM posts p WHERE p.user_id = u.id AND p.title = 'Carbonara — Grandma''s Way');

-- ============================================================================
-- CHEF REACTIONS  (each chef reacts to one user post)
-- Guarded against UNIQUE(chef_id, post_id) by NOT EXISTS check.
-- ============================================================================
INSERT INTO chef_reactions (chef_id, post_id, reaction_text)
SELECT c.id, p.id,
  'Beautiful crumb structure on this margherita. Try a higher hydration (70%) for an even airier crust next time.'
FROM users c JOIN posts p ON p.title = 'Classic Margherita Pizza'
WHERE c.email = 'chef@test.com'
  AND NOT EXISTS (SELECT 1 FROM chef_reactions cr WHERE cr.chef_id = c.id AND cr.post_id = p.id);

INSERT INTO chef_reactions (chef_id, post_id, reaction_text)
SELECT c.id, p.id,
  'Textbook carbonara. The off-heat technique is what separates this from a scrambled-egg disaster. Bravo.'
FROM users c JOIN posts p ON p.title = 'Carbonara — Grandma''s Way'
WHERE c.email = 'maria@test.com'
  AND NOT EXISTS (SELECT 1 FROM chef_reactions cr WHERE cr.chef_id = c.id AND cr.post_id = p.id);

-- ============================================================================
-- ENGAGEMENT  (likes, follow, one comment) — exercises remaining tables
-- ============================================================================
-- John likes Jane's carbonara
INSERT INTO post_likes (user_id, post_id)
SELECT u.id, p.id
FROM users u, posts p
WHERE u.email = 'john@test.com' AND p.title = 'Carbonara — Grandma''s Way'
ON CONFLICT (post_id, user_id) DO NOTHING;

-- Test user likes Maria's reaction (chef_reaction like)
INSERT INTO post_likes (user_id, chef_reaction_id)
SELECT u.id, cr.id
FROM users u, chef_reactions cr JOIN posts p ON cr.post_id = p.id
WHERE u.email = 'user@test.com' AND p.title = 'Carbonara — Grandma''s Way'
ON CONFLICT (chef_reaction_id, user_id) DO NOTHING;

-- Test user follows the chef
INSERT INTO follows (follower_id, following_id)
SELECT f.id, c.id
FROM users f, users c
WHERE f.email = 'user@test.com' AND c.email = 'chef@test.com'
ON CONFLICT (follower_id, following_id) DO NOTHING;

-- One comment on the pizza post
INSERT INTO comments (post_id, user_id, comment_text)
SELECT p.id, u.id, 'Looks unreal! What flour brand?'
FROM posts p, users u
WHERE p.title = 'Classic Margherita Pizza' AND u.email = 'jane@test.com'
  AND NOT EXISTS (
    SELECT 1 FROM comments c
    WHERE c.post_id = p.id AND c.user_id = u.id AND c.comment_text = 'Looks unreal! What flour brand?'
  );

-- ============================================================================
-- CHEF REVIEW REQUEST + MATCHING NOTIFICATION
-- Seeds a pending review request from Test User on the Margherita pizza,
-- and fans out a 'chef_review_request' notification to every chef account
-- (matching the runtime behavior in routes/chef.js).
-- ============================================================================
INSERT INTO chef_review_requests (requester_id, post_id, context, chef_filter, status)
SELECT u.id, p.id, 'Wondering if my crust is too thick?', 'All Chefs', 'pending'
FROM users u JOIN posts p ON p.user_id = u.id AND p.title = 'Classic Margherita Pizza'
WHERE u.email = 'user@test.com'
  AND NOT EXISTS (
    SELECT 1 FROM chef_review_requests crr
    WHERE crr.requester_id = u.id AND crr.post_id = p.id AND crr.status = 'pending'
  );

-- One notification per chef, with a stable data payload that mirrors the live route.
INSERT INTO notifications (user_id, type, title, subtitle, data)
SELECT
  c.id,
  'chef_review_request',
  'Review Request',
  'Test User wants your feedback on their Classic Margherita Pizza',
  jsonb_build_object(
    'requestId', crr.id,
    'postId', crr.post_id,
    'requesterName', 'Test User',
    'postTitle', 'Classic Margherita Pizza'
  )
FROM users c
JOIN chef_review_requests crr
  ON crr.post_id = (SELECT p.id FROM posts p JOIN users u ON p.user_id = u.id
                    WHERE u.email = 'user@test.com' AND p.title = 'Classic Margherita Pizza')
 AND crr.status = 'pending'
WHERE c.role = 'chef'
  AND NOT EXISTS (
    SELECT 1 FROM notifications n
    WHERE n.user_id = c.id
      AND n.type = 'chef_review_request'
      AND (n.data->>'requestId')::int = crr.id
  );

-- ============================================================================
-- NOTIFICATION EXAMPLES (one per type, per recipient role)
-- Regular users receive: new_follower, post_likes, chef_review_received, comment_on_post.
-- Chefs receive:         new_follower, post_likes, chef_review_request, comment_on_post.
-- Type strings match NOTIFICATION_TYPES in context/NotificationsContext.js so the
-- frontend renders the right icon. chef_review_request is already seeded above
-- by the review-request fanout block, so it is not duplicated here.
-- Each insert is guarded by NOT EXISTS on (user_id, type) to stay idempotent.
-- ============================================================================

-- new_follower → every user account (jane "follows" them)
INSERT INTO notifications (user_id, type, title, subtitle, data, is_read)
SELECT u.id, 'new_follower', 'New Follower',
       'Jane Smith started following you',
       jsonb_build_object(
         'followerId',   (SELECT id FROM users WHERE email = 'jane@test.com'),
         'followerName', 'Jane Smith'
       ),
       false
FROM users u
WHERE u.email IN ('user@test.com', 'john@test.com', 'chef@test.com', 'maria@test.com')
  AND NOT EXISTS (
    SELECT 1 FROM notifications n WHERE n.user_id = u.id AND n.type = 'new_follower'
  );

-- post_likes → notify each post author that someone liked their post.
-- Author of the liked post is the recipient; data carries postId for navigation.
INSERT INTO notifications (user_id, type, title, subtitle, data, is_read)
SELECT p.user_id, 'post_likes', 'Post Liked',
       'John Doe liked your ' || p.title,
       jsonb_build_object(
         'postId',    p.id,
         'postTitle', p.title,
         'likerId',   (SELECT id FROM users WHERE email = 'john@test.com'),
         'likerName', 'John Doe'
       ),
       false
FROM posts p
JOIN users author ON author.id = p.user_id
WHERE author.email IN ('user@test.com', 'jane@test.com')
  AND NOT EXISTS (
    SELECT 1 FROM notifications n WHERE n.user_id = p.user_id AND n.type = 'post_likes'
  );

-- chef_review_received → recipient is the post author whose dish a chef reacted to.
INSERT INTO notifications (user_id, type, title, subtitle, data, is_read)
SELECT p.user_id, 'chef_review_received', 'Chef Review',
       chef.name || ' reviewed your ' || p.title,
       jsonb_build_object(
         'postId',          p.id,
         'postTitle',       p.title,
         'chefReactionId',  cr.id,
         'chefId',          chef.id,
         'chefName',        chef.name
       ),
       false
FROM chef_reactions cr
JOIN posts p   ON p.id   = cr.post_id
JOIN users chef ON chef.id = cr.chef_id
WHERE NOT EXISTS (
  SELECT 1 FROM notifications n
  WHERE n.user_id = p.user_id
    AND n.type = 'chef_review_received'
    AND (n.data->>'chefReactionId')::int = cr.id
);

-- comment_on_post → notify each post author that someone commented (uses the
-- existing seeded comment on the Margherita pizza).
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
JOIN posts p        ON p.id        = c.post_id
JOIN users commenter ON commenter.id = c.user_id
WHERE c.post_id IS NOT NULL
  AND p.user_id <> c.user_id
  AND NOT EXISTS (
    SELECT 1 FROM notifications n
    WHERE n.user_id = p.user_id
      AND n.type = 'comment_on_post'
      AND (n.data->>'commentId')::int = c.id
  );

-- Synthetic comment_on_post for chef accounts (no real comment exists on a chef
-- post yet, so we seed a display-only payload so QA can preview the UI).
INSERT INTO notifications (user_id, type, title, subtitle, data, is_read)
SELECT u.id, 'comment_on_post', 'New Comment',
       'John Doe commented on your post',
       jsonb_build_object(
         'commenterId',   (SELECT id FROM users WHERE email = 'john@test.com'),
         'commenterName', 'John Doe',
         'commentText',   'This technique is gold — thanks for sharing!'
       ),
       false
FROM users u
WHERE u.email IN ('chef@test.com', 'maria@test.com')
  AND NOT EXISTS (
    SELECT 1 FROM notifications n WHERE n.user_id = u.id AND n.type = 'comment_on_post'
  );

-- ============================================================================
-- VERIFICATION QUERIES (uncomment to inspect after seeding)
-- ============================================================================
-- SELECT email, role, name FROM users ORDER BY id;
-- SELECT title, (SELECT email FROM users WHERE id = posts.user_id) FROM posts;
-- SELECT cr.id, (SELECT name FROM users WHERE id = cr.chef_id) AS chef, p.title
--   FROM chef_reactions cr JOIN posts p ON cr.post_id = p.id;
