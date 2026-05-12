-- Core user authentication and profile data
-- - role: Distinguishes between 'user' and 'chef' accounts for authorization
-- - profile_photo: Stores Cloudinary URL for user avatars
-- - bio: User's personal description
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL,
  name TEXT,
  role TEXT DEFAULT 'user' CHECK (role IN ('user', 'chef')),
  profile_photo TEXT,
  bio TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Add role column if upgrading existing database
ALTER TABLE users ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'user' CHECK (role IN ('user', 'chef'));
ALTER TABLE users ADD COLUMN IF NOT EXISTS profile_photo TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS bio TEXT;


-- Stores user-created recipe posts
-- - user_id: Links to the creator (can be regular user or chef)
-- - ingredients: JSON array for flexible ingredient lists
-- - instructions: TEXT for step-by-step cooking instructions
-- - utensils: JSON array for required kitchen tools
-- - cook_time: String like "30 min" or "2 hours" for display flexibility
-- - difficulty: Enum for filtering (Easy/Medium/Hard)
-- - ON DELETE CASCADE: If user deleted, remove their posts too
CREATE TABLE IF NOT EXISTS posts (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  image_url TEXT,
  ingredients JSONB DEFAULT '[]',
  instructions TEXT,
  utensils JSONB DEFAULT '[]',
  cook_time TEXT,
  difficulty TEXT CHECK (difficulty IN ('Easy', 'Medium', 'Hard')),
  is_global BOOLEAN DEFAULT false,
  is_seeded BOOLEAN NOT NULL DEFAULT FALSE,
  chef_review_requested BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Add is_global column if upgrading existing database
ALTER TABLE posts ADD COLUMN IF NOT EXISTS is_global BOOLEAN DEFAULT false;
ALTER TABLE posts ADD COLUMN IF NOT EXISTS is_seeded BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE posts ADD COLUMN IF NOT EXISTS chef_review_requested BOOLEAN NOT NULL DEFAULT FALSE;

-- Index for faster queries on user's posts
CREATE INDEX IF NOT EXISTS idx_posts_user_id ON posts(user_id);
-- Index for filtering by difficulty
CREATE INDEX IF NOT EXISTS idx_posts_difficulty ON posts(difficulty);
-- Index for sorting by creation date
CREATE INDEX IF NOT EXISTS idx_posts_created_at ON posts(created_at DESC);

-- Chefs can react to community posts (core app feature)
-- - chef_id: Must be a user with role='chef' (enforced in app logic)
-- - post_id: The community post being reacted to
-- - reaction_text: Chef's review/comment on the post
-- - UNIQUE constraint: One chef can only react once per post
CREATE TABLE IF NOT EXISTS chef_reactions (
  id SERIAL PRIMARY KEY,
  chef_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  post_id INTEGER NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  reaction_text TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(chef_id, post_id)
);

-- Index for fetching all reactions by a chef
CREATE INDEX IF NOT EXISTS idx_chef_reactions_chef_id ON chef_reactions(chef_id);
-- Index for fetching reactions on a specific post
CREATE INDEX IF NOT EXISTS idx_chef_reactions_post_id ON chef_reactions(post_id);


-- Users can comment on posts and chef reactions
-- - post_id: Can be NULL if commenting on chef_reaction
-- - chef_reaction_id: Can be NULL if commenting on post
-- - At least one must be set (enforced in app logic)
CREATE TABLE IF NOT EXISTS comments (
  id SERIAL PRIMARY KEY,
  post_id INTEGER REFERENCES posts(id) ON DELETE CASCADE,
  chef_reaction_id INTEGER REFERENCES chef_reactions(id) ON DELETE CASCADE,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  comment_text TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  CHECK (post_id IS NOT NULL OR chef_reaction_id IS NOT NULL)
);

-- Index for fetching comments on a post
CREATE INDEX IF NOT EXISTS idx_comments_post_id ON comments(post_id);
-- Index for fetching comments on a chef reaction
CREATE INDEX IF NOT EXISTS idx_comments_chef_reaction_id ON comments(chef_reaction_id);


--Track who liked which posts
-- - UNIQUE constraint: User can only like a post once
-- - Used to calculate like counts and check if user liked
CREATE TABLE IF NOT EXISTS post_likes (
  id SERIAL PRIMARY KEY,
  post_id INTEGER REFERENCES posts(id) ON DELETE CASCADE,
  chef_reaction_id INTEGER REFERENCES chef_reactions(id) ON DELETE CASCADE,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(post_id, user_id),
  UNIQUE(chef_reaction_id, user_id),
  CHECK (post_id IS NOT NULL OR chef_reaction_id IS NOT NULL)
);

-- Index for counting likes on a post
CREATE INDEX IF NOT EXISTS idx_post_likes_post_id ON post_likes(post_id);
-- Index for counting likes on chef reaction
CREATE INDEX IF NOT EXISTS idx_post_likes_chef_reaction_id ON post_likes(chef_reaction_id);
-- Index for user's liked posts
CREATE INDEX IF NOT EXISTS idx_post_likes_user_id ON post_likes(user_id);


-- Users can save posts to their favorites for later
-- - UNIQUE constraint: Can't save same post twice
-- - Separate from likes (user can like but not save, or vice versa)
CREATE TABLE IF NOT EXISTS saved_posts (
  id SERIAL PRIMARY KEY,
  post_id INTEGER NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(post_id, user_id)
);

-- Index for user's saved posts
CREATE INDEX IF NOT EXISTS idx_saved_posts_user_id ON saved_posts(user_id);


-- Users can follow other users (especially chefs)
-- - follower_id: The user who is following
-- - following_id: The user being followed
-- - UNIQUE constraint: Can't follow same user twice
-- - CHECK constraint: Can't follow yourself
CREATE TABLE IF NOT EXISTS follows (
  id SERIAL PRIMARY KEY,
  follower_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  following_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(follower_id, following_id),
  CHECK (follower_id != following_id)
);

-- Index for getting who a user follows
CREATE INDEX IF NOT EXISTS idx_follows_follower_id ON follows(follower_id);
-- Index for getting a user's followers
CREATE INDEX IF NOT EXISTS idx_follows_following_id ON follows(following_id);


-- Users can favorite specific recipes (posts) for quick access
-- - Similar to saved_posts but conceptually different
-- - saved_posts = "read later", favorite_recipes = "my go-to recipes"
-- - In MVP, we can use saved_posts for both, but keeping separate for clarity
CREATE TABLE IF NOT EXISTS favorite_recipes (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  recipe_id INTEGER NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, recipe_id)
);

-- Index for user's favorite recipes
CREATE INDEX IF NOT EXISTS idx_favorite_recipes_user_id ON favorite_recipes(user_id);


-- Review requests from users to chefs
-- - requester_id: The user asking for feedback
-- - post_id: The dish/recipe being reviewed
-- - context: Extra details from user (ingredients, steps)
-- - chef_filter: 'Following' or 'All Chefs' (logical filter for dispatch)
-- - status: 'pending', 'claimed', 'completed'
-- - claimed_by: ID of the chef who picked up the request
CREATE TABLE IF NOT EXISTS chef_review_requests (
  id SERIAL PRIMARY KEY,
  requester_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  post_id INTEGER NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  context TEXT,
  chef_filter TEXT DEFAULT 'All Chefs',
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'claimed', 'completed')),
  claimed_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_chef_review_requests_status ON chef_review_requests(status);
CREATE INDEX IF NOT EXISTS idx_chef_review_requests_requester ON chef_review_requests(requester_id);


-- Notifications for users and chefs
-- - user_id: Recipient
-- - type: 'new_follower', 'post_likes', 'chef_review_received', 'chef_review_request'
-- - title/subtitle: Display text
-- - data: JSON payload for navigation (postId, requestId, etc.)
-- - is_read: Read status
CREATE TABLE IF NOT EXISTS notifications (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  subtitle TEXT,
  data JSONB DEFAULT '{}',
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON notifications(user_id, is_read);


-- FUTURE   Update updated_at on posts
-- Automatically track when posts are modified
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_posts_updated_at ON posts;
CREATE TRIGGER update_posts_updated_at 
BEFORE UPDATE ON posts 
FOR EACH ROW 
EXECUTE FUNCTION update_updated_at_column();


-- HELPFUL VIEWS

-- View: Posts with engagement metrics
CREATE OR REPLACE VIEW post_feed AS
SELECT 
  p.*,
  u.name as author_name,
  u.role as author_role,
  u.profile_photo as author_photo,
  COUNT(DISTINCT pl.id) as like_count,
  COUNT(DISTINCT c.id) as comment_count,
  COUNT(DISTINCT cr.id) as chef_reaction_count
FROM posts p
LEFT JOIN users u ON p.user_id = u.id
LEFT JOIN post_likes pl ON p.id = pl.post_id
LEFT JOIN comments c ON p.id = c.post_id
LEFT JOIN chef_reactions cr ON p.id = cr.post_id
GROUP BY p.id, u.id;

-- Tracks per-user AI review usage for daily quota enforcement and cost analytics.
CREATE TABLE IF NOT EXISTS ai_review_logs (
  id         SERIAL PRIMARY KEY,
  user_id    INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  image_url  TEXT,
  is_feed_eligible BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Backfill column on existing databases (no-op if already present).
ALTER TABLE ai_review_logs ADD COLUMN IF NOT EXISTS image_url TEXT;
ALTER TABLE ai_review_logs ADD COLUMN IF NOT EXISTS is_feed_eligible BOOLEAN DEFAULT false;

CREATE INDEX IF NOT EXISTS idx_ai_review_logs_user_created
  ON ai_review_logs(user_id, created_at DESC);


-- View: User stats
CREATE OR REPLACE VIEW user_stats AS
SELECT 
  u.id,
  u.name,
  u.role,
  u.profile_photo,
  COUNT(DISTINCT p.id) as post_count,
  COUNT(DISTINCT f1.id) as follower_count,
  COUNT(DISTINCT f2.id) as following_count
FROM users u
LEFT JOIN posts p ON u.id = p.user_id
LEFT JOIN follows f1 ON u.id = f1.following_id
LEFT JOIN follows f2 ON u.id = f2.follower_id
GROUP BY u.id;