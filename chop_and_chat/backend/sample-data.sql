-- SAMPLE DATA FOR LOCAL DEVELOPMENT
-- Run this AFTER init.sql to populate test data

-- Test user
INSERT INTO users (email, password, name, role) 
VALUES ('user@test.com', '$2b$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'Test User', 'user')
ON CONFLICT (email) DO NOTHING;

-- Test chef
INSERT INTO users (email, password, name, role) 
VALUES ('chef@test.com', '$2b$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'Gordon Test', 'chef')
ON CONFLICT (email) DO NOTHING;

-- Sample post
INSERT INTO posts (user_id, title, description, ingredients, instructions, utensils, cook_time, difficulty)
SELECT 
  u.id,
  'Classic Margherita Pizza',
  'Authentic Italian pizza with fresh basil',
  '["500g pizza flour", "325ml water", "10g salt", "7g yeast", "mozzarella", "tomato sauce", "fresh basil"]'::jsonb,
  'Mix flour, water, salt, and yeast. Knead for 10 minutes. Let rise 2 hours. Shape dough, add sauce and cheese. Bake at 250°C for 12 minutes.',
  '["oven", "mixing bowl", "pizza stone"]'::jsonb,
  '3 hours (includes rising)',
  'Medium'
FROM users u WHERE u.email = 'user@test.com'
ON CONFLICT DO NOTHING;